"""Tests for the /posterior/draws FastAPI endpoint."""
from __future__ import annotations

import asyncio

from api.main import app, health
from api.routers.posterior import get_posterior_draws


def test_health_endpoint_still_works():
    """Sanity: app boots."""
    body = asyncio.run(health())
    assert body.status == "ok"


def test_posterior_draws_default():
    """Default: returns posterior draws for all Gamma/Lognormal-Poisson conditions."""
    body = asyncio.run(get_posterior_draws(kind=None, n_draws=128, seed=42))
    assert body.n_draws == 128
    assert body.seed == 42
    assert len(body.draws) > 0
    for d in body.draws:
        assert d.condition_id
        arr = d.lambdas
        assert len(arr) == 128
        assert all(x > 0 for x in arr)


def test_posterior_draws_kind_filter():
    """kind=antarctic-station only includes conditions from the kind_multipliers block."""
    body = asyncio.run(
        get_posterior_draws(kind="antarctic-station", n_draws=64, seed=1)
    )
    ids = [d.condition_id for d in body.draws]
    # depression is in the antarctic-station kind_multipliers set (and is a real prior)
    assert "depression" in ids
    # a non-antarctic condition should NOT be in the response
    assert "abdominal-injury" not in ids


def test_posterior_draws_rejects_bad_n_draws():
    """The FastAPI contract rejects n_draws=0 before the route executes."""
    schema = app.openapi()
    params = schema["paths"]["/posterior/draws"]["get"]["parameters"]
    n_draws = next(p for p in params if p["name"] == "n_draws")
    assert n_draws["schema"]["minimum"] == 1
    assert n_draws["schema"]["maximum"] == 8192
