import { describe, it, expect } from "vitest";
import { interpolateBetaPertByRAF } from "../../src/imm/treatment";
import type { IMMBetaPert } from "../../src/imm/types";

const treated:   IMMBetaPert = { min: 0.1, mode: 0.2, max: 0.4 };
const untreated: IMMBetaPert = { min: 0.3, mode: 0.6, max: 0.9 };

describe("interpolateBetaPertByRAF", () => {
  it("RAF = 1 returns treated params", () => {
    const result = interpolateBetaPertByRAF(treated, untreated, 1);
    expect(result.min).toBeCloseTo(treated.min, 10);
    expect(result.mode).toBeCloseTo(treated.mode, 10);
    expect(result.max).toBeCloseTo(treated.max, 10);
  });

  it("RAF = 0 returns untreated params", () => {
    const result = interpolateBetaPertByRAF(treated, untreated, 0);
    expect(result.min).toBeCloseTo(untreated.min, 10);
    expect(result.mode).toBeCloseTo(untreated.mode, 10);
    expect(result.max).toBeCloseTo(untreated.max, 10);
  });

  it("RAF = 0.5 yields midpoint", () => {
    const result = interpolateBetaPertByRAF(treated, untreated, 0.5);
    expect(result.min).toBeCloseTo((treated.min + untreated.min) / 2, 10);
    expect(result.mode).toBeCloseTo((treated.mode + untreated.mode) / 2, 10);
    expect(result.max).toBeCloseTo((treated.max + untreated.max) / 2, 10);
  });

  it("11 RAF checkpoints — mode is monotonically increasing as RAF decreases", () => {
    // treated has lower mode (0.2) than untreated (0.6)
    // as RAF decreases from 1→0, mode should increase (0.2 → 0.6)
    const modes: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const raf = i / 10; // 0.0, 0.1, ..., 1.0
      modes.push(interpolateBetaPertByRAF(treated, untreated, raf).mode);
    }
    // modes[0] is RAF=0 (untreated mode 0.6), modes[10] is RAF=1 (treated mode 0.2)
    // Should be monotonically decreasing as RAF increases (modes increases as RAF decreases)
    for (let i = 1; i <= 10; i++) {
      expect(modes[i]).toBeLessThanOrEqual(modes[i - 1]);
    }
  });

  it("RAF clamped below 0 → same as RAF=0", () => {
    const atZero = interpolateBetaPertByRAF(treated, untreated, 0);
    const atNeg  = interpolateBetaPertByRAF(treated, untreated, -0.5);
    expect(atNeg.min).toBeCloseTo(atZero.min, 10);
    expect(atNeg.mode).toBeCloseTo(atZero.mode, 10);
    expect(atNeg.max).toBeCloseTo(atZero.max, 10);
  });

  it("RAF clamped above 1 → same as RAF=1", () => {
    const atOne   = interpolateBetaPertByRAF(treated, untreated, 1);
    const atAbove = interpolateBetaPertByRAF(treated, untreated, 1.5);
    expect(atAbove.min).toBeCloseTo(atOne.min, 10);
    expect(atAbove.mode).toBeCloseTo(atOne.mode, 10);
    expect(atAbove.max).toBeCloseTo(atOne.max, 10);
  });
});
