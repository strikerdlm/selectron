import { SelectronError } from "@/engine/errors";
import { makeRng } from "@/engine/prng";
import { zScoreAgainstScale } from "@/engine/normalize-cohort";
import { DEMO_CRITERIA } from "@/data/demo-criteria";
import type {
  AnalogMission,
  Candidate,
  Condition,
  Criterion,
  SimulationInterval,
  RiskScenarioSummary,
  RiskScenarioResult,
} from "@/types";

import { computeCHI, computePEarlyTermination } from "./chi";
import {
  applyVulnerabilityMultiplier,
  sampleBinomial,
  samplePoisson,
  sampleGammaPoisson,
} from "./incidence";
import { sampleSeverity } from "./progression";
import { type PriorsJson, validatePriorsJson } from "./priorsSchema";
import { lostDays } from "./treatment";
import { conditionBehavior } from "./condition-behavior";
import { drawTrialLatentState, type TeamHyper, type TrialLatentState } from "./crew-state";
import { dyadFactor, heterogeneityFactor, weakestLinkFactor, attributeEvents } from "./crew-conditions";
import { integratedIntensity, firstEventFraction, type LatentClass } from "./temporal";

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

type TrialDiag = {
  teamFirstFractions: number[];
  latentClassFlags: number[];
  teamMemberConcentration: number[][];
};

export type RiskScenarioResultWithDiagnostics = RiskScenarioResult & {
  diagnostics?: {
    chiSamples: number[];
    qtlSamples: number[];
    teamFirstFractions?: number[];
    latentClassFlags?: number[];
    teamMemberConcentration?: number[][];
  };
};

const DEFAULT_CHI_STAR = 0.7;

const SALT_LATENT  = 0x00abcd04;
const SALT_MEDICAL = 0x00abcd01;
const SALT_PSYCH   = 0x00abcd02;
const SALT_CREW    = 0x00abcd03;

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

// Build a scale-relative vector for a crew member by looking up the criteria
// the condition flags as vulnerability drivers. This is not a population
// z-score: scale min maps to -2, midpoint to 0, and max to +2.
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

function defaultHyper(
  team: NonNullable<PriorsJson["team"]>,
  rng0: Rng,
): TeamHyper {
  const pick = (arr: number[]) =>
    arr[Math.min(Math.floor(rng0() * arr.length), arr.length - 1)];
  return {
    crewFrailtyPhi: pick(team.crew_frailty_phi_samples),
    memberFrailtyPhi: team.member_frailty_phi,
    piUnstableBase: team.pi_unstable_samples
      ? pick(team.pi_unstable_samples)
      : team.pi_unstable_base,
    alphaFit: team.alpha_fit,
    sigmaLogBeta: team.sigma_log_beta,
    fitCriterionId: "behavioral.teamwork",
  };
}

function accumulateLostDays(
  rng: Rng,
  cid: string,
  n: number,
  condPrior: PriorsJson["conditions"][string],
  mission: AnalogMission,
  perCondition: Record<string, number>,
): number {
  const tau = treatmentFraction(cid, mission);
  const dBest = lostDays(condPrior.untreated_lost_days_mean, condPrior.treated_lost_days_mean, tau);
  let q = 0;
  for (let j = 0; j < n; j++) {
    const severity = sampleSeverity(rng, condPrior.worst_case_prob_q);
    const dj = dBest * (severity === 1 ? WORST_CASE_MULTIPLIER : 1.0);
    q += dj;
    perCondition[cid] = (perCondition[cid] ?? 0) + dj;
  }
  return q;
}

function runCrewPass(
  crew: readonly Candidate[],
  mission: AnalogMission,
  conditions: readonly Condition[],
  priors: PriorsJson,
  team: NonNullable<PriorsJson["team"]>,
  latent: TrialLatentState,
  rng: Rng,
  idx: ReadonlyMap<string, Criterion>,
  perCondition: Record<string, number>,
  diag?: TrialDiag,
): number {
  let q = 0;
  const dyad = dyadFactor(crew.length, team.dyad_ref_n);
  if (dyad === 0) return 0;
  // proneness = conflict load = −quality_z; high teamwork (z>0) → low proneness
  const proneness = crew.map((m) => {
    const z = vulnerabilityVector(m, ["behavioral.teamwork"], idx)["behavioral.teamwork"];
    return Number.isFinite(z) ? -z : 0;
  });
  const het = heterogeneityFactor(proneness, team.beta_het);
  const weak = weakestLinkFactor(proneness, team.beta_weak);
  const intg = integratedIntensity(latent.latentClass as LatentClass, team.temporal_a, team.temporal_p);

  for (const c of conditions) {
    if (conditionBehavior(c).scope !== "crew") continue;
    const samples = team.lambda_base_samples[c.id];
    const condPrior = priors.conditions[c.id];
    if (!samples || samples.length === 0 || !condPrior) continue;
    const lambdaBase = samples[Math.min(Math.floor(rng() * samples.length), samples.length - 1)];
    const mean = lambdaBase * dyad * het * weak * mission.durationDays * intg * latent.crewFrailty;
    // Collect first-event fraction for conflict-event (diagnostics mode only).
    // Called before samplePoisson so rng ordering is predictable when diag enabled.
    if (diag && c.id === "conflict-event") {
      const frac = firstEventFraction(rng, mean, latent.latentClass as LatentClass, team.temporal_a, team.temporal_p);
      diag.teamFirstFractions.push(frac);
    }
    const n = samplePoisson(rng, mean);
    if (n === 0) continue;
    const attributed = attributeEvents(rng, n, proneness);
    if (diag) diag.teamMemberConcentration.push(attributed);
    q += accumulateLostDays(rng, c.id, n, condPrior, mission, perCondition);
  }
  return q;
}

export function runMissionTrial(
  crew: readonly Candidate[],
  mission: AnalogMission,
  priors: PriorsJson,
  conditions: readonly Condition[],
  seed: number,
  criteriaIndex?: ReadonlyMap<string, Criterion>,
  diag?: TrialDiag,
): TrialResult {
  const idx = criteriaIndex ?? new Map<string, Criterion>();
  let totalQTL = 0;
  const perCondition: Record<string, number> = {};

  // Phase 0 — shared latent state (dedicated substream)
  const team = priors.team;
  const rngLatent = makeRng((seed ^ SALT_LATENT) >>> 0);
  const hyper = team ? defaultHyper(team, rngLatent) : undefined;
  const latent: TrialLatentState | null =
    hyper ? drawTrialLatentState(crew, idx, hyper, rngLatent) : null;
  if (diag && latent) {
    diag.latentClassFlags.push(latent.latentClass);
  }

  // Phase 1a — medical/physiologic (UNCHANGED behavior, isolated substream)
  // Phase 1b — psychiatric/performance (frailty + latent temporal + NB)
  const rngMedical = makeRng((seed ^ SALT_MEDICAL) >>> 0);
  const rngPsych = makeRng((seed ^ SALT_PSYCH) >>> 0);

  for (const c of conditions) {
    const beh = conditionBehavior(c);
    if (beh.scope === "crew") continue; // handled in Phase 2
    const condPrior = priors.conditions[c.id];
    if (!condPrior) continue;
    const missionPrior = condPrior.missions[mission.type];
    if (!missionPrior) continue;
    const rng = beh.frailtyCoupled ? rngPsych : rngMedical;

    for (let mi = 0; mi < crew.length; mi++) {
      const member = crew[mi];
      const logLambda = sampleFromPosterior(rng, missionPrior.log_lambda_samples);
      const baseLambda = Math.exp(logLambda);
      const z = vulnerabilityVector(member, c.vulnerabilityCriteria, idx);
      const betaMap = latent
        ? Object.fromEntries(
            Object.entries(condPrior.vulnerability_beta).map(([k, v]) => [
              k,
              v * Math.exp(latent.betaLogShift),
            ]),
          )
        : condPrior.vulnerability_beta;
      let lambdaI = applyVulnerabilityMultiplier(baseLambda, betaMap, z);
      if (latent && beh.frailtyCoupled) {
        lambdaI *= latent.crewFrailty * latent.memberFrailty[mi];
      }

      let n = 0;
      if (c.kind === "rate") {
        let mean = lambdaI * mission.durationDays;
        if (latent && beh.temporal === "latent" && team) {
          mean *= integratedIntensity(
            latent.latentClass as LatentClass,
            team.temporal_a,
            team.temporal_p,
          );
        }
        n =
          beh.dispersion === "negbin" && team
            ? sampleGammaPoisson(rng, mean, team.member_frailty_phi)
            : samplePoisson(rng, mean);
      } else {
        // Spec §3.2: for event-triggered conditions, the log_lambda posterior
        // encodes log(p_event); after the vulnerability multiplier it can
        // overshoot 1 under extreme β·z combinations — clamp to a valid
        // binomial probability rather than throw, since this is a soft
        // model-misspec guard (not a programmer error).
        n = sampleBinomial(rng, mission.evaCount, clampProb(lambdaI));
      }
      if (n === 0) continue;
      totalQTL += accumulateLostDays(rng, c.id, n, condPrior, mission, perCondition);
    }
  }

  // Phase 2 — crew-level team conditions
  if (latent && team) {
    const rngCrew = makeRng((seed ^ SALT_CREW) >>> 0);
    totalQTL += runCrewPass(crew, mission, conditions, priors, team, latent, rngCrew, idx, perCondition, diag);
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

function summarize90(samples: readonly number[]): { mean: number; ci90: SimulationInterval } {
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
  ci90: SimulationInterval;
  ci95: SimulationInterval;
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
): { mean: number; ci90: SimulationInterval } {
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
): RiskScenarioResultWithDiagnostics {
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

  // Build criteria index once per simulation call (option (a) from plan G5:
  // testable, avoids re-importing inside the hot trial loop).
  const criteriaIndex: Map<string, Criterion> = new Map(
    DEMO_CRITERIA.map((c) => [c.id, c]),
  );

  const trials = options.trials;
  const chiSamples = new Array<number>(trials);
  const qtlSamples = new Array<number>(trials);
  const perConditionSamples: Record<string, number[]> = {};
  for (const c of conditions) perConditionSamples[c.id] = new Array<number>(trials).fill(0);

  const diagCollector: TrialDiag | undefined = options.diagnostics
    ? { teamFirstFractions: [], latentClassFlags: [], teamMemberConcentration: [] }
    : undefined;

  for (let t = 0; t < trials; t++) {
    const result = runMissionTrial(crew, mission, priors, conditions, (options.seed + t) >>> 0, criteriaIndex, diagCollector);
    chiSamples[t] = result.chi;
    qtlSamples[t] = result.qtl;
    for (const cid of Object.keys(perConditionSamples)) {
      perConditionSamples[cid][t] = result.perCondition[cid] ?? 0;
    }
  }

  const chiSummary = summarize9095(chiSamples);
  const pET = batchMeansCI(chiSamples, chiStar);
  const lostDaysSummary = summarize90(qtlSamples);

  const perConditionQTL: Record<string, RiskScenarioSummary> = {};
  for (const cid of Object.keys(perConditionSamples)) {
    perConditionQTL[cid] = summarize90(perConditionSamples[cid]);
  }

  const scenarioResult: RiskScenarioResultWithDiagnostics = {
    chi: { mean: chiSummary.mean, ci90: chiSummary.ci90, ci95: chiSummary.ci95 },
    pEarlyTermination: pET,
    expectedLostCrewDays: lostDaysSummary,
    perConditionQTL,
    ess: trials,
    trials,
  };
  if (options.diagnostics) {
    scenarioResult.diagnostics = {
      chiSamples,
      qtlSamples,
      ...(diagCollector
        ? {
            teamFirstFractions: diagCollector.teamFirstFractions,
            latentClassFlags: diagCollector.latentClassFlags,
            teamMemberConcentration: diagCollector.teamMemberConcentration,
          }
        : {}),
    };
  }
  return scenarioResult;
}
