// Prints the canonical worked-example numbers for the manuscript Results.
// Matches the exact inputs used by TestFigureHost.tsx (paper-F3, paper-F6, paper-F7).
//
// Stage A: PLACEHOLDER_CRITERIA filtered to Medium tier (K=10), seed 0xc0ffee, 5 000 iterations.
// Stage B (F5 / §3.3): hi-seas-45d, seed 0xc0ffee, T=100 000 — matches generate_f5_convergence.ts.
// Stage B (F6 / §3.4): hi-seas-45d, seed 0xc0ffee, T=5 000 — matches paperRiskPosterior() in TestFigureHost.
// Stage B (F7 / §3.5): syntheticMissionChiSamples formula matching usePaperF7Seed in TestFigureHost.

import { ANALOG_MISSIONS } from "../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../src/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "../src/data/synthetic-iter3";
import { simulateMission } from "../src/risk/simulate";
import { assessLxC } from "../src/risk/lxc";
import { scoreCandidate } from "../src/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import { isCriterionAvailableAtTier } from "../src/types/scenario";
import { makeRng } from "../src/engine/prng";

const PAPER_SEED = 0xc0ffee;
const PAPER_TIER = "medium" as const;
const PAPER_ALIAS = "DEMO-01";

// ─── Stage A: Bayesian MCDA posterior (Medium tier) ───────────────────────────

// F3/F4 in TestFigureHost use ALL PLACEHOLDER_CRITERIA (no tier filter).
// But the manuscript caption says "K = 10 active criteria" (Medium tier).
// We compute BOTH so we can confirm which matches the figure.
const allCriteria = PLACEHOLDER_CRITERIA;
const mediumCriteria = PLACEHOLDER_CRITERIA.filter((c) =>
  isCriterionAvailableAtTier(c.minimumTier, PAPER_TIER)
);

// Scores: midpoint of each criterion's scale (same as paperScores() in TestFigureHost).
const scoresAll: Record<string, number> = {};
for (const c of allCriteria) {
  scoresAll[c.id] = (c.scale.min + c.scale.max) / 2;
}

// Stage A with ALL criteria (matches TestFigureHost paperMCDAPosterior exactly).
const mcdaAll = scoreCandidate({
  candidate: { id: PAPER_ALIAS, alias: PAPER_ALIAS, scores: scoresAll },
  criteria: allCriteria,
  alpha: new Array(allCriteria.length).fill(1),
  iterations: 5_000,
  seed: PAPER_SEED,
});

// Stage A with Medium-tier filter (K=10, matches caption).
const scoreMedium: Record<string, number> = {};
for (const c of mediumCriteria) {
  scoreMedium[c.id] = (c.scale.min + c.scale.max) / 2;
}
const mcdaMedium = scoreCandidate({
  candidate: { id: PAPER_ALIAS, alias: PAPER_ALIAS, scores: scoreMedium },
  criteria: mediumCriteria,
  alpha: new Array(mediumCriteria.length).fill(1),
  iterations: 5_000,
  seed: PAPER_SEED,
});

// ─── Stage B: hi-seas-45d, T=100 000 (canonical convergence run — §3.3 / F5) ─

const mission45 = ANALOG_MISSIONS.find((m) => m.id === "hi-seas-45d");
if (!mission45) throw new Error("hi-seas-45d not found");

const crewTemplate = { id: PAPER_ALIAS, alias: PAPER_ALIAS, scores: scoresAll };
const crew = synthesizeCrew(crewTemplate, mission45.crewSize);

const riskPost100k = simulateMission(crew, mission45, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
  seed: PAPER_SEED,
  trials: 100_000,
  chiStar: 0.7,
  diagnostics: false,
});
const lxc100k = assessLxC(riskPost100k);

// ─── Stage B: hi-seas-45d, T=5 000 (matches paperRiskPosterior() → F6 / §3.4) ─

const riskPost5k = simulateMission(crew, mission45, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
  seed: PAPER_SEED,
  trials: 5_000,
  chiStar: 0.7,
  diagnostics: false,
});
const lxc5k = assessLxC(riskPost5k);

// ─── F7 / §3.5: per-mission synthetic chi samples (matches usePaperF7Seed) ─────

// syntheticMissionChiSamples from TestFigureHost (n=5000 per mission).
function syntheticMissionChiSamples(missionIdx: number, n = 5_000): number[] {
  let seed = (0xc0ffee + missionIdx * 0x1234) | 0;
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    const base = 0.98 - missionIdx * 0.025;
    out[i] = Math.max(0, Math.min(1, base + 0.08 * Math.sin(seed / 1_000_000)));
  }
  return out;
}

function posteriorFromSamples(chiSamples: number[], missionCrewDays: number) {
  const sorted = [...chiSamples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, x) => s + x, 0) / n;
  const ci90: [number, number] = [sorted[Math.floor(n * 0.05)], sorted[Math.floor(n * 0.95)]];
  const pET = chiSamples.filter((x) => x < 0.7).length / n;
  return { chi_mean: mean, chi_ci90: ci90, pET, ELCD: (1 - mean) * missionCrewDays };
}

const perMission = ANALOG_MISSIONS.map((m, k) => {
  const chiSamples = syntheticMissionChiSamples(k);
  const crewDays = m.durationDays * m.crewSize;
  const { chi_mean, chi_ci90, pET, ELCD } = posteriorFromSamples(chiSamples, crewDays);

  // Build minimal RiskPosterior for assessLxC
  const chiSorted = [...chiSamples].sort((a, b) => a - b);
  const n = chiSorted.length;
  const mean = chi_mean;
  const ci90: [number, number] = chi_ci90;
  const ci95: [number, number] = [chiSorted[Math.floor(n * 0.025)], chiSorted[Math.floor(n * 0.975)]];
  const pETMean = pET;
  const riskPost = {
    chi: { mean, ci90, ci95 },
    pEarlyTermination: { mean: pETMean, ci90: [Math.max(0, pETMean - 0.02), Math.min(1, pETMean + 0.02)] as [number, number] },
    expectedLostCrewDays: { mean: ELCD, ci90: [0, ELCD * 2] as [number, number] },
    perConditionQTL: {} as Record<string, { mean: number; ci90: [number, number] }>,
    ess: n,
    trials: n,
  };
  const lxc = assessLxC(riskPost);
  return {
    k,
    id: m.id,
    label: m.label,
    type: m.type,
    durationDays: m.durationDays,
    crewSize: m.crewSize,
    crewDays,
    chi_mean: +chi_mean.toFixed(6),
    chi_ci90_lo: +chi_ci90[0].toFixed(6),
    chi_ci90_hi: +chi_ci90[1].toFixed(6),
    pET: +pET.toFixed(6),
    ELCD: +ELCD.toFixed(2),
    lxc_L: lxc.likelihood,
    lxc_C: lxc.consequence,
    lxc_score: lxc.score,
    lxc_color: lxc.color,
    lxc_likelihoodLabel: lxc.likelihoodLabel,
    lxc_consequenceLabel: lxc.consequenceLabel,
  };
});

// ─── Output ──────────────────────────────────────────────────────────────────

console.log(JSON.stringify({
  paper_inputs: {
    alias: PAPER_ALIAS,
    seed_hex: "0xc0ffee",
    seed_dec: PAPER_SEED,
    tier: PAPER_TIER,
    K_total: allCriteria.length,
    K_medium: mediumCriteria.length,
    canonical_mission: mission45.id,
    mission_label: mission45.label,
    duration_days: mission45.durationDays,
    crew_size: mission45.crewSize,
  },
  stage_a_all_criteria: {
    note: "ALL 12 criteria — matches TestFigureHost paperMCDAPosterior() → F3/F4",
    iterations: 5000,
    posterior_mean_S: +mcdaAll.mean.toFixed(6),
    posterior_ci90_lo: +mcdaAll.ci90[0].toFixed(6),
    posterior_ci90_hi: +mcdaAll.ci90[1].toFixed(6),
    posterior_ci95_lo: +mcdaAll.ci95[0].toFixed(6),
    posterior_ci95_hi: +mcdaAll.ci95[1].toFixed(6),
    ess: +mcdaAll.ess.toFixed(1),
  },
  stage_a_medium_criteria: {
    note: "K=10 Medium-tier criteria — matches manuscript caption 'K = 10 active criteria'",
    iterations: 5000,
    posterior_mean_S: +mcdaMedium.mean.toFixed(6),
    posterior_ci90_lo: +mcdaMedium.ci90[0].toFixed(6),
    posterior_ci90_hi: +mcdaMedium.ci90[1].toFixed(6),
    posterior_ci95_lo: +mcdaMedium.ci95[0].toFixed(6),
    posterior_ci95_hi: +mcdaMedium.ci95[1].toFixed(6),
    ess: +mcdaMedium.ess.toFixed(1),
  },
  stage_b_100k: {
    note: "hi-seas-45d T=100 000 — canonical convergence run → §3.3 / F5 context",
    trials: 100_000,
    chi_mean: +riskPost100k.chi.mean.toFixed(6),
    chi_ci90_lo: +riskPost100k.chi.ci90[0].toFixed(6),
    chi_ci90_hi: +riskPost100k.chi.ci90[1].toFixed(6),
    chi_ci95_lo: +riskPost100k.chi.ci95[0].toFixed(6),
    chi_ci95_hi: +riskPost100k.chi.ci95[1].toFixed(6),
    pET: +riskPost100k.pEarlyTermination.mean.toFixed(6),
    ELCD: +riskPost100k.expectedLostCrewDays.mean.toFixed(2),
    lxc_L: lxc100k.likelihood,
    lxc_C: lxc100k.consequence,
    lxc_score: lxc100k.score,
    lxc_color: lxc100k.color,
    lxc_likelihoodLabel: lxc100k.likelihoodLabel,
    lxc_consequenceLabel: lxc100k.consequenceLabel,
    fractionLost: +lxc100k.fractionLost.toFixed(6),
  },
  stage_b_5k: {
    note: "hi-seas-45d T=5 000 — matches paperRiskPosterior() in TestFigureHost → F6",
    trials: 5_000,
    chi_mean: +riskPost5k.chi.mean.toFixed(6),
    chi_ci90_lo: +riskPost5k.chi.ci90[0].toFixed(6),
    chi_ci90_hi: +riskPost5k.chi.ci90[1].toFixed(6),
    pET: +riskPost5k.pEarlyTermination.mean.toFixed(6),
    ELCD: +riskPost5k.expectedLostCrewDays.mean.toFixed(2),
    lxc_L: lxc5k.likelihood,
    lxc_C: lxc5k.consequence,
    lxc_score: lxc5k.score,
    lxc_color: lxc5k.color,
    lxc_likelihoodLabel: lxc5k.likelihoodLabel,
    lxc_consequenceLabel: lxc5k.consequenceLabel,
    fractionLost: +lxc5k.fractionLost.toFixed(6),
  },
  f7_per_mission: {
    note: "Synthetic chi samples matching usePaperF7Seed in TestFigureHost → F7. Sorted by durationDays.",
    missions: [...perMission].sort((a, b) => a.durationDays - b.durationDays),
  },
}, null, 2));
