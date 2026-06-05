# Peer Review Report

**Manuscript**: Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection
**Date**: 2026-05-27
**Tier**: Standard (text analysis only, no MCP verification)
**Article type**: Methods paper (computational methodology + software artifact)
**Reporting guideline**: None specific (methods paper)
**Target journal**: npj Microgravity (Nature portfolio)

---

## Summary

Selectron is a two-stage pipeline for analog-astronaut selection combining (1) Bayesian MCDA with Dirichlet-distributed criterion weights producing posterior composite scores with credible intervals, and (2) a NASA-IMM-aligned 100-condition Monte Carlo risk simulator whose Crew Health Index output maps to the NASA HSRB 5×5 LxC matrix. Dual novelty: first Bayesian MCDA for astronaut/analog selection, first formal HSRB mapping for analog programs. Validation is internal (K15 Table 1 reproduction, closed-form checks, convergence rules) on a single synthetic worked example.

## Overall Recommendation

**Minor Revision**

Rationale: The dual-novelty claim is credible and the engineering execution is thorough. Three concerns need addressing: (1) the worked example is degenerate (all scores at midpoint → point-mass posterior that cannot demonstrate discriminative power), (2) the 4/12 K15 reproduction framing invites a "67% failure" misread, and (3) a Nature-required AI disclosure statement is absent.

---

## Desk-Rejection Pre-Screen

RESULT: CLEAR — no fatal triggers.

- ✓ All sections present
- ✓ 42 references
- ✓ Ethics statement (synthetic data)
- ✓ All declarations (COI, Funding, Data, Code, CRediT)
- ✓ Scope alignment strong
- ⚠ AI disclosure missing (Nature portfolio policy)

---

## Major Concerns

### A-M1. Degenerate worked example (Reviewer A — Methodology)

DEMO-01 has all criterion scores at the scale midpoint → z_k = 0.5 for all k → S_i = 0.5 regardless of the Dirichlet draw. CI₉₀ = CI₉₅ = [0.500, 0.500]. This is mathematically correct but demonstrates the trivial edge case where the framework produces zero information. A reviewer will ask for a non-degenerate example with 2–3 candidates differentiated across criteria, showing non-trivial credible intervals and meaningful rank-acceptability probabilities.

The paper acknowledges this (§3.2: "weight uncertainty is consequential only when candidates are differentiated") but does not follow through. The entire Stage A contribution is demonstrated on a case where it adds nothing.

**Fix**: Add a second worked example (or replace DEMO-01) with candidates whose scores differ on 3+ criteria. The `reproducer_imm_composite.ts` already builds BEST/MID/WORST crews — adapt that as a manuscript example.

### B-M1. K15 reproduction framing (Reviewer B — Domain)

"4 of 12 within K15 CI₉₅" reads as a 67% failure rate to a scanning editor. The manuscript explains the divergences honestly (§4.4) but the first impression is negative.

**Fix**: Reframe around operational relevance. Lead with "all 3 TME values and the unlimited-resources CHI reproduce within K15 CI₉₅" and frame issHMS CHI (1.5pp marginal) and the no-kit scenario (model construct, not operational target) as documented residuals rather than headline failures.

### D-M1. Missing AI disclosure (Reviewer D — Writing)

Nature portfolio requires disclosure of AI tool use. No such statement present. Not a scientific issue, but an editorial compliance gap.

**Fix**: Add to Statements: "Generative AI tools were used for coding assistance during software development and for copy-editing. All outputs were reviewed by the author."

---

## Minor Concerns

### Introduction

**B-m1.** Title is 18 words (npj Microgravity recommends ≤15). Consider shortening.

**D-m1.** Opening paragraph is 232 words — split into (1) selection-ranking problem and (2) risk-verdict gap.

**D-m2.** "No such quantitative standard exists" — uncited negative claim. Add a one-sentence search description.

### Methods

**A-m1.** FAMILY_BETA coefficients (−0.4 to −0.15) are disclosed as tuning parameters but no citations support the specific magnitudes.

**A-m2.** Mulberry32 PRNG: 31% period consumed is noted but per-trial draw count is not stated — reader cannot independently verify the budget.

**D-m3.** File paths in prose (`src/imm/simulate.ts` etc.) read as developer docs. Move to footnotes or supplementary.

**D-m4.** "rev3-e fi_cp3 audit" heading uses internal version nomenclature. Rephrase to "Permanent-impairment phase audit."

### Results

**B-m2.** §3.5 line 237 discusses a "non-monotonic pattern — C4 at 22 and 45 days" that may be stale with v0.5.4 numbers. Verify or remove.

**A-m3.** TME near-additivity (39.3+59.2=98.5 vs 97.8): note that exact additivity requires no cross-condition interaction through EVAC/LOCL crew-member termination.

**A-m4.** Sensitivity SVG figures exist in exports/ but are not referenced as Figure 8/9 in the manuscript.

### Discussion

**D-m5.** §4.3 bullet-list format unusual for npj Microgravity — convert to prose paragraphs.

**D-m6.** Version numbers ("v0.5.4") are developer shorthand; use commit SHA + Zenodo DOI instead.

**D-m7.** Conclusion closely mirrors abstract wording — condense to 2 distinct sentences.

### Figures

**E-m1.** F6 bottom table text is small and partially clipped at left edge. Will fail production QC.

### Internal Consistency

**D-m8.** Commit SHA `9e31b85` (line 140) is stale — manuscript reports v0.5.4 numbers. `__COMMIT_SHA__` placeholders unfilled.

**D-m9.** "388 passing tests" (line 140) — verify against current test suite count.

**D-m10.** §3.5 inline pEVAC values ("0.49% at mdrs-2wk through 32.77% at antarctic-winter") do not match F7 (0.28% and 37.78%). Stale text.

---

## Citation Audit Summary

| Status | Result |
|---|---|
| In-text ↔ list | Consistent (pandoc @-key format) |
| Self-citation | ~2% (1/42) — acceptable |
| Hallucination signals | None detected |

## LLM-ism Assessment

**Score**: 2/10 (low — reads as human-authored)
- Em-dash usage elevated (~15/1000 words) but stylistically consistent
- No formulaic openings, hedge-stacking, or mechanical transitions
- Good sentence-length variance

## Journal Fit (Reviewer E)

**Scope**: Strong — analog-mission medical risk + NASA IMM alignment is core npj Microgravity territory.
**Format**: Structured abstract, all declarations present, author-year citation compatible.
**Reference recency**: Adequate (2024–2026 anchors in Introduction; older foundational refs appropriate for methods paper).
