import { useState } from "react";

export type CaptionBlock = {
  figureId: string; // "F1", "F2", etc.
  oneLine: string;
  methods: string;
  source: string;
  reproducibility: string;
  /** Optional plain-language summary (~100 words) for lay readers. */
  layperson?: string;
};

export function FigureCaption({ block }: { block: CaptionBlock }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mono mt-3 border-t border-line/40 pt-3 text-[10px] text-ink-2">
      <div className="flex items-baseline justify-between gap-3">
        <p>
          <span className="uppercase tracking-cap text-ink-0">Figure {block.figureId}</span>{" "}
          <span className="text-ink-3">|</span>{" "}
          <span className="text-ink-1">{block.oneLine}</span>
        </p>
        <button onClick={() => setExpanded((e) => !e)} className="text-signal hover:underline whitespace-nowrap">
          {expanded ? "collapse ▴" : "expand methodology ▾"}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 space-y-2">
          <p><span className="text-ink-3 uppercase tracking-cap">methods.</span> {block.methods}</p>
          <p><span className="text-ink-3 uppercase tracking-cap">source.</span> {block.source}</p>
          <p><span className="text-ink-3 uppercase tracking-cap">repro.</span> {block.reproducibility}</p>
          {block.layperson && (
            <p><span className="text-ink-3 uppercase tracking-cap">layperson.</span> {block.layperson}</p>
          )}
        </div>
      )}
    </div>
  );
}
