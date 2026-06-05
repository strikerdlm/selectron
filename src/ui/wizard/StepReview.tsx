import { useMemo } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { scoreCandidate, normalizeScore } from "@/engine";
import { PosteriorPlot } from "@/ui/figures/PosteriorPlot";
import { ScoreCard } from "@/ui/components/ScoreCard";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { MCDACalculationTrace } from "@/ui/figures/CalculationTrace";
import { isCriterionAvailableAtTier } from "@/types";

const ITERATIONS = 5000;
const SEED_SAMPLER = 0xc0ffee;

export function StepReview() {
  const { candidate, criterionEntries, setStep, markStepCompleted, accessTier } = useWizard();

  // Only the criteria available at the user's chosen tier feed the posterior +
  // table + radar. Tier-1 Posterior is a K=8 Dirichlet vs Tier-3 K=12 — the
  // mean weight per criterion is 1/K (not 1/12) when computed against the
  // tier-active subset, so a Tier-1 Selectron answer is internally honest about
  // which tests it actually measured.
  const visibleCriteria = useMemo(
    () => PLACEHOLDER_CRITERIA.filter((c) => isCriterionAvailableAtTier(c.minimumTier, accessTier)),
    [accessTier],
  );

  // Clamp at the source — legacy persisted rawValues from before the
  // EvidenceForm scale-transform fix can exceed [scale.min, scale.max]
  // (Diego hit 112.5 on a [0,100] criterion). Clamping here defends
  // EVERY downstream consumer: the table z-column, radar, scoresForEngine,
  // CalculationTrace. One place, one fix.
  const scores: Record<string, number> = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of criterionEntries) {
      const c = visibleCriteria.find((v) => v.id === e.criterionId);
      m[e.criterionId] = c
        ? Math.max(c.scale.min, Math.min(c.scale.max, e.rawValue))
        : e.rawValue;
    }
    return m;
  }, [criterionEntries, visibleCriteria]);

  // Fill any missing criterion scores with the criterion minimum so scoreCandidate
  // never throws E_BAD_SCORE (incomplete wizard state is valid during review).
  const scoresForEngine = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of visibleCriteria) {
      m[c.id] = scores[c.id] ?? c.scale.min;
    }
    return m;
  }, [scores, visibleCriteria]);

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
        criteria: visibleCriteria,
        alpha: visibleCriteria.map(() => 1),
        iterations: ITERATIONS,
        seed: SEED_SAMPLER,
      }),
    [candidateForEngine, visibleCriteria],
  );

  const radarData = useMemo(
    () =>
      visibleCriteria.map((c) => {
        const raw = scores[c.id] ?? c.scale.min;
        const z = normalizeScore(raw, c.scale, c.higherIsBetter);
        const weight = 1 / visibleCriteria.length;
        return { criterionId: c.id, label: c.label, contribution: weight * z };
      }),
    [scores, visibleCriteria],
  );

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-7 panel p-6 space-y-4">
        <h2 className="display text-lg">Step 3 — Review</h2>
        <table className="mono w-full text-[13px]">
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
            {visibleCriteria.map((c) => {
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
          <button onClick={() => setStep(1)} className="mono uppercase tracking-cap text-[13px] px-3 py-2 text-ink-2 hover:text-ink-0">
            ← back
          </button>
          <button
            onClick={() => {
              markStepCompleted(2);
              setStep(3);
            }}
            className="mono uppercase tracking-cap text-[13px] px-4 py-2 border border-signal text-signal hover:bg-signal/10 rounded-md"
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
        criteria={visibleCriteria}
        scores={scoresForEngine}
        alias={candidate?.alias ?? "—"}
        seed={SEED_SAMPLER}
        accessTier={accessTier}
      />
    </section>
    </div>
  );
}
