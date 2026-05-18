import { describe, it, expect } from "vitest";
import { sampleGamma } from "@/engine/gamma";
import { makeRng } from "@/engine/prng";

function meanVar(xs: number[]): { mean: number; variance: number } {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return { mean, variance };
}

describe("sampleGamma(shape, 1)", () => {
  it("matches mean=shape and variance=shape for shape>=1 (within 5%)", () => {
    const rng = makeRng(1);
    const shape = 5;
    const xs = Array.from({ length: 50_000 }, () => sampleGamma(shape, rng));
    const { mean, variance } = meanVar(xs);
    expect(mean).toBeCloseTo(shape, 1);
    expect(variance).toBeCloseTo(shape, 1);
  });

  it("handles shape < 1", () => {
    const rng = makeRng(2);
    const shape = 0.5;
    const xs = Array.from({ length: 50_000 }, () => sampleGamma(shape, rng));
    const { mean, variance } = meanVar(xs);
    // Gamma(0.5, 1) has mean=0.5, variance=0.5
    expect(mean).toBeCloseTo(0.5, 1);
    expect(variance).toBeCloseTo(0.5, 1);
  });

  it("returns positive values", () => {
    const rng = makeRng(3);
    for (let i = 0; i < 1000; i++) {
      expect(sampleGamma(2.5, rng)).toBeGreaterThan(0);
    }
  });
});
