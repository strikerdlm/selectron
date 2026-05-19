import { SelectronError } from "@/engine/errors";

/**
 * Crew Health Index, per IMM spec §3.5 (Antonsen 2022 / Myers 2018 §2.1.2):
 *
 *   CHI = 1 − QTL / (mission_days · crew_size)
 *
 * QTL = Quality Time Lost summed across (crew member, condition, occurrence).
 * `availableMissionTime` is the denominator: mission days × crew size in
 * person-days. CHI ∈ [0, 1] by construction; we enforce that explicitly and
 * throw on QTL > available (which would imply a stage-B occurrence loop bug
 * — the partial-credit interpolation cannot return more lost days than the
 * mission length × crew size per the IMM event-tree definition).
 */
export function computeCHI(qtl: number, availableMissionTime: number): number {
  if (!Number.isFinite(availableMissionTime) || availableMissionTime <= 0) {
    throw new SelectronError(
      "E_BAD_MISSION",
      `availableMissionTime must be positive, got ${availableMissionTime}`,
      { availableMissionTime },
    );
  }
  if (!Number.isFinite(qtl) || qtl < 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `qtl must be a finite non-negative number, got ${qtl}`,
      { qtl },
    );
  }
  if (qtl > availableMissionTime) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `qtl (${qtl}) exceeds availableMissionTime (${availableMissionTime}) — Stage-B trial-loop bug`,
      { qtl, availableMissionTime },
    );
  }
  return 1 - qtl / availableMissionTime;
}

export type Occurrence = { lostDays: number };

/**
 * Quality Time Lost = Σ lost-days across all occurrences in a trial.
 * Spec §3.5: QTL^(ω) = Σ_{i,k,j} LostCrewDays_j^(ω).
 */
export function computeQTL(occurrences: ReadonlyArray<Occurrence>): number {
  let sum = 0;
  for (const o of occurrences) {
    if (!Number.isFinite(o.lostDays) || o.lostDays < 0) {
      throw new SelectronError(
        "E_BAD_PRIOR",
        `lostDays must be a finite non-negative number, got ${o.lostDays}`,
        { lostDays: o.lostDays },
      );
    }
    sum += o.lostDays;
  }
  return sum;
}

/**
 * Probability of early termination = fraction of trials where CHI ≤ χ*,
 * per spec §3.5: p̂_ET = (1/T) Σ_ω 1[CHI^(ω) ≤ χ*]. Selectron's analog of
 * IMM's pEVAC (Antonsen 2022). χ* default = 0.7 — calibrate from Antarctic
 * winter-over historical evacuation rate (Palinkas 2004).
 */
export function computePEarlyTermination(
  chis: ReadonlyArray<number>,
  chiStar: number,
): number {
  if (!Number.isFinite(chiStar) || chiStar < 0 || chiStar > 1) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `chiStar must be in [0,1], got ${chiStar}`,
      { chiStar },
    );
  }
  if (chis.length === 0) {
    throw new SelectronError("E_BAD_PRIOR", "chis must be a non-empty array");
  }
  let count = 0;
  for (const c of chis) {
    if (!Number.isFinite(c)) {
      throw new SelectronError(
        "E_BAD_PRIOR",
        `chi value must be finite, got ${c}`,
        { c },
      );
    }
    if (c <= chiStar) count++;
  }
  return count / chis.length;
}
