// scripts/diagnose_tm21_gap.ts
//
// TM21 generalization gap diagnostic (advisor 2026-05-22):
// Mars Mission Reference DRMs predict pLOCL 5-12% (AMM 426d) and 15-30% (SMM 923d).
// Our model with rev3-b calibration produces pLOCL 0.41% (AMM) and 0.95% (SMM) —
// 12-30× LOW. A blanket per-event probability rescale (rev3-c) cannot account
// for a 12-30× factor.
//
// Hypotheses from advisor:
//  (a) SPE handling for deep-space transits (vs LEO)
//  (b) Treatment-decision degradation under comms delay (not modelled)
//  (c) Cumulative-dose conditions (renal stones, radiation cataract) over 400+ days
//  (d) EVA risk profile differences (Mars surface ≠ ISS)
//
// This script identifies which conditions account for the pLOCL gap in AMM/SMM
// vs ISS-6mo. If a few conditions dominate (e.g., radiation, sepsis, ARS) the
// fix is targeted; if it's spread thinly across many conditions, the model is
// structurally wrong for long-duration deep-space transits.
//
// Output: per-condition pLOCL contribution sorted desc, for ISS-6mo vs AMM vs SMM.
//
// Usage: npx tsx scripts/diagnose_tm21_gap.ts

import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { loadIMMPriors } from "../src/imm/priors";

const SEED = 0xc0ffee;
const T = 10_000; // fast proxy for diagnostic

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const amm  = IMM_MISSIONS.find(m => m.id === "amm-426d")!;
const smm  = IMM_MISSIONS.find(m => m.id === "smm-923d")!;

const priors = loadIMMPriors();
const provenance = new Map<string, string>();
for (const [cid, p] of Object.entries(priors.conditions)) provenance.set(cid, p.provenance);
const family = new Map<string, string>();
for (const c of IMM_CONDITIONS) family.set(c.id, c.family);

const TM21_CREW = K15_REFERENCE_CREW.slice(0, 4); // 4-person Mars crew

function runMission(label: string, mission: typeof iss6, kit: typeof IMM_KITS.issHMS, crew: typeof K15_REFERENCE_CREW) {
  const out = simulateIMM({
    crew, mission, kit, trials: T, seed: SEED,
  });
  console.log(`\n=== ${label} ===`);
  console.log(`  TME=${out.tme.mean.toFixed(2)}  CHI=${out.chi.mean.toFixed(2)}  pEVAC=${out.pEvac.mean.toFixed(2)}%  pLOCL=${out.pLocl.mean.toFixed(2)}%`);
  console.log(`\n  Top 15 conditions by pLOCL contribution (% of total pLOCL):`);
  console.log(`    ${"conditionId".padEnd(50)} ${"tier".padEnd(12)} ${"family".padEnd(20)}  pLOCL    %`);
  const totalPlocl = out.perConditionDrivers.reduce((a, d) => a + d.pLoclContrib, 0);
  for (const d of [...out.perConditionDrivers].sort((a, b) => b.pLoclContrib - a.pLoclContrib).slice(0, 15)) {
    if (d.pLoclContrib === 0) continue;
    const tier = provenance.get(d.conditionId) ?? "?";
    const fam = family.get(d.conditionId) ?? "?";
    const pct = totalPlocl > 0 ? (100 * d.pLoclContrib / totalPlocl).toFixed(1) : "0.0";
    console.log(`    ${d.conditionId.padEnd(50)} ${tier.padEnd(12)} ${fam.padEnd(20)}  ${d.pLoclContrib.toFixed(3).padStart(6)}  ${pct.padStart(4)}%`);
  }
  console.log(`\n  Top 15 conditions by pEVAC contribution:`);
  console.log(`    ${"conditionId".padEnd(50)} ${"tier".padEnd(12)} ${"family".padEnd(20)}  pEVAC    %`);
  const totalPevac = out.perConditionDrivers.reduce((a, d) => a + d.pEvacContrib, 0);
  for (const d of [...out.perConditionDrivers].sort((a, b) => b.pEvacContrib - a.pEvacContrib).slice(0, 15)) {
    if (d.pEvacContrib === 0) continue;
    const tier = provenance.get(d.conditionId) ?? "?";
    const fam = family.get(d.conditionId) ?? "?";
    const pct = totalPevac > 0 ? (100 * d.pEvacContrib / totalPevac).toFixed(1) : "0.0";
    console.log(`    ${d.conditionId.padEnd(50)} ${tier.padEnd(12)} ${fam.padEnd(20)}  ${d.pEvacContrib.toFixed(3).padStart(6)}  ${pct.padStart(4)}%`);
  }
}

runMission(`ISS 6mo / 6-crew / issHMS`, iss6, IMM_KITS.issHMS, K15_REFERENCE_CREW);
runMission(`Mars AMM 426d / 4-crew / issHMS`, amm, IMM_KITS.issHMS, TM21_CREW);
runMission(`Mars SMM 923d / 4-crew / issHMS`, smm, IMM_KITS.issHMS, TM21_CREW);
