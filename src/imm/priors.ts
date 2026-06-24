// src/imm/priors.ts
import priorsJson from "../data/imm-priors.json";
import { IMM_CONDITIONS } from "./conditions";
import type {
  IMMBetaPert,
  IMMConditionOutcomes,
  IMMMissionKind,
  IMMPrior,
  IMMProcessType,
  IMMRiskFactor,
} from "./types";

export type IMMPriorsFile = {
  schema_version: number;
  calibration_target: string;
  conditions: Record<string, IMMPrior>;
  global_calibration: {
    // Per-scenario Tier-C multipliers (T31 legacy; dormant — read only by
    // `calibrateTierCMultipliers()` back-fit routine, not by simulateIMM at
    // runtime). Kept for backward compatibility; prefer the rev3-b single-value
    // tier multipliers below.
    tierC_multiplier_iss_hms: number;
    tierC_multiplier_iss_none: number;
    tierC_multiplier_iss_unlimited: number;
    // priors-rev3-b: single-value global incidence multipliers per tier, applied
    // by simulateIMM as defaults when caller's opts don't override.
    // Physically: incidence is sampled *before* any kit is applied, so the
    // multiplier is scenario-invariant. Per-scenario tuning above was a
    // calibration hack; these single-value fields are the principled replacement.
    tierA_multiplier?: number;
    tierB_multiplier?: number;
    tierC_multiplier?: number;
    fit_against: string;
    fit_residuals_within_CI95: boolean;
    /**
     * 2026-06-04 Antarctic / controlled-habitat context modulation. Per-(kind,
     * condition) incidence multiplier. Multiplier of 1.0 = no change vs. base
     * prior. >1 = elevated rate, <1 = reduced, 0 = no events.
     *
     * Applied AFTER the tier multiplier (tierA/B/C) and BEFORE risk-factor and
     * Stage-A multipliers. Falls through to 1.0 for any (kind, condition) pair
     * not listed. This means:
     *   - K15 ISS runs (kind: "leo-iss") are unaffected.
     *   - Persisted Dexie `IMMSession` rows with the legacy `analog-isolation`
     *     kind load with no multiplier change and reproduce the pre-change run.
     *
     * Anchored on `research/analog_incidence_antarctic.md` (Bhatia 2012,
     * Palinkas 2004, Pattarini 2016, Hong 2022, Peřina 2024, Nirwan 2022).
     */
    kind_multipliers?: Partial<Record<IMMMissionKind, Record<string, number>>>;
  };
};

const ALLOWED_PROVENANCE = new Set([
  "tierA-nasa",
  "tierB-lit",
  "tierB-pymc",
  "tierC-synth",
  "user-custom",
]);
const ALLOWED_DISTRIBUTIONS = new Set([
  "Lognormal-Poisson",
  "Gamma-Poisson",
  "Beta-Bernoulli",
  "Fixed",
]);
const ALLOWED_LAMBDA_UNITS = new Set([
  "events-per-person-day",
  "events-per-EVA",
  "events-per-SPE",
]);
const ALLOWED_RISK_FACTORS = new Set<IMMRiskFactor>([
  "sex-male",
  "sex-female",
  "contacts",
  "crowns",
  "CAC-positive",
  "abdominal-surgery-history",
  "EVA",
  "SPE",
]);
const ALLOWED_MISSION_KINDS = new Set<IMMMissionKind>([
  "analog-isolation",
  "analog-controlled",
  "antarctic-station",
  "leo-iss",
  "lunar-artemis-future",
  "interplanetary-mars-future",
]);
const CONDITION_IDS = new Set(IMM_CONDITIONS.map((condition) => condition.id));
const INACTIVE_KIND_MULTIPLIER_KEYS = new Set([
  "frostbite",
  "hypoxia-related-headache",
  "seasonal-affective-disorder",
]);
const EXPECTED_LAMBDA_UNIT_BY_PROCESS: Record<IMMProcessType, string> = {
  "general-Poisson": "events-per-person-day",
  "space-adaptation-once": "events-per-person-day",
  "SA-VIIP-late": "events-per-person-day",
  "EVA-coupled": "events-per-EVA",
  "SPE-coupled": "events-per-SPE",
};
const RATE_COMPATIBLE_DISTRIBUTIONS = new Set([
  "Lognormal-Poisson",
  "Gamma-Poisson",
  "Fixed",
]);
const PRIORS_FILE_KEYS = new Set([
  "schema_version",
  "calibration_target",
  "conditions",
  "global_calibration",
]);
const PRIOR_KEYS = new Set([
  "conditionId",
  "provenance",
  "source_ref",
  "incidence",
  "severity",
  "outcomeScenarios",
  "treated",
  "untreated",
  "risk_factor_multipliers",
  "required_resources",
]);
const INCIDENCE_KEYS = new Set([
  "distribution",
  "mu_log_lambda",
  "sigma_log_lambda",
  "alpha",
  "beta",
  "lambda_fixed",
  "lambda_unit",
]);
const SEVERITY_KEYS = new Set([
  "worst_case_prob_alpha",
  "worst_case_prob_beta",
]);
const OUTCOME_KEYS = new Set([
  "fi_cp1",
  "dt_cp1_hours",
  "fi_cp2",
  "dt_cp2_hours",
  "fi_cp3",
  "p_evac",
  "p_locl",
]);
const BETA_PERT_KEYS = new Set(["min", "mode", "max"]);
const OUTCOME_SCENARIOS_KEYS = new Set(["best", "worst"]);
const SCENARIO_OUTCOME_KEYS = new Set(["treated", "untreated", "evidenceStatus"]);
const GLOBAL_CALIBRATION_KEYS = new Set([
  "tierC_multiplier_iss_hms",
  "tierC_multiplier_iss_none",
  "tierC_multiplier_iss_unlimited",
  "tierA_multiplier",
  "tierB_multiplier",
  "tierC_multiplier",
  "fit_against",
  "fit_residuals_within_CI95",
  "kind_multipliers",
]);

function fail(message: string): never {
  throw new Error(`E_BAD_PRIORS: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) fail(`${path} must be an object`);
  return value;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail(`${path}.${key} is not part of the runtime prior schema`);
    }
  }
}

function requireNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${path} must be a non-empty string`);
  }
  return value;
}

function requireFiniteNumber(
  value: unknown,
  path: string,
  opts: { min?: number; exclusiveMin?: number; max?: number } = {},
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${path} must be a finite number`);
  }
  if (opts.min !== undefined && value < opts.min) {
    fail(`${path} must be >= ${opts.min}, got ${value}`);
  }
  if (opts.exclusiveMin !== undefined && value <= opts.exclusiveMin) {
    fail(`${path} must be > ${opts.exclusiveMin}, got ${value}`);
  }
  if (opts.max !== undefined && value > opts.max) {
    fail(`${path} must be <= ${opts.max}, got ${value}`);
  }
  return value;
}

function validateBetaPert(value: unknown, path: string, bounds: { min: number; max?: number }): IMMBetaPert {
  const pert = requireRecord(value, path);
  rejectUnknownKeys(pert, BETA_PERT_KEYS, path);
  const min = requireFiniteNumber(pert.min, `${path}.min`, { min: bounds.min, max: bounds.max });
  const mode = requireFiniteNumber(pert.mode, `${path}.mode`, { min: bounds.min, max: bounds.max });
  const max = requireFiniteNumber(pert.max, `${path}.max`, { min: bounds.min, max: bounds.max });
  if (min > mode || mode > max) {
    fail(`${path} must satisfy min <= mode <= max`);
  }
  return { min, mode, max };
}

function validateOutcomes(value: unknown, path: string): IMMConditionOutcomes {
  const outcomes = requireRecord(value, path);
  rejectUnknownKeys(outcomes, OUTCOME_KEYS, path);
  return {
    fi_cp1: validateBetaPert(outcomes.fi_cp1, `${path}.fi_cp1`, { min: 0, max: 1 }),
    dt_cp1_hours: validateBetaPert(outcomes.dt_cp1_hours, `${path}.dt_cp1_hours`, { min: 0 }),
    fi_cp2: validateBetaPert(outcomes.fi_cp2, `${path}.fi_cp2`, { min: 0, max: 1 }),
    dt_cp2_hours: validateBetaPert(outcomes.dt_cp2_hours, `${path}.dt_cp2_hours`, { min: 0 }),
    fi_cp3: validateBetaPert(outcomes.fi_cp3, `${path}.fi_cp3`, { min: 0, max: 1 }),
    p_evac: validateBetaPert(outcomes.p_evac, `${path}.p_evac`, { min: 0, max: 1 }),
    p_locl: validateBetaPert(outcomes.p_locl, `${path}.p_locl`, { min: 0, max: 1 }),
  };
}

function validatePrior(id: string, value: unknown): void {
  const prior = requireRecord(value, `conditions.${id}`);
  rejectUnknownKeys(prior, PRIOR_KEYS, `conditions.${id}`);
  if (!CONDITION_IDS.has(id)) fail(`conditions.${id} is not in IMM_CONDITIONS`);
  const condition = IMM_CONDITIONS.find((c) => c.id === id);
  if (!condition) fail(`conditions.${id} is not in IMM_CONDITIONS`);
  const conditionId = requireNonEmptyString(prior.conditionId, `conditions.${id}.conditionId`);
  if (conditionId !== id) fail(`conditions.${id}.conditionId must match key`);

  const provenance = requireNonEmptyString(prior.provenance, `conditions.${id}.provenance`);
  if (!ALLOWED_PROVENANCE.has(provenance)) fail(`conditions.${id}.provenance is unsupported: ${provenance}`);
  requireNonEmptyString(prior.source_ref, `conditions.${id}.source_ref`);

  const incidence = requireRecord(prior.incidence, `conditions.${id}.incidence`);
  rejectUnknownKeys(incidence, INCIDENCE_KEYS, `conditions.${id}.incidence`);
  const distribution = requireNonEmptyString(incidence.distribution, `conditions.${id}.incidence.distribution`);
  if (!ALLOWED_DISTRIBUTIONS.has(distribution)) {
    fail(`conditions.${id}.incidence.distribution is unsupported: ${distribution}`);
  }
  const lambdaUnit = requireNonEmptyString(incidence.lambda_unit, `conditions.${id}.incidence.lambda_unit`);
  if (!ALLOWED_LAMBDA_UNITS.has(lambdaUnit)) {
    fail(`conditions.${id}.incidence.lambda_unit is unsupported: ${lambdaUnit}`);
  }
  const expectedLambdaUnit = EXPECTED_LAMBDA_UNIT_BY_PROCESS[condition.processType];
  if (lambdaUnit !== expectedLambdaUnit) {
    fail(
      `conditions.${id}.incidence.lambda_unit must be ${expectedLambdaUnit} for ${condition.processType} conditions`,
    );
  }
  if (condition.processType === "SPE-coupled" && distribution !== "Beta-Bernoulli") {
    fail(`conditions.${id}.incidence.distribution must be Beta-Bernoulli for SPE-coupled conditions`);
  }
  if (condition.processType !== "SPE-coupled" && !RATE_COMPATIBLE_DISTRIBUTIONS.has(distribution)) {
    fail(`conditions.${id}.incidence.distribution ${distribution} is not supported for ${condition.processType} conditions`);
  }
  if (distribution === "Lognormal-Poisson") {
    requireFiniteNumber(incidence.mu_log_lambda, `conditions.${id}.incidence.mu_log_lambda`);
    requireFiniteNumber(incidence.sigma_log_lambda, `conditions.${id}.incidence.sigma_log_lambda`, { exclusiveMin: 0 });
  } else if (distribution === "Gamma-Poisson" || distribution === "Beta-Bernoulli") {
    requireFiniteNumber(incidence.alpha, `conditions.${id}.incidence.alpha`, { exclusiveMin: 0 });
    requireFiniteNumber(incidence.beta, `conditions.${id}.incidence.beta`, { exclusiveMin: 0 });
  } else if (distribution === "Fixed") {
    requireFiniteNumber(incidence.lambda_fixed, `conditions.${id}.incidence.lambda_fixed`, { min: 0 });
  }

  const severity = requireRecord(prior.severity, `conditions.${id}.severity`);
  rejectUnknownKeys(severity, SEVERITY_KEYS, `conditions.${id}.severity`);
  requireFiniteNumber(severity.worst_case_prob_alpha, `conditions.${id}.severity.worst_case_prob_alpha`, { exclusiveMin: 0 });
  requireFiniteNumber(severity.worst_case_prob_beta, `conditions.${id}.severity.worst_case_prob_beta`, { exclusiveMin: 0 });

  validateOutcomes(prior.treated, `conditions.${id}.treated`);
  validateOutcomes(prior.untreated, `conditions.${id}.untreated`);
  if (prior.outcomeScenarios !== undefined) {
    const scenarios = requireRecord(prior.outcomeScenarios, `conditions.${id}.outcomeScenarios`);
    rejectUnknownKeys(scenarios, OUTCOME_SCENARIOS_KEYS, `conditions.${id}.outcomeScenarios`);
    for (const scenarioName of ["best", "worst"] as const) {
      const scenario = requireRecord(scenarios[scenarioName], `conditions.${id}.outcomeScenarios.${scenarioName}`);
      rejectUnknownKeys(scenario, SCENARIO_OUTCOME_KEYS, `conditions.${id}.outcomeScenarios.${scenarioName}`);
      validateOutcomes(scenario.treated, `conditions.${id}.outcomeScenarios.${scenarioName}.treated`);
      validateOutcomes(scenario.untreated, `conditions.${id}.outcomeScenarios.${scenarioName}.untreated`);
      if (
        scenario.evidenceStatus !== undefined &&
        !["accepted", "scenario", "legacy-v1-duplicated"].includes(String(scenario.evidenceStatus))
      ) {
        fail(`conditions.${id}.outcomeScenarios.${scenarioName}.evidenceStatus is unsupported`);
      }
    }
  }

  const multipliers = requireRecord(prior.risk_factor_multipliers, `conditions.${id}.risk_factor_multipliers`);
  for (const [factor, multiplier] of Object.entries(multipliers)) {
    if (!ALLOWED_RISK_FACTORS.has(factor as IMMRiskFactor)) {
      fail(`conditions.${id}.risk_factor_multipliers.${factor} is not a supported risk factor`);
    }
    requireFiniteNumber(multiplier, `conditions.${id}.risk_factor_multipliers.${factor}`, { min: 0 });
  }

  const resources = requireRecord(prior.required_resources, `conditions.${id}.required_resources`);
  for (const [resource, amount] of Object.entries(resources)) {
    if (resource.trim().length === 0) fail(`conditions.${id}.required_resources contains an empty resource key`);
    requireFiniteNumber(amount, `conditions.${id}.required_resources.${resource}`, { min: 0 });
  }
}

export function validatePriorsJson(obj: unknown): asserts obj is IMMPriorsFile {
  if (!obj || typeof obj !== "object") throw new Error("E_BAD_PRIORS: not an object");
  const p = obj as Record<string, unknown>;
  rejectUnknownKeys(p, PRIORS_FILE_KEYS, "priors");
  if (p.schema_version !== 1) throw new Error("E_BAD_PRIORS: schema_version must be 1");
  if (!p.conditions || typeof p.conditions !== "object") {
    throw new Error("E_BAD_PRIORS: conditions must be an object");
  }
  requireNonEmptyString(p.calibration_target, "calibration_target");
  for (const [id, raw] of Object.entries(p.conditions as Record<string, unknown>)) {
    validatePrior(id, raw);
  }
  for (const condition of IMM_CONDITIONS) {
    if (!(condition.id in (p.conditions as Record<string, unknown>))) {
      fail(`conditions missing prior for ${condition.id}`);
    }
  }
  const gc = requireRecord((p as { global_calibration?: Record<string, unknown> }).global_calibration, "global_calibration");
  rejectUnknownKeys(gc, GLOBAL_CALIBRATION_KEYS, "global_calibration");
  for (const key of [
    "tierC_multiplier_iss_hms",
    "tierC_multiplier_iss_none",
    "tierC_multiplier_iss_unlimited",
  ]) {
    requireFiniteNumber(gc[key], `global_calibration.${key}`, { min: 0 });
  }
  for (const key of ["tierA_multiplier", "tierB_multiplier", "tierC_multiplier"]) {
    if (gc[key] !== undefined) requireFiniteNumber(gc[key], `global_calibration.${key}`, { min: 0 });
  }
  requireNonEmptyString(gc.fit_against, "global_calibration.fit_against");
  if (typeof gc.fit_residuals_within_CI95 !== "boolean") {
    fail("global_calibration.fit_residuals_within_CI95 must be a boolean");
  }
  if (gc && gc.kind_multipliers !== undefined) {
    if (typeof gc.kind_multipliers !== "object" || gc.kind_multipliers === null) {
      throw new Error("E_BAD_PRIORS: global_calibration.kind_multipliers must be an object");
    }
    for (const [kind, perKind] of Object.entries(gc.kind_multipliers as Record<string, unknown>)) {
      if (!ALLOWED_MISSION_KINDS.has(kind as IMMMissionKind)) {
        throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind} is not a supported mission kind`);
      }
      if (typeof perKind !== "object" || perKind === null) {
        throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind} must be an object`);
      }
      for (const [cond, mult] of Object.entries(perKind as Record<string, unknown>)) {
        // Skip documentation sentinel keys (e.g. `_doc_`); they live alongside
        // the per-condition multipliers so the JSON file is self-describing.
        if (cond.startsWith("_")) continue;
        if (cond.trim().length === 0) {
          throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind} contains an empty condition key`);
        }
        if (!CONDITION_IDS.has(cond) && !INACTIVE_KIND_MULTIPLIER_KEYS.has(cond)) {
          throw new Error(
            `E_BAD_PRIORS: kind_multipliers.${kind}.${cond} is not an active IMM condition or documented inactive sensitivity key`,
          );
        }
        if (typeof mult !== "number" || !Number.isFinite(mult) || mult < 0) {
          throw new Error(`E_BAD_PRIORS: kind_multipliers.${kind}.${cond} must be a non-negative finite number`);
        }
      }
    }
  }
}

let cached: IMMPriorsFile | null = null;
export function loadIMMPriors(): IMMPriorsFile {
  if (cached) return cached;
  validatePriorsJson(priorsJson);
  cached = priorsJson as unknown as IMMPriorsFile;
  return cached;
}
