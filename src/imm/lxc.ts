// NASA HSRB LxC scoring for IMM Calculator outputs.
// ─────────────────────────────────────────────────────────────────────
// Mirrors `src/risk/lxc.ts::assessLxC` but takes `IMMOutcome` + optional
// `CrewGateResult` directly — closes the gap where IMM Calculator output
// did not feed the LxC matrix construction. The band definitions live in
// `src/risk/lxc-definitions.ts` (NASA JSC-66705 Rev A, pipeline-agnostic).
//
// Mapping IMMOutcome → LxC inputs:
//
//   Likelihood: 1 − missionSuccess.mean/100
//     missionSuccess is the per-trial fraction where the mission
//     succeeded (no EVAC ∧ no LOCL ∧ CHI ≥ χ*). 1 − success rate is the
//     probability of an unsuccessful mission, which is the operationally
//     meaningful "early termination" measure for HSRB likelihood banding.
//     Conservative because it captures all failure modes (EVAC, LOCL, low
//     CHI) — not just CHI < χ* like the Stage-B Risk assessor's pEarlyTerm.
//
//   Consequence: 1 − chi.mean/100
//     CHI is in IMMOutcome's percent scale (0–100). The HSRB consequence
//     band reads fraction-lost (0–1), so divide by 100 first.
//
// Crew-level gate (CrewGateResult.crewVerdict === "disqualified") triggers
// the immediate L5×C5=25 RED verdict — same NASA-standard fast-fail as the
// Stage-B per-candidate gate path.
//
// Reference: JSC-66705 Revision A §3.2.4 + Figure 4 (p. 28). Selectron CHI
// = 1 − QTL/(t·c) per the IMM aggregation rule (`src/imm/chi.ts` not yet
// existing; semantics defined in `src/imm/simulate.ts`).

import type { IMMOutcome, CrewGateResult } from "./types";
import {
  CONSEQUENCE_BANDS_MISSION_OBJ,
  LIKELIHOOD_BANDS_IN_MISSION,
  lxcColor,
  lxcScore,
  type ConsequenceLevel,
  type LikelihoodLevel,
  type RiskColor,
} from "../risk/lxc-definitions";

export type IMMLxCAssessment = {
  likelihood: LikelihoodLevel;
  likelihoodLabel: string;
  likelihoodDefinition: string;
  consequence: ConsequenceLevel;
  consequenceLabel: string;
  consequenceDefinition: string;
  score: number;       // 1..25 (JSC-66705 priority matrix)
  color: RiskColor;    // green | yellow | red
  // Inputs that drove the assessment — surfaced for the UI explanation.
  pMissionFailure: number;   // 1 − missionSuccess.mean/100 (likelihood input)
  fractionLost: number;      // 1 − chi.mean/100 (consequence input)
  /** Set to true when the crew was disqualified by a binary clearance gate. */
  disqualified?: boolean;
  /** Human-readable reason string when disqualified is true. */
  reason?: string;
};

// IEEE-754 epsilon — matches src/risk/lxc.ts EPS for canonical-boundary cases
// (e.g. 1 − 0.70 = 0.30000000000000004 must not be pushed into the next band).
const EPS = 1e-9;

function bucketLikelihood(p: number): LikelihoodLevel {
  const x = Math.max(0, Math.min(1, p));
  for (const band of LIKELIHOOD_BANDS_IN_MISSION) {
    if (x > band.pLowExclusive && x <= band.pHighInclusive + EPS) return band.level;
  }
  return 5;
}

function bucketConsequence(fractionLost: number): ConsequenceLevel {
  const x = Math.max(0, Math.min(1, fractionLost));
  for (const band of CONSEQUENCE_BANDS_MISSION_OBJ) {
    if (x > band.fractionLostLowExclusive && x <= band.fractionLostHighInclusive + EPS)
      return band.level;
  }
  return 5;
}

/**
 * Translate an `IMMOutcome` (and optional crew gate verdict) into a NASA
 * HSRB LxC verdict. Mirrors `src/risk/lxc.ts::assessLxC` semantics:
 *
 *  - Crew-level gate disqualified → L5×C5=25 RED (NASA fast-fail).
 *  - Otherwise: bucket pMissionFailure into Likelihood, fractionLost into
 *    Consequence, look up priority score + color.
 *
 * The crew gate is checked at the CREW level (CrewGateResult.crewVerdict),
 * not per-member — the LxC verdict applies to the whole crew under the
 * weakest-link semantics of `src/imm/crew-gates.ts`.
 */
export function assessIMMLxC(
  outcome: IMMOutcome,
  crewGate?: CrewGateResult,
): IMMLxCAssessment {
  // Whole-crew disqualification short-circuits the Monte Carlo result.
  if (crewGate?.crewVerdict === "disqualified") {
    const Lband = LIKELIHOOD_BANDS_IN_MISSION[4]; // L5
    const Cband = CONSEQUENCE_BANDS_MISSION_OBJ[4]; // C5
    return {
      likelihood: 5,
      likelihoodLabel: Lband.label,
      likelihoodDefinition: Lband.definition,
      consequence: 5,
      consequenceLabel: Cband.label,
      consequenceDefinition: Cband.definition,
      score: 25,
      color: "red",
      pMissionFailure: 1.0,
      fractionLost: 1.0,
      disqualified: true,
      reason: `crew disqualified: ${crewGate.disqualifiedMemberIds.join(", ")}`,
    };
  }

  // missionSuccess is stored ×100 (percent) in IMMOutcome; chi likewise.
  const pMissionFailure = Math.max(0, 1 - outcome.missionSuccess.mean / 100);
  const fractionLost    = Math.max(0, 1 - outcome.chi.mean / 100);

  const L = bucketLikelihood(pMissionFailure);
  const C = bucketConsequence(fractionLost);
  const score = lxcScore(L, C);
  const color = lxcColor(score);

  const Lband = LIKELIHOOD_BANDS_IN_MISSION[L - 1];
  const Cband = CONSEQUENCE_BANDS_MISSION_OBJ[C - 1];

  return {
    likelihood: L,
    likelihoodLabel: Lband.label,
    likelihoodDefinition: Lband.definition,
    consequence: C,
    consequenceLabel: Cband.label,
    consequenceDefinition: Cband.definition,
    score,
    color,
    pMissionFailure,
    fractionLost,
  };
}
