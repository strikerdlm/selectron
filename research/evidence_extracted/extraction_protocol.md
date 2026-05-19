# Phase 3A — extraction protocol

This document binds every subagent (and any future contributor) extracting condition-incidence data from `research/evidence/` or `research/imm_sources/`.

## Source-of-truth rule

- **`incidence_rates.csv`** is the only file consumed by the PyMC fit (Task 40).
- **`incidence_rates.proposals.csv`** is the staging area where subagents append rows.
- Subagents **never** write directly to `incidence_rates.csv`. Only Diego flips a row from proposal → final by copying it to the final CSV and setting `extracted_by = "Diego"`.

## Row-level rules

1. **Person-days = crew size × mission days** IF the study reports both. If only one is reported, derive the other from a co-cited mission profile (most analog studies cite their host mission). Mark the derivation with `EST: derived <field> from <ref>` in the notes column.

2. **Events count incidents, not severity-weighted contributions.** A single hospitalised episode + 3 outpatient visits = 4 events. Do not pre-weight by hospitalisation cost or lost-crew-days here — that's downstream.

3. **One row per (condition_id, mission_type, study) triple.** Multiple rows per study are allowed when the study reports multiple conditions. Multiple rows per (condition, mission) are allowed when multiple studies report the same combination — they enter the hierarchical fit as independent observations.

4. **Confidence intervals are NOT in this schema.** Pyomc absorbs uncertainty from the row counts, not from study-reported CIs. If a study reports only a rate (e.g. "5.4 per person-year"), back-derive person-days and events; mark with `EST:`.

5. **Skip the row** if you cannot determine `person_days` and `events` to integer-precision. Do not propose rows with `events: ~3` or `person_days: ~365`.

6. **Cite the study with its DOI when available**, else `—`. The `study_slug` column must point to the source markdown filename stem so the row is traceable to the OCRed corpus.

## Subagent → Diego workflow

1. Subagent reads its assigned source bucket, applies the rules above, appends rows to `incidence_rates.proposals.csv`.
2. Subagent commits its appended rows as `research(iter3): Phase 3A proposals — bucket <X>`.
3. Diego reviews each proposed row, accepts (copies to `incidence_rates.csv` + sets `extracted_by = "Diego"`) or rejects (annotates `notes` with `REJECTED: <reason>` and leaves in proposals).

## Audit rule

Diego is the only authority for the final CSV. The subagent layer is advisory.
