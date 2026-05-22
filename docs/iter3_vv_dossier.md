# Iter-3 V&V Dossier — NASA-STD-7009 Eight Credibility Factors

**Status:** living document. Last revised 2026-05-19 (Phase 3F closure; Phase 3A in-flight, Phase 3B blocked on Diego's T37 curation).

**Mandate:** Iter-3 spec §9 [W14, M18] requires the model to be assessed against the eight NASA-STD-7009a credibility factors. This dossier holds the per-factor evidence and identifies remaining gaps. Re-read on every Iter-3 sign-off step.

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

Run `npm run validate:imm` to regenerate. Snapshot from last calibration (post engine fixes, post priors v2):

| Scenario | Metric | Engine | K15 ref | Δ | Within CI₉₅? |
| --- | --- | --- | --- | --- | --- |
| (insert latest values when next Track A run completes; see STATUS.md audit log for the most recent commit) | | | | | |

### 5.3 ML layer status

- Surrogate (LightGBM): NOT YET TRAINED — deferred to Phase A1 of the IMM Calculator plan (post-MVP).
- Vulnerability MLP: NOT YET TRAINED — deferred to Phase A2 (publication novelty hook). The deterministic per-member Stage A z-score injection (commit `9d5abc7`) is the v1 substitute.

### 5.4 NASA-STD-7009A factor mapping

- **Factor 1 (Verification):** 8 closed-form moment tests across incidence, severity, outcomes, treatment, simulate. `coupling_amplitude.test.ts` regresses against worst-vs-best ≥ 5 pp.
- **Factor 2 (Validation):** `validate_imm.ts` reports per-metric per-scenario K15 deltas. Run after every priors or engine change.
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
