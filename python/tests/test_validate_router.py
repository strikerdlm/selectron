"""Tests for the FastAPI validation router's metric adapter."""

from __future__ import annotations

import asyncio
from types import SimpleNamespace

from api.job_store import store
from api.routers import validate as validate_router


def _report(metric: object) -> SimpleNamespace:
    return SimpleNamespace(
        timestamp="2026-06-29T00:00:00+00:00",
        trials=1000,
        seed=42,
        n_total=1,
        n_within_ci95=1,
        metrics=[metric],
    )


def test_metric_response_accepts_current_regression_shape() -> None:
    metric = SimpleNamespace(
        metric="chi",
        scenario="issHMS",
        observed=82.812345,
        reference=94.93,
        ci95=(89.0, 99.0),
        regression=(78.0, 99.0),
        delta=-12.117655,
        within_ci95=False,
        k15_status="documented-divergent",
        within_regression_envelope=True,
        tracking="known divergence",
    )

    result = validate_router._metric_response(metric)

    assert result["observed"] == 82.8123
    assert result["ci95_low"] == 89.0
    assert result["regression_low"] == 78.0
    assert result["k15_status"] == "documented-divergent"
    assert result["within_regression_envelope"] is True


def test_run_validation_accepts_legacy_ci95_only_metric(monkeypatch) -> None:
    legacy_metric = SimpleNamespace(
        metric="tme",
        scenario="issHMS",
        observed=106.0,
        reference=106.0,
        ci95=(87.0, 126.0),
        delta=0.0,
        within_ci95=True,
    )

    def legacy_validate_k15(**_kwargs: object) -> SimpleNamespace:
        return _report(legacy_metric)

    monkeypatch.setattr(validate_router, "validate_k15", legacy_validate_k15)
    job = store.create()

    asyncio.run(validate_router._run_validation(job.id, trials=1000, seed=42))

    updated = store.get(job.id)
    assert updated is not None
    assert updated.status == "done"
    assert updated.error is None
    assert updated.result is not None
    metric = updated.result["metrics"][0]
    assert metric["regression_low"] == 87.0
    assert metric["regression_high"] == 126.0
    assert metric["within_regression_envelope"] is True
    assert metric["k15_status"] == "within-k15-ci95"
    assert "compatibility envelope" in metric["tracking"]
