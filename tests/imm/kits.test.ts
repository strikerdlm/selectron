// tests/imm/kits.test.ts
import { describe, it, expect } from "vitest";
import { IMM_KITS, computeRAF } from "../../src/imm/kits";

describe("IMM kits", () => {
  it("none kit yields RAF = 0 for any non-empty required resources", () => {
    expect(computeRAF({ "antibiotic-broad-spectrum": 5 }, IMM_KITS.none.resources)).toBe(0);
  });
  it("issHMS kit has positive antibiotic supply", () => {
    expect(IMM_KITS.issHMS.resources["antibiotic-broad-spectrum"]).toBeGreaterThan(0);
  });
  it("unlimited kit yields RAF = 1 for any finite requirement", () => {
    expect(computeRAF({ "antibiotic-broad-spectrum": 999 }, IMM_KITS.unlimited.resources)).toBe(1);
  });
  it("partial availability yields proportional RAF", () => {
    const raf = computeRAF({ "analgesic-mild": 10 }, { "analgesic-mild": 5 });
    expect(raf).toBeCloseTo(0.5, 5);
  });
  it("unlimited kit has concrete keys (spread-safe, not Proxy)", () => {
    const keys = Object.keys(IMM_KITS.unlimited.resources);
    expect(keys.length).toBeGreaterThan(0);
    // Spreading the unlimited kit produces a proper copy with all keys
    const copy = { ...IMM_KITS.unlimited.resources };
    expect(Object.keys(copy).length).toBe(keys.length);
    expect(copy["antibiotic-broad-spectrum"]).toBe(Number.POSITIVE_INFINITY);
  });
});
