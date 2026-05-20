// src/imm/simulate.ts
// Rng inlined — prng.ts does not export this type (matches incidence.ts convention)
type Rng = () => number;
import type { IMMCrewMember, IMMMission, IMMKitScenario, IMMPrior } from "./types";
import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import { samplePoisson, sampleLognormalPoisson, sampleGammaPoisson, sampleBetaBernoulli } from "./incidence";
import { sampleSeverity } from "./severity";
import { sampleBetaPert } from "./outcomes";
import { interpolateBetaPertByRAF } from "./treatment";
import { computeRAF } from "./kits";

type Occurrence = {
  conditionId: string;
  crewIndex: number;
  timeDays: number;
  severity: "best" | "worst";
  raf: number;
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
};

function applyRiskFactorMultiplier(baseLambda: number, member: IMMCrewMember, prior: IMMPrior): number {
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
): IMMTrialResult {
  const priors = loadIMMPriors();
  const availableResources: Record<string, number> = { ...kit.resources };
  const occurrences: Occurrence[] = [];
  const earlyTerminated = new Set<number>();

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
        const occ = sampleIncidence(rng, prior);
        count = occ > 0 ? 1 : 0;
      } else if (cond.processType === "EVA-coupled") {
        for (let e = 0; e < member.EVA_count; e++) {
          if (sampleIncidence(rng, prior) > 0) count++;
        }
      } else if (cond.processType === "SPE-coupled") {
        // Simplified: treat as Bernoulli per mission. Full SPE process is in Task 23.
        if (sampleIncidence(rng, prior) > 0) count = 1;
      } else if (cond.processType === "SA-VIIP-late") {
        if (sampleIncidence(rng, prior) > 0) count = 1;
      }

      for (let e = 0; e < count; e++) {
        if (earlyTerminated.has(cIdx)) break;
        const severity = sampleSeverity(rng, prior.severity.worst_case_prob_alpha, prior.severity.worst_case_prob_beta);
        const raf = computeRAF(prior.required_resources, availableResources);
        const fi_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp1, prior.untreated.fi_cp1, raf)) as [number, number, number]);
        const dt_cp1 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp1_hours, prior.untreated.dt_cp1_hours, raf)) as [number, number, number]);
        const fi_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp2, prior.untreated.fi_cp2, raf)) as [number, number, number]);
        const dt_cp2 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.dt_cp2_hours, prior.untreated.dt_cp2_hours, raf)) as [number, number, number]);
        const fi_cp3 = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.fi_cp3, prior.untreated.fi_cp3, raf)) as [number, number, number]);
        const p_evac = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_evac, prior.untreated.p_evac, raf)) as [number, number, number]);
        const p_locl = sampleBetaPert(rng, ...Object.values(interpolateBetaPertByRAF(prior.treated.p_locl, prior.untreated.p_locl, raf)) as [number, number, number]);
        occurrences.push({
          conditionId: cond.id, crewIndex: cIdx, timeDays: 0, severity, raf,
          outcomes: { fi_cp1, dt_cp1_hours: dt_cp1, fi_cp2, dt_cp2_hours: dt_cp2, fi_cp3, p_evac, p_locl },
        });
        // Decrement resources by RAF × required
        for (const [k, q] of Object.entries(prior.required_resources)) {
          const used = q * raf;
          availableResources[k] = Math.max(0, (availableResources[k] ?? 0) - used);
        }
        // End-state Bernoullis
        if (rng() < p_evac) { earlyTerminated.add(cIdx); }
        if (rng() < p_locl) { earlyTerminated.add(cIdx); }
      }
    }
  }

  // Aggregate trial outputs
  const tme = occurrences.length;

  // QTL: per-crewmember concurrent FI × DT integration
  // Simplification for v1: sum (fi_cp1 × dt_cp1) + (fi_cp2 × dt_cp2) per event; the full
  // concurrent-FI accounting across overlapping events is a v1.1 enhancement (Task 26)
  let qtl = 0;
  for (const o of occurrences) {
    qtl += o.outcomes.fi_cp1 * o.outcomes.dt_cp1_hours;
    qtl += o.outcomes.fi_cp2 * o.outcomes.dt_cp2_hours;
  }

  // EVAC/LOCL: 1 if any event's sampled p_evac > 0.5 threshold (simplified; Task 25 replaces with per-event Bernoulli)
  let evac: 0 | 1 = 0, locl: 0 | 1 = 0;
  for (const o of occurrences) {
    if (o.outcomes.p_evac > 0.5) evac = 1;
    if (o.outcomes.p_locl > 0.5) locl = 1;
  }

  const perConditionCounts: Record<string, number> = {};
  const perConditionEvac: Record<string, number> = {};
  const perConditionLocl: Record<string, number> = {};
  for (const o of occurrences) {
    perConditionCounts[o.conditionId] = (perConditionCounts[o.conditionId] ?? 0) + 1;
    if (o.outcomes.p_evac > 0.5) perConditionEvac[o.conditionId] = (perConditionEvac[o.conditionId] ?? 0) + 1;
    if (o.outcomes.p_locl > 0.5) perConditionLocl[o.conditionId] = (perConditionLocl[o.conditionId] ?? 0) + 1;
  }

  return { tme, qtl, evac, locl, perConditionCounts, perConditionEvac, perConditionLocl };
}
