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
