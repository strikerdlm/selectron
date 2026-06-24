// src/imm/composite.ts
// IMM Composite-Crew extension — crew-level composite score aggregation.
//
// `aggregateCrewComposite` takes a crew array (each member MAY carry `stageAScores`),
// a set of Selectron criteria, and an aggregation method, then returns a `CrewComposite`
// with a crew-level score in [0, 1], per-member scores, and the weakest-member ID.
//
// Per-member composite score = arithmetic mean of normalised criterion scores
// (affine map [min,max] → [0,1] with higherIsBetter flip, identical to the
// `normalizeScore` used in src/engine/normalize.ts).  Members missing a score
// for a given criterion have that criterion omitted from their mean; members
// with no stageAScores at all receive a score of 0.

import type { Criterion } from "../types";
import { normalizeScore } from "../engine/normalize";
import type { IMMCrewMember } from "./types";
import type { CrewComposite, CrewCompositeMethod } from "./types";

/**
 * Compute a scalar composite score in [0, 1] for a single crew member.
 *
 * Strategy:
 * - For each criterion with a valid score in member.stageAScores, compute
 *   the normalised value via normalizeScore (affine [min,max]→[0,1] with
 *   higherIsBetter flip, identical to MCDA engine normalisation).
 * - Return the arithmetic mean of those values.
 * - If no scores are present, returns 0.
 *
 * Invalid raw scores propagate SelectronError from normalizeScore so imported
 * Stage-A data fail closed instead of silently clamping.
 */
function memberCompositeScore(member: IMMCrewMember, criteria: readonly Criterion[]): number {
  if (!member.stageAScores || Object.keys(member.stageAScores).length === 0) return 0;

  let sum = 0;
  let count = 0;

  for (const c of criteria) {
    const raw = member.stageAScores[c.id];
    if (raw === undefined) continue;
    sum += normalizeScore(raw, c.scale, c.higherIsBetter);
    count++;
  }

  return count === 0 ? 0 : sum / count;
}

/**
 * Aggregate per-member composite scores into a crew-level score.
 *
 * Strategies:
 * - "mean": arithmetic mean of per-member scores.
 * - "worst-link": minimum per-member score (weakest-link reliability model).
 * - "geometric-mean": nth root of the product of per-member scores.
 *
 * Edge cases:
 * - Empty crew: returns { compositeScore: 0, perMemberScores: [], weakestMemberId: null, method }.
 * - "geometric-mean" with any zero score: result is 0 (mathematically correct; log(0) = -∞).
 *
 * @param crew - Array of IMMCrewMember objects (stageAScores is optional on each).
 * @param criteria - Criterion catalog used for normalisation (DEMO_CRITERIA or a future ratified catalog).
 * @param method - Aggregation strategy.
 * @returns CrewComposite with compositeScore ∈ [0, 1].
 */
export function aggregateCrewComposite(
  crew: readonly IMMCrewMember[],
  criteria: readonly Criterion[],
  method: CrewCompositeMethod,
): CrewComposite {
  if (crew.length === 0) {
    return { compositeScore: 0, perMemberScores: [], weakestMemberId: null, method };
  }

  const perMemberScores = crew.map(m => memberCompositeScore(m, criteria));

  let compositeScore: number;
  if (method === "mean") {
    compositeScore = perMemberScores.reduce((a, b) => a + b, 0) / perMemberScores.length;
  } else if (method === "worst-link") {
    compositeScore = Math.min(...perMemberScores);
  } else {
    // "geometric-mean"
    if (perMemberScores.some(s => s <= 0)) {
      compositeScore = 0;
    } else {
      const logSum = perMemberScores.reduce((acc, s) => acc + Math.log(s), 0);
      compositeScore = Math.exp(logSum / perMemberScores.length);
    }
  }

  // Clamp to [0, 1] defensively (floating-point products can drift above 1).
  compositeScore = Math.max(0, Math.min(1, compositeScore));

  const minScore = Math.min(...perMemberScores);
  const weakestIdx = perMemberScores.indexOf(minScore);
  const weakestMemberId = crew[weakestIdx].id;

  return { compositeScore, perMemberScores, weakestMemberId, method };
}
