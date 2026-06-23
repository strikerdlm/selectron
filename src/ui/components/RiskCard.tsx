import type { RiskPosterior } from "@/types/risk";

type Props = {
  posterior: RiskPosterior;
  alias: string;
};

const pct = (x: number) => (100 * x).toFixed(1) + "%";
const days = (x: number) => x.toFixed(1) + "d";

export function RiskCard({ posterior, alias }: Props) {
  const { chi, pEarlyTermination, expectedLostCrewDays, trials } = posterior;
  const chiCI90Width = chi.ci90[1] - chi.ci90[0];

  // Interval-width gauge (1 − CI₉₀width/0.30): spread of the simulated CHI
  // distribution, not mission quality.
  const intervalTightness = Math.max(0, Math.min(1, 1 - chiCI90Width / 0.3));

  return (
    <div className="panel p-6">
      <div className="flex items-baseline justify-between">
        <span className="label">mission risk</span>
        <span className="label">id · {alias.toLowerCase()}</span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="display mono text-5xl text-ink-0 leading-none">{pct(chi.mean)}</span>
        <span className="mono text-xs text-ink-2">CHI</span>
      </div>
      <div className="mono mt-1 text-[12px] text-ink-3">crew health index — Monte Carlo mean (1 = nominal)</div>

      <div className="hairline my-5" />

      <dl className="mono grid grid-cols-[auto_1fr] gap-y-2 text-xs">
        <dt className="text-ink-2">CHI CI₉₀</dt>
        <dd className="text-right tabular-nums text-ink-0">
          <span className="text-signal">{pct(chi.ci90[0])}</span>
          <span className="mx-2 text-ink-3">→</span>
          <span className="text-signal">{pct(chi.ci90[1])}</span>
        </dd>

        <dt className="text-ink-2">CHI CI₉₅</dt>
        <dd className="text-right tabular-nums text-ink-1">
          {pct(chi.ci95[0])} <span className="text-ink-3">→</span> {pct(chi.ci95[1])}
        </dd>

        <dt className="text-ink-2">p(early term.)</dt>
        <dd className="text-right tabular-nums text-ink-0">{pct(pEarlyTermination.mean)}</dd>

        <dt className="text-ink-2">pET CI₉₀</dt>
        <dd className="text-right tabular-nums text-ink-1">
          {pct(pEarlyTermination.ci90[0])} <span className="text-ink-3">→</span> {pct(pEarlyTermination.ci90[1])}
        </dd>

        <dt className="text-ink-2">lost crew-days</dt>
        <dd className="text-right tabular-nums text-ink-0">{days(expectedLostCrewDays.mean)}</dd>

        <dt className="text-ink-2">lost CI₉₀</dt>
        <dd className="text-right tabular-nums text-ink-1">
          {days(expectedLostCrewDays.ci90[0])} <span className="text-ink-3">→</span> {days(expectedLostCrewDays.ci90[1])}
        </dd>

        <dt className="text-ink-2">trials</dt>
        <dd className="text-right tabular-nums text-ink-1">{trials.toLocaleString()}</dd>
      </dl>

      <div className="mt-6">
        <div className="mono mb-1 flex items-center justify-between text-[12px] text-ink-2">
          <span
            className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-ink-3/50"
            title="Interval tightness — how narrow the 90% simulation interval is (1 − CI₉₀width/0.30). This is distribution spread, not mission quality."
          >
            CHI interval tightness
            <span aria-hidden className="text-ink-3">ⓘ</span>
          </span>
          <span className="tabular-nums">{(100 * intervalTightness).toFixed(0)}%</span>
        </div>
        <div className="relative h-[3px] w-full bg-line">
          <div
            className="absolute inset-y-0 left-0 bg-signal transition-[width] duration-300 ease-out"
            style={{ width: `${100 * intervalTightness}%` }}
          />
        </div>
      </div>
    </div>
  );
}
