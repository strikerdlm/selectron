// src/imm/simulate.ts
import { makeRng } from "../engine/prng";
import { SelectronError } from "../engine/errors";
import type { IMMOutcome, PosteriorSummary } from "./types";
// Rng inlined — prng.ts does not export this type (matches incidence.ts convention)
type Rng = () => number;

/**
 * K15 §II.A.4 SPE rate constant: 1.5e-3 events/day (solar maximum estimate).
 * Source: Keenan 2015, ICES-2015-123, Table 1 — SPE frequency at solar max.
 * Used as λ_SPE in the homogeneous Poisson process that drives ARS sampling.
 */
const LAMBDA_SPE_PER_DAY = 1.5e-3;

// ── Terrestrial analog guard ────────────────────────────────────────────────
// Conditions in the 100-condition IMM catalog that are physically impossible
// inside a 1-atm ground habitat with controlled ventilation (no microgravity,
// no ionising-radiation flux, no pressurised EVA suit, no ECLSS).
// Hard-excluded from activeConditions when mission.kind is a terrestrial kind.
// A hard filter is necessary — kind_multipliers cannot suppress SPE-coupled
// conditions because that branch explicitly bypasses the multiplier map
// (see the SPE-coupled branch below). The filter also removes impossible
// conditions from perConditionDrivers, which a zero-multiplier would not.
const TERRESTRIAL_MISSION_KINDS = new Set<IMMMissionKind>([
  "analog-controlled",
  "antarctic-station",
  "analog-isolation", // legacy kind literal; preserved for persisted Dexie sessions
]);

const SPACE_ONLY_PROCESS_TYPES = new Set<IMMProcessType>([
  "space-adaptation-once", // microgravity fluid-shift adaptations
  "EVA-coupled",           // pressurised-suit EVA operations
  "SPE-coupled",           // solar particle events (blocked by atmosphere)
  "SA-VIIP-late",          // long-duration microgravity VIIP
]);

// General-Poisson conditions that are specific to ISS/ECLSS infrastructure
// and therefore impossible in analog habitats with standard ventilation.
const ECLSS_CONDITION_IDS = new Set<string>([
  "headache-co2-induced",       // ECLSS CO2 scrubber failure
  "toxic-exposure-ammonia",     // ISS ammonia coolant loop
  "barotrauma-ear-sinus-block", // EVA suit pressurisation
]);

/** True when the mission is a terrestrial analog (ground-based, 1 atm, no ECLSS). */
export function isTerrestrialAnalog(kind: IMMMissionKind): boolean {
  return TERRESTRIAL_MISSION_KINDS.has(kind);
}

import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMPrior, IMMConditionFamily, IMMCondition, IMMMissionKind, IMMProcessType, VulnerabilityCouplingMode } from "./types";
import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import { applyProportionalHazardMultiplier, samplePoisson, sampleLognormal, sampleScaledBetaBernoulli, samplePoissonProcess } from "./incidence";
import { applyVulnerabilityMultiplier } from "../engine/vulnerability";
import { zScoreAgainstScale } from "../engine/normalize-cohort";
import { sampleGamma } from "../engine/gamma";
import { sampleSeverity } from "./severity";
import { sampleBetaPert } from "./outcomes";
import { interpolateBetaPertByRAF, selectSeverityOutcomes } from "./treatment";
import { computeRAF } from "./kits";
import { gateAvailable } from "./health-support";
import type { Criterion } from "../types";

/**
 * Family-specific β coefficients for Stage A z-scored vulnerability multiplier.
 * Negative β: HIGH-quality candidate (z>0 on higherIsBetter criteria) → exp(β·z) < 1 → λ↓.
 * Magnitudes calibrated so a ±2 SD spread produces a 2–4× incidence multiplier spread.
 * Same values as SYNTHETIC_PRIORS in src/data/synthetic-iter3.ts — these are the
 * operator-supplied scenario defaults, not accepted-ledger calibrated coefficients.
 */
export const FAMILY_BETA: Partial<Record<IMMConditionFamily, number>> = {
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
export const FAMILY_BETA_DEFAULT = -0.2;

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

type PendingOccurrence = {
  condition: IMMCondition;
  prior: IMMPrior;
  crewIndex: number;
  timeDays: number;
};

type ImpairmentInterval = {
  crewIndex: number;
  startHours: number;
  endHours: number;
  fi: number;
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
   * Optional criteria index for scenario-mode Stage A vulnerability multipliers.
   * Ignored unless vulnerabilityCouplingMode === "scenario".
   */
  criteriaIndex?: ReadonlyMap<string, Criterion>;
  /**
   * Scenario-analysis-only multiplier for FAMILY_BETA magnitudes.
   * Ignored unless vulnerabilityCouplingMode === "scenario". 0 disables
   * trait-to-incidence modulation; 1 keeps the current operator-supplied
   * defaults. Negative and non-finite values fall back to 1.
   */
  familyBetaScale?: number;
  /**
   * peer-review-2 §4.5: Leave-calibrated-out sensitivity analysis.
   * When provided, only conditions for which this callback returns true are
   * included in the simulation. Applied once before the trial loop for performance.
   * Use to exclude tier-B blanket-multiplier and tier-C back-fit conditions,
   * leaving only evidence-based (tier-A + source-cited tier-B) priors active.
   */
  conditionFilter?: (c: import("./types").IMMCondition) => boolean;
  /**
   * 2026-06-04: Per-(kind, condition) incidence multiplier for Antarctic /
   * controlled-habitat context modulation. Multiplier of 1.0 = no change vs.
   * base prior. >1 = elevated rate, <1 = reduced, 0 = no events. Default 1.0
   * for missing entries. Applied AFTER the tier multiplier (tierA/B/C) and
   * BEFORE risk-factor and Stage-A multipliers, so the variance-preserving
   * λ-site multiply holds.
   *
   * Sourced by `simulateIMM` from
   * `imm-priors.json::global_calibration.kind_multipliers[mission.kind]` when
   * the caller does not thread an explicit map. Tests can override directly.
   */
  kindMultipliers?: Record<string, number>;
  vulnerabilityCouplingMode?: VulnerabilityCouplingMode;
};

/**
 * IC-5: Compute Stage A z-scored vulnerability multiplier for a condition.
 *
 * For each criterion referenced in vulnerabilityCriteria:
 *   1. Look up the criterion in criteriaIndex to get scale + higherIsBetter.
 *   2. Z-score the member's raw score: zScoreAgainstScale(raw, scale).
 *   3. Apply sign convention: higherIsBetter ? z : -z
 *      (HIGH raw on higherIsBetter=true → z>0; with β<0 → exp<1 → λ↓).
 *   4. Look up the operator-supplied scenario β from FAMILY_BETA (default -0.2).
 *
 * Returns modifiedLambda = applyVulnerabilityMultiplier(baseLambda, beta, z).
 * Falls through to baseLambda when no criteria are present or no stageAScores.
 *
 * This function is only called with a non-empty criteria index in explicit
 * scenario mode. Default scientific runs leave incidence unchanged by Stage A.
 */
export function applyStageAVulnerabilityMultiplier(
  baseLambda: number,
  member: IMMCrewMember,
  family: IMMConditionFamily,
  vulnerabilityCriteria: string[],
  criteriaIndex: ReadonlyMap<string, Criterion>,
  familyBetaScale = 1.0,
): number {
  if (vulnerabilityCriteria.length === 0 || !member.stageAScores) return baseLambda;

  const beta: Record<string, number> = {};
  const z: Record<string, number> = {};
  // F9: fail closed. An invalid scale (NaN/negative) yields 0 effect (no
  // coupling), never a silent fallback to 1.0 (full assumed coupling). The
  // public simulateIMM API validates familyBetaScale before reaching here, so
  // this is defense-in-depth for direct callers of this exported helper.
  const safeScale = Number.isFinite(familyBetaScale) && familyBetaScale >= 0 ? familyBetaScale : 0;
  const familyBeta = (FAMILY_BETA[family] ?? FAMILY_BETA_DEFAULT) * safeScale;

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

function sampleTerminalOutcome(rng: Rng, pEvac: number, pLocl: number): { evac: 0 | 1; locl: 0 | 1 } {
  const loclP = Math.max(0, Math.min(1, pLocl));
  const evacP = Math.max(0, Math.min(1 - loclP, pEvac));
  const u = rng();
  if (u < loclP) return { evac: 0, locl: 1 };
  if (u < loclP + evacP) return { evac: 1, locl: 0 };
  return { evac: 0, locl: 0 };
}

function eventTimeFor(rng: Rng, cond: IMMCondition, mission: IMMMission, eventIndex: number): number {
  if (cond.processType === "space-adaptation-once") {
    return sampleBetaPert(rng, 0, 2.5, 5);
  }
  if (cond.processType === "SA-VIIP-late") {
    return sampleBetaPert(rng, 0, mission.durationDays / 2, mission.durationDays);
  }
  if (cond.processType === "EVA-coupled") {
    return mission.evaSchedule[eventIndex % Math.max(1, mission.evaSchedule.length)] ?? rng() * mission.durationDays;
  }
  // Homogeneous-hazard default for ordinary medical conditions.
  return rng() * mission.durationDays;
}

function addIntervalsForOccurrence(
  o: Occurrence,
  missionDurationHours: number,
  intervals: ImpairmentInterval[],
): void {
  const eventStartHours = o.timeDays * 24;
  const remainingFromEvent = Math.max(0, missionDurationHours - eventStartHours);
  const dtCp1 = Math.min(o.outcomes.dt_cp1_hours, remainingFromEvent);
  const cp1End = eventStartHours + dtCp1;
  if (dtCp1 > 0 && o.outcomes.fi_cp1 > 0) {
    intervals.push({ crewIndex: o.crewIndex, startHours: eventStartHours, endHours: cp1End, fi: o.outcomes.fi_cp1 });
  }

  const remainingAfterCp1 = Math.max(0, missionDurationHours - cp1End);
  const dtCp2 = Math.min(o.outcomes.dt_cp2_hours, remainingAfterCp1);
  const cp2End = cp1End + dtCp2;
  if (dtCp2 > 0 && o.outcomes.fi_cp2 > 0) {
    intervals.push({ crewIndex: o.crewIndex, startHours: cp1End, endHours: cp2End, fi: o.outcomes.fi_cp2 });
  }

  if (o.outcomes.fi_cp3 > 0) {
    const cp3Duration = Math.max(0, missionDurationHours - cp2End);
    if (cp3Duration > 0) {
      intervals.push({ crewIndex: o.crewIndex, startHours: cp2End, endHours: missionDurationHours, fi: o.outcomes.fi_cp3 });
    }
  }
}

function integrateOverlappingIntervals(intervals: ImpairmentInterval[], missionDurationHours: number, crewSize: number): number {
  let qtl = 0;
  for (let cIdx = 0; cIdx < crewSize; cIdx++) {
    const memberIntervals = intervals
      .filter((i) => i.crewIndex === cIdx && i.endHours > i.startHours && i.fi > 0)
      .map((i) => ({
        startHours: Math.max(0, Math.min(missionDurationHours, i.startHours)),
        endHours: Math.max(0, Math.min(missionDurationHours, i.endHours)),
        fi: Math.max(0, Math.min(1, i.fi)),
      }))
      .filter((i) => i.endHours > i.startHours);
    if (memberIntervals.length === 0) continue;
    const cuts = Array.from(new Set(memberIntervals.flatMap((i) => [i.startHours, i.endHours]))).sort((a, b) => a - b);
    for (let k = 0; k < cuts.length - 1; k++) {
      const start = cuts[k];
      const end = cuts[k + 1];
      if (end <= start) continue;
      let survival = 1;
      for (const i of memberIntervals) {
        if (i.startHours < end && i.endHours > start) survival *= (1 - i.fi);
      }
      qtl += (1 - survival) * (end - start);
    }
  }
  return qtl;
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
 *   3. Apply Stage A z-scored vulnerability multiplier only in scenario mode.
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
  familyBetaScale = 1.0,
): number {
  const inc = prior.incidence;
  if (inc.distribution === "Lognormal-Poisson") {
    const lambdaPerDay = sampleLognormal(rng, inc.mu_log_lambda!, inc.sigma_log_lambda!);
    const rfmLambda = applyRiskFactorMultiplier(lambdaPerDay, member, prior);
    const modLambda = applyStageAVulnerabilityMultiplier(rfmLambda, member, family, vulnerabilityCriteria, criteriaIndex, familyBetaScale);
    // rev3-b-followup: tierMult applied at the λ-sampling site → Poisson(λ · tierMult)
    // preserves both mean *and* variance (Var = λ · tierMult, not mult² · λ which
    // is what post-count stochastic rounding produced).
    return samplePoisson(rng, modLambda * durationDays * tierMult);
  }
  if (inc.distribution === "Gamma-Poisson") {
    const lambdaPerDay = sampleGamma(inc.alpha!, rng) / inc.beta!;
    const rfmLambda = applyRiskFactorMultiplier(lambdaPerDay, member, prior);
    const modLambda = applyStageAVulnerabilityMultiplier(rfmLambda, member, family, vulnerabilityCriteria, criteriaIndex, familyBetaScale);
    return samplePoisson(rng, modLambda * durationDays * tierMult);
  }
  // Fixed: already handled inline in the caller (lambda_fixed is a rate-per-day too)
  throw new Error(`E_BAD_PRIOR: sampleGeneralPoissonCount called with unsupported distribution ${inc.distribution}`);
}

function sampleRateFromPrior(rng: Rng, prior: IMMPrior): number {
  const inc = prior.incidence;
  if (inc.distribution === "Lognormal-Poisson") return sampleLognormal(rng, inc.mu_log_lambda!, inc.sigma_log_lambda!);
  if (inc.distribution === "Gamma-Poisson") return sampleGamma(inc.alpha!, rng) / inc.beta!;
  if (inc.distribution === "Fixed") return inc.lambda_fixed ?? 0;
  throw new Error(`E_BAD_PRIOR: sampleRateFromPrior called with unsupported distribution ${inc.distribution}`);
}

function sampleSingleOccurrenceWithMultiplier(
  rng: Rng,
  prior: IMMPrior,
  multiplier: number,
  exposureUnits: number,
): 0 | 1 {
  if (!Number.isFinite(multiplier) || multiplier <= 0 || exposureUnits <= 0) return 0;

  const inc = prior.incidence;
  if (inc.distribution === "Beta-Bernoulli") {
    return sampleScaledBetaBernoulli(rng, inc.alpha!, inc.beta!, multiplier);
  }

  const rate = Math.max(0, sampleRateFromPrior(rng, prior));
  const baseP = 1 - Math.exp(-rate * exposureUnits);
  const scaledP = applyProportionalHazardMultiplier(baseP, multiplier);
  return rng() < scaledP ? 1 : 0;
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
  // Analog-audit correction: Stage-A-to-incidence coupling is scenario analysis
  // only. Scientific/default mode ignores stageAScores even when a caller passes
  // a criteria catalog for UI or trace purposes.
  const criteriaIndex: ReadonlyMap<string, Criterion> =
    opts.vulnerabilityCouplingMode === "scenario"
      ? opts.criteriaIndex ?? new Map()
      : new Map();
  // F9: in scenario mode an invalid scale fails closed to 0 (no coupling
  // effect) rather than silently defaulting to 1.0 (full assumed coupling).
  // The public simulateIMM API validates before reaching here; this is
  // defense-in-depth for direct callers of runIMMTrial.
  const familyBetaScale =
    opts.vulnerabilityCouplingMode === "scenario" &&
    opts.familyBetaScale !== undefined &&
    Number.isFinite(opts.familyBetaScale) &&
    opts.familyBetaScale >= 0
      ? opts.familyBetaScale
      : (opts.vulnerabilityCouplingMode === "scenario" ? 0 : 1.0);
  // peer-review-2 §4.5 + 2026-06-05 terrestrial guard: filter active conditions
  // once per trial (not per-crew-member) for O(|conditions|) overhead.
  // For terrestrial analog missions, space-only processTypes and ECLSS-specific
  // conditions are hard-excluded before the trial loop — kind_multipliers cannot
  // reach SPE-coupled conditions (that branch bypasses the multiplier map), and
  // a filter-level exclusion also removes impossible conditions from
  // perConditionDrivers, which a zero-multiplier would not.
  const isTerrestrialMission = TERRESTRIAL_MISSION_KINDS.has(mission.kind);
  const activeConditions = IMM_CONDITIONS.filter((cond: IMMCondition) => {
    if (isTerrestrialMission &&
        (SPACE_ONLY_PROCESS_TYPES.has(cond.processType) || ECLSS_CONDITION_IDS.has(cond.id))) {
      return false;
    }
    return opts.conditionFilter ? opts.conditionFilter(cond) : true;
  });

  // Health-Support gating: scale each resource by the tier's per-delivery-class
  // deliverability before RAF. Identity for issHMS/unlimited (K15 invariant);
  // only bites for none/medium. See src/imm/health-support.ts.
  const availableResources: Record<string, number> = gateAvailable(kit.resources, kit.scenarioId);
  const pendingOccurrences: PendingOccurrence[] = [];
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

    for (const cond of activeConditions) {
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
      else if (prior.provenance === "tierB-pymc") tierMult = tierBMult;
      // 2026-06-04: kind-level modulation. Multiplied into the λ-site (and per-
      // Bernoulli) path so variance-preserving Poisson scaling holds. Skip
      // non-numeric / sentinel keys (e.g. `_doc_` documentation string in
      // imm-priors.json — present as a kind-mission-keyed entry, not a real
      // multiplier; we only index by conditionId so this is a non-issue, but
      // guard the lookup with a typeof check for forward-compat).
      const rawKindMult = opts.kindMultipliers?.[cond.id];
      const kindMult = (typeof rawKindMult === "number" && Number.isFinite(rawKindMult)) ? rawKindMult : 1.0;
      const effectiveMult = tierMult * kindMult;

      let count = 0;
      if (cond.processType === "general-Poisson") {
        if (prior.incidence.distribution === "Fixed") {
          // Fixed: lambda_fixed is a per-person-day rate; scale by duration, then apply RFM.
          // Scenario mode: apply Stage A vulnerability multiplier on top of RFM.
          // rev3-b-followup: tierMult applied to λ directly (variance-preserving).
          // 2026-06-04: kindMult threaded into effectiveMult.
          const baseLambdaPerDay = prior.incidence.lambda_fixed!;
          const rfmLambdaPerDay = applyRiskFactorMultiplier(baseLambdaPerDay, member, prior);
          const modLambdaPerDay = applyStageAVulnerabilityMultiplier(rfmLambdaPerDay, member, cond.family, cond.vulnerabilityCriteria, criteriaIndex, familyBetaScale);
          count = samplePoisson(rng, modLambdaPerDay * mission.durationDays * effectiveMult);
        } else {
          // Gamma-Poisson / Lognormal-Poisson: draw λ/day from hierarchical prior, apply RFM,
          // optional scenario Stage A multiplier, then scale by mission duration before Poisson sampling.
          count = sampleGeneralPoissonCount(rng, prior, member, mission.durationDays, cond.family, cond.vulnerabilityCriteria, criteriaIndex, effectiveMult, familyBetaScale);
        }
      } else if (cond.processType === "space-adaptation-once") {
        // T24: once-per-mission cap — skip if this crew member already had this condition.
        if (processedSAOnce[cIdx].has(cond.id)) {
          count = 0;
        } else if (sampleSingleOccurrenceWithMultiplier(rng, prior, effectiveMult, mission.durationDays)) {
          processedSAOnce[cIdx].add(cond.id);
          count = 1;
        }
      } else if (cond.processType === "EVA-coupled") {
        // Per-EVA occurrence path. Multiplier is applied to the sampled event
        // probability through proportional-hazard scaling so values >1 elevate
        // risk instead of being silently capped by a second Bernoulli gate.
        for (let e = 0; e < member.EVA_count; e++) {
          if (sampleSingleOccurrenceWithMultiplier(rng, prior, effectiveMult, 1)) count++;
        }
      } else if (cond.processType === "SPE-coupled") {
        // T23: Per-SPE-event Bernoulli via ARS prior (Beta-Bernoulli per event).
        // speEventTimes pre-sampled once per trial so all crew share the same solar timeline.
        // Occurrences created directly here to preserve timeDays = spe event time.
        // 2026-06-04: SPE-coupled path does NOT apply kind_mult. SPE timelines are
        // physical infrastructure (Keenan 2015 λ_SPE_PER_DAY), not per-mission
        // context. Per-event ARS Bernoulli still uses effectiveMult in the
        // tier-only path (effectiveMult = tierMult × kindMult, kindMult=1 for
        // non-mapped conditions, which is all conditions in the SPE-coupled
        // set today).
        const arsAlpha = prior.incidence.alpha ?? 2;
        const arsBeta  = prior.incidence.beta  ?? 18;
        for (const speTime of speEventTimes) {
          if (sampleScaledBetaBernoulli(rng, arsAlpha, arsBeta, effectiveMult) === 1) {
            pendingOccurrences.push({ condition: cond, prior, crewIndex: cIdx, timeDays: speTime });
          }
        }
        count = 0; // SPE occurrences created directly above; skip the generic loop
      } else if (cond.processType === "SA-VIIP-late") {
        // Single late-mission occurrence path under the same probability
        // scaling as other Bernoulli-style processes.
        if (sampleSingleOccurrenceWithMultiplier(rng, prior, effectiveMult, mission.durationDays)) count = 1;
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

      for (let e = 0; e < count; e++) {
        pendingOccurrences.push({
          condition: cond,
          prior,
          crewIndex: cIdx,
          timeDays: eventTimeFor(rng, cond, mission, e),
        });
      }
    }
  }

  pendingOccurrences.sort((a, b) => a.timeDays - b.timeDays || a.crewIndex - b.crewIndex || a.condition.id.localeCompare(b.condition.id));
  for (const pending of pendingOccurrences) {
    if (earlyTerminated.has(pending.crewIndex)) continue;
    const { condition: cond, prior } = pending;
    const severity = sampleSeverity(rng, prior.severity.worst_case_prob_alpha, prior.severity.worst_case_prob_beta);
    const severityOutcomes = selectSeverityOutcomes(prior, severity);
    const raf = computeRAF(prior.required_resources, availableResources);
    if (opts.traceRAF) rafHistory.push({ conditionId: cond.id, raf });
    const fi_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.fi_cp1, severityOutcomes.untreated.fi_cp1, raf)) as [number, number, number]);
    const dt_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.dt_cp1_hours, severityOutcomes.untreated.dt_cp1_hours, raf)) as [number, number, number]);
    const fi_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.fi_cp2, severityOutcomes.untreated.fi_cp2, raf)) as [number, number, number]);
    const dt_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.dt_cp2_hours, severityOutcomes.untreated.dt_cp2_hours, raf)) as [number, number, number]);
    const fi_cp3 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.fi_cp3, severityOutcomes.untreated.fi_cp3, raf)) as [number, number, number]);
    const p_evac = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.p_evac, severityOutcomes.untreated.p_evac, raf)) as [number, number, number]);
    const p_locl = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(severityOutcomes.treated.p_locl, severityOutcomes.untreated.p_locl, raf)) as [number, number, number]);
    const terminal = sampleTerminalOutcome(rng, p_evac, p_locl);
    occurrences.push({
      conditionId: cond.id, crewIndex: pending.crewIndex, timeDays: pending.timeDays, severity, raf,
      evacSampled: terminal.evac, loclSampled: terminal.locl,
      outcomes: { fi_cp1, dt_cp1_hours: dt_cp1, fi_cp2, dt_cp2_hours: dt_cp2, fi_cp3, p_evac, p_locl },
    });
    for (const [k, q] of Object.entries(prior.required_resources)) {
      const used = q * raf;
      availableResources[k] = Math.max(0, (availableResources[k] ?? 0) - used);
    }
    if (terminal.evac || terminal.locl) earlyTerminated.add(pending.crewIndex);
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
  // General-Poisson events now receive sampled onset times, all events are
  // processed chronologically for resource consumption, and overlapping
  // impairment intervals are integrated per crewmember via concurrent FI.
  // peer-review-2 Issue 11: clamp cp1 + cp2 durations to remaining mission hours
  // so late-mission events don't over-count QTL beyond the mission end. cp3 was
  // already clamped; this extends the same discipline to cp1 and cp2.
  const missionDurationHours = mission.durationDays * 24;
  const intervals: ImpairmentInterval[] = [];
  for (const o of occurrences) addIntervalsForOccurrence(o, missionDurationHours, intervals);
  const qtl = integrateOverlappingIntervals(intervals, missionDurationHours, crew.length);

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
   * Crew Health Index threshold for the composite health criterion.
   * A trial meets the criterion when: evac===0 AND locl===0 AND CHI >= chiStar×100.
   */
  chiStar?: number;
  /**
   * Optional criteria catalog for Stage A z-scored vulnerability multipliers.
   * Ignored unless vulnerabilityCouplingMode === "scenario".
   */
  criteria?: readonly Criterion[];
  vulnerabilityCouplingMode?: VulnerabilityCouplingMode;
  /**
   * Scenario-analysis-only multiplier for FAMILY_BETA magnitudes.
   * Ignored unless vulnerabilityCouplingMode === "scenario".
   */
  familyBetaScale?: number;
  /**
   * When true, returns per-trial CHI samples (percent scale) in
   * `outcome.diagnostics.chiSamples`. Used by R-hat convergence tests.
   * Omit or set false in production to avoid retaining a large array.
   */
  diagnostics?: boolean;
  /**
   * peer-review-2 §4.5: Leave-calibrated-out sensitivity analysis.
   * When provided, only conditions for which this callback returns true are
   * simulated. Applied once per trial before iterating conditions.
   * Threaded into runIMMTrial as conditionFilter.
   */
  conditionFilter?: (c: import("./types").IMMCondition) => boolean;
  /**
   * 2026-06-04: Optional explicit per-(kind, condition) multiplier map.
   * When provided, takes precedence over the auto-loaded
   * `global_calibration.kind_multipliers[mission.kind]` block. When omitted,
   * the wrapper auto-loads the per-kind map from imm-priors.json; for any
   * kind without an entry (e.g. leo-iss), the engine falls through to 1.0.
   */
  kindMultipliers?: Record<string, number>;
}): IMMOutcome {
  const { crew, mission, kit, trials, seed } = opts;
  const chiStar = opts.chiStar ?? 0.7;
  // F9: fail-closed input validation. The UI constrains most of these, but the
  // public simulation API must not silently accept invalid scenario controls.
  // A negative/non-finite familyBetaScale previously fell back to 1.0 (full
  // assumed coupling), masking invalid input as a strong scientific assumption;
  // it now throws. Kit resources may be +Infinity (the "unlimited" kit), but
  // never NaN or negative; multipliers/scales must be finite and non-negative.
  const _bad = (msg: string, details?: Record<string, unknown>) =>
    new SelectronError("E_BAD_SCENARIO_CONTROL", msg, details);
  if (!Number.isInteger(trials) || trials <= 0) {
    throw _bad(`trials must be a positive integer, got ${trials}`, { trials });
  }
  if (!Array.isArray(crew) || crew.length === 0) {
    throw _bad("crew must be a non-empty array", { crewLength: crew?.length });
  }
  if (!Number.isFinite(mission.durationDays) || mission.durationDays <= 0) {
    throw _bad(`mission.durationDays must be positive and finite, got ${mission.durationDays}`, { durationDays: mission.durationDays });
  }
  if (!Number.isFinite(chiStar) || chiStar < 0 || chiStar > 1) {
    throw _bad(`chiStar must be within [0, 1], got ${chiStar}`, { chiStar });
  }
  if (opts.familyBetaScale !== undefined) {
    const s = opts.familyBetaScale;
    if (!Number.isFinite(s) || s < 0) {
      throw _bad(`familyBetaScale must be a finite non-negative number, got ${s}`, { familyBetaScale: s });
    }
  }
  for (const [k, q] of Object.entries(kit.resources ?? {})) {
    // +Infinity is allowed (unlimited kit); NaN and negatives are not.
    if (Number.isNaN(q) || q < 0) {
      throw _bad(`kit.resources[${k}] must be non-negative (Infinity allowed for unlimited), got ${q}`, { key: k, value: q });
    }
  }
  for (const [k, m] of Object.entries(opts.kindMultipliers ?? {})) {
    if (!Number.isFinite(m) || m < 0) {
      throw _bad(`kindMultipliers[${k}] must be finite and non-negative, got ${m}`, { key: k, value: m });
    }
  }
  for (const [name, m] of [["tierAMultiplier", opts.tierAMultiplier], ["tierBMultiplier", opts.tierBMultiplier], ["tierCMultiplier", opts.tierCMultiplier]] as const) {
    if (m !== undefined && (!Number.isFinite(m) || m < 0)) {
      throw _bad(`${name} must be finite and non-negative, got ${m}`, { name, value: m });
    }
  }
  // priors-rev3-b: read global_calibration defaults for tier multipliers.
  const globalCal = loadIMMPriors().global_calibration;
  // 2026-06-04: kind_multipliers auto-load. Caller's explicit override wins;
  // otherwise look up the per-kind map from JSON. Any (kind, condition) pair
  // not in the map falls through to 1.0 in the engine, so absence of a kind
  // entry is safe (leo-iss / analog-isolation etc. all get the 1.0 baseline).
  const kindMultAuto = globalCal.kind_multipliers?.[mission.kind] ?? {};
  const effectiveKindMults = opts.kindMultipliers ?? kindMultAuto;
  // IC-5: build criteria index once, pass to each trial.
  const criteriaIndex: ReadonlyMap<string, Criterion> = opts.criteria
    ? new Map(opts.criteria.map(c => [c.id, c]))
    : new Map();
  const chiStarPct = chiStar * 100;
  const rng = makeRng(seed);
  const L_hours = mission.durationDays * 24;
  const denom = L_hours * crew.length;

  const tmes: number[] = [], chis: number[] = [], evacs: number[] = [], locls: number[] = [];
  const healthCriterionFlags: number[] = [];
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
      // 2026-06-04: thread the resolved per-(kind, condition) multiplier map.
      // Empty object / missing keys → 1.0 fallthrough in runIMMTrial.
      kindMultipliers: effectiveKindMults,
      vulnerabilityCouplingMode: opts.vulnerabilityCouplingMode ?? "off",
      familyBetaScale: opts.familyBetaScale,
      criteriaIndex,
      conditionFilter: opts.conditionFilter,
    });
    tmes.push(r.tme);
    // CHI clamped at [0, 100] — QTL can exceed denom under pathological priors (v1 analogue of risk/simulate.ts §3.5 guard).
    const chiForTrial = Math.max(0, Math.min(100, 100 * (1 - r.qtl / denom)));
    chis.push(chiForTrial);
    evacs.push(r.evac);
    locls.push(r.locl);
    // Composite health criterion: trial meets the criterion when EVAC=0,
    // LOCL=0, and CHI >= chiStar×100.
    // Flag is stored ×100 (percent scale) to match pEvac/pLocl convention.
    const criterionFlag: 0 | 1 = (r.evac === 0 && r.locl === 0 && chiForTrial >= chiStarPct) ? 1 : 0;
    healthCriterionFlags.push(criterionFlag);
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

  // Mirror the terrestrial guard used in runIMMTrial so that space-only conditions
  // are also absent from perConditionDrivers (not just absent from the simulation).
  const isTerrestrialForDrivers = TERRESTRIAL_MISSION_KINDS.has(mission.kind);
  const driverConditions = isTerrestrialForDrivers
    ? IMM_CONDITIONS.filter(c =>
        !SPACE_ONLY_PROCESS_TYPES.has(c.processType) && !ECLSS_CONDITION_IDS.has(c.id))
    : IMM_CONDITIONS;
  const drivers = driverConditions.map(c => ({
    conditionId: c.id,
    pEvacContrib: (perConditionEvacSum[c.id] ?? 0) / trials,
    pLoclContrib: (perConditionLoclSum[c.id] ?? 0) / trials,
    tmeContrib:   (perConditionCountsSum[c.id] ?? 0) / trials,
  }));

  const healthCriterionAttainment = posteriorSummary(healthCriterionFlags.map(x => x * 100));
  const outcome: IMMOutcome = {
    tme:   posteriorSummary(tmes),
    chi:   posteriorSummary(chis),
    pEvac: posteriorSummary(evacs.map(x => x * 100)),
    pLocl: posteriorSummary(locls.map(x => x * 100)),
    healthCriterionAttainment,
    // Legacy alias for persisted sessions and existing scripts/tests.
    missionSuccess: healthCriterionAttainment,
    perConditionDrivers: drivers,
    convergence: { trialCheckpoints: sigmaCheckpoints, sigmaChi, sigmaPevac },
  };
  if (opts.diagnostics) {
    outcome.diagnostics = { chiSamples: chis };
  }
  return outcome;
}
