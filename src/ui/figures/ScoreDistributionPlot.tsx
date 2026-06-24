// F1 ScoreDistributionPlot — uncertain-weight MCDA score distribution.
//
// Upgraded from the Iter-1 MCDA histogram component via /echarts skill (T80).
//
// Design:
//   - 56-bin histogram of MCDA score samples over [0, 1] (the score domain).
//   - Bars: amber sequential palette (#fde68a light → #d97706 deep) — preserves
//     the Iter-1 visual identity from the original MCDA score histogram / ScoreCard.
//   - Overlay: central 90% score interval shaded markArea; dashed μ markLine.
//   - X axis: "score" (category, labels as percentages e.g. "50%", "75%"). Y axis: hidden.
//   - ARIA enabled, useUTC: true, animation: false, grid.containLabel: true.
//   - Standalone container (no panel chrome) — parent renders the panel.
//   - Empty state for < 10 samples.
//
// Produced from the /echarts skill template library (histogram.json + SCIENTIFIC_RECIPES.md §dist)
// combined with RiskHistogram.tsx structural patterns. The skill returned its reference docs
// rather than synthesized code (same behavior as T68/T79); code authored from templates directly.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import type { ScoreDistribution } from "@/types";
import type { AccessTier } from "@/types";
import { FigureCaption } from "./FigureCaption";
import { f1Caption } from "./captions/F1.captions";

// Amber sequential gradient — Iter-1 identity preserved.
// Light amber (#fde68a) at top, deep amber (#d97706) at bottom.
const BAR_COLOR_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#fde68a" }, // Tailwind amber-200
    { offset: 1, color: "#d97706" }, // Tailwind amber-600
  ],
};

// Central 90% score interval shaded band: very light amber fill.
const INTERVAL_AREA_COLOR = "rgba(217, 119, 6, 0.10)";
// Mean line: deep amber.
const MEAN_LINE_COLOR = "#d97706";

const N_BINS = 56;

// Build a 56-bin histogram over [0, 1] (the score domain).
// Returns parallel arrays of bin-center labels (percentage strings) and bin counts.
function buildHistogram(
  samples: Float64Array | number[],
  bins: number,
): { centers: string[]; counts: number[] } {
  const domainMin = 0;
  const domainMax = 1;
  const width = (domainMax - domainMin) / bins;
  const counts = new Array<number>(bins).fill(0);

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    // Clamp to [0, 1] before binning.
    const clamped = Math.max(domainMin, Math.min(domainMax, s));
    let idx = Math.floor((clamped - domainMin) / width);
    if (idx === bins) idx = bins - 1; // clamp right-edge sample
    counts[idx]++;
  }

  // Center labels formatted as percentages (e.g. "50%", "75%").
  const pct = (x: number): string => (100 * x).toFixed(1) + "%";
  const centers = Array.from(
    { length: bins },
    (_, i) => pct(domainMin + (i + 0.5) * width),
  );
  return { centers, counts };
}

type Props = { scoreDistribution: ScoreDistribution; seed?: number; alias?: string; accessTier?: AccessTier };

export function ScoreDistributionPlot({
  scoreDistribution,
  seed = 0xc0ffee,
  alias = "—",
  accessTier = "minimum",
}: Props) {
  const { themeName } = useFigureTheme();
  // Empty-state guard: fewer than 10 samples → no meaningful histogram.
  if (scoreDistribution.samples.length < 10) {
    return (
      <div className="grid h-[280px] place-items-center text-sm text-ink-2 mono">
        no score distribution — need 10+ samples
      </div>
    );
  }

  const { centers, counts } = buildHistogram(scoreDistribution.samples, N_BINS);

  // Locate the bin-center label closest to a target value in [0, 1].
  // All comparisons are done in decimal; centers are already pct strings,
  // so we parse them back to find the closest index.
  const closestCenter = (target: number): string => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const val = parseFloat(centers[i]) / 100; // "50.9%" → 0.509
      const d = Math.abs(val - target);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return centers[bestIdx];
  };

  const interval90LoLabel = closestCenter(scoreDistribution.ci90[0]);
  const interval90HiLabel = closestCenter(scoreDistribution.ci90[1]);
  const meanLabel = closestCenter(scoreDistribution.mean);

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 48,
      right: 24,
      top: 16,
      bottom: 48,
      containLabel: true,
    },

    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "line",
        lineStyle: { color: "#2a2e34", width: 1, type: "dashed" as const },
      },
      formatter: (
        params: Array<{ name: string; value: number }>,
      ) => {
        if (!params.length) return "";
        const p = params[0];
        return [
          `<span style="color:#b0b6bd">score</span> <b>${p.name}</b>`,
          `<span style="color:#b0b6bd">count</span> ${p.value}`,
        ].join("<br/>");
      },
    },

    xAxis: {
      type: "category",
      name: "score",
      nameLocation: "middle",
      nameGap: 30,
      data: centers,
      boundaryGap: true,
      axisTick: { show: false },
      axisLabel: {
        interval: Math.floor(N_BINS / 7), // ~7 labels across the axis
        formatter: (val: string) => val, // already a percentage string
      },
      splitLine: { show: false },
    },

    yAxis: {
      type: "value",
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },

    series: [
      {
        name: "score distribution",
        type: "bar",
        data: counts,
        barCategoryGap: "8%",
        itemStyle: {
          color: BAR_COLOR_GRADIENT,
          opacity: 0.85,
          borderWidth: 0,
        },
        emphasis: {
          itemStyle: {
            color: "#d97706",
            opacity: 1,
          },
        },

        // Central 90% score interval shaded band
        markArea: {
          silent: true,
          itemStyle: { color: INTERVAL_AREA_COLOR },
          label: { show: false },
          data: [
            [
              { xAxis: interval90LoLabel, name: "interval90" },
              { xAxis: interval90HiLabel },
            ],
          ],
        },

        // Mean (μ) dashed vertical line
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: {
            color: MEAN_LINE_COLOR,
            width: 1.5,
            type: "dashed",
          },
          label: {
            show: true,
            position: "insideEndTop",
            color: MEAN_LINE_COLOR,
            fontSize: 11,
            formatter: "μ",
          },
          data: [{ xAxis: meanLabel }],
        },
      },
    ],
  };

  return (
    <>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={themeName}
        style={{ height: 280, width: "100%" }}
        notMerge
      />
      <FigureCaption block={f1Caption(scoreDistribution, seed, alias, accessTier)} />
    </>
  );
}
