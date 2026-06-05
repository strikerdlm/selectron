# IMM Calibration Literature Search — Design Spec
_Date: 2026-05-25_

## Goal

Find incidence rate data for the 6 remaining `tierB-lit` IMM conditions, produce proposal CSV rows compatible with the existing pipeline, auto-fit via PyMC NUTS, and merge converged posteriors into `imm-priors.json`.

## Target Conditions

| condition_id | Blocker |
|---|---|
| `barotrauma-ear-sinus-block` | Population mismatch (submarine escape training) |
| `eye-penetration-foreign-body` | Population mismatch (ISS microgravity) |
| `shoulder-sprain-strain` | Population mismatch (ISS EVA) |
| `elbow-sprain-strain` | No isolated analog-mission rates |
| `hip-sprain-strain` | No isolated analog-mission rates |
| `wrist-sprain-strain` | No isolated analog-mission rates |

Population scope: analog-mission sources primary; general-population ER/sports epidemiology (NEISS, GBD, NAMCS/NHAMCS) as fallback. Military-occupational-only denominators are rejected unless an analog-mission adjustment is demonstrated. No military-specific rates without adjustment.

## Architecture

**6 parallel condition agents** — one subagent per condition, each using all four MCP tools independently. No inter-agent communication. Controller collects CSV row blocks and merges centrally.

### MCP Tools Per Agent

| Tool | Purpose |
|---|---|
| `mcp__claude_ai_Consensus__search` | Meta-analyses, systematic reviews, incidence/prevalence |
| `mcp__scite__search_literature` | Smart Citation context; verify figures in citing papers |
| `mcp__paper-search__search_pubmed` + `search_semantic` | Primary epidemiology studies, NEISS reports |
| `mcp__firecrawl-mcp__firecrawl_search` | GBD fact sheets, WHO/CDC tables, NEISS online query results |

### Agent Prompt Contract

Each agent receives:
- Target `condition_id`, display name, ICD category
- Population guidance (analog-mission primary; general-pop fallback with offset flag)
- Output contract (CSV rows, plain text, no file writes)
- Reject criteria: military-occupational-only denominators without adjustment

Each agent returns:
- A plain-text CSV row block (no header)
- A short summary: rows found, studies used, any gaps noted

## CSV Output Contract

Schema (from `research/evidence_extracted/SCHEMA.md`):

```
condition_id,mission_type,study_doi,study_slug,person_days,events,notes,extracted_by,extracted_at_utc
```

Field rules:
- `condition_id` — exact key from `imm-priors.json`
- `mission_type` — `analog` | `general-pop`
- `study_doi` — canonical DOI or `NEISS:<year>` / `GBD:<year>`
- `study_slug` — `firstauthor_year` or `neiss_2022`, `gbd_2019`; unique per study
- `person_days` — `crew × days`; `EST:` prefix if estimated
- `events` — raw incident count; `EST:` prefix if back-calculated
- `notes` — required for `general-pop` rows: applicability rationale + population offset flag
- `extracted_by` — always `subagent-proposal`
- `extracted_at_utc` — ISO-8601 timestamp

Rows with no derivable `person_days` are omitted; agent notes the gap in its summary text.

## Merge & Deduplication

After all 6 agents return:

1. Collect all CSV row blocks
2. Prepend header once
3. Deduplicate on `(condition_id, study_slug, person_days, events)` — exact match, keep first
4. Validate: all 8 fields non-empty (except `notes` for analog rows)
5. Write to `research/evidence_extracted/incidence_rates.proposals_p-g.csv`
6. Append `proposals_p-g.csv` to `_PROPOSAL_FILES` in `python/src/selectron/priors_io.py`
7. Print per-condition row count summary

Conditions with zero rows are flagged and skipped by the fitter (stay `tierB-lit`).

## Auto-Fit Trigger & R-hat Gate

After CSV write and `priors_io.py` update:

1. `POST /fit` with `{ draws: 2000, tune: 1000, chains: 4, seed: 42, condition_filter: [<6 IDs>] }`
2. Poll `GET /fit/{job_id}` every 10s until `status == "done"` or `"error"`
3. R-hat gate: `r_hat ≤ 1.01` → auto-merge into `imm-priors.json`:
   - `provenance`: `tierB-pymc`
   - `alpha` / `beta`: posterior mean from NUTS
   - `source_ref`: `research/evidence_extracted/incidence_rates.proposals_p-g.csv`
4. Fail-soft: `r_hat > 1.01` or `divergences > 10` → leave `tierB-lit`; write diagnostics to `research/evidence/bridges/<condition_id>_fit_diagnostics.json`
5. K15 delta report: run `npm run validate:imm`, save delta to `/root/repos/exports/2026-05-25_report_imm-calibration-delta.txt`

## Files Created / Modified

| File | Action |
|---|---|
| `research/evidence_extracted/incidence_rates.proposals_p-g.csv` | Created by controller |
| `python/src/selectron/priors_io.py` | Append `proposals_p-g.csv` to `_PROPOSAL_FILES` |
| `src/data/imm-priors.json` | Auto-merged posteriors for converged conditions |
| `research/evidence/bridges/<id>_fit_diagnostics.json` | Written for non-converged conditions |
| `/root/repos/exports/2026-05-25_report_imm-calibration-delta.txt` | K15 delta report |

## Success Criteria

- At least 1 CSV row per condition (0 rows = gap, not failure)
- All written rows pass schema validation
- `npm run validate:imm` exits 0 after merge
- K15 aggregate TME/CHI/pEVAC/pLOCL values shift by < 5% from pre-search baseline (if > 5%, flag for Diego review before committing)
- Any non-converged condition is explicitly documented in `_fit_diagnostics.json`

## Out of Scope

- Tier-C synthetic conditions (18 conditions — separate calibration effort)
- Any modification to existing `proposals_p-a` through `proposals_p-f` CSV files
- Changes to the Gamma-Poisson model structure in `fit.py`
- UI changes
