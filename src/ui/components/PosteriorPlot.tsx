import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { Posterior } from "@/types";

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer,
]);

function histogram(samples: Float64Array, bins: number): { centers: number[]; counts: number[] } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] < min) min = samples[i];
    if (samples[i] > max) max = samples[i];
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

type Props = { posterior: Posterior };

export function PosteriorPlot({ posterior }: Props) {
  const { centers, counts } = histogram(posterior.samples, 56);

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
              `<span style="color:#71757c">score</span> <span style="color:#f5b541">${p.name}</span><br/><span style="color:#71757c">count</span> <span style="color:#e6e8ec">${p.value}</span>`,
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
              { offset: 0, color: "#ffd479" },
              { offset: 1, color: "#f5b541" },
            ],
          },
        },
        emphasis: { itemStyle: { color: "#ffd479" } },
        markArea: {
          silent: true,
          itemStyle: { color: "rgba(245, 181, 65, 0.08)" },
          label: { show: false },
          data: [
            [
              { xAxis: pct(posterior.ci90[0]), name: "CI90" },
              { xAxis: pct(posterior.ci90[1]) },
            ],
          ],
        },
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: { color: "#ffd479", width: 1, type: "dashed" },
          label: {
            show: true,
            position: "insideEndTop",
            color: "#ffd479",
            fontFamily: "JetBrains Mono",
            fontSize: 10,
            formatter: "μ",
          },
          data: [{ xAxis: pct(posterior.mean) }],
        },
      },
    ],
  };

  return (
    <div className="panel relative p-6">
      {/* corner reticles */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="signal-dot" />
        <span className="label">posterior · live</span>
      </div>
      <div className="absolute right-3 top-3 label">
        S<sub className="text-[8px]">i</sub> = Σ w<sub className="text-[8px]">k</sub> · z(x<sub className="text-[8px]">i,k</sub>)
      </div>

      <div className="mt-6 mb-2 flex items-end justify-between">
        <h2 className="display text-2xl text-ink-0">Posterior over total score</h2>
        <div className="mono text-[10px] uppercase tracking-cap text-ink-2">
          <span>n = {posterior.samples.length.toLocaleString()}</span>
          <span className="mx-3 text-ink-3">|</span>
          <span>bins = 56</span>
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
        {/* CI markers in mono, anchored along the bottom */}
        <div className="mono mt-3 flex items-center justify-between text-[10px] text-ink-2">
          <span>CI₉₀ band shaded</span>
          <span>
            <span className="text-ink-2">CI₉₀:</span>{" "}
            <span className="text-signal">{pct(posterior.ci90[0])} → {pct(posterior.ci90[1])}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
