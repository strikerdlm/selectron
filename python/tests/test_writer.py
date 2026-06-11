"""Tests for the atomic priors JSON writer."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from selectron.fitter import FitResult
from selectron.priors_io import load_priors
from selectron.writer import merge_fitted_priors, WriterReport


@pytest.fixture()
def sample_fit_result() -> FitResult:
    return FitResult(
        condition_id="depression",
        posterior_alpha=15.0,
        posterior_beta=124245.0,
        posterior_lambda_mean=1.21e-4,
        posterior_lambda_sd=3.1e-5,
        r_hat=1.001,
        ess_bulk=2000.0,
        ess_tail=1500.0,
        divergences=0,
        n_studies=2,
        total_person_days=117365,
        total_events=14,
    )


class TestMergeFittedPriors:
    def test_updates_incidence_params(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        report = merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        inc = reloaded["conditions"]["depression"]["incidence"]
        assert inc["alpha"] == 15.0
        assert inc["beta"] == 124245.0

    def test_updates_provenance(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["provenance"] == "tierB-pymc"

    def test_preserves_non_fitted_conditions(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        original_sinusitis = json.dumps(original["conditions"]["acute-sinusitis"])

        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )

        reloaded = load_priors(tmp_priors)
        assert json.dumps(reloaded["conditions"]["acute-sinusitis"]) == original_sinusitis

    def test_preserves_severity_and_outcomes(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        orig_severity = original["conditions"]["depression"]["severity"]
        orig_treated = original["conditions"]["depression"]["treated"]

        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )

        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["severity"] == orig_severity
        assert reloaded["conditions"]["depression"]["treated"] == orig_treated

    def test_dry_run_does_not_modify_file(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=True,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded == original

    def test_report_tracks_changes(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        report = merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        assert isinstance(report, WriterReport)
        assert "depression" in report.updated
        assert report.n_updated == 1
        assert report.n_unchanged == len(load_priors(tmp_priors)["conditions"]) - 1

    def test_schema_version_preserved(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded["schema_version"] == 1
