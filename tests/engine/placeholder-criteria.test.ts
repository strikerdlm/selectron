import { describe, it, expect } from "vitest";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

describe("PLACEHOLDER_CRITERIA", () => {
  it("has exactly 5 entries", () => {
    expect(PLACEHOLDER_CRITERIA.length).toBe(5);
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
