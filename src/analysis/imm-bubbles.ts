// src/analysis/imm-bubbles.ts
// Pure transforms turning IMM priors+conditions into bubble-scatter points:
// incidence rate (x) × worst-case severity (y) × system group (color) × contribution (size).
import type { IMMPrior, IMMCondition, IMMConditionFamily } from "@/imm/types";

const DAYS_PER_YEAR = 365;

export function conditionRate(prior: IMMPrior): number | null {
  const inc = prior.incidence;
  // Only per-person-day rates belong on the per-1000-PY axis. EVA/SPE per-event
  // units and Beta-Bernoulli per-event probabilities are not per-person-time rates.
  if (inc.lambda_unit && inc.lambda_unit !== "events-per-person-day") return null;
  let perDay: number;
  switch (inc.distribution) {
    case "Gamma-Poisson":
      if (inc.alpha == null || inc.beta == null || inc.beta === 0) return null;
      perDay = inc.alpha / inc.beta; break;
    case "Lognormal-Poisson":
      if (inc.mu_log_lambda == null || inc.sigma_log_lambda == null) return null;
      perDay = Math.exp(inc.mu_log_lambda + (inc.sigma_log_lambda ** 2) / 2); break;
    case "Fixed":
      if (inc.lambda_fixed == null) return null;
      perDay = inc.lambda_fixed; break;
    default:
      return null; // Beta-Bernoulli: per-event probability, not a per-person-time rate
  }
  if (!(perDay > 0)) return null;
  return perDay * DAYS_PER_YEAR * 1000;
}

export function worstCaseSeverity(prior: IMMPrior): number {
  const a = prior.severity.worst_case_prob_alpha;
  const b = prior.severity.worst_case_prob_beta;
  return a + b === 0 ? 0 : a / (a + b);
}

// Expected per-mission contribution proxy: expected event count × cumulative treated impairment.
export function expectedContribution(prior: IMMPrior, missionDays: number): number {
  const rate = conditionRate(prior);
  if (rate == null) return 0;
  const perDay = rate / (DAYS_PER_YEAR * 1000);
  const expectedCount = perDay * missionDays;
  const t = prior.treated;
  const impair = t.fi_cp1.mode + t.fi_cp2.mode + t.fi_cp3.mode;
  return expectedCount * impair;
}

export type SystemGroup =
  | "behavioral/psych" | "cardio/heme" | "neuro" | "infectious"
  | "musculoskeletal/trauma" | "GI/GU/renal" | "other";

export const SYSTEM_GROUP_ORDER: SystemGroup[] = [
  "behavioral/psych", "cardio/heme", "neuro", "infectious",
  "musculoskeletal/trauma", "GI/GU/renal", "other",
];

const FAMILY_GROUP: Record<IMMConditionFamily, SystemGroup> = {
  behavioral: "behavioral/psych", psychiatric: "behavioral/psych",
  cardiovascular: "cardio/heme", hematologic: "cardio/heme",
  neurologic: "neuro",
  infectious: "infectious",
  musculoskeletal: "musculoskeletal/trauma", traumatic: "musculoskeletal/trauma",
  GI: "GI/GU/renal", GU: "GI/GU/renal", renal: "GI/GU/renal",
  dental: "other", dermatologic: "other", ENT: "other", endocrine: "other",
  ophthalmologic: "other", respiratory: "other", "space-adaptation": "other",
  toxicologic: "other",
};

export function familyToSystemGroup(family: IMMConditionFamily): SystemGroup {
  return FAMILY_GROUP[family] ?? "other";
}

export type BubblePoint = {
  id: string; label: string; family: IMMConditionFamily; group: SystemGroup;
  rate: number; severity: number; contribution: number;
};

export function buildBubbleData(
  conditions: readonly IMMCondition[],
  priors: Record<string, IMMPrior>,
  missionDays: number,
): { points: BubblePoint[]; excluded: string[] } {
  const points: BubblePoint[] = [];
  const excluded: string[] = [];
  for (const c of conditions) {
    const p = priors[c.id];
    if (!p) continue;
    const rate = conditionRate(p);
    if (rate == null) { excluded.push(c.id); continue; }
    points.push({
      id: c.id, label: c.label, family: c.family, group: familyToSystemGroup(c.family),
      rate, severity: worstCaseSeverity(p), contribution: expectedContribution(p, missionDays),
    });
  }
  return { points, excluded };
}
