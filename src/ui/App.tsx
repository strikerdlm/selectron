import { useMemo, useState } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { scoreCandidate, generateCandidate } from "@/engine";
import { CriterionInput } from "./components/CriterionInput";
import { ScoreCard } from "./components/ScoreCard";
import { PosteriorPlot } from "./components/PosteriorPlot";

export function App() {
  const seed = 42;
  const initialCandidate = useMemo(() => generateCandidate(PLACEHOLDER_CRITERIA, seed, "demo"), []);
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
        iterations: 5000,
        seed: 0xc0ffee,
      }),
    [candidate],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Selectron <span className="text-base font-normal text-slate-500">— Iter 1</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          5 placeholder criteria, Dirichlet weights (α = 1, uninformative), Bayesian MCDA.
          Replaced in Iter 2 by literature-driven criteria from Phase 0.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          {PLACEHOLDER_CRITERIA.map((c) => (
            <CriterionInput
              key={c.id}
              criterion={c}
              value={scores[c.id]}
              onChange={(v) => setScores((s) => ({ ...s, [c.id]: v }))}
            />
          ))}
        </section>
        <section className="space-y-6">
          <ScoreCard posterior={posterior} alias={candidate.alias} />
          <PosteriorPlot posterior={posterior} />
        </section>
      </div>
    </div>
  );
}
