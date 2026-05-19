import { describe, it, expect } from "vitest";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { ACCESS_TIERS } from "@/types";

describe("PLACEHOLDER_CRITERIA", () => {
  it("has 12 entries (5 Iter-1 placeholders + 7 Diego 2026-05-19 scope expansion: NASA Cog Battery, PVT-B, SOT-5, CD-RISC-25, MSCEIT, MMPI-2-RF EID, BDI-II)", () => {
    expect(PLACEHOLDER_CRITERIA.length).toBe(12);
  });

  it("each has unique id, sane scale, and at least one citation", () => {
    const ids = new Set<string>();
    for (const c of PLACEHOLDER_CRITERIA) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.scale.min).toBeLessThan(c.scale.max);
      expect(c.citations.length).toBeGreaterThan(0);
    }
  });

  it("every criterion populates tierInstruments for all 3 access tiers (scope-expansion-3)", () => {
    for (const c of PLACEHOLDER_CRITERIA) {
      expect(c.tierInstruments).toBeDefined();
      for (const t of ACCESS_TIERS) {
        const inst = c.tierInstruments![t];
        expect(inst).toBeDefined();
        expect(typeof inst.instrument).toBe("string");
        expect(inst.instrument.length).toBeGreaterThan(0);
        expect(Array.isArray(inst.citations)).toBe(true);
      }
    }
  });
});
