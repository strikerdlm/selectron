"""Numpy forward Monte Carlo engine — simplified offline IMM trial loop.

Scope: general-Poisson conditions only. Does NOT reimplement SPE-coupled,
EVA-coupled, space-adaptation-once, or Stage A vulnerability paths.
Scientific scenario outputs for the app are produced by the canonical
TypeScript engine unless explicit cross-language golden parity is added.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import numpy as np
from numpy.random import Generator

from selectron.k15_reference import CrewMember

TREATMENT_MODEL_DISCLOSURE: dict[str, Any] = {
    "id": "raf-linear-interpolation-v1",
    "label": "RAF screening approximation",
    "status": "screening-approximation",
    "evidence_status": "proposal",
    "mechanism": "weighted-resource-scalar-then-parameter-linear-interpolation",
    "applies_to": "treated-untreated-outcome-parameters",
    "limitations": [
        "Multiple required resources are reduced to one weighted scalar, so distinct clinical resources can behave as partially substitutable.",
        "Treated and untreated Beta-PERT parameters are interpolated smoothly; threshold effects, contraindications, treatment delays, provider skill, failure states, and depletion interactions are not represented.",
        "Use for exploratory scenario screening, not calibrated absolute clinical-risk prediction.",
    ],
    "required_upgrade": "Replace RAF interpolation with condition-specific treatment-state or decision-pathway models before claiming calibrated absolute clinical-risk prediction.",
}


# ── Primitive samplers ──────────────────────────────────────────────────────


def sample_gamma_poisson_rate(rng: Generator, alpha: float, beta: float) -> float:
    """Sample lambda from Gamma(alpha, 1/beta)."""
    return float(rng.gamma(shape=alpha, scale=1.0 / beta))


def sample_poisson(rng: Generator, lam: float) -> int:
    """Sample from Poisson(lam). Returns 0 when lam <= 0."""
    if lam <= 0:
        return 0
    return int(rng.poisson(lam))


def sample_beta_pert(
    rng: Generator,
    low: float,
    mode: float,
    high: float,
    lam: float = 4.0,
) -> float:
    """Sample from a PERT-smoothed Beta distribution."""
    if low == high:
        return low
    rng_range = high - low
    alpha = 1.0 + lam * ((mode - low) / rng_range)
    beta_param = 1.0 + lam * ((high - mode) / rng_range)
    x = rng.gamma(alpha)
    y = rng.gamma(beta_param)
    return low + (x / (x + y)) * rng_range


def sample_beta_bernoulli(rng: Generator, alpha: float, beta: float) -> int:
    """Sample 0 or 1 from Beta(alpha, beta) → Bernoulli(p)."""
    p = rng.beta(alpha, beta)
    return 1 if rng.random() < p else 0


def sample_severity(
    rng: Generator, wcp_alpha: float, wcp_beta: float
) -> str:
    """Sample 'best' or 'worst' severity via Beta-Bernoulli."""
    if wcp_alpha <= 0:
        return "best"
    return "worst" if sample_beta_bernoulli(rng, wcp_alpha, wcp_beta) == 1 else "best"


# ── Resource Availability Factor ────────────────────────────────────────────


def compute_raf(
    required: dict[str, float | int],
    available: dict[str, float | int],
) -> float:
    """Compute RAF = sum(min(req, avail)) / sum(req). Returns 1.0 when empty."""
    if not required:
        return 1.0
    total_req = sum(required.values())
    if total_req <= 0:
        return 1.0
    total_avail = sum(min(required[k], available.get(k, 0)) for k in required)
    return total_avail / total_req


def interpolate_beta_pert_by_raf(
    treated: dict[str, float],
    untreated: dict[str, float],
    raf: float,
) -> dict[str, float]:
    """Linearly interpolate between treated and untreated Beta-PERT params.

    This is the proposal-stage RAF screening approximation disclosed in
    TREATMENT_MODEL_DISCLOSURE, not a calibrated clinical treatment pathway.
    """
    r = max(0.0, min(1.0, raf))
    return {
        "min":  r * treated["min"]  + (1 - r) * untreated["min"],
        "mode": r * treated["mode"] + (1 - r) * untreated["mode"],
        "max":  r * treated["max"]  + (1 - r) * untreated["max"],
    }


# ── Full trial loop ────────────────────────────────────────────────────────


@dataclass
class TrialResult:
    """Result of a single IMM trial."""

    tme: int = 0
    qtl: float = 0.0
    evac: int = 0
    locl: int = 0
    per_condition_counts: dict[str, int] = field(default_factory=dict)


def _apply_risk_factor_multiplier(
    base_lambda: float,
    member: CrewMember,
    prior: dict[str, Any],
) -> float:
    lam = base_lambda
    rfm = prior.get("risk_factor_multipliers", {})
    if member.sex == "male" and "sex-male" in rfm:
        lam *= rfm["sex-male"]
    if member.sex == "female" and "sex-female" in rfm:
        lam *= rfm["sex-female"]
    if member.contacts and "contacts" in rfm:
        lam *= rfm["contacts"]
    if member.crowns and "crowns" in rfm:
        lam *= rfm["crowns"]
    if member.cac_positive and "CAC-positive" in rfm:
        lam *= rfm["CAC-positive"]
    if member.abdominal_surgery_history and "abdominal-surgery-history" in rfm:
        lam *= rfm["abdominal-surgery-history"]
    return lam


def run_trial(
    *,
    rng: Generator,
    priors: dict[str, dict[str, Any]],
    crew: list[CrewMember],
    duration_days: int,
    resources: dict[str, float | int],
    tier_b_multiplier: float = 1.0,
) -> TrialResult:
    """Run one IMM trial over general-Poisson conditions."""
    available = dict(resources)
    result = TrialResult()
    mission_hours = duration_days * 24
    early_terminated: set[int] = set()

    for ci, member in enumerate(crew):
        if ci in early_terminated:
            continue
        for cond_id, prior in priors.items():
            if ci in early_terminated:
                break
            inc = prior["incidence"]
            dist = inc["distribution"]

            if dist == "Gamma-Poisson":
                lambda_per_day = sample_gamma_poisson_rate(rng, inc["alpha"], inc["beta"])
            elif dist == "Lognormal-Poisson":
                mu = inc["mu_log_lambda"]
                sigma = inc["sigma_log_lambda"]
                z = rng.standard_normal()
                lambda_per_day = float(np.exp(mu + sigma * z))
            elif dist == "Fixed":
                lambda_per_day = inc.get("lambda_fixed", 0.0)
            else:
                continue

            lambda_per_day = _apply_risk_factor_multiplier(lambda_per_day, member, prior)

            prov = prior.get("provenance", "")
            tier_mult = tier_b_multiplier if prov == "tierB-lit" else 1.0
            count = sample_poisson(rng, lambda_per_day * duration_days * tier_mult)

            for _ in range(count):
                if ci in early_terminated:
                    break

                result.tme += 1
                result.per_condition_counts[cond_id] = (
                    result.per_condition_counts.get(cond_id, 0) + 1
                )

                severity = sample_severity(
                    rng,
                    prior["severity"]["worst_case_prob_alpha"],
                    prior["severity"]["worst_case_prob_beta"],
                )

                raf = compute_raf(prior.get("required_resources", {}), available)

                treated = prior["treated"]
                untreated = prior["untreated"]

                fi_cp1_params = interpolate_beta_pert_by_raf(treated["fi_cp1"], untreated["fi_cp1"], raf)
                dt_cp1_params = interpolate_beta_pert_by_raf(treated["dt_cp1_hours"], untreated["dt_cp1_hours"], raf)
                fi_cp2_params = interpolate_beta_pert_by_raf(treated["fi_cp2"], untreated["fi_cp2"], raf)
                dt_cp2_params = interpolate_beta_pert_by_raf(treated["dt_cp2_hours"], untreated["dt_cp2_hours"], raf)
                fi_cp3_params = interpolate_beta_pert_by_raf(treated["fi_cp3"], untreated["fi_cp3"], raf)
                p_evac_params = interpolate_beta_pert_by_raf(treated["p_evac"], untreated["p_evac"], raf)
                p_locl_params = interpolate_beta_pert_by_raf(treated["p_locl"], untreated["p_locl"], raf)

                fi_cp1 = sample_beta_pert(rng, fi_cp1_params["min"], fi_cp1_params["mode"], fi_cp1_params["max"])
                dt_cp1 = sample_beta_pert(rng, dt_cp1_params["min"], dt_cp1_params["mode"], dt_cp1_params["max"])
                fi_cp2 = sample_beta_pert(rng, fi_cp2_params["min"], fi_cp2_params["mode"], fi_cp2_params["max"])
                dt_cp2 = sample_beta_pert(rng, dt_cp2_params["min"], dt_cp2_params["mode"], dt_cp2_params["max"])
                fi_cp3 = sample_beta_pert(rng, fi_cp3_params["min"], fi_cp3_params["mode"], fi_cp3_params["max"])
                p_evac = sample_beta_pert(rng, p_evac_params["min"], p_evac_params["mode"], p_evac_params["max"])
                p_locl = sample_beta_pert(rng, p_locl_params["min"], p_locl_params["mode"], p_locl_params["max"])

                dt_cp1_clamped = min(dt_cp1, mission_hours)
                remaining_after_cp1 = max(0.0, mission_hours - dt_cp1_clamped)
                dt_cp2_clamped = min(dt_cp2, remaining_after_cp1)
                result.qtl += fi_cp1 * dt_cp1_clamped + fi_cp2 * dt_cp2_clamped
                if fi_cp3 > 0:
                    cp3_start = dt_cp1_clamped + dt_cp2_clamped
                    cp3_duration = max(0.0, mission_hours - cp3_start)
                    result.qtl += fi_cp3 * cp3_duration

                if rng.random() < p_evac:
                    result.evac = 1
                    early_terminated.add(ci)
                if rng.random() < p_locl:
                    result.locl = 1
                    early_terminated.add(ci)

                for res_name, qty in prior.get("required_resources", {}).items():
                    used = qty * raf
                    available[res_name] = max(0, available.get(res_name, 0) - used)

    return result


def simulate_imm(
    *,
    priors: dict[str, dict[str, Any]],
    crew: list[CrewMember],
    duration_days: int,
    resources: dict[str, float | int],
    trials: int,
    seed: int,
    tier_b_multiplier: float = 1.0,
) -> dict[str, Any]:
    """Run T trials and compute posterior summaries."""
    rng = np.random.default_rng(seed)
    mission_hours = duration_days * 24
    denom = mission_hours * len(crew)

    tmes: list[float] = []
    chis: list[float] = []
    evacs: list[float] = []
    locls: list[float] = []

    for _ in range(trials):
        r = run_trial(
            rng=rng,
            priors=priors,
            crew=crew,
            duration_days=duration_days,
            resources=dict(resources),
            tier_b_multiplier=tier_b_multiplier,
        )
        tmes.append(r.tme)
        chi = max(0.0, min(100.0, 100.0 * (1.0 - r.qtl / denom)))
        chis.append(chi)
        evacs.append(r.evac * 100.0)
        locls.append(r.locl * 100.0)

    def summarize(values: list[float]) -> dict[str, Any]:
        arr = np.array(values)
        return {
            "mean": float(arr.mean()),
            "sd": float(arr.std()),
            "ci95": (
                float(np.percentile(arr, 2.5)),
                float(np.percentile(arr, 97.5)),
            ),
        }

    return {
        "tme": summarize(tmes),
        "chi": summarize(chis),
        "p_evac": summarize(evacs),
        "p_locl": summarize(locls),
    }
