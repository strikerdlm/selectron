import { useEffect, useMemo, useRef, useState } from "react";
import { IMM_CONDITIONS } from "@/imm/conditions";

interface ConditionComboboxProps {
  value: string | null;
  onChange: (conditionId: string | null) => void;
}

export function ConditionCombobox({ value, onChange }: ConditionComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const cond = IMM_CONDITIONS.find((c) => c.id === value);
    return cond?.label ?? value;
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return IMM_CONDITIONS;
    return IMM_CONDITIONS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string | null) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  const isFittable = (c: (typeof IMM_CONDITIONS)[number]) =>
    c.incidenceDist === "Gamma";

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? query : value ? selectedLabel : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="All fittable conditions"
        className="w-full mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal placeholder:text-ink-3"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-bg-1 border border-line rounded-sm shadow-lg max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left px-3 py-2 hover:bg-bg-2/50 transition-colors border-b border-line/50"
          >
            <span className="mono text-[11px] text-signal">All fittable</span>
          </button>
          {filtered.map((c) => {
            const fittable = isFittable(c);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!fittable}
                onClick={() => fittable && handleSelect(c.id)}
                className={`w-full text-left px-3 py-1.5 transition-colors ${
                  fittable
                    ? "hover:bg-bg-2/50 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="mono text-[11px] text-ink-0">{c.label}</div>
                <div className="mono text-[10px] text-ink-3">{c.id}</div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-2 mono text-[10px] text-ink-3">no matches</div>
          )}
        </div>
      )}
    </div>
  );
}
