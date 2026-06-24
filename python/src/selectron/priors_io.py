"""Load/save imm-priors.json and evidence proposal CSVs."""

from __future__ import annotations

import csv
import json
import math
import os
import re
from pathlib import Path
from typing import Any

from selectron.condition_mapping import map_proposal_id

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # up to Selectron/
_DEFAULT_PRIORS_PATH = _REPO_ROOT / "src" / "data" / "imm-priors.json"
_CONDITIONS_TS_PATH = _REPO_ROOT / "src" / "imm" / "conditions.ts"
_PROPOSALS_DIR = _REPO_ROOT / "research" / "evidence_extracted"
_ACCEPTED_LEDGER = _PROPOSALS_DIR / "evidence_ledger.csv"
_PROPOSAL_FILES = [
    "incidence_rates.proposals_p-a.csv",
    "incidence_rates.proposals_p-b.csv",
    "incidence_rates.proposals_p-c.csv",
    "incidence_rates.proposals_p-d.csv",
    "incidence_rates.proposals_p-e.csv",
    "incidence_rates.proposals_p-f.csv",
    "incidence_rates.proposals_p-g.csv",
    "incidence_rates.proposals_p-h.csv",
    "incidence_rates.proposals_p-i.csv",
    "incidence_rates.proposals_p-j.csv",
    "incidence_rates.proposals_p-k.csv",
]

_REQUIRED_ACCEPTED_EVIDENCE_FIELDS = (
    "endpoint_definition",
    "numerator",
    "person_days",
    "events",
    "exposure_time",
    "repeated_measure_structure",
    "extraction_quote",
    "extractor",
    "verifier",
    "risk_of_bias",
    "transportability",
    "holdout_design",
    "calibration_metrics",
    "uncertainty_distribution",
    "model_version",
    "acceptance_version",
    "prior_value_hash",
)

_ALLOWED_PROVENANCE = {
    "tierA-nasa",
    "tierB-lit",
    "tierB-pymc",
    "tierC-synth",
    "user-custom",
}
_ALLOWED_DISTRIBUTIONS = {
    "Lognormal-Poisson",
    "Gamma-Poisson",
    "Beta-Bernoulli",
    "Fixed",
}
_ALLOWED_LAMBDA_UNITS = {
    "events-per-person-day",
    "events-per-EVA",
    "events-per-SPE",
}
_ALLOWED_RISK_FACTORS = {
    "sex-male",
    "sex-female",
    "contacts",
    "crowns",
    "CAC-positive",
    "abdominal-surgery-history",
    "EVA",
    "SPE",
}
_ALLOWED_MISSION_KINDS = {
    "analog-isolation",
    "analog-controlled",
    "antarctic-station",
    "leo-iss",
    "lunar-artemis-future",
    "interplanetary-mars-future",
}
_INACTIVE_KIND_MULTIPLIER_KEYS = {
    "frostbite",
    "hypoxia-related-headache",
    "seasonal-affective-disorder",
}
_CONDITION_IDS_CACHE: set[str] | None = None


def _condition_ids() -> set[str] | None:
    """Read the canonical TS condition catalog when available in the repo tree."""
    global _CONDITION_IDS_CACHE
    if _CONDITION_IDS_CACHE is not None:
        return _CONDITION_IDS_CACHE
    if not _CONDITIONS_TS_PATH.exists():
        return None
    raw = _CONDITIONS_TS_PATH.read_text(encoding="utf-8")
    ids = set(re.findall(r'"id":\s*"([^"]+)"', raw))
    if not ids:
        raise ValueError("E_BAD_PRIORS: could not read condition ids from src/imm/conditions.ts")
    _CONDITION_IDS_CACHE = ids
    return ids


def _fail(path: str, message: str) -> None:
    raise ValueError(f"E_BAD_PRIORS: {path} {message}")


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)


def _require_record(value: Any, path: str) -> dict[str, Any]:
    if not _is_record(value):
        _fail(path, "must be an object")
    return value


def _require_nonempty_string(value: Any, path: str) -> str:
    if not isinstance(value, str) or not value.strip():
        _fail(path, "must be a non-empty string")
    return value


def _require_number(
    value: Any,
    path: str,
    *,
    min_value: float | None = None,
    exclusive_min: float | None = None,
    max_value: float | None = None,
) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        _fail(path, "must be a finite number")
    x = float(value)
    if min_value is not None and x < min_value:
        _fail(path, f"must be >= {min_value}, got {x}")
    if exclusive_min is not None and x <= exclusive_min:
        _fail(path, f"must be > {exclusive_min}, got {x}")
    if max_value is not None and x > max_value:
        _fail(path, f"must be <= {max_value}, got {x}")
    return x


def _validate_pert(value: Any, path: str, *, min_value: float, max_value: float | None = None) -> None:
    pert = _require_record(value, path)
    lo = _require_number(pert.get("min"), f"{path}.min", min_value=min_value, max_value=max_value)
    mode = _require_number(pert.get("mode"), f"{path}.mode", min_value=min_value, max_value=max_value)
    hi = _require_number(pert.get("max"), f"{path}.max", min_value=min_value, max_value=max_value)
    if lo > mode or mode > hi:
        _fail(path, "must satisfy min <= mode <= max")


def _validate_outcomes(value: Any, path: str) -> None:
    outcomes = _require_record(value, path)
    _validate_pert(outcomes.get("fi_cp1"), f"{path}.fi_cp1", min_value=0, max_value=1)
    _validate_pert(outcomes.get("dt_cp1_hours"), f"{path}.dt_cp1_hours", min_value=0)
    _validate_pert(outcomes.get("fi_cp2"), f"{path}.fi_cp2", min_value=0, max_value=1)
    _validate_pert(outcomes.get("dt_cp2_hours"), f"{path}.dt_cp2_hours", min_value=0)
    _validate_pert(outcomes.get("fi_cp3"), f"{path}.fi_cp3", min_value=0, max_value=1)
    _validate_pert(outcomes.get("p_evac"), f"{path}.p_evac", min_value=0, max_value=1)
    _validate_pert(outcomes.get("p_locl"), f"{path}.p_locl", min_value=0, max_value=1)


def _validate_prior(cid: str, prior_raw: Any, condition_ids: set[str] | None) -> None:
    prior = _require_record(prior_raw, f"conditions.{cid}")
    if condition_ids is not None and cid not in condition_ids:
        _fail(f"conditions.{cid}", "is not in the active IMM condition catalog")
    condition_id = _require_nonempty_string(prior.get("conditionId"), f"conditions.{cid}.conditionId")
    if condition_id != cid:
        _fail(f"conditions.{cid}.conditionId", "must match the prior key")

    provenance = _require_nonempty_string(prior.get("provenance"), f"conditions.{cid}.provenance")
    if provenance not in _ALLOWED_PROVENANCE:
        _fail(f"conditions.{cid}.provenance", f"is unsupported: {provenance}")
    _require_nonempty_string(prior.get("source_ref"), f"conditions.{cid}.source_ref")

    incidence = _require_record(prior.get("incidence"), f"conditions.{cid}.incidence")
    distribution = _require_nonempty_string(
        incidence.get("distribution"),
        f"conditions.{cid}.incidence.distribution",
    )
    if distribution not in _ALLOWED_DISTRIBUTIONS:
        _fail(f"conditions.{cid}.incidence.distribution", f"is unsupported: {distribution}")
    lambda_unit = _require_nonempty_string(
        incidence.get("lambda_unit"),
        f"conditions.{cid}.incidence.lambda_unit",
    )
    if lambda_unit not in _ALLOWED_LAMBDA_UNITS:
        _fail(f"conditions.{cid}.incidence.lambda_unit", f"is unsupported: {lambda_unit}")

    if distribution == "Lognormal-Poisson":
        _require_number(incidence.get("mu_log_lambda"), f"conditions.{cid}.incidence.mu_log_lambda")
        _require_number(
            incidence.get("sigma_log_lambda"),
            f"conditions.{cid}.incidence.sigma_log_lambda",
            exclusive_min=0,
        )
    elif distribution in {"Gamma-Poisson", "Beta-Bernoulli"}:
        _require_number(incidence.get("alpha"), f"conditions.{cid}.incidence.alpha", exclusive_min=0)
        _require_number(incidence.get("beta"), f"conditions.{cid}.incidence.beta", exclusive_min=0)
        if "prior_alpha" in incidence:
            _require_number(incidence.get("prior_alpha"), f"conditions.{cid}.incidence.prior_alpha", exclusive_min=0)
        if "prior_beta" in incidence:
            _require_number(incidence.get("prior_beta"), f"conditions.{cid}.incidence.prior_beta", exclusive_min=0)
    elif distribution == "Fixed":
        _require_number(incidence.get("lambda_fixed"), f"conditions.{cid}.incidence.lambda_fixed", min_value=0)

    severity = _require_record(prior.get("severity"), f"conditions.{cid}.severity")
    _require_number(
        severity.get("worst_case_prob_alpha"),
        f"conditions.{cid}.severity.worst_case_prob_alpha",
        exclusive_min=0,
    )
    _require_number(
        severity.get("worst_case_prob_beta"),
        f"conditions.{cid}.severity.worst_case_prob_beta",
        exclusive_min=0,
    )

    _validate_outcomes(prior.get("treated"), f"conditions.{cid}.treated")
    _validate_outcomes(prior.get("untreated"), f"conditions.{cid}.untreated")
    if "outcomeScenarios" in prior:
        scenarios = _require_record(prior.get("outcomeScenarios"), f"conditions.{cid}.outcomeScenarios")
        for scenario_name in ("best", "worst"):
            scenario = _require_record(
                scenarios.get(scenario_name),
                f"conditions.{cid}.outcomeScenarios.{scenario_name}",
            )
            _validate_outcomes(scenario.get("treated"), f"conditions.{cid}.outcomeScenarios.{scenario_name}.treated")
            _validate_outcomes(scenario.get("untreated"), f"conditions.{cid}.outcomeScenarios.{scenario_name}.untreated")
            evidence_status = scenario.get("evidenceStatus")
            if evidence_status is not None and evidence_status not in {"accepted", "scenario", "legacy-v1-duplicated"}:
                _fail(
                    f"conditions.{cid}.outcomeScenarios.{scenario_name}.evidenceStatus",
                    "is unsupported",
                )

    risk_factors = _require_record(prior.get("risk_factor_multipliers"), f"conditions.{cid}.risk_factor_multipliers")
    for factor, multiplier in risk_factors.items():
        if factor not in _ALLOWED_RISK_FACTORS:
            _fail(f"conditions.{cid}.risk_factor_multipliers.{factor}", "is not a supported risk factor")
        _require_number(multiplier, f"conditions.{cid}.risk_factor_multipliers.{factor}", min_value=0)

    resources = _require_record(prior.get("required_resources"), f"conditions.{cid}.required_resources")
    for resource, amount in resources.items():
        if not isinstance(resource, str) or not resource.strip():
            _fail(f"conditions.{cid}.required_resources", "contains an empty resource key")
        _require_number(amount, f"conditions.{cid}.required_resources.{resource}", min_value=0)


def _validate_global_calibration(data: dict[str, Any], condition_ids: set[str] | None) -> None:
    global_calibration = _require_record(data.get("global_calibration"), "global_calibration")
    for key in (
        "tierC_multiplier_iss_hms",
        "tierC_multiplier_iss_none",
        "tierC_multiplier_iss_unlimited",
    ):
        _require_number(global_calibration.get(key), f"global_calibration.{key}", min_value=0)
    for key in ("tierA_multiplier", "tierB_multiplier", "tierC_multiplier"):
        if key in global_calibration:
            _require_number(global_calibration.get(key), f"global_calibration.{key}", min_value=0)
    _require_nonempty_string(global_calibration.get("fit_against"), "global_calibration.fit_against")
    if not isinstance(global_calibration.get("fit_residuals_within_CI95"), bool):
        _fail("global_calibration.fit_residuals_within_CI95", "must be a boolean")

    if "kind_multipliers" not in global_calibration:
        return
    kind_multipliers = _require_record(global_calibration.get("kind_multipliers"), "global_calibration.kind_multipliers")
    for kind, per_kind_raw in kind_multipliers.items():
        if kind not in _ALLOWED_MISSION_KINDS:
            _fail(f"global_calibration.kind_multipliers.{kind}", "is not a supported mission kind")
        per_kind = _require_record(per_kind_raw, f"global_calibration.kind_multipliers.{kind}")
        for condition_key, multiplier in per_kind.items():
            if condition_key.startswith("_"):
                continue
            if not condition_key.strip():
                _fail(f"global_calibration.kind_multipliers.{kind}", "contains an empty condition key")
            if (
                condition_ids is not None
                and condition_key not in condition_ids
                and condition_key not in _INACTIVE_KIND_MULTIPLIER_KEYS
            ):
                _fail(
                    f"global_calibration.kind_multipliers.{kind}.{condition_key}",
                    "is not an active IMM condition or documented inactive sensitivity key",
                )
            _require_number(
                multiplier,
                f"global_calibration.kind_multipliers.{kind}.{condition_key}",
                min_value=0,
            )


def _validate_priors(data: dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError("priors data must be a dict")
    if data.get("schema_version") != 1:
        raise ValueError(
            f"schema_version must be 1, got {data.get('schema_version')}"
        )
    _require_nonempty_string(data.get("calibration_target"), "calibration_target")
    conditions = _require_record(data.get("conditions"), "conditions")
    condition_ids = _condition_ids()
    if condition_ids is not None:
        extra = sorted(set(conditions) - condition_ids)
        if extra:
            _fail(f"conditions.{extra[0]}", "is not in the active IMM condition catalog")
        missing = sorted(condition_ids - set(conditions))
        if missing:
            _fail("conditions", f"missing prior for {missing[0]}")
    for cid, prior in conditions.items():
        _validate_prior(cid, prior, condition_ids)
    _validate_global_calibration(data, condition_ids)


def load_priors(path: Path | None = None) -> dict[str, Any]:
    """Load imm-priors.json and validate its structure."""
    p = path or _DEFAULT_PRIORS_PATH
    with open(p) as f:
        data = json.load(f)
    _validate_priors(data)
    return data


def save_priors(data: dict[str, Any], path: Path | None = None) -> None:
    """Atomically write imm-priors.json (write to .tmp, validate, rename)."""
    _validate_priors(data)
    p = path or _DEFAULT_PRIORS_PATH
    tmp = p.with_suffix(".json.tmp")
    try:
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        with open(tmp) as f:
            reread = json.load(f)
        _validate_priors(reread)
        os.replace(tmp, p)
    except Exception:
        if tmp.exists():
            tmp.unlink()
        raise


def get_tier_b_conditions(
    data: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Extract all fittable Gamma-Poisson conditions from a priors dict.

    Includes both tierB-lit (pending fit) and tierB-pymc (already fitted) since
    either can be re-fit. tierA-nasa conditions are excluded because their priors
    come from NASA flight data, not terrestrial epidemiology.
    """
    return {
        cid: prior
        for cid, prior in data["conditions"].items()
        if prior.get("provenance") in ("tierB-lit", "tierB-pymc")
        and prior.get("incidence", {}).get("distribution") == "Gamma-Poisson"
    }


def get_tier_c_conditions(
    data: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Extract all tier-C conditions from a priors dict."""
    return {
        cid: prior
        for cid, prior in data["conditions"].items()
        if prior.get("provenance") == "tierC-synth"
    }


def load_evidence_proposals(
    proposals_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """Load and deduplicate evidence rows from all proposal CSVs."""
    d = proposals_dir or _PROPOSALS_DIR

    seen: set[tuple[str, str, str, str]] = set()
    rows: list[dict[str, Any]] = []

    for fname in _PROPOSAL_FILES:
        fpath = d / fname
        if not fpath.exists():
            continue
        with open(fpath, newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (
                    row["condition_id"],
                    row["study_slug"],
                    row["person_days"],
                    row["events"],
                )
                if key in seen:
                    continue
                seen.add(key)
                def _parse_int(val: str) -> int:
                    return int(val.removeprefix("EST:"))

                rows.append(
                    {
                        "condition_id": row["condition_id"],
                        "mapped_prior_id": map_proposal_id(row["condition_id"]),
                        "person_days": _parse_int(row["person_days"]),
                        "events": _parse_int(row["events"]),
                        "study_slug": row["study_slug"],
                        "study_doi": row.get("study_doi", ""),
                        "mission_type": row.get("mission_type", ""),
                        "notes": row.get("notes", ""),
                    }
                )

    return rows


def load_accepted_evidence(
    ledger_path: Path | None = None,
) -> list[dict[str, Any]]:
    """Load accepted, independently adjudicated evidence rows for release fitting.

    Proposal CSVs are intentionally excluded from this release-scientific path.
    Rows enter fitting only when status == accepted, extractor and verifier are
    independently populated, person_days/events are present (count extracts),
    and the accepted-row protocol metadata is complete. Accepted parameter-path
    rows without incidence counts are tracked by the TS evidence gate but
    skipped here.
    """
    p = ledger_path or _ACCEPTED_LEDGER
    if not p.exists():
        return []

    rows: list[dict[str, Any]] = []
    with open(p, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("status", "").strip().lower() != "accepted":
                continue
            if any(not (row.get(field) or "").strip() for field in _REQUIRED_ACCEPTED_EVIDENCE_FIELDS):
                continue
            if row.get("extractor", "").strip() == row.get("verifier", "").strip():
                continue

            person_days_raw = (row.get("person_days") or "").strip()
            events_raw = (row.get("events") or "").strip()
            if not person_days_raw or not events_raw:
                # Parameter-path adjudication without count extract — not fit input.
                continue

            def _parse_int(val: str) -> int:
                return int(val.removeprefix("EST:").strip())

            condition_id = row["condition_id"]
            rows.append(
                {
                    "condition_id": condition_id,
                    "mapped_prior_id": row.get("mapped_prior_id") or map_proposal_id(condition_id),
                    "person_days": _parse_int(person_days_raw),
                    "events": _parse_int(events_raw),
                    "study_slug": row["study_slug"],
                    "study_doi": row.get("study_doi", ""),
                    "mission_type": row.get("mission_type", ""),
                    "endpoint_definition": row.get("endpoint_definition", ""),
                    "numerator": row.get("numerator", row.get("events", "")),
                    "denominator": row.get("denominator", ""),
                    "exposure_time": row.get("exposure_time", ""),
                    "repeated_measure_structure": row.get("repeated_measure_structure", ""),
                    "extraction_quote": row.get("extraction_quote", ""),
                    "extractor": row.get("extractor", ""),
                    "verifier": row.get("verifier", ""),
                    "risk_of_bias": row.get("risk_of_bias", ""),
                    "transportability": row.get("transportability", ""),
                    "transformation": row.get("transformation", ""),
                    "uncertainty_distribution": row.get("uncertainty_distribution", ""),
                    "holdout_design": row.get("holdout_design", ""),
                    "calibration_metrics": row.get("calibration_metrics", ""),
                    "model_version": row.get("model_version", ""),
                    "acceptance_version": row.get("acceptance_version", ""),
                    "prior_value_hash": row.get("prior_value_hash", ""),
                    "notes": row.get("notes", ""),
                }
            )
    return rows
