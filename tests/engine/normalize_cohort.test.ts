import { describe, it, expect } from "vitest";
import { permissiveScaleRelativeScore, scaleRelativeScore } from "../../src/engine/normalize-cohort";
import { SelectronError } from "../../src/engine/errors";

// F10: this is a bounded scale-relative coordinate, NOT a population z-score.
// No normative mean or standard deviation is supplied.
describe("scaleRelativeScore", () => {
  it("midpoint → 0", () => {
    expect(scaleRelativeScore(50, { min: 0, max: 100 })).toBe(0);
  });
  it("max → +2", () => {
    expect(scaleRelativeScore(100, { min: 0, max: 100 })).toBe(2);
  });
  it("min → -2", () => {
    expect(scaleRelativeScore(0, { min: 0, max: 100 })).toBe(-2);
  });
  it("works for non-zero-anchored scales", () => {
    expect(scaleRelativeScore(60, { min: 20, max: 70 })).toBeCloseTo(1.2, 5);
  });
  it("rejects non-finite values, degenerate scales, and out-of-range raw scores", () => {
    expect(() => scaleRelativeScore(NaN, { min: 0, max: 100 })).toThrow(SelectronError);
    expect(() => scaleRelativeScore(5, { min: 5, max: 5 })).toThrow(SelectronError);
    expect(() => scaleRelativeScore(5, { min: 10, max: 5 })).toThrow(SelectronError);
    expect(() => scaleRelativeScore(101, { min: 0, max: 100 })).toThrow(SelectronError);
  });
});

// Backward-compat helper used by archived src/risk paths.
describe("permissiveScaleRelativeScore (archived compatibility helper)", () => {
  it("matches scaleRelativeScore inside range but preserves archived extrapolation", () => {
    expect(permissiveScaleRelativeScore(0, { min: 0, max: 100 })).toBe(scaleRelativeScore(0, { min: 0, max: 100 }));
    expect(permissiveScaleRelativeScore(100, { min: 0, max: 100 })).toBe(2);
    expect(permissiveScaleRelativeScore(0.5, { min: 20, max: 70 })).toBeLessThan(-2);
    expect(permissiveScaleRelativeScore(5, { min: 5, max: 5 })).toBe(0);
  });
});
