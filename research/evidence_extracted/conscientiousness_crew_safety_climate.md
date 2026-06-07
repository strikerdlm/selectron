# Evidence: Crew-Level Trait → Safety-Climate Coupling + Selection/Training Gradient

**Date:** 2026-06-07 (rewritten — supersedes the 2026-06-06 version)
**Branch:** `iter1-phase0`
**Status of this rewrite:** corrects the citation-integrity failures found in the 2026-06-07 peer
review (`docs/2026-06-07_peer-review_selectron-science-and-proposals.md`) and re-grounds every value
to a **Crossref/PubMed-resolved** source. The third-quarter ("Phase B") material has been **removed**
(refuted phenomenon — see §4); the fabricated Van Fossen 2021 file has been **deleted**.

> **DOI-resolution gate.** Every DOI below was resolved against Crossref and/or PubMed on 2026-06-07.
> The resolution log is `research/evidence_extracted/_doi_verification_log.md`. No value in this file
> is used in code until its source resolves and the title/authors match.

**Engine changes this file backs** (`src/imm/simulate.ts`):
- `computeCrewSafetyClimateMultiplier()` — Phase A conscientiousness crew coefficient (`CSC_BETA`)
- `computeCrewTeamworkClimateMultiplier()` — Phase 3 agreeableness/teamwork crew coefficient (`ATC_BETA`)
- `selectionPsychMultiplier()` + `applySituationalStrength()` — Phase 2 selection/training gradient
- (REMOVED) `thirdQuarterMode` / `THIRD_QUARTER_C_AMP` — see §4

All effects are gated on `isTerrestrialAnalog(kind)` and/or `stageAScores` presence, so `leo-iss`/K15
is byte-identical (invariance canary in `tests/imm/simulate.test.ts`).

---

## Phase A — Crew minimum conscientiousness → safety climate (`CSC_BETA`)

### Primary evidence (all DOIs resolved 2026-06-07)

**Xu, X., Le, N., He, Y., & Yao, X. (2020).** When and why team conscientiousness influences safety
climate (team-level study). *Journal of Business and Psychology, 35*(4), 503–517.
<https://doi.org/10.1007/s10869-019-09637-8>
- **CORRECTED** from the 2026-06-06 version, which carried fabricated metadata. Verified record:
  authors **Xu, Le, He & Yao** (not "Xu, Liao, Chen, Pu"); DOI **…09637-8** (the previously-cited
  …09638-9 does **not** resolve to this paper); pages **503–517**; sample **70 teams in one hospital**
  (not "N=451 / 94 teams").
- Verified finding: team **mean, minimum, AND variance** of conscientiousness all significantly
  predict safety climate; only the team **maximum** does not. The earlier claim that "minimum — not
  the mean — is load-bearing" was an **overstatement** and has been removed.
- The specific path coefficients (0.28, 0.35) quoted in the prior version **could not be verified** in
  the source and are **not** used to justify `CSC_BETA` (see Coefficient disclosure below).

**Halfhill, T., Sundstrom, E., Lahner, J., Calderone, W., & Nielsen, T. M. (2005).** Group personality
composition and group effectiveness. *Small Group Research, 36*(1), 83–105.
<https://doi.org/10.1177/1046496404268538> — *verified.*
- 47 military teams; group mean AND group minimum conscientiousness predict team effectiveness;
  minimum is especially relevant for safety-sensitive coordinated tasks.

**Van Vianen, A. E. M., & De Dreu, C. K. W. (2001).** Personality in teams: Its relationship to social
cohesion, task cohesion, and team performance. *European Journal of Work and Organizational
Psychology, 10*(2), 97–120. <https://doi.org/10.1080/13594320143000573> — *verified.*
- Supports the weakest-link model: the lowest-C member sets the floor for team task discipline.

**Bell, S. T. (2007).** Deep-level composition variables as predictors of team performance: A
meta-analysis. *Journal of Applied Psychology, 92*(3), 595–615.
<https://doi.org/10.1037/0021-9010.92.3.595> — *DOI/author/title verified; effect-size value plausible
but not re-read this pass.*
- Team **mean** conscientiousness and team **minimum agreeableness** are the strongest personality
  predictors of team performance in field settings — the basis for the team-minimum operationalization.

### Why team-minimum (weakest-link), stated honestly

Using the team **minimum** is **one defensible operationalization**, chosen for the weakest-link
rationale supported by Bell 2007 (min-A) and Halfhill 2005 / Van Vianen 2001 for safety-sensitive
tasks. It is **not** the case that "the literature singles out minimum" — Xu 2020 finds mean, minimum,
and variance all predict safety climate. The choice is an engineering one, disclosed as such.

### Families affected

`SAFETY_CLIMATE_FAMILIES = {behavioral, traumatic, musculoskeletal}` — the safety-compliance pathway
(Clarke & Robertson 2005 accident involvement; PPE/technique → MSK & traumatic injury exposure).

---

## Phase 3 — Crew minimum agreeableness/teamwork → safety climate (`ATC_BETA`)

Closes the peer-review **§3.2** gap: the model coupled conscientiousness but **not** agreeableness,
even though agreeableness is at least as strong a safety/team predictor.

**`behavioral.teamwork` is the interpersonal-compatibility PROXY for agreeableness** (no
`psych.agreeableness` criterion exists). Stated as a proxy, not an identity.

### Primary evidence (all DOIs resolved 2026-06-07)

**Clarke, S., & Robertson, I. T. (2005).** A meta-analytic review of the Big Five personality factors
and accident involvement in occupational and non-occupational settings. *Journal of Occupational and
Organizational Psychology, 78*(3), 355–376. <https://doi.org/10.1348/096317905x26183> — *verified.*
- Conscientiousness corrected validity **.27**; **agreeableness .26** — essentially tied as accident
  predictors. The direct anchor for coupling agreeableness in parallel with conscientiousness.

**Peeters, M. A. G., Van Tuijl, H. F. J. M., Rutte, C. G., & Reymen, I. M. M. J. (2006).** Personality
and team performance: A meta-analysis. *European Journal of Personality, 20*(5), 377–396.
<https://doi.org/10.1002/per.588> — *verified (effect sizes read from abstract).*
- **Agreeableness elevation ρ=0.24 > conscientiousness elevation ρ=0.20**; conscientiousness
  variability ρ=−0.24. Agreeableness is the stronger team-elevation predictor.

**Beus, J. M., Dhanani, L. Y., & McCord, M. A. (2015).** A meta-analysis of personality and workplace
safety: Addressing unanswered questions. *Journal of Applied Psychology, 100*(2), 481–498.
<https://doi.org/10.1037/a0037916> — *verified (claim confirmed verbatim in abstract).*
- "**Agreeableness accounted for the largest proportion of explained variance in safety-related
  behavior**; openness was unrelated." (Integrity nuance: agreeableness ρ≈−.26 only narrowly edges
  conscientiousness ρ≈−.25 — a near-tie, not a dominance.)

**Bell, S. T. (2007)** (above) — team **minimum agreeableness** is among the strongest field
predictors → supports the team-minimum operationalization for the teamwork path too.

### Families affected

Same `SAFETY_CLIMATE_FAMILIES = {behavioral, traumatic, musculoskeletal}` as Phase A — agreeableness
acts through the same safety-compliance / interpersonal-cooperation pathway. Composed multiplicatively
with the conscientiousness coefficient.

---

## Phase 2 — Selection/training gradient (random people vs. trained-and-selected crew)

Models the two populations the app contrasts. Both effects gated to terrestrial-analog kinds.

### A1 — Selection-process baseline floor (psychiatric/behavioral incidence)

**Palinkas, L. A., & Suedfeld, P. (2008).** Psychological effects of polar expeditions. *The Lancet,
371*(9607), 153–163. <https://doi.org/10.1016/S0140-6736(07)61056-3> — *verified.*
- **~5% of screened polar-expedition personnel** meet DSM/ICD criteria for a psychiatric disorder
  during deployment — the **screened-crew floor**. "Prevention of pathogenic psychological outcomes is
  best accomplished by psychological and psychiatric screening procedures to select out unsuitable
  candidates" — i.e., selection reduces **psychiatric morbidity**.

**Kessler, R. C., Chiu, W. T., Demler, O., Merikangas, K. R., & Walters, E. E. (2005).** Prevalence,
severity, and comorbidity of 12-month DSM-IV disorders in the National Comorbidity Survey Replication.
*Archives of General Psychiatry, 62*(6), 617–627. <https://doi.org/10.1001/archpsyc.62.6.617> —
*verified.*
- General-population 12-month prevalence: **any disorder 26.2%**; of cases, 22.3% serious → **≈5.8%
  serious** population-wide — the **unscreened/random** baseline.

**Coefficient:** `SELECTION_PSYCH_RATIO = 4.0` on psychiatric/behavioral λ for `unscreened-random`.
The screened floor (Palinkas ~5%) vs. general-population any-disorder (Kessler 26.2%) implies a ratio
≈5×; **4.0 is chosen as a conservative anchor**. It composes with the per-condition trait coupling to
reproduce the documented ~11× screened-vs-extreme bound (defensibility review §1). The
`kind_multipliers` are calibrated on **screened** winter-over cohorts, so this is a **decomposition**
(environment = `kind_mult`; selection process = this factor), applied **only** to the
`unscreened-random` arm — not a second floor on an already-screened baseline.

### A2 — Situational-strength β-dampening (trained crews in mature programs)

**Lee, S., & Dalal, R. S. (2016).** Climate as situational strength: Safety climate strength as a
cross-level moderator of the relationship between conscientiousness and safety behaviour. *European
Journal of Work and Organizational Psychology, 25*(1), 120–132.
<https://doi.org/10.1080/1359432X.2014.987231> — *verified (964 employees, 17 orgs; claim confirmed).*
- The conscientiousness→safety-behaviour relationship is **attenuated in strong safety climates**.
  Trained crews in mature programs ⇒ strong climate ⇒ weaker trait coupling.

**Wilmot, M. P., & Ones, D. S. (2019).** A century of research on conscientiousness at work.
*Proceedings of the National Academy of Sciences, 116*(46), 23004–23010.
<https://doi.org/10.1073/pnas.1908430116> — *verified.*
- Conscientiousness→performance is attenuated in high-complexity roles (direction confirmed; specific
  ρ values not quoted — they were not verifiable in the abstract).

**Coefficient:** `SITUATIONAL_STRENGTH_DAMP = 0.6` pulls the crew CSC/ATC multipliers toward 1.0 for
the `screened-trained` arm. **Operator-supplied tuning parameter** (directionally grounded;
sensitivity-swept).

### Boundary condition — Palinkas 2000/2003 (Antarctic interpersonal nuance)

**Palinkas, L. A., Gunderson, E. K. E., Holland, A. W., Miller, C., & Johnson, J. C. (2000).**
Predictors of behavior and performance in extreme environments: The Antarctic space analogue program.
*Aviation, Space, and Environmental Medicine, 71*(6), 619–625. (PMID 10870821) — *verified.*
- In a 1960s–70s Antarctic cohort, **low** conscientiousness predicted *better overall* winter-over
  performance on a composite (interpersonal + task) outcome — a limiting case for the
  interpersonal/social domain, **not** an inversion of the modern safety/incident picture.

**Palinkas, L. A. (2003).** The psychology of isolated and confined environments: Understanding human
behavior in Antarctica. *American Psychologist, 58*(5), 353–363.
<https://doi.org/10.1037/0003-066X.58.5.353> — *verified (issue corrected 58(5), not 58(3)).*
- Concurrent measures of personality/coping predict mood and performance better than predeployment
  measures — supports modelling situational strength rather than fixed trait coupling.

---

## §4 — Third-quarter phenomenon: REMOVED (do not reinstate)

The 2026-06-06 "Phase B" third-quarter amplifier (`THIRD_QUARTER_C_AMP = 1.4`) was **removed**
2026-06-07. It rested on a **contested-to-refuted** nadir phenomenon:
- **Bell, Brown, & Mitchell (2019)**, *What We Know About Team Dynamics for Long-Distance Space
  Missions: A Systematic Review of Analog Research*, *Frontiers in Psychology, 10*, 811.
  <https://doi.org/10.3389/fpsyg.2019.00811> — *CORRECTED cite* (the prior version had wrong authors
  "Fisher/Mann/Baucom" and the wrong DOI …01523, which resolves to an unrelated police-shooting paper).
  This review found team mood dynamics **did not consistently support** the third-quarter phenomenon —
  i.e., the source cited *for* the mechanism argues *against* it.
- Hawkes et al. 2017 (meta-analysis), Skorupa et al. 2024 (LunAres), and Kanas et al. 2021 likewise do
  not support it.

Time-of-isolation is instead carried by (a) **linear-in-duration incidence** (cumulative P(≥1 event)
→ near-certain by ~45 d — JARE/ANARE) and (b) the **kit-depletion (RAF)** mechanism (Antonsen 2022).
The per-day psychiatric hazard *may* rise with cumulative confinement, but **no primary source provides
a quantified psychiatric-incidence-vs-duration curve** — Antonsen et al. 2022
(<https://doi.org/10.1038/s41526-022-00193-9>) uses **constant-rate incidence with duration-stratified
outputs** and the authors explicitly note "the assumption of constant incidence may underpredict ...
730/1195-day DRMs." This is documented as a limitation, **not** shipped as a mechanism.

---

## Coefficient disclosure (peer review §3.5)

| Constant | Value | Status |
|---|---|---|
| `CSC_BETA` | −0.15 | **Operator-supplied tuning** — Xu 2020 path-coefficient derivation unverifiable; magnitude chosen ordinally (~25–35% λ swing). Sensitivity-swept. |
| `ATC_BETA` | −0.15 | **Operator-supplied tuning** — parallel to CSC; direction anchored to Clarke 2005 / Peeters 2006 / Beus 2015. |
| `SELECTION_PSYCH_RATIO` | 4.0 | Anchored (conservative) to Palinkas 2008 ~5% vs. Kessler 2005 26.2% (ratio ≈5×). |
| `SITUATIONAL_STRENGTH_DAMP` | 0.6 | **Operator-supplied tuning** — direction anchored to Lee & Dalal 2016 / Wilmot & Ones 2019. |

### Family-mapping assumptions (peer review §3.6)

The individual-coupling family maps are **interpretive assumptions, not direct evidence**: Molloy 2014
*medication-adherence* → toxicologic family; Clarke 2005 *accident-involvement* → traumatic family.
Defensible first pass; stated as assumptions.

---

## Test coverage

```
✓ computeCrewSafetyClimateMultiplier (Phase A) — CSC tests (incl. K15 invariance)
✓ computeCrewTeamworkClimateMultiplier (Phase 3) — ATC tests (K15 safe, min-driven, analog effect)
✓ selectionPsychMultiplier + applySituationalStrength (Phase 2) — deterministic unit tests
✓ selectionContext integration — K15 invariance (leo-iss byte-identical), A1 isolation, headline
  random-vs-trained discrimination
```

**Related:** [[bell_2007_team_personality_meta_analysis]] · [[peeters_2006_team_conscientiousness_variance]] ·
[[english_2004_team_referent_conscientiousness]] · [[wilmot_2019_complexity_attenuates_conscientiousness]] ·
[[palinkas_2000_antarctic_low_c_performance]] · [[palinkas_2003_ice_concurrent_measures]] ·
[[conscientiousness_vulnerability_coupling]] · `_doi_verification_log.md`
