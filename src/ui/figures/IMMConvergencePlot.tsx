// I4 IMMConvergencePlot — batch σ(CHI) / σ(pEvac) plus estimator precision.
//
// Shows the rolling standard deviation of CHI and pEVAC (in 1000-trial windows)
// against trial count, with a dashed 5 pp historical reference line from the
// M18/A22-style batch-stability diagnostic. This trace is outcome variability,
// not the Monte Carlo standard error of the headline estimates.
//
// Scale: sigmaChi/sigmaPevac are in CHI's native 0–100 percent scale
// (absolute σ, matching the rolling window in simulate.ts).
// The 5 pp reference line is at y = 5.
//
// Placeholder when trials < 1000: text message (no batch checkpoints).

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
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

function fmtPp(x: number): string {
  return `${x.toFixed(2)} pp`;
}

function fmtPct(x: number): string {
  return `${x.toFixed(1)}%`;
}

function fmtRel(x: number | null): string {
  if (x == null) return "n/a";
  if (x < 0.0001) return "<0.01%";
  return `${(x * 100).toFixed(2)}%`;
}

function fmtInterval(ci: [number, number]): string {
  return `${fmtPct(ci[0])} -> ${fmtPct(ci[1])}`;
}

function PrecisionPanel({ outcome }: { outcome: IMMOutcome }) {
  const mcse = outcome.monteCarloError;
  if (!mcse) return null;
  return (
    <div className="panel mt-3 p-3" data-testid="imm-precision-panel">
      <div className="mono text-[10px] uppercase tracking-cap text-ink-3">Estimator precision</div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="mono text-[10px] text-ink-2">
          CHI MCSE <span className="tabular-nums text-ink-1">{fmtPp(mcse.chiMeanMcse)}</span>
          <span className="text-ink-3"> · rel </span>
          <span className="tabular-nums text-ink-1">{fmtRel(mcse.chiRelativeMcse)}</span>
        </div>
        <div className="mono text-[10px] text-ink-2">
          pEVAC MCSE <span className="tabular-nums text-ink-1">{fmtPp(mcse.pEvacMcsePct)}</span>
          <span className="text-ink-3"> · Wilson 95% </span>
          <span className="tabular-nums text-ink-1">{fmtInterval(mcse.pEvacWilson95Pct)}</span>
        </div>
        <div className="mono text-[10px] text-ink-2">
          pLOCL MCSE <span className="tabular-nums text-ink-1">{fmtPp(mcse.pLoclMcsePct)}</span>
          <span className="text-ink-3"> · Wilson 95% </span>
          <span className="tabular-nums text-ink-1">{fmtInterval(mcse.pLoclWilson95Pct)}</span>
        </div>
        <div className="mono text-[10px] text-ink-2">
          Health MCSE <span className="tabular-nums text-ink-1">{fmtPp(mcse.healthCriterionMcsePct)}</span>
          <span className="text-ink-3"> · Wilson 95% </span>
          <span className="tabular-nums text-ink-1">{fmtInterval(mcse.healthCriterionWilson95Pct)}</span>
        </div>
      </div>
    </div>
  );
}

export function IMMConvergencePlot({ outcome, trials, chiStar }: IMMConvergencePlotProps) {
  const { themeName } = useFigureTheme();
  const { trialCheckpoints, sigmaChi, sigmaPevac } = outcome.convergence;

  // Insufficient trials — no checkpoints available
  if (sigmaChi.length === 0) {
    return (
      <div>
        <div className="panel mono text-[11px] text-ink-3 text-center py-8">
          Batch-variability diagnostics require T ≥ 1 000 trials.
          Current: T = {trials.toLocaleString()}.
        </div>
        <PrecisionPanel outcome={outcome} />
        <FigureCaption
          block={{
            figureId: "I4",
            oneLine: `Batch σ(CHI) and σ(pEVAC) vs cumulative trials — T=${trials.toLocaleString()} (insufficient for batch diagnostics).`,
            methods: "Requires T ≥ 1 000 trials for the 1 000-trial rolling-window σ diagnostic. Estimator precision is reported separately by MCSE and Wilson intervals when available.",
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
      data: ["batch σ(CHI)", "batch σ(pEVAC)", "5 pp historical reference"],
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" as const },
      formatter: (params: Array<{ name: string; seriesName: string; value: number }>) => {
        if (!params.length) return "";
        const rows = params
          .filter((p) => p.value !== undefined && p.value !== null)
          .map((p) => `<span style="color:#b0b6bd">${p.seriesName}</span> ${Number(p.value).toFixed(2)} pp`)
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
      name: "batch σ (pp)",
      nameLocation: "middle" as const,
      nameGap: 40,
      min: 0,
      axisLabel: {
        fontSize: 10,
        formatter: (v: number) => `${v.toFixed(1)} pp`,
      },
    },

    series: [
      {
        name: "batch σ(CHI)",
        type: "line" as const,
        data: sigmaChi,
        showSymbol: false,
        lineStyle: { color: CHI_COLOR, width: 2 },
        itemStyle: { color: CHI_COLOR },
      },
      {
        name: "batch σ(pEVAC)",
        type: "line" as const,
        data: sigmaPevac,
        showSymbol: false,
        lineStyle: { color: PEVAC_COLOR, width: 2 },
        itemStyle: { color: PEVAC_COLOR },
      },
      // Dashed historical reference line at 5 pp (constant across checkpoints).
      {
        name: "5 pp historical reference",
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
      `Batch σ(CHI) and σ(pEVAC) vs cumulative trials (1 000-trial windows); ` +
      `dashed line = historical 5 pp batch-SD reference. χ*=${chiStar.toFixed(2)}.`,
    methods:
      "Rolling standard deviation computed in 1 000-trial windows from the IMM Monte Carlo " +
      "simulation (simulate.ts). σ values are in the native 0–100% scale (percentage-point " +
      "absolute SD) and describe batch outcome variability, not estimator precision. The 5 pp " +
      "line is retained as a historical M18/A22-style batch-stability reference only; MCSE, " +
      "relative MCSE, and Wilson intervals are the displayed estimator-precision diagnostics. " +
      `χ*=${chiStar.toFixed(2)} (composite health criterion).`,
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
        theme={themeName}
        style={{ height: 320, width: "100%" }}
        notMerge
      />
      <PrecisionPanel outcome={outcome} />
      <FigureCaption block={captionBlock} />
    </div>
  );
}
