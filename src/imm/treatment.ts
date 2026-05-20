// src/imm/treatment.ts — RAF-based Beta-Pert distribution shifting (K15 §II.B.7 Fig 3)
import type { IMMBetaPert } from "./types";

/**
 * interpolateBetaPertByRAF — linearly interpolates between treated and untreated
 * Beta-Pert parameter sets using the Resource Availability Factor (RAF).
 *
 * RAF = 1 → fully treated (best case for the patient)
 * RAF = 0 → untreated (no resources available)
 *
 * Each component: r * treated + (1 - r) * untreated
 * RAF is clamped to [0, 1].
 */
export function interpolateBetaPertByRAF(
  treated: IMMBetaPert,
  untreated: IMMBetaPert,
  raf: number,
): IMMBetaPert {
  const r = Math.min(1, Math.max(0, raf));
  return {
    min:  r * treated.min  + (1 - r) * untreated.min,
    mode: r * treated.mode + (1 - r) * untreated.mode,
    max:  r * treated.max  + (1 - r) * untreated.max,
  };
}
