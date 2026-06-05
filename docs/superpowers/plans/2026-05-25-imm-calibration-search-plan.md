# IMM Calibration Literature Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Find incidence rate data for the 6 remaining `tierB-lit` IMM conditions via parallel MCP literature agents, produce `proposals_p-g.csv`, auto-fit via PyMC NUTS, and merge converged posteriors into `imm-priors.json`.

**Architecture:** Six parallel subagents (one per condition) each run Consensus + Scite + paper-search + Firecrawl searches. Their CSV output is collected, deduplicated, and written to `proposals_p-g.csv`. A Python orchestrator script runs `fit_all_tier_b()` directly, merges converged posteriors via `merge_fitted_priors()`, and writes diagnostics for non-converged conditions.

**Tech Stack:** Python 3.12 (venv at `python/.venv`), PyMC 5, ArviZ, Claude Code Agent tool (6 parallel agents), MCP tools: Consensus, Scite, paper-search, Firecrawl.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `scripts/apply_fit.py` | CREATE | Run tier-B fit, apply R-hat gate, merge posteriors, write diagnostics |
| `python/tests/test_apply_fit.py` | CREATE | Unit tests for convergence gate + diagnostics logic |
| `research/evidence_extracted/incidence_rates.proposals_p-g.csv` | CREATE (Task 3) | Agent-sourced evidence rows |
| `python/src/selectron/priors_io.py` | MODIFY (line 22) | Add `proposals_p-g.csv` to `_PROPOSAL_FILES` |
| `src/data/imm-priors.json` | MODIFY (Task 5) | Auto-merged posteriors for converged conditions |
| `research/evidence/bridges/<id>_fit_diagnostics.json` | CREATE (Task 5) | Diagnostics for non-converged conditions |
| `/root/repos/exports/2026-05-25_report_imm-calibration-delta.txt` | CREATE (Task 6) | K15 delta report |

---

## Task 1: Record K15 Baseline

**Files:**
- Read: `src/data/imm-priors.json` (current tier-B-lit count)
- Create: `/root/repos/exports/2026-05-25_baseline_k15.txt`

- [ ] **Step 1: Verify API and Python environment**

```bash
# From /root/repos/Selectron/
cd python && source .venv/bin/activate
python -c "import pymc; import arviz; print('OK')"
```

Expected: `OK`

- [ ] **Step 2: Check current tier-B-lit count**

```bash
python -c "
from selectron.priors_io import load_priors, get_tier_b_conditions
p = load_priors()
t = get_tier_b_conditions(p)
print('tierB-lit conditions:', list(t.keys()))
"
```

Expected output includes exactly 6 keys:
`barotrauma-ear-sinus-block`, `eye-penetration-foreign-body`, `shoulder-sprain-strain`, `elbow-sprain-strain`, `hip-sprain-strain`, `wrist-sprain-strain`

- [ ] **Step 3: Record K15 baseline**

```bash
cd /root/repos/Selectron
npm run validate:imm 2>&1 | tee /root/repos/exports/2026-05-25_baseline_k15.txt
```

Expected: exits 0 (26/26 tests passing). Save the summary lines (TME, CHI, pEVAC, pLOCL values) — needed for delta comparison in Task 6.

---

## Task 2: Write and Test apply_fit.py

**Files:**
- Create: `scripts/apply_fit.py`
- Create: `python/tests/test_apply_fit.py`

- [ ] **Step 1: Write failing tests**

Create `python/tests/test_apply_fit.py`:

```python
"""Tests for apply_fit.py orchestration logic."""
import json
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest
import sys

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "scripts"))
import apply_fit


def _make_fit_result(cid: str, r_hat: float = 1.005, divergences: int = 0):
    from selectron.fitter import FitResult
    return FitResult(
        condition_id=cid,
        posterior_alpha=3.0,
        posterior_beta=1200.0,
        posterior_lambda_mean=0.0025,
        posterior_lambda_sd=0.0003,
        r_hat=r_hat,
        ess_bulk=800.0,
        ess_tail=750.0,
        divergences=divergences,
        n_studies=2,
        total_person_days=180000,
        total_events=5,
    )


def test_passes_gate_on_good_rhat():
    result = _make_fit_result("shoulder-sprain-strain", r_hat=1.005)
    assert apply_fit.passes_gate(result) is True


def test_fails_gate_on_high_rhat():
    result = _make_fit_result("hip-sprain-strain", r_hat=1.02)
    assert apply_fit.passes_gate(result) is False


def test_fails_gate_on_high_divergences():
    result = _make_fit_result("wrist-sprain-strain", r_hat=1.005, divergences=15)
    assert apply_fit.passes_gate(result) is False


def test_write_diagnostics_creates_file(tmp_path: Path):
    result = _make_fit_result("elbow-sprain-strain", r_hat=1.05)
    reasons = ["R_hat 1.0500 > 1.01"]
    apply_fit.write_diagnostics(result, reasons, bridges_dir=tmp_path)
    out = tmp_path / "elbow-sprain-strain_fit_diagnostics.json"
    assert out.exists()
    data = json.loads(out.read_text())
    assert data["condition_id"] == "elbow-sprain-strain"
    assert data["r_hat"] == pytest.approx(1.05)
    assert "R_hat" in data["reasons"][0]


def test_write_diagnostics_content(tmp_path: Path):
    result = _make_fit_result("hip-sprain-strain", r_hat=1.005, divergences=12)
    reasons = ["divergences 12 > 10"]
    apply_fit.write_diagnostics(result, reasons, bridges_dir=tmp_path)
    data = json.loads((tmp_path / "hip-sprain-strain_fit_diagnostics.json").read_text())
    assert data["divergences"] == 12
    assert data["posterior_alpha"] == pytest.approx(3.0)
    assert data["posterior_beta"] == pytest.approx(1200.0)
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /root/repos/Selectron/python && source .venv/bin/activate
pytest tests/test_apply_fit.py -v 2>&1 | head -30
```

Expected: `ModuleNotFoundError: No module named 'apply_fit'` — correct, script not written yet.

- [ ] **Step 3: Write apply_fit.py**

Create `scripts/apply_fit.py` (relative to repo root `/root/repos/Selectron/`):

```python
#!/usr/bin/env python3
"""Orchestrate tier-B Gamma-Poisson fit and merge converged posteriors.

Usage (from repo root, with python/.venv active):
    python scripts/apply_fit.py [--dry-run] [--condition <id>]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Resolve python/ package on path
_REPO_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(_REPO_ROOT / "python" / "src"))

from selectron.fitter import fit_all_tier_b, FitResult
from selectron.writer import merge_fitted_priors

_BRIDGES_DIR = _REPO_ROOT / "research" / "evidence" / "bridges"

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("apply_fit")

R_HAT_THRESHOLD = 1.01
DIVERGENCES_THRESHOLD = 10


def passes_gate(result: FitResult) -> bool:
    """Return True if result meets convergence criteria."""
    return result.r_hat <= R_HAT_THRESHOLD and result.divergences <= DIVERGENCES_THRESHOLD


def write_diagnostics(
    result: FitResult,
    reasons: list[str],
    bridges_dir: Path = _BRIDGES_DIR,
) -> None:
    """Write fit diagnostics JSON for a non-converged condition."""
    bridges_dir.mkdir(parents=True, exist_ok=True)
    out = bridges_dir / f"{result.condition_id}_fit_diagnostics.json"
    data = {
        "condition_id": result.condition_id,
        "r_hat": result.r_hat,
        "ess_bulk": result.ess_bulk,
        "ess_tail": result.ess_tail,
        "divergences": result.divergences,
        "posterior_alpha": result.posterior_alpha,
        "posterior_beta": result.posterior_beta,
        "n_studies": result.n_studies,
        "total_person_days": result.total_person_days,
        "total_events": result.total_events,
        "reasons": reasons,
    }
    out.write_text(json.dumps(data, indent=2))
    logger.info("Diagnostics written: %s", out)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--condition", default=None, help="Fit a single condition by ID")
    args = parser.parse_args()

    logger.info("Running tier-B fit (dry_run=%s, condition_filter=%s)", args.dry_run, args.condition)

    report = fit_all_tier_b(
        draws=2000,
        tune=1000,
        chains=4,
        seed=42,
        condition_filter=args.condition,
        dry_run=args.dry_run,
    )

    logger.info(
        "Fit complete: %d fitted, %d failed, %d skipped",
        report.n_fitted, report.n_failed, report.n_skipped,
    )

    # Apply gate: merge only truly-converged conditions
    to_merge: dict[str, FitResult] = {}
    for cid, result in report.fitted.items():
        if passes_gate(result):
            to_merge[cid] = result
            logger.info("  PASS %s (R-hat=%.4f, div=%d)", cid, result.r_hat, result.divergences)
        else:
            reasons = []
            if result.r_hat > R_HAT_THRESHOLD:
                reasons.append(f"R_hat {result.r_hat:.4f} > {R_HAT_THRESHOLD}")
            if result.divergences > DIVERGENCES_THRESHOLD:
                reasons.append(f"divergences {result.divergences} > {DIVERGENCES_THRESHOLD}")
            write_diagnostics(result, reasons)
            logger.warning("  FAIL %s: %s", cid, "; ".join(reasons))

    for cid, (result, reasons) in report.failed.items():
        write_diagnostics(result, reasons)
        logger.warning("  FAIL %s: %s", cid, "; ".join(reasons))

    for cid, reason in report.skipped.items():
        logger.info("  SKIP %s: %s", cid, reason)

    if to_merge and not args.dry_run:
        writer_report = merge_fitted_priors(fitted=to_merge)
        logger.info("Merged %d conditions into imm-priors.json", writer_report.n_updated)
        for cid, diffs in writer_report.updated.items():
            for d in diffs:
                logger.info("  %s.%s: %s -> %s", cid, d.field, d.old_value, d.new_value)
    elif args.dry_run:
        logger.info("DRY RUN: would merge %d conditions", len(to_merge))

    print(f"\nSummary: {len(to_merge)} merged, {len(report.failed)} failed gate, {len(report.skipped)} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd /root/repos/Selectron/python && source .venv/bin/activate
pytest tests/test_apply_fit.py -v
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron
git add scripts/apply_fit.py python/tests/test_apply_fit.py
git commit -m "feat(scripts): apply_fit.py — tier-B fit orchestrator with R-hat gate and diagnostics writer"
```

---

## Task 3: Run 6 Parallel Literature Search Agents

**Files:**
- Create: `research/evidence_extracted/incidence_rates.proposals_p-g.csv` (output of this task)

This task launches 6 subagents in a single parallel batch using the Agent tool. Each agent uses all 4 MCP tools and returns a plain-text CSV row block (no header line). The controller collects all 6 results, deduplicates, and writes the CSV.

- [ ] **Step 1: Launch 6 agents in parallel**

Invoke all 6 agents simultaneously (single Agent tool batch). Use the following prompt for each, substituting the per-condition values:

---

**Agent 1 — barotrauma-ear-sinus-block**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for ear/sinus barotrauma in confined analog mission environments or equivalent proxies.

Target condition: barotrauma-ear-sinus-block
Human name: Ear/Sinus Barotrauma (pressure-induced block)
ICD: J34.89 / H68 / H74.09
Current Bayesian prior: Gamma-Poisson alpha=2, beta=1000 → lambda ~0.002 events/person-day

Population guidance:
- PRIMARY: analog mission cohorts (MDRS, HI-SEAS, HERA, Antarctica, submarine confinement,
  hyperbaric chamber cohorts, altitude chamber protocols). These are your best sources.
- FALLBACK if no analog: general-population diving/aviation ER studies.
- REJECT: military-operational deployments with no analog-mission analog fraction.

Search using all 4 tools below. For each study that yields a usable incidence rate, extract:
- person_days = crew_size × mission_days (prefix EST: if estimated)
- events = integer incident count (prefix EST: if back-calculated from rate × exposure)

Tools to use:
1. mcp__claude_ai_Consensus__search with query:
   "ear barotrauma incidence analog isolated confined environment"
   Also try: "sinus barotrauma epidemiology altitude hypobaric chamber incidence rate"

2. mcp__scite__search_literature with term:
   "otic barotrauma incidence cohort submarine diving"
   Also try: "ear barotrauma prevalence isolated confined environment"

3. mcp__paper-search__search_pubmed with query:
   "barotrauma ear sinus incidence rate epidemiology analog mission"
   Also try mcp__paper-search__search_semantic: "ear barotrauma frequency isolated environment"

4. mcp__firecrawl-mcp__firecrawl_search with query:
   "ear barotrauma incidence rate person-years epidemiology"
   Also try: "GBD ear disorder incidence rate per person year"

For each usable study, produce one CSV row in this EXACT format (no header):
barotrauma-ear-sinus-block,<mission_type>,<doi_or_NEISS:year>,<firstauthor_year>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc_now>

Rules:
- mission_type: "analog" if analog/confined cohort; "general-pop" if diving/ER/GBD
- study_doi: exact DOI or "NEISS:2022" / "GBD:2019" for databases
- study_slug: firstauthor_year (e.g. smith_2019) or neiss_2022 — unique per study
- notes: for general-pop rows, include one sentence on applicability + any population offset estimate
- Skip rows where person_days cannot be derived even as EST:

Return ONLY the CSV rows (no header), followed by a brief summary (studies found, any gaps).
```

---

**Agent 2 — eye-penetration-foreign-body**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for penetrating ocular foreign body injuries in occupational/confined environments.

Target condition: eye-penetration-foreign-body
Human name: Eye Penetration — Intraocular Foreign Body
ICD: S05.5 / T15
Current Bayesian prior: Gamma-Poisson alpha=1, beta=1000 → lambda ~0.001 events/person-day

Population guidance:
- PRIMARY: ISS/spaceflight eye injury data, EVA foreign body events, analog mission eye injuries
- FALLBACK: occupational intraocular foreign body incidence (metalworking, construction ER),
  NEISS eye injury reports, GBD eye injury estimates
- REJECT: population-wide non-occupational eye injuries without denominator

Search using all 4 tools below:

1. mcp__claude_ai_Consensus__search:
   "intraocular foreign body incidence occupational epidemiology"
   Also: "eye penetrating injury spaceflight ISS analog mission"

2. mcp__scite__search_literature:
   "ocular foreign body incidence rate occupational"
   Also: "eye injury spaceflight crew incidence"

3. mcp__paper-search__search_pubmed:
   "intraocular foreign body incidence epidemiology occupational"
   Also mcp__paper-search__search_semantic: "eye penetration injury rate confined environment"

4. mcp__firecrawl-mcp__firecrawl_search:
   "NEISS eye penetrating injury foreign body incidence rate"
   Also: "GBD eye injury incidence per person year"

CSV format (no header):
eye-penetration-foreign-body,<mission_type>,<doi>,<slug>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc>

Return ONLY the CSV rows then a brief summary.
```

---

**Agent 3 — shoulder-sprain-strain**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for shoulder sprain/strain in spaceflight analog environments or general population.

Target condition: shoulder-sprain-strain
Human name: Shoulder Sprain/Strain
ICD: S40.0 / S46.0
Current Bayesian prior: Gamma-Poisson alpha=2, beta=700 → lambda ~0.0029 events/person-day

Population guidance:
- PRIMARY: ISS musculoskeletal injury data (shoulder specifically), EVA shoulder injuries,
  analog mission musculoskeletal complaints, HERA/HI-SEAS/MDRS injury logs
- FALLBACK: NEISS shoulder sprain data, GBD shoulder injury, sports epidemiology shoulder
  sprain rates from team sports (adjust for selection bias — note in notes field)
- REJECT: military-only combat injury data

Search using all 4 tools:

1. mcp__claude_ai_Consensus__search:
   "shoulder sprain strain incidence spaceflight analog mission musculoskeletal"
   Also: "shoulder injury rate astronaut crew ISS EVA"

2. mcp__scite__search_literature:
   "shoulder musculoskeletal injury incidence confined isolated environment"
   Also: "shoulder sprain epidemiology occupational cohort"

3. mcp__paper-search__search_pubmed:
   "shoulder injury incidence ISS spaceflight analog isolated"
   Also mcp__paper-search__search_semantic: "shoulder sprain rate general population NEISS"

4. mcp__firecrawl-mcp__firecrawl_search:
   "NEISS shoulder sprain strain incidence rate person-years"
   Also: "GBD shoulder injury incidence per person year"

CSV format (no header):
shoulder-sprain-strain,<mission_type>,<doi>,<slug>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc>

Return ONLY the CSV rows then a brief summary.
```

---

**Agent 4 — elbow-sprain-strain**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for elbow sprain/strain. No isolated analog-mission rates exist — use general-population
ER/sports epidemiology as primary fallback.

Target condition: elbow-sprain-strain
Human name: Elbow Sprain/Strain
ICD: S53.4
Current Bayesian prior: Gamma-Poisson alpha=2, beta=700 → lambda ~0.0029 events/person-day

Population guidance:
- PRIMARY: NEISS elbow sprain ER visits with denominator, GBD elbow injury incidence,
  sports epidemiology elbow sprain rates (basketball, volleyball, gymnastics)
- Note in notes field: "general-pop proxy; selection-bias ~0.5× expected vs analog cohort"
- REJECT: military-only combat data; case series without population denominator

Search using all 4 tools:

1. mcp__claude_ai_Consensus__search:
   "elbow sprain strain incidence rate epidemiology general population"
   Also: "elbow injury incidence sports occupational"

2. mcp__scite__search_literature:
   "elbow sprain incidence per person year cohort study"
   Also: "elbow ligament injury epidemiology rate"

3. mcp__paper-search__search_pubmed:
   "elbow sprain strain incidence epidemiology NEISS"
   Also mcp__paper-search__search_semantic: "elbow injury rate sports population"

4. mcp__firecrawl-mcp__firecrawl_search:
   "NEISS elbow sprain strain injury incidence rate"
   Also: "GBD elbow injury incidence per 100000 person-years"

CSV format (no header):
elbow-sprain-strain,<mission_type>,<doi>,<slug>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc>

Return ONLY the CSV rows then a brief summary.
```

---

**Agent 5 — hip-sprain-strain**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for hip sprain/strain. No isolated analog-mission rates exist — use general-population
ER/sports epidemiology as primary fallback.

Target condition: hip-sprain-strain
Human name: Hip Sprain/Strain
ICD: S73.1
Current Bayesian prior: Gamma-Poisson alpha=2, beta=700 → lambda ~0.0029 events/person-day

Population guidance:
- PRIMARY: NEISS hip sprain/strain ER visits with denominator, GBD hip/thigh injury,
  sports epidemiology hip flexor/adductor strain rates (soccer, athletics)
- Note in notes field: "general-pop proxy; selection-bias ~0.5× expected vs analog cohort"
- REJECT: military-only fracture data; case series without population denominator

Search using all 4 tools:

1. mcp__claude_ai_Consensus__search:
   "hip sprain strain incidence rate epidemiology general population"
   Also: "hip flexor strain injury rate sports"

2. mcp__scite__search_literature:
   "hip strain incidence per person year cohort"
   Also: "hip muscle injury epidemiology rate"

3. mcp__paper-search__search_pubmed:
   "hip sprain strain incidence NEISS epidemiology"
   Also mcp__paper-search__search_semantic: "hip injury rate sports population"

4. mcp__firecrawl-mcp__firecrawl_search:
   "NEISS hip sprain strain incidence rate"
   Also: "GBD hip thigh injury incidence per 100000 person-years"

CSV format (no header):
hip-sprain-strain,<mission_type>,<doi>,<slug>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc>

Return ONLY the CSV rows then a brief summary.
```

---

**Agent 6 — wrist-sprain-strain**

Prompt:
```
You are a biomedical literature search agent. Your task is to find incidence rate data
for wrist sprain/strain. No isolated analog-mission rates exist — use general-population
ER/sports epidemiology as primary fallback.

Target condition: wrist-sprain-strain
Human name: Wrist Sprain/Strain
ICD: S63.5
Current Bayesian prior: Gamma-Poisson alpha=2, beta=700 → lambda ~0.0029 events/person-day

Population guidance:
- PRIMARY: NEISS wrist sprain ER visits with denominator, GBD wrist/hand injury,
  sports epidemiology wrist sprain rates (snowboarding, gymnastics, basketball)
- Note in notes field: "general-pop proxy; selection-bias ~0.5× expected vs analog cohort"
- REJECT: military-only combat data; case series without population denominator

Search using all 4 tools:

1. mcp__claude_ai_Consensus__search:
   "wrist sprain strain incidence rate epidemiology general population"
   Also: "wrist injury rate sports occupational"

2. mcp__scite__search_literature:
   "wrist sprain incidence per person year cohort"
   Also: "wrist ligament injury epidemiology rate"

3. mcp__paper-search__search_pubmed:
   "wrist sprain strain incidence NEISS epidemiology"
   Also mcp__paper-search__search_semantic: "wrist injury rate population sports"

4. mcp__firecrawl-mcp__firecrawl_search:
   "NEISS wrist sprain strain incidence rate"
   Also: "GBD wrist hand injury incidence per 100000 person-years"

CSV format (no header):
wrist-sprain-strain,<mission_type>,<doi>,<slug>,<person_days>,<events>,<notes>,subagent-proposal,<ISO8601_utc>

Return ONLY the CSV rows then a brief summary.
```

- [ ] **Step 2: Collect all 6 agent results**

When all 6 agents complete, collect their CSV row blocks. Each block is a multi-line string of CSV rows (no header). Concatenate them.

- [ ] **Step 3: Deduplicate and write proposals_p-g.csv**

Apply deduplication on `(condition_id, study_slug, person_days, events)`. Then write the file:

```python
import csv, io
from pathlib import Path
from datetime import datetime, timezone

SCHEMA = ["condition_id", "mission_type", "study_doi", "study_slug",
          "person_days", "events", "notes", "extracted_by", "extracted_at_utc"]

def write_proposals(raw_blocks: list[str], out_path: Path) -> int:
    seen: set[tuple] = set()
    rows: list[dict] = []
    for block in raw_blocks:
        for line in block.strip().splitlines():
            line = line.strip()
            if not line or line.startswith("condition_id"):
                continue
            # CSV parse — notes field may contain commas; split on max 8 delimiters
            parts = line.split(",", maxsplit=8)
            if len(parts) != 9:
                continue
            row = dict(zip(SCHEMA, parts))
            key = (row["condition_id"], row["study_slug"], row["person_days"], row["events"])
            if key not in seen:
                seen.add(key)
                rows.append(row)
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=SCHEMA)
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)
```

Call with all 6 raw_blocks collected from agent results. Write to:
`research/evidence_extracted/incidence_rates.proposals_p-g.csv`

- [ ] **Step 4: Print per-condition row count**

```python
from collections import Counter
rows_by_condition = Counter(r["condition_id"] for r in rows)
for cid in ["barotrauma-ear-sinus-block", "eye-penetration-foreign-body",
            "shoulder-sprain-strain", "elbow-sprain-strain",
            "hip-sprain-strain", "wrist-sprain-strain"]:
    count = rows_by_condition.get(cid, 0)
    flag = "⚠ ZERO ROWS" if count == 0 else ""
    print(f"  {cid}: {count} rows {flag}")
```

Conditions with 0 rows will be skipped by the fitter (stay `tierB-lit`). This is acceptable — flag for Diego review.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron
git add research/evidence_extracted/incidence_rates.proposals_p-g.csv
git commit -m "data: proposals_p-g — agent-sourced incidence rates for 6 tier-B-lit conditions"
```

---

## Task 4: Update priors_io.py and Run apply_fit.py

**Files:**
- Modify: `python/src/selectron/priors_io.py` (line 22 — add proposals_p-g.csv)
- Create: `research/evidence/bridges/<id>_fit_diagnostics.json` (per non-converged condition)
- Modify: `src/data/imm-priors.json` (merged posteriors)

- [ ] **Step 1: Add proposals_p-g.csv to _PROPOSAL_FILES**

In `python/src/selectron/priors_io.py`, find `_PROPOSAL_FILES` (lines 16-23) and add the new file:

```python
_PROPOSAL_FILES = [
    "incidence_rates.proposals_p-a.csv",
    "incidence_rates.proposals_p-b.csv",
    "incidence_rates.proposals_p-c.csv",
    "incidence_rates.proposals_p-d.csv",
    "incidence_rates.proposals_p-e.csv",
    "incidence_rates.proposals_p-f.csv",
    "incidence_rates.proposals_p-g.csv",   # ← add this line
]
```

- [ ] **Step 2: Verify evidence loads correctly**

```bash
cd /root/repos/Selectron/python && source .venv/bin/activate
python -c "
from selectron.priors_io import load_evidence_proposals
rows = load_evidence_proposals()
from collections import Counter
c = Counter(r['mapped_prior_id'] for r in rows if r['mapped_prior_id'])
targets = ['barotrauma-ear-sinus-block','eye-penetration-foreign-body',
           'shoulder-sprain-strain','elbow-sprain-strain',
           'hip-sprain-strain','wrist-sprain-strain']
for t in targets:
    print(f'{t}: {c.get(t,0)} rows')
"
```

Expected: each of the 6 conditions shows ≥ 1 row (conditions with 0 rows will be skipped, print a warning).

- [ ] **Step 3: Dry-run apply_fit.py**

```bash
cd /root/repos/Selectron && source python/.venv/bin/activate
python scripts/apply_fit.py --dry-run
```

Expected: prints "DRY RUN: would fit N conditions" for each condition that has evidence rows, "SKIP: No evidence data" for any with zero rows. Exits 0.

- [ ] **Step 4: Run apply_fit.py (live fit)**

```bash
cd /root/repos/Selectron && source python/.venv/bin/activate
python scripts/apply_fit.py 2>&1 | tee /root/repos/exports/2026-05-25_fit_log_tier-b-lit.txt
```

Expected output (approximate, ~3-5 min per condition):
```
INFO selectron.fitter Fitting barotrauma-ear-sinus-block: N observations ...
...
INFO apply_fit PASS barotrauma-ear-sinus-block (R-hat=1.00X, div=0)
...
Summary: X merged, Y failed gate, Z skipped
```

If a condition fails gate: diagnostics written to `research/evidence/bridges/<id>_fit_diagnostics.json`. Inspect the R-hat and divergence count to decide whether to re-run with more draws.

- [ ] **Step 5: Verify imm-priors.json was updated**

```bash
python3 -c "
import json
from pathlib import Path
d = json.loads(Path('src/data/imm-priors.json').read_text())
targets = ['barotrauma-ear-sinus-block','eye-penetration-foreign-body',
           'shoulder-sprain-strain','elbow-sprain-strain',
           'hip-sprain-strain','wrist-sprain-strain']
for t in targets:
    p = d['conditions'][t]
    print(t, p['provenance'], 'alpha=', p['incidence']['alpha'])
"
```

Expected: conditions that converged show `provenance=tierB-pymc` and updated alpha/beta values. Conditions that failed gate remain `tierB-lit`.

- [ ] **Step 6: Commit**

```bash
cd /root/repos/Selectron
git add python/src/selectron/priors_io.py src/data/imm-priors.json
git add research/evidence/bridges/ 2>/dev/null || true
git commit -m "feat(calibration): merge tier-B-lit posteriors — add proposals_p-g, update imm-priors.json"
```

---

## Task 5: K15 Delta Report and Final Commit

**Files:**
- Create: `/root/repos/exports/2026-05-25_report_imm-calibration-delta.txt`
- Modify: `STATUS.md`

- [ ] **Step 1: Run K15 validation**

```bash
cd /root/repos/Selectron
npm run validate:imm 2>&1 | tee /root/repos/exports/2026-05-25_report_imm-calibration-delta.txt
```

Expected: exits 0. All 26 K15 tests pass.

- [ ] **Step 2: Compare delta against baseline**

```bash
diff /root/repos/exports/2026-05-25_baseline_k15.txt \
     /root/repos/exports/2026-05-25_report_imm-calibration-delta.txt | grep "^[<>]"
```

Acceptable: TME / CHI / pEVAC / pLOCL shift < 5% from baseline.
If any metric shifts > 5%: do NOT commit imm-priors.json changes; flag for Diego review before proceeding.

- [ ] **Step 3: Update STATUS.md**

Add a row to the DONE table and an entry to the Audit log:

In the DONE table, add:
```
| Phase 0 — tier-B-lit calibration | Parallel MCP agents → PyMC fit → imm-priors.json | <commit-sha> |
```

In the Audit log, append:
```
| 2026-05-25 | IMM tier-B-lit calibration | feat(calibration): parallel MCP search + PyMC fit for 6 remaining conditions |
```

- [ ] **Step 4: Final commit**

```bash
cd /root/repos/Selectron
git add STATUS.md
git commit -m "docs: STATUS update — tier-B-lit calibration complete"
```

- [ ] **Step 5: Push**

```bash
git push origin iter1-phase0
```

---

## Appendix: Handling Fit Failures

If any condition fails the R-hat gate (R-hat > 1.01 or divergences > 10):

1. Inspect `research/evidence/bridges/<id>_fit_diagnostics.json` for R-hat and ESS values
2. Check how many evidence rows were found: `python -c "from selectron.priors_io import load_evidence_proposals; from collections import Counter; c=Counter(r['mapped_prior_id'] for r in load_evidence_proposals()); print(c['<condition_id>'])"`
3. If only 1 row: the fit is underidentified — search agents may need broader queries or the general-pop fallback applied more aggressively
4. If R-hat 1.01–1.05: re-run with `python scripts/apply_fit.py --condition <id>` after increasing draws to 4000 in `apply_fit.py`
5. If R-hat > 1.1: the data may be inconsistent — flag for Diego manual prior review before forcing a merge

## Appendix: condition_mapping.py

The 6 conditions must be present in `python/src/selectron/condition_mapping.py`. Verify:

```bash
python -c "
from selectron.condition_mapping import CONDITION_MAP
targets = ['barotrauma-ear-sinus-block','eye-penetration-foreign-body',
           'shoulder-sprain-strain','elbow-sprain-strain',
           'hip-sprain-strain','wrist-sprain-strain']
for t in targets:
    print(t, '->', CONDITION_MAP.get(t, 'MISSING'))
"
```

All 6 must map to themselves. If any show `MISSING`, add them before running the fit.
