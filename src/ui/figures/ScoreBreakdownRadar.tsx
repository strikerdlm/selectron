// F6 ScoreBreakdownRadar — per-criterion weighted contribution to total MCDA score.
//
// Each spoke represents one criterion. The value plotted is the weighted contribution
// w̄_k · z(x_k) where w̄_k = 1/K (closed-form Dirichlet(1,…,1) mean) and z(x_k) is
// the normalized criterion score in [0, 1]. For K=5 criteria, contribution ∈ [0, 0.2].
//
// Design:
//   - Radar (polar) chart; one spoke per criterion.
//   - All spokes share the same max (consistent comparison): max(0.25, max(contributions)*1.2).
//   - Series: single filled polygon. Okabe-Ito blue #0072B2, fill rgba(0,114,178,0.20).
//   - ARIA enabled, animation: false, useUTC: true.
//   - Empty state: data.length === 0 or all contributions are zero.
//   - Container: standalone, height 280.
//
// Produced from the /echarts skill template library (radar pattern) combined with
// PosteriorPlot.tsx structural patterns. The skill returned its reference docs rather
// than synthesized code; code authored directly from templates and task spec.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";

export type RadarDatum = {
  criterionId: string;
  label: string;
  contribution: number;
};

type Props = { data: RadarDatum[] };

export function ScoreBreakdownRadar({ data }: Props) {
  // Empty-state guard: no data or all contributions are zero.
  const allZero = data.length === 0 || data.every((d) => d.contribution === 0);
  if (allZero) {
    return (
      <div className="grid h-[280px] place-items-center text-sm text-ink-2 mono">
        no score data — fill in criterion values
      </div>
    );
  }

  // Shared spoke max: consistent comparison across all axes.
  const maxContribution = Math.max(...data.map((d) => d.contribution));
  const SPOKE_MAX = Math.max(0.25, maxContribution * 1.2);

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    radar: {
      indicator: data.map((d) => ({
        name: d.label.slice(0, 14),
        max: SPOKE_MAX,
      })),
      radius: "65%",
      splitNumber: 4,
      axisName: {
        color: "#475569",
        fontSize: 10,
      },
      splitLine: {
        lineStyle: { color: "#e5e7eb" },
      },
      splitArea: { show: false },
    },

    series: [
      {
        type: "radar",
        data: [
          {
            value: data.map((d) => d.contribution),
            areaStyle: { color: "rgba(0,114,178,0.20)" },
            lineStyle: { color: "#0072B2", width: 2 },
            itemStyle: { color: "#0072B2" },
          },
        ],
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
