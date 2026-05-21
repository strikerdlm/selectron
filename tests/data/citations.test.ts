// tests/data/citations.test.ts
import { describe, it, expect } from "vitest";
import { CITATIONS, citationsFor } from "@/data/citations";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const allCitations = Object.entries(CITATIONS);
const criterionIds = PLACEHOLDER_CRITERIA.map((c) => c.id);

// ─────────────────────────────────────────────────────────────────────────────
// Structural invariants
// ─────────────────────────────────────────────────────────────────────────────

describe("CITATIONS structural invariants", () => {
  it("exports a non-empty record", () => {
    expect(Object.keys(CITATIONS).length).toBeGreaterThan(0);
  });

  it("every citation has a non-empty doi or is a declared no-doi method", () => {
    for (const [key, citation] of allCitations) {
      const isNoDoi = citation.doi === "no-doi-method" || citation.doi.startsWith("no-doi-");
      const hasRealDoi = typeof citation.doi === "string" && citation.doi.length > 0;
      expect(hasRealDoi || isNoDoi, `Citation ${key} has empty doi`).toBe(true);
    }
  });

  it("no citation is retracted", () => {
    for (const [key, citation] of allCitations) {
      expect(
        citation.retraction_status,
        `Citation ${key} should not be retracted`
      ).not.toBe("retracted");
    }
  });

  it("every citation has required string fields (authors, title, journal)", () => {
    for (const [key, citation] of allCitations) {
      expect(citation.authors, `${key}.authors`).toBeTruthy();
      expect(citation.title, `${key}.title`).toBeTruthy();
      expect(citation.journal, `${key}.journal`).toBeTruthy();
    }
  });

  it("every citation has a valid year (0 only for pure no-doi-method sentinel)", () => {
    for (const [key, citation] of allCitations) {
      const isPureSentinel = citation.doi === "no-doi-method";
      if (isPureSentinel) {
        // Pure method sentinel with no publication — year is 0
        expect(citation.year, `${key}.year`).toBe(0);
      } else {
        // Real publications (including grey literature with no-doi- prefix) should have a real year
        expect(citation.year, `${key}.year`).toBeGreaterThan(1950);
        expect(citation.year, `${key}.year`).toBeLessThanOrEqual(2030);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Coverage: each Selectron criterion has at least one primary citation
// ─────────────────────────────────────────────────────────────────────────────

describe("criterion citation coverage", () => {
  it("each Selectron criterion id has a primary citation key", () => {
    for (const id of criterionIds) {
      const primaryKey = `criterion:${id}:primary`;
      expect(
        CITATIONS[primaryKey],
        `Missing primary citation for criterion "${id}" — expected key "${primaryKey}"`
      ).toBeDefined();
    }
  });

  it("gate A (psych.mmpi2rf_eid ≥65) has a threshold citation", () => {
    expect(CITATIONS["gate:psych.mmpi2rf_eid:threshold-65"]).toBeDefined();
  });

  it("gate B (cognitive.nasa_cognition_battery < −2) has a threshold citation", () => {
    expect(CITATIONS["gate:cognitive.nasa_cognition_battery:threshold-minus-2"]).toBeDefined();
  });

  it("all three composite methods have citation entries", () => {
    expect(CITATIONS["method:composite:mean"]).toBeDefined();
    expect(CITATIONS["method:composite:worst-link"]).toBeDefined();
    expect(CITATIONS["method:composite:geometric-mean"]).toBeDefined();
  });

  it("both MSP formulation citations present (A22 and K15)", () => {
    expect(CITATIONS["msp:formulation:A22"]).toBeDefined();
    expect(CITATIONS["msp:formulation:K15"]).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// citationsFor helper
// ─────────────────────────────────────────────────────────────────────────────

describe("citationsFor()", () => {
  it("returns the correct Citation for a known key", () => {
    const c = citationsFor("criterion:psych.mmpi2rf_eid:primary");
    expect(c).toBeDefined();
    expect(c?.doi).toBe("10.1037/1040-3590.4.4.460");
    expect(c?.retraction_status).toBe("none");
  });

  it("returns undefined for a nonexistent key", () => {
    expect(citationsFor("nonexistent:key:does-not-exist")).toBeUndefined();
  });

  it("returns undefined for an empty string key", () => {
    expect(citationsFor("")).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verification flags
// ─────────────────────────────────────────────────────────────────────────────

describe("verification metadata quality", () => {
  it("at least half of non-no-doi citations are scite_verified", () => {
    const realCitations = allCitations.filter(
      ([, c]) => c.doi !== "no-doi-method" && !c.doi.startsWith("no-doi-")
    );
    const verifiedCount = realCitations.filter(([, c]) => c.scite_verified).length;
    const ratio = verifiedCount / realCitations.length;
    expect(ratio, `Only ${(ratio * 100).toFixed(0)}% of citations are Scite-verified; expected ≥50%`).toBeGreaterThanOrEqual(0.5);
  });

  it("smart_citation_count > 0 for all Scite-verified citations that have it", () => {
    for (const [key, citation] of allCitations) {
      if (citation.scite_verified && citation.smart_citation_count !== undefined) {
        expect(
          citation.smart_citation_count,
          `${key}.smart_citation_count should be > 0`
        ).toBeGreaterThan(0);
      }
    }
  });
});
