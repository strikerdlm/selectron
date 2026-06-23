// Experimental HSRB-inspired LxC scoring engine for Monte-Carlo posteriors.
// ─────────────────────────────────────────────────────────────────────
// Translates a RiskPosterior + χ* threshold into an HSRB-inspired
// (likelihood, consequence, color) tuple per JSC-66705 Rev A. This is not a
// NASA board determination.
//
//   Likelihood = bucketed P(χ < χ*) using the In-Mission likelihood bands
//                (verbatim quantitative thresholds, JSC-66705 Fig. 4 p. 28).
//   Consequence = bucketed (1 − χ_mean) using crew-health fraction-lost
//                 cutoffs (JSC-66705 qualitative bands, Selectron quantitative
//                 mapping — see lxc-definitions.ts for the bridge).
//   Color = JSC-66705 §3.2.4 rule (red ≥ 20, yellow 11–19, green ≤ 10).

import type { RiskPosterior } from "@/types/risk";
import type { GateResult } from "@/types";
import {
  CONSEQUENCE_BANDS_MISSION_OBJ,
  LIKELIHOOD_BANDS_IN_MISSION,
  lxcColor,
  lxcScore,
  type ConsequenceLevel,
  type LikelihoodLevel,
  type RiskColor,
} from "./lxc-definitions";

export type LxCAssessment = {
  likelihood: LikelihoodLevel;
  likelihoodLabel: string;
  likelihoodDefinition: string;
  consequence: ConsequenceLevel;
  consequenceLabel: string;
  consequenceDefinition: string;
  score: number;       // 1..25, from the priority-score matrix
  color: RiskColor;    // green | yellow | red
  // Inputs that drove the assessment — surfaced for the UI explanation.
  pEarlyTermination: number; // P(χ < χ*) used as likelihood
  fractionLost: number;      // 1 − χ_mean used as consequence
  /** Set to true when the candidate was disqualified by a binary gate. */
  disqualified?: boolean;
  /** Human-readable reason string when disqualified is true. */
  reason?: string;
};

// IEEE-754 tolerance — `1 - 0.70 = 0.30000000000000004` would otherwise push a
// canonical 30% loss into C5 when JSC-66705 intends 30% (inclusive) to be C4.
// 1e-9 is well below any meaningful resolution of either P or fraction-lost.
const EPS = 1e-9;

function bucketLikelihood(p: number): LikelihoodLevel {
  // Use ≤ on upper bound (+ epsilon for float safety) to match JSC-66705
  // verbatim ("P ≤ 0.01%", etc.). Clamp negatives — shouldn't happen, but
  // protects against MC posterior float drift.
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

export function assessLxC(posterior: RiskPosterior, gate?: GateResult): LxCAssessment {
  const pET = posterior.pEarlyTermination.mean;
  const fractionLost = Math.max(0, 1 - posterior.chi.mean);

  const L = bucketLikelihood(pET);
  const C = bucketConsequence(fractionLost);
  const score = lxcScore(L, C);
  const color = lxcColor(score);

  const Lband = LIKELIHOOD_BANDS_IN_MISSION[L - 1];
  const Cband = CONSEQUENCE_BANDS_MISSION_OBJ[C - 1];

  const flagged = gate?.verdict === "disqualified";
  return {
    likelihood: L,
    likelihoodLabel: Lband.label,
    likelihoodDefinition: Lband.definition,
    consequence: C,
    consequenceLabel: Cband.label,
    consequenceDefinition: Cband.definition,
    score,
    color,
    pEarlyTermination: pET,
    fractionLost,
    ...(flagged
      ? {
          disqualified: true,
          reason: `review flags: ${gate.failedGates.join(", ")}`,
        }
      : {}),
  };
}
