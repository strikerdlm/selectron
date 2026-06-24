import { describe, it, expect } from "vitest";
import { ACTIVE_CRITERION_CATALOG, DEMO_CRITERIA } from "@/data/demo-criteria";
import { ACCESS_TIERS } from "@/types";

describe("DEMO_CRITERIA", () => {
  it("has 11 demo entries and is explicitly non-ratified", () => {
    expect(DEMO_CRITERIA.length).toBe(11);
    expect(ACTIVE_CRITERION_CATALOG.status).toBe("demo");
    expect(ACTIVE_CRITERION_CATALOG.intendedUse).toContain("not a ratified eligibility or selection instrument");
  });

  // F10 resolved: standalone PVT-B removed; vigilance only via NASA Cognition composite.
  it("documents single-path vigilance scoring (no PVT double-weighting)", () => {
    expect(ACTIVE_CRITERION_CATALOG.knownLimitations).toBeDefined();
    expect(DEMO_CRITERIA.some((c) => c.id === "cognitive.pvt_b_rt_ms")).toBe(false);
    const joined = ACTIVE_CRITERION_CATALOG.knownLimitations!.join(" ");
    expect(joined).toMatch(/NASA Cognition/i);
    expect(joined).not.toContain("double-weighted");
  });

  it("documents that equal per-criterion weights are not domain-balanced", () => {
    const joined = ACTIVE_CRITERION_CATALOG.knownLimitations!.join(" ");
    expect(joined).toContain("Equal per-criterion Dirichlet weighting");
    expect(joined).toContain("hierarchical domain-to-construct weighting");
    expect(joined).toContain("catalog-dependent");
  });

  it("each has unique id, sane scale, and at least one citation", () => {
    const ids = new Set<string>();
    for (const c of DEMO_CRITERIA) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.scale.min).toBeLessThan(c.scale.max);
      expect(c.citations.length).toBeGreaterThan(0);
    }
  });

  it("every criterion populates tierInstruments for all 3 access tiers (scope-expansion-3)", () => {
    for (const c of DEMO_CRITERIA) {
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
