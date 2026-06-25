// I6 IMMAnalogPosteriorPlot — per-condition λ draw histograms + scenario-conditioned
// pEVAC / pLOCL / CHI predictive metric cards.
//
// Data sources (three independent):
//   • Metric cards   ← outcome.pEvacPost / pLoclPost / chiPost  (already percent 0..100)
//   • Small-multiples ← draws.draws[].lambdas  (raw λ samples, events/person-day)
//   • Table          ← outcome.perConditionTmeContribPost  (mean TME contribution, events/trial)
//
// Small-multiples: one ECharts bar chart per condition, capped at MAX_CONDITIONS=6.
// Each chart is an independent histogram binned over [min, max] of that condition's lambdas.
// Empty state (draws.draws.length === 0): italic note; cards + table still render.
//
// Layout: CSS grid for small-multiples (auto, up to 3 columns).
// Histogram pattern follows PosteriorPlot.tsx (bar series, real samples).
// Metric card pattern: data-testid labels, Okabe-Ito colors.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import type { CaptionBlock } from "./FigureCaption";
import type { PosteriorDrawsResponse } from "../../api/calibration";
import type { PosteriorPredictiveOutcome, PredictiveSummary } from "../../imm/types";

// Okabe-Ito palette — colorblind-safe
const COLORS = {
  pEvac: "#E69F00", // Orange
  pLocl: "#D55E00", // Vermillion
  chi:   "#009E73", // Bluish green
  hist:  "#0072B2", // Blue (histogram bars)
};

const MAX_CONDITIONS = 6;
const N_BINS = 20;

// Build a histogram from raw samples over their own [min, max] range.
// Returns bin-center labels (as short numeric strings) and counts.
function buildLambdaHistogram(
  lambdas: number[],
  bins: number,
): { centers: string[]; counts: number[] } {
  if (lambdas.length === 0) return { centers: [], counts: [] };

  let lo = lambdas[0];
  let hi = lambdas[0];
  for (let i = 1; i < lambdas.length; i++) {
    if (lambdas[i] < lo) lo = lambdas[i];
    if (lambdas[i] > hi) hi = lambdas[i];
  }
  const range = hi - lo;
  const width = range > 0 ? range / bins : 1;
  const safeBins = range > 0 ? bins : 1;

  const counts = new Array<number>(safeBins).fill(0);
  for (const v of lambdas) {
    let idx = range > 0 ? Math.floor((v - lo) / width) : 0;
    if (idx === safeBins) idx = safeBins - 1;
    counts[idx]++;
  }

  const centers = Array.from({ length: safeBins }, (_, i) => {
    // Format to 3 significant figures
    const c = range === 0 ? lo : lo + (i + 0.5) * width;
    return c.toPrecision(3);
  });

  return { centers, counts };
}

// ─── MetricCard ─────────────────────────────────────────────────────────────

type MetricCardProps = {
  testId: string;
  label: string;
  summary: PredictiveSummary;
  color: string;
  unit?: string;
};

function MetricCard({ testId, label, summary, color, unit = "%" }: MetricCardProps) {
  const { mean, ci90, sd } = summary;
  return (
    <div
      data-testid={testId}
      className="rounded border border-line/40 px-4 py-3 flex flex-col gap-1"
      style={{ borderLeftColor: color, borderLeftWidth: 3 }}
    >
      <p className="text-[10px] uppercase tracking-cap text-ink-2">{label}</p>
      <p className="text-xl font-semibold mono" style={{ color }}>
        {mean.toFixed(1)}<span className="text-xs font-normal text-ink-2 ml-0.5">{unit}</span>
      </p>
      <p className="text-[10px] mono text-ink-3">
        90% predictive interval [{ci90[0].toFixed(1)}, {ci90[1].toFixed(1)}]{unit}
        {"  "}σ={sd.toFixed(2)}
      </p>
    </div>
  );
}

// ─── LambdaHistPanel ─────────────────────────────────────────────────────────

type LambdaHistPanelProps = {
  conditionId: string;
  lambdas: number[];
  themeName: string;
};

function LambdaHistPanel({ conditionId, lambdas, themeName }: LambdaHistPanelProps) {
  const { centers, counts } = buildLambdaHistogram(lambdas, N_BINS);

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },
    grid: { left: 8, right: 8, top: 28, bottom: 32, containLabel: true },
    title: {
      text: conditionId,
      textStyle: { fontSize: 10, fontWeight: "normal" as const },
      top: 4,
      left: "center",
    },
    xAxis: {
      type: "category" as const,
      name: "λ",
      nameLocation: "middle" as const,
      nameGap: 20,
      data: centers,
      boundaryGap: true,
      axisTick: { show: false },
      axisLabel: {
        interval: Math.max(0, Math.floor(centers.length / 3) - 1),
        fontSize: 8,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: "λ parameter draws",
        type: "bar" as const,
        data: counts,
        barCategoryGap: "6%",
        itemStyle: { color: COLORS.hist, opacity: 0.8 },
      },
    ],
  };

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      theme={themeName}
      style={{ height: 160, width: "100%" }}
      notMerge
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export type IMMAnalogPosteriorPlotProps = {
  draws: PosteriorDrawsResponse;
  outcome: PosteriorPredictiveOutcome;
  kind: string;
  trialsPerDraw: number;
};

export function IMMAnalogPosteriorPlot({ draws, outcome, kind, trialsPerDraw }: IMMAnalogPosteriorPlotProps) {
  const { themeName } = useFigureTheme();

  // Per-condition table — top 10 by mean desc
  const tableRows = Object.entries(outcome.perConditionTmeContribPost)
    .sort(([, a], [, b]) => b.mean - a.mean)
    .slice(0, 10);

  // Small-multiples — cap at MAX_CONDITIONS
  const histDraws = draws.draws.slice(0, MAX_CONDITIONS);

  // Caption
  const captionBlock: CaptionBlock = {
    figureId: "I6",
    oneLine: `Incidence-parameter uncertainty sensitivity for kind "${kind}": ${trialsPerDraw.toLocaleString()} Monte Carlo trials × ${outcome.nDraws} parameter draws.`,
    methods:
      "The Python /posterior/draws endpoint serves Gamma-Poisson or Lognormal-Poisson incidence-rate draws stored in the fitted priors for each condition. " +
      "For each draw the frontend runs trialsPerDraw Monte Carlo trials by injecting direct incidence-rate overrides at the engine's rate-sampling site. " +
      "The interval is over per-draw conditional metric means, not the full mission-outcome distribution and not an empirical calibration interval. " +
      "Per-condition draws are sampled independently and do not include cross-condition posterior covariance, severity uncertainty, treatment uncertainty, or accepted evidence coverage. " +
      "Per-condition histograms show the raw λ samples from the parameter draws (events/person-day). " +
      "The TME contribution table reports the distribution of the per-draw mean expected TME " +
      "contribution per condition (events/trial), sorted by mean descending.",
    source:
      "Antonsen et al. (2022) npj Microgravity 8(1) [doi:10.1038/s41526-022-00193-9]; " +
      "Keenan et al. (2015) ICES-2015-123 [K15]. " +
      "Stored Selectron incidence-prior draws, Selectron Calibration API. Accepted evidence coverage: 0/4,849.",
    reproducibility: `kind=${kind}, nDraws=${outcome.nDraws}, trialsPerDraw=${trialsPerDraw}, seed=${draws.seed}`,
    interpretation:
      "This figure shows how conditional scenario outputs change when unadjudicated incidence-rate parameters are varied. " +
      "The three metric cards report mean conditional scenario outputs and 90% intervals over parameter-draw means. " +
      "The small histograms show how per-condition incidence rates (λ) vary across stored parameter draws. " +
      "The table ranks conditions by their conditional expected contribution to total medical events under these assumptions.",
  };

  return (
    <div className="space-y-5">
      {/* ── Metric cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          testId="pp-pEvac"
          label="pEVAC"
          summary={outcome.pEvacPost}
          color={COLORS.pEvac}
        />
        <MetricCard
          testId="pp-pLocl"
          label="pLOCL"
          summary={outcome.pLoclPost}
          color={COLORS.pLocl}
        />
        <MetricCard
          testId="pp-chi"
          label="CHI"
          summary={outcome.chiPost}
          color={COLORS.chi}
        />
      </div>

      {/* ── Per-condition λ small-multiples ── */}
      <div>
        <p className="text-[10px] uppercase tracking-cap text-ink-2 mb-2">
          Per-condition λ draws (events/person-day)
        </p>
        {histDraws.length === 0 ? (
          <p className="text-[11px] italic text-ink-3">
            No per-condition draws available for kind "{kind}" — this is expected for
            mission kinds without stored incidence-parameter draws.
          </p>
        ) : (
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${Math.min(histDraws.length, 3)}, 1fr)` }}
          >
            {histDraws.map((d) => (
              <LambdaHistPanel
                key={d.condition_id}
                conditionId={d.condition_id}
                lambdas={d.lambdas}
                themeName={themeName}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Per-condition TME contribution table ── */}
      <div>
        <p className="text-[10px] uppercase tracking-cap text-ink-2 mb-2">
          Top conditions by expected TME contribution (events/trial)
        </p>
        <table className="w-full text-[10px] mono">
          <thead>
            <tr className="border-b border-line/40 text-ink-3">
              <th className="text-left py-1 pr-3 font-normal">Condition</th>
              <th className="text-right py-1 pr-3 font-normal">Mean</th>
          <th className="text-right py-1 pr-3 font-normal">90% sensitivity interval</th>
              <th className="text-right py-1 font-normal">σ</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map(([conditionId, s]) => (
              <tr
                key={conditionId}
                data-testid={`pp-row-${conditionId}`}
                className="border-b border-line/20 text-ink-1"
              >
                <td className="py-1 pr-3 text-ink-2">{conditionId}</td>
                <td className="text-right py-1 pr-3">{s.mean.toFixed(4)}</td>
                <td className="text-right py-1 pr-3">
                  [{s.ci90[0].toFixed(4)}, {s.ci90[1].toFixed(4)}]
                </td>
                <td className="text-right py-1">{s.sd.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Caption ── */}
      <FigureCaption block={captionBlock} />
    </div>
  );
}
