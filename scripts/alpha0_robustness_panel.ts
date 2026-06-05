/**
 * alpha0 robustness panel — {1, 10, 100}
 *
 * Run: npx tsx scripts/alpha0_robustness_panel.ts
 *
 * Prints a summary table to stdout and writes JSON to
 * /root/repos/exports/2026-05-24_alpha0_robustness_panel.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { scoreCandidate, closedFormMoments } from "../src/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import type { Candidate } from "../src/types";

// Heterogeneous candidate — same as tests/engine/alpha0_robustness.test.ts.
// behavioral.teamwork uses scale {min:1, max:5} so 4 (near top) keeps the
// heterogeneous intent without violating the normalise bounds.
const HETERO: Candidate = {
  id: "hetero-1",
  alias: "Heterogeneous",
  scores: {
    "psych.conscientiousness": 85,
    "psych.emotional_stability": 40,
    "physical.vo2max": 60,
    "professional.technical_competence": 3,
    "behavioral.teamwork": 4,
    "cognitive.nasa_cognition_battery": 2.0,
    "cognitive.pvt_b_rt_ms": 220,
    "physical.sot5_equilibrium": 85,
    "psych.resilience_cdrisc": 90,
    "psych.emotional_intelligence": 1.5,
    "psych.mmpi2rf_eid": 42,
    "psych.bdi2_baseline": 3,
  },
};

const K = PLACEHOLDER_CRITERIA.length;
const T = 50_000;
const SEED = 42;

function makeAlpha(alpha0: number): number[] {
  const alphaK = alpha0 / K;
  return Array.from({ length: K }, () => alphaK);
}

const alpha0Values = [1, 10, 100] as const;

interface PanelRow {
  alpha0: number;
  alpha_k: number;
  cf_mean: number;
  mc_mean: number;
  rel_err_pct: number;
  ci90_lo: number;
  ci90_hi: number;
  ci90_width: number;
  ci95_lo: number;
  ci95_hi: number;
  ci95_width: number;
  ess: number;
}

const rows: PanelRow[] = alpha0Values.map((alpha0) => {
  const alpha = makeAlpha(alpha0);
  const cf = closedFormMoments({ candidate: HETERO, criteria: PLACEHOLDER_CRITERIA, alpha });
  const post = scoreCandidate({
    candidate: HETERO,
    criteria: PLACEHOLDER_CRITERIA,
    alpha,
    iterations: T,
    seed: SEED,
  });

  const ci90Width = post.ci90[1] - post.ci90[0];
  const ci95Width = post.ci95[1] - post.ci95[0];
  const relErr = Math.abs(post.mean - cf.mean) / cf.mean;

  return {
    alpha0,
    alpha_k: alpha0 / K,
    cf_mean: cf.mean,
    mc_mean: post.mean,
    rel_err_pct: relErr * 100,
    ci90_lo: post.ci90[0],
    ci90_hi: post.ci90[1],
    ci90_width: ci90Width,
    ci95_lo: post.ci95[0],
    ci95_hi: post.ci95[1],
    ci95_width: ci95Width,
    ess: post.ess,
  };
});

// --- Print summary table ---
console.log("\nalpha0 Robustness Panel — Selectron Stage-A Dirichlet weight prior");
console.log("Candidate: Heterogeneous (id=hetero-1)");
console.log(`Iterations: ${T.toLocaleString()}  Seed: ${SEED}  K: ${K}\n`);

const COL = {
  alpha0: 8,
  alpha_k: 10,
  cf_mean: 10,
  mc_mean: 10,
  rel_err: 10,
  ci90: 22,
  ci90w: 10,
  ess: 10,
};

// Header
console.log(
  "alpha0".padStart(COL.alpha0) +
    "  " +
    "alpha_k".padStart(COL.alpha_k) +
    "  " +
    "CF mean".padStart(COL.cf_mean) +
    "  " +
    "MC mean".padStart(COL.mc_mean) +
    "  " +
    "relErr%".padStart(COL.rel_err) +
    "  " +
    "CI90 [lo, hi]".padStart(COL.ci90) +
    "  " +
    "CI90 width".padStart(COL.ci90w) +
    "  " +
    "ESS".padStart(COL.ess),
);
console.log("-".repeat(100));

for (const r of rows) {
  const ci90Str = `[${r.ci90_lo.toFixed(4)}, ${r.ci90_hi.toFixed(4)}]`;
  console.log(
    r.alpha0.toString().padStart(COL.alpha0) +
      "  " +
      r.alpha_k.toFixed(4).padStart(COL.alpha_k) +
      "  " +
      r.cf_mean.toFixed(4).padStart(COL.cf_mean) +
      "  " +
      r.mc_mean.toFixed(4).padStart(COL.mc_mean) +
      "  " +
      r.rel_err_pct.toFixed(3).padStart(COL.rel_err) +
      "  " +
      ci90Str.padStart(COL.ci90) +
      "  " +
      r.ci90_width.toFixed(4).padStart(COL.ci90w) +
      "  " +
      Math.round(r.ess).toString().padStart(COL.ess),
  );
}

console.log("\nCI90 width monotonicity check:");
for (let i = 1; i < rows.length; i++) {
  const prev = rows[i - 1];
  const curr = rows[i];
  const ok = curr.ci90_width < prev.ci90_width ? "OK" : "FAIL";
  console.log(
    `  alpha0 ${prev.alpha0} -> ${curr.alpha0}: width ${prev.ci90_width.toFixed(4)} -> ${curr.ci90_width.toFixed(4)}  [${ok}]`,
  );
}

// --- Write JSON output ---
const EXPORTS_DIR = "/root/repos/exports";
fs.mkdirSync(EXPORTS_DIR, { recursive: true });

const outPath = path.join(EXPORTS_DIR, "2026-05-24_alpha0_robustness_panel.json");

const output = {
  meta: {
    generated: new Date().toISOString(),
    candidate: HETERO,
    K,
    iterations: T,
    seed: SEED,
    description:
      "Dirichlet weight prior alpha0 robustness panel for Selectron Stage-A. " +
      "Symmetric Dirichlet: alpha_k = alpha0 / K for each criterion. " +
      "Validates that closed-form moments match MC within 2% and CI90 width " +
      "decreases monotonically as alpha0 increases.",
  },
  rows,
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
console.log(`\nJSON written to: ${outPath}`);
