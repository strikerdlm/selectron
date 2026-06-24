"""Load/save imm-priors.json and evidence proposal CSVs."""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any

from selectron.condition_mapping import map_proposal_id

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # up to Selectron/
_DEFAULT_PRIORS_PATH = _REPO_ROOT / "src" / "data" / "imm-priors.json"
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


def _validate_priors(data: dict[str, Any]) -> None:
    if not isinstance(data, dict):
        raise ValueError("priors data must be a dict")
    if data.get("schema_version") != 1:
        raise ValueError(
            f"schema_version must be 1, got {data.get('schema_version')}"
        )
    if not isinstance(data.get("conditions"), dict):
        raise ValueError("conditions must be a dict")
    for cid, prior in data["conditions"].items():
        if not isinstance(prior.get("provenance"), str):
            raise ValueError(f"{cid}: provenance must be a string")
        if not isinstance(prior.get("source_ref"), str):
            raise ValueError(f"{cid}: source_ref must be a string")


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
    """Load accepted, independently adjudicated evidence rows for PyMC fitting.

    Proposal CSVs are intentionally excluded from this release-scientific path.
    Rows enter fitting only when status == accepted, extractor and verifier are
    populated, and person_days/events are present (count extracts). Accepted
    parameter-path rows without incidence counts are tracked by the TS evidence
    gate but skipped here.
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
            if not row.get("extractor") or not row.get("verifier"):
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
                    "model_version": row.get("model_version", ""),
                    "notes": row.get("notes", ""),
                }
            )
    return rows
