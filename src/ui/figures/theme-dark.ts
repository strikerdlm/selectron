// src/ui/figures/theme-dark.ts
// Dark-mode ECharts theme for the Analysis figures (light text on dark panels).
// The existing `selectron-nature` theme (theme.ts) is the light variant and is untouched.
import { echarts } from "./echarts-base";

const OKABE_ITO = ["#0072B2","#E69F00","#009E73","#CC79A7","#56B4E9","#D55E00","#F0E442","#FFFFFF"];
const MONO = "'JetBrains Mono','Fira Mono',monospace";
const SANS = "'Inter',system-ui,-apple-system,sans-serif";

echarts.registerTheme("selectron-dark", {
  color: OKABE_ITO,
  backgroundColor: "transparent",
  animation: false,
  textStyle: { fontFamily: SANS, fontSize: 14, color: "#d8dde4" },
  title: {
    textStyle: { fontFamily: SANS, fontSize: 15, fontWeight: "bold", color: "#f0f4fa" },
    subtextStyle: { fontFamily: SANS, fontSize: 13, color: "#9aa3ad" },
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: "#3a4048", width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: "#9aa3ad", fontFamily: SANS, fontSize: 13 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: true, lineStyle: { color: "#3a4048", width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: "#9aa3ad", fontFamily: MONO, fontSize: 13 },
    splitLine: { show: true, lineStyle: { color: "#262b31", type: "dashed", width: 1 } },
  },
  tooltip: {
    backgroundColor: "#08090a", borderColor: "#3a4048", borderWidth: 1, padding: [8, 12],
    textStyle: { color: "#f0f4fa", fontFamily: MONO, fontSize: 13 },
  },
  legend: { orient: "horizontal", bottom: 0, textStyle: { color: "#9aa3ad", fontFamily: MONO, fontSize: 13 } },
});

export const DARK_THEME_NAME = "selectron-dark";
