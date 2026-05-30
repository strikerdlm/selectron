// src/ui/components/CrewMemberCard.tsx
// Collapsible card for a single IMM crew member.
// Commit 1: collapsed state + status badge + composite score.
// Commit 2: per-criterion sliders + CitationChip (rendered via PerScoreCard in expanded body).
// Commit 3: ECharts mini-figures passed as `figure` prop to PerScoreCard.
// 2026-05-29: optional remove button + editable member fields (sex, risk flags,
//   EVA eligibility / count). These flags drive the IMM sim (risk-factor
//   multipliers + EVA-coupled conditions), so editing them recomputes risk.

import type { IMMCrewMember } from "../../imm/types";
import type { Criterion } from "../../types";
import { PerScoreCard } from "./PerScoreCard";

interface CrewMemberCardProps {
  member: IMMCrewMember;
  compositeScore: number;          // [0, 1] — computed by parent
  gateVerdict: "qualified" | "disqualified";
  failedGates: string[];
  expanded: boolean;
  onToggle: () => void;
  criteria: readonly Criterion[];
  onScoreChange: (memberId: string, criterionId: string, value: number) => void;
  /** Optional per-criterion mini-figure nodes (Commit 3+). Keyed by criterion.id. */
  figures?: Record<string, React.ReactNode>;
  /**
   * Optional. When provided, the expanded body renders editable controls for the
   * member's demographic / risk flags + EVA count (which drive the IMM sim).
   * When omitted, those fields render read-only (backward-compat).
   */
  onMemberChange?: (memberId: string, patch: Partial<IMMCrewMember>) => void;
  /** Optional. When provided, a "remove" control appears in the collapsed header. */
  onRemove?: (memberId: string) => void;
}

export function CrewMemberCard({
  member,
  compositeScore,
  gateVerdict,
  failedGates,
  expanded,
  onToggle,
  criteria,
  onScoreChange,
  figures = {},
  onMemberChange,
  onRemove,
}: CrewMemberCardProps) {
  const pct = Math.round(compositeScore * 100);
  const qualified = gateVerdict === "qualified";

  const scoreColor =
    pct >= 70 ? "var(--go)" :
    pct >= 45 ? "var(--signal)" :
    "var(--warn)";

  const editable = typeof onMemberChange === "function";
  const patch = (p: Partial<IMMCrewMember>) => onMemberChange?.(member.id, p);

  // Compact boolean toggle used for the risk flags + EVA eligibility.
  const FlagToggle = ({ label, field, value }: { label: string; field: keyof IMMCrewMember; value: boolean }) => (
    <label className="mono text-[13px] text-ink-2 inline-flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        className="accent-[var(--signal)] cursor-pointer"
        onChange={(e) => patch({ [field]: e.target.checked } as Partial<IMMCrewMember>)}
      />
      {label}
    </label>
  );

  return (
    <div
      className="panel transition-all duration-200"
      style={{ borderColor: !qualified ? "var(--warn)" : undefined }}
    >
      {/* ── collapsed header (always visible) ─────────────────────────────── */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 min-w-0 flex items-center justify-between gap-4 text-left py-0.5"
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
            <span className="mono text-[15px] text-ink-0 truncate">{member.id}</span>
            {/* Sex + EVA meta */}
            <span className="mono text-[12px] text-ink-3 hidden sm:inline uppercase tracking-cap">
              {member.sex} · {member.EVA_eligible ? `${member.EVA_count} EVA` : "no EVA"}
            </span>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3 shrink-0">
            {/* DQ badge */}
            {!qualified && (
              <span
                className="mono text-[11px] uppercase tracking-cap px-1.5 py-0.5 rounded-full border"
                style={{ color: "var(--warn)", borderColor: "var(--warn)", background: "rgba(255,107,94,0.08)" }}
              >
                DQ
              </span>
            )}
            {/* Composite score */}
            <span
              className="mono text-[16px] tabular-nums font-medium"
              style={{ color: scoreColor }}
            >
              {pct}%
            </span>
            {/* Chevron */}
            <span
              className="mono text-ink-3 text-[13px] transition-transform duration-200"
              style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
            >
              ›
            </span>
          </div>
        </button>

        {/* Remove control — sibling of the toggle (not nested, to keep valid HTML). */}
        {onRemove && (
          <button
            type="button"
            className="shrink-0 mono text-ink-3 hover:text-warn text-[16px] leading-none px-1.5 py-1 rounded
                       border border-line/40 hover:border-warn/60 transition-colors"
            onClick={() => onRemove(member.id)}
            aria-label={`remove crew member ${member.id}`}
            title={`remove ${member.id}`}
          >
            ×
          </button>
        )}
      </div>

      {/* ── expanded body (Commit 2+ adds sliders here) ───────────────────── */}
      {expanded && (
        <div className="mt-4 border-t border-line pt-4">
          {/* Member meta — editable when onMemberChange is provided, else read-only. */}
          {editable ? (
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="mono text-[13px] text-ink-2 inline-flex items-center gap-1.5">
                  <span className="text-ink-3">sex</span>
                  <select
                    value={member.sex}
                    onChange={(e) => patch({ sex: e.target.value as IMMCrewMember["sex"] })}
                    className="mono text-[13px] bg-transparent border border-line rounded px-1.5 py-0.5
                               text-ink-1 focus:border-signal focus:outline-none cursor-pointer"
                    aria-label={`${member.id} sex`}
                  >
                    <option value="male">male</option>
                    <option value="female">female</option>
                  </select>
                </label>
                <FlagToggle label="contacts" field="contacts" value={member.contacts} />
                <FlagToggle label="crowns" field="crowns" value={member.crowns} />
                <FlagToggle label="CAC+" field="CAC_positive" value={member.CAC_positive} />
                <FlagToggle label="abd. surgery" field="abdominal_surgery_history" value={member.abdominal_surgery_history} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="mono text-[13px] text-ink-2 inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={member.EVA_eligible}
                    className="accent-[var(--signal)] cursor-pointer"
                    onChange={(e) =>
                      // Toggling off zeroes EVA_count (the sim's only EVA driver);
                      // toggling on seeds 1 so the count stepper has effect.
                      patch(e.target.checked
                        ? { EVA_eligible: true, EVA_count: member.EVA_count || 1 }
                        : { EVA_eligible: false, EVA_count: 0 })
                    }
                    aria-label={`${member.id} EVA eligible`}
                  />
                  EVA eligible
                </label>
                {member.EVA_eligible && (
                  <label className="mono text-[13px] text-ink-2 inline-flex items-center gap-1.5">
                    <span className="text-ink-3">EVA count</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={member.EVA_count}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(30, Math.round(Number(e.target.value) || 0)));
                        patch({ EVA_count: n });
                      }}
                      className="w-16 mono text-[13px] bg-transparent border border-line rounded px-1.5 py-0.5
                                 text-ink-1 focus:border-signal focus:outline-none tabular-nums"
                      aria-label={`${member.id} EVA count`}
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="mono text-[13px] text-ink-2 flex flex-wrap gap-x-6 gap-y-1 mb-4">
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
          )}

          {/* Gate failure notice */}
          {!qualified && failedGates.length > 0 && (
            <div
              className="mono text-[13px] rounded border px-3 py-2 mb-4"
              style={{ borderColor: "var(--warn)", color: "var(--warn)", background: "rgba(255,107,94,0.06)" }}
            >
              Gate DQ · {failedGates.join(" · ")}
            </div>
          )}

          {/* Per-criterion sliders (Commit 2+) */}
          <div className="flex flex-col gap-3">
            {criteria.map((c) => (
              <PerScoreCard
                key={c.id}
                criterion={c}
                rawScore={member.stageAScores?.[c.id] ?? c.scale.min + 0.5 * (c.scale.max - c.scale.min)}
                onScoreChange={(criterionId, value) => onScoreChange(member.id, criterionId, value)}
                figure={figures[c.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
