import { SelectronError } from "@/engine/errors";

// Shape of priors.json — output of the offline PyMC fit in Phase 3B
// (notebooks/iter3_imm_fit.ipynb). Hand-rolled schema validator so the TS
// risk module can refuse to load a malformed or stale priors file.

export type ConditionMissionPrior = {
  log_lambda_samples: number[];
  mean_log_lambda: number;
  sd_log_lambda: number;
};

export type ConditionPrior = {
  missions: Record<string, ConditionMissionPrior>;
  vulnerability_beta: Record<string, number>;
  worst_case_prob_q: number;
  treated_lost_days_mean: number;
  untreated_lost_days_mean: number;
};

export type PriorsJson = {
  model_version: string;
  fitted_at: string;
  pyMC_version?: string;
  r_hat_max?: number;
  ess_min?: number;
  conditions: Record<string, ConditionPrior>;
};

function bail(msg: string, details?: Record<string, unknown>): never {
  throw new SelectronError("E_BAD_PRIOR", msg, details);
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function checkNum(v: unknown, label: string): number {
  if (typeof v !== "number" || !Number.isFinite(v)) bail(`${label} must be a finite number, got ${String(v)}`);
  return v as number;
}

function checkProb(v: unknown, label: string): number {
  const n = checkNum(v, label);
  if (n < 0 || n > 1) bail(`${label} must be in [0,1], got ${n}`);
  return n;
}

function checkNonNeg(v: unknown, label: string): number {
  const n = checkNum(v, label);
  if (n < 0) bail(`${label} must be non-negative, got ${n}`);
  return n;
}

export function validatePriorsJson(x: unknown): asserts x is PriorsJson {
  if (!isObject(x)) bail("priors.json must be a JSON object");
  if (typeof x.model_version !== "string") bail("priors.json missing string field 'model_version'");
  if (typeof x.fitted_at !== "string") bail("priors.json missing string field 'fitted_at'");
  if (!isObject(x.conditions)) bail("priors.json missing 'conditions' object");

  for (const [cid, cpRaw] of Object.entries(x.conditions)) {
    if (!isObject(cpRaw)) bail(`condition "${cid}" must be an object`);
    const cp = cpRaw;

    if (!isObject(cp.missions)) bail(`condition "${cid}" missing 'missions' object`);
    for (const [mid, mpRaw] of Object.entries(cp.missions)) {
      if (!isObject(mpRaw)) bail(`condition "${cid}" mission "${mid}" must be an object`);
      const mp = mpRaw;
      if (!Array.isArray(mp.log_lambda_samples)) bail(`condition "${cid}" mission "${mid}" 'log_lambda_samples' must be an array`);
      if (mp.log_lambda_samples.length === 0) bail(`condition "${cid}" mission "${mid}" 'log_lambda_samples' must be non-empty`);
      for (const s of mp.log_lambda_samples) {
        if (typeof s !== "number" || !Number.isFinite(s)) bail(`condition "${cid}" mission "${mid}" has non-finite log_lambda sample`);
      }
      checkNum(mp.mean_log_lambda, `condition "${cid}" mission "${mid}" mean_log_lambda`);
      checkNonNeg(mp.sd_log_lambda, `condition "${cid}" mission "${mid}" sd_log_lambda`);
    }

    if (!isObject(cp.vulnerability_beta)) bail(`condition "${cid}" missing 'vulnerability_beta' object`);
    for (const [k, v] of Object.entries(cp.vulnerability_beta)) {
      checkNum(v, `condition "${cid}" vulnerability_beta["${k}"]`);
    }

    checkProb(cp.worst_case_prob_q, `condition "${cid}" worst_case_prob_q`);
    checkNonNeg(cp.treated_lost_days_mean, `condition "${cid}" treated_lost_days_mean`);
    checkNonNeg(cp.untreated_lost_days_mean, `condition "${cid}" untreated_lost_days_mean`);
  }
}
