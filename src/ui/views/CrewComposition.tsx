// src/ui/views/CrewComposition.tsx
// IMM Crew Composition view — main surface for crew Stage A score entry,
// live composite aggregation, gate evaluation, and IMM Monte Carlo.
//
// Commit 1: skeleton layout + state + cards (collapsed) + composite panel.
// Commit 2: per-criterion sliders + CitationChip.
// Commit 3: ECharts bell-curve mini-figures.
// Commit 4: Web Worker simulation wiring.
// Commit 5: polish + a11y.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IMMCrewMember, CrewCompositeMethod, IMMOutcome } from "../../imm/types";
import { PLACEHOLDER_CRITERIA } from "../../data/placeholder-criteria";
import { ACTIVE_MISSIONS } from "../../data/imm-missions";
import type { IMMMission } from "../../imm/types";
import { IMM_KITS } from "../../imm/kits";
import type { IMMKitScenario } from "../../imm/types";
import { HealthSupportTierPicker } from "../health/HealthSupportTierPicker";
import { HealthSupportBreakdown } from "../health/HealthSupportBreakdown";
import { ISS_HMS_BASELINE_CHI } from "../../imm/health-support";
import { aggregateCrewComposite } from "../../imm/composite";
import { evaluateCrewGates } from "../../imm/crew-gates";
import { CrewMemberCard } from "../components/CrewMemberCard";
import { CompositeCrewPanel } from "../components/CompositeCrewPanel";
import { CriterionMiniFigure } from "../figures/CriterionMiniFigure";
import { IMMHeadlineCard } from "../figures/IMMHeadlineCard";
import { IMMPosteriorHist } from "../figures/IMMPosteriorHist";
import { IMMConditionDrivers } from "../figures/IMMConditionDrivers";
import { IMMConvergencePlot } from "../figures/IMMConvergencePlot";
import { IMMValidationCompare } from "../figures/IMMValidationCompare";
import { LxCMatrix } from "../figures/LxCMatrix";
import { assessIMMLxC } from "../../imm/lxc";
import { loadIMMPriors } from "../../imm/priors";
import { KindMultipliersTable } from "../components/KindMultipliersTable";
import { notify } from "../components/Toast";
import { createIMMSession, recentIMMSessionsFor } from "../../db/repository";
import type { IMMSession } from "../../imm/types";

type SimState = "idle" | "running" | "done" | "error";

// ─── safe default score generation ───────────────────────────────────────────
// Rules (from advisor):
//   - higherIsBetter=true,  no gate  → scale.min + fraction*(scale.max - scale.min)
//   - higherIsBetter=false, no gate  → scale.min + fraction*(scale.max - scale.min)
//     (lower raw = better for reversed scales)
//   - psych.mmpi2rf_eid (fail-if-above:65)  → always use 35 (well below 65 gate)
//   - cognitive.nasa_cognition_battery (fail-if-below:-2.0) → use value >= -1.0
//
// Six archetypes vary fraction [0.55 … 0.85] so worst-link, mean, and
// geometric-mean all produce distinguishable crew composites.
function defaultScores(fractions: Record<string, number>): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    // Gate overrides take precedence
    if (c.id === "psych.mmpi2rf_eid") {
      // fail-if-above:65 — hardcode safe low T-score
      scores[c.id] = 35;
      continue;
    }
    if (c.id === "cognitive.nasa_cognition_battery") {
      // fail-if-below:-2.0 — use member-specific fraction but always > -1.5
      const f = fractions[c.id] ?? fractions["default"] ?? 0.65;
      const raw = c.scale.min + f * (c.scale.max - c.scale.min);
      scores[c.id] = Math.max(-1.5, raw);
      continue;
    }
    const f = fractions[c.id] ?? fractions["default"] ?? 0.65;
    scores[c.id] = c.scale.min + f * (c.scale.max - c.scale.min);
  }
  return scores;
}

// Six archetypal crew members with varied Stage A profiles.
// Weakest member (Foxtrot) has composite ~0.42; strongest (Alpha) ~0.82.
const INITIAL_CREW: IMMCrewMember[] = [
  {
    id: "Alpha", sex: "male",
    contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 4,
    stageAScores: defaultScores({ default: 0.82 }),
  },
  {
    id: "Bravo", sex: "female",
    contacts: true, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 3,
    stageAScores: defaultScores({ default: 0.75 }),
  },
  {
    id: "Charlie", sex: "male",
    contacts: false, crowns: true, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
    stageAScores: defaultScores({ default: 0.68 }),
  },
  {
    id: "Delta", sex: "female",
    contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: true, EVA_eligible: false, EVA_count: 0,
    stageAScores: defaultScores({ default: 0.62 }),
  },
  {
    id: "Echo", sex: "male",
    contacts: true, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1,
    stageAScores: defaultScores({ default: 0.55 }),
  },
  {
    id: "Foxtrot", sex: "female",
    contacts: false, crowns: true, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0,
    stageAScores: defaultScores({ default: 0.48 }),
  },
];

/**
 * 2026-06-04 mission-kind context label. Surfaces the active prior-calibration
 * context so the user knows whether the engine is running ISS-K15 priors,
 * controlled-habitat priors, or Antarctic winter-over priors. Each label maps
 * 1-to-1 to a key in `imm-priors.json::global_calibration.kind_multipliers`.
 */
function missionKindContextLabel(kind: import("../../imm/types").IMMMissionKind): string {
  switch (kind) {
    case "leo-iss":         return "Context: ISS-calibrated priors (K15 reference)";
    case "analog-controlled": return "Context: Controlled-habitat priors";
    case "antarctic-station": return "Context: Antarctic winter-over priors (Bhatia/Palinkas anchored)";
    case "analog-isolation":  return "Context: legacy analog (no kind multiplier; 1.0 fallthrough)";
    case "lunar-artemis-future": return "Context: future (not yet supported)";
    case "interplanetary-mars-future": return "Context: future (not yet supported)";
  }
}

/**
 * 2026-06-04 short label for the kind suffix appended to mission options
 * in the picker. Returns null for the default `leo-iss` kind (no suffix).
 * Mirrors the `kind_multipliers` keys in `imm-priors.json`.
 */
function kindShortLabel(kind: import("../../imm/types").IMMMissionKind): string | null {
  switch (kind) {
    case "leo-iss":         return null;
    case "analog-controlled": return "controlled";
    case "antarctic-station": return "Antarctic";
    case "analog-isolation":  return "legacy";
    case "lunar-artemis-future": return "future";
    case "interplanetary-mars-future": return "future";
  }
}

/**
 * 2026-06-04: per-(mission-kind, condition) multiplier map resolved from
 * `imm-priors.json::global_calibration.kind_multipliers[mission.kind]`.
 * Falls through to an empty object for kinds without an entry (leo-iss,
 * analog-isolation, future kinds) so the engine default of 1.0 applies.
 */
function useKindMultipliers(kind: import("../../imm/types").IMMMissionKind): Record<string, number> {
  return useMemo(
    () => loadIMMPriors().global_calibration.kind_multipliers?.[kind] ?? {},
    [kind],
  );
}

/**
 * 2026-06-04: short summary of the kind multiplier effect for the active
 * mission kind, rendered as a small badge beside the L×C matrix. Counts
 * rows in three buckets (elevated, suppressed, zeroed) and returns a
 * one-line string. The L×C cells themselves remain the published NASA
 * HSRB values — the delta badge is informational, not a verdict change.
 */
function kindDeltaSummary(
  kind: import("../../imm/types").IMMMissionKind,
  map: Record<string, number>,
): string {
  if (kind === "leo-iss") return "K15 reference (no kind delta)";
  if (kind === "analog-isolation") return "legacy kind — no kind delta applied";
  if (kind === "lunar-artemis-future" || kind === "interplanetary-mars-future") {
    return "future kind — not yet modeled";
  }
  let elevated = 0;
  let suppressed = 0;
  let zeroed = 0;
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith("_")) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    if (v === 0) zeroed++;
    else if (v > 1) elevated++;
    else if (v < 1) suppressed++;
  }
  const parts: string[] = [];
  if (elevated > 0) parts.push(`${elevated} elevated`);
  if (suppressed > 0) parts.push(`${suppressed} suppressed`);
  if (zeroed > 0) parts.push(`${zeroed} ECLSS-specific zeroed`);
  return `Kind delta: ${parts.length === 0 ? "no effect" : parts.join(" · ")}`;
}

interface CrewState {
  members: IMMCrewMember[];
  mission: IMMMission;
  kit: IMMKitScenario;
  trials: number;
  seed: number;
  aggregator: CrewCompositeMethod;
  chiStar: number;
}

const INITIAL_STATE: CrewState = {
  members: INITIAL_CREW,
  mission: ACTIVE_MISSIONS[0], // iss-6mo (K15 reference) — first active mission
  kit: IMM_KITS.issHMS,
  trials: 100_000,
  seed: 0xc0ffee,
  aggregator: "worst-link",
  chiStar: 0.7,
};

// ─── localStorage autosave (Diego 2026-05-29) ────────────────────────────────
// Persist the working crew / mission / kit / sim config so a page refresh
// restores the in-progress setup ("session saving for running simulations").
// Kit is rehydrated from IMM_KITS by scenarioId (canonical resource vector).
// Guarded for non-browser environments.
const PERSIST_KEY = "selectron:crew-state:v1";

function persistCrewState(s: CrewState): void {
  try {
    localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        members: s.members,
        mission: s.mission,
        kitScenarioId: s.kit.scenarioId,
        trials: s.trials,
        seed: s.seed,
        aggregator: s.aggregator,
        chiStar: s.chiStar,
      }),
    );
  } catch {
    /* storage unavailable (private mode / SSR / test) — non-fatal */
  }
}

function loadPersistedCrewState(): CrewState | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<{
      members: IMMCrewMember[];
      mission: IMMMission;
      kitScenarioId: IMMKitScenario["scenarioId"];
      trials: number;
      seed: number;
      aggregator: CrewCompositeMethod;
      chiStar: number;
    }>;
    if (!Array.isArray(p.members) || !p.mission) return null;
    const kit =
      IMM_KITS[(p.kitScenarioId ?? "issHMS") as keyof typeof IMM_KITS] ?? IMM_KITS.issHMS;
    return {
      members: p.members,
      mission: p.mission,
      kit,
      trials: p.trials ?? INITIAL_STATE.trials,
      seed: p.seed ?? INITIAL_STATE.seed,
      aggregator: p.aggregator ?? INITIAL_STATE.aggregator,
      chiStar: p.chiStar ?? INITIAL_STATE.chiStar,
    };
  } catch {
    return null;
  }
}

// ─── crew add / remove / resize helpers (Diego 2026-05-29) ───────────────────
const NATO = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
  "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
];
/** Manual-add ceiling (presets may load more, e.g. antarctic-winter = 12). */
const MAX_CREW = 6;

function nextMemberId(members: IMMCrewMember[]): string {
  const used = new Set(members.map((m) => m.id));
  for (const n of NATO) if (!used.has(n)) return n;
  let i = members.length + 1;
  while (used.has(`Crew-${i}`)) i++;
  return `Crew-${i}`;
}

function makeDefaultMember(id: string): IMMCrewMember {
  return {
    id,
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: false,
    EVA_count: 0,
    stageAScores: defaultScores({ default: 0.65 }),
  };
}

export function CrewComposition() {
  const [state, setState] = useState<CrewState>(() => loadPersistedCrewState() ?? INITIAL_STATE);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [simState, setSimState] = useState<SimState>("idle");
  const [simError, setSimError] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<IMMOutcome | undefined>();
  const workerRef = useRef<Worker | null>(null);

  // ── live severity preview (spec §7.3): a fast T=5,000 sim for the selected
  // tier so the readout updates without waiting for the authoritative T=100,000 run.
  const previewWorkerRef = useRef<Worker | null>(null);
  const previewReqRef = useRef(0);
  const [previewOutcome, setPreviewOutcome] = useState<IMMOutcome | undefined>();
  const [previewState, setPreviewState] = useState<SimState>("idle");

  // ── IMM-50: recent saved sessions for the load dropdown ─────────────────
  const [recentSessions, setRecentSessions] = useState<IMMSession[]>([]);
  const reloadRecentSessions = useCallback(async () => {
    try {
      const rows = await recentIMMSessionsFor(null as unknown as string, 10);
      // recentIMMSessionsFor with null candidateId returns ad-hoc-crew sessions
      // via listIMMSessions's in-memory filter (see src/db/repository.ts).
      setRecentSessions(rows);
    } catch {
      setRecentSessions([]);
    }
  }, []);
  useEffect(() => { reloadRecentSessions(); }, [reloadRecentSessions]);

  // ── live crew composite ─────────────────────────────────────────────────
  const composite = useMemo(
    () => aggregateCrewComposite(state.members, PLACEHOLDER_CRITERIA, state.aggregator),
    [state.members, state.aggregator],
  );

  // Total EVAs is derived from per-member EVA_count (the engine's only EVA lever);
  // mission.totalEVAs is display metadata the engine never reads.
  const totalEVAs = useMemo(
    () => state.members.reduce((sum, m) => sum + (m.EVA_count || 0), 0),
    [state.members],
  );

  // ── live gate evaluation ────────────────────────────────────────────────
  const gateResult = useMemo(
    () => evaluateCrewGates(state.members, PLACEHOLDER_CRITERIA),
    [state.members],
  );

  // ── derived HSRB LxC verdict (drives the NASA-standard risk colour) ──────
  // Computed off the IMM outcome + crew gate so it auto-updates whenever
  // either changes. Returns undefined while no sim has been run.
  const lxc = useMemo(
    () => (outcome ? assessIMMLxC(outcome, gateResult) : undefined),
    [outcome, gateResult],
  );

  // Preview LxC verdict from the fast preview outcome.
  const previewLxc = useMemo(
    () => (previewOutcome ? assessIMMLxC(previewOutcome, gateResult) : undefined),
    [previewOutcome, gateResult],
  );

  // 2026-06-04: per-(mission-kind, condition) multiplier map for the active
  // mission. Read once per mission change. Used by:
  //   - the I3 `IMMConditionDrivers` chart (per-row kind pill + sort bias)
  //   - the L×C panel "kind delta" badge
  //   - the KindMultipliersTable mounted in the verdict area
  const kindMultipliers = useKindMultipliers(state.mission.kind);

  // The severity readout prefers the authoritative full-sim outcome; otherwise the preview.
  const readoutOutcome = outcome ?? previewOutcome;
  const readoutLxc = outcome ? lxc : previewLxc;
  const readoutIsPreview = !outcome && previewOutcome !== undefined;

  // Auto-run a debounced T=5,000 preview whenever the tier / mission / crew / seed /
  // threshold changes, so the readout reflects the selected tier immediately. Debounced
  // (400 ms), race-guarded (previewReqRef), and cleanup-safe; the Worker construction is
  // try/caught so non-browser (test) environments simply no-op.
  useEffect(() => {
    if (state.members.length === 0) { setPreviewOutcome(undefined); return; }
    const reqId = ++previewReqRef.current;
    setPreviewState("running");
    const handle = setTimeout(() => {
      if (previewWorkerRef.current) { previewWorkerRef.current.terminate(); previewWorkerRef.current = null; }
      let w: Worker;
      try {
        w = new Worker(new URL("../../workers/imm-simulate.worker.ts", import.meta.url), { type: "module" });
      } catch {
        if (reqId === previewReqRef.current) setPreviewState("idle");
        return;
      }
      previewWorkerRef.current = w;
      w.onmessage = (e: MessageEvent<{ ok: true; result: IMMOutcome } | { ok: false; error: string }>) => {
        if (reqId === previewReqRef.current) {
          if (e.data.ok) { setPreviewOutcome(e.data.result); setPreviewState("done"); }
          else setPreviewState("idle");
        }
        w.terminate();
        if (previewWorkerRef.current === w) previewWorkerRef.current = null;
      };
      w.onerror = () => {
        if (reqId === previewReqRef.current) setPreviewState("idle");
        w.terminate();
        if (previewWorkerRef.current === w) previewWorkerRef.current = null;
      };
      w.postMessage({
        crew: state.members, mission: state.mission, kit: state.kit,
        trials: 5000, seed: state.seed, chiStar: state.chiStar, criteria: PLACEHOLDER_CRITERIA,
      });
    }, 400);
    return () => {
      clearTimeout(handle);
      if (previewWorkerRef.current) { previewWorkerRef.current.terminate(); previewWorkerRef.current = null; }
    };
  }, [state.members, state.mission, state.kit, state.seed, state.chiStar]);

  function toggleMember(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleScoreChange(memberId: string, criterionId: string, value: number) {
    setState((s) => ({
      ...s,
      members: s.members.map((m) =>
        m.id === memberId
          ? { ...m, stageAScores: { ...m.stageAScores, [criterionId]: value } }
          : m,
      ),
    }));
    setOutcome(undefined);
    setSimState("idle");
  }

  // ── autosave the working config so a page refresh restores it ────────────
  useEffect(() => { persistCrewState(state); }, [state]);

  // ── crew add / remove / resize + mission editing (clear stale outcome) ────
  const invalidateOutcome = useCallback(() => {
    setOutcome(undefined);
    setSimState("idle");
  }, []);

  function addMember() {
    setState((s) =>
      s.members.length >= MAX_CREW
        ? s
        : { ...s, members: [...s.members, makeDefaultMember(nextMemberId(s.members))] },
    );
    invalidateOutcome();
  }

  function removeMember(id: string) {
    setState((s) => ({ ...s, members: s.members.filter((m) => m.id !== id) }));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    invalidateOutcome();
  }

  function changeMember(id: string, patch: Partial<IMMCrewMember>) {
    setState((s) => ({
      ...s,
      members: s.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
    invalidateOutcome();
  }

  /** Resize the crew to `n` members (1…MAX_CREW): truncate, or append defaults. */
  function setCrewSize(n: number) {
    const target = Math.max(1, Math.min(MAX_CREW, Math.round(n)));
    setState((s) => {
      if (target === s.members.length) return s;
      if (target < s.members.length) return { ...s, members: s.members.slice(0, target) };
      const members = [...s.members];
      while (members.length < target) members.push(makeDefaultMember(nextMemberId(members)));
      return { ...s, members };
    });
    invalidateOutcome();
  }

  /** Edit mission duration (the engine's only mission-level lever) → custom mission. */
  function editMissionDuration(days: number) {
    const d = Math.max(1, Math.min(1000, Math.round(days || 0)));
    setState((s) => ({
      ...s,
      mission: { ...s.mission, id: "custom", label: `Custom · ${d} d`, durationDays: d },
    }));
    invalidateOutcome();
  }

  const runSimulation = useCallback(() => {
    if (simState === "running") return;
    if (state.members.length === 0) return;

    // Terminate any previous worker
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setSimState("running");
    setSimError(undefined);

    const worker = new Worker(
      new URL("../../workers/imm-simulate.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{ ok: true; result: IMMOutcome } | { ok: false; error: string }>) => {
      if (e.data.ok) {
        setOutcome(e.data.result);
        setSimState("done");
      } else {
        setSimError(e.data.error);
        setSimState("error");
      }
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = (err) => {
      setSimError(err.message ?? "Worker error");
      setSimState("error");
      worker.terminate();
      workerRef.current = null;
    };

    // Post the simulation payload (simulateIMM options)
    worker.postMessage({
      crew: state.members,
      mission: state.mission,
      kit: state.kit,
      trials: state.trials,
      seed: state.seed,
      chiStar: state.chiStar,
      criteria: PLACEHOLDER_CRITERIA,
    });
  }, [simState, state.members, state.mission, state.kit, state.trials, state.seed, state.chiStar]);

  // ── worker cleanup on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      if (previewWorkerRef.current) {
        previewWorkerRef.current.terminate();
        previewWorkerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">

      {/* ── page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="display text-2xl text-ink-0 tracking-tight" id="crew-composition-heading">
          Crew Composition
        </h2>
        <span className="label text-signal">IMM · Stage A</span>
        <span className="mono text-[13px] text-ink-3 hidden sm:inline">
          {state.mission.label} · {state.members.length} members
        </span>
      </div>
      {/* Screen-reader live region for composite updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Crew composite: {Math.round(composite.compositeScore * 100)}%,{" "}
        {gateResult.crewVerdict}.
        {gateResult.disqualifiedMemberIds.length > 0
          ? ` Disqualified: ${gateResult.disqualifiedMemberIds.join(", ")}.`
          : ""}
      </div>

      {/* ── Mission severity — prominent live dashboard (Diego 2026-05-29) ───
           The headline output. Updates live from the T=5,000 preview as you
           configure crew / mission / scenario; replaced by the authoritative
           T=100,000 run when one is present. */}
      {(() => {
        const sev = readoutLxc ? (readoutLxc.color === "gray" ? "red" : readoutLxc.color) : null;
        const textCls =
          sev === "red" ? "text-red-500" : sev === "yellow" ? "text-amber-400" : "text-go";
        const chipCls =
          sev === "red" ? "bg-red-500/15 text-red-300"
          : sev === "yellow" ? "bg-amber-400/15 text-amber-300"
          : "bg-go/15 text-go";
        const delta = readoutOutcome ? readoutOutcome.chi.mean - ISS_HMS_BASELINE_CHI : 0;
        return (
          <div
            className={"panel border-l-4 " +
              (sev === "red" ? "border-l-red-500" : sev === "yellow" ? "border-l-amber-400" : sev === "green" ? "border-l-go" : "border-l-line")}
            role="region"
            aria-label="mission severity"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="flex flex-col gap-0.5">
                  <span className="label text-[12px] text-ink-2 uppercase tracking-cap">
                    Mission severity
                    {readoutIsPreview ? " · live preview (T=5,000)" : readoutOutcome ? " · full run" : ""}
                  </span>
                  {readoutOutcome ? (
                    <div className="flex items-baseline gap-2">
                      <span className={"display text-5xl leading-none tabular-nums " + textCls}>
                        {readoutOutcome.chi.mean.toFixed(1)}
                      </span>
                      <span className="mono text-xs text-ink-2">CHI %</span>
                      <span className="mono text-[13px] text-ink-3 ml-1">
                        {delta >= 0 ? "+" : "−"}{Math.abs(delta).toFixed(1)} vs ISS
                      </span>
                    </div>
                  ) : (
                    <span className="mono text-sm text-ink-3">
                      {state.members.length === 0
                        ? "add crew members to estimate severity"
                        : previewState === "running"
                          ? "estimating severity (T=5,000)…"
                          : "configure the crew, then run the simulation"}
                    </span>
                  )}
                </div>
                {readoutOutcome && (
                  <dl className="mono text-[13px] text-ink-2 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
                    <dt className="text-ink-3">mission success</dt>
                    <dd className="tabular-nums text-right text-ink-1">{readoutOutcome.missionSuccess.mean.toFixed(1)}%</dd>
                    <dt className="text-ink-3">p(evacuation)</dt>
                    <dd className="tabular-nums text-right text-ink-1">{readoutOutcome.pEvac.mean.toFixed(2)}%</dd>
                    <dt className="text-ink-3">scenario</dt>
                    <dd className="text-right text-ink-1">{state.kit.label}</dd>
                  </dl>
                )}
              </div>
              {readoutLxc && (
                <div className="flex flex-col items-end gap-1.5">
                  <span className={"display text-3xl tabular-nums " + textCls}>
                    L{readoutLxc.likelihood} × C{readoutLxc.consequence} = {readoutLxc.score}
                  </span>
                  <span className={"mono uppercase tracking-cap text-xs px-2 py-1 rounded " + chipCls}>
                    HSRB {sev}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── three-zone layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" role="main" aria-labelledby="crew-composition-heading">

        {/* Zone 1 — Mission + Kit config (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4" role="region" aria-label="Mission and kit configuration">
          <div className="panel flex flex-col gap-4">
            <h3 className="label text-ink-1 uppercase tracking-cap">Mission</h3>

            <div className="flex flex-col gap-1.5">
              <label className="label text-[12px] text-ink-2 uppercase tracking-cap">Profile</label>
              <select
                className="mono text-[13px] bg-transparent border border-line rounded px-3 py-1.5
                           text-ink-1 focus:border-signal focus:outline-none cursor-pointer"
                value={state.mission.id}
                onChange={(e) => {
                  const m = ACTIVE_MISSIONS.find((x) => x.id === e.target.value);
                  if (m) {
                    setState((s) => ({ ...s, mission: m }));
                    setOutcome(undefined);
                    setSimState("idle");
                  }
                }}
              >
                {/* Custom (edited) mission has no preset entry — surface it so the
                    select still reflects state.mission.id rather than going blank. */}
                {!ACTIVE_MISSIONS.some((m) => m.id === state.mission.id) && (
                  <option value={state.mission.id}>{state.mission.label}</option>
                )}
                {ACTIVE_MISSIONS.map((m) => {
                  // 2026-06-04: append a `[kind]` suffix to non-default kinds
                  // so the user can tell at a glance which missions share
                  // the same kind-multiplier context (Antarctic vs controlled
                  // vs ISS). `leo-iss` is the default — no suffix.
                  const suffix = kindShortLabel(m.kind);
                  const label = suffix ? `${m.label} [${suffix}]` : m.label;
                  return (
                    <option key={m.id} value={m.id}>{label}</option>
                  );
                })}
              </select>
              {/* 2026-06-04 mission-kind context badge. A `<button>` toggling a
                  `<details>` so the user can expand to read the multiplier
                  explanation + the per-condition table below the verdict.
                  data-testid="mission-kind-context" is preserved from the
                  earlier commit so existing tests still find it. */}
              <button
                type="button"
                className="mono text-[11px] text-ink-3 mt-0.5 text-left
                           cursor-pointer hover:text-ink-1 focus:outline-none
                           focus:text-ink-1"
                data-testid="mission-kind-context"
                onClick={(e) => {
                  // Toggle the sibling <details> by ID; the button is
                  // colocated with it inside the same wrapper.
                  const root = e.currentTarget.parentElement;
                  if (!root) return;
                  const det = root.querySelector<HTMLDetailsElement>(
                    "details[data-kind-explanation]",
                  );
                  if (det) det.open = !det.open;
                }}
                aria-expanded={false}
              >
                {missionKindContextLabel(state.mission.kind)} <span aria-hidden>▾</span>
              </button>
              <details
                data-kind-explanation
                data-testid="mission-kind-explanation"
                className="mono text-[11px] text-ink-2 mt-1"
              >
                <summary className="sr-only">kind multiplier explanation</summary>
                <p className="leading-relaxed">
                  Per-(mission-kind, condition) multipliers from Bhatia 2012,
                  Palinkas 2004, Pattarini 2016, Hong 2022, Peřina 2024, and
                  Nirwan 2022 modulate the base prior <em>after</em> the
                  tier-A/B/C multiplier and <em>before</em> risk-factor and
                  Stage-A multipliers. The label above names the active
                  prior-calibration context; the table below the L×C
                  verdict lists the per-condition multipliers with citations
                  and confidence.
                </p>
                <p className="mt-1 text-ink-3">
                  See <code>research/evidence_extracted/antarctic_kind_multipliers.md</code>{" "}
                  for the full derivation table.
                </p>
                <a
                  href="#kind-multipliers-mount"
                  className="block mt-1 text-signal hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .querySelector("[data-testid='kind-multipliers-mount']")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  View per-condition multipliers ↓
                </a>
              </details>
            </div>

            {/* Mission meta — editable duration / crew size / EVAs (recompute on change) */}
            <dl className="mono text-[13px] grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
              <dt className="text-ink-3">duration</dt>
              <dd className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={state.mission.durationDays}
                  onChange={(e) => editMissionDuration(Number(e.target.value))}
                  className="w-20 mono text-[13px] bg-transparent border border-line rounded px-1.5 py-0.5
                             text-ink-1 focus:border-signal focus:outline-none tabular-nums"
                  aria-label="mission duration in days"
                />
                <span className="text-ink-3">d</span>
              </dd>

              <dt className="text-ink-3">crew size</dt>
              <dd className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="mono text-[14px] leading-none w-5 h-5 rounded border border-line/50
                             text-ink-2 hover:text-ink-0 hover:border-signal disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => setCrewSize(state.members.length - 1)}
                  disabled={state.members.length <= 1}
                  aria-label="remove one crew member"
                >−</button>
                <span className="text-ink-1 tabular-nums w-5 text-center">{state.members.length}</span>
                <button
                  type="button"
                  className="mono text-[14px] leading-none w-5 h-5 rounded border border-line/50
                             text-ink-2 hover:text-ink-0 hover:border-signal disabled:opacity-30 disabled:cursor-not-allowed"
                  onClick={() => setCrewSize(state.members.length + 1)}
                  disabled={state.members.length >= MAX_CREW}
                  aria-label="add one crew member"
                >+</button>
                <span className="text-ink-3 text-[12px]">(max {MAX_CREW})</span>
              </dd>

              <dt className="text-ink-3">EVAs</dt>
              <dd className="text-ink-1 tabular-nums" title="Total EVAs = sum of per-member EVA counts (edit in each crew card)">
                {totalEVAs}
                <span className="text-ink-3 text-[12px] ml-1">Σ per-member</span>
              </dd>
            </dl>

            {/* Health-support scenario selector. The severity it drives is shown
                in the prominent Mission-severity dashboard at the top of the page;
                the per-item Care-capability breakdown below is collapsed by default. */}
            <div className="flex flex-col gap-1.5">
              <label className="label text-[12px] text-ink-2 uppercase tracking-cap">Health Support (scenario)</label>
              <HealthSupportTierPicker
                selectedId={state.kit.scenarioId}
                onSelect={(kit) => { setState((s) => ({ ...s, kit })); setOutcome(undefined); setSimState("idle"); }}
              />
              <HealthSupportBreakdown tierId={state.kit.scenarioId} />
            </div>

            {/* Sim config (χ* + seed) */}
            <div className="border-t border-line pt-3 flex flex-col gap-3">
              <h4 className="label text-[12px] text-ink-2 uppercase tracking-cap">Simulation</h4>

              <div className="flex flex-col gap-1">
                <label className="mono text-[12px] text-ink-3">
                  χ* (mission success threshold): {state.chiStar.toFixed(2)}
                </label>
                <input
                  type="range"
                  min={0.5} max={0.95} step={0.05}
                  value={state.chiStar}
                  className="instrument w-full"
                  onChange={(e) => setState((s) => ({ ...s, chiStar: parseFloat(e.target.value) }))}
                  aria-label="chi-star mission success threshold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="mono text-[12px] text-ink-3">
                  trials: {state.trials.toLocaleString()}
                </label>
                <input
                  type="range"
                  min={10000} max={100000} step={10000}
                  value={state.trials}
                  className="instrument w-full"
                  onChange={(e) => setState((s) => ({ ...s, trials: parseInt(e.target.value, 10) }))}
                  aria-label="simulation trial count"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2 — Crew Members (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3" role="region" aria-label="Crew members">
          <div className="flex items-center justify-between">
            <h3 className="label text-ink-1 uppercase tracking-cap">
              Crew Members
              <span className="ml-2 text-ink-3 normal-case tracking-normal">({state.members.length})</span>
            </h3>
            <div className="flex items-center gap-2">
              {/* Add member (manual cap MAX_CREW) */}
              <button
                type="button"
                className="mono text-[12px] uppercase tracking-cap text-ink-3 hover:text-ink-1
                           border border-line rounded px-2 py-0.5 transition-colors
                           disabled:opacity-30 disabled:cursor-not-allowed"
                onClick={addMember}
                disabled={state.members.length >= MAX_CREW}
                aria-label="add crew member"
                title={state.members.length >= MAX_CREW ? `max ${MAX_CREW} crew` : "add a crew member"}
              >
                + add
              </button>
              {/* Expand-all toggle */}
              <button
                type="button"
                className="mono text-[12px] uppercase tracking-cap text-ink-3 hover:text-ink-1
                           border border-line rounded px-2 py-0.5 transition-colors"
                onClick={() => {
                  const allIds = state.members.map((m) => m.id);
                  const allExpanded = allIds.every((id) => expandedIds.has(id));
                  setExpandedIds(allExpanded ? new Set() : new Set(allIds));
                }}
              >
                {state.members.every((m) => expandedIds.has(m.id)) ? "collapse all" : "expand all"}
              </button>
            </div>
          </div>

          {state.members.length === 0 ? (
            <div className="panel flex items-center justify-center h-32">
              <span className="mono text-[14px] text-ink-3 italic">
                no crew members — add at least one to run the simulation
              </span>
            </div>
          ) : (
            state.members.map((member, idx) => {
              const memberGate = gateResult.perMemberResults[member.id];
              const memberScore = composite.perMemberScores[idx] ?? 0;
              // Build figures map only when expanded (lazy rendering)
              const isExpanded = expandedIds.has(member.id);
              const figures: Record<string, React.ReactNode> = {};
              if (isExpanded) {
                for (const c of PLACEHOLDER_CRITERIA) {
                  const score = member.stageAScores?.[c.id] ?? c.scale.min + 0.5 * (c.scale.max - c.scale.min);
                  figures[c.id] = (
                    <CriterionMiniFigure
                      key={`${member.id}-${c.id}-${score}`}
                      criterion={c}
                      rawScore={score}
                    />
                  );
                }
              }

              return (
                <CrewMemberCard
                  key={member.id}
                  member={member}
                  compositeScore={memberScore}
                  gateVerdict={memberGate?.verdict ?? "qualified"}
                  failedGates={memberGate?.failedGates ?? []}
                  expanded={isExpanded}
                  onToggle={() => toggleMember(member.id)}
                  criteria={PLACEHOLDER_CRITERIA}
                  onScoreChange={handleScoreChange}
                  figures={figures}
                  onMemberChange={changeMember}
                  onRemove={removeMember}
                />
              );
            })
          )}
        </div>

        {/* Zone 3 — Composite + Results (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4" role="region" aria-label="Crew composite and simulation results">
          <CompositeCrewPanel
            compositeScore={composite.compositeScore}
            perMemberScores={composite.perMemberScores}
            weakestMemberId={composite.weakestMemberId}
            method={state.aggregator}
            crewVerdict={gateResult.crewVerdict}
            disqualifiedMemberIds={gateResult.disqualifiedMemberIds}
            onMethodChange={(m) => setState((s) => ({ ...s, aggregator: m }))}
            simState={simState}
            simError={simError}
            outcome={outcome}
            onRunSim={runSimulation}
          />
        </div>

      </div>

      {/* ── IMM figure panel — mounted below the 3-zone grid when a sim result is available ── */}
      {outcome && (
        <div className="flex flex-col gap-6 mt-4" role="region" aria-label="IMM simulation figures">

          {/* IMM-46 · K15 Table 1 reproduction badge — compact comparison of run
              vs K15 Table 1 (Keenan et al. 2015 ICES-2015-123). Rendered only
              when the mission is iss-6mo AND the kit is one of the three K15
              scenarios. Hidden for analog missions and custom kits. */}
          <K15ValidationBadge
            outcome={outcome}
            missionId={state.mission.id}
            kitScenarioId={state.kit.scenarioId}
          />

          {/* HSRB LxC verdict — NASA JSC-66705 Rev A standard, headline above all figures. */}
          {lxc && (
            <div
              className="panel"
              role="status"
              aria-label={`HSRB risk verdict ${lxc.color} L${lxc.likelihood} times C${lxc.consequence} score ${lxc.score}`}
            >
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
                <h3 className="label text-ink-1 uppercase tracking-cap">
                  NASA HSRB · LxC verdict (JSC-66705 Rev A)
                </h3>
                <div className="flex items-baseline gap-3 flex-wrap">
                  {/* 2026-06-04: kind-delta badge. Informational; the L×C cells
                      remain the published NASA HSRB values. The badge tells
                      the user how many conditions the kind multiplier has
                      elevated / suppressed / zeroed for this mission. */}
                  <span
                    className="mono text-[10px] uppercase tracking-cap text-ink-3
                               border border-line/60 rounded px-2 py-0.5"
                    data-testid="kind-delta-badge"
                    title="informational only — the L×C matrix cells remain the published NASA HSRB values"
                  >
                    {kindDeltaSummary(state.mission.kind, kindMultipliers)}
                  </span>
                  <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                    JSC-66705 Rev A · Fig. 4
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-6 flex-wrap">
                <span
                  className={
                    "display text-4xl tabular-nums " +
                    (lxc.color === "red"    ? "text-red-500"  :
                     lxc.color === "yellow" ? "text-amber-400" :
                                              "text-go")
                  }
                >
                  L{lxc.likelihood} × C{lxc.consequence} = {lxc.score}
                </span>
                <span
                  className={
                    "mono uppercase tracking-cap text-xs px-2 py-1 rounded " +
                    (lxc.color === "red"    ? "bg-red-500/15 text-red-300"  :
                     lxc.color === "yellow" ? "bg-amber-400/15 text-amber-300" :
                                              "bg-go/15 text-go")
                  }
                >
                  {lxc.color}
                </span>
                {lxc.disqualified && (
                  <span className="mono text-xs text-red-300">
                    {lxc.reason}
                  </span>
                )}
              </div>

              {/* 5×5 Likelihood × Consequence matrix — same visualization as the
                  Stage-B Sim page (CHIExplainer): matrix left, drivers right. */}
              <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,360px)_1fr] gap-5 items-start mt-5">
                <LxCMatrix assessment={lxc} />

                <div className="space-y-3 text-sm text-ink-1 leading-relaxed">
                  <div>
                    <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                      likelihood · L{lxc.likelihood} ({lxc.likelihoodLabel})
                    </span>
                    <p className="mt-1">
                      <span className="mono text-ink-0">
                        pFailure = {(100 * lxc.pMissionFailure).toFixed(2)} %
                      </span>{" "}
                      — {lxc.likelihoodDefinition}
                    </p>
                  </div>
                  <div>
                    <span className="mono text-[10px] uppercase tracking-cap text-ink-3">
                      consequence · C{lxc.consequence} ({lxc.consequenceLabel})
                    </span>
                    <p className="mt-1">
                      <span className="mono text-ink-0">
                        fraction crew-days lost = {(100 * lxc.fractionLost).toFixed(2)} %
                      </span>{" "}
                      — {lxc.consequenceDefinition}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mono text-[12px] text-ink-3 mt-4 border-t border-line/40 pt-2">
                pFailure = 1 − missionSuccess (failure ⇔ any of EVAC, LOCL, CHI &lt; χ*).
                fractionLost = 1 − CHI/100 (NASA JSC-66705 §3.2.4).
              </p>
            </div>
          )}

          {/* 2026-06-04: per-(kind, condition) multiplier table. Mounted
              always (not gated on outcome) so the user can read the active
              multiplier context before running a sim. The mount point
              carries a data-testid for the badge's "view per-condition
              multipliers ↓" anchor to scroll to. */}
          <div
            className="panel"
            data-testid="kind-multipliers-mount"
            id="kind-multipliers-mount"
          >
            <h3 className="label text-ink-1 uppercase tracking-cap mb-3">
              Kind multipliers · {missionKindContextLabel(state.mission.kind)}
            </h3>
            <KindMultipliersTable kind={state.mission.kind} />
          </div>

          <div className="panel">
            <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
              I1 · Headline
            </h3>
            <IMMHeadlineCard
              outcome={outcome}
              trials={state.trials}
              seed={state.seed}
              mission={{ id: state.mission.id, label: state.mission.label }}
            />
          </div>

          <div className="panel">
            <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
              I2 · Posterior Distributions
            </h3>
            <IMMPosteriorHist
              outcome={outcome}
              trials={state.trials}
              seed={state.seed}
              mission={{ id: state.mission.id, label: state.mission.label }}
            />
          </div>

          <div className="panel">
            <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
              I3 · Condition Drivers
            </h3>
            <IMMConditionDrivers
              outcome={outcome}
              trials={state.trials}
              seed={state.seed}
              mission={{ id: state.mission.id, label: state.mission.label }}
              kindMultipliers={kindMultipliers}
            />
          </div>

          <div className="panel">
            <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
              I4 · Convergence Diagnostics
            </h3>
            <IMMConvergencePlot
              outcome={outcome}
              trials={state.trials}
              chiStar={state.chiStar}
            />
          </div>

          {/* I5 — K15 reference only applies to iss-6mo / issHMS DRM.
              For analog campaigns and other kits, comparing observed TME/CHI/pEVAC/pLOCL
              against the ISS 180-day reference yields meaningless deltas (e.g. a 7-day
              campaign shows TME ~5 vs reference 106, an artifact of duration scaling
              rather than a real divergence). Mirrors the K15ValidationBadge gate above. */}
          {state.mission.id === "iss-6mo" &&
            (["none", "issHMS", "unlimited"] as const).includes(state.kit.scenarioId as "none" | "issHMS" | "unlimited") && (
            <div className="panel">
              <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
                I5 · K15 Validation Comparison
              </h3>
              <IMMValidationCompare outcome={outcome} />
            </div>
          )}
        </div>
      )}

      {/* IMM-50 / 2026-05-29: save / load / export toolbar.
       *   - Load dropdown is ALWAYS visible (loading a saved session brings in
       *     an outcome from Dexie; gating it on outcome would be chicken-and-egg).
       *   - Save / Export are ALWAYS available now: a session can be saved as a
       *     config-only setup (outcomes = null) before a run completes. The
       *     working state is also auto-persisted to localStorage on every change.
       */}
      <div
        className="panel flex flex-wrap items-baseline gap-3 mt-4"
        role="region"
        aria-label="save load export"
      >
        <h3 className="label uppercase tracking-cap text-ink-1 mr-2">
          Session
        </h3>
        <span className="mono text-[12px] text-ink-3 mr-1" title="The working crew, mission, kit, and sim settings auto-save locally and restore on refresh.">
          autosaved{outcome ? "" : " · config only (no run yet)"}
        </span>

        <button
          type="button"
          aria-label="Save current IMM session"
          className="mono text-xs border border-line/40 px-2 py-1 hover:bg-line/10"
          onClick={async () => {
            try {
              const id = await createIMMSession({
                candidateId: null,
                // Sync display metadata to the actual crew before persisting.
                mission: { ...state.mission, crewSize: state.members.length, totalEVAs },
                crew: state.members.map((m) => ({ ...m })),
                kit: state.kit,
                trials: state.trials,
                seed: state.seed,
                overrides: {},
                vulnerabilityMode: "boolean-flags",
                engine: "monte-carlo",
                outcomes: outcome ?? null,
                validation: {
                  vsK15Table1: {
                    delta_tme: 0, delta_chi: 0, delta_pEvac: 0, delta_pLocl: 0,
                    within_ci95: false,
                  },
                },
                laypersonCaptionsExpanded: {},
              });
              notify(
                outcome
                  ? `session saved (id: ${id.slice(0, 8)}…)`
                  : `config saved — run it after loading (id: ${id.slice(0, 8)}…)`,
                "info",
              );
              reloadRecentSessions();
            } catch (err) {
              notify(`save failed: ${(err as Error).message}`, "error");
            }
          }}
        >
          💾 Save
        </button>

        <label htmlFor="recent-session-select" className="sr-only">
          Load recent IMM session
        </label>
        <select
          id="recent-session-select"
          aria-label="Load recent IMM session"
          className="mono text-xs border border-line/40 bg-transparent text-ink-1 px-2 py-1"
          value=""
          onChange={(e) => {
            const sid = e.target.value;
            if (!sid) return;
            const s = recentSessions.find((r) => r.id === sid);
            if (!s) return;
            setState((cur) => ({
              ...cur,
              mission: s.mission,
              kit: s.kit as typeof IMM_KITS["issHMS"],
              trials: s.trials,
              seed: s.seed,
              members: s.crew,
            }));
            // A config-only session has no outcome — clear any stale result so
            // the user re-runs the loaded setup.
            setOutcome(s.outcomes ?? undefined);
            setSimState("idle");
            notify(s.outcomes ? `session loaded` : `config loaded — press run`, "info");
            e.target.value = "";
          }}
        >
          <option value="">— select session —</option>
          {recentSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.createdAt.slice(0, 19)} · {s.mission.label} ·{" "}
              {s.outcomes ? `CHI ${s.outcomes.chi.mean.toFixed(1)}%` : "config only"}
            </option>
          ))}
        </select>

        <button
          type="button"
          aria-label="Export current IMM session as JSON"
          className="mono text-xs border border-line/40 px-2 py-1 hover:bg-line/10"
          onClick={() => {
            const payload = {
              mission: { ...state.mission, crewSize: state.members.length, totalEVAs },
              kit: state.kit.scenarioId,
              trials: state.trials,
              seed: state.seed,
              members: state.members,
              outcome: outcome ?? null,
            };
            const blob = new Blob([JSON.stringify(payload, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            const seedHex = state.seed.toString(16);
            a.download = `selectron-imm-session-${date}-${seedHex}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          ⬇ Export JSON
        </button>
      </div>
    </div>
  );
}

// ─── IMM-46 · K15 Table 1 reproduction badge ────────────────────────────────
// Compact in-UI badge that compares the current sim's IMMOutcome to K15 Table 1
// (Keenan et al. 2015 ICES-2015-123) for the corresponding kit scenario. Shows
// ✓/✗ per metric (TME, CHI, pEVAC, pLOCL) based on whether the run's posterior
// mean falls inside K15's 95% confidence interval.
//
// K15 Table 1 means + CI₉₅ brackets are INLINED here because importing
// `calibration.ts` pulls in `node:fs`, which breaks the browser bundle. This
// follows the same inline-vs-import pattern used in `IMMValidationCompare.tsx`
// (see file header for rationale). CI₉₅ brackets are sourced verbatim from
// `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md`.

type K15ScenarioKey = "none" | "issHMS" | "unlimited";

type K15MetricRef = {
  ref: number;
  ci95: [number, number];
};

type K15ScenarioRef = {
  tme:   K15MetricRef;
  chi:   K15MetricRef;
  pEvac: K15MetricRef;
  pLocl: K15MetricRef;
};

// K15 Table 1: ISS 6-month / 6-crew DRM (100k trials), three resource scenarios.
// Means match src/imm/calibration.ts K15_TABLE1_REF; CI₉₅ brackets sourced
// verbatim from K15 §III (Keenan et al. 2015 ICES-2015-123).
const K15_TABLE1: Record<K15ScenarioKey, K15ScenarioRef> = {
  none: {
    tme:   { ref: 98.3,  ci95: [73,    122   ] },
    chi:   { ref: 59.2,  ci95: [43.36, 71.25 ] },
    pEvac: { ref: 66.9,  ci95: [66.57, 67.14 ] },
    pLocl: { ref: 2.89,  ci95: [ 2.78,  2.99 ] },
  },
  issHMS: {
    tme:   { ref: 106,   ci95: [87,    126   ] },
    chi:   { ref: 94.93, ci95: [84.30, 98.50 ] },
    pEvac: { ref: 5.57,  ci95: [ 5.43,  5.72 ] },
    pLocl: { ref: 0.44,  ci95: [ 0.40,  0.49 ] },
  },
  unlimited: {
    tme:   { ref: 106,   ci95: [87,    126   ] },
    chi:   { ref: 94.98, ci95: [84.40, 98.50 ] },
    pEvac: { ref: 4.93,  ci95: [ 4.80,  5.07 ] },
    pLocl: { ref: 0.45,  ci95: [ 0.41,  0.49 ] },
  },
};

/** True when `value` is within `[lo, hi]` (inclusive). */
function withinK15CI95(value: number, ci95: [number, number]): boolean {
  return value >= ci95[0] && value <= ci95[1];
}

export type K15ValidationBadgeProps = {
  outcome: IMMOutcome | undefined;
  missionId: string;
  kitScenarioId: "none" | "medium" | "issHMS" | "unlimited" | "custom";
};

/**
 * Renders nothing unless:
 *   - `outcome` is defined,
 *   - `missionId === "iss-6mo"` (the K15 reference DRM), and
 *   - `kitScenarioId` is one of the three K15 scenarios (not "custom").
 *
 * When visible, shows a single row of 4 mini-stats (TME / CHI / pEVAC / pLOCL),
 * each with the engine value, the K15 reference, the Δ, and a ✓/✗ flag based on
 * inclusion in K15's CI₉₅.
 */
export function K15ValidationBadge({
  outcome,
  missionId,
  kitScenarioId,
}: K15ValidationBadgeProps) {
  // Visibility gate — K15 Table 1 only describes the ISS 6mo / 6 crew DRM with
  // one of the three documented kit scenarios. Anything else (e.g. mdrs-2wk,
  // custom kit) has no published K15 anchor and the comparison would mislead.
  if (!outcome) return null;
  if (missionId !== "iss-6mo") return null;
  if (kitScenarioId === "custom") return null;
  if (kitScenarioId === "medium") return null; // analog tier has no published K15 anchor

  const scenarioRef: K15ScenarioRef = K15_TABLE1[kitScenarioId];

  const rows: Array<{
    label: "TME" | "CHI" | "pEVAC" | "pLOCL";
    unit: string;
    value: number;
    ref: number;
    ci95: [number, number];
    decimals: number;
  }> = [
    { label: "TME",   unit: "",  value: outcome.tme.mean,   ref: scenarioRef.tme.ref,   ci95: scenarioRef.tme.ci95,   decimals: 1 },
    { label: "CHI",   unit: "%", value: outcome.chi.mean,   ref: scenarioRef.chi.ref,   ci95: scenarioRef.chi.ci95,   decimals: 2 },
    { label: "pEVAC", unit: "%", value: outcome.pEvac.mean, ref: scenarioRef.pEvac.ref, ci95: scenarioRef.pEvac.ci95, decimals: 2 },
    { label: "pLOCL", unit: "%", value: outcome.pLocl.mean, ref: scenarioRef.pLocl.ref, ci95: scenarioRef.pLocl.ci95, decimals: 2 },
  ];

  return (
    <div
      className="panel"
      role="status"
      aria-label={`K15 Table 1 reproduction badge for ${kitScenarioId} scenario`}
    >
      <h3 className="label text-ink-1 uppercase tracking-cap mb-3">
        K15 Table 1 reproduction · {kitScenarioId} scenario
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {rows.map((r) => {
          const within = withinK15CI95(r.value, r.ci95);
          const delta = r.value - r.ref;
          const deltaSign = delta >= 0 ? "+" : "−";
          const deltaAbs = Math.abs(delta).toFixed(r.decimals);
          const flagClass = within ? "text-go" : "text-warn";
          const flagGlyph = within ? "✓" : "✗";
          return (
            <div
              key={r.label}
              className="flex flex-col gap-0.5"
              data-testid={`k15-badge-row-${r.label}`}
            >
              <div className="flex items-baseline gap-1.5">
                <span className="label text-[12px] text-ink-2 uppercase tracking-cap">
                  {r.label}
                </span>
                <span className={"mono text-[14px] " + flagClass} aria-hidden="true">
                  {flagGlyph}
                </span>
                <span className="sr-only">
                  {within ? "within K15 CI₉₅" : "outside K15 CI₉₅"}
                </span>
              </div>
              <span className="mono text-[13px] text-ink-1 tabular-nums">
                {r.value.toFixed(r.decimals)}{r.unit}
              </span>
              <span className="mono text-[12px] text-ink-3 tabular-nums">
                ref {r.ref.toFixed(r.decimals)}{r.unit} · Δ {deltaSign}{deltaAbs}{r.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
