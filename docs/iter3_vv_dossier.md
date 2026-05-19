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
