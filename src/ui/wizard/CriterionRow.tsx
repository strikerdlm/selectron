import { useState } from "react";
import type { Criterion } from "@/types";
import type { CriterionEntry } from "@/db/schema";
import { EvidenceForm } from "./EvidenceForm";

export type CriterionRowStatus = "ok" | "partial" | "empty";

export function evidenceStatus(entry?: CriterionEntry): CriterionRowStatus {
  if (!entry || entry.rawValue === undefined || entry.rawValue === null) return "empty";
  const hasCite = !!(entry.citationDoi || entry.citationUrl || entry.citationFree);
  return hasCite ? "ok" : "partial";
}

const dotColor: Record<CriterionRowStatus, string> = {
  ok: "bg-signal",
  partial: "bg-amber-400",
  empty: "bg-line",
};

export function CriterionRow({
  criterion,
  entry,
  index,
}: {
  criterion: Criterion;
  entry?: CriterionEntry;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const status = evidenceStatus(entry);

  return (
    <div className="panel p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-baseline justify-between text-left"
      >
        <span className="flex items-baseline gap-3">
          <span className={`inline-block h-[8px] w-[8px] rounded-full ${dotColor[status]}`} />
          <span className="mono text-[11px] text-ink-3">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-ink-0">{criterion.label}</span>
        </span>
        <span className="mono text-[11px] tabular-nums text-ink-2">
          {entry?.rawValue !== undefined && entry?.rawValue !== null
            ? `${entry.rawValue.toFixed(1)} / ${criterion.scale.max}`
            : "—"}
          <span className="ml-3 text-ink-3">{open ? "▴" : "▾"}</span>
        </span>
      </button>
      {open && (
        <div className="mt-4">
          <EvidenceForm criterion={criterion} entry={entry} />
        </div>
      )}
    </div>
  );
}
