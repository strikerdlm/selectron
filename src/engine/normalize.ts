import { SelectronError } from "./errors";

export function normalizeScore(
  raw: number,
  scale: { min: number; max: number },
  higherIsBetter: boolean,
): number {
  if (raw < scale.min || raw > scale.max) {
    throw new SelectronError("E_BAD_SCORE", `score ${raw} outside [${scale.min}, ${scale.max}]`, {
      raw,
      scale,
    });
  }
  const z = (raw - scale.min) / (scale.max - scale.min);
  return higherIsBetter ? z : 1 - z;
}
