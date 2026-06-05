// src/ui/figures/CriteriaSplom.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { linregress, pearson, correlationPValue, correlationPairs } from "@/analysis/correlation";
import type { Candidate, Criterion } from "@/types";

// Legibility cap: one representative criterion per family.
export const SPLOM_IDS = [
  "psych.conscientiousness", "physical.vo2max", "cognitive.nasa_cognition_battery",
  "behavioral.teamwork", "psych.resilience_cdrisc",
];

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

const short = (c: Criterion) => c.label.split(/[ (]/)[0];

// Significance stars from a two-tailed p-value (APA convention).
function stars(p: number): string {
  if (p < 0.001) return "***";
  if (p < 0.01) return "**";
  if (p < 0.05) return "*";
  return "";
}

function strengthWord(absR: number): string {
  if (absR >= 0.7) return "strong";
  if (absR >= 0.4) return "moderate";
  if (absR >= 0.2) return "weak";
  return "negligible";
}

export function CriteriaSplom({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  const cols = criteria.filter((c) => SPLOM_IDS.includes(c.id));
  const K = cols.length;
  if (cohort.length < 3 || K < 2) {
    return <div className="grid h-[480px] place-items-center text-sm text-ink-2 mono">need ≥3 candidates for a scatterplot matrix</div>;
  }
  const n = cohort.length;
  const vectors = cols.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const labels = cols.map(short);

  // Colorblind-safe diverging endpoints (Okabe-Ito), theme-aware.
  const posColor = tokens.diverging[0];
  const negColor = tokens.diverging[tokens.diverging.length - 1];

  const grid: object[] = [], xAxis: object[] = [], yAxis: object[] = [], series: object[] = [], title: object[] = [];
  const span = 92 / K; // % per cell
  let ai = 0; // axis index for cells that actually host a grid (lower triangle only)

  for (let r = 0; r < K; r++) {
    for (let c = 0; c < K; c++) {
      const left = 4 + c * span, top = 2 + r * span;
      const cx = left + span * 0.39;       // horizontal centre of the cell
      if (r > c) {
        // ── Lower triangle: scatter + OLS trend line ──────────────────────
        grid.push({ left: `${left}%`, top: `${top}%`, width: `${span * 0.78}%`, height: `${span * 0.74}%` });
        xAxis.push({ gridIndex: ai, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
        yAxis.push({ gridIndex: ai, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
        series.push({
          type: "scatter", xAxisIndex: ai, yAxisIndex: ai, symbolSize: 4,
          data: cohort.map((_, k) => [vectors[c][k], vectors[r][k]]),
          itemStyle: { color: "#0072B2", opacity: 0.5 },
          z: 2,
        });
        const { slope, intercept } = linregress(vectors[c], vectors[r]);
        const xs = vectors[c];
        const xmin = Math.min(...xs), xmax = Math.max(...xs);
        series.push({
          type: "line", xAxisIndex: ai, yAxisIndex: ai, silent: true, showSymbol: false,
          data: [[xmin, slope * xmin + intercept], [xmax, slope * xmax + intercept]],
          lineStyle: { color: tokens.label, width: 1.5, opacity: 0.9 }, z: 3,
        });
        ai++;
      } else if (r === c) {
        // ── Diagonal: variable name ───────────────────────────────────────
        title.push({ left: `${cx}%`, top: `${top + span * 0.3}%`, textAlign: "center", text: labels[r], textStyle: { color: tokens.label, fontSize: 11, fontWeight: "normal" } });
      } else {
        // ── Upper triangle: quantified r + significance ───────────────────
        const rr = pearson(vectors[r], vectors[c]);
        const p = correlationPValue(rr, n);
        const fs = 12 + Math.abs(rr) * 13; // 12–25 px, scaled by |r|
        title.push({
          left: `${cx}%`, top: `${top + span * 0.24}%`, textAlign: "center",
          text: rr.toFixed(2), textStyle: { color: rr >= 0 ? posColor : negColor, fontSize: fs, fontWeight: 600 },
          subtext: stars(p) || "ns", subtextStyle: { color: tokens.label, fontSize: 10, fontWeight: "normal" },
          itemGap: 1,
        });
      }
    }
  }

  const option = { animation: false, aria: { enabled: true }, grid, xAxis, yAxis, series, title };

  // ── Statistical highlights (over the same representative criteria) ────────
  const pairs = correlationPairs(vectors, "pearson");
  const nSig = pairs.filter((pr) => pr.p < 0.05).length;
  const top = pairs.slice(0, 5);

  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 500, width: "100%" }} notMerge />

      <div className="mt-2 rounded-md border border-line bg-bg-1/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="mono text-[11px] uppercase tracking-cap text-ink-2">
            Statistical highlights · Pearson r
          </h3>
          <span className="mono text-[11px] text-ink-3">
            {pairs.length} pairs · <span className="text-ink-1">{nSig} significant</span> at α=.05 · n={n}
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line/60">
              {["Criterion pair", "r", "strength", "p", ""].map((h, i) => (
                <th key={h || i} className={`mono text-[10px] uppercase tracking-cap text-ink-3 py-1.5 ${i === 1 || i === 3 ? "text-right pr-3" : "pr-3"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {top.map((pr) => {
              const aR = Math.abs(pr.r);
              const color = pr.r >= 0 ? posColor : negColor;
              return (
                <tr key={`${pr.i}-${pr.j}`} className="border-b border-line/30">
                  <td className="py-1.5 pr-3 text-[13px] text-ink-1">
                    {labels[pr.i]} <span className="text-ink-3">×</span> {labels[pr.j]}
                  </td>
                  <td className="py-1.5 pr-3 text-right mono text-[13px]" style={{ color }}>
                    {pr.r >= 0 ? "+" : ""}{pr.r.toFixed(2)}
                  </td>
                  <td className="py-1.5 pr-3 mono text-[12px] text-ink-2">
                    {pr.r >= 0 ? "+" : "−"} {strengthWord(aR)}
                  </td>
                  <td className="py-1.5 pr-3 text-right mono text-[12px] text-ink-2">
                    {pr.p < 0.001 ? "<.001" : pr.p.toFixed(3)}
                  </td>
                  <td className="py-1.5 mono text-[12px]" style={{ color: pr.p < 0.05 ? color : tokens.label }}>
                    {stars(pr.p) || "ns"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="mono text-[10px] text-ink-3 mt-3 leading-relaxed">
          Lower triangle: raw-score scatter with OLS trend line. Upper triangle: Pearson r
          (size ∝ |r|, blue = positive, orange-red = negative) with two-tailed significance —
          *** p&lt;.001, ** p&lt;.01, * p&lt;.05, ns = not significant. p-values from the Student-t
          statistic t = r·√((n−2)/(1−r²)), df = n−2.
        </p>
      </div>

      <FigureCaption block={analysisCaptions.splom({ n: cohort.length, isDemo, ids: labels, k: criteria.length })} />
    </>
  );
}
