"""F8: the K15 regression-bracket schema bundled in the Python package must
stay in sync with the canonical TypeScript source at
``src/data/k15-regression-brackets.json``. This test runs only in a repo
checkout where that canonical file is present; a standalone ``pip install``
has no source tree, so the test skips rather than failing.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from selectron.validator import _K15_REGRESSION_BRACKETS

_REPO_CANONICAL = (
    Path(__file__).resolve().parents[2] / "src" / "data" / "k15-regression-brackets.json"
)


def test_bundled_brackets_match_repo_canonical() -> None:
    if not _REPO_CANONICAL.exists():
        pytest.skip(
            f"repo canonical brackets not found at {_REPO_CANONICAL} "
            "(standalone install — nothing to sync against)"
        )
    with _REPO_CANONICAL.open() as f:
        canonical = json.load(f)
    assert _K15_REGRESSION_BRACKETS == canonical


def test_bundled_brackets_have_expected_shape() -> None:
    # Three scenarios × four metrics, each with a status + regression bracket.
    assert set(_K15_REGRESSION_BRACKETS.keys()) == {"none", "issHMS", "unlimited"}
    for scenario in ("none", "issHMS", "unlimited"):
        assert set(_K15_REGRESSION_BRACKETS[scenario].keys()) == {
            "tme", "chi", "p_evac", "p_locl",
        }
        for metric in ("tme", "chi", "p_evac", "p_locl"):
            entry = _K15_REGRESSION_BRACKETS[scenario][metric]
            assert entry["status"] in {"within-k15-ci95", "documented-divergent"}
            lo, hi = entry["regression"]
            assert lo <= hi