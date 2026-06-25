// I2 IMMScenarioDistributions — 4-panel small-multiples for IMM Monte Carlo summaries.
//
// Renders parametric Gaussian PDF curves (not histograms of raw samples) for
// TME, CHI, pEVAC, and pLOCL based on ScenarioSummary (mean + sd).
// Rationale: IMMOutcome carries only summary statistics, not per-trial arrays.
// By CLT the T-trial means converge to Gaussian; the parametric approximation
// is stated explicitly in the caption.
//
// Layout: 2×2 ECharts multi-grid.
// Shading: 90% simulation interval via markArea; dashed μ markLine.
// Degenerate case (sd=0): renders a vertical spike at μ with a label.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import type { IMMOutcome, ScenarioSummary } from "../../imm/types";
import { FIGURE_GENERATION_COMMIT } from "../../version";

// Okabe-Ito palette assignments per metric
const COLORS = {
  tme:   "#0072B2", // Blue
  chi:   "#009E73", // Bluish green
  pEvac: "#E69F00", // Orange
  pLocl: "#D55E00", // Vermillion
};

// Build a smooth Gaussian PDF curve from mean + sd.
// Returns { xs: string[], ys: number[] } for the ECharts category x-axis.
// N_POINTS points over [μ - 4σ, μ + 4σ]; minimum domain of 1e-6 for sd=0.
const N_POINTS = 80;

function gaussianPDF(
  mean: number,
  sd: number,
): { xs: string[]; ys: number[] } {
  const safeSd = sd <= 0 ? 1e-6 : sd;
  const lo = mean - 4 * safeSd;
  const hi = mean + 4 * safeSd;
  const step = (hi - lo) / (N_POINTS - 1);

  const xs: string[] = [];
  const ys: number[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    const x = lo + i * step;
    const y =
      (1 / (safeSd * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * ((x - mean) / safeSd) ** 2);
    xs.push(x.toFixed(3));
    ys.push(y);
  }
  return { xs, ys };
}

// Find x label nearest to a target value
function closestLabel(xs: string[], target: number): string {
  let best = xs[0];
  let bestDist = Infinity;
  for (const label of xs) {
    const d = Math.abs(parseFloat(label) - target);
    if (d < bestDist) {
      bestDist = d;
      best = label;
    }
  }
  return best;
}

// Build a single panel option for one metric
function panelOption(
  summary: ScenarioSummary,
  label: string,
  unit: string,
  color: string,
  gridIndex: number,
): {
  grid: object;
  xAxis: object;
  yAxis: object;
  series: object;
} {
  const { mean, sd, ci90 } = summary;
  const { xs, ys } = gaussianPDF(mean, sd);
  const meanLabel = closestLabel(xs, mean);
  const ci90LoLabel = closestLabel(xs, ci90[0]);
  const ci90HiLabel = closestLabel(xs, ci90[1]);

  // 2×2 grid positions (top-left, top-right, bottom-left, bottom-right)
  const positions = [
    { left: "6%",  right: "53%", top: "10%", bottom: "55%" },
    { left: "53%", right: "6%",  top: "10%", bottom: "55%" },
    { left: "6%",  right: "53%", top: "56%", bottom: "9%"  },
    { left: "53%", right: "6%",  top: "56%", bottom: "9%"  },
  ];
  const pos = positions[gridIndex] ?? positions[0];

  return {
    grid: { ...pos, containLabel: true },
    xAxis: {
      type: "category" as const,
      gridIndex,
      name: `${label} (${unit})`,
      nameLocation: "middle" as const,
      nameGap: 26,
      data: xs,
      boundaryGap: false,
      axisTick: { show: false },
      axisLabel: {
        interval: Math.floor(N_POINTS / 4),
        fontSize: 9,
        formatter: (v: string) => parseFloat(v).toFixed(1),
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      gridIndex,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: {
      name: label,
      type: "line" as const,
      xAxisIndex: gridIndex,
      yAxisIndex: gridIndex,
      data: ys,
      showSymbol: false,
      lineStyle: { color, width: 2 },
      areaStyle: { color, opacity: 0.12 },
      markArea: {
        silent: true,
        itemStyle: { color, opacity: 0.10 },
        label: { show: false },
        data: [
          [
            { xAxis: ci90LoLabel, name: "sim 90%" },
            { xAxis: ci90HiLabel },
          ],
        ],
      },
      markLine: {
        silent: true,
        symbol: ["none", "none"],
        lineStyle: { color, width: 1.5, type: "dashed" as const },
        label: {
          show: true,
          position: "insideEndTop" as const,
          color,
          fontSize: 10,
          formatter: "μ",
        },
        data: [{ xAxis: meanLabel }],
      },
    },
  };
}

export type IMMScenarioDistributionsProps = {
  outcome: IMMOutcome;
  trials: number;
  seed: number;
  mission: { id: string; label: string };
  accessTier?: string;
};

export function IMMScenarioDistributions({
  outcome,
  trials,
  seed,
  mission,
}: IMMScenarioDistributionsProps) {
  const { themeName } = useFigureTheme();
  const metrics: Array<{
    key: keyof Pick<IMMOutcome, "tme" | "chi" | "pEvac" | "pLocl">;
    label: string;
    unit: string;
    color: string;
  }> = [
    { key: "tme",   label: "TME",   unit: "events", color: COLORS.tme   },
    { key: "chi",   label: "CHI",   unit: "%",       color: COLORS.chi   },
    { key: "pEvac", label: "pEVAC", unit: "%",       color: COLORS.pEvac },
    { key: "pLocl", label: "pLOCL", unit: "%",       color: COLORS.pLocl },
  ];

  const panels = metrics.map((m, i) =>
    panelOption(outcome[m.key], m.label, m.unit, m.color, i),
  );

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },
    grid:   panels.map((p) => p.grid),
    xAxis:  panels.map((p) => p.xAxis),
    yAxis:  panels.map((p) => p.yAxis),
    series: panels.map((p) => p.series),
  };

  const seedHex = `0x${seed.toString(16).toUpperCase()}`;

  const captionBlock = {
    figureId: "I2",
    oneLine: `Monte Carlo summary distributions for TME / CHI / pEVAC / pLOCL after T=${trials.toLocaleString()} IMM trials on ${mission.label}.`,
    methods:
      "Parametric Gaussian approximation: each panel renders the normal PDF N(μ, σ²) derived " +
      "from the ScenarioSummary (mean ± sd). Per CLT the T-trial means are approximately " +
      "Gaussian; this approximation is faithful for T ≥ 10 000. Simulation interval₉₀ shaded; Monte Carlo mean " +
      "overlaid as dashed line. When sd = 0 (degenerate/deterministic outcome) a vertical " +
      "spike is shown with σ = 1e-6 regularisation. Per-trial samples are not stored in " +
      "IMMOutcome — use the raw trial arrays from simulateIMM if kernel density is required.",
    source:
      "Antonsen et al. (2022) npj Microgravity 8(1) [A22, doi:10.1038/s41526-022-00193-9]; " +
      "Keenan et al. (2015) ICES-2015-123 [K15]. IMM Monte Carlo forward simulation, " +
      `${mission.label}.`,
    reproducibility: `seed=${seedHex}, trials=${trials.toLocaleString()}, commit=${FIGURE_GENERATION_COMMIT}`,
    interpretation:
      "These four panels show the spread of possible outcomes from the crew's simulated space " +
      "mission. Each curve represents how often the model predicts a particular level of total " +
      "medical events (TME), crew health index (CHI), probability of emergency evacuation " +
      "(pEVAC), and probability of crew loss (pLOCL). Wider curves mean more uncertainty; " +
      "the shaded band covers the central 90% simulation interval. The dashed line marks the mean " +
      "value. Lower pEVAC and pLOCL, and higher CHI, indicate a healthier crew.",
  };

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={themeName}
        style={{ height: 480, width: "100%" }}
        notMerge
      />
      <FigureCaption block={captionBlock} />
    </div>
  );
}

export type IMMPosteriorHistProps = IMMScenarioDistributionsProps;

/** @deprecated Use IMMScenarioDistributions for ordinary non-posterior IMM runs. */
export const IMMPosteriorHist = IMMScenarioDistributions;
