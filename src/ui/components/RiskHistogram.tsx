// Iter-3 Phase 3D — ECharts histogram of CHI posterior samples.
//
// Mirrors Iter-1 PosteriorPlot.tsx (same ECharts core registration, same
// markArea + markLine pattern). Consumes posterior.diagnostics.chiSamples
// which is populated by simulateMission(..., { diagnostics: true }) — if
// diagnostics is absent the component falls back to a "no diagnostics"
// placeholder rather than crashing, since diagnostics is optional on the
// RiskPosterior type.

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { RiskPosterior, CredibleInterval } from "@/types/risk";

echarts.use([
  BarChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer,
]);

const N_BINS = 56;

function histogram(samples: readonly number[], bins: number): { centers: number[]; counts: number[] } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] < min) min = samples[i];
    if (samples[i] > max) max = samples[i];
  }
  if (min === max) {
    // degenerate posterior (e.g. all-zero CHI) — pad ±epsilon to avoid div/0
    min -= 1e-6;
    max += 1e-6;
  }
  const width = (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (let i = 0; i < samples.length; i++) {
    let idx = Math.floor((samples[i] - min) / width);
    if (idx === bins) idx = bins - 1;
    counts[idx]++;
  }
  const centers = Array.from({ length: bins }, (_, i) => min + (i + 0.5) * width);
  return { centers, counts };
}

const pct = (x: number) => (100 * x).toFixed(1) + "%";

type Props = {
  posterior: RiskPosterior & { diagnostics?: { chiSamples: number[]; qtlSamples: number[] } };
};

export function RiskHistogram({ posterior }: Props) {
  const chiSamples = posterior.diagnostics?.chiSamples;
  const ci90: CredibleInterval = posterior.chi.ci90;
  const mean = posterior.chi.mean;

  if (!chiSamples || chiSamples.length === 0) {
    return (
      <div className="panel relative p-6">
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="signal-dot" />
          <span className="label">CHI posterior · live</span>
        </div>
        <div className="mt-10 grid place-items-center text-sm text-ink-2">
          <span className="mono">no diagnostics — re-run simulateMission with {`{ diagnostics: true }`}</span>
        </div>
      </div>
    );
  }

  const { centers, counts } = histogram(chiSamples, N_BINS);

  const option = {
    animation: true,
    animationDuration: 280,
    animationEasing: "cubicOut",
    grid: { left: 0, right: 0, top: 8, bottom: 24, containLabel: false },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0c0d0f",
      borderColor: "#2a2e34",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: "#e6e8ec",
        fontFamily: "JetBrains Mono",
        fontSize: 11,
      },
      axisPointer: {
        type: "line",
        lineStyle: { color: "#2a2e34", width: 1, type: "dashed" },
      },
      formatter: (params: { name: string; value: number }[]) =>
        params
          .map(
            (p) =>
              `<span style="color:#71757c">CHI</span> <span style="color:#f5b541">${p.name}</span><br/><span style="color:#71757c">count</span> <span style="color:#e6e8ec">${p.value}</span>`,
          )
          .join("<br/>"),
    },
    xAxis: {
      type: "category",
      data: centers.map(pct),
      boundaryGap: true,
      axisLine: { lineStyle: { color: "#1f2226" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#71757c",
        fontFamily: "JetBrains Mono",
        fontSize: 10,
        interval: 6,
        margin: 12,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      show: false,
      splitLine: { show: false },
    },
    series: [
      {
        type: "bar",
        data: counts,
        barCategoryGap: "12%",
        itemStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#7ec8a6" },
              { offset: 1, color: "#4fa37a" },
            ],
          },
        },
        emphasis: { itemStyle: { color: "#9ee0bd" } },
        markArea: {
          silent: true,
          itemStyle: { color: "rgba(79, 163, 122, 0.10)" },
          label: { show: false },
          data: [[{ xAxis: pct(ci90[0]), name: "CI90" }, { xAxis: pct(ci90[1]) }]],
        },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: { color: "#9ee0bd", width: 1, type: "dashed" },
          label: {
            show: true,
            position: "insideEndTop",
            color: "#9ee0bd",
            fontFamily: "JetBrains Mono",
            fontSize: 10,
            formatter: "μ",
          },
          data: [{ xAxis: pct(mean) }],
        },
      },
    ],
  };

  return (
    <div className="panel relative p-6">
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="signal-dot" />
        <span className="label">CHI posterior · live</span>
      </div>
      <div className="absolute right-3 top-3 label">
        CHI = 1 − QTL / (t · c)
      </div>

      <div className="mt-6 mb-2 flex items-end justify-between">
        <h2 className="display text-2xl text-ink-0">Posterior over CHI</h2>
        <div className="mono text-[10px] uppercase tracking-cap text-ink-2">
          <span>n = {chiSamples.length.toLocaleString()}</span>
          <span className="mx-3 text-ink-3">|</span>
          <span>bins = {N_BINS}</span>
        </div>
      </div>
      <div className="hairline mb-4" />

      <div className="relative">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: 360, width: "100%" }}
          notMerge
        />
        <div className="mono mt-3 flex items-center justify-between text-[10px] text-ink-2">
          <span>CI₉₀ band shaded</span>
          <span>
            <span className="text-ink-2">CI₉₀:</span>{" "}
            <span className="text-signal">{pct(ci90[0])} → {pct(ci90[1])}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
