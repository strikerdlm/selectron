// src/imm/priors.ts
import priorsJson from "../data/imm-priors.json";
import type { IMMMissionKind, IMMPrior } from "./types";

export type IMMPriorsFile = {
  schema_version: number;
  calibration_target: string;
  conditions: Record<string, IMMPrior>;
  global_calibration: {
    // Per-scenario Tier-C multipliers (T31 legacy; dormant — read only by
    // `calibrateTierCMultipliers()` back-fit routine, not by simulateIMM at
    // runtime). Kept for backward compatibility; prefer the rev3-b single-value
    // tier multipliers below.
    tierC_multiplier_iss_hms: number;
    tierC_multiplier_iss_none: number;
    tierC_multiplier_iss_unlimited: number;
    // priors-rev3-b: single-value global incidence multipliers per tier, applied
    // by simulateIMM as defaults when caller's opts don't override.
    // Physically: incidence is sampled *before* any kit is applied, so the
    // multiplier is scenario-invariant. Per-scenario tuning above was a
    // calibration hack; these single-value fields are the principled replacement.
    tierA_multiplier?: number;
    tierB_multiplier?: number;
    tierC_multiplier?: number;
    fit_against: string;
    fit_residuals_within_CI95: boolean;
    /**
     * 2026-06-04 Antarctic / controlled-habitat context modulation. Per-(kind,
     * condition) incidence multiplier. Multiplier of 1.0 = no change vs. base
     * prior. >1 = elevated rate, <1 = reduced, 0 = no events.
     *
     * Applied AFTER the tier multiplier (tierA/B/C) and BEFORE risk-factor and
     * Stage-A multipliers. Falls through to 1.0 for any (kind, condition) pair
     * not listed. This means:
     *   - K15 ISS runs (kind: "leo-iss") are unaffected.
     *   - Persisted Dexie `IMMSession` rows with the legacy `analog-isolation`
     *     kind load with no multiplier change and reproduce the pre-change run.
     *
     * Anchored on `research/analog_incidence_antarctic.md` (Bhatia 2012,
     * Palinkas 2004, Pattarini 2016, Hong 2022, Peřina 2024, Nirwan 2022).
     */
    kind_multipliers?: Partial<Record<IMMMissionKind, Record<string, number>>>;
  };
};

export function validatePriorsJson(obj: unknown): asserts obj is IMMPriorsFile {
  if (!obj || typeof obj !== "object") throw new Error("E_BAD_PRIORS: not an object");
  const p = obj as Record<string, unknown>;
  if (p.schema_version !== 1) throw new Error("E_BAD_PRIORS: schema_version must be 1");
  if (!p.conditions || typeof p.conditions !== "object") {
    throw new Error("E_BAD_PRIORS: conditions must be an object");
  }
  for (const [id, raw] of Object.entries(p.conditions as Record<string, unknown>)) {
    const c = raw as Record<string, unknown>;
    if (typeof c.provenance !== "string") throw new Error(`E_BAD_PRIORS: ${id} missing provenance`);
    if (typeof c.source_ref !== "string") throw new Error(`E_BAD_PRIORS: ${id} missing source_ref`);
  }
  // kind_multipliers is optional; if present, must be an object of objects with numeric values.
  const gc = (p as { global_calibration?: Record<string, unknown> }).global_calibration;
  if (gc && gc.kind_multipliers !== undefined) {
    if (typeof gc.kind_multipliers !== "object" || gc.kind_multipliers === null) {
      throw new Error("E_BAD_PRIORS: global_calibration.kind_multipliers must be an object");
    }
    for (const [kind, perKind] of Object.entries(gc.kind_multipliers as Record<string, unknown>)) {
      if (typeof perKind !== "object" || perKind === null) {
        throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind} must be an object`);
      }
      for (const [cond, mult] of Object.entries(perKind as Record<string, unknown>)) {
        // Skip documentation sentinel keys (e.g. `_doc_`); they live alongside
        // the per-condition multipliers so the JSON file is self-describing.
        if (cond.startsWith("_")) continue;
        if (typeof mult !== "number" || !Number.isFinite(mult) || mult < 0) {
          throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind}.${cond} must be a non-negative finite number`);
        }
      }
    }
  }
}

let cached: IMMPriorsFile | null = null;
export function loadIMMPriors(): IMMPriorsFile {
  if (cached) return cached;
  validatePriorsJson(priorsJson);
  cached = priorsJson as unknown as IMMPriorsFile;
  return cached;
}
