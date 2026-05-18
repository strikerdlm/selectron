import { describe, it, expect } from "vitest";
import { sampleDirichlet, dirichletMean, dirichletVariance } from "@/engine/dirichlet";
import { makeRng } from "@/engine/prng";

describe("sampleDirichlet", () => {
  it("returns a simplex (non-negative, sums to 1 within 1e-9)", () => {
    const rng = makeRng(1);
    const alpha = [1, 2, 3, 4];
    for (let i = 0; i < 100; i++) {
      const w = sampleDirichlet(alpha, rng);
      expect(w.length).toBe(4);
      for (const wk of w) expect(wk).toBeGreaterThanOrEqual(0);
      expect(Math.abs(w.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
    }
  });

  it("empirical mean and variance match closed-form (within 3%)", () => {
    const rng = makeRng(2);
    const alpha = [2, 3, 5];
    const N = 50_000;
    const samples: number[][] = Array.from({ length: N }, () => Array.from(sampleDirichlet(alpha, rng)));

    const mean = alpha.map((_, k) => samples.reduce((s, w) => s + w[k], 0) / N);
    const variance = alpha.map((_, k) => samples.reduce((s, w) => s + (w[k] - mean[k]) ** 2, 0) / N);

    const expectedMean = dirichletMean(alpha);
    const expectedVariance = dirichletVariance(alpha);

    for (let k = 0; k < alpha.length; k++) {
      expect(mean[k]).toBeCloseTo(expectedMean[k], 2);
      expect(variance[k]).toBeCloseTo(expectedVariance[k], 2);
    }
  });
});
