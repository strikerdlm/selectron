// Iter-3 Phase 3D — horizontal stacked bar of per-condition QTL contribution
// to total mission QTL (lost crew-days). Sorted descending by mean QTL so the
// biggest contributors anchor the left edge. Colored by ConditionFamily.
//
// Reuses the ECharts core registration pattern from PosteriorPlot / RiskHistogram
// (single-file echarts.use) for bundle parity.

import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { Condition, ConditionFamily, RiskPosterior } from "@/types/risk";

echarts.use([
  BarChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

const FAMILY_COLOR: Record<ConditionFamily, string> = {
  psychiatric: "#f5b541",
  physiologic: "#7ec8a6",
  musculoskeletal: "#c98aff",
  performance: "#5ec1ff",
  team: "#ff8a8a",
};

type Props = {
  posterior: RiskPosterior;
  conditions: readonly Condition[];
};

const days = (x: number) => x.toFixed(2) + "d";

export function ConditionContribution({ posterior, conditions }: Props) {
  const entries = conditions
    .map((c) => {
      const summary = posterior.perConditionQTL[c.id];
      return {
        id: c.id,
        label: c.label,
        family: c.family,
        mean: summary?.mean ?? 0,
        ci90: summary?.ci90 ?? ([0, 0] as readonly [number, number]),
      };
    })
    .sort((a, b) => b.mean - a.mean);

  const total = entries.reduce((s, e) => s + e.mean, 0);

  const series = entries.map((e) => ({
    name: e.label,
    type: "bar" as const,
    stack: "qtl",
    barWidth: 28,
    itemStyle: { color: FAMILY_COLOR[e.family] },
    emphasis: { focus: "series" as const },
    data: [e.mean],
    tooltip: {
      formatter: () =>
        `<span style="color:#71757c">condition</span> <span style="color:#e6e8ec">${e.label}</span><br/>` +
        `<span style="color:#71757c">family</span> <span style="color:${FAMILY_COLOR[e.family]}">${e.family}</span><br/>` +
        `<span style="color:#71757c">mean QTL</span> <span style="color:#e6e8ec">${days(e.mean)}</span><br/>` +
        `<span style="color:#71757c">CI₉₀</span> <span style="color:#e6e8ec">${days(e.ci90[0])} → ${days(e.ci90[1])}</span><br/>` +
        `<span style="color:#71757c">share</span> <span style="color:#e6e8ec">${total > 0 ? ((100 * e.mean) / total).toFixed(1) : "0.0"}%</span>`,
    },
  }));

  const option = {
    animation: true,
    animationDuration: 280,
    animationEasing: "cubicOut",
    grid: { left: 0, right: 0, top: 8, bottom: 12, containLabel: false },
    tooltip: {
      trigger: "item",
      backgroundColor: "#0c0d0f",
      borderColor: "#2a2e34",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#e6e8ec", fontFamily: "JetBrains Mono", fontSize: 11 },
    },
    legend: { show: false },
    xAxis: { type: "value", show: false, splitLine: { show: false } },
    yAxis: { type: "category", show: false, data: ["QTL"] },
    series,
  };

  const familiesPresent = Array.from(new Set(entries.map((e) => e.family)));

  return (
    <div className="panel p-6">
      <div className="flex items-baseline justify-between">
        <span className="label">condition contribution</span>
        <span className="label">total μ · {days(total)}</span>
      </div>

      <h2 className="display mt-2 text-lg text-ink-0">Per-condition QTL</h2>
      <p className="mono mt-1 text-[10px] text-ink-3">
        each segment = mean lost crew-days attributable to one condition (spec §3.3 QTL aggregation).
        hover for CI₉₀ and share of total.
      </p>

      <div className="hairline my-4" />

      {total === 0 ? (
        <div className="grid h-[80px] place-items-center text-sm text-ink-2">
          <span className="mono">no QTL yet — select a mission to populate the posterior</span>
        </div>
      ) : (
        <div className="relative">
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            style={{ height: 80, width: "100%" }}
            notMerge
          />
        </div>
      )}

      {/* family legend */}
      <div className="mono mt-4 flex flex-wrap items-center gap-3 text-[10px] text-ink-2">
        {familiesPresent.map((fam) => (
          <span key={fam} className="flex items-center gap-2">
            <span
              className="inline-block h-[8px] w-[8px] rounded-[1px]"
              style={{ backgroundColor: FAMILY_COLOR[fam] }}
            />
            <span className="uppercase tracking-cap">{fam}</span>
          </span>
        ))}
      </div>

      {/* top-3 readout */}
      <div className="hairline my-4" />
      <ul className="mono space-y-1 text-[11px] text-ink-1">
        {entries.slice(0, 3).map((e, i) => (
          <li key={e.id} className="flex items-baseline justify-between">
            <span>
              <span className="text-ink-3">#{i + 1}</span>{" "}
              <span
                className="inline-block h-[6px] w-[6px] translate-y-[-1px] rounded-[1px] align-middle"
                style={{ backgroundColor: FAMILY_COLOR[e.family] }}
              />{" "}
              <span className="text-ink-0">{e.label}</span>
            </span>
            <span className="tabular-nums text-signal">
              {days(e.mean)}{" "}
              <span className="text-ink-3">
                ({total > 0 ? ((100 * e.mean) / total).toFixed(1) : "0.0"}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
