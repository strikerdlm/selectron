// scripts/validate_imm.ts
// T35: K15 Table 1 / S20 DRM / TM21 AMM+SMM delta reporter (V&V dossier).
// Runs simulateIMM at T=100k — wall time ~5-10 min.
// Usage: npm run validate:imm
// Prints per-scenario delta vs reference values.
// Do NOT commit any output logs — this script is the audit artifact.

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

// TM21 AMM and SMM placeholder targets:
// AMM (426d, 4-crew, 60 EVAs): expected pEVAC ~ 25-40%, pLOCL ~ 5-12%
// SMM (923d, 4-crew, 401 EVAs): expected pEVAC ~ 40-65%, pLOCL ~ 15-30%
// Validation gates will be added in T87 (P5).
console.log("\n=== TM21 AMM/SMM aggregate reproduction (T=100k) ===\n");
const TM21_CREW = K15_REFERENCE_CREW.slice(0, 4); // 4-person crew for Mars
for (const missionId of ["amm-426d", "smm-923d"] as const) {
  const mission = IMM_MISSIONS.find(m => m.id === missionId)!;
  const t0 = Date.now();
  const out = simulateIMM({ crew: TM21_CREW, mission, kit: IMM_KITS.issHMS, trials: T, seed: SEED });
  const t1 = Date.now();
  console.log(`-- ${missionId} (${mission.durationDays}d, 4-crew, ${mission.totalEVAs} EVAs) --`);
  console.log(`Wall: ${((t1 - t0) / 1000).toFixed(1)}s`);
  console.log(`TME ${out.tme.mean.toFixed(1)}  CHI ${out.chi.mean.toFixed(2)}  pEVAC ${out.pEvac.mean.toFixed(2)}%  pLOCL ${out.pLocl.mean.toFixed(2)}%`);
  console.log();
}
