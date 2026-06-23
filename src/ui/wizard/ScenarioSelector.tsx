// scope-expansion-3 (2026-05-19, Task 93): three-button tier selector.
// Lives at the top of the wizard view. Default tier is "minimum".

import type { AccessTier } from "@/types";
import { ACCESS_TIERS, TIER_LABEL, TIER_SHORT_DESCRIPTION, isCriterionAvailableAtTier } from "@/types";
import { ACTIVE_CRITERION_CATALOG } from "@/data/demo-criteria";

type Props = {
  value: AccessTier;
  onChange: (tier: AccessTier) => void;
  disabled?: boolean;
};

export function ScenarioSelector({ value, onChange, disabled = false }: Props) {
  return (
    <div className="panel p-4 border-signal/40 mb-4" role="radiogroup" aria-label="Scenario tier">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="display text-base text-ink-0">Scenario</h3>
        <span className="mono text-[12px] uppercase tracking-cap text-ink-2">
          accessibility tier
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {ACCESS_TIERS.map((tier) => {
          const active = tier === value;
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={TIER_LABEL[tier]}
              disabled={disabled}
              onClick={() => !disabled && onChange(tier)}
              className={
                "mono uppercase tracking-cap text-[13px] px-3 py-2 border rounded-md transition-colors text-left " +
                (active
                  ? "border-signal text-signal bg-signal/10"
                  : disabled
                  ? "border-line text-ink-3 cursor-not-allowed"
                  : "border-line text-ink-2 hover:border-ink-1 hover:text-ink-1")
              }
            >
              {TIER_LABEL[tier]}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-ink-1 leading-relaxed">{TIER_SHORT_DESCRIPTION[value]}</p>

      {/* Educational footer — explains what changes between tiers in plain English.
          Diego scope-expansion-3 follow-up 2026-05-19: "clarify below how the
          computations change." */}
      <div className="mt-3 pt-3 border-t border-line/40 grid grid-cols-3 gap-3">
        {ACCESS_TIERS.map((t) => {
          const count = ACTIVE_CRITERION_CATALOG.criteria.filter((c) =>
            isCriterionAvailableAtTier(c.minimumTier, t),
          ).length;
          const active = t === value;
          return (
            <div
              key={t}
              className={
                "border-l-2 pl-2 mono text-[12px] " +
                (active ? "border-signal text-ink-1" : "border-line text-ink-3")
              }
            >
              <span className="uppercase tracking-cap">{TIER_LABEL[t]}</span>
              <div className="tabular-nums mt-0.5">
                {count} of {ACTIVE_CRITERION_CATALOG.criteria.length} criteria
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 mono text-[12px] text-ink-3 leading-relaxed">
        switching tier changes the instrument implementation for each construct. The
        uncertain-weight MCDA aggregation uses an explicit equal-weight demo prior:
        alpha_k = kappa x m_k, with m_k = 1/K and kappa = K, so the current runtime
        is Dirichlet(1,...,1).
      </p>
    </div>
  );
}
