import { useMemo } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { scoreCandidate, normalizeScore } from "@/engine";
import { PosteriorPlot } from "@/ui/figures/PosteriorPlot";
import { ScoreCard } from "@/ui/components/ScoreCard";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { MCDACalculationTrace } from "@/ui/figures/CalculationTrace";

const ITERATIONS = 5000;
const SEED_SAMPLER = 0xc0ffee;

export function StepReview() {
  const { candidate, criterionEntries, setStep, markStepCompleted, accessTier } = useWizard();

  const scores: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of criterionEntries) m[e.criterionId] = e.rawValue;
    return m;
  }, [criterionEntries]);

  // Fill any missing criterion scores with the criterion minimum so scoreCandidate
  // never throws E_BAD_SCORE (incomplete wizard state is valid during review).
  const scoresForEngine = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of PLACEHOLDER_CRITERIA) {
      m[c.id] = scores[c.id] ?? c.scale.min;
    }
    return m;
  }, [scores]);

  const candidateForEngine = useMemo(
    () => ({
      id: candidate?.id ?? "",
      alias: candidate?.alias ?? "—",
      scores: scoresForEngine,
    }),
    [candidate, scoresForEngine],
  );

  const posterior = useMemo(
    () =>
      scoreCandidate({
        candidate: candidateForEngine,
        criteria: PLACEHOLDER_CRITERIA,
        alpha: PLACEHOLDER_CRITERIA.map(() => 1),
        iterations: ITERATIONS,
        seed: SEED_SAMPLER,
      }),
    [candidateForEngine],
  );

  const radarData = useMemo(
    () =>
      PLACEHOLDER_CRITERIA.map((c) => {
        const raw = scores[c.id] ?? c.scale.min;
        const z = normalizeScore(raw, c.scale, c.higherIsBetter);
        const weight = 1 / PLACEHOLDER_CRITERIA.length;
        return { criterionId: c.id, label: c.label, contribution: weight * z };
      }),
    [scores],
  );

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-7 panel p-6 space-y-4">
        <h2 className="display text-lg">Step 3 — Review</h2>
        <table className="mono w-full text-[11px]">
          <thead>
            <tr className="text-ink-3 uppercase tracking-cap">
              <th className="text-left">criterion</th>
              <th className="text-right">raw</th>
              <th className="text-right">z</th>
              <th className="text-right">status</th>
              <th className="text-right">edit</th>
            </tr>
          </thead>
          <tbody>
            {PLACEHOLDER_CRITERIA.map((c) => {
              const raw = scores[c.id];
              const z = raw === undefined ? "—" : normalizeScore(raw, c.scale, c.higherIsBetter).toFixed(2);
              return (
                <tr key={c.id} className="border-t border-line/60">
                  <td className="py-2">{c.label}</td>
                  <td className="text-right tabular-nums">{raw?.toFixed(1) ?? "—"}</td>
                  <td className="text-right tabular-nums">{z}</td>
                  <td className="text-right">{raw === undefined ? "○" : "●"}</td>
                  <td className="text-right">
                    <button onClick={() => setStep(1)} className="text-signal">edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-between">
          <button onClick={() => setStep(1)} className="mono uppercase tracking-cap text-[11px] px-3 py-2 text-ink-2 hover:text-ink-0">
            ← back
          </button>
          <button
            onClick={() => {
              markStepCompleted(2);
              setStep(3);
            }}
            className="mono uppercase tracking-cap text-[11px] px-4 py-2 border border-signal text-signal hover:bg-signal/10 rounded-md"
          >
            next →
          </button>
        </div>
      </section>

      <aside className="lg:col-span-5 space-y-4">
        <div className="panel p-6">
          <PosteriorPlot posterior={posterior} seed={SEED_SAMPLER} alias={candidate?.alias ?? "—"} accessTier={accessTier} />
        </div>
        <ScoreCard posterior={posterior} alias={candidate?.alias ?? "—"} />
        <div className="panel p-6">
          <ScoreBreakdownRadar data={radarData} />
        </div>
      </aside>
    </div>

    {/* CALCULATION TRACE — Diego scope expansion 2026-05-19: educational
        step-by-step walkthrough of Stage-A MCDA scoring, with lay layer. */}
    <section>
      <MCDACalculationTrace
        posterior={posterior}
        criteria={PLACEHOLDER_CRITERIA}
        scores={scoresForEngine}
        alias={candidate?.alias ?? "—"}
        seed={SEED_SAMPLER}
        accessTier={accessTier}
      />
    </section>
    </div>
  );
}
