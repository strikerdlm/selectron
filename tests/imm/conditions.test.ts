// tests/imm/conditions.test.ts
import { describe, it, expect } from "vitest";
import { IMM_CONDITIONS } from "../../src/imm/conditions";

describe("IMM_CONDITIONS", () => {
  it("contains the full K15 appendix catalog (95-100 conditions)", () => {
    expect(IMM_CONDITIONS.length).toBeGreaterThanOrEqual(95);
    expect(IMM_CONDITIONS.length).toBeLessThanOrEqual(102);
  });

  it("every condition has unique id, valid family, valid distribution", () => {
    const ids = new Set<string>();
    const validFamilies = new Set([
      "behavioral","cardiovascular","dental","dermatologic","ENT","endocrine",
      "GI","GU","hematologic","infectious","musculoskeletal","neurologic",
      "ophthalmologic","psychiatric","renal","respiratory","space-adaptation",
      "toxicologic","traumatic",
    ]);
    const validDists = new Set(["Gamma","Lognormal","Beta","Fixed"]);
    for (const c of IMM_CONDITIONS) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(validFamilies.has(c.family)).toBe(true);
      expect(validDists.has(c.incidenceDist)).toBe(true);
    }
  });

  it("at least 8 conditions have risk factors", () => {
    const withRiskFactors = IMM_CONDITIONS.filter(c => c.riskFactors.length > 0);
    expect(withRiskFactors.length).toBeGreaterThanOrEqual(8);
  });

  it("SA conditions use space-adaptation-once or SA-VIIP-late process", () => {
    const sa = IMM_CONDITIONS.filter(c =>
      c.label.toLowerCase().includes("space adaptation") ||
      c.label === "Visual Impairment and Intracranial Pressure (VIIP)(space adaptation)"
    );
    expect(sa.length).toBeGreaterThanOrEqual(5);
    for (const c of sa) {
      expect(["space-adaptation-once","SA-VIIP-late"]).toContain(c.processType);
    }
  });
});
