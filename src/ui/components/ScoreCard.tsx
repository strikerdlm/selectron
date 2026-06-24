import type { ScoreDistribution } from "@/types";

type Props = {
  scoreDistribution?: ScoreDistribution;
  /** @deprecated Use scoreDistribution. */
  posterior?: ScoreDistribution;
  alias: string;
};

const pct = (x: number) => (100 * x).toFixed(1) + "%";

export function ScoreCard({ scoreDistribution, posterior, alias }: Props) {
  const distribution = scoreDistribution ?? posterior;
  if (!distribution) {
    throw new Error("ScoreCard requires scoreDistribution");
  }
  const { mean, ci90, ci95, ess } = distribution;
  const interval90Width = ci90[1] - ci90[0];
  const intervalWidthPct = Math.max(0, Math.min(1, interval90Width / 0.3));

  return (
    <div className="panel p-6">
      <div className="flex items-baseline justify-between">
        <span className="label">candidate</span>
        <span className="label">id · {alias.toLowerCase()}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="display mono text-5xl text-ink-0 leading-none">{pct(mean)}</span>
        <span className="mono text-xs text-ink-2">μ</span>
      </div>
      <div className="mono mt-1 text-[12px] text-ink-3">mean of uncertain-weight MCDA score</div>

      <div className="hairline my-5" />

      <dl className="mono grid grid-cols-[auto_1fr] gap-y-2 text-xs">
        <dt className="text-ink-2">interval₉₀</dt>
        <dd className="text-right tabular-nums text-ink-0">
          <span className="text-signal">{pct(ci90[0])}</span>
          <span className="mx-2 text-ink-3">→</span>
          <span className="text-signal">{pct(ci90[1])}</span>
        </dd>

        <dt className="text-ink-2">interval₉₅</dt>
        <dd className="text-right tabular-nums text-ink-1">
          {pct(ci95[0])} <span className="text-ink-3">→</span> {pct(ci95[1])}
        </dd>

        <dt className="text-ink-2">Δ width</dt>
        <dd className="text-right tabular-nums text-ink-1">{pct(interval90Width)}</dd>

        <dt className="text-ink-2">draws (IID)</dt>
        <dd className="text-right tabular-nums text-ink-1">{ess.toFixed(0)}</dd>
      </dl>

      <div className="mt-6">
        <div className="mono mb-1 flex items-center justify-between text-[12px] text-ink-2">
          <span
            className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-ink-3/50"
            title="Weight-sensitivity interval width. Narrower intervals mean the composite score changes less under the assumed weight prior; this is not candidate quality or a learned suitability probability."
          >
            weight-sensitivity width
            <span aria-hidden className="text-ink-3">ⓘ</span>
          </span>
          <span className="tabular-nums">{(100 * intervalWidthPct).toFixed(0)}%</span>
        </div>
        <div className="relative h-[3px] w-full bg-line">
          <div
            className="absolute inset-y-0 left-0 bg-signal transition-[width] duration-300 ease-out"
            style={{ width: `${100 * intervalWidthPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
