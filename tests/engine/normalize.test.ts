import { describe, it, expect } from "vitest";
import { normalizeScore } from "@/engine/normalize";
import { SelectronError } from "@/engine/errors";

describe("normalizeScore", () => {
  it("maps [min, max] to [0, 1] when higherIsBetter", () => {
    expect(normalizeScore(20, { min: 20, max: 70 }, true)).toBeCloseTo(0);
    expect(normalizeScore(70, { min: 20, max: 70 }, true)).toBeCloseTo(1);
    expect(normalizeScore(45, { min: 20, max: 70 }, true)).toBeCloseTo(0.5);
  });

  it("flips when lower is better", () => {
    expect(normalizeScore(20, { min: 20, max: 70 }, false)).toBeCloseTo(1);
    expect(normalizeScore(70, { min: 20, max: 70 }, false)).toBeCloseTo(0);
  });

  it("throws SelectronError on out-of-range score", () => {
    expect(() => normalizeScore(75, { min: 20, max: 70 }, true)).toThrow(SelectronError);
  });
});
