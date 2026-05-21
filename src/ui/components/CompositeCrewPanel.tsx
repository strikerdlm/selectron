// src/ui/components/CompositeCrewPanel.tsx
// Displays crew-level composite score + gate verdict + aggregator method selector.
// No simulation output yet — that lands in Commit 4.

import type { CrewCompositeMethod } from "../../imm/types";

interface CompositeCrewPanelProps {
  compositeScore: number;          // [0, 1]
  perMemberScores: number[];       // same order as crew array
  weakestMemberId: string | null;
  method: CrewCompositeMethod;
  crewVerdict: "qualified" | "disqualified";
  disqualifiedMemberIds: string[];
  onMethodChange: (m: CrewCompositeMethod) => void;
}

const METHOD_LABELS: Record<CrewCompositeMethod, string> = {
  "mean": "Arithmetic mean",
  "worst-link": "Worst-link (min)",
  "geometric-mean": "Geometric mean",
};

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "var(--go)" :
    pct >= 45 ? "var(--signal)" :
    "var(--warn)";
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
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
}: CompositeCrewPanelProps) {
  const pct = Math.round(compositeScore * 100);
  const qualified = crewVerdict === "qualified";

  return (
    <div className="panel flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="label text-ink-1 uppercase tracking-cap">Crew Composite</h3>
        {/* Gate verdict badge */}
        <span
          className="mono text-[10px] uppercase tracking-cap px-2 py-0.5 rounded-full border"
          style={{
            color: qualified ? "var(--go)" : "var(--warn)",
            borderColor: qualified ? "var(--go)" : "var(--warn)",
            background: qualified ? "rgba(86,214,160,0.08)" : "rgba(255,107,94,0.08)",
          }}
        >
          {qualified ? "✓ qualified" : "✗ disqualified"}
        </span>
      </div>

      {/* Big score display */}
      <div className="flex items-end gap-3">
        <span
          className="display text-5xl tabular-nums"
          style={{ color: pct >= 70 ? "var(--go)" : pct >= 45 ? "var(--signal)" : "var(--warn)" }}
        >
          {pct}
        </span>
        <span className="mono text-lg text-ink-2 pb-1">/ 100</span>
      </div>

      <ScoreBar value={compositeScore} />

      {/* Aggregation method selector */}
      <div className="flex flex-col gap-1.5">
        <label className="label text-ink-2 text-[10px] uppercase tracking-cap">
          Aggregation method
        </label>
        <select
          className="mono text-[12px] bg-transparent border border-line rounded px-3 py-1.5
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
          className="mono text-[11px] border rounded px-3 py-2 text-ink-2"
          style={{ borderColor: "var(--signal)", background: "rgba(245,181,65,0.06)" }}
        >
          <span className="text-ink-3">weakest · </span>
          <span className="text-ink-1">{weakestMemberId}</span>
        </div>
      )}

      {/* DQ member list */}
      {disqualifiedMemberIds.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="label text-[10px] uppercase tracking-cap" style={{ color: "var(--warn)" }}>
            Gate failures
          </span>
          {disqualifiedMemberIds.map((id) => (
            <div
              key={id}
              className="mono text-[11px] border rounded px-3 py-1.5"
              style={{ borderColor: "var(--warn)", background: "rgba(255,107,94,0.06)", color: "var(--warn)" }}
            >
              {id}
            </div>
          ))}
        </div>
      )}

      {/* Run simulation placeholder — wired in Commit 4 */}
      <button
        disabled
        className="mono mt-2 w-full rounded border border-line px-4 py-2 text-[12px]
                   uppercase tracking-cap text-ink-3 cursor-not-allowed opacity-50"
      >
        ▶ run simulation — coming in commit 4
      </button>
    </div>
  );
}
