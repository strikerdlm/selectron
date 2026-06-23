import { useState, useRef, useEffect } from "react";
import type { DbCandidate } from "@/db/schema";

type Props = {
  candidate: DbCandidate;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function CandidateCard({ candidate, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const isDraft = candidate.status === "draft";

  return (
    <div
      className="panel group relative flex flex-col cursor-pointer transition-all duration-150
        hover:border-line-2 hover:bg-bg-2"
      onClick={() => onEdit(candidate.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(candidate.id);
        }
      }}
    >
      {/* TOP — alias + status chip */}
      <div className="flex items-start justify-between px-3 pt-3 pb-2 gap-2">
        <div className="min-w-0 flex-1">
          <div className="display text-sm text-ink-0 truncate leading-tight">{candidate.alias}</div>
          {candidate.fullName && (
            <div className="mono text-[11px] text-ink-3 mt-0.5 truncate">{candidate.fullName}</div>
          )}
        </div>
        <span
          className={
            "mono uppercase tracking-cap text-[10px] shrink-0 px-1.5 py-0.5 border rounded-sm leading-none " +
            (isDraft ? "border-ink-3 text-ink-3" : "border-go/60 text-go")
          }
        >
          {candidate.status}
        </span>
      </div>

      <div className="hairline mx-3" />

      {/* METRICS — status + relative-time in one compact row */}
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <div className="min-w-0">
          <div className="mono text-[11px] text-ink-3 leading-none">stage</div>
          <div className="mono text-[13px] text-ink-2 leading-tight">MCDA</div>
        </div>
        <div className="text-right">
          <div className="mono text-[11px] text-ink-3 leading-none">updated</div>
          <div className="mono text-[13px] text-ink-2 leading-tight">{relativeTime(candidate.updatedAt)}</div>
        </div>
      </div>

      {/* ACTIONS — compact button row */}
      <div
        className="flex items-center justify-between gap-1 px-3 pb-3 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="mono text-[10px] text-ink-3 truncate flex-1">{candidate.id.slice(0, 6)}…</span>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="mono text-[13px] px-1.5 py-0.5 border border-line text-ink-3
                hover:border-ink-2 hover:text-ink-1 transition-colors rounded-sm leading-none"
              aria-label="More options"
            >
              ⋯
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 z-20 panel py-1 min-w-[100px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete(candidate.id);
                  }}
                  className="w-full text-left px-3 py-1.5 mono text-[12px] text-warn
                    hover:bg-warn/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
