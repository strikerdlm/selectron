// scripts/sweep_tier_multipliers.ts
//
// IMM-priors-rev3-b: 1-D coarse sweep over tier-B multiplier values to find
// the K15-best fit. Diagnostic showed tier-B is ~65% of TME (~97 of 150 events)
// and tier-A is ~28% (~42, ≈ target proportion); so scaling tier-B alone is
// the natural single-knob. tier-C is only 7.5% — left at 1.0 unless residual
// emerges.
//
// At T=10 000 trials × 5 candidate values × 3 scenarios = ~15 simulateIMM
// calls. ~30-60 s wall-clock total.
//
// Usage: npx tsx scripts/sweep_tier_multipliers.ts

import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";

const SEED = 0xc0ffee;
const T = 10_000; // fast proxy; T=100k confirmation comes next via validate_imm

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const tierBCandidates = [0.40, 0.50, 0.55, 0.60, 0.65, 0.70];
const tierACandidates = [1.0]; // fix at 1.0 (diagnostic shows tier-A is approximately right)
const tierCCandidates = [1.0]; // fix at 1.0

console.log(`\n=== Tier-multiplier sweep (T=${T}, seed=${SEED}) ===\n`);
console.log(`tierA × tierB × tierC | scenario    | TME (Δ vs K15)         | CHI (Δ)           | pEVAC (Δ)`);
console.log(`---------------------- |-------------|-------------------------|-------------------|------------`);

let bestTotal = Infinity;
let bestTriple: [number, number, number] = [1, 1, 1];

for (const tA of tierACandidates) {
  for (const tB of tierBCandidates) {
    for (const tC of tierCCandidates) {
      let total = 0;
      const lines: string[] = [];
      for (const scenarioId of Object.keys(K15_TABLE1_REF) as Array<keyof typeof K15_TABLE1_REF>) {
        const ref = K15_TABLE1_REF[scenarioId];
        const kit = IMM_KITS[scenarioId as keyof typeof IMM_KITS];
        const out = simulateIMM({
          crew: K15_REFERENCE_CREW,
          mission: iss6,
          kit,
          trials: T,
          seed: SEED,
          tierAMultiplier: tA,
          tierBMultiplier: tB,
          tierCMultiplier: tC,
        });
        const dTme = out.tme.mean - ref.tme_mean;
        const dChi = out.chi.mean - ref.chi_mean;
        const dPe  = out.pEvac.mean - ref.pEvac_mean;
        // Normalised squared-residual (same weighting as calibration.ts scoreResiduals).
        const r = (dTme / ref.tme_mean) ** 2 +
                  (dChi / ref.chi_mean) ** 2 +
                  (dPe  / Math.max(0.1, ref.pEvac_mean)) ** 2;
        total += r;
        lines.push(
          `${tA.toFixed(2)} × ${tB.toFixed(2)} × ${tC.toFixed(2)}   | ${scenarioId.padEnd(11)} | ${out.tme.mean.toFixed(2).padStart(6)} (Δ ${dTme >= 0 ? "+" : ""}${dTme.toFixed(2).padStart(6)}) | ${out.chi.mean.toFixed(2).padStart(6)} (Δ ${dChi >= 0 ? "+" : ""}${dChi.toFixed(2).padStart(6)}) | ${out.pEvac.mean.toFixed(2).padStart(5)}% (Δ ${dPe >= 0 ? "+" : ""}${dPe.toFixed(2).padStart(5)})`
        );
      }
      console.log(lines.join("\n") + `   |  total residual: ${total.toFixed(4)}`);
      console.log("");
      if (total < bestTotal) {
        bestTotal = total;
        bestTriple = [tA, tB, tC];
      }
    }
  }
}

console.log(`\n=== BEST: tierA=${bestTriple[0]}, tierB=${bestTriple[1]}, tierC=${bestTriple[2]} (residual ${bestTotal.toFixed(4)}) ===`);
