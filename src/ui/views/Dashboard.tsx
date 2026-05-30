import { useEffect, useState } from "react";
import type { DbCandidate, CandidateStatus } from "@/db/schema";
import { listCandidates, recentSimsFor, deleteCandidate, exportDb, importDb, createCandidate, upsertCriterionEntry } from "@/db/repository";
import { CandidateCard } from "../dashboard/CandidateCard";
import { DashboardSummary, type DashboardSummaryDatum } from "@/ui/figures/DashboardSummary";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { generateCandidate } from "@/engine";

type StatusFilter = "all" | CandidateStatus;

export function Dashboard(props: {
  onNewCandidate: () => void;
  onEditCandidate: (id: string) => void;
  onSimCandidate: (id: string) => void;
}) {
  const [candidates, setCandidates] = useState<DbCandidate[]>([]);
  const [lastChis, setLastChis] = useState<Record<string, number>>({});
  const [summaryData, setSummaryData] = useState<DashboardSummaryDatum[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function reload() {
    const rows = await listCandidates();
    setCandidates(rows);
    // Consolidated loop — one recentSimsFor call per candidate builds both
    // the lastChis card-badge map and the F4 DashboardSummary data array.
    const map: Record<string, number> = {};
    const data: DashboardSummaryDatum[] = [];
    for (const c of rows) {
      const sims = await recentSimsFor(c.id, 1);
      if (sims[0]) {
        map[c.id] = sims[0].posterior.chi.mean;
        data.push({
          candidateId: c.id,
          alias: c.alias,
          chiMean: sims[0].posterior.chi.mean,
          chiCi90: sims[0].posterior.chi.ci90,
        });
      }
    }
    setLastChis(map);
    setSummaryData(data);
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleExport() {
    const dump = await exportDb();
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selectron-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    const text = await file.text();
    const dump = JSON.parse(text) as Parameters<typeof importDb>[0];
    await importDb(dump);
    await reload();
  }

  async function handleGenerateSynthetic() {
    const synth = generateCandidate(PLACEHOLDER_CRITERIA, Math.floor(Math.random() * 1e9), "synth");
    const c = await createCandidate({ alias: synth.alias });
    for (const [criterionId, rawValue] of Object.entries(synth.scores)) {
      await upsertCriterionEntry({
        candidateId: c.id,
        criterionId,
        rawValue,
        citationFree: "synthetic seed",
      });
    }
    await reload();
  }

  const filtered =
    statusFilter === "all"
      ? candidates
      : candidates.filter((c) => c.status === statusFilter);

  const draftCount = candidates.filter((c) => c.status === "draft").length;
  const readyCount = candidates.filter((c) => c.status === "ready").length;

  return (
    <div className="fadein">
      {/* F4 — CHI per candidate lollipop (DashboardSummary) */}
      <div className="panel p-6 mb-6">
        <DashboardSummary data={summaryData} />
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={props.onNewCandidate}
            className="mono uppercase tracking-cap text-[13px] px-4 py-2 border border-signal
              text-signal hover:bg-signal/10 transition-colors rounded-sm"
          >
            + New candidate
          </button>
          <button
            type="button"
            onClick={handleGenerateSynthetic}
            className="mono uppercase tracking-cap text-[13px] px-4 py-2 border border-signal
              text-signal hover:bg-signal/10 transition-colors rounded-sm"
          >
            Generate synthetic
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="mono uppercase tracking-cap text-[13px] px-4 py-2 border border-line
              text-ink-2 hover:border-ink-2 hover:bg-line/20 transition-colors rounded-sm"
          >
            Export
          </button>
          <label
            className="mono uppercase tracking-cap text-[13px] px-4 py-2 border border-line
              text-ink-2 hover:border-ink-2 hover:bg-line/20 transition-colors rounded-sm cursor-pointer"
          >
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleImport(f);
              }}
            />
          </label>
        </div>

        {/* FILTER + STATS */}
        <div className="flex items-center gap-4">
          {/* Status counts */}
          <div className="mono hidden sm:flex items-center gap-3 text-[12px]">
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
              className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5
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
            <div className="mono text-[12px] uppercase tracking-cap text-ink-3">
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
                className="mono uppercase tracking-cap text-[13px] px-5 py-2 border border-signal
                  text-signal hover:bg-signal/10 transition-colors rounded-sm mt-2"
              >
                + New candidate
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
        <div className="mono text-[11px] uppercase tracking-cap text-ink-3 mt-4 text-right">
          sorted by updated · desc
        </div>
      )}
    </div>
  );
}
