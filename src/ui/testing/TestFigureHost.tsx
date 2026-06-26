import { type ReactNode } from "react";
import type { Posterior } from "@/types";
import { PosteriorPlot } from "@/ui/figures/PosteriorPlot";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { DashboardSummary } from "@/ui/figures/DashboardSummary";
import { EvidenceReference } from "@/ui/figures/EvidenceReference";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { DEMO_CRITERIA } from "@/data/demo-criteria";
import { normalizeScore } from "@/engine/normalize";

const RETIRED_PAPER_FIGURE_IDS = new Set([
  "paper-F3",
  "paper-F4",
  "paper-F6",
  "paper-F7",
  "paper-F6-imm",
  "paper-F7-imm",
]);

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

/**
 * Heterogeneous candidate scores for the generic F6 score-breakdown fixture.
 * They span the criterion ranges so the radar chart has asymmetric spokes.
 */
const HETERO_SCORES: Record<string, number> = {
  "psych.conscientiousness":           85,
  "psych.emotional_stability":         40,
  "physical.vo2max":                   60,
  "professional.technical_competence":  3,
  "behavioral.teamwork":                4,   // scale 1–5
  "cognitive.nasa_cognition_battery":   2.0,
  "cognitive.pvt_b_rt_ms":           220,
  "physical.sot5_equilibrium":         85,
  "psych.resilience_cdrisc":           90,
  "psych.emotional_intelligence":       1.5,
  "psych.mmpi2rf_eid":                 42,
  "psych.bdi2_baseline":                3,
};

/** Closed-form per-criterion contributions (w̄_k · u_k) for the ScoreBreakdownRadar. */
function paperRadarData(): import("@/ui/figures/ScoreBreakdownRadar").RadarDatum[] {
  const K = DEMO_CRITERIA.length;
  const wBar = 1 / K; // Dirichlet(1,…,1) mean weight per criterion
  return DEMO_CRITERIA.map((c) => {
    const raw = HETERO_SCORES[c.id];
    const z   = normalizeScore(raw, c.scale, c.higherIsBetter);
    return {
      criterionId: c.id,
      label:       c.label,
      contribution: wBar * z,
    };
  });
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
      <EvidenceReference criterion={DEMO_CRITERIA[0]} enteredValue={62.5} />
    );
  }
  if (figureId === "F6") {
    // Use score-derived contributions from HETERO_SCORES (non-degenerate, asymmetric spokes).
    return wrap(<ScoreBreakdownRadar data={paperRadarData()} />);
  }

  if (RETIRED_PAPER_FIGURE_IDS.has(figureId)) {
    return wrap(<RetiredPaperFigure figureId={figureId} />);
  }

  return <div>Unknown figure id: {figureId}</div>;
}

function RetiredPaperFigure({ figureId }: { figureId: string }) {
  return (
    <div
      data-testfigure-ready="true"
      className="rounded border border-slate-300 bg-slate-50 p-6 text-slate-900"
    >
      <h1 className="text-lg font-semibold">Retired paper figure</h1>
      <p className="mt-2 text-sm leading-6">
        {figureId} belonged to the retired private manuscript package. It no
        longer renders because the former figure set encoded obsolete posterior,
        HSRB, and operational-verdict language.
      </p>
    </div>
  );
}
