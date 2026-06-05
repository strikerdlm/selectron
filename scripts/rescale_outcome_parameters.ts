#!/usr/bin/env tsx
/**
 * Outcome parameter closed-form rescale (rev3-f-followup)
 *
 * ATTEMPTED 2026-05-26 and REVERTED — preserved for sensitivity analysis.
 *
 * Scales per-condition p_evac and p_locl Beta-Pert distributions uniformly
 * to close the K15 'none' / 'unlimited' pEVAC/pLOCL gaps.
 *
 * Scalar derivation:
 *   P(any EVAC) = 1 - prod(1 - p_i) ≈ 1 - exp(-Σ p_i)
 *   Σ p_i_target = -ln(1 - P_target)
 *   Σ p_i_current = -ln(1 - P_current)
 *   s = Σ p_i_target / Σ p_i_current
 *
 * Using post-rev3-f validation (T=100k, seed 0xc0ffee):
 *   none      pEVAC 12.25% → 66.90%  s_untreated_p_evac = 8.42
 *   unlimited pEVAC  1.59% →  4.93%  s_treated_p_evac   = 3.16
 *   none      pLOCL  0.24% →  2.89%  s_untreated_p_locl = 12.21
 *   unlimited pLOCL  0.20% →  0.45%  s_treated_p_locl   = 2.26
 *
 * REVERT REASON: the rescale fixes 'none' and 'unlimited' but catastrophically
 * breaks issHMS pEVAC (9.65% → 53.39%, target 5.57%) via RAF-interpolated
 * fall-through coupling — exactly as predicted in
 * docs/iter5_scientific_limitations.md §3.5 rationale #4.
 *
 * Usage: npx tsx scripts/rescale_outcome_parameters.ts [--dry-run]
 */

import * as fs from "node:fs";
import * as path from "node:path";

const PRIORS_PATH = path.resolve(process.cwd(), "src/data/imm-priors.json");

const SCALARS = {
  untreated: { p_evac: 8.42, p_locl: 12.21 },
  treated:   { p_evac: 3.16, p_locl: 2.26 },
} as const;

interface BetaPert {
  min: number;
  mode: number;
  max: number;
}

function rescaleBetaPert(pert: BetaPert, scalar: number): BetaPert {
  const rawMode = pert.mode * scalar;
  const rawMax = pert.max * scalar;
  const rawMin = pert.min * scalar;

  if (rawMode <= 1.0) {
    // No capping needed — preserve exact ratios
    return { min: rawMin, mode: rawMode, max: rawMax };
  }

  // Capping required: clamp max to 1.0, mode to 0.99, min proportionally
  const newMax = Math.min(rawMax, 1.0);
  const newMode = Math.min(rawMode, 0.99);
  const newMin = Math.min(rawMin, newMode * 0.5); // keep min well below mode
  return { min: Math.max(0, newMin), mode: newMode, max: newMax };
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  const priors = JSON.parse(fs.readFileSync(PRIORS_PATH, "utf8"));
  const conditions = priors.conditions as Record<string, any>;

  let changes = 0;
  let capped = 0;

  for (const [id, cond] of Object.entries(conditions)) {
    for (const path of ["untreated", "treated"] as const) {
      for (const param of ["p_evac", "p_locl"] as const) {
        const scalar = SCALARS[path][param];
        const oldVal = cond[path][param] as BetaPert;
        const newVal = rescaleBetaPert(oldVal, scalar);

        if (
          oldVal.min !== newVal.min ||
          oldVal.mode !== newVal.mode ||
          oldVal.max !== newVal.max
        ) {
          if (!dryRun) {
            cond[path][param] = newVal;
          }
          changes++;
          if (oldVal.mode * scalar > 1.0) capped++;
        }
      }
    }
  }

  if (!dryRun) {
    // Append a one-line note to the global_calibration block
    const note = `rev3-f-followup (2026-05-26): p_evac/p_locl Beta-Pert closed-form rescale — untreated s_evac=${SCALARS.untreated.p_evac} s_locl=${SCALARS.untreated.p_locl}; treated s_evac=${SCALARS.treated.p_evac} s_locl=${SCALARS.treated.p_locl}`;
    if (!priors.global_calibration.notes) priors.global_calibration.notes = [];
    priors.global_calibration.notes.push(note);

    fs.writeFileSync(PRIORS_PATH, JSON.stringify(priors, null, 2) + "\n");
  }

  console.log(`[${dryRun ? "DRY-RUN" : "LIVE"}] Rescale complete: ${changes} parameter distributions would be updated (${capped} capped at 1.0).`);
  if (!dryRun) {
    console.log(`Note appended to global_calibration.notes.`);
  }
}

main();
