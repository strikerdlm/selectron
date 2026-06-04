"""Tests for the /posterior/draws FastAPI endpoint."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.main import app

client = TestClient(app)


def test_health_endpoint_still_works():
    """Sanity: app boots."""
    r = client.get("/health")
    assert r.status_code == 200


def test_posterior_draws_default():
    """Default: returns posterior draws for all Gamma/Lognormal-Poisson conditions."""
    r = client.get("/posterior/draws?n_draws=128&seed=42")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["n_draws"] == 128
    assert body["seed"] == 42
    assert isinstance(body["draws"], list) and len(body["draws"]) > 0
    for d in body["draws"]:
        assert "condition_id" in d
        assert "lambdas" in d
        arr = d["lambdas"]
        assert len(arr) == 128
        assert all(x > 0 for x in arr)


def test_posterior_draws_kind_filter():
    """kind=antarctic-station only includes conditions from the kind_multipliers block."""
    r = client.get("/posterior/draws?kind=antarctic-station&n_draws=64&seed=1")
    assert r.status_code == 200
    body = r.json()
    ids = [d["condition_id"] for d in body["draws"]]
    # depression is in the antarctic-station kind_multipliers set (and is a real prior)
    assert "depression" in ids
    # a non-antarctic condition should NOT be in the response
    assert "abdominal-injury" not in ids


def test_posterior_draws_rejects_bad_n_draws():
    """n_draws=0 must 422."""
    r = client.get("/posterior/draws?n_draws=0")
    assert r.status_code == 422
