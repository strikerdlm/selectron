import { useEffect, useState } from "react";
import type { SimSession } from "@/db/schema";
import { recentSimsFor } from "@/db/repository";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { RiskCard } from "@/ui/components/RiskCard";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { ConditionContribution } from "@/ui/figures/ConditionContribution";
import { MissionComparison } from "@/ui/figures/MissionComparison";

export function Sim({
  candidateId,
  onBackToReview,
}: {
  candidateId: string;
  onBackToReview: () => void;
}) {
  const [latest, setLatest] = useState<SimSession | null>(null);

  useEffect(() => {
    (async () => {
      const sims = await recentSimsFor(candidateId, 50);
      // Pick the most recent NON-comparison-run sim as the "latest"
      const nonComparison = sims.filter((s) => !(s.notes ?? "").startsWith("comparison-run-"));
      setLatest(nonComparison[0] ?? null);
    })();
  }, [candidateId]);

  if (!latest) {
    return (
      <div className="panel p-6 text-sm text-ink-2">
        no sim sessions yet — go back to step 4 and run one.
        <button onClick={onBackToReview} className="ml-3 text-signal">← back</button>
      </div>
    );
  }

  const mission = ANALOG_MISSIONS.find((m) => m.id === latest.missionId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <RiskCard posterior={latest.posterior} alias={latest.missionId} />
        </section>
        <section className="lg:col-span-7 panel p-6">
          <RiskHistogram
            chiSamples={latest.chiSamples}
            chiMean={latest.posterior.chi.mean}
            chiCi90={latest.posterior.chi.ci90}
          />
        </section>
        <section className="lg:col-span-12 panel p-6">
          <ConditionContribution posterior={latest.posterior} conditions={ANALOG_CONDITIONS} />
        </section>
        {mission && (
          <section className="lg:col-span-12">
            <MissionComparison candidateId={candidateId} />
          </section>
        )}
      </div>

      <button
        onClick={onBackToReview}
        className="mono uppercase tracking-cap text-[11px] px-3 py-2 text-ink-2 hover:text-ink-0"
      >
        ← back to Review
      </button>
    </div>
  );
}
