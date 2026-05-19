import { useEffect, useState } from "react";
import type { DbCandidate, CandidateStatus } from "@/db/schema";
import { listCandidates, recentSimsFor, deleteCandidate } from "@/db/repository";
import { CandidateCard } from "../dashboard/CandidateCard";

type StatusFilter = "all" | CandidateStatus;

export function Dashboard(props: {
  onNewCandidate: () => void;
  onEditCandidate: (id: string) => void;
  onSimCandidate: (id: string) => void;
}) {
  const [candidates, setCandidates] = useState<DbCandidate[]>([]);
  const [lastChis, setLastChis] = useState<Record<string, number>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function reload() {
    const rows = await listCandidates();
    setCandidates(rows);
    const map: Record<string, number> = {};
    for (const c of rows) {
      const sims = await recentSimsFor(c.id, 1);
      if (sims[0]) map[c.id] = sims[0].posterior.chi.mean;
    }
    setLastChis(map);
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered =
    statusFilter === "all"
      ? candidates
      : candidates.filter((c) => c.status === statusFilter);

  const draftCount = candidates.filter((c) => c.status === "draft").length;
  const readyCount = candidates.filter((c) => c.status === "ready").length;

  return (
    <div className="fadein">
      {/* F4 PLACEHOLDER */}
      <div className="panel p-6 mb-6">
        <div className="text-sm text-ink-2">Dashboard summary figure — see Task 68</div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={props.onNewCandidate}
            className="mono uppercase tracking-cap text-[11px] px-4 py-2 border border-signal
              text-signal hover:bg-signal/10 transition-colors rounded-sm"
          >
            + New candidate
          </button>
          <button
            type="button"
            disabled
            className="mono uppercase tracking-cap text-[11px] px-4 py-2 border border-line
              text-ink-3 cursor-not-allowed rounded-sm opacity-50"
          >
            Generate synthetic
          </button>
          <button
            type="button"
            disabled
            className="mono uppercase tracking-cap text-[11px] px-4 py-2 border border-line
              text-ink-3 cursor-not-allowed rounded-sm opacity-50"
          >
            Import
          </button>
          <button
            type="button"
            disabled
            className="mono uppercase tracking-cap text-[11px] px-4 py-2 border border-line
              text-ink-3 cursor-not-allowed rounded-sm opacity-50"
          >
            Export
          </button>
        </div>

        {/* FILTER + STATS */}
        <div className="flex items-center gap-4">
          {/* Status counts */}
          <div className="mono hidden sm:flex items-center gap-3 text-[10px]">
            <span className="text-ink-3">
              total <span className="text-ink-1">{candidates.length}</span>
            </span>
            <span className="text-ink-3">·</span>
            <span className="text-ink-3">
              draft <span className="text-ink-1">{draftCount}</span>
            </span>
            <span className="text-ink-3">·</span>
            <span className="text-go">
              ready <span>{readyCount}</span>
            </span>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <label className="label text-ink-3 hidden sm:block">filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5
                rounded-sm focus:outline-none focus:border-signal cursor-pointer"
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
            </select>
          </div>
        </div>
      </div>

      {/* CANDIDATE GRID */}
      {filtered.length === 0 ? (
        /* EMPTY STATE */
        <div className="panel p-12 fadein">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="mono text-[10px] uppercase tracking-cap text-ink-3">
              {statusFilter !== "all"
                ? `no ${statusFilter} candidates`
                : "no candidates yet"}
            </div>
            <div className="display text-xl text-ink-2">
              {statusFilter !== "all"
                ? "Adjust the filter or create a new candidate."
                : "Begin by creating your first candidate."}
            </div>
            {statusFilter === "all" && (
              <button
                type="button"
                onClick={props.onNewCandidate}
                className="mono uppercase tracking-cap text-[11px] px-5 py-2 border border-signal
                  text-signal hover:bg-signal/10 transition-colors rounded-sm mt-2"
              >
                + New candidate
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              lastChi={lastChis[c.id]}
              onEdit={props.onEditCandidate}
              onSim={props.onSimCandidate}
              onDelete={async (id) => {
                await deleteCandidate(id);
                reload();
              }}
            />
          ))}
        </div>
      )}

      {/* SORT note */}
      {filtered.length > 0 && (
        <div className="mono text-[9px] uppercase tracking-cap text-ink-3 mt-4 text-right">
          sorted by updated · desc
        </div>
      )}
    </div>
  );
}
