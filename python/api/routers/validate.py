import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import ValidateRequest, ValidateJobResponse, JobStatusResponse, ValidateResponse, MetricResult
from ..dependencies import IMM_PRIORS_PATH
from selectron.validator import validate_k15

logger = logging.getLogger(__name__)
router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=2)


async def _run_validation(job_id: str, trials: int, seed: int) -> None:
    try:
        store.update(job_id, status="running")
        loop = asyncio.get_event_loop()
        report = await loop.run_in_executor(
            _executor, lambda: validate_k15(
                trials=trials,
                seed=seed,
                scenarios=["none", "issHMS", "unlimited"],
                priors_path=IMM_PRIORS_PATH,
            )
        )
        metrics = []
        for m in report.metrics:
            metrics.append({
                "metric": m.metric,
                "scenario": m.scenario,
                "observed": round(m.observed, 4),
                "reference": round(m.reference, 4),
                "ci95_low": round(m.ci95[0], 4),
                "ci95_high": round(m.ci95[1], 4),
                "delta": round(m.delta, 4),
                "within_ci95": m.within_ci95,
            })
        store.update(
            job_id,
            status="done",
            result={
                "timestamp": report.timestamp,
                "trials": report.trials,
                "seed": report.seed,
                "n_total": report.n_total,
                "n_within_ci95": report.n_within_ci95,
                "metrics": metrics,
            },
        )
    except Exception as exc:
        logger.exception("Validation job %s failed", job_id)
        store.update(job_id, status="failed", error=str(exc))


@router.post("", response_model=ValidateJobResponse)
async def start_validation(request: ValidateRequest, background_tasks: BackgroundTasks):
    job = store.create()
    if request.trials <= 5000:
        await _run_validation(job.id, request.trials, request.seed)
        return ValidateJobResponse(job_id=job.id, status="done")
    background_tasks.add_task(_run_validation, job.id, request.trials, request.seed)
    return ValidateJobResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_validation_status(job_id: str):
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
