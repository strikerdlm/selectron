// src/engine/normalize-cohort.ts
//
// scaleRelativeScore: map a raw Stage-A criterion score to a scale-relative
// bounded coordinate:
//   scale minimum -> -2
//   scale midpoint -> 0
//   scale maximum -> +2
//
// This is not a population z-score. No normative mean or standard deviation is
// supplied; the declared instrument scale alone defines the coordinate.

/**
 * Scale-relative bounded coordinate. Used only to drive the Stage-A
 * vulnerability multiplier (a scenario-analysis lever), not as a normative
 * comparison.
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
