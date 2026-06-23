import { describe, it, expect } from "vitest";
import { scaleRelativeScore, zScoreAgainstScale } from "../../src/engine/normalize-cohort";

// F10: this is a scale-relative score, NOT a population z-score. No normative
// mean/SD is supplied; the operational scale endpoints are treated as ±2 SD.
describe("scaleRelativeScore", () => {
  it("midpoint → 0", () => {
    expect(scaleRelativeScore(50, { min: 0, max: 100 })).toBe(0);
  });
  it("max → +2 (operational range = ±2 SD)", () => {
    expect(scaleRelativeScore(100, { min: 0, max: 100 })).toBe(2);
  });
  it("min → -2", () => {
    expect(scaleRelativeScore(0, { min: 0, max: 100 })).toBe(-2);
  });
  it("works for non-zero-anchored scales", () => {
    expect(scaleRelativeScore(60, { min: 20, max: 70 })).toBeCloseTo(1.2, 5);
  });
  it("degenerate range → 0", () => {
    expect(scaleRelativeScore(5, { min: 5, max: 5 })).toBe(0);
  });
});

// Backward-compat alias used by archived src/risk paths.
describe("zScoreAgainstScale (backward-compat alias for scaleRelativeScore)", () => {
  it("aliases scaleRelativeScore", () => {
    expect(zScoreAgainstScale(0, { min: 0, max: 100 })).toBe(scaleRelativeScore(0, { min: 0, max: 100 }));
    expect(zScoreAgainstScale(100, { min: 0, max: 100 })).toBe(2);
  });
});