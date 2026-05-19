# `incidence_rates.csv` — schema

| Column | Type | Description |
|---|---|---|
| condition_id | string | One of the 12 from Iter-3 spec §5 (e.g. `insomnia`). |
| mission_type | string | One of `{antarctic, mars500, hi-seas, mdrs, emmpol, thor}`. |
| study_doi | string | DOI or `—` if no DOI (only for Tier-1 IMM papers without DOI). |
| study_slug | string | Slug of source markdown in `research/evidence/` or `research/imm_sources/`. |
| person_days | integer | Total exposure (crew × days). |
| events | integer | Count of incidents observed in `person_days`. |
| notes | string | Free text. If `person_days` is estimated (not explicit), prefix `EST: `. |
| extracted_by | string | `Diego` or `subagent-proposal` (only Diego may flip a row to `Diego`). |
| extracted_at_utc | ISO-8601 | Timestamp of extraction or proposal. |

## Notes on values

- `condition_id` must match the 12 conditions in `src/risk/conditions.ts` (`ANALOG_CONDITIONS`).
- `mission_type` must match the 6 enum members in `src/types/risk.ts` (`MissionType`).
- `study_slug` should be the filename stem (no `.md`) of the source markdown — e.g. `palinkas-2004-antarctic-psychiatric-disorders`, `imm_sources/zotero_imm/antonsen-2023-hsrb`.
- `person_days = crew × days` for the study. If the study reports only the mission duration, the controller-staged subagent must derive crew from a co-cited mission profile and prefix the notes column with `EST: derived crew=N from <ref>`.
- `events` counts incidents, not severity-weighted contributions. A single hospitalised episode + 3 outpatient visits = 4 events.
