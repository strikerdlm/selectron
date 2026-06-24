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


def test_write_diagnostics_all_fields_present(tmp_path: Path):
    result = _make_fit_result("wrist-sprain-strain")
    apply_fit.write_diagnostics(result, ["test reason"], bridges_dir=tmp_path)
    data = json.loads((tmp_path / "wrist-sprain-strain_fit_diagnostics.json").read_text())
    required = {"condition_id", "r_hat", "ess_bulk", "ess_tail", "divergences",
                "posterior_alpha", "posterior_beta", "n_studies",
                "total_person_days", "total_events", "reasons"}
    assert required <= set(data.keys())


def test_main_dry_run_does_not_merge(tmp_path: Path):
    """main() with --dry-run must not call merge_fitted_priors."""
    from selectron.fitter import BatchFitReport
    fitted = {"shoulder-sprain-strain": _make_fit_result("shoulder-sprain-strain")}
    mock_report = MagicMock(spec=BatchFitReport)
    mock_report.fitted = fitted
    mock_report.failed = {}
    mock_report.skipped = {}
    mock_report.n_fitted = 1
    mock_report.n_failed = 0
    mock_report.n_skipped = 0

    with patch("selectron.fitter.fit_all_tier_b", return_value=mock_report) as mock_fit, \
         patch("selectron.writer.merge_fitted_priors") as mock_merge, \
         patch("apply_fit.accepted_evidence_count", return_value=1), \
         patch("sys.argv", ["apply_fit.py", "--dry-run"]):
        apply_fit.main()

    mock_fit.assert_called_once()
    assert mock_fit.call_args.kwargs["evidence_source"] == "accepted"
    mock_merge.assert_not_called()


def test_main_allow_proposals_uses_exploratory_source(tmp_path: Path):
    """Proposal CSVs are reachable only through the explicit exploratory flag."""
    from selectron.fitter import BatchFitReport
    mock_report = MagicMock(spec=BatchFitReport)
    mock_report.fitted = {}
    mock_report.failed = {}
    mock_report.skipped = {}
    mock_report.n_fitted = 0
    mock_report.n_failed = 0
    mock_report.n_skipped = 0

    with patch("selectron.fitter.fit_all_tier_b", return_value=mock_report) as mock_fit, \
         patch("selectron.writer.merge_fitted_priors"), \
         patch("sys.argv", ["apply_fit.py", "--dry-run", "--allow-proposals"]):
        apply_fit.main()

    mock_fit.assert_called_once()
    assert mock_fit.call_args.kwargs["evidence_source"] == "proposals"


def test_main_failed_conditions_write_diagnostics(tmp_path: Path):
    """main() must call write_diagnostics for each failed condition."""
    from selectron.fitter import BatchFitReport
    failed_result = _make_fit_result("barotrauma-ear-sinus-block", r_hat=1.05)
    mock_report = MagicMock(spec=BatchFitReport)
    mock_report.fitted = {}
    mock_report.failed = {"barotrauma-ear-sinus-block": (failed_result, ["R_hat 1.0500 > 1.01"])}
    mock_report.skipped = {}
    mock_report.n_fitted = 0
    mock_report.n_failed = 1
    mock_report.n_skipped = 0

    with patch("selectron.fitter.fit_all_tier_b", return_value=mock_report), \
         patch("selectron.writer.merge_fitted_priors"), \
         patch("apply_fit.write_diagnostics") as mock_write_diag, \
         patch("apply_fit.accepted_evidence_count", return_value=1), \
         patch("sys.argv", ["apply_fit.py"]):
        apply_fit.main()

    mock_write_diag.assert_called_once_with(
        failed_result, ["R_hat 1.0500 > 1.01"]
    )
    assert mock_write_diag.call_args[0][0].condition_id == "barotrauma-ear-sinus-block"
