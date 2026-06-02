// src/ui/figures/CriteriaHeatmap.tsx
// A1 "candidate profiles" as a sorted data matrix. Each ROW is one candidate's
// full profile; rows are sorted by total MCDA score (best on top), columns are
// criteria ordered by discrimination (most-separating leftmost), and a leading
// "Σ total" column encodes each candidate's overall score. Cell color = the
// orientation-corrected goodness [0→1] (higher = better, native polarity
// removed). The descriptive-statistics table below carries the per-criterion
// numbers — same engine as before.
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { normalizeScore } from "@/engine/normalize";
import { mean, sampleStdDev, skewness } from "@/analysis/descriptive";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

const shortLabel = (s: string) => (s.length > 22 ? s.slice(0, 21) + "…" : s);

function fmt(x: number): string {
  const a = Math.abs(x);
  if (a >= 100) return x.toFixed(0);
  if (a >= 10) return x.toFixed(1);
  return x.toFixed(2);
}

export function CriteriaHeatmap({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 2 || criteria.length < 2) {
    return <div className="grid h-[360px] place-items-center text-sm text-ink-2 mono">need ≥2 candidates and ≥2 criteria</div>;
  }
  const n = cohort.length;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // Orientation-corrected goodness [0,1] and raw native, per criterion.
  const norm = criteria.map((c) => cohort.map((cand) => normalizeScore(clamp(cand.scores[c.id] ?? c.scale.min, c.scale.min, c.scale.max), c.scale, c.higherIsBetter)));
  const raw = criteria.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const totals = cohort.map((_, k) => mean(criteria.map((_, ci) => norm[ci][k])));

  // Per-criterion descriptive stats; columns ordered by discrimination (desc).
  const stats = criteria.map((c, ci) => ({
    ci, short: shortLabel(c.label), family: c.family,
    discrimination: sampleStdDev(norm[ci]),
    skew: skewness(norm[ci]),
    rawMean: mean(raw[ci]), rawSd: sampleStdDev(raw[ci]),
    rawMin: Math.min(...raw[ci]), rawMax: Math.max(...raw[ci]),
  }));
  const colOrder = [...stats].sort((a, b) => b.discrimination - a.discrimination);
  const maxDisc = Math.max(...colOrder.map((s) => s.discrimination), 1e-9);

  // Rows sorted by total score (best first); inverse y-axis puts best on top.
  const rowOrder = cohort.map((cand, k) => ({ k, alias: cand.alias, total: totals[k] }))
    .sort((a, b) => b.total - a.total);

  const xCats = ["Σ total", ...colOrder.map((s) => s.short)];
  const yCats = rowOrder.map((r) => r.alias);

  type Cell = { value: [number, number, number]; cand: string; col: string; raw: number | null };
  const cells: Cell[] = [];
  rowOrder.forEach((r, y) => {
    cells.push({ value: [0, y, r.total], cand: r.alias, col: "Σ total", raw: null });
    colOrder.forEach((s, ci) => {
      cells.push({ value: [ci + 1, y, norm[s.ci][r.k]], cand: r.alias, col: s.short, raw: raw[s.ci][r.k] });
    });
  });

  const rowPx = Math.max(11, Math.min(18, Math.round(520 / n)));
  const chartH = Math.max(360, n * rowPx + 120);

  // Scale the color ramp to the observed goodness range, not the full [0,1] —
  // demo/real goodness clusters mid-range, so absolute [0,1] washes out the
  // structure. The legend shows the actual min/max, so the mapping stays honest.
  const gVals = cells.map((c) => c.value[2]);
  const gMin = Math.floor(Math.min(...gVals) * 20) / 20;
  const gMax = Math.ceil(Math.max(...gVals) * 20) / 20;

  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 92, right: 84, top: 18, bottom: 96 },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { data: Cell }) => {
        const d = p.data;
        const g = d.value[2];
        if (d.raw == null) return `${d.cand}<br/>total MCDA score = ${g.toFixed(3)}`;
        return `${d.cand}<br/>${d.col}<br/>raw = ${fmt(d.raw)} · goodness = ${g.toFixed(2)}`;
      },
    },
    xAxis: {
      type: "category", data: xCats, position: "top",
      axisLabel: { color: tokens.label, fontSize: 9, rotate: 38, interval: 0 },
      axisLine: { lineStyle: { color: tokens.axisLine } }, axisTick: { show: false }, splitArea: { show: true },
    },
    yAxis: {
      type: "category", data: yCats, inverse: true,
      axisLabel: { color: tokens.label, fontSize: 9, interval: 0 },
      axisLine: { lineStyle: { color: tokens.axisLine } }, axisTick: { show: false }, splitArea: { show: true },
    },
    visualMap: {
      type: "continuous", min: gMin, max: gMax, calculable: true, orient: "vertical", right: 8, top: "center",
      inRange: { color: tokens.sequential }, textStyle: { color: tokens.label, fontSize: 10 },
      text: ["better", "worse"], precision: 2, itemWidth: 12, itemHeight: 150,
    },
    series: [{
      type: "heatmap", data: cells,
      itemStyle: { borderColor: tokens.tooltipBg, borderWidth: 0.5 },
      emphasis: { itemStyle: { borderColor: tokens.tooltipText, borderWidth: 1 } },
    }],
  };

  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: chartH, width: "100%" }} notMerge />

      <div className="mt-2 rounded-md border border-line bg-bg-1/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="mono text-[11px] uppercase tracking-cap text-ink-2">
            Descriptive statistics · per criterion
          </h3>
          <span className="mono text-[11px] text-ink-3">
            {criteria.length} criteria · {n} candidates · most discriminating: <span className="text-ink-1">{colOrder[0].short}</span>
          </span>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line/60">
              {["Criterion", "Family", "mean ± SD", "range", "discrimination", "skew"].map((h, i) => (
                <th key={h} className={`mono text-[10px] uppercase tracking-cap text-ink-3 py-1.5 pr-3 ${i >= 2 && i !== 4 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {colOrder.map((s) => (
              <tr key={s.ci} className="border-b border-line/30">
                <td className="py-1.5 pr-3 text-[13px] text-ink-1">{s.short}</td>
                <td className="py-1.5 pr-3 mono text-[11px] text-ink-3">{s.family}</td>
                <td className="py-1.5 pr-3 text-right mono text-[12px] text-ink-2">{fmt(s.rawMean)} ± {fmt(s.rawSd)}</td>
                <td className="py-1.5 pr-3 text-right mono text-[12px] text-ink-3">[{fmt(s.rawMin)}, {fmt(s.rawMax)}]</td>
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-1.5 rounded-full" style={{ width: `${Math.max(4, (s.discrimination / maxDisc) * 64)}px`, background: tokens.sequential[Math.min(tokens.sequential.length - 1, Math.round((s.discrimination / maxDisc) * (tokens.sequential.length - 1)))] }} />
                    <span className="mono text-[12px] text-ink-2">{s.discrimination.toFixed(2)}</span>
                  </span>
                </td>
                <td className="py-1.5 pr-3 text-right mono text-[12px] text-ink-3">{s.skew >= 0 ? "+" : ""}{s.skew.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mono text-[10px] text-ink-3 mt-3 leading-relaxed">
          Each row is one candidate (sorted by total MCDA score, best on top); each column a criterion (ordered by
          discrimination, most-separating left). Cell color = orientation-corrected goodness [0→1] — brighter = better,
          native polarity removed (so low BDI/MMPI reads as high goodness). The leading <span className="text-ink-2">Σ total</span> column
          is the mean goodness across criteria. <span className="text-ink-2">Discrimination</span> = SD of goodness (how
          strongly a criterion separates the cohort); mean ± SD and range are native units; skew is adjusted Fisher-Pearson.
        </p>
      </div>

      <FigureCaption block={analysisCaptions.profiles({ n, isDemo, k: criteria.length, top: colOrder[0].short, best: rowOrder[0].alias })} />
    </>
  );
}
