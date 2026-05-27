# CLAUDE.md — Selectron

## What this repo is

A Bayesian MCDA scoring engine for analog-astronaut selection. Personal research tool + methodology paper. Pure TS, single-repo, no Python backend. Spec: `docs/superpowers/specs/2026-05-18-selectron-design.md`.

## Sequencing

Four-iteration spiral, plus two post-spiral iterations:

1. **Iter 1** — vertical slice, 5 hardcoded criteria, end-to-end.
2. **Iter 2** — literature-driven criteria + multi-candidate comparison.
3. **Iter 3** — sensitivity analysis + prior elicitation.
4. **Iter 4** — paper draft.
5. **Iter 5** — IMM Calculator (100 conditions × 3 kits, K15 validation gate).
6. **Iter 6** — Python offline calibration + FastAPI + Calibration UI (59/59 tier-B PyMC fitted, 100% evidence-based).

**Manuscript submission (npj Microgravity) is the active priority.** All engineering iterations are complete.

## Working in this repo

- Math before UI. Every engine module ships with a vitest suite before its UI consumer.
- All exports → `/root/repos/exports/` per workspace convention. Local build artifacts → `exports/` here (gitignored).
- Commits: `feat:` / `fix:` / `docs:` / `chore:`, no AI co-author lines (Diego is sole author).
- Plans live at `docs/superpowers/plans/`. Active plan = `2026-05-18-selectron-iter1-phase0.md`.

## Phase 0 outputs (research/)

The 6 research agents write read-only artifacts here. Do not modify by hand — re-run the agent if a deliverable needs to change. After all six finish, Diego ratifies `docs/criteria.md` (manual review of the proposals).

## Resume protocol

`STATUS.md` is the single source of truth for what is DONE, IN_PROGRESS, or BLOCKED. Any agent (human or AI) arriving fresh in this repo must:

1. Read `STATUS.md` first. The "Current state" block tells you what to do next.
2. Then read this file (`CLAUDE.md`), then the active spec + plan referenced in STATUS.md.
3. After completing any task, update `STATUS.md` in the same commit. Move the task row to DONE with its commit SHA, and append an entry to the Audit log.
4. Do not re-do work marked DONE. Trust the table.

This protocol is the disconnection-recovery contract: if the controller session disappears mid-iteration, STATUS.md plus this protocol let a new session pick up cleanly.

## IMM Calculator module

`src/imm/` is a NASA-IMM-aligned probabilistic medical-risk simulator that runs alongside the existing `src/risk/` Stage B + HSRB-LxC pipeline. **They are independent**: do not refactor one based on the other.

**Three-tier prior provenance**: every entry in `src/data/imm-priors.json` carries a `provenance` tag (`tierA-nasa` / `tierB-lit` / `tierB-pymc` / `tierC-synth`) and a `source_ref` pointing to a markdown file under `research/`. **100% of 100 IMM conditions are now evidence-based** (37 tierA-nasa + 63 tierB-pymc; 0 tierC-synth remain). The `tierB-pymc` tag indicates PyMC NUTS-fitted posteriors from terrestrial epidemiological base rates; `tierB-lit` marks hand-curated literature values that were not refit via PyMC. Never blindly hand-edit priors — re-run the calibration script and commit the updated JSON.

**Dexie schema is v3** (additive migration). The `imm_sessions` table persists Crew Composition runs. v2 candidate / criterion / attachment tables are untouched.

**Gate-then-modulate architecture** (2026-05-21): binary clearance gates (`Criterion.gateThreshold`) HARD-EXCLUDE unfit candidates BEFORE Stage B / IMM runs. Wired gates: `psych.mmpi2rf_eid` (fail-if-above 65) and `cognitive.nasa_cognition_battery` (fail-if-below −2.0). Whole-crew DQ on any failed member. See `docs/superpowers/plans/2026-05-21-selectron-gate-then-modulate.md`.

**Vulnerability path**: per-crewmember Stage A scores → z-scored against criterion scale → multiplied by family-specific β (psychiatric −0.4 → renal −0.15) → exp(β·z) factor on per-condition λ. 58/100 IMM conditions are coupled via `vulnerabilityCriteria`.

**V&V dossier**: `docs/iter3_vv_dossier.md` §5 (IMM Calculator validation) and §6 (gate-then-modulate architecture). Re-read on every architectural change.

**Reproducer**: `scripts/reproducer_bad_candidate.ts` and `scripts/reproducer_imm_composite.ts` demonstrate worst-vs-best candidate discrimination and the disqualified-crew path. Re-run after any priors or engine change.
