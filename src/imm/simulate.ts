// src/imm/simulate.ts
// Rng inlined — prng.ts does not export this type (matches incidence.ts convention)
type Rng = () => number;

/**
 * K15 §II.A.4 SPE rate constant: 1.5e-3 events/day (solar maximum estimate).
 * Source: Keenan 2015, ICES-2015-123, Table 1 — SPE frequency at solar max.
 * Used as λ_SPE in the homogeneous Poisson process that drives ARS sampling.
 */
const LAMBDA_SPE_PER_DAY = 1.5e-3;

import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMPrior } from "./types";
import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import { samplePoisson, sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli, samplePoissonProcess } from "./incidence";
import { sampleSeverity } from "./severity";
import { sampleBetaPert, concurrentFI } from "./outcomes";
import { interpolateBetaPertByRAF } from "./treatment";
import { computeRAF } from "./kits";

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
};

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

      let count = 0;
      if (cond.processType === "general-Poisson") {
        const baseLambda = (prior.incidence.distribution === "Fixed")
          ? prior.incidence.lambda_fixed! * mission.durationDays
          : 0;
        if (prior.incidence.distribution === "Fixed") {
          count = samplePoisson(rng, applyRiskFactorMultiplier(baseLambda, member, prior));
        } else {
          // For LN-Poisson / Gamma-Poisson, the prior implicitly is per-person-day; multiply by duration.
          const sampledOnePersonDay = sampleIncidence(rng, prior);
          count = sampledOnePersonDay; // could rescale; conservative for now
        }
      } else if (cond.processType === "space-adaptation-once") {
        // T24: once-per-mission cap — skip if this crew member already had this condition.
        if (processedSAOnce[cIdx].has(cond.id)) {
          count = 0;
        } else {
          const occ = sampleIncidence(rng, prior);
          if (occ > 0) {
            processedSAOnce[cIdx].add(cond.id);
            count = 1;
          }
        }
      } else if (cond.processType === "EVA-coupled") {
        for (let e = 0; e < member.EVA_count; e++) {
          if (sampleIncidence(rng, prior) > 0) count++;
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
        if (sampleIncidence(rng, prior) > 0) count = 1;
      }

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

  // T26: QTL with concurrent-FI per K15 §II.A.9: f_total = 1 − Π(1 − f_i).
  // Within-event concurrent FI: compose fi_cp1 and fi_cp2 multiplicatively.
  // QTL contribution = concurrentFI([fi_cp1, fi_cp2]) × (dt_cp1 + dt_cp2).
  //
  // DEFERRED: full cross-event concurrent FI (i.e., overlapping events from different
  // conditions on the same crew member composed together) is a v1.1 enhancement.
  // It requires a per-crew-member timeline integration of impairment intervals, which is
  // complex and currently not supported (each event's duration phases are treated as sequential).
  let qtl = 0;
  for (const o of occurrences) {
    const effectiveFI = concurrentFI([o.outcomes.fi_cp1, o.outcomes.fi_cp2]);
    qtl += effectiveFI * (o.outcomes.dt_cp1_hours + o.outcomes.dt_cp2_hours);
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
