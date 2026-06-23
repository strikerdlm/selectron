import { describe, it, expect } from "vitest";
import {
  applyProportionalHazardMultiplier,
  samplePoisson,
  sampleLognormalPoisson,
  sampleGammaPoisson,
  sampleBetaBernoulli,
} from "../../src/imm/incidence";
import { makeRng } from "../../src/engine/prng";

describe("samplePoisson", () => {
  it("mean ≈ lambda within 2% over 50k draws (small lambda)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 2.5;
    const n = 50_000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += samplePoisson(rng, lambda);
    expect(sum / n).toBeCloseTo(lambda, 1);
  });

  it("mean ≈ lambda within 2% (large lambda — PTRS regime)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 50;
    const n = 20_000;
    let sum = 0, sumSq = 0;
    for (let i = 0; i < n; i++) { const x = samplePoisson(rng, lambda); sum += x; sumSq += x * x; }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    expect(mean).toBeCloseTo(lambda, 0);
    expect(variance / lambda).toBeCloseTo(1, 0);  // variance ≈ lambda for Poisson
  });

  it("returns 0 for lambda = 0", () => {
    const rng = makeRng(0);
    expect(samplePoisson(rng, 0)).toBe(0);
  });
});

describe("sampleLognormalPoisson", () => {
  it("samples non-negative integers; mean approximates Poisson with sampled lambda", () => {
    const rng = makeRng(42);
    const samples: number[] = [];
    for (let i = 0; i < 10_000; i++) samples.push(sampleLognormalPoisson(rng, 0, 0.5));
    expect(Math.min(...samples)).toBeGreaterThanOrEqual(0);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    // E[lognormal(mu=0,sigma=0.5)] = exp(0 + 0.25/2) ≈ 1.1331
    expect(mean).toBeCloseTo(Math.exp(0 + 0.5 * 0.5 * 0.5), 0);
  });
});

describe("sampleGammaPoisson", () => {
  it("Negative-binomial mean = alpha/beta", () => {
    const rng = makeRng(13);
    const samples: number[] = [];
    for (let i = 0; i < 20_000; i++) samples.push(sampleGammaPoisson(rng, 4, 2));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(mean).toBeCloseTo(2, 0);  // 4/2 = 2
  });
});

describe("sampleBetaBernoulli", () => {
  it("Bernoulli mean = alpha/(alpha+beta)", () => {
    const rng = makeRng(99);
    let sum = 0;
    for (let i = 0; i < 50_000; i++) sum += sampleBetaBernoulli(rng, 2, 8);
    expect(sum / 50_000).toBeCloseTo(0.2, 1);
  });
});

describe("applyProportionalHazardMultiplier", () => {
  it("handles suppression, identity, and positive risk elevation monotonically", () => {
    const p = 0.2;
    expect(applyProportionalHazardMultiplier(p, 0)).toBe(0);
    expect(applyProportionalHazardMultiplier(p, 0.5)).toBeLessThan(p);
    expect(applyProportionalHazardMultiplier(p, 1)).toBe(p);
    expect(applyProportionalHazardMultiplier(p, 2)).toBeGreaterThan(p);
    expect(applyProportionalHazardMultiplier(p, 5)).toBeGreaterThan(
      applyProportionalHazardMultiplier(p, 2),
    );
  });

  it("keeps probabilities inside [0, 1] for large multipliers", () => {
    const elevated = applyProportionalHazardMultiplier(0.9, 10);
    expect(elevated).toBeGreaterThan(0.9);
    expect(elevated).toBeLessThanOrEqual(1);
  });
});

import { samplePoissonProcess } from "../../src/imm/incidence";

describe("samplePoissonProcess", () => {
  it("mean event count per unit time ≈ λ over 10k process draws", () => {
    // For a HPP at rate λ over duration T, E[N] = λ·T.
    // Estimating λ from empirical event counts avoids right-censorship bias.
    const rng = makeRng(0xabcdef);
    const lambda = 0.01;
    const duration = 1000;
    const nTrials = 10_000;
    let totalEvents = 0;
    for (let i = 0; i < nTrials; i++) {
      totalEvents += samplePoissonProcess(rng, lambda, duration).length;
    }
    const empiricalLambda = totalEvents / (nTrials * duration);
    // Accept within 5% of true lambda
    expect(empiricalLambda).toBeGreaterThan(lambda * 0.95);
    expect(empiricalLambda).toBeLessThan(lambda * 1.05);
  });

  it("returns empty array for lambda=0", () => {
    const rng = makeRng(1);
    expect(samplePoissonProcess(rng, 0, 100)).toEqual([]);
  });

  it("all event times are within [0, duration]", () => {
    const rng = makeRng(2);
    const times = samplePoissonProcess(rng, 0.1, 50);
    for (const t of times) {
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThan(50);
    }
  });
});
