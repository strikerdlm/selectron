// scope-expansion-3 follow-up (2026-05-19, Diego "the box for the selection of
// the analog mission time is difficult to see, apply some frontend magic"):
// replaces the HTML <select> dropdown with a click-target card grid. Each card
// shows the mission's duration / crew / EVAs / comms delay at a glance so the
// user picks visually rather than scanning text in a drop-down.

import type { AnalogMission } from "../../types/risk";

type Props = {
  missions: AnalogMission[];
  selected: AnalogMission | null;
  onChange: (m: AnalogMission) => void;
};

function durationBand(days: number): string {
  if (days <= 14) return "Short (≤2 wk)";
  if (days <= 45) return "Medium (≤6 wk)";
  if (days <= 90) return "Extended (≤3 mo)";
  if (days <= 365) return "Long (≤1 yr)";
  return "Mars-class (>1 yr)";
}

function durationBandColor(days: number): string {
  // Quick visual sort: short = teal, medium = signal, long = amber-deeper, Mars = warn-edge
  if (days <= 14) return "text-emerald-300 border-emerald-500/40";
  if (days <= 45) return "text-signal border-signal/40";
  if (days <= 90) return "text-amber-300 border-amber-500/40";
  if (days <= 365) return "text-orange-300 border-orange-500/40";
  return "text-warn border-warn/40";
}

export function MissionPicker({ missions, selected, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Analog mission" className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {missions.map((m) => {
          const active = selected?.id === m.id;
          const band = durationBand(m.durationDays);
          const bandClass = durationBandColor(m.durationDays);

          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={`${m.id} — ${m.label}`}
              onClick={() => onChange(m)}
              className={
                "panel relative text-left p-4 transition-all duration-150 cursor-pointer " +
                (active
                  ? "border-signal bg-signal/5 ring-1 ring-signal/40 shadow-[0_0_24px_rgba(245,181,65,0.18)]"
                  : "hover:border-line-2 hover:bg-bg-2")
              }
            >
              {/* Status dot */}
              <span
                className={
                  "absolute top-3 right-3 inline-block w-2.5 h-2.5 rounded-full transition-all " +
                  (active
                    ? "bg-signal shadow-[0_0_8px_rgba(245,181,65,0.8)]"
                    : "border border-ink-3")
                }
                aria-hidden
              />

              {/* Duration band chip */}
              <div className={"mono inline-block text-[9px] uppercase tracking-cap px-1.5 py-0.5 border rounded-sm mb-2 " + bandClass}>
                {band}
              </div>

              {/* Mission id (the canonical key the user picks by) */}
              <div className="mono text-[11px] text-ink-3 leading-tight">{m.id}</div>

              {/* Label — wrapped, 2-line clamp */}
              <h4
                className="display text-sm text-ink-0 leading-tight mt-1 mb-3"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {m.label}
              </h4>

              {/* Stats grid: duration / crew / EVAs / comms */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mono text-[10px] text-ink-2 tabular-nums">
                <div>
                  <span className="text-ink-3">dur · </span>
                  <span className="text-ink-1">{m.durationDays} d</span>
                </div>
                <div>
                  <span className="text-ink-3">crew · </span>
                  <span className="text-ink-1">{m.crewSize}</span>
                </div>
                <div>
                  <span className="text-ink-3">EVAs · </span>
                  <span className="text-ink-1">{m.evaCount}</span>
                </div>
                <div>
                  <span className="text-ink-3">Δt · </span>
                  <span className="text-ink-1">
                    {m.commsDelaySec === 0 ? "real-time" : `${m.commsDelaySec}s`}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="mono text-[10px] text-ink-2 px-1">
          selected · <span className="text-signal">{selected.id}</span>
        </p>
      )}
    </div>
  );
}
