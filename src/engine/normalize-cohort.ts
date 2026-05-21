// src/engine/normalize-cohort.ts
// Z-score a raw Stage-A criterion score against the criterion's operational
// scale. The scale's [min, max] is treated as the ±2 SD operational range
// (4 SDs total), so a midpoint score yields z=0 and the extremes yield ±2.
//
// This is a deliberate, conservative assumption: real cohort SDs vary by
// criterion, but using the scale itself as the reference avoids depending
// on a population dataset and produces a consistent, bounded vulnerability
// signal across all criteria.

export function zScoreAgainstScale(raw: number, scale: { min: number; max: number }): number {
  const mid = (scale.min + scale.max) / 2;
  const range = scale.max - scale.min;
  if (range <= 0) return 0;
  return ((raw - mid) / range) * 4;
}
