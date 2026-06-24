# Selectron User Manual

**Version:** 0.6.0-rebaseline.0  
**Last updated:** 2026-06-24  
**Audience:** Researchers, analog-mission planners, and developers using Selectron as a transparent decision-support prototype.

---

## Table of contents

1. [Scope and safety](#1-scope-and-safety)
2. [What Selectron does](#2-what-selectron-does)
3. [Install and first run](#3-install-and-first-run)
4. [Application overview](#4-application-overview)
5. [Step-by-step: Dashboard](#5-step-by-step-dashboard)
6. [Step-by-step: Candidate Wizard (Stage A)](#6-step-by-step-candidate-wizard-stage-a)
7. [Step-by-step: Crew Composition (Stage B)](#7-step-by-step-crew-composition-stage-b)
8. [Step-by-step: Calibration tab](#8-step-by-step-calibration-tab)
9. [Step-by-step: Analysis tab](#9-step-by-step-analysis-tab)
10. [Evidence and prior provenance](#10-evidence-and-prior-provenance)
11. [Command-line tools and verification](#11-command-line-tools-and-verification)
12. [Output metrics glossary](#12-output-metrics-glossary)
13. [Troubleshooting](#13-troubleshooting)
14. [References](#14-references)

---

## 1. Scope and safety

Selectron is a **research prototype** for space-analog crew-selection and mission-scenario analysis. It is **not**:

- A flight-certification or medical-clearance system
- A validated analog crew-selection instrument
- A NASA HSRB verdict engine
- A clinical decision-support product
- A hosted SaaS with cloud storage

All data stay **local** in your browser (IndexedDB). The optional Python service runs on your machine for prior calibration only.

**How to read outputs:**

| Output | Meaning |
|--------|---------|
| Stage A MCDA score | Uncertainty-propagated weighted sum under a demo Dirichlet prior — not a posterior suitability estimate |
| IMM TME / CHI / pEVAC / pLOCL | Monte Carlo scenario estimates under the current prior catalog — not empirical mission forecasts |
| K15 regression check | Inter-model agreement with published NASA IMM reference outputs — not validation against observed analog clinical outcomes |
| Gate flags (psych/cognitive) | Review flags for discussion — hard crew disqualification is optional and labeled |

When the evidence ledger reports **unadjudicated** priors, treat all IMM outputs as **structural scenario exploration**, not calibrated incidence forecasts.

---

## 2. What Selectron does

Selectron combines two methodological layers in one offline-first web application:

### Stage A — Uncertain-weight MCDA

For each candidate, Selectron computes score distributions by sampling criterion weights from a Dirichlet prior and normalizing raw instrument scores onto \([0,1]\):

\[
S_i = \sum_k w_k \cdot z(x_{i,k}), \quad w \sim \mathrm{Dirichlet}(\alpha)
\]

The v0.6 demo prior uses equal means \(m_k = 1/K\) with concentration \(\kappa = K\) (equivalent to `Dirichlet(1,\ldots,1)`). This propagates **weight uncertainty**, not learned suitability from observed mission outcomes.

Because the current prior is applied per listed criterion, domains with more demo criteria receive more aggregate influence than domains represented by fewer criteria. The v0.6 Wizard does not implement hierarchical domain-to-construct weighting; treat domain-level comparisons as catalog-dependent limitations until an expert-ratified weighting model is added.

**Literature context:** Multi-criteria decision models have long supported human spaceflight crew and mission planning trade studies (e.g., priority-assessment MCDA for exploration simulation facilities). Analog astronaut programs apply multi-factor selection processes combining medical, psychological, and operational criteria — Selectron formalizes the **scoring math** separately from any real selection committee workflow.

### Stage B — IMM-style mission simulation

The Integrated Medical Model (IMM) is NASA's probabilistic risk assessment tool for in-flight medical events. It uses Monte Carlo simulation over ~100 medical conditions, treatment pathways, and resource constraints to estimate metrics such as total medical events (TME), Crew Health Index (CHI), evacuation probability (pEVAC), and loss-of-crew-life probability (pLOCL) [1–7].

Selectron's `src/imm/` engine implements an IMM-**aligned** four-step loop:

```
occurrence → severity → treatment/resource pathway → CHI/QTL aggregation
```

It runs 101 evidence-tagged conditions with analog mission profiles, resource kits, and chronological event processing. Outputs support **comparing scenarios** (missions, kits, crew profiles) rather than issuing operational go/no-go verdicts.

The current treatment/resource pathway is a proposal-stage RAF screening approximation: required resources collapse to one scalar and treated/untreated Beta-PERT parameters are linearly interpolated. It does not model non-substitutable components, thresholds, contraindications, treatment delays, provider skill, failure states, or depletion interactions.

For terrestrial analog missions, orbital/pressurized-suit `EVA-coupled` priors are excluded rather than reused. Terrain-field, polar-field, habitat-egress, climbing, vehicle, and analog-suit hazards are reported as not modeled until separate analog-specific exposure denominators and priors are adjudicated.

### How the layers connect

- The **Wizard** scores individual candidates (Stage A only).
- **Crew Composition** simulates team-level medical outcomes (Stage B).
- Optional **trait coupling** (default **off**) can modulate incidence by Stage A z-scores — enabled only as explicit scenario analysis.
- **Profile effects** are default-off unless an effect is explicitly adjudicated; the current communications-delay coefficient is proposal-stage and applies only in exploratory mode.

---

## 3. Install and first run

### Requirements

- **Node.js** 18+ (20 LTS recommended)
- **npm** 9+
- Optional: **Python 3.12–3.14** for Calibration tab / analytic Gamma-Poisson pipeline

### Browser application

```bash
git clone https://github.com/strikerdlm/selectron.git
cd selectron
npm install
npm run dev
```

Open **http://localhost:5173**. No account or network backend is required for core workflows.

### Optional Python calibration service

```bash
cd python
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn api.main:app --reload --port 8000
```

Set `VITE_CALIBRATION_API_URL=http://localhost:8000` in `.env.local` if not using the default.

### Smoke verification after install

```bash
npm run verify:fast          # typecheck + import guard + evidence check + fast tests
cd python && pytest -m "not slow"
```

---

## 4. Application overview

Navigation is via the top header. Five primary views:

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Manage candidate records; import/export local database |
| **Wizard** | Four-step Stage A scoring for one candidate |
| **Crew Composition** | Primary Stage B IMM workflow — configure crew + mission, run Monte Carlo |
| **Calibration** | Browse priors, batch-fit tier-B conditions (Python API), K15 regression V&V |
| **Analysis** | Publication-style exploratory figures (A1–A5) |

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Dashboard  │────▶│    Wizard    │────▶│  Crew Composition   │
│  candidates │     │  Stage A MCDA│     │  Stage B IMM sim    │
└─────────────┘     └──────────────┘     └─────────────────────┘
                                                    │
                    ┌──────────────┐                │
                    │ Calibration  │◀── optional Python API
                    │  priors/V&V  │
                    └──────────────┘
                    ┌──────────────┐
                    │   Analysis   │  exploratory figures
                    └──────────────┘
```

**Persistence:** Candidates, criterion entries, and IMM sessions are stored in IndexedDB (Dexie schema v3). Clearing browser site data deletes local records.

---

## 5. Step-by-step: Dashboard

### 5.1 Create a new candidate

1. Open **Dashboard**.
2. Click **New candidate**.
3. You are taken to the Wizard (Step 1 — Identity).

Alternatively, click **Generate synthetic** to seed a random demo candidate with scores across all 11 demo criteria.

### 5.2 Filter and open existing candidates

1. Use the status filter: **All**, **Draft**, or **Ready**.
2. Click a candidate card to resume the Wizard at the last completed step.

### 5.3 Export / import the local database

**Export:**

1. Click **Export JSON** on the Dashboard.
2. Save the file — it contains all candidates, criterion entries, and IMM sessions.

**Import:**

1. Click **Import JSON** and select a previously exported file.
2. Existing records merge per Dexie import rules.

Use exports for backup, moving between machines, or sharing scenario configs with collaborators.

### 5.4 Delete a candidate

Open the candidate card menu → **Delete**. This removes the candidate and associated criterion entries (IMM sessions may remain unless cleaned separately).

---

## 6. Step-by-step: Candidate Wizard (Stage A)

The Wizard has **four steps**. It scores **one candidate** under the demo MCDA catalog (`src/data/demo-criteria.ts`, 11 criteria). It does **not** run IMM simulation.

### Step 1 — Identity

1. Enter **alias** (required, 2–40 characters).
2. Optionally enter full name and notes.
3. Click **Continue** when alias validates.

### Step 2 — Criteria scores

1. Review the **11 demo criteria** grouped by family (psychological, cognitive, physical, behavioral).
2. For each criterion, enter the **raw instrument value** on its documented scale (e.g., MMPI-2-RF T-scores, NASA Cognition composite).
3. Expand a row to see instrument tier notes, citations, and mini-figures.
4. Missing values **block** progression — the wizard no longer silently imputes worst-case scores.
5. Click **Continue** when all required fields are complete.

**Access tier selector** (top of wizard): Minimum / Medium / Elite changes displayed instrument metadata only; the criterion set and Dirichlet mean weights stay fixed in v0.6.

**Gate criteria** (informational in Wizard; enforced in Crew Composition):

- `psych.mmpi2rf_eid` — fail-if-above 65
- `cognitive.nasa_cognition_battery` — fail-if-below −2.0

### Step 3 — Review

1. Inspect normalized scores and induced MCDA intervals.
2. Confirm citations and score direction (`higherIsBetter` / reversed scales handled correctly).
3. Review the displayed catalog limitations, including the per-criterion weighting imbalance.
4. Click **Continue to mission handoff**.

### Step 4 — Mission handoff

1. Read the summary: Stage A produces **score distributions**, not suitability posteriors.
2. Click **Open Crew Composition** to configure a team-level IMM scenario.
3. Optionally click **Mark ready** to set candidate status to `ready`.

The Wizard **does not** clone this candidate into a synthetic crew or run legacy Stage-B risk simulation.

---

## 7. Step-by-step: Crew Composition (Stage B)

This is the **primary scientific workflow** for analog mission scenario analysis.

### 7.1 Configure the scenario

#### Select mission

1. Open **Crew Composition**.
2. Use the **Mission** dropdown — default catalog includes terrestrial analog campaigns (7 d → 520 d) and Antarctic winter (365 d).
3. ISS missions appear under developer/benchmark entries, not as the default analog workflow.

Each mission carries structured **I&C profile** metadata (communication delay, workload, resupply, evacuation time, etc.). The pilot **comms-delay profile effect** is proposal-stage only: default scientific/adjudicated runs do not apply it, and operators must explicitly select exploratory profile effects before the current behavioral/psychiatric incidence sensitivity coefficient is used.

#### Set crew size and members

1. Adjust **Crew size** (1–6).
2. For each member:
   - **Sex** (male/female) — affects risk-factor multipliers where defined.
   - **Mission flags:** contacts, crowns, CAC+, abdominal surgery history.
   - **EVA:** eligibility toggle and **EVA count** (engine reads per-member count, not mission total alone).
   - **Stage A scores:** use archetype presets (Alpha → Echo) or manual sliders per criterion.

#### Select resource kit

Choose **None**, **ISS HMS analog**, or **Unlimited** kit. Kit choice affects treatment resource availability and RAF interpolation paths; the RAF result is a screening approximation, not a treatment-state model.

#### Simulation controls

| Control | Default | Notes |
|---------|---------|-------|
| Trials (T) | 100,000 | Authoritative run; preview uses T=5,000 |
| Seed | `0xc0ffee` | Deterministic PRNG — same seed → bit-identical results |
| CHI floor (χ*) | 0.5 | Composite health criterion threshold |
| Aggregator | Mean | Crew composite: mean / worst-link / geometric mean |
| Trait coupling | **Off** | Scenario mode applies β-scaled vulnerability multipliers |
| β scenario scale | 1.0 | Only when coupling = scenario |

### 7.2 Review gates and composite

Before running:

1. Check **Gate review** banner — psychiatric/cognitive clearance flags per member.
2. Inspect **Crew composite** panel (mean/worst-link/geometric) across Stage A criteria.
3. Expand member rows for per-criterion detail and citation chips.

Failed gates are **review flags**; the sim can still run unless you choose to exclude members.

### 7.3 Run simulation

1. Click **Run simulation** (or wait for the debounced **preview** at T=5,000).
2. A Web Worker runs Monte Carlo off the main thread (~10–120 s depending on T and hardware).
3. On completion, the **Outcome** panel shows:
   - TME, CHI, pEVAC, pLOCL (with simulation intervals and MCSE)
   - Composite crew health criterion attainment
   - MCSE/Wilson/sparse-tail stopping-rule status and independent-seed replication status
   - CHI clamp count/proportion
   - Expected duty hours lost
   - Evidence coverage statement (`accepted: N / M params · unadjudicated`)
   - Mission evidence grade

**Read the disclaimer:** Scenario output under unadjudicated priors — intervals describe simulated variability, not empirical calibration.

### 7.4 Interpret condition drivers

Scroll to **Condition drivers** (I3 chart):

- pEVAC / pLOCL event-attribution rates on the same percent scale as the headline probabilities
- TME expected event counts per trial
- Driver values are diagnostic attributions, not an additive decomposition of the headline probability
- Kind-multiplier pills for the active mission kind
- Terrestrial analog missions **exclude** space-only conditions automatically (radiation syndrome, space adaptation, EVA-only paths, etc.)

### 7.5 Profile effects disclosure

The **Mission profile → modeled effects** panel lists:

- **Accepted** mechanical effects currently wired (duration exposure and ISS/future space-EVA schedule; terrestrial analog field-EVA remains unsupported)
- **Proposal** effects documented for explicit exploratory mode, including the communications-delay pilot coefficient
- **Unsupported** I&C fields stored descriptively only

### 7.6 Save, load, export session

Toolbar appears once an outcome exists (config-only save available earlier):

| Action | Behavior |
|--------|----------|
| **Save** | Writes immutable IMM session row with full provenance snapshot |
| **Load** | Restores mission, crew, coupling mode, β scale, χ*, aggregator, seed |
| **Export JSON** | Downloads session + assumptions + evidence snapshot |

Exported JSON includes: `couplingMode`, `familyBetaScale`, `profileEffectMode`, `chiStar`, `aggregator`, `profileMappingVersion`, `priorsHash`, `kindMultiplierHash`, `profileEffectsHash`, `activeProfileEffects`, `evidenceStatusSnapshot`, `softwareVersion`, and `sourceCommit`.

### 7.7 Optional: posterior predictive sweep (Python API)

When the Calibration API is running and the mission kind is eligible:

1. The UI fetches per-condition λ posterior draws.
2. A worker runs a **predictive sweep** overlay on the outcome card.
3. If the API is unreachable, the panel shows a local error — core IMM still works offline.

---

## 8. Step-by-step: Calibration tab

Requires optional Python FastAPI service (`uvicorn api.main:app --reload`).

### 8.1 Conditions panel

1. Open **Calibration → Conditions**.
2. Browse all **101 conditions** with provenance tags:
   - `tierA-nasa` — NASA IMM / K15 anchors
   - `tierB-pymc` — historical tag for Gamma-Poisson literature fits now evaluated analytically
   - `tierB-lit` — Hand-curated literature values
3. Filter by provenance or search by condition ID.

### 8.2 Batch Fit panel

1. Open **Calibration → Batch Fit**.
2. Configure fit controls; draws, tune, and chains apply only when sampler diagnostics are explicitly enabled.
3. Click **Start batch fit** — job runs async; a pulsing dot on the nav button indicates background activity.
4. Poll results: analytic posterior parameters, with R-hat, ESS, and divergences populated only for optional sampler diagnostics.

**Release constraint:** Batch fit reads **accepted** evidence rows from `research/evidence_extracted/evidence_ledger.csv`. Proposal CSVs require `--allow-proposals` in CLI mode.

### 8.3 V&V panel (K15 regression)

1. Open **Calibration → V&V**.
2. Click **Run K15 Benchmark** — compares simulator outputs to published NASA IMM reference metrics. This is an inter-model regression benchmark, not external analog-outcome validation.
3. Read **two independent badges** per metric:
   - **Within CI95** (green) — scientific agreement signal
   - **Regression envelope** (amber) — internal regression stable · K15 divergent

Documented-divergent metrics must **not** display an unqualified green PASS.

4. Optional: **Sensitivity analysis** (Sobol/Morris) when API supports it.

CLI equivalent:

```bash
npm run validate:imm
```

---

## 9. Step-by-step: Analysis tab

Exploratory figures for reports and sensitivity review. Uses live candidates when available; otherwise a **seeded demo cohort**.

| Figure | Content |
|--------|---------|
| **A1** | Parallel coordinates — candidate criteria profiles |
| **A2** | IMM risk bubble scatter |
| **A3** | Criteria scatterplot matrix |
| **A4** | Criterion correlation heatmap |
| **A5** | Criterion × condition-family vulnerability coupling heatmap |

**Dev figure harness:** `http://localhost:5173/?testFigure=F1` (F1–F7 for paper figures; A1–A5 via Analysis view).

Toggle **light/dark theme** in the header — persisted in localStorage.

---

## 10. Evidence and prior provenance

### Three-tier prior catalog

Every condition in `src/data/imm-priors.json` carries:

- `provenance` tag (tierA / tierB-pymc / tierB-lit)
- `source_ref` pointing to markdown under `research/`

Current locked counts (see `tests/imm/priors.test.ts`):

| Tag | Count |
|-----|------:|
| tierA-nasa | 34 |
| tierB-pymc | 66 |
| tierB-lit | 1 |
| tierC-synth | 0 |
| **Total conditions** | **101** |

### Evidence ledger workflow

1. Extractions land in `research/evidence_extracted/` (proposal CSVs + `evidence_ledger.csv`).
2. Independent adjudication marks rows `accepted` with extractor + verifier fields.
3. Regenerate status:

```bash
npm run evidence:status -- --write   # update JSON artifacts
npm run evidence:check               # CI freshness gate
npm run evidence:require-adjudicated # release gate (fails until full coverage)
```

4. Python release fitting (`python -m selectron` / `scripts/apply_fit.py`) reads **accepted count extracts** for the analytic Gamma-Poisson fitter; parameter-path acceptance rows are tracked by the TS gate separately.

**Current pilot state (v0.6):** 4 nominal accepted ledger rows exist, but all 4 are malformed and quarantined from accepted coverage; valid accepted coverage is 0/4,849 active parameter paths. Release remains **unadjudicated** until every active parameter path has accepted, independently verified coverage.

### Do not claim

- "Evidence-based calibrated analog incidence" while `releasePriorsAdjudicated=false`
- "NASA-standard applicant verdict" from any UI surface
- "Validated crew selection" from Stage A MCDA intervals alone

For the current prediction boundary, see the model card: [`docs/model_card.md`](model_card.md).

---

## 11. Command-line tools and verification

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (:5173) |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check |
| `npm test` | Full Vitest suite |
| `npm run test:fast` | All tests except slow stochastic (K15, calibration) |
| `npm run test:slow` | K15 + calibration + rhat convergence |
| `npm run verify:fast` | typecheck + import guard + evidence:check + test:fast |
| `npm run guard:active-imports` | Block archived `src/risk` imports in active paths |
| `npm run validate:imm` | K15 reference-model regression (CLI) |
| `npm run validate:imm:analog` | Analog archetype regression tests |
| `npm run calibrate:imm` | TypeScript IMM prior calibration script |
| `npm run e2e` | Playwright browser tests |
| `cd python && pytest -m "not slow"` | Python unit tests |
| `python -m selectron --dry-run` | Analytic Gamma-Poisson batch fit dry-run |

**Determinism:** Seed `0xc0ffee` is canonical across tests, demo cohorts, and K15 invariance checks.

---

## 12. Output metrics glossary

| Metric | Definition |
|--------|------------|
| **TME** | Total medical events per mission simulation |
| **CHI** | Crew Health Index — functional impairment aggregate |
| **pEVAC** | Probability of mission evacuation due to medical event |
| **pLOCL** | Probability of loss of crew life |
| **QTL** | Quality time lost (duty hours) |
| **Composite attainment** | P(no LOCL ∧ no EVAC ∧ CHI > χ*) |
| **MCDA interval** | Percentile band of Stage A score under weight uncertainty |
| **Simulation interval** | Percentile band of simulated mission-to-mission variability under current assumptions; not a confidence interval for real analog outcomes |
| **MCSE** | Monte Carlo standard error of the displayed mean/probability estimate; small MCSE means the simulation estimate is numerically stable, not empirically validated |
| **Stopping rule** | Declared MCSE, Wilson-width, and sparse-tail count target for displayed estimators; independent-seed replication is reported separately and is required before a run is treated as replicated |
| **CHI clamp** | Count/proportion of trials where raw CHI was clipped to the 0–100 display scale |
| **Kind multiplier** | Per-(mission-kind, condition) incidence scaler from prior catalog |
| **Profile multiplier** | Registry-controlled I&C profile effect; communications delay is proposal-stage and applies only in exploratory mode |
| **Vulnerability multiplier** | exp(β·z) on λ from Stage A z-scores (scenario mode only) |

---

## 13. Troubleshooting

### Simulation will not start

- Ensure crew size ≥ 1 and mission duration > 0.
- Check browser console for `SelectronError` validation messages (invalid β scale, NaN scores, etc.).
- Hard refresh if Web Worker stuck after tab sleep.

### Results differ from colleague's run

- Confirm identical **seed**, **trials**, mission ID, kit, crew scores, and coupling mode.
- Preview (T=5,000) ≠ authoritative (T=100,000) — compare only like-for-like.

### Calibration tab shows API error

- Start Python service: `uvicorn api.main:app --reload --port 8000`
- Check CORS and `VITE_CALIBRATION_API_URL`.
- IMM simulation works fully offline without the API.

### Playwright e2e fails in sandbox

- Run Vite manually: `npm run dev`
- Set `PLAYWRIGHT_SKIP_WEBSERVER=1` and point to localhost:5173.

### Evidence check fails in CI

```bash
npm run evidence:status -- --write
git add research/evidence_extracted/evidence_status.json src/data/evidence-status.json
```

### Antarctic / analog mission shows zero space conditions

Expected — terrestrial guard excludes radiation, space adaptation, SPE-coupled, and similar space-only paths.

---

## 14. References

### NASA Integrated Medical Model (IMM)

1. Antonsen, E., et al. (2022). Estimating medical risk in human spaceflight. *NPJ Microgravity*. https://consensus.app/papers/details/9f5d157a2c0f5a30a1aa4aab4946020a/

2. Myers, J., et al. (2018). Validation of the NASA Integrated Medical Model: A Space Flight Medical Risk Prediction Tool. https://consensus.app/papers/details/5dc0d649855e5c3495f4d9d786a8d980/

3. Fitts, M. A., et al. (2008). The Integrated Medical Model: Statistical Forecasting of Risks to Crew Health and Mission Success. https://consensus.app/papers/details/f956bae4bef5524ba3ccc77763512452/

4. Walton, M., et al. (2020). Quantification of Medical Risk on the International Space Station Using the Integrated Medical Model. *Aerospace Medicine and Human Performance*. https://consensus.app/papers/details/7a649a260a6b5c479af386ebdf704212/

5. Kerstman, E., et al. (2009). The Integrated Medical Model - Optimizing In-flight Space Medical Systems to Reduce Crew Health Risk and Mission Impacts. https://consensus.app/papers/details/8338c34cd8825717bf9a0153687a42e6/

6. Keenan, A., et al. (2015). The Integrated Medical Model: A Probabilistic Simulation Model for Predicting In-Flight Medical Risks. https://consensus.app/papers/details/c7e22da542c55289bc48a3027dca9db0/

7. Kerstman, E., et al. (2010). The Integrated Medical Model: A Risk Assessment and Decision Support Tool for Human Space Flight Missions. https://consensus.app/papers/details/74a3d8db3054542097ac79651c45a2c8/

### Analog missions, isolation, and crew behavioral health

8. Basner, M., et al. (2014). Mars-520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. *PNAS*. https://doi.org/10.1371/journal.pone.0093298

9. Bell, S. T., et al. (2019). Getting together and getting along: Meta-analytic evidence for team conflict onset. (Cited in `interpersonal-conflict` prior — analog crew conflict incidence.)

10. Palinkas, L. A., & Suedfeld, P. (2021). Psychosocial issues in isolated and confined environments. *Neuroscience & Biobehavioral Reviews*. https://doi.org/10.1016/j.neubiorev.2021.03.015

### Multi-criteria decision analysis

11. Klarreich, E., et al. (2006). A priority assessment multi-criteria decision model for human exploration mission simulation facility project evaluation. *Journal of the Operational Research Society*. https://doi.org/10.1057/palgrave.jors.2602107

### Selectron software archive

12. Malpica Hincapie, D. L. (2026). *Selectron: uncertain-weight MCDA and analog mission simulation prototype*. Zenodo. https://doi.org/10.5281/zenodo.20693257

---

## Related repository documents

| Document | Content |
|----------|---------|
| `README.md` | Quick start, architecture summary, citation |
| `STATUS.md` | Live task tracker and audit log |
| `CLAUDE.md` | Developer conventions and commands |
| `docs/v0.6_rebaseline.md` | Release gates and disposition matrix |
| `docs/iter3_vv_dossier.md` | Validation & verification dossier |
| `docs/iter5_scientific_limitations.md` | Known scientific limits |
| `CHANGELOG.md` | Version history |

---

*End of manual.*
