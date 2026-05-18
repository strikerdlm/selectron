# Selectron

A Bayesian multi-criteria decision-analysis scoring engine for analog-astronaut selection, with an interactive TypeScript UI. Personal research tool — the deliverable is a methodology paper.

**Status:** Iteration 1 (vertical slice, 5 hardcoded placeholder criteria).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # run vitest suites
npm run typecheck    # tsc --noEmit
```

## Layout

```
src/engine/   pure-TS scoring math (no React)
src/ui/       React + Tailwind UI
src/data/     placeholder criterion definitions (replaced in Iter 2)
src/types/    shared TS types
tests/        vitest, math-first
research/     Phase 0 literature outputs (read-only, agent-produced)
docs/         specs + plans + decisions
paper/        manuscript draft
```

## Inspiration

Apollonio et al. *ASTRA Framework for Enhancing Human Performance and Safety in Analog Missions.* AIAA ASCEND 2026 (paper 2026-3000). Selectron is methodological (scoring engine), not infrastructural (database) — see `docs/superpowers/specs/`.

## Author

Diego L. Malpica, MD — Aerospace Medicine, FAC.
