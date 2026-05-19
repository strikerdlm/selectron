// scope-expansion-3 (2026-05-19, Task 93): three-button tier selector.
// Lives at the top of the wizard view. Default tier is "minimum".

import type { AccessTier } from "@/types";
import { ACCESS_TIERS, TIER_LABEL, TIER_SHORT_DESCRIPTION } from "@/types";

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
        <span className="mono text-[10px] uppercase tracking-cap text-ink-2">
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
                "mono uppercase tracking-cap text-[11px] px-3 py-2 border rounded-md transition-colors text-left " +
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
    </div>
  );
}
