import type { Criterion } from "@/types";

type Props = {
  criterion: Criterion;
  value: number;
  onChange: (next: number) => void;
};

export function CriterionInput({ criterion, value, onChange }: Props) {
  const { scale, label, instrument, family } = criterion;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        <span className="text-xs uppercase tracking-wide text-slate-400">{family}</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">{instrument}</p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={(scale.max - scale.min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-blue-900"
        />
        <span className="w-16 text-right tabular-nums text-sm text-slate-700">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
