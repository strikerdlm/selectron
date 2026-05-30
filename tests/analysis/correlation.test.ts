// tests/analysis/correlation.test.ts
import { describe, it, expect } from "vitest";
import { pearson, spearman, rank, correlationMatrix } from "@/analysis/correlation";

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
