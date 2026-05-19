// F7 MissionComparison — 5-panel small-multiples of CHI posteriors across all analog missions.
//
// On first render, checks for a cached "comparison-run-<isoNow>" set in simSessions.
// If a valid set exists (exactly 5 rows sharing the same run-id), renders the grid.
// Otherwise, renders a "Compare across all missions" button that triggers 5 sequential
// simulateMission calls (one per ANALOG_MISSION), each wrapped in requestAnimationFrame
// to allow the UI to paint the computing banner between the main-thread-blocking calls.
//
// Cache strategy: each run stores one simSessions row per mission with
//   notes: "comparison-run-<isoNow>"
// Reload after save: requery recentSimsFor and pick the freshest complete set.
//
// Produced from /echarts skill templates (histogram.json + SCIENTIFIC_RECIPES.md §dist)
// adapted for small-multiples layout. Histogram logic mirrors RiskHistogram.tsx (T79)
// but uses 28 bins and a shared x-axis range across panels for visual honesty.

import { useCallback, useEffect, useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "@/data/synthetic-iter3";
import { simulateMission } from "@/risk/simulate";
import { saveSimSession, recentSimsFor, getCandidateWithEvidence } from "@/db/repository";
import type { SimSession } from "@/db/schema";
import { notify } from "@/ui/components/Toast";
import { FigureCaption } from "./FigureCaption";
import { f7Caption } from "./captions/F7.captions";

// ---------------------------------------------------------------------------
// Design constants
// ---------------------------------------------------------------------------

const N_BINS = 28;

// Wong-7 sequential green gradient — matching RiskHistogram.
const BAR_GRADIENT = {
  type: "linear" as const,
  x: 0,
  y: 0,
  x2: 0,
  y2: 1,
  colorStops: [
    { offset: 0, color: "#56B4E9" }, // Wong sky blue (lighter)
    { offset: 1, color: "#009E73" }, // Wong bluish green
  ],
};
const MEAN_LINE_COLOR = "#009E73";

// ---------------------------------------------------------------------------
// Histogram helpers
// ---------------------------------------------------------------------------

/** Build a fixed-bin histogram over a shared [xMin, xMax] range. */
function buildHistogram(
  samples: number[],
  bins: number,
  xMin: number,
  xMax: number,
): { centers: string[]; counts: number[] } {
  // Guard: if samples outside range, clamp.
  let lo = xMin;
  let hi = xMax;
  if (lo >= hi) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 1);
  }
  const width = (hi - lo) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (const s of samples) {
    let idx = Math.floor((s - lo) / width);
    if (idx < 0) idx = 0;
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }
  const centers = Array.from(
    { length: bins },
    (_, i) => (lo + (i + 0.5) * width).toFixed(3),
  );
  return { centers, counts };
}

/** Build the ECharts option for a mini histogram panel. */
function miniHistogramOption(
  chiSamples: number[],
  chiMean: number,
  sharedXRange: [number, number],
) {
  if (chiSamples.length < 2) {
    return {};
  }

  const [xMin, xMax] = sharedXRange;
  const { centers, counts } = buildHistogram(chiSamples, N_BINS, xMin, xMax);

  // Locate bin-center closest to the mean for the markLine.
  const closestCenter = (target: number): string => {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const d = Math.abs(parseFloat(centers[i]) - target);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return centers[bestIdx];
  };

  const meanLabel = closestCenter(chiMean);

  return {
    animation: false,
    useUTC: true,
    aria: { enabled: true, decal: { show: true } },

    grid: {
      left: 8,
      right: 8,
      top: 4,
      bottom: 20,
      containLabel: false,
    },

    xAxis: {
      type: "category" as const,
      data: centers,
      boundaryGap: true,
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: {
        interval: Math.floor(N_BINS / 4),
        fontSize: 8,
        color: "#475569",
        formatter: (val: string) => parseFloat(val).toFixed(2),
      },
      splitLine: { show: false },
    },

    yAxis: {
      type: "value" as const,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },

    series: [
      {
        name: "CHI posterior",
        type: "bar",
        data: counts,
        barCategoryGap: "4%",
        itemStyle: {
          color: BAR_GRADIENT,
          opacity: 0.82,
          borderWidth: 0,
        },

        markLine: {
          silent: true,
          symbol: ["none", "none"],
          lineStyle: {
            color: MEAN_LINE_COLOR,
            width: 1.5,
            type: "dashed" as const,
          },
          label: {
            show: true,
            position: "insideEndTop",
            color: MEAN_LINE_COLOR,
            fontSize: 9,
            formatter: "μ",
          },
          data: [{ xAxis: meanLabel }],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Cache-hit logic helpers
// ---------------------------------------------------------------------------

/**
 * From a list of simSessions, pick the most-recent run-id that has exactly 5
 * rows (one per analog mission). Returns the 5 rows or null.
 */
function pickComparisonSet(rows: SimSession[]): SimSession[] | null {
  // Filter rows tagged as comparison-run-*
  const tagged = rows.filter((r) => r.notes?.startsWith("comparison-run-"));

  // Group by run-id suffix
  const groups = new Map<string, SimSession[]>();
  for (const row of tagged) {
    const runId = row.notes!.replace("comparison-run-", "");
    const g = groups.get(runId) ?? [];
    g.push(row);
    groups.set(runId, g);
  }

  // Find run-ids with exactly 5 rows; pick most recent (ISO sort of runId)
  const complete: [string, SimSession[]][] = [];
  for (const [rid, g] of groups.entries()) {
    if (g.length === ANALOG_MISSIONS.length) {
      complete.push([rid, g]);
    }
  }
  if (complete.length === 0) return null;

  // Sort descending by runId (ISO timestamp string)
  complete.sort((a, b) => b[0].localeCompare(a[0]));
  return complete[0][1];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type MissionComparisonProps = {
  candidateId: string;
};

export function MissionComparison({ candidateId }: MissionComparisonProps) {
  const [comparisonRows, setComparisonRows] = useState<SimSession[] | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0-5

  // Load cache on mount / when candidateId changes
  const loadCache = useCallback(async () => {
    const recent = await recentSimsFor(candidateId, 50);
    const set = pickComparisonSet(recent);
    setComparisonRows(set);
  }, [candidateId]);

  useEffect(() => {
    void loadCache();
  }, [loadCache]);

  // ---------------------------------------------------------------------------
  // Compute shared x-axis range across all 5 panels (clamped to [0, 1])
  // ---------------------------------------------------------------------------
  const sharedXRange: [number, number] = (() => {
    if (!comparisonRows || comparisonRows.length === 0) return [0, 1];
    let minVal = 1;
    let maxVal = 0;
    for (const row of comparisonRows) {
      for (const s of row.chiSamples) {
        if (s < minVal) minVal = s;
        if (s > maxVal) maxVal = s;
      }
    }
    // Clamp to [0, 1]
    const lo = Math.max(0, minVal);
    const hi = Math.min(1, maxVal);
    // Guard degenerate range
    if (lo >= hi) return [0, 1];
    return [lo, hi];
  })();

  // ---------------------------------------------------------------------------
  // Simulate all missions on demand
  // ---------------------------------------------------------------------------
  const runComparison = useCallback(async () => {
    setRunning(true);
    setProgress(0);

    let bundle;
    try {
      bundle = await getCandidateWithEvidence(candidateId);
    } catch (err) {
      notify(`Failed to load candidate: ${(err as Error).message}`, "error");
      setRunning(false);
      return;
    }

    // Build a flat scores record from criterion entries
    const scores: Record<string, number> = {};
    for (const e of bundle.criterionEntries) {
      scores[e.criterionId] = e.rawValue;
    }
    const template = {
      id: bundle.candidate.id,
      alias: bundle.candidate.alias,
      scores,
    };

    const runId = new Date().toISOString();

    for (let k = 0; k < ANALOG_MISSIONS.length; k++) {
      const mission = ANALOG_MISSIONS[k];

      // Wrap in requestAnimationFrame so React can repaint the progress
      // indicator between the heavy Monte-Carlo calls on the main thread.
      // We await saveSimSession BEFORE resolving, so the DB write is
      // serialised and there is no data race.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(async () => {
          try {
            const crew = synthesizeCrew(template, mission.crewSize);
            const post = simulateMission(
              crew,
              mission,
              SYNTHETIC_PRIORS,
              ANALOG_CONDITIONS,
              {
                seed: 0xfeed + k,
                trials: 25_000,
                diagnostics: true,
              },
            );
            await saveSimSession({
              candidateId,
              missionId: mission.id,
              trials: 25_000,
              chiStar: 0.7,
              seed: 0xfeed + k,
              priorsVersion: SYNTHETIC_PRIORS.model_version,
              posterior: {
                chi: post.chi,
                pEarlyTermination: post.pEarlyTermination,
                expectedLostCrewDays: post.expectedLostCrewDays,
                perConditionQTL: post.perConditionQTL,
                ess: post.ess,
                trials: post.trials,
              },
              chiSamples: post.diagnostics?.chiSamples ?? [],
              qtlSamples: post.diagnostics?.qtlSamples ?? [],
              notes: `comparison-run-${runId}`,
            });
          } catch (err) {
            notify(`Mission ${mission.id} failed: ${(err as Error).message}`, "error");
          } finally {
            setProgress(k + 1);
            resolve();
          }
        });
      });
    }

    setRunning(false);
    // Reload the newly saved comparison set
    await loadCache();
  }, [candidateId, loadCache]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Initial loading state (haven't checked DB yet)
  if (comparisonRows === null && !running) {
    // Still awaiting first loadCache — show nothing briefly
    // (The useEffect fires synchronously after mount so this is typically
    //  invisible, but we guard against it for correctness.)
    return (
      <div className="grid h-[160px] place-items-center text-sm text-ink-2 mono">
        loading…
      </div>
    );
  }

  // Running banner
  if (running) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center py-10">
        <div className="mono text-sm text-ink-2">
          Computing {ANALOG_MISSIONS.length} missions… ~7 s
        </div>
        <div className="w-full max-w-xs bg-line/20 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-signal transition-all duration-300"
            style={{ width: `${(progress / ANALOG_MISSIONS.length) * 100}%` }}
          />
        </div>
        <div className="mono text-[11px] text-ink-2">
          {progress} / {ANALOG_MISSIONS.length} done
        </div>
      </div>
    );
  }

  // No cached comparison set → prompt button
  if (!comparisonRows || comparisonRows.length === 0) {
    return (
      <div className="flex flex-col gap-3 items-center justify-center py-10">
        <p className="mono text-sm text-ink-2 text-center max-w-xs">
          No comparison data. Run the 5-mission simulator to compare CHI posteriors across
          all analog missions for this candidate.
        </p>
        <button
          onClick={() => void runComparison()}
          className="rounded-md border border-signal/40 bg-signal/10 px-4 py-2 mono text-sm text-signal hover:bg-signal/20 transition-colors"
        >
          Compare across all missions
        </button>
      </div>
    );
  }

  // Sort panels in a stable order matching ANALOG_MISSIONS catalog order
  const missionOrder = ANALOG_MISSIONS.map((m) => m.id);
  const sortedRows = [...comparisonRows].sort(
    (a, b) => missionOrder.indexOf(a.missionId) - missionOrder.indexOf(b.missionId),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="mono text-[11px] uppercase tracking-widest text-ink-2">
          CHI posteriors — mission comparison
        </span>
        <button
          onClick={() => void runComparison()}
          className="rounded border border-line/40 px-3 py-1 mono text-[11px] text-ink-2 hover:text-ink hover:border-signal/40 transition-colors"
        >
          Re-run
        </button>
      </div>

      {/* 5-panel grid: 2 columns × 3 rows (6th slot intentionally empty) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedRows.map((row) => {
          const mission = ANALOG_MISSIONS.find((m) => m.id === row.missionId);
          const missionLabel = mission?.label ?? row.missionId;

          return (
            <div
              key={row.id}
              className="panel p-3 border border-line/40 rounded-md"
            >
              {/* Panel title */}
              <div
                className="mono text-[10px] uppercase tracking-wide text-ink-2 mb-1 truncate"
                title={missionLabel}
              >
                {row.missionId}
              </div>

              {/* Small histogram */}
              {row.chiSamples.length >= 10 ? (
                <ReactEChartsCore
                  echarts={echarts}
                  option={miniHistogramOption(
                    row.chiSamples,
                    row.posterior.chi.mean,
                    sharedXRange,
                  )}
                  theme={NATURE_THEME_NAME}
                  style={{ height: 120, width: "100%" }}
                  notMerge
                />
              ) : (
                <div className="grid h-[120px] place-items-center mono text-[10px] text-ink-2">
                  no samples
                </div>
              )}

              {/* Stats footer */}
              <div className="mono text-[10px] text-ink-2 mt-1 flex justify-between">
                <span>μ {(100 * row.posterior.chi.mean).toFixed(1)}%</span>
                <span>
                  CI₉₀{" "}
                  {(100 * row.posterior.chi.ci90[0]).toFixed(1)}–
                  {(100 * row.posterior.chi.ci90[1]).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <FigureCaption
        block={f7Caption({
          trials: 25000,
          seed: 0xfeed,
          priorsVersion: SYNTHETIC_PRIORS.model_version,
        })}
      />
    </div>
  );
}
