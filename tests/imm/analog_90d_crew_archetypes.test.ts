// tests/imm/analog_90d_crew_archetypes.test.ts
//
// 2026-06-05 (Diego): "different crews, but mostly unselected crews. I need to
// simulate a 90 day mission and see the differences, and adjust if necessary."
//
// Seven crew archetypes on `analog-90d` (90 d, analog-controlled, crew 6,
// medium kit), spanning the realistic spectrum of UNSELECTED crews:
//
//   screened   — passes gates, healthy on all named traits (control)
//   avg        — population-average unselected crew (passes gates; see anchor note)
//   emo        — emotionally unstable (emotional_stability 0 + EID 90T)
//   consc      — low conscientiousness only (0/100)
//   cog        — cognitively weak only (z = −2.5)
//   mixed      — realistic pool: 2 worst-combined members + 4 average members
//   worst      — all named traits at floor (the 45d/22d "unscreened" profile)
//
// ── Population-anchor note (the "adjust" in this request) ──────────────────
// MMPI-2-RF EID is a T-score: M = 50, SD = 10, instrument scale 30–120
// (reversed). The raw SCALE MIDPOINT is 75T = +2.5 SD — a clinically elevated
// score, NOT an average person. Building "average" profiles from scale
// midpoints therefore mislabels every ordinary crew as gate-failing. Average
// archetypes here pin EID = 50T (population mean, passes the 65T gate);
// single-trait archetypes inherit that anchor so their gate verdict is
// attributable to the named trait alone.
//
// ── What the engine actually shows at 90 days (3-seed × {3k,8k} sweep) ─────
//   ΔTME vs avg:  emo +2.11…+2.41 | cog +0.94…+1.14 | mixed +1.18…+1.41
//                 worst +4.05…+4.29 | consc −0.03…+0.07 (NULL — see below)
//   avg vs screened: +0.93…+1.07 when scenario coupling is enabled
//   CHI worst vs screened: −0.73…−0.92
//   pEVAC / pLOCL / MSP do NOT discriminate archetypes even at 90 days
//   (evac tails are kit/treatment-dominated) — deliberately unasserted.
//
// Coupling counts behind the scenario levers (verified in src/imm/conditions.ts):
//   emotional_stability 20 conditions + EID 3 (psych β = −0.4) → strongest;
//   cognition 7 → moderate; conscientiousness 1 → small (the consc≈avg
//   assertion is a REGRESSION CANARY: if conscientiousness coupling is ever
//   expanded, that test fails on purpose so the change is acknowledged);
//   technical_competence 0 → composite-only (see the 45d suite).

import { describe, it, expect, beforeAll } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import type { IMMOutcome } from "../../src/imm/types";
import { evaluateCrewGates } from "../../src/imm/crew-gates";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../../src/data/placeholder-criteria";
import type { IMMCrewMember } from "../../src/imm/types";

const SEED = 0xc0ffee;
const TRIALS = 3_000;

const mission = IMM_MISSIONS.find((m) => m.id === "analog-90d")!;
const kit = IMM_KITS.medium;

function makeMember(
  id: string,
  fraction: number,
  overrides: Record<string, number>,
): IMMCrewMember {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const range = c.scale.max - c.scale.min;
    scores[c.id] = c.higherIsBetter
      ? c.scale.min + fraction * range
      : c.scale.max - fraction * range;
  }
  Object.assign(scores, overrides);
  return {
    id,
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: true,
    EVA_count: 2,
    stageAScores: scores,
  };
}

const BAD: Record<string, number> = {
  "psych.emotional_stability": 0,
  "psych.conscientiousness": 0,
  "professional.technical_competence": 1,
  "psych.mmpi2rf_eid": 90,
  "cognitive.nasa_cognition_battery": -2.5,
};
const GOOD: Record<string, number> = {
  "psych.emotional_stability": 90,
  "psych.conscientiousness": 90,
  "professional.technical_competence": 9,
  "psych.mmpi2rf_eid": 35,
  "cognitive.nasa_cognition_battery": 1.0,
};
// Population-mean EID anchor (see header). Mid-fraction base elsewhere.
const AVG: Record<string, number> = { "psych.mmpi2rf_eid": 50 };
const EMO: Record<string, number> = { "psych.emotional_stability": 0, "psych.mmpi2rf_eid": 90 };
const CONSC: Record<string, number> = { "psych.conscientiousness": 0, "psych.mmpi2rf_eid": 50 };
const COG: Record<string, number> = { "cognitive.nasa_cognition_battery": -2.5, "psych.mmpi2rf_eid": 50 };

const uniform = (ov: Record<string, number>) =>
  Array.from({ length: mission.crewSize }, (_, i) => makeMember(`m${i + 1}`, 0.5, ov));

const CREWS: Record<string, IMMCrewMember[]> = {
  screened: uniform(GOOD),
  avg: uniform(AVG),
  emo: uniform(EMO),
  consc: uniform(CONSC),
  cog: uniform(COG),
  mixed: [
    makeMember("m1", 0.5, BAD),
    makeMember("m2", 0.5, BAD),
    makeMember("m3", 0.5, AVG),
    makeMember("m4", 0.5, AVG),
    makeMember("m5", 0.5, AVG),
    makeMember("m6", 0.5, AVG),
  ],
  worst: uniform(BAD),
};

describe("analog-90d · crew archetype comparison (mostly-unselected crews)", () => {
  const R: Record<string, IMMOutcome> = {};

  beforeAll(() => {
    for (const [key, crew] of Object.entries(CREWS)) {
      R[key] = simulateIMM({
        crew,
        mission,
        kit,
        trials: TRIALS,
        seed: SEED,
        criteria: PLACEHOLDER_CRITERIA,
        vulnerabilityCouplingMode: "scenario",
      });
    }
  }, 180_000); // 7 × T=3k 90-day sims ≈ 25 s

  it("fixture: analog-90d is the 90-day analog-controlled campaign", () => {
    expect(mission.kind).toBe("analog-controlled");
    expect(mission.durationDays).toBe(90);
    expect(mission.crewSize).toBe(6);
  });

  it("gate verdicts: demo-threshold review flags, not quality select-in — average and low-conscientiousness crews clear; emo/cog/worst whole-crew flagged; mixed pool flagged(2)", () => {
    expect(evaluateCrewGates(CREWS.screened, PLACEHOLDER_CRITERIA).crewVerdict).toBe("clear");
    // An average unselected person (EID 50T, cognition z 0) fails no gate —
    // the gates exist to catch clinical elevations, not to rank quality.
    expect(evaluateCrewGates(CREWS.avg, PLACEHOLDER_CRITERIA).crewVerdict).toBe("clear");
    // Conscientiousness has no gate: a sloppy-but-stable crew is not review-flagged.
    expect(evaluateCrewGates(CREWS.consc, PLACEHOLDER_CRITERIA).crewVerdict).toBe("clear");
    expect(evaluateCrewGates(CREWS.emo, PLACEHOLDER_CRITERIA).crewVerdict).toBe("review-flagged");
    expect(evaluateCrewGates(CREWS.cog, PLACEHOLDER_CRITERIA).crewVerdict).toBe("review-flagged");
    expect(evaluateCrewGates(CREWS.worst, PLACEHOLDER_CRITERIA).crewVerdict).toBe("review-flagged");
    // Realistic pool: exactly the 2 worst-combined members are flagged.
    const mixedGates = evaluateCrewGates(CREWS.mixed, PLACEHOLDER_CRITERIA);
    expect(mixedGates.crewVerdict).toBe("review-flagged");
    expect(mixedGates.flaggedMemberIds.sort()).toEqual(["m1", "m2"]);
  });

  it("average unselected crew passes gates yet still carries ~+1 TME vs screened — the vulnerability path acts below the gate threshold", () => {
    expect(R.avg.tme.mean).toBeGreaterThan(R.screened.tme.mean + 0.5);
  });

  it("emotional instability is the strongest single-trait lever (23 coupled conditions, psych β=−0.4)", () => {
    expect(R.emo.tme.mean).toBeGreaterThan(R.avg.tme.mean + 1.5);
    // …and stronger than cognitive impairment.
    expect(R.emo.tme.mean).toBeGreaterThan(R.cog.tme.mean);
  });

  it("cognitive impairment is a moderate lever (7 coupled conditions)", () => {
    expect(R.cog.tme.mean).toBeGreaterThan(R.avg.tme.mean + 0.5);
  });

  it("REGRESSION CANARY: low conscientiousness alone is a small risk lever (1 coupled condition) — expand coupling consciously, not accidentally", () => {
    expect(Math.abs(R.consc.tme.mean - R.avg.tme.mean)).toBeLessThan(0.75);
  });

  it("mixed pool (2 worst + 4 avg) lands between the average and worst crews", () => {
    expect(R.mixed.tme.mean).toBeGreaterThan(R.avg.tme.mean + 0.7);
    expect(R.mixed.tme.mean).toBeLessThan(R.worst.tme.mean);
  });

  it("worst-combined crew dominates: TME > avg + 3 and CHI < screened − 0.5", () => {
    expect(R.worst.tme.mean).toBeGreaterThan(R.avg.tme.mean + 3);
    expect(R.worst.chi.mean).toBeLessThan(R.screened.chi.mean - 0.5);
  });
});
