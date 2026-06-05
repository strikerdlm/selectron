// @vitest-environment jsdom
// RTL smoke tests for IMMAnalogPosteriorPlot (I6).
// ECharts does not render meaningfully in jsdom; tests assert on wrapper DOM structure.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { IMMAnalogPosteriorPlot } from "@/ui/figures/IMMAnalogPosteriorPlot";
import type { PosteriorDrawsResponse } from "../../src/api/calibration";
import type { PosteriorPredictiveOutcome } from "../../src/imm/types";

afterEach(cleanup);

// Mock echarts-for-react/lib/core to avoid canvas/resize-observer in jsdom
vi.mock("echarts-for-react/lib/core", () => ({
  default: ({ option }: { option: unknown }) => (
    <div data-testid="echarts-mock" data-series-count={
      Array.isArray((option as { series?: unknown[] }).series)
        ? (option as { series: unknown[] }).series.length
        : 0
    } />
  ),
}));

function makeSummary(mean: number, sd = 0.001) {
  return {
    mean,
    sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96 * sd, mean + 1.96 * sd] as [number, number],
  };
}

// Fake PosteriorDrawsResponse — snake_case fields per real wire type
const FAKE_DRAWS: PosteriorDrawsResponse = {
  draws: [
    {
      condition_id: "dental-abscess",
      lambdas: [0.001, 0.0012, 0.0009, 0.0011, 0.0013],
    },
    {
      condition_id: "ankle-sprain-strain",
      lambdas: [0.002, 0.0022, 0.0019, 0.0021, 0.0023],
    },
  ],
  n_draws: 5,
  seed: 42,
  kind: "antarctic-station",
};

// Fake PosteriorPredictiveOutcome — uses perConditionTmeContribPost per real type
const FAKE_OUTCOME: PosteriorPredictiveOutcome = {
  pEvacPost: makeSummary(5.2),
  pLoclPost: makeSummary(0.31),
  chiPost: makeSummary(92.4),
  perConditionTmeContribPost: {
    "dental-abscess": makeSummary(0.045),
    "ankle-sprain-strain": makeSummary(0.023),
  },
  nDraws: 5,
  trialsPerDraw: 100,
};

describe("IMMAnalogPosteriorPlot (I6)", () => {
  it("renders metric cards pp-pEvac, pp-pLocl, pp-chi", () => {
    const { container } = render(
      <IMMAnalogPosteriorPlot
        draws={FAKE_DRAWS}
        outcome={FAKE_OUTCOME}
        kind="antarctic-station"
        trialsPerDraw={100}
      />,
    );
    expect(container.querySelector("[data-testid='pp-pEvac']")).not.toBeNull();
    expect(container.querySelector("[data-testid='pp-pLocl']")).not.toBeNull();
    expect(container.querySelector("[data-testid='pp-chi']")).not.toBeNull();
  });

  it("caption surfaces the kind string", () => {
    const { container } = render(
      <IMMAnalogPosteriorPlot
        draws={FAKE_DRAWS}
        outcome={FAKE_OUTCOME}
        kind="antarctic-station"
        trialsPerDraw={100}
      />,
    );
    expect(container.textContent).toContain("antarctic-station");
  });

  it("renders pp-row-dental-abscess and pp-row-ankle-sprain-strain", () => {
    const { container } = render(
      <IMMAnalogPosteriorPlot
        draws={FAKE_DRAWS}
        outcome={FAKE_OUTCOME}
        kind="antarctic-station"
        trialsPerDraw={100}
      />,
    );
    expect(container.querySelector("[data-testid='pp-row-dental-abscess']")).not.toBeNull();
    expect(container.querySelector("[data-testid='pp-row-ankle-sprain-strain']")).not.toBeNull();
  });
});
