# Selectron Iteration 3 — Analog-mission risk module (NASA-IMM-inspired) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Stage B of Selectron — a forward-Monte-Carlo analog-mission risk simulator over a NASA-IMM-style PRA event tree, fed by a hierarchical Lognormal–Poisson posterior fit (MCMC) on the I&C evidence corpus, with a Risk tab in the React UI that returns CHI, pEarlyTermination, expected lost crew-days, and per-condition QTL contributions with 90% credible intervals.

**Architecture:** Iter 3 is **additive** to Iter 1/2 — the Iter-1 engine (`src/engine/mcda.ts`) and Iter-2 ratified `docs/criteria.md` are untouched. A new `src/risk/` package implements the four IMM mathematical models (Poisson occurrence, Binomial event-trigger, Bernoulli severity branching, partial-credit treatment). MCMC runs **offline** in a PyMC notebook against the curated evidence CSV; the frozen posterior ships as `src/risk/priors.json` so the browser never runs an HMC sampler. A new "Mission risk" UI tab consumes Stage A (selected crew from Iter 2) + an analog mission profile and renders the posterior. V&V follows NASA-STD-7009's eight credibility factors.

**Tech Stack:** TypeScript 5.x, Vite 5.x, React 18.x, Tailwind 3.x, Vitest 1.x, Apache ECharts 6.x (engine + UI — reused from Iter 1). PyMC 5.x + JAGS 4.3 (offline fit + cross-check, run in `~/.venvs/selectron-imm/`). MCP servers for source acquisition: `firecrawl-mcp`, `scite`, `paper-search`. Skill: `zotero-pdf-ocr` (Diego's library → Koofr WebDAV → Mistral OCR).

**Source of truth:** [`docs/superpowers/specs/2026-05-18-selectron-iter3-risk.md`](../specs/2026-05-18-selectron-iter3-risk.md)

**Predecessor:** Iter 1/2 (current) — [`2026-05-18-selectron-iter1-phase0.md`](2026-05-18-selectron-iter1-phase0.md)

---

## Recovery protocol (read this before doing anything)

This plan is designed to be **disconnection-resilient**. SSH from Diego's environment to OpenClaw is unstable; any task may die mid-execution. The recovery contract is:

1. **`STATUS.md` is the single source of truth.** Before starting any task, read `STATUS.md` at the repo root, find the Iter-3 section, look at the task table. Tasks marked `DONE` with a commit SHA do not need to be re-done — trust the table. Tasks marked `IN_PROGRESS` may have partial work on disk; inspect that work before re-running. Tasks marked `BLOCKED` carry a one-line reason.

2. **Every task writes durable artifacts BEFORE updating status.** Each task in this plan ends with two commits in this order:
   1. `feat:` / `chore:` / `research:` commit with the actual work,
   2. `docs(status):` commit that flips the Iter-3 task row to `DONE` and appends an audit log entry.
   If a task dies between commits 1 and 2, the next agent re-reads `STATUS.md`, sees `IN_PROGRESS`, runs `git log --oneline -20` to find the orphan commit, and just writes commit 2.

3. **Evidence and source artifacts are categorized at write-time, not at synthesis-time.** Every PDF / scrape / OCR output goes to a typed folder (`research/imm_sources/methods/`, `research/imm_sources/validation/`, `research/imm_sources/architecture/`, `research/imm_sources/zotero_imm/`, `research/evidence_extracted/`) with a YAML frontmatter that records: source URL, MCP tool used, date fetched, classification, which IMM-spec section it supports, and verification status. A resumed agent never has to re-derive provenance.

4. **The Phase 3.0 source-acquisition tasks are idempotent.** Each MCP call writes to a deterministic filename. If a task re-runs after a partial death, it checks for the target file first, skips if present and valid, re-fetches otherwise. Filenames are hash-stable on (DOI or URL + run-date) so re-runs do not silently overwrite verified outputs.

5. **No task in this plan runs auth-heavy MCP calls during planning or while reviewing the plan.** Diego has authorized the pipeline; execution is gated on (a) Iter 2 being shipped and (b) Diego ratifying this plan. A fresh agent that picks up Phase 3.0 should expect to make ~30–50 MCP calls across firecrawl/scite/paper-search/Mistral OCR. Budget for that; do not interleave with other auth-heavy work.

6. **MCMC is offline.** The PyMC fit (Phase 3B) runs in a notebook on Diego's machine, not in CI. The frozen `priors.json` is the only artifact that crosses the offline → online boundary. A disconnected sampler is fine — the notebook saves an `arviz.InferenceData` `.nc` file as a checkpoint after `pm.sample`, before any post-processing.

7. **TS engine TDD tasks (Phase 3C) commit per-step.** Each math module follows red → green → refactor → commit. If a step dies, the next agent runs `vitest --run` to see which test fails and resumes from there.

8. **STATUS.md update is part of the task definition, not optional polish.** A task is not done until `STATUS.md` reflects it. Reviewers must verify the STATUS.md commit exists before signing off.

---

## Plan structure

- **Part Z** — Recovery protocol (above)
- **Part 0** — Phase 3.0: NASA-IMM source acquisition + categorized evidence accumulation (Tasks 22–34) ← **NEW; user-requested**
- **Part A** — Phase 3A: Evidence extraction → `incidence_rates.csv` (Tasks 35–38)
- **Part B** — Phase 3B: Offline PyMC fit + JAGS cross-check → `priors.json` (Tasks 39–43)
- **Part C** — Phase 3C: TS Stage-B engine, TDD math first (Tasks 44–53)
- **Part D** — Phase 3D: UI extensions — Mission risk tab (Tasks 54–58)
- **Part E** — Phase 3E: Iter-3 acceptance + V&V dossier (Tasks 59–62)

**Task numbering continues from Iter 1's last task (#21).** This is so STATUS.md's task table extends linearly without renumbering and the audit log stays chronological.

**Hard prerequisites before Part 0 starts:**
- Iter 2 must be shipped (`docs/criteria.md` ratified by Diego, criterion barrel built, full-suite green).
- Diego must read this plan end-to-end and either accept the open questions in §12 of the spec or annotate them inline.
- The five MCP servers must be live: `mcporter list` shows `firecrawl-mcp`, `paper-search`, `scite`, `tavily`, `fetch` all healthy.
- `MISTRAL_API_KEY` must be in `/root/.claude/skills/zotero-pdf-ocr/.env` AND `Selectron/.env` (no `\r\n` in the key — see Iter-1 Task-20 audit log entry; the OCR request library rejects CRLF in Authorization headers).

---

## Part 0 — Phase 3.0: NASA-IMM source acquisition + categorized evidence

This phase exists for **two reasons** that user requested:

1. **Reproducible NASA-IMM methodology grounding.** The Iter-3 spec cites six primary NASA documents ([G12], [M18], [A22], [K15], [W14], [S20]) verbatim. We need machine-readable, archived copies of those documents in the repo so the methodology paper (Iter 4) can cite them and so the implementation can quote them. We do **not** trust the version pinned in the spec; each source is re-verified against its DOI/NTRS URL at acquisition time.

2. **Disconnection-resilient evidence accumulation.** The user explicitly asked for this. Each source is written to disk with a typed filename + YAML frontmatter the moment it is fetched. A new agent resuming mid-fan-out reads `research/imm_sources/INDEX.md`, sees which sources are confirmed, which are pending, and which are flagged — and continues from there.

### Folder layout for Phase 3.0

```
research/
  imm_sources/                     # NEW
    INDEX.md                       # master manifest (see §0.1)
    _fetch_imm_sources.py          # reproducibility script (idempotent re-fetch)
    methods/                       # IMM-method primary sources
      G12_gilkey_2012_bayesian_imm.md
      G12_gilkey_2012_bayesian_imm.pdf
      M18_myers_2018_imm_validation.md
      M18_myers_2018_imm_validation.pdf
      A22_antonsen_2022_medical_risk_human_spaceflight.md
      A22_antonsen_2022_medical_risk_human_spaceflight.pdf
    architecture/                  # IMM-architecture primary sources
      K15_keenan_2015_imm_probabilistic_simulation.md
      K15_keenan_2015_imm_probabilistic_simulation.pdf
    validation/                    # V&V-specific primary sources
      W14_walton_2014_nasa_std_7009.md
      W14_walton_2014_nasa_std_7009.pdf
      S20_walton_kerstman_2020_iss_quantification.md
      S20_walton_kerstman_2020_iss_quantification.pdf
    zotero_imm/                    # IMM docs already in Diego's Zotero
      <slug>.md
    citation_graph/                # scite output
      scite_imm_g12_inbound.json
      scite_imm_a22_inbound.json
      scite_imm_m18_inbound.json
      scite_imm_summary.md         # human synthesis
    follow_on/                     # paper-search-discovered follow-on papers
      <slug>.md
    03_imm_methodology_synthesis.md  # Section-by-section mapping spec→source
  evidence_extracted/              # NEW (Phase 3A consumes this)
    incidence_rates.csv            # hand-curated by Diego in Phase 3A
    incidence_rates.proposals.csv  # subagent-proposed rows for Diego review
    extraction_audit.md            # row-by-row provenance
```

Every `*.md` file under `research/imm_sources/` carries this YAML frontmatter:

```yaml
---
ref_id: G12 | M18 | A22 | K15 | W14 | S20 | zotero_<key> | followon_<slug>
classification: methods | architecture | validation | zotero_imm | citation_graph | follow_on
first_author: <Surname>
year: <YYYY>
title: <verbatim>
doi: <if any, else null>
url: <canonical source URL>
mcp_tool_used: firecrawl-mcp | scite | paper-search | zotero-pdf-ocr | tavily | manual
fetched_utc: <ISO-8601>
verified: true | false   # set true only after a human or automated check confirms content matches DOI
spec_sections_supported:
  - "3.1 Poisson occurrence"
  - "3.6 Lognormal–Poisson MCMC"
  - "Section 9 V&V"
notes: <free text>
---
```

---

### Task 22: Bootstrap Phase 3.0 — folder skeleton, INDEX template, fetch script

**Goal:** Create the empty `research/imm_sources/` tree and an INDEX.md that future tasks fill in row-by-row. This task does NOT make any MCP calls — it lays the disk shape so every later task knows exactly where to write.

**Files:**
- Create: `/root/repos/Selectron/research/imm_sources/INDEX.md`
- Create: `/root/repos/Selectron/research/imm_sources/_fetch_imm_sources.py`
- Create: `/root/repos/Selectron/research/imm_sources/.gitignore`
- Create: `/root/repos/Selectron/research/imm_sources/methods/.gitkeep`
- Create: `/root/repos/Selectron/research/imm_sources/architecture/.gitkeep`
- Create: `/root/repos/Selectron/research/imm_sources/validation/.gitkeep`
- Create: `/root/repos/Selectron/research/imm_sources/zotero_imm/.gitkeep`
- Create: `/root/repos/Selectron/research/imm_sources/citation_graph/.gitkeep`
- Create: `/root/repos/Selectron/research/imm_sources/follow_on/.gitkeep`
- Create: `/root/repos/Selectron/research/evidence_extracted/.gitkeep`

- [ ] **Step 1: Create the folder tree**

Run:
```bash
mkdir -p /root/repos/Selectron/research/imm_sources/{methods,architecture,validation,zotero_imm,citation_graph,follow_on}
mkdir -p /root/repos/Selectron/research/evidence_extracted
touch /root/repos/Selectron/research/imm_sources/{methods,architecture,validation,zotero_imm,citation_graph,follow_on}/.gitkeep
touch /root/repos/Selectron/research/evidence_extracted/.gitkeep
```
Expected: 7 directories created, 7 `.gitkeep` files.

- [ ] **Step 2: Write `INDEX.md` skeleton**

Write to `/root/repos/Selectron/research/imm_sources/INDEX.md`:

```markdown
# NASA Integrated Medical Model — Source Corpus

Curated grounding for Selectron Iter 3 (analog-mission risk module). Every
source here is referenced by the Iter-3 spec or directly informs the
hierarchical Lognormal–Poisson model in Phase 3B.

**Provenance policy:** each `*.md` carries a YAML frontmatter with
`mcp_tool_used`, `fetched_utc`, `verified`, and `spec_sections_supported`.
Sources that fail DOI verification are flagged in the table with `⚠`. Do not
remove a flagged row — annotate the failure and move on; the failure mode is
itself data.

**Resume-pointer:** the rows below are the unit of work. Each row corresponds
to one task in [`docs/superpowers/plans/2026-05-18-selectron-iter3-risk.md`](../../docs/superpowers/plans/2026-05-18-selectron-iter3-risk.md). When a row is fully
fetched and verified, its Status flips to ✅. Pending rows show `…`. Failed
rows show `⚠ <reason>`.

## Tier 1 — Primary NASA-IMM methodology (firecrawl + Mistral OCR)

| Ref | First author | Year | Title | DOI / NTRS | Classification | Task | Status |
|---|---|---|---|---|---|---|---|
| G12 | Gilkey et al. | 2012 | Bayesian analysis for risk assessment of selected medical events in support of the IMM effort | NASA/TP-2012-217120; [NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096); [CORE PDF](https://core.ac.uk/download/pdf/10569519.pdf) | methods | 23 | … |
| M18 | Myers et al. | 2018 | Validation of the NASA Integrated Medical Model: A space flight medical risk prediction tool | PSAM 14, Paper 174; [IAPSAM PDF](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf) | methods | 24 | … |
| A22 | Antonsen et al. | 2022 | Estimating medical risk in human spaceflight | [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | methods | 25 | … |
| K15 | Keenan et al. | 2015 | The Integrated Medical Model: A probabilistic simulation model predicting in-flight medical risks | NASA NTRS 20150018879 | architecture | 26 | … |
| W14 | Walton, Mulugeta, Nelson, Myers | 2014 | NASA-STD-7009 guidance document for human health and performance models and simulations | NASA NTRS 20140017301 | validation | 27 | … |
| S20 | Walton & Kerstman | 2020 | Quantification of medical risk on the ISS using the IMM | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | validation | 28 | … |

## Tier 2 — Zotero library (zotero-pdf-ocr skill)

(Filled by Task 29 — `zotero-pdf-ocr` searches across queries `"Integrated Medical Model"`, `"IMM Bayesian"`, `"Antonsen medical risk"`, `"Gilkey Bayesian"`, `"NASA medical risk simulation"`, `"NASA-STD-7009"`.)

| Slug | First author | Year | Title | DOI | Why included | Status |
|---|---|---|---|---|---|---|

## Tier 3 — Citation graph (scite MCP)

(Filled by Task 30 — scite inbound citations on G12, M18, A22.)

| Source | Inbound count | High-signal hits | Status |
|---|---|---|---|

## Tier 4 — Follow-on literature (paper-search MCP)

(Filled by Task 31 — `paper-search.search_papers` over IMM, hierarchical Poisson-Lognormal, analog-mission medical risk, PRA medical event tree.)

| Slug | First author | Year | Title | DOI | Selectron-relevance | Status |
|---|---|---|---|---|---|---|

## Build history

- 2026-05-_ — Task 22: skeleton created, no sources yet.
```

- [ ] **Step 3: Write `_fetch_imm_sources.py` skeleton**

Write to `/root/repos/Selectron/research/imm_sources/_fetch_imm_sources.py`:

```python
"""
Reproducibility script for Phase 3.0 source acquisition.

This script is NOT the orchestrator. It is the idempotent re-fetcher: given a
target ref_id (e.g. "G12"), it (a) checks whether the markdown + PDF exist
under the right classification folder, (b) re-runs the fetch via firecrawl-mcp
(or zotero-pdf-ocr for Zotero sources), (c) verifies the SHA-256 of the new
PDF matches the recorded one, (d) overwrites the markdown if and only if the
fetch was successful and content differs.

Usage (run by a subagent, not by Diego):
    python _fetch_imm_sources.py --ref G12
    python _fetch_imm_sources.py --ref all --dry-run

Tasks 23–31 each call this with one --ref, after writing the row to INDEX.md.

The script is intentionally minimal — heavy lifting is in the MCP servers.
This is plumbing.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent

@dataclass(frozen=True)
class Source:
    ref_id: str
    classification: str   # methods | architecture | validation | zotero_imm | follow_on
    slug: str
    canonical_url: str
    expected_pdf_sha256: str | None  # known-good hash if available

CATALOG: dict[str, Source] = {
    "G12": Source("G12", "methods", "G12_gilkey_2012_bayesian_imm",
                  "https://core.ac.uk/download/pdf/10569519.pdf", None),
    "M18": Source("M18", "methods", "M18_myers_2018_imm_validation",
                  "https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf", None),
    "A22": Source("A22", "methods", "A22_antonsen_2022_medical_risk_human_spaceflight",
                  "https://doi.org/10.1038/s41526-022-00193-9", None),
    "K15": Source("K15", "architecture", "K15_keenan_2015_imm_probabilistic_simulation",
                  "https://ntrs.nasa.gov/citations/20150018879", None),
    "W14": Source("W14", "validation", "W14_walton_2014_nasa_std_7009",
                  "https://ntrs.nasa.gov/citations/20140017301", None),
    "S20": Source("S20", "validation", "S20_walton_kerstman_2020_iss_quantification",
                  "https://doi.org/10.3357/AMHP.5432.2020", None),
}

def target_paths(s: Source) -> tuple[Path, Path]:
    base = HERE / s.classification / s.slug
    return Path(str(base) + ".md"), Path(str(base) + ".pdf")

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()

def needs_fetch(s: Source) -> bool:
    md, pdf = target_paths(s)
    if not md.exists() or not pdf.exists():
        return True
    if s.expected_pdf_sha256 and sha256(pdf) != s.expected_pdf_sha256:
        return True
    return False

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="ref_id from CATALOG, or 'all'")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    refs = list(CATALOG.keys()) if args.ref == "all" else [args.ref]
    for r in refs:
        if r not in CATALOG:
            print(f"unknown ref: {r}", file=sys.stderr)
            return 2
        s = CATALOG[r]
        md, pdf = target_paths(s)
        action = "FETCH" if needs_fetch(s) else "SKIP"
        print(f"{action:>5}  {s.ref_id}  {s.slug}  -> {md.relative_to(HERE)}")
        if args.dry_run:
            continue
        if action == "SKIP":
            continue
        # NOTE: this script does not call MCP directly — the calling agent does.
        # The agent runs the firecrawl-mcp or zotero-pdf-ocr call, then writes
        # the PDF and markdown to the paths above, then re-runs this script
        # with --dry-run to confirm SKIP for the same ref.
        print(f"  -> need to run mcp call; see plan task that owns {s.ref_id}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Write `.gitignore` to keep raw PDFs out of git**

Write to `/root/repos/Selectron/research/imm_sources/.gitignore`:

```
# Raw PDFs and OCR intermediates are local caches; do not commit.
# Commit only the YAML-frontmattered markdown.
*.pdf
_ocr_raw/
__pycache__/
```

Rationale: same convention as `research/evidence/.gitignore` from Iter-1 Task 20. The markdown is the citeable artifact; the PDF is reproducible from the URL.

- [ ] **Step 5: Commit skeleton**

```bash
cd /root/repos/Selectron && git add research/imm_sources/ research/evidence_extracted/.gitkeep && git commit -m "$(cat <<'EOF'
chore(iter3): scaffold research/imm_sources and research/evidence_extracted

Bootstraps Phase 3.0 source-acquisition layout. No content yet — tasks
23–34 fill INDEX.md row by row. Folders, gitignore, and the idempotent
_fetch_imm_sources.py re-fetcher are in place so subsequent tasks have a
deterministic target for every MCP call.
EOF
)"
```

- [ ] **Step 6: Update STATUS.md**

Edit `/root/repos/Selectron/STATUS.md`:
- Append a new row to the task table with `# = 22`, `Task = Scaffold research/imm_sources for Phase 3.0`, `Status = DONE`, `Commit = <new sha>`, `Notes = Skeleton only; no MCP calls.`
- Append to the Audit log: `| <UTC ts> | Task 22 implementer | Commit <sha> — Phase 3.0 folder skeleton + INDEX.md + _fetch_imm_sources.py |`
- Update the **Current state** block to read: `Next action: Task 23 — fetch G12 (Gilkey 2012 Bayesian IMM) via firecrawl-mcp.`

Commit the STATUS update separately:

```bash
git add STATUS.md && git commit -m "docs(status): mark Task 22 DONE"
```

---

### Task 23: Fetch G12 — Gilkey 2012 Bayesian IMM (firecrawl)

**Goal:** Acquire and OCR the primary IMM-Bayesian-method paper, [G12]. This is the paper whose Section 3.6 we are porting from WinBUGS to PyMC.

**Files:**
- Create: `/root/repos/Selectron/research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.pdf` (gitignored)
- Create: `/root/repos/Selectron/research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md`
- Modify: `/root/repos/Selectron/research/imm_sources/INDEX.md` (Tier-1 row Status → ✅)

- [ ] **Step 1: Fetch the CORE PDF via firecrawl-mcp**

Use the firecrawl skill (`firecrawl:firecrawl-scrape` or `firecrawl:firecrawl-download`) to download:
- Primary URL: `https://core.ac.uk/download/pdf/10569519.pdf`
- Fallback URL: `https://ntrs.nasa.gov/citations/20120013096` (NTRS landing page; follow the PDF link)

Save the raw PDF to `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.pdf`.

Verify the PDF is real:
```bash
file research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.pdf
```
Expected: `PDF document, version 1.<n>`.

If the file is HTML (e.g., a paywall or a CORE redirect), retry the NTRS fallback. If both fail, write a `⚠ paywall / not_resolvable` annotation to INDEX.md and STOP — Diego must manually fetch.

- [ ] **Step 2: OCR via Mistral**

Hand the PDF to the `ocr-pipeline` skill or call Mistral OCR directly:

```python
# pseudocode — actual call uses ocr-pipeline skill
from ocr_pipeline import ocr_pdf
ocr_pdf("research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.pdf",
        out="research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md",
        include_images=False)
```

Verify the markdown contains the verbatim quote from the Iter-3 spec §3.6:
- `"All prior data used to define the incidence rate were assumed to be lognormal."`
- `"75,000 Monte Carlo samplings"` or `"75 000 Monte Carlo samplings"`

Run:
```bash
grep -c "lognormal" research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md
grep -c "Monte Carlo" research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md
```
Expected: both > 0. If either is 0, the OCR failed (likely a scanned figure-heavy section); retry with `include_images=True` and re-grep on the next pass.

- [ ] **Step 3: Add YAML frontmatter**

Prepend to `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md`:

```yaml
---
ref_id: G12
classification: methods
first_author: Gilkey
year: 2012
title: "Bayesian analysis for risk assessment of selected medical events in support of the Integrated Medical Model effort"
doi: null
url: https://core.ac.uk/download/pdf/10569519.pdf
ntrs: https://ntrs.nasa.gov/citations/20120013096
mcp_tool_used: firecrawl-mcp
fetched_utc: <fill ISO-8601 timestamp>
verified: true
spec_sections_supported:
  - "3.6 Lognormal–Poisson MCMC"
  - "Section 7 PyMC notebook spec"
  - "Section 9 V&V — convergence rule"
notes: |
  Primary method paper. Lognormal prior + Poisson likelihood + WinBUGS Gibbs
  sampling. 75 000 MC samples; MC error < 5% rule of thumb. Selectron Iter 3
  ports this model to PyMC (NUTS) and validates against JAGS on a subset.
---
```

- [ ] **Step 4: Update INDEX.md**

Flip the G12 row Status from `…` to `✅` and add a one-line synthesis under "Tier 1 — Primary NASA-IMM methodology".

- [ ] **Step 5: Commit**

```bash
git add research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md research/imm_sources/INDEX.md
git commit -m "$(cat <<'EOF'
research(iter3): fetch G12 — Gilkey 2012 Bayesian IMM (NASA/TP-2012-217120)

Primary method paper for the Lognormal–Poisson + WinBUGS Gibbs sampling
approach that Selectron Iter 3 ports to PyMC. Fetched via firecrawl-mcp
from CORE; OCRed via Mistral; YAML frontmatter records provenance and
which Iter-3 spec sections this source grounds.
EOF
)"
```

- [ ] **Step 6: Update STATUS.md** (same pattern as Task 22 Step 6 — flip row, append audit log, commit `docs(status): mark Task 23 DONE`).

---

### Task 24: Fetch M18 — Myers 2018 IMM validation (firecrawl)

Same shape as Task 23. Differences:

- Primary URL: `https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf`
- Output: `research/imm_sources/methods/M18_myers_2018_imm_validation.md` + `.pdf`
- Verbatim-quote check after OCR (must appear in markdown):
  - `"100,000 trials per mission"` or `"100 000 trials per mission"`
  - `"Poisson Process (exponential waiting times between events)"`
  - `"binomial distribution"`
- Frontmatter `spec_sections_supported`:
  - `"3.1 Poisson occurrence"`
  - `"3.2 Binomial event-trigger"`
  - `"3.3 Severity branching"`
  - `"3.4 Treatment partial credit"`
  - `"3.5 CHI / pEarlyTermination"`
  - `"Section 9 V&V — convergence rule (<5% σ change)"`

Steps 1–6 follow Task 23's template verbatim, swapping G12 → M18 and the URLs / quote checks above. Commit message stem: `research(iter3): fetch M18 — Myers 2018 IMM validation (PSAM 14 paper 174)`.

---

### Task 25: Fetch A22 — Antonsen 2022 npj Microgravity (firecrawl)

**Differences from Task 23:**

- Primary URL: resolve DOI `10.1038/s41526-022-00193-9` via firecrawl — npj Microgravity is open-access, so the PDF should be on `nature.com`.
- Fallback: PubMed Central — search PMC for the DOI.
- Output: `research/imm_sources/methods/A22_antonsen_2022_medical_risk_human_spaceflight.md` + `.pdf`
- Verbatim-quote check after OCR:
  - `"4-step Monte Carlo"` or `"four-step Monte Carlo"` (paraphrase tolerated)
  - `"Crew Health Index"` or `"CHI"`
  - `"pEVAC"`
  - `"pLOCL"`
- Frontmatter `spec_sections_supported`:
  - `"1. What Iter 3 adds — CHI, pEarlyTermination, expectedLostCrewDays"`
  - `"3.5 CHI / pEarlyTermination"`
  - `"Section 8 UI — CHI display"`

Commit message stem: `research(iter3): fetch A22 — Antonsen 2022 medical risk human spaceflight (npj Microgravity)`.

---

### Task 26: Fetch K15 — Keenan 2015 IMM architecture (firecrawl + NTRS)

**Differences from Task 23:**

- Primary URL: `https://ntrs.nasa.gov/citations/20150018879` — follow the PDF link on the NTRS page.
- This is an architecture reference; lower priority. If the PDF is not on NTRS, accept the abstract-only markdown and flag `verified: false` in frontmatter with note `abstract-only; full text not on NTRS as of <date>`.
- Output: `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md` + `.pdf` (optional)
- Frontmatter `spec_sections_supported`:
  - `"1. What Iter 3 adds"`
  - `"3. Mathematical models — concept and architecture"`

Commit message stem: `research(iter3): fetch K15 — Keenan 2015 IMM probabilistic simulation (NTRS 20150018879)`.

---

### Task 27: Fetch W14 — Walton 2014 NASA-STD-7009 guidance (firecrawl + NTRS)

**Differences from Task 23:**

- Primary URL: `https://ntrs.nasa.gov/citations/20140017301` — follow PDF link.
- This is the V&V rubric paper; defines the eight credibility factors used in Iter-3 spec §9.
- Output: `research/imm_sources/validation/W14_walton_2014_nasa_std_7009.md` + `.pdf`
- Verbatim-quote check after OCR — must extract all eight credibility-factor names (Verification; Validation; Development Data Pedigree; Input Data Pedigree; Uncertainty Characterization; Results Robustness; Model Use History; Model Management). The Iter-3 spec table in §9 must be cross-checked against the actual NASA-STD-7009 wording.
- Frontmatter `spec_sections_supported`:
  - `"Section 9 V&V — NASA-STD-7009 eight factors"`

Commit message stem: `research(iter3): fetch W14 — Walton 2014 NASA-STD-7009 guidance (NTRS 20140017301)`.

**Side artifact:** at the end of this task, write `research/imm_sources/validation/W14_eight_factors_extracted.md` with the verbatim eight-factor names and the NASA-STD-7009 paragraph that defines each. This makes the V&V dossier in Phase 3E (Task 60) a paste job rather than a re-extraction.

---

### Task 28: Fetch S20 — Walton & Kerstman 2020 ISS quantification (firecrawl)

**Differences from Task 23:**

- Primary URL: resolve DOI `10.3357/AMHP.5432.2020` via firecrawl — *Aerospace Medicine and Human Performance* (AsMA journal).
- AsMA is paywalled. Fallback path: search Diego's Zotero (already covered by Task 29 as a probable hit on `"Walton Kerstman IMM"`).
- If both paths fail, flag the row `⚠ paywall — see zotero_imm/` and let Task 29 backfill it.
- Output: `research/imm_sources/validation/S20_walton_kerstman_2020_iss_quantification.md` + `.pdf`
- Frontmatter `spec_sections_supported`:
  - `"Section 9 V&V — analog of [S20] for analog-mission validation"`

Commit message stem: `research(iter3): fetch S20 — Walton & Kerstman 2020 ISS IMM quantification (AMHP)`.

---

### Task 29: zotero-pdf-ocr — IMM corpus from Diego's library

**Goal:** Pull anything IMM-related already in Diego's Zotero into the corpus. This (a) backfills S20 if Task 28 failed on the paywall, (b) catches IMM-adjacent papers (e.g., Minard 2011 medical-kit optimization, Boley 2019 IMM applications) Diego has already curated, and (c) is the **fastest path** to finding documents the spec does not yet cite but should.

**Files:**
- Create: `research/imm_sources/zotero_imm/<slug>.md` (one per hit, OCRed)
- Modify: `research/imm_sources/INDEX.md` — populate Tier 2 table

- [ ] **Step 1: Plan queries**

Six Zotero queries, run sequentially via the `zotero-pdf-ocr` skill:

1. `"Integrated Medical Model"`
2. `"IMM Bayesian"`
3. `"Antonsen medical risk"`
4. `"Gilkey Bayesian"`
5. `"NASA medical risk simulation"`
6. `"NASA-STD-7009"`

Document each query and its raw hit count before fetching, so a resumed agent can verify the corpus snapshot.

- [ ] **Step 2: Curate hits**

For each query's hit list:
- Include if the title or abstract mentions IMM, NASA medical risk, Bayesian risk model, PRA, or NASA-STD-7009 explicitly.
- Exclude if the paper is in `research/evidence/INDEX.md` already (avoid duplication with the I&C corpus).
- Cap at 15 papers total across all six queries — IMM literature is small; do not pad.

Write the curated list as `research/imm_sources/zotero_imm/_query_results.json`:

```json
{
  "queries": [
    {"query": "Integrated Medical Model", "hits": <int>, "selected": [<list of zotero keys>]},
    ...
  ],
  "curated_at_utc": "<ts>",
  "agent_run_id": "<task-29-run-N>"
}
```

- [ ] **Step 3: OCR via zotero-pdf-ocr skill**

For each selected key, call the skill — it handles Zotero → Koofr WebDAV → Mistral OCR end-to-end and writes the markdown with YAML frontmatter. Output goes to `research/imm_sources/zotero_imm/<slug>.md`.

Re-classify the frontmatter `classification` field to `zotero_imm` (the skill default may write something else; override).

- [ ] **Step 4: Update INDEX.md Tier 2 table**

Add one row per OCRed paper. If a paper backfills a Tier-1 row that previously had `⚠`, also update the Tier-1 status.

- [ ] **Step 5: Commit**

Single commit for the whole zotero-IMM batch:

```bash
git add research/imm_sources/zotero_imm/ research/imm_sources/INDEX.md
git commit -m "research(iter3): zotero-pdf-ocr — IMM corpus (Tier 2)"
```

- [ ] **Step 6: Update STATUS.md** — Task 29 DONE.

---

### Task 30: scite citation graph — inbound on G12, M18, A22

**Goal:** Use the scite MCP to pull the inbound citation graph for the three primary method papers. This catches IMM follow-on work that paper-search (Task 31) might miss because it doesn't search citation networks.

**Files:**
- Create: `research/imm_sources/citation_graph/scite_imm_g12_inbound.json`
- Create: `research/imm_sources/citation_graph/scite_imm_m18_inbound.json`
- Create: `research/imm_sources/citation_graph/scite_imm_a22_inbound.json`
- Create: `research/imm_sources/citation_graph/scite_imm_summary.md`

- [ ] **Step 1: scite authenticate** (one-time per session)

```
mcp__scite__authenticate
```

Follow the auth flow. Record the auth completion ts in `scite_imm_summary.md`.

- [ ] **Step 2: Fetch inbound citations**

For each of G12, M18, A22, call scite's citation-context endpoints. Save the raw JSON response. Note: G12 has no DOI (NASA technical paper); use the NTRS identifier or the closest DOI scite knows about — flag if not found.

- [ ] **Step 3: Synthesize**

Write `scite_imm_summary.md` with:
- Headline counts (inbound for each source).
- Top 5 supporting citations per source (citations classified as "supporting" by scite).
- Top 5 contrasting citations per source (citations classified as "contrasting"). Contrasting hits are HIGH PRIORITY — they may flag IMM model limitations the spec doesn't anticipate.
- A flagged-papers table: contrasting / mentioning citations that DO NOT appear in Tier 1, Tier 2, or paper-search Tier 4 — these are candidates Diego should personally review before Phase 3B.

- [ ] **Step 4: Commit + STATUS**

```bash
git add research/imm_sources/citation_graph/
git commit -m "research(iter3): scite citation graph on G12, M18, A22 (Tier 3)"
```
Update STATUS.md.

---

### Task 31: paper-search MCP — follow-on IMM and analog-risk literature

**Goal:** Catch peer-reviewed IMM follow-on papers, plus the broader literature on (a) hierarchical Poisson-Lognormal medical-risk models, (b) analog-mission medical risk, (c) PRA medical event trees. paper-search MCP searches across OpenAlex, Semantic Scholar, Europe PMC, PubMed, etc.

**Files:**
- Create: `research/imm_sources/follow_on/<slug>.md` (one per accepted hit)
- Modify: `research/imm_sources/INDEX.md` — populate Tier 4 table

- [ ] **Step 1: Plan queries**

Eight paper-search queries:

1. `"Integrated Medical Model" NASA`
2. `IMM "medical risk" spaceflight`
3. `hierarchical "Poisson-Lognormal" risk`
4. `analog mission medical risk Antarctic`
5. `probabilistic risk assessment medical event tree`
6. `"crew health index" simulation`
7. `Bayesian medical risk space`
8. `Boley OR Kerstman OR Antonsen OR Myers IMM`

- [ ] **Step 2: Run queries**

For each query, call `mcp__paper-search__search_papers` with `limit=20`. Save the raw response JSON to `research/imm_sources/follow_on/_search_<n>_<short-query>.json` (date-stamped).

- [ ] **Step 3: Curate**

Include criteria (any of):
- DOI is not already in Tier 1/2/3 OR `research/evidence/INDEX.md`.
- Title contains IMM, integrated medical model, crew health index, or analog medical risk.
- Cited by ≥ 5 other IMM-domain papers.

Exclude:
- Preprints with no peer-reviewed status (let scite/peer signal be the filter — preprints are fine for evidence corpus, less so for methodology grounding).
- Books and theses without a DOI (too hard to verify provenance).

Cap at 20 papers.

- [ ] **Step 4: OCR / Mistral**

For each curated hit, attempt PDF retrieval:
- Try `paper-search.download_with_fallback` first.
- If that fails, try `firecrawl-mcp.scrape` on the publisher URL.
- If both fail, save markdown with abstract only and flag `verified: false`.

OCR via Mistral (or, if Mistral OCR is rate-limited, defer to the next session — write a `_pending.json` snapshot so the resumed agent picks up where this one stopped).

- [ ] **Step 5: Frontmatter + INDEX**

Same YAML frontmatter shape as Tasks 23–28, with `classification: follow_on`. Populate the Tier 4 table in INDEX.md.

- [ ] **Step 6: Commit + STATUS**

```bash
git add research/imm_sources/follow_on/ research/imm_sources/INDEX.md
git commit -m "research(iter3): paper-search MCP — IMM follow-on literature (Tier 4)"
```
Update STATUS.md.

---

### Task 32: Verify every Tier 1 source against its DOI / NTRS landing page (manual + tavily)

**Goal:** A second-pass verification independent of firecrawl. For each of G12–S20, hit the DOI / NTRS landing page via `tavily` or `fetch` MCP and confirm the title, year, and authors match the markdown frontmatter. This catches the kind of metadata-drift bug that bit Iter-1 Task 21 (filename-guess DOIs, fabricated co-authors).

**Files:**
- Create: `research/imm_sources/_verification_audit.md`

- [ ] **Step 1: Audit each Tier-1 row**

For each of G12, M18, A22, K15, W14, S20:

```
mcp__tavily__tavily_search "<title verbatim>"
```

Confirm the first hit's title + year + first-author match the frontmatter. If it doesn't, flag `verified: false` in the markdown frontmatter and add an entry to `_verification_audit.md` with the discrepancy.

- [ ] **Step 2: Cross-check DOIs**

For sources with a DOI (A22, S20), call `mcp__paper-search__get_crossref_paper_by_doi`. The Crossref record is the canonical metadata source. If frontmatter and Crossref disagree, rewrite the frontmatter from Crossref.

- [ ] **Step 3: Commit + STATUS**

```bash
git add research/imm_sources/_verification_audit.md research/imm_sources/methods/ research/imm_sources/architecture/ research/imm_sources/validation/
git commit -m "research(iter3): verification audit — Tier 1 IMM sources"
```

---

### Task 33: Synthesize Phase 3.0 — `03_imm_methodology_synthesis.md`

**Goal:** One document that maps every Iter-3-spec mathematical block to the specific source quotation that justifies it. This is the deliverable that lets the methodology paper (Iter 4) write "Following [G12 §1.2]:" without hunting through the corpus.

**Files:**
- Create: `research/imm_sources/03_imm_methodology_synthesis.md`

- [ ] **Step 1: Spec → source map**

For each section of the Iter-3 spec (3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5, 6, 7, 9), write:

```markdown
### Spec §3.1 — Rate-dependent condition occurrence (Poisson)

**Selectron statement (verbatim from spec):**
> N_{k,m} | λ_k ~ Poisson(λ_k · t_m · c)
> with extension λ_{k,i} = λ_k^base · exp(β_k^T z_i)

**Primary source ([M18], pp. _–_):**
> "Generated incidence rates IMM ... for rate-dependent conditions are assumed
> constant for the duration of a simulated mission and event occurrences are
> governed by a Poisson Process (exponential waiting times between events)."

**Source file:** `methods/M18_myers_2018_imm_validation.md`, line _–_.

**Selectron-specific extension:** the candidate-vulnerability log-linear multiplier
exp(β_k^T z_i) is NOT in M18. Justification: standard PRA scaling convention
preserving Poisson conjugacy; precedent in Cox proportional-hazards (Cox 1972)
and Bayesian PRA (Apostolakis 2004). Add citation to Cox/Apostolakis in the
methodology paper.
```

Repeat for every spec section. This is mostly transcription + cross-referencing — not analysis.

- [ ] **Step 2: Flag spec claims with weak source grounding**

A spec claim is "weakly grounded" if its source quote is < 10 words verbatim, or if the source citation is to a follow-on paper rather than a primary IMM document. Each weakly-grounded claim gets a `⚠` row at the bottom of `03_imm_methodology_synthesis.md` with a recommendation: either (a) strengthen the citation in the spec, (b) explicitly call out the claim as a Selectron-specific extension, or (c) drop the claim.

- [ ] **Step 3: Commit + STATUS**

```bash
git add research/imm_sources/03_imm_methodology_synthesis.md
git commit -m "research(iter3): spec → source synthesis (closes Phase 3.0)"
```

Update STATUS.md: Task 33 DONE; Phase 3.0 complete; **gate before Phase 3A: Diego reviews `03_imm_methodology_synthesis.md` and resolves all `⚠` rows.**

---

### Task 34: Phase 3.0 acceptance gate (Diego)

**Goal:** Single explicit checkpoint. No code action — this is a manual review.

- [ ] **Step 1: Diego reads `03_imm_methodology_synthesis.md` end-to-end.**

- [ ] **Step 2: Diego resolves each `⚠` row** by editing the spec, the synthesis, or both.

- [ ] **Step 3: Diego signs off in STATUS.md:**

```bash
git commit --allow-empty -m "docs(iter3): Phase 3.0 ratified by Diego — Phase 3A may begin"
```

A no-op commit so the audit log carries the explicit gate.

---

## Part A — Phase 3A: Evidence extraction → `incidence_rates.csv`

This phase **does not start** until Task 34 is in. The output is a single CSV that drives the PyMC fit in Phase 3B.

### Task 35: Schema + extraction protocol

**Files:**
- Create: `research/evidence_extracted/SCHEMA.md`
- Create: `research/evidence_extracted/extraction_protocol.md`
- Create: `research/evidence_extracted/incidence_rates.proposals.csv` (header-only)
- Create: `research/evidence_extracted/incidence_rates.csv` (header-only)

- [ ] **Step 1: Write `SCHEMA.md`**

```markdown
# `incidence_rates.csv` — schema

| Column | Type | Description |
|---|---|---|
| condition_id | string | One of the 12 from Iter-3 spec §5 (e.g. "insomnia"). |
| mission_type | string | One of {antarctic, mars500, hi-seas, mdrs, emmpol, thor}. |
| study_doi | string | DOI or "—" if no DOI (only for Tier-1 IMM papers without DOI). |
| study_slug | string | Slug of source markdown in `research/evidence/` or `research/imm_sources/`. |
| person_days | integer | Total exposure (crew × days). |
| events | integer | Count of incidents observed in person_days. |
| notes | string | Free text. If person_days is estimated (not explicit), prefix "EST: ". |
| extracted_by | string | "Diego" or "subagent-proposal" (only Diego may flip to "Diego"). |
| extracted_at_utc | ISO-8601 | Timestamp of extraction or proposal. |
```

- [ ] **Step 2: Write `extraction_protocol.md`** with the rules:
  - Person-days = crew size × mission days IF the study reports both. If only one, derive the other from a co-cited mission profile.
  - Events count incidents, not severity-weighted contributions.
  - One row per (condition_id, mission_type, study) triple — multiple rows per study allowed if the study reports multiple conditions.
  - Subagents may propose rows into `.proposals.csv`. Only Diego promotes a row from proposals → final by writing the row into `incidence_rates.csv` and setting `extracted_by = "Diego"`.
  - Indeterminate rows (person-days not extractable) go to `.proposals.csv` with `events = NULL` and a note. They are excluded from the fit.

- [ ] **Step 3: Commit + STATUS**

---

### Task 36: Subagent-staged proposals (controller dispatches subagents per source)

Subagents pull from `research/evidence/` (the 31-paper I&C corpus) and `research/imm_sources/`, propose rows into `incidence_rates.proposals.csv`, and DO NOT commit to `incidence_rates.csv`.

- [ ] **Step 1: Dispatch one subagent per source bucket:**

| Subagent | Sources |
|---|---|
| P-A | I&C Tier-1 (11 papers) |
| P-B | I&C Tier-2 (20 papers) |
| P-C | IMM Tier-1 + Tier-2 (G12, M18, A22, K15, W14, S20, zotero_imm/*) |
| P-D | IMM Tier-3 + Tier-4 (citation graph + follow-on) |

Each subagent receives:
- The schema and protocol from Task 35.
- A read-only file list of its source bucket.
- An instruction to write rows to `.proposals.csv` only.

- [ ] **Step 2: Subagents commit their proposals**

Each subagent: `research(iter3): Phase 3A proposals — bucket <X>`.

---

### Task 37: Diego curates → `incidence_rates.csv`

- [ ] **Step 1: Diego reads `.proposals.csv` row by row.**

- [ ] **Step 2: For each row, Diego either:**
  - Copies to `incidence_rates.csv` with `extracted_by = "Diego"` (accepting), or
  - Annotates the proposal row's notes column with `REJECTED: <reason>` and leaves it in `.proposals.csv` (rejecting).

This is slow and unavoidable — per IMM team practice ([M18 §3] "Subject matter experts assess the quality of the medical data...iMED management enforces a strict configuration management process").

- [ ] **Step 3: Commit:**

```bash
git commit -m "research(iter3): Phase 3A — incidence_rates.csv curated (n=<rows> rows, <missions> mission types, <conditions> conditions)"
```

---

### Task 38: Extraction audit + readiness sign-off

**Files:**
- Create: `research/evidence_extracted/extraction_audit.md`

- [ ] **Step 1: For each accepted row, write one line in `extraction_audit.md`** with: study DOI, condition, mission type, person-days, events, page reference in source markdown, Diego's confidence (high/medium/low).

- [ ] **Step 2: Coverage check.** Confirm:
  - Every condition in spec §5 has ≥ 1 row in ≥ 1 mission type, OR is explicitly excluded from the fit (with reason) in `extraction_audit.md`.
  - Every mission type in spec §6 has ≥ 1 row in ≥ 3 conditions, OR is excluded.

- [ ] **Step 3: Sign-off commit.**

```bash
git commit --allow-empty -m "docs(iter3): Phase 3A ratified — incidence_rates.csv ready for PyMC fit"
```

---

## Part B — Phase 3B: Offline PyMC fit + JAGS cross-check

### Task 39: Bootstrap the offline-fit venv

**Files:**
- Create: `~/.venvs/selectron-imm/` (venv; not in repo)
- Create: `notebooks/requirements.txt`
- Create: `notebooks/README.md`

- [ ] **Step 1: Create venv.**

```bash
python3 -m venv ~/.venvs/selectron-imm
source ~/.venvs/selectron-imm/bin/activate
pip install --upgrade pip
```

- [ ] **Step 2: Write `notebooks/requirements.txt`:**

```
pymc==5.16.2
arviz==0.18.0
numpy>=1.26,<2.0
pandas>=2.2
matplotlib>=3.8
pyjags==1.3.8     # for cross-check
nutpie==0.13      # optional faster NUTS
jupyterlab
```

Install:
```bash
pip install -r notebooks/requirements.txt
```

- [ ] **Step 3: Write `notebooks/README.md`** — venv setup instructions, JAGS system-package note (JAGS itself is a C library; `apt install jags`).

- [ ] **Step 4: Commit + STATUS.**

---

### Task 40: `iter3_imm_fit.ipynb` — main PyMC notebook

**Files:**
- Create: `notebooks/iter3_imm_fit.ipynb`

- [ ] **Step 1: Cell 1 — imports + load CSV**

```python
import pymc as pm
import numpy as np
import pandas as pd
import arviz as az
from pathlib import Path

REPO = Path.cwd().parent
df = pd.read_csv(REPO / "research/evidence_extracted/incidence_rates.csv")
assert (df["extracted_by"] == "Diego").all(), "All rows must be Diego-accepted"
df["condition_idx"] = pd.Categorical(df["condition_id"]).codes
df["mission_idx"] = pd.Categorical(df["mission_type"]).codes
n_conditions = df["condition_id"].nunique()
n_missions = df["mission_type"].nunique()
print(f"{len(df)} rows, {n_conditions} conditions, {n_missions} missions")
```

- [ ] **Step 2: Cell 2 — model definition (verbatim from Iter-3 spec §3.6, hierarchical extension)**

```python
with pm.Model(coords={"condition": df["condition_id"].unique(),
                       "mission": df["mission_type"].unique(),
                       "obs": np.arange(len(df))}) as imm_analog:
    mu = pm.Normal("mu_lograte", mu=0, sigma=10, dims="condition")
    tau = pm.HalfCauchy("tau_lograte", beta=2.5, dims="condition")

    log_lambda = pm.Normal(
        "log_lambda",
        mu=mu[df["condition_idx"].values],
        sigma=tau[df["condition_idx"].values],
        dims="obs",
    )
    rate = pm.math.exp(log_lambda) * df["person_days"].values
    pm.Poisson("events_obs", mu=rate, observed=df["events"].values, dims="obs")
```

- [ ] **Step 3: Cell 3 — sample**

```python
with imm_analog:
    trace = pm.sample(
        draws=4000, tune=2000, chains=4,
        target_accept=0.95, random_seed=0xC0FFEE,
        return_inferencedata=True,
    )
trace.to_netcdf(REPO / "notebooks/iter3_imm_fit.trace.nc")  # checkpoint
```

The `.to_netcdf` checkpoint is **non-negotiable**. If the next cell crashes, we don't re-run a 30-min sample.

- [ ] **Step 4: Cell 4 — convergence assertions ([G12] / [M18] rules)**

```python
summary = az.summary(trace, var_names=["mu_lograte", "tau_lograte"])
assert (summary["r_hat"] < 1.01).all(), summary[summary["r_hat"] >= 1.01]
assert (summary["ess_bulk"] > 1000).all(), summary[summary["ess_bulk"] <= 1000]
print("converged: r-hat <1.01, ESS >1000 on all parameters")
```

- [ ] **Step 5: Cell 5 — export `priors.json`**

```python
import json

priors = {
    "model_version": "iter3-v1",
    "fitted_at": pd.Timestamp.utcnow().isoformat(),
    "pyMC_version": pm.__version__,
    "r_hat_max": float(summary["r_hat"].max()),
    "ess_min": int(summary["ess_bulk"].min()),
    "conditions": {},
}

for cond in df["condition_id"].unique():
    priors["conditions"][cond] = {"missions": {}, "vulnerability_beta": {},
                                   "worst_case_prob_q": None,
                                   "treated_lost_days_mean": None,
                                   "untreated_lost_days_mean": None}
    for miss in df["mission_type"].unique():
        # thin to 1000 posterior samples per (condition, mission)
        # (mask trace["log_lambda"] by the obs rows matching this (cond, miss))
        mask = (df["condition_id"] == cond) & (df["mission_type"] == miss)
        if not mask.any():
            continue
        obs_idx = np.where(mask)[0]
        # average across observations for this (cond, miss) cell — simple posterior summary
        samples = trace.posterior["log_lambda"].values[..., obs_idx].mean(axis=-1).flatten()
        thinned = samples[:: max(1, len(samples) // 1000)][:1000]
        priors["conditions"][cond]["missions"][miss] = {
            "log_lambda_samples": thinned.tolist(),
            "mean_log_lambda": float(thinned.mean()),
            "sd_log_lambda": float(thinned.std()),
        }

(REPO / "src/risk/priors.json").write_text(json.dumps(priors, indent=2))
print(f"wrote {(REPO/'src/risk/priors.json').stat().st_size / 1024:.1f} KB")
```

Note: this cell does not yet write `vulnerability_beta`, `worst_case_prob_q`, `treated_lost_days_mean`, `untreated_lost_days_mean` — those are Task 41 (manual elicitation by Diego from evidence tables).

- [ ] **Step 6: Commit notebook (cells executed)**

```bash
git add notebooks/iter3_imm_fit.ipynb src/risk/priors.json
git commit -m "feat(iter3): PyMC hierarchical Poisson-Lognormal fit on analog corpus"
```

- [ ] **Step 7: STATUS.**

---

### Task 41: Hand-elicit `vulnerability_beta`, `worst_case_prob_q`, lost-day distributions

Diego edits `src/risk/priors.json` directly, using the A3/A4/A5 evidence tables as source. This is **not** an MCMC fit — it is hand-elicitation, per spec §11 Risk 3 (the corpus reports group aggregates, not individual-level data).

**Files:**
- Modify: `src/risk/priors.json`
- Create: `research/imm_sources/_beta_elicitation_audit.md`

- [ ] **Step 1: For each condition,** Diego writes one paragraph in `_beta_elicitation_audit.md` justifying the chosen β values from the evidence-table effect sizes. Example: `β[neuroticism] for depression-anxiety = +0.40 — Palinkas 2004 reports SMD = 0.41 for neuroticism predicting psychiatric incident in Antarctic winter-over; log-rate scaling consistent with Cox-style multiplier.`

- [ ] **Step 2: Edit priors.json** with the elicited values.

- [ ] **Step 3: Schema validation.** Add a JSON-schema check (Task 50 below) to catch malformed priors at TS engine load time.

- [ ] **Step 4: Commit + STATUS.**

---

### Task 42: `iter3_jags_crosscheck.ipynb` — JAGS sanity-check on subset

Cross-validation per Iter-3 spec §7: confirm NUTS posterior summaries match Gibbs to within Monte Carlo error on a 4-conditions × 3-missions subset.

**Files:**
- Create: `notebooks/iter3_jags_crosscheck.ipynb`

- [ ] **Step 1: Re-implement the same model in JAGS via `pyjags`** on a subset of 4 conditions × 3 mission types.

- [ ] **Step 2: Compare** posterior mean and sd of `mu_lograte` and `tau_lograte` between PyMC (Task 40) and JAGS. Assert agreement within MC error (< 5%, per [G12]).

- [ ] **Step 3: Commit + STATUS.**

---

### Task 43: Phase 3B sign-off

- [ ] **Step 1: Diego confirms** convergence diagnostics and JAGS cross-check both pass; signs off via empty commit `docs(iter3): Phase 3B ratified — priors.json frozen`.

---

## Part C — Phase 3C: TS Stage-B engine (TDD, math first)

The pattern follows Iter-1 Part B: red → green → refactor → commit per math module. Each task is one module. The full test suite stays green at every commit.

### Task 44: Extend `SelectronErrorCode` union for risk module

**Files:**
- Modify: `src/engine/errors.ts` — extend the union with `"E_BAD_MISSION" | "E_BAD_CONDITION" | "E_BAD_PRIOR"`.
- Modify: `tests/engine/errors.test.ts` — add 3 new test cases (one per new code).

- [ ] **Step 1: Failing test.**

```typescript
// tests/engine/errors.test.ts
test("SelectronError accepts E_BAD_MISSION", () => {
  const e = new SelectronError("E_BAD_MISSION", "bad mission");
  expect(e.code).toBe("E_BAD_MISSION");
});
test("SelectronError accepts E_BAD_CONDITION", () => {
  const e = new SelectronError("E_BAD_CONDITION", "bad condition");
  expect(e.code).toBe("E_BAD_CONDITION");
});
test("SelectronError accepts E_BAD_PRIOR", () => {
  const e = new SelectronError("E_BAD_PRIOR", "bad prior");
  expect(e.code).toBe("E_BAD_PRIOR");
});
```

- [ ] **Step 2: Run, expect fail (typecheck).**

- [ ] **Step 3: Extend union in `src/engine/errors.ts`.**

- [ ] **Step 4: Run, expect pass; commit.**

---

### Task 45: `src/types/risk.ts` — AnalogMission, Condition, RiskPosterior

**Files:**
- Create: `src/types/risk.ts` (heredocs verbatim from spec §4.3).
- Modify: `src/types/index.ts` — barrel re-export.

- [ ] **Step 1: Write the file** with the three types verbatim from Iter-3 spec §4.3.

- [ ] **Step 2: `npx tsc --noEmit src/types/risk.ts`** — expect 0 errors.

- [ ] **Step 3: Commit.**

---

### Task 46: `src/data/analog-missions.ts` — 5 mission profiles

**Files:**
- Create: `src/data/analog-missions.ts` (5 entries from spec §6).
- Create: `tests/data/analog-missions.test.ts` (basic shape tests).

- [ ] **Step 1: Failing test** — assert array length 5, all ids unique, durations > 0, citations non-empty.

- [ ] **Step 2: Write the data** verbatim from spec §6.

- [ ] **Step 3: Pass, commit.**

---

### Task 47: `src/risk/conditions.ts` — 12-condition catalog

**Files:**
- Create: `src/risk/conditions.ts` (12 entries from spec §5).
- Create: `tests/risk/conditions.test.ts`.

- [ ] **Step 1: Failing test** — assert array length 12, kinds ∈ {rate, event}, every condition's `vulnerabilityCriteria` references a valid criterion id from `src/data/placeholderCriteria.ts` or `docs/criteria.md` (Iter-2 ratified). Use the `getCriteria()` helper from Iter 1.

- [ ] **Step 2: Write conditions** verbatim from spec §5.

- [ ] **Step 3: Pass, commit.**

---

### Task 48: `src/risk/incidence.ts` — Poisson + Binomial samplers with vulnerability multiplier

**Files:**
- Create: `src/risk/incidence.ts`.
- Create: `tests/risk/incidence.test.ts`.

- [ ] **Step 1: Failing test — Poisson sampler mean/variance.**

```typescript
import { samplePoisson, sampleBinomial, applyVulnerabilityMultiplier } from "../../src/risk/incidence";
import { makeRng } from "../../src/engine/prng";

test("samplePoisson approximates mean=variance=λ for large λ", () => {
  const rng = makeRng(0xabcde);
  const lambda = 5.0;
  const N = 50000;
  let sum = 0, sumSq = 0;
  for (let i = 0; i < N; i++) {
    const x = samplePoisson(rng, lambda);
    sum += x; sumSq += x * x;
  }
  const mean = sum / N;
  const variance = sumSq / N - mean * mean;
  expect(Math.abs(mean - lambda) / lambda).toBeLessThan(0.02);
  expect(Math.abs(variance - lambda) / lambda).toBeLessThan(0.05);
});

test("sampleBinomial mean/variance match closed-form", () => {
  const rng = makeRng(0xabcde);
  const n = 20, p = 0.3;
  const N = 50000;
  let sum = 0, sumSq = 0;
  for (let i = 0; i < N; i++) {
    const x = sampleBinomial(rng, n, p);
    sum += x; sumSq += x * x;
  }
  const mean = sum / N;
  const variance = sumSq / N - mean * mean;
  expect(Math.abs(mean - n * p) / (n * p)).toBeLessThan(0.02);
  expect(Math.abs(variance - n * p * (1 - p)) / (n * p * (1 - p))).toBeLessThan(0.05);
});

test("applyVulnerabilityMultiplier matches exp(β·z)", () => {
  const baseLambda = 0.01;
  const beta = { neuroticism: 0.4, agreeableness: -0.2 };
  const z = { neuroticism: 1.5, agreeableness: -1.0 };
  const out = applyVulnerabilityMultiplier(baseLambda, beta, z);
  const expected = 0.01 * Math.exp(0.4 * 1.5 + -0.2 * -1.0);
  expect(out).toBeCloseTo(expected, 12);
});
```

- [ ] **Step 2: Run, expect fail.**

- [ ] **Step 3: Implement.**

Use Knuth's Poisson for λ < 30 and the PTRD (transformed rejection) algorithm for λ ≥ 30 (Hörmann 1993). For Binomial, BTPE algorithm (Kachitvichyanukul & Schmeiser 1988) for n·p ≥ 10; inversion for small n. Multiplier is straight `exp(Σ β·z)`. Cite the algorithms in code comments only if the reviewer asks — Diego prefers no comments unless WHY is non-obvious.

```typescript
import type { Rng } from "../engine/prng";

export function samplePoisson(rng: Rng, lambda: number): number {
  if (lambda < 30) {
    // Knuth's multiplicative algorithm
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do {
      k++;
      p *= rng();
    } while (p > L);
    return k - 1;
  }
  // PTRD for large λ
  // ... (full implementation in the actual task; cite Hörmann 1993 in commit message)
  const c = 0.767 - 3.36 / lambda;
  const beta = Math.PI / Math.sqrt(3.0 * lambda);
  const alpha = beta * lambda;
  const k = Math.log(c) - lambda - Math.log(beta);
  while (true) {
    const u = rng();
    const x = (alpha - Math.log((1.0 - u) / u)) / beta;
    const n = Math.floor(x + 0.5);
    if (n < 0) continue;
    const v = rng();
    const y = alpha - beta * x;
    const lhs = y + Math.log(v / Math.pow(1.0 + Math.exp(y), 2));
    const rhs = k + n * Math.log(lambda) - logGamma(n + 1);
    if (lhs <= rhs) return n;
  }
}

function logGamma(x: number): number {
  // Stirling-Lanczos; reuse from engine if already defined
  ...
}

export function sampleBinomial(rng: Rng, n: number, p: number): number {
  if (n * Math.min(p, 1 - p) < 10) {
    // direct inversion via Bernoulli trials (n small)
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }
  // BTPE — full implementation in actual task
  ...
}

export function applyVulnerabilityMultiplier(
  baseLambda: number,
  beta: Record<string, number>,
  z: Record<string, number>,
): number {
  let dot = 0;
  for (const key of Object.keys(beta)) {
    if (z[key] !== undefined) dot += beta[key] * z[key];
  }
  return baseLambda * Math.exp(dot);
}
```

The full PTRD / BTPE implementations are well-trodden; the implementer pastes them from the cited algorithm papers (or the GSL C source, which is GPL — write from scratch citing the paper to avoid license bleed).

- [ ] **Step 4: Run, expect pass.**

- [ ] **Step 5: Commit.**

---

### Task 49: `src/risk/progression.ts` — Bernoulli severity branching

Short task — Bernoulli sampler + per-condition `q_k` lookup from `priors.json`.

**Files:**
- Create: `src/risk/progression.ts`.
- Create: `tests/risk/progression.test.ts`.

- [ ] **Step 1: Failing test** — Bernoulli mean within 2% of q over 50k samples; structural error on q ∉ [0,1].

- [ ] **Step 2: Implement.**

```typescript
import type { Rng } from "../engine/prng";
import { SelectronError } from "../engine/errors";

export function sampleSeverity(rng: Rng, q: number): 0 | 1 {
  if (q < 0 || q > 1 || !Number.isFinite(q)) {
    throw new SelectronError("E_BAD_PRIOR", `worst_case_prob_q out of [0,1]: ${q}`);
  }
  return rng() < q ? 1 : 0;
}
```

- [ ] **Step 3: Pass + commit.**

---

### Task 50: `src/risk/treatment.ts` — partial-credit interpolation + JSON-schema validator for priors

**Files:**
- Create: `src/risk/treatment.ts`.
- Create: `src/risk/priorsSchema.ts` (JSON-schema validator — no external lib; hand-rolled type guard).
- Create: `tests/risk/treatment.test.ts`.
- Create: `tests/risk/priorsSchema.test.ts`.

- [ ] **Step 1: Failing test — partial-credit interpolation.**

```typescript
test("partial-credit interpolation is linear in τ", () => {
  const d_untreated = 14;
  const d_treated = 3;
  expect(lostDays(d_untreated, d_treated, 0.0)).toBe(14);
  expect(lostDays(d_untreated, d_treated, 1.0)).toBe(3);
  expect(lostDays(d_untreated, d_treated, 0.5)).toBeCloseTo(8.5, 12);
});
```

- [ ] **Step 2: Implement.**

```typescript
export function lostDays(
  d_untreated: number,
  d_treated: number,
  tau: number,
): number {
  if (tau < 0 || tau > 1) throw new SelectronError("E_BAD_PRIOR", `tau out of [0,1]: ${tau}`);
  return (1 - tau) * d_untreated + tau * d_treated;
}
```

- [ ] **Step 3: JSON-schema validator** — type guard over `priors.json` that validates:
  - `model_version` is a string.
  - `conditions` is an object whose every value has `missions`, `vulnerability_beta`, `worst_case_prob_q ∈ [0,1]`, `treated_lost_days_mean > 0`, `untreated_lost_days_mean > 0`.
  - `missions` values have `log_lambda_samples` of length 1000.

Throw `SelectronError("E_BAD_PRIOR", …)` on any failure.

- [ ] **Step 4: Pass + commit.**

---

### Task 51: `src/risk/chi.ts` — CHI, QTL, pEarlyTermination aggregation

**Files:**
- Create: `src/risk/chi.ts`.
- Create: `tests/risk/chi.test.ts`.

- [ ] **Step 1: Failing test:**

```typescript
test("CHI is bounded in [0, 1]", () => {
  expect(computeCHI(0, 100)).toBe(1);
  expect(computeCHI(100, 100)).toBe(0);
  expect(() => computeCHI(101, 100)).toThrow(SelectronError);
});

test("QTL is non-negative and sums across (i, k, j)", () => {
  const occurrences = [
    { lostDays: 3 }, { lostDays: 5 }, { lostDays: 0 },
  ];
  expect(computeQTL(occurrences)).toBe(8);
});

test("pEarlyTermination is fraction of trials with CHI <= chi*", () => {
  const chis = [0.9, 0.6, 0.8, 0.5, 0.95];
  expect(computePEarlyTermination(chis, 0.7)).toBeCloseTo(2 / 5);
});
```

- [ ] **Step 2: Implement** — straight transcription of spec §3.5 formulas.

- [ ] **Step 3: Pass + commit.**

---

### Task 52: `src/risk/simulate.ts` — main entry point `runMissionTrial`

**Files:**
- Create: `src/risk/simulate.ts`.
- Create: `tests/risk/simulate.test.ts`.

- [ ] **Step 1: Failing test — determinism by seed.**

```typescript
test("same seed → identical posterior", () => {
  const r1 = simulateMission(crew, mission, priors, { seed: 0xc0ffee, trials: 1000 });
  const r2 = simulateMission(crew, mission, priors, { seed: 0xc0ffee, trials: 1000 });
  expect(r1.chi.mean).toBe(r2.chi.mean);
  expect(r1.pEarlyTermination.mean).toBe(r2.pEarlyTermination.mean);
});
```

- [ ] **Step 2: Convergence test** — [M18] §2.2.2 rule: σ change over the last two 1,000-trial increments < 5%. Run 100k trials; assert the rule holds at the 99k-vs-100k boundary.

- [ ] **Step 3: Implement** — wire together incidence (Task 48), progression (Task 49), treatment (Task 50), chi (Task 51) into one mission trial loop. Inner loop is 4-step Monte Carlo per [A22]:

```typescript
export function runMissionTrial(
  crew: Candidate[],
  mission: AnalogMission,
  priors: PriorsJSON,
  conditions: Condition[],
  rng: Rng,
): { chi: number; qtl: number; perCondition: Record<string, number> } {
  let totalQTL = 0;
  const perCondition: Record<string, number> = {};

  for (const c of conditions) {
    for (const member of crew) {
      const condPrior = priors.conditions[c.id];
      const missionPrior = condPrior.missions[mission.type];
      if (!missionPrior) continue;
      const logLambda = sampleFromPosterior(rng, missionPrior.log_lambda_samples);
      const baseLambda = Math.exp(logLambda);
      const z = vulnerabilityVector(member, c.vulnerabilityCriteria);
      const lambda_i = applyVulnerabilityMultiplier(baseLambda, condPrior.vulnerability_beta, z);

      let N = 0;
      if (c.kind === "rate") {
        N = samplePoisson(rng, lambda_i * mission.durationDays);
      } else {
        N = sampleBinomial(rng, mission.evaCount, lambda_i);  // p ≡ lambda_i for event-trigger
      }
      for (let j = 0; j < N; j++) {
        const severity = sampleSeverity(rng, condPrior.worst_case_prob_q);
        const tau = treatmentFraction(c.id, mission);
        const d_treated = condPrior.treated_lost_days_mean;
        const d_untreated = condPrior.untreated_lost_days_mean;
        const dj = lostDays(d_untreated, d_treated, tau) * (severity === 1 ? 1.5 : 1.0);
        totalQTL += dj;
        perCondition[c.id] = (perCondition[c.id] ?? 0) + dj;
      }
    }
  }

  const chi = computeCHI(totalQTL, mission.durationDays * mission.crewSize);
  return { chi, qtl: totalQTL, perCondition };
}
```

- [ ] **Step 4: Top-level `simulateMission`** — runs T trials, computes mean + CI from the samples, returns `RiskPosterior`.

- [ ] **Step 5: Pass + commit.**

---

### Task 53: `src/risk/index.ts` barrel + full-suite sanity

**Files:**
- Create: `src/risk/index.ts`.

- [ ] **Step 1: Barrel re-export** of all `src/risk/*.ts` modules.

- [ ] **Step 2: Run** `npm test` — expect 8 prior suites + N new suites all pass.

- [ ] **Step 3: Run** `npm run typecheck` — expect only the expected deferred App.tsx error (none yet for Risk panel — that's Task 57).

- [ ] **Step 4: Commit.**

---

## Part D — Phase 3D: UI — Mission risk tab

### Task 54: `src/ui/components/MissionPicker.tsx`

Controlled dropdown over the 5 mission profiles. Calls `onChange(mission)`.

**Files:**
- Create: `src/ui/components/MissionPicker.tsx`.

- [ ] **Step 1: Heredoc the component** (presentational; no test needed beyond a smoke render).

```tsx
import type { AnalogMission } from "../../types/risk";

export function MissionPicker(props: {
  missions: AnalogMission[];
  selected: AnalogMission | null;
  onChange: (m: AnalogMission) => void;
}) {
  return (
    <select
      className="px-3 py-2 border rounded-md bg-white"
      value={props.selected?.id ?? ""}
      onChange={(e) => {
        const m = props.missions.find((mm) => mm.id === e.target.value);
        if (m) props.onChange(m);
      }}
    >
      <option value="">— select analog mission —</option>
      {props.missions.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} ({m.durationDays}d, n={m.crewSize})
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 2: Commit.**

---

### Task 55: `src/ui/components/RiskCard.tsx`

Presentational; shows CHI mean + CI90, pEarlyTermination mean + CI90, expected lost crew-days mean + CI90.

**Files:**
- Create: `src/ui/components/RiskCard.tsx`.

- [ ] **Step 1: Heredoc the component** — mirrors Iter-1 `ScoreCard.tsx` layout.

- [ ] **Step 2: Commit.**

---

### Task 56: `src/ui/components/ConditionContribution.tsx` + `RiskHistogram.tsx`

Stacked bar of per-condition QTL contribution + ECharts histogram of CHI posterior.

**Files:**
- Create: `src/ui/components/ConditionContribution.tsx`.
- Create: `src/ui/components/RiskHistogram.tsx`.

- [ ] **Step 1: Heredoc both components.** `RiskHistogram.tsx` reuses the ECharts core registration from Iter-1 `PosteriorPlot.tsx`.

- [ ] **Step 2: Commit.**

---

### Task 57: Wire Risk tab into `App.tsx`

**Files:**
- Modify: `src/App.tsx`.

- [ ] **Step 1:** Add a tab strip with `["Selection", "Mission risk"]`. Default to "Selection". On "Mission risk" tab, render: MissionPicker + RiskCard + ConditionContribution + RiskHistogram.

- [ ] **Step 2: Stage A → Stage B wiring** — when the user selects a mission, call `simulateMission(currentCrew, mission, PRIORS, CONDITIONS, { seed: 0xc0ffee, trials: 100000 })` and pass the `RiskPosterior` down.

- [ ] **Step 3:** `npm run build` — expect green.

- [ ] **Step 4: Smoke** — `curl localhost:5173 | grep "Mission risk"` — expect the tab label in the HTML.

- [ ] **Step 5: Commit.**

---

### Task 58: Manual UI sanity (Diego)

- [ ] **Step 1:** Diego opens `http://localhost:5173`, picks a synthetic crew (Iter 2 candidate list), switches to "Mission risk" tab, selects each of the 5 missions, confirms CHI / pET / per-condition stacked bar render and update.

- [ ] **Step 2: Sign-off commit** `docs(iter3): manual UI sanity — Mission risk tab green`.

---

## Part E — Phase 3E: Acceptance + V&V dossier

### Task 59: Iter-3 full-suite acceptance

- [ ] **Step 1: `npm test`** — expect 21 (Iter-1) + N (Iter-2) + ~20 (Iter-3) suites all pass.

- [ ] **Step 2: `npm run typecheck`** — exit 0.

- [ ] **Step 3: `npm run build`** — expect `dist/index.html` + bundle.

- [ ] **Step 4: Convergence check** — re-run Phase 3B notebook from cold; assert `priors.json` byte-identical (deterministic seed). Document any drift.

- [ ] **Step 5: Commit empty release marker** `release(iter3): full suite + smoke green`.

---

### Task 60: V&V dossier per NASA-STD-7009 [W14]

**Files:**
- Create: `docs/iter3_vv_dossier.md`.

Use the table from Iter-3 spec §9 verbatim. For each of the eight credibility factors, write one paragraph citing the specific Iter-3 artifact (test file, notebook cell, INDEX row) that satisfies the factor. The verbatim eight-factor names come from `research/imm_sources/validation/W14_eight_factors_extracted.md` (Task 27 side artifact).

- [ ] **Step 1: Draft.**

- [ ] **Step 2: Diego review.**

- [ ] **Step 3: Commit + STATUS.**

---

### Task 61: Sensitivity-analysis side study

Per spec §9 Factor 6: rerun forward MC with `τ_k` scaled by {0.5, 1, 2}. Report mission-ranking rank-stability across the three scenarios. One additional notebook + a short markdown writeup.

**Files:**
- Create: `notebooks/iter3_sensitivity.ipynb`.
- Create: `docs/iter3_sensitivity_results.md`.

- [ ] **Step 1: Notebook.** Load the trace from Task 40's `.nc` checkpoint, generate three alternative `priors.json` (`priors.json.tau_half`, `.tau_double`), and re-run `simulateMission` on the canonical crew × 5 missions for each.

- [ ] **Step 2: Rank-stability writeup.** Spearman ρ between rankings under different τ scalings, per-mission CHI shift, recommended Iter-4 paper paragraph.

- [ ] **Step 3: Commit.**

---

### Task 62: Iter-3 release

- [ ] **Step 1:** Diego reviews everything.

- [ ] **Step 2: Empty release commit** `release(iter3): Stage B (risk module) shipped`.

- [ ] **Step 3: Tag** `git tag iter3-v1`.

- [ ] **Step 4: STATUS.md** — flip every Iter-3 row to DONE, set Current state to `Iter 3 shipped; Iter 4 (paper) is the next iteration; this branch ready to merge to master.`

---

## Cross-cutting reminders

- **All exports → `/root/repos/exports/`** when generating ad-hoc files outside the repo, per workspace convention.
- **Commits:** Diego is sole author. No `Co-Authored-By` lines. Use `feat:` / `fix:` / `docs:` / `research:` / `chore:` / `release:` prefixes.
- **No journal-disclosure of AI assistance** for any manuscript output from this iteration (per `/root/repos/CLAUDE.md` § "Generative-AI manuscript policy"). This applies to Iter 4 (paper); does not affect Iter 3 code.
- **Phase 3.0 evidence accumulation is the linchpin of disconnection-resilience.** If a session dies at any point in Tasks 22–34, the next session reads `research/imm_sources/INDEX.md`, sees which rows are `✅` vs `…` vs `⚠`, and resumes from the first non-`✅` row. No re-derivation of provenance.

---

## Self-review

**Spec coverage.** Walked each section of `2026-05-18-selectron-iter3-risk.md`:

- §1 What Iter 3 adds → Tasks 44–53 build the engine; Tasks 54–57 the UI.
- §2 Novelty → Phase 3.0 (Tasks 22–34) builds the corpus that grounds the novelty claim; Iter 4 (out of scope) writes the paper.
- §3 Mathematical models (3.1–3.6) → Tasks 48 (Poisson + Binomial), 49 (Bernoulli severity), 50 (treatment), 51 (CHI/QTL), 52 (4-step trial), 40 (MCMC fit). Each spec subsection has a matching task.
- §4 Module map → Tasks 45–53 create the files listed.
- §5 12-condition catalog → Task 47.
- §6 5 mission profiles → Task 46.
- §7 PyMC notebook spec → Tasks 39–42.
- §8 UI extensions → Tasks 54–57.
- §9 V&V eight factors → Tasks 27 (extracts the factor list), 60 (dossier), 61 (sensitivity).
- §10 Phase sequencing → Parts 0/A/B/C/D/E mirror spec phases 3.0/3A/3B/3C/3D/3E.
- §11 Risks → curation throughput (Task 37 is Diego-only), between-analog heterogeneity (Task 40 model handles it via partial pooling), vulnerability coefficients (Task 41 explicit hand-elicitation + audit), out-of-scope validation (Task 60 dossier discloses internal-only validation).
- §12 Open questions → Task 34 acceptance gate forces Diego to resolve them before Phase 3A starts.
- §13 Iter 1/2 untouched → Tasks 44 only extends `SelectronErrorCode` (additive); Tasks 45+ add new files. No Iter-1 file is modified.

**Placeholder scan.** Three intentional placeholders remain:

- Task 48 Step 3 has an inline `// PTRD for large λ` skeleton with `...` markers for the full Hörmann 1993 algorithm. The implementer pastes the complete algorithm from the cited paper. This is intentional — pasting a 60-line acceptance-rejection routine into a plan would obscure the structure. **Resolution:** implementer reads Hörmann (1993) *ACM TOMS* 19(2):137–146 and translates from the published algorithm.
- Task 48 Step 3 has `logGamma(x: number)` with a `...` body. **Resolution:** reuse Stirling/Lanczos from `src/engine/gamma.ts` if already exported, else port from Numerical Recipes §6.1.
- Task 50 JSON-schema validator is described in prose but not heredoc'd. **Resolution:** straight type-guard with explicit checks; ~30 lines. Implementer writes it from the schema enumeration in the same step.

These three placeholders are bounded (`<= 100 lines` each, well-trodden algorithms with clear citations) and the implementer has full latitude. They are NOT plan failures — they are deliberate underspecification of well-known recipes.

**Type consistency.** Spot-checked:
- `Candidate` is the Iter-1 type, reused by Task 52 (`crew: Candidate[]`).
- `AnalogMission`, `Condition`, `RiskPosterior` defined in Task 45 (spec §4.3 verbatim) and consumed by Tasks 46, 47, 52 with matching signatures.
- `Rng` is the Iter-1 type, threaded through Tasks 48, 49, 51, 52.
- `SelectronError` (Iter-1) extended in Task 44 with three new codes that are then thrown in Tasks 49 (`E_BAD_PRIOR`), 50 (`E_BAD_PRIOR`), and 51 (`E_BAD_PRIOR`) — `E_BAD_MISSION` and `E_BAD_CONDITION` are reserved for future use (e.g., validating user-supplied mission profiles in Iter 4 v2).

No naming drift detected.

---

**Plan complete and saved to** `docs/superpowers/plans/2026-05-18-selectron-iter3-risk.md`.

Execution options (choose after Iter 2 ships and Phase 3.0 prerequisites in §"Hard prerequisites" are satisfied):

1. **Subagent-Driven (recommended)** — dispatch one fresh subagent per task; controller reviews between tasks. Best for Phase 3.0 (lots of independent MCP calls) and Phase 3C (TDD per module).

2. **Inline Execution** — execute tasks sequentially in this session using `superpowers:executing-plans`. Best for Phase 3A (Diego curation is inherently single-threaded) and Phase 3E (acceptance).

The plan does NOT auto-execute. Diego ratifies first, then chooses the execution path per phase.
