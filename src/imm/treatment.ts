// src/imm/treatment.ts — RAF-based Beta-Pert distribution shifting (K15 §II.B.7 Fig 3)
import type {
  IMMBetaPert,
  IMMConditionOutcomes,
  IMMPrior,
} from "./types";

/**
 * interpolateBetaPertByRAF — linearly interpolates between treated and untreated
 * Beta-Pert parameter sets using the Resource Availability Factor (RAF).
 *
 * RAF = 1 → fully treated (best case for the patient)
 * RAF = 0 → untreated (no resources available)
 *
 * Each component: r * treated + (1 - r) * untreated
 * RAF is clamped to [0, 1].
 */
export function interpolateBetaPertByRAF(
  treated: IMMBetaPert,
  untreated: IMMBetaPert,
  raf: number,
): IMMBetaPert {
  const r = Math.min(1, Math.max(0, raf));
  return {
    min:  r * treated.min  + (1 - r) * untreated.min,
    mode: r * treated.mode + (1 - r) * untreated.mode,
    max:  r * treated.max  + (1 - r) * untreated.max,
  };
}

export type SelectedSeverityOutcomes = {
  treated: IMMConditionOutcomes;
  untreated: IMMConditionOutcomes;
  source: "scenario" | "legacy-v1-duplicated";
};

/**
 * Select outcome distributions for the sampled best/worst severity branch.
 *
 * Current release priors mostly predate this branch and contain only one
 * treated/untreated pair. Those legacy priors are duplicated into both branches
 * at runtime so the simulator remains compatible while making the missing
 * branch-specific evidence explicit to callers and tests.
 */
export function selectSeverityOutcomes(
  prior: IMMPrior,
  severity: "best" | "worst",
): SelectedSeverityOutcomes {
  const branch = prior.outcomeScenarios?.[severity];
  if (branch) {
    return {
      treated: branch.treated,
      untreated: branch.untreated,
      source: "scenario",
    };
  }
  return {
    treated: prior.treated,
    untreated: prior.untreated,
    source: "legacy-v1-duplicated",
  };
}
