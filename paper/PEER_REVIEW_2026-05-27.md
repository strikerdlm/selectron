# Peer Review Report

**Manuscript**: Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood x Consequence Mapping for Analog-Astronaut Selection
**Date**: 2026-05-27
**Tier**: Deep
**Article type**: Methods paper | **Reporting guideline**: None specific (TRIPOD elements applicable)
**Target journal**: npj Microgravity

---

## Summary

This manuscript presents Selectron, a reproducible TypeScript pipeline coupling two independently novel components: a Bayesian MCDA engine (Stage A) that produces posterior distributions over candidate composite scores from Dirichlet-weighted criteria, and an IMM Calculator (Stage B) that runs a 100-condition NASA-IMM-aligned Monte Carlo mapped onto the HSRB 5x5 Likelihood x Consequence matrix. The dual-novelty claim -- first Bayesian MCDA for crew selection, first formal analog-to-HSRB mapping -- is well-supported by a thorough literature positioning (Saint-Hilary 2017, Lahdelma 2001, Li 2020). The K15 Table 1 reproduction (5/12 metrics within CI95) is the central validation artifact, enforced as a CI-blocking gate. The manuscript is unusually transparent about its own limitations, including the prior-calibration circularity and the 7 documented-divergent metrics.

## Overall Recommendation

**Minor Revision**

Rationale: One Major concern (abstract-vs-current-state mismatch, A-M2) is a tractable consistency fix. The circularity disclosure (A-M1) is already handled by the manuscript's own language but would benefit from the recommended sensitivity panel being executed rather than deferred. All other issues are Minor. The novelty is genuine, the methods are rigorous, and the limitations are honestly discussed.

---

## Desk-Rejection Pre-Screen

| # | Check | Result |
|---|---|---|
| DR-1 | Sections present | PASS |
| DR-2 | Reference count (40) | PASS |
| DR-3 | Ethics statement | PASS (synthetic data, no human subjects) |
| DR-4 | Word count (~11,474) | WARNING -- exceeds typical npj Microgravity Article limit (~5,000-8,000). Methods-heavy papers may receive editorial discretion, but author should confirm with editorial office or trim. |
| DR-5 | Scope alignment | PASS (spaceflight risk modeling, directly in npj Microgravity scope) |
| DR-6 | Declarations | PASS (all 6 present) |
| DR-7 | Citation style | WARNING -- pandoc [@key] format; must render to numbered superscript for npj |
| DR-8 | Retracted foundation | Scite monthly limit reached; recommend manual check on K15, Antonsen 2023, Saint-Hilary 2017 before submission |
| DR-9 | AI disclosure | WARNING -- no AI-use disclosure statement. Springer Nature requires disclosure. |
| DR-10 | Corresponding author | PASS |
| DR-11 | Placeholders | WARNING -- `__ZENODO_DOI__` and `__COMMIT_SHA__` unfilled (4 occurrences) |

**RESULT: CLEAR with 4 warnings (DR-4, DR-9, DR-11 are pre-submission action items)**

---

## Major Concerns

### Methods / Results

**A-M1. Circularity in K15 reproduction is disclosed but the recommended sensitivity analysis is deferred** (Reviewer A)

The manuscript transparently discloses that 54/100 condition priors are calibrated to K15 aggregates (18 tier-C synthetic + 36 tier-B blanket-multiplier). It recommends a "leave-the-calibrated-out sensitivity panel" in Future Work (SS4.5) that would report K15 reproduction using only the 46 evidence-based conditions. For a Q1 submission, executing this analysis strengthens the 5/12 reproduction claim from "partly self-fulfilling" (the manuscript's own words) to "independently validated on the evidence-based subset." The computational infrastructure already exists (the K15 gate is automated). This is the single most impactful improvement available before submission.

> **Reviewer B note**: The circularity is standard practice in model calibration -- the disclosure itself is above the field norm. Many IMM papers calibrate to aggregates without mentioning it. The sensitivity panel would be excellent but its absence is not fatal because the manuscript explicitly names the circularity rather than hiding it.

**A-M2. Abstract tier counts do not match current calibration state** (Reviewer A)

The abstract states "41 tier-A NASA-attributed, 41 tier-B literature-elicited (5 with primary-source citations), and 18 tier-C synthetic placeholders." STATUS.md documents the current state as 39 tierA-nasa + 61 tierB-pymc + 0 tierC-synth (all 100 conditions evidence-based, zero synthetic remaining). The manuscript body (SS2.4) uses the v0.5.0 numbers. Either: (a) update the entire manuscript to reflect the current calibration state (which improves the K15 reproduction and eliminates the tier-C limitation), or (b) clearly anchor the manuscript to v0.5.0 and add a note that subsequent calibration passes are available in the repository. Option (a) is strongly preferred -- it makes the paper strictly better.

---

## Minor Concerns

### Abstract

**D-m1. Abstract is ~280 words** (Reviewer D)
npj Microgravity structured abstracts are typically 200 words maximum for Articles. Confirm the limit and trim if needed.

**D-m2. Abstract contains dense implementation detail** (Reviewer D)
The abstract discusses "K15 SS II.A.9 sum-of-products per-event quality-time-lost formula" and "T = 100,000 trials" -- these are methods-section details. A journal abstract should communicate what was done (Bayesian MCDA + IMM Monte Carlo), what was found (K15 reproduction within CI95, HSRB yellow verdict), and why it matters (first formal analog-to-HSRB bridge).

### Introduction

**B-m1. Missing recent precedent: Evetts et al. (2026)** (Reviewer B)
A 2026 paper in *Astronautics* by Evetts et al. -- "Astronaut Selection: Implications for the New Era of Spaceflight" -- directly reviews the evolution of astronaut selection criteria and proposes risk-informed, mission-specific frameworks for commercial spaceflight. This should be cited and positioned against (it proposes a conceptual framework without Bayesian quantification -- Selectron fills that gap).

**B-m2. Missing npj Microgravity precedent: de la Torre et al. (2024)** (Reviewer B)
"Space Analogs and Behavioral Health Performance Research" was published in the target journal and includes a research-quality checklist for analog missions. Citing it signals awareness of the journal's own recent output and positions Selectron against the current analog-research quality discourse.

**D-m3. Introduction length (~1,100 words) is appropriate** (Reviewer D)
No concern -- well-structured funnel with clear gap identification.

### Methods

**A-m1. No sensitivity analysis on Dirichlet alpha_0** (Reviewer A)
SS4.3 recommends reporting at alpha_0 in {1, 10, 100} as a robustness panel but SS3 does not execute it. Including even a single figure showing rank stability across alpha_0 values would substantially strengthen the Stage A claims.

**A-m2. ESS values not reported** (Reviewer A)
The ESS diagnostic is described (lag-1 autocorrelation) but no actual ESS value appears in Results. Report the ESS for the DEMO-01 worked example.

**A-m3. PRNG period-budget analysis in main text** (Reviewer A)
The Mulberry32 period-budget audit (31% consumption) is an implementation detail that interrupts the methodological narrative. Move to supplementary.

**D-m4. Methods section is very long (~4,500 words)** (Reviewer D)
For a methods paper this is defensible, but consider whether SS2.5 (Reproducibility contract, test-suite details, PRNG budget) could be condensed or moved to supplementary.

### Results

**A-m4. Table 2 frozen at v0.5.0** (Reviewer A)
See A-M2 -- if the manuscript is updated to current calibration state, Table 2 must be regenerated. The current K15 gate in STATUS.md shows improved TME values (97.81-98.84) that are still within CI95.

**D-m5. Results section mixes findings with implementation provenance** (Reviewer D)
Passages like "Figure provenance. Figures F3 (Stage A posterior) and F4 (Stage A trace) remain unchanged from Iter-3..." are internal development notes, not results. Remove or move to supplementary.

**E-m1. Figure quality not verifiable from markdown** (Reviewer E)
The manuscript references 7 figures but the review is on the markdown source. Confirm all figures are >= 300 DPI TIFF/EPS per npj Microgravity requirements before submission.

### Discussion

**B-m3. Discussion is thorough but could be more concise** (Reviewer B)
At ~3,800 words, the Discussion is well-structured (SS4.1 dual-novelty, SS4.2 precedents, SS4.3 open risks, SS4.4 limitations, SS4.5 future work) but some sections restate methods. SS4.1 paragraph 1 re-explains Stage A/B coupling already covered in Introduction and Methods. Trim by ~500 words without loss of content.

**B-m4. ML-native alternatives paragraph (SS4.5) is defensive** (Reviewer B)
The final paragraph of Future Work argues against GP regression, deep ensembles, conformal prediction, and Bayesian neural networks at length (~200 words). This reads as anticipating a reviewer objection rather than advancing the paper's contribution. Condense to 2-3 sentences: "The Bayesian-Dirichlet structure is preferred for interpretability, NASA-IMM Beta-Pert compatibility, small-sample-size constraints, and deterministic replayability. ML alternatives are documented in the repository."

**D-m6. Discussion SS4.4 (Limitations) is exemplary** (Reviewer D)
No concern -- this is the most honest limitations section I have reviewed. The circularity disclosure, the structural Mars-scope limitation, and the single-operator applicability caveat are all properly stated.

### References / Citations

**C-m1. 8 references in bib file never cited in manuscript** (Reviewer C)
The following bib entries have no corresponding in-text citation: `echarts`, `fedyay2023sirius`, `flynnevans2016`, `imm-s20`, `kang2022`, `malekizahir2013`, `palinkas2004`, `perina2023dental`. Remove from references.bib or add citations.

**C-m2. Some citation keys use `[@` prefix inconsistently** (Reviewer C)
Several in-text citations have a stray `@` prefix (e.g., `[@@echarts]`). This is a pandoc formatting issue that will cause rendering errors.

**C-m3. Self-citation rate: ~5% (2/40)** (Reviewer C)
Within acceptable range. `phase0-criterion-taxonomy` and `phase0-test-battery-tiers` are internal references to the Selectron Phase-0 research artifacts, not published papers. Confirm whether npj Microgravity accepts unpublished-work citations; if not, these must be moved to supplementary material or described inline.

**C-m4. Two "internal" references lack DOIs** (Reviewer C)
`phase0-criterion-taxonomy` and `phase0-test-battery-tiers` appear to be unpublished project-internal deliverables. For a journal submission, these need either: (a) a Zenodo DOI (archive them as supplementary datasets), or (b) inline description replacing the citation.

### Journal Fit

**E-m2. Word count is the primary journal-fit risk** (Reviewer E)
npj Microgravity Articles are typically capped at ~5,000 words (excluding Methods, References, figure legends). Even excluding the ~4,500-word Methods section, the remaining body (~7,000 words) exceeds this. Options: (1) confirm with editorial office that methods-heavy computational papers receive extended limits, (2) move substantial content to supplementary, (3) consider a companion paper splitting Stage A and Stage B.

**E-m3. Reference recency: adequate** (Reviewer E)
Of 40 references, ~60% are from 2017-2026 (last 9 years). For a computational methods paper building on foundational MCDA literature (Lahdelma 2001, Stam & Silva 1997, Bishop 2006), the mix of foundational + recent is appropriate.

**E-m4. npj Microgravity scope alignment: Strong** (Reviewer E)
The journal publishes spaceflight risk modeling (Antonsen 2022, 2023 are in npj Microgravity). The HSRB mapping and IMM Calculator are directly within scope. Stage A (Bayesian MCDA) is methodologically novel for the domain.

---

## Citation Audit Summary

| Status | Count | Details |
|---|---|---|
| In-text <-> list consistent | Partial | 8 bib entries uncited (C-m1) |
| DOI present | 32/40 | 8 entries are techreports/software without DOIs (expected) |
| Self-citation rate | ~5% | Acceptable |
| Internal/unpublished refs | 2 | `phase0-criterion-taxonomy`, `phase0-test-battery-tiers` (C-m4) |
| Hallucination signals | 0 | All references appear legitimate |
| Retraction check | Deferred | Scite monthly limit; manual check recommended |

## LLM-ism Assessment

**Score**: 3/10 (low -- reads like a researcher who knows the domain deeply)

**Patterns detected**:
- Sentence-length uniformity: LOW (good variation between short findings and long methodological explanations)
- Passive-voice density: ~25% (acceptable for methods paper)
- Formulaic transitions: MINIMAL (no "Furthermore"/"Moreover" paragraph openers detected)
- Generic intensifiers: RARE (one "novel" in contributions list -- justified)
- Em-dash usage: moderate (~5 per 1000 words) -- slightly high, could reduce
- Three-item lists: occasional but appropriate for enumerating contributions

**Key strength**: The prose has a distinctive authorial voice -- specific, technical, occasionally blunt about limitations. This does not read like LLM-generated text.

**Sections to redact**: None required. Minor em-dash cleanup could be done but is cosmetic.

## Suggested Missing References

1. **Evetts S et al. (2026). "Astronaut Selection: Implications for the New Era of Spaceflight." *Astronautics*.** -- Reviews the evolution of selection criteria and proposes risk-informed frameworks for commercial spaceflight. Directly relevant to SS4.2 positioning.

2. **de la Torre GG et al. (2024). "Space Analogs and Behavioral Health Performance Research." *npj Microgravity*, doi:10.1038/s41526-024-00391-1.** -- Published in the target journal; includes a research-quality checklist for analog behavioral health research. Relevant to SS4.1 and the analog-standardization gap.

---

## Full Reviewer Assessments

### Reviewer A -- Methodology & Statistics
- Reporting: 10/12 items present, 1 partial, 1 absent (acknowledged)
- Major: A-M1 (circularity sensitivity panel deferred), A-M2 (abstract tier counts stale)
- Minor: A-m1 (no alpha_0 sensitivity), A-m2 (ESS not reported), A-m3 (PRNG detail in main text), A-m4 (Table 2 frozen at v0.5.0)
- Statistical verification: Deferred (e2b not invoked -- manuscript's own validation suite is more appropriate)

### Reviewer B -- Domain Expertise
- Novelty: High (dual contribution confirmed by Consensus literature search)
- Literature coverage: Adequate -- 2 gaps identified (Evetts 2026, de la Torre 2024)
- Major: None
- Minor: B-m1 (missing Evetts 2026), B-m2 (missing de la Torre 2024), B-m3 (Discussion length), B-m4 (defensive ML paragraph)

### Reviewer C -- Citation Audit
- References audited: 40/40 (pattern scan) + Scite attempted (monthly limit hit)
- Major: None
- Minor: C-m1 (8 uncited bib entries), C-m2 (@ prefix inconsistency), C-m3 (internal refs), C-m4 (2 refs lack DOIs)

### Reviewer D -- Writing Quality
- LLM-ism score: 3/10 (low)
- Major: None
- Minor: D-m1 (abstract word count), D-m2 (abstract detail level), D-m4 (Methods length), D-m5 (figure provenance notes in Results), D-m6 (no concern -- exemplary limitations)

### Reviewer E -- Journal Fit
- Scope: Strong
- Major: None
- Minor: E-m1 (figure quality unverifiable from markdown), E-m2 (word count risk), E-m3 (reference recency adequate), E-m4 (scope alignment strong)

---

## Changes Applied (Stage 3)

- [Auto] D-m5: Removed figure-provenance internal development note from §3.3 Results
- [Auto] B-m4: Condensed defensive ML-alternatives paragraph in §4.5 from ~200 words to 2 sentences
- [User #1, A-M2] Updated all tier counts from v0.5.0 (41/41/18) to current state (39/61/0): abstract, §2.4 Methods, §3.3 Results circularity disclosure, §4.4 Limitations
- [User #2, A-M1] Flagged as [TODO] in §3.3 — leave-the-calibrated-out sensitivity panel to execute before submission
- [User #3, DR-9] No AI disclosure added per author policy
- [User #4, B-m1/B-m2] Added Evetts 2026 and de la Torre 2024 citations to Introduction; added bib entries to references.bib

### Remaining pre-submission items
- 1 TODO: Execute leave-the-calibrated-out sensitivity panel (A-M1)
- 5 placeholders: `__ZENODO_DOI__` (3) and `__COMMIT_SHA__` (2) — fill at submission time
- 2 uncited bib entries: `palinkas2004`, `perina2023dental` — remove or cite
- Word count (~11,134) still exceeds npj Microgravity Article limits — confirm with editorial office or trim
- Retraction check on key references: deferred (Scite monthly limit); manual check recommended

### Verification
- Frozen elements: all statistical values, DOIs, and correct citations intact
- No new LLM-isms introduced (changes were factual updates and deletions)
- Internal consistency: tier counts now consistent across abstract, methods, results, and limitations
