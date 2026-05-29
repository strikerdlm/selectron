import { HEALTH_SUPPORT_TIERS } from "../../imm/health-support";
import { IMM_KITS } from "../../imm/kits";
import type { IMMKitScenario } from "../../imm/types";

type Props = {
  selectedId: IMMKitScenario["scenarioId"];
  onSelect: (kit: IMMKitScenario) => void;
};

const TELE_LABEL = { none: "no telemed", audio: "audio", video: "video telemed" } as const;
const PROV_LABEL = { none: "no provider", cmo: "CMO", physician: "physician" } as const;

export function HealthSupportTierPicker({ selectedId, onSelect }: Props) {
  return (
    <div role="radiogroup" aria-label="Health support tier" className="grid grid-cols-2 gap-2">
      {HEALTH_SUPPORT_TIERS.map((t) => {
        const active = selectedId === t.tierId;
        const kit = IMM_KITS[t.tierId as "none" | "medium" | "issHMS" | "unlimited"];
        return (
          <button
            key={t.tierId}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.label}
            onClick={() => onSelect(kit)}
            className={
              "panel relative text-left p-3 transition-all duration-150 cursor-pointer " +
              (active
                ? "border-signal bg-signal/5 ring-1 ring-signal/40 shadow-[0_0_24px_rgba(245,181,65,0.18)]"
                : "hover:border-line-2 hover:bg-bg-2")
            }
          >
            <div className="mono text-[9px] uppercase tracking-cap text-ink-3 mb-1">
              Level of Care {t.levelOfCare}
            </div>
            <div className="display text-sm text-ink-0 leading-tight">{t.label}</div>
            <div className="mono text-[10px] text-ink-2 mt-1 flex flex-wrap gap-x-2">
              <span>{TELE_LABEL[t.capabilities.telemedicine]}</span>
              <span>·</span>
              <span>{PROV_LABEL[t.capabilities.provider]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
