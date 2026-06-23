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
});
