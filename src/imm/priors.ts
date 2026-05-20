// src/imm/priors.ts
import priorsJson from "../data/imm-priors.json";
import type { IMMPrior } from "./types";

export type IMMPriorsFile = {
  schema_version: number;
  calibration_target: string;
  conditions: Record<string, IMMPrior>;
  global_calibration: {
    tierC_multiplier_iss_hms: number;
    tierC_multiplier_iss_none: number;
    tierC_multiplier_iss_unlimited: number;
    fit_against: string;
    fit_residuals_within_CI95: boolean;
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
}

let cached: IMMPriorsFile | null = null;
export function loadIMMPriors(): IMMPriorsFile {
  if (cached) return cached;
  validatePriorsJson(priorsJson);
  cached = priorsJson as unknown as IMMPriorsFile;
  return cached;
}
