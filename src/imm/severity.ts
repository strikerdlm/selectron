// src/imm/severity.ts — Worst-case severity sampler (Beta-Bernoulli wrapper)
// Rng inlined per convention (prng.ts does not export the type)
type Rng = () => number;

import { sampleBetaBernoulli } from "./incidence";

/**
 * sampleSeverity — draws "worst" with probability Beta(alpha, beta).
 * Returns "best" when alpha = 0 (degenerate: p = 0 always).
 */
export function sampleSeverity(rng: Rng, alpha: number, beta: number): "best" | "worst" {
  if (alpha <= 0) return "best";
  return sampleBetaBernoulli(rng, alpha, beta) === 1 ? "worst" : "best";
}
