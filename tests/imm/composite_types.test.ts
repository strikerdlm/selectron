// tests/imm/composite_types.test.ts
// Compile-time shape checks for IMM Composite-Crew extension types.
import { describe, it, expect } from "vitest";
import type {
  IMMCrewMember,
  IMMOutcome,
  PosteriorSummary,
  ScenarioSummary,
  CrewCompositeMethod,
  CrewComposite,
  CrewGateResult,
} from "../../src/imm/types";
import type { GateResult } from "../../src/types/gate";

// ── Compile-time checks (tsc erases these at emit) ─────────────────────────
declare const _crewMember: IMMCrewMember;
declare const _outcome: IMMOutcome;
declare const _method: CrewCompositeMethod;
declare const _composite: CrewComposite;
declare const _crewGate: CrewGateResult;
export type {
  _crewMember as _member,
  _outcome as _out,
  _method as _meth,
  _composite as _comp,
  _crewGate as _cg,
};

// ── Runtime shape tests ────────────────────────────────────────────────────
describe("IMM composite-crew types", () => {
  it("IMMCrewMember accepts optional stageAScores", () => {
    const withScores: IMMCrewMember = {
      id: "c1", sex: "female", contacts: false, crowns: false,
      CAC_positive: false, abdominal_surgery_history: false,
      EVA_eligible: true, EVA_count: 4,
      stageAScores: { "psych.mmpi2rf_eid": 55, "cognitive.nasa_cognition_battery": 0.5 },
    };
    expect(withScores.stageAScores?.["psych.mmpi2rf_eid"]).toBe(55);
  });

  it("IMMCrewMember without stageAScores is still valid", () => {
    const noScores: IMMCrewMember = {
      id: "c2", sex: "male", contacts: true, crowns: false,
      CAC_positive: false, abdominal_surgery_history: false,
      EVA_eligible: false, EVA_count: 0,
    };
    expect(noScores.stageAScores).toBeUndefined();
  });

  it("IMMOutcome includes missionSuccess ScenarioSummary", () => {
    const ps: ScenarioSummary = { mean: 72, ci90: [60, 85], ci95: [55, 90], sd: 8 };
    const compat: PosteriorSummary = ps;
    const outcome: IMMOutcome = {
      tme: compat, chi: ps, pEvac: ps, pLocl: ps,
      missionSuccess: { mean: 45, ci90: [30, 60], ci95: [25, 65], sd: 12 },
      perConditionDrivers: [],
      convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
    };
    expect(outcome.missionSuccess.mean).toBe(45);
  });

  it("CrewCompositeMethod union covers all three strategies", () => {
    const methods: CrewCompositeMethod[] = ["mean", "worst-link", "geometric-mean"];
    expect(methods).toHaveLength(3);
  });

  it("CrewComposite shape", () => {
    const cc: CrewComposite = {
      compositeScore: 0.78,
      perMemberScores: [0.78, 0.85, 0.71],
      weakestMemberId: "c3",
      method: "mean",
    };
    expect(cc.compositeScore).toBeGreaterThan(0);
    expect(cc.compositeScore).toBeLessThanOrEqual(1);
    expect(cc.weakestMemberId).toBe("c3");
  });

  it("CrewComposite allows null weakestMemberId for empty crew", () => {
    const cc: CrewComposite = {
      compositeScore: 0,
      perMemberScores: [],
      weakestMemberId: null,
      method: "worst-link",
    };
    expect(cc.weakestMemberId).toBeNull();
    expect(cc.perMemberScores).toHaveLength(0);
  });

  it("CrewGateResult shape — all clear", () => {
    const gateOk: GateResult = {
      verdict: "clear", failedGates: [], evaluated: ["psych.mmpi2rf_eid"],
    };
    const cgr: CrewGateResult = {
      crewVerdict: "clear",
      perMemberResults: { "c1": gateOk, "c2": gateOk },
      flaggedMemberIds: [],
    };
    expect(cgr.crewVerdict).toBe("clear");
    expect(cgr.flaggedMemberIds).toHaveLength(0);
  });

  it("CrewGateResult shape — one member review-flagged", () => {
    const gateFail: GateResult = {
      verdict: "review-flagged",
      failedGates: ["psych.mmpi2rf_eid"],
      evaluated: ["psych.mmpi2rf_eid"],
    };
    const gateOk: GateResult = {
      verdict: "clear", failedGates: [], evaluated: ["psych.mmpi2rf_eid"],
    };
    const cgr: CrewGateResult = {
      crewVerdict: "review-flagged",
      perMemberResults: { "c1": gateFail, "c2": gateOk },
      flaggedMemberIds: ["c1"],
    };
    expect(cgr.crewVerdict).toBe("review-flagged");
    expect(cgr.flaggedMemberIds).toEqual(["c1"]);
  });
});
