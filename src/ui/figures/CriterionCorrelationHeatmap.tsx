// src/ui/figures/CriterionCorrelationHeatmap.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { correlationMatrix } from "@/analysis/correlation";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function CriterionCorrelationHeatmap({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 3 || criteria.length < 2) {
    return <div className="grid h-[460px] place-items-center text-sm text-ink-2 mono">need ≥3 candidates for a correlation heatmap</div>;
  }
  const cols = criteria.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const m = correlationMatrix(cols, "pearson");
  const labels = criteria.map((c) => (c.label.length > 14 ? c.label.slice(0, 13) + "…" : c.label));
  const data: [number, number, number][] = [];
  for (let i = 0; i < m.length; i++) for (let j = 0; j < m.length; j++) data.push([j, i, Number(m[i][j].toFixed(2))]);
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 130, right: 24, top: 16, bottom: 110 },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { value: [number, number, number] }) => `${labels[p.value[1]]} × ${labels[p.value[0]]}<br/>r = ${p.value[2]}`,
    },
    xAxis: { type: "category", data: labels, axisLabel: { color: tokens.label, fontSize: 9, rotate: 55 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    yAxis: { type: "category", data: labels, axisLabel: { color: tokens.label, fontSize: 9 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    visualMap: { min: -1, max: 1, calculable: true, orient: "horizontal", left: "center", bottom: 4, inRange: { color: tokens.diverging }, textStyle: { color: tokens.label, fontSize: 10 } },
    series: [{
      type: "heatmap", data,
      label: { show: true, fontSize: 8, color: tokens.label, formatter: (p: { value: [number, number, number] }) => p.value[2] },
      emphasis: { itemStyle: { borderColor: tokens.tooltipText, borderWidth: 1 } },
    }],
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 480, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.correlation({ n: cohort.length, isDemo, k: criteria.length })} />
    </>
  );
}
