import { describe, it, expect } from "vitest";
import {
  samplePoisson,
  sampleBinomial,
  applyVulnerabilityMultiplier,
} from "@/risk/incidence";
import { makeRng } from "@/engine/prng";
import { SelectronError } from "@/engine/errors";

const N = 50_000;

function meanVar(samples: number[]): { mean: number; variance: number } {
  let s = 0;
  for (const x of samples) s += x;
  const mean = s / samples.length;
  let v = 0;
  for (const x of samples) v += (x - mean) * (x - mean);
  return { mean, variance: v / samples.length };
}

function draw(N: number, sampler: () => number): number[] {
  const out = new Array<number>(N);
  for (let i = 0; i < N; i++) out[i] = sampler();
  return out;
}

describe("samplePoisson — Knuth regime (λ < 30)", () => {
  it("mean ≈ λ within 2% for λ=5", () => {
    const rng = makeRng(0xa11ce);
    const { mean } = meanVar(draw(N, () => samplePoisson(rng, 5)));
    expect(Math.abs(mean - 5) / 5).toBeLessThan(0.02);
  });

  it("variance ≈ λ within 5% for λ=5", () => {
    const rng = makeRng(0xa11ce);
    const { variance } = meanVar(draw(N, () => samplePoisson(rng, 5)));
    expect(Math.abs(variance - 5) / 5).toBeLessThan(0.05);
  });

  it("non-negative outputs only", () => {
    const rng = makeRng(0xa11ce);
    for (let i = 0; i < 1000; i++) {
      expect(samplePoisson(rng, 5)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("samplePoisson — PTRS regime (λ ≥ 30)", () => {
  it("mean ≈ λ within 2% for λ=50", () => {
    const rng = makeRng(0xbeef);
    const { mean } = meanVar(draw(N, () => samplePoisson(rng, 50)));
    expect(Math.abs(mean - 50) / 50).toBeLessThan(0.02);
  });

  it("variance ≈ λ within 5% for λ=50", () => {
    const rng = makeRng(0xbeef);
    const { variance } = meanVar(draw(N, () => samplePoisson(rng, 50)));
    expect(Math.abs(variance - 50) / 50).toBeLessThan(0.05);
  });
});

describe("samplePoisson — edge cases", () => {
  it("returns 0 for λ=0", () => {
    const rng = makeRng(0xdeadbeef);
    for (let i = 0; i < 100; i++) {
      expect(samplePoisson(rng, 0)).toBe(0);
    }
  });

  it("throws E_BAD_PRIOR for negative λ", () => {
    const rng = makeRng(1);
    expect(() => samplePoisson(rng, -1)).toThrow(SelectronError);
    try {
      samplePoisson(rng, -1);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });

  it("throws E_BAD_PRIOR for non-finite λ", () => {
    const rng = makeRng(1);
    expect(() => samplePoisson(rng, Number.NaN)).toThrow(SelectronError);
    expect(() => samplePoisson(rng, Number.POSITIVE_INFINITY)).toThrow(SelectronError);
  });

  it("seed determinism — same seed produces same sequence", () => {
    const r1 = makeRng(0x1234);
    const r2 = makeRng(0x1234);
    for (let i = 0; i < 100; i++) {
      expect(samplePoisson(r1, 5)).toBe(samplePoisson(r2, 5));
    }
  });
});

describe("sampleBinomial", () => {
  it("mean ≈ n·p within 2% for n=20, p=0.3", () => {
    const rng = makeRng(0xc0ffee);
    const { mean } = meanVar(draw(N, () => sampleBinomial(rng, 20, 0.3)));
    expect(Math.abs(mean - 6) / 6).toBeLessThan(0.02);
  });

  it("variance ≈ n·p·(1-p) within 5% for n=20, p=0.3", () => {
    const rng = makeRng(0xc0ffee);
    const { variance } = meanVar(draw(N, () => sampleBinomial(rng, 20, 0.3)));
    const expected = 20 * 0.3 * 0.7;
    expect(Math.abs(variance - expected) / expected).toBeLessThan(0.05);
  });

  it("p=0 always returns 0", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) {
      expect(sampleBinomial(rng, 10, 0)).toBe(0);
    }
  });

  it("p=1 always returns n", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) {
      expect(sampleBinomial(rng, 10, 1)).toBe(10);
    }
  });

  it("n=0 always returns 0", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) {
      expect(sampleBinomial(rng, 0, 0.5)).toBe(0);
    }
  });

  it("throws E_BAD_PRIOR for p outside [0,1]", () => {
    const rng = makeRng(1);
    expect(() => sampleBinomial(rng, 10, -0.1)).toThrow(SelectronError);
    expect(() => sampleBinomial(rng, 10, 1.1)).toThrow(SelectronError);
    try {
      sampleBinomial(rng, 10, 1.5);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });

  it("throws E_BAD_PRIOR for negative or non-integer n", () => {
    const rng = makeRng(1);
    expect(() => sampleBinomial(rng, -1, 0.5)).toThrow(SelectronError);
    expect(() => sampleBinomial(rng, 3.5, 0.5)).toThrow(SelectronError);
  });
});

describe("applyVulnerabilityMultiplier", () => {
  it("matches closed-form exp(β·z)", () => {
    const baseLambda = 0.01;
    const beta = { neuroticism: 0.4, agreeableness: -0.2 };
    const z = { neuroticism: 1.5, agreeableness: -1.0 };
    const got = applyVulnerabilityMultiplier(baseLambda, beta, z);
    const expected = 0.01 * Math.exp(0.4 * 1.5 + -0.2 * -1.0);
    expect(got).toBeCloseTo(expected, 12);
  });

  it("empty beta returns baseLambda unchanged", () => {
    expect(applyVulnerabilityMultiplier(0.05, {}, { x: 1, y: 2 })).toBeCloseTo(0.05, 15);
  });

  it("z key absent from beta is ignored", () => {
    const got = applyVulnerabilityMultiplier(1, { a: 0.5 }, { a: 1, b: 999 });
    expect(got).toBeCloseTo(Math.exp(0.5), 12);
  });

  it("beta key absent from z is treated as 0 (no contribution)", () => {
    const got = applyVulnerabilityMultiplier(1, { a: 0.5, b: 0.3 }, { a: 1 });
    expect(got).toBeCloseTo(Math.exp(0.5), 12);
  });

  it("throws E_BAD_PRIOR for negative baseLambda", () => {
    expect(() => applyVulnerabilityMultiplier(-0.1, {}, {})).toThrow(SelectronError);
  });
});

import { sampleStandardNormal, sampleFrailty, sampleGammaPoisson } from "@/risk/incidence";

describe("sampleStandardNormal", () => {
  it("has mean ~0 and sd ~1 over many draws", () => {
    const rng = makeRng(0xc0ffee);
    const n = 200_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const z = sampleStandardNormal(rng); sum += z; sumsq += z * z; }
    const mean = sum / n;
    const sd = Math.sqrt(sumsq / n - mean * mean);
    expect(Math.abs(mean)).toBeLessThan(0.02);
    expect(Math.abs(sd - 1)).toBeLessThan(0.02);
  });
});

describe("sampleFrailty (mean 1, var 1/phi)", () => {
  it("has mean ~1 and variance ~1/phi", () => {
    const rng = makeRng(0xc0ffee);
    const phi = 4, n = 200_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const g = sampleFrailty(rng, phi); sum += g; sumsq += g * g; }
    const mean = sum / n;
    const variance = sumsq / n - mean * mean;
    expect(Math.abs(mean - 1)).toBeLessThan(0.02);
    expect(Math.abs(variance - 1 / phi)).toBeLessThan(0.02);
  });
  it("throws on non-positive phi", () => {
    const rng = makeRng(1);
    expect(() => sampleFrailty(rng, 0)).toThrow();
  });
});

describe("sampleGammaPoisson (Negative-Binomial marginal)", () => {
  it("matches shared-frailty Poisson: mean ~lambda, var ~lambda + lambda^2/phi", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 3, phi = 2, n = 300_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const k = sampleGammaPoisson(rng, lambda, phi); sum += k; sumsq += k * k; }
    const mean = sum / n;
    const variance = sumsq / n - mean * mean;
    expect(Math.abs(mean - lambda)).toBeLessThan(0.05);
    expect(Math.abs(variance - (lambda + (lambda * lambda) / phi))).toBeLessThan(0.2);
  });
});
