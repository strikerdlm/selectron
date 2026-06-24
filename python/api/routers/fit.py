import asyncio
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import FitRequest, FitJobResponse, JobStatusResponse, FitResultResponse
from selectron.fitter import fit_all_tier_b

logger = logging.getLogger(__name__)
router = APIRouter()


async def _run_fit(
    job_id: str,
    condition_id: str | None,
    draws: int,
    chains: int,
    seed: int,
    sampler_diagnostic: bool,
) -> None:
    try:
        store.update(job_id, status="running")
        report = fit_all_tier_b(
            draws=draws,
            tune=draws // 2,
            chains=chains,
            seed=seed,
            output_dir=None,
            condition_filter=condition_id,
            run_sampler_diagnostic=sampler_diagnostic,
        )
        fitted_dict: dict[str, dict] = {}
        for cid, result in report.fitted.items():
            fitted_dict[cid] = FitResultResponse(**result.to_dict()).model_dump()
        for cid, (result, _reasons) in report.failed.items():
            fitted_dict[cid] = FitResultResponse(**result.to_dict()).model_dump()
        store.update(
            job_id,
            status="done",
            result={"fitted": fitted_dict, "n_fitted": report.n_fitted, "n_failed": report.n_failed},
        )
    except Exception as exc:
        logger.exception("Fit job %s failed", job_id)
        store.update(job_id, status="failed", error=str(exc))


@router.post("", response_model=FitJobResponse)
async def start_fit(request: FitRequest, background_tasks: BackgroundTasks):
    job = store.create()
    background_tasks.add_task(
        _run_fit,
        job.id,
        request.condition_id,
        request.draws,
        request.chains,
        request.seed,
        request.sampler_diagnostic,
    )
    return FitJobResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_fit_status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        result=job.result,
        error=job.error,
    )
