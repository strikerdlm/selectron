import { useEffect, useRef } from "react";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import type { SensitivityIndex } from "@/api/calibration";

interface SensitivityTornadoProps {
  indices: SensitivityIndex[];
  method: "sobol" | "morris";
  topN: number;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function SensitivityTornado({ indices, method, topN }: SensitivityTornadoProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, NATURE_THEME_NAME);
    instanceRef.current = chart;

    const sorted = [...indices]
      .sort((a, b) => {
        const va = method === "sobol" ? Math.abs(a.s1 ?? 0) : Math.abs(a.mu_star ?? 0);
        const vb = method === "sobol" ? Math.abs(b.s1 ?? 0) : Math.abs(b.mu_star ?? 0);
        return va - vb;
      })
      .slice(-topN);

    const labels = sorted.map((d) => truncate(d.condition_label, 25));
    const fullLabels = sorted.map((d) => d.condition_label);

    const series: any[] =
      method === "sobol"
        ? [
            {
              name: "S1 (first-order)",
              type: "bar",
              data: sorted.map((d) => d.s1 ?? 0),
              itemStyle: { color: "#0072B2" },
              barGap: "-100%",
              barWidth: "60%",
            },
            {
              name: "ST (total-order)",
              type: "bar",
              data: sorted.map((d) => d.st ?? 0),
              itemStyle: { color: "rgba(230, 159, 0, 0.5)" },
              barWidth: "60%",
            },
          ]
        : [
            {
              name: "μ* (Morris)",
              type: "bar",
              data: sorted.map((d) => d.mu_star ?? 0),
              itemStyle: { color: "#0072B2" },
              barWidth: "60%",
            },
          ];

    chart.setOption({
      grid: { left: 180, right: 40, top: 20, bottom: 40, containLabel: false },
      xAxis: {
        type: "value",
        name: method === "sobol" ? "Sensitivity Index" : "μ* (mean absolute effect)",
        nameLocation: "center",
        nameGap: 28,
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 10 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          if (idx == null) return "";
          const label = fullLabels[idx];
          const d = sorted[idx];
          if (method === "sobol") {
            return `<b>${label}</b><br/>S1: ${(d.s1 ?? 0).toFixed(4)} ± ${(d.s1_conf ?? 0).toFixed(4)}<br/>ST: ${(d.st ?? 0).toFixed(4)} ± ${(d.st_conf ?? 0).toFixed(4)}`;
          }
          return `<b>${label}</b><br/>μ*: ${(d.mu_star ?? 0).toFixed(4)}<br/>σ: ${(d.sigma ?? 0).toFixed(4)}`;
        },
      },
      legend: method === "sobol" ? { show: true } : { show: false },
      series,
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [indices, method, topN]);

  const height = Math.max(300, topN * 40);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
