#!/usr/bin/env tsx
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildSeverityBranchCoverage } from "../src/imm/severity-coverage";

const ROOT = process.cwd();
const OUT = resolve(ROOT, "docs/severity_branch_coverage.md");

function renderMarkdown(): string {
  const coverage = buildSeverityBranchCoverage();
  const rows = [
    "| Item | Count |",
    "|---|---:|",
    `| Conditions with distinct best/worst outcome branches | ${coverage.conditionsWithDistinctBestWorstOutcomeBranches} |`,
    `| Conditions with duplicated legacy branches | ${coverage.conditionsWithDuplicatedLegacyBranches} |`,
    `| Conditions with independently adjudicated severity evidence | ${coverage.conditionsWithIndependentlyAdjudicatedSeverityEvidence} |`,
  ];

  const details = coverage.rows
    .map((row) =>
      `| \`${row.conditionId}\` | ${row.label} | ${row.distinctBestWorstBranches ? "yes" : "no"} | ${row.branchEvidenceStatus} |`,
    )
    .join("\n");

  return [
    "# IMM Severity-Branch Coverage",
    "",
    `Generated: ${coverage.generatedAt}`,
    "",
    "This table is generated from the active `src/data/imm-priors.json` catalog.",
    "Distinct best/worst branches indicate mechanistic branch coverage only; they do not imply adjudicated clinical severity evidence.",
    "",
    ...rows,
    "",
    "| Condition | Label | Distinct branches | Branch evidence status |",
    "|---|---|---:|---|",
    details,
    "",
  ].join("\n");
}

if (process.argv.includes("--write")) {
  writeFileSync(OUT, renderMarkdown(), "utf8");
  console.log(`wrote ${OUT}`);
} else {
  process.stdout.write(renderMarkdown());
}
