"""Tests for the FastAPI fit router's fitter contract."""

from __future__ import annotations

import asyncio

from api.job_store import store
from api.routers import fit as fit_router
from selectron.fitter import BatchFitReport, FitResult


def _fit_result(condition_id: str = "depression") -> FitResult:
    return FitResult(
        condition_id=condition_id,
        posterior_alpha=15.0,
        posterior_beta=124245.0,
        posterior_lambda_mean=15.0 / 124245.0,
        posterior_lambda_sd=3e-5,
        r_hat=1.0,
        ess_bulk=1000.0,
        ess_tail=900.0,
        divergences=0,
        n_studies=1,
        total_person_days=114245,
        total_events=13,
    )


def test_run_fit_omits_sampler_keyword_for_legacy_fitter(monkeypatch) -> None:
    seen_kwargs = {}

    def legacy_fit_all_tier_b(
        *,
        draws,
        tune,
        chains,
        seed,
        output_dir,
        condition_filter,
    ) -> BatchFitReport:
        seen_kwargs.update(
            {
                "draws": draws,
                "tune": tune,
                "chains": chains,
                "seed": seed,
                "output_dir": output_dir,
                "condition_filter": condition_filter,
            },
        )
        result = _fit_result()
        return BatchFitReport(
            n_total=1,
            n_fitted=1,
            n_skipped=0,
            n_failed=0,
            fitted={result.condition_id: result},
            skipped={},
            failed={},
        )

    monkeypatch.setattr(fit_router, "fit_all_tier_b", legacy_fit_all_tier_b)
    job = store.create()

    asyncio.run(
        fit_router._run_fit(
            job.id,
            condition_id=None,
            draws=100,
            chains=1,
            seed=42,
            sampler_diagnostic=True,
        ),
    )

    updated = store.get(job.id)
    assert updated is not None
    assert updated.status == "done"
    assert updated.result is not None
    assert updated.result["n_fitted"] == 1
    assert "run_sampler_diagnostic" not in seen_kwargs
