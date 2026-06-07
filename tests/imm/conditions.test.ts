// tests/imm/conditions.test.ts
import { describe, it, expect } from "vitest";
import { IMM_CONDITIONS } from "../../src/imm/conditions";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";

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

describe("terrestrial analog guard", () => {
  const SPACE_ONLY_IDS = new Set([
    // space-adaptation-once (9)
    "back-pain-space-adaptation","constipation-space-adaptation",
    "headache-space-adaptation","insomnia-space-adaptation",
    "nasal-congestion-space-adaptation","nose-bleed-space-adaptation",
    "space-motion-sickness-space-adaptation","urinary-incontinence-space-adaptation",
    "urinary-retention-space-adaptation",
    // EVA-coupled (3)
    "decompression-sickness-secondary-to-extravehicular-activity",
    "fingernail-delamination","paresthesias",
    // SPE-coupled (1)
    "acute-radiation-syndrome",
    // SA-VIIP-late (1)
    "visual-impairment-and-intracranial-pressure-viip-space-adaptation",
    // ECLSS-specific general-Poisson (3)
    "headache-co2-induced","toxic-exposure-ammonia","barotrauma-ear-sinus-block",
  ]);

  it("analog-controlled 45d: no space-specific condition appears as a driver", () => {
    const mission = IMM_MISSIONS.find(m => m.id === "analog-45d")!;
    const crew = Array.from({ length: 6 }, (_, i) => ({
      id: `m${i}`, name: `M${i}`,
      EVA_eligible: true, EVA_count: 0,
    }));
    const out = simulateIMM({
      crew, mission, kit: IMM_KITS.none,
      trials: 500, seed: 0xc0ffee,
    });
    const driverIds = new Set(out.perConditionDrivers.map(d => d.conditionId));
    for (const id of SPACE_ONLY_IDS) {
      expect(driverIds.has(id), `space-only condition "${id}" must not appear in analog drivers`).toBe(false);
    }
  });

  it("antarctic-station 365d: no space-specific condition appears as a driver", () => {
    const mission = IMM_MISSIONS.find(m => m.id === "antarctic-winter")!;
    const crew = Array.from({ length: 12 }, (_, i) => ({
      id: `m${i}`, name: `M${i}`,
      EVA_eligible: true, EVA_count: 0,
    }));
    const out = simulateIMM({
      crew, mission, kit: IMM_KITS.none,
      trials: 500, seed: 0xc0ffee,
    });
    const driverIds = new Set(out.perConditionDrivers.map(d => d.conditionId));
    for (const id of SPACE_ONLY_IDS) {
      expect(driverIds.has(id), `space-only condition "${id}" must not appear in antarctic drivers`).toBe(false);
    }
  });

  it("leo-iss 180d: ARS still active (hard filter must not fire for space missions)", () => {
    const mission = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
    const crew = Array.from({ length: 6 }, (_, i) => ({
      id: `m${i}`, name: `M${i}`,
      EVA_eligible: true, EVA_count: mission.totalEVAs / mission.crewSize,
    }));
    const out = simulateIMM({
      crew, mission, kit: IMM_KITS.issHMS,
      trials: 2000, seed: 0xc0ffee,
    });
    // ARS should still be modelled for ISS missions — at least one driver recorded.
    // (ARS occurrences are rare but non-zero over 2000 trials × 180 days.)
    const driverIds = new Set(out.perConditionDrivers.map(d => d.conditionId));
    expect(driverIds.has("acute-radiation-syndrome"),
      "ARS must remain active for leo-iss missions"
    ).toBe(true);
  });
});
