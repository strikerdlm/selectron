"""K15 Table 1 reference-model regression for the simplified Python path.

This module compares the offline Python forward model against the NASA K15
Table 1 reference values. It is a secondary Python-package check, not the
canonical TypeScript IMM regression lane. It reports two independent statuses
per metric:

  * K15 agreement — observed value is inside the K15 published CI₉₅.
  * Internal regression — observed value is inside a frozen regression
    envelope that captures the current (documented-divergent) state.

The regression envelope is NOT a validation or acceptance criterion. A metric
that is outside the K15 CI₉₅ but inside its regression envelope is "regression
stable · K15 divergent" — it must never be reported as an unqualified PASS.
Only `within_ci95` (K15 interval overlap for this Python approximation) is a
scientific agreement signal inside this secondary lane.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from importlib import resources
from pathlib import Path
from typing import Any

from selectron.forward_mc import simulate_imm
from selectron.k15_reference import (
    K15_REF,
    K15_CI95,
    K15_REFERENCE_CREW,
    K15_MISSION_DURATION_DAYS,
    K15_SEED,
)
from selectron.priors_io import load_priors

logger = logging.getLogger(__name__)

_ISS_HMS_RESOURCES: dict[str, int] = {
    "antibiotic-broad-spectrum": 30, "antibiotic-narrow-spectrum": 14,
    "antibiotic-otic": 10, "antiviral": 7, "antifungal": 7,
    "analgesic-mild": 60, "analgesic-strong": 14, "opioid": 7,
    "muscle-relaxant": 10, "sedative": 10, "antiemetic": 14,
    "antihistamine": 28, "decongestant": 14, "nasal-decongestant": 14,
    "antacid": 28, "antidiarrheal": 14, "laxative": 14,
    "oral-rehydration": 14, "scopolamine": 14, "topical-steroid": 14,
    "topical-antibiotic": 14, "eye-drops": 14, "ear-drops": 14,
    "iv-fluid": 6, "epinephrine": 4, "atropine": 4, "lidocaine": 6,
    "antiarrhythmic": 14, "anticoagulant": 30, "antihypertensive": 30,
    "anticonvulsant": 30, "antidepressant": 30, "anti-anxiety": 14,
    "sleep-aid": 14, "antipsychotic": 4, "antibiotic-eye": 6,
    "ophthalmic-antiglaucoma": 14, "ophthalmic-exam": 1,
    "eye-irrigation-kit": 2, "defibrillator-pad": 4, "defibrillator": 1,
    "aed": 1, "cardiac-monitor": 1, "suture-kit": 4, "splint": 6,
    "cervical-collar": 1, "catheter-urinary": 4, "chest-tube": 2,
    "burn-dressing": 8, "bandage-large": 20, "bandage-small": 50,
    "dental-temporary-filling": 6, "dental-filling-material": 2,
    "dental-crown-cement": 2, "hormonal-contraceptive": 30,
    "oxygen-supplemental": 2,
}

_UNLIMITED_RESOURCES: dict[str, float] = {
    k: float("inf") for k in _ISS_HMS_RESOURCES
}

_SCENARIO_RESOURCES: dict[str, dict[str, Any]] = {
    "none": {},
    "issHMS": _ISS_HMS_RESOURCES,
    "unlimited": _UNLIMITED_RESOURCES,
}

def _load_k15_regression_brackets() -> dict[str, dict[str, dict[str, Any]]]:
    """Load the frozen K15 regression brackets bundled with the Python package.

    F8: this intentionally does not navigate into the TypeScript source tree.
    The Python path is a secondary offline approximation; its regression
    envelope must travel as package data when installed standalone.
    """
    try:
        resource = resources.files("selectron").joinpath("k15_regression_brackets.json")
        return json.loads(resource.read_text(encoding="utf-8"))
    except (FileNotFoundError, ModuleNotFoundError) as exc:
        raise RuntimeError(
            "selectron.k15_regression_brackets.json is missing from package data; "
            "reinstall selectron-offline or check pyproject.toml package-data."
        ) from exc


_K15_REGRESSION_BRACKETS = _load_k15_regression_brackets()


@dataclass
class MetricResult:
    """Result of comparing one metric against the K15 reference model.

    Two independent statuses are carried:

    * ``within_ci95`` — K15 agreement: observed is inside the K15 published
      CI₉₅. This is the only scientific agreement signal.
    * ``within_regression_envelope`` — internal regression: observed is inside
      a frozen regression envelope capturing the current divergent state.
      A metric can be regression-stable while K15-divergent.
    """

    metric: str
    scenario: str
    observed: float
    reference: float
    ci95: tuple[float, float]
    delta: float
    within_ci95: bool
    regression: tuple[float, float]
    k15_status: str
    within_regression_envelope: bool
    tracking: str = ""


@dataclass
class K15ValidationReport:
    """Full K15 reference-model regression report for the Python approximation."""

    timestamp: str = ""
    trials: int = 0
    seed: int = 0
    n_total: int = 0
    n_within_ci95: int = 0
    metrics: list[MetricResult] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "timestamp": self.timestamp,
            "trials": self.trials,
            "seed": self.seed,
            "n_total": self.n_total,
            "n_within_ci95": self.n_within_ci95,
            "metrics": [asdict(m) for m in self.metrics],
        }

    def to_markdown(self) -> str:
        lines = [
            "# K15 Reference-Model Regression Report",
            "",
            f"**Timestamp:** {self.timestamp}",
            f"**Trials:** {self.trials:,}",
            f"**Seed:** 0x{self.seed:X}",
            f"**Metrics within K15 CI₉₅:** {self.n_within_ci95}/{self.n_total}",
            "",
            ("Two independent statuses are reported per metric. `within_ci95` is the "
             "only scientific agreement signal; `regression` is a frozen internal "
             "envelope. A metric outside the K15 CI₉₅ but inside its regression "
             "envelope is *regression stable · K15 divergent* — not a pass."),
            "",
            "| Scenario | Metric | Observed | Reference | CI95 | Regression | Delta | K15 agreement | Regression |",
            "|----------|--------|----------|-----------|------|------------|-------|---------------|-------------|",
        ]
        for m in self.metrics:
            if m.within_ci95:
                k15_agreement = "within CI₉₅"
            else:
                k15_agreement = "outside CI₉₅"
            regression_status = (
                "stable" if m.within_regression_envelope else "drift"
            )
            lines.append(
                f"| {m.scenario} | {m.metric} | {m.observed:.2f} | "
                f"{m.reference:.2f} | [{m.ci95[0]:.2f}, {m.ci95[1]:.2f}] | "
                f"[{m.regression[0]:.2f}, {m.regression[1]:.2f}] | "
                f"{m.delta:+.2f} | {k15_agreement} | {regression_status} ({m.k15_status}) |"
            )
        lines.append("")
        return "\n".join(lines)


def validate_k15(
    *,
    trials: int = 100_000,
    seed: int = K15_SEED,
    scenarios: list[str] | None = None,
    priors_path: Path | None = None,
    output_dir: Path | None = None,
) -> K15ValidationReport:
    """Run Python-path K15 reference-model regression on current priors."""
    if scenarios is None:
        scenarios = ["none", "issHMS", "unlimited"]

    priors_data = load_priors(priors_path)
    all_priors = priors_data["conditions"]
    tier_b_mult = priors_data.get("global_calibration", {}).get("tierB_multiplier", 1.0)

    report = K15ValidationReport(
        timestamp=datetime.now(timezone.utc).isoformat(),
        trials=trials,
        seed=seed,
    )

    metric_names = ["tme", "chi", "p_evac", "p_locl"]
    metric_to_ref_key = {"tme": "tme_mean", "chi": "chi_mean", "p_evac": "p_evac_mean", "p_locl": "p_locl_mean"}
    metric_to_ci_key = {"tme": "tme", "chi": "chi", "p_evac": "p_evac", "p_locl": "p_locl"}

    for scenario in scenarios:
        resources = _SCENARIO_RESOURCES[scenario]
        result = simulate_imm(
            priors=all_priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources=resources,
            trials=trials,
            seed=seed,
            tier_b_multiplier=tier_b_mult,
        )

        ref = K15_REF[scenario]
        ci = K15_CI95[scenario]

        for metric in metric_names:
            observed = result[metric]["mean"]
            ref_val = getattr(ref, metric_to_ref_key[metric])
            ci_bounds = getattr(ci, metric_to_ci_key[metric])
            delta = observed - ref_val
            within = ci_bounds[0] <= observed <= ci_bounds[1]
            regression_meta = _K15_REGRESSION_BRACKETS[scenario][metric]
            regression = tuple(regression_meta["regression"])
            within_regression_envelope = regression[0] <= observed <= regression[1]

            report.metrics.append(MetricResult(
                metric=metric,
                scenario=scenario,
                observed=observed,
                reference=ref_val,
                ci95=ci_bounds,
                delta=delta,
                within_ci95=within,
                regression=regression,
                k15_status=regression_meta["status"],
                within_regression_envelope=within_regression_envelope,
                tracking=regression_meta.get("tracking", ""),
            ))

    report.n_total = len(report.metrics)
    report.n_within_ci95 = sum(1 for m in report.metrics if m.within_ci95)

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with open(output_dir / "k15_report.json", "w") as f:
            json.dump(report.to_dict(), f, indent=2)
        with open(output_dir / "k15_report.md", "w") as f:
            f.write(report.to_markdown())
        logger.info("K15 report saved to %s", output_dir)

    return report
