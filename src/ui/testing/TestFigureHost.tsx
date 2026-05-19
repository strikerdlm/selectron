import type { ReactNode } from "react";
import type { Posterior } from "@/types";
import { PosteriorPlot } from "@/ui/figures/PosteriorPlot";
import { RiskHistogram } from "@/ui/figures/RiskHistogram";
import { DashboardSummary } from "@/ui/figures/DashboardSummary";
import { EvidenceReference } from "@/ui/figures/EvidenceReference";
import { ScoreBreakdownRadar } from "@/ui/figures/ScoreBreakdownRadar";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
// MissionComparison needs IDB; skip F7 in snapshot tests.
// ConditionContribution (F3) needs a RiskPosterior fixture — also skipped.

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
  // F3 needs a RiskPosterior fixture; F7 needs IDB — both omitted from headless snapshot tests.
  return <div>Unknown figure id: {figureId}</div>;
}
