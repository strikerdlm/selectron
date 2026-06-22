// src/imm/posterior-predictive.ts
//
// posteriorPredictiveSimulateIMM — predictive Monte Carlo wrapper around
// simulateIMM. Given fitted per-condition λ parameter draws, it runs T' trials
// per draw and summarizes each metric as a predictive distribution.
//
// ── How parameter draws are threaded into the engine ─────────────────────────
// simulateIMM already accepts `kindMultipliers?: Record<string, number>` — a
// per-condition multiplier applied at the λ-sampling site, where an explicit
// override REPLACES the auto-loaded per-kind map and any missing condition key
// falls through to 1.0. We exploit this: for each posterior draw d we build a
// per-draw composite multiplier map and pass it as `kindMultipliers`, so the
// engine (and therefore the K15 invariance canary) stays byte-identical.
//
// For draw d, condition cid with parameter draw λ_d and prior point mean E[λ]:
//
//     composite[cid] = (base[cid] ?? 1) * (λ_d / E[λ])
//
// where `base` is the explicit kindMultipliers (if given) else the mission
// kind's map from imm-priors.json. Because the engine samples λ with prior mean
// E[λ], multiplying by λ_d / E[λ] moment-matches the engine's per-draw mean to
// λ_d while preserving the prior's relative dispersion — the same
// moment-matching approximation class blessed in the plan (fine for mean and
// shape propagation).
//
// ── What the resulting interval is (and is not) ───────────────────────────────
// Each λ_d is drawn from the condition's stored Gamma/Lognormal prior fit.
// Because E[λ_d] = E[λ], the grand mean over draws stays unbiased versus the
// point-prior pipeline; the spread of per-draw metric means is a moment-matched
// predictive interval. It is NOT a clean epistemic/aleatory
// decomposition — within a draw λ is not held fixed (the engine re-samples it
// each trial, scaled), so the within-draw variance still mixes parameter and
// sampling uncertainty. Label it accordingly; do not over-claim.

import type {
  IMMCrewMember,
  IMMKitScenario,
  IMMMission,
  PosteriorPredictiveOutcome,
  PosteriorSummary,
  VulnerabilityCouplingMode,
} from "./types";
import { simulateIMM } from "./simulate";
import { loadIMMPriors } from "./priors";

export type PosteriorPredictiveOpts = {
  crew: IMMCrewMember[];
  mission: IMMMission;
  kit: IMMKitScenario;
  /**
   * Per-condition λ draws (conditionId → samples, each length >= nDraws).
   * Engine-level shape; the UI maps the API's PosteriorDrawsResponse into this
   * (condition_id → lambdas). Conditions absent here keep their point prior.
   */
  posterior: Record<string, number[]>;
  nDraws: number;
  trialsPerDraw: number;
  seed: number;
  /** Explicit per-condition kind multipliers; defaults to the mission kind's map from imm-priors.json. */
  kindMultipliers?: Record<string, number>;
  tierAMultiplier?: number;
  tierBMultiplier?: number;
  tierCMultiplier?: number;
  vulnerabilityCouplingMode?: VulnerabilityCouplingMode;
};

/**
 * Summarize a sample of per-draw metric values into a PosteriorSummary.
 * Percentiles use a sorted copy with floor indices clamped to [0, n-1].
 * n === 0 → all zeros. `sd` is the population standard deviation.
 *
 * NOTE: duplicates the engine's private summary helper — engine file is frozen
 * under the K15 invariance canary for this plan; dedup deferred.
 *
 * Small-n note: with nearest-rank floor indices, ci90/ci95 degenerate toward the
 * min–max range below ~21/~41 draws respectively; intended operating point is nDraws ≥ 64.
 */
function summarize(values: number[]): PosteriorSummary {
  const n = values.length;
  if (n === 0) return { mean: 0, ci90: [0, 0], ci95: [0, 0], sd: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const at = (q: number): number => sorted[Math.min(n - 1, Math.floor(n * q))];
  return {
    mean,
    ci90: [at(0.05), at(0.95)],
    ci95: [at(0.025), at(0.975)],
    sd,
  };
}

/**
 * Prior point mean E[λ] for a condition, or null when there is no usable point
 * mean (Beta-Bernoulli, missing condition, or a non-finite / non-positive mean).
 * A null means the condition is skipped for the composite-multiplier rescale.
 */
function priorPointMean(conditionId: string): number | null {
  const cond = loadIMMPriors().conditions[conditionId];
  if (!cond) return null;
  const inc = cond.incidence;
  let m: number;
  switch (inc.distribution) {
    case "Gamma-Poisson":
      if (inc.alpha === undefined || inc.beta === undefined) return null;
      m = inc.alpha / inc.beta;
      break;
    case "Lognormal-Poisson":
      if (inc.mu_log_lambda === undefined || inc.sigma_log_lambda === undefined) return null;
      m = Math.exp(inc.mu_log_lambda + (inc.sigma_log_lambda * inc.sigma_log_lambda) / 2);
      break;
    case "Fixed":
      if (inc.lambda_fixed === undefined) return null;
      m = inc.lambda_fixed;
      break;
    // Beta-Bernoulli has no Poisson-rate point mean to rescale against.
    default:
      return null;
  }
  if (!Number.isFinite(m) || m <= 0) return null;
  return m;
}

/**
 * Run a predictive Monte Carlo over fitted per-condition λ draws.
 * Pure over the seeded engine — determinism comes from `seed` only (no
 * Date.now / Math.random). Each draw gets a decorrelated sub-seed.
 */
export function posteriorPredictiveSimulateIMM(
  opts: PosteriorPredictiveOpts,
): PosteriorPredictiveOutcome {
  const { crew, mission, kit, posterior, nDraws, trialsPerDraw, seed } = opts;

  if (nDraws <= 0) {
    throw new Error(`posteriorPredictiveSimulateIMM: nDraws must be > 0 (got ${nDraws})`);
  }
  if (trialsPerDraw <= 0) {
    throw new Error(
      `posteriorPredictiveSimulateIMM: trialsPerDraw must be > 0 (got ${trialsPerDraw})`,
    );
  }
  for (const [cid, lams] of Object.entries(posterior)) {
    if (lams.length < nDraws) {
      throw new Error(
        `posteriorPredictiveSimulateIMM: posterior["${cid}"] has ${lams.length} draws, need >= ${nDraws}`,
      );
    }
    // The engine silently coerces non-finite multipliers to 1.0, which would mask bad inputs.
    if (lams.some(v => !Number.isFinite(v) || v < 0)) {
      throw new Error(
        `Posterior draws for "${cid}" must be non-negative finite numbers`,
      );
    }
  }

  // Resolve the base kind-multiplier map once (explicit override wins, else the
  // mission kind's map from imm-priors.json, else empty → 1.0 everywhere).
  const base: Record<string, number> =
    opts.kindMultipliers ??
    loadIMMPriors().global_calibration.kind_multipliers?.[mission.kind] ??
    {};

  // Build cleanBase once: strip documentation sentinel keys (e.g. `_doc_`) and
  // any non-numeric values — hoisted out of the draw loop to avoid O(nDraws) redundancy.
  const cleanBase: Record<string, number> = {};
  for (const [k, v] of Object.entries(base)) {
    if (k.startsWith("_")) continue;
    if (typeof v !== "number") continue;
    cleanBase[k] = v;
  }

  // Cache prior point means for the conditions present in the posterior.
  const pointMeans = new Map<string, number | null>();
  for (const cid of Object.keys(posterior)) {
    pointMeans.set(cid, priorPointMean(cid));
  }

  const pEvacByDraw: number[] = [];
  const pLoclByDraw: number[] = [];
  const chiByDraw: number[] = [];
  // Per-condition TME contribution, one length-nDraws array per condition seen.
  const tmeByCond: Record<string, number[]> = {};

  for (let d = 0; d < nDraws; d++) {
    // Build the per-draw composite multiplier map from the pre-filtered cleanBase.
    const composite: Record<string, number> = { ...cleanBase };
    for (const [cid, lams] of Object.entries(posterior)) {
      const m = pointMeans.get(cid);
      if (m == null) continue; // Beta-Bernoulli / missing / degenerate → skip.
      const baseMult = base[cid] ?? 1.0;
      composite[cid] = baseMult * (lams[d] / m);
    }

    // Decorrelated sub-seed per draw (Knuth multiplicative hash), uint32.
    const drawSeed = (seed + d * 0x9e3779b1) >>> 0;

    const out = simulateIMM({
      crew,
      mission,
      kit,
      trials: trialsPerDraw,
      seed: drawSeed,
      kindMultipliers: composite,
      tierAMultiplier: opts.tierAMultiplier,
      tierBMultiplier: opts.tierBMultiplier,
      tierCMultiplier: opts.tierCMultiplier,
      vulnerabilityCouplingMode: opts.vulnerabilityCouplingMode ?? "off",
    });

    pEvacByDraw.push(out.pEvac.mean);
    pLoclByDraw.push(out.pLocl.mean);
    chiByDraw.push(out.chi.mean);

    // Record per-condition TME contribution for this draw. perConditionDrivers
    // covers ALL conditions (zero-count ones included with tmeContrib 0), so the
    // union over draws is just every conditionId; missing entries map to 0.
    for (const driver of out.perConditionDrivers) {
      (tmeByCond[driver.conditionId] ??= []).push(driver.tmeContrib);
    }
  }

  // Union-fill: a draw that produced no entry for a condition counts as 0 (the
  // condition contributed nothing that draw) — averaging only over event-bearing
  // draws would bias means upward. In practice simulateIMM emits every condition
  // every draw, but we pad to nDraws defensively so the summary is unbiased
  // regardless of the engine's driver coverage.
  const perConditionTmeContribPost: Record<string, PosteriorSummary> = {};
  for (const [cid, vals] of Object.entries(tmeByCond)) {
    while (vals.length < nDraws) vals.push(0);
    perConditionTmeContribPost[cid] = summarize(vals);
  }

  return {
    pEvacPost: summarize(pEvacByDraw),
    pLoclPost: summarize(pLoclByDraw),
    chiPost: summarize(chiByDraw),
    perConditionTmeContribPost,
    nDraws,
    trialsPerDraw,
  };
}
