// scripts/diagnose_tme_residual.ts
//
// IMM-priors-rev3-b diagnostic: identify which conditions are driving the
// +44 TME excess vs K15 reference. Output: per-tier and per-condition breakdowns
// of mean TME contribution, sorted descending.
//
// Strategy decision criterion:
//  - If the top-10 conditions account for >50% of TME → per-condition surgery is warranted
//  - If contribution is evenly spread → per-tier scalar multipliers will work
//  - If one tier accounts for the bulk of excess → tier-scoped scalar is enough
//
// Usage: npx tsx scripts/diagnose_tme_residual.ts

import { simulateIMM } from "../src/imm/simulate";
import { IMM_KITS } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { K15_TABLE1_REF, K15_REFERENCE_CREW } from "../src/imm/calibration";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { loadIMMPriors } from "../src/imm/priors";

const SEED = 0xc0ffee;
const T = 10_000; // fast proxy; per-condition contribution shape stable at T=10k

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const priors = loadIMMPriors();

// Build provenance lookup: conditionId → tier
const provenance = new Map<string, string>();
for (const [cid, p] of Object.entries(priors.conditions)) {
  provenance.set(cid, p.provenance);
}

// Build family lookup
const family = new Map<string, string>();
for (const c of IMM_CONDITIONS) {
  family.set(c.id, c.family);
}

function runScenario(scenarioId: keyof typeof K15_TABLE1_REF) {
  const kit = IMM_KITS[scenarioId as keyof typeof IMM_KITS];
  const ref = K15_TABLE1_REF[scenarioId];
  const out = simulateIMM({
    crew: K15_REFERENCE_CREW,
    mission: iss6,
    kit,
    trials: T,
    seed: SEED,
  });

  console.log(`\n=== ${scenarioId} (ref TME=${ref.tme_mean}, observed TME=${out.tme.mean.toFixed(2)}, Δ=${(out.tme.mean - ref.tme_mean).toFixed(2)}) ===`);

  // Per-tier breakdown
  const tierTme: Record<string, number> = {
    "tierA-nasa": 0, "tierB-lit": 0, "tierC-synth": 0,
  };
  // Per-family breakdown
  const familyTme: Record<string, number> = {};

  for (const d of out.perConditionDrivers) {
    const tier = provenance.get(d.conditionId) ?? "unknown";
    tierTme[tier] = (tierTme[tier] ?? 0) + d.tmeContrib;
    const fam = family.get(d.conditionId) ?? "unknown";
    familyTme[fam] = (familyTme[fam] ?? 0) + d.tmeContrib;
  }

  console.log("\n  Per-tier TME contribution:");
  for (const [tier, total] of Object.entries(tierTme).sort((a, b) => b[1] - a[1])) {
    const pct = (100 * total / out.tme.mean).toFixed(1);
    console.log(`    ${tier.padEnd(15)} ${total.toFixed(2).padStart(8)}  (${pct}%)`);
  }

  console.log("\n  Per-family TME contribution (top 10):");
  for (const [fam, total] of Object.entries(familyTme).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    const pct = (100 * total / out.tme.mean).toFixed(1);
    console.log(`    ${fam.padEnd(20)} ${total.toFixed(2).padStart(8)}  (${pct}%)`);
  }

  console.log("\n  Top 20 conditions by TME contribution:");
  console.log(`    ${"conditionId".padEnd(50)} ${"tier".padEnd(12)} ${"family".padEnd(20)}  TME    %TME`);
  for (const d of [...out.perConditionDrivers].sort((a, b) => b.tmeContrib - a.tmeContrib).slice(0, 20)) {
    const tier = provenance.get(d.conditionId) ?? "?";
    const fam = family.get(d.conditionId) ?? "?";
    const pct = (100 * d.tmeContrib / out.tme.mean).toFixed(1);
    console.log(`    ${d.conditionId.padEnd(50)} ${tier.padEnd(12)} ${fam.padEnd(20)}  ${d.tmeContrib.toFixed(2).padStart(6)}  ${pct.padStart(5)}%`);
  }
}

runScenario("issHMS");
runScenario("none");
runScenario("unlimited");
