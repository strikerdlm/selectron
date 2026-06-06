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

export type TeamHyperPriors = {
  crew_frailty_phi_samples: number[]; // shared crew strain G ~ Gamma(phi,1/phi)
  member_frailty_phi: number;         // per-member strain h_i shape
  pi_unstable_base: number;           // base P(unstable) at mean fit (Tu 2024 ≈ 0.658)
  pi_unstable_samples?: number[];     // optional PyMC posterior for the base rate
  alpha_fit: number;                  // fit → instability slope (≤ 0)
  sigma_log_beta: number;             // β lognormal width (≥ 0)
  temporal_a: number;                 // unstable ramp amplitude
  temporal_p: number;                 // unstable ramp exponent (> 1 back-loads)
  beta_het: number;                   // heterogeneity coefficient (≥ 0)
  beta_weak: number;                  // weakest-link coefficient (≥ 0)
  dyad_ref_n: number;                 // reference crew size (D(6)=15)
  lambda_base_samples: Record<string, number[]>; // per team-condition base rate posterior
};

export type PriorsJson = {
  model_version: string;
  fitted_at: string;
  pyMC_version?: string;
  r_hat_max?: number;
  ess_min?: number;
  conditions: Record<string, ConditionPrior>;
  team?: TeamHyperPriors;
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

  if (x.team !== undefined) {
    if (!isObject(x.team)) bail("priors.json 'team' must be an object");
    const t = x.team as Record<string, unknown>;
    if (!Array.isArray(t.crew_frailty_phi_samples) || t.crew_frailty_phi_samples.length === 0) {
      bail("team.crew_frailty_phi_samples must be a non-empty array");
    }
    for (const s of t.crew_frailty_phi_samples) checkNonNeg(s, "team.crew_frailty_phi_samples[]");
    checkNonNeg(t.member_frailty_phi, "team.member_frailty_phi");
    if ((t.member_frailty_phi as number) <= 0) bail("team.member_frailty_phi must be > 0");
    checkProb(t.pi_unstable_base, "team.pi_unstable_base");
    if (t.pi_unstable_samples !== undefined) {
      if (!Array.isArray(t.pi_unstable_samples) || t.pi_unstable_samples.length === 0) bail("team.pi_unstable_samples must be a non-empty array when present");
      for (const s of t.pi_unstable_samples) checkProb(s, "team.pi_unstable_samples[]");
    }
    checkNum(t.alpha_fit, "team.alpha_fit");
    checkNonNeg(t.sigma_log_beta, "team.sigma_log_beta");
    checkNonNeg(t.temporal_a, "team.temporal_a");
    checkNonNeg(t.temporal_p, "team.temporal_p");
    checkNonNeg(t.beta_het, "team.beta_het");
    checkNonNeg(t.beta_weak, "team.beta_weak");
    checkNonNeg(t.dyad_ref_n, "team.dyad_ref_n");
    if ((t.dyad_ref_n as number) < 2) bail("team.dyad_ref_n must be ≥ 2");
    if (!isObject(t.lambda_base_samples)) bail("team.lambda_base_samples must be an object");
    for (const [k, arr] of Object.entries(t.lambda_base_samples)) {
      if (!Array.isArray(arr) || arr.length === 0) bail(`team.lambda_base_samples["${k}"] must be a non-empty array`);
      for (const s of arr) checkNonNeg(s, `team.lambda_base_samples["${k}"][]`);
    }
  }
}
