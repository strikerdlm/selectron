// Centralised ECharts core registration. All figures import from here.
import * as echarts from "echarts/core";
import { BarChart, LineChart, ScatterChart, RadarChart, CustomChart, HeatmapChart, ParallelChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  ParallelComponent,
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  LineChart,
  ScatterChart,
  RadarChart,
  CustomChart,
  HeatmapChart,
  ParallelChart,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  ParallelComponent,
  CanvasRenderer,
  SVGRenderer,
]);

export { echarts };
