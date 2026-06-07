# Scientific Peer Review — Selectron Engine, Manuscript, and Active Proposals

**Date:** 2026-06-07
**Reviewer:** Claude (Opus 4.8), acting as internal scientific referee
**Scope:** the science behind the application and its active proposals — the IMM Calculator
(`src/imm/`), the ASR manuscript (`paper/manuscript.md`), the analog-IMM model proposal
(`research/analog_imm_model_proposal.md`), the `kind_multipliers` analog context modulation, and the
new crew-level **conscientiousness** science (Phase A crew safety-climate coefficient + Phase B
third-quarter mode) on branch `iter1-phase0-analog-imm`.
**Method:** read the primary artifacts, then **independently verified the load-bearing empirical
claims against primary literature** via Crossref (DOI resolution), PubMed, Google Scholar, Consensus,
and Scite. Every identifier quoted in this report was resolved in this review pass; no DOI in this
report is reconstructed from memory.

---

## 0. Headline (read this first)

**The ASR submission package is NOT compromised by the issues found below.** The serious
citation-integrity problems are **confined to unpublished branch research files**
(`research/evidence_extracted/`) and have **not** entered the manuscript:

- A grep of the **entire `paper/` directory** (manuscript, cover letter, references.bib, supplementary)
  finds **none** of the crew-science citations (Xu, Sandal, Bell-team, Van Fossen, "third quarter",
  "safety climate"). The word "Conscientiousness" appears only as a **criterion name** in Table 1.
- The 40-entry manuscript bibliography was already Crossref/Scite-verified in
  `paper/crossref-walk-2026-05-23.md` (40/40 resolve). Because that walk is a *self-produced* doc from
  the same project that generated the fabricated branch citations, I did **not** take it on faith: I
  **independently re-resolved 4 manuscript references this pass**, weighted toward the entry the walk
  claims it *fixed*. All 4 resolve and match `references.bib` exactly — `kang2022`
  (`10.2147/NSS.S370659`, the former `hong2022` mis-cite, fix confirmed legitimate), `bhatia2012`
  (`10.1016/j.wem.2012.04.003`), `palinkassuedfeld2008` (`10.1016/S0140-6736(07)61056-3`), and
  `pattarini2016` (`10.1016/j.wem.2015.11.010`). The manuscript corpus is genuinely trustworthy; the
  fabrication is specific to the **rushed in-session evidence-file generation**, not to the careful
  manuscript-bibliography pipeline.
- The manuscript explicitly states the Stage-A→Stage-B vulnerability coupling (the `FAMILY_BETA`
  path) is **inactive in every reported result** (the K15 reference crew carries no `stageAScores`),
  and the K15 invariance canary proves `leo-iss` outputs are byte-identical.

So the problems are **forward-looking** (they affect what may enter the *next* manuscript iteration —
the analog model and the crew-science extension), not the package on Diego's desk. They must be fixed
before any of the crew-science work is cited in a submission.

**Two distinct problem classes, different remedies:**

1. **Citation integrity** — several in-session-authored evidence files contain **fabricated DOIs,
   wrong author lists, wrong sample sizes, and at least one likely-nonexistent paper.** Remedy:
   re-ground to the real sources (identifiers supplied below) or delete.
2. **Scientific substance** — Phase B rests on a phenomenon that the best current evidence (including
   its own cited source) **refutes**; the model underweights agreeableness; coupling coefficients are
   arbitrary. Remedy: design reconsideration, not just re-citation.

---

## 1. Verdict by component

| Component | Verdict | Summary |
|---|---|---|
| IMM Calculator core (`src/imm/`) + manuscript | **Sound, publication-credible** | Honest, well-bounded, non-circular reproduction; limitations disclosed rather than hidden. |
| Individual vulnerability coupling (commit `d065b4e`) | **Well-grounded** | Anchored to **real, accurately-cited** meta-analyses (Clarke 2005, Molloy 2014). |
| `kind_multipliers` (Antarctic vs controlled) | **Acceptable with caveats** | Hand-curated (not PyMC-fit, as CLAUDE.md concedes); anchors are manuscript-corpus papers; some reference conditions not in the catalog (already flagged in the proposal). |
| analog-IMM model proposal | **Methodologically reasonable** | The research→posteriors→risk-matrices→validation-gate pipeline is correct in principle; pLOCL≈0 caveat honestly identified. **But** its step 1 ("research priors, record every value with source DOI/URL") is the exact step that failed for the crew-science work. |
| **Phase A — crew safety-climate coefficient** | **Defensible mechanism, broken citations** | Real underlying papers; the implementation choice (min-C) is reasonable but over-claimed against its source. |
| **Phase B — third-quarter mode** | **Not scientifically supportable as built** | Built on a contested-to-refuted phenomenon; the paper cited *for* it actually argues *against* it. |
| Crew-science evidence files | **Mixed; several contain fabrications** | 3 of 9 accurate; the rest range from mis-cited to likely-fabricated. |

---

## 2. Citation-integrity findings (verification table)

Each row was checked this pass. "Evidence file" = the claim as written in
`research/evidence_extracted/`. "Reality" = what the primary databases return.

### 2.1 Engine-wired individual coupling — VERIFIED ACCURATE ✓

These back the coupling that is actually in the engine and closest to manuscript-relevance. They hold up.

| Claim | Status | Reality (verified this pass) |
|---|---|---|
| Clarke & Robertson 2005, conscientiousness→accidents, r_c=0.27 | ✓ **Accurate** | Real: *"A meta-analytic review of the Big Five personality factors and accident involvement…"*, J. Occup. Organ. Psychol. 78(3):355–376, DOI `10.1348/096317905x26183`. Abstract confirms **C corrected validity .27** (and agreeableness .26). |
| Molloy et al. 2014, conscientiousness→medication adherence | ✓ **Real** | Real: *"Conscientiousness and Medication Adherence: A Meta-analysis"*, Ann. Behav. Med. 47(1):92–101, DOI `10.1007/s12160-013-9524-4` (online 2013). |
| Bell 2007, team mean-C ρ≈0.23 | ✓ **Existence + DOI verified** (ρ value *not* checked) | Real: *"Deep-level composition variables as predictors of team performance: A meta-analysis"*, Suzanne T. Bell, J. Appl. Psychol. 92(3):595–615, DOI `10.1037/0021-9010.92.3.595` (818 cites). The paper, author, and DOI are confirmed; the **specific ρ≈0.23 value was not retrieved from its tables this pass** — treat the effect size as plausible-but-unverified (unlike Peeters below, whose values were read from the abstract). |
| Peeters et al. 2006, C elevation ρ=0.20, C variability ρ=−0.24 | ✓ **Accurate (effect sizes verified)** | Real: *"Personality and team performance: a meta-analysis"*, Eur. J. Personality 20(5):377–396, DOI `10.1002/per.588`. Abstract confirms **C elevation ρ=0.20, C variability ρ=−0.24** verbatim (and agreeableness elevation ρ=0.24 > C — see §3.2). |

### 2.2 Crew-science (Phase A/B) — FABRICATED IDENTIFIERS on real papers

| Claim as written | Status | Reality (verified this pass) |
|---|---|---|
| **Xu et al. 2020** — "Xu, J., Liao, J., Chen, R., & Pu, J.", DOI `10.1007/s10869-019-09638-9`, J. Bus. Psychol. 35(4):541–558, N=451 / 94 teams; "team **minimum** C — not the mean — is load-bearing" | ⚠ **Real paper, fabricated metadata + overstated finding** | Real paper exists but: real authors are **Xiaohong Xu, Nhan Le, Yimin He, Xiang Yao**; real DOI **`10.1007/s10869-019-09637-8`** (the cited DOI does **not resolve**); real pages **503–517**; real sample **70 teams in one hospital** (not 94). Crucially, the paper finds **mean, minimum, AND variance all significantly predict safety climate** (only *maximum* does not) — it does **not** single out minimum over mean. |
| **Sandal et al. 2018**, "Psychological Hibernation in Antarctica", nadir at 50–67% of mission | ⚠ **Real paper, unsupported specific claim** | Real: Front. Psychol. 9:2235, DOI `10.3389/fpsyg.2018.02235` ✓. But it is a **2-crew** study of a *coping pattern* ("hibernation" = withdrawal/numbing), **not** a quantified "50–67% third-quarter nadir." "Psychological hibernation" ≠ "third-quarter phenomenon"; the two were conflated. |
| **Bell et al. 2019** — "An overview of current and future systemic challenges for LDSEM analogs", DOI `10.3389/fpsyg.2019.01523` | ⚠ **Real paper, wrong title + wrong DOI + mischaracterized** | Real title: *"What We Know About Team Dynamics for Long-Distance Space Missions: A Systematic Review of Analog Research"*, Front. Psychol. (69 cites). The cited DOI resolves to an **unrelated police-shooting paper** (Giessing et al.). The "72 sources" and "by 40% of mission / 90 days all teams reported ≥1 conflict" claims **are correct**. **But** the paper explicitly found **"team mood dynamics did NOT consistently support the third-quarter phenomenon"** — see §3.1. |
| **Van Fossen et al. 2021** — *Acta Astronautica* 179:246–253, DOI `10.1016/j.actaastro.2020.10.037`, NEO-PI-R N=71, C β=+0.31 attitudes / −0.27 depression | ❌ **Unverifiable — treat as fabricated** | The DOI resolves to **"Nonlinear Earth orbit control using low-thrust propulsion"** (Pontani & Pustorino, Acta Astronautica 179:296–310) — an orbital-mechanics paper. The Van Fossen paper returns **zero hits** in PubMed, Google Scholar, and a Crossref title search. Unlocatable across four databases; the DOI points elsewhere. **Do not cite.** |
| **English et al. 2004** — "two studies, undergraduate 4-person teams (N₁=108, N₂=96)" | ⚠ **Real paper, fabricated study design** | Real: *"Team Performance"*, Small Group Research (79 cites). Actual sample: **30 cockpit crews of 3 pilots each**, not undergraduate 4-person teams. The core claim (team **referent** C > individual aggregate) is correct. |
| **Wilmot 2019** — complexity attenuates C→performance, ρ 0.32→0.16 | ⚠ **Real paper/finding, conflated + unverified specifics** | Real: *"A century of research on conscientiousness at work"*, Wilmot & Ones, PNAS (156 cites). Complexity-attenuation **direction confirmed** by the abstract. The evidence file conflated it with the companion Wilmot "extraversion" PNAS paper and gave overlapping DOIs; the specific ρ values (0.32→0.16) are **not** in the abstract and were not verified. |

### 2.3 Not individually verified this pass (flag, do not assume)

Generated by the same process; **status unknown** until checked: **Palinkas 2000**, **Palinkas 2003**
(Palinkas is a real, prolific ICE researcher — plausible but DOIs unchecked), **Halfhill 2005**,
**Van Vianen 2001**, and the **specific Xu path coefficients (0.28, 0.35)** that the CSC_BETA
calibration rests on (these are not in the Xu abstract and could not be confirmed).

---

## 3. Scientific-substance findings (independent of citations)

These would remain problems even if every citation were perfectly formatted.

### 3.1 Phase B (third-quarter mode) rests on a refuted phenomenon — **highest-substance concern**

The third-quarter phenomenon (Bechtel & Berning 1991) is **contested-to-refuted** by the strongest
current evidence:

- **Bell et al. 2019** (the systematic review cited *for* Phase B): *"team mood dynamics did **not**
  consistently support the third-quarter phenomenon."* The paper Selectron cites as Phase B's anchor
  is itself evidence **against** the mechanism.
- **Hawkes et al. 2017** meta-analysis (21 studies, 1,826 participants, *Polar Record*): *"equivocal
  support … our results did **not** support the proposed parameters of the third-quarter phenomenon."*
- **Skorupa et al. 2024** (LunAres, 88 analog astronauts, 16 missions, *J. Environ. Psychol.*): *"does
  **not** support the third-quarter phenomenon."*
- **Kanas et al. 2021** ("Whither the Third Quarter Phenomenon?", *Aerosp. Med. Hum. Perform.*): *"not
  a typical occurrence in space or space simulation environments."*

Support is limited and weak (Steel 2001 "moderate"; Décamps 2005; Van Wijk 2018 "small in real terms").
Building a fixed **1.4× β amplifier** on this is not defensible at manuscript grade.
**Recommendation: do not let Phase B enter the manuscript without either (a) dropping it, or (b)
reframing it as an explicitly speculative operator-toggle scenario with the refuting evidence cited.**
The implementation is gated on `stageAScores` so it does not affect K15 — this is an evidence problem,
not a code problem.

### 3.2 The model underweights agreeableness

Three independent meta-analyses verified this pass show **agreeableness is at least as strong a
safety/team predictor as conscientiousness**:

- Clarke & Robertson 2005: accident involvement — C .27, **A .26** (essentially tied).
- Beus et al. 2014 (J. Appl. Psychol., 213 cites): of the safety-relevant traits, **agreeableness
  accounted for the *largest* proportion of explained variance** in safety behavior.
- Peeters 2006: team-performance elevation — **A ρ=0.24 > C ρ=0.20**.

Selectron couples conscientiousness heavily (Phase A/B, individual coupling) but does not couple
agreeableness with comparable weight. This is a genuine construct-coverage gap, not a citation issue.
If the safety/team pathway is the justification, **agreeableness deserves parallel treatment.**

### 3.3 Phase A's minimum-C choice is over-claimed against its source

The implementation uses team **minimum** C (weakest-link). That is a *reasonable* engineering choice
and is supported for safety-sensitive tasks by Bell 2007 / Halfhill. **But** the evidence file claims
Xu 2020 shows minimum is uniquely load-bearing "not the mean" — and Xu 2020 actually finds **mean,
minimum, and variance all significant**. The honest statement is: "minimum is *one* defensible
operationalization, chosen for the weakest-link rationale," not "the literature singles out minimum."

### 3.4 Situational-strength moderation is ignored

Multiple verified papers (Lee et al. 2016; Doerr 2020; Wilmot & Ones 2019) show the
conscientiousness→safety-behavior relationship is **attenuated in strong safety climates and in
high-complexity roles** — exactly the conditions of a well-run, highly-trained analog/Antarctic
program. The model applies a fixed multiplier regardless of program maturity. At minimum this belongs
in the limitations; ideally the coefficient would be climate/complexity-conditioned.

### 3.5 Coupling coefficients are arbitrary (already half-conceded)

`CSC_BETA = −0.15`, `THIRD_QUARTER_C_AMP = 1.4`, and `FAMILY_BETA` (−0.4 … −0.15) are plausible
*ordinal* choices but are **not** elicited from primary regressions. The CSC_BETA "0.28 × 0.35 ≈ 0.10"
derivation depends on two Xu path coefficients this review **could not verify**. The manuscript already
concedes this honestly for `FAMILY_BETA` ("operator-supplied scenario-analysis tuning parameters …
not elicited from a primary-source per-condition regression"); the **same disclosure must extend to
CSC_BETA and THIRD_QUARTER_C_AMP** if they are ever reported.

### 3.6 Loose family mappings

The individual coupling maps Molloy's *medication adherence* finding onto the **toxicologic** IMM
family and Clarke's *accident involvement* onto the **traumatic** family. Both anchors are real, but
the mappings are interpretive leaps (adherence is chronic-disease management, not acute toxicology).
Defensible as a first pass; should be stated as an assumption, not presented as direct evidence.

---

## 4. What is sound (credit where due)

- **The IMM Calculator and manuscript practice exemplary scientific honesty.** The issHMS CHI
  divergence (82.8 vs K15 CI₉₅ [84.30, 98.50]) is disclosed, not buried; the Mars pLOCL gap is called
  a *structural* gap "that should not be papered over with re-elicitation"; the coupling is repeatedly
  flagged as inactive in all results; "inter-model agreement, not validation against in-flight data"
  is stated four times; NASA-STD-7009A factors 4–8 are explicitly deferred. This is how limitations
  should be handled.
- **Non-circularity is demonstrated**, not asserted — the tier-A-only subset reproduces issHMS CHI
  within K15 CI₉₅ (97.3) without the PyMC-fitted conditions.
- **The individual vulnerability coupling is the best-grounded part of the new work** — its anchors
  (Clarke 2005, Molloy 2014) are real and accurately cited.
- **Two of the new crew-science evidence files are accurate** (Bell 2007, Peeters 2006 — correct DOIs,
  authors, and in Peeters' case exact effect sizes).
- **The analog-IMM proposal's validation architecture is correct in principle** (literature→PyMC
  posteriors→full risk-matrix stack→literature-anchored pEVAC gate, McMurdo 0.036 / USAP 0.01 evac/py).

---

## 5. Recommendations (prioritized)

**P0 — integrity, before any crew-science citation enters a submission**
1. **Delete the Van Fossen 2021 citation** everywhere it appears (`conscientiousness_crew_safety_climate.md`,
   `van_fossen_2021_*.md`, STATUS audit entries). It is unverifiable across four databases and its DOI
   points to an unrelated paper. If an Antarctic-conscientiousness-depression finding is wanted, source
   a real one (e.g., the verified Palinkas line of work) — do not reinstate this one.
2. **Correct the Xu 2020 record** to the verified identifiers: Xu, Le, He & Yao; DOI
   `10.1007/s10869-019-09637-8`; J. Bus. Psychol. 35(4):503–517; 70 teams, one hospital; and soften
   the claim to "mean, minimum, and variance all predict safety climate."
3. **Correct the Bell 2019 record** to the real title (*"What We Know About Team Dynamics for
   Long-Distance Space Missions: A Systematic Review of Analog Research"*) and a resolving DOI; remove
   the wrong `…01523` DOI (it is a different paper).
4. **Fix English 2004** (30 cockpit crews of 3 pilots, not undergraduate 4-person teams) and the
   Wilmot 2019 DOI/conflation.
5. **DOI-verify the unchecked remainder** (Palinkas 2000/2003, Halfhill 2005, Van Vianen 2001, and the
   Xu path coefficients) before any of them is cited. Treat unverified = unusable.

**P1 — substance, before Phase A/B is reported as a finding**
6. **Phase B:** drop it from the manuscript path, or demote it to an explicitly speculative scenario
   toggle with the refuting evidence (Bell 2019, Hawkes 2017, Skorupa 2024) cited. Do not present a
   1.4× amplifier as evidence-based.
7. **Phase A:** add agreeableness coupling (§3.2) or explicitly justify the C-only scope; reframe the
   min-C rationale (§3.3); add the situational-strength limitation (§3.4); extend the FAMILY_BETA
   "tuning-parameter, not calibrated" disclosure to CSC_BETA and THIRD_QUARTER_C_AMP (§3.5).

**P2 — process (the meta-lesson)**
8. The analog proposal's step 1 mandates "record every value with its source (DOI/URL)." That step
   **ran but was not ground-checked** — fabricated DOIs passed straight into the evidence corpus.
   Add a hard gate to the proposal: **every DOI in `research/evidence_extracted/` must resolve in
   Crossref and its title/authors must match before the value is used in calibration or text.** A
   one-line `get_crossref_paper_by_doi` check per citation would have caught all of §2.2.

**No action required**
9. Nothing in the ASR submission package needs changing on account of this review (§0). The manuscript
   corpus is clean and the coupling is inactive in all reported results.

---

## 6. Verification provenance

Resolved this pass: Crossref DOI lookups (Xu real/fabricated, Van Fossen, Bell-2019 fabricated DOI,
Clarke, Molloy, Bell-2007, Peeters), PubMed (Sandal ✓, Van Fossen ∅, Bell-team ∅), Google Scholar
(Van Fossen ∅), Consensus (Xu real-title surfaced; third-quarter contested literature; Beus 2014),
and a whole-`paper/`-directory grep for contamination (clean). **Independent manuscript-corpus
spot-check this pass (not taken from the prior walk on faith):** `kang2022` `10.2147/NSS.S370659`,
`bhatia2012` `10.1016/j.wem.2012.04.003`, `palinkassuedfeld2008` `10.1016/S0140-6736(07)61056-3`,
`pattarini2016` `10.1016/j.wem.2015.11.010` — all 4 resolve and match `references.bib` exactly. Prior
manuscript-corpus verification: `paper/crossref-walk-2026-05-23.md` (40/40), now corroborated on these
4. Not re-verified: the remaining 36 manuscript references (covered by the prior walk + the 4-entry
corroboration above) and the items listed in §2.3.

*End of review.*
