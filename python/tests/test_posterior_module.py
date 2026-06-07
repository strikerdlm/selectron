"""Tests for the posterior sample module (analog MCMC posterior draws)."""
from __future__ import annotations

import numpy as np
import pytest

from selectron.posterior import (
    PosteriorDraws,
    sample_posterior,
)
from selectron.priors_io import load_priors
import json
from pathlib import Path

PRIORS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "imm-priors.json"


@pytest.fixture(scope="module")
def priors():
    return load_priors(PRIORS_PATH)


def test_sample_posterior_returns_array_per_condition(priors):
    """Each requested condition must yield a numpy array of length n_draws."""
    cond_ids = ["ankle-sprain-strain", "dental-abscess"]
    draws = sample_posterior(priors, condition_ids=cond_ids, n_draws=512, seed=0xC0FFEE)
    assert isinstance(draws, PosteriorDraws)
    assert set(draws.lambdas.keys()) == set(cond_ids)
    for cid in cond_ids:
        arr = draws.lambdas[cid]
        assert isinstance(arr, np.ndarray)
        assert arr.shape == (512,)
        assert np.all(arr > 0)


def test_sample_posterior_is_deterministic(priors):
    """Same seed → identical arrays."""
    cond_ids = ["ankle-sprain-strain"]
    a = sample_posterior(priors, condition_ids=cond_ids, n_draws=128, seed=42)
    b = sample_posterior(priors, condition_ids=cond_ids, n_draws=128, seed=42)
    np.testing.assert_array_equal(a.lambdas["ankle-sprain-strain"], b.lambdas["ankle-sprain-strain"])


def test_sample_posterior_mean_matches_posterior_mean(priors):
    """10k samples from Gamma(α, 1/β) should mean ≈ α/β within 10%."""
    inc = priors["conditions"]["ankle-sprain-strain"]["incidence"]
    alpha = inc["alpha"]; beta = inc["beta"]
    analytic_mean = alpha / beta
    draws = sample_posterior(priors, condition_ids=["ankle-sprain-strain"], n_draws=10_000, seed=0xC0FFEE)
    sampled_mean = float(np.mean(draws.lambdas["ankle-sprain-strain"]))
    assert abs(sampled_mean - analytic_mean) / analytic_mean < 0.10


def test_sample_posterior_skips_unknown_conditions(priors):
    """Unknown condition IDs are silently skipped."""
    draws = sample_posterior(priors, condition_ids=["nonexistent-cond", "ankle-sprain-strain"], n_draws=64, seed=1)
    assert "nonexistent-cond" not in draws.lambdas
    assert "ankle-sprain-strain" in draws.lambdas


def test_sample_posterior_supports_fixed_distribution():
    """Fixed-distribution conditions yield constant λ = lambda_fixed (synthetic priors)."""
    synthetic = {
        "conditions": {
            "synth-fixed": {
                "incidence": {
                    "distribution": "Fixed",
                    "lambda_fixed": 0.000123,
                }
            }
        }
    }
    draws = sample_posterior(synthetic, condition_ids=["synth-fixed"], n_draws=32, seed=2)
    arr = draws.lambdas["synth-fixed"]
    np.testing.assert_array_equal(arr, np.full(32, 0.000123))
