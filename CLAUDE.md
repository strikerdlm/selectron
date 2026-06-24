# CLAUDE.md — Selectron (public repository)

> Public software repository for the Selectron analog mission simulation prototype.

## What this repo is

A **client-side TypeScript/React SPA, offline-first** (Dexie/IndexedDB) for uncertain-weight MCDA scoring and NASA-IMM-style analog mission medical simulation. An **optional** Python FastAPI service (`python/`) provides offline PyMC prior calibration for the Calibration tab only.

**This clone does not contain manuscript or journal-submission files.** Those live in `selectron_private`. Application code is synced one-way from that repo via `scripts/sync-to-public.mjs` (run in the private clone only).

Design spec: `docs/superpowers/specs/2026-05-18-selectron-design.md`.

## Working in this repo

- Math before UI. Engine modules ship with Vitest before UI consumers.
- Commits: `feat:` / `fix:` / `docs:` / `chore:` — Diego is sole author.
- After substantive app changes in `selectron_private`, run the public sync and push both remotes.

## Commands

```bash
npm install && npm run dev          # :5173
npm run verify:fast                 # typecheck + guard + evidence:check + test:fast
npm run build
npm run validate:imm:analog

cd python && pip install -e ".[dev]" && pytest -m "not slow"
uvicorn api.main:app --reload       # :8000 for Calibration tab
```

## Architecture (short)

- `src/engine/` — MCDA + shared math
- `src/imm/` — 101-condition IMM Calculator (manuscript-reported engine)
- `src/risk/` — archived Stage-B pipeline; not the active analog workflow
- `src/ui/` — Dashboard · Wizard · Crew Composition · Calibration · Analysis

Determinism: canonical seed `0xc0ffee` across tests and K15 regression checks.

## Dual-repository policy

| Repository | Remote | Contents |
|------------|--------|----------|
| `selectron_private` | `strikerdlm/selectron_private` | Full app + `paper/` + submission assets |
| `selectron` (this repo) | `strikerdlm/selectron` | App code only — no manuscripts |

Never copy `paper/` or submission checklists into this public tree.
