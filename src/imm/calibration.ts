// src/imm/calibration.ts
// T31: Tier-C global multiplier back-fit via coordinate descent against K15 Table 1.
// This module reads and writes src/data/imm-priors.json's global_calibration block.
//
// NOTE: this module imports fs from "node:fs" which is only available in the Node/tsx
// runtime (CLI and test contexts). It must NOT be imported in any browser bundle path.
// The Web Worker (T33) imports simulateIMM directly, not this file.

import * as fs from "node:fs";
import * as path from "node:path";

import type { IMMCrewMember, IMMMission } from "./types";
import { simulateIMM } from "./simulate";
import { IMM_KITS } from "./kits";
import { IMM_MISSIONS } from "../data/imm-missions";

// ── K15 Table 1 reference values (ISS 6-month, 6-crew, 100 000 trials) ──────────
export const K15_TABLE1_REF = {
  none:      { tme_mean: 98.3,  chi_mean: 59.2,  pEvac_mean: 66.9, pLocl_mean: 2.89 },
  issHMS:    { tme_mean: 106,   chi_mean: 94.93, pEvac_mean: 5.57, pLocl_mean: 0.44 },
  unlimited: { tme_mean: 106,   chi_mean: 94.98, pEvac_mean: 4.93, pLocl_mean: 0.45 },
} as const;

// ── K15 reference crew profile §III ──────────────────────────────────────────────
// 4M, 2F; 1 CAC_positive; 3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible × 6 EVAs each.
export const K15_REFERENCE_CREW: IMMCrewMember[] = [
  { id:"c1", sex:"male",   contacts:true,  crowns:true,  CAC_positive:true,  abdominal_surgery_history:false, EVA_eligible:true,  EVA_count:6 },
  { id:"c2", sex:"male",   contacts:true,  crowns:true,  CAC_positive:false, abdominal_surgery_history:false, EVA_eligible:true,  EVA_count:6 },
  { id:"c3", sex:"male",   contacts:true,  crowns:false, CAC_positive:false, abdominal_surgery_history:false, EVA_eligible:false, EVA_count:0 },
  { id:"c4", sex:"male",   contacts:false, crowns:false, CAC_positive:false, abdominal_surgery_history:false, EVA_eligible:false, EVA_count:0 },
  { id:"c5", sex:"female", contacts:false, crowns:false, CAC_positive:false, abdominal_surgery_history:false, EVA_eligible:false, EVA_count:0 },
  { id:"c6", sex:"female", contacts:false, crowns:false, CAC_positive:false, abdominal_surgery_history:true,  EVA_eligible:true,  EVA_count:0 },
];

// ── Internal helpers ─────────────────────────────────────────────────────────────

type ScenarioKey = "none" | "issHMS" | "unlimited";

/**
 * Weighted squared-residual score (sum of normalised squared deviations across 4 metrics).
 * Lower = closer to K15 reference.
 */
function scoreResiduals(
  observed: { tme: number; chi: number; pEvac: number; pLocl: number },
  ref: { tme_mean: number; chi_mean: number; pEvac_mean: number; pLocl_mean: number },
): number {
  const dTme   = (observed.tme   - ref.tme_mean)   / Math.max(1,   ref.tme_mean);
  const dChi   = (observed.chi   - ref.chi_mean)   / Math.max(1,   ref.chi_mean);
  const dPevac = (observed.pEvac - ref.pEvac_mean) / Math.max(0.1, ref.pEvac_mean);
  const dPlocl = (observed.pLocl - ref.pLocl_mean) / Math.max(0.1, ref.pLocl_mean);
  return dTme*dTme + dChi*dChi + dPevac*dPevac + dPlocl*dPlocl;
}

/**
 * Run simulateIMM at T=10 000 (cheap proxy) for a given scenario + tier-C multiplier.
 */
function runProxy(
  scenario: ScenarioKey,
  multiplier: number,
  mission: IMMMission,
  seed: number,
): { tme: number; chi: number; pEvac: number; pLocl: number } {
  const kit = IMM_KITS[scenario];
  const out = simulateIMM({
    crew: K15_REFERENCE_CREW,
    mission,
    kit,
    trials: 10_000,
    seed,
    tierCMultiplier: multiplier,
  });
  return {
    tme:   out.tme.mean,
    chi:   out.chi.mean,
    pEvac: out.pEvac.mean,
    pLocl: out.pLocl.mean,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────────

export type CalibrationResult = {
  multipliers: {
    tierC_multiplier_iss_none:      number;
    tierC_multiplier_iss_hms:       number;
    tierC_multiplier_iss_unlimited: number;
  };
  residualsBefore: { none: number; issHMS: number; unlimited: number; total: number };
  residualsAfter:  { none: number; issHMS: number; unlimited: number; total: number };
  fit_residuals_within_CI95: boolean;
  /** True when only the relaxed assertion (residuals decrease) could be met. */
  relaxedAssertion: boolean;
};

// Multiplier search grid — extended to handle large deviations from K15.
const MULTIPLIER_GRID = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 5.0, 8.0, 12.0];
const COORD_DESCENT_ITERS = 3;
const RESIDUAL_CI95_THRESHOLD = 0.2; // total residual threshold for "within CI95"
const SEED = 0xc0ffee;

/**
 * calibrateTierCMultipliers — coordinate-descent back-fit of the three global Tier-C
 * multipliers against K15 Table 1 (ISS 6-month / 6-crew, T=10 000 proxy).
 *
 * @param writeBack  If true, writes results to src/data/imm-priors.json. Default false.
 *                   The CLI wrapper (T32) passes writeBack=true.
 *                   Tests call with default (no file mutation during test runs).
 */
export async function calibrateTierCMultipliers(writeBack = false): Promise<CalibrationResult> {
  const mission = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;

  const scenarios: ScenarioKey[] = ["none", "issHMS", "unlimited"];

  // Compute initial residuals (multiplier = 1.0 for each)
  const initialMultipliers: Record<ScenarioKey, number> = { none: 1.0, issHMS: 1.0, unlimited: 1.0 };
  const scenarioToRefKey = { none: "none", issHMS: "issHMS", unlimited: "unlimited" } as const;

  const residualsBefore: Record<ScenarioKey, number> = { none: 0, issHMS: 0, unlimited: 0 };
  for (const sc of scenarios) {
    const ref = K15_TABLE1_REF[scenarioToRefKey[sc]];
    const obs = runProxy(sc, 1.0, mission, SEED);
    residualsBefore[sc] = scoreResiduals(obs, ref);
  }

  // Per-scenario coordinate descent
  const finalMultipliers: Record<ScenarioKey, number> = { ...initialMultipliers };

  for (const sc of scenarios) {
    const ref = K15_TABLE1_REF[scenarioToRefKey[sc]];
    let bestMult = finalMultipliers[sc];
    let bestRes  = residualsBefore[sc];

    for (let iter = 0; iter < COORD_DESCENT_ITERS; iter++) {
      let improved = false;
      for (const candidate of MULTIPLIER_GRID) {
        const scaled = bestMult * candidate / 1.0; // relative to current best
        const obs    = runProxy(sc, scaled, mission, SEED);
        const res    = scoreResiduals(obs, ref);
        if (res < bestRes) {
          bestRes  = res;
          bestMult = scaled;
          improved = true;
        }
      }
      // Also try absolute grid values (not relative) to escape local traps
      for (const absVal of MULTIPLIER_GRID) {
        const obs = runProxy(sc, absVal, mission, SEED);
        const res = scoreResiduals(obs, ref);
        if (res < bestRes) {
          bestRes  = res;
          bestMult = absVal;
          improved = true;
        }
      }
      if (!improved) break;
    }

    finalMultipliers[sc] = bestMult;
  }

  // Compute final residuals
  const residualsAfter: Record<ScenarioKey, number> = { none: 0, issHMS: 0, unlimited: 0 };
  for (const sc of scenarios) {
    const ref = K15_TABLE1_REF[scenarioToRefKey[sc]];
    const obs = runProxy(sc, finalMultipliers[sc], mission, SEED);
    residualsAfter[sc] = scoreResiduals(obs, ref);
  }

  const totalBefore = residualsBefore.none + residualsBefore.issHMS + residualsBefore.unlimited;
  const totalAfter  = residualsAfter.none  + residualsAfter.issHMS  + residualsAfter.unlimited;
  const withinCI95  = totalAfter < RESIDUAL_CI95_THRESHOLD;
  // Relaxed assertion: calibration improved (residuals decreased) even if not within CI95.
  // TODO(T86): K15 reproduction gate will determine if further calibration is needed.
  const relaxed = !withinCI95;

  const result: CalibrationResult = {
    multipliers: {
      tierC_multiplier_iss_none:      finalMultipliers.none,
      tierC_multiplier_iss_hms:       finalMultipliers.issHMS,
      tierC_multiplier_iss_unlimited: finalMultipliers.unlimited,
    },
    residualsBefore: {
      none:     residualsBefore.none,
      issHMS:   residualsBefore.issHMS,
      unlimited: residualsBefore.unlimited,
      total:    totalBefore,
    },
    residualsAfter: {
      none:     residualsAfter.none,
      issHMS:   residualsAfter.issHMS,
      unlimited: residualsAfter.unlimited,
      total:    totalAfter,
    },
    fit_residuals_within_CI95: withinCI95,
    relaxedAssertion: relaxed,
  };

  if (writeBack) {
    // Resolve path relative to this source file's location in the compiled tree.
    // tsx runs from the project root, so we use a relative path from cwd.
    const priorsPath = path.resolve(process.cwd(), "src/data/imm-priors.json");
    const raw = fs.readFileSync(priorsPath, "utf-8");
    const json = JSON.parse(raw);
    json.global_calibration.tierC_multiplier_iss_none      = finalMultipliers.none;
    json.global_calibration.tierC_multiplier_iss_hms       = finalMultipliers.issHMS;
    json.global_calibration.tierC_multiplier_iss_unlimited = finalMultipliers.unlimited;
    json.global_calibration.fit_residuals_within_CI95      = withinCI95;
    fs.writeFileSync(priorsPath, JSON.stringify(json, null, 2) + "\n", "utf-8");
  }

  return result;
}
