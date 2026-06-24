// src/engine/gates.ts
import type { Candidate, Criterion, GateResult } from "../types";

export function evaluateGates(candidate: Candidate, criteria: readonly Criterion[]): GateResult {
  const failedGates: string[] = [];
  const evaluated: string[] = [];
  const missingNotes: string[] = [];

  for (const c of criteria) {
    if (!c.gateThreshold) continue;
    evaluated.push(c.id);
    const score = candidate.scores[c.id];
    if (score === undefined || !Number.isFinite(score)) {
      failedGates.push(c.id);
      missingNotes.push(`missing score for ${c.id}`);
      continue;
    }
    const { operator, value } = c.gateThreshold;
    const fails = operator === "fail-if-below" ? score < value : score > value;
    if (fails) failedGates.push(c.id);
  }

  return {
    verdict: failedGates.length === 0 ? "clear" : "review-flagged",
    failedGates,
    evaluated,
    ...(missingNotes.length > 0 ? { notes: missingNotes.join("; ") } : {}),
  };
}
