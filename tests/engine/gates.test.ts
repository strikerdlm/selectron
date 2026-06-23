// tests/engine/gates.test.ts
import { describe, it, expect } from "vitest";
import { evaluateGates } from "../../src/engine/gates";
import type { Criterion } from "../../src/types";

const mmpi: Criterion = {
  id: "psych.psychopathology_clearance",
  family: "psychological", label: "MMPI",
  description: "", instrument: "",
  scale: { min: 0, max: 1 }, higherIsBetter: true,
  citations: [], minimumTier: "elite",
  gateThreshold: { operator: "fail-if-below", value: 0.5 },
};
const gma: Criterion = {
  id: "cognitive.gma_threshold",
  family: "cognitive", label: "GMA",
  description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true,
  citations: [], minimumTier: "elite",
  gateThreshold: { operator: "fail-if-below", value: 40 },
};
const noGate: Criterion = {
  id: "psych.bigfive.conscientiousness",
  family: "psychological", label: "Conscientiousness",
  description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true,
  citations: [], minimumTier: "minimum",
};

describe("evaluateGates", () => {
  it("qualified when all gates pass", () => {
    const r = evaluateGates({ id: "c1", alias: "c1", scores: { "psych.psychopathology_clearance": 1, "cognitive.gma_threshold": 70 } }, [mmpi, gma, noGate]);
    expect(r.verdict).toBe("qualified");
    expect(r.failedGates).toEqual([]);
    expect(r.evaluated).toEqual(["psych.psychopathology_clearance", "cognitive.gma_threshold"]);
  });
  it("disqualified on MMPI fail", () => {
    const r = evaluateGates({ id: "c2", alias: "c2", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 70 } }, [mmpi, gma]);
    expect(r.verdict).toBe("disqualified");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
  });
  it("disqualified collects ALL failed gates, not just first", () => {
    const r = evaluateGates({ id: "c3", alias: "c3", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 30 } }, [mmpi, gma]);
    expect(r.failedGates.length).toBe(2);
  });
  it("missing score for a gated criterion → disqualified with notes", () => {
    const r = evaluateGates({ id: "c4", alias: "c4", scores: {} }, [mmpi]);
    expect(r.verdict).toBe("disqualified");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
    expect(r.notes).toMatch(/missing/i);
  });
  it("skip criteria without gateThreshold", () => {
    const r = evaluateGates({ id: "c5", alias: "c5", scores: { "psych.bigfive.conscientiousness": 50 } }, [noGate]);
    expect(r.evaluated).toEqual([]);
    expect(r.verdict).toBe("qualified");
  });
});

// Tier/contract regression guards.
//
// Analog-audit correction (see src/ui/wizard/StepCriteria.tsx): tiers change
// instrument fidelity, not construct inclusion. `isCriterionAvailableAtTier`
// is intentionally a no-op (returns true for every criterion at every tier)
// so the construct set — and therefore the Dirichlet mean weight 1/K — stays
// stable when the access tier changes. Tiers do NOT exclude criteria or
// gates. The tests below lock that contract: a mid-range candidate still
// faces the elite MMPI-2-RF EID gate at every tier, and missing-score gating
// is exercised via direct minimumTier comparison rather than the no-op helper.
describe("tier/construct-set stability (analog audit)", () => {
  it("isCriterionAvailableAtTier is a no-op: every criterion is available at every tier", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");
    const { isCriterionAvailableAtTier } = await import("../../src/types/scenario");
    for (const c of PLACEHOLDER_CRITERIA) {
      expect(isCriterionAvailableAtTier(c.minimumTier, "minimum")).toBe(true);
      expect(isCriterionAvailableAtTier(c.minimumTier, "elite")).toBe(true);
    }
  });

  it("a mid-range candidate is still gated by the elite MMPI-2-RF EID gate at every tier", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");
    const { isCriterionAvailableAtTier } = await import("../../src/types/scenario");

    // No-op filter returns the full construct set at the minimum tier.
    const visibleAtMin = PLACEHOLDER_CRITERIA.filter(
      (c) => isCriterionAvailableAtTier(c.minimumTier, "minimum"),
    );
    expect(visibleAtMin.length).toBe(PLACEHOLDER_CRITERIA.length);

    const scores: Record<string, number> = {};
    for (const c of visibleAtMin) scores[c.id] = (c.scale.min + c.scale.max) / 2;

    // MMPI-2-RF EID scale is 50..100 → mid 75, above the fail-if-above:65 gate.
    const result = evaluateGates({ id: "mid-tier", alias: "mid-tier", scores }, visibleAtMin);
    expect(result.verdict).toBe("disqualified");
    expect(result.failedGates).toContain("psych.mmpi2rf_eid");
    // nasa_cognition mid (0) is above its fail-if-below:-2.0 gate, so it passes.
    expect(result.failedGates).not.toContain("cognitive.nasa_cognition_battery");
  });

  it("elite-tier candidate with MMPI EID > 65 is still disqualified at elite tier", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");
    const { isCriterionAvailableAtTier } = await import("../../src/types/scenario");

    const eliteCriteria = PLACEHOLDER_CRITERIA.filter(
      (c) => isCriterionAvailableAtTier(c.minimumTier, "elite"),
    );
    const scores: Record<string, number> = {};
    for (const c of eliteCriteria) {
      scores[c.id] = (c.scale.min + c.scale.max) / 2;
    }
    // Override MMPI EID to above the gate threshold (65)
    scores["psych.mmpi2rf_eid"] = 70;

    const result = evaluateGates({ id: "elite-fail", alias: "elite-fail", scores }, eliteCriteria);
    expect(result.verdict).toBe("disqualified");
    expect(result.failedGates).toContain("psych.mmpi2rf_eid");
  });

  it("gates on medium/elite criteria fire on missing scores (direct minimumTier comparison)", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");

    // Score only the minimum-tier construct set (by direct minimumTier match,
    // NOT the no-op helper), then evaluate against the full catalog: the
    // medium (nasa_cognition) and elite (mmpi2rf_eid) gates fire on missing
    // scores.
    const minTierOnly = PLACEHOLDER_CRITERIA.filter((c) => c.minimumTier === "minimum");
    const scores: Record<string, number> = {};
    for (const c of minTierOnly) scores[c.id] = (c.scale.min + c.scale.max) / 2;

    const result = evaluateGates({ id: "min-tier", alias: "min-tier", scores }, PLACEHOLDER_CRITERIA);
    expect(result.verdict).toBe("disqualified");
    expect(result.failedGates).toContain("psych.mmpi2rf_eid");
    expect(result.failedGates).toContain("cognitive.nasa_cognition_battery");
    expect(result.notes).toMatch(/missing/i);
  });
});
