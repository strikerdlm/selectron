import { useState } from "react";
import { useWizard } from "@/contexts/WizardContext";
import type { DbCandidate } from "@/db/schema";

export function StepIdentity() {
  const { candidate, enqueueCandidatePatch, markStepCompleted, setStep } = useWizard();
  const [alias, setAlias] = useState(candidate?.alias ?? "");
  const [fullName, setFullName] = useState(candidate?.fullName ?? "");
  const [notes, setNotes] = useState(candidate?.notes ?? "");

  const aliasValid = alias.length >= 2 && alias.length <= 40;

  function commit<K extends "alias" | "fullName" | "notes">(field: K, value: string) {
    if (field === "alias") setAlias(value);
    if (field === "fullName") setFullName(value);
    if (field === "notes") setNotes(value);
    enqueueCandidatePatch({ [field]: value } as Partial<DbCandidate>);
  }

  return (
    <div className="panel p-6 space-y-6">
      <h2 className="display text-lg">Step 1 — Identity</h2>

      <div>
        <label className="label">alias <span className="text-red-300">*</span></label>
        <input
          name="alias"
          value={alias}
          onChange={(e) => commit("alias", e.target.value)}
          maxLength={40}
          className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 placeholder-ink-3 focus:border-signal focus:outline-none"
          placeholder="e.g. crew-alpha-2026"
        />
        {!aliasValid && (
          <p className="mono mt-1 text-[10px] text-red-300">alias must be 2–40 chars</p>
        )}
      </div>

      <div>
        <label className="label">full name (optional)</label>
        <input
          name="fullName"
          value={fullName}
          onChange={(e) => commit("fullName", e.target.value)}
          className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 placeholder-ink-3 focus:border-signal focus:outline-none"
        />
      </div>

      <div>
        <label className="label">notes (optional)</label>
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => commit("notes", e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded-md border border-line bg-bg-1 px-3 py-2 text-sm text-ink-0 placeholder-ink-3 focus:border-signal focus:outline-none"
        />
      </div>

      <p className="mono text-[10px] text-ink-3">
        identity fields are stored client-side only · no data leaves your machine
      </p>

      <div className="flex justify-end gap-3">
        <button
          disabled={!aliasValid}
          onClick={() => {
            markStepCompleted(0);
            setStep(1);
          }}
          className={
            "mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-md transition-colors " +
            (aliasValid
              ? "border-signal text-signal hover:bg-signal/10"
              : "border-line text-ink-3 cursor-not-allowed")
          }
        >
          next →
        </button>
      </div>
    </div>
  );
}
