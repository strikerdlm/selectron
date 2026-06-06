import { SelectronError } from "@/engine/errors";
import { makeRng } from "@/engine/prng";
import { zScoreAgainstScale } from "@/engine/normalize-cohort";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type {
  AnalogMission,
  Candidate,
  Condition,
  Criterion,
  CredibleInterval,
  PosteriorSummary,
  RiskPosterior,
} from "@/types";

import { computeCHI, computePEarlyTermination } from "./chi";
import {
  applyVulnerabilityMultiplier,
  sampleBinomial,
  samplePoisson,
} from "./incidence";
import { sampleSeverity } from "./progression";
import { type PriorsJson, validatePriorsJson } from "./priorsSchema";
import { lostDays } from "./treatment";

type Rng = () => number;

export type SimulateOptions = {
  seed: number;
  trials: number;
  chiStar?: number;
  diagnostics?: boolean;
};

export type TrialResult = {
  chi: number;
  qtl: number;
  perCondition: Record<string, number>;
};

export type RiskPosteriorWithDiagnostics = RiskPosterior & {
  diagnostics?: { chiSamples: number[]; qtlSamples: number[] };
};

const DEFAULT_CHI_STAR = 0.7;

// Spec §3.3 + §3.4 prescribe severity-conditional lost-day distributions
// D^{treated}_{k, s_j} and D^{untreated}_{k, s_j} (best vs worst case). Iter-3
// v1 priors.json collapses the severity dimension into a single
// treated_lost_days_mean / untreated_lost_days_mean pair per condition and
// patches the missing axis with this flat 1.5× multiplier on worst-case
// occurrences. This is a known divergence from the spec — deliberate, because
// the Phase 3B PyMC notebook is scoped to fit two-state (treated/untreated)
// lost-days only. Restoring the full four-state severity grid is deferred to
// Iter-3 v2 (schema bump) or Iter-4 (when richer evidence is curated).
const WORST_CASE_MULTIPLIER = 1.5;

function sampleFromPosterior(rng: Rng, samples: readonly number[]): number {
  if (samples.length === 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      "log_lambda_samples is empty — cannot sample posterior",
    );
  }
  const idx = Math.min(Math.floor(rng() * samples.length), samples.length - 1);
  return samples[idx];
}

// Build z-vector for a crew member by looking up the criteria the condition
// flags as vulnerability drivers. Z-scores each raw score against the
// criterion's operational scale (scale [min,max] = ±2 SD range, 4 SDs total).
//
// Sign convention: HIGH-quality candidate → SMALL λ multiplier.
// β is negative in SYNTHETIC_PRIORS (G6). So we need β·z < 0 for high-quality,
// meaning z > 0 for high-quality candidates.
//
// For higherIsBetter=true:  HIGH raw = high quality → zVal > 0 → use zVal directly.
// For higherIsBetter=false: HIGH raw = BAD (e.g., high MMPI-EID) → must FLIP so z < 0
//                           for high-quality (low raw) candidates: use -zVal.
//
// Verification:
//   VO₂max=70 (max, good; higherIsBetter=true):  z=+2, β=-0.2 → exp(-0.4)≈0.67 (λ↓) ✓
//   VO₂max=20 (min, bad):                        z=-2, β=-0.2 → exp(+0.4)≈1.49 (λ↑) ✓
//   MMPI-EID=120 (max, bad; higherIsBetter=false): zVal=+2, z=-2, β=-0.2 → exp(+0.4)≈1.49 (λ↑) ✓
export function vulnerabilityVector(
  member: Candidate,
  criterionIds: readonly string[],
  criteriaIndex: ReadonlyMap<string, Criterion>,
): Record<string, number> {
  const z: Record<string, number> = {};
  for (const cid of criterionIds) {
    const raw = member.scores[cid];
    const c = criteriaIndex.get(cid);
    if (raw === undefined || !Number.isFinite(raw) || !c) continue;
    const zVal = zScoreAgainstScale(raw, c.scale);
    // higherIsBetter=true:  high raw = high quality → z positive → β·z < 0 → λ↓
    // higherIsBetter=false: high raw = bad → flip so bad candidates get z > 0
    z[cid] = c.higherIsBetter ? zVal : -zVal;
  }
  return z;
}

// τ = mean countermeasure availability across the mission's countermeasure
// set. Iter-3 v1 uses a flat average; Iter-4 can map per-condition required
// countermeasure subsets (Minard 2011 medical-kit optimization).
function treatmentFraction(_conditionId: string, mission: AnalogMission): number {
  const vals = Object.values(mission.countermeasures);
  if (vals.length === 0) return 0;
  let sum = 0;
  for (const v of vals) sum += v;
  return sum / vals.length;
}

function clampProb(p: number): number {
  if (!Number.isFinite(p) || p < 0) return 0;
  if (p > 1) return 1;
  return p;
}

export function runMissionTrial(
  crew: readonly Candidate[],
  mission: AnalogMission,
  priors: PriorsJson,
  conditions: readonly Condition[],
  rng: Rng,
  criteriaIndex?: ReadonlyMap<string, Criterion>,
): TrialResult {
  let totalQTL = 0;
  const perCondition: Record<string, number> = {};

  for (const c of conditions) {
    const condPrior = priors.conditions[c.id];
    if (!condPrior) continue;
    const missionPrior = condPrior.missions[mission.type];
    if (!missionPrior) continue;

    for (const member of crew) {
      const logLambda = sampleFromPosterior(rng, missionPrior.log_lambda_samples);
      const baseLambda = Math.exp(logLambda);
      const z = vulnerabilityVector(member, c.vulnerabilityCriteria, criteriaIndex ?? new Map());
      const lambdaI = applyVulnerabilityMultiplier(
        baseLambda,
        condPrior.vulnerability_beta,
        z,
      );

      let n = 0;
      if (c.kind === "rate") {
        n = samplePoisson(rng, lambdaI * mission.durationDays);
      } else {
        // Spec §3.2: for event-triggered conditions, the log_lambda posterior
        // encodes log(p_event); after the vulnerability multiplier it can
        // overshoot 1 under extreme β·z combinations — clamp to a valid
        // binomial probability rather than throw, since this is a soft
        // model-misspec guard (not a programmer error).
        n = sampleBinomial(rng, mission.evaCount, clampProb(lambdaI));
      }
      if (n === 0) continue;

      const tau = treatmentFraction(c.id, mission);
      const treatedMean = condPrior.treated_lost_days_mean;
      const untreatedMean = condPrior.untreated_lost_days_mean;
      const dBest = lostDays(untreatedMean, treatedMean, tau);

      for (let j = 0; j < n; j++) {
        const severity = sampleSeverity(rng, condPrior.worst_case_prob_q);
        const dj = dBest * (severity === 1 ? WORST_CASE_MULTIPLIER : 1.0);
        totalQTL += dj;
        perCondition[c.id] = (perCondition[c.id] ?? 0) + dj;
      }
    }
  }

  // Spec §3.5 mandates CHI ∈ [0,1] by construction. Under pathological priors a
  // trial could accumulate QTL > available person-days; cap so CHI clamps to 0
  // instead of throwing — the unit tests for `computeCHI` assert the guard.
  //
  // Convention: `qtl` returned here is the **uncapped** raw sum (useful as a
  // signed diagnostic for `expectedLostCrewDays`); `chi` is computed from the
  // **capped** QTL. The two will diverge from the identity (1 - chi) * available
  // === qtl only when the cap fires, which never happens with the Iter-3 v1
  // synthetic priors but could surface in Phase 3B fits with heavy-tailed
  // log_lambda posteriors. Document this in the Iter-3 V&V dossier (Task 60).
  const available = mission.durationDays * mission.crewSize;
  const cappedQTL = Math.min(totalQTL, available);
  const chi = computeCHI(cappedQTL, available);
  return { chi, qtl: totalQTL, perCondition };
}

function quantile(sortedAsc: readonly number[], q: number): number {
  if (sortedAsc.length === 0) return Number.NaN;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = q * (sortedAsc.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (pos - lo) * (sortedAsc[hi] - sortedAsc[lo]);
}

function summarize90(samples: readonly number[]): { mean: number; ci90: CredibleInterval } {
  const sorted = [...samples].sort((a, b) => a - b);
  let sum = 0;
  for (const x of samples) sum += x;
  return {
    mean: sum / samples.length,
    ci90: [quantile(sorted, 0.05), quantile(sorted, 0.95)] as const,
  };
}

function summarize9095(samples: readonly number[]): {
  mean: number;
  ci90: CredibleInterval;
  ci95: CredibleInterval;
} {
  const sorted = [...samples].sort((a, b) => a - b);
  let sum = 0;
  for (const x of samples) sum += x;
  return {
    mean: sum / samples.length,
    ci90: [quantile(sorted, 0.05), quantile(sorted, 0.95)] as const,
    ci95: [quantile(sorted, 0.025), quantile(sorted, 0.975)] as const,
  };
}

// Batch-means CI for the early-termination indicator. ω indicators are i.i.d.
// across trials in forward MC, so binning into ~100 batches and taking the 5th
// /95th percentile of the per-batch means gives a defensible CI without
// bootstrapping. Falls back to a degenerate (mean, mean) interval when there
// aren't enough trials to form ≥2 batches.
function batchMeansCI(
  indicators: readonly number[],
  threshold: number,
): { mean: number; ci90: CredibleInterval } {
  const T = indicators.length;
  const mean = computePEarlyTermination(indicators, threshold);
  const batchSize = Math.max(50, Math.floor(T / 100));
  const numBatches = Math.floor(T / batchSize);
  if (numBatches < 2) return { mean, ci90: [mean, mean] as const };
  const fracs: number[] = new Array(numBatches);
  for (let b = 0; b < numBatches; b++) {
    let count = 0;
    for (let i = b * batchSize; i < (b + 1) * batchSize; i++) {
      if (indicators[i] <= threshold) count++;
    }
    fracs[b] = count / batchSize;
  }
  return { mean, ci90: summarize90(fracs).ci90 };
}

export function simulateMission(
  crew: readonly Candidate[],
  mission: AnalogMission,
  priors: PriorsJson,
  conditions: readonly Condition[],
  options: SimulateOptions,
): RiskPosteriorWithDiagnostics {
  validatePriorsJson(priors);
  if (!Number.isInteger(options.trials) || options.trials <= 0) {
    throw new SelectronError(
      "E_BAD_PRIOR",
      `trials must be a positive integer, got ${options.trials}`,
      { trials: options.trials },
    );
  }
  if (crew.length === 0) {
    throw new SelectronError("E_BAD_MISSION", "crew must be non-empty");
  }
  const chiStar = options.chiStar ?? DEFAULT_CHI_STAR;
  const rng = makeRng(options.seed);

  // Build criteria index once per simulation call (option (a) from plan G5:
  // testable, avoids re-importing inside the hot trial loop).
  const criteriaIndex: Map<string, Criterion> = new Map(
    PLACEHOLDER_CRITERIA.map((c) => [c.id, c]),
  );

  const trials = options.trials;
  const chiSamples = new Array<number>(trials);
  const qtlSamples = new Array<number>(trials);
  const perConditionSamples: Record<string, number[]> = {};
  for (const c of conditions) perConditionSamples[c.id] = new Array<number>(trials).fill(0);

  for (let t = 0; t < trials; t++) {
    const result = runMissionTrial(crew, mission, priors, conditions, rng, criteriaIndex);
    chiSamples[t] = result.chi;
    qtlSamples[t] = result.qtl;
    for (const cid of Object.keys(perConditionSamples)) {
      perConditionSamples[cid][t] = result.perCondition[cid] ?? 0;
    }
  }

  const chiSummary = summarize9095(chiSamples);
  const pET = batchMeansCI(chiSamples, chiStar);
  const lostDaysSummary = summarize90(qtlSamples);

  const perConditionQTL: Record<string, PosteriorSummary> = {};
  for (const cid of Object.keys(perConditionSamples)) {
    perConditionQTL[cid] = summarize90(perConditionSamples[cid]);
  }

  const posterior: RiskPosteriorWithDiagnostics = {
    chi: { mean: chiSummary.mean, ci90: chiSummary.ci90, ci95: chiSummary.ci95 },
    pEarlyTermination: pET,
    expectedLostCrewDays: lostDaysSummary,
    perConditionQTL,
    ess: trials,
    trials,
  };
  if (options.diagnostics) posterior.diagnostics = { chiSamples, qtlSamples };
  return posterior;
}
