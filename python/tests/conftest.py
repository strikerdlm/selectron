"""Shared fixtures for the selectron test suite."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

# PyTensor and matplotlib default to /root cache directories that are read-only
# under the Codex sandbox. Set writable caches before test modules import PyMC.
os.environ.setdefault("MPLCONFIGDIR", "/tmp/selectron-mplcache")
_pytensor_flags = os.environ.get("PYTENSOR_FLAGS", "")
if "base_compiledir" not in _pytensor_flags:
    os.environ["PYTENSOR_FLAGS"] = (
        f"base_compiledir=/tmp/selectron-pytensor,{_pytensor_flags}"
        if _pytensor_flags
        else "base_compiledir=/tmp/selectron-pytensor"
    )
Path(os.environ["MPLCONFIGDIR"]).mkdir(parents=True, exist_ok=True)
Path("/tmp/selectron-pytensor").mkdir(parents=True, exist_ok=True)

# ── Path constants ──────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent.parent  # /root/repos/Selectron
PRIORS_PATH = REPO_ROOT / "src" / "data" / "imm-priors.json"
PROPOSALS_DIR = REPO_ROOT / "research" / "evidence_extracted"


@pytest.fixture()
def priors_json() -> dict[str, Any]:
    """Load imm-priors.json as a plain dict (fresh per test)."""
    with open(PRIORS_PATH) as f:
        return json.load(f)


@pytest.fixture()
def tmp_priors(tmp_path: Path, priors_json: dict[str, Any]) -> Path:
    """Write a copy of imm-priors.json to a temp directory and return its path."""
    p = tmp_path / "imm-priors.json"
    with open(p, "w") as f:
        json.dump(priors_json, f, indent=2)
    return p


@pytest.fixture()
def sample_gamma_poisson_prior() -> dict[str, Any]:
    """A minimal Gamma-Poisson prior dict for testing (depression-like)."""
    return {
        "conditionId": "depression",
        "provenance": "tierB-lit",
        "source_ref": "test-fixture",
        "incidence": {
            "distribution": "Gamma-Poisson",
            "alpha": 2.0,
            "beta": 10000.0,
            "lambda_unit": "events-per-person-day",
        },
        "severity": {"worst_case_prob_alpha": 1.5, "worst_case_prob_beta": 8.5},
        "treated": {
            "fi_cp1": {"min": 0, "mode": 0.1, "max": 0.3},
            "dt_cp1_hours": {"min": 4, "mode": 24, "max": 96},
            "fi_cp2": {"min": 0, "mode": 0.02, "max": 0.08},
            "dt_cp2_hours": {"min": 0, "mode": 48, "max": 336},
            "fi_cp3": {"min": 0, "mode": 0, "max": 0},
            "p_evac": {"min": 2.5e-06, "mode": 2.5e-05, "max": 0.000125},
            "p_locl": {"min": 0, "mode": 5e-06, "max": 2.5e-05},
        },
        "untreated": {
            "fi_cp1": {"min": 0.1, "mode": 0.3, "max": 0.6},
            "dt_cp1_hours": {"min": 12, "mode": 72, "max": 336},
            "fi_cp2": {"min": 0, "mode": 0.1, "max": 0.3},
            "dt_cp2_hours": {"min": 24, "mode": 168, "max": 1080},
            "fi_cp3": {"min": 0, "mode": 0, "max": 0},
            "p_evac": {"min": 0.00042, "mode": 0.0014, "max": 0.0035},
            "p_locl": {"min": 3.6e-06, "mode": 1.2e-05, "max": 3.6e-05},
        },
        "risk_factor_multipliers": {"sex-female": 1.3},
        "required_resources": {"antidepressant": 30, "anti-anxiety": 14},
    }
