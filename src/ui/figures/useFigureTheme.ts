// src/ui/figures/useFigureTheme.ts
import { useFigureThemeMode } from "@/ui/theme/ThemeContext";
import { NATURE_THEME_NAME } from "./theme";
import { DARK_THEME_NAME } from "./theme-dark";

export type ChartTokens = {
  label: string; axisLine: string; splitLine: string;
  tooltipBg: string; tooltipText: string; markerStroke: string;
  diverging: string[]; sequential: string[];
};

export const LIGHT_TOKENS: ChartTokens = {
  label: "#475569", axisLine: "#cbd5e1", splitLine: "#e5e7eb",
  tooltipBg: "#0c0d0f", tooltipText: "#ffffff", markerStroke: "#ffffff",
  diverging: ["#0072B2", "#74add1", "#f7f7f7", "#f4a582", "#D55E00"],
  sequential: ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"],
};

export const DARK_TOKENS: ChartTokens = {
  label: "#9aa3ad", axisLine: "#3a4048", splitLine: "#262b31",
  tooltipBg: "#08090a", tooltipText: "#f0f4fa", markerStroke: "#0c0d0f",
  diverging: ["#56B4E9", "#3a7ca5", "#4a4f57", "#c87f3a", "#E69F00"],
  sequential: ["#10243e", "#1b466e", "#2171b5", "#549fd6", "#9ecae1"],
};

export function useFigureTheme(): { themeName: string; tokens: ChartTokens } {
  const theme = useFigureThemeMode();
  return theme === "light"
    ? { themeName: NATURE_THEME_NAME, tokens: LIGHT_TOKENS }
    : { themeName: DARK_THEME_NAME, tokens: DARK_TOKENS };
}
