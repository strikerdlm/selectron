import { useEffect, useState } from "react";
import type { SimSession } from "@/db/schema";
import { recentSimsFor } from "@/db/repository";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { RiskCard } from "@/ui/components/RiskCard";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { ConditionContribution } from "@/ui/figures/ConditionContribution";
import { MissionComparison } from "@/ui/figures/MissionComparison";
import { IMMCalculationTrace } from "@/ui/figures/CalculationTrace";
import type { AccessTier } from "@/types";
import { ACCESS_TIERS } from "@/types";

export function Sim({
  candidateId,
  onBackToReview,
}: {
  candidateId: string;
  onBackToReview: () => void;
}) {
  // undefined = still loading from Dexie; null = loaded but no sims for this candidate.
  // The distinction matters so the post-sim transition doesn't flash the "no sim sessions"
  // fallback during the async DB round-trip after the wizard hands off.
  const [latest, setLatest] = useState<SimSession | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLatest(undefined);
    (async () => {
      const sims = await recentSimsFor(candidateId, 50);
      if (cancelled) return;
      // Pick the most recent NON-comparison-run sim as the "latest"
      const nonComparison = sims.filter((s) => !(s.notes ?? "").includes("comparison-run-"));
      setLatest(nonComparison[0] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  // Derive access tier from the notes prefix "tier=<minimum|medium|elite>"
  const tierMatch = (latest?.notes ?? "").match(/^tier=(\w+)/);
  const sessionTier: AccessTier =
    tierMatch?.[1] && ACCESS_TIERS.includes(tierMatch[1] as AccessTier)
      ? (tierMatch[1] as AccessTier)
      : "minimum";

  if (latest === undefined) {
    // Loading state — Dexie round-trip after Sim view mounts (typically <100ms,
    // but the post-sim transition can briefly show this).
    return (
      <div className="panel p-12 text-center">
        <div className="mb-4 flex justify-center">
          <span className="relative inline-flex h-10 w-10">
            <span className="absolute inset-0 rounded-full border-2 border-signal/30" />
            <span className="absolute inset-0 rounded-full border-2 border-signal border-t-transparent animate-spin" />
          </span>
        </div>
        <p className="mono text-[11px] uppercase tracking-cap text-ink-2">
          loading simulation results…
        </p>
      </div>
    );
  }

  if (latest === null) {
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
      {/* TOP — RiskCard + CHI histogram (the headline result) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5">
          <RiskCard posterior={latest.posterior} alias={latest.missionId} />
        </section>
        <section className="lg:col-span-7 panel p-6">
          <RiskHistogram
            chiSamples={latest.chiSamples}
            chiMean={latest.posterior.chi.mean}
            chiCi90={latest.posterior.chi.ci90}
            seed={latest.seed}
            trials={latest.trials}
            missionId={latest.missionId}
            priorsVersion={latest.priorsVersion}
            accessTier={sessionTier}
          />
        </section>
      </div>

      {/* CALCULATION TRACE — Diego scope expansion 2026-05-19: priority on
          showing how we got to the probability, with educational lay layer. */}
      {mission && (
        <section>
          <IMMCalculationTrace
            posterior={latest.posterior}
            mission={mission}
            conditions={ANALOG_CONDITIONS}
            trials={latest.trials}
            seed={latest.seed}
            chiStar={latest.chiStar}
            priorsVersion={latest.priorsVersion}
            accessTier={sessionTier}
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-12 panel p-6">
          <ConditionContribution
            posterior={latest.posterior}
            conditions={ANALOG_CONDITIONS}
            trials={latest.trials}
            seed={latest.seed}
            missionId={latest.missionId}
            priorsVersion={latest.priorsVersion}
          />
        </section>
        {mission && (
          <section className="lg:col-span-12">
            <MissionComparison candidateId={candidateId} accessTier={sessionTier} />
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
