// src/imm/simulate.ts
import { makeRng } from "../engine/prng";
import type { IMMOutcome, PosteriorSummary } from "./types";
// Rng inlined — prng.ts does not export this type (matches incidence.ts convention)
type Rng = () => number;

/**
 * K15 §II.A.4 SPE rate constant: 1.5e-3 events/day (solar maximum estimate).
 * Source: Keenan 2015, ICES-2015-123, Table 1 — SPE frequency at solar max.
 * Used as λ_SPE in the homogeneous Poisson process that drives ARS sampling.
 */
const LAMBDA_SPE_PER_DAY = 1.5e-3;

import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMPrior, IMMConditionFamily } from "./types";
import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import { samplePoisson, sampleLognormal, sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli, samplePoissonProcess } from "./incidence";
import { applyVulnerabilityMultiplier } from "../risk/incidence";
import { zScoreAgainstScale } from "../engine/normalize-cohort";
import { sampleGamma } from "../engine/gamma";
import { sampleSeverity } from "./severity";
// concurrentFI is exported from ./outcomes but not used in the per-event QTL
// loop (which uses sequential phase summation per K15 §II.A.9). Kept exported
// for the deferred cross-event v1.1 enhancement.
import { sampleBetaPert } from "./outcomes";
import { interpolateBetaPertByRAF } from "./treatment";
import { computeRAF } from "./kits";
import type { Criterion } from "../types";

/**
 * Family-specific β coefficients for Stage A z-scored vulnerability multiplier.
 * Negative β: HIGH-quality candidate (z>0 on higherIsBetter criteria) → exp(β·z) < 1 → λ↓.
 * Magnitudes calibrated so a ±2 SD spread produces a 2–4× incidence multiplier spread.
 * Same values as SYNTHETIC_PRIORS in src/data/synthetic-iter3.ts — these are the
 * authoritative operational values pending Phase 3B PyMC fit.
 */
const FAMILY_BETA: Partial<Record<IMMConditionFamily, number>> = {
  psychiatric:      -0.4,
  behavioral:       -0.3,
  neurologic:       -0.3,
  infectious:       -0.25,
  cardiovascular:   -0.25,
  musculoskeletal:  -0.2,
  respiratory:      -0.2,
  GI:               -0.15,
  renal:            -0.15,
  // "space-adaptation", "traumatic", "dental", "dermatologic", "ENT",
  // "endocrine", "GU", "hematologic", "ophthalmologic", "toxicologic" → default -0.2
};
const FAMILY_BETA_DEFAULT = -0.2;

type Occurrence = {
  conditionId: string;
  crewIndex: number;
  timeDays: number;
  severity: "best" | "worst";
  raf: number;
  // T25: sampled once per event — used for both earlyTerminated and per-condition aggregation
  evacSampled: 0 | 1;
  loclSampled: 0 | 1;
  outcomes: {
    fi_cp1: number; dt_cp1_hours: number;
    fi_cp2: number; dt_cp2_hours: number;
    fi_cp3: number;
    p_evac: number; p_locl: number;
  };
};

export type IMMTrialResult = {
  tme: number;
  qtl: number;             // Quality time lost (sum of f_total × dt across crew)
  evac: 0 | 1;
  locl: 0 | 1;
  perConditionCounts: Record<string, number>;
  perConditionEvac: Record<string, number>;
  perConditionLocl: Record<string, number>;
  /** Per-event RAF history (conditionId → raf). Populated only when opts.traceRAF=true. */
  rafHistory?: Array<{ conditionId: string; raf: number }>;
};

export type IMMTrialOpts = {
  /** Development-only trace flag — returns per-event RAF history in the result. */
  traceRAF?: boolean;
  /**
   * T31: Tier-C global incidence multiplier.
   * When supplied (default 1.0), all conditions with provenance === "tierC-synth"
   * have their sampled count scaled by this factor.
   * Used by calibrateTierCMultipliers() for coordinate-descent back-fitting to K15 Table 1.
   */
  tierCMultiplier?: number;
  /**
   * priors-rev3-b: Tier-A and Tier-B global incidence multipliers.
   * Mirror tierCMultiplier semantics for the other two provenance tiers.
   * Default 1.0 (no effect). Threaded by simulateIMM from calibration values
   * stored in imm-priors.json's global_calibration block.
   */
  tierAMultiplier?: number;
  tierBMultiplier?: number;
  /**
   * IC-5: Optional criteria index for Stage A z-scored vulnerability multiplier.
   * When provided, per-member stageAScores are z-scored and applied as an
   * additional lambda multiplier for conditions with non-empty vulnerabilityCriteria.
   * Missing when simulateIMM is called without a criteria catalog.
   */
  criteriaIndex?: ReadonlyMap<string, Criterion>;
};

/**
 * IC-5: Compute Stage A z-scored vulnerability multiplier for a condition.
 *
 * For each criterion referenced in vulnerabilityCriteria:
 *   1. Look up the criterion in criteriaIndex to get scale + higherIsBetter.
 *   2. Z-score the member's raw score: zScoreAgainstScale(raw, scale).
 *   3. Apply sign convention: higherIsBetter ? z : -z
 *      (HIGH raw on higherIsBetter=true → z>0; with β<0 → exp<1 → λ↓).
 *   4. Look up family β from FAMILY_BETA (default -0.2).
 *
 * Returns modifiedLambda = applyVulnerabilityMultiplier(baseLambda, beta, z).
 * Falls through to baseLambda when no criteria are present or no stageAScores.
 *
 * Production conditions currently have empty vulnerabilityCriteria (auto-generated
 * conditions.ts). This path becomes active once conditions are updated with real
 * criterion linkages (Iter-2+).
 */
export function applyStageAVulnerabilityMultiplier(
  baseLambda: number,
  member: IMMCrewMember,
  family: IMMConditionFamily,
  vulnerabilityCriteria: string[],
  criteriaIndex: ReadonlyMap<string, Criterion>,
): number {
  if (vulnerabilityCriteria.length === 0 || !member.stageAScores) return baseLambda;

  const beta: Record<string, number> = {};
  const z: Record<string, number> = {};
  const familyBeta = FAMILY_BETA[family] ?? FAMILY_BETA_DEFAULT;

  for (const cid of vulnerabilityCriteria) {
    const raw = member.stageAScores[cid];
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const c = criteriaIndex.get(cid);
    if (!c) continue;
    const zRaw = zScoreAgainstScale(raw, c.scale);
    const zSigned = c.higherIsBetter ? zRaw : -zRaw;
    beta[cid] = familyBeta;
    z[cid] = zSigned;
  }

  if (Object.keys(beta).length === 0) return baseLambda;
  return applyVulnerabilityMultiplier(baseLambda, beta, z);
}

/** Exported for testability — internal helper. */
export function applyRiskFactorMultiplier(baseLambda: number, member: IMMCrewMember, prior: IMMPrior): number {
  let lambda = baseLambda;
  const m = prior.risk_factor_multipliers;
  if (member.sex === "male" && m["sex-male"]) lambda *= m["sex-male"]!;
  if (member.sex === "female" && m["sex-female"]) lambda *= m["sex-female"]!;
  if (member.contacts && m["contacts"]) lambda *= m["contacts"]!;
  if (member.crowns && m["crowns"]) lambda *= m["crowns"]!;
  if (member.CAC_positive && m["CAC-positive"]) lambda *= m["CAC-positive"]!;
  if (member.abdominal_surgery_history && m["abdominal-surgery-history"]) lambda *= m["abdominal-surgery-history"]!;
  return lambda;
}

/**
 * Sample a per-mission-per-person event count for a general-Poisson condition.
 *
 * For Gamma-Poisson and Lognormal-Poisson the prior encodes a RATE (λ per person-day).
 * The count must be scaled by mission duration before Poisson sampling:
 *   1. Draw λ_per_day from the prior's hierarchical distribution.
 *   2. Apply per-person risk-factor multipliers to λ_per_day.
 *   3. IC-5: Apply Stage A z-scored vulnerability multiplier (if criteriaIndex provided).
 *   4. Sample Poisson(λ_modulated × durationDays).
 *
 * Beta-Bernoulli and Fixed distributions retain their existing semantics and are
 * handled directly in the general-Poisson branch of runIMMTrial.
 *
 * @internal — called only by the general-Poisson branch. SA/EVA/SPE paths use sampleIncidence.
 */
function sampleGeneralPoissonCount(
  rng: Rng,
  prior: IMMPrior,
  member: IMMCrewMember,
  durationDays: number,
  family: IMMConditionFamily,
  vulnerabilityCriteria: string[],
  criteriaIndex: ReadonlyMap<string, Criterion>,
  tierMult: number = 1.0,
): number {
  const inc = prior.incidence;
  if (inc.distribution === "Lognormal-Poisson") {
    const lambdaPerDay = sampleLognormal(rng, inc.mu_log_lambda!, inc.sigma_log_lambda!);
    const rfmLambda = applyRiskFactorMultiplier(lambdaPerDay, member, prior);
    const modLambda = applyStageAVulnerabilityMultiplier(rfmLambda, member, family, vulnerabilityCriteria, criteriaIndex);
    // rev3-b-followup: tierMult applied at the λ-sampling site → Poisson(λ · tierMult)
    // preserves both mean *and* variance (Var = λ · tierMult, not mult² · λ which
    // is what post-count stochastic rounding produced).
    return samplePoisson(rng, modLambda * durationDays * tierMult);
  }
  if (inc.distribution === "Gamma-Poisson") {
    const lambdaPerDay = sampleGamma(inc.alpha!, rng) / inc.beta!;
    const rfmLambda = applyRiskFactorMultiplier(lambdaPerDay, member, prior);
    const modLambda = applyStageAVulnerabilityMultiplier(rfmLambda, member, family, vulnerabilityCriteria, criteriaIndex);
    return samplePoisson(rng, modLambda * durationDays * tierMult);
  }
  // Fixed: already handled inline in the caller (lambda_fixed is a rate-per-day too)
  throw new Error(`E_BAD_PRIOR: sampleGeneralPoissonCount called with unsupported distribution ${inc.distribution}`);
}

function sampleIncidence(rng: Rng, prior: IMMPrior): number {
  const inc = prior.incidence;
  if (inc.distribution === "Lognormal-Poisson") return sampleLognormalPoisson(rng, inc.mu_log_lambda!, inc.sigma_log_lambda!);
  if (inc.distribution === "Gamma-Poisson")     return sampleGammaPoisson(rng, inc.alpha!, inc.beta!);
  if (inc.distribution === "Beta-Bernoulli")    return sampleBetaBernoulli(rng, inc.alpha!, inc.beta!);
  if (inc.distribution === "Fixed")             return samplePoisson(rng, inc.lambda_fixed!);
  throw new Error(`E_BAD_PRIOR: unknown distribution ${inc.distribution}`);
}

export function runIMMTrial(
  rng: Rng,
  crew: IMMCrewMember[],
  mission: IMMMission,
  kit: IMMKitScenario,
  opts: IMMTrialOpts = {},
): IMMTrialResult {
  const priors = loadIMMPriors();
  // T31: Tier-C global multiplier (default 1.0 → no change, preserves existing behaviour).
  const tierCMult = opts.tierCMultiplier ?? 1.0;
  // priors-rev3-b: Tier-A and Tier-B global multipliers (default 1.0).
  const tierAMult = opts.tierAMultiplier ?? 1.0;
  const tierBMult = opts.tierBMultiplier ?? 1.0;
  // IC-5: criteria index for Stage A z-scored vulnerability multiplier.
  const criteriaIndex: ReadonlyMap<string, Criterion> = opts.criteriaIndex ?? new Map();
  const availableResources: Record<string, number> = { ...kit.resources };
  const occurrences: Occurrence[] = [];
  const earlyTerminated = new Set<number>();
  const rafHistory: Array<{ conditionId: string; raf: number }> = [];

  // T23: Pre-sample SPE event times once per trial (one solar event affects all crew).
  // λ_SPE = LAMBDA_SPE_PER_DAY (solar max estimate per K15 §II.A.4).
  const speEventTimes = samplePoissonProcess(rng, LAMBDA_SPE_PER_DAY, mission.durationDays);

  // T24: Per-crew-member once-cap for space-adaptation conditions (Set of condition ids).
  const processedSAOnce: Set<string>[] = crew.map(() => new Set<string>());

  for (let cIdx = 0; cIdx < crew.length; cIdx++) {
    const member = crew[cIdx];
    if (earlyTerminated.has(cIdx)) continue;

    for (const cond of IMM_CONDITIONS) {
      const prior = priors.conditions[cond.id];
      if (!prior) continue;

      // rev3-b-followup: compute the per-prior tier multiplier ONCE up front so
      // every sampling-site call below can multiply at the correct mathematical
      // location (λ for Poisson; p for Bernoulli). Replaces the earlier
      // post-count stochastic-rounding block which preserved mean but distorted
      // variance for Poisson paths.
      let tierMult = 1.0;
      if (prior.provenance === "tierC-synth")     tierMult = tierCMult;
      else if (prior.provenance === "tierA-nasa") tierMult = tierAMult;
      else if (prior.provenance === "tierB-lit")  tierMult = tierBMult;

      let count = 0;
      if (cond.processType === "general-Poisson") {
        if (prior.incidence.distribution === "Fixed") {
          // Fixed: lambda_fixed is a per-person-day rate; scale by duration, then apply RFM.
          // IC-5: apply Stage A vulnerability multiplier on top of RFM.
          // rev3-b-followup: tierMult applied to λ directly (variance-preserving).
          const baseLambdaPerDay = prior.incidence.lambda_fixed!;
          const rfmLambdaPerDay = applyRiskFactorMultiplier(baseLambdaPerDay, member, prior);
          const modLambdaPerDay = applyStageAVulnerabilityMultiplier(rfmLambdaPerDay, member, cond.family, cond.vulnerabilityCriteria, criteriaIndex);
          count = samplePoisson(rng, modLambdaPerDay * mission.durationDays * tierMult);
        } else {
          // Gamma-Poisson / Lognormal-Poisson: draw λ/day from hierarchical prior, apply RFM,
          // IC-5 Stage A multiplier, then scale by mission duration before Poisson sampling.
          count = sampleGeneralPoissonCount(rng, prior, member, mission.durationDays, cond.family, cond.vulnerabilityCriteria, criteriaIndex, tierMult);
        }
      } else if (cond.processType === "space-adaptation-once") {
        // T24: once-per-mission cap — skip if this crew member already had this condition.
        // rev3-b-followup: tierMult applied per-Bernoulli (count is 0 or 1; product of
        // Bernoulli(p)·Bernoulli(mult) = Bernoulli(p·mult), variance-correct).
        if (processedSAOnce[cIdx].has(cond.id)) {
          count = 0;
        } else {
          const occ = sampleIncidence(rng, prior);
          if (occ > 0 && (tierMult === 1.0 || rng() < tierMult)) {
            processedSAOnce[cIdx].add(cond.id);
            count = 1;
          }
        }
      } else if (cond.processType === "EVA-coupled") {
        // rev3-b-followup: tierMult applied per-Bernoulli inside the per-EVA loop.
        // Sum of independent Bernoulli(p·mult) is Binomial(n, p·mult) — variance-correct.
        for (let e = 0; e < member.EVA_count; e++) {
          if (sampleIncidence(rng, prior) > 0 && (tierMult === 1.0 || rng() < tierMult)) count++;
        }
      } else if (cond.processType === "SPE-coupled") {
        // T23: Per-SPE-event Bernoulli via ARS prior (Beta-Bernoulli per event).
        // speEventTimes pre-sampled once per trial so all crew share the same solar timeline.
        // Occurrences created directly here to preserve timeDays = spe event time.
        const arsAlpha = prior.incidence.alpha ?? 2;
        const arsBeta  = prior.incidence.beta  ?? 18;
        for (const speTime of speEventTimes) {
          if (earlyTerminated.has(cIdx)) break;
          if (sampleBetaBernoulli(rng, arsAlpha, arsBeta) === 1) {
            const severity = sampleSeverity(rng, prior.severity.worst_case_prob_alpha, prior.severity.worst_case_prob_beta);
            const raf = computeRAF(prior.required_resources, availableResources);
            const fi_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp1, prior.untreated.fi_cp1, raf)) as [number, number, number]);
            const dt_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp1_hours, prior.untreated.dt_cp1_hours, raf)) as [number, number, number]);
            const fi_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp2, prior.untreated.fi_cp2, raf)) as [number, number, number]);
            const dt_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp2_hours, prior.untreated.dt_cp2_hours, raf)) as [number, number, number]);
            const fi_cp3 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp3, prior.untreated.fi_cp3, raf)) as [number, number, number]);
            const p_evac = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_evac, prior.untreated.p_evac, raf)) as [number, number, number]);
            const p_locl = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_locl, prior.untreated.p_locl, raf)) as [number, number, number]);
            const evacSampled: 0 | 1 = rng() < p_evac ? 1 : 0;
            const loclSampled: 0 | 1 = rng() < p_locl ? 1 : 0;
            occurrences.push({
              conditionId: cond.id, crewIndex: cIdx, timeDays: speTime, severity, raf,
              evacSampled, loclSampled,
              outcomes: { fi_cp1, dt_cp1_hours: dt_cp1, fi_cp2, dt_cp2_hours: dt_cp2, fi_cp3, p_evac, p_locl },
            });
            for (const [k, q] of Object.entries(prior.required_resources)) {
              availableResources[k] = Math.max(0, (availableResources[k] ?? 0) - q * raf);
            }
            if (evacSampled) earlyTerminated.add(cIdx);
            if (loclSampled) earlyTerminated.add(cIdx);
          }
        }
        count = 0; // SPE occurrences created directly above; skip the generic loop
      } else if (cond.processType === "SA-VIIP-late") {
        // rev3-b-followup: tierMult applied per-Bernoulli (single Bernoulli; variance-correct).
        if (sampleIncidence(rng, prior) > 0 && (tierMult === 1.0 || rng() < tierMult)) count = 1;
      }

      // rev3-b-followup (2026-05-22): the post-count stochastic-rounding block that
      // used to live here has been removed. tierMult is now threaded into every
      // distribution-specific sampling site above:
      //   - Lognormal/Gamma/Fixed Poisson → multiply λ before samplePoisson (variance-correct)
      //   - SA-once / EVA-coupled / SA-VIIP-late Bernoulli → multiply p per-Bernoulli
      //     (variance-correct because Bernoulli(p)·Bernoulli(mult) = Bernoulli(p·mult))
      //   - SPE-coupled → SPE schedule is external (sampled once per trial via
      //     samplePoissonProcess); tierMult does not apply to the SPE timeline itself,
      //     only to per-ARS-event Bernoulli inside the SPE branch — already handled
      //     inline above by the existing Beta-Bernoulli ARS draw, which is unaffected
      //     by tier multipliers (SPE is treated as physical infrastructure not as a
      //     condition prior we calibrate).
      // See docs/iter5_priors_rev3_strategy.md §8 and docs/iter5_scientific_limitations.md §3.3
      // for the rationale.

      // T24: Compute time-of-occurrence based on condition process type.
      // space-adaptation-once: peak day 2.5, range 0–5 (early adaptation window).
      // SA-VIIP-late: uniform over full mission (half-mission peak per spec).
      // All others: timeDays = 0 (no temporal tracking in v1).
      let condTimeDays = 0;
      if (cond.processType === "space-adaptation-once") {
        condTimeDays = sampleBetaPert(rng, 0, 2.5, 5);
      } else if (cond.processType === "SA-VIIP-late") {
        condTimeDays = sampleBetaPert(rng, 0, mission.durationDays / 2, mission.durationDays);
      }

      for (let e = 0; e < count; e++) {
        if (earlyTerminated.has(cIdx)) break;
        const severity = sampleSeverity(rng, prior.severity.worst_case_prob_alpha, prior.severity.worst_case_prob_beta);
        const raf = computeRAF(prior.required_resources, availableResources);
        if (opts.traceRAF) rafHistory.push({ conditionId: cond.id, raf });
        const fi_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp1, prior.untreated.fi_cp1, raf)) as [number, number, number]);
        const dt_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp1_hours, prior.untreated.dt_cp1_hours, raf)) as [number, number, number]);
        const fi_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp2, prior.untreated.fi_cp2, raf)) as [number, number, number]);
        const dt_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp2_hours, prior.untreated.dt_cp2_hours, raf)) as [number, number, number]);
        const fi_cp3 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp3, prior.untreated.fi_cp3, raf)) as [number, number, number]);
        const p_evac = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_evac, prior.untreated.p_evac, raf)) as [number, number, number]);
        const p_locl = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_locl, prior.untreated.p_locl, raf)) as [number, number, number]);
        const evacSampled: 0 | 1 = rng() < p_evac ? 1 : 0;
        const loclSampled: 0 | 1 = rng() < p_locl ? 1 : 0;
        occurrences.push({
          conditionId: cond.id, crewIndex: cIdx, timeDays: condTimeDays, severity, raf,
          evacSampled, loclSampled,
          outcomes: { fi_cp1, dt_cp1_hours: dt_cp1, fi_cp2, dt_cp2_hours: dt_cp2, fi_cp3, p_evac, p_locl },
        });
        // Decrement resources by RAF × required
        for (const [k, q] of Object.entries(prior.required_resources)) {
          const used = q * raf;
          availableResources[k] = Math.max(0, (availableResources[k] ?? 0) - used);
        }
        if (evacSampled) earlyTerminated.add(cIdx);
        if (loclSampled) earlyTerminated.add(cIdx);
      }
    }
  }

  // Aggregate trial outputs
  const tme = occurrences.length;

  // rev3-d (sequential phases) + rev3-e (cp3 enabled): K15 §II.A.9 per-event QTL.
  //
  //   K15 verbatim: "Given n overlapping functional impairments ⟨f₁, f₂, f₃, …, fₙ⟩
  //   at a point in time within a crewmember due to medical events, the overall
  //   functional impairment f_total can be calculated using f_total = 1 − Π(1 − f_i).
  //   ... Total quality time lost (QTL) over a mission is calculated as the SUM OF
  //   PRODUCTS of the functional impairments and durations."
  //
  // The concurrentFI formula applies to OVERLAPPING impairments at the same point
  // in time (cross-event overlap on the same crew member). Within a single event,
  // cp1 (diagnosis + initial treatment), cp2 (ongoing treatment + convalescence),
  // and cp3 (permanent impairment for remainder of mission) are SEQUENTIAL
  // clinical phases — they do not overlap. Per K15 §II.A.9 QTL = sum of f_i × dt_i.
  //
  // Pre-rev3-d code applied concurrentFI([fi_cp1, fi_cp2]) × (dt_cp1 + dt_cp2)
  // inside this loop, which over-estimated per-event QTL by ~2-3×. cp3 was sampled
  // but never charged to QTL. The rev3-b/c calibrations matched K15 by coincidence
  // — two errors cancelled.
  //
  // rev3-d shipped the unambiguous concurrent-FI sum-of-products fix and DEFERRED
  // cp3 because 80 of 100 priors had non-zero fi_cp3 elicited under the OLD
  // engine. rev3-e (this revision) completes the K15-correct math by re-enabling
  // cp3 after a per-condition fi_cp3 prior audit: 68 fully-resolving acute
  // conditions had treated.fi_cp3 = untreated.fi_cp3 = 0 set (URTI, GI, MSK
  // sprains, headaches, SA conditions, minor derm, etc. — see
  // `research/_priors_rev3e_fi_cp3_audit.md` for the per-condition decision
  // log); 32 conditions with genuine persistent-impairment risk (sepsis, cardiac
  // events, stroke, ARS, traumatic injuries, hearing loss, VIIP, etc.) retained
  // their current Beta-Pert distributions.
  //
  // cp3 charges fi_cp3 × (mission_end_hours − event_end_hours), clamped at 0.
  // For events with timeDays = 0 (general-Poisson default) this is essentially
  // the entire remaining mission. For SPE events and space-adaptation events
  // (which sample timeDays from a Beta-Pert), the cp3 charge is reduced by the
  // event's onset time.
  //
  // Cross-event concurrent FI (overlapping events from DIFFERENT conditions on the
  // same crewmember composed via concurrentFI) remains the v1.1 enhancement — it
  // requires a per-crewmember timeline integration of impairment intervals.
  // Currently events from different conditions are treated as non-overlapping in time.
  // peer-review-2 Issue 11: clamp cp1 + cp2 durations to remaining mission hours
  // so late-mission events don't over-count QTL beyond the mission end. cp3 was
  // already clamped; this extends the same discipline to cp1 and cp2.
  const missionDurationHours = mission.durationDays * 24;
  let qtl = 0;
  for (const o of occurrences) {
    const eventStartHours = o.timeDays * 24;
    const remainingFromEvent = Math.max(0, missionDurationHours - eventStartHours);
    // cp1 cannot extend past mission end.
    const dt_cp1_clamped = Math.min(o.outcomes.dt_cp1_hours, remainingFromEvent);
    const remainingAfterCp1 = Math.max(0, remainingFromEvent - dt_cp1_clamped);
    // cp2 starts after cp1 finishes; clamp to whatever mission time is left.
    const dt_cp2_clamped = Math.min(o.outcomes.dt_cp2_hours, remainingAfterCp1);
    qtl += o.outcomes.fi_cp1 * dt_cp1_clamped +
           o.outcomes.fi_cp2 * dt_cp2_clamped;
    // cp3: permanent impairment from end of cp2 to end of mission. For most
    // conditions fi_cp3 = 0 (rev3-e per-condition audit). Only persistent-
    // impairment conditions (32 of 100) contribute non-zero cp3 QTL.
    if (o.outcomes.fi_cp3 > 0) {
      const cp3StartHours = eventStartHours + dt_cp1_clamped + dt_cp2_clamped;
      const cp3DurationHours = Math.max(0, missionDurationHours - cp3StartHours);
      qtl += o.outcomes.fi_cp3 * cp3DurationHours;
    }
  }

  // T25: EVAC/LOCL aggregation uses per-event Bernoulli samples (not 0.5 threshold).
  // evacSampled/loclSampled are set once per occurrence above and reused here.
  let evac: 0 | 1 = 0, locl: 0 | 1 = 0;
  for (const o of occurrences) {
    if (o.evacSampled) evac = 1;
    if (o.loclSampled) locl = 1;
  }

  const perConditionCounts: Record<string, number> = {};
  const perConditionEvac: Record<string, number> = {};
  const perConditionLocl: Record<string, number> = {};
  for (const o of occurrences) {
    perConditionCounts[o.conditionId] = (perConditionCounts[o.conditionId] ?? 0) + 1;
    if (o.evacSampled) perConditionEvac[o.conditionId] = (perConditionEvac[o.conditionId] ?? 0) + 1;
    if (o.loclSampled) perConditionLocl[o.conditionId] = (perConditionLocl[o.conditionId] ?? 0) + 1;
  }

  return {
    tme, qtl, evac, locl, perConditionCounts, perConditionEvac, perConditionLocl,
    ...(opts.traceRAF ? { rafHistory } : {}),
  };
}

// ── Task 29: posteriorSummary + simulateIMM ───────────────────────────────────

function posteriorSummary(values: number[]): PosteriorSummary {
  const n = values.length;
  if (n === 0) return { mean: 0, ci90: [0, 0], ci95: [0, 0], sd: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  return {
    mean,
    ci90: [sorted[Math.floor(n * 0.05)], sorted[Math.floor(n * 0.95)]],
    ci95: [sorted[Math.floor(n * 0.025)], sorted[Math.floor(n * 0.975)]],
    sd,
  };
}

export function simulateIMM(opts: {
  crew: IMMCrewMember[];
  mission: IMMMission;
  kit: IMMKitScenario;
  trials: number;
  seed: number;
  /** T31: optional Tier-C global multiplier (default 1.0). */
  tierCMultiplier?: number;
  /** priors-rev3-b: optional Tier-A and Tier-B global multipliers (default 1.0). */
  tierAMultiplier?: number;
  tierBMultiplier?: number;
  /**
   * Crew Health Index threshold for Mission Success Probability (MSP).
   * A trial is a "success" when: evac===0 AND locl===0 AND CHI >= chiStar×100.
   * Defaults to 0.7 (70%) per spec §3.5 / Palinkas 2004 Antarctic anchor.
   */
  chiStar?: number;
  /**
   * IC-5: Optional criteria catalog for Stage A z-scored vulnerability multiplier.
   * When provided, per-member stageAScores are z-scored and applied as an
   * additional Poisson lambda multiplier for conditions with non-empty
   * vulnerabilityCriteria. Built as a ReadonlyMap before the trial loop.
   */
  criteria?: readonly Criterion[];
  /**
   * When true, returns per-trial CHI samples (percent scale) in
   * `outcome.diagnostics.chiSamples`. Used by R-hat convergence tests.
   * Omit or set false in production to avoid retaining a large array.
   */
  diagnostics?: boolean;
}): IMMOutcome {
  const { crew, mission, kit, trials, seed } = opts;
  const chiStar = opts.chiStar ?? 0.7;
  // priors-rev3-b: read global_calibration defaults for tier multipliers.
  const globalCal = loadIMMPriors().global_calibration;
  // IC-5: build criteria index once, pass to each trial.
  const criteriaIndex: ReadonlyMap<string, Criterion> = opts.criteria
    ? new Map(opts.criteria.map(c => [c.id, c]))
    : new Map();
  const chiStarPct = chiStar * 100;
  const rng = makeRng(seed);
  const L_hours = mission.durationDays * 24;
  const denom = L_hours * crew.length;

  const tmes: number[] = [], chis: number[] = [], evacs: number[] = [], locls: number[] = [];
  const missionSuccessFlags: number[] = [];
  const sigmaCheckpoints: number[] = [];
  const sigmaChi: number[] = [];
  const sigmaPevac: number[] = [];
  const perConditionCountsSum: Record<string, number> = {};
  const perConditionEvacSum: Record<string, number> = {};
  const perConditionLoclSum: Record<string, number> = {};

  for (let t = 1; t <= trials; t++) {
    const r = runIMMTrial(rng, crew, mission, kit, {
      // priors-rev3-b: explicit opts override priors.json defaults; if opts not
      // provided, fall back to global_calibration values (so the calibrated
      // multipliers auto-apply without every caller knowing to pass them).
      tierAMultiplier: opts.tierAMultiplier ?? globalCal.tierA_multiplier ?? 1.0,
      tierBMultiplier: opts.tierBMultiplier ?? globalCal.tierB_multiplier ?? 1.0,
      tierCMultiplier: opts.tierCMultiplier ?? globalCal.tierC_multiplier ?? 1.0,
      criteriaIndex,
    });
    tmes.push(r.tme);
    // CHI clamped at [0, 100] — QTL can exceed denom under pathological priors (v1 analogue of risk/simulate.ts §3.5 guard).
    const chiForTrial = Math.max(0, Math.min(100, 100 * (1 - r.qtl / denom)));
    chis.push(chiForTrial);
    evacs.push(r.evac);
    locls.push(r.locl);
    // MSP: trial is a "success" when EVAC=0 AND LOCL=0 AND CHI >= chiStar×100.
    // Flag is stored ×100 (percent scale) to match pEvac/pLocl convention.
    // NOTE: with current uncalibrated priors pEVAC ≈ 10–99%, so missionSuccess.mean
    // will be very low until priors are re-calibrated (see STATUS.md flagged backlog).
    const successFlag: 0 | 1 = (r.evac === 0 && r.locl === 0 && chiForTrial >= chiStarPct) ? 1 : 0;
    missionSuccessFlags.push(successFlag);
    for (const [k, v] of Object.entries(r.perConditionCounts)) perConditionCountsSum[k] = (perConditionCountsSum[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.perConditionEvac))   perConditionEvacSum[k]   = (perConditionEvacSum[k]   ?? 0) + v;
    for (const [k, v] of Object.entries(r.perConditionLocl))   perConditionLoclSum[k]   = (perConditionLoclSum[k]   ?? 0) + v;
    if (t % 1000 === 0) {
      const lastChi  = chis.slice(-1000);
      const lastEvac = evacs.slice(-1000);
      const meanChi  = lastChi.reduce((a, b) => a + b, 0) / 1000;
      const meanEvac = lastEvac.reduce((a, b) => a + b, 0) / 1000;
      const sChi  = Math.sqrt(lastChi.reduce((a, b) => a + (b - meanChi) ** 2, 0) / 1000);
      const sEvac = Math.sqrt(lastEvac.reduce((a, b) => a + (b - meanEvac) ** 2, 0) / 1000);
      sigmaCheckpoints.push(t);
      sigmaChi.push(sChi);
      sigmaPevac.push(sEvac);
    }
  }

  const drivers = IMM_CONDITIONS.map(c => ({
    conditionId: c.id,
    pEvacContrib: (perConditionEvacSum[c.id] ?? 0) / trials,
    pLoclContrib: (perConditionLoclSum[c.id] ?? 0) / trials,
    tmeContrib:   (perConditionCountsSum[c.id] ?? 0) / trials,
  }));

  const outcome: IMMOutcome = {
    tme:   posteriorSummary(tmes),
    chi:   posteriorSummary(chis),
    pEvac: posteriorSummary(evacs.map(x => x * 100)),
    pLocl: posteriorSummary(locls.map(x => x * 100)),
    // missionSuccess is stored ×100 (percent) — same convention as pEvac/pLocl.
    // Mean will be near 0 until priors are re-calibrated (pEVAC currently 10–99%).
    missionSuccess: posteriorSummary(missionSuccessFlags.map(x => x * 100)),
    perConditionDrivers: drivers,
    convergence: { trialCheckpoints: sigmaCheckpoints, sigmaChi, sigmaPevac },
  };
  if (opts.diagnostics) {
    outcome.diagnostics = { chiSamples: chis };
  }
  return outcome;
}
