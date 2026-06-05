import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import SensitivityRequest, SensitivityJobResponse, JobStatusResponse
from selectron.sensitivity import run_morris_screening, run_sobol_analysis
from selectron.priors_io import load_priors

logger = logging.getLogger(__name__)
router = APIRouter()

_executor = ThreadPoolExecutor(max_workers=2)


def _build_label_map() -> dict[str, str]:
    priors = load_priors()
    return {
        cid: cid.replace("-", " ").title()
        for cid in priors["conditions"]
    }


def _extract_condition_id(param_name: str) -> str:
    for suffix in ("_alpha", "_beta"):
        if param_name.endswith(suffix):
            return param_name[: -len(suffix)]
    return param_name


async def _run_sensitivity(
    job_id: str,
    method: str,
    n_samples: int,
    trials: int,
    seed: int,
    top_n: int,
    condition_ids: list[str] | None,
) -> None:
    try:
        store.update(job_id, status="running")

        priors = load_priors()
        all_gp_ids = [
            cid for cid, p in priors["conditions"].items()
            if p["incidence"]["distribution"] == "Gamma-Poisson"
        ]
        ids_to_use = condition_ids if condition_ids else all_gp_ids

        loop = asyncio.get_event_loop()
        if method == "morris":
            report = await loop.run_in_executor(
                _executor, lambda: run_morris_screening(
                    condition_ids=ids_to_use,
                    n_trajectories=n_samples,
                    trials_per_eval=trials,
                    seed=seed,
                )
            )
        else:
            report = await loop.run_in_executor(
                _executor, lambda: run_sobol_analysis(
                    condition_ids=ids_to_use,
                    n_samples=n_samples,
                    trials_per_eval=trials,
                    seed=seed,
                )
            )

        label_map = _build_label_map()

        # Aggregate alpha+beta per condition: take max of primary index
        cond_agg: dict[str, dict] = {}
        for idx in report.indices:
            name = idx.get("name", idx.get("parameter", ""))
            cid = _extract_condition_id(name)
            label = label_map.get(cid, cid.replace("-", " ").title())

            if cid not in cond_agg:
                cond_agg[cid] = {
                    "parameter": cid,
                    "condition_id": cid,
                    "condition_label": label,
                    "s1": None, "s1_conf": None,
                    "st": None, "st_conf": None,
                    "mu_star": None, "sigma": None,
                }

            entry = cond_agg[cid]
            if method == "sobol":
                s1 = idx.get("S1", 0)
                st = idx.get("ST", 0)
                if entry["s1"] is None or abs(s1) > abs(entry["s1"]):
                    entry["s1"] = round(s1, 6)
                    entry["s1_conf"] = round(idx.get("S1_conf", 0), 6)
                if entry["st"] is None or abs(st) > abs(entry["st"]):
                    entry["st"] = round(st, 6)
                    entry["st_conf"] = round(idx.get("ST_conf", 0), 6)
            else:
                ms = idx.get("mu_star", 0)
                if entry["mu_star"] is None or ms > entry["mu_star"]:
                    entry["mu_star"] = round(ms, 6)
                    entry["sigma"] = round(idx.get("sigma", 0), 6)

        sort_key = "s1" if method == "sobol" else "mu_star"
        sorted_indices = sorted(
            cond_agg.values(),
            key=lambda x: abs(x.get(sort_key) or 0),
            reverse=True,
        )[:top_n]

        store.update(
            job_id,
            status="done",
            result={
                "method": report.method,
                "n_params": report.n_params,
                "n_evaluations": report.n_evaluations,
                "indices": sorted_indices,
            },
        )
    except Exception as exc:
        logger.exception("Sensitivity job %s failed", job_id)
        store.update(job_id, status="failed", error=str(exc))


@router.post("", response_model=SensitivityJobResponse)
async def start_sensitivity(request: SensitivityRequest, background_tasks: BackgroundTasks):
    job = store.create()
    background_tasks.add_task(
        _run_sensitivity,
        job.id,
        request.method,
        request.n_samples,
        request.trials,
        request.seed,
        request.top_n,
        request.condition_ids,
    )
    return SensitivityJobResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_sensitivity_status(job_id: str):
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
