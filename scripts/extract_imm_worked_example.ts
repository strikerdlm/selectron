// scripts/extract_imm_worked_example.ts
//
// Pre-computes the IMM Calculator outputs needed for manuscript figures F6
// (NASA HSRB LxC verdict) and F7 (multi-mission comparison). Outputs land in
// `paper/figures/imm-worked-example.json` and are loaded synchronously by the
// `paper-F6-imm` / `paper-F7-imm` TestFigureHost fixtures so the Playwright
// snapshot tests don't need to wait for in-browser Monte Carlo.
//
// Replaces the Iter-3 `src/risk/`-backed extraction in
// `scripts/extract_worked_example.ts` for the F6 + F7 figures. The Iter-3
// script is preserved for F3 / F4 (Stage A) which remain unchanged.
//
// Canonical inputs:
//   crew    = K15 reference crew (4M 2F; 1 CAC+; 3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible × 6 EVAs)
//   seed    = 0xc0ffee
//   F6: mission = iss-6mo (K15 reference), kit = ISS HMS, T = 100 000
//   F7: missions = 6 representative Earth-analog + LEO-ISS profiles, kit = ISS HMS, T = 25 000
//
// Run: npx tsx scripts/extract_imm_worked_example.ts
// Output: paper/figures/imm-worked-example.json

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { assessIMMLxC } from "../src/imm/lxc";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_REFERENCE_CREW, K15_TABLE1_REF } from "../src/imm/calibration";
import type { IMMMission, IMMOutcome } from "../src/imm/types";

const SEED = 0xc0ffee;
const T_F6 = 100_000;
const T_F7 = 25_000;

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;

// ── F6: LxC verdict for K15 crew × ISS HMS × iss-6mo at T = 100 000 ───────

console.log(`\n=== F6 extraction: iss-6mo × ISS HMS at T = ${T_F6.toLocaleString()} ===\n`);
const f6_t0 = Date.now();
const f6_outcome = simulateIMM({
  crew: K15_REFERENCE_CREW,
  mission: iss6,
  kit: IMM_KITS.issHMS,
  trials: T_F6,
  seed: SEED,
});
const f6_t1 = Date.now();
const f6_assessment = assessIMMLxC(f6_outcome);
console.log(`  wall=${((f6_t1 - f6_t0) / 1000).toFixed(1)}s`);
console.log(`  TME=${f6_outcome.tme.mean.toFixed(2)}   CHI=${f6_outcome.chi.mean.toFixed(2)}   pEVAC=${f6_outcome.pEvac.mean.toFixed(2)}%   pLOCL=${f6_outcome.pLocl.mean.toFixed(2)}%`);
console.log(`  HSRB LxC: L${f6_assessment.likelihood} × C${f6_assessment.consequence} = ${f6_assessment.score} (${f6_assessment.color})`);

// ── F7: multi-mission comparison at T = 25 000 ─────────────────────────────

const F7_MISSION_IDS = [
  "iss-6mo",         // K15 reference (180d, 6-crew)
  "iss-drm1",        // S20 DRM1 (365d)
  "mdrs-2wk",        // Earth analog short
  "hi-seas-45d",     // Earth analog medium
  "hi-seas-90d",     // Earth analog long
  "antarctic-winter", // Earth analog 12-person 365d
  "mars500",         // 520d analog isolation
] as const;

console.log(`\n=== F7 extraction: ${F7_MISSION_IDS.length} missions × ISS HMS at T = ${T_F7.toLocaleString()} ===\n`);

type F7Row = {
  missionId: string;
  missionLabel: string;
  durationDays: number;
  crewSize: number;
  tme_mean: number;
  chi_mean: number;
  chi_ci95: [number, number];
  pEvac_mean: number;
  pEvac_ci95: [number, number];
  pLocl_mean: number;
  pLocl_ci95: [number, number];
  missionSuccess_mean: number;
};

const f7_rows: F7Row[] = [];
for (const id of F7_MISSION_IDS) {
  const m: IMMMission = IMM_MISSIONS.find(x => x.id === id)!;
  // For analog missions, scale the K15 reference crew to the mission's crew size.
  // Use the first `crewSize` members of the K15 reference crew.
  const crew = K15_REFERENCE_CREW.slice(0, m.crewSize);
  // Pad if mission requires more crew than K15 reference provides (antarctic-winter has 12).
  while (crew.length < m.crewSize) {
    const i = crew.length;
    crew.push({
      ...K15_REFERENCE_CREW[i % K15_REFERENCE_CREW.length],
      id: `k15-padded-${i}`,
    });
  }
  const t0 = Date.now();
  const out: IMMOutcome = simulateIMM({
    crew,
    mission: m,
    kit: IMM_KITS.issHMS,
    trials: T_F7,
    seed: SEED,
  });
  const t1 = Date.now();
  console.log(`  ${id.padEnd(20)} (${m.durationDays}d, ${m.crewSize}-crew)  wall=${((t1 - t0) / 1000).toFixed(1)}s   CHI=${out.chi.mean.toFixed(2)}   MSP=${out.missionSuccess.mean.toFixed(1)}%`);
  f7_rows.push({
    missionId: id,
    missionLabel: m.label,
    durationDays: m.durationDays,
    crewSize: m.crewSize,
    tme_mean: out.tme.mean,
    chi_mean: out.chi.mean,
    chi_ci95: [out.chi.ci95[0], out.chi.ci95[1]],
    pEvac_mean: out.pEvac.mean,
    pEvac_ci95: [out.pEvac.ci95[0], out.pEvac.ci95[1]],
    pLocl_mean: out.pLocl.mean,
    pLocl_ci95: [out.pLocl.ci95[0], out.pLocl.ci95[1]],
    missionSuccess_mean: out.missionSuccess.mean,
  });
}

// ── serialize ──────────────────────────────────────────────────────────────

const payload = {
  generated: new Date().toISOString(),
  commit: "v0.5.x (regenerate via scripts/extract_imm_worked_example.ts)",
  seed: SEED,
  f6: {
    trials: T_F6,
    mission: { id: iss6.id, label: iss6.label, durationDays: iss6.durationDays, crewSize: iss6.crewSize },
    kit: { scenarioId: "issHMS", label: IMM_KITS.issHMS.label },
    crew_label: "K15 reference (4M 2F; 1 CAC+; 3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible × 6 EVAs)",
    outcome: {
      tme_mean: f6_outcome.tme.mean,
      chi_mean: f6_outcome.chi.mean,
      pEvac_mean: f6_outcome.pEvac.mean,
      pLocl_mean: f6_outcome.pLocl.mean,
      missionSuccess_mean: f6_outcome.missionSuccess.mean,
    },
    assessment: {
      likelihood: f6_assessment.likelihood,
      likelihoodLabel: f6_assessment.likelihoodLabel,
      likelihoodDefinition: f6_assessment.likelihoodDefinition,
      consequence: f6_assessment.consequence,
      consequenceLabel: f6_assessment.consequenceLabel,
      consequenceDefinition: f6_assessment.consequenceDefinition,
      score: f6_assessment.score,
      color: f6_assessment.color,
      pMissionFailure: f6_assessment.pMissionFailure,
      fractionLost: f6_assessment.fractionLost,
    },
    k15_reference: K15_TABLE1_REF.issHMS,
  },
  f7: {
    trials: T_F7,
    kit: { scenarioId: "issHMS", label: IMM_KITS.issHMS.label },
    crew_label: "K15 reference crew (scaled to each mission's crew size)",
    rows: f7_rows,
  },
};

const serialized = JSON.stringify(payload, null, 2);
writeFileSync("paper/figures/imm-worked-example.json", serialized);
writeFileSync("src/data/imm-worked-example.json", serialized); // in-bundle copy for TestFigureHost import
console.log(`\nWrote paper/figures/imm-worked-example.json AND src/data/imm-worked-example.json (${F7_MISSION_IDS.length + 1} simulation rows).\n`);
