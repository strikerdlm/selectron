"""Tests for apply_fit.py orchestration logic."""
import json
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
import apply_fit


def _make_fit_result(cid: str, r_hat: float = 1.005, divergences: int = 0):
    from selectron.fitter import FitResult
    return FitResult(
        condition_id=cid,
        posterior_alpha=3.0,
        posterior_beta=1200.0,
        posterior_lambda_mean=0.0025,
        posterior_lambda_sd=0.0003,
        r_hat=r_hat,
        ess_bulk=800.0,
        ess_tail=750.0,
        divergences=divergences,
        n_studies=2,
        total_person_days=180000,
        total_events=5,
    )


def test_passes_gate_on_good_rhat():
    result = _make_fit_result("shoulder-sprain-strain", r_hat=1.005)
    assert apply_fit.passes_gate(result) is True


def test_fails_gate_on_high_rhat():
    result = _make_fit_result("hip-sprain-strain", r_hat=1.02)
    assert apply_fit.passes_gate(result) is False


def test_fails_gate_on_high_divergences():
    result = _make_fit_result("wrist-sprain-strain", r_hat=1.005, divergences=15)
    assert apply_fit.passes_gate(result) is False


def test_write_diagnostics_creates_file(tmp_path: Path):
    result = _make_fit_result("elbow-sprain-strain", r_hat=1.05)
    reasons = ["R_hat 1.0500 > 1.01"]
    apply_fit.write_diagnostics(result, reasons, bridges_dir=tmp_path)
    out = tmp_path / "elbow-sprain-strain_fit_diagnostics.json"
    assert out.exists()
    data = json.loads(out.read_text())
    assert data["condition_id"] == "elbow-sprain-strain"
    assert data["r_hat"] == pytest.approx(1.05)
    assert "R_hat" in data["reasons"][0]


def test_write_diagnostics_content(tmp_path: Path):
    result = _make_fit_result("hip-sprain-strain", r_hat=1.005, divergences=12)
    reasons = ["divergences 12 > 10"]
    apply_fit.write_diagnostics(result, reasons, bridges_dir=tmp_path)
    data = json.loads((tmp_path / "hip-sprain-strain_fit_diagnostics.json").read_text())
    assert data["divergences"] == 12
    assert data["posterior_alpha"] == pytest.approx(3.0)
    assert data["posterior_beta"] == pytest.approx(1200.0)
