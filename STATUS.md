# Selectron — STATUS (public software repository)

**Last updated:** 2026-06-23  
**Current branch:** `master`  
**Active baseline:** [`docs/v0.6_rebaseline.md`](docs/v0.6_rebaseline.md)  
**Version of record:** `0.6.0-rebaseline.0`

---

## Repository role

This is the **public application repository** for Selectron. It contains the browser app, TypeScript IMM/MCDA engines, tests, Python calibration service, research evidence tooling, and operator documentation.

Manuscript sources, journal submission packages, and peer-review working files are **not** stored here. They live in the private development mirror (`selectron_private`) and are excluded by `scripts/sync-to-public.mjs` when syncing application code to this repo.

---

## Current state (2026-06-23)

- **v0.6 rebaseline** is the active software baseline (see `docs/v0.6_rebaseline.md`).
- **Gate 0–2 audit containment** is implemented: research-prototype warnings, explicit Stage-A demo catalog, parameter-level evidence status, default-off trait coupling, K15 framed as reference-model regression (not operational validation).
- **Review audit batch (F1–F12)** largely complete in application code: session provenance exports, evidence drift CI check, fail-closed scenario validation, profile-effects pilot (`profile.communication.delaySec`), PVT double-count resolved in demo criteria.
- **Evidence ledger:** four nominal `accepted` rows, all malformed; valid accepted active-parameter coverage is `0/4,849`; `releasePriorsAdjudicated = false`.
- **User manual:** [`docs/Manual.md`](docs/Manual.md).

### Verification (last recorded)

| Command | Result |
|---------|--------|
| `npm run verify:fast` | 636/636 tests (2026-06-23) |
| `npm run guard:active-imports` | PASS |
| `npm run evidence:check` | PASS |
| `pytest -m "not slow"` (python/) | PASS |

---

## Sync from private source

Application changes are developed **only** in `selectron_private`, then published here automatically on every push to private `master`:

```bash
# in selectron_private (optional local preview):
npm run sync:public
git push origin master
# CI: sync-public-on-release.yml pushes this repo's master directly
```

Do not commit application changes directly to this public repository.

The sync copies all application paths and replaces `README.md`, `STATUS.md`, `CLAUDE.md`, and `CHANGELOG.md` with public templates. It deletes `paper/` and manuscript-only docs if present.

---

## Resume protocol

1. Read this file for software state.
2. Read `CLAUDE.md` for repo conventions.
3. Read `docs/Manual.md` for operator workflows.
4. Do not expect manuscript or submission assets in this clone.

---

## Audit log (software-only)

| Date (UTC) | Event |
|------------|-------|
| 2026-06-23 | Public/private repo split documented; sync script added; app parity with private at `adac9b6`. |
| 2026-06-23 | F2 comms profile-effects pilot, F10 PVT fix, evidence ledger batch-1 (4 accepted rows). |
| 2026-06-23 | v0.6 rebaseline: Stage-A demo catalog, import guard, CI workflows. |

For the full development audit trail including manuscript milestones, see the private repository.
