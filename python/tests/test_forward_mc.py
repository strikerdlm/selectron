"""Tests for the numpy forward MC engine."""

from __future__ import annotations

import json as json_mod
import subprocess
from typing import Any

import numpy as np
import pytest

from selectron.forward_mc import (
    sample_gamma_poisson_rate,
    sample_beta_pert,
    sample_poisson,
    compute_raf,
    interpolate_beta_pert_by_raf,
    run_trial,
    simulate_imm,
    TrialResult,
)
from selectron.k15_reference import (
    K15_REFERENCE_CREW,
    K15_MISSION_DURATION_DAYS,
    K15_SEED,
)
from selectron.priors_io import load_priors


class TestSampleGammaPoissonRate:
    def test_gamma_poisson_rate_positive(self) -> None:
        rng = np.random.default_rng(42)
        rate = sample_gamma_poisson_rate(rng, alpha=2.0, beta=10000.0)
        assert rate > 0

    def test_gamma_poisson_rate_mean_converges(self) -> None:
        rng = np.random.default_rng(42)
        alpha, beta = 2.0, 10000.0
        rates = np.array([sample_gamma_poisson_rate(rng, alpha, beta) for _ in range(50_000)])
        expected_mean = alpha / beta
        assert abs(rates.mean() - expected_mean) < expected_mean * 0.05


class TestSamplePoisson:
    def test_poisson_zero_lambda(self) -> None:
        rng = np.random.default_rng(42)
        assert sample_poisson(rng, 0.0) == 0

    def test_poisson_mean_converges(self) -> None:
        rng = np.random.default_rng(42)
        lam = 5.0
        samples = np.array([sample_poisson(rng, lam) for _ in range(50_000)])
        assert abs(samples.mean() - lam) < lam * 0.03


class TestSampleBetaPert:
    def test_degenerate_returns_value(self) -> None:
        rng = np.random.default_rng(42)
        assert sample_beta_pert(rng, 5.0, 5.0, 5.0) == 5.0

    def test_mean_converges(self) -> None:
        rng = np.random.default_rng(42)
        low, mode, high = 0.0, 0.1, 0.3
        expected_mean = (low + 4 * mode + high) / 6
        samples = np.array(
            [sample_beta_pert(rng, low, mode, high) for _ in range(50_000)]
        )
        assert abs(samples.mean() - expected_mean) < 0.005

    def test_in_range(self) -> None:
        rng = np.random.default_rng(42)
        for _ in range(1000):
            v = sample_beta_pert(rng, 1.0, 3.0, 5.0)
            assert 1.0 <= v <= 5.0


class TestComputeRAF:
    def test_empty_requirements(self) -> None:
        assert compute_raf({}, {"drug-a": 10}) == 1.0

    def test_full_availability(self) -> None:
        assert compute_raf({"drug-a": 5}, {"drug-a": 10}) == 1.0

    def test_partial_availability(self) -> None:
        raf = compute_raf({"drug-a": 10, "drug-b": 10}, {"drug-a": 5, "drug-b": 0})
        assert abs(raf - 0.25) < 1e-9

    def test_zero_availability(self) -> None:
        assert compute_raf({"drug-a": 10}, {}) == 0.0


class TestInterpolateBetaPertByRAF:
    def test_raf_1_returns_treated(self) -> None:
        treated = {"min": 0.0, "mode": 0.1, "max": 0.3}
        untreated = {"min": 0.1, "mode": 0.5, "max": 0.9}
        result = interpolate_beta_pert_by_raf(treated, untreated, 1.0)
        assert result == treated

    def test_raf_0_returns_untreated(self) -> None:
        treated = {"min": 0.0, "mode": 0.1, "max": 0.3}
        untreated = {"min": 0.1, "mode": 0.5, "max": 0.9}
        result = interpolate_beta_pert_by_raf(treated, untreated, 0.0)
        assert result == untreated

    def test_raf_half_interpolates(self) -> None:
        treated = {"min": 0.0, "mode": 0.0, "max": 0.0}
        untreated = {"min": 1.0, "mode": 1.0, "max": 1.0}
        result = interpolate_beta_pert_by_raf(treated, untreated, 0.5)
        assert abs(result["min"] - 0.5) < 1e-9
        assert abs(result["mode"] - 0.5) < 1e-9
        assert abs(result["max"] - 0.5) < 1e-9


class TestRunTrial:
    def test_returns_trial_result(self, sample_gamma_poisson_prior: dict) -> None:
        rng = np.random.default_rng(42)
        priors = {"depression": sample_gamma_poisson_prior}
        resources: dict[str, float] = {"antidepressant": 30, "anti-anxiety": 14}
        result = run_trial(
            rng=rng,
            priors=priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources=resources,
            tier_b_multiplier=1.0,
        )
        assert isinstance(result, TrialResult)
        assert result.tme >= 0
        assert result.qtl >= 0
        assert result.evac in (0, 1)
        assert result.locl in (0, 1)

    def test_chi_in_valid_range(self, sample_gamma_poisson_prior: dict) -> None:
        rng = np.random.default_rng(42)
        priors = {"depression": sample_gamma_poisson_prior}
        resources: dict[str, float] = {"antidepressant": 30, "anti-anxiety": 14}
        result = run_trial(
            rng=rng,
            priors=priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources=resources,
        )
        denom = K15_MISSION_DURATION_DAYS * 24 * len(K15_REFERENCE_CREW)
        chi = max(0, min(100, 100 * (1 - result.qtl / denom)))
        assert 0 <= chi <= 100


class TestSimulateIMM:
    def test_returns_summary_statistics(self, sample_gamma_poisson_prior: dict) -> None:
        priors_data = load_priors()
        subset_priors = {"depression": priors_data["conditions"]["depression"]}
        result = simulate_imm(
            priors=subset_priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources={"antidepressant": 30, "anti-anxiety": 14},
            trials=1000,
            seed=42,
        )
        assert "tme" in result
        assert "chi" in result
        assert "p_evac" in result
        assert "p_locl" in result
        for key in ("tme", "chi", "p_evac", "p_locl"):
            assert "mean" in result[key]
            assert "ci95" in result[key]

    def test_deterministic_with_same_seed(self) -> None:
        priors_data = load_priors()
        subset = {"depression": priors_data["conditions"]["depression"]}
        kwargs = dict(
            priors=subset,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources={"antidepressant": 30, "anti-anxiety": 14},
            trials=500,
            seed=12345,
        )
        r1 = simulate_imm(**kwargs)
        r2 = simulate_imm(**kwargs)
        assert r1["chi"]["mean"] == r2["chi"]["mean"]


@pytest.mark.slow
class TestCrossValidationTS:
    """Statistical cross-validation: Python MC vs TS engine."""

    @pytest.fixture(scope="class")
    def python_results(self) -> dict[str, dict[str, Any]]:
        priors_data = load_priors()
        all_priors = priors_data["conditions"]
        results = {}
        for scenario, resources in [
            ("none", {}),
            ("issHMS", {
                "antibiotic-broad-spectrum": 30, "analgesic-mild": 60,
                "antidepressant": 30, "anti-anxiety": 14,
                "antiemetic": 14, "antihistamine": 28,
                "antiarrhythmic": 14, "iv-fluid": 6,
                "suture-kit": 4, "splint": 6,
            }),
        ]:
            results[scenario] = simulate_imm(
                priors=all_priors,
                crew=K15_REFERENCE_CREW,
                duration_days=K15_MISSION_DURATION_DAYS,
                resources=resources,
                trials=5000,
                seed=K15_SEED,
                tier_b_multiplier=0.55,
            )
        return results

    def test_python_produces_finite_results(
        self, python_results: dict[str, dict[str, Any]]
    ) -> None:
        for scenario, result in python_results.items():
            for metric in ("tme", "chi", "p_evac", "p_locl"):
                mean = result[metric]["mean"]
                assert np.isfinite(mean), f"{scenario}.{metric} is not finite: {mean}"
                assert mean >= 0, f"{scenario}.{metric} is negative: {mean}"

    def test_chi_ordering(self, python_results: dict[str, dict[str, Any]]) -> None:
        assert python_results["none"]["chi"]["mean"] < python_results["issHMS"]["chi"]["mean"]

    def test_evac_ordering(self, python_results: dict[str, dict[str, Any]]) -> None:
        assert python_results["none"]["p_evac"]["mean"] > python_results["issHMS"]["p_evac"]["mean"]
