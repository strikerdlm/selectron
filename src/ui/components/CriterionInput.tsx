import type { Criterion } from "@/types";

type Props = {
  criterion: Criterion;
  value: number;
  onChange: (next: number) => void;
  index: number;
};

export function CriterionInput({ criterion, value, onChange, index }: Props) {
  const { scale, label, instrument, family } = criterion;
  const normalized = (value - scale.min) / (scale.max - scale.min);

  return (
    <div className="group border-b border-line py-4 last:border-b-0">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="mono text-[10px] text-ink-3 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm text-ink-0">{label}</span>
        </div>
        <span className="label">{family}</span>
      </div>

      <div className="mono mb-2 flex items-center gap-2 text-[10px] text-ink-3">
        <span>{instrument}</span>
        <span className="flex-1 border-b border-dotted border-line" />
        <span className="tabular-nums text-ink-0">
          {value.toFixed(1)}
        </span>
        <span className="text-ink-3">/ {scale.max}</span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={(scale.max - scale.min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="instrument relative z-10"
          aria-label={label}
        />
        {/* track-fill overlay, sits behind the native track */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-px bg-signal"
          style={{ width: `${normalized * 100}%` }}
        />
        {/* tick marks at quartiles */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between">
          {[0, 25, 50, 75, 100].map((p) => (
            <span
              key={p}
              className="block h-[5px] w-px bg-line-2"
              style={{ marginTop: -2 }}
            />
          ))}
        </div>
      </div>

      <div className="mono mt-1 flex justify-between text-[9px] tabular-nums text-ink-3">
        <span>{scale.min}</span>
        <span>{((scale.min + scale.max) / 2).toFixed(0)}</span>
        <span>{scale.max}</span>
      </div>
    </div>
  );
}
