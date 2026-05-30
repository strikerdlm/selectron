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
});
