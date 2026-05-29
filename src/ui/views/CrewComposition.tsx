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
import { assessIMMLxC } from "../../imm/lxc";
import { PRESET_CREWS, PRESET_KEYS } from "../../data/imm-preset-crews";
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

interface CrewState {
  members: IMMCrewMember[];
  mission: IMMMission;
  kit: typeof IMM_KITS["issHMS"];
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

export function CrewComposition() {
  const [state, setState] = useState<CrewState>(INITIAL_STATE);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [simState, setSimState] = useState<SimState>("idle");
  const [simError, setSimError] = useState<string | undefined>();
  const [outcome, setOutcome] = useState<IMMOutcome | undefined>();
  const workerRef = useRef<Worker | null>(null);

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
        <span className="mono text-[11px] text-ink-3 hidden sm:inline">
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

      {/* IMM-49: quick-load preset crew dropdown */}
      <div className="flex flex-wrap items-baseline gap-2">
        <label htmlFor="preset-crew-select" className="label uppercase tracking-cap text-ink-2">
          Load preset crew configuration:
        </label>
        <select
          id="preset-crew-select"
          aria-label="Load preset crew configuration"
          className="mono text-xs border border-line/40 bg-transparent text-ink-1 px-2 py-1"
          value=""
          onChange={(e) => {
            const key = e.target.value;
            if (!key) return;
            const preset = PRESET_CREWS[key];
            if (!preset) return;
            setState((s) => ({ ...s, members: preset.members }));
            setOutcome(undefined);
            notify(`loaded preset: ${preset.label}`, "info");
            e.target.value = ""; // reset to sentinel so re-selecting same preset still fires
          }}
        >
          <option value="">— load preset crew —</option>
          {PRESET_KEYS.map((k) => (
            <option key={k} value={k}>
              {PRESET_CREWS[k].label}
            </option>
          ))}
        </select>
      </div>

      {/* ── three-zone layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" role="main" aria-labelledby="crew-composition-heading">

        {/* Zone 1 — Mission + Kit config (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4" role="region" aria-label="Mission and kit configuration">
          <div className="panel flex flex-col gap-4">
            <h3 className="label text-ink-1 uppercase tracking-cap">Mission</h3>

            <div className="flex flex-col gap-1.5">
              <label className="label text-[10px] text-ink-2 uppercase tracking-cap">Profile</label>
              <select
                className="mono text-[11px] bg-transparent border border-line rounded px-3 py-1.5
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
                {ACTIVE_MISSIONS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Mission meta */}
            <dl className="mono text-[11px] grid grid-cols-2 gap-x-3 gap-y-1">
              <dt className="text-ink-3">duration</dt>
              <dd className="text-ink-1">{state.mission.durationDays} d</dd>
              <dt className="text-ink-3">crew size</dt>
              <dd className="text-ink-1">{state.mission.crewSize}</dd>
              <dt className="text-ink-3">EVAs</dt>
              <dd className="text-ink-1">{state.mission.totalEVAs}</dd>
            </dl>

            {/* Kit selector */}
            <div className="flex flex-col gap-1.5">
              <label className="label text-[10px] text-ink-2 uppercase tracking-cap">Medical Kit</label>
              <div className="flex flex-col gap-1">
                {(["none", "issHMS", "unlimited"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className="mono text-[11px] rounded border px-3 py-1.5 text-left transition-colors"
                    style={{
                      borderColor: state.kit.scenarioId === k ? "var(--signal)" : "var(--line)",
                      color: state.kit.scenarioId === k ? "var(--signal)" : "var(--ink-2)",
                      background: state.kit.scenarioId === k ? "rgba(245,181,65,0.06)" : "transparent",
                    }}
                    onClick={() => { setState((s) => ({ ...s, kit: IMM_KITS[k] })); setOutcome(undefined); setSimState("idle"); }}
                  >
                    {IMM_KITS[k].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sim config (χ* + seed) */}
            <div className="border-t border-line pt-3 flex flex-col gap-3">
              <h4 className="label text-[10px] text-ink-2 uppercase tracking-cap">Simulation</h4>

              <div className="flex flex-col gap-1">
                <label className="mono text-[10px] text-ink-3">
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
                <label className="mono text-[10px] text-ink-3">
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
            {/* Expand-all toggle */}
            <button
              type="button"
              className="mono text-[10px] uppercase tracking-cap text-ink-3 hover:text-ink-1
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

          {state.members.length === 0 ? (
            <div className="panel flex items-center justify-center h-32">
              <span className="mono text-[12px] text-ink-3 italic">
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
              <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
                NASA HSRB · LxC verdict (JSC-66705 Rev A)
              </h3>
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
              <dl className="mono text-xs text-ink-2 mt-4 grid grid-cols-2 gap-x-6 gap-y-1">
                <dt className="text-ink-3 uppercase tracking-cap">likelihood</dt>
                <dd>
                  L{lxc.likelihood} · {lxc.likelihoodLabel} · pFailure = {(100 * lxc.pMissionFailure).toFixed(2)}%
                </dd>
                <dt className="text-ink-3 uppercase tracking-cap">consequence</dt>
                <dd>
                  C{lxc.consequence} · {lxc.consequenceLabel} · fractionLost = {(100 * lxc.fractionLost).toFixed(2)}%
                </dd>
              </dl>
              <p className="mono text-[10px] text-ink-3 mt-3 border-t border-line/40 pt-2">
                pFailure = 1 − missionSuccess (failure ⇔ any of EVAC, LOCL, CHI &lt; χ*).
                fractionLost = 1 − CHI/100 (NASA JSC-66705 §3.2.4).
              </p>
            </div>
          )}

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
          {state.mission.id === "iss-6mo" && state.kit.scenarioId !== "custom" && (
            <div className="panel">
              <h3 className="label text-ink-1 uppercase tracking-cap mb-4">
                I5 · K15 Validation Comparison
              </h3>
              <IMMValidationCompare outcome={outcome} />
            </div>
          )}
        </div>
      )}

      {/* IMM-50: save / load / export toolbar.
       *   - Load dropdown is ALWAYS visible (loading a saved session brings in
       *     an outcome from Dexie; gating it on outcome would be chicken-and-egg).
       *   - Save and Export buttons mount only when an outcome exists.
       */}
      <div
        className="panel flex flex-wrap items-baseline gap-3 mt-4"
        role="region"
        aria-label="save load export"
      >
        <h3 className="label uppercase tracking-cap text-ink-1 mr-2">
          Session
        </h3>

        {outcome && (
          <button
            type="button"
            aria-label="Save current IMM session"
            className="mono text-xs border border-line/40 px-2 py-1 hover:bg-line/10"
            onClick={async () => {
              try {
                const id = await createIMMSession({
                  candidateId: null,
                  mission: { ...state.mission },
                  crew: state.members.map((m) => ({ ...m })),
                  kit: state.kit,
                  trials: state.trials,
                  seed: state.seed,
                  overrides: {},
                  vulnerabilityMode: "boolean-flags",
                  engine: "monte-carlo",
                  outcomes: outcome,
                  validation: {
                    vsK15Table1: {
                      delta_tme: 0, delta_chi: 0, delta_pEvac: 0, delta_pLocl: 0,
                      within_ci95: false,
                    },
                  },
                  laypersonCaptionsExpanded: {},
                });
                notify(`session saved (id: ${id.slice(0, 8)}…)`, "info");
                reloadRecentSessions();
              } catch (err) {
                notify(`save failed: ${(err as Error).message}`, "error");
              }
            }}
          >
            💾 Save
          </button>
        )}

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
            setOutcome(s.outcomes);
            notify(`session loaded`, "info");
            e.target.value = "";
          }}
        >
          <option value="">— select session —</option>
          {recentSessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.createdAt.slice(0, 19)} · {s.mission.label} · CHI {s.outcomes.chi.mean.toFixed(1)}%
            </option>
          ))}
        </select>

        {outcome && (
          <button
            type="button"
            aria-label="Export current IMM session as JSON"
            className="mono text-xs border border-line/40 px-2 py-1 hover:bg-line/10"
            onClick={() => {
              const payload = {
                mission: state.mission,
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
        )}
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
                <span className="label text-[10px] text-ink-2 uppercase tracking-cap">
                  {r.label}
                </span>
                <span className={"mono text-[12px] " + flagClass} aria-hidden="true">
                  {flagGlyph}
                </span>
                <span className="sr-only">
                  {within ? "within K15 CI₉₅" : "outside K15 CI₉₅"}
                </span>
              </div>
              <span className="mono text-[11px] text-ink-1 tabular-nums">
                {r.value.toFixed(r.decimals)}{r.unit}
              </span>
              <span className="mono text-[10px] text-ink-3 tabular-nums">
                ref {r.ref.toFixed(r.decimals)}{r.unit} · Δ {deltaSign}{deltaAbs}{r.unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
