// tests/imm/crew-gates.test.ts
import { describe, it, expect } from "vitest";
import { evaluateCrewGates } from "../../src/imm/crew-gates";
import type { IMMCrewMember } from "../../src/imm/types";
import type { Criterion } from "../../src/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Minimal criterion with a gate threshold — mirrors psych.mmpi2rf_eid semantics. */
const PSYCH_GATE: Criterion = {
  id: "psych.eid",
  family: "psychological",
  label: "EID T-score",
  description: "MMPI-2-RF Emotional Internalising Dysfunction T-score",
  instrument: "MMPI-2-RF",
  scale: { min: 30, max: 120 },
  higherIsBetter: false,
  gateThreshold: { operator: "fail-if-above", value: 65 },
  citations: [],
  minimumTier: "minimum",
};

/** Second criterion with a gate — mirrors cognitive.nasa_cognition_battery semantics. */
const COG_GATE: Criterion = {
  id: "cog.composite",
  family: "psychological",
  label: "Cognitive composite z-score",
  description: "Cognitive battery composite z-score",
  instrument: "CNS-VS",
  scale: { min: -3, max: 3 },
  higherIsBetter: true,
  gateThreshold: { operator: "fail-if-below", value: -2.0 },
  citations: [],
  minimumTier: "minimum",
};

/** Criterion with NO gate — should be evaluated but cannot cause failure. */
const NO_GATE: Criterion = {
  id: "behav.teamwork",
  family: "psychological",
  label: "Teamwork",
  description: "Teamwork score",
  instrument: "test",
  scale: { min: 0, max: 100 },
  higherIsBetter: true,
  citations: [],
  minimumTier: "minimum",
};

const CRITERIA: readonly Criterion[] = [PSYCH_GATE, COG_GATE, NO_GATE];

function makeMember(id: string, scores: Record<string, number> = {}): IMMCrewMember {
  return {
    id,
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: true,
    EVA_count: 0,
    stageAScores: scores,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("evaluateCrewGates", () => {
  it("all members clear → crewVerdict clear, empty flaggedMemberIds", () => {
    const crew = [
      makeMember("c1", { "psych.eid": 55, "cog.composite": 0.5, "behav.teamwork": 80 }),
      makeMember("c2", { "psych.eid": 60, "cog.composite": -1.0, "behav.teamwork": 70 }),
    ];
    const result = evaluateCrewGates(crew, CRITERIA);
    expect(result.crewVerdict).toBe("clear");
    expect(result.flaggedMemberIds).toHaveLength(0);
    expect(result.perMemberResults["c1"].verdict).toBe("clear");
    expect(result.perMemberResults["c2"].verdict).toBe("clear");
  });

  it("one member fails psych gate → crewVerdict review-flagged", () => {
    const crew = [
      makeMember("c1", { "psych.eid": 55, "cog.composite": 0.5 }), // passes
      makeMember("c2", { "psych.eid": 70, "cog.composite": 0.0 }), // fails: 70 > 65
    ];
    const result = evaluateCrewGates(crew, CRITERIA);
    expect(result.crewVerdict).toBe("review-flagged");
    expect(result.flaggedMemberIds).toEqual(["c2"]);
    expect(result.perMemberResults["c2"].verdict).toBe("review-flagged");
    expect(result.perMemberResults["c2"].failedGates).toContain("psych.eid");
  });

  it("member without stageAScores fails all gated criteria (missing = fail)", () => {
    const noScores: IMMCrewMember = {
      id: "c-bare",
      sex: "female",
      contacts: false, crowns: false,
      CAC_positive: false, abdominal_surgery_history: false,
      EVA_eligible: false, EVA_count: 0,
      // stageAScores intentionally absent
    };
    const result = evaluateCrewGates([noScores], CRITERIA);
    expect(result.crewVerdict).toBe("review-flagged");
    expect(result.flaggedMemberIds).toContain("c-bare");
    // Both gated criteria should be in failedGates
    expect(result.perMemberResults["c-bare"].failedGates).toContain("psych.eid");
    expect(result.perMemberResults["c-bare"].failedGates).toContain("cog.composite");
  });

  it("multiple members review-flagged → all listed in flaggedMemberIds", () => {
    const crew = [
      makeMember("c1", { "psych.eid": 70, "cog.composite": 0.0 }), // fails psych
      makeMember("c2", { "psych.eid": 55, "cog.composite": -2.5 }), // fails cog
      makeMember("c3", { "psych.eid": 55, "cog.composite": 0.0 }), // passes both
    ];
    const result = evaluateCrewGates(crew, CRITERIA);
    expect(result.crewVerdict).toBe("review-flagged");
    expect(result.flaggedMemberIds).toHaveLength(2);
    expect(result.flaggedMemberIds).toContain("c1");
    expect(result.flaggedMemberIds).toContain("c2");
    expect(result.perMemberResults["c3"].verdict).toBe("clear");
  });
});
