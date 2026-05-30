// I1 IMMHeadlineCard — at-a-glance hero composite for an IMM Monte Carlo run.
//
// Layout: 4 large stat cards (TME / CHI / pEVAC / pLOCL), one row, each card
// showing the posterior mean as the headline number plus a CI₉₅ whisker.
// Below the grid: a slim inline row for Mission Success Probability (MSP),
// followed by a small σ(CHI) convergence sparkline (the "did this run converge?"
// glance — full diagnostic lives in I4).
//
// Whiskers are styled divs (no ECharts) per spec. The sparkline IS ECharts but
// stripped of legend / axis labels — it shows only the σ(CHI) trajectory.
//
// Empty convergence (T < 1 000 → no checkpoints): cards + MSP row render
// normally; the sparkline area shows a small placeholder.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import { FigureCaption } from "./FigureCaption";
import type { IMMOutcome, PosteriorSummary } from "../../imm/types";

// Okabe-Ito palette assignments per metric (match I2 IMMPosteriorHist exactly)
const COLORS = {
  tme:   "#0072B2", // Blue
  chi:   "#009E73", // Bluish green
  pEvac: "#E69F00", // Orange
  pLocl: "#D55E00", // Vermillion
};

// ── Formatters ───────────────────────────────────────────────────────────────
// TME is a count (1 decimal, no suffix). CHI / pEVAC / pLOCL / MSP are
// percentages on the 0–100 scale (1 decimal + "%").
function fmtCount(x: number): string {
  return x.toFixed(1);
}
function fmtPct(x: number): string {
  return `${x.toFixed(1)}%`;
}

// ── CI₉₅ whisker ─────────────────────────────────────────────────────────────
// A styled div, NOT ECharts. Renders a thin horizontal bar with a tick at the
// posterior mean and the CI₉₅ low/high values as monospaced labels at the
// extremes. Width-normalised so the visual range is anchored to the CI₉₅ span,
// not the absolute scale (per-card local frame; the absolute axis lives in I2).
type WhiskerProps = {
  ci95: [number, number];
  mean: number;
  fmt: (x: number) => string;
  color: string;
};

function Whisker({ ci95, mean, fmt, color }: WhiskerProps) {
  const [lo, hi] = ci95;
  const span = Math.max(hi - lo, 1e-9);
  // Tick position as percent of the CI₉₅ span (clamped to [0, 100]).
  const meanPct = Math.max(0, Math.min(100, ((mean - lo) / span) * 100));

  return (
    <div className="mt-3" data-testid="imm-headline-whisker">
      <div className="mono mb-1 flex items-baseline justify-between text-[10px] text-ink-3">
        <span>CI₉₅</span>
        <span className="tabular-nums text-ink-2">
          {fmt(lo)} <span className="text-ink-3">→</span> {fmt(hi)}
        </span>
      </div>
      <div className="relative h-[3px] w-full bg-line">
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: "100%", backgroundColor: `${color}33` }}
        />
        <div
          className="absolute top-[-2px] h-[7px] w-[2px]"
          style={{ left: `calc(${meanPct}% - 1px)`, backgroundColor: color }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
// Single hero card: label + big mean + whisker. One per metric.
type StatCardProps = {
  label: string;
  unit: string;
  summary: PosteriorSummary;
  fmt: (x: number) => string;
  color: string;
};

function StatCard({ label, unit, summary, fmt, color }: StatCardProps) {
  return (
    <div className="panel p-5 flex flex-col">
      <div className="flex items-baseline justify-between">
        <span className="label" style={{ color }}>{label}</span>
        <span className="mono text-[10px] text-ink-3 uppercase tracking-cap">{unit}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span
          className="display mono text-4xl text-ink-0 leading-none tabular-nums"
          data-testid={`imm-headline-${label.toLowerCase()}-mean`}
        >
          {fmt(summary.mean)}
        </span>
      </div>
      <Whisker ci95={summary.ci95} mean={summary.mean} fmt={fmt} color={color} />
    </div>
  );
}

// ── MSP inline row ───────────────────────────────────────────────────────────
// 5th metric (Mission Success Probability) gets a slim full-width row instead
// of a 5th card — avoids the visual asymmetry of 5 across in a 4-col grid.
function MSPRow({ msp }: { msp: PosteriorSummary }) {
  const color = "#0072B2"; // Blue (Okabe-Ito); MSP is "joint success", primary metric.
  return (
    <div className="panel p-4 flex items-center justify-between gap-4">
      <div className="flex items-baseline gap-3">
        <span className="label" style={{ color }}>MSP</span>
        <span className="mono text-[10px] text-ink-3 uppercase tracking-cap">
          mission success probability
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span
          className="display mono text-2xl text-ink-0 leading-none tabular-nums"
          data-testid="imm-headline-msp-mean"
        >
          {fmtPct(msp.mean)}
        </span>
        <span className="mono text-[10px] text-ink-3">
          CI₉₅{" "}
          <span className="tabular-nums text-ink-2">
            {fmtPct(msp.ci95[0])} <span className="text-ink-3">→</span> {fmtPct(msp.ci95[1])}
          </span>
        </span>
      </div>
    </div>
  );
}

// ── σ(CHI) convergence sparkline ─────────────────────────────────────────────
// Tiny line chart — no legend, no axis labels, no tooltip frame. Just the
// trajectory of σ(CHI) over cumulative trials. The "did it converge?" glance.
type SparklineProps = {
  trialCheckpoints: number[];
  sigmaChi: number[];
};

function ConvergenceSparkline({ trialCheckpoints, sigmaChi }: SparklineProps) {
  if (sigmaChi.length === 0) {
    return (
      <div className="panel px-3 py-2 flex items-center justify-between gap-3" data-testid="imm-headline-sparkline-placeholder">
        <span className="mono text-[10px] text-ink-3 uppercase tracking-cap">σ(CHI) convergence</span>
        <span className="mono text-[10px] text-ink-3">
          T &lt; 1 000 — no diagnostic
        </span>
      </div>
    );
  }

  const xLabels = trialCheckpoints.map((t) => t.toLocaleString());

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: { left: 4, right: 4, top: 4, bottom: 4, containLabel: false },

    xAxis: {
      type: "category" as const,
      data: xLabels,
      show: false,
      boundaryGap: false,
      axisLine:  { show: false },
      axisTick:  { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },

    yAxis: {
      type: "value" as const,
      show: false,
      min: 0,
      axisLine:  { show: false },
      axisTick:  { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },

    tooltip: { show: false },
    legend: { show: false },

    series: [
      {
        name: "σ(CHI)",
        type: "line" as const,
        data: sigmaChi,
        showSymbol: false,
        smooth: true,
        lineStyle: { color: COLORS.chi, width: 1.5 },
        areaStyle: { color: COLORS.chi, opacity: 0.18 },
      },
    ],
  };

  return (
    <div className="panel px-3 py-2 flex items-center gap-3" data-testid="imm-headline-sparkline">
      <span className="mono text-[10px] text-ink-3 uppercase tracking-cap whitespace-nowrap">
        σ(CHI) trajectory
      </span>
      <div style={{ flex: 1, height: 40, minWidth: 120 }}>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          theme={NATURE_THEME_NAME}
          style={{ height: 40, width: "100%" }}
          notMerge
        />
      </div>
      <span className="mono text-[10px] tabular-nums text-ink-2 whitespace-nowrap">
        final σ = {sigmaChi[sigmaChi.length - 1]?.toFixed(2) ?? "—"}%
      </span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export type IMMHeadlineCardProps = {
  outcome: IMMOutcome;
  trials: number;
  seed?: number;
  mission?: { id: string; label: string };
};

export function IMMHeadlineCard({
  outcome,
  trials,
  seed = 0xc0ffee,
  mission,
}: IMMHeadlineCardProps) {
  const { tme, chi, pEvac, pLocl, missionSuccess, convergence } = outcome;
  const missionLabel = mission?.label ?? "(mission not specified)";
  const seedHex = `0x${seed.toString(16).toUpperCase()}`;

  const captionBlock = {
    figureId: "I1",
    oneLine:
      `TME=${fmtCount(tme.mean)}, ` +
      `CHI=${fmtPct(chi.mean)}, ` +
      `pEVAC=${fmtPct(pEvac.mean)}, ` +
      `pLOCL=${fmtPct(pLocl.mean)}, ` +
      `MSP=${fmtPct(missionSuccess.mean)} ` +
      `after T=${trials.toLocaleString()} IMM Monte Carlo trials on ${missionLabel}.`,
    methods:
      "Hero composite: four stat cards (TME, CHI, pEVAC, pLOCL) plus a Mission " +
      "Success Probability (MSP) row. Each headline number is the posterior mean " +
      "across T Monte Carlo trials; the whisker below shows the 95% credible " +
      "interval (CI₉₅) span with a tick at the mean. MSP is the joint probability " +
      "P(no LOCL ∧ no EVAC ∧ CHI ≥ χ*). The σ(CHI) sparkline at the bottom is the " +
      "convergence glance: a flat trajectory near zero indicates a converged run; " +
      "rising or jagged σ means insufficient trials. See I4 for the full diagnostic.",
    source:
      "Antonsen et al. (2022) npj Microgravity 8(1) [A22, doi:10.1038/s41526-022-00193-9] " +
      "(4-step IMM trial); Keenan et al. (2015) ICES-2015-123 [K15] (IMM framework). " +
      `Mission: ${missionLabel}.`,
    reproducibility:
      `seed=${seedHex}, trials=${trials.toLocaleString()}, commit=__COMMIT_SHA__`,
    layperson:
      "These four numbers summarise what happened across the simulated missions. " +
      "Total medical events (TME) counts how often any crew member needed medical " +
      "care. Crew Health Index (CHI) goes from 0% to 100% — a CHI of 95% means " +
      "the crew lost 5% of their available healthy time to illness or injury. " +
      "pEVAC is the chance an emergency return to Earth would be considered; " +
      "pLOCL is the chance one or more crew members would die. MSP combines all " +
      "three into a single mission-level success rate. The small bar under each " +
      "number shows how uncertain the estimate is — narrower bars mean we are " +
      "more confident.",
  };

  return (
    <div data-testid="imm-headline-card">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="TME"   unit="events" summary={tme}   fmt={fmtCount} color={COLORS.tme}   />
        <StatCard label="CHI"   unit="%"      summary={chi}   fmt={fmtPct}   color={COLORS.chi}   />
        <StatCard label="pEVAC" unit="%"      summary={pEvac} fmt={fmtPct}   color={COLORS.pEvac} />
        <StatCard label="pLOCL" unit="%"      summary={pLocl} fmt={fmtPct}   color={COLORS.pLocl} />
      </div>

      <div className="mt-4">
        <MSPRow msp={missionSuccess} />
      </div>

      <div className="mt-4">
        <ConvergenceSparkline
          trialCheckpoints={convergence.trialCheckpoints}
          sigmaChi={convergence.sigmaChi}
        />
      </div>

      <FigureCaption block={captionBlock} />
    </div>
  );
}
