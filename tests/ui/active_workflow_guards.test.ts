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
      "src/ui/views/calibration/VVPanel.tsx",
      "src/imm/types.ts",
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
      "Run Validation",
      "calibrated and validated",
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
    expect(readRepoFile("src/ui/views/calibration/BatchFitPanel.tsx")).toContain("malformed accepted rows");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("data/demo-criteria");
    expect(readRepoFile("src/ui/App.tsx")).toContain("SELECTRON_VERSION");
    // F3: session save records the operative scenario controls, not just
    // couplingMode.
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("familyBetaScale: state.familyBetaScale");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("priorsHash");
    // F4: every outcome surface carries the operative coverage fact.
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("EVIDENCE_COVERAGE_STATEMENT");
    expect(readRepoFile("src/ui/views/CrewComposition.tsx")).toContain("accepted coverage");
    expect(readRepoFile("src/ui/views/calibration/VVPanel.tsx")).toContain("Run K15 Benchmark");
    expect(readRepoFile("src/ui/wizard/StepReview.tsx")).toContain("scoreDistribution");
    expect(readRepoFile("src/ui/wizard/StepReview.tsx")).not.toContain("PosteriorPlot");
    expect(readRepoFile("src/ui/components/ScoreCard.tsx")).toContain("interval₉₀");
    expect(readRepoFile("src/ui/components/ScoreCard.tsx")).not.toContain("CI₉₀");
    expect(readRepoFile("src/ui/figures/captions/F1.captions.ts")).toContain("Central 90% score interval");
  });

  it("labels ordinary simulation spread as simulation intervals, reserving CI labels for K15 benchmarks", () => {
    const ordinarySimulationFiles = [
      "src/ui/components/CompositeCrewPanel.tsx",
      "src/ui/components/RiskCard.tsx",
      "src/ui/figures/CalculationTrace.tsx",
      "src/ui/figures/ConditionContribution.tsx",
      "src/ui/figures/DashboardSummary.tsx",
      "src/ui/figures/PaperF7IMM.tsx",
      "src/ui/figures/RiskHistogram.tsx",
      "src/ui/figures/captions/F2.captions.ts",
      "src/ui/figures/captions/F4.captions.ts",
    ];

    for (const path of ordinarySimulationFiles) {
      const source = readRepoFile(path);
      expect(source, `${path} should describe ordinary spread as simulation intervals`).toContain(
        "simulation interval",
      );
      expect(source, `${path} should not use CI labels for ordinary simulation intervals`).not.toContain("CI₉");
    }
  });

  it("publishes a model card with explicit non-validation boundaries", () => {
    const source = readRepoFile("docs/model_card.md");

    expect(source).toContain("No population, mission type, mission duration range, or analog facility family is currently validated");
    expect(source).toContain("valid accepted active-parameter coverage: 0/4,849");
    expect(source).toContain("Unacceptable Extrapolations");
    expect(source).toContain("not an empirically calibrated analog-risk predictor");
    expect(readRepoFile("README.md")).toContain("docs/model_card.md");
    expect(readRepoFile("docs/Manual.md")).toContain("docs/model_card.md");
  });

  it("keeps the legacy paper package retired instead of presenting stale submission artifacts", () => {
    const retiredPaperFiles = [
      "paper/manuscript.md",
      "paper/manuscript_pjambp.md",
      "paper/supplementary/S-Methods-1-vv-dossier.md",
      "paper/supplementary/S-Methods-2-nasa-mc-audit.md",
    ];

    expect(readRepoFile("paper/RETIREMENT_NOTICE.md")).toContain("Do not submit, cite, rebuild, or upload");
    expect(readRepoFile("paper/Makefile")).toContain("The paper/ submission package is retired");

    for (const path of retiredPaperFiles) {
      const source = readRepoFile(path);
      expect(source, `${path} must be marked retired`).toContain("status: \"retired\"");
      expect(source, `${path} must block submission use`).toMatch(/must not be\s+submitted|Do not use this file/);
    }

    expect(readRepoFile("paper/supplementary/S-Methods-1-vv-dossier.md")).not.toContain("Factor 2 — Validation");
    expect(readRepoFile("paper/supplementary/S-Methods-1-vv-dossier.md")).not.toContain("credible interval");
    expect(readRepoFile("paper/supplementary/S-Methods-2-nasa-mc-audit.md")).not.toContain("simulateMission");
  });

  it("keeps the slow validation workflow archiving release-verification artifacts", () => {
    const workflow = readRepoFile(".github/workflows/nightly.yml");

    expect(workflow).toContain("npm run test:slow");
    expect(workflow).toContain("npm run validate:imm:analog");
    expect(workflow).toContain("npm run validate:imm");
    expect(workflow).toContain("npm run verify:e2e");
    expect(workflow).toContain("python -m pytest");
    expect(workflow).toContain("python -m selectron --dry-run");
    expect(workflow).toContain("verification-artifacts/run-metadata.env");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });
});
