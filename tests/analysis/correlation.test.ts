// tests/analysis/correlation.test.ts
import { describe, it, expect } from "vitest";
import {
  pearson, spearman, rank, correlationMatrix,
  linregress, regularizedBetaI, correlationPValue, correlationPairs,
} from "@/analysis/correlation";

describe("pearson", () => {
  it("is 1 for a perfect positive linear relation", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
  });
  it("is -1 for a perfect negative linear relation", () => {
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
  });
  it("is 0 when a column is constant (no divide-by-zero)", () => {
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBe(0);
  });
  it("returns 0 for n < 2", () => {
    expect(pearson([5], [9])).toBe(0);
  });
});

describe("spearman", () => {
  it("is 1 for a monotonic but non-linear relation", () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 10);
  });
  it("handles ties via average ranks", () => {
    expect(rank([10, 10, 20])).toEqual([1.5, 1.5, 3]);
  });
});

describe("correlationMatrix", () => {
  it("is symmetric with a unit diagonal", () => {
    const m = correlationMatrix([[1, 2, 3], [3, 2, 1], [1, 3, 2]], "pearson");
    expect(m[0][0]).toBe(1);
    expect(m[1][1]).toBe(1);
    expect(m[0][1]).toBeCloseTo(m[1][0], 12);
    expect(m[0][1]).toBeCloseTo(-1, 10);
  });
});

describe("linregress", () => {
  it("recovers slope and intercept of a clean line y = 2x + 1", () => {
    const fit = linregress([0, 1, 2, 3], [1, 3, 5, 7]);
    expect(fit.slope).toBeCloseTo(2, 10);
    expect(fit.intercept).toBeCloseTo(1, 10);
    expect(fit.r).toBeCloseTo(1, 10);
  });
  it("returns a flat line through the mean when x has no variance", () => {
    const fit = linregress([5, 5, 5], [2, 4, 9]);
    expect(fit.slope).toBe(0);
    expect(fit.intercept).toBeCloseTo(5, 10); // mean of y
    expect(fit.r).toBe(0);
  });
});

describe("regularizedBetaI", () => {
  it("pins the endpoints", () => {
    expect(regularizedBetaI(2, 3, 0)).toBe(0);
    expect(regularizedBetaI(2, 3, 1)).toBe(1);
  });
  it("is 1/2 at the symmetric midpoint I_0.5(a, a)", () => {
    expect(regularizedBetaI(3, 3, 0.5)).toBeCloseTo(0.5, 10);
  });
  it("matches a known value I_0.5(2, 3) = 0.6875", () => {
    expect(regularizedBetaI(2, 3, 0.5)).toBeCloseTo(0.6875, 8);
  });
});

describe("correlationPValue", () => {
  it("is 1 when r = 0 and 0 at perfect correlation", () => {
    expect(correlationPValue(0, 30)).toBeCloseTo(1, 10);
    expect(correlationPValue(1, 30)).toBe(0);
    expect(correlationPValue(-1, 30)).toBe(0);
  });
  it("is symmetric in the sign of r", () => {
    expect(correlationPValue(0.5, 20)).toBeCloseTo(correlationPValue(-0.5, 20), 12);
  });
  it("hits the textbook 5% critical r ≈ 0.6319 at n = 10 (df = 8)", () => {
    expect(correlationPValue(0.6319, 10)).toBeCloseTo(0.05, 3);
  });
  it("hits the textbook 5% critical r ≈ 0.3809 at n = 27 (df = 25)", () => {
    expect(correlationPValue(0.3809, 27)).toBeCloseTo(0.05, 3);
  });
  it("returns 1 for degenerate sample sizes", () => {
    expect(correlationPValue(0.9, 2)).toBe(1);
  });
});

describe("correlationPairs", () => {
  it("returns every unordered pair, sorted by descending |r|", () => {
    // col0 ↔ col1 perfectly negative; col0 ↔ col2 weak.
    const pairs = correlationPairs([[1, 2, 3, 4], [4, 3, 2, 1], [1, 1, 2, 1]]);
    expect(pairs).toHaveLength(3);
    expect(Math.abs(pairs[0].r)).toBeGreaterThanOrEqual(Math.abs(pairs[1].r));
    expect(Math.abs(pairs[1].r)).toBeGreaterThanOrEqual(Math.abs(pairs[2].r));
    const top = pairs[0];
    expect(top.i).toBe(0); expect(top.j).toBe(1);
    expect(top.r).toBeCloseTo(-1, 10);
    expect(top.n).toBe(4);
  });
});
