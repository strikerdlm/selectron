// scripts/variable_sweep_4vars.ts
//
// 2026-06-05 (Diego): "create a /loop of simulations with the model with
// different variables with 50k iterations and complete a report that
// analyzes all the variable behaviors and analyze its outputs and logic
// if they are consistent with literature."
//
// 4-variable MCMC sweep of simulateIMM:
//   V1 mission kind      : analog-controlled, leo-iss, interplanetary-mars-future
//   V2 crew archetype    : screened (GOOD), unscreened (BAD)
//   V3 medical kit       : none, medium (Antarctic), unlimited (ISS-HMS)
//   V4 mission duration  : 22, 45, 90, 180, 365 d
// 3 x 2 x 3 x 5 = 90 cells x T=50 000 = 4 500 000 trials.
// Seed 0xc0ffee at the run level; per-cell seed = SEED + cellIndex.
// Output JSON: /root/repos/exports/2026-06-05_data_variable-sweep-4vars.json
//
// Usage: npx tsx scripts/variable_sweep_4vars.ts
//   env T (default 50_000), SEED (default 0xc0ffee)

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { IMMCrewMember, IMMMission } from "../src/imm/types";

const T = Number(process.env.T ?? 50_000);
const SEED = Number(process.env.SEED ?? 0xc0ffee);
const kit = IMM_KITS.medium;

// ── crews (identical to scripts/duration_study_screened_vs_unscreened.ts) ───
function makeMember(id: string, fraction: number, ov: Record<string, number>): IMMCrewMember {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const r = c.scale.max - c.scale.min;
    scores[c.id] = c.higherIsBetter ? c.scale.min + fraction * r : c.scale.max - fraction * r;
  }
  Object.assign(scores, ov);
  return {
    id, sex: "male", contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2, stageAScores: scores,
  };
}
const BAD = {
  "psych.emotional_stability": 0, "psych.conscientiousness": 0,
  "professional.technical_competence": 1, "psych.mmpi2rf_eid": 90,
  "cognitive.nasa_cognition_battery": -2.5,
};
const GOOD = {
  "psych.emotional_stability": 90, "psych.conscientiousness": 90,
  "professional.technical_competence": 9, "psych.mmpi2rf_eid": 35,
  "cognitive.nasa_cognition_battery": 1.0,
};
const crews = {
  screened:   Array.from({ length: 6 }, (_, i) => makeMember(`s${i + 1}`, 0.5, GOOD)),
  unscreened: Array.from({ length: 6 }, (_, i) => makeMember(`u${i + 1}`, 0.5, BAD)),
};

// ── missions ────────────────────────────────────────────────────────────────
const catalog = (id: string) => IMM_MISSIONS.find((m) => m.id === id)!;
const evaEvery = (days: number, n: number) =>
  Array.from({ length: n }, (_, i) => Math.round(((i + 1) * days) / (n + 1)));
const synth = (id: string, kind: "analog-controlled" | "leo-iss" | "interplanetary-mars-future",
               days: number, evas: number): IMMMission => ({
  id, label: `${days}-day ${kind} (synthetic)`, kind, durationDays: days,
  crewSize: 6, totalEVAs: evas, evaSchedule: evaEvery(days, evas),
});
const MISSIONS: IMMMission[] = [
  // analog-controlled: catalog at 22/45/90, synthetic at 180/365
  catalog("analog-22d"), catalog("analog-45d"), catalog("analog-90d"),
  synth("analog-180d-synth", "analog-controlled", 180, Math.round(180 / 6.5)), // ≈ 28
  synth("analog-365d-synth", "analog-controlled", 365, Math.round(365 / 6.5)), // ≈ 56
  // leo-iss: catalog at 180/365, synthetic at 22/45/90
  synth("leo-iss-22d-synth", "leo-iss", 22, Math.round(22 / 14)),
  synth("leo-iss-45d-synth", "leo-iss", 45, Math.round(45 / 14)),
  synth("leo-iss-90d-synth", "leo-iss", 90, Math.round(90 / 14)),
  // Catalog leo-iss 180/365-d missions: `iss-6mo` (180 d, 12 EVAs) and
  // `iss-drm1` (365 d, 20 EVAs) per src/data/imm-missions.ts.
  catalog("iss-6mo"), catalog("iss-drm1"),
  // interplanetary-mars-future: catalog at 426/923 (out of range), synthetic at all 5
  synth("mars-22d-synth",  "interplanetary-mars-future", 22,  Math.round(22 / 5)),
  synth("mars-45d-synth",  "interplanetary-mars-future", 45,  Math.round(45 / 5)),
  synth("mars-90d-synth",  "interplanetary-mars-future", 90,  Math.round(90 / 5)),
  synth("mars-180d-synth", "interplanetary-mars-future", 180, Math.round(180 / 5)),
  synth("mars-365d-synth", "interplanetary-mars-future", 365, Math.round(365 / 5)),
];

// ── kits (3 levels) ─────────────────────────────────────────────────────────
const KITS = {
  none:      IMM_KITS.none,
  medium:    IMM_KITS.medium,
  unlimited: IMM_KITS.unlimited,
};

// ── family classification (19 families from conditions.ts) ──────────────────
const familyOf = new Map(IMM_CONDITIONS.map((c) => [c.id, c.family]));
const ALL_FAMILIES = Array.from(new Set(IMM_CONDITIONS.map((c) => c.family))).sort();

// ── statistics (copied verbatim from duration_study_screened_vs_unscreened.ts) ─
function wilson(k: number, n: number, z = 1.959964): [number, number] {
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const mid = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}
function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}
function twoPropZ(k1: number, n1: number, k2: number, n2: number): { z: number; p: number } {
  const pPool = (k1 + k2) / (n1 + n2);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
  if (se === 0) return { z: 0, p: 1 };
  const z = (k1 / n1 - k2 / n2) / se;
  return { z, p: 2 * (1 - phi(Math.abs(z))) };
}
function riskRatio(k1: number, n1: number, k2: number, n2: number): { rr: number; lo: number; hi: number; corrected: boolean } {
  const corrected = k1 === 0 || k2 === 0;
  const a = k1 + (corrected ? 0.5 : 0), b = k2 + (corrected ? 0.5 : 0);
  const m = n1 + (corrected ? 1 : 0), n = n2 + (corrected ? 1 : 0);
  const rr = (a / m) / (b / n);
  const seLog = Math.sqrt(1 / a - 1 / m + 1 / b - 1 / n);
  return { rr, lo: rr * Math.exp(-1.959964 * seLog), hi: rr * Math.exp(1.959964 * seLog), corrected };
}

// ── per-cell type and run loop ──────────────────────────────────────────────
type Cell = {
  cellIndex: number;
  missionKind: "analog-controlled" | "leo-iss" | "interplanetary-mars-future";
  durationDays: number;
  missionId: string;
  crew: "screened" | "unscreened";
  kit: "none" | "medium" | "unlimited";
  seed: number;
  T: number;
  tme: number;
  chi: number;
  kEvac: number; pEvac: number; evacCI: [number, number];
  kLocl: number; pLocl: number; loclCI: [number, number];
  familyEvents: Record<string, number>;
  topPsych: [string, number][];
  topMed: [string, number][];
  wallMs: number;
};

const cells: Cell[] = [];
let cellIndex = 0;
const tRun = Date.now();
for (const mission of MISSIONS) {
  for (const [crewName, crew] of Object.entries(crews) as ["screened" | "unscreened", IMMCrewMember[]][]) {
    for (const [kitName, kit] of Object.entries(KITS) as ["none" | "medium" | "unlimited", typeof IMM_KITS.medium][]) {
      const t0 = Date.now();
      const o = simulateIMM({ crew, mission, kit, trials: T, seed: SEED + cellIndex, criteria: PLACEHOLDER_CRITERIA });
      const pEvac = o.pEvac.mean / 100, pLocl = o.pLocl.mean / 100;
      const kEvac = Math.round(pEvac * T), kLocl = Math.round(pLocl * T);

      // per-family event aggregation
      const familyEvents: Record<string, number> = {};
      for (const fam of ALL_FAMILIES) familyEvents[fam] = 0;
      const perCond: [string, string, number][] = [];  // [id, family, tmeContrib]
      for (const d of o.perConditionDrivers) {
        const fam = familyOf.get(d.conditionId) ?? "unknown";
        familyEvents[fam] = (familyEvents[fam] ?? 0) + d.tmeContrib;
        perCond.push([d.conditionId, fam, d.tmeContrib]);
      }
      const psychConds = perCond.filter(([, f]) => f === "psychiatric" || f === "behavioral")
                                .sort((a, b) => b[2] - a[2]).slice(0, 5).map(([id, , v]) => [id, v] as [string, number]);
      const medConds = perCond.filter(([, f]) => f !== "psychiatric" && f !== "behavioral")
                              .sort((a, b) => b[2] - a[2]).slice(0, 5).map(([id, , v]) => [id, v] as [string, number]);

      const wallMs = Date.now() - t0;
      cells.push({
        cellIndex, missionKind: mission.kind, durationDays: mission.durationDays, missionId: mission.id,
        crew: crewName, kit: kitName, seed: SEED + cellIndex, T,
        tme: o.tme.mean, chi: o.chi.mean,
        kEvac, pEvac, evacCI: wilson(kEvac, T),
        kLocl, pLocl, loclCI: wilson(kLocl, T),
        familyEvents, topPsych: psychConds, topMed: medConds, wallMs,
      });
      console.error(`[${cellIndex + 1}/90] ${mission.kind} ${mission.durationDays}d ${crewName} ${kitName}  TME=${o.tme.mean.toFixed(2)}  pEVAC=${(pEvac * 100).toFixed(3)}%  wall=${(wallMs / 1000).toFixed(1)}s`);
      cellIndex++;
    }
  }
}
const totalWallMs = Date.now() - tRun;
console.error(`\nTotal runtime: ${(totalWallMs / 1000).toFixed(1)}s`);

// ── write output JSON ───────────────────────────────────────────────────────
const out = {
  meta: {
    T, seed: SEED, kit: kit.scenarioId, date: "2026-06-05",
    crews: { GOOD, BAD }, totalWallMs,
  },
  cells,
};
const path = "/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json";
writeFileSync(path, JSON.stringify(out, null, 2));
console.error(`\nJSON written: ${path}`);
