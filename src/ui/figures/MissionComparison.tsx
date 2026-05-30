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
import type { AccessTier, GateResult } from "@/types";
import { assessLxC } from "@/risk/lxc";

// NASA HSRB color → swatch fill for the per-mission chips.
const NASA_CHIP_FILL: Record<"green" | "yellow" | "red" | "gray", string> = {
  green: "bg-emerald-500/85 text-emerald-950 border-emerald-400/60",
  yellow: "bg-amber-500/90 text-amber-950 border-amber-400/60",
  red: "bg-red-600/90 text-red-50 border-red-500/60",
  gray: "bg-gray-600/75 text-gray-100 border-gray-500/60",
};

// Cumulative-risk band driven by TOTAL expected lost crew-days over the WHOLE
// mission (Diego 2026-05-29). The comparison ranks by this so longer / more
// EVA-intensive missions read as worse — unlike CHI, which is a per-time quality
// fraction and makes short missions look bad. Thresholds are interpretable
// crew-day budgets (tunable); a disqualified gate forces the top band.
function cumulativeRiskBand(
  lostCrewDays: number,
  gate?: GateResult,
): { label: string; color: "green" | "yellow" | "red" } {
  if (gate?.verdict === "disqualified") return { label: "DQ", color: "red" };
  if (lostCrewDays >= 25) return { label: "high", color: "red" };
  if (lostCrewDays >= 8) return { label: "moderate", color: "yellow" };
  return { label: "low", color: "green" };
}

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
export function pickComparisonSet(rows: SimSession[]): SimSession[] | null {
  const tagged = rows.filter((r) => r.notes?.includes("comparison-run-"));

  // Group by run-id suffix (the ISO timestamp after "comparison-run-")
  const groups = new Map<string, SimSession[]>();
  for (const row of tagged) {
    const m = row.notes!.match(/comparison-run-(.+)$/);
    if (!m) continue;
    const runId = m[1];
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
  // Passed by Sim view (extracted from latest session's notes prefix) so the
  // component doesn't need to call useWizard — Sim renders OUTSIDE the
  // WizardProvider, which previously caused a hard crash here.
  accessTier: AccessTier;
  /** Optional gate verdict forwarded from Sim. When disqualified, all per-mission
   *  LxC chips show RED L5×C5=25 to stay consistent with the headline CHIExplainer. */
  gate?: GateResult;
};

export function MissionComparison({ candidateId, accessTier, gate }: MissionComparisonProps) {
  // Three-valued state:
  //   undefined → not yet checked (waiting for first loadCache)
  //   SimSession[] → checked; may be empty array (no comparison data yet)
  const [comparisonRows, setComparisonRows] = useState<SimSession[] | undefined>(undefined);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0); // 0-5

  // Load cache on mount / when candidateId changes
  const loadCache = useCallback(async () => {
    const recent = await recentSimsFor(candidateId, 50);
    // Coerce null (no complete set found) → empty array so the component
    // exits the "undefined" (not-yet-checked) state and renders the button.
    setComparisonRows(pickComparisonSet(recent) ?? []);
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
              notes: `tier=${accessTier} · comparison-run-${runId}`,
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

  // Initial loading state (haven't checked DB yet — undefined means not yet resolved)
  if (comparisonRows === undefined && !running) {
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
        <div className="mono text-[13px] text-ink-2">
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

  // Rank worst → best by CUMULATIVE risk (total expected lost crew-days over the
  // whole mission), so longer / more EVA-intensive missions sort to the top —
  // the intuitive "more mission = more total risk" ordering. (CHI, shown per
  // panel, is the per-time quality fraction and is NOT the ranking key.)
  const sortedRows = [...comparisonRows].sort(
    (a, b) => b.posterior.expectedLostCrewDays.mean - a.posterior.expectedLostCrewDays.mean,
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="mono text-[13px] uppercase tracking-widest text-ink-2">
          mission comparison — ranked by cumulative crew-days lost
        </span>
        <button
          onClick={() => void runComparison()}
          className="rounded border border-line/40 px-3 py-1 mono text-[13px] text-ink-2 hover:text-ink hover:border-signal/40 transition-colors"
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
                className="mono text-[12px] uppercase tracking-wide text-ink-2 mb-1 truncate"
                title={missionLabel}
              >
                {missionLabel}
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
                <div className="grid h-[120px] place-items-center mono text-[12px] text-ink-2">
                  no samples
                </div>
              )}

              {/* Stats footer — cumulative crew-days lost (the ranking key) +
                  the per-time CHI mean for context. */}
              <div className="mono text-[12px] text-ink-2 mt-1 flex justify-between">
                <span title="total expected crew-days lost over the whole mission (the ranking key)">
                  Σ lost {row.posterior.expectedLostCrewDays.mean.toFixed(1)} crew-days
                </span>
                <span title="per-time crew-health index (quality-time fraction)">
                  CHI {(100 * row.posterior.chi.mean).toFixed(1)}%
                </span>
              </div>

              {/* Cumulative-risk verdict — the PRIMARY chip, driven by total
                  expected lost crew-days (Diego 2026-05-29). The per-time NASA
                  HSRB LxC verdict is shown beneath as secondary context. A
                  disqualified gate forces both to the top band. */}
              {(() => {
                const lostCrewDays = row.posterior.expectedLostCrewDays.mean;
                const band = cumulativeRiskBand(lostCrewDays, gate);
                const lxc = assessLxC(row.posterior, gate);
                return (
                  <div className="mt-2 pt-2 border-t border-line/40 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[11px] uppercase tracking-cap text-ink-3">
                        cumulative risk
                      </span>
                      <span
                        className={
                          "mono text-[12px] tabular-nums uppercase tracking-cap font-semibold px-2 py-1 rounded-sm border " +
                          NASA_CHIP_FILL[band.color]
                        }
                        title={`Total expected crew-days lost over the mission: ${lostCrewDays.toFixed(1)} (= ${(lostCrewDays / (ANALOG_MISSIONS.find((m) => m.id === row.missionId)?.crewSize ?? 1)).toFixed(1)} per crew member). Bands: <8 low · 8–25 moderate · ≥25 high.`}
                      >
                        {band.label} · {lostCrewDays.toFixed(1)} cd
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono text-[11px] uppercase tracking-cap text-ink-3">
                        per-time · HSRB JSC-66705
                      </span>
                      <span
                        className={
                          "mono text-[11px] tabular-nums uppercase tracking-cap px-1.5 py-0.5 rounded-sm border " +
                          NASA_CHIP_FILL[lxc.color]
                        }
                        title={`L${lxc.likelihood} (${lxc.likelihoodLabel}) — ${lxc.likelihoodDefinition}\n\nC${lxc.consequence} (${lxc.consequenceLabel}) — ${lxc.consequenceDefinition}\n\nLxC score ${lxc.score} → ${lxc.color}\n\nNote: CHI is a per-time fraction; short missions can look worse here than on cumulative risk.`}
                      >
                        L{lxc.likelihood}×C{lxc.consequence}={lxc.score}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
      <FigureCaption
        block={f7Caption({
          trials: 25000,
          seedBase: 0xfeed,
          missionCount: ANALOG_MISSIONS.length,
          priorsVersion: SYNTHETIC_PRIORS.model_version,
        })}
      />
    </div>
  );
}
