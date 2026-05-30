// src/ui/figures/ParallelCriteria.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { normalizeScore } from "@/engine/normalize";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function ParallelCriteria({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 2 || criteria.length < 2) {
    return <div className="grid h-[360px] place-items-center text-sm text-ink-2 mono">need ≥2 candidates and ≥2 criteria</div>;
  }
  const short = (s: string) => (s.length > 15 ? s.slice(0, 14) + "…" : s);
  const parallelAxis = criteria.map((c, i) => ({
    dim: i, name: short(c.label), min: c.scale.min, max: c.scale.max,
    nameTextStyle: { color: tokens.label, fontSize: 11 },
    axisLabel: { color: tokens.label, fontSize: 10 },
    axisLine: { lineStyle: { color: tokens.axisLine } },
    axisTick: { lineStyle: { color: tokens.axisLine } },
  }));
  const data = cohort.map((cand) => {
    const row = criteria.map((c) => cand.scores[c.id] ?? c.scale.min);
    const z = criteria.map((c) => {
      const raw = Math.min(c.scale.max, Math.max(c.scale.min, cand.scores[c.id] ?? c.scale.min));
      return normalizeScore(raw, c.scale, c.higherIsBetter);
    });
    const total = z.reduce((s, v) => s + v, 0) / z.length;
    return [...row, total];
  });
  const option = {
    animation: false,
    aria: { enabled: true },
    parallelAxis,
    parallel: { left: 32, right: 24, top: 28, bottom: 44 },
    visualMap: {
      type: "continuous", min: 0, max: 1, dimension: criteria.length,
      calculable: true, orient: "horizontal", left: "center", bottom: 4,
      inRange: { color: tokens.sequential },
      textStyle: { color: tokens.label, fontSize: 10 }, text: ["high score", "low"],
    },
    series: [{
      type: "parallel", smooth: false,
      lineStyle: { width: 1.4, opacity: 0.55 },
      emphasis: { lineStyle: { width: 2.4, opacity: 1 } },
      data,
    }],
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 400, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.parallel({ n: cohort.length, isDemo, k: criteria.length })} />
    </>
  );
}
