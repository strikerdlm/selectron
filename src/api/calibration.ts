/**
 * HTTP client for the Selectron Python Calibration API (FastAPI).
 *
 * This is the only HTTP client in the frontend — everything else is offline-first
 * via Dexie. The Python API runs on localhost:8000 by default.
 */

const API_BASE = import.meta.env.VITE_CALIBRATION_API_URL ?? "http://localhost:8000";

async function _fetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new SelectronApiError(res.status, text);
  }
  return res.json() as Promise<T>;
}

export class SelectronApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`API error ${status}: ${body}`);
    this.name = "SelectronApiError";
  }
}

// ── Health ────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok";
  version: string;
}

export function getHealth(): Promise<HealthResponse> {
  return _fetch<HealthResponse>("/health");
}

// ── Conditions ──────────────────────────────────────────────────────────────

export type Provenance =
  | "tierA-nasa"
  | "tierB-lit"
  | "tierB-pymc"
  | "tierC-synth"
  | "user-custom";

export interface ConditionSummary {
  condition_id: string;
  display_name: string;
  provenance: Provenance;
  distribution: string;
  fittable: boolean;
  fitted: boolean;
}

export interface ConditionsListResponse {
  conditions: ConditionSummary[];
  n_total: number;
  n_fittable: number;
  n_fitted: number;
}

export function listConditions(): Promise<ConditionsListResponse> {
  return _fetch<ConditionsListResponse>("/conditions");
}

// ── Fit ────────────────────────────────────────────────────────────────────

export interface FitRequest {
  condition_id?: string | null;
  draws: number;
  chains: number;
  seed: number;
}

export interface FitJobResponse {
  job_id: string;
  status: string;
}

export interface FitResult {
  condition_id: string;
  posterior_alpha: number;
  posterior_beta: number;
  posterior_lambda_mean: number;
  posterior_lambda_sd: number;
  r_hat: number;
  ess_bulk: number;
  ess_tail: number;
  divergences: number;
  n_studies: number;
  total_person_days: number;
  total_events: number;
}

export interface BatchFitResult {
  fitted: Record<string, FitResult>;
  n_fitted: number;
  n_failed: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: "queued" | "running" | "done" | "failed";
  created_at: string;
  updated_at: string;
  result: BatchFitResult | null;
  error: string | null;
}

export function startFit(request: FitRequest): Promise<FitJobResponse> {
  return _fetch<FitJobResponse>("/fit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function getFitStatus(jobId: string): Promise<JobStatusResponse> {
  return _fetch<JobStatusResponse>(`/fit/${encodeURIComponent(jobId)}`);
}

// ── Validation ────────────────────────────────────────────────────────────

export interface ValidateRequest {
  trials: number;
  seed: number;
}

export interface MetricResult {
  metric: string;
  scenario: string;
  observed: number;
  reference: number;
  ci95_low: number;
  ci95_high: number;
  delta: number;
  within_ci95: boolean;
}

export interface ValidateResponse {
  timestamp: string;
  trials: number;
  seed: number;
  n_total: number;
  n_within_ci95: number;
  metrics: MetricResult[];
}

export interface ValidateJobResponse {
  job_id: string;
  status: string;
}

export function startValidation(request: ValidateRequest): Promise<ValidateJobResponse> {
  return _fetch<ValidateJobResponse>("/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function getValidationStatus(jobId: string): Promise<JobStatusResponse> {
  return _fetch<JobStatusResponse>(`/validate/${encodeURIComponent(jobId)}`);
}

// ── Sensitivity ───────────────────────────────────────────────────────────

export interface SensitivityRequest {
  method: "sobol" | "morris";
  n_samples: number;
  trials: number;
  seed: number;
  top_n: number;
}

export interface SensitivityIndex {
  parameter: string;
  condition_id: string;
  condition_label: string;
  s1: number | null;
  s1_conf: number | null;
  st: number | null;
  st_conf: number | null;
  mu_star: number | null;
  sigma: number | null;
}

export interface SensitivityResponse {
  method: string;
  n_params: number;
  n_evaluations: number;
  indices: SensitivityIndex[];
}

export interface SensitivityJobResponse {
  job_id: string;
  status: string;
}

export function startSensitivity(request: SensitivityRequest): Promise<SensitivityJobResponse> {
  return _fetch<SensitivityJobResponse>("/sensitivity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function getSensitivityStatus(jobId: string): Promise<JobStatusResponse> {
  return _fetch<JobStatusResponse>(`/sensitivity/${encodeURIComponent(jobId)}`);
}

// ── Posterior draws (analog MCMC posterior, 2026-06-04) ──────────────────────

/** One condition's posterior λ samples, wire-faithful to the FastAPI response. */
export interface PosteriorDraw {
  condition_id: string;
  /** Posterior λ values (non-negative; >0 for Gamma/Lognormal conditions), length === n_draws. */
  lambdas: number[];
}

export interface PosteriorDrawsResponse {
  draws: PosteriorDraw[];
  n_draws: number;
  seed: number;
  kind: string | null;
}

/**
 * Fetch per-condition Bayesian posterior λ samples for an analog mission
 * context. `kind` filters to conditions in the priors' kind_multipliers
 * block; omit for all Gamma/Lognormal-Poisson conditions.
 */
export function getPosteriorDraws(opts: {
  kind?: string | null;
  nDraws?: number;
  seed?: number;
  signal?: AbortSignal;
}): Promise<PosteriorDrawsResponse> {
  const params = new URLSearchParams();
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.nDraws !== undefined) params.set("n_draws", String(opts.nDraws));
  if (opts.seed !== undefined) params.set("seed", String(opts.seed));
  return _fetch<PosteriorDrawsResponse>(`/posterior/draws?${params.toString()}`, {
    signal: opts.signal,
  });
}
