// I3 IMMConditionDrivers — horizontal lollipop chart of per-condition risk drivers.
//
// Renders the top-N conditions ranked by their contribution to either pEVAC or
// pLOCL (toggleable). Each row is a thin stem (line, 2px) plus a colored scatter
// dot (size 12px), styled by IMMConditionFamily using the Okabe-Ito categorical
// palette from ./theme.ts. Sort order is descending by the active metric, so the
// worst driver sits at the top.
//
// Contract:
//   - `perConditionDrivers` is mission-aggregate (not per-crew), with `pEvacContrib`
//     / `pLoclContrib` already expressed as percentage-point shares of the headline
//     pEVAC / pLOCL. Values are shown raw — no division by the headline.
//   - Conditions outside the top N are dropped from the chart and the caption.
//   - Friendly labels come from IMM_CONDITIONS; unknown IDs fall back to the raw id.
//
// Toggle: a small horizontal button group above the chart switches the active
// metric between pEvac (default) and pLocl, matching the kit-selector style at
// src/ui/views/CrewComposition.tsx lines 286–300.

import { useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import { FigureCaption } from "./FigureCaption";
import { IMM_CONDITIONS } from "../../imm/conditions";
import type { IMMOutcome, IMMConditionFamily } from "../../imm/types";

// Okabe-Ito 8-colour categorical palette (matches src/ui/figures/theme.ts).
// Deterministic assignment per IMMConditionFamily — we reuse the same hex
// values as the theme rather than inventing new colours.
const FAMILY_COLOR: Record<IMMConditionFamily, string> = {
  behavioral:        "#CC79A7", // reddish purple
  cardiovascular:    "#D55E00", // vermillion
  dental:            "#F0E442", // yellow
  dermatologic:      "#E69F00", // orange
  ENT:               "#56B4E9", // sky blue
  endocrine:         "#009E73", // bluish green
  GI:                "#0072B2", // blue
  GU:                "#CC79A7", // reddish purple (cycle)
  hematologic:       "#D55E00", // vermillion (cycle)
  infectious:        "#009E73", // bluish green (cycle)
  musculoskeletal:   "#E69F00", // orange (cycle)
  neurologic:        "#0072B2", // blue (cycle)
  ophthalmologic:    "#56B4E9", // sky blue (cycle)
  psychiatric:       "#CC79A7", // reddish purple (cycle)
  renal:             "#009E73", // bluish green (cycle)
  respiratory:       "#56B4E9", // sky blue (cycle)
  "space-adaptation": "#F0E442", // yellow (cycle)
  toxicologic:       "#000000", // black
  traumatic:         "#D55E00", // vermillion (cycle)
};

// Quick lookup: id → { label, family }
const CONDITION_LOOKUP: Record<string, { label: string; family: IMMConditionFamily }> = (() => {
  const out: Record<string, { label: string; family: IMMConditionFamily }> = {};
  for (const c of IMM_CONDITIONS) {
    out[c.id] = { label: c.label, family: c.family };
  }
  return out;
})();

type Metric = "pEvac" | "pLocl";

const METRIC_LABEL: Record<Metric, string> = {
  pEvac: "pEVAC",
  pLocl: "pLOCL",
};

export type IMMConditionDriversProps = {
  outcome: IMMOutcome;
  trials: number;
  seed?: number;
  mission?: { id: string; label: string };
  topN?: number;
};

export function IMMConditionDrivers({
  outcome,
  trials,
  seed = 0xc0ffee,
  mission,
  topN = 15,
}: IMMConditionDriversProps) {
  const [metric, setMetric] = useState<Metric>("pEvac");

  const drivers = outcome.perConditionDrivers ?? [];
  const contribKey = metric === "pEvac" ? "pEvacContrib" : "pLoclContrib";

  // Detect the empty / all-zero case before sorting.
  const totalAbs = drivers.reduce((s, d) => s + Math.abs(d[contribKey]), 0);
  const isEmpty = drivers.length === 0 || totalAbs === 0;

  // Build sorted, top-N entries with friendly labels and family colors.
  const entries = drivers
    .map((d) => {
      const info = CONDITION_LOOKUP[d.conditionId];
      const label = info?.label ?? d.conditionId;
      const family = info?.family;
      const color = family ? FAMILY_COLOR[family] : "#475569"; // fallback slate
      return {
        id: d.conditionId,
        label,
        family,
        color,
        value: d[contribKey],
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, topN);

  const yLabels = entries.map((e) => e.label);
  const totalCatalog = IMM_CONDITIONS.length;
  const shownCount = entries.length;
  const top3 = entries.slice(0, 3).map((e) => e.label).join(", ");

  // Lollipop construction:
  //   - stem: one short line per row from x=0 to x=value at y=index
  //   - dot:  one scatter point per row at (value, index), colored by family
  // We render each stem as its own line series for clean color-per-row tinting,
  // and a single scatter series carries the dot styling.
  const stemSeries = entries.map((e, i) => ({
    name: `stem-${i}`,
    type: "line" as const,
    data: [
      [0, i],
      [e.value, i],
    ],
    showSymbol: false,
    lineStyle: {
      color: e.color,
      width: 2,
      type: "solid" as const,
      opacity: 0.6,
    },
    tooltip: { show: false },
    legendHoverLink: false,
    silent: true,
    z: 2,
  }));

  const dotData = entries.map((e, i) => ({
    value: [e.value, i],
    itemStyle: { color: e.color, borderColor: "#ffffff", borderWidth: 1 },
  }));

  const option = {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 24,
      right: 24,
      top: 16,
      bottom: 36,
      containLabel: true,
    },

    tooltip: {
      trigger: "item" as const,
      backgroundColor: "#0c0d0f",
      borderColor: "#2a2e34",
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: "#f9fafb",
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: 11,
      },
      formatter: (
        p: { seriesName: string; value: [number, number] | number[] },
      ) => {
        const idx = Array.isArray(p.value) ? (p.value[1] as number) : 0;
        const e = entries[idx];
        if (!e) return "";
        const famText = e.family ?? "—";
        return [
          `<b>${e.label}</b>`,
          `<span style="color:#9ca3af">family</span> <span style="color:${e.color}">${famText}</span>`,
          `<span style="color:#9ca3af">${METRIC_LABEL[metric]} contrib</span> ${e.value.toFixed(3)}%`,
          `<span style="color:#9ca3af">id</span> ${e.id}`,
        ].join("<br/>");
      },
    },

    xAxis: {
      type: "value" as const,
      name: `${METRIC_LABEL[metric]} contribution (%)`,
      nameLocation: "middle" as const,
      nameGap: 26,
      axisLabel: { fontSize: 10 },
      min: 0,
    },

    yAxis: {
      type: "category" as const,
      data: yLabels,
      inverse: true, // top row = highest value
      axisLabel: {
        fontSize: 11,
        fontFamily: "monospace",
        // Trim very long labels to keep rows compact.
        formatter: (v: string) => (v.length > 32 ? `${v.slice(0, 30)}…` : v),
      },
    },

    series: [
      ...stemSeries,
      {
        name: METRIC_LABEL[metric],
        type: "scatter" as const,
        data: dotData,
        symbolSize: 12,
        z: 4,
      },
    ],
  };

  const seedHex = `0x${seed.toString(16).toUpperCase()}`;
  const missionPart = mission ? ` on ${mission.label}` : "";

  const captionBlock = {
    figureId: "I3",
    oneLine: isEmpty
      ? `No driver data — run a simulation to populate the top condition contributors to ${METRIC_LABEL[metric]}.`
      : `Top ${shownCount} of ${totalCatalog} conditions driving ${METRIC_LABEL[metric]}${missionPart} — leaders: ${top3 || "n/a"}.`,
    methods:
      "Horizontal lollipop chart: stem (thin line) + family-colored scatter dot per " +
      "condition, sorted descending by the active metric so the worst driver is at " +
      "the top. Contributions are mission-aggregate (not per-crew-member) and are " +
      "sampling-noise-perturbed shares of the headline pEVAC/pLOCL — they sum " +
      "approximately, not exactly, to the headline value because of Monte Carlo " +
      "noise and non-additive interaction paths. Conditions outside the top N are " +
      "not shown. The metric toggle re-sorts the chart and updates this caption. " +
      "Source: per-condition driver aggregation inside the IMM trial loop " +
      "(src/imm/simulate.ts → outcomes.perConditionDrivers).",
    source:
      "Antonsen et al. (2022) npj Microgravity 8(1) [A22, doi:10.1038/s41526-022-00193-9] " +
      "— per-condition driver aggregation. " +
      "Keenan et al. (2015) ICES-2015-123 [K15] — 100-condition IMM catalog " +
      "(src/imm/conditions.ts).",
    reproducibility:
      `seed=${seedHex}, trials=${trials.toLocaleString()}, topN=${topN}, ` +
      `metric=${metric}, commit=__COMMIT_SHA__`,
    layperson:
      "Out of 100 medical conditions modelled, only a handful drive most of the " +
      "simulated emergencies. This chart shows the worst offenders — the conditions " +
      "with the largest contribution to either the chance of emergency evacuation " +
      "(EVAC) or the chance of crew loss (LOCL). Toggling between EVAC and LOCL can " +
      "shift the order because different conditions are dangerous in different ways: " +
      "something painful and incapacitating might dominate EVAC risk without being " +
      "life-threatening, while a rare but lethal event dominates LOCL. Bar colour " +
      "encodes the medical family the condition belongs to.",
  };

  return (
    <div>
      {/* Metric toggle */}
      <div className="mono mb-3 flex flex-row items-center gap-2 text-[11px]">
        <span className="label text-[10px] uppercase tracking-cap text-ink-2">
          metric
        </span>
        <div className="flex flex-row gap-1">
          {(["pEvac", "pLocl"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={metric === m}
              className="mono rounded border px-3 py-1 text-[11px] transition-colors"
              style={{
                borderColor: metric === m ? "var(--signal)" : "var(--line)",
                color: metric === m ? "var(--signal)" : "var(--ink-2)",
                background: metric === m ? "rgba(245,181,65,0.06)" : "transparent",
              }}
              onClick={() => setMetric(m)}
            >
              {METRIC_LABEL[m]}
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="grid h-[280px] place-items-center text-sm text-ink-2 mono">
          no driver data — run a simulation to populate
        </div>
      ) : (
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          theme={NATURE_THEME_NAME}
          style={{ height: Math.max(220, 28 * shownCount + 80), width: "100%" }}
          notMerge
        />
      )}

      <FigureCaption block={captionBlock} />
    </div>
  );
}
