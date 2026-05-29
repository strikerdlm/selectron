import {
  HEALTH_SUPPORT_TIERS, HEALTH_SUPPORT_ITEMS, deliverability,
} from "../../imm/health-support";
import type { IMMKitScenario } from "../../imm/types";

type Props = { tierId: IMMKitScenario["scenarioId"] };

function CategoryHeader({ children }: { children: React.ReactNode }) {
  return <h4 className="label text-[10px] text-ink-2 uppercase tracking-cap mt-3 mb-1">{children}</h4>;
}

export function HealthSupportBreakdown({ tierId }: Props) {
  const tier = HEALTH_SUPPORT_TIERS.find((t) => t.tierId === tierId)!;
  const meds = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "medications");
  const procs = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "procedures");

  const Item = ({ item }: { item: typeof HEALTH_SUPPORT_ITEMS[number] }) => {
    const deliver = deliverability(item.deliveryClass, tierId) > 0;
    return (
      <div
        data-deliverable={deliver ? "true" : "false"}
        className={"flex items-center justify-between gap-2 mono text-[11px] py-0.5 " +
          (deliver ? "text-ink-1" : "text-ink-3 opacity-50")}
      >
        <span>{item.label}</span>
        <span className="flex items-center gap-1.5">
          {!deliver && <span className="text-[9px] uppercase text-warn">needs {item.deliveryClass}</span>}
          <span className="text-[9px] text-ink-3" title={item.source_ref}>[{item.source_ref}]</span>
        </span>
      </div>
    );
  };

  return (
    <div className="panel flex flex-col gap-1 text-left">
      <CategoryHeader>Telemedicine / ground support</CategoryHeader>
      <p className="mono text-[11px] text-ink-1">{tier.capabilities.telemedicine} · ground flight-surgeon link</p>
      <CategoryHeader>Onboard provider</CategoryHeader>
      <p className="mono text-[11px] text-ink-1">{tier.capabilities.provider}</p>
      <CategoryHeader>Medication formulary</CategoryHeader>
      {meds.map((i) => <Item key={i.id} item={i} />)}
      <CategoryHeader>Procedures &amp; equipment</CategoryHeader>
      {procs.map((i) => <Item key={i.id} item={i} />)}
      <p className="mono text-[9px] text-ink-3 mt-2">Sources → research/2026-05-28_health_support_sourcing.md</p>
    </div>
  );
}
