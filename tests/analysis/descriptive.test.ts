// tests/analysis/descriptive.test.ts
import { describe, it, expect } from "vitest";
import {
  mean, sampleStdDev, quantileSorted, fiveNumberSummary, skewness,
} from "@/analysis/descriptive";

describe("mean", () => {
  it("averages and is empty-safe", () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(mean([])).toBe(0);
  });
});

describe("sampleStdDev", () => {
  it("uses the n−1 denominator (textbook 8-value example)", () => {
    // mean 5, Σ(x−5)² = 32, /7 = 4.5714, √ = 2.13809
    expect(sampleStdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.13809, 4);
  });
  it("is 0 for n < 2", () => {
    expect(sampleStdDev([42])).toBe(0);
  });
});

describe("quantileSorted", () => {
  it("matches type-7 interpolation on [1,2,3,4]", () => {
    expect(quantileSorted([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5, 10);
    expect(quantileSorted([1, 2, 3, 4], 0.25)).toBeCloseTo(1.75, 10);
    expect(quantileSorted([1, 2, 3, 4], 0.75)).toBeCloseTo(3.25, 10);
  });
  it("returns the lone element for n=1 and clamps q", () => {
    expect(quantileSorted([7], 0.3)).toBe(7);
    expect(quantileSorted([1, 2, 3], 1)).toBe(3);
    expect(quantileSorted([1, 2, 3], 0)).toBe(1);
  });
});

describe("fiveNumberSummary", () => {
  it("sorts internally and reports the five numbers", () => {
    const s = fiveNumberSummary([4, 1, 3, 2]);
    expect(s.min).toBe(1);
    expect(s.q1).toBeCloseTo(1.75, 10);
    expect(s.median).toBeCloseTo(2.5, 10);
    expect(s.q3).toBeCloseTo(3.25, 10);
    expect(s.max).toBe(4);
  });
});

describe("skewness", () => {
  it("is ~0 for a symmetric sample", () => {
    expect(skewness([1, 2, 3, 4, 5])).toBeCloseTo(0, 10);
  });
  it("matches Excel SKEW on the textbook 8-value example (≈0.8186)", () => {
    expect(skewness([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(0.8186, 3);
  });
  it("is positive for a right-skewed sample and 0 for n<3", () => {
    expect(skewness([1, 1, 1, 5])).toBeGreaterThan(0);
    expect(skewness([1, 2])).toBe(0);
  });
});
