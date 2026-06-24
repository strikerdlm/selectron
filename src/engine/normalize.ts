import { SelectronError } from "./errors";

export function normalizeScore(
  raw: number,
  scale: { min: number; max: number },
  higherIsBetter: boolean,
): number {
  if (!Number.isFinite(raw)) {
    throw new SelectronError("E_BAD_SCORE", `score must be finite, got ${raw}`, { raw, scale });
  }
  if (!Number.isFinite(scale.min) || !Number.isFinite(scale.max) || scale.max <= scale.min) {
    throw new SelectronError(
      "E_BAD_SCORE",
      `score scale must have finite min < max, got [${scale.min}, ${scale.max}]`,
      { raw, scale },
    );
  }
  if (raw < scale.min || raw > scale.max) {
    throw new SelectronError("E_BAD_SCORE", `score ${raw} outside [${scale.min}, ${scale.max}]`, {
      raw,
      scale,
    });
  }
  const z = (raw - scale.min) / (scale.max - scale.min);
  return higherIsBetter ? z : 1 - z;
}
