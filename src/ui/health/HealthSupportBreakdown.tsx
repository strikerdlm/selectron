import { useState, type ReactNode } from "react";
import {
  HEALTH_SUPPORT_TIERS, HEALTH_SUPPORT_ITEMS, deliverability, classOf,
} from "../../imm/health-support";
import type { IMMKitScenario } from "../../imm/types";

type Props = { tierId: IMMKitScenario["scenarioId"] };

/**
 * Care-capability dashboard for the selected health-support tier.
 *
 * Layout (Diego 2026-05-29): a single top-level collapse — COLLAPSED BY DEFAULT —
 * that opens into a compact dashboard: a 2-up grid of capability cards
 * (telemedicine / ground support + onboard provider) over two collapsible
 * item lists (medication formulary + procedures & equipment). When collapsed it
 * shows an at-a-glance summary line so the panel stays useful without expanding.
 */
export function HealthSupportBreakdown({ tierId }: Props) {
  const tier = HEALTH_SUPPORT_TIERS.find((t) => t.tierId === tierId)!;
  const meds = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "medications");
  const procs = HEALTH_SUPPORT_ITEMS.filter((i) => i.category === "procedures");

  const isDeliverable = (id: string) => deliverability(classOf(id), tierId) > 0;
  const medsOk = meds.filter((i) => isDeliverable(i.id)).length;
  const procsOk = procs.filter((i) => isDeliverable(i.id)).length;

  // Top-level dashboard collapse — collapsed by default (Diego 2026-05-29).
  const [open, setOpen] = useState(false);
  // Per-list collapse (medications / procedures). Open once the dashboard expands.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const Section = ({ id, title, count, children }: { id: string; title: string; count: string; children: ReactNode }) => {
    const sectionOpen = !collapsed.has(id);
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-expanded={sectionOpen}
          className="flex items-center justify-between gap-1.5 label text-[12px] text-ink-2 uppercase tracking-cap mt-2 hover:text-ink-1 cursor-pointer text-left"
        >
          <span className="flex items-center gap-1.5">
            <span className="mono text-ink-3 inline-block w-3" aria-hidden>{sectionOpen ? "▾" : "▸"}</span>
            {title}
          </span>
          <span className="mono text-[11px] text-ink-3 normal-case tracking-normal">{count}</span>
        </button>
        {sectionOpen && <div className="pl-3">{children}</div>}
      </div>
    );
  };

  const Item = ({ item }: { item: typeof HEALTH_SUPPORT_ITEMS[number] }) => {
    const cls = classOf(item.id);
    const deliver = isDeliverable(item.id);
    return (
      <div
        data-deliverable={deliver ? "true" : "false"}
        className={"flex items-center justify-between gap-2 mono text-[13px] py-0.5 " +
          (deliver ? "text-ink-1" : "text-ink-3 opacity-50")}
      >
        <span>{item.label}</span>
        <span className="flex items-center gap-1.5">
          {!deliver && <span className="text-[11px] uppercase text-warn">needs {cls}</span>}
          <span className="text-[11px] text-ink-3" title={item.source_ref}>[{item.source_ref}]</span>
        </span>
      </div>
    );
  };

  const CapabilityCard = ({ title, body }: { title: string; body: string }) => (
    <div className="rounded border border-line/40 bg-bg-1/40 px-2.5 py-2 flex flex-col gap-0.5">
      <span className="label text-[11px] text-ink-3 uppercase tracking-cap">{title}</span>
      <span className="mono text-[13px] text-ink-1 leading-snug">{body}</span>
    </div>
  );

  return (
    <div className="panel flex flex-col gap-1 text-left">
      {/* Dashboard header — toggles the whole breakdown (collapsed by default). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between gap-2 label text-[12px] text-ink-2 uppercase tracking-cap hover:text-ink-1 cursor-pointer text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="mono text-ink-3 inline-block w-3" aria-hidden>{open ? "▾" : "▸"}</span>
          Care capability
        </span>
        <span className="mono text-[11px] text-ink-3 normal-case tracking-normal">{tier.label}</span>
      </button>

      {/* Collapsed summary — at-a-glance dashboard line. */}
      {!open && (
        <p className="mono text-[12px] text-ink-3 leading-snug">
          Telemedicine: {tier.capabilities.telemedicine} · meds {medsOk}/{meds.length} · procedures {procsOk}/{procs.length} deliverable
        </p>
      )}

      {/* Expanded dashboard. */}
      {open && (
        <div className="flex flex-col gap-2 mt-1">
          <div className="grid grid-cols-2 gap-2">
            <CapabilityCard
              title="Telemedicine / ground support"
              body={`${tier.capabilities.telemedicine} · ground flight-surgeon link`}
            />
            <CapabilityCard title="Onboard provider" body={tier.capabilities.provider} />
          </div>

          <Section id="medications" title="Medication formulary" count={`${medsOk}/${meds.length}`}>
            {meds.map((i) => <Item key={i.id} item={i} />)}
          </Section>
          <Section id="procedures" title="Procedures &amp; equipment" count={`${procsOk}/${procs.length}`}>
            {procs.map((i) => <Item key={i.id} item={i} />)}
          </Section>

          <p className="mono text-[11px] text-ink-3 mt-1">Sources → research/2026-05-28_health_support_sourcing.md</p>
        </div>
      )}
    </div>
  );
}
