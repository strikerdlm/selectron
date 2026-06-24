import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { loadIMMPriors, validatePriorsJson } from "../../src/imm/priors";

const PRIORS_PATH = "src/data/imm-priors.json";
const REPRODUCIBILITY_LOCK_PATH = "paper/REPRODUCIBILITY_LOCK.json";
const INTERPERSONAL_CONFLICT_EVIDENCE_PATH =
  "research/evidence/2026-06-06_interpersonal-conflict_ICE-prior.md";
const EXPECTED_PRIORS_SHA256 =
  "e5989341ef5c5dba29eefe57999b4e3843dbbe3bb60964f9c5236bde9341267b";
const EXPECTED_PROVENANCE_COUNTS: Record<string, number> = {
  "tierA-nasa": 34,
  "tierB-pymc": 66,
  "tierB-lit": 1,
};
const DISALLOWED_FREEZE_TOKENS = [
  /placeholder doi/i,
  /doi_place/i,
  /__doi/i,
  /\bTBD\b/i,
  /\bTODO\b/i,
  /fill in/i,
  /Van Fossen/i,
];

function countProvenance(): Record<string, number> {
  const priors = loadIMMPriors();
  const counts: Record<string, number> = {};
  for (const prior of Object.values(priors.conditions)) {
    counts[prior.provenance] = (counts[prior.provenance] ?? 0) + 1;
  }
  return counts;
}

function priorsFixture(): any {
  return JSON.parse(readFileSync(PRIORS_PATH, "utf8"));
}

describe("IMM priors", () => {
  it("loads imm-priors.json", () => {
    const priors = loadIMMPriors();
    expect(priors.schema_version).toBe(1);
    expect(Object.keys(priors.conditions)).toHaveLength(101);
  });

  it("freezes manuscript-critical prior catalog counts and hash", () => {
    const raw = readFileSync(PRIORS_PATH);
    const hash = createHash("sha256").update(raw).digest("hex");
    const counts = countProvenance();

    expect(hash).toBe(EXPECTED_PRIORS_SHA256);
    expect(counts).toEqual(EXPECTED_PROVENANCE_COUNTS);
    expect(counts["tierC-synth"] ?? 0).toBe(0);
  });

  it("reproducibility lock matches the frozen prior catalog", () => {
    const lock = JSON.parse(readFileSync(REPRODUCIBILITY_LOCK_PATH, "utf8")) as {
      source_files: Record<
        string,
        {
          sha256: string;
          condition_count?: number;
          provenance_counts?: Record<string, number>;
        }
      >;
    };
    const lockedPriors = lock.source_files[PRIORS_PATH];

    expect(lockedPriors.sha256).toBe(EXPECTED_PRIORS_SHA256);
    expect(lockedPriors.condition_count).toBe(101);
    expect(lockedPriors.provenance_counts).toEqual({
      ...EXPECTED_PROVENANCE_COUNTS,
      "tierC-synth": 0,
    });
  });

  it("every prior carries a provenance tag and source_ref", () => {
    const priors = loadIMMPriors();
    for (const [_id, p] of Object.entries(priors.conditions)) {
      expect(["tierA-nasa","tierB-lit","tierB-pymc","tierC-synth","user-custom"]).toContain(p.provenance);
      expect(typeof p.source_ref).toBe("string");
      expect(p.source_ref.trim().length).toBeGreaterThan(0);
    }
  });

  it("manuscript-freeze source references contain no placeholder or removed citation tokens", () => {
    const priorsRaw = readFileSync(PRIORS_PATH, "utf8");
    const conflictEvidenceRaw = readFileSync(INTERPERSONAL_CONFLICT_EVIDENCE_PATH, "utf8");
    for (const pattern of DISALLOWED_FREEZE_TOKENS) {
      expect(priorsRaw, `imm-priors.json should not match ${pattern}`).not.toMatch(pattern);
      expect(
        conflictEvidenceRaw,
        `interpersonal-conflict evidence should not match ${pattern}`
      ).not.toMatch(pattern);
    }
  });

  it("Beta-Pert outcome ranges respect min <= mode <= max", () => {
    const priors = loadIMMPriors();
    for (const p of Object.values(priors.conditions)) {
      for (const phase of [p.treated.fi_cp1, p.treated.dt_cp1_hours, p.untreated.fi_cp1, p.untreated.dt_cp1_hours]) {
        expect(phase.min).toBeLessThanOrEqual(phase.mode);
        expect(phase.mode).toBeLessThanOrEqual(phase.max);
      }
    }
  });

  it("validatePriorsJson catches malformed input", () => {
    expect(() => validatePriorsJson({})).toThrow();
    expect(() => validatePriorsJson({ schema_version: 0 })).toThrow();
  });

  it("validates the complete runtime schema for the frozen catalog", () => {
    expect(() => validatePriorsJson(priorsFixture())).not.toThrow();
  });

  it("rejects malformed incidence parameters", () => {
    const priors = priorsFixture();
    priors.conditions["acute-sinusitis"].incidence.alpha = Number.NaN;
    expect(() => validatePriorsJson(priors)).toThrow(/acute-sinusitis.*incidence\.alpha/);
  });

  it("rejects probability and duration PERT triples outside runtime bounds", () => {
    const badProbability = priorsFixture();
    badProbability.conditions["acute-sinusitis"].treated.p_evac.max = 1.2;
    expect(() => validatePriorsJson(badProbability)).toThrow(/acute-sinusitis.*treated\.p_evac\.max/);

    const badDuration = priorsFixture();
    badDuration.conditions["acute-sinusitis"].treated.dt_cp1_hours.min = -1;
    expect(() => validatePriorsJson(badDuration)).toThrow(/acute-sinusitis.*treated\.dt_cp1_hours\.min/);
  });

  it("rejects unknown schema fields instead of silently ignoring prior typos", () => {
    const extraTopLevel = priorsFixture();
    extraTopLevel.unreviewed_metadata = {};
    expect(() => validatePriorsJson(extraTopLevel)).toThrow(/priors\.unreviewed_metadata.*runtime prior schema/);

    const extraGlobal = priorsFixture();
    extraGlobal.global_calibration.unreviewed_multiplier = 1;
    expect(() => validatePriorsJson(extraGlobal)).toThrow(/global_calibration\.unreviewed_multiplier.*runtime prior schema/);

    const extraPrior = priorsFixture();
    extraPrior.conditions["acute-sinusitis"].unreviewed_field = 1;
    expect(() => validatePriorsJson(extraPrior)).toThrow(/acute-sinusitis\.unreviewed_field.*runtime prior schema/);

    const extraIncidence = priorsFixture();
    extraIncidence.conditions["acute-sinusitis"].incidence.lamda_fixed = 0.1;
    expect(() => validatePriorsJson(extraIncidence)).toThrow(/acute-sinusitis.*incidence\.lamda_fixed.*runtime prior schema/);

    const extraPert = priorsFixture();
    extraPert.conditions["acute-sinusitis"].treated.p_evac.units = "probability";
    expect(() => validatePriorsJson(extraPert)).toThrow(/acute-sinusitis.*treated\.p_evac\.units.*runtime prior schema/);
  });

  it("rejects unknown prior ids and undocumented kind-multiplier sensitivity keys", () => {
    const unknownPrior = priorsFixture();
    unknownPrior.conditions["not-a-real-condition"] = {
      ...unknownPrior.conditions["acute-sinusitis"],
      conditionId: "not-a-real-condition",
    };
    expect(() => validatePriorsJson(unknownPrior)).toThrow(/not-a-real-condition.*IMM_CONDITIONS/);

    const unknownMultiplier = priorsFixture();
    unknownMultiplier.global_calibration.kind_multipliers["antarctic-station"]["not-a-real-condition"] = 1;
    expect(() => validatePriorsJson(unknownMultiplier)).toThrow(/not-a-real-condition.*inactive sensitivity key/);
  });

  it("rejects missing generated-condition priors", () => {
    const priors = priorsFixture();
    delete priors.conditions["acute-sinusitis"];
    expect(() => validatePriorsJson(priors)).toThrow(/missing prior for acute-sinusitis/);
  });

  it("rejects unsupported risk-factor and mission-kind keys", () => {
    const badRiskFactor = priorsFixture();
    badRiskFactor.conditions["acute-sinusitis"].risk_factor_multipliers["unsupported-factor"] = 1.1;
    expect(() => validatePriorsJson(badRiskFactor)).toThrow(/unsupported-factor.*risk factor/);

    const badKind = priorsFixture();
    badKind.global_calibration.kind_multipliers["unsupported-kind"] = {};
    expect(() => validatePriorsJson(badKind)).toThrow(/unsupported-kind.*mission kind/);
  });

  it("rejects process/exposure mismatches that would hit the wrong runtime sampler", () => {
    const badEvaUnit = priorsFixture();
    badEvaUnit.conditions["decompression-sickness-secondary-to-extravehicular-activity"].incidence.lambda_unit =
      "events-per-person-day";
    expect(() => validatePriorsJson(badEvaUnit)).toThrow(/decompression-sickness.*events-per-EVA.*EVA-coupled/);

    const badSpeDistribution = priorsFixture();
    badSpeDistribution.conditions["acute-radiation-syndrome"].incidence.distribution = "Gamma-Poisson";
    expect(() => validatePriorsJson(badSpeDistribution)).toThrow(/acute-radiation-syndrome.*Beta-Bernoulli.*SPE-coupled/);

    const badGeneralDistribution = priorsFixture();
    badGeneralDistribution.conditions["acute-sinusitis"].incidence.distribution = "Beta-Bernoulli";
    badGeneralDistribution.conditions["acute-sinusitis"].incidence.alpha = 1;
    badGeneralDistribution.conditions["acute-sinusitis"].incidence.beta = 100;
    expect(() => validatePriorsJson(badGeneralDistribution)).toThrow(/acute-sinusitis.*Beta-Bernoulli.*general-Poisson/);
  });
});
