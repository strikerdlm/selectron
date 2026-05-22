// scripts/validate_imm_explicit_baseline.ts
//
// REPRODUCIBILITY CHECK (advisor 2026-05-22):
// validate_imm with explicit {tierA, tierB, tierC} = {1, 1, 1} — overrides
// the auto-loaded calibration from imm-priors.json. If the resulting numbers
// match the pre-rev3-b baseline exactly (commit cdef5e5 outputs in
// exports/2026-05-22_validate_imm_rev3a_post_normalization.txt), then the
// stochastic-rounding fix + auto-load mechanism preserves determinism.
//
// If they DIFFER from baseline, the rev3-b commits silently shifted the
// RNG stream further than the multiplier path alone.
//
// Usage: npx tsx scripts/validate_imm_explicit_baseline.ts

import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";

const SEED = 0xc0ffee;
const T = 100_000;

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;

console.log("\n=== Reproducibility check: explicit {1, 1, 1} vs pre-rev3-b baseline ===\n");
console.log("Expected (from exports/2026-05-22_validate_imm_rev3a_post_normalization.txt — pre-rev3-b state):");
console.log("  none      TME=149.40  CHI=48.87  pEVAC=19.36%  pLOCL=0.67%");
console.log("  issHMS    TME=150.86  CHI=60.79  pEVAC=12.82%  pLOCL=0.31%");
console.log("  unlimited TME=152.17  CHI=92.98  pEVAC=2.49%   pLOCL=0.26%");
console.log();
console.log("(Earlier audit-log entries quoted unlimited pEVAC=8.89% as 'pre-rev3-b' — that was actually pre-rev3-a (rev2 state) before resource normalization fixed kit fall-through. The rev3-a baseline that rev3-b modified was 2.49%.)");
console.log();

for (const scenarioId of Object.keys(K15_TABLE1_REF) as Array<keyof typeof K15_TABLE1_REF>) {
  const kit = IMM_KITS[scenarioId as keyof typeof IMM_KITS];
  const t0 = Date.now();
  const out = simulateIMM({
    crew: K15_REFERENCE_CREW,
    mission: iss6,
    kit,
    trials: T,
    seed: SEED,
    tierAMultiplier: 1.0,
    tierBMultiplier: 1.0,
    tierCMultiplier: 1.0,
  });
  const t1 = Date.now();
  console.log(`-- ${scenarioId} (wall ${((t1 - t0) / 1000).toFixed(1)}s) --`);
  console.log(`  TME=${out.tme.mean.toFixed(2)}  CHI=${out.chi.mean.toFixed(2)}  pEVAC=${out.pEvac.mean.toFixed(2)}%  pLOCL=${out.pLocl.mean.toFixed(2)}%`);
}
