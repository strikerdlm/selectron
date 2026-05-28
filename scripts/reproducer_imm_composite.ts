// scripts/reproducer_imm_composite.ts
// IMM Composite-Crew extension acceptance reproducer.
// Produces a comparison table across iss-6mo and mars500 missions using
// diverse crew members with stageAScores.
//
// Run: npx tsx scripts/reproducer_imm_composite.ts
// Output: written to /root/repos/exports/2026-05-21_imm_composite_reproducer.txt
//         (also printed to stdout)
//
// IC-6 deliverable — 2026-05-21

import * as fs from "fs";
import * as path from "path";

import { IMM_MISSIONS } from "../src/data/imm-missions";
import { IMM_KITS } from "../src/imm/kits";
import { simulateIMM } from "../src/imm/simulate";
import { aggregateCrewComposite } from "../src/imm/composite";
import { evaluateCrewGates } from "../src/imm/crew-gates";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { IMMCrewMember } from "../src/imm/types";

// ── Configuration ──────────────────────────────────────────────────────────────
const T = 10_000;
const SEED = 0xfeed_beef;
const CHI_STAR = 0.7;
const EXPORTS_DIR = "/root/repos/exports";

// ── Crew fixtures ──────────────────────────────────────────────────────────────
// Three 6-person crews representing BEST, MID, and WORST Stage A profiles.
// stageAScores use the PLACEHOLDER_CRITERIA scale extremes.

function buildStageAScores(fraction: number): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    const range = c.scale.max - c.scale.min;
    // fraction=1.0 → best possible score; fraction=0.0 → worst possible
    const value = c.higherIsBetter
      ? c.scale.min + fraction * range
      : c.scale.max - fraction * range;
    scores[c.id] = value;
  }
  return scores;
}

function buildCrew(label: string, fraction: number, size: number): IMMCrewMember[] {
  return Array.from({ length: size }, (_, i) => ({
    id: `${label}-c${i + 1}`,
    sex: (i < size / 2 ? "male" : "female") as "male" | "female",
    contacts: i < 2,
    crowns: i < 1,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: i < 2,
    EVA_count: i < 2 ? 6 : 0,
    stageAScores: buildStageAScores(fraction),
  }));
}

// BEST crew: all Stage A criteria at best value (fraction=1.0)
// MID crew: all Stage A criteria at midpoint (fraction=0.5)
// WORST crew: all Stage A criteria at worst value (fraction=0.0)
const CREW_DEFS: Array<{ label: string; fraction: number }> = [
  { label: "BEST",  fraction: 1.0 },
  { label: "MID",   fraction: 0.5 },
  { label: "WORST", fraction: 0.0 },
];

const MISSION_IDS = ["iss-6mo", "analog-520d"];
const KIT_KEYS = ["none", "issHMS"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────
function padRight(s: string, n: number) { return s.padEnd(n); }
function padLeft(s: string, n: number)  { return s.padStart(n); }
function fmt1(n: number)   { return n.toFixed(1); }
function fmt2(n: number)   { return n.toFixed(2); }
function pct(n: number)    { return `${n.toFixed(1)}%`; }

// ── Main ───────────────────────────────────────────────────────────────────────
const lines: string[] = [];
function log(s = "") { lines.push(s); process.stdout.write(s + "\n"); }

log("=== IMM Composite-Crew Extension — Acceptance Reproducer ===");
log(`Date: 2026-05-21  T=${T.toLocaleString()}  seed=0x${SEED.toString(16).toUpperCase()}  chiStar=${CHI_STAR}`);
log("");

// ── 1. Crew composite scores ───────────────────────────────────────────────────
log("--- Crew Composite Scores ---");
const header1 = [
  padRight("Crew",  8),
  padLeft("Mean",   8),
  padLeft("WorstLnk", 10),
  padLeft("GeoMean", 10),
  padLeft("Weakest", 16),
].join("  ");
log(header1);
log("-".repeat(header1.length));

for (const { label, fraction } of CREW_DEFS) {
  const mission0 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
  const crew = buildCrew(label, fraction, mission0.crewSize);

  const cMean  = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "mean");
  const cWorst = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "worst-link");
  const cGeo   = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "geometric-mean");

  log([
    padRight(label, 8),
    padLeft(fmt2(cMean.compositeScore), 8),
    padLeft(fmt2(cWorst.compositeScore), 10),
    padLeft(fmt2(cGeo.compositeScore), 10),
    padLeft(cMean.weakestMemberId ?? "—", 16),
  ].join("  "));
}
log("");

// ── 2. Crew gate results ───────────────────────────────────────────────────────
log("--- Crew Gate Results (evaluateCrewGates) ---");
log(`Gated criteria: ${PLACEHOLDER_CRITERIA.filter(c => c.gateThreshold).map(c => c.id).join(", ")}`);
for (const { label, fraction } of CREW_DEFS) {
  const mission0 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
  const crew = buildCrew(label, fraction, mission0.crewSize);
  const gates = evaluateCrewGates(crew, PLACEHOLDER_CRITERIA);
  const dqIds = gates.disqualifiedMemberIds;
  log(`  ${padRight(label, 8)}: crewVerdict=${gates.crewVerdict}${dqIds.length ? "  DQ members: " + dqIds.join(", ") : "  (all pass)"}`);
}
log("");

// ── 3. Per-mission IMM simulation ─────────────────────────────────────────────
for (const missionId of MISSION_IDS) {
  const mission = IMM_MISSIONS.find(m => m.id === missionId);
  if (!mission) { log(`[SKIP] mission ${missionId} not found`); continue; }

  log(`=== Mission: ${mission.label} (${mission.durationDays}d, n=${mission.crewSize}) ===`);

  for (const kitKey of KIT_KEYS) {
    const kit = IMM_KITS[kitKey];
    log(`\n  Kit: ${kitKey}`);

    const hdr = [
      padRight("Crew", 8),
      padLeft("CHI%", 8),
      padLeft("CI90", 12),
      padLeft("pEvac%", 8),
      padLeft("pLocl%", 8),
      padLeft("MSP%", 8),
      padLeft("TME", 6),
    ].join("  ");
    log("  " + hdr);
    log("  " + "-".repeat(hdr.length));

    for (const { label, fraction } of CREW_DEFS) {
      const crew = buildCrew(label, fraction, mission.crewSize);
      const out = simulateIMM({
        crew,
        mission,
        kit,
        trials: T,
        seed: SEED,
        chiStar: CHI_STAR,
        criteria: PLACEHOLDER_CRITERIA,
      });

      const ci90 = `[${fmt1(out.chi.ci90[0])},${fmt1(out.chi.ci90[1])}]`;
      const row = [
        padRight(label, 8),
        padLeft(pct(out.chi.mean), 8),
        padLeft(ci90, 12),
        padLeft(pct(out.pEvac.mean), 8),
        padLeft(pct(out.pLocl.mean), 8),
        padLeft(pct(out.missionSuccess.mean), 8),
        padLeft(fmt1(out.tme.mean), 6),
      ].join("  ");
      log("  " + row);
    }
  }
  log("");
}

// ── 4. Delta table (BEST vs WORST on iss-6mo / issHMS) ────────────────────────
log("--- Delta: BEST minus WORST on iss-6mo / issHMS ---");
{
  const mission = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
  const kit = IMM_KITS.issHMS;
  const runCrew = (fraction: number) => simulateIMM({
    crew: buildCrew(fraction === 1.0 ? "BEST" : "WORST", fraction, mission.crewSize),
    mission, kit, trials: T, seed: SEED, chiStar: CHI_STAR, criteria: PLACEHOLDER_CRITERIA,
  });
  const best  = runCrew(1.0);
  const worst = runCrew(0.0);

  log(`  ΔCHI       = ${fmt2(best.chi.mean - worst.chi.mean)} pp`);
  log(`  ΔpEvac     = ${fmt2(best.pEvac.mean - worst.pEvac.mean)} pp`);
  log(`  ΔpLocl     = ${fmt2(best.pLocl.mean - worst.pLocl.mean)} pp`);
  log(`  ΔmissionSuccess = ${fmt2(best.missionSuccess.mean - worst.missionSuccess.mean)} pp`);
  log(`  ΔTME       = ${fmt2(best.tme.mean - worst.tme.mean)} events`);

  // NOTE: with current uncalibrated priors pEVAC is ~10–99%, so MSP will be
  // very low and ΔCHI may be small. This table documents the engine is wired
  // correctly; meaningful deltas require prior re-calibration (STATUS.md backlog).
  log("");
  log("  NOTE: priors are not yet re-calibrated (see STATUS.md flagged backlog).");
  log("  pEVAC ~10–99% inflates evac flags → MSP near 0 for most missions.");
  log("  Relative BEST vs WORST ordering is expected to be preserved.");
}
log("");

// ── 5. Write output file ───────────────────────────────────────────────────────
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });
const outPath = path.join(EXPORTS_DIR, "2026-05-21_imm_composite_reproducer.txt");
fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf-8");
console.log(`\nOutput written to: ${outPath}`);
