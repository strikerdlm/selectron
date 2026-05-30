// src/ui/figures/RiskBubbleScatter.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { SYSTEM_GROUP_ORDER, type BubblePoint, type SystemGroup } from "@/analysis/imm-bubbles";

const GROUP_COLOR: Record<SystemGroup, string> = {
  "behavioral/psych": "#0072B2", "cardio/heme": "#D55E00", neuro: "#CC79A7",
  infectious: "#009E73", "musculoskeletal/trauma": "#E69F00", "GI/GU/renal": "#56B4E9", other: "#9aa3ad",
};

type Props = { points: BubblePoint[]; excluded: number; missionDays: number };

export function RiskBubbleScatter({ points, excluded, missionDays }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (points.length === 0) {
    return <div className="grid h-[420px] place-items-center text-sm text-ink-2 mono">no rate-based conditions to plot</div>;
  }
  const maxContrib = Math.max(...points.map((p) => p.contribution), 1e-12);
  const series = SYSTEM_GROUP_ORDER.map((g) => ({
    name: g, type: "scatter",
    data: points.filter((p) => p.group === g).map((p) => ({
      value: [p.rate, p.severity, p.contribution], name: p.label,
      symbolSize: 6 + 34 * Math.sqrt(p.contribution / maxContrib),
    })),
    itemStyle: { color: GROUP_COLOR[g], opacity: 0.72, borderColor: tokens.markerStroke, borderWidth: 0.5 },
  }));
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 56, right: 20, top: 16, bottom: 70, containLabel: true },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { data: { name: string; value: number[] } }) =>
        `<b>${p.data.name}</b><br/>rate ${p.data.value[0] >= 1 ? p.data.value[0].toFixed(1) : p.data.value[0].toPrecision(2)} / 1000·PY` +
        `<br/>severity ${(p.data.value[1] * 100).toFixed(1)}%` +
        `<br/>contribution ${p.data.value[2].toExponential(2)}`,
    },
    legend: { type: "scroll", bottom: 0, textStyle: { color: tokens.label, fontSize: 12 } },
    xAxis: {
      type: "log", name: "incidence (events / 1000 PY, log)", nameLocation: "middle", nameGap: 40,
      nameTextStyle: { color: tokens.label, fontSize: 12 },
      axisLabel: { color: tokens.label }, axisLine: { lineStyle: { color: tokens.axisLine } },
      splitLine: { lineStyle: { color: tokens.splitLine, type: "dashed" } },
    },
    yAxis: {
      type: "value", name: "worst-case severity prob.", nameLocation: "middle", nameGap: 44, min: 0, max: 1,
      nameTextStyle: { color: tokens.label, fontSize: 12 },
      axisLabel: { color: tokens.label, formatter: (v: number) => v.toFixed(1) },
      axisLine: { lineStyle: { color: tokens.axisLine } },
      splitLine: { lineStyle: { color: tokens.splitLine, type: "dashed" } },
    },
    series,
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 440, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.bubble({ n: points.length, excluded, missionDays })} />
    </>
  );
}
