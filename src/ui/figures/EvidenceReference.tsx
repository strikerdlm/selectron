// F5 EvidenceReference — per-criterion inline mini-figure.
//
// Renders a 180×60 px area chart showing a placeholder Gaussian reference
// distribution over the criterion's scale, with an amber vertical marker at
// the entered candidate value.
//
// Reference distribution (v1 placeholder):
//   μ = (scale.min + scale.max) / 2
//   σ = (scale.max - scale.min) / 6
// Comment: this is a midpoint-centred Gaussian placeholder. Phase 3F-v2 will
// swap to an empirical distribution once N ≥ 10 candidates are available.
//
// Empty state (enteredValue === undefined): reference curve only, no marker.
//
// Produced from /echarts skill template patterns + existing figure structure.

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import type { Criterion } from "@/types";
import { FigureCaption } from "./FigureCaption";
import { f5Caption } from "./captions/F5.captions";

// Reference-distribution area: subtle pale grey.
const REF_AREA_COLOR = "rgba(100, 116, 139, 0.25)";
const REF_LINE_COLOR = "rgba(100, 116, 139, 0.55)";

// Entered-value marker: signal-amber (Tailwind signal.DEFAULT #f5b541).
const MARKER_COLOR = "#f5b541";

// 60 sample points over [scale.min, scale.max] for a smooth Gaussian PDF curve.
// Placeholder distribution only — swap to empirical PDF in Phase 3F-v2.
const NUM_POINTS = 60;

function buildGaussianPoints(
  min: number,
  max: number,
): [number, number][] {
  const mu = (min + max) / 2;
  const sigma = (max - min) / 6;
  return Array.from({ length: NUM_POINTS }, (_, i) => {
    const x = min + (i / (NUM_POINTS - 1)) * (max - min);
    const y =
      Math.exp(-0.5 * ((x - mu) / sigma) ** 2) /
      (sigma * Math.sqrt(2 * Math.PI));
    return [x, y];
  });
}

export type EvidenceReferenceProps = {
  criterion: Criterion;
  /** Candidate's entered raw value. Omit (or pass undefined) to show curve only. */
  enteredValue?: number;
};

export function EvidenceReference({ criterion, enteredValue }: EvidenceReferenceProps) {
  const { themeName } = useFigureTheme();
  const { min, max } = criterion.scale;
  const points = buildGaussianPoints(min, max);

  // markLine data: only emitted when enteredValue is defined.
  const markLineData = enteredValue !== undefined
    ? [{ xAxis: enteredValue }]
    : [];

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true },

    // Minimal grid — tight margins for 180×60 px footprint.
    grid: {
      left: 2,
      right: 2,
      top: 2,
      bottom: 2,
      containLabel: false,
    },

    // No tooltip for this mini-figure (brief: "no tooltip").
    tooltip: { show: false },

    xAxis: {
      type: "value",
      min,
      max,
      show: false,
    },

    yAxis: {
      type: "value",
      show: false,
    },

    series: [
      {
        name: "reference distribution",
        type: "line",
        data: points,
        smooth: true,
        symbol: "none",
        lineStyle: {
          color: REF_LINE_COLOR,
          width: 1,
        },
        areaStyle: {
          color: REF_AREA_COLOR,
        },
        // Vertical marker at enteredValue (amber); hidden when no value entered.
        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: {
            color: MARKER_COLOR,
            width: 1.5,
            type: "solid" as const,
          },
          label: { show: false },
          data: markLineData,
        },
      },
    ],
  };

  return (
    <>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={themeName}
        style={{ height: 60, width: 180 }}
        notMerge
      />
      <FigureCaption block={f5Caption(criterion, enteredValue)} />
    </>
  );
}
