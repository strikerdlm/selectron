# CLAUDE.md — Selectron

## What this repo is

A Bayesian MCDA scoring engine for analog-astronaut selection. Personal research tool + methodology paper. The app is a **client-side TypeScript/React SPA, offline-first** (Dexie/IndexedDB) — it runs standalone with no server. An **optional** Python FastAPI service (`python/`, package `selectron-offline`) does offline PyMC prior calibration and is consumed **only by the Calibration tab**; the app is fully functional without it. Spec: `docs/superpowers/specs/2026-05-18-selectron-design.md`.

## Sequencing

Four-iteration spiral, plus two post-spiral iterations:

1. **Iter 1** — vertical slice, 5 hardcoded criteria, end-to-end.
2. **Iter 2** — literature-driven criteria + multi-candidate comparison.
3. **Iter 3** — sensitivity analysis + prior elicitation.
4. **Iter 4** — paper draft.
5. **Iter 5** — IMM Calculator (100 conditions × 3 kits, K15 validation gate).
6. **Iter 6** — Python offline calibration + FastAPI + Calibration UI (59/59 tier-B PyMC fitted, 100% evidence-based).

**Manuscript submission (Advances in Space Research, Elsevier/COSPAR) is the active priority.** All engineering iterations are complete. npj Microgravity dropped — APC $3,790 unaffordable.

## Working in this repo

- Math before UI. Every engine module ships with a vitest suite before its UI consumer.
- All exports → `/root/repos/exports/` per workspace convention. Local build artifacts → `exports/` here (gitignored).
- Commits: `feat:` / `fix:` / `docs:` / `chore:`, no AI co-author lines (Diego is sole author).
- Plans live at `docs/superpowers/plans/`. Active plan = `2026-05-18-selectron-iter1-phase0.md`.

## Commands

Frontend — run from the repo root (the `@` import alias maps to `src/`):

```bash
npm install
npm run dev          # Vite dev server on :5173
npm run build        # tsc -b && vite build
npm run preview      # serve the production build on :4173
npm test             # vitest run — full unit suite
npm run test:watch   # vitest watch mode
npm run typecheck    # tsc --noEmit
npm run e2e          # Playwright

# Run one test file / one test by name:
npx vitest run tests/imm/simulate.test.ts
npx vitest run -t "K15 invariance"
```

`tests/imm/calibration.test.ts` runs a 100k-trial K15 sim (~15 min) inside the suite — narrow to a single file while iterating rather than re-running everything.

IMM prior calibration and the K15 validation gate are TypeScript scripts (the canonical entrypoints):

```bash
npm run calibrate:imm   # tsx scripts/calibrate_imm_priors.ts
npm run validate:imm    # tsx scripts/validate_imm.ts  (K15 validation gate)
```

Optional Python calibration service — needed **only** by the Calibration tab; run from `python/`:

```bash
cd python
pip install -e ".[dev]"           # Python 3.12–3.14; package imports as `selectron`
pytest                            # add -m "not slow" to skip slow tests
uvicorn api.main:app --reload     # FastAPI on :8000 (CORS allows :5173 / :4173)
python -m selectron               # PyMC NUTS fitter CLI
```

The frontend reaches it through the single HTTP client `src/api/calibration.ts` (`VITE_CALIBRATION_API_URL`, default `http://localhost:8000`); all other state is offline in Dexie.

Manuscript — run from `paper/`: `make template && make all` (pandoc 3.1.3 + `figcrossref.lua` + `elsevier-harvard.csl` → `paper/submission/manuscript.docx`).

## Architecture map

Three scoring layers, all pure functions over a **seeded PRNG** so runs are bit-reproducible:

- **`src/engine/`** — shared Bayesian + MCDA primitives: `makeRng` (seeded PRNG), `sampleGamma` / `sampleDirichlet`, `normalizeScore`, `scoreCandidate` + `closedFormMoments` (the MCDA core), and `generateCandidate` (synthetic cohorts). Both risk pipelines build on these.
- **`src/risk/`** — Stage B + HSRB-LxC mission-risk pipeline over ~12 analog conditions (`simulateMission`, `computeCHI`, vulnerability multiplier, LxC matrix).
- **`src/imm/`** — the 100-condition NASA-IMM Calculator, the engine the manuscript reports. See the **IMM Calculator module** section below for provenance, gates, and the vulnerability path.

`src/risk/` and `src/imm/` are **independent and run alongside each other — do not refactor one in terms of the other.**

Supporting layers:
- **`src/analysis/`** — correlation / coupling math behind the Analysis-tab figures (TDD'd separately).
- **`src/data/`** — static inputs: `imm-priors.json` (calibrated priors), criteria, analog missions, citations.
- **`src/db/`** — Dexie/IndexedDB persistence (schema v3; see IMM section).
- **`src/contexts/`** — React providers (DB, Wizard, background CalibrationJobs).
- **`src/workers/imm-simulate.worker.ts`** — runs the IMM Monte Carlo off the main thread.
- **`src/ui/`** — React SPA. Views: **Dashboard · Wizard · Sim · CrewComposition · Calibration · Analysis**. `src/ui/figures/` holds the publication ECharts figures (paper F1–F7, analysis A1–A5); the `?testFigure=F1..F7` dev route renders one in isolation for Playwright snapshots.

**Determinism is load-bearing:** `0xc0ffee` is the canonical sampler seed across tests, demo cohorts, and the K15 invariance canary (which asserts ISS runs stay bit-identical). Do not introduce unseeded randomness into engine/risk/imm code.

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

**Three-tier prior provenance**: every entry in `src/data/imm-priors.json` carries a `provenance` tag (`tierA-nasa` / `tierB-lit` / `tierB-pymc` / `tierC-synth`) and a `source_ref` pointing to a markdown file under `research/`. **100% of 100 IMM conditions are now evidence-based** (34 tierA-nasa + 66 tierB-pymc; 0 tierC-synth remain). The `tierB-pymc` tag indicates PyMC NUTS-fitted posteriors from terrestrial epidemiological base rates; `tierB-lit` marks hand-curated literature values that were not refit via PyMC. Never blindly hand-edit priors — re-run the calibration script and commit the updated JSON.

**Dexie schema is v3** (additive migration). The `imm_sessions` table persists Crew Composition runs. v2 candidate / criterion / attachment tables are untouched.

**Gate-then-modulate architecture** (2026-05-21): binary clearance gates (`Criterion.gateThreshold`) HARD-EXCLUDE unfit candidates BEFORE Stage B / IMM runs. Wired gates: `psych.mmpi2rf_eid` (fail-if-above 65) and `cognitive.nasa_cognition_battery` (fail-if-below −2.0). Whole-crew DQ on any failed member. See `docs/superpowers/plans/2026-05-21-selectron-gate-then-modulate.md`.

**Vulnerability path**: per-crewmember Stage A scores → z-scored against criterion scale → multiplied by family-specific β (psychiatric −0.4 → renal −0.15) → exp(β·z) factor on per-condition λ. 58/100 IMM conditions are coupled via `vulnerabilityCriteria`.

**V&V dossier**: `docs/iter3_vv_dossier.md` §5 (IMM Calculator validation) and §6 (gate-then-modulate architecture). Re-read on every architectural change.

**Reproducer**: `scripts/reproducer_bad_candidate.ts` and `scripts/reproducer_imm_composite.ts` demonstrate worst-vs-best candidate discrimination and the disqualified-crew path. Re-run after any priors or engine change.

## Analog-IMM model — validation methodology (active, branch `iter1-phase0-analog-imm`)

The analog-habitat kinds (`analog-controlled`, `antarctic-station`) are being extended into a manuscript-grade, literature-validated model so analog missions run the terrestrial **isolation-&-confinement (I&C) condition set only** (not the ISS space conditions). **`leo-iss`/K15 stays byte-identical** — the invariance canary in `tests/imm/simulate.test.ts` is the hard guardrail. Full plan + ratified condition triage: `research/analog_imm_model_proposal.md`.

**The analog phase is a validation step.** For every analog prior (fire rates, the new conditions, evacuation/pEVAC anchors) the agent MUST follow this pipeline — do not shortcut it:

1. **Research the priors from scientific literature AND the internet** — not the in-repo corpus alone. Start from `research/`, then extend with fresh evidence from the research MCP tools (Consensus, Scite, PubMed, paper-search, bioRxiv) **and** web search (Brave, Tavily, Firecrawl, Perplexity). Source defensible base rates for terrestrial isolation-&-confinement / analog / Antarctic / submarine populations. Record every value with its source (DOI/URL) under `research/evidence_extracted/`.
2. **Calculate the posteriors** — feed the researched priors through the PyMC offline calibration pipeline (`cd python && python -m selectron`, or `npm run calibrate:imm`) to produce NUTS-fitted posteriors (check R-hat ≈ 1, ESS). Never hand-edit fitted incidence priors — re-run the script and commit the JSON. (The hand-curated `kind_multipliers` block is the one exception — it is dossier-anchored, not PyMC-fit.)
3. **Apply all the risk matrices** — run the posterior-updated analog model through the full stack: IMM Monte-Carlo → pEVAC / pLOCL / TME / CHI → NASA HSRB L×C matrix → the K15-style analog validation gate (`npm run validate:imm`).

The analog model is **validated** only when its emergent pEVAC/pLOCL (researched priors → posteriors) fall within the literature-anchored bounds (starting set, already in-corpus: McMurdo 0.036 evac/py, USAP 2013-14 0.01 evac/py — Walton & Kerstman 2020 / Pattarini 2016) with all risk matrices applied, and `leo-iss`/K15 is unchanged.
