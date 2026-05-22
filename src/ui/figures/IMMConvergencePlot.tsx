// I4 IMMConvergencePlot — σ(CHI) and σ(pEvac) vs cumulative trial count.
//
// Shows the rolling standard deviation of CHI and pEVAC (in 1000-trial windows)
// against trial count, with a dashed 5% reference line per M18/A22 convergence rule.
//
// Scale: sigmaChi/sigmaPevac are in CHI's native 0–100 percent scale
// (absolute σ, matching the rolling window in simulate.ts).
// The 5% reference line is at y = 5 (percentage points).
//
// Placeholder when trials < 1000: text message (no convergence checkpoints).

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import { FigureCaption } from "./FigureCaption";
import type { IMMOutcome } from "../../imm/types";

// Okabe-Ito: Blue for CHI, Bluish Green for pEVAC
const CHI_COLOR   = "#0072B2";
const PEVAC_COLOR = "#009E73";
const REF_COLOR   = "#CC0000";

export type IMMConvergencePlotProps = {
  outcome: IMMOutcome;
  trials: number;
  chiStar: number;
};

export function IMMConvergencePlot({ outcome, trials, chiStar }: IMMConvergencePlotProps) {
  const { trialCheckpoints, sigmaChi, sigmaPevac } = outcome.convergence;

  // Insufficient trials — no checkpoints available
  if (sigmaChi.length === 0) {
    return (
      <div className="panel flex flex-col gap-3">
        <div className="mono text-[11px] text-ink-3 text-center py-8">
          Convergence diagnostics require T ≥ 1 000 trials.
          Current: T = {trials.toLocaleString()}.
        </div>
        <FigureCaption
          block={{
            figureId: "I4",
            oneLine: `σ(CHI) and σ(pEVAC) vs cumulative trials — T=${trials.toLocaleString()} (insufficient for diagnostics).`,
            methods: "Requires T ≥ 1 000 trials for the 1 000-trial rolling window σ estimate.",
            source: "Antonsen et al. (2022) [A22]; Musson & Heaton (2018) [M18].",
            reproducibility: `trials=${trials.toLocaleString()}, chiStar=${chiStar.toFixed(2)}`,
          }}
        />
      </div>
    );
  }

  // Format x-axis tick labels with thousands separator
  const xLabels = trialCheckpoints.map((t) => t.toLocaleString());

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 56,
      right: 24,
      top: 24,
      bottom: 52,
      containLabel: true,
    },

    legend: {
      bottom: 0,
      data: ["σ(CHI)", "σ(pEVAC)", "5% rule [M18, A22]"],
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" as const },
      formatter: (params: Array<{ name: string; seriesName: string; value: number }>) => {
        if (!params.length) return "";
        const rows = params
          .filter((p) => p.value !== undefined && p.value !== null)
          .map((p) => `<span style="color:#b0b6bd">${p.seriesName}</span> ${Number(p.value).toFixed(2)}%`)
          .join("<br/>");
        return `<b>T = ${params[0].name}</b><br/>${rows}`;
      },
    },

    xAxis: {
      type: "category" as const,
      name: "Cumulative trials",
      nameLocation: "middle" as const,
      nameGap: 30,
      data: xLabels,
      axisTick: { show: false },
      axisLabel: {
        fontSize: 10,
        interval: Math.max(0, Math.floor(xLabels.length / 6) - 1),
      },
      splitLine: { show: false },
    },

    yAxis: {
      type: "value" as const,
      name: "σ (%)",
      nameLocation: "middle" as const,
      nameGap: 40,
      min: 0,
      axisLabel: {
        fontSize: 10,
        formatter: (v: number) => `${v.toFixed(1)}%`,
      },
    },

    series: [
      {
        name: "σ(CHI)",
        type: "line" as const,
        data: sigmaChi,
        showSymbol: false,
        lineStyle: { color: CHI_COLOR, width: 2 },
        itemStyle: { color: CHI_COLOR },
      },
      {
        name: "σ(pEVAC)",
        type: "line" as const,
        data: sigmaPevac,
        showSymbol: false,
        lineStyle: { color: PEVAC_COLOR, width: 2 },
        itemStyle: { color: PEVAC_COLOR },
      },
      // Dashed reference line at 5% (constant across all checkpoints)
      {
        name: "5% rule [M18, A22]",
        type: "line" as const,
        data: xLabels.map(() => 5),
        showSymbol: false,
        lineStyle: { color: REF_COLOR, width: 1.5, type: "dashed" as const },
        itemStyle: { color: REF_COLOR },
      },
    ],
  };

  const captionBlock = {
    figureId: "I4",
    oneLine:
      `σ(CHI) and σ(pEVAC) vs cumulative trials (1 000-trial windows); ` +
      `dashed line = 5% convergence rule. χ*=${chiStar.toFixed(2)}.`,
    methods:
      "Rolling standard deviation computed in 1 000-trial windows from the IMM Monte Carlo " +
      "simulation (simulate.ts). σ values are in the native 0–100% scale (percentage-point " +
      "absolute SD). Convergence criterion: σ < 5 pp, per M18 (Musson & Heaton 2018) and " +
      "A22 (Antonsen et al. 2022 §Methods). The 5% rule is the threshold for declaring " +
      `the Monte Carlo estimate stable. χ*=${chiStar.toFixed(2)} (mission success threshold).`,
    source:
      "Musson & Heaton (2018) [M18]; Antonsen et al. (2022) npj Microgravity 8(1) [A22, " +
      "doi:10.1038/s41526-022-00193-9].",
    reproducibility: `trials=${trials.toLocaleString()}, chiStar=${chiStar.toFixed(2)}, checkpoints=${trialCheckpoints.length}`,
  };

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={NATURE_THEME_NAME}
        style={{ height: 320, width: "100%" }}
        notMerge
      />
      <FigureCaption block={captionBlock} />
    </div>
  );
}
