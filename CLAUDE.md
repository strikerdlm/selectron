# CLAUDE.md — Selectron

## What this repo is

A Bayesian MCDA scoring engine for analog-astronaut selection. Personal research tool + methodology paper. Pure TS, single-repo, no Python backend. Spec: `docs/superpowers/specs/2026-05-18-selectron-design.md`.

## Sequencing

Four-iteration spiral:

1. **Iter 1** — vertical slice, 5 hardcoded criteria, end-to-end (current).
2. **Iter 2** — literature-driven criteria + multi-candidate comparison.
3. **Iter 3** — sensitivity analysis + prior elicitation.
4. **Iter 4** — paper draft.

Phase 0 (6-agent literature fan-out) runs in parallel with Iter 1, gates Iter 2.

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
