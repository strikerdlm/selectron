import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

function readRepoFile(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

describe("active analog workflow guards", () => {
  const activeFiles = [
    "src/ui/App.tsx",
    "src/ui/views/Dashboard.tsx",
    "src/ui/views/Wizard.tsx",
    "src/ui/wizard/StepMissionSim.tsx",
    "src/ui/dashboard/CandidateCard.tsx",
  ];

  it("keeps the candidate wizard and dashboard disconnected from the archived risk engine", () => {
    const forbidden = [
      "@/risk/",
      "@/data/analog-missions",
      "@/data/synthetic-iter3",
      "simulateMission",
      "synthesizeCrew",
      "saveSimSession",
      "recentSimsFor",
      "@/data/placeholder-criteria",
      "import { TestFigureHost",
    ];

    for (const path of activeFiles) {
      const source = readRepoFile(path);
      for (const token of forbidden) {
        expect(source, `${path} must not contain ${token}`).not.toContain(token);
      }
    }
  });

  it("documents Stage-B handoff instead of running a candidate-level medical simulation", () => {
    const source = readRepoFile("src/ui/wizard/StepMissionSim.tsx");

    expect(source).toContain("Team simulation handoff");
    expect(source).toContain("No single-candidate medical prediction");
    expect(source).toContain("No candidate is cloned");
    expect(source).toContain("Open Crew Composition");
  });

  it("keeps active workflow copy inside research-prototype claim boundaries", () => {
    const checkedFiles = [
      ...activeFiles,
      "src/ui/views/CrewComposition.tsx",
      "src/ui/components/CompositeCrewPanel.tsx",
      "src/ui/components/CrewMemberCard.tsx",
      "src/ui/components/ScoreCard.tsx",
      "src/ui/figures/IMMHeadlineCard.tsx",
      "src/ui/figures/CalculationTrace.tsx",
      "src/ui/wizard/StepReview.tsx",
      "src/ui/views/calibration/BatchFitPanel.tsx",
      "src/ui/views/calibration/ConditionsPanel.tsx",
    ];
    const forbidden = [
      "NASA-standard",
      "NASA verdict",
      "mission success probability",
      "posterior certainty",
      "estimate precision",
      "HSRB risk posture",
      "Authoritative NASA Integrated Medical Model value",
      "NASA-sourced",
      "β is a Cox-style coefficient elicited from the literature",
      "Cox-style coefficient elicited from the literature",
      "authoritative operational values",
      "release priors are adjudicated",
    ];

    for (const path of checkedFiles) {
      const source = readRepoFile(path);
      for (const token of forbidden) {
        expect(source, `${path} must not contain ${token}`).not.toContain(token);
      }
    }

    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("scenario levers");
    expect(readRepoFile("src/ui/figures/CalculationTrace.tsx")).toContain("operator-supplied stress-test coefficient");
    expect(readRepoFile("src/ui/figures/CalculationTrace.tsx")).toContain("accepted evidence ledger does not currently calibrate");
    expect(readRepoFile("src/ui/views/calibration/ConditionsPanel.tsx")).toContain("NASA-publication-attributed Selectron prior");
    expect(readRepoFile("src/ui/views/calibration/BatchFitPanel.tsx")).toContain("Evidence ledger not release-ready");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("data/demo-criteria");
    expect(readRepoFile("src/ui/App.tsx")).toContain("SELECTRON_VERSION");
    // F3: session save records the operative scenario controls, not just
    // couplingMode.
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("familyBetaScale: state.familyBetaScale");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("priorsHash");
    // F4: every outcome surface carries the operative coverage fact.
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("EVIDENCE_COVERAGE_STATEMENT");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("accepted coverage");
  });
});
