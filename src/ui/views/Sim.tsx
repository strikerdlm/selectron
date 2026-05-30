import { useEffect, useState } from "react";
import type { SimSession } from "@/db/schema";
import { recentSimsFor, getCandidateWithEvidence } from "@/db/repository";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { evaluateGates } from "@/engine/gates";
import { RiskCard } from "@/ui/components/RiskCard";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { ConditionContribution } from "@/ui/figures/ConditionContribution";
import { MissionComparison } from "@/ui/figures/MissionComparison";
import { IMMCalculationTrace } from "@/ui/figures/CalculationTrace";
import { CHIExplainer } from "@/ui/figures/CHIExplainer";
import type { AccessTier, GateResult } from "@/types";
import { ACCESS_TIERS } from "@/types";
import { isCriterionAvailableAtTier } from "@/types/scenario";

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
  // Gate result: undefined = not yet computed (loading); null = candidate scores not found.
  const [gate, setGate] = useState<GateResult | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setLatest(undefined);
    setGate(undefined);
    (async () => {
      const [sims, bundle] = await Promise.all([
        recentSimsFor(candidateId, 50),
        getCandidateWithEvidence(candidateId).catch(() => null),
      ]);
      if (cancelled) return;
      // Pick the most recent NON-comparison-run sim as the "latest"
      const nonComparison = sims.filter((s) => !(s.notes ?? "").includes("comparison-run-"));
      const latestSim = nonComparison[0] ?? null;
      setLatest(latestSim);
      // Derive tier from session notes so gates are only evaluated for
      // criteria available at the tier the user actually selected.
      const tierNote = (latestSim?.notes ?? "").match(/^tier=(\w+)/);
      const tier: AccessTier =
        tierNote?.[1] && ACCESS_TIERS.includes(tierNote[1] as AccessTier)
          ? (tierNote[1] as AccessTier)
          : "minimum";
      const tierCriteria = PLACEHOLDER_CRITERIA.filter(
        (c) => isCriterionAvailableAtTier(c.minimumTier, tier),
      );
      // Build Candidate shape from DB entries and evaluate gates
      if (bundle) {
        const scores: Record<string, number> = {};
        for (const e of bundle.criterionEntries) scores[e.criterionId] = e.rawValue;
        const candidate = { id: bundle.candidate.id, alias: bundle.candidate.alias, scores };
        setGate(evaluateGates(candidate, tierCriteria));
      } else {
        setGate(null);
      }
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
        <p className="mono text-[13px] uppercase tracking-cap text-ink-2">
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

      {/* CHI EXPLAINER — Diego scope expansion 2026-05-19: define CHI and
          interpret this specific run for the mission. Lives directly below the
          headline RiskCard + RiskHistogram row.
          gate (optional) is passed so assessLxC can apply the disqualified override
          and the DISQUALIFIED banner is shown when a candidate fails a clearance gate. */}
      <CHIExplainer
        posterior={latest.posterior}
        chiStar={latest.chiStar}
        missionId={latest.missionId}
        gate={gate ?? undefined}
      />

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
            <MissionComparison
              candidateId={candidateId}
              accessTier={sessionTier}
              gate={gate ?? undefined}
            />
          </section>
        )}
      </div>

      <button
        onClick={onBackToReview}
        className="mono uppercase tracking-cap text-[13px] px-3 py-2 text-ink-2 hover:text-ink-0"
      >
        ← back to Review
      </button>
    </div>
  );
}
