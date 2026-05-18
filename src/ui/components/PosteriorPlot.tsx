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

type Props = { posterior: Posterior };

export function PosteriorPlot({ posterior }: Props) {
  const { centers, counts } = histogram(posterior.samples, 40);
  const option = {
    grid: { left: 48, right: 16, top: 24, bottom: 32 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: centers.map((c) => (100 * c).toFixed(1) + "%"),
      axisLabel: { interval: 6 },
    },
    yAxis: { type: "value", name: "count" },
    series: [
      {
        type: "bar",
        data: counts,
        itemStyle: { color: "#1e3a8a" },
        barCategoryGap: "5%",
        markArea: {
          itemStyle: { color: "rgba(30, 58, 138, 0.08)" },
          data: [
            [
              { xAxis: (100 * posterior.ci90[0]).toFixed(1) + "%" },
              { xAxis: (100 * posterior.ci90[1]).toFixed(1) + "%" },
            ],
          ],
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#dc2626", width: 2 },
          data: [{ xAxis: (100 * posterior.mean).toFixed(1) + "%", name: "mean" }],
        },
      },
    ],
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-medium text-slate-700">Posterior over total score</h3>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 320, width: "100%" }}
      />
    </div>
  );
}
