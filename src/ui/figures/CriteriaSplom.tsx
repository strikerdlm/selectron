// src/ui/figures/CriteriaSplom.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import type { Candidate, Criterion } from "@/types";

// Legibility cap: one representative criterion per family.
export const SPLOM_IDS = [
  "psych.conscientiousness", "physical.vo2max", "cognitive.nasa_cognition_battery",
  "behavioral.teamwork", "psych.resilience_cdrisc",
];

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function CriteriaSplom({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  const cols = criteria.filter((c) => SPLOM_IDS.includes(c.id));
  const K = cols.length;
  if (cohort.length < 3 || K < 2) {
    return <div className="grid h-[480px] place-items-center text-sm text-ink-2 mono">need ≥3 candidates for a scatterplot matrix</div>;
  }
  const vectors = cols.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const grid: object[] = [], xAxis: object[] = [], yAxis: object[] = [], series: object[] = [], title: object[] = [];
  const span = 92 / K; // % per cell
  for (let r = 0; r < K; r++) {
    for (let c = 0; c < K; c++) {
      const idx = r * K + c;
      const left = 4 + c * span, top = 2 + r * span;
      grid.push({ left: `${left}%`, top: `${top}%`, width: `${span * 0.78}%`, height: `${span * 0.74}%` });
      xAxis.push({ gridIndex: idx, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
      yAxis.push({ gridIndex: idx, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
      if (r === c) {
        title.push({ left: `${left + span * 0.39}%`, top: `${top + span * 0.3}%`, textAlign: "center", text: cols[r].label.split(/[ (]/)[0], textStyle: { color: tokens.label, fontSize: 11, fontWeight: "normal" } });
      } else {
        series.push({
          type: "scatter", xAxisIndex: idx, yAxisIndex: idx, symbolSize: 4,
          data: cohort.map((_, k) => [vectors[c][k], vectors[r][k]]),
          itemStyle: { color: "#0072B2", opacity: 0.5 },
        });
      }
    }
  }
  const option = { animation: false, aria: { enabled: true }, grid, xAxis, yAxis, series, title };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 500, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.splom({ n: cohort.length, isDemo, ids: cols.map((c) => c.label.split(/[ (]/)[0]) })} />
    </>
  );
}
