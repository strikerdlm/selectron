// selectron-nature ECharts theme.
//
// Design brief:
//   - Sans-serif (Inter; fallback system sans).
//   - Okabe-Ito categorical palette (colorblind-safe).
//   - Wong-7 sequential palette reordered for value continuity.
//   - Text #1a1a1a on transparent background (panel provides dark bg in app).
//   - 4.5:1 contrast minimum on neutral backgrounds.
//   - animation: false (deterministic export / Playwright snapshot).
//   - Axis: line #cbd5e1, label #475569, fontSize 11.
//   - Tooltip: dark bg #0c0d0f, white text, mono font for numbers.
//   - Legend: bottom, mono, 11px.
//
// Generated via /echarts skill (theme bootstrap) — option object written
// directly from the skill's Color_Palettes reference + Nature theme JSON
// base, adapted for the selectron-nature contract.

import { echarts } from "./echarts-base";

// Okabe-Ito 8-color (Diego brief ordering: blue-dominant for primary series)
const OKABE_ITO = [
  "#0072B2", // Blue
  "#E69F00", // Orange
  "#009E73", // Bluish green
  "#CC79A7", // Reddish purple
  "#56B4E9", // Sky blue
  "#D55E00", // Vermillion
  "#F0E442", // Yellow
  "#000000", // Black
];

// Wong-7 sequential (ordered for value continuity, lightest → darkest)
const WONG_SEQUENTIAL = [
  "#56B4E9",
  "#0072B2",
  "#009E73",
  "#E69F00",
  "#D55E00",
  "#CC79A7",
  "#000000",
];

const MONO_FONT = "'JetBrains Mono', 'Fira Mono', 'Cascadia Code', monospace";
const SANS_FONT = "'Inter', system-ui, -apple-system, sans-serif";

const AXIS_LINE_COLOR  = "#cbd5e1";
const AXIS_LABEL_COLOR = "#475569";
const AXIS_FONT_SIZE   = 11;

const themeOption = {
  color: OKABE_ITO,
  backgroundColor: "transparent",

  animation: false,

  textStyle: {
    fontFamily: SANS_FONT,
    fontSize: 12,
    color: "#1a1a1a",
  },

  title: {
    textStyle: {
      fontFamily: SANS_FONT,
      fontSize: 13,
      fontWeight: "bold",
      color: "#1a1a1a",
    },
    subtextStyle: {
      fontFamily: SANS_FONT,
      fontSize: 11,
      color: "#475569",
    },
  },

  // Series defaults
  line: {
    itemStyle: { borderWidth: 1.5 },
    lineStyle: { width: 1.8 },
    symbolSize: 6,
    symbol: "circle",
    smooth: false,
  },
  scatter: {
    itemStyle: { borderWidth: 0.5, borderColor: "#ffffff" },
    symbolSize: 6,
  },
  bar: {
    itemStyle: { borderWidth: 0, barBorderRadius: 0 },
  },

  // Category axis
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1 } },
    axisTick: { show: false },
    axisLabel: {
      show: true,
      color: AXIS_LABEL_COLOR,
      fontFamily: SANS_FONT,
      fontSize: AXIS_FONT_SIZE,
    },
    splitLine: { show: false },
  },

  // Value axis
  valueAxis: {
    axisLine: { show: true, lineStyle: { color: AXIS_LINE_COLOR, width: 1 } },
    axisTick: { show: false },
    axisLabel: {
      show: true,
      color: AXIS_LABEL_COLOR,
      fontFamily: MONO_FONT,
      fontSize: AXIS_FONT_SIZE,
    },
    splitLine: {
      show: true,
      lineStyle: { color: AXIS_LINE_COLOR, type: "dashed", width: 1 },
    },
  },

  // Tooltip: dark bg, white text, mono numbers
  tooltip: {
    backgroundColor: "#0c0d0f",
    borderColor: "#2a2e34",
    borderWidth: 1,
    padding: [8, 12],
    textStyle: {
      color: "#ffffff",
      fontFamily: MONO_FONT,
      fontSize: 11,
    },
  },

  // Legend: bottom, mono, 11px
  legend: {
    orient: "horizontal",
    bottom: 0,
    textStyle: {
      color: AXIS_LABEL_COLOR,
      fontFamily: MONO_FONT,
      fontSize: 11,
    },
  },

  // visualMap sequential palette
  visualMap: {
    color: WONG_SEQUENTIAL.slice().reverse(), // ECharts visualMap color goes high→low
  },
};

echarts.registerTheme("selectron-nature", themeOption);

export const NATURE_THEME_NAME = "selectron-nature";
