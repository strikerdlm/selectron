// scripts/kit_training_study.ts
//
// 2026-06-05 (Diego): "test how resources available in terms of medical care
// can modulate the probability, test with trained crews vs untrained crews.
// make a statistical analysis and drop the results on the same folder"
//
// Factorial study: 4 kit levels × 2 crew types × 3 representative durations.
//   Kit levels: none (no resources) / medium (analog station II-III) /
//               issHMS (ISS HMS) / unlimited (theoretical ceiling)
//   Crews: screened ("trained", GOOD overrides from duration study) vs
//          unscreened ("untrained", BAD overrides)
//   Durations: 45 / 90 / 120 days (policy-relevant analog mission range)
//   T = 20 000 trials per arm, seed = 0xc0ffee (house convention, CRN)
//
// Primary questions:
//   1. How much does kit level reduce pEVAC and pLOCL? (kit main effect)
//   2. Does kit level differ in effectiveness between trained and untrained
//      crews? (kit × crew interaction)
//   3. What is the relative contribution of resources vs crew quality to
//      risk reduction?
//
// Statistics: Wilson 95% CI per arm; two-proportion z-test (pooled);
//   risk ratio with log-normal 95% CI (Haldane–Anscombe 0.5 for zero cells).
//   CRN seeding makes between-arm tests conservative.
//
// Usage: npx tsx scripts/kit_training_study.ts
//   env T (default 20000), SEED (default 0xc0ffee)
// Output: JSON → /root/repos/exports/<date>_data_kit-training-study.json
//         Markdown tables → stdout

import { writeFileSync } from "node:fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { IMMCrewMember, IMMMission, IMMKitScenario } from "../src/imm/types";

const T    = Number(process.env.T    ?? 20_000);
const SEED = Number(process.env.SEED ?? 0xc0ffee);

// ── crews (identical to duration_study_screened_vs_unscreened.ts) ────────────
function makeMember(id: string, fraction: number, ov: Record<string, number>): IMMCrewMember {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const r = c.scale.max - c.scale.min;
    scores[c.id] = c.higherIsBetter ? c.scale.min + fraction * r : c.scale.max - fraction * r;
  }
  Object.assign(scores, ov);
  return {
    id, sex: "male", contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
    stageAScores: scores,
  };
}

const BAD: Record<string, number> = {
  "psych.emotional_stability": 0, "psych.conscientiousness": 0,
  "professional.technical_competence": 1, "psych.mmpi2rf_eid": 90,
  "cognitive.nasa_cognition_battery": -2.5,
};
const GOOD: Record<string, number> = {
  "psych.emotional_stability": 90, "psych.conscientiousness": 90,
  "professional.technical_competence": 9, "psych.mmpi2rf_eid": 35,
  "cognitive.nasa_cognition_battery": 1.0,
};

const crews = {
  screened:   Array.from({ length: 6 }, (_, i) => makeMember(`s${i + 1}`, 0.5, GOOD)),
  unscreened: Array.from({ length: 6 }, (_, i) => makeMember(`u${i + 1}`, 0.5, BAD)),
};

// ── kits ─────────────────────────────────────────────────────────────────────
const KITS: { id: string; label: string; kit: IMMKitScenario }[] = [
  { id: "none",      label: "No Resources",          kit: IMM_KITS.none      },
  { id: "medium",    label: "Analog Station II-III",  kit: IMM_KITS.medium    },
  { id: "issHMS",    label: "ISS HMS",                kit: IMM_KITS.issHMS    },
  { id: "unlimited", label: "Unlimited",              kit: IMM_KITS.unlimited },
];

// ── missions ─────────────────────────────────────────────────────────────────
const catalog = (id: string): IMMMission => IMM_MISSIONS.find((m) => m.id === id)!;
const evaEvery = (days: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => Math.round(((i + 1) * days) / (n + 1)));

function synth(days: number, evas: number): IMMMission {
  return {
    id: `analog-${days}d-synth`, label: `${days}-day campaign (synthetic)`,
    kind: "analog-controlled", durationDays: days, crewSize: 6,
    totalEVAs: evas, evaSchedule: evaEvery(days, evas),
  };
}

const MISSIONS: IMMMission[] = [
  catalog("analog-45d"),
  catalog("analog-90d"),
  synth(120, 18),
];

// ── statistics ───────────────────────────────────────────────────────────────
function wilson(k: number, n: number, z = 1.959964): [number, number] {
  const p = k / n, z2 = z * z;
  const den = 1 + z2 / n;
  const mid = (p + z2 / (2 * n)) / den;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / den;
  return [Math.max(0, mid - half), Math.min(1, mid + half)];
}

function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
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
  const m = n1 + (corrected ? 1 : 0), nn = n2 + (corrected ? 1 : 0);
  const rr = (a / m) / (b / nn);
  const seLog = Math.sqrt(1 / a - 1 / m + 1 / b - 1 / nn);
  return { rr, lo: rr * Math.exp(-1.959964 * seLog), hi: rr * Math.exp(1.959964 * seLog), corrected };
}

// ── family classification ─────────────────────────────────────────────────────
const PSYCH_FAMILIES = new Set(["behavioral", "psychiatric"]);
const familyOf = new Map(IMM_CONDITIONS.map((c) => [c.id, c.family]));

// ── run ───────────────────────────────────────────────────────────────────────
type Row = {
  days: number; kitId: string; kitLabel: string; crew: string;
  tme: number; chi: number;
  pEvac: number; kEvac: number; evacCI: [number, number];
  pLocl: number; kLocl: number; loclCI: [number, number];
  psychEvents: number; medEvents: number;
  pAnyPsych: number; pAnyMed: number;
};

const rows: Row[] = [];

for (const mission of MISSIONS) {
  for (const { id: kitId, label: kitLabel, kit } of KITS) {
    for (const [crewName, crew] of Object.entries(crews)) {
      const t0 = Date.now();
      const o = simulateIMM({
        crew, mission, kit, trials: T, seed: SEED,
        criteria: PLACEHOLDER_CRITERIA,
      });
      const pEvac = o.pEvac.mean / 100, pLocl = o.pLocl.mean / 100;
      const kEvac = Math.round(pEvac * T), kLocl = Math.round(pLocl * T);
      let psychEvents = 0, medEvents = 0;
      for (const d of o.perConditionDrivers) {
        const fam = familyOf.get(d.conditionId);
        if (fam && PSYCH_FAMILIES.has(fam)) psychEvents += d.tmeContrib;
        else medEvents += d.tmeContrib;
      }
      rows.push({
        days: mission.durationDays, kitId, kitLabel, crew: crewName,
        tme: o.tme.mean, chi: o.chi.mean,
        pEvac, kEvac, evacCI: wilson(kEvac, T),
        pLocl, kLocl, loclCI: wilson(kLocl, T),
        psychEvents, medEvents,
        pAnyPsych: 1 - Math.exp(-psychEvents),
        pAnyMed:   1 - Math.exp(-medEvents),
      });
      console.error(
        `done ${mission.durationDays}d ${kitId} ${crewName} in ` +
        `${((Date.now() - t0) / 1000).toFixed(1)}s  ` +
        `pEVAC=${(pEvac * 100).toFixed(2)}% pLOCL=${(pLocl * 100).toFixed(3)}%`
      );
    }
  }
}

// ── kit-effect contrasts (kit X vs none, within crew/duration) ────────────────
type KitContrast = {
  days: number; kitId: string; crew: string;
  evac: ReturnType<typeof twoPropZ> & ReturnType<typeof riskRatio>;
  locl: ReturnType<typeof twoPropZ> & ReturnType<typeof riskRatio>;
};

const kitContrasts: KitContrast[] = [];
for (const mission of MISSIONS) {
  for (const [crewName] of Object.entries(crews)) {
    const ref = rows.find((r) => r.days === mission.durationDays && r.kitId === "none" && r.crew === crewName)!;
    for (const { id: kitId } of KITS.filter((k) => k.id !== "none")) {
      const arm = rows.find((r) => r.days === mission.durationDays && r.kitId === kitId && r.crew === crewName)!;
      kitContrasts.push({
        days: mission.durationDays, kitId, crew: crewName,
        evac: { ...twoPropZ(ref.kEvac, T, arm.kEvac, T), ...riskRatio(ref.kEvac, T, arm.kEvac, T) },
        locl: { ...twoPropZ(ref.kLocl, T, arm.kLocl, T), ...riskRatio(ref.kLocl, T, arm.kLocl, T) },
      });
    }
  }
}

// ── crew-effect contrasts (unscreened vs screened, within kit/duration) ───────
type CrewContrast = {
  days: number; kitId: string;
  evac: ReturnType<typeof twoPropZ> & ReturnType<typeof riskRatio>;
  locl: ReturnType<typeof twoPropZ> & ReturnType<typeof riskRatio>;
};

const crewContrasts: CrewContrast[] = [];
for (const mission of MISSIONS) {
  for (const { id: kitId } of KITS) {
    const scr  = rows.find((r) => r.days === mission.durationDays && r.kitId === kitId && r.crew === "screened")!;
    const unsc = rows.find((r) => r.days === mission.durationDays && r.kitId === kitId && r.crew === "unscreened")!;
    crewContrasts.push({
      days: mission.durationDays, kitId,
      evac: { ...twoPropZ(unsc.kEvac, T, scr.kEvac, T), ...riskRatio(unsc.kEvac, T, scr.kEvac, T) },
      locl: { ...twoPropZ(unsc.kLocl, T, scr.kLocl, T), ...riskRatio(unsc.kLocl, T, scr.kLocl, T) },
    });
  }
}

// ── persist ───────────────────────────────────────────────────────────────────
const DATE = "2026-06-05";
const jsonPath = `/root/repos/exports/${DATE}_data_selectron-kit-training-study.json`;
writeFileSync(jsonPath, JSON.stringify(
  { meta: { T, seed: SEED, date: DATE, crews: { GOOD, BAD }, kits: KITS.map((k) => ({ id: k.id, label: k.label })) },
    rows, kitContrasts, crewContrasts },
  null, 2
));
console.error(`\nJSON written: ${jsonPath}`);

// ── stdout: markdown tables ────────────────────────────────────────────────────
const pct = (x: number, d = 2): string => (x * 100).toFixed(d);

console.log("\n## Table 1 — Primary outcomes by kit × crew × duration");
console.log("| days | kit | crew | TME | CHI | pEVAC [95% CI] | pLOCL [95% CI] | psych E | med E | p(≥1 psych) | p(≥1 med) |");
console.log("|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of rows) {
  console.log(
    `| ${r.days} | ${r.kitLabel} | ${r.crew} | ${r.tme.toFixed(2)} | ${r.chi.toFixed(2)} |` +
    ` ${pct(r.pEvac)}% [${pct(r.evacCI[0])}, ${pct(r.evacCI[1])}] |` +
    ` ${pct(r.pLocl, 3)}% [${pct(r.loclCI[0], 3)}, ${pct(r.loclCI[1], 3)}] |` +
    ` ${r.psychEvents.toFixed(2)} | ${r.medEvents.toFixed(2)} |` +
    ` ${pct(r.pAnyPsych, 1)}% | ${pct(r.pAnyMed, 1)}% |`
  );
}

console.log("\n## Table 2 — Kit effect (RR vs no-resources baseline, by crew type)");
console.log("| days | kit | crew | pEVAC RR (none/kit) [95% CI] | z | p | pLOCL RR (none/kit) [95% CI] | z | p |");
console.log("|---|---|---|---|---|---|---|---|---|");
for (const c of kitContrasts) {
  const e = c.evac, l = c.locl;
  console.log(
    `| ${c.days} | ${c.kitId} | ${c.crew} |` +
    ` ${e.rr.toFixed(2)} [${e.lo.toFixed(2)}, ${e.hi.toFixed(2)}]${e.corrected ? "†" : ""} | ${e.z.toFixed(2)} | ${e.p < 0.001 ? "<0.001" : e.p.toFixed(3)} |` +
    ` ${l.rr.toFixed(2)} [${l.lo.toFixed(2)}, ${l.hi.toFixed(2)}]${l.corrected ? "†" : ""} | ${l.z.toFixed(2)} | ${l.p < 0.001 ? "<0.001" : l.p.toFixed(3)} |`
  );
}

console.log("\n## Table 3 — Crew effect (RR unscreened/screened, by kit)");
console.log("| days | kit | pEVAC RR (unscr/scr) [95% CI] | z | p | pLOCL RR (unscr/scr) [95% CI] | z | p |");
console.log("|---|---|---|---|---|---|---|---|");
for (const c of crewContrasts) {
  const e = c.evac, l = c.locl;
  console.log(
    `| ${c.days} | ${c.kitId} |` +
    ` ${e.rr.toFixed(2)} [${e.lo.toFixed(2)}, ${e.hi.toFixed(2)}]${e.corrected ? "†" : ""} | ${e.z.toFixed(2)} | ${e.p < 0.001 ? "<0.001" : e.p.toFixed(3)} |` +
    ` ${l.rr.toFixed(2)} [${l.lo.toFixed(2)}, ${l.hi.toFixed(2)}]${l.corrected ? "†" : ""} | ${l.z.toFixed(2)} | ${l.p < 0.001 ? "<0.001" : l.p.toFixed(3)} |`
  );
}

console.log("\n† Haldane–Anscombe 0.5 correction (a zero cell).");
