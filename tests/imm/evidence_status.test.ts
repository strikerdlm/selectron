import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildEvidenceStatus } from "../../scripts/evidence_status";

describe("evidence status gate", () => {
  it("reports current release priors as unadjudicated when accepted ledger rows are absent", () => {
    const status = buildEvidenceStatus();

    expect(status.acceptedCount).toBe(0);
    expect(status.releasePriorsAdjudicated).toBe(false);
    expect(status.status).toBe("unadjudicated");
    expect(status.proposalRefCount).toBeGreaterThan(0);
    expect(status.activeParameterCount).toBeGreaterThan(0);
    expect(status.uncoveredParameterCount).toBe(status.activeParameterCount);
    expect(status.message).toContain("No complete adjudicated analog evidence release");
  });

  it("requires parameter-level accepted coverage for an adjudicated fixture", () => {
    const root = mkdtempSync(join(tmpdir(), "selectron-evidence-"));
    mkdirSync(join(root, "research/evidence_extracted"), { recursive: true });
    mkdirSync(join(root, "src/data"), { recursive: true });

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
    const header = [
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
      "transformation",
      "uncertainty_distribution",
      "model_version",
      "acceptance_version",
      "prior_value_hash",
      "notes",
    ];
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
      "fixture quote",
      "extractor-a",
      "verifier-b",
      "low",
      "direct",
      "none",
      "fixed",
      "fixture-v1",
      "accepted-v1",
      "sha256-fixture",
      "",
    ]);
    writeFileSync(
      join(root, "research/evidence_extracted/evidence_ledger.csv"),
      [header, ...rows].map((row) => row.join(",")).join("\n"),
    );

    const status = buildEvidenceStatus(root);
    expect(status.releasePriorsAdjudicated).toBe(true);
    expect(status.activeParameterCount).toBe(parameterPaths.length);
    expect(status.uncoveredParameterCount).toBe(0);
    expect(status.malformedAcceptedRows).toEqual([]);
  });
});
