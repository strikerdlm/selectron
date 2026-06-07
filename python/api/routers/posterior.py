"""GET /posterior/draws — Bayesian posterior λ samples for an analog mission context."""
from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Literal

from ..dependencies import IMM_PRIORS_PATH
from ..models import PosteriorDraw, PosteriorDrawsResponse
from selectron.posterior import sample_posterior
from selectron.priors_io import load_priors

router = APIRouter()


@router.get("/draws", response_model=PosteriorDrawsResponse)
async def get_posterior_draws(
    kind: Literal[
        "analog-isolation", "analog-controlled", "antarctic-station",
        "leo-iss", "lunar-artemis-future", "interplanetary-mars-future"
    ] | None = Query(default=None, description="Analog mission kind. Filters conditions to those in the kind_multipliers block; omit to return all Gamma/Lognormal-Poisson conditions."),
    n_draws: int = Query(default=512, ge=1, le=8192, description="Posterior draws per condition (1..8192)."),
    seed: int = Query(default=0xC0FFEE, description="Seed for bit-reproducible posterior sampling."),
):
    priors = load_priors(IMM_PRIORS_PATH)
    conditions: list[str]
    if kind is None:
        # All Gamma-Poisson and Lognormal-Poisson conditions.
        conditions = [
            cid for cid, c in priors["conditions"].items()
            if c["incidence"]["distribution"] in ("Gamma-Poisson", "Lognormal-Poisson")
        ]
    else:
        kind_mults = priors.get("global_calibration", {}).get("kind_multipliers", {}).get(kind, {})
        # Drop documentation sentinel keys (start with "_").
        conditions = [k for k in kind_mults.keys() if not k.startswith("_")]
    draws_obj = sample_posterior(priors, condition_ids=conditions, n_draws=n_draws, seed=seed)
    return PosteriorDrawsResponse(
        draws=[
            PosteriorDraw(condition_id=cid, lambdas=arr.tolist())
            for cid, arr in draws_obj.lambdas.items()
        ],
        n_draws=draws_obj.n_draws,
        seed=draws_obj.seed,
        kind=kind,
    )
