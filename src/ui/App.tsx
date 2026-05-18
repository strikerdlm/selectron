import { useEffect, useMemo, useState } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { scoreCandidate, generateCandidate } from "@/engine";
import { CriterionInput } from "./components/CriterionInput";
import { ScoreCard } from "./components/ScoreCard";
import { PosteriorPlot } from "./components/PosteriorPlot";

const SEED_DEMO = 42;
const SEED_SAMPLER = 0xc0ffee;
const ITERATIONS = 5000;

function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const fmtUtc = (d: Date) =>
  d.toISOString().slice(11, 19) + "Z";

const fmtDate = (d: Date) =>
  d.toISOString().slice(0, 10);

export function App() {
  const initialCandidate = useMemo(
    () => generateCandidate(PLACEHOLDER_CRITERIA, SEED_DEMO, "demo"),
    [],
  );
  const [scores, setScores] = useState<Record<string, number>>(initialCandidate.scores);

  const candidate = useMemo(
    () => ({ ...initialCandidate, scores }),
    [initialCandidate, scores],
  );

  const posterior = useMemo(
    () =>
      scoreCandidate({
        candidate,
        criteria: PLACEHOLDER_CRITERIA,
        alpha: PLACEHOLDER_CRITERIA.map(() => 1),
        iterations: ITERATIONS,
        seed: SEED_SAMPLER,
      }),
    [candidate],
  );

  const utc = useUtcClock();

  return (
    <div className="min-h-screen text-ink-0">
      {/* HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-baseline gap-3">
            <h1 className="display text-2xl text-ink-0 tracking-tight">SELECTRON</h1>
            <span className="label text-signal">iter 01 · vertical slice</span>
          </div>
          <div className="mono flex items-center gap-6 text-[11px] text-ink-2">
            <div className="flex items-center gap-2">
              <span className="signal-dot" />
              <span className="uppercase tracking-cap text-ink-1">live</span>
            </div>
            <span className="hidden sm:inline">
              <span className="text-ink-3">utc</span> {fmtUtc(utc)}
            </span>
            <span className="hidden md:inline">
              <span className="text-ink-3">build</span> {fmtDate(utc)}.bayes
            </span>
            <span className="hidden lg:inline">
              <span className="text-ink-3">seed</span> 0x{SEED_SAMPLER.toString(16)}
            </span>
          </div>
        </div>
      </header>

      {/* SUBHEAD ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-line/60 bg-bg-1/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-3 px-8 py-3">
          <p className="text-sm text-ink-1">
            <span className="text-ink-0">Bayesian MCDA over five placeholder criteria.</span>{" "}
            <span className="text-ink-2">
              Dirichlet weights (α = 1, uninformative). Posterior re-samples on every slider change.
            </span>
          </p>
          <p className="mono text-[10px] uppercase tracking-cap text-ink-3">
            5 criteria · {ITERATIONS.toLocaleString()} draws · in-browser sampler
          </p>
        </div>
      </div>

      {/* BODY ────────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-8 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* LEFT — posterior + score card */}
          <section className="lg:col-span-8 space-y-6 fadein">
            <PosteriorPlot posterior={posterior} />
            <ScoreCard posterior={posterior} alias={candidate.alias} />
          </section>

          {/* RIGHT — criterion stack */}
          <aside className="lg:col-span-4 fadein" style={{ animationDelay: "120ms" }}>
            <div className="panel p-6">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="display text-lg text-ink-0">Criteria</h2>
                <span className="label">5 instruments</span>
              </div>
              <p className="mono mb-4 text-[10px] text-ink-3 leading-relaxed">
                Adjust raw scores. The engine normalises to [0,1] per criterion scale
                and re-samples the posterior under the current Dirichlet prior.
              </p>
              <div className="hairline mb-2" />
              <div>
                {PLACEHOLDER_CRITERIA.map((c, i) => (
                  <CriterionInput
                    key={c.id}
                    index={i}
                    criterion={c}
                    value={scores[c.id]}
                    onChange={(v) => setScores((s) => ({ ...s, [c.id]: v }))}
                  />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer className="mt-10 border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-8 py-5">
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3">
            selectron · iter 01 · bayesian mcda scoring engine for analog-astronaut selection
          </div>
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3">
            <a
              href="https://github.com/strikerdlm/selectron"
              className="hover:text-signal transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              github.com/strikerdlm/selectron ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
