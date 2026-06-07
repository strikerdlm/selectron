// scripts/duration_study_screened_vs_unscreened.ts
//
// 2026-06-05 (Diego): "tests on all possible scenarios with selected crews vs
// unselected crews in times with 7, 14, 22, 45, 90, 120, 500 days in analog
// missions and provide a markdown with the statistical analysis of the pEVAC
// and pLOCL and the p of medical and psychological conditions overtime."
//
// Duration study: screened (Stage-A-selected) vs unscreened crew on
// analog-controlled missions at 7 / 14 / 22 / 45 / 90 / 120 / 500 days.
// 7–90 d use the mission catalog; 120 d and 500 d are synthetic
// analog-controlled fixtures with the catalog's EVA cadence (~1 per 6.5 d,
// tapering for long campaigns, mirroring analog-90d/analog-520d).
//
// Statistics:
//   - pEVAC / pLOCL: per-trial Bernoulli outcomes → Wilson 95 % CI on each
//     arm, two-proportion z-test (pooled), risk ratio with log-normal 95 % CI
//     (Haldane–Anscombe 0.5 correction when any cell is 0).
//   - Both arms share seed 0xc0ffee (house convention). Common random numbers
//     positively correlate the arms, so the independent-samples z-test is
//     CONSERVATIVE (true significance is at least what is reported).
//   - Condition probabilities: perConditionDrivers.tmeContrib = expected
//     events/trial per condition (perConditionCountsSum/trials). Grouped into
//     PSYCHOLOGICAL (families behavioral + psychiatric) vs MEDICAL (the other
//     17 families). p(≥1 event) is the Poisson approximation 1 − exp(−E)
//     from the expected count — labelled as an approximation in the report.
//
// Usage: npx tsx scripts/duration_study_screened_vs_unscreened.ts
//   env T (default 20000), SEED (default 0xc0ffee)
// Output: JSON to /root/repos/exports/<date>_data_duration-study.json + stdout tables.

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { IMMCrewMember, IMMMission } from "../src/imm/types";

const T = Number(process.env.T ?? 20_000);
const SEED = Number(process.env.SEED ?? 0xc0ffee);
const kit = IMM_KITS.medium;

// ── crews (identical to tests/imm/analog_45d_unscreened_crew.test.ts) ───────
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
  screened: Array.from({ length: 6 }, (_, i) => makeMember(`s${i + 1}`, 0.5, GOOD)),
  unscreened: Array.from({ length: 6 }, (_, i) => makeMember(`u${i + 1}`, 0.5, BAD)),
};

// ── missions ────────────────────────────────────────────────────────────────
const catalog = (id: string) => IMM_MISSIONS.find((m) => m.id === id)!;
const evaEvery = (days: number, n: number) =>
  Array.from({ length: n }, (_, i) => Math.round(((i + 1) * days) / (n + 1)));
const synthetic = (days: number, evas: number): IMMMission => ({
  id: `analog-${days}d-synth`, label: `${days}-day campaign (synthetic)`,
  kind: "analog-controlled", durationDays: days, crewSize: 6,
  totalEVAs: evas, evaSchedule: evaEvery(days, evas),
});
const MISSIONS: IMMMission[] = [
  catalog("analog-7d"), catalog("analog-14d"), catalog("analog-22d"),
  catalog("analog-45d"), catalog("analog-90d"),
  synthetic(120, 18),  // catalog cadence: 90d→14 EVAs; ~1/6.5d
  synthetic(500, 29),  // mirrors analog-520d (30 EVAs)
];

// ── statistics ──────────────────────────────────────────────────────────────
function wilson(k: number, n: number, z = 1.959964): [number, number] {
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const mid = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}
function phi(x: number): number { // standard normal CDF (Abramowitz–Stegun 7.1.26 via erf)
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
  // RR = unscreened/screened. Haldane–Anscombe +0.5 when any cell is 0.
  const corrected = k1 === 0 || k2 === 0;
  const a = k1 + (corrected ? 0.5 : 0), b = k2 + (corrected ? 0.5 : 0);
  const m = n1 + (corrected ? 1 : 0), n = n2 + (corrected ? 1 : 0);
  const rr = (a / m) / (b / n);
  const seLog = Math.sqrt(1 / a - 1 / m + 1 / b - 1 / n);
  return { rr, lo: rr * Math.exp(-1.959964 * seLog), hi: rr * Math.exp(1.959964 * seLog), corrected };
}

// ── family classification ───────────────────────────────────────────────────
const PSYCH_FAMILIES = new Set(["behavioral", "psychiatric"]);
const familyOf = new Map(IMM_CONDITIONS.map((c) => [c.id, c.family]));

// ── run ─────────────────────────────────────────────────────────────────────
type Row = {
  days: number; missionId: string; crew: string;
  tme: number; chi: number;
  pEvac: number; kEvac: number; evacCI: [number, number];
  pLocl: number; kLocl: number; loclCI: [number, number];
  psychEvents: number; medEvents: number;
  pAnyPsych: number; pAnyMed: number;
  topPsych: [string, number][];
};
const rows: Row[] = [];

for (const mission of MISSIONS) {
  for (const [crewName, crew] of Object.entries(crews)) {
    const t0 = Date.now();
    const o = simulateIMM({ crew, mission, kit, trials: T, seed: SEED, criteria: PLACEHOLDER_CRITERIA });
    const pEvac = o.pEvac.mean / 100, pLocl = o.pLocl.mean / 100;
    const kEvac = Math.round(pEvac * T), kLocl = Math.round(pLocl * T);
    let psychEvents = 0, medEvents = 0;
    const psychByCond: [string, number][] = [];
    for (const d of o.perConditionDrivers) {
      const fam = familyOf.get(d.conditionId);
      if (fam && PSYCH_FAMILIES.has(fam)) { psychEvents += d.tmeContrib; psychByCond.push([d.conditionId, d.tmeContrib]); }
      else medEvents += d.tmeContrib;
    }
    psychByCond.sort((a, b) => b[1] - a[1]);
    rows.push({
      days: mission.durationDays, missionId: mission.id, crew: crewName,
      tme: o.tme.mean, chi: o.chi.mean,
      pEvac, kEvac, evacCI: wilson(kEvac, T),
      pLocl, kLocl, loclCI: wilson(kLocl, T),
      psychEvents, medEvents,
      pAnyPsych: 1 - Math.exp(-psychEvents), pAnyMed: 1 - Math.exp(-medEvents),
      topPsych: psychByCond.slice(0, 3),
    });
    console.error(`done ${mission.durationDays}d ${crewName} in ${((Date.now() - t0) / 1000).toFixed(1)}s  pEVAC=${(pEvac * 100).toFixed(2)}% pLOCL=${(pLocl * 100).toFixed(3)}% psychE=${psychEvents.toFixed(2)} medE=${medEvents.toFixed(2)}`);
  }
}

// ── contrasts ───────────────────────────────────────────────────────────────
const contrasts = MISSIONS.map((m) => {
  const s = rows.find((r) => r.days === m.durationDays && r.crew === "screened")!;
  const u = rows.find((r) => r.days === m.durationDays && r.crew === "unscreened")!;
  return {
    days: m.durationDays,
    evac: { ...twoPropZ(u.kEvac, T, s.kEvac, T), ...riskRatio(u.kEvac, T, s.kEvac, T) },
    locl: { ...twoPropZ(u.kLocl, T, s.kLocl, T), ...riskRatio(u.kLocl, T, s.kLocl, T) },
  };
});

const out = { meta: { T, seed: SEED, kit: kit.scenarioId, date: "2026-06-05", crews: { GOOD, BAD } }, rows, contrasts };
const path = "/root/repos/exports/2026-06-05_data_selectron-duration-study.json";
writeFileSync(path, JSON.stringify(out, null, 2));
console.error(`\nJSON written: ${path}`);

// stdout: compact markdown tables
const pct = (x: number, d = 2) => (x * 100).toFixed(d);
console.log("\n| days | crew | TME | CHI | pEVAC [95% CI] | pLOCL [95% CI] | psych E[events] | med E[events] | p(≥1 psych) | p(≥1 med) |");
console.log("|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| ${r.days} | ${r.crew} | ${r.tme.toFixed(2)} | ${r.chi.toFixed(2)} | ${pct(r.pEvac)}% [${pct(r.evacCI[0])}, ${pct(r.evacCI[1])}] | ${pct(r.pLocl, 3)}% [${pct(r.loclCI[0], 3)}, ${pct(r.loclCI[1], 3)}] | ${r.psychEvents.toFixed(2)} | ${r.medEvents.toFixed(2)} | ${pct(r.pAnyPsych, 1)}% | ${pct(r.pAnyMed, 1)}% |`);
}
console.log("\n| days | pEVAC RR (u/s) [95% CI] | z | p | pLOCL RR (u/s) [95% CI] | z | p |");
console.log("|---|---|---|---|---|---|---|");
for (const c of contrasts) {
  const e = c.evac, l = c.locl;
  console.log(`| ${c.days} | ${e.rr.toFixed(2)} [${e.lo.toFixed(2)}, ${e.hi.toFixed(2)}]${e.corrected ? "†" : ""} | ${e.z.toFixed(2)} | ${e.p < 0.001 ? "<0.001" : e.p.toFixed(3)} | ${l.rr.toFixed(2)} [${l.lo.toFixed(2)}, ${l.hi.toFixed(2)}]${l.corrected ? "†" : ""} | ${l.z.toFixed(2)} | ${l.p < 0.001 ? "<0.001" : l.p.toFixed(3)} |`);
}
console.log("\n† Haldane–Anscombe 0.5 correction (a zero cell).");
