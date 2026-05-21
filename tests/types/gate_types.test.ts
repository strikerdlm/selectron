// tests/types/gate_types.test.ts
import { describe, it, expect } from "vitest";
import type { GateResult, Criterion } from "../../src/types";

describe("Gate types", () => {
  it("GateResult shape", () => {
    const r: GateResult = { verdict: "qualified", failedGates: [], evaluated: ["psych.psychopathology_clearance"] };
    expect(r.verdict).toBe("qualified");
  });
  it("Criterion.gateThreshold optional field", () => {
    const c: Criterion = {
      id: "psych.psychopathology_clearance",
      family: "psychological",
      label: "MMPI-2-RF psychopathology select-out",
      description: "...",
      instrument: "MMPI-2-RF Police Officer Selection Report",
      scale: { min: 0, max: 1 },
      higherIsBetter: true,
      citations: ["10.1037/pas0000013"],
      minimumTier: "elite",
      gateThreshold: { operator: "fail-if-below", value: 0.5 },
    };
    expect(c.gateThreshold).toBeDefined();
  });
});
