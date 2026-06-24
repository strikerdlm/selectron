// src/ui/components/CompositeCrewPanel.tsx
// Displays crew-level composite score + gate verdict + aggregator method selector.
// CC-4: Run Simulation button + IMMOutcome results panel.

import type { CrewCompositeMethod, IMMOutcome, PosteriorSummary } from "../../imm/types";

interface CompositeCrewPanelProps {
  compositeScore: number;          // [0, 1]
  perMemberScores: number[];       // same order as crew array
  weakestMemberId: string | null;
  method: CrewCompositeMethod;
  crewVerdict: "qualified" | "disqualified";
  disqualifiedMemberIds: string[];
  onMethodChange: (m: CrewCompositeMethod) => void;
  /** CC-4: simulation state */
  simState: "idle" | "running" | "done" | "error";
  simError?: string;
  outcome?: IMMOutcome;
  onRunSim: () => void;
}

const METHOD_LABELS: Record<CrewCompositeMethod, string> = {
  "mean": "Arithmetic mean",
  "worst-link": "Worst-link (min)",
  "geometric-mean": "Geometric mean",
};

/** Single IMM outcome metric display row.
 *
 * F11: outcome metrics are rendered in a NEUTRAL color. Stage A is demo-only
 * and outcome priors are unadjudicated (0 / 4,846 accepted parameter paths),
 * so favorable/intermediate/warning color bands would falsely imply
 * validated decision thresholds. `goodIsHigh` is retained only to mark the
 * direction-of-good in the accessible label; policy thresholds, if ever
 * defined, must live in a separately versioned, cited configuration rather
 * than in this presentation logic.
 */
function ResultMetric({
  label,
  summary,
  unit = "%",
  goodIsHigh = false,
}: {
  label: string;
  summary: PosteriorSummary;
  unit?: string;
  goodIsHigh?: boolean;
}) {
  const mean = summary.mean;
  const [lo, hi] = summary.ci95;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="mono text-[12px] text-ink-2 uppercase tracking-cap">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span
          className="mono text-[16px] tabular-nums font-medium"
          style={{ color: "var(--ink-1)" }}
          aria-label={`${label}: ${mean.toFixed(1)}${unit} (higher is ${goodIsHigh ? "better" : "worse"})`}
        >
          {mean.toFixed(1)}{unit}
        </span>
        <span className="mono text-[11px] text-ink-3">
          [{lo.toFixed(1)}, {hi.toFixed(1)}]
        </span>
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  // F11: neutral bar — no implied favorable/warning bands.
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: "var(--ink-2)" }}
      />
    </div>
  );
}

export function CompositeCrewPanel({
  compositeScore,
  perMemberScores: _perMemberScores,
  weakestMemberId,
  method,
  crewVerdict,
  disqualifiedMemberIds,
  onMethodChange,
  simState,
  simError,
  outcome,
  onRunSim,
}: CompositeCrewPanelProps) {
  const pct = Math.round(compositeScore * 100);
  const qualified = crewVerdict === "qualified";
  const thresholdFlagLabel = qualified
    ? "no demo-threshold flags"
    : "demo-threshold review flag present";

  return (
    <div className="panel flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="label text-ink-1 uppercase tracking-cap">Crew Composite</h3>
        {/* Gate verdict badge */}
        <span
          className="mono text-[12px] uppercase tracking-cap px-2 py-0.5 rounded-full border"
          style={{
            color: qualified ? "var(--ink-2)" : "var(--warn)",
            borderColor: qualified ? "var(--line)" : "var(--warn)",
            background: qualified ? "transparent" : "rgba(255,107,94,0.08)",
          }}
        >
          {thresholdFlagLabel}
        </span>
      </div>

      {/* Big score display — F11: neutral color; Stage A is demo-only, so no
          implied favorable/intermediate/warning band. */}
      <div className="flex items-end gap-3">
        <span
          className="display text-5xl tabular-nums"
          style={{ color: "var(--ink-0)" }}
        >
          {pct}
        </span>
        <span className="mono text-lg text-ink-2 pb-1">/ 100</span>
      </div>

      <ScoreBar value={compositeScore} />

      {/* Aggregation method selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="crew-composite-aggregator" className="label text-ink-2 text-[12px] uppercase tracking-cap">
          Aggregation method
        </label>
        <select
          id="crew-composite-aggregator"
          aria-label="Aggregation method"
          className="mono text-[14px] bg-transparent border border-line rounded px-3 py-1.5
                     text-ink-1 cursor-pointer focus:border-signal focus:outline-none"
          value={method}
          onChange={(e) => onMethodChange(e.target.value as CrewCompositeMethod)}
        >
          {(["mean", "worst-link", "geometric-mean"] as CrewCompositeMethod[]).map((m) => (
            <option key={m} value={m}>
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
      </div>

      {/* Weakest link callout */}
      {weakestMemberId && (
        <div
          className="mono text-[13px] border rounded px-3 py-2 text-ink-2"
          style={{ borderColor: "var(--signal)", background: "rgba(245,181,65,0.06)" }}
        >
          <span className="text-ink-3">weakest · </span>
          <span className="text-ink-1">{weakestMemberId}</span>
        </div>
      )}

      {/* DQ member list */}
      {disqualifiedMemberIds.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="label text-[12px] uppercase tracking-cap" style={{ color: "var(--warn)" }}>
            Demo-threshold review flags
          </span>
          {disqualifiedMemberIds.map((id) => (
            <div
              key={id}
              className="mono text-[13px] border rounded px-3 py-1.5"
              style={{ borderColor: "var(--warn)", background: "rgba(255,107,94,0.06)", color: "var(--warn)" }}
            >
              {id}
            </div>
          ))}
        </div>
      )}

      {/* Run Simulation button */}
      <button
        type="button"
        disabled={simState === "running"}
        className="mono mt-2 w-full rounded border px-4 py-2 text-[14px]
                   uppercase tracking-cap transition-colors"
        style={{
          borderColor: simState === "running" ? "var(--line)" : "var(--signal)",
          color: simState === "running" ? "var(--ink-3)" : "var(--signal)",
          background: simState === "running" ? "transparent" : "rgba(245,181,65,0.06)",
          cursor: simState === "running" ? "not-allowed" : "pointer",
        }}
        onClick={onRunSim}
        aria-label="run IMM Monte Carlo simulation"
      >
        {simState === "running" ? "⟳ simulating…" : "▶ run simulation"}
      </button>

      {/* Simulation error */}
      {simState === "error" && simError && (
        <div
          className="mono text-[12px] rounded border px-3 py-2 mt-1"
          style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(255,107,94,0.06)" }}
        >
          sim error: {simError}
        </div>
      )}

      {/* IMMOutcome results panel */}
      {simState === "done" && outcome && (
        <div className="border-t border-line pt-4 mt-1 flex flex-col gap-3">
          <h4 className="label text-[12px] text-ink-2 uppercase tracking-cap">
            IMM Results · CI₉₅
          </h4>

          <div className="flex flex-col gap-2">
            <ResultMetric
              label="Health Criterion"
              summary={outcome.healthCriterionAttainment ?? outcome.missionSuccess}
              unit="%"
              goodIsHigh
            />
            <ResultMetric
              label="CHI (crew health index)"
              summary={outcome.chi}
              unit="%"
              goodIsHigh
            />
            <ResultMetric
              label="P(evacuation)"
              summary={outcome.pEvac}
              unit="%"
              goodIsHigh={false}
            />
            <ResultMetric
              label="P(loss of crew life)"
              summary={outcome.pLocl}
              unit="%"
              goodIsHigh={false}
            />
            <div className="border-t border-line pt-2">
              <ResultMetric
                label="Total Medical Events"
                summary={outcome.tme}
                unit=" TME"
                goodIsHigh={false}
              />
            </div>
          </div>

          {/* Convergence info */}
          <div className="mono text-[11px] text-ink-3 mt-1">
            σ CHI {(outcome.convergence.sigmaChi.at(-1) ?? 0).toFixed(3)} ·{" "}
            σ P(evac) {(outcome.convergence.sigmaPevac.at(-1) ?? 0).toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}
