<div align="center">

# Selectron

**A transparent uncertain-weight MCDA and analog mission simulation prototype for space-analog crew-selection research.**

*Candidate scores are uncertainty-propagated MCDA estimates, not validated suitability posteriors. Analog mission outputs are scenario estimates, not NASA HSRB verdicts.*

---

![status](https://img.shields.io/badge/status-post--audit%20methods%20rewrite-success)
![version](https://img.shields.io/badge/version%20of%20record-v0.5.6-blue)
![typescript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)
![python](https://img.shields.io/badge/Python%20calibration-3.12-3776ab?logo=python&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5.3-646cff?logo=vite&logoColor=white)
![react](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![echarts](https://img.shields.io/badge/ECharts-6.0-aa344d)
[![doi](https://img.shields.io/badge/DOI-10.5281%2Fzenodo.20693257-blue)](https://doi.org/10.5281/zenodo.20693257)
![license](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## Safety Scope

Selectron is a research artifact and decision-support prototype. It is **not** a flight-certification system, a clinical decision-support tool, a medical-clearance product, a registry, an applicant-tracking system, or a replacement for expert selection-panel judgment.

The analog-facing application no longer presents NASA HSRB traffic-light verdicts, LxC scores, or "NASA-standard" applicant decisions. HSRB-related adapters remain only as developer/benchmark utilities for historical comparison and are not the operational analog workflow.

The application runs locally in the browser. Candidate and simulation data are stored on the operator's machine through IndexedDB; there is no backend service, account system, or SaaS data store. The optional Python tools are for offline prior calibration and manuscript reproducibility, not for browser runtime.

## What This Repository Contains

Selectron combines four pieces that are kept in one source tree:

- **Stage A: uncertain-weight MCDA selection scoring** in `src/engine/`. Candidate totals are score distributions induced by Dirichlet-distributed criterion weights and normalized criterion scores. They are not learned Bayesian posteriors unless a separate elicitation/inference model is added.
- **Stage B: analog mission medical-event simulation** in `src/imm/`. The current IMM-style calculator uses a 101-condition prior set, structured analog mission profiles, resource-kit configuration, and chronological event processing.
- **A browser application** in Vite + React + Tailwind + ECharts. The main surfaces are Dashboard, Wizard, Crew Composition, Calibration, and Analysis.
- **Evidence and reproducibility tooling** in `research/`, `python/`, `paper/`, and `docs/`. Release fitting reads only adjudicated rows from `research/evidence_extracted/evidence_ledger.csv`; proposal CSVs require an explicit exploratory flag. The current ledger has no accepted rows, so the existing prior catalog must be treated as unadjudicated for analog-outcome validation claims.

The public repository is `https://github.com/strikerdlm/selectron`. The public software archive is on Zenodo at `https://doi.org/10.5281/zenodo.20693257`. The version of record remains **v0.5.6** across `package.json`, `CITATION.cff`, `src/version.ts`, app chrome, and the manuscript source. `CHANGELOG.md` also documents a post-release **0.5.7 frontend pass**: persisted light/dark theme, +2 pt live-app type scale, and a five-figure Analysis tab.

## Current State

`STATUS.md` is the live tracker. As of **2026-06-23**, commit `7caad1007e44e3e5aff4c8b41de74e6fda6a2f7c` closes the active workflow split identified by the fix-implementation audit. The Wizard stops at Stage-A candidate scoring and hands off to Crew Composition for team-level scenario analysis. Crew Composition defaults to analog mission profiles, default-off trait-to-incidence coupling, and analog outcome estimates. ISS remains available as a developer benchmark, not as the primary analog workflow.

Evidence status is machine-readable at `research/evidence_extracted/evidence_status.json` and can be regenerated with:

```bash
npm run evidence:status -- --write
```

Current status: `acceptedCount = 0`, `proposalRefCount = 7`, `releasePriorsAdjudicated = false`. Do not describe release priors as accepted-ledger-derived until independently adjudicated rows are added.

The active manuscript package lives in `strikerdlm/manuscripts` and was rewritten as a methods/software paper in commit `368e488351428a602b72fe9b177238c8fb1f2b13`. Generated Acta DOCX files in that package were rebuilt from the corrected markdown. The older `paper/submission/*.docx` files in this app repository remain stale and should not be uploaded.

The current prior catalog is locked by `tests/imm/priors.test.ts`:

| Prior provenance | Count |
|---|---:|
| `tierA-nasa` | 34 |
| `tierB-pymc` | 66 |
| `tierB-lit` | 1 |
| `tierC-synth` | 0 |
| **Total** | **101** |

The one `tierB-lit` condition is the source-cited analog behavioral extension `interpersonal-conflict`. Zero synthetic tier-C placeholders remain.

## Quick Start

### Browser Application

```bash
git clone https://github.com/strikerdlm/selectron.git
cd selectron
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

Useful verification commands:

```bash
npm run typecheck
npm test
npm run verify:fast
npm run build
npm run e2e
npm run validate:imm
npm run validate:imm:analog
```

`npm run e2e` requires Playwright browsers to be installed in the local environment. In the managed sandbox used during the last submission-prep pass, the targeted Crew Composition smoke tests were run through a manual Vite server because Playwright's web-server health check and Chromium sandbox launch were blocked.

### Python Offline Calibration

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -m "not slow"
python -m selectron --dry-run --draws 100 --chains 1 --output-dir /tmp/selectron-calibration-dry-run
```

### Calibration API For The Browser

The Calibration tab can connect to the optional FastAPI server:

```bash
cd python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

The browser uses `http://localhost:8000` by default. Override it with `VITE_CALIBRATION_API_URL` in `.env.local`.

Routes:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | API liveness |
| `GET` | `/conditions` | 101-condition provenance and fit-status catalog |
| `POST` | `/fit` | Start an async PyMC NUTS batch-fit job |
| `GET` | `/fit/{job_id}` | Poll fit-job status and posterior summaries |
| `GET` | `/validate` | Run the K15 validation gate |
| `GET` | `/sensitivity` | Run Sobol/Morris sensitivity analysis |
| `GET` | `/posterior/draws` | Return stored lambda parameter draws for predictive uncertainty runs |

If the API is unavailable, the Calibration view shows a local error state and the rest of the app remains usable offline.

## Methodology

### Stage A: Uncertain-Weight MCDA

For candidate `i`, Selectron scores:

```text
S_i = sum_k w_k * z(x_i,k)
```

where `x_i,k` is the raw score for criterion `k`, `z(...)` is the criterion-specific normalization onto `[0, 1]`, and `w ~ Dirichlet(alpha)` is an uncertain criterion-weight assumption. Each candidate therefore gets an induced score distribution and MCDA intervals. This is sensitivity propagation over uncertain weights, not a posterior over candidate suitability learned from observed analog outcomes.

The TypeScript sampler uses the standard Dirichlet construction: independent Gamma(alpha_k, 1) draws are normalized by their sum. The implementation is tested against closed-form Dirichlet moments, Kolmogorov-Smirnov marginal checks, effective-sample diagnostics, and alpha0 robustness cases in `tests/engine/`.

Incomplete Stage-A records are blocked in the wizard. Missing criterion values are no longer silently replaced with worst-case scores. The candidate Wizard does not run Stage-B medical simulation and does not clone a candidate into a synthetic crew.

### Stage B: Analog Mission Simulation

The IMM Calculator simulates medical events through the four-step IMM-style loop:

```text
occurrence -> severity -> treatment/resource pathway -> CHI/QTL aggregation
```

The current engine samples event onset times, sorts occurrences chronologically, consumes treatment resources in event order, keeps evacuation and loss-of-life terminal outcomes mutually exclusive, and integrates overlapping impairment intervals across each crewmember timeline.

Current analog-facing outputs include:

- `TME`: total medical events.
- `CHI`: Crew Health Index.
- `pEVAC`: evacuation probability.
- `pLOCL`: loss-of-crew-life probability.
- `MSP`: mission-success probability, defined as no LOCL, no EVAC, and CHI above the configured floor.
- expected duty hours lost and evidence grade.

Stage-A-to-incidence coupling is quarantined by default. It can be enabled only as explicit scenario analysis through `vulnerabilityCouplingMode: "scenario"` / the "Trait coupling" switch. Default scientific runs report no trait-derived incidence changes until analog data support calibrated coefficients.

Mars and Artemis mission models remain out of scope until the structural requirements in `docs/future_features.md` are implemented.

## Main App Surfaces

### Crew Composition

`src/ui/views/CrewComposition.tsx` is the primary IMM workflow. It supports:

- Analog missions as the operational default. ISS missions are kept in `BENCHMARK_MISSIONS` for developer verification.
- Manual crew sizing from 1 to 6 members.
- Per-member sex, mission-risk flags, EVA eligibility, EVA count, and Stage-A criterion scores.
- Binary gate checks for psychiatric and cognitive clearance criteria.
- Per-criterion citation chips and ECharts mini-figures.
- Crew composite methods: mean, worst-link, and geometric mean.
- Web Worker IMM Monte Carlo at T = 100,000.
- Analog outcome estimates without HSRB/LxC applicant verdicts.
- Default-off trait coupling, with explicit scenario-analysis labeling when enabled.
- Config-only session saving, completed-session saving, and localStorage autosave.
- Pre-run analog context panels for kind multipliers and predictive uncertainty when the Calibration API is available.

### Calibration

`src/ui/views/Calibration.tsx` bridges the browser to the Python calibration pipeline:

- **Conditions**: provenance-filterable table over all 101 conditions.
- **Batch Fit**: async PyMC NUTS jobs with live polling, R-hat, ESS, and divergence summaries.
- **V&V**: K15 validation gate and Sobol/Morris sensitivity views.

`src/contexts/CalibrationJobsContext.tsx` keeps fit, validation, and sensitivity jobs alive across tab switches and refreshes.

### Analysis

The 0.5.7 frontend pass added a publication-style Analysis tab backed by pure math in `src/analysis/`:

- **A1** parallel coordinates for candidate criteria.
- **A2** IMM risk bubble scatter.
- **A3** criteria scatterplot matrix.
- **A4** criterion-correlation heatmap.
- **A5** criterion x condition-family vulnerability-coupling heatmap.

The figures use a seeded demo cohort when the live candidate pool is too small, so the view is never empty. The same pass added a persisted light/dark theme toggle, dark-mode ECharts tokens, and a +2 pt type-scale bump for live app chrome while keeping manuscript figure components pinned for reproducibility.

## Repository Map

```text
selectron/
├── src/
│   ├── analysis/             # Correlation, coupling, bubble-scatter, demo-cohort math
│   ├── api/                  # Typed browser client for the Python Calibration API
│   ├── contexts/             # Wizard, Dexie, and Calibration job state
│   ├── data/                 # Criteria, missions, citations, IMM priors, worked examples
│   ├── db/                   # Dexie schema and repository
│   ├── engine/               # Stage-A uncertain-weight MCDA math
│   ├── imm/                  # 101-condition IMM Calculator engine
│   ├── risk/                 # Legacy Stage-B risk utilities and developer HSRB adapters
│   ├── ui/                   # React views, components, themes, ECharts figures
│   └── workers/              # IMM simulation Web Worker
├── tests/                    # Vitest + Playwright suites
├── python/                   # Offline PyMC calibration package and FastAPI API
├── docs/                     # Specs, plans, V&V dossiers, future-feature notes
├── research/                 # Literature foundation and evidence extraction
├── paper/                    # Manuscript source, reproducibility lock, submission assets
├── notebooks/                # Exploratory notebooks and requirements
├── CHANGELOG.md              # Release history
├── STATUS.md                 # Live project state and submission tracker
├── CITATION.cff              # Citation metadata
└── package.json
```

## Verification And Reproducibility

The current reproducibility contract is split across code, tests, and manuscript files:

- `tests/imm/priors.test.ts` locks the 101-condition prior count, provenance counts, zero tier-C synthetic priors, prior-file SHA-256, and citation-hygiene tokens.
- `tests/imm/validation_k15.test.ts` and related IMM tests lock the K15 reproduction gate and documented-divergent brackets.
- `paper/REPRODUCIBILITY_LOCK.json` records manuscript source hashes, figure hashes, the `imm-priors.json` hash, verification commands, and the Zenodo DOI.
- `src/version.ts` currently records `SELECTRON_VERSION = "0.5.6"` and `FIGURE_GENERATION_COMMIT = "538e16ccff94"`.

Last recorded verification in `STATUS.md`:

- **2026-06-23**: `npm run typecheck` passed; `npm run build` passed with Vite chunk warnings only; `npm run validate:imm` passed; `npm run validate:imm:analog` passed (26/26); targeted guards/database/evidence tests passed (29/29); `npm run evidence:status` passed with `releasePriorsAdjudicated=false`; `python3 scripts/apply_fit.py --dry-run` failed closed with exit 2 because the accepted ledger has zero accepted rows; `git diff --check` passed.
- **2026-06-22**: `npm run typecheck` passed; `npm run build` passed with Vite warnings only; targeted IMM/UI vitest suites passed; Python accepted-evidence/fitter tests passed in `python/.venv`; Playwright crew-workflow smoke passed via the sandbox workaround.
- **2026-06-11**: `npm run verify:fast` passed, `npm run build` passed with Vite chunk/dynamic-import warnings only, Python `pytest -m "not slow"` passed with 71 passed / 14 slow deselected, calibration dry-run completed with 66 skipped / 0 failed, and targeted Crew Composition Playwright smoke passed 4/4 through the sandbox workaround.
- **2026-06-14**: manuscript source and prior-catalog freeze controls were updated. Rebuild the rendered submission package and rerun the recorded verification lanes before upload.

## Known Limits

- K15 reproduction is inter-model agreement against NASA IMM publications, not validation against observed analog-mission clinical outcomes.
- Eight K15 metrics remain documented-divergent; all three TME values and unlimited-kit CHI are in the accepted K15 CI95 bracket.
- Outcome parameters for pEVAC and pLOCL are less mature than incidence priors. A closed-form rescale improved some scenarios but was reverted because it degraded the operational ISS HMS pathway.
- The accepted analog evidence ledger currently has zero accepted rows; seven current priors still cite proposal-stage extraction files.
- Some tier-B conditions use proxy anchors because condition-specific isolated-mission incidence rates were not found.
- Stage-A-to-Stage-B vulnerability coupling is implemented and tested only as explicit scenario analysis. It is off by default in the analog scientific workflow.
- The active evidence ledger currently contains schema and quarantine controls; proposal-stage extraction files do not feed release priors unless adjudicated into accepted ledger rows.
- Mars and Artemis need separate structural model work and are intentionally deferred.
- `paper/submission/*.docx` files are stale after the 2026-06-14 Acta-source revision.

See `docs/iter5_scientific_limitations.md`, `docs/future_features.md`, and `STATUS.md` for the full audit trail.

## Citation

GitHub renders citation metadata from `CITATION.cff`. Cite the public software archive as:

> Malpica Hincapie, D. L. (2026). *Selectron: uncertain-weight MCDA and analog mission simulation prototype for space-analog crew-selection research*. Zenodo. https://doi.org/10.5281/zenodo.20693257

## Author

**Dr. Diego L. Malpica, MD**

Direction of Aerospace Medicine, Colombian Aerospace Force (FAC)

Bogota, Colombia

Repository owner: [strikerdlm](https://github.com/strikerdlm)

## License

MIT. See `LICENSE`.
