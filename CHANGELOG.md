# Changelog

All notable **software** changes to the public Selectron repository are documented here.
Manuscript and journal-submission history is maintained only in the private
`selectron_private` repository.

Format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Comprehensive step-by-step user manual at `docs/Manual.md`.
- Public/private repository split: `scripts/sync-to-public.mjs` and `*.public.md`
  templates publish application code without manuscript assets.

### Changed
- `README.md` (public variant) documents the dual-repo policy and links to the manual.

## [0.6.0-rebaseline.0] — 2026-06-23

### Added
- `docs/v0.6_rebaseline.md` — active software baseline and gate disposition matrix.
- `src/data/demo-criteria.ts` — canonical Stage-A demo catalog.
- `npm run guard:active-imports` — blocks archived `src/risk` from active app paths.
- GitHub Actions CI (typecheck, guard, evidence check, build, smoke tests, Python fast lane).

### Changed
- Version metadata unified to `0.6.0-rebaseline.0`.
- Shared vulnerability/LxC utilities moved to `src/engine/`.

## [0.5.7-unreleased] — 2026-05-30

### Added
- Light/dark theme with persisted toggle and WCAG-AA light palette.
- Analysis tab (A1–A5 correlation and IMM bubble figures).
- `src/analysis/` pure math layer.

### Changed
- +2 pt type scale on live app chrome; figure snapshot path unchanged.

## Earlier releases

Engine iterations (IMM Calculator, Python calibration, gate-then-modulate, analog
mission profiles, terrestrial condition guard, conflict/team Bayesian layer in
`src/risk/`, etc.) are recorded in the private repository changelog and
`STATUS.md` audit log. Zenodo archive: https://doi.org/10.5281/zenodo.20693257
