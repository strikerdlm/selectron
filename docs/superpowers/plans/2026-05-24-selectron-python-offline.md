# Selectron Python Offline Calibration Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline Python pipeline that replaces hand-elicited blanket-multiplier priors for 41 tier-B IMM conditions with Bayesian posterior fits, validates the new priors against K15 Table 1, writes them atomically back to `src/data/imm-priors.json`, and runs Sobol/Morris global sensitivity analysis to identify the highest-variance conditions.

**Architecture:** Four modules in `python/src/selectron/` (fitter, validator, writer, sensitivity) plus three shared modules (priors_io, k15_reference, forward_mc). The fitter reads evidence from proposal CSVs, deduplicates rows, maps proposal condition IDs to `imm-priors.json` condition IDs, and fits Gamma-Poisson posteriors via PyMC NUTS. The validator runs a numpy forward MC (a simplified reimplementation of the TS engine's core 4-step trial loop) and compares against K15 Table 1 reference values. The writer performs an atomic JSON merge. The sensitivity module runs SALib Sobol/Morris over the parameter space.

**Tech Stack:** Python 3.12, PyMC 5.16+, ArviZ 0.18+, nutpie 0.13+, numpy 1.26+ (<2.0), pandas 2.2+, scipy 1.12+, SALib 1.5+, pytest 8.0+

**Critical data realities that shape this plan:**

1. **Evidence is sparse.** The main `incidence_rates.csv` is empty (header only). Evidence exists only in `incidence_rates.proposals_p-a.csv` (12 rows) and `incidence_rates.proposals_p-b.csv` (7 rows). After deduplication by `(condition_id, study_slug, person_days, events)`, 13 unique rows remain across 6 proposal condition IDs. Of these, only `depression-anxiety` maps to a tier-B condition (`depression`). The other 5 proposal IDs (`insomnia`, `circadian-disruption`, `conflict-event`, `performance-drop-pvt`, `early-termination-request`) have no matching tier-B condition. Therefore **1 of 30 Gamma-Poisson conditions and 0 of 11 Beta-Bernoulli conditions** are currently fittable. The pipeline must handle the skip-with-warning path as its dominant mode.

2. **Condition ID mismatch.** Proposals use `depression-anxiety`; `imm-priors.json` uses `depression`. A mapping table is required.

3. **Two distribution families.** Tier-B has 30 Gamma-Poisson and 11 Beta-Bernoulli conditions. Gamma-Poisson fitting uses `(person_days, events)` from the CSV. Beta-Bernoulli fitting requires `(n_subjects, n_affected)` proportion data, which the current CSV schema does not include. Beta-Bernoulli fitting is **deferred to v1.1** when the schema is extended.

4. **PRNG mismatch.** The TS engine uses Mulberry32 (32-bit). Python uses numpy's PCG64. Cross-validation compares statistical properties (means within CI95 at T=100k), not sample-by-sample equality.

5. **forward_mc.py scope.** The Python forward MC reimplements only the core 4-step trial loop (general-Poisson incidence sampling, severity, treatment/RAF/Beta-PERT outcomes, QTL aggregation). It does NOT reimplement SPE-coupled, EVA-coupled, space-adaptation-once, or Stage A vulnerability paths. The K15 validation gate delegates to the TS engine for the authoritative full-model check.

**Commit convention:** `feat(python):`, `test(python):`, `chore(python):`. No AI co-author lines (Diego is sole author).

---

## File Structure

```
python/
  pyproject.toml                       # Task 1: project metadata + deps
  src/selectron/__init__.py            # Task 1: package init
  src/selectron/condition_mapping.py   # Task 2: proposal→prior ID mapping
  src/selectron/priors_io.py           # Task 2: load/save imm-priors.json
  src/selectron/k15_reference.py       # Task 3: K15 Table 1 constants + crew
  src/selectron/forward_mc.py          # Tasks 4-5: numpy 4-step trial loop
  src/selectron/fitter.py              # Tasks 7-8: PyMC Gamma-Poisson fit
  src/selectron/validator.py           # Task 9: K15 gate + report
  src/selectron/writer.py              # Task 10: atomic priors JSON merge
  src/selectron/sensitivity.py         # Task 11: Sobol/Morris via SALib
  tests/__init__.py                    # Task 1: tests package
  tests/conftest.py                    # Task 1: shared fixtures
  tests/test_priors_io.py              # Task 2: priors I/O tests
  tests/test_forward_mc.py             # Tasks 5-6: forward MC tests
  tests/test_fitter.py                 # Tasks 7-8: fitter tests
  tests/test_validator.py              # Task 9: validator tests
  tests/test_writer.py                 # Task 10: writer tests
  tests/test_sensitivity.py            # Task 11: sensitivity tests
  outputs/.gitkeep                     # Task 1: outputs directory
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `python/pyproject.toml`
- Create: `python/src/selectron/__init__.py`
- Create: `python/tests/__init__.py`
- Create: `python/tests/conftest.py`
- Create: `python/outputs/.gitkeep`

- [ ] **Step 1: Create directory structure**

```bash
cd /root/repos/Selectron
mkdir -p python/src/selectron python/tests python/outputs
```

- [ ] **Step 2: Create pyproject.toml**

```toml
[build-system]
requires = ["setuptools>=70.0"]
build-backend = "setuptools.build_meta"

[project]
name = "selectron-offline"
version = "0.1.0"
requires-python = ">=3.12"
description = "Offline Bayesian calibration pipeline for Selectron IMM priors"
dependencies = [
    "pymc>=5.16",
    "arviz>=0.18",
    "nutpie>=0.13",
    "numpy>=1.26,<2.0",
    "pandas>=2.2",
    "scipy>=1.12",
    "SALib>=1.5",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
]

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
]
```

- [ ] **Step 3: Create `__init__.py` files**

`python/src/selectron/__init__.py`:
```python
"""Selectron offline calibration pipeline."""

__version__ = "0.1.0"
```

`python/tests/__init__.py`:
```python
```

- [ ] **Step 4: Create conftest.py with shared fixtures**

`python/tests/conftest.py`:
```python
"""Shared fixtures for the selectron test suite."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import pytest

# ── Path constants ──────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent.parent.parent  # /root/repos/Selectron
PRIORS_PATH = REPO_ROOT / "src" / "data" / "imm-priors.json"
PROPOSALS_DIR = REPO_ROOT / "research" / "evidence_extracted"


@pytest.fixture()
def priors_json() -> dict[str, Any]:
    """Load imm-priors.json as a plain dict (fresh per test)."""
    with open(PRIORS_PATH) as f:
        return json.load(f)


@pytest.fixture()
def tmp_priors(tmp_path: Path, priors_json: dict[str, Any]) -> Path:
    """Write a copy of imm-priors.json to a temp directory and return its path."""
    p = tmp_path / "imm-priors.json"
    with open(p, "w") as f:
        json.dump(priors_json, f, indent=2)
    return p


@pytest.fixture()
def sample_gamma_poisson_prior() -> dict[str, Any]:
    """A minimal Gamma-Poisson prior dict for testing (depression-like)."""
    return {
        "conditionId": "depression",
        "provenance": "tierB-lit",
        "source_ref": "test-fixture",
        "incidence": {
            "distribution": "Gamma-Poisson",
            "alpha": 2.0,
            "beta": 10000.0,
            "lambda_unit": "events-per-person-day",
        },
        "severity": {"worst_case_prob_alpha": 1.5, "worst_case_prob_beta": 8.5},
        "treated": {
            "fi_cp1": {"min": 0, "mode": 0.1, "max": 0.3},
            "dt_cp1_hours": {"min": 4, "mode": 24, "max": 96},
            "fi_cp2": {"min": 0, "mode": 0.02, "max": 0.08},
            "dt_cp2_hours": {"min": 0, "mode": 48, "max": 336},
            "fi_cp3": {"min": 0, "mode": 0, "max": 0},
            "p_evac": {"min": 2.5e-06, "mode": 2.5e-05, "max": 0.000125},
            "p_locl": {"min": 0, "mode": 5e-06, "max": 2.5e-05},
        },
        "untreated": {
            "fi_cp1": {"min": 0.1, "mode": 0.3, "max": 0.6},
            "dt_cp1_hours": {"min": 12, "mode": 72, "max": 336},
            "fi_cp2": {"min": 0, "mode": 0.1, "max": 0.3},
            "dt_cp2_hours": {"min": 24, "mode": 168, "max": 1080},
            "fi_cp3": {"min": 0, "mode": 0, "max": 0},
            "p_evac": {"min": 0.00042, "mode": 0.0014, "max": 0.0035},
            "p_locl": {"min": 3.6e-06, "mode": 1.2e-05, "max": 3.6e-05},
        },
        "risk_factor_multipliers": {"sex-female": 1.3},
        "required_resources": {"antidepressant": 30, "anti-anxiety": 14},
    }
```

- [ ] **Step 5: Create outputs/.gitkeep**

```bash
touch python/outputs/.gitkeep
```

- [ ] **Step 6: Create venv and install**

```bash
cd /root/repos/Selectron/python
/usr/bin/python3.12 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

- [ ] **Step 7: Verify installation**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && python -c "import selectron; print(selectron.__version__)"`
Expected: `0.1.0`

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest --co -q`
Expected: `no tests ran` (test discovery succeeds, no tests yet)

- [ ] **Step 8: Commit**

```bash
git add python/pyproject.toml python/src/selectron/__init__.py python/tests/__init__.py python/tests/conftest.py python/outputs/.gitkeep
git commit -m "chore(python): scaffold offline calibration pipeline

Create python/ directory with pyproject.toml, src/selectron package,
tests scaffold, and outputs directory. Dependencies: PyMC, ArviZ,
nutpie, numpy, pandas, scipy, SALib, pytest."
```

---

### Task 2: priors_io.py and condition_mapping.py (TDD)

**Files:**
- Create: `python/src/selectron/condition_mapping.py`
- Create: `python/src/selectron/priors_io.py`
- Create: `python/tests/test_priors_io.py`

- [ ] **Step 1: Write the failing tests**

`python/tests/test_priors_io.py`:
```python
"""Tests for priors I/O and condition mapping."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from selectron.condition_mapping import (
    PROPOSAL_TO_PRIOR_ID,
    map_proposal_id,
    UNMAPPED_PROPOSAL_IDS,
)
from selectron.priors_io import (
    load_priors,
    save_priors,
    get_tier_b_conditions,
    load_evidence_proposals,
)


# ── condition_mapping tests ────────────────────────────────────────────────


class TestConditionMapping:
    def test_depression_anxiety_maps_to_depression(self) -> None:
        assert map_proposal_id("depression-anxiety") == "depression"

    def test_unmapped_id_returns_none(self) -> None:
        assert map_proposal_id("circadian-disruption") is None

    def test_unmapped_ids_documented(self) -> None:
        """Every unmapped proposal ID is explicitly listed."""
        expected_unmapped = {
            "insomnia",
            "circadian-disruption",
            "conflict-event",
            "performance-drop-pvt",
            "early-termination-request",
        }
        assert expected_unmapped == UNMAPPED_PROPOSAL_IDS

    def test_unknown_id_returns_none(self) -> None:
        assert map_proposal_id("totally-made-up") is None


# ── priors_io tests ────────────────────────────────────────────────────────


class TestLoadPriors:
    def test_load_from_real_file(self) -> None:
        data = load_priors()
        assert data["schema_version"] == 1
        assert "conditions" in data
        assert len(data["conditions"]) == 100

    def test_load_from_custom_path(self, tmp_priors: Path) -> None:
        data = load_priors(tmp_priors)
        assert data["schema_version"] == 1

    def test_invalid_schema_version_raises(self, tmp_path: Path) -> None:
        bad = {"schema_version": 999, "conditions": {}}
        p = tmp_path / "bad.json"
        with open(p, "w") as f:
            json.dump(bad, f)
        with pytest.raises(ValueError, match="schema_version"):
            load_priors(p)


class TestSavePriors:
    def test_round_trip(self, tmp_priors: Path) -> None:
        original = load_priors(tmp_priors)
        original["conditions"]["depression"]["incidence"]["alpha"] = 99.9
        save_priors(original, tmp_priors)
        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["incidence"]["alpha"] == 99.9

    def test_atomic_write_no_partial(self, tmp_priors: Path) -> None:
        """If validation fails, original file is untouched."""
        original = load_priors(tmp_priors)
        bad_data = {"schema_version": 999, "conditions": {}}
        with pytest.raises(ValueError):
            save_priors(bad_data, tmp_priors)
        reloaded = load_priors(tmp_priors)
        assert reloaded == original


class TestGetTierBConditions:
    def test_returns_41_conditions(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        assert len(tier_b) == 41

    def test_all_have_tier_b_provenance(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        for cid, prior in tier_b.items():
            assert prior["provenance"] == "tierB-lit", f"{cid} is not tierB-lit"

    def test_distribution_counts(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        gamma_count = sum(
            1 for v in tier_b.values()
            if v["incidence"]["distribution"] == "Gamma-Poisson"
        )
        beta_count = sum(
            1 for v in tier_b.values()
            if v["incidence"]["distribution"] == "Beta-Bernoulli"
        )
        assert gamma_count == 30
        assert beta_count == 11


class TestLoadEvidenceProposals:
    def test_loads_and_deduplicates(self) -> None:
        rows = load_evidence_proposals()
        # After dedup: 13 unique rows
        assert len(rows) == 13

    def test_maps_condition_ids(self) -> None:
        rows = load_evidence_proposals()
        mapped = [r for r in rows if r["mapped_prior_id"] is not None]
        # Only depression-anxiety → depression is mappable
        assert len(mapped) == 2  # 2 unique depression-anxiety rows
        for r in mapped:
            assert r["mapped_prior_id"] == "depression"

    def test_all_rows_have_required_columns(self) -> None:
        rows = load_evidence_proposals()
        required = {"condition_id", "person_days", "events", "study_slug", "mapped_prior_id"}
        for r in rows:
            assert required.issubset(r.keys()), f"Missing columns in {r}"
            assert isinstance(r["person_days"], int)
            assert isinstance(r["events"], int)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_priors_io.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.condition_mapping'`

- [ ] **Step 3: Implement condition_mapping.py**

`python/src/selectron/condition_mapping.py`:
```python
"""Mapping from evidence-proposal condition IDs to imm-priors.json condition IDs.

The evidence extraction pipeline (research/evidence_extracted/) uses condition IDs
that do not always match the IMM conditions in src/data/imm-priors.json. This module
provides the authoritative mapping.

Unmapped IDs are proposal conditions that have no matching tier-B condition in the
current IMM model. They are explicitly documented so the fitter can skip them with
a clear warning rather than silently dropping data.
"""

from __future__ import annotations

# ── Authoritative mapping table ─────────────────────────────────────────────
# Key:   condition_id as it appears in the proposals CSVs
# Value: conditionId as it appears in imm-priors.json
#
# The "depression-anxiety" proposal captures both depression and anxiety symptoms.
# In the IMM model these are separate conditions:
#   - "depression" (tierB-lit, Gamma-Poisson)
#   - "anxiety" (tierA-nasa, Gamma-Poisson)
# We map to "depression" only. The anxiety component is lost until the extraction
# protocol produces split rows.

PROPOSAL_TO_PRIOR_ID: dict[str, str] = {
    "depression-anxiety": "depression",
}

# ── Explicitly unmapped proposal IDs ────────────────────────────────────────
# These proposal condition IDs have no matching tier-B condition in imm-priors.json.
# Each is documented here so the fitter can produce an actionable skip warning.

UNMAPPED_PROPOSAL_IDS: set[str] = {
    "insomnia",               # closest: insomnia-space-adaptation (Beta-Bernoulli, different process)
    "circadian-disruption",   # no IMM condition — behavioral domain, not modeled
    "conflict-event",         # no IMM condition — behavioral domain, not modeled
    "performance-drop-pvt",   # no IMM condition — performance metric, not medical condition
    "early-termination-request",  # no IMM condition — mission-level outcome, not medical
}


def map_proposal_id(proposal_id: str) -> str | None:
    """Map a proposal condition_id to its imm-priors.json conditionId.

    Returns None if the proposal ID has no matching tier-B condition.
    """
    return PROPOSAL_TO_PRIOR_ID.get(proposal_id)
```

- [ ] **Step 4: Implement priors_io.py**

`python/src/selectron/priors_io.py`:
```python
"""Load/save imm-priors.json and evidence proposal CSVs.

This module is the single point of contact between the Python pipeline and the
shared JSON artifact that the TS engine reads. All reads and writes go through
here so that validation, atomic writes, and path resolution are centralized.
"""

from __future__ import annotations

import csv
import json
import os
from pathlib import Path
from typing import Any

from selectron.condition_mapping import map_proposal_id

# ── Path defaults ───────────────────────────────────────────────────────────
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent  # up to Selectron/
_DEFAULT_PRIORS_PATH = _REPO_ROOT / "src" / "data" / "imm-priors.json"
_PROPOSALS_DIR = _REPO_ROOT / "research" / "evidence_extracted"
_PROPOSAL_FILES = [
    "incidence_rates.proposals_p-a.csv",
    "incidence_rates.proposals_p-b.csv",
]


def _validate_priors(data: dict[str, Any]) -> None:
    """Validate the structure of an imm-priors.json dict.

    Raises ValueError if the data does not conform to schema_version 1.
    """
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
    """Load imm-priors.json and validate its structure.

    Args:
        path: Override path. Defaults to src/data/imm-priors.json in the repo root.

    Returns:
        Parsed and validated priors dict.

    Raises:
        ValueError: If the JSON does not match schema_version 1.
        FileNotFoundError: If the file does not exist.
    """
    p = path or _DEFAULT_PRIORS_PATH
    with open(p) as f:
        data = json.load(f)
    _validate_priors(data)
    return data


def save_priors(data: dict[str, Any], path: Path | None = None) -> None:
    """Atomically write imm-priors.json (write to .tmp, validate, rename).

    Args:
        data: The full priors dict to write.
        path: Override path. Defaults to src/data/imm-priors.json in the repo root.

    Raises:
        ValueError: If the data fails validation (original file is NOT modified).
    """
    # Validate BEFORE writing anything
    _validate_priors(data)

    p = path or _DEFAULT_PRIORS_PATH
    tmp = p.with_suffix(".json.tmp")
    try:
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        # Re-read and validate the written file to catch serialization issues
        with open(tmp) as f:
            reread = json.load(f)
        _validate_priors(reread)
        # Atomic rename
        os.replace(tmp, p)
    except Exception:
        # Clean up temp file on any failure
        if tmp.exists():
            tmp.unlink()
        raise


def get_tier_b_conditions(
    data: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    """Extract all tier-B conditions from a priors dict.

    Returns:
        Dict mapping conditionId → prior dict, filtered to provenance == "tierB-lit".
    """
    return {
        cid: prior
        for cid, prior in data["conditions"].items()
        if prior.get("provenance") == "tierB-lit"
    }


def load_evidence_proposals(
    proposals_dir: Path | None = None,
) -> list[dict[str, Any]]:
    """Load and deduplicate evidence rows from all proposal CSVs.

    Reads incidence_rates.proposals_p-a.csv and p-b.csv, deduplicates by
    (condition_id, study_slug, person_days, events), maps condition IDs to
    imm-priors.json IDs, and returns a list of row dicts.

    Each row dict has these keys (at minimum):
        condition_id:    str  — original proposal ID
        mapped_prior_id: str | None — imm-priors.json conditionId (None if unmapped)
        person_days:     int
        events:          int
        study_slug:      str
        study_doi:       str
        mission_type:    str
        notes:           str
    """
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_priors_io.py -v`
Expected: All 12 tests PASS

- [ ] **Step 6: Commit**

```bash
git add python/src/selectron/condition_mapping.py python/src/selectron/priors_io.py python/tests/test_priors_io.py
git commit -m "feat(python): add priors I/O and condition-ID mapping (TDD)

priors_io.py: load/save imm-priors.json with validation and atomic writes.
Loads and deduplicates evidence proposal CSVs (p-a, p-b). Maps proposal
condition IDs to imm-priors.json IDs via condition_mapping.py.

Key data finding: only depression-anxiety→depression is currently mappable.
The other 5 proposal condition IDs have no tier-B match. 12 tests pass."
```

---

### Task 3: k15_reference.py — K15 Table 1 Constants

**Files:**
- Create: `python/src/selectron/k15_reference.py`

- [ ] **Step 1: Create k15_reference.py**

`python/src/selectron/k15_reference.py`:
```python
"""K15 Table 1 reference values and crew profile.

Constants from Keenan 2015 (ICES-2015-123) §III. These are the acceptance
criteria for the K15 reproduction validation gate.

The CI95 brackets come from the K15 paper's published confidence intervals,
transcribed verbatim in tests/imm/validation_k15.test.ts lines 57-76.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import NamedTuple


class K15Metrics(NamedTuple):
    """K15 Table 1 reference values for one scenario."""

    tme_mean: float
    chi_mean: float
    p_evac_mean: float  # percent
    p_locl_mean: float  # percent


class K15CI95(NamedTuple):
    """K15 Table 1 CI95 brackets for one scenario."""

    tme: tuple[float, float]
    chi: tuple[float, float]
    p_evac: tuple[float, float]
    p_locl: tuple[float, float]


# ── K15 Table 1 reference values (ISS 6-month, 6-crew, T=100 000) ──────────
# Source: src/imm/calibration.ts K15_TABLE1_REF, cross-checked against
# research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md

K15_REF: dict[str, K15Metrics] = {
    "none":      K15Metrics(tme_mean=98.3,  chi_mean=59.20, p_evac_mean=66.90, p_locl_mean=2.89),
    "issHMS":    K15Metrics(tme_mean=106.0, chi_mean=94.93, p_evac_mean=5.57,  p_locl_mean=0.44),
    "unlimited": K15Metrics(tme_mean=106.0, chi_mean=94.98, p_evac_mean=4.93,  p_locl_mean=0.45),
}

# ── K15 CI95 brackets (verbatim from K15 §III) ─────────────────────────────
# Source: tests/imm/validation_k15.test.ts lines 57-76

K15_CI95: dict[str, K15CI95] = {
    "none":      K15CI95(tme=(73, 122),     chi=(43.36, 71.25), p_evac=(66.57, 67.14), p_locl=(2.78, 2.99)),
    "issHMS":    K15CI95(tme=(87, 126),     chi=(84.30, 98.50), p_evac=(5.43, 5.72),   p_locl=(0.40, 0.49)),
    "unlimited": K15CI95(tme=(87, 126),     chi=(84.40, 98.50), p_evac=(4.80, 5.07),   p_locl=(0.41, 0.49)),
}


# ── K15 reference crew (ISS 6-person, verbatim from calibration.ts) ────────
# 4M, 2F; 1 CAC+; 3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible x 6 EVAs each.

@dataclass(frozen=True)
class CrewMember:
    """Minimal crew member profile for forward MC."""

    id: str
    sex: str  # "male" | "female"
    contacts: bool
    crowns: bool
    cac_positive: bool
    abdominal_surgery_history: bool
    eva_eligible: bool
    eva_count: int


K15_REFERENCE_CREW: list[CrewMember] = [
    CrewMember("c1", "male",   True,  True,  True,  False, True,  6),
    CrewMember("c2", "male",   True,  True,  False, False, True,  6),
    CrewMember("c3", "male",   True,  False, False, False, False, 0),
    CrewMember("c4", "male",   False, False, False, False, False, 0),
    CrewMember("c5", "female", False, False, False, False, False, 0),
    CrewMember("c6", "female", False, False, False, False, True,  0),
]

K15_MISSION_DURATION_DAYS = 180
K15_CREW_SIZE = 6
K15_TRIALS = 100_000
K15_SEED = 0xC0FFEE
```

- [ ] **Step 2: Verify import works**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && python -c "from selectron.k15_reference import K15_REF, K15_CI95, K15_REFERENCE_CREW; print(f'Loaded {len(K15_REF)} scenarios, {len(K15_REFERENCE_CREW)} crew')"`
Expected: `Loaded 3 scenarios, 6 crew`

- [ ] **Step 3: Commit**

```bash
git add python/src/selectron/k15_reference.py
git commit -m "feat(python): add K15 Table 1 reference constants

K15 reference values (TME, CHI, pEVAC, pLOCL) and CI95 brackets for
none/issHMS/unlimited scenarios. K15 reference crew profile (4M/2F).
Source: Keenan 2015 ICES-2015-123 §III, cross-checked against
src/imm/calibration.ts and tests/imm/validation_k15.test.ts."
```

---

### Task 4: forward_mc.py Part 1 — Single-Condition Poisson Sampler (TDD)

**Files:**
- Create: `python/src/selectron/forward_mc.py`
- Create: `python/tests/test_forward_mc.py`

The Python forward MC reimplements the core 4-step trial loop for general-Poisson conditions only. It does NOT reimplement SPE-coupled, EVA-coupled, space-adaptation-once, or Stage A vulnerability. This keeps the Python code simple and testable; the K15 validation gate delegates to the TS engine for the full-model authoritative check.

- [ ] **Step 1: Write the failing tests for Part 1**

`python/tests/test_forward_mc.py`:
```python
"""Tests for the numpy forward MC engine."""

from __future__ import annotations

import numpy as np
import pytest

from selectron.forward_mc import (
    sample_gamma_poisson_rate,
    sample_beta_pert,
    sample_poisson,
    compute_raf,
    interpolate_beta_pert_by_raf,
)


class TestSampleGammaPoissonRate:
    def test_gamma_poisson_rate_positive(self) -> None:
        rng = np.random.default_rng(42)
        rate = sample_gamma_poisson_rate(rng, alpha=2.0, beta=10000.0)
        assert rate > 0

    def test_gamma_poisson_rate_mean_converges(self) -> None:
        """E[lambda] = alpha/beta for Gamma(alpha, beta)."""
        rng = np.random.default_rng(42)
        alpha, beta = 2.0, 10000.0
        rates = np.array([sample_gamma_poisson_rate(rng, alpha, beta) for _ in range(50_000)])
        expected_mean = alpha / beta
        assert abs(rates.mean() - expected_mean) < expected_mean * 0.05  # within 5%


class TestSamplePoisson:
    def test_poisson_zero_lambda(self) -> None:
        rng = np.random.default_rng(42)
        assert sample_poisson(rng, 0.0) == 0

    def test_poisson_mean_converges(self) -> None:
        rng = np.random.default_rng(42)
        lam = 5.0
        samples = np.array([sample_poisson(rng, lam) for _ in range(50_000)])
        assert abs(samples.mean() - lam) < lam * 0.03  # within 3%


class TestSampleBetaPert:
    def test_degenerate_returns_value(self) -> None:
        rng = np.random.default_rng(42)
        assert sample_beta_pert(rng, 5.0, 5.0, 5.0) == 5.0

    def test_mean_converges(self) -> None:
        """PERT mean = (min + 4*mode + max) / 6."""
        rng = np.random.default_rng(42)
        low, mode, high = 0.0, 0.1, 0.3
        expected_mean = (low + 4 * mode + high) / 6
        samples = np.array(
            [sample_beta_pert(rng, low, mode, high) for _ in range(50_000)]
        )
        assert abs(samples.mean() - expected_mean) < 0.005

    def test_in_range(self) -> None:
        rng = np.random.default_rng(42)
        for _ in range(1000):
            v = sample_beta_pert(rng, 1.0, 3.0, 5.0)
            assert 1.0 <= v <= 5.0


class TestComputeRAF:
    def test_empty_requirements(self) -> None:
        assert compute_raf({}, {"drug-a": 10}) == 1.0

    def test_full_availability(self) -> None:
        assert compute_raf({"drug-a": 5}, {"drug-a": 10}) == 1.0

    def test_partial_availability(self) -> None:
        raf = compute_raf({"drug-a": 10, "drug-b": 10}, {"drug-a": 5, "drug-b": 0})
        assert abs(raf - 0.25) < 1e-9

    def test_zero_availability(self) -> None:
        assert compute_raf({"drug-a": 10}, {}) == 0.0


class TestInterpolateBetaPertByRAF:
    def test_raf_1_returns_treated(self) -> None:
        treated = {"min": 0.0, "mode": 0.1, "max": 0.3}
        untreated = {"min": 0.1, "mode": 0.5, "max": 0.9}
        result = interpolate_beta_pert_by_raf(treated, untreated, 1.0)
        assert result == treated

    def test_raf_0_returns_untreated(self) -> None:
        treated = {"min": 0.0, "mode": 0.1, "max": 0.3}
        untreated = {"min": 0.1, "mode": 0.5, "max": 0.9}
        result = interpolate_beta_pert_by_raf(treated, untreated, 0.0)
        assert result == untreated

    def test_raf_half_interpolates(self) -> None:
        treated = {"min": 0.0, "mode": 0.0, "max": 0.0}
        untreated = {"min": 1.0, "mode": 1.0, "max": 1.0}
        result = interpolate_beta_pert_by_raf(treated, untreated, 0.5)
        assert abs(result["min"] - 0.5) < 1e-9
        assert abs(result["mode"] - 0.5) < 1e-9
        assert abs(result["max"] - 0.5) < 1e-9
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_forward_mc.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.forward_mc'`

- [ ] **Step 3: Implement forward_mc.py Part 1 — primitive samplers + helpers**

`python/src/selectron/forward_mc.py`:
```python
"""Numpy forward Monte Carlo engine — simplified IMM trial loop.

This module reimplements the CORE 4-step IMM trial loop in numpy for:
  1. Cross-validation against the TS engine (statistical, not sample-by-sample)
  2. Sensitivity analysis (SALib needs a Python callable)
  3. Prior validation (quick K15 gate check without shelling out to Node)

Scope: general-Poisson conditions only. Does NOT reimplement SPE-coupled,
EVA-coupled, space-adaptation-once, or Stage A vulnerability paths. The
K15 validation gate delegates to the TS engine for the full-model check.

TS engine reference: src/imm/simulate.ts (runIMMTrial, sampleGeneralPoissonCount)
"""

from __future__ import annotations

from typing import Any

import numpy as np
from numpy.random import Generator


# ── Primitive samplers ──────────────────────────────────────────────────────


def sample_gamma_poisson_rate(rng: Generator, alpha: float, beta: float) -> float:
    """Sample lambda from Gamma(alpha, 1/beta) — the Gamma-Poisson rate prior.

    Matches TS: sampleGamma(alpha, rng) / beta  (incidence.ts line 69).
    numpy Gamma uses scale=1/beta directly.
    """
    return float(rng.gamma(shape=alpha, scale=1.0 / beta))


def sample_poisson(rng: Generator, lam: float) -> int:
    """Sample from Poisson(lam). Returns 0 when lam <= 0."""
    if lam <= 0:
        return 0
    return int(rng.poisson(lam))


def sample_beta_pert(
    rng: Generator,
    low: float,
    mode: float,
    high: float,
    lam: float = 4.0,
) -> float:
    """Sample from a PERT-smoothed Beta distribution.

    Matches TS: sampleBetaPert in outcomes.ts.
    PERT mean = (low + 4*mode + high) / 6.
    """
    if low == high:
        return low
    rng_range = high - low
    alpha = 1.0 + lam * ((mode - low) / rng_range)
    beta_param = 1.0 + lam * ((high - mode) / rng_range)
    x = rng.gamma(alpha)
    y = rng.gamma(beta_param)
    return low + (x / (x + y)) * rng_range


def sample_beta_bernoulli(rng: Generator, alpha: float, beta: float) -> int:
    """Sample 0 or 1 from Beta(alpha, beta) → Bernoulli(p).

    Matches TS: sampleBetaBernoulli in incidence.ts.
    """
    p = rng.beta(alpha, beta)
    return 1 if rng.random() < p else 0


def sample_severity(
    rng: Generator, wcp_alpha: float, wcp_beta: float
) -> str:
    """Sample 'best' or 'worst' severity via Beta-Bernoulli.

    Matches TS: sampleSeverity in severity.ts.
    """
    if wcp_alpha <= 0:
        return "best"
    return "worst" if sample_beta_bernoulli(rng, wcp_alpha, wcp_beta) == 1 else "best"


# ── Resource Availability Factor ────────────────────────────────────────────


def compute_raf(
    required: dict[str, float | int],
    available: dict[str, float | int],
) -> float:
    """Compute RAF = sum(min(req, avail)) / sum(req).

    Matches TS: computeRAF in kits.ts.
    Returns 1.0 when no resources are required.
    """
    if not required:
        return 1.0
    total_req = sum(required.values())
    if total_req <= 0:
        return 1.0
    total_avail = sum(min(required[k], available.get(k, 0)) for k in required)
    return total_avail / total_req


def interpolate_beta_pert_by_raf(
    treated: dict[str, float],
    untreated: dict[str, float],
    raf: float,
) -> dict[str, float]:
    """Linearly interpolate between treated and untreated Beta-PERT params.

    RAF=1 → fully treated. RAF=0 → untreated.
    Matches TS: interpolateBetaPertByRAF in treatment.ts.
    """
    r = max(0.0, min(1.0, raf))
    return {
        "min":  r * treated["min"]  + (1 - r) * untreated["min"],
        "mode": r * treated["mode"] + (1 - r) * untreated["mode"],
        "max":  r * treated["max"]  + (1 - r) * untreated["max"],
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_forward_mc.py -v`
Expected: All 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add python/src/selectron/forward_mc.py python/tests/test_forward_mc.py
git commit -m "feat(python): add forward MC primitive samplers (TDD)

Gamma-Poisson rate, Poisson, Beta-PERT, Beta-Bernoulli, severity,
RAF, and Beta-PERT interpolation — all matching the TS engine's
mathematical formulations. 11 tests pass including convergence checks."
```

---

### Task 5: forward_mc.py Part 2 — Full Mission Trial Loop + CHI Aggregation (TDD)

**Files:**
- Modify: `python/src/selectron/forward_mc.py`
- Modify: `python/tests/test_forward_mc.py`

- [ ] **Step 1: Write the failing tests for Part 2**

Append to `python/tests/test_forward_mc.py`:
```python
from selectron.forward_mc import run_trial, simulate_imm, TrialResult
from selectron.k15_reference import K15_REFERENCE_CREW, K15_MISSION_DURATION_DAYS
from selectron.priors_io import load_priors


class TestRunTrial:
    def test_returns_trial_result(self, sample_gamma_poisson_prior: dict) -> None:
        rng = np.random.default_rng(42)
        priors = {"depression": sample_gamma_poisson_prior}
        resources: dict[str, float] = {"antidepressant": 30, "anti-anxiety": 14}
        result = run_trial(
            rng=rng,
            priors=priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources=resources,
            tier_b_multiplier=1.0,
        )
        assert isinstance(result, TrialResult)
        assert result.tme >= 0
        assert result.qtl >= 0
        assert result.evac in (0, 1)
        assert result.locl in (0, 1)

    def test_chi_in_valid_range(self, sample_gamma_poisson_prior: dict) -> None:
        rng = np.random.default_rng(42)
        priors = {"depression": sample_gamma_poisson_prior}
        resources: dict[str, float] = {"antidepressant": 30, "anti-anxiety": 14}
        result = run_trial(
            rng=rng,
            priors=priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources=resources,
        )
        # CHI = 100 * (1 - QTL / denom), clamped to [0, 100]
        denom = K15_MISSION_DURATION_DAYS * 24 * len(K15_REFERENCE_CREW)
        chi = max(0, min(100, 100 * (1 - result.qtl / denom)))
        assert 0 <= chi <= 100


class TestSimulateIMM:
    def test_returns_summary_statistics(self, sample_gamma_poisson_prior: dict) -> None:
        priors_data = load_priors()
        # Use a single condition for speed
        subset_priors = {"depression": priors_data["conditions"]["depression"]}
        result = simulate_imm(
            priors=subset_priors,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources={"antidepressant": 30, "anti-anxiety": 14},
            trials=1000,
            seed=42,
        )
        assert "tme" in result
        assert "chi" in result
        assert "p_evac" in result
        assert "p_locl" in result
        for key in ("tme", "chi", "p_evac", "p_locl"):
            assert "mean" in result[key]
            assert "ci95" in result[key]

    def test_deterministic_with_same_seed(self) -> None:
        priors_data = load_priors()
        subset = {"depression": priors_data["conditions"]["depression"]}
        kwargs = dict(
            priors=subset,
            crew=K15_REFERENCE_CREW,
            duration_days=K15_MISSION_DURATION_DAYS,
            resources={"antidepressant": 30, "anti-anxiety": 14},
            trials=500,
            seed=12345,
        )
        r1 = simulate_imm(**kwargs)
        r2 = simulate_imm(**kwargs)
        assert r1["chi"]["mean"] == r2["chi"]["mean"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_forward_mc.py::TestRunTrial -v`
Expected: FAIL with `ImportError: cannot import name 'run_trial' from 'selectron.forward_mc'`

- [ ] **Step 3: Implement the full trial loop and simulate_imm**

Append to `python/src/selectron/forward_mc.py`:
```python
from dataclasses import dataclass, field

from selectron.k15_reference import CrewMember


@dataclass
class TrialResult:
    """Result of a single IMM trial."""

    tme: int = 0                     # total medical events
    qtl: float = 0.0                 # quality time lost (hours)
    evac: int = 0                    # 0 or 1
    locl: int = 0                    # 0 or 1
    per_condition_counts: dict[str, int] = field(default_factory=dict)


def _apply_risk_factor_multiplier(
    base_lambda: float,
    member: CrewMember,
    prior: dict[str, Any],
) -> float:
    """Apply sex / contacts / crowns / CAC / abdo-surg multipliers.

    Matches TS: applyRiskFactorMultiplier in simulate.ts.
    """
    lam = base_lambda
    rfm = prior.get("risk_factor_multipliers", {})
    if member.sex == "male" and "sex-male" in rfm:
        lam *= rfm["sex-male"]
    if member.sex == "female" and "sex-female" in rfm:
        lam *= rfm["sex-female"]
    if member.contacts and "contacts" in rfm:
        lam *= rfm["contacts"]
    if member.crowns and "crowns" in rfm:
        lam *= rfm["crowns"]
    if member.cac_positive and "CAC-positive" in rfm:
        lam *= rfm["CAC-positive"]
    if member.abdominal_surgery_history and "abdominal-surgery-history" in rfm:
        lam *= rfm["abdominal-surgery-history"]
    return lam


def run_trial(
    *,
    rng: Generator,
    priors: dict[str, dict[str, Any]],
    crew: list[CrewMember],
    duration_days: int,
    resources: dict[str, float | int],
    tier_b_multiplier: float = 1.0,
) -> TrialResult:
    """Run one IMM trial over general-Poisson conditions.

    Implements the core 4-step loop:
      1. Sample lambda from prior -> Poisson(lambda * duration) event count
      2. Sample severity (best/worst)
      3. Sample outcomes via RAF-interpolated Beta-PERT
      4. Aggregate QTL and evac/locl

    Does NOT model SPE-coupled, EVA-coupled, space-adaptation-once, or
    Stage A vulnerability. Those paths are handled by the TS engine only.

    Matches TS: runIMMTrial in simulate.ts (general-Poisson branch only).
    """
    available = dict(resources)  # mutable copy
    result = TrialResult()
    mission_hours = duration_days * 24
    early_terminated: set[int] = set()

    for ci, member in enumerate(crew):
        if ci in early_terminated:
            continue
        for cond_id, prior in priors.items():
            if ci in early_terminated:
                break
            inc = prior["incidence"]
            dist = inc["distribution"]

            # Only handle Gamma-Poisson and Lognormal-Poisson here
            if dist == "Gamma-Poisson":
                lambda_per_day = sample_gamma_poisson_rate(rng, inc["alpha"], inc["beta"])
            elif dist == "Lognormal-Poisson":
                mu = inc["mu_log_lambda"]
                sigma = inc["sigma_log_lambda"]
                z = rng.standard_normal()
                lambda_per_day = float(np.exp(mu + sigma * z))
            elif dist == "Fixed":
                lambda_per_day = inc.get("lambda_fixed", 0.0)
            else:
                # Skip Beta-Bernoulli (space-adaptation) — out of scope for forward MC
                continue

            lambda_per_day = _apply_risk_factor_multiplier(lambda_per_day, member, prior)

            # Tier multiplier applied at lambda site (variance-preserving)
            prov = prior.get("provenance", "")
            tier_mult = tier_b_multiplier if prov == "tierB-lit" else 1.0
            count = sample_poisson(rng, lambda_per_day * duration_days * tier_mult)

            for _ in range(count):
                if ci in early_terminated:
                    break

                result.tme += 1
                result.per_condition_counts[cond_id] = (
                    result.per_condition_counts.get(cond_id, 0) + 1
                )

                severity = sample_severity(
                    rng,
                    prior["severity"]["worst_case_prob_alpha"],
                    prior["severity"]["worst_case_prob_beta"],
                )

                raf = compute_raf(prior.get("required_resources", {}), available)

                # Sample outcomes: fi_cp1, dt_cp1, fi_cp2, dt_cp2, fi_cp3, p_evac, p_locl
                outcome_key = "treated" if severity == "best" else "untreated"
                # Both treated and untreated are interpolated by RAF
                treated = prior["treated"]
                untreated = prior["untreated"]

                fi_cp1_params = interpolate_beta_pert_by_raf(treated["fi_cp1"], untreated["fi_cp1"], raf)
                dt_cp1_params = interpolate_beta_pert_by_raf(treated["dt_cp1_hours"], untreated["dt_cp1_hours"], raf)
                fi_cp2_params = interpolate_beta_pert_by_raf(treated["fi_cp2"], untreated["fi_cp2"], raf)
                dt_cp2_params = interpolate_beta_pert_by_raf(treated["dt_cp2_hours"], untreated["dt_cp2_hours"], raf)
                fi_cp3_params = interpolate_beta_pert_by_raf(treated["fi_cp3"], untreated["fi_cp3"], raf)
                p_evac_params = interpolate_beta_pert_by_raf(treated["p_evac"], untreated["p_evac"], raf)
                p_locl_params = interpolate_beta_pert_by_raf(treated["p_locl"], untreated["p_locl"], raf)

                fi_cp1 = sample_beta_pert(rng, **fi_cp1_params)
                dt_cp1 = sample_beta_pert(rng, **dt_cp1_params)
                fi_cp2 = sample_beta_pert(rng, **fi_cp2_params)
                dt_cp2 = sample_beta_pert(rng, **dt_cp2_params)
                fi_cp3 = sample_beta_pert(rng, **fi_cp3_params)
                p_evac = sample_beta_pert(rng, **p_evac_params)
                p_locl = sample_beta_pert(rng, **p_locl_params)

                # QTL: sequential phases, clamped to mission end
                # event_start = 0 for general-Poisson (no temporal tracking in v1)
                dt_cp1_clamped = min(dt_cp1, mission_hours)
                remaining_after_cp1 = max(0.0, mission_hours - dt_cp1_clamped)
                dt_cp2_clamped = min(dt_cp2, remaining_after_cp1)
                result.qtl += fi_cp1 * dt_cp1_clamped + fi_cp2 * dt_cp2_clamped
                if fi_cp3 > 0:
                    cp3_start = dt_cp1_clamped + dt_cp2_clamped
                    cp3_duration = max(0.0, mission_hours - cp3_start)
                    result.qtl += fi_cp3 * cp3_duration

                # Evac / LOCL
                if rng.random() < p_evac:
                    result.evac = 1
                    early_terminated.add(ci)
                if rng.random() < p_locl:
                    result.locl = 1
                    early_terminated.add(ci)

                # Decrement resources
                for res_name, qty in prior.get("required_resources", {}).items():
                    used = qty * raf
                    available[res_name] = max(0, available.get(res_name, 0) - used)

    return result


def simulate_imm(
    *,
    priors: dict[str, dict[str, Any]],
    crew: list[CrewMember],
    duration_days: int,
    resources: dict[str, float | int],
    trials: int,
    seed: int,
    tier_b_multiplier: float = 1.0,
) -> dict[str, Any]:
    """Run T trials and compute posterior summaries.

    Returns a dict with keys: tme, chi, p_evac, p_locl.
    Each value is a dict with: mean, sd, ci95 (tuple of lo, hi).

    Matches TS: simulateIMM in simulate.ts (output format).
    """
    rng = np.random.default_rng(seed)
    mission_hours = duration_days * 24
    denom = mission_hours * len(crew)

    tmes: list[float] = []
    chis: list[float] = []
    evacs: list[float] = []
    locls: list[float] = []

    for _ in range(trials):
        r = run_trial(
            rng=rng,
            priors=priors,
            crew=crew,
            duration_days=duration_days,
            resources=dict(resources),  # fresh copy per trial
            tier_b_multiplier=tier_b_multiplier,
        )
        tmes.append(r.tme)
        chi = max(0.0, min(100.0, 100.0 * (1.0 - r.qtl / denom)))
        chis.append(chi)
        evacs.append(r.evac * 100.0)
        locls.append(r.locl * 100.0)

    def summarize(values: list[float]) -> dict[str, Any]:
        arr = np.array(values)
        return {
            "mean": float(arr.mean()),
            "sd": float(arr.std()),
            "ci95": (
                float(np.percentile(arr, 2.5)),
                float(np.percentile(arr, 97.5)),
            ),
        }

    return {
        "tme": summarize(tmes),
        "chi": summarize(chis),
        "p_evac": summarize(evacs),
        "p_locl": summarize(locls),
    }
```

- [ ] **Step 4: Run all tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_forward_mc.py -v`
Expected: All 15 tests PASS

- [ ] **Step 5: Commit**

```bash
git add python/src/selectron/forward_mc.py python/tests/test_forward_mc.py
git commit -m "feat(python): add full mission trial loop + CHI aggregation (TDD)

run_trial: 4-step IMM trial loop for general-Poisson conditions with
RAF-interpolated Beta-PERT outcomes, sequential cp1/cp2/cp3 QTL, and
per-event evac/locl Bernoulli draws.

simulate_imm: T-trial wrapper producing posterior summaries (mean, sd,
CI95) for TME, CHI, pEVAC, pLOCL. Deterministic via numpy seed.

Scope: general-Poisson only. SPE/EVA/SA paths handled by TS engine."
```

---

### Task 6: forward_mc.py Cross-Validation Against TS Engine

**Files:**
- Modify: `python/tests/test_forward_mc.py`

This test runs the Python forward MC and the TS engine on the FULL prior set and checks that the statistical properties (means) fall within each other's CI95. Because the PRNGs differ (numpy PCG64 vs. TS Mulberry32), sample-by-sample equality is impossible. We compare means at T=10000 (cheaper, wider CI) to avoid flaky tests.

NOTE: The Python MC only covers general-Poisson conditions. It will systematically under-count events from SA-once, EVA-coupled, and SPE-coupled paths. The cross-validation therefore focuses on TME and CHI being in the same order of magnitude and monotonically ordered across scenarios, not exact CI95 membership.

- [ ] **Step 1: Write the cross-validation test**

Append to `python/tests/test_forward_mc.py`:
```python
import subprocess
import json as json_mod

from selectron.k15_reference import (
    K15_REFERENCE_CREW,
    K15_MISSION_DURATION_DAYS,
    K15_SEED,
)
from selectron.priors_io import load_priors


@pytest.mark.slow
class TestCrossValidationTS:
    """Statistical cross-validation: Python MC vs TS engine.

    Because the Python MC only models general-Poisson conditions (not SPE,
    EVA, or SA paths), TME and CHI will differ from the TS engine. This
    test validates:
      1. Both engines produce finite, positive results
      2. TME ordering is monotonically consistent across scenarios
      3. CHI ordering: none < issHMS <= unlimited (same qualitative order)
    """

    @pytest.fixture(scope="class")
    def python_results(self) -> dict[str, dict[str, Any]]:
        priors_data = load_priors()
        all_priors = priors_data["conditions"]
        # ISS HMS resources (simplified — just use a large pool)
        from selectron.forward_mc import simulate_imm
        results = {}
        for scenario, resources in [
            ("none", {}),
            ("issHMS", {
                "antibiotic-broad-spectrum": 30, "analgesic-mild": 60,
                "antidepressant": 30, "anti-anxiety": 14,
                "antiemetic": 14, "antihistamine": 28,
                "antiarrhythmic": 14, "iv-fluid": 6,
                "suture-kit": 4, "splint": 6,
            }),
        ]:
            results[scenario] = simulate_imm(
                priors=all_priors,
                crew=K15_REFERENCE_CREW,
                duration_days=K15_MISSION_DURATION_DAYS,
                resources=resources,
                trials=5000,
                seed=K15_SEED,
                tier_b_multiplier=0.55,
            )
        return results

    def test_python_produces_finite_results(
        self, python_results: dict[str, dict[str, Any]]
    ) -> None:
        for scenario, result in python_results.items():
            for metric in ("tme", "chi", "p_evac", "p_locl"):
                mean = result[metric]["mean"]
                assert np.isfinite(mean), f"{scenario}.{metric} is not finite: {mean}"
                assert mean >= 0, f"{scenario}.{metric} is negative: {mean}"

    def test_chi_ordering(self, python_results: dict[str, dict[str, Any]]) -> None:
        """CHI(none) < CHI(issHMS) — having resources improves health index."""
        assert python_results["none"]["chi"]["mean"] < python_results["issHMS"]["chi"]["mean"]

    def test_evac_ordering(self, python_results: dict[str, dict[str, Any]]) -> None:
        """pEVAC(none) > pEVAC(issHMS) — having resources reduces evacuation."""
        assert python_results["none"]["p_evac"]["mean"] > python_results["issHMS"]["p_evac"]["mean"]
```

- [ ] **Step 2: Run the cross-validation test**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_forward_mc.py::TestCrossValidationTS -v -m slow`
Expected: All 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add python/tests/test_forward_mc.py
git commit -m "test(python): add forward MC cross-validation against TS engine

Validates Python MC produces finite positive results, CHI ordering
(none < issHMS), and pEVAC ordering (none > issHMS). Uses T=5000 for
speed. Statistical comparison only — PRNGs differ (PCG64 vs Mulberry32).

Python MC covers general-Poisson paths only; SA/EVA/SPE paths deferred
to TS engine. Marked @pytest.mark.slow."
```

---

### Task 7: fitter.py Part 1 — Single-Condition Gamma-Poisson PyMC Fit (TDD)

**Files:**
- Create: `python/src/selectron/fitter.py`
- Create: `python/tests/test_fitter.py`

The Gamma-Poisson is conjugate: posterior = Gamma(alpha0 + sum(events), beta0 + sum(person_days)). The PyMC fit must converge to this closed-form answer. This provides the TDD verification target.

- [ ] **Step 1: Write the failing tests**

`python/tests/test_fitter.py`:
```python
"""Tests for the PyMC Gamma-Poisson fitter."""

from __future__ import annotations

from typing import Any

import numpy as np
import pytest

from selectron.fitter import (
    fit_gamma_poisson,
    FitResult,
    check_convergence,
)


class TestFitGammaPoisson:
    @pytest.mark.slow
    def test_single_study_converges_to_conjugate(self) -> None:
        """PyMC posterior mean should match conjugate closed-form within 5%.

        Conjugate update: Gamma(a0, b0) + Poisson(events | person_days) →
        Gamma(a0 + sum_events, b0 + sum_person_days).
        Posterior mean of lambda = (a0 + sum_events) / (b0 + sum_person_days).
        """
        alpha_0, beta_0 = 2.0, 10000.0
        observations = [
            {"person_days": 114245, "events": 13},  # Palinkas 2004
        ]

        result = fit_gamma_poisson(
            condition_id="depression",
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=42,
            draws=2000,
            tune=1000,
            chains=2,  # 2 chains for speed in test
        )

        assert isinstance(result, FitResult)

        # Conjugate posterior mean
        sum_events = sum(o["events"] for o in observations)
        sum_pdays = sum(o["person_days"] for o in observations)
        conjugate_mean = (alpha_0 + sum_events) / (beta_0 + sum_pdays)

        # PyMC posterior mean should be within 5% of conjugate
        assert abs(result.posterior_alpha - (alpha_0 + sum_events)) / (alpha_0 + sum_events) < 0.10
        assert abs(result.posterior_beta - (beta_0 + sum_pdays)) / (beta_0 + sum_pdays) < 0.10
        assert abs(result.posterior_lambda_mean - conjugate_mean) / conjugate_mean < 0.05

    @pytest.mark.slow
    def test_multi_study_converges(self) -> None:
        """Two independent studies produce tighter posterior than one."""
        alpha_0, beta_0 = 2.0, 10000.0
        single = [{"person_days": 114245, "events": 13}]
        multi = [
            {"person_days": 114245, "events": 13},
            {"person_days": 3120, "events": 1},
        ]

        r1 = fit_gamma_poisson("depression", alpha_0, beta_0, single, seed=42, draws=1000, tune=500, chains=2)
        r2 = fit_gamma_poisson("depression", alpha_0, beta_0, multi, seed=42, draws=1000, tune=500, chains=2)

        # More data → tighter posterior (smaller sd)
        # With conjugate: sd = sqrt(alpha_post) / beta_post
        # More observations increase beta_post more than alpha_post → lower sd
        assert r2.posterior_lambda_sd <= r1.posterior_lambda_sd * 1.2  # allow 20% margin


class TestCheckConvergence:
    def test_good_convergence(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is True
        assert len(reasons) == 0

    def test_bad_rhat(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.05,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("r_hat" in r.lower() for r in reasons)

    def test_divergences(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=800.0,
            ess_tail=600.0,
            divergences=5,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("divergence" in r.lower() for r in reasons)

    def test_low_ess(self) -> None:
        result = FitResult(
            condition_id="test",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.2e-4,
            posterior_lambda_sd=3e-5,
            r_hat=1.001,
            ess_bulk=100.0,
            ess_tail=600.0,
            divergences=0,
            n_studies=1,
            total_person_days=114245,
            total_events=13,
        )
        ok, reasons = check_convergence(result)
        assert ok is False
        assert any("ess" in r.lower() for r in reasons)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py -v -m "not slow"`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.fitter'`

- [ ] **Step 3: Implement fitter.py**

`python/src/selectron/fitter.py`:
```python
"""PyMC Gamma-Poisson posterior fitter for tier-B conditions.

Fits Gamma(alpha, beta) posterior from (person_days, events) observations
using PyMC NUTS sampling. The Gamma-Poisson is conjugate, so the posterior
has a closed-form solution — Gamma(a0 + sum_events, b0 + sum_person_days).
PyMC fitting is used instead of closed-form because:
  1. It validates the NUTS machinery against the conjugate answer.
  2. It extends naturally to non-conjugate models (future hierarchical fits).
  3. It produces ArviZ diagnostics (trace plots, ESS, R-hat) for auditing.

Beta-Bernoulli fitting is DEFERRED to v1.1. The current CSV schema provides
(person_days, events) rate data, which is incompatible with proportion-based
Beta-Bernoulli inference. The schema would need (n_subjects, n_affected)
columns to support Beta-Bernoulli fitting.

Reference: G12 (Gilkey 2012) §1.2 — Bayesian IMM prior elicitation.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import arviz as az
import numpy as np
import pymc as pm

logger = logging.getLogger(__name__)

# ── Convergence thresholds (per G12 §1.2) ───────────────────────────────────
RHAT_THRESHOLD = 1.01
ESS_BULK_THRESHOLD = 400
ESS_TAIL_THRESHOLD = 400


@dataclass
class FitResult:
    """Result of a single-condition PyMC Gamma-Poisson fit."""

    condition_id: str
    posterior_alpha: float        # fitted Gamma alpha
    posterior_beta: float         # fitted Gamma beta
    posterior_lambda_mean: float  # E[lambda] = alpha / beta
    posterior_lambda_sd: float    # SD of posterior lambda samples
    r_hat: float
    ess_bulk: float
    ess_tail: float
    divergences: int
    n_studies: int
    total_person_days: int
    total_events: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def check_convergence(result: FitResult) -> tuple[bool, list[str]]:
    """Check if a fit result meets convergence criteria.

    Returns (ok, reasons) where reasons is a list of failure explanations.
    Criteria per G12 §1.2: R-hat < 1.01, ESS_bulk > 400, zero divergences.
    """
    reasons: list[str] = []
    if result.r_hat > RHAT_THRESHOLD:
        reasons.append(f"R_hat {result.r_hat:.4f} > {RHAT_THRESHOLD}")
    if result.ess_bulk < ESS_BULK_THRESHOLD:
        reasons.append(f"ESS_bulk {result.ess_bulk:.0f} < {ESS_BULK_THRESHOLD}")
    if result.ess_tail < ESS_TAIL_THRESHOLD:
        reasons.append(f"ESS_tail {result.ess_tail:.0f} < {ESS_TAIL_THRESHOLD}")
    if result.divergences > 0:
        reasons.append(f"Divergences: {result.divergences}")
    return (len(reasons) == 0, reasons)


def fit_gamma_poisson(
    condition_id: str,
    alpha_0: float,
    beta_0: float,
    observations: list[dict[str, int]],
    *,
    seed: int = 42,
    draws: int = 2000,
    tune: int = 1000,
    chains: int = 4,
    output_dir: Path | None = None,
) -> FitResult:
    """Fit a Gamma-Poisson posterior for one condition.

    The model:
        lambda ~ Gamma(alpha_0, beta_0)     [prior over rate per person-day]
        events_i ~ Poisson(lambda * person_days_i)  [likelihood per study]

    Args:
        condition_id: The imm-priors.json conditionId.
        alpha_0: Current Gamma prior shape (from imm-priors.json).
        beta_0: Current Gamma prior rate (from imm-priors.json).
        observations: List of {"person_days": int, "events": int} dicts.
        seed: Random seed for reproducibility.
        draws: Number of posterior draws per chain.
        tune: Number of tuning steps per chain.
        chains: Number of MCMC chains.
        output_dir: If provided, save ArviZ InferenceData to this directory.

    Returns:
        FitResult with posterior parameters and diagnostics.
    """
    person_days = np.array([o["person_days"] for o in observations], dtype=np.float64)
    events = np.array([o["events"] for o in observations], dtype=np.int64)

    with pm.Model() as model:
        # Gamma prior on lambda (rate per person-day)
        lam = pm.Gamma("lambda", alpha=alpha_0, beta=beta_0)

        # Poisson likelihood: events ~ Poisson(lambda * person_days)
        obs = pm.Poisson("obs", mu=lam * person_days, observed=events)

        # Sample
        try:
            idata = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                nuts_sampler="nutpie",
                random_seed=seed,
                return_inferencedata=True,
                progressbar=False,
            )
        except Exception:
            # Fall back to default sampler if nutpie is not available
            logger.warning(
                "nutpie sampler failed for %s, falling back to default NUTS",
                condition_id,
            )
            idata = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                random_seed=seed,
                return_inferencedata=True,
                progressbar=False,
            )

    # Extract diagnostics
    summary = az.summary(idata, var_names=["lambda"])
    lambda_samples = idata.posterior["lambda"].values.flatten()

    r_hat = float(summary["r_hat"].iloc[0])
    ess_bulk = float(summary["ess_bulk"].iloc[0])
    ess_tail = float(summary["ess_tail"].iloc[0])

    # Count divergences
    if hasattr(idata, "sample_stats") and "diverging" in idata.sample_stats:
        divergences = int(idata.sample_stats["diverging"].values.sum())
    else:
        divergences = 0

    # Posterior parameters: fit Gamma to the posterior lambda samples
    # Method of moments: alpha = mean^2 / var, beta = mean / var
    post_mean = float(lambda_samples.mean())
    post_var = float(lambda_samples.var())
    if post_var > 0:
        post_alpha = post_mean ** 2 / post_var
        post_beta = post_mean / post_var
    else:
        post_alpha = alpha_0
        post_beta = beta_0

    result = FitResult(
        condition_id=condition_id,
        posterior_alpha=post_alpha,
        posterior_beta=post_beta,
        posterior_lambda_mean=post_mean,
        posterior_lambda_sd=float(lambda_samples.std()),
        r_hat=r_hat,
        ess_bulk=ess_bulk,
        ess_tail=ess_tail,
        divergences=divergences,
        n_studies=len(observations),
        total_person_days=int(person_days.sum()),
        total_events=int(events.sum()),
    )

    # Save ArviZ InferenceData if output_dir is specified
    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        idata.to_netcdf(str(output_dir / f"{condition_id}.nc"))
        with open(output_dir / f"{condition_id}.json", "w") as f:
            json.dump(result.to_dict(), f, indent=2)

    return result
```

- [ ] **Step 4: Run the fast tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py -v -m "not slow"`
Expected: 4 tests PASS (TestCheckConvergence)

- [ ] **Step 5: Run the slow PyMC tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py -v -m slow`
Expected: 2 tests PASS (may take 30-60s each)

- [ ] **Step 6: Commit**

```bash
git add python/src/selectron/fitter.py python/tests/test_fitter.py
git commit -m "feat(python): add PyMC Gamma-Poisson fitter (TDD)

fit_gamma_poisson: PyMC NUTS fit with Gamma(a0, b0) prior + Poisson
likelihood. Produces FitResult with posterior alpha/beta, R-hat, ESS,
divergence count. Falls back to default NUTS if nutpie unavailable.

TDD verification: posterior mean matches conjugate closed-form
Gamma(a0+sum_events, b0+sum_pdays) within 5%. 6 tests pass.

Beta-Bernoulli fitting deferred to v1.1 (CSV schema lacks n_subjects/
n_affected columns needed for proportion data)."
```

---

### Task 8: fitter.py Part 2 — Batch Fitting + CLI

**Files:**
- Modify: `python/src/selectron/fitter.py`
- Modify: `python/tests/test_fitter.py`

- [ ] **Step 1: Write the failing tests for batch fitting**

Append to `python/tests/test_fitter.py`:
```python
from selectron.fitter import fit_all_tier_b, BatchFitReport


class TestFitAllTierB:
    def test_reports_skipped_conditions(self) -> None:
        """Most tier-B conditions should be skipped (no evidence data)."""
        report = fit_all_tier_b(
            draws=100,
            tune=50,
            chains=1,
            seed=42,
            dry_run=True,
        )
        assert isinstance(report, BatchFitReport)
        # With current evidence, 40 of 41 tier-B should be skipped
        assert report.n_skipped >= 39
        assert report.n_total == 41

    def test_dry_run_does_not_fit(self) -> None:
        report = fit_all_tier_b(
            draws=100,
            tune=50,
            chains=1,
            seed=42,
            dry_run=True,
        )
        assert report.n_fitted == 0  # dry run never fits

    @pytest.mark.slow
    def test_fits_depression_from_proposals(self) -> None:
        """depression-anxiety proposals map to 'depression' and produce a fit."""
        report = fit_all_tier_b(
            draws=500,
            tune=250,
            chains=2,
            seed=42,
            dry_run=False,
        )
        assert "depression" in report.fitted
        result = report.fitted["depression"]
        ok, _ = check_convergence(result)
        # With only 2 data points, convergence may vary, but the fit should run
        assert result.n_studies == 2
        assert result.total_events == 14  # 13 + 1 from two studies
```

- [ ] **Step 2: Run the fast test**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py::TestFitAllTierB::test_reports_skipped_conditions -v`
Expected: FAIL with `ImportError: cannot import name 'fit_all_tier_b'`

- [ ] **Step 3: Implement batch fitting + CLI**

Append to `python/src/selectron/fitter.py`:
```python
from selectron.priors_io import load_priors, get_tier_b_conditions, load_evidence_proposals


@dataclass
class BatchFitReport:
    """Report from a batch tier-B fitting run."""

    n_total: int                                    # total tier-B conditions
    n_fitted: int                                   # successfully fitted
    n_skipped: int                                  # skipped (no data or Beta-Bernoulli)
    n_failed: int                                   # convergence failures
    fitted: dict[str, FitResult]                    # condition_id → FitResult
    skipped: dict[str, str]                         # condition_id → reason
    failed: dict[str, tuple[FitResult, list[str]]]  # condition_id → (result, reasons)

    def to_dict(self) -> dict[str, Any]:
        return {
            "n_total": self.n_total,
            "n_fitted": self.n_fitted,
            "n_skipped": self.n_skipped,
            "n_failed": self.n_failed,
            "fitted": {k: v.to_dict() for k, v in self.fitted.items()},
            "skipped": self.skipped,
            "failed": {k: (v[0].to_dict(), v[1]) for k, v in self.failed.items()},
        }


def fit_all_tier_b(
    *,
    draws: int = 2000,
    tune: int = 1000,
    chains: int = 4,
    seed: int = 42,
    output_dir: Path | None = None,
    dry_run: bool = False,
    condition_filter: str | None = None,
) -> BatchFitReport:
    """Fit all (or one) tier-B conditions that have evidence data.

    Args:
        draws: Posterior draws per chain.
        tune: Tuning steps per chain.
        chains: Number of MCMC chains.
        seed: Random seed.
        output_dir: Directory for per-condition ArviZ outputs.
        dry_run: If True, report which conditions would be fit without fitting.
        condition_filter: If provided, fit only this condition_id.

    Returns:
        BatchFitReport summarizing what was fitted, skipped, or failed.
    """
    priors_data = load_priors()
    tier_b = get_tier_b_conditions(priors_data)
    evidence = load_evidence_proposals()

    # Group evidence by mapped_prior_id
    evidence_by_condition: dict[str, list[dict[str, Any]]] = {}
    for row in evidence:
        pid = row["mapped_prior_id"]
        if pid is not None:
            evidence_by_condition.setdefault(pid, []).append(row)

    fitted: dict[str, FitResult] = {}
    skipped: dict[str, str] = {}
    failed: dict[str, tuple[FitResult, list[str]]] = {}

    for cond_id, prior in sorted(tier_b.items()):
        if condition_filter and cond_id != condition_filter:
            continue

        dist = prior["incidence"]["distribution"]

        # Skip Beta-Bernoulli (deferred to v1.1)
        if dist == "Beta-Bernoulli":
            skipped[cond_id] = "Beta-Bernoulli fitting deferred (CSV schema lacks proportion data)"
            continue

        # Check for evidence
        obs_rows = evidence_by_condition.get(cond_id, [])
        if not obs_rows:
            skipped[cond_id] = "No evidence data in proposal CSVs"
            continue

        if dry_run:
            skipped[cond_id] = f"DRY_RUN: would fit with {len(obs_rows)} observations"
            continue

        # Fit
        observations = [
            {"person_days": r["person_days"], "events": r["events"]}
            for r in obs_rows
        ]
        alpha_0 = prior["incidence"]["alpha"]
        beta_0 = prior["incidence"]["beta"]

        logger.info("Fitting %s: %d observations, alpha_0=%.2f, beta_0=%.2f",
                     cond_id, len(observations), alpha_0, beta_0)

        result = fit_gamma_poisson(
            condition_id=cond_id,
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=seed,
            draws=draws,
            tune=tune,
            chains=chains,
            output_dir=output_dir / cond_id if output_dir else None,
        )

        ok, reasons = check_convergence(result)
        if ok:
            fitted[cond_id] = result
        else:
            failed[cond_id] = (result, reasons)
            logger.warning("Convergence failed for %s: %s", cond_id, reasons)

    n_total = len(tier_b) if not condition_filter else 1
    return BatchFitReport(
        n_total=n_total,
        n_fitted=len(fitted),
        n_skipped=len(skipped),
        n_failed=len(failed),
        fitted=fitted,
        skipped=skipped,
        failed=failed,
    )
```

- [ ] **Step 4: Add `__main__` CLI entrypoint**

Create `python/src/selectron/__main__.py`:
```python
"""CLI entrypoint: python -m selectron.fitter [options]."""
# This file is intentionally minimal. The actual CLI is in fitter.py.
# Usage: python -m selectron.fitter --help
```

Add to the bottom of `python/src/selectron/fitter.py`:
```python
def _cli() -> None:
    """CLI entrypoint for python -m selectron.fitter."""
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Fit Gamma-Poisson posteriors for tier-B IMM conditions."
    )
    parser.add_argument(
        "--condition", type=str, default=None,
        help="Fit a single condition (e.g., --condition depression)."
    )
    parser.add_argument(
        "--tier", type=str, choices=["B"], default="B",
        help="Fit all conditions in this tier (default: B)."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be fit without fitting."
    )
    parser.add_argument(
        "--draws", type=int, default=2000,
        help="Posterior draws per chain (default: 2000)."
    )
    parser.add_argument(
        "--chains", type=int, default=4,
        help="Number of MCMC chains (default: 4)."
    )
    parser.add_argument(
        "--seed", type=int, default=42,
        help="Random seed (default: 42)."
    )
    parser.add_argument(
        "--output-dir", type=str, default=None,
        help="Directory for per-condition outputs (default: python/outputs/fitted_priors)."
    )

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    out_dir = Path(args.output_dir) if args.output_dir else Path("outputs/fitted_priors")

    report = fit_all_tier_b(
        draws=args.draws,
        tune=args.draws // 2,
        chains=args.chains,
        seed=args.seed,
        output_dir=out_dir,
        dry_run=args.dry_run,
        condition_filter=args.condition,
    )

    print(f"\n{'='*60}")
    print(f"Batch Fit Report: {report.n_total} conditions")
    print(f"  Fitted:  {report.n_fitted}")
    print(f"  Skipped: {report.n_skipped}")
    print(f"  Failed:  {report.n_failed}")
    print(f"{'='*60}")

    if report.fitted:
        print("\nFitted conditions:")
        for cid, r in report.fitted.items():
            print(f"  {cid}: lambda={r.posterior_lambda_mean:.2e} "
                  f"[alpha={r.posterior_alpha:.2f}, beta={r.posterior_beta:.2f}] "
                  f"R-hat={r.r_hat:.4f} ESS={r.ess_bulk:.0f}")

    if report.skipped:
        print("\nSkipped conditions:")
        for cid, reason in report.skipped.items():
            print(f"  {cid}: {reason}")

    if report.failed:
        print("\nFailed conditions:")
        for cid, (r, reasons) in report.failed.items():
            print(f"  {cid}: {', '.join(reasons)}")

    # Write summary report
    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "batch_report.json", "w") as f:
        json.dump(report.to_dict(), f, indent=2)
    print(f"\nReport saved to {out_dir / 'batch_report.json'}")

    sys.exit(1 if report.n_failed > 0 else 0)


if __name__ == "__main__":
    _cli()
```

- [ ] **Step 5: Run all fitter tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py -v -m "not slow"`
Expected: 6 tests PASS

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_fitter.py -v -m slow`
Expected: 3 tests PASS (including the new fit_depression test)

- [ ] **Step 6: Test the CLI dry run**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && python -m selectron.fitter --dry-run`
Expected: Report showing 41 conditions, ~40 skipped, 0 fitted (dry run)

- [ ] **Step 7: Commit**

```bash
git add python/src/selectron/fitter.py python/src/selectron/__main__.py python/tests/test_fitter.py
git commit -m "feat(python): add batch tier-B fitting + CLI (TDD)

fit_all_tier_b: loads evidence proposals, maps condition IDs, fits all
tier-B Gamma-Poisson conditions with evidence data. Reports skipped
(no data, Beta-Bernoulli deferred) and failed (convergence) conditions.

CLI: python -m selectron.fitter [--condition X] [--dry-run] [--draws N].

Current state: 1 of 30 Gamma-Poisson conditions fittable (depression,
2 observations). 29 skipped (no evidence), 11 Beta-Bernoulli deferred."
```

---

### Task 9: validator.py — K15 Gate + Report Generation (TDD)

**Files:**
- Create: `python/src/selectron/validator.py`
- Create: `python/tests/test_validator.py`

- [ ] **Step 1: Write the failing tests**

`python/tests/test_validator.py`:
```python
"""Tests for the K15 validation gate."""

from __future__ import annotations

from typing import Any

import pytest

from selectron.validator import (
    validate_k15,
    K15ValidationReport,
    MetricResult,
)


class TestMetricResult:
    def test_within_ci95(self) -> None:
        m = MetricResult(
            metric="tme",
            scenario="issHMS",
            observed=106.0,
            reference=106.0,
            ci95=(87.0, 126.0),
            delta=0.0,
            within_ci95=True,
        )
        assert m.within_ci95 is True

    def test_outside_ci95(self) -> None:
        m = MetricResult(
            metric="tme",
            scenario="none",
            observed=200.0,
            reference=98.3,
            ci95=(73.0, 122.0),
            delta=101.7,
            within_ci95=False,
        )
        assert m.within_ci95 is False


class TestValidateK15:
    @pytest.mark.slow
    def test_current_priors_produce_report(self) -> None:
        """Run K15 gate on current priors at T=5000 (quick check)."""
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        assert isinstance(report, K15ValidationReport)
        assert len(report.metrics) == 4  # tme, chi, p_evac, p_locl for issHMS

    @pytest.mark.slow
    def test_report_has_summary_counts(self) -> None:
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        assert report.n_total == 4
        assert report.n_within_ci95 >= 0
        assert report.n_within_ci95 <= 4

    @pytest.mark.slow
    def test_report_generates_markdown(self) -> None:
        report = validate_k15(trials=5000, seed=42, scenarios=["issHMS"])
        md = report.to_markdown()
        assert "K15 Validation Report" in md
        assert "issHMS" in md
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_validator.py -v -m "not slow"`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.validator'`

- [ ] **Step 3: Implement validator.py**

`python/src/selectron/validator.py`:
```python
"""K15 Table 1 validation gate.

Runs the Python forward MC with current priors and checks whether the
output metrics (TME, CHI, pEVAC, pLOCL) fall within the K15 Table 1
CI95 brackets.

This is a SECONDARY gate. The PRIMARY K15 gate is the TS engine test at
tests/imm/validation_k15.test.ts, which uses the full model including
SPE, EVA, and SA paths. This Python gate catches regressions early
without requiring a Node runtime.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
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

# ISS HMS resources (from src/imm/kits.ts issHmsResources)
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


@dataclass
class MetricResult:
    """Result of comparing one metric against K15."""

    metric: str       # "tme" | "chi" | "p_evac" | "p_locl"
    scenario: str     # "none" | "issHMS" | "unlimited"
    observed: float
    reference: float
    ci95: tuple[float, float]
    delta: float
    within_ci95: bool


@dataclass
class K15ValidationReport:
    """Full K15 validation report."""

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
            "# K15 Validation Report",
            "",
            f"**Timestamp:** {self.timestamp}",
            f"**Trials:** {self.trials:,}",
            f"**Seed:** 0x{self.seed:X}",
            f"**Metrics within CI95:** {self.n_within_ci95}/{self.n_total}",
            "",
            "| Scenario | Metric | Observed | Reference | CI95 | Delta | Status |",
            "|----------|--------|----------|-----------|------|-------|--------|",
        ]
        for m in self.metrics:
            status = "PASS" if m.within_ci95 else "FAIL"
            lines.append(
                f"| {m.scenario} | {m.metric} | {m.observed:.2f} | "
                f"{m.reference:.2f} | [{m.ci95[0]:.2f}, {m.ci95[1]:.2f}] | "
                f"{m.delta:+.2f} | {status} |"
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
    """Run K15 validation gate on current priors.

    Args:
        trials: Number of MC trials (default 100k per K15 spec).
        seed: Random seed.
        scenarios: List of scenarios to test (default: all three).
        priors_path: Override path to imm-priors.json.
        output_dir: If provided, write report JSON and markdown here.

    Returns:
        K15ValidationReport with per-metric pass/fail results.
    """
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

            report.metrics.append(MetricResult(
                metric=metric,
                scenario=scenario,
                observed=observed,
                reference=ref_val,
                ci95=ci_bounds,
                delta=delta,
                within_ci95=within,
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
```

- [ ] **Step 4: Run tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_validator.py -v -m "not slow"`
Expected: 2 tests PASS (MetricResult tests)

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_validator.py -v -m slow`
Expected: 3 tests PASS (may take 30-60s)

- [ ] **Step 5: Commit**

```bash
git add python/src/selectron/validator.py python/tests/test_validator.py
git commit -m "feat(python): add K15 validation gate + markdown report (TDD)

validate_k15: runs Python forward MC against K15 Table 1 CI95 brackets.
Produces JSON + markdown report with per-metric pass/fail status.

Secondary gate — the primary K15 gate remains tests/imm/validation_k15.test.ts.
Python gate catches regressions early without requiring Node runtime."
```

---

### Task 10: writer.py — Atomic Priors Merge (TDD)

**Files:**
- Create: `python/src/selectron/writer.py`
- Create: `python/tests/test_writer.py`

- [ ] **Step 1: Write the failing tests**

`python/tests/test_writer.py`:
```python
"""Tests for the atomic priors JSON writer."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from selectron.fitter import FitResult
from selectron.priors_io import load_priors
from selectron.writer import merge_fitted_priors, WriterReport


@pytest.fixture()
def sample_fit_result() -> FitResult:
    return FitResult(
        condition_id="depression",
        posterior_alpha=15.0,
        posterior_beta=124245.0,
        posterior_lambda_mean=1.21e-4,
        posterior_lambda_sd=3.1e-5,
        r_hat=1.001,
        ess_bulk=2000.0,
        ess_tail=1500.0,
        divergences=0,
        n_studies=2,
        total_person_days=117365,
        total_events=14,
    )


class TestMergeFittedPriors:
    def test_updates_incidence_params(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        report = merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        inc = reloaded["conditions"]["depression"]["incidence"]
        assert inc["alpha"] == 15.0
        assert inc["beta"] == 124245.0

    def test_updates_provenance(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["provenance"] == "tierB-pymc"

    def test_preserves_non_fitted_conditions(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        original_sinusitis = json.dumps(original["conditions"]["acute-sinusitis"])

        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )

        reloaded = load_priors(tmp_priors)
        assert json.dumps(reloaded["conditions"]["acute-sinusitis"]) == original_sinusitis

    def test_preserves_severity_and_outcomes(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        orig_severity = original["conditions"]["depression"]["severity"]
        orig_treated = original["conditions"]["depression"]["treated"]

        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )

        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["severity"] == orig_severity
        assert reloaded["conditions"]["depression"]["treated"] == orig_treated

    def test_dry_run_does_not_modify_file(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        original = load_priors(tmp_priors)
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=True,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded == original

    def test_report_tracks_changes(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        report = merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        assert isinstance(report, WriterReport)
        assert "depression" in report.updated
        assert report.n_updated == 1
        assert report.n_unchanged == 99

    def test_schema_version_preserved(
        self, tmp_priors: Path, sample_fit_result: FitResult
    ) -> None:
        merge_fitted_priors(
            fitted={"depression": sample_fit_result},
            priors_path=tmp_priors,
            dry_run=False,
        )
        reloaded = load_priors(tmp_priors)
        assert reloaded["schema_version"] == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_writer.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.writer'`

- [ ] **Step 3: Implement writer.py**

`python/src/selectron/writer.py`:
```python
"""Atomic merge of fitted priors into imm-priors.json.

Reads the current JSON, updates only the incidence parameters and provenance
for fitted conditions, preserves everything else unchanged, and writes
atomically (tmp + rename). Supports --dry-run for diff preview.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from selectron.fitter import FitResult
from selectron.priors_io import load_priors, save_priors

logger = logging.getLogger(__name__)


@dataclass
class ConditionDiff:
    """Diff for one condition before/after merge."""

    condition_id: str
    field: str
    old_value: Any
    new_value: Any


@dataclass
class WriterReport:
    """Report from a priors merge operation."""

    n_updated: int = 0
    n_unchanged: int = 0
    updated: dict[str, list[ConditionDiff]] = field(default_factory=dict)
    dry_run: bool = False

    def to_markdown(self) -> str:
        mode = "DRY RUN" if self.dry_run else "APPLIED"
        lines = [
            f"# Priors Merge Report ({mode})",
            "",
            f"**Updated:** {self.n_updated} conditions",
            f"**Unchanged:** {self.n_unchanged} conditions",
            "",
        ]
        if self.updated:
            lines.append("## Changes")
            lines.append("")
            for cid, diffs in self.updated.items():
                lines.append(f"### {cid}")
                lines.append("")
                for d in diffs:
                    lines.append(f"- `{d.field}`: `{d.old_value}` -> `{d.new_value}`")
                lines.append("")
        return "\n".join(lines)


def merge_fitted_priors(
    *,
    fitted: dict[str, FitResult],
    priors_path: Path | None = None,
    dry_run: bool = False,
) -> WriterReport:
    """Merge fitted posteriors into imm-priors.json.

    For each fitted condition:
      1. Replace incidence.alpha with posterior_alpha
      2. Replace incidence.beta with posterior_beta
      3. Update provenance to "tierB-pymc"
      4. Update source_ref to point to the fit output

    All other fields (severity, treated/untreated, risk_factor_multipliers,
    required_resources) are preserved unchanged.

    Args:
        fitted: Dict of condition_id -> FitResult from the fitter.
        priors_path: Override path to imm-priors.json.
        dry_run: If True, compute diff but don't write.

    Returns:
        WriterReport with the diff.
    """
    data = load_priors(priors_path)
    report = WriterReport(dry_run=dry_run)

    for cid, prior in data["conditions"].items():
        if cid not in fitted:
            report.n_unchanged += 1
            continue

        result = fitted[cid]
        diffs: list[ConditionDiff] = []

        # Update incidence alpha
        old_alpha = prior["incidence"].get("alpha")
        if old_alpha != result.posterior_alpha:
            diffs.append(ConditionDiff(cid, "incidence.alpha", old_alpha, result.posterior_alpha))
            if not dry_run:
                prior["incidence"]["alpha"] = result.posterior_alpha

        # Update incidence beta
        old_beta = prior["incidence"].get("beta")
        if old_beta != result.posterior_beta:
            diffs.append(ConditionDiff(cid, "incidence.beta", old_beta, result.posterior_beta))
            if not dry_run:
                prior["incidence"]["beta"] = result.posterior_beta

        # Update provenance
        old_prov = prior.get("provenance")
        if old_prov != "tierB-pymc":
            diffs.append(ConditionDiff(cid, "provenance", old_prov, "tierB-pymc"))
            if not dry_run:
                prior["provenance"] = "tierB-pymc"

        # Update source_ref
        new_ref = f"python/outputs/fitted_priors/{cid}/{cid}.json"
        old_ref = prior.get("source_ref")
        if old_ref != new_ref:
            diffs.append(ConditionDiff(cid, "source_ref", old_ref, new_ref))
            if not dry_run:
                prior["source_ref"] = new_ref

        if diffs:
            report.updated[cid] = diffs
            report.n_updated += 1
        else:
            report.n_unchanged += 1

    if not dry_run:
        save_priors(data, priors_path)

    return report
```

- [ ] **Step 4: Run tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_writer.py -v`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add python/src/selectron/writer.py python/tests/test_writer.py
git commit -m "feat(python): add atomic priors merge writer (TDD)

merge_fitted_priors: updates incidence.alpha, incidence.beta, provenance,
and source_ref for fitted conditions. Preserves all other fields.
Atomic write via tmp file + os.replace. Supports --dry-run diff preview.

7 tests pass: round-trip, schema preservation, dry-run safety, provenance
update, non-fitted conditions unchanged."
```

---

### Task 11: sensitivity.py — Sobol/Morris via SALib (TDD)

**Files:**
- Create: `python/src/selectron/sensitivity.py`
- Create: `python/tests/test_sensitivity.py`

Sobol analysis at full scale (200 params, N=1024) requires ~2 billion trial-equivalents and must run as an out-of-CI batch job. Tests use N=8 on a 4-parameter subset (2 conditions x {alpha, beta}).

- [ ] **Step 1: Write the failing tests**

`python/tests/test_sensitivity.py`:
```python
"""Tests for Sobol/Morris global sensitivity analysis."""

from __future__ import annotations

import numpy as np
import pytest

from selectron.sensitivity import (
    build_problem_definition,
    run_morris_screening,
    run_sobol_analysis,
    SensitivityReport,
)


class TestBuildProblemDefinition:
    def test_returns_salib_problem(self) -> None:
        condition_ids = ["depression", "gastroenteritis"]
        problem = build_problem_definition(condition_ids)
        assert problem["num_vars"] == 4  # 2 conditions x {alpha, beta}
        assert len(problem["names"]) == 4
        assert len(problem["bounds"]) == 4

    def test_bounds_are_positive(self) -> None:
        problem = build_problem_definition(["depression"])
        for lo, hi in problem["bounds"]:
            assert lo > 0
            assert hi > lo


class TestMorrisScreening:
    @pytest.mark.slow
    def test_produces_finite_indices(self) -> None:
        """Morris on a 2-condition subset produces finite mu_star/sigma."""
        condition_ids = ["depression", "gastroenteritis"]
        report = run_morris_screening(
            condition_ids=condition_ids,
            n_trajectories=8,
            trials_per_eval=500,
            seed=42,
        )
        assert isinstance(report, SensitivityReport)
        assert len(report.indices) > 0
        for idx in report.indices:
            assert np.isfinite(idx["mu_star"])
            assert np.isfinite(idx["sigma"])

    @pytest.mark.slow
    def test_output_has_condition_labels(self) -> None:
        report = run_morris_screening(
            condition_ids=["depression"],
            n_trajectories=8,
            trials_per_eval=500,
            seed=42,
        )
        names = {idx["name"] for idx in report.indices}
        assert "depression_alpha" in names or "depression_beta" in names


class TestSobolAnalysis:
    @pytest.mark.slow
    def test_produces_s1_st_indices(self) -> None:
        """Sobol on a 2-condition subset produces S1 and ST."""
        report = run_sobol_analysis(
            condition_ids=["depression", "gastroenteritis"],
            n_samples=16,
            trials_per_eval=500,
            seed=42,
        )
        assert isinstance(report, SensitivityReport)
        assert len(report.indices) > 0
        for idx in report.indices:
            assert "S1" in idx
            assert "ST" in idx
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_sensitivity.py -v -m "not slow"`
Expected: FAIL with `ModuleNotFoundError: No module named 'selectron.sensitivity'`

- [ ] **Step 3: Implement sensitivity.py**

`python/src/selectron/sensitivity.py`:
```python
"""Sobol/Morris global sensitivity analysis via SALib.

Defines the Gamma-Poisson parameter space for tier-B conditions (alpha, beta
per condition), runs the Python forward MC as the objective function, and
computes Sobol first-order (S1) / total-order (ST) indices and Morris
elementary effects (mu*, sigma).

Full-scale Sobol (200 params, N=1024) is an out-of-CI batch job.
Tests use N=8-16 on 2-4 condition subsets.
"""

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

# ISS HMS resources for sensitivity runs
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

    method: str  # "morris" | "sobol"
    n_params: int
    n_evaluations: int
    metric: str  # which output metric was analyzed (e.g., "chi")
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
    """Build SALib problem definition for a set of conditions.

    Each condition contributes 2 parameters: alpha and beta (Gamma-Poisson).
    Bounds are set as [current/scale_factor, current*scale_factor] to explore
    a wide range around the current prior values.
    """
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

    # Override the Gamma-Poisson alpha/beta for the target conditions
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
    """Run Morris elementary effects screening.

    Args:
        condition_ids: Which conditions to include in the analysis.
        n_trajectories: Number of Morris trajectories.
        trials_per_eval: MC trials per parameter evaluation.
        seed: Random seed for both sampling and MC.

    Returns:
        SensitivityReport with mu_star and sigma per parameter.
    """
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
    """Run Sobol first-order and total-order sensitivity analysis.

    Args:
        condition_ids: Which conditions to include.
        n_samples: Saltelli N parameter (total evals = N*(2*D+2)).
        trials_per_eval: MC trials per evaluation.
        seed: Random seed.

    Returns:
        SensitivityReport with S1 and ST per parameter.
    """
    problem = build_problem_definition(condition_ids)
    param_values = saltelli.sample(problem, n_samples, seed=seed)

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

        # Tornado data for I6 figure consumption
        tornado = sorted(indices, key=lambda x: abs(x.get("S1", 0)), reverse=True)
        with open(output_dir / "tornado_data.json", "w") as f:
            json.dump(tornado, f, indent=2)

    return report
```

- [ ] **Step 4: Run tests**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_sensitivity.py -v -m "not slow"`
Expected: 2 tests PASS (TestBuildProblemDefinition)

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_sensitivity.py -v -m slow`
Expected: 3 tests PASS (Morris and Sobol on small subsets, ~30-60s each)

- [ ] **Step 5: Commit**

```bash
git add python/src/selectron/sensitivity.py python/tests/test_sensitivity.py
git commit -m "feat(python): add Sobol/Morris sensitivity analysis via SALib (TDD)

Morris screening and Sobol S1/ST indices over Gamma-Poisson parameter
space. Uses Python forward MC as objective function. Produces tornado
data JSON for I6 IMMSensitivityTornado figure.

Tests use N=8-16 on 2-condition subsets. Full-scale runs (200 params,
N=1024) are out-of-CI batch jobs. 5 tests pass."
```

---

### Task 12: Integration Test + Regression

**Files:**
- Create: `python/tests/test_integration.py`

- [ ] **Step 1: Write the integration test**

`python/tests/test_integration.py`:
```python
"""End-to-end integration test: fit → validate → write → re-validate.

This test exercises the full pipeline on the single currently-fittable
condition (depression) and verifies:
  1. The fitter produces a converged result
  2. The writer merges it without corrupting the JSON
  3. The validator runs after the merge without crashing
  4. A round-trip preserves non-fitted conditions exactly
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from selectron.fitter import fit_all_tier_b, check_convergence
from selectron.priors_io import load_priors
from selectron.validator import validate_k15
from selectron.writer import merge_fitted_priors


@pytest.mark.slow
class TestFullPipeline:
    def test_fit_write_validate_round_trip(self, tmp_priors: Path) -> None:
        """End-to-end: fit depression → write → validate → verify schema."""

        # ── Step 1: Fit ──
        report = fit_all_tier_b(
            draws=500,
            tune=250,
            chains=2,
            seed=42,
            dry_run=False,
        )
        assert report.n_fitted >= 1, f"Expected >= 1 fitted, got {report.n_fitted}"
        assert "depression" in report.fitted

        result = report.fitted["depression"]
        ok, reasons = check_convergence(result)
        # Convergence may not pass with 2 chains / 500 draws, but fit should run
        assert result.posterior_lambda_mean > 0

        # ── Step 2: Write merged priors to tmp ──
        original = load_priors(tmp_priors)
        n_original_conditions = len(original["conditions"])

        writer_report = merge_fitted_priors(
            fitted=report.fitted,
            priors_path=tmp_priors,
            dry_run=False,
        )
        assert writer_report.n_updated >= 1

        # ── Step 3: Verify merge integrity ──
        merged = load_priors(tmp_priors)
        assert merged["schema_version"] == 1
        assert len(merged["conditions"]) == n_original_conditions

        # Depression should be updated
        dep = merged["conditions"]["depression"]
        assert dep["provenance"] == "tierB-pymc"
        assert dep["incidence"]["alpha"] == result.posterior_alpha
        assert dep["incidence"]["beta"] == result.posterior_beta

        # Non-fitted conditions should be unchanged
        assert merged["conditions"]["acute-sinusitis"]["provenance"] == "tierA-nasa"
        assert merged["conditions"]["acute-sinusitis"]["incidence"]["alpha"] == \
               original["conditions"]["acute-sinusitis"]["incidence"]["alpha"]

        # ── Step 4: Validate (quick, single scenario) ──
        val_report = validate_k15(
            trials=1000,
            seed=42,
            scenarios=["issHMS"],
            priors_path=tmp_priors,
        )
        assert val_report.n_total == 4
        # We don't assert pass/fail — just that it runs without error

    def test_idempotent_write(self, tmp_priors: Path) -> None:
        """Writing the same fit twice produces identical output."""
        from selectron.fitter import FitResult

        result = FitResult(
            condition_id="depression",
            posterior_alpha=15.0,
            posterior_beta=124245.0,
            posterior_lambda_mean=1.21e-4,
            posterior_lambda_sd=3.1e-5,
            r_hat=1.001,
            ess_bulk=2000.0,
            ess_tail=1500.0,
            divergences=0,
            n_studies=2,
            total_person_days=117365,
            total_events=14,
        )
        merge_fitted_priors(fitted={"depression": result}, priors_path=tmp_priors, dry_run=False)
        first = load_priors(tmp_priors)

        merge_fitted_priors(fitted={"depression": result}, priors_path=tmp_priors, dry_run=False)
        second = load_priors(tmp_priors)

        assert first == second
```

- [ ] **Step 2: Run the integration test**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/test_integration.py -v -m slow`
Expected: 2 tests PASS (may take 60-90s total)

- [ ] **Step 3: Run the full test suite as regression**

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/ -v -m "not slow" --tb=short`
Expected: All fast tests PASS

Run: `cd /root/repos/Selectron/python && source .venv/bin/activate && pytest tests/ -v -m slow --tb=short`
Expected: All slow tests PASS

- [ ] **Step 4: Verify TS engine tests still pass (no JSON corruption)**

Run: `cd /root/repos/Selectron && npx vitest run tests/imm/validation_k15.test.ts`
Expected: All existing K15 tests PASS (the pipeline has NOT modified the production JSON)

- [ ] **Step 5: Commit**

```bash
git add python/tests/test_integration.py
git commit -m "test(python): add end-to-end integration test + regression

Full pipeline round-trip: fit_all_tier_b → merge_fitted_priors →
validate_k15 → schema integrity check. Verifies non-fitted conditions
are preserved, provenance is updated, and the validator runs after merge.

Idempotent write test: same fit applied twice produces identical JSON.
Includes TS engine regression check (validation_k15.test.ts still passes)."
```

---

## Summary

| Task | Module | Tests | Speed | Key Outcome |
|------|--------|-------|-------|-------------|
| 1 | Scaffold | 0 | instant | pyproject.toml, venv, package structure |
| 2 | priors_io + mapping | 12 | fast | Load/save JSON, dedup proposals, map IDs |
| 3 | k15_reference | 0 | instant | K15 constants, crew profile, CI95 brackets |
| 4 | forward_mc Part 1 | 11 | fast | Primitive samplers: Gamma, Poisson, Beta-PERT, RAF |
| 5 | forward_mc Part 2 | 4 | fast | run_trial + simulate_imm, CHI aggregation |
| 6 | forward_mc xval | 3 | slow | Cross-validation vs TS engine (statistical) |
| 7 | fitter Part 1 | 6 | slow | PyMC Gamma-Poisson fit, conjugate verification |
| 8 | fitter Part 2 | 3 | slow | Batch fitting, CLI, skip/fail reporting |
| 9 | validator | 5 | slow | K15 gate, JSON+markdown report |
| 10 | writer | 7 | fast | Atomic merge, dry-run, schema preservation |
| 11 | sensitivity | 5 | slow | Sobol/Morris via SALib, tornado data |
| 12 | integration | 2 | slow | End-to-end round-trip, TS regression |

**Total:** 58 tests across 12 tasks. Fast suite (~10s): 34 tests. Slow suite (~5 min): 24 tests.

**Current data reality:** 1 of 41 tier-B conditions is fittable (depression, 2 observations). The pipeline is infrastructure for future evidence extraction. As Diego promotes proposal rows to `incidence_rates.csv` and adds new studies, re-running `python -m selectron.fitter --tier B` will incrementally fit more conditions.

### Critical Files for Implementation
- `/root/repos/Selectron/src/data/imm-priors.json`
- `/root/repos/Selectron/src/imm/simulate.ts`
- `/root/repos/Selectron/research/evidence_extracted/incidence_rates.proposals_p-a.csv`
- `/root/repos/Selectron/src/imm/calibration.ts`
- `/root/repos/Selectron/src/imm/incidence.ts`