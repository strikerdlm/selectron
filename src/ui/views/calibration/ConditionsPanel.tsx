import { useEffect, useMemo, useState } from "react";
import type { ConditionSummary, ConditionsListResponse, Provenance } from "@/api/calibration";
import { listConditions } from "@/api/calibration";

const PROVENANCE_META: Record<Provenance, { label: string; color: string }> = {
  "tierA-nasa": { label: "NASA-attributed", color: "text-sky-400" },
  "tierB-lit": { label: "Lit", color: "text-signal" },
  "tierB-pymc": { label: "Fitted", color: "text-signal-bright" },
  "tierC-synth": { label: "Synth", color: "text-ink-3" },
  "user-custom": { label: "Custom", color: "text-ink-2" },
};

function provenanceBadge(p: Provenance) {
  const meta = PROVENANCE_META[p] ?? { label: p, color: "text-ink-2" };
  return (
    <span className={`mono text-[12px] uppercase tracking-cap ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// The Status column reflects HOW a condition's prior was produced, not its quality.
// Public NASA papers do not expose per-condition iMED rates, so tier-A rows are
// NASA-publication-attributed Selectron priors rather than authoritative NASA
// database values.
function statusCell(c: ConditionSummary) {
  if (c.fitted) {
    return (
      <span
        className="flex items-center gap-1.5"
        title="Posterior fitted by the analytic Gamma-Poisson solution from terrestrial epidemiological base rates."
      >
        <span className="w-2 h-2 rounded-full bg-sky-400" />
        <span className="mono text-[12px] uppercase tracking-cap text-sky-400">Fitted</span>
      </span>
    );
  }
  if (c.fittable) {
    return (
      <span
        className="flex items-center gap-1.5"
        title="Tier-B literature prior eligible for analytic Gamma-Poisson fitting; not yet fitted."
      >
        <span className="w-2 h-2 rounded-full bg-go" />
        <span className="mono text-[12px] uppercase tracking-cap text-go">Fittable</span>
      </span>
    );
  }
  if (c.provenance === "tierA-nasa") {
    return (
      <span
        className="flex items-center gap-1.5"
        title="NASA-publication-attributed Selectron prior. Public IMM papers do not expose per-condition iMED rates; no release refit is run for this tier."
      >
        <span className="w-2 h-2 rounded-full bg-sky-400/60" />
        <span className="mono text-[12px] uppercase tracking-cap text-sky-400/80">NASA-attributed</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-line-2" />
      <span className="mono text-[12px] uppercase tracking-cap text-ink-3">—</span>
    </span>
  );
}

export function ConditionsPanel() {
  const [data, setData] = useState<ConditionsListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterProv, setFilterProv] = useState<Provenance | "all">("all");
  const [sortKey, setSortKey] = useState<"id" | "prov">("id");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listConditions();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data.conditions;
    if (filterProv !== "all") rows = rows.filter((c) => c.provenance === filterProv);
    if (sortKey === "id") {
      rows = [...rows].sort((a, b) => a.condition_id.localeCompare(b.condition_id));
    } else {
      rows = [...rows].sort((a, b) => a.provenance.localeCompare(b.provenance));
    }
    return rows;
  }, [data, filterProv, sortKey]);

  const provCounts = useMemo(() => {
    const map: Partial<Record<Provenance, number>> & { all: number } = { all: data?.n_total ?? 0 };
    if (!data) return map;
    for (const c of data.conditions) {
      map[c.provenance] = (map[c.provenance] ?? 0) + 1;
    }
    return map;
  }, [data]);

  if (loading) {
    return (
      <div className="panel p-12 text-center fadein">
        <p className="mono text-[13px] uppercase tracking-cap text-ink-2">loading conditions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel p-12 text-center fadein">
        <p className="mono text-[13px] uppercase tracking-cap text-warn">{error}</p>
        <p className="text-ink-3 mt-2">Is the Python API running on localhost:8000?</p>
      </div>
    );
  }

  return (
    <div className="fadein space-y-6">
      {/* Summary header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-x-3">
          <h3 className="display text-xl text-ink-0 tracking-tight">Conditions</h3>
          <span className="label text-ink-3">
            {data?.n_total} total · {data?.n_fitted ?? 0} fitted · {provCounts["tierA-nasa"] ?? 0} NASA-attributed · {data?.n_fittable} fittable
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="label text-ink-3 hidden sm:block">provenance</label>
          <select
            value={filterProv}
            onChange={(e) => setFilterProv(e.target.value as Provenance | "all")}
            className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal cursor-pointer"
          >
            <option value="all">All ({provCounts.all})</option>
            {(
              [
                "tierA-nasa",
                "tierB-lit",
                "tierB-pymc",
                "tierC-synth",
                "user-custom",
              ] as Provenance[]
            ).map((p) => (
              <option key={p} value={p}>
                {PROVENANCE_META[p].label} ({provCounts[p] ?? 0})
              </option>
            ))}
          </select>
          <label className="label text-ink-3 hidden sm:block">sort</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as "id" | "prov")}
            className="mono text-[13px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal cursor-pointer"
          >
            <option value="id">ID</option>
            <option value="prov">Provenance</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line">
              {["Condition", "Provenance", "Distribution", "Status"].map((h) => (
                <th
                  key={h}
                  className="label px-4 py-3 text-ink-3 sticky top-0 bg-bg-1"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.condition_id}
                className="border-b border-line/50 hover:bg-bg-2/50 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <div className="mono text-[13px] text-ink-0">{c.condition_id}</div>
                  <div className="mono text-[12px] text-ink-3">{c.display_name}</div>
                </td>
                <td className="px-4 py-2.5">{provenanceBadge(c.provenance)}</td>
                <td className="px-4 py-2.5">
                  <span className="mono text-[13px] text-ink-2">{c.distribution}</span>
                </td>
                <td className="px-4 py-2.5">{statusCell(c)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="mono text-[13px] uppercase tracking-cap text-ink-3">no conditions match the filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
