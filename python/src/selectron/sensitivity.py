"""Sobol/Morris global sensitivity analysis via SALib."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from SALib.analyze import morris as morris_analyze
from SALib.analyze import sobol as sobol_analyze
from SALib.sample import morris as morris_sample
from SALib.sample import saltelli

from selectron.forward_mc import simulate_imm
from selectron.k15_reference import K15_REFERENCE_CREW, K15_MISSION_DURATION_DAYS
from selectron.priors_io import load_priors

logger = logging.getLogger(__name__)

_ISS_HMS_RESOURCES: dict[str, int] = {
    "antibiotic-broad-spectrum": 30, "analgesic-mild": 60,
    "antidepressant": 30, "anti-anxiety": 14,
    "antiemetic": 14, "antihistamine": 28,
    "antiarrhythmic": 14, "iv-fluid": 6,
    "suture-kit": 4, "splint": 6,
}


@dataclass
class SensitivityReport:
    """Report from a sensitivity analysis run."""

    method: str
    n_params: int
    n_evaluations: int
    metric: str
    indices: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "method": self.method,
            "n_params": self.n_params,
            "n_evaluations": self.n_evaluations,
            "metric": self.metric,
            "indices": self.indices,
        }


def build_problem_definition(
    condition_ids: list[str],
    scale_factor: float = 5.0,
) -> dict[str, Any]:
    """Build SALib problem definition for a set of conditions."""
    priors_data = load_priors()
    names: list[str] = []
    bounds: list[list[float]] = []

    for cid in condition_ids:
        prior = priors_data["conditions"].get(cid)
        if prior is None:
            continue
        inc = prior["incidence"]
        if inc["distribution"] != "Gamma-Poisson":
            continue

        alpha = inc["alpha"]
        beta = inc["beta"]

        names.append(f"{cid}_alpha")
        bounds.append([max(0.1, alpha / scale_factor), alpha * scale_factor])

        names.append(f"{cid}_beta")
        bounds.append([max(1.0, beta / scale_factor), beta * scale_factor])

    return {
        "num_vars": len(names),
        "names": names,
        "bounds": bounds,
    }


def _objective(
    param_values: np.ndarray,
    condition_ids: list[str],
    trials: int,
    seed: int,
) -> float:
    """Evaluate the forward MC for one parameter set. Returns CHI mean."""
    priors_data = load_priors()
    all_priors = dict(priors_data["conditions"])

    idx = 0
    for cid in condition_ids:
        if cid not in all_priors:
            continue
        if all_priors[cid]["incidence"]["distribution"] != "Gamma-Poisson":
            continue
        all_priors[cid] = dict(all_priors[cid])
        all_priors[cid]["incidence"] = dict(all_priors[cid]["incidence"])
        all_priors[cid]["incidence"]["alpha"] = float(param_values[idx])
        all_priors[cid]["incidence"]["beta"] = float(param_values[idx + 1])
        idx += 2

    result = simulate_imm(
        priors=all_priors,
        crew=K15_REFERENCE_CREW,
        duration_days=K15_MISSION_DURATION_DAYS,
        resources=_ISS_HMS_RESOURCES,
        trials=trials,
        seed=seed,
        tier_b_multiplier=1.0,
    )
    return result["chi"]["mean"]


def run_morris_screening(
    *,
    condition_ids: list[str],
    n_trajectories: int = 10,
    trials_per_eval: int = 1000,
    seed: int = 42,
    output_dir: Path | None = None,
) -> SensitivityReport:
    """Run Morris elementary effects screening."""
    problem = build_problem_definition(condition_ids)
    param_values = morris_sample.sample(
        problem,
        N=n_trajectories,
        seed=seed,
    )

    n_evals = param_values.shape[0]
    logger.info("Morris screening: %d evaluations", n_evals)
    y = np.array([
        _objective(param_values[i], condition_ids, trials_per_eval, seed)
        for i in range(n_evals)
    ])

    si = morris_analyze.analyze(problem, param_values, y)

    indices = []
    for i, name in enumerate(problem["names"]):
        indices.append({
            "name": name,
            "mu_star": float(si["mu_star"][i]),
            "sigma": float(si["sigma"][i]),
            "mu": float(si["mu"][i]),
        })

    report = SensitivityReport(
        method="morris",
        n_params=problem["num_vars"],
        n_evaluations=n_evals,
        metric="chi",
        indices=indices,
    )

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / "morris_screening.json", "w") as f:
            json.dump(report.to_dict(), f, indent=2)

    return report


def run_sobol_analysis(
    *,
    condition_ids: list[str],
    n_samples: int = 1024,
    trials_per_eval: int = 1000,
    seed: int = 42,
    output_dir: Path | None = None,
) -> SensitivityReport:
    """Run Sobol first-order and total-order sensitivity analysis."""
    problem = build_problem_definition(condition_ids)
    np.random.seed(seed)
    param_values = saltelli.sample(problem, n_samples)

    n_evals = param_values.shape[0]
    logger.info("Sobol analysis: %d evaluations", n_evals)
    y = np.array([
        _objective(param_values[i], condition_ids, trials_per_eval, seed)
        for i in range(n_evals)
    ])

    si = sobol_analyze.analyze(problem, y)

    indices = []
    for i, name in enumerate(problem["names"]):
        indices.append({
            "name": name,
            "S1": float(si["S1"][i]),
            "S1_conf": float(si["S1_conf"][i]),
            "ST": float(si["ST"][i]),
            "ST_conf": float(si["ST_conf"][i]),
        })

    report = SensitivityReport(
        method="sobol",
        n_params=problem["num_vars"],
        n_evaluations=n_evals,
        metric="chi",
        indices=indices,
    )

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / "sobol_indices.json", "w") as f:
            json.dump(report.to_dict(), f, indent=2)
        tornado = sorted(indices, key=lambda x: abs(x.get("S1", 0)), reverse=True)
        with open(output_dir / "tornado_data.json", "w") as f:
            json.dump(tornado, f, indent=2)

    return report
