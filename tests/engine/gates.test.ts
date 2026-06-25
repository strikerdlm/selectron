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
  it("clear when all demo-threshold gates pass", () => {
    const r = evaluateGates({ id: "c1", alias: "c1", scores: { "psych.psychopathology_clearance": 1, "cognitive.gma_threshold": 70 } }, [mmpi, gma, noGate]);
    expect(r.verdict).toBe("clear");
    expect(r.failedGates).toEqual([]);
    expect(r.evaluated).toEqual(["psych.psychopathology_clearance", "cognitive.gma_threshold"]);
  });
  it("review-flagged on MMPI threshold fail", () => {
    const r = evaluateGates({ id: "c2", alias: "c2", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 70 } }, [mmpi, gma]);
    expect(r.verdict).toBe("review-flagged");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
  });
  it("review-flagged collects ALL failed gates, not just first", () => {
    const r = evaluateGates({ id: "c3", alias: "c3", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 30 } }, [mmpi, gma]);
    expect(r.failedGates.length).toBe(2);
  });
  it("missing score for a gated criterion → review-flagged with notes", () => {
    const r = evaluateGates({ id: "c4", alias: "c4", scores: {} }, [mmpi]);
    expect(r.verdict).toBe("review-flagged");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
    expect(r.notes).toMatch(/missing/i);
  });
  it("skip criteria without gateThreshold", () => {
    const r = evaluateGates({ id: "c5", alias: "c5", scores: { "psych.bigfive.conscientiousness": 50 } }, [noGate]);
    expect(r.evaluated).toEqual([]);
    expect(r.verdict).toBe("clear");
  });
});

// Tier/contract regression guards.
//
// Scientific-audit correction: accessibility tiers must not force
// non-comparable instruments onto canonical scales. The helper therefore
// returns true only when the selected tier has a scoreable instrument/crosswalk.
describe("tier scoreability boundaries", () => {
  it("isCriterionAvailableAtTier follows the criterion minimumTier", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");
    const { isCriterionAvailableAtTier } = await import("../../src/types/scenario");
    const mmpi = PLACEHOLDER_CRITERIA.find((c) => c.id === "psych.mmpi2rf_eid")!;
    const ei = PLACEHOLDER_CRITERIA.find((c) => c.id === "psych.emotional_intelligence")!;
    const bdi = PLACEHOLDER_CRITERIA.find((c) => c.id === "psych.bdi2_baseline")!;

    expect(isCriterionAvailableAtTier(mmpi.minimumTier, "minimum")).toBe(false);
    expect(isCriterionAvailableAtTier(mmpi.minimumTier, "elite")).toBe(true);
    expect(isCriterionAvailableAtTier(ei.minimumTier, "medium")).toBe(false);
    expect(isCriterionAvailableAtTier(ei.minimumTier, "elite")).toBe(true);
    expect(isCriterionAvailableAtTier(bdi.minimumTier, "minimum")).toBe(true);
  });

  it("minimum tier excludes elite-only MMPI and MSCEIT criteria from the MCDA set", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");
    const { isCriterionAvailableAtTier } = await import("../../src/types/scenario");

    const visibleAtMin = PLACEHOLDER_CRITERIA.filter(
      (c) => isCriterionAvailableAtTier(c.minimumTier, "minimum"),
    );
    expect(visibleAtMin.map((c) => c.id)).not.toContain("psych.mmpi2rf_eid");
    expect(visibleAtMin.map((c) => c.id)).not.toContain("psych.emotional_intelligence");
    expect(visibleAtMin.map((c) => c.id)).toContain("psych.bdi2_baseline");
  });

  it("elite-tier candidate with MMPI EID > 65 is still review-flagged at elite tier", async () => {
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
    expect(result.verdict).toBe("review-flagged");
    expect(result.failedGates).toContain("psych.mmpi2rf_eid");
  });

  it("gates on unavailable medium/elite criteria still fire if the full catalog is evaluated directly", async () => {
    const { PLACEHOLDER_CRITERIA } = await import("../../src/data/placeholder-criteria");

    // Score only the minimum-tier construct set (by direct minimumTier match,
    // NOT the no-op helper), then evaluate against the full catalog: the
    // medium (nasa_cognition) and elite (mmpi2rf_eid) gates fire on missing
    // scores.
    const minTierOnly = PLACEHOLDER_CRITERIA.filter((c) => c.minimumTier === "minimum");
    const scores: Record<string, number> = {};
    for (const c of minTierOnly) scores[c.id] = (c.scale.min + c.scale.max) / 2;

    const result = evaluateGates({ id: "min-tier", alias: "min-tier", scores }, PLACEHOLDER_CRITERIA);
    expect(result.verdict).toBe("review-flagged");
    expect(result.failedGates).toContain("psych.mmpi2rf_eid");
    expect(result.failedGates).toContain("cognitive.nasa_cognition_battery");
    expect(result.notes).toMatch(/missing/i);
  });
});
