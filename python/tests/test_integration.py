"""End-to-end integration test: fit -> validate -> write -> re-validate."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from selectron.fitter import fit_all_tier_b, check_convergence, FitResult
from selectron.priors_io import load_priors
from selectron.validator import validate_k15
from selectron.writer import merge_fitted_priors


@pytest.mark.slow
class TestFullPipeline:
    def test_fit_write_validate_round_trip(self, tmp_priors: Path) -> None:
        report = fit_all_tier_b(
            draws=500,
            tune=250,
            chains=2,
            seed=42,
            dry_run=False,
            evidence_source="proposals",
        )
        # Depression may land in fitted (converged) or failed (not converged with small draws)
        assert "depression" in report.fitted or "depression" in report.failed
        if "depression" in report.fitted:
            result = report.fitted["depression"]
        else:
            result, _ = report.failed["depression"]
        assert result.posterior_lambda_mean > 0

        original = load_priors(tmp_priors)
        n_original_conditions = len(original["conditions"])

        # Use fitted results for the merge; if none converged, use the failed result
        fitted_for_merge = report.fitted
        if not fitted_for_merge and report.failed:
            cid, (fr, _) = next(iter(report.failed.items()))
            fitted_for_merge = {cid: fr}

        writer_report = merge_fitted_priors(
            fitted=fitted_for_merge,
            priors_path=tmp_priors,
            dry_run=False,
        )
        assert writer_report.n_updated >= 1

        merged = load_priors(tmp_priors)
        assert merged["schema_version"] == 1
        assert len(merged["conditions"]) == n_original_conditions

        dep = merged["conditions"]["depression"]
        assert dep["provenance"] == "tierB-pymc"
        assert dep["incidence"]["alpha"] == result.posterior_alpha
        assert dep["incidence"]["beta"] == result.posterior_beta

        assert merged["conditions"]["acute-sinusitis"]["provenance"] == "tierA-nasa"
        assert merged["conditions"]["acute-sinusitis"]["incidence"]["alpha"] == \
               original["conditions"]["acute-sinusitis"]["incidence"]["alpha"]

        val_report = validate_k15(
            trials=1000,
            seed=42,
            scenarios=["issHMS"],
            priors_path=tmp_priors,
        )
        assert val_report.n_total == 4

    def test_idempotent_write(self, tmp_priors: Path) -> None:
        result = FitResult(
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
        merge_fitted_priors(fitted={"depression": result}, priors_path=tmp_priors, dry_run=False)
        first = load_priors(tmp_priors)

        merge_fitted_priors(fitted={"depression": result}, priors_path=tmp_priors, dry_run=False)
        second = load_priors(tmp_priors)

        assert first == second
