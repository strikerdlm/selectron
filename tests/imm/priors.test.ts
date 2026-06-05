import { describe, it, expect } from "vitest";
import { loadIMMPriors, validatePriorsJson } from "../../src/imm/priors";

describe("IMM priors", () => {
  it("loads imm-priors.json", () => {
    const priors = loadIMMPriors();
    expect(priors.schema_version).toBe(1);
    expect(Object.keys(priors.conditions).length).toBeGreaterThanOrEqual(8);
  });

  it("every prior carries a provenance tag and source_ref", () => {
    const priors = loadIMMPriors();
    for (const [_id, p] of Object.entries(priors.conditions)) {
      expect(["tierA-nasa","tierB-lit","tierB-pymc","tierC-synth","user-custom"]).toContain(p.provenance);
      expect(typeof p.source_ref).toBe("string");
      expect(p.source_ref.length).toBeGreaterThan(0);
    }
  });

  it("Beta-Pert outcome ranges respect min <= mode <= max", () => {
    const priors = loadIMMPriors();
    for (const p of Object.values(priors.conditions)) {
      for (const phase of [p.treated.fi_cp1, p.treated.dt_cp1_hours, p.untreated.fi_cp1, p.untreated.dt_cp1_hours]) {
        expect(phase.min).toBeLessThanOrEqual(phase.mode);
        expect(phase.mode).toBeLessThanOrEqual(phase.max);
      }
    }
  });

  it("validatePriorsJson catches malformed input", () => {
    expect(() => validatePriorsJson({})).toThrow();
    expect(() => validatePriorsJson({ schema_version: 0 })).toThrow();
  });
});
