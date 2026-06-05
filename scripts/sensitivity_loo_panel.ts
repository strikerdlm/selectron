// scripts/sensitivity_loo_panel.ts
//
// Leave-calibrated-out (LOO) sensitivity analysis for manuscript §3.
// Two panels:
//   A — tier-A-nasa only (34 conditions): baseline from NASA-sourced priors
//   B — parametric tier-B multiplier sweep {0.25, 0.5, 0.75, 1.0, 1.5, 2.0}
//
// Run: npx tsx scripts/sensitivity_loo_panel.ts
// Output: /root/repos/exports/2026-05-27_sensitivity_loo_panel.txt

import * as fs from "fs";
import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { loadIMMPriors } from "../src/imm/priors";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import type { IMMCrewMember } from "../src/imm/types";

const T = 100_000;
const SEED = 0xc0ffee;
const EXPORTS_DIR = "/root/repos/exports";

const K15_CREW: IMMCrewMember[] = [
  { id: "k15-c1", sex: "male",   contacts: true,  crowns: true,  CAC_positive: true,  abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "k15-c2", sex: "male",   contacts: true,  crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "k15-c3", sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c4", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "k15-c6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 0 },
];

const K15_REF = {
  none:      { TME: 98.30, CHI_lo: 43.36, CHI_hi: 71.25, pEVAC: 66.90, pLOCL: 2.89 },
  issHMS:    { TME: 106.00, CHI_lo: 84.30, CHI_hi: 98.50, CHI_ref: 94.93, pEVAC: 5.57, pLOCL: 0.44 },
  unlimited: { TME: 106.00, CHI_lo: 84.40, CHI_hi: 98.50, CHI_ref: 94.98, pEVAC: 4.93, pLOCL: 0.37 },
};

const issHMS = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const priors = loadIMMPriors();

const tierAIds = new Set(
  IMM_CONDITIONS
    .filter(c => priors.conditions[c.id]?.provenance === "tierA-nasa")
    .map(c => c.id)
);
const tierBIds = new Set(
  IMM_CONDITIONS
    .filter(c => priors.conditions[c.id]?.provenance === "tierB-pymc")
    .map(c => c.id)
);

type Row = { label: string; scenario: string; TME: number; CHI: number; pEVAC: number; pLOCL: number };
const rows: Row[] = [];

function run(label: string, opts: Parameters<typeof simulateIMM>[0]) {
  const kits = [
    ["none", IMM_KITS.none],
    ["issHMS", IMM_KITS.issHMS],
    ["unlimited", IMM_KITS.unlimited],
  ] as const;
  for (const [scenario, kit] of kits) {
    const r = simulateIMM({ ...opts, kit });
    rows.push({
      label,
      scenario,
      TME: r.tme.mean,
      CHI: r.chi.mean,
      pEVAC: r.pEvac.mean,
      pLOCL: r.pLocl.mean,
    });
    console.log(`  ${scenario}: TME=${r.tme.mean.toFixed(1)} CHI=${r.chi.mean.toFixed(1)}% pEVAC=${r.pEvac.mean.toFixed(2)}% pLOCL=${r.pLocl.mean.toFixed(2)}%`);
  }
}

const baseOpts = { crew: K15_CREW, mission: issHMS, kit: IMM_KITS.issHMS, trials: T, seed: SEED };

// ── Panel A: Condition-set decomposition ─────────────────────────────────────
console.log(`\n=== PANEL A: Condition-set decomposition (T=${T}, seed=0x${SEED.toString(16)}) ===\n`);

console.log(`Full model (${IMM_CONDITIONS.length} conditions):`);
run("Full (100)", baseOpts);

console.log(`\ntierA-nasa only (${tierAIds.size} conditions):`);
run(`tierA-only (${tierAIds.size})`, { ...baseOpts, conditionFilter: c => tierAIds.has(c.id) });

console.log(`\ntierB-pymc only (${tierBIds.size} conditions):`);
run(`tierB-only (${tierBIds.size})`, { ...baseOpts, conditionFilter: c => tierBIds.has(c.id) });

// ── Panel B: Parametric tier-B multiplier sweep ──────────────────────────────
console.log(`\n=== PANEL B: Tier-B multiplier sweep (T=${T}, seed=0x${SEED.toString(16)}) ===\n`);

for (const mult of [0.25, 0.5, 0.75, 1.0, 1.5, 2.0]) {
  console.log(`tierBMultiplier = ${mult}:`);
  run(`tierB×${mult}`, { ...baseOpts, tierBMultiplier: mult });
  console.log();
}

// ── Format output ────────────────────────────────────────────────────────────
const lines: string[] = [];
lines.push(`Selectron LOO Sensitivity Analysis — ${new Date().toISOString()}`);
lines.push(`T=${T}, seed=0x${SEED.toString(16)}, K15 reference crew (6 ISS, 180d)\n`);

lines.push("=== PANEL A: Condition-set decomposition ===\n");
lines.push("| Configuration | Scenario | TME | CHI (%) | pEVAC (%) | pLOCL (%) |");
lines.push("|---|---|---|---|---|---|");
for (const r of rows.filter(r => !r.label.startsWith("tierB×"))) {
  lines.push(`| ${r.label} | ${r.scenario} | ${r.TME.toFixed(1)} | ${r.CHI.toFixed(2)} | ${r.pEVAC.toFixed(2)} | ${r.pLOCL.toFixed(2)} |`);
}

lines.push("\n\nK15 reference values:");
lines.push("| Scenario | TME | CHI CI₉₅ | pEVAC | pLOCL |");
lines.push("|---|---|---|---|---|");
for (const [s, ref] of Object.entries(K15_REF)) {
  const chi = "CHI_ref" in ref ? `${(ref as any).CHI_ref} [${ref.CHI_lo}, ${ref.CHI_hi}]` : `[${ref.CHI_lo}, ${ref.CHI_hi}]`;
  lines.push(`| ${s} | ${ref.TME} | ${chi} | ${ref.pEVAC} | ${ref.pLOCL} |`);
}

lines.push("\n\n=== PANEL B: Tier-B multiplier sweep (issHMS scenario) ===\n");
lines.push("| tierB mult | TME | CHI (%) | pEVAC (%) | pLOCL (%) |");
lines.push("|---|---|---|---|---|");
for (const r of rows.filter(r => r.label.startsWith("tierB×") && r.scenario === "issHMS")) {
  lines.push(`| ${r.label.replace("tierB×", "")} | ${r.TME.toFixed(1)} | ${r.CHI.toFixed(2)} | ${r.pEVAC.toFixed(2)} | ${r.pLOCL.toFixed(2)} |`);
}

lines.push("\n| tierB mult | TME (none) | CHI (none) | TME (unlimited) | CHI (unlimited) |");
lines.push("|---|---|---|---|---|");
for (const mult of [0.25, 0.5, 0.75, 1.0, 1.5, 2.0]) {
  const rNone = rows.find(r => r.label === `tierB×${mult}` && r.scenario === "none")!;
  const rUnl = rows.find(r => r.label === `tierB×${mult}` && r.scenario === "unlimited")!;
  lines.push(`| ${mult} | ${rNone.TME.toFixed(1)} | ${rNone.CHI.toFixed(2)} | ${rUnl.TME.toFixed(1)} | ${rUnl.CHI.toFixed(2)} |`);
}

const output = lines.join("\n");
console.log("\n\n" + output);

fs.mkdirSync(EXPORTS_DIR, { recursive: true });
fs.writeFileSync(`${EXPORTS_DIR}/2026-05-27_sensitivity_loo_panel.txt`, output);
console.log(`\nWritten to ${EXPORTS_DIR}/2026-05-27_sensitivity_loo_panel.txt`);
