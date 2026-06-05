# Peer Review Report — Round 3 (retargeted to Advances in Space Research)

**Manuscript**: Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection
**Date**: 2026-05-28
**Tier**: Standard+ (text analysis + source-code cross-check + targeted live citation verification)
**Article type**: Computational methods paper (methodology + software artifact)
**Reporting guideline**: None specific (methods paper)
**Target journal**: **Advances in Space Research (ASR)** — Elsevier/COSPAR, ISSN 0273-1177, **Q2**, subscription (non-OA) track
**Previously**: R1 (npj Microgravity) → Minor Revision; R2 (npj compliance audit) → Accept w/ Minor Revision. **npj Microgravity dropped (APC $3,790 unaffordable); target is now ASR.**

**Method note.** Five reviewer lenses (Methodology/A, Domain/B, Writing/D, Journal-fit/E) were run as independent agents; each Major finding was then put through an adversarial verifier instructed to *refute* it against the actual manuscript text and the released source code. The numeric internal-consistency sweep and ASR-spec compliance checks were done by exhaustive main-loop cross-referencing. Concerns are calibrated to a **Q2** bar: a single synthetic worked example, no outcome validation against real analog-mission data, and single authorship are treated as **acceptable methodology-paper limitations, not blockers**.

---

## Summary

Selectron is a two-stage pipeline: Stage A is a Bayesian MCDA engine (Dirichlet weight prior, per-candidate composite-score posteriors with rank credible intervals); Stage B is a NASA-IMM-aligned 100-condition Monte Carlo (the "IMM Calculator") whose Crew Health Index posterior is mapped verbatim onto the NASA HSRB 5×5 Likelihood × Consequence grid. The dual novelty is (1) Bayesian MCDA for analog-astronaut selection and (2) the first formal analog-Monte-Carlo→HSRB bridge. The engineering is genuinely strong: the K15 §II.A.9 sum-of-products QTL clarification is valuable, the "inter-model agreement, not validation" discipline is exemplary, the tier-A-only non-circularity test is the right check, and the reproducibility contract (seed-deterministic, CI-blocking K15 gate, MIT artifact) is above the norm for the field.

## Overall Recommendation

**Major Revision** — but a Major that is almost entirely *editorial, framing, and format* plus *one disclosure correction*. **No new experiments, re-analysis, or re-computation are required**; the verified Stage-A/Stage-B mathematics are sound and were checked against source. A competent author can close every blocking item in 1–2 days. For a Q2 venue this sits at the Major/Minor boundary; it is graded Major because three of the blockers (the abstract misrepresenting a disclosed result, the headline likelihood-axis spec error, and the headline coupling being inert in every reported number) are the kind a careful reviewer will require fixed *before* recommending acceptance.

**Controlling concerns (the four that decide this paper at ASR):** scope-fit, internal consistency, honest disclosure, reproducibility. Each blocker below maps to one of these.

---

## Desk-Rejection Pre-Screen

RESULT: **CLEAR** for content — no fatal scientific trigger. Two *submission-readiness* flags (not desk-kill, but fix before upload):
- ⚠ Abstract is 345 words / structured; ASR requires ≤250 words / single unstructured paragraph (M4).
- ⚠ Keywords absent; Elsevier Generative-AI declaration absent from the declarations block (m4, m5).
- ⚠ Highest desk-*screen* risk is scope framing at a COSPAR venue (M6) — addressed by reframing, not new content.

---

## Major Concerns

### Methodology

**M1 [A-M1]. The dual-novelty Stage-A→Stage-B coupling is inert in every reported result.** *(Verdict: HOLDS — Major. Verified against source.)*
The manuscript's stated keystone contribution is the coupling — §4.1: "what makes the pair more than the sum of its parts"; §5 echoes it — implemented as λ_{c,i} = λ_c·exp(β_c·z_{c,i}) over 58/100 vulnerability-coupled conditions. The verifier confirmed via the released code that `applyStageAVulnerabilityMultiplier` (`simulate.ts:140`) returns the unmodified `baseLambda` whenever a crew member has no `stageAScores`, and the K15 reference crew preset (`imm-preset-crews.ts:27-33`) carries none; the validation/figure paths invoke `simulateIMM` with no criteria. **Therefore every reported Stage-B number — Table 2, Figs 6–7, Tables 3–4, the L5×C4=23 verdict — runs with the coupling OFF.** The novel coupled path is neither demonstrated nor validated in any reported result, and §2.3 (line 106) actively implies the reported HSRB verdict depends on the FAMILY_BETA coefficients when in fact those coefficients never fire in any reported run. (Scope precision: the *B→HSRB* leg of the "dual-novelty" sentence **is** exercised everywhere; only the *A→B vulnerability* leg is inert. The abstract is clean — it makes no coupling-drives-results claim.)
> **Fix (cheap, editorial — Q2-appropriate).** (a) State plainly in §3.3/§4.4 that K15 reproduction and all reported Stage-B results necessarily run with A→B coupling off (iMED itself has no selection coupling, and the K15 crew has no Stage-A scores), so the *validated* path is the uncoupled IMM. (b) Reframe §4.1/§5 to present the A→B coupling as an *implemented and unit-tested but not-yet-exercised* capability; drop "more than the sum of its parts." (c) Correct §2.3 line 106 so it no longer implies the reported numbers depend on FAMILY_BETA. **Stronger optional fix that fully closes it:** run the existing ALPHA/BRAVO/CHARLIE Stage-A posteriors forward into Stage B via `reproducer_imm_composite.ts` and report one coupled worked example (e.g., the CHI/HSRB shift showing a stronger candidate lowers incidence). A single coupled demo carries no extra outcome-validation burden at Q2.

**M2 [A-M2]. The HSRB likelihood axis is specified inconsistently between Methods, Results, and code.** *(Verdict: HOLDS — Major. Survived refutation.)*
§2.4 (lines 120, 122) says the likelihood level L is bucketed from **P(χ<χ\*)**. But §3.4 (line 243), the Fig 6 caption ("L = bucketed 1−MSP"), and the implementation (`lxc.ts:117,120`) all bucket **1−MSP**, where MSP = P(no EVAC ∧ no LOCL ∧ χ≥χ\*). These are *not* the same statistic — 1−MSP additionally counts EVAC-only and LOCL-only trials, so 1−MSP ≥ P(χ<χ\*). The conflation is not loose notation: §2.3 line 110 *formally* binds the symbol P(χ<χ\*) to the narrower CHI-only early-termination probability. This governs the manuscript's **headline** red verdict (computed from 1−MSP = 14.0% → L5) and breaks the §2.5 "every number from the same source files" reproducibility guarantee — a reader who codes §2.4 verbatim diverges from the artifact. (Magnitude: most likely the color stays red at L4×C4=22, so this corrects a spec defect rather than necessarily overturning the result — hence Major Revision, not Reject.)
> **Fix (pure text, no recomputation).** Rewrite §2.4 lines 120/122 to bucket from **1−MSP = 1 − P(no EVAC ∧ no LOCL ∧ χ≥χ\*)**, anchored to the MSP definition at §2.3 line 99, and explicitly distinguish it from the early-termination probability P(χ<χ\*) at §2.3 line 110. One sentence justifying 1−MSP as the conservative all-failure-modes choice (mirroring the `lxc.ts:14-16` rationale) strengthens it.

### Writing / Structure

**M3 [D-M1]. The abstract and headline contributions claim an issHMS-CHI reproduction success that the body retracts.** *(Verdict: HOLDS — Major.)*
Abstract Methods (line 17) and contributions bullet (line 39) state the QTL fix "restored reproduction within K15's published CI₉₅ on the operational ISS-HMS scenario." The body says the opposite, repeatedly: issHMS CHI = 82.8, Δ −12.1, **divergent, 1.5 pp below the CI₉₅ lower bound of 84.30** (lines 79, 227, 235, §4.4). The metric that *does* land in-bracket is the **unlimited-resources** CHI (95.3 ∈ [84.40, 98.50]). Three concrete defects:
1. **Wrong scenario.** Lines 17/39 attribute the success to issHMS; the in-bracket metric is unlimited CHI (and all three TMEs).
2. **Abstract self-contradiction.** Line 17 says issHMS reproduction was *restored within CI₉₅*; line 19 says issHMS CHI *falls 1.5 pp below* it.
3. **Orphan number.** "Δ −4.68 final" (line 39) appears **once in the whole manuscript** and matches nothing: the intermediate is Δ −3.85 (line 79), the final is Δ −12.1 (82.8 − 94.93). The fix-alone state reached Δ −3.85 (CHI 91.08, in-bracket), but the later cp3 audit + community/military recalibration pushed the final to 82.8 (below); the abstract froze the intermediate state and never updated.
> **Fix (body-supported).** Reword abstract line 17 and contribution line 39 to claim reproduction within CI₉₅ on **TME (all three kits)** and the **unlimited-resources CHI** — not issHMS; state the QTL fix reduced per-event QTL ~2–3× and moved issHMS CHI *toward but not into* CI₉₅ (final 82.8, Δ −12.1); **delete "Δ −4.68 final"**; reconcile abstract lines 17 ↔ 19.

**M4 [D-M2 / E-M2]. Abstract violates ASR format on both length and structure.** *(Verdict: HOLDS — Major; mechanical.)*
Measured **345 words** (≈38% over the ≤250 cap) and **structured** with bold Background/Methods/Results/Conclusions labels; ASR requires a **single unstructured paragraph ≤250 words**. The overflow is driven by the K15 bug-fix narrative embedded in the Methods sentence (a debugging-diary register inappropriate for an abstract).
> **Fix.** One coordinated rewrite fixes M3 + M4 + part of M6 together: drop the bold labels; delete the QTL bug-fix narrative (it lives in §2.3 and the contributions list); open with the computational risk-engineering contribution (per M6); keep one honest headline result (TME + unlimited CHI within K15 CI₉₅; issHMS CHI marginally divergent) and the dual-novelty claim; trim to ≤250 words. A compliant draft is provided in the *Ready-to-apply edits* appendix.

**M5 [D-M3]. Pervasive internal-development nomenclature leaks into journal prose — and embeds one factual inconsistency.** *(Verdict: HOLDS — Major; pervasive.)*
The manuscript repeatedly reads as developer documentation: software version numbers ×13 (`v0.5.4`, `v0.5.0`, `v0.6.x`, `v0.5.x`, `v1.1` — e.g. line 245 "the earlier yellow verdict (v0.5.0: …) to red" reads as a changelog); the internal gate name **`IMM-86` ×8**; `Iter-1`/`Iter-2` sprint labels; lifecycle jargon ("one-way ratchet", "test churn", "open backlog item", "`tracking` field", "shipped in", "queued for"); and ~9 inline source-file paths in prose. **Factual inconsistency embedded here:** lines 88 and 326 both say "10 calibration passes (passes p-a through p-l)" — but `a…l` is **12** labels, not 10. (R2's "pass 4" leak *was* fixed — confirmed.)
> **Fix.** Strip all version numbers (let the commit SHA + Zenodo DOI carry the pin); rename "IMM-86 gate" → "the K15 reproduction acceptance gate"; replace `Iter-1/2` with "current default"/"planned extension"; plain-language the lifecycle jargon; keep at most one module path (`src/imm/`) and move the rest to the Code-availability statement; **reconcile the pass count** (drop the `p-a…p-l` labels: "fitted via PyMC NUTS across iterative calibration passes, all converging at R-hat = 1.000, ESS > 2500"). Keep the GitHub URL, commit SHA, and Zenodo DOI — those are legitimate anchors. Mechanical; changes no number or claim.

### Journal fit

**M6 [E-M1]. ASR scope-fit / desk-screen risk: the paper leads with a personnel-selection frame at a space-science/engineering venue.** *(Verdict: HOLDS — Major; highest-leverage pre-submission edit.)*
ASR's life-sciences content lives in **Commission F (Life Sciences as Related to Space)**, which *does* publish space-medicine and analog work — so this is marginal-fit-within-Commission-F, **not** wrong-journal. But the title, the abstract's opening subject ("Selection panels…"), and the first contribution bullet all lead with **Bayesian-MCDA personnel selection**, which reads to a COSPAR editor as operations-research-applied-to-HR — the single most likely desk-screen trigger. The in-scope hooks are present and substantial (NASA-IMM K15 reproduction at T=100,000, verbatim HSRB 5×5 LxC, NASA-STD-7009A V&V, reproducible PRA artifact) but are under-sold by the framing.
> **Fix (content-neutral; no result changes).** (1) Retitle to lead with the computational risk contribution, e.g. *"Reproducible NASA-IMM Mission-Risk Monte Carlo with HSRB Likelihood × Consequence Mapping: A Bayesian MCDA Pipeline for Analog-Astronaut Selection."* (2) Rewrite the abstract's first sentence so the grammatical subject is the IMM/HSRB risk-engineering contribution. (3) Reorder the Introduction contributions list so the K15 reproduction gate + HSRB mapping lead and the MCDA-for-selection bullet follows. *Contingency:* if an ASR editor signals fit concern, **Acta Astronautica** (Elsevier/IAA, subscription/no-APC) is the stronger home for the PRA framing — pre-stage it, do not switch reflexively.

---

## Minor Concerns

### Domain (all three downgraded from Major by adversarial verification — honestly disclosed in the body)

**m1 [B-M1].** The flagship issHMS "red, score 23" verdict rests on metrics Table 2 itself flags out-of-bracket (CHI 82.8 below [84.30,98.50]; pEVAC 9.65% vs [5.43,5.72]). K15's *own* numbers on the *same* ISS-HMS kit map to **yellow** (CHI 94.93 → C2; pEVAC 5.57 → L4 ⇒ L4×C2=13). §3.4's "kit-driven, not structural" defense runs only the unlimited comparison and never the same-kit one. *Nothing is hidden* (Fig 6 caption already attributes the red verdict to the recalibrated rates), so this is a consistency tightening, not a blocker. **Fix:** add ~2 sentences to §3.4 noting the same-kit K15 verdict is yellow and the issHMS red is co-driven by the evidence-based recalibration; optionally lead the HSRB demo with the validated unlimited-kit (yellow) result.

**m2 [B-M2].** Novelty claim #1 ("first Bayesian MCDA pipeline for astronaut, **aircrew**, and analog-astronaut selection") overreaches on the *aircrew* axis. **Verified live:** aircrew/pilot personnel selection via MCDM is a well-populated field — **Taylan et al. 2024** (*Expert Systems*, fuzzy TOPSIS/VIKOR/PROMETHEE on 12 candidate pilots) is real and directly on point; also Taylan 2014 (ATC selection), an IT2FS-MCDM military/civil/sports-pilot-selection study (2021), Dožić 2019 (aviation-MCDM review), and Costa 2021 / López-González 2026 personnel-selection-MCDM reviews. The verbatim negative search ("Bayesian MCDA" AND (astronaut OR aircrew OR analog) = 0 hits) survives but does not license broad "aircrew" primacy. **Fix:** narrow the claim to the defensible intersection §5 already states — *"first Bayesian-MCDA pipeline delivering per-candidate composite-score posteriors and rank credible intervals for analog-astronaut selection, coupled to a NASA-IMM mission-risk model and HSRB LxC mapping"* — and cite Taylan 2024 as the aircrew-MCDM precedent being distinguished. **⚠ Caution:** the reviewer agents also proposed "Yet 2019", "Ulu 2023", "Mohammadi 2022", "Dugger 2022" (m2) and "Anderson 2024 (IMPACT)", "Romero 2020" (m6) — **these were NOT verifiable in live search; do not add any of them without first confirming they exist** (Crossref/Scopus). Taylan 2024 is the only externally confirmed addition.

**m3 [B-M3].** §5 (and the §4.1 headline sentence) call the coupling "what makes the pair more than the sum of its parts" without a co-located qualifier that the β are operator-supplied, not fitted — the tempering lives sections away in §2.3/§4.4/§4.5. Read in isolation the Conclusion implies a calibrated synergy. **Fix:** one clause tempering §5/§4.1 (cross-ref §2.3/§4.5). (Folds into M1's reframe.)

**m6 [B-m1].** Acknowledge that NASA already maps human-system risk to HSRB LxC and that a newer NASA medical-risk PRA tool may post-date K15 — *only if* the suggested refs (IMPACT/Anderson 2024, Romero 2020) can be verified. Strengthens, not weakens, the analog/open-artifact bound. **Verify before citing.**

**m14 [B-m2].** Strengthen (don't just assert) the Mission-Objectives-Impact vs Crew-Health-Impact sub-category choice: state explicitly that (1−χ)=QTL/(t·c) is a dimensionless time-loss fraction the C-bands are defined on, whereas Crew-Health-Impact needs a clinical-severity grade the model does not produce.

**m12 [B-m4].** Distinguish PyMC sampler convergence (R-hat=1.000, ESS>2500 = *sampling* quality) from *evidential* pedigree (several tier-B anchors are small-n single-cohort analog studies). One sentence; consistent with NASA-STD-7009A factors 4–8 being deferred.

**m13 [B-m5].** Add a one-line reconciliation of the Antarctic winter-over pEVAC (37.78% whole-crew cumulative over 365 d) against the Pattarini 0.036/py anchor so the ~order-of-magnitude gap is shown, not asserted.

### Methodology

**m7 [A-m1].** Justify T=5,000 for Stage A explicitly (central credible intervals, ESS≈T) the way T=100,000 is justified for Stage B's tail probabilities.

**m8 [A-m2].** The σ<5% rule is verified on CHI only; Fig 7 runs rare-event metrics (pEVAC/pLOCL) at T=25,000, where the color-flipping metrics are least converged (~15% relative MC error at pLOCL≈0.18%). Raise Fig 7 to T=100,000 for those, or add an MC-standard-error column, or at minimum state the σ rule was CHI-only.

**m9 [A-m4].** Reframe the ESS report in §3.2 as a *verification* check (confirms IID draws as designed) rather than a sampling-quality result — by construction ρ₁≈0, ESS≈T.

**m10 [A-m5].** The RAF parameter-linear vs Bayesian-mixture interpolation choice is asserted ("qualitatively similar central tendencies within ~2σ") but not shown; the two diverge in the tails and the HSRB likelihood depends on tail mass. Add a small supplementary comparison on 2–3 high-severity conditions, or disclose as a limitation.

**m11 [A-m3].** State that the non-circularity demonstration applies to **CHI** (tier-A-only issHMS CHI 97.3 in-bracket); for **TME** the tier-A subset (39.3) does *not* reproduce K15 [87,126] — no single configuration reproduces both metrics simultaneously. Avoid implying a clean two-metric non-circular reproduction.

### Journal fit / format

**m4 [E-M3].** Add a **Keywords** line (genuinely absent; e.g., *analog astronaut; mission medical risk; NASA Integrated Medical Model; Bayesian MCDA; probabilistic risk assessment; HSRB Likelihood × Consequence*). **Highlights** already exist as `submission/highlights.md` (separate Elsevier file ✓) — confirm 3–5 bullets ≤85 chars.

**m5 [E-M4].** Add the Elsevier-templated **"Declaration of generative AI and AI-assisted technologies in the writing process"** to the Statements block (before References). All required content already exists in §2.7; this is a relocation/reformat into Elsevier's exact wording, not new disclosure.

**m15 [E-m2].** Abbreviate journal names per **LTWA** in the reference list (e.g., *Aviat. Space Environ. Med.*, *J. Multi-Criteria Decis. Anal.*, *ACM Trans. Math. Softw.*). Author-year Harvard style itself is correct ✓.

### Internal consistency / housekeeping (main-loop sweep)

**m16 [D-m1].** Em-dash density ≈9.3/1000 words (113 total); convert ~⅓ of two-dash sentences to commas/parentheses/breaks.

**m17.** Orphan references: `palinkas2004` and `perina2023dental` are cited 0× → the rendered reference list is **40**, not 42 (citeproc renders only cited keys). Either cite them (palinkas2004 is a relevant Antarctic-selection paper that would *strengthen* §1) or remove from `references.bib`.

**m18.** §4.4 says "**8** of 12 K15 metrics are documented-divergent"; §4.5 says "the **7** documented-divergent K15 metrics." Reconcile (likely §4.5 means the 7 outcome-parameter-driven divergences, excluding the incidence-driven issHMS CHI — state that).

**m19.** `__ZENODO_DOI__` and `__COMMIT_SHA__` placeholders remain in §2.5, the Statements block, and figure captions (F3/F4/F5). **Must** be populated at submission per the reproducibility contract — a literal `__COMMIT_SHA__` in a figure caption reads as unfinished.

**m20 [A-m6] (code, not manuscript).** `simulate.ts:129-131` carries a stale comment ("Production conditions currently have empty vulnerabilityCriteria … active once conditions are updated (Iter-2+)") that contradicts the now-true 58/100-coupled state. Update before reviewers read the artifact (a reproducibility requirement for this paper). Related to M1.

**Housekeeping.** `paper/abstract.md` is a **stale orphan** describing the old 12-condition model ("12 modeled medical and behavioral conditions") — the live abstract is in `manuscript.md`. Delete `abstract.md` to avoid confusion.

---

## Citation Audit Summary

| Check | Result |
|---|---|
| In-text ↔ reference list | Consistent (pandoc `@key`); 2 orphan bib entries (`palinkas2004`, `perina2023dental`) → rendered list = 40, not 42 |
| DOI format / provenance | DOIs present and crossref-walked in a prior pass (`crossref-walk-2026-05-23.md`); per-ref `note` fields document PubMed/Scite verification |
| Self-citation | ~5% (2 Phase-0 self-refs) — acceptable |
| Hallucination signals | None in the manuscript. **Risk is in the *recommended additions*** — Taylan 2024 verified; Yet 2019 / Ulu 2023 / Mohammadi 2022 / Dugger 2022 / Anderson 2024 / Romero 2020 **unverified, must confirm before citing** |
| `.bib` `note` fields | Contain internal nomenclature ("rev3-c", "peer-review pass") — harmless if the CSL does not render notes (elsevier-harvard typically does not); verify the rendered list is clean |

## Reporting-guideline compliance
Methods paper — no CONSORT/STROBE/PRISMA applies. NASA-STD-7009A factors 1–3 addressed; 4–8 explicitly deferred (appropriate and honestly scoped for a methodology paper).

## LLM-ism Assessment
**Score: 3/10 (low–moderate).** Prose is specific and varied; generic intensifiers scarce; no hedge-stacking or formulaic openings. The dominant register problems are **not** classic LLM-isms but (a) developer-doc leakage (M5) and (b) a bug-fix-diary voice in the abstract/Methods (M3, M4). Elevated em-dash density (m16) and frequent triadic lists are present but non-dominant.

---

## Prioritized action list (for an ASR submission)

**Must fix before upload (blockers):**
1. **M4** — rewrite abstract: unstructured, ≤250 words. *(fixes M3 + part of M6 too)*
2. **M3** — reconcile abstract/contributions to the body's real result; delete the orphan "Δ −4.68 final".
3. **M2** — correct §2.4 likelihood axis to 1−MSP.
4. **M1** — disclose that all reported Stage-B numbers run coupling-off; reframe §4.1/§5; fix §2.3 line 106. *(optional: add one coupled ALPHA/BRAVO/CHARLIE demo)*
5. **M6** — reframe title + abstract opener + contributions order to lead with the risk-engineering contribution.
6. **M5** — strip dev nomenclature; fix the 10-vs-12 pass-count error.
7. **m4 / m5** — add Keywords; add Elsevier GenAI declaration.
8. **m19** — populate `__ZENODO_DOI__` / `__COMMIT_SHA__`.

**Should fix (strengthens; reviewers will appreciate):**
9. **m2** — narrow novelty #1; cite Taylan 2024.
10. **m1** — add the same-kit-K15-is-yellow sentences to §3.4.
11. **m11, m8, m9** — metric-specific non-circularity; Fig-7 convergence caveat; ESS framing.
12. **m17, m18, m12, m13, m14, m10, m15, m16, m20** — housekeeping and tightening.

**Nice-to-have / verify-first:**
13. **m6** — IMPACT/Romero awareness *only after verifying those refs exist*.

---

## Cross-reviewer convergence (confidence signal)
- The **abstract overstatement + orphan −4.68** was independently found by the main-loop numeric sweep **and** Reviewer D **and** flagged as a lead by Reviewers A and B → highest-confidence finding.
- The **abstract format violation (345w/structured)** was found by the main-loop sweep, D, and E independently.
- The **dev-nomenclature leakage** was found by the main-loop sweep and D independently.
- A-M1 (inert coupling) and A-M2 (likelihood-axis spec error) required reading the **source code** and were caught only by the methodology lens — the workflow's distinctive value-add over a text-only read.

*No cross-reviewer disagreements requiring author adjudication — the adversarial verifier resolved the severity tensions (B-M1/B-M2/B-M3 Major→Minor) with manuscript-text evidence.*
