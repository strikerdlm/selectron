// tests/imm/kits.test.ts
import { describe, it, expect } from "vitest";
import { IMM_KITS, computeRAF } from "../../src/imm/kits";

describe("IMM kits", () => {
  it("none kit yields RAF = 0 for any non-empty required resources", () => {
    expect(computeRAF({ "antibiotic": 5 }, IMM_KITS.none.resources)).toBe(0);
  });
  it("issHMS kit has positive antibiotic supply", () => {
    expect(IMM_KITS.issHMS.resources["antibiotic-broad-spectrum"]).toBeGreaterThan(0);
  });
  it("unlimited kit yields RAF = 1 for any finite requirement", () => {
    expect(computeRAF({ "antibiotic": 999 }, IMM_KITS.unlimited.resources)).toBe(1);
  });
  it("partial availability yields proportional RAF", () => {
    const raf = computeRAF({ "antibiotic": 10 }, { "antibiotic": 5 });
    expect(raf).toBeCloseTo(0.5, 5);
  });
});
