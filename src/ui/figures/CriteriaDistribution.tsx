// src/ui/figures/CriteriaDistribution.tsx
// A1 replacement. Parallel coordinates over N=40 candidates was an unreadable
// hairball. This shows the cohort's MARGINAL distribution per criterion on a
// shared orientation-corrected "goodness" axis [0→1]: a box (IQR + median) with
// every candidate as a deterministically-jittered strip dot colored by total
// MCDA score. Criteria are ordered by discrimination (spread), so the most
// candidate-separating criteria sit on top. A descriptive-stats table reports
// the numbers in native units.
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { normalizeScore } from "@/engine/normalize";
import { mean, sampleStdDev, fiveNumberSummary, skewness } from "@/analysis/descriptive";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

const shortLabel = (s: string) => (s.length > 22 ? s.slice(0, 21) + "…" : s);

// Van der Corput (base 2) low-discrepancy sequence → deterministic, evenly
// spread jitter in [0, 1). Keeps the figure reproducible (no Math.random).
function vdc(n: number): number {
  let v = 0, d = 0.5;
  let k = n + 1; // offset so candidate 0 isn't pinned to 0
  while (k > 0) { v += (k & 1) * d; k >>= 1; d /= 2; }
  return v;
}

// Compact native-scale formatter: magnitude-aware decimals.
function fmt(x: number): string {
  const a = Math.abs(x);
  if (a >= 100) return x.toFixed(0);
  if (a >= 10) return x.toFixed(1);
  return x.toFixed(2);
}

export function CriteriaDistribution({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 2 || criteria.length < 2) {
    return <div className="grid h-[360px] place-items-center text-sm text-ink-2 mono">need ≥2 candidates and ≥2 criteria</div>;
  }
  const n = cohort.length;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

  // Per-criterion vectors: orientation-corrected goodness [0,1] and raw native.
  const norm = criteria.map((c) => cohort.map((cand) => normalizeScore(clamp(cand.scores[c.id] ?? c.scale.min, c.scale.min, c.scale.max), c.scale, c.higherIsBetter)));
  const raw = criteria.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  // Per-candidate total MCDA score = mean goodness across criteria (drives dot color).
  const totals = cohort.map((_, k) => mean(criteria.map((_, ci) => norm[ci][k])));

  // Per-criterion descriptive stats, then order by discrimination (goodness SD).
  const stats = criteria.map((c, ci) => {
    const g = norm[ci], r = raw[ci];
    return {
      ci, label: c.label, short: shortLabel(c.label), family: c.family,
      five: fiveNumberSummary(g),
      discrimination: sampleStdDev(g),
      skew: skewness(g),
      rawMean: mean(r), rawSd: sampleStdDev(r),
      rawMin: Math.min(...r), rawMax: Math.max(...r),
    };
  });
  const ordered = [...stats].sort((a, b) => b.discrimination - a.discrimination);
  const maxDisc = Math.max(...ordered.map((s) => s.discrimination), 1e-9);
  const yLabels = ordered.map((s) => s.short); // top = most discriminating

  // Box geometry per row (value = [q1, q3, median, min, max, rowIndex]).
  const boxData = ordered.map((s, row) => [s.five.q1, s.five.q3, s.five.median, s.five.min, s.five.max, row]);
  const boxStroke = tokens.label, medianColor = tokens.tooltipText;

  // Strip dots: one per candidate × criterion. y = rowIndex + per-candidate jitter
  // (constant offset across rows so a candidate reads as a consistent band).
  const jitter = cohort.map((_, k) => (vdc(k) - 0.5) * 0.62);
  const dots: { value: [number, number, number]; cand: string; crit: string; raw: number }[] = [];
  ordered.forEach((s, row) => {
    for (let k = 0; k < n; k++) {
      dots.push({ value: [norm[s.ci][k], row + jitter[k], totals[k]], cand: cohort[k].alias, crit: s.short, raw: raw[s.ci][k] });
    }
  });

  const tMin = Math.min(...totals), tMax = Math.max(...totals);
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 168, right: 76, top: 14, bottom: 52 },
    tooltip: {
      trigger: "item",
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { seriesType: string; data: { cand?: string; crit?: string; raw?: number; value: number[] } }) => {
        if (p.seriesType !== "scatter" || !p.data.cand) return "";
        return `${p.data.cand}<br/>${p.data.crit}<br/>raw = ${fmt(p.data.raw ?? 0)} · goodness = ${(p.data.value[0]).toFixed(2)} · total = ${(p.data.value[2]).toFixed(2)}`;
      },
    },
    xAxis: {
      type: "value", min: 0, max: 1, name: "criterion score  (0 = worst → 1 = best, orientation-corrected)",
      nameLocation: "middle", nameGap: 30, nameTextStyle: { color: tokens.label, fontSize: 11 },
      axisLabel: { color: tokens.label, fontSize: 10 }, axisLine: { lineStyle: { color: tokens.axisLine } },
      splitLine: { lineStyle: { color: tokens.splitLine, opacity: 0.5 } },
    },
    yAxis: [
      { type: "category", data: yLabels, inverse: true, axisLabel: { color: tokens.label, fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } } },
      { type: "value", min: -0.5, max: criteria.length - 0.5, inverse: true, show: false },
    ],
    visualMap: {
      type: "continuous", min: tMin, max: tMax, dimension: 2, seriesIndex: 1,
      calculable: true, orient: "vertical", right: 6, top: "center",
      inRange: { color: tokens.sequential }, textStyle: { color: tokens.label, fontSize: 10 },
      text: ["high\ntotal", "low"], precision: 2, itemWidth: 12, itemHeight: 150,
    },
    series: [
      {
        type: "custom", yAxisIndex: 1, silent: true, z: 5,
        renderItem: (_params: unknown, api: { value: (i: number) => number; coord: (p: number[]) => number[]; size: (p: number[]) => number[] }) => {
          const row = api.value(5);
          const yPix = api.coord([0, row])[1];
          const unit = api.size([1, 1])[1];
          const half = Math.min(15, Math.abs(unit) * 0.30);
          const xq1 = api.coord([api.value(0), row])[0];
          const xq3 = api.coord([api.value(1), row])[0];
          const xmd = api.coord([api.value(2), row])[0];
          const xlo = api.coord([api.value(3), row])[0];
          const xhi = api.coord([api.value(4), row])[0];
          const ln = (x1: number, y1: number, x2: number, y2: number, w = 1) => ({ type: "line", shape: { x1, y1, x2, y2 }, style: { stroke: boxStroke, lineWidth: w } });
          return {
            type: "group",
            children: [
              ln(xlo, yPix, xhi, yPix),                       // whisker
              ln(xlo, yPix - half * 0.5, xlo, yPix + half * 0.5), // lo cap
              ln(xhi, yPix - half * 0.5, xhi, yPix + half * 0.5), // hi cap
              { type: "rect", shape: { x: Math.min(xq1, xq3), y: yPix - half, width: Math.abs(xq3 - xq1), height: half * 2 }, style: { fill: "transparent", stroke: boxStroke, lineWidth: 1 } },
              { type: "line", shape: { x1: xmd, y1: yPix - half, x2: xmd, y2: yPix + half }, style: { stroke: medianColor, lineWidth: 2 } },
            ],
          };
        },
        data: boxData,
      },
      {
        type: "scatter", yAxisIndex: 1, symbolSize: 6, z: 3,
        itemStyle: { opacity: 0.78, borderColor: tokens.markerStroke, borderWidth: 0.4 },
        data: dots,
        markLine: { silent: true, symbol: "none", lineStyle: { type: "dashed", color: tokens.axisLine, width: 1 }, label: { formatter: "0.50", color: tokens.label, fontSize: 9, position: "end" }, data: [{ xAxis: 0.5 }] },
      },
    ],
  };

  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 520, width: "100%" }} notMerge />

      <div className="mt-2 rounded-md border border-line bg-bg-1/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="mono text-[11px] uppercase tracking-cap text-ink-2">
            Descriptive statistics · per criterion
          </h3>
          <span className="mono text-[11px] text-ink-3">
            {criteria.length} criteria · most discriminating: <span className="text-ink-1">{ordered[0].short}</span> · n={n}
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
            {ordered.map((s) => (
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
          Box = IQR + median on the orientation-corrected goodness axis; whiskers span the cohort min–max; dots are
          individual candidates (deterministic jitter) colored by total MCDA score. <span className="text-ink-2">Discrimination</span> = SD
          of goodness scores — how strongly a criterion separates this cohort (high = decisive, low = everyone alike).
          mean ± SD and range are in native instrument units; skew on goodness (+ = tail toward high scores).
        </p>
      </div>

      <FigureCaption block={analysisCaptions.distribution({ n, isDemo, k: criteria.length, top: ordered[0].short })} />
    </>
  );
}
