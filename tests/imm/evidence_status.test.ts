import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildEvidenceStatus } from "../../scripts/evidence_status";

const LEDGER_HEADER = [
  "status",
  "parameter_path",
  "condition_id",
  "mapped_prior_id",
  "mission_type",
  "study_doi",
  "study_slug",
  "endpoint_definition",
  "numerator",
  "denominator",
  "person_days",
  "events",
  "exposure_time",
  "repeated_measure_structure",
  "extraction_quote",
  "extractor",
  "verifier",
  "risk_of_bias",
  "transportability",
  "holdout_design",
  "calibration_metrics",
  "transformation",
  "uncertainty_distribution",
  "model_version",
  "acceptance_version",
  "prior_value_hash",
  "notes",
];

function writeSourceFixture(root: string, slug = "fixture-source", doi = "10.0000/fixture"): void {
  mkdirSync(join(root, "research/evidence"), { recursive: true });
  writeFileSync(
    join(root, `research/evidence/${slug}.md`),
    `---\ntitle: "Fixture source"\ndoi: ${doi}\n---\n\n# Fixture source\n\nFixture source reports 1 event over 10 person-days.\n`,
  );
}

function writeSingleParameterFixture(root: string, rowOverrides: Record<string, string> = {}): void {
  mkdirSync(join(root, "research/evidence_extracted"), { recursive: true });
  mkdirSync(join(root, "src/data"), { recursive: true });
  writeSourceFixture(root);
  writeFileSync(
    join(root, "src/data/imm-priors.json"),
    JSON.stringify({
      schema_version: 1,
      calibration_target: "fixture",
      conditions: {
        fixture: {
          source_ref: "accepted fixture",
          incidence: { distribution: "Fixed", lambda_fixed: 0.1 },
        },
      },
      global_calibration: {},
    }),
  );
  const row: Record<string, string> = {
    status: "accepted",
    parameter_path: "conditions.fixture.incidence.lambda_fixed",
    condition_id: "fixture",
    mapped_prior_id: "fixture",
    mission_type: "fixture",
    study_doi: "10.0000/fixture",
    study_slug: "fixture-source",
    endpoint_definition: "fixture endpoint",
    numerator: "1",
    denominator: "10",
    person_days: "10",
    events: "1",
    exposure_time: "fixture exposure",
    repeated_measure_structure: "independent",
    extraction_quote: "Fixture source reports 1 event over 10 person-days.",
    extractor: "extractor-a",
    verifier: "verifier-b",
    risk_of_bias: "low",
    transportability: "direct",
    holdout_design: "hold out fixture-source-family",
    calibration_metrics: "coverage; calibration-in-the-large; brier",
    transformation: "none",
    uncertainty_distribution: "fixed",
    model_version: "fixture-v1",
    acceptance_version: "accepted-v1",
    prior_value_hash: "14be4b45f18e0d8c",
    notes: "",
    ...rowOverrides,
  };
  writeFileSync(
    join(root, "research/evidence_extracted/evidence_ledger.csv"),
    [LEDGER_HEADER, LEDGER_HEADER.map((field) => row[field] ?? "")].map((values) => values.join(",")).join("\n"),
  );
}

describe("evidence status gate", () => {
  it("reports unadjudicated status when queued proposal rows exist but no accepted coverage exists", () => {
    const status = buildEvidenceStatus();

    expect(status.acceptedCount).toBe(0);
    expect(status.proposalCount).toBe(5);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.status).toBe("unadjudicated");
    expect(status.proposalRefCount).toBeGreaterThan(0);
    expect(status.activeParameterCount).toBeGreaterThan(0);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.uncoveredParameterCount).toBe(status.activeParameterCount);
    expect(status.malformedAcceptedRows).toHaveLength(0);
    expect(status.message).toContain("No complete adjudicated analog evidence release");
  });

  it("requires parameter-level accepted coverage for an adjudicated fixture", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    mkdirSync(join(root, "research/evidence_extracted"), { recursive: true });
    mkdirSync(join(root, "src/data"), { recursive: true });
    writeSourceFixture(root);

    writeFileSync(
      join(root, "src/data/imm-priors.json"),
      JSON.stringify({
        schema_version: 1,
        calibration_target: "fixture",
        conditions: {
          fixture: {
            source_ref: "accepted fixture",
            incidence: { distribution: "Fixed", lambda_fixed: 0.1 },
            severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 9 },
            treated: { fi_cp1: { min: 0, mode: 0, max: 0 } },
            untreated: { fi_cp1: { min: 0.1, mode: 0.2, max: 0.3 } },
            risk_factor_multipliers: { "sex-male": 1.2 },
            required_resources: { "bandage-small": 1 },
          },
        },
        global_calibration: { tierA_multiplier: 1 },
      }),
    );

    const parameterPaths = [
      "conditions.fixture.incidence.lambda_fixed",
      "conditions.fixture.severity.worst_case_prob_alpha",
      "conditions.fixture.severity.worst_case_prob_beta",
      "conditions.fixture.treated.fi_cp1.min",
      "conditions.fixture.treated.fi_cp1.mode",
      "conditions.fixture.treated.fi_cp1.max",
      "conditions.fixture.untreated.fi_cp1.min",
      "conditions.fixture.untreated.fi_cp1.mode",
      "conditions.fixture.untreated.fi_cp1.max",
      "conditions.fixture.risk_factor_multipliers.sex-male",
      "conditions.fixture.required_resources.bandage-small",
      "global_calibration.tierA_multiplier",
    ];
    const hashes: Record<string, string> = {
      "conditions.fixture.incidence.lambda_fixed": "14be4b45f18e0d8c",
      "conditions.fixture.severity.worst_case_prob_alpha": "6b86b273ff34fce1",
      "conditions.fixture.severity.worst_case_prob_beta": "19581e27de7ced00",
      "conditions.fixture.treated.fi_cp1.min": "5feceb66ffc86f38",
      "conditions.fixture.treated.fi_cp1.mode": "5feceb66ffc86f38",
      "conditions.fixture.treated.fi_cp1.max": "5feceb66ffc86f38",
      "conditions.fixture.untreated.fi_cp1.min": "14be4b45f18e0d8c",
      "conditions.fixture.untreated.fi_cp1.mode": "44896b09365746b5",
      "conditions.fixture.untreated.fi_cp1.max": "221764976efe0413",
      "conditions.fixture.risk_factor_multipliers.sex-male": "77ac319bfe1979e2",
      "conditions.fixture.required_resources.bandage-small": "6b86b273ff34fce1",
      "global_calibration.tierA_multiplier": "6b86b273ff34fce1",
    };
    const rows = parameterPaths.map((path) => [
      "accepted",
      path,
      "fixture",
      "fixture",
      "fixture",
      "10.0000/fixture",
      "fixture-source",
      "fixture endpoint",
      "1",
      "10",
      "10",
      "1",
      "fixture exposure",
      "independent",
      "Fixture source reports 1 event over 10 person-days.",
      "extractor-a",
      "verifier-b",
      "low",
      "direct",
      "hold out fixture-source-family",
      "coverage; calibration-in-the-large; brier",
      "none",
      "fixed",
      "fixture-v1",
      "accepted-v1",
      hashes[path],
      "",
    ]);
    writeFileSync(
      join(root, "research/evidence_extracted/evidence_ledger.csv"),
      [LEDGER_HEADER, ...rows].map((row) => row.join(",")).join("\n"),
    );

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(true);
    expect(status.activeParameterCount).toBe(parameterPaths.length);
    expect(status.uncoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows).toEqual([]);
  });

  it("rejects accepted rows whose DOI does not match the resolved source slug", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { study_doi: "10.0000/wrong" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/study_doi 10\.0000\/wrong does not match fixture-source/);
  });

  it("rejects accepted rows whose source slug cannot be traced to source markdown", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { study_slug: "missing-source" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/study_slug missing-source does not resolve/);
  });

  it("rejects accepted rows whose extraction quote is not in the resolved source", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { extraction_quote: "A different source reports no usable count data." });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/extraction_quote is not found verbatim/);
  });

  it("rejects accepted condition rows whose mapped prior id does not match the parameter path", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { mapped_prior_id: "different-condition" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/mapped_prior_id different-condition does not match/);
  });

  it("rejects accepted rows missing validation-design metadata", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { holdout_design: "", calibration_metrics: "" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/missing holdout_design\|calibration_metrics/);
  });

  it("rejects accepted rows with fractional event-count fields", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { events: "1.5", numerator: "1.5" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/events is not a finite non-negative integer/);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/numerator is not a finite non-negative integer/);
  });

  it("rejects accepted rows with fractional person-day exposure", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    writeSingleParameterFixture(root, { denominator: "", person_days: "10.5", exposure_time: "" });

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.acceptedCoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/person_days is not a finite positive integer/);
    expect(status.malformedAcceptedRows.join("\n")).toMatch(/missing finite positive denominator\/person_days\/exposure_time/);
  });
});
