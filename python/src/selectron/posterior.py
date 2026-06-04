"""Bayesian posterior draws for the IMM incidence priors."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Mapping

import numpy as np


@dataclass(frozen=True)
class PosteriorDraws:
    """Per-condition posterior λ samples for one mission context."""
    lambdas: dict[str, np.ndarray] = field(default_factory=dict)
    n_draws: int = 0
    seed: int = 0


def sample_posterior(
    priors: Mapping[str, Any],
    condition_ids: list[str],
    n_draws: int = 512,
    seed: int = 0xC0FFEE,
) -> PosteriorDraws:
    """Draw N posterior λ samples for each requested condition.

    Supports:
      - Gamma-Poisson (analytic Gamma(α, 1/β) posterior)
      - Lognormal-Poisson (analytic LogNormal(μ_log_λ, σ_log_λ) posterior)
      - Fixed (no posterior — every draw equals lambda_fixed)
      - Beta-Bernoulli / other: skipped (caller falls back to point prior)
    """
    if n_draws <= 0:
        raise ValueError(f"n_draws must be > 0; got {n_draws}")
    conditions = priors.get("conditions", {})
    out: dict[str, np.ndarray] = {}
    for cid in condition_ids:
        cond = conditions.get(cid)
        if not cond:
            continue
        inc = cond.get("incidence", {})
        dist = inc.get("distribution", "")
        cond_seed = (seed ^ hash(cid)) & 0xFFFFFFFF
        rng = np.random.default_rng(cond_seed)
        if dist == "Gamma-Poisson":
            alpha = float(inc["alpha"]); beta = float(inc["beta"])
            out[cid] = rng.gamma(shape=alpha, scale=1.0 / beta, size=n_draws)
        elif dist == "Lognormal-Poisson":
            mu = float(inc["mu_log_lambda"]); sigma = float(inc["sigma_log_lambda"])
            out[cid] = rng.lognormal(mean=mu, sigma=sigma, size=n_draws)
        elif dist == "Fixed":
            lf = float(inc["lambda_fixed"])
            out[cid] = np.full(n_draws, lf)
    return PosteriorDraws(lambdas=out, n_draws=n_draws, seed=seed)
