import { describe, it, expect } from "vitest";
import { sampleSeverity, sampleSeverityProbability } from "../../src/imm/severity";
import { selectSeverityOutcomes } from "../../src/imm/treatment";
import { buildSeverityBranchCoverage } from "../../src/imm/severity-coverage";
import { makeRng } from "../../src/engine/prng";
import type { IMMConditionOutcomes, IMMPrior } from "../../src/imm/types";

describe("sampleSeverity", () => {
  it("mean worst-case ≈ alpha/(alpha+beta) over 50k draws", () => {
    const rng = makeRng(0xdeadbeef);
    const alpha = 3;
    const beta = 7;
    const n = 50_000;
    let worstCount = 0;
    for (let i = 0; i < n; i++) {
      if (sampleSeverity(rng, alpha, beta) === "worst") worstCount++;
    }
    const expected = alpha / (alpha + beta); // 0.3
    expect(worstCount / n).toBeCloseTo(expected, 1);
  });

  it("alpha=0 always returns 'best'", () => {
    const rng = makeRng(0x1234);
    for (let i = 0; i < 1_000; i++) {
      expect(sampleSeverity(rng, 0, 5)).toBe("best");
    }
  });

  it("Beta concentration affects outer severity-probability uncertainty", () => {
    const lowConcentrationRng = makeRng(0x5151);
    const highConcentrationRng = makeRng(0x5151);
    const n = 20_000;
    const low: number[] = [];
    const high: number[] = [];
    for (let i = 0; i < n; i++) {
      low.push(sampleSeverityProbability(lowConcentrationRng, 1, 1));
      high.push(sampleSeverityProbability(highConcentrationRng, 100, 100));
    }
    const variance = (xs: number[]) => {
      const mean = xs.reduce((sum, x) => sum + x, 0) / xs.length;
      return xs.reduce((sum, x) => sum + (x - mean) ** 2, 0) / xs.length;
    };
    expect(variance(low)).toBeGreaterThan(variance(high) * 20);
  });
});

const outcome = (fiMode: number): IMMConditionOutcomes => ({
  fi_cp1: { min: fiMode, mode: fiMode, max: fiMode },
  dt_cp1_hours: { min: 1, mode: 1, max: 1 },
  fi_cp2: { min: 0, mode: 0, max: 0 },
  dt_cp2_hours: { min: 0, mode: 0, max: 0 },
  fi_cp3: { min: 0, mode: 0, max: 0 },
  p_evac: { min: 0, mode: 0, max: 0 },
  p_locl: { min: 0, mode: 0, max: 0 },
});

describe("selectSeverityOutcomes", () => {
  it("selects distinct best and worst branches when scenario outcomes exist", () => {
    const prior: IMMPrior = {
      conditionId: "fixture-condition",
      provenance: "user-custom",
      source_ref: "fixture",
      incidence: { distribution: "Fixed", lambda_fixed: 1, lambda_unit: "events-per-person-day" },
      severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 1 },
      treated: outcome(0.1),
      untreated: outcome(0.2),
      outcomeScenarios: {
        best: { treated: outcome(0.05), untreated: outcome(0.1), evidenceStatus: "scenario" },
        worst: { treated: outcome(0.5), untreated: outcome(0.8), evidenceStatus: "scenario" },
      },
      risk_factor_multipliers: {},
      required_resources: {},
    };

    expect(selectSeverityOutcomes(prior, "best").treated.fi_cp1.mode).toBe(0.05);
    expect(selectSeverityOutcomes(prior, "worst").treated.fi_cp1.mode).toBe(0.5);
  });

  it("marks legacy top-level outcomes as duplicated compatibility branches", () => {
    const prior: IMMPrior = {
      conditionId: "legacy-condition",
      provenance: "user-custom",
      source_ref: "fixture",
      incidence: { distribution: "Fixed", lambda_fixed: 1, lambda_unit: "events-per-person-day" },
      severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 1 },
      treated: outcome(0.1),
      untreated: outcome(0.2),
      risk_factor_multipliers: {},
      required_resources: {},
    };

    const selected = selectSeverityOutcomes(prior, "worst");
    expect(selected.source).toBe("legacy-v1-duplicated");
    expect(selected.treated.fi_cp1.mode).toBe(0.1);
  });
});

describe("buildSeverityBranchCoverage", () => {
  it("publishes machine-readable severity branch coverage counts", () => {
    const coverage = buildSeverityBranchCoverage("2026-06-25T00:00:00.000Z");
    expect(coverage.totalConditions).toBeGreaterThan(0);
    expect(coverage.rows).toHaveLength(coverage.totalConditions);
    expect(
      coverage.conditionsWithDistinctBestWorstOutcomeBranches +
      coverage.conditionsWithDuplicatedLegacyBranches,
    ).toBeLessThanOrEqual(coverage.totalConditions);
    expect(coverage.conditionsWithIndependentlyAdjudicatedSeverityEvidence).toBeGreaterThanOrEqual(0);
  });
});
