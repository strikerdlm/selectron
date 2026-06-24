// @vitest-environment jsdom
// RTL smoke tests for IMMScenarioDistributions (I2).
// ECharts does not render meaningfully in jsdom; tests assert on wrapper DOM structure.

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup, fireEvent } from "@testing-library/react";
import { IMMScenarioDistributions } from "@/ui/figures/IMMPosteriorHist";
import type { IMMOutcome } from "@/imm/types";

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

function makeSummary(mean: number, sd: number) {
  return {
    mean,
    sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd] as [number, number],
    ci95: [mean - 1.96  * sd, mean + 1.96  * sd] as [number, number],
  };
}

function makeOutcome(
  tme = 106, chi = 94.93, pEvac = 5.57, pLocl = 0.44,
  sd = 2,
): IMMOutcome {
  return {
    tme:   makeSummary(tme,   sd),
    chi:   makeSummary(chi,   sd),
    pEvac: makeSummary(pEvac, sd),
    pLocl: makeSummary(pLocl, sd),
    missionSuccess: makeSummary(80, sd),
    perConditionDrivers: [],
    convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

describe("IMMScenarioDistributions (I2)", () => {
  it("renders all 4 metric labels in the DOM", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMScenarioDistributions
        outcome={outcome}
        trials={100_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("TME");
    expect(text).toContain("CHI");
    expect(text).toContain("pEVAC");
    expect(text).toContain("pLOCL");
  });

  it("does not throw with sd=0 (degenerate case)", () => {
    const outcome = makeOutcome(106, 94.93, 5.57, 0.44, 0);
    expect(() =>
      render(
        <IMMScenarioDistributions
          outcome={outcome}
          trials={100_000}
          seed={0xc0ffee}
          mission={{ id: "iss-6mo", label: "ISS 6-month" }}
        />,
      ),
    ).not.toThrow();
  });

  it("renders the figure caption with mission label", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMScenarioDistributions
        outcome={outcome}
        trials={50_000}
        seed={0xdeadbeef}
        mission={{ id: "mars-18mo", label: "Mars 18-month" }}
      />,
    );
    expect(container.textContent).toContain("Mars 18-month");
  });

  it("caption mentions trial count", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMScenarioDistributions
        outcome={outcome}
        trials={20_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    // 20,000 formatted with thousands separator
    expect(container.textContent).toMatch(/20[,.]?000/);
  });

  it("caption uses scenario simulation-interval language, not posterior wording", () => {
    const outcome = makeOutcome();
    const { container } = render(
      <IMMScenarioDistributions
        outcome={outcome}
        trials={20_000}
        seed={0xc0ffee}
        mission={{ id: "iss-6mo", label: "ISS 6-month" }}
      />,
    );
    fireEvent.click(container.querySelector("button")!);
    const expandedText = container.textContent ?? "";
    expect(expandedText).toContain("ScenarioSummary");
    expect(expandedText).toContain("central 90% simulation interval");
    expect(expandedText).not.toMatch(/posterior/i);
    expect(expandedText).not.toContain("CI₉₀");
  });
});
