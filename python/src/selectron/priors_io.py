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
_PROPOSAL_FILES = [
    "incidence_rates.proposals_p-a.csv",
    "incidence_rates.proposals_p-b.csv",
    "incidence_rates.proposals_p-d.csv",
    "incidence_rates.proposals_p-e.csv",
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
    """Extract all tier-B conditions from a priors dict."""
    return {
        cid: prior
        for cid, prior in data["conditions"].items()
        if prior.get("provenance") == "tierB-lit"
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
                rows.append(
                    {
                        "condition_id": row["condition_id"],
                        "mapped_prior_id": map_proposal_id(row["condition_id"]),
                        "person_days": int(row["person_days"]),
                        "events": int(row["events"]),
                        "study_slug": row["study_slug"],
                        "study_doi": row.get("study_doi", ""),
                        "mission_type": row.get("mission_type", ""),
                        "notes": row.get("notes", ""),
                    }
                )

    return rows
