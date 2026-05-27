<div align="center">

# Selectron

**A Bayesian multi-criteria scoring engine for analog-astronaut selection.**

*Calibrated uncertainty over candidate fitness — and a NASA-grounded mission-risk verdict — instead of a point estimate.*

---

![status](https://img.shields.io/badge/status-v0.5.4%20%E2%80%94%20Full%20IMM%20calibration%20%2B%20browser%20UI-success)
![tests](https://img.shields.io/badge/vitest-passing-success)
![e2e](https://img.shields.io/badge/e2e-22%20Playwright-success)
![typescript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)
![python](https://img.shields.io/badge/Python%20calibration-3.12-3776ab?logo=python&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5.3-646cff?logo=vite&logoColor=white)
![react](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind&logoColor=white)
![echarts](https://img.shields.io/badge/ECharts-6.0-aa344d)
![dexie](https://img.shields.io/badge/Dexie-4.x-1a6acb)
![license](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## What Selectron is

A working TypeScript application and a methodology paper, in one repository.

Selection panels for human-spaceflight analog missions (D-MARS, AMADEE, HI-SEAS, MDRS, and the broader ASTRA framework proposed by Apollonio et al. at AIAA ASCEND 2026) routinely collapse genuine uncertainty into false ordinal rankings. Selectron does two things instead:

1. **Stage A — Bayesian MCDA.** Each candidate's total score is a **posterior distribution**, not a number. Weights are drawn from a Dirichlet prior elicited from Diego against the Phase-0 literature; a 90 % / 95 % credible interval propagates that uncertainty into the ranking. Two candidates whose posteriors overlap by more than a configurable threshold are flagged as *statistically tied* rather than silently ranked first / second.
2. **Stage B — Mission-risk Monte Carlo.** A NASA-Integrated-Medical-Model-style 4-step forward simulation (occurrence → severity → treatment → CHI/QTL aggregation) at the canonical *T* = 100 000 trials per [M18] / [A22] produces the mission-level **Crew Health Index** (χ), the early-termination probability **P(χ < χ\*)**, and the expected lost crew-days. The result is plotted on NASA's official **Likelihood × Consequence matrix** per **JSC-66705 Rev A** (Human System Risk Board) so the verdict speaks the same language as the institutional process.

The math is in pure TypeScript and runs in-browser. There is no backend and no SaaS — the application is a static build that runs entirely client-side. A separate **Python offline calibration pipeline** (`python/`, PyMC + ArviZ) exists for research-grade prior elicitation and sensitivity analysis; it is not a runtime dependency. The methodology paper's numbers and the application's outputs are produced by the same source, so they cannot drift.

## What Selectron is *not*

- **Not a registry or applicant-tracking database.** That is what ASTRA's *Analog Astronaut Database* (AAD) proposes. Selectron is methodological, not infrastructural.
- **Not a clinical decision-support tool.** It does not diagnose, treat, or medically clear anyone for spaceflight.
- **Not a multi-user platform.** No auth, no shared backend, no SaaS — the spec explicitly forecloses these. Data lives in IndexedDB on the operator's own machine.
- **Not a replacement for human judgement** in selection panels. It is a defensible, audit-friendly input to that judgement — the NASA HSRB color is decision-support, not a verdict.

## Quick start

### TypeScript application (browser runtime)

```bash
git clone https://github.com/strikerdlm/selectron.git
cd selectron
npm install
npm run dev          # http://localhost:5173
npm test             # vitest suite (355+ tests, includes K15 validation at T=100k)
npm run e2e          # 13 Playwright tests (figure snapshots + smoke)
npm run typecheck    # tsc --noEmit
npm run build        # production bundle in dist/
```

### Python offline calibration (research tooling, optional)

```bash
cd python
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m selectron --dry-run   # 50 fast tests + 14 slow (PyMC NUTS + SA)
```

### Python Calibration API (FastAPI, optional — required for Calibration browser view)

```bash
cd python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000   # http://localhost:8000/health
```

The Calibration tab in the browser UI connects to `http://localhost:8000` by default. Override with the `VITE_CALIBRATION_API_URL` environment variable. If the API is not running, the Conditions panel shows a graceful error message; the rest of the app is fully offline-first via Dexie.

## The four-iteration spiral

```mermaid
flowchart LR
    P0[Phase 0 ✓<br/>6-agent literature fan-out<br/>parallel, complete] --> I1
    I1[Iter 1 ✓<br/>vertical slice<br/>Bayesian MCDA<br/>5 placeholder criteria] --> I2
    I2[Iter 2 ✓<br/>12 verified criteria<br/>3-tier scenarios<br/>multi-candidate comparison] --> I3
    I3[Iter 3 ✓<br/>NASA IMM Monte Carlo<br/>NASA HSRB LxC verdict<br/>mission risk + per-mission compare] --> I4
    I4[Iter 4 ✓<br/>IMRaD manuscript<br/>figures from src/<br/>journal submission] --> I5
    I5[Iter 5 ✓<br/>IMM Calculator<br/>100 conditions × 3 kits<br/>K15 validation gate] --> I6
    I6[Iter 6<br/>Python prior calibration<br/>FastAPI + Calibration UI<br/>38/41 tier-B PyMC fitted]
    classDef done fill:#16a34a,stroke:#15803d,color:#fff
    classDef active fill:#eab308,stroke:#a16207,color:#fff
    class P0,I1,I2,I3,I4,I5 done
    class I6 active
```

**Iter 6 (Python offline calibration + evidence hardening) is the active iteration.** The previous iterations shipped:

- **Iter 1** — vertical slice: Bayesian MCDA over 5 placeholder criteria, Mulberry32 PRNG, Marsaglia–Tsang Gamma, Dirichlet sampler with closed-form moment validation.
- **Iter 2** — 12 evidence-grounded criteria with verified DOIs, 3-tier accessibility model (Minimum / Medium / Elite), tier-aware scale transforms.
- **Iter 3** — Stage B NASA IMM-style Monte Carlo at *T* = 100 000 over 12 conditions × 6 crew, NASA HSRB LxC verdict per JSC-66705 Rev A, five-mission comparison panel, CalculationTrace UI.
- **Iter 4** — IMRaD manuscript draft; F1–F7 reproducible figure pipeline from `src/`; two internal peer-review passes; 40/40 bibliography entries Crossref-verified.

**Iter 5 shipped** a full NASA-IMM-aligned probabilistic medical-risk calculator (`src/imm/`): 100 K15-appendix medical conditions × 3 kit scenarios (None / ISS HMS / Unlimited) × T=100 000 Monte Carlo trials; K15 §II.A.9-correct sequential-phase QTL (cp1+cp2+cp3); per-member vulnerability injection via Stage A z-scores; Crew Composition builder with binary clearance gates, per-criterion mini-figures, and Scite-verified citations; 5 IMM result figures (I1–I5); a formal K15 Table 1 reproduction gate (IMM-86: 13 vitest tests, 7/12 metrics within CI₉₅).

**Iter 6 (active)** adds a Python offline calibration pipeline (`python/`) for research-grade prior elicitation: PyMC NUTS Gamma-Poisson fitter, K15 validator, atomic priors writer, Sobol/Morris sensitivity analysis. Evidence pass p-f (2026-05-25) converted 11 former Beta-Bernoulli tier-B conditions to Gamma-Poisson using terrestrial epidemiological base rates; **38 of 41 tier-B conditions are now fittable** (0 Beta-Bernoulli remain). A **FastAPI Calibration API** (`python/api/`) wraps the pipeline: `/health`, `/conditions`, `/fit` (async background jobs), `/validate`, `/sensitivity`. A **Calibration browser view** (`src/ui/views/Calibration.tsx`) provides three tabs — Conditions browser (filterable by provenance, 100-row table with fitted/fittable status), Batch Fit (PyMC NUTS run with live job polling + results table showing R-hat, ESS, divergences), and V&V (placeholder). A typed TypeScript client (`src/api/calibration.ts`) is the sole HTTP boundary between the frontend and the Python API.

The full plan lives in [`docs/superpowers/plans/`](docs/superpowers/plans/). Current resume tracker is [`STATUS.md`](STATUS.md).

## Two-stage pipeline in one diagram

```mermaid
flowchart TB
    subgraph A[" Stage A — Bayesian MCDA · src/engine "]
        direction TB
        E_C[Candidate scores<br/>x_i,k after tier filter]
        E_A[Dirichlet prior α<br/>elicited weights]
        E_N["normalize z(x) → [0, 1]"]
        E_S[Dirichlet sampler<br/>5 000 IID draws]
        E_M[Aggregator<br/>S_i = Σ w_k · z_k]
        E_CF[Closed-form moments<br/>ground-truth check]
        E_P[Posterior of S_i<br/>mean · CI₉₀ · CI₉₅ · ESS]
        E_C --> E_N --> E_M
        E_A --> E_S --> E_M --> E_P
        E_M -.validation.- E_CF
    end

    subgraph B[" Stage B — Mission Risk · src/risk "]
        direction TB
        R_S[Synthetic crew × mission<br/>= 6 members × 5 mission profiles]
        R_PRIOR[Lognormal-Poisson<br/>hierarchical priors]
        R_MC[4-step IMM trial × T=100 000<br/>occurrence → severity → treatment → χ aggregation]
        R_OUT[Posterior:<br/>χ mean · CI · P χ&lt;χ* · E lost crew-days]
        R_VV[σ &lt; 5 % convergence rule<br/>Poisson-Gamma conjugate test]
        R_S --> R_MC
        R_PRIOR --> R_MC --> R_OUT
        R_MC -.V&V.- R_VV
    end

    subgraph V[" Verdict surface · src/ui/figures "]
        direction TB
        V_LXC["NASA HSRB LxC matrix<br/>per JSC-66705 Rev A Fig. 4"]
        V_COLOR["Color: green ≤10 · yellow 11–19 · red ≥20"]
        V_LAY[Plain-English lay layer<br/>χ-gap STRONG/ADEQUATE/MARGINAL/DEGRADED]
        V_LXC --> V_COLOR
    end

    E_P --> R_S
    R_OUT --> V_LXC
    R_OUT --> V_LAY
```

The whole pipeline runs in-browser. Sampling 5 000 Stage-A draws over 8–12 active criteria takes < 500 ms; a full *T* = 100 000 Stage-B Monte Carlo over 6 crew × 12 conditions takes ~10 s on a commodity laptop with a non-blocking overlay (`flushSync` + rAF + 50 ms paint yield) so the page never appears frozen.

## Architecture

```
selectron/
├── src/                      # TypeScript application (browser, no backend)
│   ├── api/
│   │   └── calibration.ts     #   Typed HTTP client for the Python Calibration API (sole network boundary)
│   ├── engine/                # Stage A — pure-TS scoring math, zero React deps
│   │   ├── prng.ts            #   Mulberry32 seeded PRNG
│   │   ├── gamma.ts           #   Marsaglia–Tsang Gamma(shape, 1)
│   │   ├── dirichlet.ts       #   simplex sampling + closed-form moments
│   │   ├── mcda.ts            #   Bayesian aggregation + ESS diagnostic
│   │   ├── normalize.ts       #   [scale.min, scale.max] → [0, 1]
│   │   ├── synthetic.ts       #   seeded candidate generator
│   │   └── errors.ts          #   structured SelectronError codes
│   ├── risk/                  # Stage B — NASA IMM-style Monte Carlo + HSRB LxC
│   │   ├── chi.ts             #   CHI = 1 − QTL/(t·c) closed-form
│   │   ├── conditions.ts      #   12 modeled medical conditions catalogue
│   │   ├── incidence.ts       #   Poisson incidence sampler
│   │   ├── progression.ts     #   severity (treated/untreated) Bernoulli step
│   │   ├── treatment.ts       #   condition → treatment partial-credit
│   │   ├── simulate.ts        #   forward MC trial loop · T=100 000 default
│   │   ├── lxc-definitions.ts #   verbatim JSC-66705 Rev A Fig. 4 tables
│   │   ├── lxc.ts             #   posterior → (L, C, score, color) assessor
│   │   └── priorsSchema.ts    #   priors.json runtime validator
│   ├── imm/                   # IMM Calculator engine (NASA-EMCL-aligned, parallel to src/risk/)
│   │   ├── conditions.ts      #   100 K15 appendix conditions with provenance tags
│   │   ├── simulate.ts        #   4-step trial loop · T=100 000 · Web Worker bridge
│   │   ├── outcomes.ts        #   concurrent FI · K15 §II.A.9 formula · MSP
│   │   ├── lxc.ts             #   IMMOutcome → NASA HSRB LxC matrix verdict
│   │   └── ...                #   incidence · severity · treatment · kits · calibration
│   ├── ui/
│   │   ├── App.tsx            #   view switcher (Dashboard / Wizard / Sim / CrewComposition / Calibration)
│   │   ├── views/
│   │   │   ├── CrewComposition.tsx  # N-member crew builder + IMM MC results
│   │   │   ├── Calibration.tsx      # 3-tab calibration view (Conditions / Batch Fit / V&V)
│   │   │   └── calibration/
│   │   │       ├── ConditionsPanel.tsx  # 100-condition browse table with provenance filter + sort
│   │   │       ├── BatchFitPanel.tsx    # PyMC NUTS run form · live job polling · results table
│   │   │       └── PlaceholderPanel.tsx # V&V tab (forthcoming)
│   │   ├── wizard/            #   4-step wizard: Candidate → Criteria → Review → Mission/Sim
│   │   ├── figures/
│   │   │   └── CriterionMiniFigure.tsx  # Bell-curve PDF per criterion · gate threshold dashed line
│   │   ├── dashboard/         #   candidate roster + recent sim cards
│   │   ├── components/
│   │   │   ├── CrewMemberCard.tsx   # Per-member gate verdict + per-criterion mini-figures
│   │   │   ├── PerScoreCard.tsx     # Single criterion score card with citation chip
│   │   │   ├── CompositeCrewPanel.tsx  # Crew composite aggregator + crew gate verdict
│   │   │   ├── CitationChip.tsx     # DOI + Scite retraction-status badge
│   │   │   ├── ErrorBoundary.tsx    # ErrorBoundary
│   │   │   ├── MissionPicker.tsx    # MissionPicker
│   │   │   ├── ScoreCard.tsx        # ScoreCard
│   │   │   ├── RiskCard.tsx         # RiskCard
│   │   │   └── ToastHost.tsx        # ToastHost
│   │   └── testing/           #   TestFigureHost (DEV-only e2e fixture host)
│   ├── contexts/              #   WizardContext (4-step state + Dexie autosave)
│   ├── db/                    #   Dexie v3 schema + repository (IndexedDB persistence; imm_sessions table)
│   ├── data/
│   │   ├── citations.ts       #   30-entry Scite-verified citation registry (20 confirmed, 3 DOIs replaced)
│   │   ├── imm-priors.json    #   100-condition priors with tier-A/B/C provenance tags
│   │   └── ...                #   12 verified criteria · 5 analog missions · synthetic priors
│   └── types/                 #   Criterion · Candidate · Posterior · AccessTier · risk types · IMMOutcome
├── tests/                     # vitest + Playwright (45+ files, 355+ tests)
│   ├── engine/                #   Stage-A math, math-first TDD
│   ├── risk/                  #   Stage-B IMM trial, convergence, Poisson-Gamma conjugate, LxC
│   ├── imm/                   #   IMM Calculator: incidence, outcomes, K15 validation gate
│   ├── data/                  #   criteria + missions catalogue invariants
│   ├── db/                    #   Dexie repository (fake-indexeddb, jsdom-scoped)
│   ├── ui/                    #   React-Testing-Library on wizard + scenario selector
│   ├── types/                 #   type-level invariants
│   └── e2e/                   #   Playwright snapshot + smoke (22 tests; 9 calibration + 13 prior)
├── python/                    # Offline calibration pipeline (NOT a runtime dependency)
│   ├── api/                   #   FastAPI Calibration API (localhost:8000)
│   │   ├── main.py            #     app entry · CORS for Vite :5173/:4173
│   │   ├── routers/
│   │   │   ├── conditions.py  #       GET /conditions — 100-condition provenance catalogue
│   │   │   ├── fit.py         #       POST /fit · GET /fit/{job_id} — async PyMC batch fit
│   │   │   ├── validate.py    #       GET /validate — K15 Table 1 gate
│   │   │   └── sensitivity.py #       GET /sensitivity — Sobol/Morris SA
│   │   ├── job_store.py       #     in-memory job registry (queued → running → done/failed)
│   │   └── models.py          #     Pydantic request/response models
│   ├── src/selectron/         #   PyMC NUTS Gamma-Poisson fitter · K15 validator
│   ├── tests/                 #   50 fast tests + 14 slow (PyMC NUTS + SA)
│   ├── outputs/               #   Generated evidence CSVs + diagnostic plots
│   └── pyproject.toml         #   selectron-offline 0.1.0
├── research/                  #   Phase-0 literature foundation + tier-criteria evidence
├── docs/                      #   specs + plans + NASA Monte-Carlo audit + V&V dossier
├── paper/                     #   IMRaD manuscript draft (Iter 4)
└── STATUS.md                  #   disconnection-recovery resume tracker
```

## Verification & Validation (V&V)

The V&V dossier maps Selectron against NASA-STD-7009A's eight credibility factors:

- **Factor 1 (Verification)** — closed-form Poisson-Gamma conjugate sanity test (5 cases) and verbatim-grid check of the JSC-66705 Fig. 4 priority-score matrix.
- **Factor 2 (Validation)** — convergence at the NASA-canonical *T* = 100 000 trials per [M18] / [A22], σ < 5 % rule across the last two 1 000-trial increments. K15 Table 1 reproduction gate (IMM-86): 7/12 metrics within CI₉₅.
- **Factor 3 (Input Pedigree)** — 40/40 bibliography entries Crossref-verified (commit `f68ffbc`); 30 Scite-verified citations in `src/data/citations.ts`.

See [`docs/iter3_vv_dossier.md`](docs/iter3_vv_dossier.md) (§5 covers IMM Calculator validation) and [`docs/iter3_nasa_monte_carlo_audit.md`](docs/iter3_nasa_monte_carlo_audit.md) for the verbatim NASA quotes that ground these numbers.

## The research foundation (Phase 0 + tier evidence)

Six independent agents fanned out across the analog-selection literature in parallel before any criterion was hard-coded. Their deliverables sit in [`research/`](research/):

| Deliverable | What it is | Scope |
|---|---|---|
| [`zotero_inventory.md`](research/zotero_inventory.md) | Diego's personal Zotero library on this topic | **288** unique items; 25 central, 65 excluded, 198 related |
| [`04_existing_frameworks.md`](research/04_existing_frameworks.md) | 10 selection programs compared head-to-head | ASTRA · ESA · NASA · JAXA · D-MARS · OEWF · HI-SEAS · MDRS · CSA · Roscosmos |
| [`evidence_tables/psychological.md`](research/evidence_tables/psychological.md) | Psych constructs with retrieved predictive validity | 8 constructs; 7 with peer-reviewed effect sizes |
| [`evidence_tables/medical.md`](research/evidence_tables/medical.md) | Medical / physiological screening criteria | 11 domains; 9 with explicit numeric thresholds |
| [`evidence_tables/behavioral.md`](research/evidence_tables/behavioral.md) | BBI / team-performance constructs | 9 constructs; BBI / Salas Big Five / BHP |
| [`methodology_precedents.md`](research/methodology_precedents.md) | Bayesian MCDA in adjacent domains | 7 precedents; novelty claim grounded |
| [`02_criterion_taxonomy.md`](research/02_criterion_taxonomy.md) | Synthesizer's proposal | 20 criteria, 4 families |
| [`2026-05-19_test_battery_tiers.md`](research/2026-05-19_test_battery_tiers.md) | Tier-1/2/3 instrument evidence (Iter-3 scope expansion) | CogScreen ↔ NASA Cognition Battery alternatives; PVT-B iOS accessibility |

**A finding worth flagging up front:** the methodology-precedents agent recovered seven Bayesian MCDA papers from adjacent domains (clinical trials, healthcare technology assessment, multi-stakeholder ranking), and **zero** that apply Bayesian MCDA to astronaut, aircrew, or analog-astronaut selection. The combination of Bayesian MCDA + NASA HSRB LxC mapping is the paper.

## Methodology, in two paragraphs

**Stage A — Bayesian MCDA.** For each candidate `i`, Selectron models the total score

$$S_i \;=\; \sum_{k=1}^{K} w_k \cdot z(x_{i,k})$$

where weights $w \sim \mathrm{Dirichlet}(\alpha)$ are drawn from a prior elicited from Diego against the Phase-0 evidence, $x_{i,k}$ are the raw assessment scores (in canonical units after tier-aware scale transform), and $z(\cdot)$ is a literature-grounded normalization onto $[0, 1]$. The posterior of $S_i$ is therefore a distribution, not a number; its 90 % and 95 % credible intervals propagate the weight uncertainty into the ranking. Each draw exploits the standard Dirichlet decomposition: K independent Gamma(α_k, 1) variates (Marsaglia–Tsang acceptance-rejection) are divided by their sum, producing exact IID samples with no mixing or burn-in concerns. The sampler is validated against the closed-form Dirichlet moments — every Stage-A test in `tests/engine/` is statistical, not snapshot-based.

**Stage B — Mission-risk Monte Carlo.** Stage A's posterior conditions a synthetic crew of 6 members per analog mission. A 4-step forward simulation (occurrence → severity → treatment → CHI aggregation) is run at the NASA-canonical *T* = 100 000 trials per [M18] / [A22], using lognormal-Poisson hierarchical priors over 12 modeled medical conditions. The mission posterior carries χ (Crew Health Index, χ = 1 − QTL/(t·c)), the early-termination probability **P(χ < χ\*)** at a configurable operational floor (default χ\* = 0.7 per NASA reference programs), and the expected lost crew-days. These three numbers feed the **NASA HSRB Likelihood × Consequence matrix** verbatim from JSC-66705 Rev A Figure 4 — likelihood bucketed by P(χ < χ\*), consequence bucketed by 1 − χ_mean (= fraction of mission crew-days lost) under the Mission Objectives Impact sub-category, then looked up in the 5×5 priority-score grid and mapped to a NASA color per §3.2.4 (red ≥ 20, yellow 11–19, green ≤ 10).

See [`docs/superpowers/specs/2026-05-18-selectron-iter3-risk.md`](docs/superpowers/specs/2026-05-18-selectron-iter3-risk.md) for the full Iter-3 design and the explicit out-of-scope list.

## IMM Calculator + Crew Composition

Selectron now ships a **NASA-IMM-aligned probabilistic medical-risk calculator** alongside Stage A MCDA + Stage B HSRB-LxC. The Crew Composition view (`/CrewComposition`) lets you build a crew of N members, each with their own Stage A scores across the 12 Selectron criteria, and produces:

- **Per-member status**: qualified / disqualified per binary clearance gates (MMPI-2-RF EID T<65 per Harrell 1992; NASA Cognition Battery z>−2 per Basner 2015).
- **Per-criterion ECharts mini-figures**: bell-curve PDF with the member's score marked, gate-threshold dashed line, Scite-verified citation chip (DOI + retraction status).
- **Crew composite** (live): aggregator selectable as `mean` / `worst-link` / `geometric-mean` (worst-link is default, empirically validated by Vâlcea 2019).
- **Crew gate verdict**: whole-crew DQ on any failed member (mirrors NASA's binary disqualification process).
- **IMM Monte Carlo (Web Worker)**: T=100k 4-step trial across 100 NASA-EMCL medical conditions × mission profile × resource kit. Outputs TME, CHI, pEVAC, pLOCL, and the new **Mission Success Probability** (no LOCL ∧ no EVAC ∧ CHI ≥ χ\*).
- **Three kit scenarios**: None / ISS HMS / Unlimited per K15 Table 1; custom kit override available.

**Architecture:** parallel `src/imm/` engine alongside existing `src/risk/`. Engine math: Lognormal-Poisson + Gamma-Poisson + Beta-Bernoulli incidence, Beta-Pert outcomes (RAF interpolation), concurrent FI per K15 §II.A.9, per-member z-scored Stage A vulnerability injection.

**Citations:** every gate threshold + criterion + composite method + MSP formulation cites a Scite-verified primary source via `src/data/citations.ts` (30 entries, 20 Scite-verified, 3 DOIs replaced after Scite caught wrong-paper attribution).

**Result figures** (mounted in CrewComposition's "IMM simulation figures" region when a sim outcome exists):
- **I1 IMMHeadlineCard** — 4-stat hero composite (TME / CHI / pEVAC / pLOCL) + Mission Success Probability + σ(CHI) convergence sparkline.
- **I2 IMMPosteriorHist** — parametric Gaussian-approximated posterior panels with CI₉₀ + μ overlay.
- **I3 IMMConditionDrivers** — per-condition lollipop sorted by contribution; toggle between pEVAC and pLOCL drivers; family-colored dots.
- **I4 IMMConvergencePlot** — σ(CHI) and σ(pEVAC) vs cumulative trials with M18/A22 5 % reference line; T<1 000 sentinel.
- **I5 IMMValidationCompare** — dumbbell run vs K15 issHMS reference (TME=106, CHI=94.93, pEVAC=5.57 %, pLOCL=0.44 %); dots blue if K15 ref ∈ run CI₉₅, amber otherwise.

Three more figures are planned but engine-blocked: **I6 IMMSensitivityTornado** (needs ±50 % per-condition perturbation runner — Phase B2), **I7 IMMCrewRiskHeat** (needs per-crew × per-condition counts surfaced from `runIMMTrial`), **I8 IMMVulnerabilityCalibration** (needs trained vulnerability MLP — Phase 3).

**K15 validation (priors-rev3-e, 2026-05-22):** **7 of 12 K15 Table 1 metrics within CI₉₅** — all 3 TME, issHMS CHI (Δ −4.68), unlimited CHI (Δ +2.71). The engine is mathematically complete per K15 §II.A.9 (cp1+cp2+cp3 sequential phases). 5 tier-B conditions replaced with source-cited Earth-analog rates (27 primary citations; see [`research/_priors_rev3c_synthesis.md`](research/_priors_rev3c_synthesis.md)). The IMM output feeds the NASA HSRB LxC matrix verdict via `src/imm/lxc.ts::assessIMMLxC`. Full delta tables in [`docs/iter5_priors_rev3_strategy.md`](docs/iter5_priors_rev3_strategy.md). Mars (TM21) and Artemis are out-of-scope by design — see [`docs/future_features.md`](docs/future_features.md).

See [`docs/superpowers/specs/2026-05-20-selectron-imm-calculator-design.md`](docs/superpowers/specs/2026-05-20-selectron-imm-calculator-design.md) for the design spec and [`docs/superpowers/plans/2026-05-20-selectron-imm-calculator.md`](docs/superpowers/plans/2026-05-20-selectron-imm-calculator.md) for the 97-task implementation plan.

## Calibration view + Python Calibration API

Selectron now ships a browser-native **Calibration view** that bridges the Python offline pipeline and the running application without requiring the operator to touch a terminal.

The Calibration tab (top-nav, `view.kind === "calibration"`) connects to a FastAPI server (`python/api/`) running on `localhost:8000`. If the server is not running, the Conditions panel shows a graceful error message — the rest of the application remains fully offline-first.

### Python API routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness probe (`{"status":"ok","version":"0.1.0"}`) |
| `GET` | `/conditions` | List all 100 conditions with `provenance`, `distribution`, `fittable`, `fitted` |
| `POST` | `/fit` | Start an async PyMC NUTS batch-fit job; returns `job_id` immediately |
| `GET` | `/fit/{job_id}` | Poll job status (`queued → running → done/failed`); `result` contains per-condition posterior α/β, λ mean, R-hat, ESS, divergences |
| `GET` | `/validate` | Run K15 Table 1 gate against current `imm-priors.json` |
| `GET` | `/sensitivity` | Sobol/Morris sensitivity analysis |

Background job lifecycle is managed by an in-memory `JobStore` (`python/api/job_store.py`). Jobs are dispatched via FastAPI `BackgroundTasks` and survive the HTTP response — the client polls `/fit/{job_id}` every 2 s until `status === "done"` or `"failed"`.

### Calibration browser UI

Three tabs in `src/ui/views/Calibration.tsx`:

- **Conditions** (`ConditionsPanel.tsx`) — filterable (by provenance: `tierA-nasa`, `tierB-lit`, `tierB-pymc`, `tierC-synth`, `user-custom`) + sortable (by condition ID or provenance) table of all 100 conditions with status badges (`Fitted` / `Fittable` / —).
- **Batch Fit** (`BatchFitPanel.tsx`) — configurable NUTS run (draws, chains, seed, optional condition filter). Starts a job, shows a live elapsed timer + status badge, polls until completion, and renders a results table with R-hat (green < 1.01 / amber otherwise), ESS, and divergence count. Job ID is persisted to `localStorage` so polling resumes automatically across page refreshes.
- **V&V** (`PlaceholderPanel.tsx`) — forthcoming; will surface the K15 and sensitivity API endpoints inline.

The TypeScript API client (`src/api/calibration.ts`) is the **sole HTTP boundary** in the application. All other data (candidates, simulations, criteria, criteria entries) is offline-first via Dexie IndexedDB. Override the default base URL with `VITE_CALIBRATION_API_URL` in `.env.local`.

### Starting the API

```bash
cd python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

CORS is pre-configured for the Vite dev server (`:5173`) and preview (`:4173`).

**9 Playwright tests** (`tests/e2e/calibration.smoke.spec.ts`) cover: header render, 100-row conditions table, fitted/fittable badge counts, provenance filter, API-down error state, Batch Fit form, V&V placeholder, and two screenshot snapshots.

## Status

- **Iter 1–3:** code-complete. Bayesian MCDA + NASA IMM Monte Carlo + HSRB LxC verdict all green.
- **Iter 4 manuscript:** IMRaD draft complete; F1–F7 figure pipeline reproducible from `src/imm/`; 40/40 bibliography entries Crossref-verified; two internal peer-review passes applied (14/23 Tier-1 fixes). Ready for npj Microgravity submission pending Zenodo DOI mint + cover-letter update.
- **Iter 5 IMM Calculator:** DONE at v0.5.0. Phase 0 (100-condition catalog + 3-tier priors) DONE; Phase 1 (engine math, σ<5 % convergence) DONE; Phase 2 (data layer + CrewComposition UI + K15 validation gate) DONE; priors re-elicitation rev3-a through rev3-e DONE (7/12 K15 metrics within CI₉₅). Figures I1–I5 shipped; I6/I7/I8 engine-blocked (Phase 3 ML). Phase 3 ML layer (surrogate + vulnerability MLP) not started.
- **Iter 6 Python offline calibration DONE** (v0.5.4): Full 12-task Python pipeline DONE. PyMC batch fit completed: 59 of 59 tier-B conditions merged (provenance `tierB-pymc`); 0 tier-C remain (100/100 conditions evidence-based: 61 tierB-pymc + 39 tierA-nasa). `tierB_multiplier` set to 1.0. K15: 26/26 validation tests pass; TME 98–99 (all scenarios). **FastAPI Calibration API** (`python/api/`) + **Calibration browser view** (`src/ui/views/Calibration.tsx`) + **TypeScript API client** (`src/api/calibration.ts`) DONE (v0.5.2). 9 new Playwright e2e tests. **rev3-f severity tuning DONE** — 32/32 persistent-impairment conditions updated against primary-source literature. Manuscript submission unblocked.
- **Active branch:** `iter1-phase0` (carries all iteration history).

The live resume tracker is [`STATUS.md`](STATUS.md). Citation metadata is in [`CITATION.cff`](CITATION.cff) (GitHub renders a "Cite this repository" button).

## What's left to do

Three distinct backlogs, in priority order: **(A)** manuscript submission (active, unblocked by calibration completion), **(B)** engineering / calibration (stable at v0.5.4), and **(C)** deferred peer-review diagnostics (all closed).

### A. Engineering / calibration backlog (stable at v0.5.4)

0. **PyMC batch fit DONE** (`python/`). 59 of 59 tier-B conditions fitted via PyMC NUTS Gamma-Poisson and merged into `imm-priors.json` (provenance `tierB-pymc`). 0 tier-B-lit remain. `tierB_multiplier` set to 1.0. K15: 26/26 validation tests pass; TME ~98 (all scenarios). **FastAPI + Calibration UI DONE** (v0.5.2).
1. ~~rev3-f severity tuning~~ **DONE** — 32 of 32 persistent-impairment conditions updated against primary-source literature (`severity_f.proposals_rev3f.csv`, 126 evidence rows). `scripts/apply_rev3f_priors.py` automates the CSV→JSON pipeline. 68 self-limiting conditions correctly retain mode=0. Validation passed (T=100k): TME 98.43–99.49 all scenarios ✓.
2. **Outcome parameter re-calibration ATTEMPTED and REVERTED** — closed-form p_evac/p_locl rescale fixes 'none' and 'unlimited' but catastrophically breaks issHMS via RAF-interpolated fall-through coupling. Decision: accept divergence as principled limitation per `docs/iter5_scientific_limitations.md` §3.5.
3. **Per-condition source audit for 3 unfittable conditions** (elbow/hip/wrist-sprain-strain) — no isolated incidence rates in published literature; remain hand-tuned Gamma-Poisson.
4. **~~Fix 5 pre-existing simulate.test.ts failures~~ FIXED** (`dac6b19`): tierB provenance mismatch `"tierB-lit"` → `"tierB-pymc"` + updated test expectations. 37/37 pass. Root cause under investigation.
5. **IMM Phase 3 ML layer** — surrogate model (IMM-52 through IMM-56), vulnerability MLP (IMM-57 through IMM-60), engine toggle + vulnerability mode toggle (IMM-62/63). Unblocks figures I6/I7/I8.
6. **TM21 AMM/SMM validation gate (IMM-87)** — deferred until Mars structural engine prerequisites land (see [`docs/future_features.md`](docs/future_features.md)).
7. **Future features** — Artemis (lunar) and Mars (interplanetary) missions, plus I6/I7/I8 figures, are all in [`docs/future_features.md`](docs/future_features.md) with their structural prerequisites.
8. **Diego sign-offs still open:** Iter-1 UI sanity (Task 17), Iter-3 Mission-risk tab (Task 58), Phase 3F acceptance (Task 88), Iter-2 taxonomy ratification (gates Iter-2 start).

### B. Manuscript submission (active priority — calibration unblocked)

1. **Mint Zenodo DOI** for `v0.5.4` and populate the `__ZENODO_DOI__` placeholder in `paper/manuscript.md` §2.5 + code-availability statement.
2. **Cover letter update** — reflect v0.5.4 contributions (full IMM calibration, K15 §II.A.9 sequential-phase clarification, rev3-f severity tuning).
3. **Submit to npj Microgravity portal.** Manuscript + cover letter + Zenodo DOI + 7 main figures + 2 supplementary figures + signed forms.

### C. Peer-review #2 deferred diagnostics (closed 2026-05-24)

All previously deferred items from `paper/peer-review-tier1-application-log.md` §Deferred are now resolved:
- α₀ ∈ {1, 10, 100} robustness panel (Stage A) — `6b78a73`
- K-S marginal Dirichlet goodness-of-fit test — `1426a5b`
- Brooks-Gelman-Rubin R̂ diagnostic (4 chains × 25k) — `228d12d`
- Non-degenerate worked example (heterogeneous z-scores for F1/F5) — `e24bd90`
- Leave-calibrated-out sensitivity (44 evidence-based conditions) — `8be99ba`

### Recent (v0.5.2 → v0.5.4, 2026-05-23 → 2026-05-26)

Bibliography Crossref walk (40/40 verified, 5 corrected); F6+F7 figures regenerated from IMM Calculator; two peer-review passes + 14/23 Tier-1 fixes applied; rev3-b-followup variance-correct multipliers; rev3-d + rev3-e K15-correct sequential QTL; pre-submission math hardening (all deferred diagnostics closed); evidence pass p-f (11 Beta-Bernoulli → Gamma-Poisson conversions); PyMC batch fit (35 → 57 tier-B fitted, 100% evidence-based); tier-C synthetic → tierB-pymc (18/18 converted — 100% complete, 0 tierC-synth remain); **rev3-f severity tuning (32/32 persistent-impairment conditions updated, 126 evidence rows)**; outcome parameter rescale attempted and reverted (documented as principled limitation); simulate.test.ts provenance fix (37/37 pass); **FastAPI Calibration API + Calibration browser view + TypeScript API client** (v0.5.2, 9 new Playwright tests).

See [`STATUS.md`](STATUS.md) for the full per-task tracker and [`docs/iter5_priors_rev3_strategy.md`](docs/iter5_priors_rev3_strategy.md) for the priors re-elicitation phasing.

## Current limitations

The full catalog lives in [`docs/iter5_scientific_limitations.md`](docs/iter5_scientific_limitations.md). Summary:

| Limitation | Severity | Status |
|---|---|---|
| **K15 calibration target is itself a model output**, not observed in-flight data. Our "reproduction" validates against another model, not reality. | Fundamental | Inherent to IMM methodology; no public alternative exists. |
| **0 of 100 conditions are tierC-synth** (all evidence-based: 41 tierA-nasa + 59 tierB-pymc). Elbow/hip/wrist-sprain-strain fitted via hand-tuned Gamma-Poisson (no isolated incidence evidence found). | Low | 97/100 fitted via PyMC NUTS or NASA source; 3 use hand-tuned Gamma-Poisson from analogous populations. |
| **0 tier-C synthetic priors remain** — all 100 IMM conditions now evidence-based. | Resolved | Final cleanup: acute-radiation-syndrome (literature-validated Beta-Bernoulli) + smoke-inhalation (PyMC NUTS fit against Guibaud 2022). See `research/evidence_extracted/incidence_rates.proposals_p-i.md`. |
| **'none' kit CHI diverges Δ +26** from K15 (85.31 vs 59.20). Untreated-outcome priors under-elicited. | Medium | Accepted: operationally implausible scenario (no real mission has zero medical kit). |
| **Per-event pEVAC/pLOCL on issHMS/unlimited** are small absolute values but outside K15's tight CI₉₅ brackets. | Low | 5 of 12 metrics are documented-divergent with wider tracking brackets in `validation_k15.test.ts`. |
| **Mars / Artemis out of scope** — no comms-delay treatment degradation, no cumulative-dose, no partial-gravity EVA. | By design | Prerequisites catalogued in [`docs/future_features.md`](docs/future_features.md). |
| **32 persistent-impairment conditions** updated against primary-source literature (not NASA-iMED). | Low | rev3-f DONE: 32/32 updated from 126 evidence rows; `scripts/apply_rev3f_priors.py` automates future passes. |
| **NASA-STD-7009/7009A full PDF** not in corpus (only a 1-page poster from W14). | Low | NTRS download or institutional proxy needed. |
| **CrewComposition gate evaluation not tier-aware.** All 12 gates evaluated regardless of session AccessTier; currently hidden by safe default scores. | Low | Sim.tsx fixed in working tree; CrewComposition deferred. |

## Inspiration & citation

**Inspired by but methodologically distinct from:**

> Apollonio, E., Kring, J., Berry, K., & Sawyer, M. (2026). *ASTRA Framework for Enhancing Human Performance and Safety in Analog Missions: A Pathway to Optimizing Analog Astronaut Selection.* AIAA ASCEND 2026, paper 2026-3000. [doi:10.2514/6.2026-3000](https://doi.org/10.2514/6.2026-3000)

ASTRA proposes the *Analog Astronaut Database* (AAD) — standardized infrastructure. Selectron proposes a standardized **methodology** — a Bayesian scoring engine plus a NASA-HSRB-grounded mission-risk verdict, both with explicit uncertainty and a sensitivity audit. The two are complementary, not competitive.

**Primary NASA reference for the mission-risk verdict:**

> NASA Johnson Space Center, Health and Medical Technical Authority (2020). *Human System Risk Management Plan*, JSC-66705 Revision A. Figure 4 (Likelihood × Consequence Scale Definitions and LxC Matrix used for scoring Risks) and §3.2.4 (LxC Assessment and Colors). [NTRS PDF](https://ntrs.nasa.gov/api/citations/20205008887/downloads/FINAL_JSC-66705%20Human%20System%20Risk%20Management%20Plan%20Rev%20B.pdf).

## Author

**Dr. Diego L. Malpica, MD** — Direction of Aerospace Medicine, Colombian Aerospace Force (FAC). Aerospace medicine physician, researcher, pilot, technologist. Bogotá, Colombia.

[github.com/strikerdlm](https://github.com/strikerdlm) · [research repos](https://github.com/strikerdlm?tab=repositories)

---

<sub>Released under the MIT License. Methodology paper accompanying this artifact: Malpica (2026), in preparation.</sub>
