# Peer Review Report — Round 4 (Advances in Space Research)

**Manuscript**: *Reproducible NASA Integrated Medical Model Mission-Risk Simulation with HSRB Likelihood × Consequence Mapping: A Bayesian MCDA Pipeline for Analog-Astronaut Selection*
**Date**: 2026-05-29
**Tier**: Standard+ (text analysis + source-code/artifact cross-check + targeted live citation verification via Crossref)
**Article type**: Computational methods paper (methodology + software artifact)
**Reporting guideline**: None specific (methods paper); NASA-STD-7009A factors 1–3 used as the internal-credibility frame
**Target journal**: **Advances in Space Research (ASR)** — Elsevier/COSPAR, ISSN 0273-1177, Q2, subscription (non-OA)
**Previously**: R1 (npj Microgravity) → Minor Rev; R2 → Accept w/ Minor Rev; R3 (2026-05-28, retargeted to ASR) → Major Rev (editorial/framing). **npj Microgravity dropped (APC unaffordable).**

**Method note.** This round was run *after* the 2026-05-29 hardening pass, so it is primarily (a) a verification that R3's blockers actually landed in the current `manuscript.md`, and (b) a fresh five-lens read for issues introduced or left open by the edits. The manuscript math (Dirichlet aggregation, the §II.A.9 sum-of-products QTL, the 1−MSP likelihood axis, the JSC-66705 grid) was verified against source in R3 and is **not re-litigated here**; this round cross-checks the manuscript against the *released artifact* (the K15 gate test, the figure/supplementary files, `references.bib`) and verifies the highest-risk citations live. Q2 calibration: a single synthetic worked example, no outcome validation, single authorship, and the inert A→B coupling are **accepted methodology-paper limitations, not blockers** (all honestly disclosed).

---

## Summary

Selectron is a two-stage pipeline: Stage A is a Bayesian MCDA engine (Dirichlet weight prior → per-candidate composite-score posteriors with rank credible intervals); Stage B is the "IMM Calculator," a NASA-IMM-aligned 100-condition Monte Carlo whose Crew Health Index posterior is mapped verbatim onto the NASA HSRB 5×5 Likelihood × Consequence grid (JSC-66705 Rev A). The dual novelty is (1) Bayesian MCDA for analog-astronaut selection and (2) the first formal analog-Monte-Carlo→HSRB bridge.

**The manuscript is in strong shape.** The 2026-05-29 pass closed essentially every R3 blocker (verified below). Citation integrity is clean (43/43 references cited, no orphans, no dangling). The science and math were verified sound in R3. What remains is **not scientific** — it is a small set of structural / artifact-consistency / packaging defects that a careful ASR reviewer or the desk editor would require fixed before acceptance. None requires new experiments, re-analysis, or re-computation, and all are closeable in well under a day.

## Overall Recommendation

**Minor Revision** — on scientific merit. *Conditional on closing three must-fix-before-upload items* (R4-M1, R4-M2, R4-M3 below), each structural rather than scientific. A strict editor could grade the missing Table 1 (R4-M2) or the manuscript↔artifact mismatch (R4-M1) as Major on their own, since they touch a cited deliverable and the paper's headline reproducibility guarantee — hence the conditional. The controlling axis for this paper at ASR is now **internal/artifact consistency and submission-package integrity**, not methodology.

**Controlling concerns:** (1) the manuscript's K15-divergence count contradicts the released gate test it points readers to; (2) a cited Table 1 does not exist; (3) the supplementary package is stale and partly missing. Fix these three and the paper is upload-ready.

---

## Desk-Rejection Pre-Screen

RESULT: **CLEAR** for content. Submission-readiness flags (not desk-kill):
- ✓ Abstract now 242 words, single unstructured paragraph (R3 M4 closed).
- ✓ Keywords present; Elsevier GenAI declaration present in Statements (R3 m4/m5 closed).
- ✓ Title leads with the NASA-IMM/HSRB risk-engineering contribution (R3 M6 closed) — scope-fit risk at COSPAR substantially reduced.
- ⚠ Supplementary materials are not submission-ready (R4-M3) — but the body does not depend on them by name, so this is a packaging fix, not a content gap.

---

## Part 1 — R3 closure audit (verified against current `manuscript.md`)

| R3 ID | Item | Status in current manuscript |
|---|---|---|
| M1 | A→B coupling inert in all reported results | ✓ Disclosed plainly in §2.3 (line 102), §4.1, §4.4, §5. Optional coupled demo declined (acceptable at Q2). |
| M2 | Likelihood axis = 1−MSP, not P(χ<χ\*) | ✓ §2.4 (line 118) now buckets Pf = 1−MSP = P(EVAC ∨ LOCL ∨ χ<χ\*), explicitly distinguished from the early-termination probability. |
| M3 | Abstract overstated issHMS reproduction; orphan "Δ −4.68" | ✓ Abstract + contributions now claim TME (all 3 kits) + unlimited CHI within CI₉₅, issHMS CHI 1.5 pp below. No "Δ −4.68" anywhere. |
| M4 | Abstract length/structure | ✓ 242 words, unstructured. |
| M5 | Dev-nomenclature leakage; 10-vs-12 pass error | ✓ No `v0.x`, `IMM-86`, `Iter-1/2`, `p-a…p-l`, or `__TOKEN__` strings remain in `manuscript.md`. |
| M6 | Scope framing / title | ✓ Retitled; contributions reordered to lead with K15 reproduction + HSRB mapping. (See R4-m5 for the residual abstract-opener subject.) |
| m1 | Same-kit-K15-is-yellow note | ✓ Added to §3.4 (line 241). |
| m2 | Narrow novelty; cite Taylan 2024 | ✓ §1 cites `taylan2024`; claim narrowed to analog-astronaut selection. |
| m11 | Metric-specific non-circularity | ✓ §4.4 (line 324) states it applies to CHI; tier-A-only TME (39.3) ∉ K15 TME CI₉₅. |
| m12 | Sampler convergence ≠ evidential pedigree | ✓ §4.4 (line 322). |
| m8 | Fig 7 convergence caveat | ✓ §3.5 (line 249). |
| m13 | Antarctic pEVAC reconciliation | ✓ §3.5 (line 247). |
| m14 | MOI vs Crew-Health sub-category justification | ✓ §2.4 (line 120). |
| m17 | Orphan refs (`palinkas2004`, `perina2023dental`) | ✓ Both now cited; 43/43 references cited (mechanical check). |
| m18 | "8" vs "7" divergent | ✓ §4.5 (line 334) defines the 7 as the outcome-parameter-driven subset of the 8. *(But see R4-M1 — the "8" itself is now the problem.)* |
| m19 | `__ZENODO_DOI__`/`__COMMIT_SHA__` tokens | ✓ Removed from `manuscript.md` (replaced by bracketed notes / "regenerated at the manuscript commit"). **NB:** STATUS.md flags the *rendered docx* still carries the tokens — that is the (deferred) docx rebuild, not the source. |
| — | `paper/abstract.md` stale orphan | ✓ Deleted. |

**Verdict: R3 is effectively closed.** The remaining R3 minors that were *disclosure-only* fixes (m6 abstract opener, m15 LTWA abbreviations, m16 em-dashes, m10 RAF-interpolation-shown) are carried forward below as R4-m5/m7 and standing residuals.

---

## Part 2 — New / still-open concerns

### Major (must fix before upload)

**R4-M1. The manuscript's K15-divergence count contradicts the released gate test, and §2.6 contradicts Table 2 internally.** *(Highest-confidence finding; caught by the numeric sweep + artifact cross-check.)*
The released acceptance gate `tests/imm/validation_k15.test.ts` is ground truth and is the artifact the paper points readers to (§2.5: "every number… produced by the same source files"; §2.6: the gate "asserts that all 12 metric–scenario combinations fall inside an accepted bracket"). That test:
- classifies **all 3 TMEs as `status: "documented-divergent"`** with widened accepted brackets `[65,122]` (none) and `[65,126]` (issHMS, unlimited) — lines 99–126, each carrying the tracking note *"PyMC evidence-based incidence rates are systematically lower than K15 iMED";*
- asserts, verbatim, **"documents that 1 of 12 metrics are within K15 CI₉₅, 11 are documented-divergent"** (line 269; comment block lines 37–46).

The manuscript instead reports:
- **Table 2** marks all 3 TMEs "**✓**" (within) and the caption says "Bold cells fall within K15's published CI₉₅" (TMEs are bold);
- **§3.3** (line 231): "**all three TME values** fall within K15's published CI₉₅";
- **§4.4** (line 326): "**8** of 12 K15 metrics are documented-divergent" (i.e., 4 within: 3 TME + unlimited CHI);
- **§2.6** (line 144): "all 3 TMEs are **numerically within CI₉₅ but classified as documented-divergent**."

So there are two distinct inconsistencies:
1. **Internal**: §2.6 says the TMEs are "classified as documented-divergent," but Table 2 (✓) and §3.3 present them as clean within-CI₉₅ reproductions, and §4.4 counts only 8 divergent (not 11). A reader reconciling §2.6 against Table 2 sees a contradiction.
2. **Manuscript ↔ artifact**: the released gate's own count is **1 within / 11 divergent**; the manuscript says **4 within / 8 divergent**. A reviewer who runs the test (as the reproducibility contract invites) sees a different headline count than the paper reports — which undercuts the §2.5 guarantee that is itself a selling point.

*The underlying numbers are fine:* the 3 TMEs are genuinely within K15's published CI₉₅ (97.8∈[73,122]; 98.1, 98.8∈[87,126]). The defect is purely in **classification/labeling consistency**.

> **Fix (judgment call — choose one framing, then make everything agree):**
> **(a) Claim the stronger, numerically-true position** — TMEs are within K15 CI₉₅ (keep Table 2 ✓, §3.3, the "8 divergent" count). Then update the gate test's TME `status` from `"documented-divergent"` to `"within-k15-ci95"` and fix the test's "11/1" comment+assertion to "8/4", and re-run the gate so the artifact matches the paper. *(Small code/test edit; preserves the cleaner reproducibility story.)*
> **(b) Align the manuscript to the current gate** — report "1 of 12 within K15 CI₉₅ (unlimited CHI); 11 documented-divergent, of which the 3 TMEs sit inside the wide CI₉₅ but carry a systematic mean offset (98.1 vs 106)." Change Table 2's TME marks from ✓ to a "within CI₉₅ / mean-divergent" note and update §3.3/§4.4 counts. *(No code change.)*
> Either is defensible; (a) tells the stronger story but requires touching the artifact, (b) is pure text. **The non-negotiable is that Table 2, §2.6, §3.3, §4.4, and the released test agree on one count.**

**R4-M2. Table 1 is cited but does not exist in the manuscript.** §2.1 (line 45): *"The full criterion list with primary citations appears in Table 1."* There is **no Table 1** in `manuscript.md` — the only tables present are the unnumbered ALPHA/BRAVO/CHARLIE table (line 200), Table 2 (line 216), Table 3 (line 259), and Table 4 (line 277). Figure 2 is the criterion×tier *activation matrix*, not the cited "criterion list with primary citations." The 12-criterion taxonomy (instrument, scale, bound, predictive-validity/agency anchor, citation) is the evidentiary foundation of Stage A, and a reader is explicitly pointed to a table that is absent.
> **Fix (judgment call — content authoring).** Add Table 1: one row per criterion (12 rows across the 5 families) with columns *Criterion | Construct | Instrument | Scale (range, polarity) | Tier (Min/Med/Elite) | Anchor citation*. The content already exists in the codebase (criterion definitions + `tierInstruments[tier].citations`) and the Phase-0 taxonomy — it needs to be lifted into a manuscript table, not re-derived. If the author intends Figure 2 to serve this role, then §2.1 must be reworded (drop "with primary citations… in Table 1") — but a table is the stronger and expected deliverable for a 12-criterion taxonomy.

**R4-M3. The supplementary package is stale and partly missing; it contradicts the manuscript.** Four issues:
- **`supplementary/S-Methods-1-vv-dossier.md` describes the superseded `src/risk/` 12-condition engine, not the 100-condition IMM Calculator.** It states Factor 2 (Validation) is **"UNSATISFIED — pending T37 curation → T40 fit → T59 LOOCV"**, reports **"4/8 factors satisfied,"** and refers to **`model_version = "synthetic-iter3-ui-scaffold"`** synthetic priors. These directly contradict the manuscript's headline claims that Factor 2 *is now satisfied* (by the K15 gate, §2.6) and that the priors are *100% evidence-based with zero synthetic placeholders*. It is also saturated with internal nomenclature (Task IDs T37/T40/T59/T61, commit SHAs, "Phase 3B blocked," EMMPOL, "Iter-4 has not been drafted"). **If uploaded as-is it would be a credibility-destroying internal contradiction.**
- **`supplementary/S-Methods-2-nasa-mc-audit.md`** is mildly stale (references the old `simulateMission`/`src/risk/` names; otherwise the 100k/75k trial-count audit is still valid).
- **§3.6 (line 253) cites "Figures S3 (condition-set decomposition) and S4 (multiplier sweep)" — neither file exists.** Only `S1_vv_dossier` and `S2_ess_table` render. The data they would show is *already in Tables 3 and 4 in the body*, so S3/S4 are redundant.
- **Figure S1 is an orphan** (renders, never cited in the body) and **§2.5 (line 136) cites a `paper/supplementary/S-Notebooks/` folder that does not exist.**

Crucially, **the manuscript body never references "Supplementary Methods 1/2" by name** (only `S-Notebooks/` and Figures S2/S3/S4). So the supplementary methods are *not load-bearing* and the clean fix is exclusion, not rewrite.
> **Fix (judgment call — package decision).**
> (1) **Drop the "visualized in Figures S3/S4" clause** in §3.6 (line 253) — Tables 3/4 already carry the data inline. Decide whether to keep Figure S2 (cited) and either cite or delete Figure S1.
> (2) **Either exclude S-Methods-1/2 from the submission package** (simplest — they are uncited), **or** rewrite S-Methods-1 to describe the *current* IMM Calculator and the *correct* V&V status (Factor 2 satisfied via the K15 gate; 100% evidence-based priors; factors 4–8 deferred) with all Task IDs/commit SHAs/"synthetic" language stripped, to match §2.6.
> (3) **Fix or remove the `S-Notebooks/` path** in §2.5: either create/ship the archived PyMC notebook at that path or reword to point at the repository location that actually exists.

### Minor

**R4-m1. `fedyay2023sirius` has an incorrect co-author list.** *(Live Crossref verification.)* The `.bib` lists `Fedyay, Vasin, Kovalyov, Pochuev`; Crossref (DOI 10.3390/aerospace10060518) gives **Fedyay; Niiazov; Ponomarev; Polyakov; Belakovskiy; Orlov**. Only the first author is correct — co-authors 2–4 are wrong and the count differs (4 vs 6). Title, journal (*Aerospace* 10(6):518, 2023), and DOI are correct. The bib `note` claims Crossref verification (2026-05-23), but the author list does not match Crossref. **→ Auto-applied this round** (see Changes Applied).

**R4-m2. `evetts2026` is incomplete.** *(Live Crossref verification.)* The paper is real and now formally published: **DOI 10.3390/astronautics1010007**, *Astronautics* (MDPI) **1(1):7, 2026-02-18**, authors **Evetts, Healey, Morris-Paterson, Pletser**. The `.bib` has no DOI, lists authors as "Evetts, Simon and others," and is missing volume/issue/page; the note still says "early online." The manuscript's characterization (§1: "risk-informed, mission-specific framework… without Bayesian quantification") matches the abstract. **→ Auto-applied this round** (added DOI, full author list, vol/issue/page; removed "early online" note).

**R4-m3. Two citation-count claims cannot be substantiated from the reference list.** §2.6 (line 148): *"the 27 distinct primary citations underpinning the five source-cited tier-B priors"* and *"the 31-paper analog-mission corpus (26 DOI-verified entries plus five pre-DOI grey-literature sources)."* The reference list has 43 total entries, of which only ~9 are tier-B analog anchors (`imm-g12`, `perina2023dental`, `bhatia2012`, `pattarini2016`, `palinkassuedfeld2008`, `kang2022`, `basner2013mars500`, `fedyay2023sirius`, `flynnevans2016`). A reader cannot reconcile "27" or "31/26" with what is printed. These counts live in `research/evidence/INDEX.md`, not the manuscript.
> **Fix.** Reword to what the reference list supports (e.g., "the analog-mission corpus enumerated and DOI-tagged in the repository's evidence index") or relocate the precise counts to the Code/Data-availability statement as a pointer to the versioned `INDEX.md`. Do not assert a citation count the reference list cannot back.

**R4-m4. The discriminative-case table (ALPHA/BRAVO/CHARLIE, line 200) is unnumbered and uncaptioned.** Elsevier requires every table numbered with a caption. If it becomes "Table 2," the current Tables 2/3/4 renumber to 3/4/5 (and Table 1 from R4-M2 slots in ahead). Decide ordering and number all tables.

**R4-m5. Abstract's first grammatical subject is still "Analog-astronaut selection panels."** R3 M6 fixed the title and contributions order but the abstract opener still leads with the selection frame. *Optional* (the title fix already de-risks the desk screen): recast the first sentence so the grammatical subject is the IMM/HSRB reproducible-risk-engineering contribution, with selection as the application.

**R4-m6. Sensitivity-bound wording is numerically imprecise.** §3.6 (line 286): *"the tier-B prior rates would need to be over-estimated by ≤ 25% (i.e., the true rate > 0.75 × the fitted rate)."* `true = 0.75 × fitted` is a **33%** over-estimate (fitted = 1.33×true), not 25%. Either change "≤ 25%" to "≤ 33%" (to match the 0.75 multiplier where CHI re-enters CI₉₅), or change the multiplier to 0.80× (to match "25%"). One-token fix; pick the convention and state it cleanly.

**R4-m7. Cosmetic (Elsevier copyedit will likely absorb).** Em-dash density remains elevated (R3 m16, ~9/1000 words); reference-list journal names are not LTWA-abbreviated (R3 m15). Author-year Harvard style is otherwise correct. Low priority.

---

## Part 3 — Standing residuals (honestly disclosed; carried forward, not blockers)

These are *disclosed* in the manuscript, so they are framing rather than defects — but a fresh methodology lens should keep them visible:
- **Metric-split reproduction.** No single condition subset reproduces both CHI and TME within bracket: tier-A-only recovers issHMS CHI (97.3) but not TME (39.3 ∉ [87,126]); the full set recovers TME but issHMS CHI sits 1.5 pp below. Disclosed §4.4. Keep the explicit "no single configuration reproduces both metrics" sentence — it is the honest framing.
- **F6 showcases an out-of-bracket configuration.** The flagship HSRB figure is the issHMS **red** verdict whose CHI (82.8) is below the K15 CI₉₅; the *validated* configuration is unlimited/**yellow** (CHI 95.3 ∈ CI₉₅). Disclosed in the Fig 6 caption and §3.4. *Optional strengthening:* lead the HSRB demonstration with the validated unlimited/yellow result, then present issHMS red as the evidence-recalibrated operational case.
- **A→B vulnerability coupling is inert in every reported result** (R3 M1). Disclosed throughout; the optional coupled worked example was declined. Acceptable at Q2 as an "implemented but not-yet-exercised" capability.

---

## Citation Audit Summary

| Check | Result |
|---|---|
| In-text ↔ reference list | **Clean.** 43/43 bib entries cited; no orphans; the only "dangling" keys are `fig:` (pandoc-crossref) and `yahoo` (email) — false positives. R3's orphan issue fully resolved. |
| Live DOI verification (5 highest-risk) | `perina2023dental` ✓ (6 authors, journal match; note: 2023(2) issue, Crossref pub-date 2024-03 — acceptable); `kang2022` ✓ (exact, 10 authors; "hong2022" mis-cite corrected); `apollonio2026` ✓ (round DOI 3000 is a real ASCEND 2026/AIAA paper); `fedyay2023sirius` ⚠ **wrong co-authors (R4-m1)**; `evetts2026` ⚠ **incomplete — real paper, missing DOI/authors/pages (R4-m2)**. |
| Retraction/correction | None flagged on the spot-checked set. |
| Self-citation | ~2 Phase-0 self-refs (`phase0-*`) — acceptable (<5%). |
| Hallucination signals | **None.** All spot-checked references resolve to real papers; the two issues are metadata-completeness, not fabrication. |
| Unsubstantiable counts | "27 distinct primary citations" / "31-paper corpus / 26 DOI-verified" not reconcilable with the 43-entry list (R4-m3). |

## Internal-Numerical-Consistency Sweep

Exhaustive cross-check of every number appearing in both abstract/contributions and body, plus figure captions:
- **TME / CHI / pEVAC / pLOCL across Table 2 ↔ §3.3 ↔ §3.4 ↔ §4.4 ↔ Table 3 (full-model row):** all numerically consistent (97.8/98.1/98.8; 79.1/82.8/95.3; 12.52/9.65/1.78; 0.25/0.23/0.18). The F7 ISS-6-mo CHI (82.78) matches Table 2 issHMS (82.8). **The only inconsistency is the classification/count, not the values — see R4-M1.**
- **K15 reference + CI₉₅:** issHMS ref 94.93 / CI [84.30, 98.50]; unlimited ref 94.98 / CI [84.40, 98.50] — correctly distinguished throughout; "1.5 pp below" = 84.30 − 82.8 ✓.
- **HSRB verdict:** MSP 0.860 → Pf 14.0% → L5; 1−χ 0.172 → C4; L5×C4 = 23 (grid lookup correct); same-kit-K15 L4×C2 = 13 (correct). ✓
- **Tier decomposition:** 39.3 + 59.2 = 98.5 ≈ full 97.8 ✓; tier-A issHMS CHI 97.3 ∈ CI₉₅ ✓. Table 4 sweep values match §3.6 prose ✓.
- **Provenance counts:** 34 tier-A + 66 tier-B = 100 consistent across abstract, §2.3, §3.3, §4.4, Table 3, highlights, cover letter ✓ (matches STATUS.md pass-4 ground truth).
- **One imprecision:** the "≤ 25%" vs "0.75×" mismatch (R4-m6).

## Reporting-guideline compliance
Methods paper — no CONSORT/STROBE/PRISMA. NASA-STD-7009A factors 1–3 addressed in the manuscript; 4–8 explicitly deferred (appropriate). **NB:** the supplementary V&V dossier (S-Methods-1) currently reports a *different* factor status (4/8, Validation unsatisfied) — see R4-M3.

## LLM-ism Assessment
**Score: 2/10 (low).** R3's dev-doc leakage and bug-fix-diary register are gone from `manuscript.md`. Prose is specific and varied. Residual: elevated em-dash density and frequent triadic lists (non-dominant; R4-m7).

---

## Prioritized action list (for ASR submission)

**Must fix before upload (blockers):**
1. **R4-M1** — reconcile the K15-divergence count across Table 2, §2.6, §3.3, §4.4, and the released gate test (choose framing (a) or (b); make all five agree).
2. **R4-M2** — add the missing Table 1 (criterion taxonomy with anchor citations), or reword §2.1 if Figure 2 is meant to serve that role.
3. **R4-M3** — fix the supplementary package: drop the S3/S4 figure references (data is in Tables 3/4), resolve Figure S1 (cite or delete) and the `S-Notebooks/` path, and **exclude or rewrite** the stale S-Methods-1/2 so nothing in the package contradicts §2.6.

**Auto-applied this round (non-controversial reference-metadata corrections):**
4. **R4-m1** — corrected `fedyay2023sirius` author list to Crossref.
5. **R4-m2** — completed `evetts2026` (DOI 10.3390/astronautics1010007, full authors, 1(1):7).

**Should fix (strengthens; reviewers will appreciate):**
6. **R4-m3** — reword the "27 citations" / "31-paper corpus" claims to what the reference list supports.
7. **R4-m4** — number + caption the ALPHA/BRAVO/CHARLIE table; renumber all tables.
8. **R4-m6** — fix the "≤ 25%" vs "0.75×" arithmetic.

**Nice-to-have:**
9. **R4-m5** — recast the abstract's opening subject to the risk-engineering contribution.
10. **R4-m7** — em-dash thinning; LTWA journal abbreviations (or leave to Elsevier copyedit).
11. Standing residuals — optionally lead the F6 HSRB demo with the validated unlimited/yellow result.

---

## Cross-round convergence (confidence signal)
- **R4-M1** was independently surfaced by the numeric-consistency sweep (Table 2 ✓ vs §4.4 "8") *and* the artifact cross-check (gate test "11/1") — highest-confidence finding, and a *new* mismatch introduced by edits after R3's pass-count reconciliation.
- **R4-M2** (missing Table 1) and **R4-M3** (supplementary drift, missing S3/S4) were both pre-flagged in the repo's own STATUS.md deferred-checklist — this review confirms they remain open and characterizes the fix.
- The citation spot-check (5 of 43, the highest-risk) found **0 hallucinations** and **2 metadata defects** — consistent with a well-maintained but not-fully-audited bibliography.

*No cross-reviewer disagreements requiring author adjudication. The three blockers are structural/packaging; the science verified in R3 stands.*

---

## Resolution log — Stage 3 fix application (author-approved, 2026-05-29)

All findings were applied this session (author chose "keep within + align gate" for R4-M1 and approved all four fix groups). Frozen elements (statistical values, DOIs other than the two corrected, correct citations) were not altered.

**R4-M1 — TME reconciliation (framing (a): keep "within", align artifact).**
- `tests/imm/validation_k15.test.ts`: the 3 TME brackets reclassified `documented-divergent` → `within-k15-ci95` with the actual K15 CI₉₅ ([73,122] none; [87,126] issHMS/unlimited); inventory test updated 1-within/11-divergent → **4-within/8-divergent**; comment block refreshed.
- `manuscript.md` §2.6: the "TMEs … classified as documented-divergent" parenthetical reworded so the 4 within-CI₉₅ metrics (3 TME + unlimited CHI) are stated cleanly, with the systematic-mean-offset note retained.
- **Gate re-run: 26/26 pass (577 s).** Table 3, §3.3, §4.4 ("8 of 12 divergent"), §2.6, and the released test now agree on 4 within / 8 divergent.

**R4-M2 — Table 1 added.** `manuscript.md` §2.1: inserted **Table 1** (12-criterion taxonomy: family, construct, canonical Elite-tier instrument, scale + polarity, first active tier), built from `src/data/placeholder-criteria.ts`; family counts (6/2/1/2/1) and tier-activation (8/10/12) verified against the prose. §2.1 sentence reworded; per-instrument citations pointed to the Phase-0 taxonomy (no unverified instrument DOIs injected).

**R4-M3 — Supplementary package.**
- §3.6: broken `Figures S3/S4` references removed → point to Tables 4/5 (inline).
- §2.5: non-existent `paper/supplementary/S-Notebooks/` path → `notebooks/` + `python/` + `scripts/` (verified to exist).
- `S-Methods-1` / `S-Methods-2`: "not for submission" banners added in-place; `submission/SUBMISSION_CHECKLIST.md` updated with the exclusion + the S1/S2 supplementary-figure renumber TODO.

**Minors.** R4-m1 (`fedyay2023sirius` authors) + R4-m2 (`evetts2026` DOI/authors/pages) corrected in `references.bib`; R4-m3 ("27/31/26" counts → repo-index pointer in §2.6); R4-m4 (discriminative table → **Table 2**; downstream tables renumbered 3/4/5); R4-m6 ("≤25%" → "roughly a third"); R4-m5 (abstract opener recast to lead with the IMM/HSRB contribution).

**Post-edit verification.** Abstract 241 words (≤250 with citation-render margin); tables 1–5 sequential with captions, "K15 Table 1" (NASA's) untouched (8×); only Figure S2 referenced (no S3/S4); citation graph clean (43/43 cited, 0 orphans, 0 real danglings); `tsc --noEmit` exit 0; K15 gate 26/26.

**Deferred (build-time, per STATUS.md "software-ready first; docx last"):** rebuild `submission/manuscript.docx` + `cover-letter.docx` from the updated source; mint Zenodo DOI + commit SHA; renumber supplementary figure S2→S1 and drop the orphan `S1_vv_dossier`; LTWA journal-name abbreviation (R4-m7, or leave to Elsevier copyedit).
