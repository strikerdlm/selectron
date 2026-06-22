// I5 IMMValidationCompare — dumbbell chart: run vs K15 reference with CI₉₅ badge.
//
// 4 rows (one per metric: TME, CHI, pEVAC, pLOCL).
// Each row: gray dot (K15 reference) + Okabe-Ito blue dot (run mean).
// Connecting bar tinted by delta direction; dot colored blue if within CI₉₅ of
// reference, amber if outside.
//
// Default reference: K15_TABLE1_REF.issHMS from src/imm/calibration.ts.
// NOTE: calibration.ts imports node:fs — import only the constant, not the module.
// To avoid importing the fs-dependent module in browser bundles, K15 reference
// values are inlined here (sourced from K15_TABLE1_REF.issHMS).

import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import type { IMMOutcome, PosteriorSummary } from "../../imm/types";

// K15 Table 1 issHMS reference — inlined to avoid importing the fs-using calibration module.
// Source: src/imm/calibration.ts K15_TABLE1_REF.issHMS (ISS 6-month / 6-crew / 100 000 trials)
const K15_ISSHMS_DEFAULT = {
  label: "K15 ISS 6mo / 6 crew / issHMS",
  tme:   { mean: 106    },
  chi:   { mean: 94.93  },
  pEvac: { mean: 5.57   },
  pLocl: { mean: 0.44   },
} as const;

export type K15Reference = {
  label: string;
  tme:   { mean: number };
  chi:   { mean: number };
  pEvac: { mean: number };
  pLocl: { mean: number };
};

export type IMMValidationCompareProps = {
  outcome: IMMOutcome;
  reference?: K15Reference;
};

type MetricRow = {
  label: string;
  unit: string;
  summary: PosteriorSummary;
  refMean: number;
};

function withinCI95(summary: PosteriorSummary, refMean: number): boolean {
  return refMean >= summary.ci95[0] && refMean <= summary.ci95[1];
}

export function IMMValidationCompare({
  outcome,
  reference = K15_ISSHMS_DEFAULT,
}: IMMValidationCompareProps) {
  const { themeName } = useFigureTheme();
  const rows: MetricRow[] = [
    { label: "TME",   unit: "events", summary: outcome.tme,   refMean: reference.tme.mean   },
    { label: "CHI",   unit: "%",      summary: outcome.chi,   refMean: reference.chi.mean   },
    { label: "pEVAC", unit: "%",      summary: outcome.pEvac, refMean: reference.pEvac.mean },
    { label: "pLOCL", unit: "%",      summary: outcome.pLocl, refMean: reference.pLocl.mean },
  ];

  // Build dumbbell using ECharts custom series is complex;
  // use scatter + connecting lines via two scatter series.
  // X axis = metric index, Y axis = value.
  // We instead use a horizontal bar approach: one scatter series per point type,
  // plus a gap bar rendered as a line segment using markLine on each series.

  // Simpler: use a bar chart with custom renderer or just a scatter chart.
  // For clarity and accessibility, render each row as its own small SVG-like row
  // using a stacked approach:
  //
  // We'll use ECharts custom series in a category y-axis for a clean horizontal dumbbell.

  const yLabels = rows.map((r) => r.label);

  // Build data for reference dots (gray) and run dots (colored by CI₉₅ status)
  const refData = rows.map((r, i) => ({ value: [r.refMean, i] }));
  const runData = rows.map((r, i) => {
    const within = withinCI95(r.summary, r.refMean);
    return {
      value: [r.summary.mean, i],
      itemStyle: { color: within ? "#0072B2" : "#E69F00" },
    };
  });

  // Connecting lines: use line series per metric
  const connectorSeries = rows.map((r, i) => ({
    name: `connector-${i}`,
    type: "line" as const,
    data: [
      [r.refMean, i],
      [r.summary.mean, i],
    ],
    showSymbol: false,
    lineStyle: {
      color: r.summary.mean >= r.refMean ? "#009E73" : "#D55E00",
      width: 2,
      type: "solid" as const,
    },
    tooltip: { show: false },
    legendHoverLink: false,
    silent: true,
  }));

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 70,
      right: 24,
      top: 16,
      bottom: 52,
      containLabel: true,
    },

    legend: {
      bottom: 0,
      data: ["K15 Reference", "Run (within CI₉₅)", "Run (outside CI₉₅)"],
    },

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" as const },
      formatter: (
        params: Array<{ seriesName: string; value: [number, number]; color: string }>,
      ) => {
        const pt = params.find((p) => p.seriesName === "K15 Reference" || p.seriesName === "Run");
        if (!pt) return "";
        const idx = pt.value[1];
        const row = rows[idx];
        if (!row) return "";
        const within = withinCI95(row.summary, row.refMean);
        return [
          `<b>${row.label}</b>`,
          `<span style="color:#b0b6bd">K15 ref</span> ${row.refMean.toFixed(2)} ${row.unit}`,
          `<span style="color:#b0b6bd">run μ</span> ${row.summary.mean.toFixed(2)} ${row.unit}`,
          `<span style="color:#b0b6bd">CI₉₅</span> [${row.summary.ci95[0].toFixed(2)}, ${row.summary.ci95[1].toFixed(2)}]`,
          within
            ? '<span style="color:#009E73">✓ within CI₉₅</span>'
            : '<span style="color:#E69F00">⚠ outside CI₉₅</span>',
        ].join("<br/>");
      },
    },

    xAxis: {
      type: "value" as const,
      name: "Metric value",
      nameLocation: "middle" as const,
      nameGap: 28,
      axisLabel: { fontSize: 10 },
    },

    yAxis: {
      type: "category" as const,
      data: yLabels,
      axisLabel: { fontSize: 11, fontFamily: "monospace" },
      inverse: false,
    },

    series: [
      ...connectorSeries,
      {
        name: "K15 Reference",
        type: "scatter" as const,
        data: refData,
        symbolSize: 12,
        itemStyle: { color: "#999999", borderColor: "#666666", borderWidth: 1 },
        z: 3,
      },
      {
        name: "Run",
        type: "scatter" as const,
        data: runData,
        symbolSize: 14,
        z: 4,
      },
    ],
  };

  // Build CI₉₅ badge summary
  const badges = rows.map((r) => {
    const within = withinCI95(r.summary, r.refMean);
    return `${r.label}: ${within ? "✓ within CI₉₅" : "⚠ outside CI₉₅"}`;
  });

  const captionBlock = {
    figureId: "I5",
    oneLine:
      `Run vs ${reference.label} — ` +
      `TME=${outcome.tme.mean.toFixed(1)} (ref ${reference.tme.mean.toFixed(1)}), ` +
      `CHI=${outcome.chi.mean.toFixed(1)}% (ref ${reference.chi.mean.toFixed(1)}%), ` +
      `pEVAC=${outcome.pEvac.mean.toFixed(1)}% (ref ${reference.pEvac.mean.toFixed(1)}%), ` +
      `pLOCL=${outcome.pLocl.mean.toFixed(2)}% (ref ${reference.pLocl.mean.toFixed(2)}%). ` +
      `Blue = within CI₉₅; amber = outside. ${badges.join(" | ")}.`,
    methods:
      "Dumbbell chart: gray dot = K15 Table 1 issHMS reference value; colored dot = " +
      "run Monte Carlo mean. Connecting bar tinted green (run > reference) or vermillion " +
      "(run < reference). CI₉₅ badge: blue if K15 reference falls within the run's 95% " +
      "simulation interval, amber otherwise. Reference scenario: ISS 6-month / 6-crew / " +
      "issHMS medical kit (K15 Table 1, Keenan et al. 2015 ICES-2015-123).",
    source:
      "Keenan et al. (2015) [K15] ICES-2015-123 Table 1 — issHMS scenario " +
      "(TME=106, CHI=94.93%, pEVAC=5.57%, pLOCL=0.44%).",
    reproducibility:
      `reference=${reference.label}, ` +
      `run_tme_mean=${outcome.tme.mean.toFixed(2)}, ` +
      `run_chi_mean=${outcome.chi.mean.toFixed(2)}, ` +
      `run_pEvac_mean=${outcome.pEvac.mean.toFixed(2)}, ` +
      `run_pLocl_mean=${outcome.pLocl.mean.toFixed(2)}`,
  };

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        theme={themeName}
        style={{ height: 280, width: "100%" }}
        notMerge
      />
      <FigureCaption block={captionBlock} />
    </div>
  );
}
