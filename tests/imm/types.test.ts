// tests/imm/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  IMMCondition, IMMCrewMember, IMMMission, IMMKitScenario,
  IMMBetaPert, IMMPrior, IMMOutcome, PosteriorSummary, ScenarioSummary, IMMSession
} from "../../src/imm/types";

// Compile-time shape checks — ensures all exported types are structurally valid.
// The declare keyword is erased at emit; tsc verifies structural compatibility.
declare const _m: IMMMission;
declare const _k: IMMKitScenario;
declare const _p: IMMPrior;
declare const _o: IMMOutcome;
declare const _ps: PosteriorSummary;
declare const _ss: ScenarioSummary;
declare const _s: IMMSession;
export type { _m as _mission, _k as _kit, _p as _prior, _o as _outcome, _ps as _posteriorSummary, _ss as _scenarioSummary, _s as _session };

describe("IMM types", () => {
  it("IMMCondition shape", () => {
    const c: IMMCondition = {
      id: "acute-sinusitis",
      label: "Acute Sinusitis",
      family: "ENT",
      incidenceSource: "in-flight",
      incidenceDist: "Gamma",
      processType: "general-Poisson",
      riskFactors: [],
      vulnerabilityCriteria: [],
    };
    expect(c.id).toBe("acute-sinusitis");
  });

  it("IMMBetaPert shape", () => {
    const b: IMMBetaPert = { min: 0, mode: 0.05, max: 0.15 };
    expect(b.mode).toBeGreaterThanOrEqual(b.min);
    expect(b.mode).toBeLessThanOrEqual(b.max);
  });

  it("IMMCrewMember shape", () => {
    const m: IMMCrewMember = {
      id: "c1", sex: "male", contacts: false, crowns: false,
      CAC_positive: false, abdominal_surgery_history: false,
      EVA_eligible: true, EVA_count: 6,
    };
    expect(m.EVA_count).toBe(6);
  });
});
