import { describe, it, expect } from "vitest";
import { samplePoisson, sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli } from "../../src/imm/incidence";
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
