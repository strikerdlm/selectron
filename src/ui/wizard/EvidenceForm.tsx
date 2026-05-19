import { useState } from "react";
import type { Criterion } from "@/types";
import type { CriterionEntry } from "@/db/schema";
import { useWizard } from "@/contexts/WizardContext";
import { AttachmentList } from "./AttachmentList";

type CitationMode = "doi" | "url" | "free";

function citationMode(entry?: CriterionEntry): CitationMode {
  if (entry?.citationDoi) return "doi";
  if (entry?.citationUrl) return "url";
  return "free";
}

export function EvidenceForm({
  criterion,
  entry,
}: {
  criterion: Criterion;
  entry?: CriterionEntry;
}) {
  const { enqueueCriterionPatch } = useWizard();
  const [mode, setMode] = useState<CitationMode>(citationMode(entry));

  function patch(partial: Partial<CriterionEntry>) {
    enqueueCriterionPatch(criterion.id, partial);
  }

  const midpoint = (criterion.scale.min + criterion.scale.max) / 2;
  const stepSize = (criterion.scale.max - criterion.scale.min) / 100;
  const currentValue = entry?.rawValue ?? midpoint;
  // units is not part of the Criterion type in Iter 1 but may be added later
  const units = (criterion.scale as { min: number; max: number; units?: string }).units;

  return (
    <div className="space-y-4 border-l border-line pl-4">
      <div>
        <label className="label">raw value</label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={criterion.scale.min}
            max={criterion.scale.max}
            step={stepSize}
            value={currentValue}
            onChange={(e) => patch({ rawValue: parseFloat(e.target.value) })}
            className="flex-1 accent-signal"
          />
          <span className="mono tabular-nums text-ink-0 min-w-[3rem] text-right">
            {currentValue.toFixed(1)}
          </span>
        </div>
        <p className="mono mt-1 text-[10px] text-ink-3">
          scale: {criterion.scale.min}–{criterion.scale.max}
          {units ? ` ${units}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">instrument</label>
          <input
            value={entry?.instrument ?? ""}
            onChange={(e) => patch({ instrument: e.target.value })}
            className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <label className="label">measurement date</label>
          <input
            type="date"
            value={entry?.measurementDate ?? ""}
            onChange={(e) => patch({ measurementDate: e.target.value })}
            className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="label">citation</label>
        <div className="flex items-center gap-4 mt-1 mb-2">
          {(["doi", "url", "free"] as const).map((m) => (
            <label key={m} className="mono text-[11px] text-ink-1 flex items-center gap-2">
              <input
                type="radio"
                name={`cite-${criterion.id}`}
                checked={mode === m}
                onChange={() => {
                  setMode(m);
                  patch({
                    citationDoi: m === "doi" ? (entry?.citationDoi ?? "") : undefined,
                    citationUrl: m === "url" ? (entry?.citationUrl ?? "") : undefined,
                    citationFree: m === "free" ? (entry?.citationFree ?? "") : undefined,
                  });
                }}
              />
              {m === "doi" ? "DOI" : m === "url" ? "URL" : "Freeform"}
            </label>
          ))}
        </div>
        {mode === "doi" && (
          <input
            value={entry?.citationDoi ?? ""}
            onChange={(e) => patch({ citationDoi: e.target.value })}
            placeholder="10.1234/abcd"
            className="block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
          />
        )}
        {mode === "url" && (
          <input
            value={entry?.citationUrl ?? ""}
            onChange={(e) => patch({ citationUrl: e.target.value })}
            placeholder="https://..."
            className="block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
          />
        )}
        {mode === "free" && (
          <input
            value={entry?.citationFree ?? ""}
            onChange={(e) => patch({ citationFree: e.target.value })}
            placeholder="report ref, archive id, etc."
            className="block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
          />
        )}
      </div>

      <div>
        <label className="label">notes</label>
        <textarea
          rows={3}
          value={entry?.notes ?? ""}
          onChange={(e) => patch({ notes: e.target.value })}
          className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 focus:border-signal focus:outline-none"
        />
      </div>

      {entry && <AttachmentList entry={entry} />}
      {!entry && (
        <p className="mono text-[10px] text-ink-3">
          save raw value to enable attachments
        </p>
      )}
    </div>
  );
}
