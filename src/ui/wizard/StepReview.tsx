import { useMemo } from "react";
import { useWizard } from "@/contexts/WizardContext";
import { ACTIVE_CRITERION_CATALOG } from "@/data/demo-criteria";
import { buildEqualWeightPrior, scoreCandidate, normalizeScore } from "@/engine";
import { ScoreDistributionPlot } from "@/ui/figures/ScoreDistributionPlot";
import { ScoreCard } from "@/ui/components/ScoreCard";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { MCDACalculationTrace } from "@/ui/figures/CalculationTrace";
import { isCriterionAvailableAtTier } from "@/types";

const ITERATIONS = 5000;
const SEED_SAMPLER = 0xc0ffee;

export function StepReview() {
  const { candidate, criterionEntries, setStep, markStepCompleted, accessTier } = useWizard();

  // The construct set is stable across tiers; tiers change the assessment
  // instrument fidelity shown upstream, not the criteria included here.
  const visibleCriteria = useMemo(
    () => ACTIVE_CRITERION_CATALOG.criteria.filter((c) => isCriterionAvailableAtTier(c.minimumTier, accessTier)),
    [accessTier],
  );
  const weightPrior = useMemo(
    () => buildEqualWeightPrior(visibleCriteria.length),
    [visibleCriteria.length],
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

  const missingCriteria = useMemo(
    () => visibleCriteria.filter((c) => scores[c.id] === undefined),
    [scores, visibleCriteria],
  );
  const isComplete = missingCriteria.length === 0;

  const candidateForEngine = useMemo(
    () => ({
      id: candidate?.id ?? "",
      alias: candidate?.alias ?? "—",
      scores,
    }),
    [candidate, scores],
  );

  const scoreDistribution = useMemo(
    () =>
      isComplete
        ? scoreCandidate({
            candidate: candidateForEngine,
            criteria: visibleCriteria,
            alpha: weightPrior.alpha,
            iterations: ITERATIONS,
            seed: SEED_SAMPLER,
          })
        : null,
    [candidateForEngine, visibleCriteria, isComplete, weightPrior],
  );

  const radarData = useMemo(
    () =>
      isComplete
        ? visibleCriteria.map((c) => {
            const raw = scores[c.id]!;
            const z = normalizeScore(raw, c.scale, c.higherIsBetter);
            const weight = 1 / visibleCriteria.length;
            return { criterionId: c.id, label: c.label, contribution: weight * z };
          })
        : [],
    [scores, visibleCriteria, isComplete],
  );

  return (
    <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="lg:col-span-7 panel p-6 space-y-4">
        <h2 className="display text-lg">Step 3 — Review</h2>
        <div className="border border-warn/40 bg-warn/5 p-3 text-sm text-ink-2">
          <p className="font-medium text-ink-1">Research demonstration catalog</p>
          <p className="mt-1 leading-relaxed">
            {ACTIVE_CRITERION_CATALOG.label} · status {ACTIVE_CRITERION_CATALOG.status}. Scores are
            uncertain-weight MCDA research outputs, not eligibility decisions or validated suitability probabilities.
          </p>
          <p className="mono mt-2 text-[12px] text-ink-3">
            weight prior · source {weightPrior.source} · kappa {weightPrior.kappa.toFixed(0)} · alpha=[1,...,1]
          </p>
        </div>
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
              if (!isComplete) return;
              markStepCompleted(2);
              setStep(3);
            }}
            disabled={!isComplete}
            className={
              "mono uppercase tracking-cap text-[13px] px-4 py-2 border rounded-md " +
              (isComplete
                ? "border-signal text-signal hover:bg-signal/10"
                : "border-line text-ink-3 cursor-not-allowed")
            }
          >
            next →
          </button>
        </div>
      </section>

      <aside className="lg:col-span-5 space-y-4">
        {scoreDistribution ? (
          <>
            <div className="panel p-6">
              <ScoreDistributionPlot
                scoreDistribution={scoreDistribution}
                seed={SEED_SAMPLER}
                alias={candidate?.alias ?? "—"}
                accessTier={accessTier}
              />
            </div>
            <ScoreCard scoreDistribution={scoreDistribution} alias={candidate?.alias ?? "—"} />
          </>
        ) : (
          <div className="panel p-6">
            <h3 className="label text-ink-1 uppercase tracking-cap">Incomplete record</h3>
            <p className="mt-3 text-sm text-ink-2 leading-relaxed">
              Complete all tier-active criterion scores before calculating the uncertain-weight MCDA distribution.
            </p>
            <p className="mono mt-3 text-[12px] text-ink-3">
              missing · {missingCriteria.map((c) => c.label).join(" · ")}
            </p>
          </div>
        )}
        {scoreDistribution && (
          <div className="panel p-6">
            <ScoreBreakdownRadar data={radarData} />
          </div>
        )}
      </aside>
    </div>

    {/* CALCULATION TRACE — Diego scope expansion 2026-05-19: educational
        step-by-step walkthrough of Stage-A MCDA scoring, with lay layer. */}
    {scoreDistribution && (
      <section>
        <MCDACalculationTrace
          scoreDistribution={scoreDistribution}
          criteria={visibleCriteria}
          scores={scores}
          alias={candidate?.alias ?? "—"}
          seed={SEED_SAMPLER}
          accessTier={accessTier}
        />
      </section>
    )}
    </div>
  );
}
