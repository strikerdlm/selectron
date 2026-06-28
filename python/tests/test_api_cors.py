"""CORS contract tests for the calibration API."""

from __future__ import annotations

from api.main import ALLOWED_ORIGINS


def test_cors_allows_127_vite_dev_origin() -> None:
    assert "http://127.0.0.1:5173" in ALLOWED_ORIGINS
