// scripts/diagnose_chi_residual.ts
//
// rev3-d (CHI severity axis): identify which conditions are driving the
// issHMS-scenario CHI residual (Δ -16, observed 78.82 vs K15 ref 94.93).
// CHI = 1 − QTL / (t · c). QTL = sum over per-event (concurrent FI × duration).
// Higher QTL = lower CHI.
//
// Per-condition expected QTL contribution (analytical estimate, not from MC):
//   E[events]            = α/β × durationDays × crewSize       (Gamma-Poisson)
//                       OR exp(μ + σ²/2) × durationDays × crewSize (Lognormal-Poisson)
//                       OR α/(α+β)        × Bernoulli paths
//                       OR lambda_fixed × durationDays × crewSize (Fixed)
//   E[per-event hours]   = sum_cp [ E[fi_cp] × E[dt_cp_hours] ]
//                       per RAF-interpolated path on issHMS kit.
//   E[QTL contribution]  = E[events] × E[per-event hours]
//
// For a 180d / 6-crew ISS mission with crew-hours = 180 × 24 × 6 = 25,920,
// total expected QTL must be ≈ 25,920 × (1 - 0.9493) = 25,920 × 0.0507 = 1314
// crew-hours to reproduce K15 issHMS CHI. Our current is ~25,920 × 0.21 =
// 5,443 crew-hours — about 4× too high.
//
// Strategy decision criterion:
//  - If the top-10 conditions account for >50% of QTL → per-condition surgery
//  - If a few conditions are dominating with implausible fi_cp/dt_cp values →
//    direct edits with literature anchors
//  - If contribution is evenly spread → blanket severity multiplier on
//    treated.fi_cp* / dt_cp*_hours

import { IMM_KITS } from "../src/imm/kits";
import { computeRAF } from "../src/imm/kits";
import { IMM_MISSIONS } from "../src/data/imm-missions";
import { IMM_CONDITIONS } from "../src/imm/conditions";
import { loadIMMPriors } from "../src/imm/priors";
import { interpolateBetaPertByRAF } from "../src/imm/treatment";
import { K15_REFERENCE_CREW, K15_TABLE1_REF } from "../src/imm/calibration";

const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo")!;
const priors = loadIMMPriors();

// Beta-Pert mean = (a + 4m + b) / 6
function pertMean(p: { min: number; mode: number; max: number }): number {
  return (p.min + 4 * p.mode + p.max) / 6;
}

// Mean expected events per mission for a given condition, accounting for
// the tier multiplier auto-load. NOT per crew member — already aggregated.
function expectedEvents(cid: string, crewSize: number, durationDays: number): number {
  const prior = priors.conditions[cid];
  if (!prior) return 0;
  const inc = prior.incidence;
  const gc = priors.global_calibration;
  let tierMult = 1.0;
  if (prior.provenance === "tierC-synth")     tierMult = gc.tierC_multiplier ?? 1.0;
  else if (prior.provenance === "tierA-nasa") tierMult = gc.tierA_multiplier ?? 1.0;
  else if (prior.provenance === "tierB-lit")  tierMult = gc.tierB_multiplier ?? 1.0;

  if (inc.distribution === "Gamma-Poisson") {
    const lambdaPerDay = (inc.alpha! / inc.beta!) * tierMult;
    return lambdaPerDay * durationDays * crewSize;
  }
  if (inc.distribution === "Lognormal-Poisson") {
    const lambdaPerDay = Math.exp(inc.mu_log_lambda! + 0.5 * (inc.sigma_log_lambda!) ** 2) * tierMult;
    return lambdaPerDay * durationDays * crewSize;
  }
  if (inc.distribution === "Beta-Bernoulli") {
    // SA-once / EVA-coupled / SA-VIIP-late paths: count is 0 or 1 per crew per mission
    const p = inc.alpha! / (inc.alpha! + inc.beta!);
    return p * tierMult * crewSize;
  }
  if (inc.distribution === "Fixed") {
    return inc.lambda_fixed! * tierMult * durationDays * crewSize;
  }
  return 0;
}

function perEventHoursForRAF(prior: typeof priors.conditions[string], raf: number): number {
  // RAF-interpolated Beta-Pert means for fi_cp* and dt_cp*_hours.
  const interpolate = (treated: { min: number; mode: number; max: number }, untreated: { min: number; mode: number; max: number }) =>
    pertMean(interpolateBetaPertByRAF(treated, untreated, raf));
  const fi_cp1 = interpolate(prior.treated.fi_cp1, prior.untreated.fi_cp1);
  const dt_cp1 = interpolate(prior.treated.dt_cp1_hours, prior.untreated.dt_cp1_hours);
  const fi_cp2 = interpolate(prior.treated.fi_cp2, prior.untreated.fi_cp2);
  const dt_cp2 = interpolate(prior.treated.dt_cp2_hours, prior.untreated.dt_cp2_hours);
  // cp3 in the IMM model is "permanent impairment for the remainder of the mission"
  // — for analog/LEO short missions the contribution is small; treat as zero unless
  // mode is non-trivial. (K15 §II.A.6 sets cp3 separately; for tier-A NASA priors
  // most cp3 modes are 0.)
  const fi_cp3 = interpolate(prior.treated.fi_cp3, prior.untreated.fi_cp3);
  return fi_cp1 * dt_cp1 + fi_cp2 * dt_cp2 + fi_cp3 * 24 * 30; // crude cp3 charge (30d cap)
}

function diagnose(scenarioId: keyof typeof K15_TABLE1_REF) {
  const kit = IMM_KITS[scenarioId as keyof typeof IMM_KITS];
  const ref = K15_TABLE1_REF[scenarioId];
  const targetQtlHours = iss6.durationDays * 24 * K15_REFERENCE_CREW.length * (1 - ref.chi_mean / 100);
  const totalCrewHours = iss6.durationDays * 24 * K15_REFERENCE_CREW.length;

  console.log(`\n=== ${scenarioId} (K15 ref CHI=${ref.chi_mean.toFixed(2)} → target QTL=${targetQtlHours.toFixed(0)}h of ${totalCrewHours.toFixed(0)} total) ===\n`);

  const rows: Array<{ cid: string; tier: string; family: string; raf: number; events: number; perEventHours: number; qtlHours: number }> = [];
  for (const cond of IMM_CONDITIONS) {
    const prior = priors.conditions[cond.id];
    if (!prior) continue;
    const raf = computeRAF(prior.required_resources, kit.resources);
    const events = expectedEvents(cond.id, K15_REFERENCE_CREW.length, iss6.durationDays);
    const perEventHours = perEventHoursForRAF(prior, raf);
    const qtlHours = events * perEventHours;
    rows.push({ cid: cond.id, tier: prior.provenance, family: cond.family, raf, events, perEventHours, qtlHours });
  }

  rows.sort((a, b) => b.qtlHours - a.qtlHours);
  const totalQtl = rows.reduce((a, r) => a + r.qtlHours, 0);

  console.log(`Total analytical QTL estimate: ${totalQtl.toFixed(0)} crew-hours (target ${targetQtlHours.toFixed(0)})`);
  console.log(`Ratio: ${(totalQtl / targetQtlHours).toFixed(2)}× target. CHI ≈ ${(100 * (1 - totalQtl / totalCrewHours)).toFixed(2)}% (target ${ref.chi_mean.toFixed(2)}).\n`);

  // Per-tier breakdown
  const tierTotals: Record<string, number> = {};
  for (const r of rows) tierTotals[r.tier] = (tierTotals[r.tier] ?? 0) + r.qtlHours;
  console.log("Per-tier QTL contribution:");
  for (const [tier, total] of Object.entries(tierTotals).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tier.padEnd(15)} ${total.toFixed(0).padStart(7)}h  (${(100 * total / totalQtl).toFixed(1)}%)`);
  }

  // Per-family breakdown (top 10)
  const familyTotals: Record<string, number> = {};
  for (const r of rows) familyTotals[r.family] = (familyTotals[r.family] ?? 0) + r.qtlHours;
  console.log("\nPer-family QTL contribution (top 10):");
  for (const [fam, total] of Object.entries(familyTotals).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${fam.padEnd(20)} ${total.toFixed(0).padStart(7)}h  (${(100 * total / totalQtl).toFixed(1)}%)`);
  }

  // Top 20 conditions
  console.log("\nTop 20 conditions by analytical QTL contribution:");
  console.log(`  ${"conditionId".padEnd(52)} ${"tier".padEnd(12)} ${"family".padEnd(18)}  RAF  events  perEvent-h  QTL-h    %`);
  for (const r of rows.slice(0, 20)) {
    if (r.qtlHours < 1) continue;
    const pct = (100 * r.qtlHours / totalQtl).toFixed(1);
    console.log(`  ${r.cid.padEnd(52)} ${r.tier.padEnd(12)} ${r.family.padEnd(18)}  ${r.raf.toFixed(2)}  ${r.events.toFixed(1).padStart(5)}   ${r.perEventHours.toFixed(1).padStart(7)}   ${r.qtlHours.toFixed(0).padStart(6)}   ${pct.padStart(4)}%`);
  }
}

diagnose("issHMS");
diagnose("unlimited");
diagnose("none");
