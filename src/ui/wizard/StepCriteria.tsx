import { useMemo } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { useWizard } from "@/contexts/WizardContext";
import { CriterionRow, evidenceStatus } from "./CriterionRow";
import { notify } from "@/ui/components/Toast";
import { isCriterionAvailableAtTier, TIER_LABEL } from "@/types";

export function StepCriteria() {
  const { criterionEntries, accessTier, markStepCompleted, setStep } = useWizard();

  // Filter to ONLY the criteria available at the user's chosen tier.
  // scope-expansion-3 follow-up (Diego 2026-05-19): "when I change the minimum,
  // medium and elite, the tests do not change. Can we fix that it only displays
  // the needed tests for the minimum, the medium and the Elite."
  const visibleCriteria = useMemo(
    () => PLACEHOLDER_CRITERIA.filter((c) => isCriterionAvailableAtTier(c.minimumTier, accessTier)),
    [accessTier],
  );

  const byId = useMemo(() => {
    const m: Record<string, (typeof criterionEntries)[number]> = {};
    for (const e of criterionEntries) m[e.criterionId] = e;
    return m;
  }, [criterionEntries]);

  const counts = useMemo(() => {
    let ok = 0;
    let partial = 0;
    let empty = 0;
    // Status counts apply to the VISIBLE (tier-active) criteria only — a Tier-1
    // user shouldn't be told they have 4 "empty" criteria for tests they aren't
    // even expected to run.
    for (const c of visibleCriteria) {
      const s = evidenceStatus(byId[c.id]);
      if (s === "ok") ok++;
      else if (s === "partial") partial++;
      else empty++;
    }
    return { ok, partial, empty };
  }, [visibleCriteria, byId]);

  const hiddenCount = PLACEHOLDER_CRITERIA.length - visibleCriteria.length;

  const anyEmpty = counts.empty > 0;
  const anyPartial = counts.partial > 0;
  const allOk = !anyEmpty && !anyPartial;
  const canAdvance = !anyEmpty;

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-lg">Step 2 — Criteria</h2>
          <span className="mono text-[13px] text-ink-2">
            {counts.ok} ok · {counts.partial} partial · {counts.empty} empty
            <span className="text-ink-3"> · {visibleCriteria.length} of {PLACEHOLDER_CRITERIA.length} criteria</span>
          </span>
        </div>
        {hiddenCount > 0 && (
          <p className="mono mt-2 text-[12px] text-ink-3 leading-relaxed">
            tier <span className="text-signal">{TIER_LABEL[accessTier]}</span> shows{" "}
            {visibleCriteria.length} criteria. <span className="text-ink-2">{hiddenCount}</span> additional{" "}
            {hiddenCount === 1 ? "criterion is" : "criteria are"} available at higher tiers
            (switch the Scenario above to see them).
          </p>
        )}
      </div>

      {visibleCriteria.map((c, i) => (
        <CriterionRow key={c.id} criterion={c} entry={byId[c.id]} index={i} />
      ))}

      <div className="flex justify-between gap-3">
        <button
          onClick={() => setStep(0)}
          className="mono uppercase tracking-cap text-[13px] px-3 py-2 text-ink-2 hover:text-ink-0"
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
            "mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-md transition-colors " +
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
