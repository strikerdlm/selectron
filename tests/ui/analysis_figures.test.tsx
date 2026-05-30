// tests/ui/analysis_figures.test.tsx
// @vitest-environment jsdom
import { type ReactNode } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { ParallelCriteria } from "@/ui/figures/ParallelCriteria";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { makeDemoCohort } from "@/analysis/demo-cohort";

vi.mock("echarts-for-react/lib/core", () => ({
  default: ({ option }: { option: { series?: unknown[] } }) => (
    <div data-testid="echarts-mock" data-series-count={Array.isArray(option.series) ? option.series.length : 0} />
  ),
}));

afterEach(cleanup);
const wrap = (ui: ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);
const cohort = makeDemoCohort(PLACEHOLDER_CRITERIA);

describe("ParallelCriteria", () => {
  it("renders a chart + caption with the cohort", () => {
    const { container, getByTestId } = wrap(<ParallelCriteria cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A1");
  });
  it("shows an empty state with <2 candidates", () => {
    const { container } = wrap(<ParallelCriteria cohort={cohort.slice(0, 1)} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(container.textContent).toContain("need ≥2 candidates");
  });
  it("does not throw when a score exceeds the criterion scale", () => {
    const bad: typeof cohort = [
      { id: "oor", alias: "OOR", scores: Object.fromEntries(PLACEHOLDER_CRITERIA.map((c) => [c.id, c.scale.max + 999])) },
      ...cohort.slice(0, 2),
    ];
    expect(() => wrap(<ParallelCriteria cohort={bad} criteria={PLACEHOLDER_CRITERIA} isDemo />)).not.toThrow();
  });
});

import { RiskBubbleScatter } from "@/ui/figures/RiskBubbleScatter";
import { buildBubbleData } from "@/analysis/imm-bubbles";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { loadIMMPriors } from "@/imm/priors";

describe("RiskBubbleScatter", () => {
  const { points, excluded } = buildBubbleData(IMM_CONDITIONS, loadIMMPriors().conditions, 180);
  it("renders bubbles + caption from the real priors", () => {
    const { container, getByTestId } = wrap(<RiskBubbleScatter points={points} excluded={excluded.length} missionDays={180} />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A2");
    expect(points.length).toBeGreaterThan(20);
  });
  it("shows an empty state with no points", () => {
    const { container } = wrap(<RiskBubbleScatter points={[]} excluded={0} missionDays={180} />);
    expect(container.textContent).toContain("no rate-based conditions");
  });
});

import { CriteriaSplom } from "@/ui/figures/CriteriaSplom";

describe("CriteriaSplom", () => {
  it("renders the matrix + caption", () => {
    const { container, getByTestId } = wrap(<CriteriaSplom cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A3");
  });
  it("empty state under 3 candidates", () => {
    const { container } = wrap(<CriteriaSplom cohort={cohort.slice(0, 2)} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(container.textContent).toContain("need ≥3 candidates");
  });
});

import { CriterionCorrelationHeatmap } from "@/ui/figures/CriterionCorrelationHeatmap";

describe("CriterionCorrelationHeatmap", () => {
  it("renders the heatmap + caption", () => {
    const { container, getByTestId } = wrap(<CriterionCorrelationHeatmap cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A4");
  });
});

import { VulnerabilityCouplingHeatmap } from "@/ui/figures/VulnerabilityCouplingHeatmap";

describe("VulnerabilityCouplingHeatmap", () => {
  it("renders the coupling heatmap + caption from the real catalog", () => {
    const { container, getByTestId } = wrap(<VulnerabilityCouplingHeatmap criteria={PLACEHOLDER_CRITERIA} />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A5");
  });
});

import { Analysis } from "@/ui/views/Analysis";

vi.mock("@/db/repository", () => ({
  listCandidates: async () => [],
  listCriterionEntries: async () => [],
}));

describe("Analysis view", () => {
  it("renders all five figure panels with the demo cohort fallback", async () => {
    const { container, findByText } = wrap(<Analysis />);
    expect(await findByText(/Figure A1/)).toBeTruthy();
    for (const id of ["A2", "A3", "A4", "A5"]) {
      expect(container.textContent).toContain(`Figure ${id}`);
    }
    expect(container.textContent).toContain("demo cohort");
  });
});
