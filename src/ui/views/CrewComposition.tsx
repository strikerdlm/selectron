// src/ui/views/CrewComposition.tsx
// IMM Crew Composition view — main surface for crew Stage A score entry,
// live composite aggregation, gate evaluation, and IMM Monte Carlo.
//
// Commit 1: skeleton layout + state + cards (collapsed) + composite panel.
// Commit 2: per-criterion sliders + CitationChip.
// Commit 3: ECharts bell-curve mini-figures.
// Commit 4: Web Worker simulation wiring.
// Commit 5: polish + a11y.

import { useCallback, useMemo, useRef, useState } from "react";
import type { IMMCrewMember, CrewCompositeMethod, IMMOutcome } from "../../imm/types";
import { PLACEHOLDER_CRITERIA } from "../../data/placeholder-criteria";
import { IMM_MISSIONS } from "../../data/imm-missions";
import { IMM_KITS } from "../../imm/kits";
import { aggregateCrewComposite } from "../../imm/composite";
import { evaluateCrewGates } from "../../imm/crew-gates";
import { CrewMemberCard } from "../components/CrewMemberCard";
import { CompositeCrewPanel } from "../components/CompositeCrewPanel";
import { CriterionMiniFigure } from "../figures/CriterionMiniFigure";

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
  mission: typeof IMM_MISSIONS[0];
  kit: typeof IMM_KITS["issHMS"];
  trials: number;
  seed: number;
  aggregator: CrewCompositeMethod;
  chiStar: number;
}

const INITIAL_STATE: CrewState = {
  members: INITIAL_CREW,
  mission: IMM_MISSIONS[0],    // iss-6mo (K15 reference)
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

  return (
    <div className="flex flex-col gap-8">

      {/* ── page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="display text-2xl text-ink-0 tracking-tight">
          Crew Composition
        </h2>
        <span className="label text-signal">IMM · Stage A</span>
        <span className="mono text-[11px] text-ink-3 hidden sm:inline">
          {state.mission.label} · {state.members.length} members
        </span>
      </div>

      {/* ── three-zone layout ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

        {/* Zone 1 — Mission + Kit config (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="panel flex flex-col gap-4">
            <h3 className="label text-ink-1 uppercase tracking-cap">Mission</h3>

            <div className="flex flex-col gap-1.5">
              <label className="label text-[10px] text-ink-2 uppercase tracking-cap">Profile</label>
              <select
                className="mono text-[11px] bg-transparent border border-line rounded px-3 py-1.5
                           text-ink-1 focus:border-signal focus:outline-none cursor-pointer"
                value={state.mission.id}
                onChange={(e) => {
                  const m = IMM_MISSIONS.find((x) => x.id === e.target.value);
                  if (m) setState((s) => ({ ...s, mission: m }));
                }}
              >
                {IMM_MISSIONS.map((m) => (
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
                    onClick={() => setState((s) => ({ ...s, kit: IMM_KITS[k] }))}
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
        <div className="lg:col-span-6 flex flex-col gap-3">
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
        <div className="lg:col-span-3 flex flex-col gap-4">
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
    </div>
  );
}
