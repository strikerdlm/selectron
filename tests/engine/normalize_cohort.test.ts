import { describe, it, expect } from "vitest";
import { zScoreAgainstScale } from "../../src/engine/normalize-cohort";

describe("zScoreAgainstScale", () => {
  it("midpoint → 0", () => {
    expect(zScoreAgainstScale(50, { min: 0, max: 100 })).toBe(0);
  });
  it("max → +2 (operational range = ±2 SD)", () => {
    expect(zScoreAgainstScale(100, { min: 0, max: 100 })).toBe(2);
  });
  it("min → -2", () => {
    expect(zScoreAgainstScale(0, { min: 0, max: 100 })).toBe(-2);
  });
  it("works for non-zero-anchored scales", () => {
    expect(zScoreAgainstScale(60, { min: 20, max: 70 })).toBeCloseTo(1.2, 5);
  });
});
