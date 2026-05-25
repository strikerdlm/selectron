import { useState } from "react";
import { ConditionsPanel } from "./calibration/ConditionsPanel";
import { BatchFitPanel } from "./calibration/BatchFitPanel";
import { PlaceholderPanel } from "./calibration/PlaceholderPanel";

type CalTab = "conditions" | "batch-fit" | "validation";

const TAB_LABELS: Record<CalTab, { label: string; tag: string }> = {
  conditions: { label: "Conditions", tag: "browse" },
  "batch-fit": { label: "Batch Fit", tag: "PyMC" },
  validation: { label: "V&V", tag: "soon" },
};

export function Calibration() {
  const [tab, setTab] = useState<CalTab>("conditions");

  return (
    <div className="fadein space-y-6">
      {/* Header */}
      <div className="flex items-baseline gap-x-3">
        <h2 className="display text-2xl text-ink-0 tracking-tight">Calibration</h2>
        <span className="label text-ink-3">Python offline pipeline</span>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 border-b border-line">
        {(Object.keys(TAB_LABELS) as CalTab[]).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-3 py-2 mono text-[11px] uppercase tracking-cap transition-colors ${
                active ? "text-signal" : "text-ink-2 hover:text-ink-0"
              }`}
            >
              {TAB_LABELS[t].label}
              <span
                className={`ml-1.5 text-[9px] ${
                  active ? "text-signal-bright" : "text-ink-3"
                }`}
              >
                {TAB_LABELS[t].tag}
              </span>
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-signal" />
              )}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {tab === "conditions" && <ConditionsPanel />}
      {tab === "batch-fit" && <BatchFitPanel />}
      {tab === "validation" && <PlaceholderPanel />}
    </div>
  );
}
