// F3 ConditionContribution — per-condition QTL (lost-crew-days) contribution.
//
// Upgraded from src/ui/components/ConditionContribution.tsx (Iter-1 component)
// via /echarts skill (T81). Adds CI90 uncertainty bands per segment.
//
// Design:
//   - Horizontal stacked bar, one row, segments sorted descending by mean QTL.
//   - Each segment colored by Condition.family (Okabe-Ito categorical).
//   - NEW: CI90 uncertainty bands rendered as a custom series — thin vertical
//     lines at each segment's ci90[0] and ci90[1] positions, computed from
//     the cumulative left-edge offsets of the stacked bar in data-space.
//   - Tooltip per segment: label + family + mean QTL + simulation interval₉₀ + share of total.
//   - Family legend below the bar.
//   - Top-3 readout list (highest mean QTL with share).
//   - ARIA enabled, animation: false, useUTC: true, grid.containLabel: true.
//   - Standalone container (no panel chrome) — parent renders the panel.
//
// Produced from the /echarts skill template library (bar-y-category-stack pattern +
// SCIENTIFIC_RECIPES.md + DashboardSummary.tsx custom-series whisker pattern).

import ReactEChartsCore from "echarts-for-react/lib/core";
import type { CustomSeriesRenderItemAPI } from "echarts";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import type { Condition, ConditionFamily, RiskPosterior } from "@/types/risk";
import { FigureCaption } from "./FigureCaption";
import { f3Caption } from "./captions/F3.captions";

// Okabe-Ito colorblind-safe palette (as specified in task brief / T81).
const FAMILY_COLOR: Record<ConditionFamily, string> = {
  psychiatric:    "#CC79A7", // rose
  physiologic:    "#56B4E9", // sky
  musculoskeletal: "#E69F00", // orange
  performance:    "#009E73", // green
  team:           "#F0E442", // yellow
};

type Props = {
  posterior: RiskPosterior;
  conditions: readonly Condition[];
  trials?: number;
  seed?: number;
  missionId?: string;
  priorsVersion?: string;
};

const days = (x: number) => x.toFixed(2) + "d";

// CI band renderItem factory — returns a renderItem function for CI90 uncertainty
// whiskers. Accepts markerStroke so the overlay adapts to light/dark themes.
// Receives [xLo, xHi] as values 0,1 to draw the whisker span.
function makeCiWhiskerRenderItem(markerStroke: string) {
  return function ciWhiskerRenderItem(
    _params: unknown,
    api: CustomSeriesRenderItemAPI,
  ) {
    const xLo = api.value(0) as number;
    const xHi = api.value(1) as number;

    // coord([xValue, yCategory]) — our single category row is index 0
    const loCoord = api.coord([xLo, 0]);
    const hiCoord = api.coord([xHi, 0]);

    // Vertical cap half-height (pixels)
    const capHalf = 5;

    return {
      type: "group",
      children: [
        // Horizontal span bar (the CI band)
        {
          type: "rect",
          shape: {
            x:      loCoord[0],
            y:      loCoord[1] - capHalf,
            width:  Math.max(hiCoord[0] - loCoord[0], 0),
            height: capHalf * 2,
          },
          style: {
            fill: `${markerStroke}26`,   // 15% opacity
            stroke: `${markerStroke}66`, // 40% opacity
            lineWidth: 1,
          },
        },
        // Left cap
        {
          type: "line",
          shape: {
            x1: loCoord[0], y1: loCoord[1] - capHalf,
            x2: loCoord[0], y2: loCoord[1] + capHalf,
          },
          style: { lineWidth: 1.5, stroke: `${markerStroke}8c` }, // 55% opacity
        },
        // Right cap
        {
          type: "line",
          shape: {
            x1: hiCoord[0], y1: hiCoord[1] - capHalf,
            x2: hiCoord[0], y2: hiCoord[1] + capHalf,
          },
          style: { lineWidth: 1.5, stroke: `${markerStroke}8c` }, // 55% opacity
        },
      ],
    };
  };
}

export function ConditionContribution({
  posterior,
  conditions,
  trials = 25000,
  seed = 0xc0ffee,
  missionId = "—",
  priorsVersion = "synthetic-iter3-ui-scaffold",
}: Props) {
  const { themeName, tokens } = useFigureTheme();
  // Build and sort entries descending by mean QTL.
  const entries = conditions
    .map((c) => {
      const summary = posterior.perConditionQTL[c.id];
      return {
        id:     c.id,
        label:  c.label,
        family: c.family,
        mean:   summary?.mean ?? 0,
        ci90:   summary?.ci90 ?? ([0, 0] as readonly [number, number]),
      };
    })
    .sort((a, b) => b.mean - a.mean);

  const total = entries.reduce((s, e) => s + e.mean, 0);

  // Each stacked bar segment is one series with data=[mean].
  const barSeries = entries.map((e) => ({
    name:    e.label,
    type:    "bar" as const,
    stack:   "qtl",
    barWidth: 32,
    itemStyle: { color: FAMILY_COLOR[e.family] },
    emphasis: { focus: "series" as const },
    data:    [e.mean],
    tooltip: {
      formatter: () =>
        `<span style="color:#9ca3af">condition</span> <span style="color:#f9fafb">${e.label}</span><br/>` +
        `<span style="color:#9ca3af">family</span> <span style="color:${FAMILY_COLOR[e.family]}">${e.family}</span><br/>` +
        `<span style="color:#9ca3af">mean QTL</span> <span style="color:#f9fafb">${days(e.mean)}</span><br/>` +
        `<span style="color:#9ca3af">simulation interval₉₀</span> <span style="color:#f9fafb">${days(e.ci90[0])} → ${days(e.ci90[1])}</span><br/>` +
        `<span style="color:#9ca3af">share</span> <span style="color:#f9fafb">${total > 0 ? ((100 * e.mean) / total).toFixed(1) : "0.0"}%</span>`,
    },
  }));

  // Compute cumulative left offsets in data-space so interval whiskers land correctly.
  // The interval band for segment i spans [cumulative[i] + ci90[0], cumulative[i] + ci90[1]]
  // where ci90 values are relative to each segment's mean (half-width style).
  // However, per the types, ci90 are absolute posterior quantile bounds (not relative),
  // so we position the band at ci90[0]..ci90[1] mapped into the stacked coordinate:
  // cumOffset is the left edge of segment i = sum of means[0..i-1].
  const ciWhiskerData: Array<[number, number]> = [];
  let cumOffset = 0;
  for (const e of entries) {
    // The whisker x-range in data-space: anchored at cumOffset + the ci90 offsets.
    // ci90 are absolute per-condition quantile bounds; we shift them to the cumulative
    // position of the segment by adding cumOffset and subtracting e.mean (so the
    // whisker straddles the mean position within the segment).
    const segMeanX   = cumOffset + e.mean;           // right edge of this segment
    const segCenterX = cumOffset + e.mean / 2;       // center of segment
    const halfSpan   = (e.ci90[1] - e.ci90[0]) / 2; // half of CI width
    ciWhiskerData.push([segCenterX - halfSpan, segCenterX + halfSpan]);
    cumOffset += e.mean;
    void segMeanX; // used for clarity
  }

  // Simulation-interval whisker custom series — one data point per segment.
  const whiskerSeries = {
    name:        "simulation interval₉₀",
    type:        "custom" as const,
    renderItem:  makeCiWhiskerRenderItem(tokens.markerStroke),
    data:        ciWhiskerData,
    encode:      { x: [0, 1], y: 0 },
    z:           8,
    silent:      true,
  };

  const option = {
    animation: false,
    useUTC:    true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left:   8,
      right:  8,
      top:    4,
      bottom: 4,
      containLabel: true,
    },

    tooltip: {
      trigger:    "item",
      backgroundColor: tokens.tooltipBg,
      borderColor: tokens.axisLine,
      borderWidth: 1,
      padding:    [8, 12],
      textStyle: {
        color:      tokens.tooltipText,
        fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize:   11,
      },
    },

    legend:  { show: false },

    xAxis: {
      type:       "value",
      show:       false,
      splitLine:  { show: false },
      min:        0,
      max:        total > 0 ? total : 1,
    },

    yAxis: {
      type:  "category",
      show:  false,
      data:  ["QTL"],
    },

    series: [...barSeries, whiskerSeries],
  };

  const familiesPresent = Array.from(new Set(entries.map((e) => e.family)));

  return (
    <div>
      {total === 0 ? (
        <div className="grid h-[80px] place-items-center text-sm text-ink-2 mono">
          no QTL yet — select a mission to populate the simulation output
        </div>
      ) : (
        <div className="relative">
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            theme={themeName}
            style={{ height: 80, width: "100%" }}
            notMerge
          />
        </div>
      )}

      {/* family legend */}
      <div className="mono mt-3 flex flex-wrap items-center gap-3 text-[10px] text-ink-2">
        {familiesPresent.map((fam) => (
          <span key={fam} className="flex items-center gap-1.5">
            <span
              className="inline-block h-[8px] w-[8px] rounded-[1px]"
              style={{ backgroundColor: FAMILY_COLOR[fam] }}
            />
            <span className="uppercase tracking-cap">{fam}</span>
          </span>
        ))}
      </div>

      {/* top-3 readout */}
      {entries.length > 0 && (
        <>
          <div className="hairline my-3" />
          <ul className="mono space-y-1 text-[11px] text-ink-1">
            {entries.slice(0, 3).map((e, i) => (
              <li key={e.id} className="flex items-baseline justify-between">
                <span>
                  <span className="text-ink-3">#{i + 1}</span>{" "}
                  <span
                    className="inline-block h-[6px] w-[6px] translate-y-[-1px] rounded-[1px] align-middle"
                    style={{ backgroundColor: FAMILY_COLOR[e.family] }}
                  />{" "}
                  <span className="text-ink-0">{e.label}</span>
                </span>
                <span className="tabular-nums text-signal">
                  {days(e.mean)}{" "}
                  <span className="text-ink-3">
                    ({total > 0 ? ((100 * e.mean) / total).toFixed(1) : "0.0"}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <FigureCaption
        block={f3Caption({
          totalQtlMean: total,
          trials,
          seed,
          missionId,
          priorsVersion,
        })}
      />
    </div>
  );
}
