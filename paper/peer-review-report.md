# Peer-Review Report — Selectron Manuscript v0.5.0

**Manuscript:** "Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection"
**Author:** Diego L. Malpica, MD
**Target journal:** npj Microgravity
**Manuscript file:** `paper/manuscript.md` (298 lines)
**Commit reviewed:** `d909ce6`
**Reviewer:** Internal Q2 peer-review pass (automated tooling: PubMed via Claude MCP, Scite Smart Citations [rate-limited at 250 calls/month, partial coverage], targeted web search for grey literature / NASA technical reports)
**Date:** 2026-05-22

---

## 1. Recommendation

**MAJOR REVISION REQUIRED.**

The manuscript presents a substantive and novel methodological contribution — a Bayesian MCDA + NASA-IMM-aligned Monte Carlo + HSRB LxC verdict pipeline, with a K15 §II.A.9 sequential-phase per-event QTL clarification that is a genuine methodological finding worth publishing. The architecture is principled, the implementation is reproducible (388 passing tests, tagged release, CI-enforced K15 acceptance gate), and the writing is generally clear. However, the manuscript currently has **citation-hygiene problems that would be flagged by any rigorous peer reviewer** — at least 7 of the 11 references added in the rev3-c / rev3-d / rev3-e calibration sections contain fabricated or incorrect bibliographic details (wrong journal, wrong volume, wrong page range, wrong DOI, wrong year, missing co-authors). These must be corrected against the verified ground-truth metadata documented in §3 of this report before submission.

The methodological content itself is sound. After citation correction and the minor internal-consistency fixes in §5, the manuscript should be ready for re-submission.

---

## 2. Summary of contribution

The manuscript describes Selectron, a single-author MIT-licensed TypeScript artifact that delivers three coupled methodological pieces:

1. **Stage A:** Bayesian MCDA over a 12-criterion, 3-tier-accessibility taxonomy for analog-astronaut selection, producing a Dirichlet-sampled posterior over each candidate's composite score with credible-interval rank semantics. Closes the absent-Bayesian-MCDA-in-selection-domain gap identified in Li et al. (2020) [@li2020] and the Saint-Hilary et al. (2017) [@sainthilary2017] benefit–risk MCDA literature.

2. **Stage B:** an "IMM Calculator" — a NASA-IMM-aligned probabilistic Monte Carlo over the 100-condition K15 medical-event catalogue [@imm-k15], with the K15 §II.A.9 sum-of-products per-event quality-time-lost formula reproduced verbatim and the per-condition prior set organized across three provenance tiers (NASA-attributed, analog-literature-elicited, synthetic-placeholder). Includes a methodological clarification: an initial implementation had applied K15's concurrent-FI formula to the within-event sequential clinical phases (cp1, cp2) rather than to cross-event overlap as the K15 text specifies; the corrected sum-of-products formulation restored K15 reference reproduction within published CI₉₅ on the operational ISS-HMS scenario CHI metric.

3. **HSRB mapping:** verbatim mapping from the Stage-B χ posterior to the NASA Human System Risk Board 5×5 Likelihood × Consequence priority-score grid (JSC-66705 Rev A Figure 4 + §3.2.4) [@jsc66705], delivering a green/yellow/red verdict in the institutional language of NASA spaceflight risk.

The reproduction of 5 of 12 K15 Table 1 metrics within K15's published 95 % confidence interval — including the two operationally-meaningful kit scenarios' CHI values — is the central validation result, enforced as a CI-blocking acceptance gate at `tests/imm/validation_k15.test.ts`.

---

## 3. Citation audit (CRITICAL — must fix before submission)

11 new references were added in the v0.5.0 manuscript revision (§2.3 IMM Calculator rewrite + §2.6 V&V update). I verified each via PubMed Claude MCP, targeted web search, and direct WebFetch on NTRS / Czech Polar Reports landing pages. Scite was used in a limited capacity (250-call monthly cap hit; only checked retraction status for 1 paper). The findings are below — **8 of 11 new references contain errors or fabrications**.

### 3.1 References with confirmed errors / fabrications

| Citekey | Reported field | Reported value | Verified ground-truth | Severity |
|---------|----------------|----------------|------------------------|----------|
| `imm-g12` | Authors | "Gilkey, K. M. and Walton, M. E. and Kerstman, E. L." | Gilkey K. M., Myers J. G., McRae M. P., Griffin E. A., Kallrui A. S. | **HIGH** — author list fabricated; correct authors are NTRS-verified |
| `imm-g12` | Report number | "TM-2012-217227" | NASA/TP-2012-217120 (TP not TM; 217120 not 217227) | **HIGH** — wrong identifier |
| `imm-g12` | Title | "Bayesian update for in-flight medical event data using the Integrated Medical Model: a worked example using submarine analog and astronaut posterior data" | "Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort" | **HIGH** — wrong title |
| `bhatia2012` | Journal | "Indian Journal of Medical Research" | Wilderness & Environmental Medicine | **HIGH** — wrong journal |
| `bhatia2012` | Volume / pages | "136, 275–282" | 23(3), 231–238.e2 | **HIGH** — wrong volume + pages |
| `bhatia2012` | Title | "Pattern of morbidity at the Indian Antarctic research station Maitri: a four-year analysis" | "Morbidity pattern of the 27th Indian Indian Scientific Expedition to Antarctica" | **MEDIUM** — title approximation |
| `bhatia2012` | DOI | (none in bib entry) | 10.1016/j.wem.2012.04.003 | **MEDIUM** — missing real DOI |
| `pattarini2016` | Year | 2013 (in bib field) vs key suggesting 2016 | 2016 | **MEDIUM** — internal year inconsistency |
| `pattarini2016` | Journal | "Aviation, Space, and Environmental Medicine" | Wilderness & Environmental Medicine | **CRITICAL** — wrong journal |
| `pattarini2016` | Volume / pages | "84(2), 163–168" | 27(1), 69–77 | **CRITICAL** — wrong everything |
| `pattarini2016` | DOI | "10.3357/asem.3478.2013" | 10.1016/j.wem.2015.11.010 | **CRITICAL** — wrong DOI |
| `pattarini2016` | Title | "Primary care at the Earth's southernmost outpost: a yearlong experience at the Amundsen-Scott South Pole Station" | "Primary Care in Extreme Environments: Medical Clinic Utilization at Antarctic Stations, 2013-2014" | **CRITICAL** — wrong title (the cited 2013 ASEM title is a DIFFERENT real paper by overlapping authors — see `pattarini2013` candidate) |
| `hong2022` | Journal | "Polar Medicine" | Nature and Science of Sleep | **HIGH** — fabricated journal (no journal called "Polar Medicine" exists; this is the same fabrication pattern that affected `perina2024dental`) |
| `hong2022` | Volume / pages | "15(3), 145–153" | 14, 1387–1396 | **HIGH** — wrong volume + pages |
| `hong2022` | DOI | (none) | 10.2147/NSS.S370659 | **MEDIUM** — missing real DOI |
| `hong2022` | Title | "Mental-health surveillance during 9-month Korean Antarctic winter-over expeditions, 2017–2021" | "Mood and Sleep Status and Mental Disorders During Prolonged Winter-Over Residence in Two Korean Antarctic Stations" | **MEDIUM** — title approximation; the cited 8.0 % figure DOES match (7/88 in the actual study) |
| `basner2014mars500` | Citekey | "basner2014mars500" implies year 2014 | Actual publication year 2013 | **LOW** — key naming inconsistency only |
| `basner2014mars500` | Authors | 11-author list (missing Goel) | 12 authors including Namni Goel | **MEDIUM** — missing co-author |
| `perina2024dental` | Year | 2024 | 2023 | **HIGH** — wrong year |
| `perina2024dental` | Journal | "Polar Medicine" | Czech Polar Reports | **HIGH** — fabricated journal (same as `hong2022`) |
| `perina2024dental` | Volume / pages | "16(2), 88–97" | 13(2), [unique-issue article page TBD] | **HIGH** — wrong volume / issue |
| `perina2024dental` | DOI | (none) | 10.5817/CPR2023-2-13 | **MEDIUM** — missing real DOI |
| `perina2024dental` | Authors | "Peřina, J. and Hubáček, J. and Bartoš, V." | Peřina V., Bartáková J., Pires Freitas A., Máca J., Bartáková S., Esteves Arantes R. M. | **HIGH** — author list incorrect (Vojtěch not J. for first author; co-authors fabricated) |

### 3.2 References likely real but with unverified specifics

| Citekey | Status | Action |
|---------|--------|--------|
| `imm-k15` | The IMM project is real, Keenan/Foy/Myers are real, ICES-2015 is a real conference series. The specific number ICES-2015-123 was not directly findable by web search. The closest NTRS match is "Probabilistic Simulation Model for Predicting In-Flight Medical Risks" (NTRS R=20150022114 or 20150018879). | **MEDIUM**: verify the exact ICES paper number from a NASA TRS deep search or direct contact with the IMM team; if not findable, cite by NTRS identifier instead of conference paper number. |
| `imm-s20` | PubMed: PMID 32493555 confirms Walton & Kerstman 2020 "Quantification of medical risk on the International Space Station using the integrated medical model" in *Aerospace Medicine and Human Performance*. Verify exact volume/pages/DOI against the journal's record (current bib entry: vol 91 issue 4 pages 332–342, DOI 10.3357/AMHP.5432.2020). | **LOW**: fast fetch from the journal site; almost certainly real but verify the exact metadata. |
| `whitmire2015` | Real NASA evidence report on sleep / circadian / work overload exists (NTRS R=20160003864 / 20150016964). Verify exact NASA report number HRP-47832 or HRP-47834 (one of these is the correct evidence-report identifier; in earlier session work the manuscript cited HRP-47834 in passing). | **MEDIUM**: verify HRP number from NASA Human Research Roadmap. |
| `fedyay2023sirius` | Fedyay's SIRIUS research is real and was presented at IAC-23 in Baku. The specific IAC paper number IAC-23-A1.1.4 was not directly verified, and there appears to be a published peer-reviewed version (likely in MDPI *Aerospace*: "Medical Support for Space Missions: The Case of the SIRIUS Project") which would be the stronger citation. | **MEDIUM**: replace the IAC conference paper with the peer-reviewed journal version (DOI 10.3390/aerospace10060518 — verify) if available; preserves the methodological claim. |

### 3.3 References verified and accurate

| Citekey | Status |
|---------|--------|
| `palinkassuedfeld2008` | ✓ **Verified.** PMID 17655924, Lancet 371(9607):153-63, 2008. DOI 10.1016/S0140-6736(07)61056-3. The "About 5 %" figure in the abstract matches the manuscript's "5.2 % weighted" with acceptable rounding precision for a methodology paper (the weighted-cohort 5.2 % may come from the cited Palinkas references therein; minor over-precision but not fabrication). |

### 3.4 Pre-existing references (not audited in this pass)

The 29 pre-existing references in `paper/references.bib` (entries 1–29) are documented as DOI-verified per `paper/SUBMISSION_CHECKLIST.md` line 13 (T23 task, 18/18 DOI entries Crossref-resolved at commit `899254f`). I did NOT re-verify these in this pass; the citation-hygiene audit above focuses on the 11 references added in this session's v0.5.0 manuscript revision, which is where the new fabrications were introduced. A pre-submission Crossref/Scite walk over the full 40-entry bibliography is recommended.

---

## 4. Methodological assessment

### 4.1 Stage A (Bayesian MCDA) — strong

The Stage A description (§2.2) is rigorous and well-grounded. The Dirichlet prior with $\alpha_k = 1/K$ flat default is principled; the $\alpha_0 \to \infty$ / $\alpha_0 \to 0$ asymptotic recovery of deterministic MCDA and SMAA-2 respectively is correctly cited [@sainthilary2017; @lahdelma2001]. The Marsaglia–Tsang Gamma sampling + Mulberry32 PRNG documentation is sufficient for reproducibility. The closed-form Dirichlet-moments check as a Factor-1 V&V gate is exactly the right verification pattern.

The §3.2 worked example using midpoint criterion scores produces a degenerate posterior ($S_i = 0.5$ exactly) — the manuscript correctly identifies this as an analytical sanity-check property, not a calibration failure. This is good discipline.

### 4.2 Stage B (IMM Calculator) — strong methodological content; some claims need source-traceability

The full IMM Calculator description (§2.3) is the largest contribution of the v0.5.0 revision and is mathematically sound:

- **K15 §II.A.9 sum-of-products** per-event QTL formula is reproduced verbatim per the K15 paper text (verified against the manuscript's own internal K15 OCR at `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md`). The clarification that cp1+cp2+cp3 are *sequential* clinical phases (not overlapping at a point in time) is correct per K15 §II.A.5; the earlier incorrect application of `concurrentFI` to within-event sequential phases was a genuine methodological finding worth publishing.
- **Variance-correct λ-sampling-site multipliers** for the residual tier-B blanket calibration are described correctly (Poisson is closed under rate scaling).
- **rev3-e fi_cp3 audit** with 68 fully-resolving / 32 persistent-impairment classification is documented and defensible.

**Source-traceability concerns within §2.3**:

- The specific incidence rate claims for the 5 rev3-c source-cited tier-B priors **do not all trace cleanly to the cited sources**. For example:
  - **`respiratory-infection` $\lambda = 1.43 \times 10^{-3}$/day** is cited as "Bhatia 2012 Maitri small-crew" + "Pattarini 2016 McMurdo". The Bhatia 2012 abstract (PMID 22835801) reports 93 illness incidents over 26 person-years (3.58 events/py total) and that 32/93 = 34 % of illness incidents were under "medicine" — but does NOT directly report 9.7 % URTI. The manuscript's claim "9.7 % URTI rate" is unverified from the abstract; needs full-text confirmation OR alternative source citation.
  - **`late-insomnia` 1/6 chronic insomnia over 520 d in Mars-500** is cited to Basner 2014. The actual PNAS paper (PMID 23297197) abstract describes "the majority of crewmembers also experienced one or more disturbances of sleep quality, vigilance deficits, or altered sleep-wake periodicity" — no specific "1/6 chronic insomnia" figure in the abstract. May appear in the full text but should be page-cited.
  - **`depression` Palinkas 2008 "5.2 % weighted"** vs source's "About 5 %" — minor precision overstatement, acceptable but the "weighted" qualifier is not explicit in the Palinkas abstract.
- The "27 distinct primary citations" claim for the rev3-c calibration is technically correct (3 parallel research-agent deliverables consolidate ~27 citations) but only 11 of those references are in `paper/references.bib`. A reviewer would expect a full bibliography or an explicit forward-reference to a supplementary citation list. Recommend: either expand `references.bib` to include all 27 or explicitly state "27 citations consolidated in `paper/supplementary/S-Methods-3-rev3c-priors.md`" (and create that file) so a reader can audit each per-condition prior.

### 4.3 HSRB LxC mapping (§2.4) — verified verbatim

The 5×5 priority-score grid is reproduced cell-for-cell from JSC-66705 Rev A Figure 4 (p. 28); the color-rule from §3.2.4 (p. 27) is verbatim. The Mission Objectives Impact rationale for the $(1 - \chi_\mathrm{mean})$ → consequence bucketing is principled and correctly distinguishes from the Crew Health Impact sub-category. The IEEE-754 epsilon for boundary cases is the right engineering precaution. No issues.

### 4.4 V&V (§2.6) — IMM-86 promotion is appropriate

The Factor 1 / 2 / 3 mapping is honest: closed-form Dirichlet moments + ESS + Poisson-Gamma conjugacy + $\sigma < 5\%$ + JSC-66705 grid (Factor 1); IMM-86 K15 reproduction gate with two-bracket structure (Factor 2 — newly satisfied); 31-paper analog corpus + per-condition citation chain (Factor 3). The explicit deferral of Factors 4–8 to subsequent iterations is the right discipline for a methodology paper.

The "wider-bracket regression-protection" rationale for the documented-divergent metrics is a defensible design choice, but a reviewer might ask: how often do the documented-divergent brackets get re-tightened in practice, and what stops the brackets from becoming permanent (i.e., "we accept the divergence forever")? A response sentence in §2.6 stating the curation cadence (e.g., "the documented-divergent brackets are reviewed each priors-rev cycle; tightening is mandatory whenever a metric moves into K15 CI₉₅") would address this.

---

## 5. Internal consistency issues

### 5.1 Numerical inconsistencies

| Location | Claim | Issue |
|----------|-------|-------|
| §1 contribution bullet (line 39) | "issHMS CHI Δ −16.11 → Δ −3.85" | This is the rev3-d intermediate state (post concurrent-FI fix, pre cp3-enable). The v0.5.0 final state per §3.3 Table 2 is CHI=90.25, which is Δ −4.68 vs K15 ref 94.93. The Δ −3.85 figure refers to a prior commit (3ac5480) before the rev3-e cp3 audit. |
| §2.3 (line 84) | "issHMS CHI Δ −16.11 → Δ −3.85" | Same issue — rev3-d intermediate. |
| Abstract | "Crew Health Index ($\chi_\mathrm{mean} = 90.25$ versus K15 $94.93$, within $[84.30, 98.50]$)" | This is the rev3-e final state (correct). |
| §3.3 Table 2 | issHMS CHI 90.25 | Consistent with abstract; the Δ −4.68 value should be quoted explicitly in §3.3 prose. |
| **Fix:** | | Either (a) update §1 + §2.3 to quote the final Δ −4.68 (recommended); or (b) make the rev3-d intermediate vs rev3-e final distinction explicit: "concurrent-FI fix moved CHI from 78.82 → 91.08 (Δ −16.11 → Δ −3.85); the subsequent rev3-e cp3 audit shifted to the final 90.25 (Δ −4.68)". |

### 5.2 Tier counts

§2.3 claims "41 tier-A NASA, 41 tier-B literature, 18 tier-C synth" = 100 ✓; "5 of the 41 tier-B conditions are anchored" + "remaining 36 tier-B" = 41 ✓ — internally consistent.

### 5.3 Test counts

§2.5 quotes "355 vitest + 13 IMM-86 + 20 Playwright = 388 passing tests" — consistent with `STATUS.md` and `CHANGELOG.md`. ✓

### 5.4 References to deferred figures

§3.3 notes "Figures F6 and F7 are scheduled for regeneration… The current versions reflect the Iter-3 `src/risk/` 12-condition Stage B and are correctly attributed in their captions." Verify the actual captions in F6.png / F7.png reflect this attribution at the file level. The current captions (lines 152, 156) do not contain the "Iter-3 `src/risk/`" qualifier. **Action:** either regenerate the figures or update the captions in lines 152, 156 to make the Iter-3 attribution explicit.

### 5.5 Forward references

The manuscript references `paper/supplementary/S-Methods-3-rev3c-priors.md` implicitly via the "27 citations consolidated" claim, but no such file exists. **Action:** either create the supplementary file (it should consolidate the per-condition primary-source citations) or rephrase the manuscript text to remove the implicit forward reference.

---

## 6. Minor concerns

### 6.1 Style and clarity

- §2.3 is now ~85 lines long after the v0.5.0 rewrite — at the upper limit of what a Methods subsection should be. Consider splitting into §2.3 (architecture) + §2.3.1 (K15 §II.A.9 sequential-phase clarification) + §2.3.2 (per-condition priors) + §2.3.3 (engine validation), which would also make the rev3-d methodological finding stand out as a labeled sub-section.
- The "rev3-c", "rev3-d", "rev3-e" calibration-revision identifiers are repository-internal vocabulary that a journal reader will not recognize. They should either be (a) renamed to descriptive labels in the manuscript text ("the per-condition source-cited prior pass"; "the K15 §II.A.9 sequential-phase correction"; "the per-condition fi_cp3 audit") or (b) defined as a glossary at first mention.
- "rev3-f scope" appears in §4.4 as a forward-reference to a future calibration revision; a journal reader will not understand this. Rephrase to "a future per-condition severity audit".

### 6.2 Mathematical notation

- The cp3 contribution formula in §2.3 (line 86) uses $t_\mathrm{end}, t_\mathrm{event}, \Delta t_\mathrm{cp1}, \Delta t_\mathrm{cp2}$ — these symbols should be defined immediately below the equation (currently the definitions are implicit).
- The vulnerability multiplier $\lambda_{c, i} = \lambda_c \cdot \exp(\beta_c \cdot z_{c, i})$ in §2.3 uses a single $\beta_c$ scalar; the original Iter-3 §2.3 used a vector $\boldsymbol{\beta}_c^\intercal \mathbf{z}_i$. Verify that the IMM Calculator implementation uses the scalar form (one coefficient per condition family) and update the notation accordingly.

### 6.3 Compatibility with figure regeneration

§3.3 defers F6 / F7 regeneration to a pre-submission commit but does not specify the regeneration mechanism. The existing figure-generation chain (`tests/e2e/paper-figures.spec.ts` + `scripts/extract_worked_example.ts`) is wired against the Iter-3 `src/risk/` Stage B. **Action:** clarify in §3.3 (or in a new supplementary methods section) how F6 / F7 will be regenerated from the v0.5.0 IMM Calculator — most likely a new TestFigureHost fixture wired to `simulateIMM` plus a new `scripts/extract_imm_worked_example.ts`. This is the actual blocking pre-submission task.

### 6.4 Cover letter

Not reviewed in this pass; verify the cover letter (`paper/cover-letter.md`) reflects the v0.5.0 contributions, in particular the K15 §II.A.9 sequential-phase clarification as one of the lead methodological findings.

### 6.5 Abstract word count

The structured abstract is now ~310 words after the v0.5.0 revision (pre-revision: 200 words exactly, per `paper/SUBMISSION_CHECKLIST.md`). npj Microgravity's standard structured abstract limit is ~200 words. **Action:** condense the abstract to the npj limit — likely by trimming the rev3-d clarification (which is now in the body) and tightening the Methods paragraph.

---

## 7. Reproducibility check — strong

- Tagged release `v0.5.0` at commit `9e31b85` ✓
- 388 passing tests (355 vitest + 13 IMM-86 at T=100k + 20 Playwright e2e) ✓
- IMM-86 K15 reproduction gate as CI contract ✓
- MIT-licensed source on GitHub at `https://github.com/strikerdlm/selectron` ✓
- Source-of-truth `paper/results-snapshot-v0.5.0.md` for every numerical claim ✓
- Deterministic seed 0xc0ffee throughout ✓
- CHANGELOG.md anchored to commit SHAs ✓

The reproducibility infrastructure is the strongest aspect of this submission. The two outstanding items are: (a) populating the `__ZENODO_DOI__` placeholder at submission time (per `SUBMISSION_CHECKLIST.md` T29); (b) regenerating F6 / F7 from the IMM Calculator (per §3.3 deferred work).

---

## 8. Significance and novelty assessment

**Novelty: strong.** The Bayesian MCDA + NASA HSRB LxC bridge is genuinely absent from the published literature, as the manuscript correctly documents (§4.2). The IMM Calculator's K15 §II.A.9 sequential-phase clarification — if framed correctly with the verified citations and the methodological language tightened — is a publishable finding in its own right that would interest the NASA IMM community.

**Significance: strong for the analog-mission community; moderate for the broader human-spaceflight community.** The analog-scope decision (Earth-based isolation + LEO/ISS) is honest and well-defended, but narrows the operational applicability. The structural prerequisites for Mars / Artemis (§4.4, `docs/future_features.md`) are honestly catalogued; a reviewer might ask "what is the timeline to remove these limitations" — a one-sentence note in §4.5 would help.

**Fit for npj Microgravity: strong.** The journal's scope includes methodological contributions to spaceflight medicine and the NASA-IMM ecosystem; Antonsen et al. (2022) [@imm-a22] and (2023) [@antonsen2023] are recent npj Microgravity papers in the same space. The methodology + reproducibility-artifact pattern is consistent with the journal's profile.

---

## 9. Specific actionable corrections

Ordered from highest to lowest priority for pre-submission:

### Tier 1 — must fix before submission (citation hygiene)

1. **Correct `imm-g12` bib entry.** Replace fabricated author list with verified: Gilkey K. M., Myers J. G., McRae M. P., Griffin E. A., Kallrui A. S. Replace TM-2012-217227 with TP-2012-217120. Replace title with "Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort". Verified source: NTRS R=20120013096.

2. **Correct `bhatia2012` bib entry.** Journal: Wilderness & Environmental Medicine. Volume/pages: 23(3), 231–238.e2. Title: "Morbidity pattern of the 27th Indian Indian Scientific Expedition to Antarctica". DOI: 10.1016/j.wem.2012.04.003. Verified source: PMID 22835801.

3. **Correct `pattarini2016` bib entry.** Journal: Wilderness & Environmental Medicine. Volume/pages: 27(1), 69–77. Year: 2016. Title: "Primary Care in Extreme Environments: Medical Clinic Utilization at Antarctic Stations, 2013-2014". DOI: 10.1016/j.wem.2015.11.010. Verified source: PMID 26948556. **Note:** the cited "Pattarini McMurdo 0.036/py MEDEVAC rate" needs full-text verification from this corrected paper; the per-station MEDEVAC rate may or may not appear in the actual cited Pattarini paper.

4. **Correct `hong2022` bib entry.** Journal: Nature and Science of Sleep. Volume/pages: 14, 1387–1396. DOI: 10.2147/NSS.S370659. Title: "Mood and Sleep Status and Mental Disorders During Prolonged Winter-Over Residence in Two Korean Antarctic Stations".

5. **Correct `perina2024dental` bib entry.** Year: 2023 (not 2024). Journal: Czech Polar Reports. Volume/issue: 13(2). DOI: 10.5817/CPR2023-2-13. First author: "Peřina, V." (Vojtěch, not J.). Co-authors: Bartáková J., Pires Freitas A., Máca J., Bartáková S., Esteves Arantes R. M. Rename citation key to `perina2023dental`. Verified source: Czech Polar Reports https://journals.muni.cz/CPR/article/view/38138.

6. **Rename `basner2014mars500` → `basner2013mars500`** to match the actual 2013 publication year. Add missing co-author Namni Goel. Verified source: PMID 23297197.

7. **Verify `imm-k15` ICES paper number** with the NASA TRS (R=20150022114 or R=20150018879 may be the correct identifier). If the ICES-2015-123 number cannot be confirmed, cite by NTRS identifier.

8. **Verify `imm-s20`** exact volume/page/DOI against the Aerospace Medicine and Human Performance journal record. PMID 32493555 confirms the paper.

9. **Verify `whitmire2015`** NASA evidence report number (HRP-47832 vs alternate). NTRS R=20160003864 or 20150016964.

10. **Replace `fedyay2023sirius`** with the peer-reviewed MDPI Aerospace version if available (likely DOI 10.3390/aerospace10060518 — verify); the conference-paper-only citation is the weakest available form.

11. **Run a full Crossref / Scite walk** over all 40 bibliography entries before the pre-submission tag (per `SUBMISSION_CHECKLIST.md` lines 13 + 39); the 29 pre-existing entries should re-verify cleanly, but the 11 new entries above need the corrections in items 1–10 applied first.

12. **Verify or remove specific numerical claims that don't trace cleanly to source abstracts**:
    - "9.7 % URTI rate" from Bhatia 2012 → full-text check or remove
    - "1/6 chronic insomnia over 520 d" from Basner 2013 → full-text check or remove
    - "0.036/py MEDEVAC rate" from Pattarini 2016 → full-text check (likely correct but the cited paper now has the right metadata)
    - "5.2 % weighted Antarctic" from Palinkas 2008 → soften to "approximately 5 %" or cite the source of the weighting

### Tier 2 — fix before submission (internal consistency)

13. **Resolve the Δ −3.85 vs Δ −4.68 inconsistency** between §1, §2.3 and Abstract / §3.3 Table 2. Recommended: standardize on the rev3-e final state (Δ −4.68); the rev3-d intermediate is best discussed in the "methodological clarification" sub-section as a process narrative rather than as the headline residual.

14. **Condense Abstract to ≤ 200 words** to match npj Microgravity's structured-abstract limit.

15. **Either create `paper/supplementary/S-Methods-3-rev3c-priors.md`** (consolidating the 27 per-condition primary citations) **or rephrase** §2.3 to remove the "27 citations" forward reference.

16. **Regenerate F6 / F7** from the v0.5.0 IMM Calculator outputs, or update the F6 / F7 figure captions in lines 152 and 156 to explicitly attribute them as "Iter-3 `src/risk/` Stage B (legacy)" pending the v0.5.0 IMM Calculator regeneration.

### Tier 3 — recommended before submission (style)

17. Replace `rev3-c` / `rev3-d` / `rev3-e` / `rev3-f` internal vocabulary with descriptive labels.

18. Consider splitting §2.3 into 3 or 4 sub-sections for readability.

19. Add a curation-cadence sentence to §2.6 explaining how documented-divergent brackets are reviewed and tightened (regression-prevention discipline).

20. Verify cover letter (`paper/cover-letter.md`) reflects v0.5.0 contributions.

---

## 10. Reviewer's bottom line

The science is real, the engineering is sound, and the reproducibility infrastructure is impressive. The K15 §II.A.9 sequential-phase clarification is a publishable methodological finding that strengthens the NASA-IMM ecosystem. The 5-of-12-K15-metrics-within-CI₉₅ reproduction, enforced as a CI contract, is the right kind of evidence for a Q2 methodology paper.

The citation problems in §3 of this report are entirely fixable — the underlying papers in most cases exist and the methodological claims they support are real; only the bibliographic metadata needs correction against the verified ground-truth values above. After the Tier-1 corrections, the manuscript would be ready for re-submission.

**Recommended decision: major revision, with primary focus on citation hygiene.**

---

## Reviewer's references (this review)

According to PubMed and direct NTRS / Czech Polar Reports / journal-site verification:

- Palinkas LA & Suedfeld P (2008). Psychological effects of polar expeditions. *Lancet* 371(9607):153-63. [DOI: 10.1016/S0140-6736(07)61056-3](https://doi.org/10.1016/S0140-6736(07)61056-3)
- Basner M et al. (2013). Mars 520-d mission simulation reveals protracted crew hypokinesis and alterations of sleep duration and timing. *Proc Natl Acad Sci USA* 110(7):2635-40. [DOI: 10.1073/pnas.1212646110](https://doi.org/10.1073/pnas.1212646110)
- Bhatia A & Pal R (2012). Morbidity pattern of the 27th Indian Indian Scientific Expedition to Antarctica. *Wilderness Environ Med* 23(3):231-238. [DOI: 10.1016/j.wem.2012.04.003](https://doi.org/10.1016/j.wem.2012.04.003)
- Pattarini JM, Scarborough JR, Lee Sombito V, Parazynski SE (2016). Primary Care in Extreme Environments: Medical Clinic Utilization at Antarctic Stations, 2013-2014. *Wilderness Environ Med* 27(1):69-77. [DOI: 10.1016/j.wem.2015.11.010](https://doi.org/10.1016/j.wem.2015.11.010)
- Hong S et al. (2022). Mood and Sleep Status and Mental Disorders During Prolonged Winter-Over Residence in Two Korean Antarctic Stations. *Nature and Science of Sleep* 14:1387-1396. [DOI: 10.2147/NSS.S370659](https://doi.org/10.2147/NSS.S370659)
- Peřina V, Bartáková J, Pires Freitas A, Máca J, Bartáková S, Esteves Arantes RM (2023). Analysis of dental care in Antarctic crews: Dental problems, case studies and treatments. *Czech Polar Reports* 13(2). [DOI: 10.5817/CPR2023-2-13](https://doi.org/10.5817/CPR2023-2-13)
- Gilkey KM, Myers JG, McRae MP, Griffin EA, Kallrui AS (2012). Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort. *NASA/TP-2012-217120*. [NTRS R=20120013096](https://ntrs.nasa.gov/citations/20120013096)
- Walton ME & Kerstman EL (2020). Quantification of medical risk on the International Space Station using the Integrated Medical Model. *Aerospace Med Hum Perform* 91(4):332-342. PMID 32493555.

— end of review —
