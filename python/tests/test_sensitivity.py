"""Tests for Sobol/Morris global sensitivity analysis."""

from __future__ import annotations

import numpy as np
import pytest

from selectron.sensitivity import (
    build_problem_definition,
    run_morris_screening,
    run_sobol_analysis,
    SensitivityReport,
)


class TestBuildProblemDefinition:
    def test_returns_salib_problem(self) -> None:
        condition_ids = ["depression", "gastroenteritis"]
        problem = build_problem_definition(condition_ids)
        assert problem["num_vars"] == 4
        assert len(problem["names"]) == 4
        assert len(problem["bounds"]) == 4

    def test_bounds_are_positive(self) -> None:
        problem = build_problem_definition(["depression"])
        for lo, hi in problem["bounds"]:
            assert lo > 0
            assert hi > lo


class TestMorrisScreening:
    @pytest.mark.slow
    def test_produces_finite_indices(self) -> None:
        condition_ids = ["depression", "gastroenteritis"]
        report = run_morris_screening(
            condition_ids=condition_ids,
            n_trajectories=8,
            trials_per_eval=500,
            seed=42,
        )
        assert isinstance(report, SensitivityReport)
        assert len(report.indices) > 0
        for idx in report.indices:
            assert np.isfinite(idx["mu_star"])
            assert np.isfinite(idx["sigma"])

    @pytest.mark.slow
    def test_output_has_condition_labels(self) -> None:
        report = run_morris_screening(
            condition_ids=["depression"],
            n_trajectories=8,
            trials_per_eval=500,
            seed=42,
        )
        names = {idx["name"] for idx in report.indices}
        assert "depression_alpha" in names or "depression_beta" in names


class TestSobolAnalysis:
    @pytest.mark.slow
    def test_produces_s1_st_indices(self) -> None:
        report = run_sobol_analysis(
            condition_ids=["depression", "gastroenteritis"],
            n_samples=16,
            trials_per_eval=500,
            seed=42,
        )
        assert isinstance(report, SensitivityReport)
        assert len(report.indices) > 0
        for idx in report.indices:
            assert "S1" in idx
            assert "ST" in idx
