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
  };
}

describe("IMMConvergencePlot (I4)", () => {
  it("renders placeholder when no convergence checkpoints (T < 1000)", () => {
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
