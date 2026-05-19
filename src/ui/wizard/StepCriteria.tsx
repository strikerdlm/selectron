import { useMemo } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { useWizard } from "@/contexts/WizardContext";
import { CriterionRow, evidenceStatus } from "./CriterionRow";
import { notify } from "@/ui/components/Toast";

export function StepCriteria() {
  const { criterionEntries, markStepCompleted, setStep } = useWizard();

  const byId = useMemo(() => {
    const m: Record<string, (typeof criterionEntries)[number]> = {};
    for (const e of criterionEntries) m[e.criterionId] = e;
    return m;
  }, [criterionEntries]);

  const counts = useMemo(() => {
    let ok = 0;
    let partial = 0;
    let empty = 0;
    for (const c of PLACEHOLDER_CRITERIA) {
      const s = evidenceStatus(byId[c.id]);
      if (s === "ok") ok++;
      else if (s === "partial") partial++;
      else empty++;
    }
    return { ok, partial, empty };
  }, [byId]);

  const anyEmpty = counts.empty > 0;
  const anyPartial = counts.partial > 0;
  const allOk = !anyEmpty && !anyPartial;
  const canAdvance = !anyEmpty;

  return (
    <div className="space-y-4">
      <div className="panel p-4 flex items-baseline justify-between">
        <h2 className="display text-lg">Step 2 — Criteria</h2>
        <span className="mono text-[11px] text-ink-2">
          {counts.ok} ok · {counts.partial} partial · {counts.empty} empty
        </span>
      </div>

      {PLACEHOLDER_CRITERIA.map((c, i) => (
        <CriterionRow key={c.id} criterion={c} entry={byId[c.id]} index={i} />
      ))}

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep(0)}
          className="mono uppercase tracking-cap text-[11px] px-3 py-2 text-ink-2 hover:text-ink-0"
        >
          ← back
        </button>
        <button
          disabled={!canAdvance}
          onClick={() => {
            if (anyPartial && !allOk) {
              notify("warning: some criteria have no citation", "error");
            }
            markStepCompleted(1);
            setStep(2);
          }}
          className={
            "mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-md transition-colors " +
            (canAdvance
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
