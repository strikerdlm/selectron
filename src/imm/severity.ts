// src/imm/severity.ts — Worst-case severity helpers
// Rng inlined per convention (prng.ts does not export the type)
type Rng = () => number;

import { sampleBeta } from "./incidence";

/**
 * Draw a condition/trial-level worst-case severity probability.
 *
 * This is the scientifically meaningful use of the stored Beta concentration:
 * one probability can be shared across events in an outer trial/draw, so
 * alpha+beta controls between-trial uncertainty instead of collapsing to the
 * same marginal Bernoulli mean for every event.
 */
export function sampleSeverityProbability(rng: Rng, alpha: number, beta: number): number {
  if (alpha <= 0) return 0;
  return sampleBeta(rng, alpha, beta);
}

export function sampleSeverityFromProbability(rng: Rng, probability: number): "best" | "worst" {
  const p = Math.max(0, Math.min(1, probability));
  return rng() < p ? "worst" : "best";
}

/**
 * sampleSeverity — draws "worst" with probability Beta(alpha, beta).
 * Returns "best" when alpha = 0 (degenerate: p = 0 always).
 *
 * Kept for direct-call compatibility. The main IMM simulator uses
 * sampleSeverityProbability once per condition/trial, then samples event
 * severities from that shared probability.
 */
export function sampleSeverity(rng: Rng, alpha: number, beta: number): "best" | "worst" {
  return sampleSeverityFromProbability(rng, sampleSeverityProbability(rng, alpha, beta));
}
