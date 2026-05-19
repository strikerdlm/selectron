// F2 RiskHistogram — CHI posterior distribution histogram.
//
// Upgraded from src/ui/components/RiskHistogram.tsx (Iter-1 component) via /echarts skill (T79).
// The old component is preserved at src/ui/components/RiskHistogram.tsx until T81 (cleanup).
//
// Design:
//   - 56-bin histogram of chiSamples.
//   - Bars: Wong-7 bluish green (#009E73) with a top-to-bottom gradient.
//   - Overlay: CI₉₀ shaded markArea; dashed μ markLine.
//   - X axis: "CHI" (decimal labels, e.g. "0.91"). Y axis: bin count (labels hidden).
//   - ARIA enabled, animation: false, grid.containLabel: true — deterministic export.
//   - Standalone container (no panel chrome) — parent renders the panel.
//
// Produced from the /echarts skill template library (histogram.json + SCIENTIFIC_RECIPES.md §dist)
// combined with DashboardSummary.tsx structural patterns. The skill returned its reference docs
// rather than synthesized code (same behavior as T68); code authored from templates directly.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import { FigureCaption } from "./FigureCaption";
import { f2Caption } from "./captions/F2.captions";
import type { AccessTier } from "@/types";

// Wong-7 bluish green for bars (#009E73) — colorblind-safe.
// Gradient: sky-blue (#56B4E9) at top → bluish-green (#009E73) at bottom for depth.
const BAR_COLOR_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#56B4E9" }, // Wong sky blue (lighter)
    { offset: 1, color: "#009E73" }, // Wong bluish green
  ],
};

// CI₉₀ shaded band: very light Wong green fill.
const CI_AREA_COLOR = "rgba(0, 158, 115, 0.12)";
// Mean line: Wong bluish green, 60% opacity.
const MEAN_LINE_COLOR = "#009E73";

const N_BINS = 56;

// Build a fixed-bin histogram from raw samples.
// Returns parallel arrays of bin center labels (decimal string) and bin counts.
function buildHistogram(
  samples: number[],
  bins: number,
): { centers: string[]; counts: number[] } {
  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (s < min) min = s;
    if (s > max) max = s;
  }
  // Degenerate-posterior guard: if all samples are identical (e.g. all 1.0),
  // pad ±1e-6 to avoid divide-by-zero in the bin-width calculation.
  if (min === max) {
    min -= 1e-6;
    max += 1e-6;
  }
  const width = (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const s of samples) {
    let idx = Math.floor((s - min) / width);
    if (idx === bins) idx = bins - 1; // clamp right-edge sample into last bin
    counts[idx]++;
  }
  // Center labels formatted as decimals (e.g. "0.91"), not percentages.
  const centers = Array.from(
    { length: bins },
    (_, i) => (min + (i + 0.5) * width).toFixed(3),
  );
  return { centers, counts };
}

export type RiskHistogramProps = {
  chiSamples: number[];
  chiMean: number;
  chiCi90: readonly [number, number];
  seed?: number;
  trials?: number;
  missionId?: string;
  priorsVersion?: string;
  accessTier?: AccessTier; // scope-expansion-3
};

export function RiskHistogram({
  chiSamples,
  chiMean,
  chiCi90,
  seed = 0xc0ffee,
  trials,
  missionId = "—",
  priorsVersion = "synthetic-iter3-ui-scaffold",
  accessTier = "minimum",
}: RiskHistogramProps) {
  // Empty-state guard: fewer than 10 samples → no meaningful histogram.
  if (chiSamples.length < 10) {
    return (
      <div className="grid h-[280px] place-items-center text-sm text-ink-2 mono">
        no diagnostics — run a simulation to see the CHI posterior
      </div>
    );
  }

  const { centers, counts } = buildHistogram(chiSamples, N_BINS);

  // Locate the bin-center label closest to chiMean and chiCi90 bounds
  // so markArea/markLine reference valid category axis values.
  const closestCenter = (target: number): string => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(parseFloat(centers[i]) - target);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return centers[bestIdx];
  };

  const meanLabel  = closestCenter(chiMean);
  const ci90LoLabel = closestCenter(chiCi90[0]);
  const ci90HiLabel = closestCenter(chiCi90[1]);

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
          `<span style="color:#b0b6bd">CHI</span> <b>${p.name}</b>`,
          `<span style="color:#b0b6bd">count</span> ${p.value}`,
        ].join("<br/>");
      },
    },

    xAxis: {
      type: "category",
      name: "CHI",
      nameLocation: "middle",
      nameGap: 30,
      data: centers,
      boundaryGap: true,
      axisTick: { show: false },
      axisLabel: {
        interval: Math.floor(N_BINS / 7), // ~7 labels total across the axis
        formatter: (val: string) => val, // already decimal string e.g. "0.912"
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
        name: "CHI posterior",
        type: "bar",
        data: counts,
        barCategoryGap: "8%",
        itemStyle: {
          color: BAR_COLOR_GRADIENT,
          opacity: 0.82,
          borderWidth: 0,
        },
        emphasis: {
          itemStyle: {
            color: "#009E73",
            opacity: 1,
          },
        },

        // CI₉₀ shaded band
        markArea: {
          silent: true,
          itemStyle: { color: CI_AREA_COLOR },
          label: { show: false },
          data: [
            [
              { xAxis: ci90LoLabel, name: "CI₉₀" },
              { xAxis: ci90HiLabel },
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
        theme={NATURE_THEME_NAME}
        style={{ height: 360, width: "100%" }}
        notMerge
      />
      <FigureCaption
        block={f2Caption({
          chiMean,
          chiCi90,
          trials: trials ?? chiSamples.length,
          seed,
          missionId,
          priorsVersion,
          accessTier,
        })}
      />
    </>
  );
}
