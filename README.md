<div align="center">

# Selectron

**A transparent uncertain-weight MCDA and analog mission simulation prototype for space-analog crew-composition scenario analysis.**

*Candidate scores are uncertainty-propagated MCDA estimates, not validated suitability posteriors. Analog mission outputs are scenario estimates, not NASA HSRB verdicts.*

---

![status](https://img.shields.io/badge/status-Gate%200--2%20prototype%20containment-success)
![version](https://img.shields.io/badge/version%20of%20record-v0.6.0--rebaseline.0-blue)
![docs](https://img.shields.io/badge/docs-User%20Manual-informational)
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

The analog-facing application no longer presents NASA HSRB traffic-light verdicts, LxC scores, or "NASA-standard" applicant decisions. HSRB-related adapters remain only as developer/benchmark utilities for historical comparison and are not the operational analog workflow. Gate review flags are not converted into L5/C5 risk postures.

The application runs locally in the browser. Candidate and simulation data are stored on the operator's machine through IndexedDB; there is no backend service, account system, or SaaS data store. The optional Python tools are for offline prior calibration and reproducibility checks, not for browser runtime.

## What This Repository Contains

Selectron combines four pieces that are kept in one source tree:

- **Stage A: uncertain-weight MCDA candidate scoring** in `src/engine/`. Candidate totals are score distributions induced by Dirichlet-distributed criterion weights and normalized criterion scores. They are not learned Bayesian posteriors, eligibility determinations, or suitability rankings unless a separate elicitation, inference, and validation model is added.
- **Stage B: analog mission medical-event simulation** in `src/imm/`. The current IMM-style calculator uses a 101-condition prior set, structured analog mission profiles, resource-kit configuration, and chronological event processing.
- **A browser application** in Vite + React + Tailwind + ECharts. The main surfaces are Dashboard, Wizard, Crew Composition, Calibration, and Analysis.
- **Evidence and reproducibility tooling** in `research/`, `python/`, and `docs/`. Release fitting reads adjudicated count extracts from `research/evidence_extracted/evidence_ledger.csv`; proposal CSVs require an explicit exploratory flag. Pilot adjudication is in progress (4 nominal accepted ledger rows, all currently malformed; 0 valid accepted active-parameter paths; release remains unadjudicated until all active parameter paths are covered).

This is the **public application repository** (`https://github.com/strikerdlm/selectron`). The software archive is on Zenodo at `https://doi.org/10.5281/zenodo.20693257`. The active development version is **v0.6.0-rebaseline.0** across `package.json`, `CITATION.cff`, `src/version.ts`, and app chrome.

> **Private development mirror:** Manuscript sources, journal submission packages, and peer-review working files are maintained in the separate private repository `selectron_private` and are intentionally excluded from this public tree. Application code is synced from that repo with `scripts/sync-to-public.mjs` (run only in the private clone).

## Documentation

**Start here for step-by-step workflows:** [`docs/Manual.md`](docs/Manual.md)

The manual covers installation, every app tab (Dashboard → Wizard → Crew Composition → Calibration → Analysis), evidence provenance, CLI verification, output metrics, troubleshooting, and literature references (NASA IMM, analog missions, MCDA).

Other key docs:

| Document | Purpose |
|----------|---------|
| [`docs/Manual.md`](docs/Manual.md) | Full user manual (primary operator guide) |
| [`docs/model_card.md`](docs/model_card.md) | Validation status, intended use, and unacceptable extrapolations |
| [`docs/manuscript_claim_matrix.md`](docs/manuscript_claim_matrix.md) | Claim-audit matrix for methods manuscripts and releases |
| [`STATUS.md`](STATUS.md) | Software project tracker |
| [`docs/v0.6_rebaseline.md`](docs/v0.6_rebaseline.md) | Release gates and disposition matrix |
| [`docs/iter3_vv_dossier.md`](docs/iter3_vv_dossier.md) | Validation & verification dossier |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history |

## Current State

As of **2026-06-23**, the active baseline is **v0.6 Rebaseline** (`docs/v0.6_rebaseline.md`). The app implements Gate 0–2 audit containment: analog workflows carry research-prototype warnings, the Stage-A demo catalog is explicit, the equal-weight Dirichlet prior is exposed as `alpha_k = kappa * m_k` with `kappa = K`, simulator severity branches are operative, and evidence status is checked at parameter-path level. Crew Composition is the primary IMM workflow; ISS remains a developer benchmark.

Evidence status is machine-readable at `research/evidence_extracted/evidence_status.json`:

```bash
npm run evidence:status -- --write
```

Current status: `acceptedCount = 4` (pilot batch-1 adjudication), `malformedAcceptedRows = 4`, `acceptedCoveredParameterCount = 0`, `proposalRefCount = 7`, `activeParameterCount = 4849`, `releasePriorsAdjudicated = false`.

| Prior provenance | Count |
|---|---:|
| `tierA-nasa` | 34 |
| `tierB-pymc` | 66 |
| `tierB-lit` | 1 |
| `tierC-synth` | 0 |
| **Total** | **101** |

## Quick Start

```bash
git clone https://github.com/strikerdlm/selectron.git
cd selectron
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. For a guided first session, follow **[`docs/Manual.md`](docs/Manual.md) §5–§7**.

```bash
npm run typecheck
npm run verify:fast
npm run build
npm run validate:imm:analog
```

### Python offline calibration (optional)

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -m "not slow"
uvicorn api.main:app --reload --port 8000
```

The Calibration tab uses `http://localhost:8000` by default (`VITE_CALIBRATION_API_URL` override in `.env.local`).

The Python package is an offline calibration and screening-analysis path. Its forward Monte Carlo, validator, and sensitivity reports are simplified Python approximations and are not canonical TypeScript IMM scenario results unless a future golden-test parity suite is added.

## Methodology (summary)

**Stage A:** uncertain-weight MCDA — `S_i = sum_k w_k * z(x_i,k)` with `w ~ Dirichlet(alpha)`.

**Stage B:** IMM-style Monte Carlo over 101 conditions — occurrence → severity → treatment → CHI/QTL aggregation at T = 100,000 trials. Incidence parameters are drawn once per condition per trial and shared across crew members before individual event sampling. Resource depletion is per-resource conservative, while RAF treatment interpolation remains a proposal-stage screening approximation.

Severity sampling is implemented, but the active prior catalog currently has 0 distinct best/worst branch sets and 0 independently adjudicated severity branches; regenerate the audit table with `npm run severity:coverage`.

Trait-to-incidence coupling and profile effects are **off by default** or explicitly labeled as scenario analysis. See the manual for full workflow detail.

## Repository Map

```text
selectron/
├── src/          # TypeScript engine + React SPA
├── tests/        # Vitest + Playwright
├── python/       # PyMC calibration + FastAPI (optional)
├── docs/         # Manual, V&V dossiers, specs
├── research/     # Literature foundation + evidence extraction
├── CHANGELOG.md
├── STATUS.md
└── package.json
```

## Verification

- `npm run verify:fast` — typecheck, import guard, evidence drift check, fast Vitest suite
- `npm run severity:coverage` — regenerate the IMM severity-branch coverage table
- `npm run release:freeze:check` — print source commit, prior hash, and evidence-coverage freeze metadata
- `tests/imm/priors.test.ts` — locks 101-condition prior catalog and provenance counts
- `tests/imm/validation_k15.test.ts` — K15 reference-model regression checks

## Known Limits

See `docs/iter5_scientific_limitations.md`, `docs/future_features.md`, and `STATUS.md`. K15 agreement is inter-model comparison against NASA IMM publications, not validation against observed analog clinical outcomes. Release priors remain unadjudicated until the evidence ledger covers all active parameter paths.

## Citation

> Malpica Hincapie, D. L. (2026). *Selectron: uncertain-weight MCDA and analog mission simulation prototype for space-analog crew-composition scenario analysis*. Zenodo. https://doi.org/10.5281/zenodo.20693257

See `CITATION.cff` for machine-readable metadata.

## License

MIT. See `LICENSE`.
