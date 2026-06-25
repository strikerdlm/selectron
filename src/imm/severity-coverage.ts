import { IMM_CONDITIONS } from "./conditions";
import { loadIMMPriors } from "./priors";
import type { IMMPrior } from "./types";

export type SeverityBranchCoverageRow = {
  conditionId: string;
  label: string;
  hasOutcomeScenarios: boolean;
  distinctBestWorstBranches: boolean;
  branchEvidenceStatus: "accepted" | "scenario" | "legacy-v1-duplicated" | "mixed" | "missing";
};

export type SeverityBranchCoverage = {
  generatedAt: string;
  totalConditions: number;
  conditionsWithDistinctBestWorstOutcomeBranches: number;
  conditionsWithDuplicatedLegacyBranches: number;
  conditionsWithIndependentlyAdjudicatedSeverityEvidence: number;
  rows: SeverityBranchCoverageRow[];
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonical(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function branchEvidenceStatus(prior: IMMPrior): SeverityBranchCoverageRow["branchEvidenceStatus"] {
  const best = prior.outcomeScenarios?.best?.evidenceStatus;
  const worst = prior.outcomeScenarios?.worst?.evidenceStatus;
  if (!best && !worst) return "legacy-v1-duplicated";
  if (!best || !worst) return "missing";
  if (best === worst) return best;
  return "mixed";
}

function hasDistinctBranches(prior: IMMPrior): boolean {
  const best = prior.outcomeScenarios?.best;
  const worst = prior.outcomeScenarios?.worst;
  if (!best || !worst) return false;
  return canonical({ treated: best.treated, untreated: best.untreated }) !==
    canonical({ treated: worst.treated, untreated: worst.untreated });
}

export function buildSeverityBranchCoverage(generatedAt = new Date().toISOString()): SeverityBranchCoverage {
  const priors = loadIMMPriors();
  const rows = IMM_CONDITIONS.map((condition) => {
    const prior = priors.conditions[condition.id];
    const distinctBestWorstBranches = prior ? hasDistinctBranches(prior) : false;
    const status = prior ? branchEvidenceStatus(prior) : "missing";
    return {
      conditionId: condition.id,
      label: condition.label,
      hasOutcomeScenarios: Boolean(prior?.outcomeScenarios),
      distinctBestWorstBranches,
      branchEvidenceStatus: status,
    };
  });

  return {
    generatedAt,
    totalConditions: rows.length,
    conditionsWithDistinctBestWorstOutcomeBranches: rows.filter((row) => row.distinctBestWorstBranches).length,
    conditionsWithDuplicatedLegacyBranches: rows.filter((row) => row.branchEvidenceStatus === "legacy-v1-duplicated").length,
    conditionsWithIndependentlyAdjudicatedSeverityEvidence: rows.filter((row) => row.branchEvidenceStatus === "accepted").length,
    rows,
  };
}
