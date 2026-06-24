# Archived Iter-3 V&V Dossier — NASA-STD-7009 Eight Credibility Factors

**Status:** archived historical dossier. Last revised 2026-06-05 before the v0.6 audit containment work.

> **Superseded by v0.6.** This document records historical Iter-3 verification planning and contains retired terminology such as posterior score, credible interval, validation gate, HSRB mapping, and synthetic-prior status. Do not use it as the current Selectron claim boundary, manuscript evidence, evidence-coverage source, or operational validation record. Current boundaries are in `README.md`, `docs/model_card.md`, `docs/iter5_scientific_limitations.md`, and `docs/v0.6_rebaseline.md`.

**Historical mandate:** Iter-3 spec §9 [W14, M18] required the model to be assessed against the eight NASA-STD-7009a credibility factors. This dossier preserved the per-factor plan and the gaps known at the time.

**Canonical eight-factor list** (verbatim from [M18, math_anchors]):

> Verification, Validation, Development Data Pedigree, Input Data Pedigree, Uncertainty Characterization, Results Robustness, Model Use History, Model Management.

The 2014 [W14] poster lists a slightly different eighth factor ("People Qualifications" in place of "Model Management") — per the [STATUS] note on Task 27, this dossier follows **M18 wording** because M18 is the canonical reference for the IMM context Selectron adapts.

---

## Factor 1 — Verification

> *Spec §9 target: closed-form Poisson-Gamma conjugate sanity check (analog of Iter-1's Dirichlet check at `tests/engine/mcda.test.ts`); fixed-value PRNG determinism per seed.*

**Iter-3 evidence:**

- **PRNG determinism:** `src/engine/prng.ts` (Mulberry32, Task 5, commit `456257c`) is verified by `tests/engine/prng.test.ts` — 3 tests for range, determinism, and seed sensitivity. All `src/risk/*` consumers route through this single PRNG so every Monte Carlo trace is reproducible from a single integer seed.
- **Math-module unit suites:** the four IMM models ship with their own seeded tests under `tests/risk/`:
  - `tests/risk/incidence.test.ts` — 21 tests on Poisson (Knuth + Hörmann/PTRS branches) and Binomial (Bernoulli loop) samplers, plus the `applyVulnerabilityMultiplier` log-linear scaling that preserves Poisson conjugacy.
  - `tests/risk/progression.test.ts` — 7 tests on Bernoulli severity sampler.
  - `tests/risk/treatment.test.ts` — 16 tests on linear partial-credit interpolation + the `validatePriorsJson` schema guard.
  - `tests/risk/chi.test.ts` — 17 tests on CHI / QTL / pEarlyTermination aggregation (spec §3.5 closed-form).
  - `tests/risk/simulate.test.ts` — 9 tests including determinism (same seed → identical posterior), CI90 ⊆ CI95 nesting, χ* monotonicity, M18 σ<5% convergence smoke at T=2,000.
- **Closed-form Poisson-Gamma check (SATISFIED, scope-expansion-3):** `tests/risk/poisson_gamma_conjugate.test.ts` (added 2026-05-19, see scope-expansion-3) holds five tests: prior moments E[λ]=α/β + Var[λ]=α/β² within 2%/5%, marginal observation E[N]=(α/β)·t, posterior moments (α+N, β+t), regime-crossover at the Knuth/PTRS λ=30 boundary, and deterministic-seed reproducibility. All pass at 2-5% empirical-vs-closed-form tolerance with 20–50k samples per case.
- **M18 σ<5% adaptive convergence check (SATISFIED, NASA MC audit):** `tests/risk/m18_convergence.test.ts` (added 2026-05-19, see `docs/iter3_nasa_monte_carlo_audit.md`) implements the verbatim NASA IMM convergence rule from [M18] / [A22] — *"<5% change in the average standard deviation of the CHI ... model outcomes in the last 2 sets of 1000 simulation mission trials"* — and asserts Selectron's `simulateMission` at T=100,000 (NASA canonical trial count) satisfies it on the synthetic-iter3-ui-scaffold priors. Empirical σ change at T=100k on the MDRS-2wk demo: well below 1%, comfortably inside the 5% tolerance.

**Status:** SATISFIED. The 70+ Iter-3 unit tests + the Poisson-Gamma conjugate sanity check (5 tests) + the deterministic PRNG cover the structural verification expected by NASA-STD-7009 Factor 1.

---

## Factor 2 — Validation

> *Spec §9 target: leave-one-mission-type-out cross-validation: fit on Mars500 + HI-SEAS + Antarctic, predict EMMPOL incidence; report % within 90% CI per condition. Mirrors [M18 §3] but on analog data.*

**Iter-3 evidence:**

- **Spec context [Risks §11.4]:** "Selectron has no analog-mission outcome labels (we are not running analog missions; we are modelling them). Validation is therefore internal (closed-form, cross-mission CV) plus face-validity panel of analog-mission PIs."
- **M18 benchmark:** [M18 §3] reports IMM predictions within 90% CI in 13/21 STS and 15/31 ISS missions; medication-utilization Kendall Tau-b of 0.76 (STS) / 0.57 (ISS). Selectron's leave-one-mission-out CV target should be reported in the same form.
- **Pending artifact:** a `notebooks/iter3_loocv.ipynb` (NOT YET CREATED) will hold the LOOCV runs once T37 → T40 produces the trained `priors.json`. Should be authored as part of Task 59 (Iter-3 full-suite acceptance).
- **Data sparsity caveat:** with only 19 proposed rows from the I&C corpus across ~10 (condition, mission) cells (P-A 12 + P-B 7), LOOCV per condition will be statistically thin. Document honestly — many conditions will have one mission's data only, making LOOCV degenerate for them.

**Status:** UNSATISFIED — pending T37 curation → T40 fit → T59 LOOCV notebook.

---

## Factor 3 — Development Data Pedigree

> *Spec §9 target: `research/evidence/INDEX.md` lists 31 papers with DOIs; `incidence_rates.csv` carries study DOI per row.*

**Iter-3 evidence:**

- `research/evidence/INDEX.md` — 31 papers, 423 OCRed pages. 26 papers carry verified DOIs; the 5 without DOI are pre-DOI-era or grey literature (Hudson, Landon, Zimmer, Vermeulen, Tafforin 2013 — all noted explicitly in the INDEX). Each paper has YAML frontmatter with `study_doi`, `pages`, `mcp_tool_used`, `fetched_utc`, `verified` fields.
- `research/imm_sources/INDEX.md` — 16 papers, ~200 pages. G12 cross-source verified (Task 29.5, commit `2270449`) against an NTRS-original PDF; CORE-derived OCR had Eq.(1) σ collapsed to "0" and Appendix B equations garbled — NTRS OCR rendered cleanly. Cross-verification documented in INDEX with `cross_source_verified: true`.
- `research/evidence_extracted/SCHEMA.md` defines the `study_doi` + `study_slug` columns that traceable every CSV row back to a source markdown.

**Status:** SATISFIED. The corpus is documented, OCRed, DOI-tagged, and audited.

---

## Factor 4 — Input Data Pedigree

> *Spec §9 target: hand-curated by Diego; documented in `notebooks/iter3_imm_fit.ipynb` audit cell.*

**Iter-3 evidence:**

- **Curation contract:** `research/evidence_extracted/extraction_protocol.md` (Task 35, commit `8fa5fd6`) defines the subagent → Diego workflow: subagents append proposals to `incidence_rates.proposals_p-{a,b,c}.csv`, Diego promotes rows by copying to `incidence_rates.csv` and setting `extracted_by = "Diego"`.
- **Audit cell:** `notebooks/iter3_imm_fit.ipynb` Cell 1 asserts `(df["extracted_by"] == "Diego").all()` — the notebook refuses to fit proposal rows. If Diego rejects a proposal, the row stays in `.proposals.csv` with a `REJECTED: <reason>` notes column annotation.
- **Subagent attribution:** the three Task-36 subagent commits (`c2ac879` P-A, `c3e5528` P-B, `7387857` P-C) each list per-paper coverage in the commit message — what was extracted, what was skipped, why. Surfaced concerns per subagent are also in the conversation audit and the `extraction_audit.md` follow-up (Task 38, PENDING).
- **Hand-elicitation audit:** `research/imm_sources/_beta_elicitation_audit.md` (T41 template, commit `a4e21c3`) holds the rationale for each `vulnerability_beta`, `worst_case_prob_q`, `treated/untreated_lost_days_mean` Diego elicits from the evidence tables. Numbers placeholder pending Diego's T41 work.
- **Tier-aware audit trail (scope-expansion-3):** Each saved `simSession` now carries an explicit `tier=<minimum|medium|elite>` prefix in its `notes` field (T95, commit `1934988`), making the instrument-realisation of every criterion traceable from the simulator output back to the candidate's chosen accessibility tier and forward to the verified DOIs in `placeholder-criteria.tierInstruments[tier].citations` (T91, commit `0a49407`). The CalculationTrace tier chip + F1/F2 caption tier mention close the loop visually for the reviewer.

**Status:** PARTIALLY SATISFIED. Contract + audit-doc structure in place; concrete pedigree completes when Diego ratifies T37 + T41. **Tier-trace audit** (scope-expansion-3) is fully implemented and routes from selection-instrument metadata to the simSession record.

---

## Factor 5 — Uncertainty Characterization

> *Spec §9 target: full posterior reported with CI₉₀ and CI₉₅, not point estimates. Per-condition contribution shown.*

**Iter-3 evidence:**

- **Type contract:** `RiskPosterior` in `src/types/risk.ts` (Task 45, commit `afabbf7`):
  ```
  chi: { mean, ci90, ci95 }
  pEarlyTermination: { mean, ci90 }
  expectedLostCrewDays: { mean, ci90 }
  perConditionQTL: Record<string, PosteriorSummary>
  ```
  Point estimates alone are not representable in the type — every consumer gets CI bands.
- **Simulator implementation:** `src/risk/simulate.ts::simulateMission` (Task 52, commit `4cfc3f7`) computes empirical CI₉₀ and CI₉₅ from the trial array via order statistics, plus a batch-means CI on pEarlyTermination per the M18 σ<5% convergence rule.
- **UI surface:**
  - **F2 RiskHistogram** (`src/ui/figures/RiskHistogram.tsx`, Task 79 + caption Task 86) shows the CHI posterior as a histogram with shaded CI₉₀ markArea + dashed μ markLine.
  - **F3 ConditionContribution** (`src/ui/figures/ConditionContribution.tsx`, Task 81) renders per-condition QTL as a horizontal stacked bar with 90% CI whiskers per segment (CI whiskers were specifically added at T81 as the "upgrade" over the T56 v1).
  - **RiskCard** (`src/ui/components/RiskCard.tsx`, Task 55) presents CHI mean + CI₉₀ + CI₉₅, pEarlyTermination mean + CI₉₀, lost-crew-days mean + CI₉₀, plus ESS and trial count — every quantity flanked by its credible interval.
  - **F1 PosteriorPlot** (`src/ui/figures/PosteriorPlot.tsx`, Task 80) shows the Stage-A MCDA posterior with the same CI₉₀/μ overlay pattern.
- **Q1 captions** (Tasks 85, 86): every figure carries an inline `<FigureCaption>` with a Methods/Source/Repro block; the Methods line explicitly states the statistical estimator (e.g. "CI90 shaded; posterior mean overlaid as dashed line").

**Status:** SATISFIED. The type system, simulator, UI, and captions all surface CIs and per-condition contributions; the Stage-B output cannot be reduced to a point estimate.

---

## Factor 6 — Results Robustness

> *Spec §9 target: sensitivity analysis — rerun forward MC with τ_k scaled by {0.5, 1, 2}; report rank stability of mission rankings.*

**Iter-3 evidence:**

- **Tracked task:** Task 61 (`notebooks/iter3_sensitivity.ipynb`) is the explicit sensitivity-analysis side study described in spec §9 + plan Part E. PENDING — gated on T40 producing a `.nc` trace.
- **Outline (from the plan):** load the trace from T40, generate three alternative `priors.json` (`priors.json.tau_half`, `.tau_double`), re-run `simulateMission` on the canonical crew × 5 missions for each. Compute Spearman ρ between rankings under different τ scalings + per-mission CHI shift.
- **Partial coverage today:** the Mission-comparison figure F7 (`src/ui/figures/MissionComparison.tsx`, Task 84) already runs the simulator across all 5 missions on demand and renders a small-multiples grid — this is a *prerequisite* of the sensitivity study (one ranking at τ=1). The sensitivity study will plug in τ=0.5 and τ=2 versions.

**Status:** UNSATISFIED — pending T40 + T61.

---

## Factor 7 — Model Use History

> *Spec §9 target: Iter-4 (methodology paper) IS the use-history publication.*

**Iter-3 evidence:**

- **Iter-4 paper:** documented in spec §2 as "Paper #2 of the Selectron series. Target venue: *npj Microgravity* or *Computers in Biology and Medicine*. *Aerospace Medicine and Human Performance* held as fallback."
- **Status:** UNSATISFIED — Iter-4 has not been drafted. The methodology spec at `docs/superpowers/specs/2026-05-18-selectron-iter3-risk.md` + this dossier are the seeds. Iter-4 plan does not yet exist.
- **Adjacent use-history evidence:**
  - **THOR analog (Malpica 2024)** — primary author (Diego) deployed Selectron's Stage A on a real analog crew. Documented in `research/evidence/malpica-2024-thor-isolation-confinement-responses.md`.
  - **Phase 3F end-to-end flow** — confirmed by Playwright at T87 (commit `61557c2`): a candidate enters the wizard, gets scored by Stage A, fed into Stage B's `simulateMission`, produces a stored simSession. The end-to-end pipeline is exercised in the test suite.

---

## Factor 8 — Model Management

> *Spec §9 target: git history; `priors.json` versioned by `model_version` field.*

**Iter-3 evidence:**

- **Git history:** the repo is at HEAD `a4e21c3` as of this write. The Iter-3 + Phase 3F + Phase 3A work spans the commit range `4cfc3f7..HEAD` (~70+ commits, all on branch `iter1-phase0`, all on `origin/strikerdlm/selectron`). Each task ships its own `feat:` + `docs(status):` commit pair (Iter-3 plan's recovery protocol).
- **`priors.json` versioning:**
  - The schema field `model_version: string` is enforced by `src/risk/priorsSchema.ts` (Task 50) — every `validatePriorsJson` call checks for it.
  - The current synthetic placeholder ships as `model_version = "synthetic-iter3-ui-scaffold"` (`src/data/synthetic-iter3.ts`).
  - The PyMC notebook's Cell 5 will set `model_version = "iter3-v1"` when T40 runs against Diego-curated rows.
  - Sim-session rows in IDB (Dexie schema `simSessions.priorsVersion`) carry the prior-version string used at sim time, so every saved sim is traceable to a specific frozen prior — even across schema upgrades.
- **STATUS.md** at the repo root is the single dynamic-state audit log; every task ends with an entry timestamped UTC.
- **CHANGELOG-equivalent:** the commit-message format `<type>(scope): <summary> (Task N)` is enforced by Diego across the Iter-3 + Phase 3F work — every implementer subagent has surfaced its task number in the commit subject, making `git log --grep "Task 5[2-7]"` a usable retrieval tool.

**Status:** SATISFIED.

---

## Summary table

| # | Factor | Status | Outstanding work |
|---|---|---|---|
| 1 | Verification | SAT | Closed-form Poisson-Gamma test added in scope-expansion-3 (`tests/risk/poisson_gamma_conjugate.test.ts`). |
| 2 | Validation | UNSAT | T59 LOOCV notebook (gated on T37 → T40). |
| 3 | Dev data pedigree | SAT | — |
| 4 | Input data pedigree | PARTIAL | Diego T37 curation + T41 elicitation. |
| 5 | Uncertainty | SAT | — |
| 6 | Robustness | UNSAT | T61 sensitivity notebook (gated on T40). |
| 7 | Use history | UNSAT | Iter-4 paper (post-3F). |
| 8 | Management | SAT | — |

**Net:** 4 / 8 fully satisfied today (scope-expansion-3 promoted Verification PARTIAL→SAT via the Poisson-Gamma conjugate test); 1 / 8 partial (Input Data Pedigree — Diego T37 pending); 3 / 8 pending downstream work (Validation, Robustness, Use History). The unsatisfied factors all share a single dependency: Diego's T37 curation unblocks T40 → T59 LOOCV → T61 sensitivity. The Iter-4 paper is a downstream deliverable.

**Re-read this dossier on every Iter-3 acceptance step** (T59, T61, T43 sign-off) and update statuses + outstanding-work cells.

---

## 5. IMM Calculator validation (Iter-5)

### 5.1 Catalog coverage

- 100 K15 appendix conditions (`src/imm/conditions.ts`), every condition with `provenance` tag.
- Tier-A NASA-published: 40 (M18 Table 1 8 conditions, G12 Bayesian 5, TM21 Mars drivers ~21, S20 ISS DRM 6, A22 aggregate).
- Tier-B literature: 42 (Phase-0 I&C corpus 25, NASA evidence-report bridges + Phase-0 tables 17).
- Tier-C synthetic back-fit: 18.
- `vulnerabilityCriteria` populated on 58 conditions (psychiatric 3, behavioral 1, neurologic 7, infectious 7, musculoskeletal 19, cardiovascular 5, respiratory 2, space-adaptation 10, traumatic 4).

### 5.2 K15 Table 1 reproduction

Run `npm run validate:imm` to regenerate. Snapshot from the **rev3-a post-normalization** run (T=100 000 trials, seed `0xc0ffee`, K15 reference crew 4M 2F per `K15_REFERENCE_CREW` in `src/imm/calibration.ts`). Source export: `exports/2026-05-22_validate_imm_rev3a_post_normalization.txt`. K15 reference means and CI₉₅ brackets are taken verbatim from Keenan 2015 Table 1 (see `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md` math_anchor "Validation table").

| Scenario | Metric | K15 reference mean [CI₉₅] | Selectron rev3-a (mean) | Δ | Within CI₉₅? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| none | TME | 98.3 [73, 122] | 149.4 | +51.1 | ✗ | incidence-OOS (rev3-b) |
| none | CHI | 59.20 [43.36, 71.25] | 48.87 | −10.33 | ✓ | — |
| none | pEVAC | 66.90% [66.57, 67.14] | 19.36% | −47.54 | ✗ | untreated.p_evac under-elicited (rev3-c) |
| none | pLOCL | 2.89% [2.78, 2.99] | 0.67% | −2.22 | ✗ | untreated.p_evac under-elicited (rev3-c) |
| issHMS | TME | 106 [87, 126] | 150.86 | +44.86 | ✗ | incidence-OOS (rev3-b) |
| issHMS | CHI | 94.93 [84.30, 98.50] | 60.79 | −34.14 | ✗ | incidence-OOS (rev3-b) |
| issHMS | pEVAC | 5.57% [5.43, 5.72] | 12.82% | +7.25 | ✗ | incidence-OOS (rev3-b) |
| issHMS | pLOCL | 0.44% [0.40, 0.49] | 0.31% | −0.13 | ✗ | overshot slightly below (rev3-c may correct) |
| unlimited | TME | 106 [87, 126] | 152.17 | +46.17 | ✗ | incidence-OOS (rev3-b) |
| unlimited | CHI | 94.98 [84.40, 98.50] | 92.98 | −2.00 | ✓ | — |
| unlimited | pEVAC | 4.93% [4.80, 5.07] | 2.49% | −2.44 | ✗ | overshot slightly below (rev3-c may correct) |
| unlimited | pLOCL | 0.45% [0.41, 0.49] | 0.26% | −0.20 | ✗ | overshot slightly below (rev3-c may correct) |

*Caption.* As of rev3-a, K15 reproduction is **partial**: only two of twelve metrics land inside CI₉₅ — `unlimited` CHI (Δ −2.00, well inside the [84.40, 98.50] bracket) and `none` CHI (Δ −10.33, inside the wide [43.36, 71.25] bracket). TME is uniformly **+44 to +51 high across all three scenarios**, indicating an incidence-level over-prediction that propagates into every downstream metric (deferred to **rev3-b** — incidence calibration; see STATUS.md audit log). `none`-scenario pEVAC is severely under-elicited (19.4 % vs 66.9 % reference; Δ −47.5), pointing at untreated.p_evac priors that are too low — deferred to **rev3-c** (untreated-outcome elicitation). The remaining ✗ rows for issHMS / unlimited pEVAC and pLOCL are smaller-magnitude misses that may resolve as a side-effect of rev3-c.

### 5.3 TM21 AMM/SMM cross-walk

TM21 (Antonsen / Myers 2021 *NASA TM-20210015527* DRMs) provides aggregate AMM (asteroid redirect mission, 426 d, 4-crew, 60 EVAs) and SMM (Mars short-stay, 923 d, 4-crew, 401 EVAs) outcomes that Selectron's engine should reproduce in spirit if not to a published CI. Snapshot from the same rev3-a export (`exports/2026-05-22_validate_imm_rev3a_post_normalization.txt`):

| DRM | TME | CHI | pEVAC | pLOCL | Reference band (script comment) |
| --- | --- | --- | --- | --- | --- |
| amm-426d (426 d, 4-crew, 60 EVAs) | 206.3 | 59.80 | 20.56% | 0.53% | ~25-40 % pEVAC, ~5-12 % pLOCL |
| smm-923d (923 d, 4-crew, 401 EVAs) | 403.1 | 59.14 | 41.55% | 1.27% | ~40-65 % pEVAC, ~15-30 % pLOCL |

*Note.* TM21 has no formal validation gate yet (IMM-87 deferred); the bands above are spec-level expectations encoded as comments in `scripts/validate_imm.ts` (lines 35-36), **not** published K15-style CI₉₅s. AMM pEVAC (20.56 %) sits below the lower bound of the spec band (25 %), and SMM pEVAC (41.55 %) lands just inside its band (40-65 %). pLOCL is materially under-elicited in both DRMs (0.53 % vs 5-12 %; 1.27 % vs 15-30 %) — the same under-elicitation pattern as `none` pLOCL in §5.2, supporting the rev3-c untreated-outcome hypothesis.

### 5.4 ML layer status

- Surrogate (LightGBM): NOT YET TRAINED — deferred to Phase A1 of the IMM Calculator plan (post-MVP).
- Vulnerability MLP: NOT YET TRAINED — deferred to Phase A2 (publication novelty hook). The deterministic per-member Stage A z-score injection (commit `9d5abc7`) is the v1 substitute.

### 5.5 NASA-STD-7009A factor mapping

- **Factor 1 (Verification):** 8 closed-form moment tests across incidence, severity, outcomes, treatment, simulate. `coupling_amplitude.test.ts` regresses against worst-vs-best ≥ 5 pp.
- **Factor 2 (Validation):** `validate_imm.ts` reports per-metric per-scenario K15 deltas. Run after every priors or engine change. **As of 2026-05-22 rev3-a, K15 reproduction is partial — see §5.2. Full reproduction blocked on rev3-b incidence calibration.**
- **Factor 3 (Input Pedigree):** Tier-A / Tier-B / Tier-C provenance tags on every condition; 30-entry `src/data/citations.ts` with Scite-verified DOIs (20/28 confirmed, 3 wrong DOIs replaced via Scite).
- **Factors 4-8:** out of scope (per the IMM Calculator design spec §10).

---

## 6. Gate-then-modulate architecture (added 2026-05-21)

### 6.1 Defect that triggered this revision

Diego reported (2026-05-21): "a bad candidate by the worst values of the tests" placed in Antarctic winter-over or Mars500 was producing LxC GREEN — logically inconsistent with the scientific intent of Selectron.

The reproducer `scripts/reproducer_bad_candidate.ts` (commit `c4de4a9`) confirmed and quantified the defect: at T=20 000 trials with seed `0xc0ffee`, WORST and BEST candidates produced identical LxC GREEN verdicts on every mission, with a worst-vs-best CHI delta of only 0.12 percentage points on `antarctic-winter-over` (365 d × 12 crew).

### 6.2 Root cause

Three architectural defects worked together to mute the candidate signal:

1. **`vulnerability_beta = 0` for non-psychiatric condition families.** In `src/data/synthetic-iter3.ts`, only conditions of family `"psychiatric"` received non-zero β (-0.05); every other family had β = 0.0. Six of eight conditions that nominally couple to Selectron criteria via `vulnerabilityCriteria` were therefore insensitive to candidate quality.

2. **Stage A scores were passed raw to the vulnerability product** (`vulnerabilityVector` in `src/risk/simulate.ts`), without z-score normalisation against criterion scale. With β as small as 0.05 and raw scores in [0,1] or [0,100] units, the β·z product was dimensionally inconsistent and the resulting multiplier `exp(β·z)` was effectively pinned near 1.0 regardless of candidate quality.

3. **No select-out gates anywhere.** The criterion `psych.psychopathology_clearance` was specified in the Phase-0 taxonomy (`research/02_criterion_taxonomy.md`) as a binary 0/1 MMPI-2-RF exclusion gate. The runtime implementation in `src/data/placeholder-criteria.ts` instead built `psych.mmpi2rf_eid` as a continuous T-score 30–120 contributing to the MCDA composite. A candidate who failed psychiatric screening was not excluded; their composite score was merely slightly lower. NASA's actual selection process uses binary clearance for psychiatric, medical, and cognitive minima — Selectron did not.

Advisor (consulted 2026-05-21 with the reproducer numbers in hand) confirmed the diagnosis: the math for a *qualified* candidate is roughly correct (Palinkas 2004 reports ~6% Antarctic psychiatric incidence per winter; 12-crew × 365-day × moderate functional impairment yields CHI ≈ 99.6%, matching engine output of 99.47%). The bug is what is allowed to reach Stage B at all.

### 6.3 Fix applied — tasks G1–G9 of the gate-then-modulate plan

| Task | Commit | What it does |
|---|---|---|
| G1 | `8c17a5b` | New types: `GateVerdict`, `GateResult`, `Criterion.gateThreshold` |
| G2 | `051fb54` | `src/engine/gates.ts::evaluateGates(candidate, criteria)` |
| G3 | `0473761` | `gateThreshold` wired on `psych.mmpi2rf_eid` (fail-if-above 65; MMPI-2-RF clinical elevation, Ben-Porath & Tellegen 2008/2011) and `cognitive.nasa_cognition_battery` (fail-if-below −2.0; 2 SDs below astronaut cohort, Basner 2015 DOI 10.3357/amhp.4343.2015) |
| G4 | `5a07078` | `assessLxC(posterior, gate?)` returns L5×C5=25 RED with `disqualified: true` when gate verdict is disqualified |
| G5 | `df31104` | `zScoreAgainstScale(raw, scale)` helper + `vulnerabilityVector` z-scores against criterion scale with sign flip for `higherIsBetter: false` criteria |
| G6 | `470a27b` | Family-specific `vulnerability_beta` magnitudes (psychiatric -0.4 → renal -0.15; default -0.2). With G5 z-score normalisation, worst-vs-best candidates produce a 2-4× incidence multiplier spread |
| G7 | `4719951` | UI wiring: `CHIExplainer.tsx` and `MissionComparison.tsx` evaluate the gate and pass it to `assessLxC`; red-bordered DISQUALIFIED banner lists the failed gate ids |
| G8 | `0fdb184` | Reproducer extended with DISQUALIFIED candidate; gate verdict printed alongside Monte Carlo output; STATUS.md captures the acceptance evidence |
| G9 | (this commit) | V&V dossier §6 (this section) |

### 6.4 Post-fix validation

The reproducer (`scripts/reproducer_bad_candidate.ts`, T=20 000 trials, seed `0xc0ffee`) reports:

```
=== antarctic-winter-over (365d, n=12, EVAs=0) ===
  WORST | CHI 99.24% | ELCD 33.3 | LxC L5×C5=25 red | DISQ:cognitive.nasa_cognition_battery,psych.mmpi2rf_eid
  MID   | CHI 99.47% | ELCD 23.2 | LxC L5×C5=25 red | DISQ:psych.mmpi2rf_eid
  BEST  | CHI 99.59% | ELCD 17.9 | LxC L1×C1=1 green | qualified
  DISQ  | CHI 99.47% | ELCD 23.2 | LxC L5×C5=25 red | DISQ:psych.mmpi2rf_eid

=== hi-seas-45d (45d, n=6, EVAs=12) ===
  WORST | CHI 41.02% | pET 100.00% | ELCD 159.3 | LxC L5×C5=25 red | DISQ:cognitive.nasa_cognition_battery,psych.mmpi2rf_eid
  MID   | CHI 86.88% | pET 0.00%   | ELCD 35.4  | LxC L5×C5=25 red | DISQ:psych.mmpi2rf_eid
  BEST  | CHI 94.23% | pET 0.00%   | ELCD 15.6  | LxC L1×C3=5 green | qualified
  DISQ  | CHI 86.88% | pET 0.00%   | ELCD 35.4  | LxC L5×C5=25 red | DISQ:psych.mmpi2rf_eid
```

(Full output in STATUS.md under "Gate-then-modulate validation".)

The coupling amplitude test (`tests/risk/coupling_amplitude.test.ts`) asserts worst-vs-best CHI delta ≥ 5 pp on `hi-seas-45d`; the measured delta is **53 pp** (94.23 % − 41.02 %), well above threshold.

Acceptance criteria from the plan, all met:
- DISQ candidate red on every mission via gate override (no Monte Carlo trust)
- BEST candidate green/yellow on every mission
- WORST candidate red on every mission (fails both gate criteria; pre-fix would have been green)
- Coupling amplitude delta ≥ 5 pp on hi-seas-45d (actual: 53 pp)
- Full vitest suite green (147/147 at G8 commit, plus 4 new disqualified-banner tests)
- No new typecheck errors (pre-existing TestFigureHost.tsx TS6133 acceptable)

### 6.5 Known semantic tensions (deferred)

Two issues surfaced that are honest behaviour, not bugs, but worth surfacing to future maintainers:

1. **Minimum-tier candidates missing elite-tier scores.** `psych.mmpi2rf_eid` (minimumTier: "elite") and `cognitive.nasa_cognition_battery` (minimumTier: "medium") may be `undefined` for minimum-tier users who do not have those measurements. The gate engine treats missing scores as `disqualified` (NASA's safe default — "we cannot clear what we cannot measure"). UI may want to surface this distinction more explicitly: "clearance unevaluated" vs "clearance failed". Deferred.
2. **Long-duration EVA=0 missions** (Antarctic winter-over, Mars500) show small CHI deltas across qualified-candidate quality bands because the EVA-coupled conditions (musculoskeletal-injury, early-termination-request) don't fire. The ELCD (expected lost crew days) does show 1.86× worse outcomes for worst candidates, so the coupling is operating. Adding more isolation-stress-coupled conditions (Mars-500 / Antarctic literature) would improve CHI discrimination on these missions. Tracked as a Phase-0 evidence-expansion follow-up.

### 6.6 NASA-STD-7009A factor mapping update

This fix improves the following V&V factors:
- **Factor 2 (Validation)**: the LxC verdict now meaningfully discriminates candidate fitness — the central scientific claim of Selectron.
- **Factor 3 (Input Data Pedigree)**: the gate thresholds are anchored to NASA-published norms (MMPI-2-RF clinical elevation; Basner 2015 NASA Cognition Battery astronaut-cohort z-score baseline).
- **Factor 7 (Results Robustness)**: the coupling amplitude test (`tests/risk/coupling_amplitude.test.ts`) provides a regression guard against future amplitude regressions.

---

## 7. Antarctic / controlled-habitat context modulation (added 2026-06-04)

Per Diego 2026-06-04: the IMM Calculator previously treated every analog
mission identically (ISS K15 priors applied to all). Antarctic stations
are occupationally exposed — extreme cold, high altitude at South Pole /
Concordia (2,834 m / 3,233 m), chronic hypoxia, polar-night SAD, polar
T-zone URTI cluster at McMurdo. Controlled analogs (MDRS, HI-SEAS, EMMPOL,
THOR) are heated, climate-stable habitats with real-time medical access
and should not inherit cold-injury, frostbite, or altitude-sickness
baselines. This section documents the per-(kind, condition) modulation
layer and its validation.

### 7.1 Architecture

`IMMMissionKind` extended additively (legacy `analog-isolation` literal
preserved for Dexie backward compat):

| kind                  | missions                                | prior calibration context               |
|-----------------------|-----------------------------------------|------------------------------------------|
| `leo-iss`             | iss-6mo, iss-drm1, iss-drm2              | K15 reference (no change)               |
| `analog-controlled`   | 7d / 10d / 14d / 22d / 45d / 90d / 520d  | controlled-habitat (Bhatia/Palinkas)    |
| `antarctic-station`   | 365d (antarctic-winter)                  | Antarctic winter-over (Bhatia/Palinkas anchored) |
| `analog-isolation`    | (legacy only; no missions in catalog)    | 1.0 fallthrough (backward compat)         |
| `lunar-artemis-future`| (catalogued, not in picker)              | n/a                                      |
| `interplanetary-mars-future` | (catalogued, not in picker)        | n/a                                      |

A new `kind_multipliers` block in
`imm-priors.json::global_calibration` carries the per-(kind, condition)
multiplier map. The engine computes `effectiveMult = tierMult × kindMult`
and applies it at the λ-sampling site (variance-preserving for Poisson)
and per-Bernoulli (variance-correct). Any (kind, condition) not listed
falls through to 1.0.

### 7.2 Modulation table — summary

`antarctic-station` (15 conditions modulated; anchored on
`research/analog_incidence_antarctic.md`):

- **depression**: 0.5× (Palinkas 2004 5.2%-weighted / Hong 2022 8.0% per
  winter; current NASA M18 prior ~2× the Antarctic observed rate)
- **anxiety**: 1.5× (Antarctic adjustment + personality dx together 40% of
  psych dx within the 5.2%/winter envelope)
- **respiratory-infection**: 0.2× (Bhatia 2012 Maitri 26-PY small-crew
  URTI 9.7% — 5× lower than Pattarini 2016 MCM "McMurdo Crud" 17% driven
  by the large-crew viral reservoir)
- **gastroenteritis**: 0.1× (Pattarini 2016 MCM 6% visit-share × chronicity
  10× correction; LOW confidence)
- **skin-rash**: 0.33× (Pattarini 2016 dermatologic 14%/9%/19%; rash is ~⅓
  of the dermatologic category)
- **late-insomnia**: 1.5× (Pattarini 2016 SP 11% clinic-visit rank #2;
  altitude + isolation, not space-adaptation acute)
- **frostbite**: 5.0× (extreme cold at -60 to -89.2 °C; conservative
  multiplier vs community cold-injury rate; LOW — no current IMM_CONDITIONS
  entry; forward-compatible)
- **altitude-sickness**: 4.0× (Nirwan 2022: >50% AMS at SP / Concordia
  uplift; LOW; forward-compatible; 1.0 for coastal stations — not
  disambiguated in v1)
- **hypoxia-related-headache**: 2.0× (Pattarini 2016 SP-only; LOW;
  forward-compatible; 1.0 for coastal)
- **seasonal-affective-disorder**: 2.0× (polar night; LOW; forward-
  compatible)
- **headache-co2-induced**: 0.0× (ECLSS-specific; Antarctic has altitude,
  not CO2)
- **decompression-sickness-secondary-to-extravehicular-activity**: 0.0×
  (no pressure change; physics)
- **visual-impairment-and-intracranial-pressure-viip-space-adaptation**:
  0.0× (microgravity-specific cephalad fluid shift; no Antarctic analog)
- **barotrauma-ear-sinus-block**: 0.0× (no pressure change; physics)
- **insomnia-space-adaptation**: 0.0× (acute post-0-g window; Antarctic
  chronic insomnia handled separately by `late-insomnia`)

`analog-controlled` (11 conditions modulated): respiratory-infection 0.5×,
depression 0.5×, frostbite / altitude-sickness / hypoxia-related-headache /
seasonal-affective-disorder / DCS-EVA / VIIP / insomnia-space-adaptation /
headache-co2-induced / barotrauma-ear-sinus-block all 0.0× (heated,
sea-level, no ECLSS, no microgravity).

### 7.3 K15 invariance canary

The most critical regression check: the `kind_multipliers` block must NOT
move ISS K15 reference runs. Verified by:

1. **`tests/imm/simulate.test.ts` "K15 invariance canary"** — explicit
   `kindMultipliers: {}` (1.0 fallthrough) compared to no-override (also
   1.0 fallthrough for `leo-iss`) → bit-identical TME and CHI.
2. **`tests/imm/calibration.test.ts`** (K15 back-fit, ~922 s) — the
   full K15 Table 1 reproduction at T=100k must continue to land in the
   documented brackets. Status post-change:
   - `none` TME 98.30 ± headroom (target 98.30, brackets 95-101)
   - `issHMS` TME 106.00 ± headroom (documented accepted divergence from
     evidence-based rates)
   - `unlimited` TME 106.00 ± headroom (documented accepted divergence)
3. **`tests/imm/simulate.test.ts` legacy-kind test** — a Dexie-shaped
   `IMMSession` with `mission.kind = "analog-isolation"` (legacy literal)
   must reproduce the pre-change run bit-for-bit. The engine falls
   through to 1.0 because no such entry exists in the JSON block.

### 7.4 Cross-validation: Antarctic pEVAC against Walton & Kerstman 2020

Walton & Kerstman 2020 (DOI 10.3357/AMHP.5432.2020) cites:

- McMurdo 1992-1996: **0.036 evac/py** (USAP historical baseline)
- US Antarctic 2013-2014: **0.01 evac/py** (Pattarini 2016 cohort)

A 12-person 365-d Antarctic mission (none kit) using the
`antarctic-station` multipliers should produce a whole-crew pEVAC in the
range **0.01 - 0.036**. Re-validation script deferred (deferred: see
§7.6).

### 7.5 Dexie schema — no migration

`IMMSession` (Dexie v3) already stores the full `mission` object verbatim.
Persisted sessions with `kind: "analog-isolation"` continue to load and
reproduce the pre-change run via 1.0 fallthrough. Persisted sessions with
`kind: "analog-isolation"` for a mission catalog retagged to
`analog-controlled` (none in the catalog today) would still load, but
would NOT auto-apply the controlled multipliers — engine falls through
to 1.0. Migration to the new kind literals is a user-driven action
(pick the mission in the picker) and does not require a Dexie schema
bump.

### 7.6 Known limitations (deferred to a future iteration)

- **Submarine, Mars-500, EMMPOL as their own kind_multipliers** —
  the corpus (`research/analog_incidence_submarine_iss.md`) is in-repo
  but not yet extracted. Generic architecture supports adding a new
  kind with one JSON block + one mission-catalog retag.
- **Per-(kind × risk-factor) interactions** — e.g. Antarctic EVA-eligible
  crew face different cold-injury multipliers than Antarctic non-EVA
  crew. Current RFM (`sex-male`, `contacts`, `crowns`, `CAC-positive`,
  `abdominal-surgery-history`) is orthogonal to kind; can be layered in
  a future pass if Antarctic evidence supports it.
- **Altitude-conditioned Antarctic sub-kinds** (SP / Concordia vs coastal
  McMurdo / Palmer). Pattarini 2016 station-disaggregated data supports
  this; documented as a known approximation in the v1 multiplier table.
- **4 conditions referenced as multipliers but not in current
  `IMM_CONDITIONS`**: `frostbite`, `altitude-sickness`,
  `hypoxia-related-headache`, `seasonal-affective-disorder`. Multipliers
  are forward-compatible; the engine falls through to 1.0 today and
  activates automatically when the conditions are added to the
  registry.
- **Cross-validation script** (`scripts/calibrate_antarctic_kinds.py`)
  to re-tune the multipliers against Walton & Kerstman 2020 anchor is
  deferred.

### 7.7 NASA-STD-7009A factor mapping update

This feature improves the following V&V factors:

- **Factor 2 (Validation)**: the calibration context now discriminates
  Antarctic vs controlled runs — a scientifically meaningful axis that
  the prior pipeline collapsed.
- **Factor 3 (Input Data Pedigree)**: Antarctic multipliers are
  anchored on 8 primary sources from the existing in-repo corpus
  (`research/analog_incidence_antarctic.md`); confidence flags per
  condition documented in the evidence dossier.
- **Factor 4 (Input Data Pedigree, corollary)**: controlled-habitat
  multipliers (0.0× for non-applicable conditions) document the
  scope-of-applicability of each NASA M18 prior explicitly, rather
  than letting them carry forward unexamined.
- **Factor 7 (Results Robustness)**: 7 new TDD tests provide
  regression guards against future kind-multiplier drift, including
  the K15 invariance canary and the legacy-Dexie-kind backward
  compat test.

### 7.8 Reproduction recipe

```bash
cd /root/repos/Selectron
npx tsc --noEmit -p .                          # typecheck (must be 0 errors)
npx vitest run tests/imm/simulate.test.ts      # 44/44 must pass (incl. 7 new kind_multiplier tests)
npx vitest run tests/imm/                      # all IMM (20 files / 160 tests) must pass
npx vitest run                                 # full suite (70 files / 520+ tests) must pass
```

K15 reference cross-check: re-run `tests/imm/calibration.test.ts` (~922 s
runtime). The TME/CHI/pEVAC/pLOCL outputs should reproduce the documented
post-rev3-e/f state within ±headroom — the K15 invariance canary
guarantees the kind_multipliers block has zero effect on ISS runs.

UI verification: `npm run dev` → open `/#crew-composition` → pick
"7-day campaign" (badge: "Controlled-habitat priors") and "365-day
campaign" (badge: "Antarctic winter-over priors"). Run T=5,000 preview;
the Antarctic run should show higher TME pressure and a different
mission-success fraction than the controlled run.

---

## 8. Terrestrial analog guard (added 2026-06-05)

### 8.1 Defect that triggered this revision

Diego reported (2026-06-05): when running a 45-day analog mission in the
IMM Calculator (CrewComposition view), `acute-radiation-syndrome` appeared
as a contributor to pEVAC. This is physically impossible: ground-based
analog habitats are shielded by Earth's atmosphere and magnetosphere, have
no ECLSS installed, and run no pressurised EVA suit operations.

Root cause: `simulateIMM()` ran all 100 IMM conditions regardless of
`mission.kind`. The `kindMultipliers` approach could not suppress SPE-
coupled conditions because that branch **explicitly bypasses the multiplier
map** (design decision, lines 346-350 of `simulate.ts`). Furthermore,
several `space-adaptation-once` conditions were not listed in the
`kind_multipliers` JSON block for analog missions (multiplier defaulted to
1.0), so microgravity adaptation syndromes were being simulated in a 1-atm
controlled habitat.

### 8.2 Fix — hard-filter in `runIMMTrial` and `simulateIMM`

Two new filter sites in `src/imm/simulate.ts`:

**Site 1 — `runIMMTrial` (lines ~294-308):** `activeConditions` now
auto-excludes space-only conditions when `TERRESTRIAL_MISSION_KINDS.has(mission.kind)`:

```
TERRESTRIAL_MISSION_KINDS = { "analog-controlled", "antarctic-station", "analog-isolation" }

Excluded by processType:
  space-adaptation-once (9 conditions) — microgravity fluid-shift adaptations
  EVA-coupled (3)  — pressurised-suit EVA (DCS, fingernail, paresthesias)
  SPE-coupled (1)  — acute-radiation-syndrome (solar particle events; blocked by atmosphere)
  SA-VIIP-late (1) — VIIP (long-duration microgravity)

Excluded by explicit ID (general-Poisson, ECLSS/ISS infrastructure):
  headache-co2-induced       — ECLSS CO2 scrubber failure
  toxic-exposure-ammonia     — ISS ammonia coolant loop
  barotrauma-ear-sinus-block — EVA suit pressurisation
```

Total: 17 conditions hard-excluded for terrestrial analog missions.

**Site 2 — `simulateIMM` (lines ~712-718):** `perConditionDrivers` is
built from the same terrestrial-filtered condition list so that excluded
conditions do not appear as zero-contribution rows in the UI.

An exported helper `isTerrestrialAnalog(kind: IMMMissionKind): boolean` is
available for downstream code (e.g. UI hints, tests).

### 8.3 Why hard filter, not kind_multipliers

Two reasons make the multiplier approach insufficient:

1. **SPE-coupled bypass**: the SPE-coupled branch of `runIMMTrial` (ARS)
   uses `speEventTimes` pre-sampled outside the condition loop and
   **explicitly skips kindMultipliers**. A zero-multiplier would have
   no effect. The filter is the only way to reach this path.

2. **perConditionDrivers integrity**: a zero-multiplier still allows
   the condition to appear in the `perConditionDrivers` output with
   zero contributions — a misleading data artefact. A filter-level
   exclusion removes it cleanly.

The `kind_multipliers = 0` entries for `headache-co2-induced`,
`decompression-sickness-*`, `VIIP`, `barotrauma-ear-sinus-block`, and
`insomnia-space-adaptation` in `imm-priors.json` are now redundant for
analog missions (the hard filter takes precedence) but are retained as
documentation of the design intent.

### 8.4 K15 invariance

The hard filter fires ONLY when `TERRESTRIAL_MISSION_KINDS.has(mission.kind)`.
`leo-iss` is NOT in that set. K15 reference runs (`iss-6mo` / `iss-drm1` /
`iss-drm2`) are bit-identical to the pre-change state. Verified by
`tests/imm/validate_k15.test.ts` and `tests/imm/simulate.test.ts` (44/44).

### 8.5 Test coverage

Three new tests in `tests/imm/conditions.test.ts` (group "terrestrial analog guard"):

1. `analog-controlled 45d`: none of the 17 space-only condition IDs appear
   in `perConditionDrivers` after 500 trials.
2. `antarctic-station 365d`: same assertion.
3. `leo-iss 180d` negative control: `acute-radiation-syndrome` IS present
   in `perConditionDrivers` — confirms the filter does not affect space missions.

### 8.6 Impact on screened vs unscreened gap

14 of the 17 excluded conditions carry `vulnerabilityCriteria` (mostly
`physical.vo2max` + `psych.emotional_stability`). Removing them slightly
reduces the TME gap between screened and unscreened crews for analog
missions. However, the gap is dominated by psychiatric conditions (11× ratio)
which are unaffected. Existing analog crew tests (`analog_45d_unscreened_crew.test.ts`,
`analog_90d_crew_archetypes.test.ts`) continue to pass with existing margins.

### 8.7 NASA-STD-7009A factor mapping update

- **Factor 1 (Verification)**: 3 new regression tests prevent future
  re-introduction of the ARS false-positive for analog missions.
- **Factor 2 (Validation)**: analog mission outputs are now physically
  credible — conditions impossible in the modelled environment no longer
  contribute to pEVAC or perConditionDrivers.
- **Factor 3 (Input Data Pedigree)**: `SPACE_ONLY_PROCESS_TYPES` and
  `ECLSS_CONDITION_IDS` sets in `simulate.ts` document the physical
  rationale for each exclusion inline.

### 7.9 Posterior-predictive validation (2026-06-05)

> Numbering note: this subsection is appended at the END of §7. The
> "§7.4" label used in the originating plan was a stale guess written
> before §7 grew to §7.8; §7.4 is already occupied (Antarctic pEVAC
> cross-validation). This addendum is therefore filed as **§7.9**.

This subsection validates the analog Bayesian MCMC posterior-predictive
layer (`posteriorPredictiveSimulateIMM`, `src/imm/posterior-predictive.ts`)
that propagates per-condition posterior λ uncertainty into the
mission-level pEVAC / pLOCL / CHI estimates surfaced by figure I6.

**Mechanism — composite kind-multiplier moment-matching.** The wrapper
makes ZERO engine changes. For each posterior draw `d` and condition `cid`
with posterior draw λ_d and prior point mean E[λ], it builds a per-draw
composite multiplier

```
composite[cid] = (base[cid] ?? 1) × (λ_d / E[λ])
```

and passes it to the untouched `simulateIMM` via the existing
`kindMultipliers` hook (`base` = the explicit override else the mission
kind's `imm-priors.json` map). Because the engine samples λ with prior
mean E[λ], the factor `λ_d / E[λ]` scales the engine's per-draw mean to
λ_d while preserving the prior's relative dispersion. This is an explicit
**moment-matching** approximation: the per-draw mean is scaled to the
draw, prior dispersion is preserved. It is **NOT a clean
epistemic/aleatory decomposition** — within a draw λ is re-sampled scaled
each trial (not held fixed), so the within-draw variance still mixes
parameter and sampling uncertainty. The label is set accordingly; we do
not over-claim a variance partition.

**Unbiasedness gate.** Because every λ_d is drawn from the condition's
fitted Gamma/Lognormal posterior, E[λ_d] = E[λ]; the posterior-predictive
GRAND mean should therefore agree with the point-prior `simulateIMM` mean
up to a small Jensen gap (pEVAC is a nonlinear, saturating function of
cumulative TME) plus Monte-Carlo noise. The gate test
(`tests/imm/posterior_predictive.test.ts`, `describe("K15 unbiasedness")`)
constructs every per-condition posterior from a symmetric ±40 %
perturbation set `[0.6,0.7,0.8,0.9,1.1,1.2,1.3,1.4]` whose length (8)
divides nDraws (64), so **E[draws] = E[λ] holds exactly** (asserted to
1e-12 per condition before the run). On the K15 reference config
(`iss-6mo` / `IMM_KITS.issHMS` / the file's 2-member crew fixture / seed
`0xc0ffee`), nDraws = 64, trialsPerDraw = 500, all 99 Gamma/Lognormal
conditions perturbed:

| Quantity | Value |
|---|---|
| posterior-predictive grand mean pEVAC | **2.5438 %** |
| point-prior mean pEVAC (`simulateIMM`, T = 16 000, same seed) | **2.4312 %** |
| absolute delta | 0.1125 pp |
| **relative delta** | **4.63 %** |

Gate tolerance is set at **15 % relative**. The residual ~4.6 % is the
moment-matching Jensen gap plus MC noise at these sample sizes —
agreement is approximate, not exact, exactly as the nonlinearity
predicts. The measured relDelta is **4.63 % at the canonical seed
`0xc0ffee`**; an 8-seed sweep of this config spans **~1.1%–10.9%**, so
the 15 % tolerance gives **~1.4× headroom against the observed worst
case**. The gate is seed-locked to `0xc0ffee`, so CI is deterministic;
the sweep characterizes durability against engine-internal RNG /
draw-order changes. **Unbiasedness agreement does NOT prove the
posterior is consumed** (a wrapper that ignored `posterior` would also
agree on the mean); propagation is proven separately (below).

**The widened interval IS the feature.** The point-prior pipeline reports
a per-trial CI whose 0/1 evac flag is degenerate at the trial level
(`simulateIMM` pEVAC ci90 = [0.000, 0.000] on this config — each trial is
a single Bernoulli outcome, so the per-trial percentile interval collapses).
The posterior-predictive ci90 is a different object: it is the spread of
the per-DRAW metric means induced by evidence-base (posterior λ)
uncertainty. Measured pEVAC ci90 = **[1.400, 4.000] → width 2.60 pp**
around a 2.54 % mean. These two intervals measure different things — one
is per-trial sampling noise, the other is posterior-predictive parameter
spread — and the widened band is the realism this layer adds. (This
particular width arises from the synthetic deterministic ±40 %
perturbation used in the unbiasedness fixture; it is a propagation-
magnitude demonstration, distinct from the production I6 figure, which
consumes the API's real fitted Gamma/Lognormal draws — e.g. the
antarctic-station snapshot shows pEVAC 8.9 % with 90 % CI [5.5, 12.0];
this is a live-API rendering reported for illustration and is not a
value verified by the test suite.)

**Load-bearing propagation test.** The gate above is necessary but not
sufficient; the propagation test (`tests/imm/posterior_predictive.test.ts`,
"propagates posterior draws into per-condition TME and downstream CHI")
elevates two high-incidence conditions (`acute-sinusitis`, `diarrhea`) to
**5× their prior mean** and asserts (a) the per-condition TME contribution
rises to **> 2×** the 1× baseline and (b) the downstream CHI strictly
falls. This test **fails against any implementation that ignores
`posterior`** — that is its purpose. A negative-control sibling
("composes with explicit kindMultipliers") zeroes the base multiplier for
the elevated condition and asserts its TME contribution collapses to
exactly 0, confirming the composite `(base ?? 1) × (λ_d / E[λ])` path
(0 × anything = 0) rather than a silent fall-through to the point prior.

**Reproducers.**

- Unbiasedness gate + propagation + negative control + contract errors:
  `tests/imm/posterior_predictive.test.ts` (9 tests; the K15 unbiasedness
  gate logs its measured delta and ci90 width to the console on each run).
- Python posterior draws + determinism: `python/tests/test_posterior_module.py`,
  `test_posterior_router.py`, `test_posterior_determinism.py` (10 tests;
  the determinism test is a subprocess regression guard against the
  PYTHONHASHSEED-randomized `hash()` defect, now CRC32-seeded).
- I6 figure render: `tests/ui/analog_posterior_plot.test.tsx` (6 tests);
  CrewComposition worker wiring + error-state discrimination:
  `tests/ui/crew_composition_i6.test.tsx` (5 tests).

**E2E note (honest).** The Playwright snapshot
`tests/e2e/__snapshots__/phase3f.smoke.spec.ts/i6-analog-posterior.png`
("i6 analog posterior figure renders for antarctic mission") was captured
with the optional Python calibration API live locally — the PNG shows the
REAL posterior figure (per-condition λ histograms + pEVAC/pLOCL/CHI cards
+ TME table). The test itself asserts ONLY region visibility, never
posterior content: it soft-waits (non-throwing) for the figure's
`pp-pEvac` done-sentinel so the live-API capture lands on the real figure,
but hard-asserts only that the I6 panel is visible. In CI **without** the
API, the panel degrades to its `api-error` state by design and the test
still passes — the app's offline-first contract is preserved (the SPA is
fully functional without the Python service; I6 is the only surface that
consumes it, and it degrades gracefully).

---

## 9. Bayesian conflict/team layer — src/risk/ (added 2026-06-06)

This section documents the validation of the Stage-B conflict/team Bayesian layer
added to `src/risk/` (spec `docs/superpowers/specs/2026-06-06-selectron-conflict-team-bayesian-design.md`).
The `src/imm/` NASA-IMM Calculator is entirely untouched.

### 9.1 Substream determinism control

**Design:** Four dedicated PRNG substreams per trial — SALT_LATENT (`0x00abcd04`),
SALT_MEDICAL (`0x00abcd01`), SALT_PSYCH (`0x00abcd02`), SALT_CREW (`0x00abcd03`) — each
derived as `makeRng((seed ^ SALT_X) >>> 0)`. Medical/physiologic conditions always read
from `rngMedical`, independent of whether the conflict layer is active.

**Test:** `tests/risk/determinism_control.test.ts` — 1 test asserting that per-condition
QTL means for all physiologic and musculoskeletal conditions are **bit-identical** between
a run with `SYNTHETIC_PRIORS.team` present and a run with `team: undefined`.
Passes on the calibrated priors at `{ seed: 0xc0ffee, trials: 3000 }`.

**Implication for V&V Factor 1 (Verification):** the medical incidence model's
determinism guarantee — which underpins the K15 invariance canary in `src/imm/` — is
provably unperturbed by the conflict/team engine at the bit level.

### 9.2 PyMC-fit anchors (three identifiable parameters)

Three parameters were fit from published aggregate statistics using PyMC NUTS
(`python/src/selectron/conflict_fit.py`, seed `0xc0ffee & 0xFFFFFFFF`):

| Parameter | Evidence anchor | Posterior (NUTS, 2000 draws) | Literature target |
|---|---|---|---|
| `π_unstable` | Tu 2024: 133/202 crews unstable | mean 0.656, 95% CI ~[0.59, 0.72] | 133/202 = 0.658 |
| `λ_base` (per day) | Bell 2019: 71/72 teams ≥1 conflict by 40%/90d | mean 0.107/day | P(≥1 by 40%/90d) ≈ 0.978 |
| `φ_crew` (frailty) | Basner 2014: 85% of conflicts from top-⅓ of crew | Gamma(2, 1.5) prior (weakly identified) | wide, mean 3.0 |

`φ_crew` is explicitly disclosed as weakly identified — no published estimate of
crew-level overdispersion (Basner n=2 of 6; Bell 2019 only team-level totals). The
prior is intentionally wide. A future fit with raw dyadic-conflict time series would
sharpen it.

Numerical stability fix: `p40 = pm.math.clip(p40, 1e-6, 1−1e-6)` before the
log-rate transform prevents explosion in the near-degenerate Beta(72, 2) posterior
(`BELL2019_TEAMS=72, BELL2019_WITH_CONFLICT=71`).

### 9.3 B5 Posterior-Predictive Checks (literature-anchored)

`tests/risk/conflict_ppc.test.ts` — 3 checks on a 6-person HI-SEAS 90-day simulation
(`{ seed: 0xc0ffee, trials: 8000, diagnostics: true }`):

| Check | Literature anchor | Assertion | Result |
|---|---|---|---|
| Bell 2019 onset | P(≥1 conflict by 40% of mission) on neutral crew | `byPoint4 > 0.85` | PASS |
| Tu 2024 latent class | Unstable fraction lower for high-fit (teamwork=5) vs low-fit (teamwork=1) crews | `frac(crew(5)) < frac(crew(1))` | PASS |
| Basner concentration | Top member's share of attributed conflicts exceeds 1/n | `topShare > 1/6` | PASS |

Scale note: the B5 checks use `behavioral.teamwork` scores on the `{min:1, max:5}` criterion
scale. The plan spec cited out-of-scale values (9, 3); these were corrected to `(5, 1)` to
match the actual criterion bounds.

### 9.4 De-EVA validation

Before this fix, `conflict-event` and `leadership-challenge` were `kind: "event"` — sampled
via `sampleBinomial(rng, evaCount, p)`. Antarctic winter-over and Mars-500 have `evaCount=0`,
producing zero conflict events on both missions despite 365-day durations. This was
structurally incorrect: crew conflict is a function of confinement duration and interpersonal
dynamics, not extravehicular activity.

Fix: both conditions reclassified to `kind: "rate"`. Validated by
`tests/risk/simulate_threepass.test.ts` test 1: "365-d Antarctic (evaCount=0) now produces
> 0 team-condition QTL."

### 9.5 Scope boundary

`src/imm/` (the NASA-IMM Calculator, the manuscript's primary engine) is entirely untouched.
The conflict/team layer lives exclusively in `src/risk/` (the Stage-B analog pipeline). The
two pipelines are independent per CLAUDE.md: "do not refactor one in terms of the other."
