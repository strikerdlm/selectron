import type { Posterior } from "@/types";

type Props = {
  posterior: Posterior;
  alias: string;
};

const pct = (x: number) => (100 * x).toFixed(1) + "%";

export function ScoreCard({ posterior, alias }: Props) {
  const { mean, ci90, ci95, ess } = posterior;
  const ci90Width = ci90[1] - ci90[0];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Candidate {alias}</h3>
        <span className="text-xs text-slate-500">ESS {ess.toFixed(0)}</span>
      </div>
      <div className="text-4xl font-bold tabular-nums text-slate-900">{pct(mean)}</div>
      <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm text-slate-600">
        <dt>90% CI</dt>
        <dd className="tabular-nums text-right">
          {pct(ci90[0])} — {pct(ci90[1])}
        </dd>
        <dt>95% CI</dt>
        <dd className="tabular-nums text-right">
          {pct(ci95[0])} — {pct(ci95[1])}
        </dd>
        <dt>CI₉₀ width</dt>
        <dd className="tabular-nums text-right">{pct(ci90Width)}</dd>
      </dl>
    </div>
  );
}
