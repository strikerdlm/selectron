"""Tests for the K15 validation gate."""

from __future__ import annotations

from typing import Any

import pytest

from selectron.validator import (
    validate_k15,
    K15ValidationReport,
    MetricResult,
)


class TestMetricResult:
    def test_within_ci95(self) -> None:
        m = MetricResult(
            metric="tme",
            scenario="issHMS",
            observed=106.0,
            reference=106.0,
            ci95=(87.0, 126.0),
            delta=0.0,
            within_ci95=True,
            accepted=(87.0, 126.0),
            k15_status="within-k15-ci95",
            within_accepted=True,
        )
        assert m.within_ci95 is True
        assert m.within_accepted is True

    def test_outside_ci95(self) -> None:
        m = MetricResult(
            metric="tme",
            scenario="none",
            observed=200.0,
            reference=98.3,
            ci95=(73.0, 122.0),
            delta=101.7,
            within_ci95=False,
            accepted=(73.0, 122.0),
            k15_status="within-k15-ci95",
            within_accepted=False,
        )
        assert m.within_ci95 is False
        assert m.within_accepted is False


class TestValidateK15:
    @pytest.mark.slow
    def test_current_priors_produce_report(self) -> None:
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        assert isinstance(report, K15ValidationReport)
        assert len(report.metrics) == 4

    @pytest.mark.slow
    def test_report_has_summary_counts(self) -> None:
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        assert report.n_total == 4
        assert report.n_within_ci95 >= 0
        assert report.n_within_ci95 <= 4

    @pytest.mark.slow
    def test_report_generates_markdown(self) -> None:
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        md = report.to_markdown()
        assert "K15 Validation Report" in md
        assert "issHMS" in md
