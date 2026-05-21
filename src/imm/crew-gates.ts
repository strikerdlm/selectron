// src/imm/crew-gates.ts
// IMM Composite-Crew extension — per-member gate evaluation.
//
// `evaluateCrewGates` runs `evaluateGates` (from src/engine/gates.ts) on each
// crew member individually, then aggregates into a `CrewGateResult`.
//
// The crew qualifies only when EVERY member individually qualifies
// (weakest-link gate logic: one DQ member disqualifies the whole crew).
//
// Members without stageAScores receive a gate evaluation where all gated
// criteria are treated as missing scores — they will fail every gated criterion
// (evaluateGates marks missing scores as failed, per gates.ts §12 behaviour).

import type { Criterion } from "../types";
import type { IMMCrewMember } from "./types";
import type { CrewGateResult } from "./types";
import { evaluateGates } from "../engine/gates";

/**
 * Evaluate Selectron Stage A gate criteria for each crew member individually.
 *
 * The crew-level verdict is "qualified" iff every per-member verdict is
 * "qualified" (weakest-link: a single DQ disqualifies the crew).
 *
 * @param crew - Array of IMMCrewMember objects. Each member is evaluated
 *   using `member.stageAScores ?? {}` as the score map.
 * @param criteria - Criterion catalog with gateThreshold fields (e.g. PLACEHOLDER_CRITERIA).
 *   Only criteria that carry a `gateThreshold` contribute to gate evaluation;
 *   criteria without one are still listed under `evaluated` in the individual
 *   GateResult but do not contribute to failures.
 * @returns CrewGateResult with crewVerdict, per-member results keyed by
 *   member.id, and the list of disqualified member IDs.
 */
export function evaluateCrewGates(
  crew: readonly IMMCrewMember[],
  criteria: readonly Criterion[],
): CrewGateResult {
  const perMemberResults: CrewGateResult["perMemberResults"] = {};
  const disqualifiedMemberIds: string[] = [];

  for (const member of crew) {
    // Build a minimal Candidate shape compatible with evaluateGates.
    // stageAScores may be undefined; treat as empty Record so all gated
    // criteria are flagged as "missing" rather than throwing.
    const candidate = {
      id: member.id,
      alias: member.id,
      scores: member.stageAScores ?? {},
    };

    const gateResult = evaluateGates(candidate, criteria);
    perMemberResults[member.id] = gateResult;

    if (gateResult.verdict === "disqualified") {
      disqualifiedMemberIds.push(member.id);
    }
  }

  const crewVerdict: CrewGateResult["crewVerdict"] =
    disqualifiedMemberIds.length === 0 ? "qualified" : "disqualified";

  return { crewVerdict, perMemberResults, disqualifiedMemberIds };
}
