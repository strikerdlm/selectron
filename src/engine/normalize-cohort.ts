// src/engine/normalize-cohort.ts
//
// scaleRelativeScore: map a raw Stage-A criterion score to a scale-relative
// position in roughly [-2, +2]. This is NOT a population z-score — no
// normative mean or SD is supplied. The criterion's operational [min, max] is
// treated as a ±2 SD operational range (4 SDs total), so the midpoint yields 0
// and the endpoints yield ±2.
//
// This is a deliberate, conservative assumption: real cohort SDs vary by
// criterion, but using the scale itself as the reference avoids depending on
// a population dataset and produces a consistent, bounded vulnerability
// signal across all criteria. If a criterion ever ships a documented
// normative mean and SD, a true population z-score helper should be added
// alongside this one rather than overloading this name.

/**
 * Scale-relative score in roughly [-2, +2]. NOT a population z-score: it
 * assumes the operational scale endpoints represent ±2 SD and uses no
 * normative mean/SD. Used only to drive the Stage-A vulnerability multiplier
 * (a scenario-analysis lever), not as a normative comparison.
 */
export function scaleRelativeScore(raw: number, scale: { min: number; max: number }): number {
  const mid = (scale.min + scale.max) / 2;
  const range = scale.max - scale.min;
  if (range <= 0) return 0;
  return ((raw - mid) / range) * 4;
}

// Backward-compatibility alias for archived `src/risk` paths and historical
// tests. New active code should call `scaleRelativeScore` directly.
export { scaleRelativeScore as zScoreAgainstScale };