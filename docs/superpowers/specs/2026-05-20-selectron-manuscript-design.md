# Selectron — Manuscript design spec

**Author:** Diego L. Malpica, MD (sole author)
**Date:** 2026-05-20
**Status:** Draft (awaiting Diego review)
**Target journal:** *npj Microgravity* (Nature-family open access)
**Target submission window:** early July 2026
**Iteration:** Iter 4 — manuscript (per `docs/superpowers/specs/2026-05-18-selectron-design.md` four-iteration spiral)
**Brainstorm session:** 2026-05-20 (this spec)

---

## 1. What this paper is

A single-author methodology paper presenting **Selectron**: a reproducible TypeScript pipeline that produces (a) a Bayesian posterior distribution over each candidate's total score for analog-astronaut selection, and (b) a NASA-Human-System-Risk-Board-aligned green/yellow/red mission-risk verdict via a 5×5 Likelihood × Consequence matrix derived verbatim from JSC-66705 Revision A.

The paper is a **methodology contribution**, not an outcome-validation study. It does not claim to predict analog-mission outcomes from candidate data; outcome validity is explicitly disclosed as out-of-scope. What it does claim is methodological novelty (first Bayesian MCDA pipeline for analog-astronaut selection; first formal mapping of analog-mission Monte-Carlo posteriors to NASA's institutional HSRB framework) and reproducibility (every figure and number regenerable from the cited GitHub commit SHA + seed).

The artifact backing the paper is the working TypeScript application at `github.com/strikerdlm/selectron`, which will be MIT-licensed and Zenodo-archived at submission.

## 2. What this paper is *not*

- **Not an outcome-validation study.** No analog-mission outcome data is used. Internal validation only (closed-form Dirichlet moments, ESS, Poisson-Gamma conjugate test, σ < 5 % convergence rule).
- **Not a clinical decision-support paper.** Does not diagnose, treat, or medically clear anyone for spaceflight or analog assignments.
- **Not a NASA-published or NASA-endorsed framework.** Selectron *maps to* NASA HSRB conventions (citing JSC-66705 Rev A); it is not produced by NASA.
- **Not a replacement for selection-panel human judgement.** Frames the verdict as decision-support input, not autonomous selector.
- **Not a multi-author or consortium paper.** Sole-author submission. No external co-authors; no AI co-author lines.

## 3. Title and lead framing (approved 2026-05-20)

**Working title:**
*Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection*

**Running header:** Bayesian MCDA + NASA HSRB-LxC for analog-astronaut selection.

**Introduction lead (4-point framing):**

1. *Problem.* Selection panels for analog-astronaut missions collapse genuine uncertainty into ordinal rankings, and analog-program mission-risk verdicts are typically ad hoc and not aligned with the institutional NASA HSRB process documented in JSC-66705 Rev A.
2. *Gap 1.* No published Bayesian MCDA pipeline applies to astronaut, aircrew, or analog-astronaut selection. The closest published precedent (Li et al. 2020, gig-economy couriers) stops at the criterion-weight posterior.
3. *Gap 2.* Analog-mission Monte Carlo has not been formally mapped to the NASA HSRB 5×5 LxC matrix, so analog verdicts do not translate to NASA institutional language.
4. *Contribution.* Selectron addresses both gaps in one reproducible TypeScript artifact: a posterior over candidate scores with credible-interval rank semantics, an IMM-style forward Monte Carlo at the NASA-canonical T = 100 000 trials per [M18] / [A22], and a NASA-HSRB-LxC-verbatim verdict mapping.

## 4. Section-by-section outline (approved 2026-05-20)

Target: ~7 000 main-body words (excl. abstract, refs, captions). Within npj Microgravity's standard methods/article length envelope.

| § | Section | Words | Content |
|---|---|---|---|
| — | Abstract (structured) | 200 | Background / Methods / Results / Conclusions. Headline numbers: T = 100 000, K = 8–12 active criteria per tier, NASA HSRB verdict color. |
| 1 | Introduction | 900 | The 4-point lead framing above; closes on a contributions list. |
| 2 | Methods | 2 600 | Six sub-sections — the dense middle of the paper. |
| 2.1 | Criterion taxonomy + 3-tier accessibility | 350 | 12 verified criteria (`research/02_criterion_taxonomy.md`), Minimum/Medium/Elite tiers, scale transforms. Table 1 (criterion + tier matrix + DOIs). |
| 2.2 | Stage A — Bayesian MCDA | 600 | Dirichlet prior, Metropolis sampler on the simplex, normalize, additive aggregator, ESS diagnostic. Equation 1: $S_i = \sum_k w_k \cdot z(x_{i,k})$. |
| 2.3 | Stage B — IMM-style Monte Carlo | 700 | 4-step forward trial (occurrence → severity → treatment → CHI aggregation). T = 100 000 per [M18]/[A22]. σ < 5 % convergence rule. Equation 2: CHI = 1 − QTL/(t · c). |
| 2.4 | NASA HSRB LxC mapping | 450 | Verbatim Figure 4 5×5 priority-score grid and §3.2.4 color rule. Likelihood from P(χ < χ*). Consequence from 1 − χ_mean under the Mission Objectives Impact sub-category, with explicit citation of JSC-66705 §3.2.4 p. 29 single-sub-category rule. |
| 2.5 | Implementation and reproducibility | 250 | TypeScript / Vite / IndexedDB; no backend, no Python in production code path. MIT license + Zenodo DOI of the commit used to generate every figure. |
| 2.6 | Verification and Validation (internal) | 250 | Closed-form Dirichlet moments check, ESS, Poisson-Gamma conjugate test, NASA-STD-7009A factors 1–3 mapping. |
| 3 | Results | 1 800 | Worked example: one candidate × five analog missions × three accessibility tiers. Headline: posterior + NASA color per mission. Walks through figures F3–F7. |
| 4 | Discussion | 1 200 | Five sub-sections. |
| 4.1 | What the dual-novelty enables | 300 | Calibrated uncertainty + NASA institutional alignment in one artifact. |
| 4.2 | Positioning vs precedents | 350 | Saint-Hilary 2017 (form), Lahdelma & Salminen 2001 (output semantics), Li et al. 2020 (closest domain), Stam & Silva 1997 (rank-reversal ancestor). Material from `research/methodology_precedents.md`. |
| 4.3 | Open methodological risks | 300 | Dirichlet precision elicitation, no outcome labels, rank reversal under criterion-set change, additive aggregation, single-operator pattern, normalization sensitivity. Each acknowledged with the precedent that flagged it. |
| 4.4 | Limitations | 150 | Synthetic priors; no analog-mission outcome validation; single-operator framing. |
| 4.5 | Future work | 100 | Iter-3 sensitivity layer (Sobol + one-at-a-time); retrospective cross-walk if outcome data emerges. |
| 5 | Conclusion | 200 | Three-sentence wrap. |
| — | References | — | ~45–55 entries. |
| — | Supplementary | — | S-Methods 1, S-Methods 2, S-Code, S-Data, S-Notebooks, S-Tests. |

## 5. Figure list (approved 2026-05-20)

7 main figures + 2 supplementary. Every figure regenerable from `src/` at the manuscript commit SHA. No manual edits; no figure rot between repo and submission.

| # | Title | Source in repo | Notes |
|---|---|---|---|
| F1 | Selectron pipeline overview | New Mermaid → SVG | Two-stage architecture (Stage A → Stage B → NASA HSRB color verdict). Mirrors README diagram. |
| F2 | Criterion taxonomy + tier matrix | New authored figure; data from `src/data/placeholder-criteria.ts` | 12 criteria × 3 tiers grid, color-coded by minimumTier. |
| F3 | Stage A posterior — one candidate | `PosteriorPlot.tsx` snapshot via Playwright | CHI-posterior histogram + 90 % / 95 % CI bands + mean line. |
| F4 | Stage A calculation trace | `CalculationTrace.tsx::MCDACalculationTrace` snapshot | 4-step Stage-A walk (raw → normalize → Dirichlet → aggregate). |
| F5 | Stage B convergence | New plot from `tests/risk/m18_convergence.test.ts` outputs | σ across 1 000-trial increments < 5 % by T = 100 000. |
| F6 | NASA HSRB LxC matrix | `LxCMatrix.tsx` snapshot | The 5×5 grid with current run's (L, C) cell highlighted. Replicates JSC-66705 Fig. 4. |
| F7 | Mission comparison + LxC chips | `MissionComparison.tsx` snapshot | 5 analog missions; per-mission χ-posterior + NASA color chip. |
| S1 | V&V dossier visual | Assembled from `docs/iter3_vv_dossier.md` | NASA-STD-7009A factors 1–3 with the evidence per factor. |
| S2 | Per-mission CHI ESS table | Programmatic table from sim sessions | Sample sizes, ESS, σ-final-increment, NASA color, all 5 missions. |

**Caption convention:** factual, references the underlying commit SHA + seed. Example: "F3. CHI posterior for candidate alias DEMO-01 on the MDRS-45d mission. Histogram of 100 000 Monte-Carlo trials, T = 100 000, seed = 0xc0ffee, commit 062f741. 90 % credible interval shaded; mean line dashed." No marketing language; no interpretive captions.

## 6. References strategy

~45–55 entries, grouped:

- **NASA primary documents (~6):** JSC-66705 Rev A (HSRB plan), [M18] IMM original, [A22] IMM update, [G12] WinBUGS 75 000-sample MCMC reference, NASA-STD-7009A, NPR 8000.4C.
- **Bayesian MCDA precedents (~7):** Saint-Hilary 2017, Lahdelma & Salminen 2001, Tervonen & Figueira 2008, Mohammadi & Rezaei 2020, Li et al. 2020, Stam & Silva 1997, Waddingham 2016. All sourced from `research/methodology_precedents.md` and DOI-verified.
- **Analog-program references (~5):** Apollonio et al. 2026 (ASTRA), HI-SEAS / MDRS / AMADEE / D-MARS program reports.
- **Instrument citations (~15):** Phase-0 evidence-table DOIs: NEO-PI-R, IPIP-NEO-120, CD-RISC-10/25, PHQ-9, PVT-B / NASA PVT iOS, SOT-5, mCTSIB, FMT, CogScreen alternatives, etc. Already Scite-verified.
- **Updates to NASA HSRB process (~1):** 2023 npj Microgravity paper "Updates to the NASA human system risk management process for space exploration."
- **Statistical software / methods (~5):** Vite, ECharts, Dexie (citable artifacts), vitest; PRNG (Mulberry32), Marsaglia–Tsang Gamma sampler.
- **Misc (~5):** NASA-STD-3001, Wedley 1993, Maleki & Zahir 2013, Broekhuizen 2015, Pianosi 2016.

**DOI verification:** every reference will be re-checked via Scite MCP before submission. Diego's Iter-2 scope-expansion-3 round corrected two DOIs (Cooper 1968, Petrides 2007) — same process applies.

## 7. Supplementary materials

No word/figure limit at npj Microgravity for supplementary content.

| File | Source | Purpose |
|---|---|---|
| S-Methods 1 — V&V dossier | `docs/iter3_vv_dossier.md` (existing) | NASA-STD-7009A factor-by-factor mapping; closed-form moments, ESS, σ-convergence, Poisson-Gamma conjugate. |
| S-Methods 2 — NASA Monte-Carlo audit | `docs/iter3_nasa_monte_carlo_audit.md` (existing) | Verbatim quotes from [M18], [A22], [G12] justifying T = 100 000 vs. the prior 25 000 default. |
| S-Code | GitHub repo + Zenodo DOI | Selectron source at the manuscript commit SHA. MIT license. |
| S-Data | `src/data/` synthetic priors + seeded candidates | Reproducibility instructions in repo README. |
| S-Notebooks | PyMC notebook scaffold (existing) | The deferred 75 000-draw MCMC equivalent of the in-browser Metropolis sampler. Marked "exploratory — not used in main results" to avoid Python/TS dependency confusion. |
| S-Tests | 171 vitest + 7 Playwright snapshot set | Referenced from S-Code, not separately packaged. |

## 8. Reproducibility deliverables

- **Zenodo DOI:** mint at the manuscript commit SHA on submission day. Cite the DOI in Methods §2.5 and in the cover letter.
- **GitHub release:** tag `v1.0-manuscript` on `iter1-phase0` at submission time.
- **License:** bump from `private` to **MIT** at submission. Standard for npj Microgravity computational supplements; allows reviewers to clone and run without permission overhead.
- **Submission package:** README, MIT LICENSE, one-page CONTRIBUTING note clarifying that the repo is single-author research code (no external contribution pipeline expected post-submission).

## 9. Timeline + milestones

Total horizon ~7 weeks: 30 days for the complete draft, then ~2 additional weeks for Diego's review, revisions, and submission. Start 2026-05-20, draft complete 2026-06-19, Diego review week 2026-06-22 → 2026-06-26, submission early July.

| Week | Dates | Milestone | Deliverable |
|---|---|---|---|
| W1 | May 20 – May 26 | Outline lock + Methods writing | Methods §2.1–2.6 first draft (~2 600 words). Figures F1–F2 finalized. |
| W2 | May 27 – Jun 2 | Results writing + figure generation | Worked-example Results (~1 800 words). F3–F7 generated from `src/` via Playwright snapshot pipeline. |
| W3 | Jun 3 – Jun 9 | Introduction + Discussion writing | Intro (900 w) and Discussion 4.1–4.5 (1 200 w). Reference list assembled and DOI-verified via Scite MCP. |
| W4 | Jun 10 – Jun 16 | Abstract + Conclusion + supplementary | Structured abstract (200 w); S-Methods 1/2 packaged; Zenodo DOI minted; MIT license added. |
| W5 | Jun 17 – Jun 19 | Pre-submission self-review | Complete draft assembled. Self-review pass against npj checklist. Cover letter drafted. |
| W6 | Jun 22 – Jun 26 | Diego review + revisions | Address Diego's comments. Re-run figures from final commit SHA. Submission package frozen. |
| W7 | early July | Submission | Submit via npj Microgravity portal. |

**Working-method conventions:**
- Draft source at `paper/manuscript.md` (Markdown).
- Render to `paper/manuscript.docx` for portal upload via pandoc.
- Figures committed to `paper/figures/` as both SVG (source) and PNG (300 dpi for portal).
- All paper artifacts under `paper/` are tracked in git.

**Risk milestones:**
- *W1:* if the V&V dossier needs new content (NASA-STD-7009A factors 4–8 beyond current 1–3), cut Discussion §4.5 to compensate.
- *W2:* any figure that needs new code (F1 mermaid, F2 tier matrix, F5 convergence plot) is a 1-day implementation task per figure — budget 3 days within W2.
- *W3:* Scite DOI verification is the slowest external dependency; front-load it. Cooper 1968 / Petrides 2007 fixes from Iter-2 already prove the process works.
- *W5:* pandoc Markdown → DOCX conversion has historically required hand-fix passes for tables and equations. Budget 1 day.

## 10. Out of scope (explicit)

The following are *not* part of this paper. Each is deferred to either a future paper or "future work":

- Outcome validation (no analog-mission outcome data used; future paper if dataset emerges).
- Multi-candidate ranking with credible-interval rank semantics (deferred to Iter-2 of the original spiral — already implemented but not the lead deliverable of this paper).
- Sensitivity analysis (Sobol + OAT) — Iter-3 deferred; mentioned in Future Work §4.5 only.
- Pairwise weight elicitation via AHP / B-BWM (Selectron deliberately uses single-operator literature synthesis instead; deferred entirely).
- Outranking aggregation (TOPSIS / PROMETHEE / ELECTRE) — acknowledged in Discussion §4.3 as the alternative but not implemented.
- IRB / human-subjects work — sole-author methodology paper using only synthetic data.
- npj-specific submission formatting (cover letter copy, author CRediT statement, structured abstract template adherence) — addressed in W4–W5, not part of this design.

## 11. Single-author + AI policy disclosure

Per `/root/repos/CLAUDE.md`: "*Generative AI may be used at will across every project in this workspace, including drafting, editing, structuring, and revising manuscript prose. Disclosure is never required and never given.*" This is a workspace-level policy that overrides the more restrictive default in `/root/CLAUDE.md`. For Selectron, AI assistance is used silently across drafting, editing, and revision; no journal, co-author, or reviewer is informed.

Sole-author submission: Diego L. Malpica, MD. No AI co-author lines on any commit. No external co-authors invited.

## 12. Decisions made during brainstorming (2026-05-20)

For audit / future reference:

| Decision | Selected | Alternative considered | Rationale |
|---|---|---|---|
| Scope | One paper, full pipeline | Two-paper split (Stage A now, Stage B later); Stage-B-only framing | Dual novelty is stronger together; single submission cycle. |
| Target journal | npj Microgravity | Frontiers in Physiology Aerospace section; Acta Astronautica; LSSR | Nature-family prestige + direct fit with 2023 HSRB process update paper cited. AMHP excluded (denylist per CLAUDE.md). |
| Validation | Internal only | Synthetic + retrospective cross-walk; synthetic + expert-rater agreement | Honest about the open methodological risk; faster path; framed as methodology not population estimate. |
| Structure | Methods-forward IMRaD | Case-study-led; two-act tutorial | Cleanest npj fit; dual novelty up front; V&V dossier carries rigor without tutorial format. |
| Timeline | Standard (30 days) | Aggressive (14 days); relaxed (60 days) | Balances quality with the workspace's other active manuscripts. |
| License | MIT at submission | CC-BY-4.0; keep private until acceptance | Standard for npj computational supplements; reviewers can clone. |

---

## Acceptance criteria for the design

This spec is ready to hand off to `writing-plans` when:

- [x] Title and 4-point lead framing approved (Section 3).
- [x] Section-by-section word budget approved (Section 4).
- [x] Figure list with `src/` sources approved (Section 5).
- [x] Reference + supplementary scope approved (Section 7).
- [x] 30-day timeline + milestones approved (Section 9).
- [ ] **Diego reviews this written spec and signs off.**

After sign-off, the next step is invoking the `superpowers:writing-plans` skill to produce a step-by-step implementation plan keyed to the 7-week schedule.
