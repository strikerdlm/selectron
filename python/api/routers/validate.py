import asyncio
import logging
from collections.abc import Mapping
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import ValidateRequest, ValidateJobResponse, JobStatusResponse
from ..dependencies import IMM_PRIORS_PATH
from selectron.validator import validate_k15

logger = logging.getLogger(__name__)
router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=2)


_MISSING = object()


def _metric_value(metric: object, name: str, default: Any = _MISSING) -> Any:
    if isinstance(metric, Mapping) and name in metric:
        return metric[name]
    if hasattr(metric, name):
        return getattr(metric, name)
    if default is not _MISSING:
        return default
    raise AttributeError(
        f"{type(metric).__name__!s} object has no attribute or key {name!r}"
    )


def _metric_bounds(
    metric: object,
    tuple_name: str,
    low_name: str,
    high_name: str,
) -> tuple[float, float] | None:
    bounds = _metric_value(metric, tuple_name, None)
    if bounds is not None:
        return float(bounds[0]), float(bounds[1])

    low = _metric_value(metric, low_name, None)
    high = _metric_value(metric, high_name, None)
    if low is None or high is None:
        return None
    return float(low), float(high)


def _metric_response(metric: object) -> dict[str, Any]:
    observed = float(_metric_value(metric, "observed"))
    reference = float(_metric_value(metric, "reference"))
    ci95 = _metric_bounds(metric, "ci95", "ci95_low", "ci95_high")
    if ci95 is None:
        raise AttributeError(
            f"{type(metric).__name__!s} object has no CI95 bounds"
        )

    within_ci95 = bool(
        _metric_value(metric, "within_ci95", ci95[0] <= observed <= ci95[1])
    )

    regression = _metric_bounds(
        metric,
        "regression",
        "regression_low",
        "regression_high",
    )
    used_legacy_regression_fallback = regression is None
    if regression is None:
        regression = ci95

    within_regression = bool(
        _metric_value(
            metric,
            "within_regression_envelope",
            regression[0] <= observed <= regression[1],
        )
    )

    k15_status = str(
        _metric_value(
            metric,
            "k15_status",
            "within-k15-ci95" if within_ci95 else "legacy-ci95-only",
        )
    )
    tracking = str(_metric_value(metric, "tracking", ""))
    if used_legacy_regression_fallback and not tracking:
        tracking = (
            "Validator result did not include regression-envelope fields; "
            "using K15 CI95 as the compatibility envelope."
        )

    return {
        "metric": str(_metric_value(metric, "metric")),
        "scenario": str(_metric_value(metric, "scenario")),
        "observed": round(observed, 4),
        "reference": round(reference, 4),
        "ci95_low": round(ci95[0], 4),
        "ci95_high": round(ci95[1], 4),
        "regression_low": round(regression[0], 4),
        "regression_high": round(regression[1], 4),
        "delta": round(float(_metric_value(metric, "delta", observed - reference)), 4),
        "within_ci95": within_ci95,
        "k15_status": k15_status,
        "within_regression_envelope": within_regression,
        "tracking": tracking,
    }


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
        metrics = [_metric_response(m) for m in report.metrics]
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
