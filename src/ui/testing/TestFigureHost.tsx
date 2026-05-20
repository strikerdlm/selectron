import { useEffect, useRef, type ReactNode } from "react";
import type { Posterior } from "@/types";
import type { RiskPosterior } from "@/types/risk";
import { PosteriorPlot } from "@/ui/figures/PosteriorPlot";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { DashboardSummary } from "@/ui/figures/DashboardSummary";
import { EvidenceReference } from "@/ui/figures/EvidenceReference";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { ConditionContribution } from "@/ui/figures/ConditionContribution";
import { MCDACalculationTrace } from "@/ui/figures/CalculationTrace";
import { LxCMatrix } from "@/ui/figures/LxCMatrix";
import { MissionComparison } from "@/ui/figures/MissionComparison";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "@/data/synthetic-iter3";
import { simulateMission } from "@/risk/simulate";
import { saveSimSession } from "@/db/repository";
import { assessLxC } from "@/risk/lxc";
import { scoreCandidate } from "@/engine/mcda";
// MissionComparison (paper-F7) now supported via pre-seeded IDB sessions.

function syntheticPosterior(): Posterior {
  // Seeded 5,000-sample Posterior for F1 deterministic snapshot.
  const samples = new Float64Array(5_000);
  let seed = 0xc0ffee;
  for (let i = 0; i < 5_000; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    samples[i] = 0.55 + 0.15 * Math.sin(seed / 1_000_000);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
  return {
    samples,
    mean,
    ci90: [sorted[Math.floor(sorted.length * 0.05)], sorted[Math.floor(sorted.length * 0.95)]],
    ci95: [sorted[Math.floor(sorted.length * 0.025)], sorted[Math.floor(sorted.length * 0.975)]],
    ess: 5_000,
  };
}

function syntheticChiSamples(): number[] {
  let seed = 0xc0ffee;
  const out: number[] = [];
  for (let i = 0; i < 25_000; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    out.push(0.93 + 0.06 * Math.sin(seed / 1_000_000));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Paper-figure canonical inputs (T10)
// ---------------------------------------------------------------------------
// All paper-* fixtures use these fixed inputs so the manuscript figures are
// reproducible independent of any application-internal state.
//
//   alias = "DEMO-01"
//   seed  = 0xc0ffee  (same as the application's SEED_SAMPLER constant)
//   mission = hi-seas-45d  (task asked for "mdrs-45d" but no such id exists;
//             hi-seas-45d is the only 45-day analog mission in the catalog)
//   tier  = "medium"
//
// For F3/F4 (MCDA figures), scores are built from PLACEHOLDER_CRITERIA at
// midpoint of each criterion's scale, which gives z=0.5 for all criteria
// (deterministic, no Monte-Carlo needed for the normalized score vector).
// The scoreCandidate call uses the seeded MCDA engine (5,000 iterations).
//
// For F6 (LxC matrix), we derive a RiskPosterior from a quick simulateMission
// run against hi-seas-45d using the synthetic priors.  We use 5,000 trials
// (not 25k) to keep the fixture fast; the figure only needs the chi posterior
// shape, not publication-grade uncertainty.

const PAPER_ALIAS = "DEMO-01";
const PAPER_SEED  = 0xc0ffee;
const PAPER_TIER  = "medium" as const;
// hi-seas-45d is the 45-day HI-SEAS mission (closest to the spec's "mdrs-45d").
const PAPER_MISSION = ANALOG_MISSIONS.find((m) => m.id === "hi-seas-45d")!;

/** Midpoint scores for every PLACEHOLDER criterion. */
function paperScores(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    out[c.id] = (c.scale.min + c.scale.max) / 2;
  }
  return out;
}

/** MCDA Posterior for paper-F3 and paper-F4. */
function paperMCDAPosterior(): Posterior {
  return scoreCandidate({
    candidate: {
      id:     "demo-01",
      alias:  PAPER_ALIAS,
      scores: paperScores(),
    },
    criteria:   PLACEHOLDER_CRITERIA,
    alpha:      new Array(PLACEHOLDER_CRITERIA.length).fill(1),
    iterations: 5_000,
    seed:       PAPER_SEED,
  });
}

/** RiskPosterior derived from simulateMission for paper-F6. */
function paperRiskPosterior(): RiskPosterior {
  const template = {
    id:     "demo-01",
    alias:  PAPER_ALIAS,
    scores: paperScores(),
  };
  const crew = synthesizeCrew(template, PAPER_MISSION.crewSize);
  return simulateMission(
    crew,
    PAPER_MISSION,
    SYNTHETIC_PRIORS,
    ANALOG_CONDITIONS,
    { seed: PAPER_SEED, trials: 5_000 },
  );
}

// ---------------------------------------------------------------------------
// Paper-F7 pre-seed hook
// ---------------------------------------------------------------------------
// MissionComparison reads from IDB.  For the paper snapshot we pre-seed one
// SimSession per analog mission using seeded synthetic chi samples (no actual
// simulateMission call — that would be slow and non-deterministic across
// browser environments).  The sessions share a stable runId so pickComparisonSet
// finds exactly ANALOG_MISSIONS.length rows in a single group.
//
// The hook returns the fixed candidateId so MissionComparison can query them.

const PAPER_F7_CANDIDATE_ID = "paper-f7-demo-01-fixed";
const PAPER_F7_RUN_ID       = "2026-01-01T00:00:00.000Z"; // stable ISO tag

/** Generate seeded synthetic chi samples for a given mission index (0-based). */
function syntheticMissionChiSamples(missionIdx: number, n = 5_000): number[] {
  let seed = (0xc0ffee + missionIdx * 0x1234) | 0;
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    seed = (seed * 1664525 + 1013904223) | 0;
    // CHI values spread across [0.75, 0.98] depending on mission index.
    const base = 0.98 - missionIdx * 0.025;
    out[i] = Math.max(0, Math.min(1, base + 0.08 * Math.sin(seed / 1_000_000)));
  }
  return out;
}

/** Build a lightweight RiskPosterior from a chi samples array. */
function posteriorFromSamples(chiSamples: number[]): RiskPosterior {
  const sorted = [...chiSamples].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, x) => s + x, 0) / n;
  const ci90: [number, number] = [sorted[Math.floor(n * 0.05)], sorted[Math.floor(n * 0.95)]];
  const ci95: [number, number] = [sorted[Math.floor(n * 0.025)], sorted[Math.floor(n * 0.975)]];
  const pET = chiSamples.filter((x) => x < 0.7).length / n;
  const perConditionQTL: RiskPosterior["perConditionQTL"] = {};
  for (const c of ANALOG_CONDITIONS) {
    perConditionQTL[c.id] = { mean: 0.1, ci90: [0.05, 0.2] };
  }
  return {
    chi: { mean, ci90, ci95 },
    pEarlyTermination: { mean: pET, ci90: [Math.max(0, pET - 0.02), Math.min(1, pET + 0.02)] },
    expectedLostCrewDays: { mean: (1 - mean) * PAPER_MISSION.durationDays * PAPER_MISSION.crewSize, ci90: [0, 5] },
    perConditionQTL,
    ess: n,
    trials: n,
  };
}

/**
 * Hook: on first render, writes one SimSession per analog mission to IDB under
 * PAPER_F7_CANDIDATE_ID.  Sets `data-testfigure-ready` when complete.
 */
function usePaperF7Seed(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const notes = `comparison-run-${PAPER_F7_RUN_ID}`;
      for (let k = 0; k < ANALOG_MISSIONS.length; k++) {
        if (cancelled) return;
        const mission = ANALOG_MISSIONS[k];
        const chiSamples = syntheticMissionChiSamples(k);
        const posterior = posteriorFromSamples(chiSamples);
        await saveSimSession({
          candidateId:   PAPER_F7_CANDIDATE_ID,
          missionId:     mission.id,
          trials:        chiSamples.length,
          chiStar:       0.7,
          seed:          (PAPER_SEED + k) | 0,
          priorsVersion: SYNTHETIC_PRIORS.model_version,
          posterior,
          chiSamples,
          qtlSamples:    [],
          notes:         `tier=${PAPER_TIER} · ${notes}`,
        });
      }
      // Give MissionComparison time to load the cache and paint.
      setTimeout(() => {
        if (!cancelled && containerRef.current) {
          containerRef.current.setAttribute("data-testfigure-ready", "true");
        }
      }, 2_000);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ---------------------------------------------------------------------------
// Generic "ready" hook for ECharts-based paper figures
// ---------------------------------------------------------------------------
// ECharts renders to canvas; there is no DOM sentinel after paint.
// We wait ~600 ms after mount (matching the animation: false but allowing the
// React render + ECharts init cycle to complete).

function useEChartsReady(containerRef: React.RefObject<HTMLDivElement | null>, delayMs = 600) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.setAttribute("data-testfigure-ready", "true");
      }
    }, delayMs);
    return () => clearTimeout(t);
  }, [containerRef, delayMs]);
}

// ---------------------------------------------------------------------------
// TestFigureHost
// ---------------------------------------------------------------------------

export function TestFigureHost({ figureId }: { figureId: string }) {
  const wrap = (children: ReactNode) => (
    <div data-figure-id={figureId} className="p-8 bg-white" style={{ width: 800 }}>
      {children}
    </div>
  );

  if (figureId === "F1") {
    return wrap(<PosteriorPlot posterior={syntheticPosterior()} seed={0xc0ffee} alias="test-snapshot" />);
  }
  if (figureId === "F2") {
    const chiSamples = syntheticChiSamples();
    const sorted = [...chiSamples].sort((a, b) => a - b);
    return wrap(
      <RiskHistogram
        chiSamples={chiSamples}
        chiMean={sorted[Math.floor(chiSamples.length / 2)]}
        chiCi90={[sorted[Math.floor(chiSamples.length * 0.05)], sorted[Math.floor(chiSamples.length * 0.95)]]}
      />
    );
  }
  if (figureId === "F4") {
    return wrap(
      <DashboardSummary
        data={[
          { candidateId: "a", alias: "alpha", chiMean: 0.97, chiCi90: [0.95, 0.99] as const },
          { candidateId: "b", alias: "bravo", chiMean: 0.94, chiCi90: [0.91, 0.97] as const },
          { candidateId: "c", alias: "charlie", chiMean: 0.89, chiCi90: [0.85, 0.93] as const },
        ]}
      />
    );
  }
  if (figureId === "F5") {
    return wrap(
      <EvidenceReference criterion={PLACEHOLDER_CRITERIA[0]} enteredValue={62.5} />
    );
  }
  if (figureId === "F6") {
    let fakeSeed = 0xc0ffee;
    const radarData = PLACEHOLDER_CRITERIA.map((c) => {
      fakeSeed = (fakeSeed * 1664525 + 1013904223) | 0;
      return {
        criterionId: c.id,
        label: c.label,
        contribution: 0.1 + 0.05 * Math.abs(Math.sin(fakeSeed / 1_000_000)),
      };
    });
    return wrap(<ScoreBreakdownRadar data={radarData} />);
  }

  // ── paper-specific fixtures (T10) ─────────────────────────────────────────
  // Each uses canonical seeded inputs: alias=DEMO-01, seed=0xc0ffee,
  // mission=hi-seas-45d (closest 45-day analog — "mdrs-45d" not in catalog),
  // tier=medium.

  if (figureId === "paper-F3") {
    return <PaperF3 />;
  }
  if (figureId === "paper-F4") {
    return <PaperF4 />;
  }
  if (figureId === "paper-F6") {
    return <PaperF6 />;
  }
  if (figureId === "paper-F7") {
    return <PaperF7 />;
  }

  return <div>Unknown figure id: {figureId}</div>;
}

// ---------------------------------------------------------------------------
// Paper figure sub-components (each manages its own ready attribute)
// ---------------------------------------------------------------------------

function PaperF3() {
  const ref = useRef<HTMLDivElement>(null);
  useEChartsReady(ref);
  const posterior = paperMCDAPosterior();
  return (
    <div
      ref={ref}
      className="p-8 bg-white"
      style={{ width: 1400 }}
    >
      <PosteriorPlot
        posterior={posterior}
        alias={PAPER_ALIAS}
        seed={PAPER_SEED}
        accessTier={PAPER_TIER}
      />
    </div>
  );
}

function PaperF4() {
  const ref = useRef<HTMLDivElement>(null);
  useEChartsReady(ref);
  const posterior = paperMCDAPosterior();
  return (
    <div
      ref={ref}
      className="p-8 bg-white"
      style={{ width: 1400 }}
    >
      <MCDACalculationTrace
        posterior={posterior}
        criteria={PLACEHOLDER_CRITERIA}
        scores={paperScores()}
        alias={PAPER_ALIAS}
        seed={PAPER_SEED}
        accessTier={PAPER_TIER}
      />
    </div>
  );
}

function PaperF6() {
  const ref = useRef<HTMLDivElement>(null);
  useEChartsReady(ref);
  const riskPost = paperRiskPosterior();
  const assessment = assessLxC(riskPost);
  return (
    <div
      ref={ref}
      className="p-8 bg-white"
      style={{ width: 1400 }}
    >
      <LxCMatrix assessment={assessment} />
    </div>
  );
}

function PaperF7() {
  const ref = useRef<HTMLDivElement>(null);
  usePaperF7Seed(ref);
  return (
    <div
      ref={ref}
      className="p-8 bg-white"
      style={{ width: 1400 }}
    >
      <MissionComparison
        candidateId={PAPER_F7_CANDIDATE_ID}
        accessTier={PAPER_TIER}
      />
    </div>
  );
}
