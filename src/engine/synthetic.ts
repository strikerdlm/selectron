import type { Candidate, Criterion } from "@/types";
import { makeRng } from "./prng";

const ALIASES = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
  "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
];

export function generateCandidate(
  criteria: readonly Criterion[],
  seed: number,
  id?: string,
): Candidate {
  const rng = makeRng(seed);
  const scores: Record<string, number> = {};
  for (const c of criteria) {
    const u = rng();
    scores[c.id] = c.scale.min + u * (c.scale.max - c.scale.min);
  }
  const finalId = id ?? `synthetic-${seed}`;
  return {
    id: finalId,
    alias: ALIASES[seed % ALIASES.length],
    scores,
  };
}

export function generateCandidates(
  criteria: readonly Criterion[],
  n: number,
  seed: number,
): Candidate[] {
  const out: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    out.push(generateCandidate(criteria, seed + i, `synthetic-${seed}-${i}`));
  }
  return out;
}
