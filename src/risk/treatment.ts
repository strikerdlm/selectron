import { SelectronError } from "@/engine/errors";

/**
 * Partial-credit treatment-path lost-days interpolation, per IMM spec §3.4
 * (Myers 2018 §2.1.2 verbatim): "The IMM implements this partial credit by
 * defining outcome distributions for the fully-treated and untreated
 * distributions as the extremes, and using the proportion of treatment
 * available to shift continuously between them."
 *
 *   LostCrewDays_j = (1 - τ_j) · D^untreated_{k,s_j} + τ_j · D^treated_{k,s_j}
 *
 * τ ∈ [0,1] is the treatment fraction (countermeasure availability), set
 * from the mission profile's `countermeasures` lookup. D^treated and
 * D^untreated are the severity-conditional lost-day means from priors.json.
 */
export function lostDays(
  dUntreated: number,
  dTreated: number,
  tau: number,
): number {
  if (!Number.isFinite(tau) || tau < 0 || tau > 1) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `treatment fraction τ must be in [0,1], got ${tau}`,
      { tau },
    );
  }
  if (!Number.isFinite(dUntreated) || dUntreated < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `untreated_lost_days_mean must be a finite non-negative number, got ${dUntreated}`,
      { dUntreated },
    );
  }
  if (!Number.isFinite(dTreated) || dTreated < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `treated_lost_days_mean must be a finite non-negative number, got ${dTreated}`,
      { dTreated },
    );
  }
  return (1 - tau) * dUntreated + tau * dTreated;
}
