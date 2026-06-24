// @vitest-environment jsdom
// RTL smoke tests for IMMConvergencePlot (I4).

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { IMMConvergencePlot } from "@/ui/figures/IMMConvergencePlot";
import type { IMMOutcome } from "@/imm/types";

afterEach(cleanup);

vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

function makeSummary(mean: number) {
  const sd = 2;
  return {
    mean, sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96  * sd, mean + 1.96  * sd] as [number, number],
  };
}

function makeOutcome(checkpoints: number[], sigmaChi: number[], sigmaPevac: number[]): IMMOutcome {
  return {
    tme:   makeSummary(106),
    chi:   makeSummary(94.93),
    pEvac: makeSummary(5.57),
    pLocl: makeSummary(0.44),
    missionSuccess: makeSummary(80),
    perConditionDrivers: [],
    convergence: { trialCheckpoints: checkpoints, sigmaChi, sigmaPevac },
    monteCarloError: {
      trials: 100_000,
      tmeMeanMcse: 0.12,
      chiMeanMcse: 0.03,
      pEvacMcsePct: 0.02,
      pLoclMcsePct: 0.01,
      healthCriterionMcsePct: 0.04,
      pEvacEventCount: 5570,
      pEvacNonEventCount: 94_430,
      pLoclEventCount: 12,
      pLoclNonEventCount: 99_988,
      healthCriterionEventCount: 80_000,
      healthCriterionNonEventCount: 20_000,
      pEvacWilson95Pct: [5.43, 5.71],
      pLoclWilson95Pct: [0.39, 0.50],
      healthCriterionWilson95Pct: [79.75, 80.25],
      tmeRelativeMcse: 0.001,
      chiRelativeMcse: 0.0003,
      pEvacRelativeMcse: 0.003,
      pLoclRelativeMcse: 0.02,
      healthCriterionRelativeMcse: 0.0005,
    },
    precisionAssessment: {
      targets: {
        tmeRelativeMcseMax: 0.05,
        chiMcseMaxPp: 0.25,
        pEvacMcseMaxPp: 0.25,
        pLoclMcseMaxPp: 0.1,
        healthCriterionMcseMaxPp: 0.25,
        binaryWilsonWidthMaxPp: 1,
        minBinaryEventCount: 30,
        minIndependentSeeds: 3,
        maxSeedMeanSpreadPp: 0.5,
      },
      checks: [],
      stoppingRulePassed: true,
      requiredTrials: 100_000,
      stoppingRule: "fixture",
      independentSeedReplication: {
        requiredSeeds: 3,
        observedSeeds: 1,
        targetMaxMeanSpreadPp: 0.5,
        maxMeanSpreadPp: null,
        passed: null,
      },
      passed: false,
    },
  };
}

describe("IMMConvergencePlot (I4)", () => {
  it("renders placeholder when no batch checkpoints (T < 1000)", () => {
    const outcome = makeOutcome([], [], []);
    const { container } = render(
      <IMMConvergencePlot outcome={outcome} trials={500} chiStar={0.7} />,
    );
    expect(container.textContent).toContain("1 000");
  });

  it("renders ECharts component when checkpoints are present", () => {
    const checkpoints = [1000, 2000, 3000, 4000, 5000];
    const sigmaChi   = [8.2, 6.1, 5.4, 4.9, 4.7];
    const sigmaPevac = [3.1, 2.8, 2.4, 2.2, 2.1];
    const outcome = makeOutcome(checkpoints, sigmaChi, sigmaPevac);
    const { container } = render(
      <IMMConvergencePlot outcome={outcome} trials={5000} chiStar={0.7} />,
    );
    expect(container.querySelector("[data-testid='echarts-mock']")).not.toBeNull();
  });

  it("renders estimator precision separately from batch sigma", () => {
    const outcome = makeOutcome([1000, 2000], [7.5, 5.2], [3.0, 2.4]);
    const { container } = render(
      <IMMConvergencePlot outcome={outcome} trials={2000} chiStar={0.75} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Estimator precision");
    expect(text).toContain("MCSE stopping rule");
    expect(text).toContain("Independent seeds");
    expect(text).toContain("not assessed");
    expect(text).toContain("Wilson 95%");
    expect(text).toContain("12 events / 100,000 trials");
    expect(text).toContain("rare-event flag");
    expect(text).toContain("historical 5 pp batch-SD reference");
  });

  it("caption includes chiStar value", () => {
    const checkpoints = [1000, 2000];
    const outcome = makeOutcome(checkpoints, [7.5, 5.2], [3.0, 2.4]);
    const { container } = render(
      <IMMConvergencePlot outcome={outcome} trials={2000} chiStar={0.75} />,
    );
    expect(container.textContent).toContain("0.75");
  });

  it("does not throw with a single checkpoint", () => {
    const outcome = makeOutcome([1000], [9.1], [4.2]);
    expect(() =>
      render(<IMMConvergencePlot outcome={outcome} trials={1000} chiStar={0.7} />),
    ).not.toThrow();
  });
});
