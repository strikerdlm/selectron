from pydantic import BaseModel
from typing import Literal

class HealthResponse(BaseModel):
    status: Literal["ok"]
    version: str

class FitRequest(BaseModel):
    condition_id: str | None = None
    draws: int = 2000
    chains: int = 4
    seed: int = 42

class FitJobResponse(BaseModel):
    job_id: str
    status: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    created_at: str
    updated_at: str
    result: dict | None = None
    error: str | None = None

class FitResultResponse(BaseModel):
    condition_id: str
    posterior_alpha: float
    posterior_beta: float
    posterior_lambda_mean: float
    posterior_lambda_sd: float
    r_hat: float
    ess_bulk: float
    ess_tail: float
    divergences: int
    n_studies: int
    total_person_days: int
    total_events: int

class ValidateRequest(BaseModel):
    trials: int = 100_000
    seed: int = 42
    kit: Literal["none", "issHMS", "unlimited"] = "issHMS"

class ValidateJobResponse(BaseModel):
    job_id: str
    status: str

class MetricResult(BaseModel):
    metric: str
    scenario: str
    observed: float
    reference: float
    ci95_low: float
    ci95_high: float
    delta: float
    within_ci95: bool

class ValidateResponse(BaseModel):
    timestamp: str
    trials: int
    seed: int
    n_total: int
    n_within_ci95: int
    metrics: list[MetricResult]

class SensitivityRequest(BaseModel):
    method: Literal["sobol", "morris"] = "morris"
    n_samples: int = 10
    trials: int = 1000
    seed: int = 42
    top_n: int = 15
    condition_ids: list[str] | None = None

class SensitivityIndex(BaseModel):
    parameter: str
    s1: float | None = None
    s1_conf: float | None = None
    st: float | None = None
    st_conf: float | None = None
    mu_star: float | None = None
    sigma: float | None = None

class SensitivityResponse(BaseModel):
    method: str
    n_params: int
    n_evaluations: int
    indices: list[SensitivityIndex]

class SensitivityJobResponse(BaseModel):
    job_id: str
    status: str

class ConditionsListResponse(BaseModel):
    conditions: list[dict]
    n_total: int
    n_fittable: int

class PosteriorDraw(BaseModel):
    condition_id: str
    lambdas: list[float]


class PosteriorDrawsResponse(BaseModel):
    draws: list[PosteriorDraw]
    n_draws: int
    seed: int
    kind: str | None = None
