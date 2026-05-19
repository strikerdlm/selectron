// F4 Dashboard Summary — CHI per candidate lollipop chart.
//
// Renders a vertical lollipop (stem + dot) with 90% CI whiskers for each
// candidate, sorted descending by chiMean (top performer leftmost).
//
// Produced via /echarts skill (lollipop + error-bar pattern library) —
// option object authored directly from:
//   - templates/scientific/lollipop.json  (stem + dot pattern)
//   - renderitems/error-bars.js           (whisker renderItem pattern)
//   - reference/SCIENTIFIC_RECIPES.md §7  (bar-errorbars recipe)
//
// Adjustment: the skill library uses a horizontal lollipop (category on Y).
// This component uses a vertical orientation (category on X, rotated -30°)
// per the T68 design brief. The custom series renderItem is adapted from the
// error-bars.js pattern but targets the vertical axis.

import ReactEChartsCore from "echarts-for-react/lib/core";
import type { CustomSeriesRenderItemAPI } from "echarts";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";

export type DashboardSummaryDatum = {
  candidateId: string;
  alias: string;
  chiMean: number;
  chiCi90: readonly [number, number];
};

type Props = { data: DashboardSummaryDatum[] };

// CI whisker renderItem — vertical line from ci90[0] to ci90[1] with end caps.
function whiskerRenderItem(
  _params: unknown,
  api: CustomSeriesRenderItemAPI,
) {
  const xIdx  = api.value(0) as number; // category index
  const lo    = api.value(1) as number;
  const hi    = api.value(2) as number;

  const loCoord = api.coord([xIdx, lo]);
  const hiCoord = api.coord([xIdx, hi]);
  const capHalf = 5; // px half-width of horizontal end caps

  return {
    type: "group",
    children: [
      // Vertical stem (CI range)
      {
        type: "line",
        shape: {
          x1: loCoord[0], y1: loCoord[1],
          x2: hiCoord[0], y2: hiCoord[1],
        },
        style: { lineWidth: 1.5, stroke: "#0072B2", opacity: 0.7 },
      },
      // Bottom cap
      {
        type: "line",
        shape: {
          x1: loCoord[0] - capHalf, y1: loCoord[1],
          x2: loCoord[0] + capHalf, y2: loCoord[1],
        },
        style: { lineWidth: 1.5, stroke: "#0072B2", opacity: 0.7 },
      },
      // Top cap
      {
        type: "line",
        shape: {
          x1: hiCoord[0] - capHalf, y1: hiCoord[1],
          x2: hiCoord[0] + capHalf, y2: hiCoord[1],
        },
        style: { lineWidth: 1.5, stroke: "#0072B2", opacity: 0.7 },
      },
    ],
  };
}

export function DashboardSummary({ data }: Props) {
  // Empty state — short-circuit before building any ECharts option.
  if (data.length === 0) {
    return (
      <div className="grid h-[140px] place-items-center text-sm text-ink-2 mono">
        no sims yet — run one from a candidate to populate this chart
      </div>
    );
  }

  // Sort descending by chiMean (top performer leftmost).
  const sorted = [...data].sort((a, b) => b.chiMean - a.chiMean);

  const aliases  = sorted.map((d) => d.alias);
  // Stem data: value = chiMean per category
  const stemData = sorted.map((d) => d.chiMean);
  // Dot data: scatter [categoryIndex, chiMean]
  const dotData  = sorted.map((d, i) => [i, d.chiMean]);
  // Whisker data: [categoryIndex, ci90Lo, ci90Hi]
  const whiskerData = sorted.map((d, i) => [i, d.chiCi90[0], d.chiCi90[1]]);

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 48,
      right: 24,
      top: 16,
      bottom: 40,
      containLabel: true,
    },

    xAxis: {
      type: "category",
      data: aliases,
      axisLabel: {
        rotate: -30,
        interval: 0,
      },
      axisTick: { show: false },
    },

    yAxis: {
      type: "value",
      name: "CHI",
      nameLocation: "middle",
      nameGap: 40,
      min: 0,
      max: 1,
    },

    tooltip: {
      trigger: "axis",
      formatter: (
        params: Array<{ name: string; seriesName: string; value: number | number[] }>,
      ) => {
        const row = params.find((p) => p.seriesName === "CHI mean");
        if (!row) return "";
        const d = sorted[aliases.indexOf(row.name)];
        if (!d) return "";
        return [
          `<span style="color:#71757c">candidate</span> <b>${d.alias}</b>`,
          `<span style="color:#71757c">CHI mean</span> ${d.chiMean.toFixed(3)}`,
          `<span style="color:#71757c">CI₉₀</span> [${d.chiCi90[0].toFixed(3)}, ${d.chiCi90[1].toFixed(3)}]`,
        ].join("<br/>");
      },
    },

    series: [
      // 1. Stem: bar from 0 → chiMean, hairline width
      {
        name: "stem",
        type: "bar",
        data: stemData,
        barWidth: 2,
        itemStyle: { color: "#0072B2", opacity: 0.5 },
        emphasis: { disabled: true },
        silent: true,
        z: 4,
      },

      // 2. Dot: scatter at chiMean
      {
        name: "CHI mean",
        type: "scatter",
        data: dotData,
        symbolSize: 12,
        itemStyle: {
          color: "#0072B2",
          borderColor: "#ffffff",
          borderWidth: 1.5,
        },
        z: 10,
      },

      // 3. CI whisker: custom series using renderItem
      {
        name: "CI₉₀",
        type: "custom",
        renderItem: whiskerRenderItem,
        data: whiskerData,
        encode: { x: 0, y: [1, 2] },
        z: 6,
        silent: true,
      },
    ],
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      theme={NATURE_THEME_NAME}
      style={{ height: 280, width: "100%" }}
      notMerge
    />
  );
}
