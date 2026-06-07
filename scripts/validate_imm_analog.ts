// scripts/validate_imm_analog.ts
// Analog-mission validation gate (2026-06-07, plan §6) — the analog parallel to
// the ISS-only scripts/validate_imm.ts. Reports emergent analog pEVAC / pLOCL /
// TME / CHI for screened-trained vs unscreened-random crews against the
// literature anchors, and asserts the leo-iss / K15 path is byte-identical under
// the new selectionContext lever (the hard invariant).
//
// Usage: npm run validate:imm:analog
// This is a REPORTER (like validate_imm.ts), not a CI assertion gate, EXCEPT the
// K15 invariance check, which exits non-zero on any drift.
//
// Literature anchors (all DOI-resolved — see research/evidence_extracted/_doi_verification_log.md):
//   - McMurdo 0.036 medevac/person-year; USAP 2013-14 0.01 evac/py
//     (Walton & Kerstman 2020; Pattarini 2016) — SCREENED national-program cohorts.
//   - JARE ~4 medical events/person over a wintering year (Ikeda 2019);
//     P(>=1 event) ~ certain by >=45 d (defensibility review Assumption 2).
//   - Screened-crew psychiatric floor ~5% DSM (Palinkas & Suedfeld 2008);
//     general-population any-disorder 26.2% (Kessler NCS-R 2005) — unscreened anchor.
//   - Selection reduces psychiatric morbidity, NOT mortality → pLOCL ~ null
//     difference between crews (defensibility review §4-5; Antonsen 2022).

import { simulateIMM } from "../src/imm/simulate";
import type { IMMCrewMember } from "../src/imm/types";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";

const SEED = 0xc0ffee;
const T = 20_000; // reporter resolution; raise to 100k for a publication run

// ── crew fixtures (Stage-A scored so the coupling + selection levers are live) ──
function scoredCrew(n: number, fraction: number, overrides: Record<string, number>): IMMCrewMember[] {
  return Array.from({ length: n }, (_, i) => {
    const scores: Record<string, number> = {};
    for (const c of PLACEHOLDER_CRITERIA) {
      const range = c.scale.max - c.scale.min;
      scores[c.id] = c.higherIsBetter ? c.scale.min + fraction * range : c.scale.max - fraction * range;
    }
    Object.assign(scores, overrides);
    return {
      id: `m${i + 1}`, sex: i % 2 === 0 ? "male" : "female",
      contacts: false, crowns: false, CAC_positive: false,
      abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0,
      stageAScores: scores,
    } as IMMCrewMember;
  });
}
// Screened-trained: high traits, EID well below gate. Unscreened-random: low traits.
const SCREENED = scoredCrew(6, 0.82, { "psych.mmpi2rf_eid": 40, "cognitive.nasa_cognition_battery": 1.0 });
const RANDOM   = scoredCrew(6, 0.30, { "psych.mmpi2rf_eid": 55, "cognitive.nasa_cognition_battery": -0.5 });

function approxEvacPerPY(pEvacPct: number, crewSize: number, durationDays: number): number {
  // Crew-level P(>=1 evac) → approx per-person-year rate. Rare-event approx:
  // expected evacs ~ pEVAC (one evac typically terminates); spread over person-years.
  const personYears = crewSize * (durationDays / 365);
  return personYears > 0 ? (pEvacPct / 100) / personYears : 0;
}

console.log("\n=== Analog validation gate (T=%d, seed 0x%s) ===\n", T, SEED.toString(16));

// ── 1. K15 / leo-iss invariance under selectionContext (HARD GATE) ─────────────
console.log("-- K15 invariance: leo-iss must be byte-identical under selectionContext --");
const iss6 = IMM_MISSIONS.find((m) => m.id === "iss-6mo")!;
const k15Base = simulateIMM({ crew: K15_REFERENCE_CREW, mission: iss6, kit: IMM_KITS.issHMS, trials: T, seed: SEED });
const k15Sel = simulateIMM({ crew: K15_REFERENCE_CREW, mission: iss6, kit: IMM_KITS.issHMS, trials: T, seed: SEED, selectionContext: "unscreened-random" });
const k15Ref = K15_TABLE1_REF.issHMS;
const identical = k15Base.tme.mean === k15Sel.tme.mean && k15Base.chi.mean === k15Sel.chi.mean && k15Base.pEvac.mean === k15Sel.pEvac.mean;
console.log(`   base TME ${k15Base.tme.mean.toFixed(3)} | +selectionContext TME ${k15Sel.tme.mean.toFixed(3)} | ref ${k15Ref.tme_mean.toFixed(2)}`);
console.log(`   byte-identical under selectionContext: ${identical ? "PASS ✓" : "FAIL ✗"}`);
if (!identical) {
  console.error("\nFATAL: selectionContext leaked into the leo-iss / K15 path. Aborting.");
  process.exit(1);
}

// ── 2. Analog scenarios: screened-trained vs unscreened-random ─────────────────
const scenarios = [
  { mission: IMM_MISSIONS.find((m) => m.id === "analog-90d")!, anchor: "JARE/ANARE event load; analog-controlled" },
  { mission: IMM_MISSIONS.find((m) => m.id === "antarctic-winter")!, anchor: "McMurdo 0.036 / USAP 0.01 evac/py (screened arm)" },
];

for (const { mission, anchor } of scenarios) {
  console.log(`\n-- ${mission.id} (${mission.durationDays} d, ${mission.kind}, kit=medium) | anchor: ${anchor} --`);
  for (const [label, crew, ctx] of [
    ["screened-trained", SCREENED, "screened-trained"],
    ["unscreened-random", RANDOM, "unscreened-random"],
  ] as const) {
    const out = simulateIMM({
      crew, mission, kit: IMM_KITS.medium, trials: T, seed: SEED,
      criteria: PLACEHOLDER_CRITERIA, selectionContext: ctx,
    });
    const evacPY = approxEvacPerPY(out.pEvac.mean, mission.crewSize, mission.durationDays);
    console.log(
      `   ${label.padEnd(18)} TME ${out.tme.mean.toFixed(2).padStart(7)} | CHI ${out.chi.mean.toFixed(1).padStart(5)} | ` +
      `pEVAC ${out.pEvac.mean.toFixed(2).padStart(6)}% (~${evacPY.toFixed(4)} evac/py) | pLOCL ${out.pLocl.mean.toFixed(3)}%`,
    );
  }
}

console.log("\n=== Interpretation ===");
console.log("  • leo-iss/K15 invariance is the hard gate (exit 1 on drift).");
console.log("  • Screened-arm evac/py should sit near McMurdo 0.036 / USAP 0.01 (screened cohorts).");
console.log("  • Unscreened-random should show higher psychiatric TME burden but a near-equal pLOCL");
console.log("    (selection reduces morbidity, not mortality — defensibility review §4-5).");
console.log("  • This is inter-model/analog-anchor agreement, NOT validation against in-flight data.\n");
