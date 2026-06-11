"""Tests for the PyMC Gamma-Poisson fitter."""

from __future__ import annotations

import json
from typing import Any

import numpy as np
import pytest

from selectron.fitter import (
    fit_gamma_poisson,
    FitResult,
    check_convergence,
    fit_all_tier_b,
    BatchFitReport,
    base_prior_for,
    BASE_PRIOR_ALPHA,
    BASE_PRIOR_BETA,
)
from selectron.priors_io import get_tier_b_conditions, load_priors
from selectron.writer import merge_fitted_priors


def _fit_result(cid: str, alpha: float, beta: float) -> FitResult:
    """A minimal FitResult for merge tests (other values irrelevant here)."""
    return FitResult(
        condition_id=cid,
        posterior_alpha=alpha,
        posterior_beta=beta,
        posterior_lambda_mean=alpha / beta,
        posterior_lambda_sd=1e-5,
        r_hat=1.0,
        ess_bulk=3000.0,
        ess_tail=3000.0,
        divergences=0,
        n_studies=3,
        total_person_days=185675,
        total_events=27,
    )


class TestBasePriorIdempotency:
    """Regression for the non-idempotent-fitter bug (Diego 2026-05-29).

    The fit is conjugate Gamma-Poisson: posterior = Gamma(alpha_0 + Σevents,
    beta_0 + Σperson_days). The fitter previously read alpha_0/beta_0 from
    incidence.alpha/beta — the *fitted posterior* — so a second fit re-applied
    the evidence and double-counted it (depression alpha 29.67 -> 55.55).
    base_prior_for() must always return the fixed base, never the live posterior.
    """

    def test_base_prior_is_default_not_posterior(self) -> None:
        inc = {"distribution": "Gamma-Poisson", "alpha": 55.55, "beta": 378240.0}
        assert base_prior_for(inc) == (BASE_PRIOR_ALPHA, BASE_PRIOR_BETA)
        assert base_prior_for(inc) != (inc["alpha"], inc["beta"])

    def test_base_prior_honors_explicit_override(self) -> None:
        inc = {
            "distribution": "Gamma-Poisson",
            "alpha": 55.55,
            "beta": 378240.0,
            "prior_alpha": 2.0,
            "prior_beta": 5000.0,
        }
        assert base_prior_for(inc) == (2.0, 5000.0)

    def test_merge_then_refit_does_not_double_count(self, tmp_path) -> None:
        """fit -> merge -> (would-be) refit: the base is unchanged after merge."""
        priors_path = tmp_path / "imm-priors.json"
        priors_path.write_text(
            json.dumps(
                {
                    "schema_version": 1,
                    "conditions": {
                        "demo": {
                            "provenance": "tierB-lit",
                            "source_ref": "fixture",
                            "incidence": {
                                "distribution": "Gamma-Poisson",
                                "alpha": 2.0,
                                "beta": 1000.0,
                            },
                        }
                    },
                }
            )
        )

        inc_before = json.loads(priors_path.read_text())["conditions"]["demo"]["incidence"]
        base_before = base_prior_for(inc_before)

        # Run 1: merge a fitted posterior into the file.
        merge_fitted_priors(
            fitted={"demo": _fit_result("demo", alpha=55.5, beta=378240.0)},
            priors_path=priors_path,
        )

        inc_after = json.loads(priors_path.read_text())["conditions"]["demo"]["incidence"]
        # The posterior was written...
        assert inc_after["alpha"] == 55.5
        assert inc_after["beta"] == 378240.0
        # ...but a Run-2 refit still fits FROM the fixed base, not the merged
        # posterior, so the evidence is NOT double-counted on re-run.
        assert base_prior_for(inc_after) == base_before
        assert base_prior_for(inc_after) != (inc_after["alpha"], inc_after["beta"])


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
        assert report.n_skipped >= 3
        assert report.n_total == len(get_tier_b_conditions(load_priors()))

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
    def test_fits_remaining_tierb_lit_from_proposals(self) -> None:
        report = fit_all_tier_b(
            draws=500,
            tune=250,
            chains=2,
            seed=42,
            dry_run=False,
        )
        # Post-PyMC merge: only 6 tierB-lit remain (3 excluded outliers + 3 unfitted).
        # 3 excluded outliers have evidence and should be fitted or failed.
        # 3 unfitted (elbow/hip/wrist) have no evidence and should be skipped.
        assert report.n_total == 6
        assert report.n_skipped >= 3
