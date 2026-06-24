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
import { SelectronError } from "./errors";

/**
 * Scale-relative bounded coordinate. Used only to drive the Stage-A
 * vulnerability multiplier (a scenario-analysis lever), not as a normative
 * comparison.
 */
export function scaleRelativeScore(raw: number, scale: { min: number; max: number }): number {
  if (!Number.isFinite(raw)) {
    throw new SelectronError("E_BAD_SCORE", `scaleRelativeScore: raw score must be finite, got ${raw}`, {
      raw,
      scale,
    });
  }
  if (!Number.isFinite(scale.min) || !Number.isFinite(scale.max) || scale.max <= scale.min) {
    throw new SelectronError(
      "E_BAD_SCORE",
      `scaleRelativeScore: scale must have finite min < max, got [${scale.min}, ${scale.max}]`,
      { raw, scale },
    );
  }
  if (raw < scale.min || raw > scale.max) {
    throw new SelectronError("E_BAD_SCORE", `scaleRelativeScore: raw score ${raw} outside [${scale.min}, ${scale.max}]`, {
      raw,
      scale,
    });
  }
  const mid = (scale.min + scale.max) / 2;
  const range = scale.max - scale.min;
  return ((raw - mid) / range) * 4;
}

// Backward-compatibility helper for archived `src/risk` paths. Those historical
// paths pass pre-normalized 0..1 demo scores through raw instrument scales, so
// this alias preserves the old permissive extrapolation behavior. New active
// code must call `scaleRelativeScore` and receives fail-closed validation.
export function zScoreAgainstScale(raw: number, scale: { min: number; max: number }): number {
  const mid = (scale.min + scale.max) / 2;
  const range = scale.max - scale.min;
  if (!Number.isFinite(raw) || !Number.isFinite(mid) || !Number.isFinite(range) || range <= 0) return 0;
  return ((raw - mid) / range) * 4;
}
