import { useEffect, useRef, useState } from "react";
import type { Criterion } from "@/types";
import type { CriterionEntry } from "@/db/schema";
import { useWizard } from "@/contexts/WizardContext";
import { AttachmentList } from "./AttachmentList";
import { EvidenceReference } from "@/ui/figures/EvidenceReference";

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
  const { enqueueCriterionPatch, accessTier } = useWizard();
  const [mode, setMode] = useState<CitationMode>(citationMode(entry));

  const tierInst = criterion.tierInstruments?.[accessTier];
  const instrumentLabel = tierInst?.instrument ?? criterion.instrument;
  const transform = tierInst?.scaleTransform;
  const tierNotes = tierInst?.notes;

  const midpoint = (criterion.scale.min + criterion.scale.max) / 2;
  const stepSize = (criterion.scale.max - criterion.scale.min) / 100;

  // liveValue is the SINGLE SOURCE OF TRUTH for the slider position during
  // drag. Previously the slider was bound to `entry?.rawValue ?? midpoint`,
  // which only updates after the 300 ms debounced IDB flush + reloadFromDb —
  // so during drag the thumb visually snapped back, and the context-wide
  // re-render on every pixel of drag made the UI feel laggy.
  // Now: liveValue drives the visual; the WizardContext patch is committed
  // on pointer-up only (onChange writes to liveValue; onPointerUp/onKeyUp
  // commit to context). This decouples drag-smoothness from autosave debounce.
  const [liveValue, setLiveValue] = useState<number | undefined>(entry?.rawValue);

  // Reconcile local liveValue with entry.rawValue when the DB-side value
  // changes for a reason OTHER than this slider (e.g. tier switch causes a
  // criterion to reappear, or another tab edits). We treat the entry as
  // canonical when the user isn't actively dragging.
  const draggingRef = useRef(false);
  useEffect(() => {
    if (!draggingRef.current && entry?.rawValue !== undefined) {
      setLiveValue(entry.rawValue);
    }
  }, [entry?.rawValue]);

  const currentValue = liveValue ?? entry?.rawValue ?? midpoint;

  function patch(partial: Partial<CriterionEntry>) {
    enqueueCriterionPatch(criterion.id, partial);
  }

  // Commit the slider's current position to the WizardContext (debounced
  // 300 ms IDB write happens downstream). Called on pointerup / keyup —
  // NOT on every onChange — so drag is bounded by browser paint, not by
  // React re-renders cascading through the context.
  function commitSliderValue(raw: number) {
    const transformed = transform?.multiplier ? raw * transform.multiplier : raw;
    patch({ rawValue: transformed });
    draggingRef.current = false;
  }
  // units is not part of the Criterion type in Iter 1 but may be added later
  const units = (criterion.scale as { min: number; max: number; units?: string }).units;

  return (
    <div className="space-y-4 border-l border-line pl-4">
      <div>
        <div className="mono text-[10px] text-ink-3 mb-2">
          instrument · <span className="text-ink-1">{instrumentLabel}</span>
        </div>
        {transform?.note && (
          <p className="mono text-[10px] text-amber-300 leading-relaxed mb-2">
            ⚠ scale transform · {transform.note}
          </p>
        )}
        {tierNotes && (
          <p className="mono text-[10px] text-ink-2 leading-relaxed mb-2">{tierNotes}</p>
        )}
      </div>
      <div>
        <label className="label">
          raw value
          {/* scope-expansion-3 follow-up 2026-05-19: drop "(reversed)" suffix
              from criterion labels; instead, surface the direction inline as a
              plain-English caption right next to the slider. */}
          {criterion.higherIsBetter === false && (
            <span className="ml-2 mono text-[10px] uppercase tracking-cap text-amber-300">
              ↓ lower is better
            </span>
          )}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={criterion.scale.min}
            max={criterion.scale.max}
            step={stepSize}
            value={currentValue}
            onChange={(e) => {
              draggingRef.current = true;
              setLiveValue(parseFloat(e.target.value));
            }}
            onPointerUp={(e) => commitSliderValue(parseFloat((e.target as HTMLInputElement).value))}
            onKeyUp={(e) => commitSliderValue(parseFloat((e.target as HTMLInputElement).value))}
            onBlur={(e) => commitSliderValue(parseFloat(e.target.value))}
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

      <div className="mt-2">
        <EvidenceReference criterion={criterion} enteredValue={liveValue} />
      </div>
    </div>
  );
}
