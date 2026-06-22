// tests/imm/analog_45d_unscreened_crew.test.ts
//
// 2026-06-05 (Diego): "make a test for 45 days in analog mission with no
// selection of the people, unstable emotionally and poor technical abilities,
// low conscientiousness."
//
// Scenario: the `analog-45d` campaign (45-day controlled-habitat analog,
// kind "analog-controlled", crew 6) is flown with an UNSCREENED crew — i.e.
// nobody was put through Selectron Stage-A selection. The crew profile:
//
//   - unstable emotionally   → psych.emotional_stability at scale floor (0/100)
//                              AND psych.mmpi2rf_eid T = 90 (clinical; the
//                              select-out gate fails above 65T)
//   - poor technical ability → professional.technical_competence at floor (1/10)
//   - low conscientiousness  → psych.conscientiousness at scale floor (0/100)
//                              (plus cognitive.nasa_cognition_battery z = −2.5,
//                              below the −2.0 gate, reinforcing the DQ verdict)
//
// What each trait actually moves in the engine (verified 2026-06-05):
//   - psych.emotional_stability and psych.conscientiousness appear in IMM
//     conditions' `vulnerabilityCriteria` → z-scored against the criterion
//     scale (zScoreAgainstScale, scale-relative) → exp(β·z) multiplier on λ
//     (FAMILY_BETA, psychiatric β = −0.4). Low scores → z < 0 → λ↑ → risk↑.
//   - professional.technical_competence is NOT referenced by any condition's
//     vulnerabilityCriteria (0 hits in src/imm/conditions.ts) — it degrades
//     the Stage-A crew composite (asserted below) but does NOT move the IMM
//     mission-risk numbers. The test narrative is explicit about this.
//   - psych.mmpi2rf_eid / cognitive.nasa_cognition_battery are DUAL-ROLE:
//     they are the two wired clearance gates (gate-then-modulate: selection
//     WOULD have hard-DQ'd this crew before any Stage B / IMM run) AND they
//     are themselves λ-coupled via vulnerabilityCriteria (EID on 3 conditions,
//     cognition on 7 — verified 2026-06-05 in src/imm/conditions.ts). So the
//     risk elevation asserted below is driven by all four psych/cognitive
//     scores jointly, not by emotional_stability + conscientiousness alone.
//
// The test demonstrates, on the real calibrated engine (auto-loaded
// analog-controlled kind_multipliers included):
//   (1) selection gates would disqualify the unscreened crew (and pass the
//       screened control),
//   (2) the Stage-A composite is materially lower (the technical-competence
//       path),
//   (3) default scientific mode quarantines Stage-A-to-incidence coupling, so
//       the two crews' runs are bit-identical even when criteria are supplied,
//   (4) explicit scenario mode measurably degrades 45-day mission risk via the
//       vulnerability path: TME↑, CHI↓. Scenario mode demonstrates an assumed
//       effect; it is not treated as validated analog prediction.

import { describe, it, expect } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { evaluateCrewGates } from "../../src/imm/crew-gates";
import { aggregateCrewComposite } from "../../src/imm/composite";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../../src/data/placeholder-criteria";
import type { IMMCrewMember } from "../../src/imm/types";

const SEED = 0xc0ffee;
const TRIALS = 3_000; // matches the kind_multipliers suite's TR convention

const mission = IMM_MISSIONS.find((m) => m.id === "analog-45d")!;
// 2026-06-05 (Diego): "test an analog mission for 22 days with the same bad crew".
const mission22 = IMM_MISSIONS.find((m) => m.id === "analog-22d")!;
const kit = IMM_KITS.medium; // "Analog / Antarctic Station (Level II–III)"

/**
 * Build a crew member whose every criterion sits at `fraction` of its scale
 * (direction-corrected: fraction 1.0 = best, 0.0 = worst), then apply raw-score
 * overrides for the traits this scenario pins.
 */
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
    EVA_count: 1,
    stageAScores: scores,
  };
}

/** The named worst-case traits, as raw instrument scores. */
const UNSCREENED_OVERRIDES: Record<string, number> = {
  "psych.emotional_stability": 0, //   0 on 0–100, higherIsBetter
  "psych.conscientiousness": 0, //     0 on 0–100, higherIsBetter
  "professional.technical_competence": 1, // 1 on 1–10, higherIsBetter
  "psych.mmpi2rf_eid": 90, //          T-score; gate fails ABOVE 65 (reversed scale)
  "cognitive.nasa_cognition_battery": -2.5, // z; gate fails BELOW −2.0
};

/** Screened control: same mid-range base, the named traits healthy. */
const SCREENED_OVERRIDES: Record<string, number> = {
  "psych.emotional_stability": 90,
  "psych.conscientiousness": 90,
  "professional.technical_competence": 9,
  "psych.mmpi2rf_eid": 35,
  "cognitive.nasa_cognition_battery": 1.0,
};

function makeCrew(overrides: Record<string, number>): IMMCrewMember[] {
  return Array.from({ length: mission.crewSize }, (_, i) =>
    makeMember(`m${i + 1}`, 0.5, overrides),
  );
}

const unscreenedCrew = makeCrew(UNSCREENED_OVERRIDES);
const screenedCrew = makeCrew(SCREENED_OVERRIDES);

describe("analog-45d · unscreened high-risk crew (no Stage-A selection)", () => {
  it("fixture: analog-45d is the 45-day analog-controlled campaign", () => {
    expect(mission.kind).toBe("analog-controlled");
    expect(mission.durationDays).toBe(45);
    expect(mission.crewSize).toBe(6);
  });

  it("selection gates would hard-disqualify the unscreened crew (EID > 65T, cognition < −2.0) and pass the screened control", () => {
    const dq = evaluateCrewGates(unscreenedCrew, PLACEHOLDER_CRITERIA);
    expect(dq.crewVerdict).toBe("disqualified");
    // Whole-crew DQ: every member carries the failing scores.
    expect(dq.disqualifiedMemberIds).toHaveLength(mission.crewSize);

    const ok = evaluateCrewGates(screenedCrew, PLACEHOLDER_CRITERIA);
    expect(ok.crewVerdict).toBe("qualified");
  });

  it("Stage-A crew composite degrades (this is where poor technical competence bites — it is not λ-coupled)", () => {
    const bad = aggregateCrewComposite(unscreenedCrew, PLACEHOLDER_CRITERIA, "mean");
    const good = aggregateCrewComposite(screenedCrew, PLACEHOLDER_CRITERIA, "mean");
    expect(bad.compositeScore).toBeLessThan(good.compositeScore);
  });

  it("default scientific mode ignores Stage-A incidence coupling even when criteria are supplied", () => {
    const screened = simulateIMM({
      crew: screenedCrew,
      mission,
      kit,
      trials: 500,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
    });
    const unscreened = simulateIMM({
      crew: unscreenedCrew,
      mission,
      kit,
      trials: 500,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
    });
    expect(Math.abs(screened.tme.mean - unscreened.tme.mean)).toBeLessThan(1e-12);
    expect(Math.abs(screened.chi.mean - unscreened.chi.mean)).toBeLessThan(1e-12);
    expect(Math.abs(screened.pEvac.mean - unscreened.pEvac.mean)).toBeLessThan(1e-12);
  });

  it("scenario mode elevates 45-day mission risk via the vulnerability path (TME↑, CHI↓)", () => {
    const screened = simulateIMM({
      crew: screenedCrew,
      mission,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });
    const unscreened = simulateIMM({
      crew: unscreenedCrew,
      mission,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });

    // Low emotional stability + low conscientiousness → z < 0 on the coupled
    // conditions → exp(β·z) > 1 → λ↑ → more medical events in 45 days.
    //
    // Margin choice (3-seed × {3k, 8k}-trial sweep, 2026-06-05): ΔTME spans
    // +2.53 to +2.61 and ΔCHI spans −0.33 to −0.61 across every seed/T pair —
    // these are the durable signals, asserted with headroom below. ΔpEVAC,
    // ΔpLOCL, and ΔMSP all sign-invert across seeds at these trial counts
    // (45-day rare-event tails: e.g. ΔpEVAC = −0.30 at seed 99/T=3k, ΔMSP =
    // +0.037 at 0xc0ffee/T=8k), so they are deliberately NOT asserted —
    // a passing inequality on them would be seed luck, not evidence.
    expect(unscreened.tme.mean).toBeGreaterThan(screened.tme.mean + 1.5);
    // More (and worse) events → more quality-time lost → lower crew health index.
    expect(unscreened.chi.mean).toBeLessThan(screened.chi.mean - 0.1);
  });

  it("negative control: without a criteria catalog scenario mode cannot see stageAScores — both crews bit-identical", () => {
    const a = simulateIMM({ crew: screenedCrew, mission, kit, trials: 500, seed: SEED, vulnerabilityCouplingMode: "scenario" });
    const b = simulateIMM({ crew: unscreenedCrew, mission, kit, trials: 500, seed: SEED, vulnerabilityCouplingMode: "scenario" });
    expect(Math.abs(a.tme.mean - b.tme.mean)).toBeLessThan(1e-12);
    expect(Math.abs(a.chi.mean - b.chi.mean)).toBeLessThan(1e-12);
    expect(Math.abs(a.pEvac.mean - b.pEvac.mean)).toBeLessThan(1e-12);
  });
});

// 2026-06-05 (Diego): "test an analog mission for 22 days with the same bad
// crew" — the identical unscreened/screened fixtures on the shorter
// `analog-22d` campaign. Gate verdicts are mission-independent (already
// asserted above), so this block characterizes the duration-scaled risk:
//
// Margin choice (3-seed × {3k, 8k}-trial sweep, 2026-06-05): at 22 days
// ΔTME spans +1.19 to +1.29 and ΔCHI spans −0.36 to −0.44 across every
// seed/T pair — asserted with headroom. ΔpEVAC and ΔMSP sign-invert across
// seeds at these trial counts (22-day rare-event tails are even thinner
// than at 45 days), so they remain deliberately unasserted.
describe("analog-22d · same unscreened crew (22-day campaign)", () => {
  it("fixture: analog-22d is the 22-day analog-controlled campaign", () => {
    expect(mission22.kind).toBe("analog-controlled");
    expect(mission22.durationDays).toBe(22);
    expect(mission22.crewSize).toBe(6);
  });

  it("scenario mode elevates 22-day mission risk via the vulnerability path (TME↑, CHI↓)", () => {
    const screened = simulateIMM({
      crew: screenedCrew,
      mission: mission22,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });
    const unscreened = simulateIMM({
      crew: unscreenedCrew,
      mission: mission22,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });

    expect(unscreened.tme.mean).toBeGreaterThan(screened.tme.mean + 0.7);
    expect(unscreened.chi.mean).toBeLessThan(screened.chi.mean - 0.1);
  });

  it("duration monotonicity: the same unscreened crew accrues fewer expected medical events in 22 days than in 45", () => {
    const u22 = simulateIMM({
      crew: unscreenedCrew,
      mission: mission22,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });
    const u45 = simulateIMM({
      crew: unscreenedCrew,
      mission,
      kit,
      trials: TRIALS,
      seed: SEED,
      criteria: PLACEHOLDER_CRITERIA,
      vulnerabilityCouplingMode: "scenario",
    });
    // General-Poisson incidence scales with durationDays (rev3-b duration
    // scaling), so 22-day TME must sit well below 45-day TME for the same
    // crew. Observed at 0xc0ffee/T=3k: 5.49 vs 11.27 — assert the ordering
    // with margin rather than the exact values.
    expect(u22.tme.mean).toBeLessThan(u45.tme.mean - 2);
  });
});
