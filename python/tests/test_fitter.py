"""Tests for the PyMC Gamma-Poisson fitter."""

from __future__ import annotations

from typing import Any

import numpy as np
import pytest

from selectron.fitter import (
    fit_gamma_poisson,
    FitResult,
    check_convergence,
    fit_all_tier_b,
    BatchFitReport,
)


class TestFitGammaPoisson:
    @pytest.mark.slow
    def test_single_study_converges_to_conjugate(self) -> None:
        alpha_0, beta_0 = 2.0, 10000.0
        observations = [
            {"person_days": 114245, "events": 13},
        ]

        result = fit_gamma_poisson(
            condition_id="depression",
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=42,
            draws=2000,
            tune=1000,
            chains=2,
        )

        assert isinstance(result, FitResult)

        sum_events = sum(o["events"] for o in observations)
        sum_pdays = sum(o["person_days"] for o in observations)
        conjugate_mean = (alpha_0 + sum_events) / (beta_0 + sum_pdays)

        assert abs(result.posterior_alpha - (alpha_0 + sum_events)) / (alpha_0 + sum_events) < 0.10
        assert abs(result.posterior_beta - (beta_0 + sum_pdays)) / (beta_0 + sum_pdays) < 0.10
        assert abs(result.posterior_lambda_mean - conjugate_mean) / conjugate_mean < 0.05

    @pytest.mark.slow
    def test_multi_study_converges(self) -> None:
        alpha_0, beta_0 = 2.0, 10000.0
        single = [{"person_days": 114245, "events": 13}]
        multi = [
            {"person_days": 114245, "events": 13},
            {"person_days": 3120, "events": 1},
        ]

        r1 = fit_gamma_poisson("depression", alpha_0, beta_0, single, seed=42, draws=1000, tune=500, chains=2)
        r2 = fit_gamma_poisson("depression", alpha_0, beta_0, multi, seed=42, draws=1000, tune=500, chains=2)

        assert r2.posterior_lambda_sd <= r1.posterior_lambda_sd * 1.2


class TestCheckConvergence:
    def test_good_convergence(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is True
        assert len(reasons) == 0

    def test_bad_rhat(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.05,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("r_hat" in r.lower() for r in reasons)

    def test_divergences(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=5,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("divergence" in r.lower() for r in reasons)

    def test_low_ess(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=100.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("ess" in r.lower() for r in reasons)


class TestFitAllTierB:
    def test_reports_skipped_conditions(self) -> None:
        report = fit_all_tier_b(
            draws=100,
            tune=50,
            chains=1,
            seed=42,
            dry_run=True,
        )
        assert isinstance(report, BatchFitReport)
        assert report.n_skipped >= 39
        assert report.n_total == 41

    def test_dry_run_does_not_fit(self) -> None:
        report = fit_all_tier_b(
            draws=100,
            tune=50,
            chains=1,
            seed=42,
            dry_run=True,
        )
        assert report.n_fitted == 0

    @pytest.mark.slow
    def test_fits_depression_from_proposals(self) -> None:
        report = fit_all_tier_b(
            draws=500,
            tune=250,
            chains=2,
            seed=42,
            dry_run=False,
        )
        # Depression should be either fitted (converged) or failed (not converged)
        # but never skipped — it has evidence data
        assert "depression" in report.fitted or "depression" in report.failed
        if "depression" in report.fitted:
            result = report.fitted["depression"]
        else:
            result, _ = report.failed["depression"]
        assert result.n_studies == 3
        assert result.total_events == 27
