// src/ui/figures/CriterionMiniFigure.tsx
// 200×80 px per-criterion bell-curve mini-figure for PerScoreCard.
//
// Shows a Gaussian PDF approximation over the criterion scale (µ = midpoint,
// σ = range/6 so ±3σ covers the scale) plus:
//   - An amber vertical markLine at the member's current rawScore.
//   - A dashed red vertical markLine at gateThreshold.value (if criterion has a gate).
//   - No axis labels or legend (only tooltip on hover).
//
// The Gaussian is sampled at N_POINTS uniformly spaced x values. This is a
// display approximation only — not a posterior estimate. The actual composite
// uses normalizeScore from the engine.
//
// Design constraints:
//   - 200 px wide × 80 px tall (constrained by PerScoreCard layout).
//   - animation:false, useUTC:true, aria:{enabled:true, decal:{show:true}}.
//   - Lazy: parent (PerScoreCard) only renders this when the card is expanded.
//   - Memoised: options rebuilt only when (criterionId, rawScore) changes.

import { useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import type { Criterion } from "../../types";

const N_POINTS = 80;

/** Gaussian PDF value (unnormalised, peak = 1). */
function gauss(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}

/** Generate N_POINTS (x, y) pairs for the bell curve. */
function buildBellCurveData(c: Criterion): { xValues: number[]; yValues: number[] } {
  const { min, max } = c.scale;
  const range = max - min;
  const mu = min + range / 2;
  const sigma = range / 6;
  const xValues: number[] = [];
  const yValues: number[] = [];
  for (let i = 0; i < N_POINTS; i++) {
    const x = min + (i / (N_POINTS - 1)) * range;
    xValues.push(x);
    yValues.push(gauss(x, mu, sigma));
  }
  return { xValues, yValues };
}

interface CriterionMiniFigureProps {
  criterion: Criterion;
  rawScore: number;
}

export function CriterionMiniFigure({ criterion, rawScore }: CriterionMiniFigureProps) {
  const { min, max } = criterion.scale;
  const clampedScore = Math.max(min, Math.min(max, rawScore));

  const option = useMemo(() => {
    const { xValues, yValues } = buildBellCurveData(criterion);

    // Build the markLine data array for the score marker
    const markLines: {
      name: string;
      xAxis: number;
      lineStyle: { color: string; width: number; type: string };
      label: { formatter: string };
    }[] = [
      {
        name: "score",
        xAxis: clampedScore,
        lineStyle: { color: "#E69F00", width: 2, type: "solid" },
        label: { formatter: "" },
      },
    ];

    // Gate threshold line (if present)
    if (criterion.gateThreshold) {
      markLines.push({
        name: "gate",
        xAxis: criterion.gateThreshold.value,
        lineStyle: { color: "#ff6b5e", width: 1.5, type: "dashed" },
        label: { formatter: "" },
      });
    }

    return {
      animation: false,
      useUTC: true,
      aria: { enabled: true, decal: { show: true } },
      grid: { top: 4, bottom: 4, left: 2, right: 2, containLabel: false },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "rgba(0,0,0,0.7)",
        borderColor: "transparent",
        textStyle: { color: "#f0f0e8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" },
        formatter: (params: { axisValue: number }[]) => {
          const x = params[0]?.axisValue;
          if (x === undefined) return "";
          return `${criterion.id.split(".")[1] ?? criterion.id}: ${Number(x).toFixed(1)}`;
        },
      },
      xAxis: {
        type: "value",
        min,
        max,
        show: false,
        axisPointer: { show: false },
      },
      yAxis: {
        type: "value",
        show: false,
        min: 0,
        max: 1.05,
      },
      series: [
        {
          type: "line",
          smooth: true,
          showSymbol: false,
          data: xValues.map((x, i) => [x, yValues[i]]),
          lineStyle: { color: "#0072B2", width: 1.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(0,114,178,0.25)" },
                { offset: 1, color: "rgba(0,114,178,0.02)" },
              ],
            },
          },
          markLine: {
            silent: false,
            symbol: ["none", "none"],
            data: markLines as unknown as [],
          },
        },
      ],
    };
  // Only rebuild when criterion identity or score changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criterion.id, criterion.scale.min, criterion.scale.max, criterion.gateThreshold?.value, clampedScore]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      theme={NATURE_THEME_NAME}
      style={{ height: 80, width: "100%" }}
      notMerge
    />
  );
}
