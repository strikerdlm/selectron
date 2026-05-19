import { describe, it, expect } from "vitest";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

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
});
