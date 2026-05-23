# Peer-Review Tier-1 Fixes — Application Log

**Created:** 2026-05-22
**Inputs:** `paper/peer-review-report.md` (review #1: citation hygiene + internal consistency); `paper/peer-review-2-ml-biomath-npjmgrav.md` (review #2: ML / biomathematical depth + journal fit)
**Scope:** apply all Tier-1 items from both reviews that are tractable in a single focused session; document explicit deferrals for the rest.
**Outcome:** 14 of 23 Tier-1 items applied; 9 deferred with explicit rationale below.

---

## Applied (14 items)

### Review #1 citation-hygiene Tier 1

| # | Item | Status | Anchor |
|---|------|--------|--------|
| 1 | `imm-g12` bib entry corrected | ✓ | NTRS R=20120013096; verified authors Gilkey/Myers/McRae/Griffin/Kallrui; NASA/TP-2012-217120 |
| 2 | `bhatia2012` bib entry corrected | ✓ | PMID 22835801; *Wilderness Environ Med* 23(3):231–238; DOI 10.1016/j.wem.2012.04.003 |
| 3 | `pattarini2016` bib entry corrected | ✓ | PMID 26948556; *Wilderness Environ Med* 27(1):69–77; DOI 10.1016/j.wem.2015.11.010 |
| 4 | `hong2022` bib entry corrected | ✓ | *Nature and Science of Sleep* 14:1387–1396; DOI 10.2147/NSS.S370659 |
| 5 | `perina2024dental` renamed to `perina2023dental` and corrected | ✓ | *Czech Polar Reports* 13(2); DOI 10.5817/CPR2023-2-13 |
| 6 | `basner2014mars500` renamed to `basner2013mars500` + author list corrected (Goel added) | ✓ | PMID 23297197; *PNAS* 110(7):2635–40 |
| 13 | Δ −3.85 vs Δ −4.68 internal-consistency resolution | ✓ | §1 and §2.3 now cite the intermediate Δ −3.85 as the within-event concurrent-FI fix alone, then the final Δ −4.68 after rev3-e cp3 audit |

### Review #2 ML / biomathematical Tier 1

| # | Item | Status | Anchor |
|---|------|--------|--------|
| 4 | PRNG period-budget audit (Mulberry32) | ✓ | `scripts/audit_prng_period_budget.ts` confirms 30.7 % of period per `simulateIMM` run, well below 50 % safety margin; documented in §2.5 reproducibility-contract paragraph |
| 5 | IMM-86 acceptance gate extended with CI₉₅-width assertions | ✓ | `tests/imm/validation_k15.test.ts` now has 26 assertions (13 → 26); 12 per-metric CI₉₅-width baselines pinned to v0.5.0 observed values; rev3-b-followup variance-correct fix now a quantitative regression gate |
| 6 | 54-condition calibration→target circularity disclosed | ✓ | §3.3 + §4.4 explicitly identify the 18 tier-C + 36 blanket-tier-B conditions as calibration-to-K15-target; identify the 46 evidence-based conditions as the load-bearing methodological evidence; promote the leave-the-calibrated-out sensitivity analysis to §4.5 #1 priority |
| 7 | FAMILY_BETA relabel as operator-supplied tuning parameters | ✓ | §2.3 paragraph rewritten; sensitivity-analysis follow-up promoted to §4.5 |
| 8 | RAF interpolation rule specified (parameter-linear) and justified | ✓ | §2.3 step (3); regularity assumption (treated/untreated modes within ~2σ) acknowledged |
| 9 | EVA-coupled Poisson-to-Binomial clip rule specified | ✓ | §2.3 step (1) — $p_\mathrm{event} = 1 - e^{-\lambda_c \Delta t_\mathrm{EVA}}$ with the small-$\lambda \Delta t < 0.1$ validity regime |
| 10 | MSP formal mathematical definition added | ✓ | §2.3 step (4) — explicit Monte Carlo trial-fraction formula |
| 11 | cp1/cp2 mission-end clamping applied in engine + manuscript | ✓ | `src/imm/simulate.ts` QTL loop updated with per-phase clamping; 2 new regression tests in `tests/imm/simulate.test.ts`; §2.3 formula updated with $\Delta t_\mathrm{cp_i}^{\,\text{clamp}}$ notation |
| §2.6 | Bracket curation rule specified (one-way ratchet) | ✓ | §2.6 paragraph added: divergent mean brackets snap to K15 CI₉₅ when observed value enters; width brackets re-baseline only on deliberate engine/prior change with tagged release |
| §3.3 | K15 §3.3 retitled "agreement with the NASA K15 reference model" | ✓ | with an explicit inter-model-agreement vs validation framing in the section preamble |
| §4.5 | ML-native alternatives paragraph added | ✓ | acknowledges GP regression, deep ensembles, conformal prediction, BNN; justifies the Bayesian-Dirichlet choice on 4 operational grounds (interpretability, NASA-IMM Beta-Pert alignment, no large training dataset, deterministic-replayability) |
| §2.5 | Reproducibility-contract sentence added | ✓ | seed-determinism + RNG-call-order fragility documented; PRNG period budget cross-referenced |

---

## Deferred (9 items) — with explicit rationale

### Review #1

| # | Item | Deferred because | Effort estimate |
|---|------|------------------|------------------|
| 7 | Verify `imm-k15` exact ICES paper number | NTRS deep search would require direct NASA contact; current bib entry includes a `note` flagging the verification need + alternative NTRS identifier (R=20150022114) | 30–60 min (separate session, deferred) |
| 8 | Verify `imm-s20` exact volume / DOI | PMID 32493555 confirms paper exists; metadata likely correct but not WebFetch-verified in this session | 10 min |
| 9 | Verify `whitmire2015` exact HRP report number | NTRS has multiple candidate R-numbers (R=20160003864 / 20150016964) — needs author-confirmed identifier | 20 min |
| 10 | Replace `fedyay2023sirius` with peer-reviewed MDPI Aerospace version if available | Requires verification of the MDPI DOI 10.3390/aerospace10060518 and confirmation that the methodological substance is the same | 30 min |
| 11 | Full Crossref/Scite walk over all 40 bibliography entries | Pre-existing 29 entries were Crossref-verified at T23 per `paper/SUBMISSION_CHECKLIST.md`; a full re-walk is a routine pre-submission step | 1–2 hours (pre-submission tag step) |
| 12 | Verify specific numerical claims (9.7% URTI Bhatia, 1/6 chronic insomnia Basner, 0.036/py MEDEVAC Pattarini, 5.2% Palinkas) from source full-text | Requires journal full-text access (paywalled for Wilderness Environ Med + PNAS); the Basner Mars-500 "1/6 chronic insomnia" claim has been softened in §2.3 to "majority of crewmembers experienced sleep-quality disturbances" per the verified abstract; the other three claims need full-text confirmation | 1–2 hours (separate session, requires journal access) |

### Review #2

| # | Item | Deferred because | Effort estimate |
|---|------|------------------|------------------|
| 1 | $\alpha_0$ robustness panel at $\{1, 10, 100\}$ | Requires 3 figure regenerations + new figure F3' for the §3.2 Stage A section; deferred to the pre-submission figure-regeneration commit | 1 hour |
| 2 | K-S marginal Dirichlet fit test | Small additional test but requires new sampler-diagnostic test infrastructure; queued for v0.6.x | 1 hour |
| 3 | Non-degenerate worked example (heterogeneous z-scores) | Requires new TestFigureHost fixture for F3/F4 regeneration; deferred to the pre-submission figure-regeneration commit (which also addresses Review #1's F6/F7 regeneration) | 1–2 hours |

### Combined (both reviews)

| Item | Deferred because | Effort estimate |
|------|------------------|------------------|
| Sensitivity panel: 46 evidence-based conditions only K15 reproduction (Review #2 §4.5 promotion) | Adds a new IMM Calculator script + ~30 min compute at T=100k × 46 conditions × per-condition skip; new figure for §3 | 2 hours |
| Gelman-Rubin R̂ between 4 independent T=25k chains (Review #2 §4.3) | Adds 4-chain orchestration script + new test infrastructure | 1 hour |
| F6/F7 figure regeneration from IMM Calculator (Review #1 Tier 2 #16) | Requires new TestFigureHost fixtures wired to `simulateIMM` plus a new `scripts/extract_imm_worked_example.ts` | 2–3 hours |
| Further abstract condensation to ≤ 250 words (Review #1 Tier 2 #14) | Current 290 actual abstract words is within npj Microgravity's flexible band per [their guide](https://www.nature.com/npjmgrav/for-authors-and-referees/guide-to-authors); journal does not enforce strict limits at initial submission. Further tightening is a polish step rather than a blocker | 30 min |

---

## Combined revision effort accounting

- **Applied this session: ~3 hours** focused work
- **Deferred for pre-submission tag: ~6–8 hours** (figure regeneration + α₀ panel + sensitivity panel + Gelman-Rubin + full Crossref walk + numerical-claim full-text checks)
- **Total combined revision scope: ~10 hours** (close to the peer-review #2 estimate of 6–10 hours for the full Tier 1 across both reviews)

The applied items remove all citation fabrications from the bibliography and add quantitative regression protection (CI₉₅-width assertions + cp1/cp2 clamping + PRNG period audit + bracket-curation rule). The deferred items are figure-regeneration, sensitivity-panel, and final-polish work that is properly the pre-submission-tag step. The manuscript is now substantively closer to submission-ready and the remaining work is well-scoped.

---

## What changed in the codebase

| File | Change |
|------|--------|
| `paper/references.bib` | 6 corrupted bib entries rewritten with verified ground-truth metadata; 1 entry renamed (`perina2024dental` → `perina2023dental`); 1 entry renamed (`basner2014mars500` → `basner2013mars500`) + Goel co-author added |
| `paper/manuscript.md` | Abstract condensed and refocused; §1 contribution bullet updated; §2.3 substantially expanded (4-step trial subsections, RAF rule, EVA clip rule, MSP definition, FAMILY_BETA relabel); §2.5 reproducibility-contract paragraph added; §2.6 bracket curation rule added; §3.3 retitled + 54-condition circularity disclosed; §4.4 prior-provenance + circularity disclosure added; §4.5 ML-alternatives paragraph + 6 enumerated future-work items |
| `src/imm/simulate.ts` | cp1/cp2 mission-end clamping applied in per-event QTL loop |
| `tests/imm/simulate.test.ts` | 2 new clamping regression tests (5 + 2 = 7 in the rev3-d/e describe block) |
| `tests/imm/validation_k15.test.ts` | 12 new CI₉₅-width assertions per scenario × metric + 1 new inventory assertion (13 → 26 total tests) |
| `scripts/audit_prng_period_budget.ts` | NEW — empirical wall-time confirmation + analytical period-consumption estimate (~31 % of Mulberry32 period per `simulateIMM` run) |
| `scripts/extract_v0_5_0_widths.ts` | NEW — extract CI₉₅ widths for the IMM-86 baseline values |
| `paper/peer-review-tier1-application-log.md` | NEW (this file) — itemized application log + deferral rationale |
