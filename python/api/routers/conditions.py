from fastapi import APIRouter
from pydantic import BaseModel
from typing import Literal

from ..dependencies import IMM_PRIORS_PATH
from selectron.priors_io import load_priors

router = APIRouter()

class ConditionSummary(BaseModel):
    condition_id: str
    display_name: str
    provenance: Literal["tierA-nasa", "tierB-lit", "tierB-pymc", "tierC-synth", "user-custom"]
    distribution: str
    fittable: bool
    fitted: bool

class ConditionsListResponse(BaseModel):
    conditions: list[ConditionSummary]
    n_total: int
    n_fittable: int
    n_fitted: int

@router.get("", response_model=ConditionsListResponse)
async def list_conditions():
    priors = load_priors(IMM_PRIORS_PATH)
    conditions = []
    n_fittable = 0
    n_fitted = 0
    for cid, prior in priors["conditions"].items():
        dist = prior["incidence"]["distribution"]
        prov = prior["provenance"]
        fittable = prov == "tierB-lit" and dist == "Gamma-Poisson"
        fitted = prov == "tierB-pymc"
        if fittable:
            n_fittable += 1
        if fitted:
            n_fitted += 1
        conditions.append(ConditionSummary(
            condition_id=cid,
            display_name=cid.replace("-", " ").title(),
            provenance=prov,
            distribution=dist,
            fittable=fittable,
            fitted=fitted,
        ))
    return ConditionsListResponse(
        conditions=conditions,
        n_total=len(conditions),
        n_fittable=n_fittable,
        n_fitted=n_fitted,
    )
