// src/ui/components/CrewMemberCard.tsx
// Collapsible card for a single IMM crew member.
// Commit 1: shows collapsed state with status badge + composite score.
// Sliders and per-criterion ECharts figures are added in Commits 2 & 3.

import type { IMMCrewMember } from "../../imm/types";

interface CrewMemberCardProps {
  member: IMMCrewMember;
  compositeScore: number;          // [0, 1] — computed by parent
  gateVerdict: "qualified" | "disqualified";
  failedGates: string[];
  expanded: boolean;
  onToggle: () => void;
  /** Slot for per-criterion sliders — rendered when expanded (Commit 2+). */
  children?: React.ReactNode;
}

export function CrewMemberCard({
  member,
  compositeScore,
  gateVerdict,
  failedGates,
  expanded,
  onToggle,
  children,
}: CrewMemberCardProps) {
  const pct = Math.round(compositeScore * 100);
  const qualified = gateVerdict === "qualified";

  const scoreColor =
    pct >= 70 ? "var(--go)" :
    pct >= 45 ? "var(--signal)" :
    "var(--warn)";

  return (
    <div
      className="panel transition-all duration-200"
      style={{ borderColor: !qualified ? "var(--warn)" : undefined }}
    >
      {/* ── collapsed header (always visible) ─────────────────────────────── */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-4 text-left py-0.5"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`${member.id} — ${qualified ? "qualified" : "disqualified"}, composite ${pct}%`}
      >
        {/* Left cluster */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Gate verdict dot */}
          <span
            className="shrink-0 w-2.5 h-2.5 rounded-full"
            style={{ background: qualified ? "var(--go)" : "var(--warn)" }}
            title={qualified ? "gate passed" : `gate failed: ${failedGates.join(", ")}`}
          />
          {/* Member ID */}
          <span className="mono text-[13px] text-ink-0 truncate">{member.id}</span>
          {/* Sex + EVA meta */}
          <span className="mono text-[10px] text-ink-3 hidden sm:inline uppercase tracking-cap">
            {member.sex} · {member.EVA_eligible ? `${member.EVA_count} EVA` : "no EVA"}
          </span>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-3 shrink-0">
          {/* DQ badge */}
          {!qualified && (
            <span
              className="mono text-[9px] uppercase tracking-cap px-1.5 py-0.5 rounded-full border"
              style={{ color: "var(--warn)", borderColor: "var(--warn)", background: "rgba(255,107,94,0.08)" }}
            >
              DQ
            </span>
          )}
          {/* Composite score */}
          <span
            className="mono text-[14px] tabular-nums font-medium"
            style={{ color: scoreColor }}
          >
            {pct}%
          </span>
          {/* Chevron */}
          <span
            className="mono text-ink-3 text-[11px] transition-transform duration-200"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ›
          </span>
        </div>
      </button>

      {/* ── expanded body (Commit 2+ adds sliders here) ───────────────────── */}
      {expanded && (
        <div className="mt-4 border-t border-line pt-4">
          {/* Member meta row */}
          <div className="mono text-[11px] text-ink-2 flex flex-wrap gap-x-6 gap-y-1 mb-4">
            <span><span className="text-ink-3">sex </span>{member.sex}</span>
            <span><span className="text-ink-3">contacts </span>{member.contacts ? "yes" : "no"}</span>
            <span><span className="text-ink-3">crowns </span>{member.crowns ? "yes" : "no"}</span>
            <span><span className="text-ink-3">CAC+ </span>{member.CAC_positive ? "yes" : "no"}</span>
            <span><span className="text-ink-3">abd. surgery </span>{member.abdominal_surgery_history ? "yes" : "no"}</span>
            <span><span className="text-ink-3">EVA eligible </span>{member.EVA_eligible ? "yes" : "no"}</span>
            {member.EVA_eligible && (
              <span><span className="text-ink-3">EVA count </span>{member.EVA_count}</span>
            )}
          </div>

          {/* Gate failure notice */}
          {!qualified && failedGates.length > 0 && (
            <div
              className="mono text-[11px] rounded border px-3 py-2 mb-4"
              style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(255,107,94,0.06)" }}
            >
              Gate DQ · {failedGates.join(" · ")}
            </div>
          )}

          {/* Per-criterion slider slot (Commit 2+) */}
          {children ?? (
            <p className="mono text-[11px] text-ink-3 italic">
              per-criterion sliders — added in commit 2
            </p>
          )}
        </div>
      )}
    </div>
  );
}
