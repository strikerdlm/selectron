import { describe, it, expect } from "vitest";
import { computeCHI, computeQTL, computePEarlyTermination } from "@/risk/chi";
import { SelectronError } from "@/engine/errors";

describe("computeCHI", () => {
  it("CHI=1 when no quality time lost", () => {
    expect(computeCHI(0, 100)).toBe(1);
  });

  it("CHI=0 when QTL fills the entire mission", () => {
    expect(computeCHI(100, 100)).toBe(0);
  });

  it("CHI=0.5 when QTL is half the mission", () => {
    expect(computeCHI(50, 100)).toBe(0.5);
  });

  it("throws E_BAD_PRIOR when QTL exceeds available time", () => {
    expect(() => computeCHI(101, 100)).toThrow(SelectronError);
    try {
      computeCHI(200, 100);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });

  it("throws E_BAD_MISSION when availableMissionTime <= 0", () => {
    expect(() => computeCHI(0, 0)).toThrow(SelectronError);
    expect(() => computeCHI(0, -1)).toThrow(SelectronError);
    try {
      computeCHI(0, 0);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_MISSION");
    }
  });

  it("throws E_BAD_PRIOR on negative QTL", () => {
    expect(() => computeCHI(-1, 100)).toThrow(SelectronError);
  });
});

describe("computeQTL", () => {
  it("sums lost-days across occurrences", () => {
    expect(
      computeQTL([{ lostDays: 3 }, { lostDays: 5 }, { lostDays: 0 }]),
    ).toBe(8);
  });

  it("returns 0 for an empty trial", () => {
    expect(computeQTL([])).toBe(0);
  });

  it("is non-negative", () => {
    const occs = [{ lostDays: 0.1 }, { lostDays: 7.5 }, { lostDays: 2.3 }];
    expect(computeQTL(occs)).toBeGreaterThanOrEqual(0);
  });

  it("throws E_BAD_PRIOR on negative or non-finite lostDays", () => {
    expect(() => computeQTL([{ lostDays: -1 }])).toThrow(SelectronError);
    expect(() => computeQTL([{ lostDays: Number.NaN }])).toThrow(SelectronError);
  });
});

describe("computePEarlyTermination", () => {
  it("fraction of trials with CHI ≤ χ*", () => {
    const chis = [0.9, 0.6, 0.8, 0.5, 0.95];
    // 2 of 5 trials are ≤ 0.7
    expect(computePEarlyTermination(chis, 0.7)).toBeCloseTo(2 / 5, 12);
  });

  it("returns 0 when no trial breaches χ*", () => {
    expect(computePEarlyTermination([0.9, 0.85, 0.95], 0.7)).toBe(0);
  });

  it("returns 1 when every trial breaches χ*", () => {
    expect(computePEarlyTermination([0.4, 0.5, 0.6], 0.7)).toBe(1);
  });

  it("boundary: CHI exactly at χ* counts as termination (CHI ≤ χ*)", () => {
    expect(computePEarlyTermination([0.7, 0.8], 0.7)).toBeCloseTo(0.5, 12);
  });

  it("throws on χ* outside [0,1]", () => {
    expect(() => computePEarlyTermination([0.5], -0.1)).toThrow(SelectronError);
    expect(() => computePEarlyTermination([0.5], 1.1)).toThrow(SelectronError);
  });

  it("throws on empty chis array", () => {
    expect(() => computePEarlyTermination([], 0.7)).toThrow(SelectronError);
  });

  it("throws on non-finite chi value", () => {
    expect(() => computePEarlyTermination([0.5, Number.NaN], 0.7)).toThrow(SelectronError);
  });
});
