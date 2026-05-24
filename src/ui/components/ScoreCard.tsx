import type { Posterior } from "@/types";

type Props = {
  posterior: Posterior;
  alias: string;
};

const pct = (x: number) => (100 * x).toFixed(1) + "%";

export function ScoreCard({ posterior, alias }: Props) {
  const { mean, ci90, ci95, ess } = posterior;
  const ci90Width = ci90[1] - ci90[0];

  // Sharpness gauge: narrow CI = "confident"
  // Map 0%–30% CI width to 100%–0% sharpness.
  const sharpness = Math.max(0, Math.min(1, 1 - ci90Width / 0.3));

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
      <div className="mono mt-1 text-[10px] text-ink-3">posterior mean over total score</div>

      <div className="hairline my-5" />

      <dl className="mono grid grid-cols-[auto_1fr] gap-y-2 text-xs">
        <dt className="text-ink-2">CI₉₀</dt>
        <dd className="text-right tabular-nums text-ink-0">
          <span className="text-signal">{pct(ci90[0])}</span>
          <span className="mx-2 text-ink-3">→</span>
          <span className="text-signal">{pct(ci90[1])}</span>
        </dd>

        <dt className="text-ink-2">CI₉₅</dt>
        <dd className="text-right tabular-nums text-ink-1">
          {pct(ci95[0])} <span className="text-ink-3">→</span> {pct(ci95[1])}
        </dd>

        <dt className="text-ink-2">Δ width</dt>
        <dd className="text-right tabular-nums text-ink-1">{pct(ci90Width)}</dd>

        <dt className="text-ink-2">ESS (IID ≈ T)</dt>
        <dd className="text-right tabular-nums text-ink-1">{ess.toFixed(0)}</dd>
      </dl>

      <div className="mt-6">
        <div className="mono mb-1 flex items-center justify-between text-[10px] text-ink-2">
          <span>sharpness</span>
          <span className="tabular-nums">{(100 * sharpness).toFixed(0)}%</span>
        </div>
        <div className="relative h-[3px] w-full bg-line">
          <div
            className="absolute inset-y-0 left-0 bg-signal transition-[width] duration-300 ease-out"
            style={{ width: `${100 * sharpness}%` }}
          />
        </div>
      </div>
    </div>
  );
}
