// scripts/validate_imm.ts
// T35: K15 Table 1 reproduction reporter (V&V dossier).
// Runs simulateIMM at T=100k against the 3 ISS / no-Mars K15 scenarios — wall time ~3-5 min.
// Usage: npm run validate:imm
// Prints per-scenario delta vs reference values.
// Do NOT commit any output logs — this script is the audit artifact.
//
// SCOPE: ISS-baseline only. The TM21 AMM/SMM (Mars) cross-walk that this
// script previously ran was REMOVED in the 2026-05-22 analog-scope-down
// (commit message reference: see STATUS.md audit log for that date). The
// Mars DRMs remain in src/data/imm-missions.ts tagged
// kind: "interplanetary-mars-future" — re-enable this script's Mars
// section after the engine extensions in docs/future_features.md land
// (comms-delay treatment degradation; cumulative-dose pathways;
// Mars-EVA risk profile).

import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";

const SEED = 0xc0ffee;
const T = 100_000;

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;

console.log("\n=== K15 Table 1 reproduction (ISS 6mo / 6 crew, T=100k) ===\n");
for (const scenarioId of Object.keys(K15_TABLE1_REF) as Array<keyof typeof K15_TABLE1_REF>) {
  const ref = K15_TABLE1_REF[scenarioId];
  const kit = IMM_KITS[scenarioId as keyof typeof IMM_KITS];
  console.log(`-- ${scenarioId} -----------------------------------------`);
  const t0 = Date.now();
  const out = simulateIMM({ crew: K15_REFERENCE_CREW, mission: iss6, kit, trials: T, seed: SEED });
  const t1 = Date.now();
  console.log(`Wall: ${((t1 - t0) / 1000).toFixed(1)}s`);
  console.log(`TME:   ${out.tme.mean.toFixed(2)}   vs ref ${ref.tme_mean.toFixed(2)}   Δ ${(out.tme.mean - ref.tme_mean).toFixed(2)}`);
  console.log(`CHI:   ${out.chi.mean.toFixed(2)}   vs ref ${ref.chi_mean.toFixed(2)}   Δ ${(out.chi.mean - ref.chi_mean).toFixed(2)}`);
  console.log(`pEVAC: ${out.pEvac.mean.toFixed(2)}% vs ref ${ref.pEvac_mean.toFixed(2)}% Δ ${(out.pEvac.mean - ref.pEvac_mean).toFixed(2)}`);
  console.log(`pLOCL: ${out.pLocl.mean.toFixed(2)}% vs ref ${ref.pLocl_mean.toFixed(2)}% Δ ${(out.pLocl.mean - ref.pLocl_mean).toFixed(2)}`);
  console.log();
}

console.log("\n=== Mars TM21 AMM/SMM cross-walk: REMOVED (out of scope) ===");
console.log("The Mars DRMs are catalogued in src/data/imm-missions.ts but tagged");
console.log("kind: 'interplanetary-mars-future' and EXCLUDED from this validation");
console.log("script and from the CrewComposition UI picker. The IMM engine does");
console.log("not yet model the structural risk drivers required for");
console.log("interplanetary missions (comms-delay treatment degradation,");
console.log("cumulative-dose pathways, Mars-EVA risk profile). See");
console.log("docs/future_features.md for the implementation roadmap and");
console.log("docs/iter5_scientific_limitations.md §4 for the underlying analysis.");
console.log();
