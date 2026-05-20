import { describe, it, expect } from "vitest";
import { sampleBetaPert, concurrentFI } from "../../src/imm/outcomes";
import { makeRng } from "../../src/engine/prng";

describe("sampleBetaPert", () => {
  it("mean ≈ (min + 4*mode + max) / 6 over 50k draws", () => {
    const rng = makeRng(0xabcdef);
    const min = 1, mode = 4, max = 10;
    const expected = (min + 4 * mode + max) / 6; // (1 + 16 + 10) / 6 ≈ 4.5
    const n = 50_000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += sampleBetaPert(rng, min, mode, max);
    expect(sum / n).toBeCloseTo(expected, 1);
  });

  it("samples always in [min, max]", () => {
    const rng = makeRng(0x9999);
    const min = 2, mode = 5, max = 9;
    const n = 20_000;
    for (let i = 0; i < n; i++) {
      const s = sampleBetaPert(rng, min, mode, max);
      expect(s).toBeGreaterThanOrEqual(min);
      expect(s).toBeLessThanOrEqual(max);
    }
  });

  it("degenerate (min == mode == max) returns the constant", () => {
    const rng = makeRng(0x42);
    for (let i = 0; i < 100; i++) {
      expect(sampleBetaPert(rng, 5, 5, 5)).toBe(5);
    }
  });

  it("throws E_BAD_PRIOR when mode < min", () => {
    const rng = makeRng(0x1);
    expect(() => sampleBetaPert(rng, 3, 1, 10)).toThrow("E_BAD_PRIOR");
  });

  it("throws E_BAD_PRIOR when mode > max", () => {
    const rng = makeRng(0x1);
    expect(() => sampleBetaPert(rng, 3, 11, 10)).toThrow("E_BAD_PRIOR");
  });
});

describe("concurrentFI", () => {
  it("single impairment: f_total = f_1", () => {
    expect(concurrentFI([0.3])).toBeCloseTo(0.3, 10);
  });

  it("two impairments: 1 − (1-f1)(1-f2) = 0.58", () => {
    // 1 − 0.7 × 0.4 = 1 − 0.28 = 0.72... wait: f1=0.3, f2=0.4
    // 1 − (1-0.3)(1-0.4) = 1 − 0.7*0.6 = 1 − 0.42 = 0.58
    expect(concurrentFI([0.3, 0.4])).toBeCloseTo(0.58, 10);
  });

  it("three impairments compose multiplicatively", () => {
    const f1 = 0.3, f2 = 0.4, f3 = 0.2;
    const expected = 1 - (1 - f1) * (1 - f2) * (1 - f3);
    expect(concurrentFI([f1, f2, f3])).toBeCloseTo(expected, 10);
  });

  it("empty list returns 0", () => {
    expect(concurrentFI([])).toBe(0);
  });

  it("all-1.0 saturates at 1.0", () => {
    expect(concurrentFI([1.0, 1.0, 1.0])).toBeCloseTo(1.0, 10);
  });
});
