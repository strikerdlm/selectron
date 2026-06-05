import { describe, it, expect } from "vitest";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

const VALID_FAMILIES = new Set([
  "psychiatric",
  "physiologic",
  "musculoskeletal",
  "performance",
  "team",
]);

const VALID_KINDS = new Set(["rate", "event"]);

describe("ANALOG_CONDITIONS", () => {
  it("ships exactly 30 conditions for Iter-3 v2 (spec §5)", () => {
    expect(ANALOG_CONDITIONS).toHaveLength(30);
  });

  it("has unique ids", () => {
    const ids = ANALOG_CONDITIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every condition has a valid family and kind", () => {
    for (const c of ANALOG_CONDITIONS) {
      expect(VALID_FAMILIES.has(c.family)).toBe(true);
      expect(VALID_KINDS.has(c.kind)).toBe(true);
    }
  });

  it("every condition carries at least one citation", () => {
    for (const c of ANALOG_CONDITIONS) {
      expect(c.citations.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("every vulnerabilityCriteria id (where present) maps to a known Iter-1 placeholder", () => {
    const knownIds = new Set(PLACEHOLDER_CRITERIA.map((c) => c.id));
    for (const c of ANALOG_CONDITIONS) {
      for (const vc of c.vulnerabilityCriteria) {
        expect(knownIds.has(vc)).toBe(true);
      }
    }
  });

  it("each condition kind has at least one representative ('rate' AND 'event' both present)", () => {
    const kinds = new Set(ANALOG_CONDITIONS.map((c) => c.kind));
    expect(kinds.has("rate")).toBe(true);
    expect(kinds.has("event")).toBe(true);
  });
});
