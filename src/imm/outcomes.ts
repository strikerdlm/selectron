// src/imm/outcomes.ts — Beta-Pert sampler + concurrent FI formula
// Rng inlined per convention (prng.ts does not export the type)
type Rng = () => number;

import { sampleGamma } from "../engine/gamma";

/**
 * sampleBetaPert — samples from a PERT-smoothed Beta distribution.
 * Mean = (min + 4*mode + max) / 6 (closed-form PERT moment).
 * lambda defaults to 4 (classic PERT weight).
 */
export function sampleBetaPert(
  rng: Rng,
  min: number,
  mode: number,
  max: number,
  lambda = 4,
): number {
  if (min === max) return min; // degenerate
  if (mode < min || mode > max) throw new RangeError("E_BAD_PRIOR");

  const range = max - min;
  const alpha = 1 + lambda * ((mode - min) / range);
  const beta  = 1 + lambda * ((max - mode) / range);

  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return min + (x / (x + y)) * range;
}

/**
 * concurrentFI — K15 §II.A.9: f_total = 1 − Π(1 − f_i)
 * Each f_i is clamped to [0, 1] before multiplication.
 * Returns 0 for an empty list.
 */
export function concurrentFI(fs: number[]): number {
  if (fs.length === 0) return 0;
  let product = 1;
  for (const f of fs) {
    const clamped = Math.min(1, Math.max(0, f));
    product *= 1 - clamped;
  }
  return 1 - product;
}
