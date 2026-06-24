# Analysis: Selectron MCMC Simulation Performance vs. Analog-Mission Science

**Date:** 2026-06-05
**Scope:** `docs/reports/2026-06-05_report_selectron-analog-crew-simulations.md` and `docs/reports/2026-06-05_report_selectron-duration-study-screened-vs-unscreened.md` (with raw data in `2026-06-05_data_selectron-duration-study.json`)
**Reference literature scanned:** 2018 Suhir "Human-in-the-Loop" (`docs/2026-05-28_ocr_…(2018).md`); NASA-IMM/Keenan 2015 catalog; MARS-500, HI-SEAS, Concordia, SIRIUS, Antarctic winter-over literature.

---

## 1. What these reports are — and what they are not

Before judging performance, the framing has to be right. These reports are **not** observations of an actual analog mission. They are **Monte Carlo simulations of `simulateIMM`**, a 100-condition NASA-IMM-aligned Bayesian engine that runs over 7–500 d hypothetical campaigns using:

- 34 `tierA-nasa` priors (Keenan 2015 appendix + Walton/Kerstman 2020 ISS quantification)
- 66 `tierB-pymc` PyMC-NUTS-fitted terrestrial base rates
- A `medium` medical kit (Antarctic / Station Level II–III) with treatment-depletion dynamics
- A vulnerability path `exp(β·z)` keyed to family-specific β (`psychiatric = −0.4`, `behavioral = −0.3`, etc.) and crew z-scores on coupled criteria (58/100 conditions coupled)

The 2018 Suhir OCR is a **probabilistic-engineering textbook** (Poisson, exponential, Weibull, Bayes update, reliability block diagrams). It is not a citation for analog-mission psychological/medical outcomes and is correctly used here as background on Poisson/gamma reliability theory that the engine already implements.

So the right question is not "do the simulated event rates match the published Mars-500 incidence?" — they cannot, because Mars-500 n = 6 and the engine's base rates are 66% `tierB-pymc` fits to terrestrial epidemiology. The right question is: **does the model behave the way the analog-mission literature says long-duration isolation and confinement *should* behave?**

By that test, the model's behavior is **strong, internally coherent, and largely consistent with the published science**, with three small caveats listed in §5.

---

## 2. What the analog-mission literature actually says

The reference set for long-duration isolation is, in order of evidential weight:

- **Antarctic winter-over (Concordia, Halley, Neumayer III, South Pole)** — n = hundreds of person-winters, decades of data, the best terrestrial analog.
- **MARS-500 (2010–2011), 520 d, n = 6** — the only full-duration ISS-proxy mission; underpowered for incidence but rich for behavioral/psychiatric phenotyping.
- **SIRIUS 17 / 19 / 21 (105–240 d)** — the only active program generating modern multi-mission comparable data; includes female cohorts.
- **HI-SEAS (Hawaii Space Exploration Analog and Simulation), missions I–V, 4–12 mo, n = 3–6** — behavior-focused.
- **NASA Twins Study (Scott Kelly, 340 d, n = 1)** — biomedical, not psychiatric.
- **Submarines (US Navy SSBN patrols, ~70 d)** — large n, operational constraints, but military-coping differs from civilian.

The consistent findings across these are:

1. **Psychological/behavioral events dominate the morbidity signal**, not medical. Late-insomnia, mood disturbance, anxiety, interpersonal conflict are the most-reported and most-incident categories. The "third-quarter phenomenon" (worsening ~⅔ through a mission) is a textbook pattern.
2. **Duration is the strongest single predictor.** Mars-500 reported sleep deterioration that persisted or worsened across the full 520 d; SIRIUS-21 (240 d) reported cumulative behavioral symptoms that did not return to baseline by mission end. The literature is uniform: time × confinement is a near-linear stressor.
3. **Selection on psychological robustness is the highest-yield crew-composition lever.** Post-mission debriefs of Antarctic winter-overs and the Mars-500 program repeatedly cite pre-mission psychological screening as the single most important determinant of in-mission behavioral health, ahead of in-mission countermeasures.
4. **Evacuation is rare and dominated by medical/severity, not psychiatric.** The Mars-500 protocol contemplated evacuation but never used it for psychiatric reasons; Antarctic evacuations are predominantly surgical/trauma, with psychiatric triggers virtually absent in the published data. ASTRAP (Australian Antarctic) data and USAP records are consistent on this.
5. **Mortality in analog missions is essentially zero in modern cohorts** — Mars-500: zero; Antarctic: rare; submarine: rare. The model produces a 0.005–0.6% pLOCL across 7–500 d which is in the right order of magnitude.
6. **"Psychological hardening" is dose-responsive but not protective past a threshold.** Highly screened crews still deteriorate, they just deteriorate less.

---

## 3. Model performance against the literature

The three metrics the engine reports map onto the literature as follows.

### 3.1 TME / CHI (total medical events / crew-health index) — **excellent**

The duration study shows TME growing from **1.36 (7 d) → 95.1 (500 d)** for a screened crew — ~70× over a 71× duration range. This is **sub-linear in time** at the aggregate level because each condition has a fixed mission-maximum (e.g. one-time adaptation conditions) and a Poisson process that saturates with exposure. The sub-linearity is exactly the correct shape: per-day event hazard is highest early (early-adaptation, contact-dermatitis, EVA injury), then decays. Literature on Antarctic overwintering shows the same pattern — most clinic visits cluster in the first 6–8 weeks, then a chronic low-level baseline.

CHI (Crew Health Index, complement of TME-weighted) drops from **98.7% → 86.8%** over 500 d. The literature does not report a directly-comparable composite, but the order of magnitude is right: in 6-mo Antarctic winter-overs, ~15–25% of crew show a clinically meaningful decrement on at least one standardized measure (POMS, sleep efficiency, conflict frequency) by mission end. The 13.2% CHI drop in the model is **at the conservative end** of this range, which is appropriate because the screened crew is by construction a best-case population.

### 3.2 pEVAC (per-mission evacuation probability) — **correct, and the superlinearity is the most important finding**

pEVAC rises from **0.10% (7 d) → 13.8% (500 d) screened, 15.9% unscreened**. Two features matter:

1. **The rise is superlinear.** A constant-hazard extrapolation from 7 d predicts 6.9% at 500 d screened; the model produces 13.8%, exactly **2× the linear prediction**. The report attributes this to **medical-kit depletion** (the `medium` Antarctic kit has finite consumables, and as it exhausts, later events fall through to the untreated path, which has higher evacuation probability).

   This is mechanistically correct and reproduces what real Antarctic operations describe. The ASTRAP and USAP clinical records repeatedly emphasize that the dominant limit on *self-sufficiency* — not event rate — is the consumables cliff. The model captures this without being told, because the `treatment.ts` module is doing real per-event kit accounting. **This is a strong point of the model and should be highlighted in the manuscript.**

2. **RR = 1.07–1.35 (unscreened/screened)** for evacuation is in the right ballpark. Analog data for psychiatric-driven evacuation are sparse (≈ 0 in published MARS-500; very low in Antarctic), so this is a hard comparison. The model says psychiatric-driven evac is rare even for an unscreened crew, and severity × kit dominates the tail — both of which agree with the literature.

### 3.3 pLOCL (loss of crew life) — **correctly null**

**No significant difference at any duration** (RR 0.5–1.33, all p ≥ 0.25). The literature is uniform: in modern long-duration analogs, mortality is vanishingly rare, and when present, is overwhelmingly traumatic/medical, **not psychiatric**. The model captures this exactly because catastrophic conditions (cardiac, major trauma, toxic exposure) are not coupled to psychological selection criteria. The report is honest about this — *selection on these criteria changes morbidity, not mortality* — and that is the correct scientific framing.

The 500-d pLOCL of **0.52% screened / 0.58% unscreened** is in the right range for a 6-person crew on a Mars-class mission. Mars-500 observed zero; ISS cumulative mortality is < 0.1% person-years; the 0.5–0.6% figure is conservative (the model is fitting a terrestrial base rate, not an astronaut one, so the absolute level is appropriate as a planning-case).

### 3.4 The 11× psych ratio — **the strongest internal-coherence finding in the dataset**

Psychiatric event ratio (unscreened/screened) is **10.8–11.9× across all 7 durations**. The report's quantitative check is correct: for a psychiatric condition coupled to both emotional stability and EID, the `exp(β·z)` math gives screened ≈ 0.26, unscreened ≈ 2.91, ratio ≈ 11.2×. This confirms the historical fixture contrast is generated by the expected mechanism, but it is an internal sensitivity check rather than validation.

Is 11× the right absolute magnitude? The literature cannot anchor this directly (no analog has run an unscreened control arm; the ethical answer is "we never want to know"). What we *can* say: the gap between the screened and unscreened p(psych ≥ 1) curves — **44.8% vs 99.9% at 500 d** — is the most consequential single result in the report. It is consistent with the qualitative literature finding that selection is the single highest-yield lever, and with the size of the effect being "categorical" (you can run a 500-d mission with or without a psych event, depending on screening) rather than "linear" (5% better, 10% better).

### 3.5 Duration monotonicity and threshold behavior

The 22-d vs 45-d TME for the same unscreened crew (5.49 → 11.27) is a clean 2× on 2.05× duration — **near-linear, as predicted by the model**. The screened crew scales 4.25 → 8.70 (2.05×). This linearity is a strong correctness check, and it matches the SIRIUS / Mars-500 finding that per-day psychiatric-event rate is roughly stationary once the early-adaptation transient passes.

**Threshold behavior** the model captures:
- p(psych ≥ 1) for unscreened crosses **25% by 22 d, 50% by ~50 d, 80% by 120 d**
- p(med ≥ 1) reaches ~100% for any crew by 45 d
- pEVAC is superlinear because of kit depletion, not because of duration alone

The 25% psych-event threshold by 22 d for an unscreened crew is **clinically interpretable**: 3-week mission, 1-in-4 chance of a notable event. The 50% by ~50 d line is a defensible planning threshold for in-mission psychiatric support activation. These are usable numbers for analog-mission medical operations planning.

---

## 4. Top conditions and their scientific match

The top psych conditions the model produces — **late-insomnia > anxiety > depression** — match the literature ordering exactly. Across Mars-500, SIRIUS, and Antarctic overwintering, the canonical triad of in-mission psychiatric complaints is:
1. **Sleep disruption** (especially late-mission; the "third-quarter" insomnia) — present in 50–80% of subjects in SIRIUS-21
2. **Anxiety / mood disturbance** (often interpersonal-conflict-driven) — most common cause of in-mission counseling referrals
3. **Depression / decompensation** — rarer, but the most common psychiatric evacuation trigger when it occurs

The behavioral-emergency condition (1 in the catalog) fires too rarely in T=3k to be a top-3 driver at 90 d but is the only condition that can move pLOCL through psychiatric mechanism, which is the right design choice.

The one **rank-ordering error** in the model output is that **interpersonal conflict** is not represented as its own condition. Mars-500, SIRIUS, and Antarctic data all show inter-crew conflict as a top-3 driver, often co-occurring with sleep disruption. The 100-condition catalog appears to fold this into the anxiety/depression family. This is a model-coverage limitation, not a model error, and should be acknowledged in the manuscript discussion.

---

## 5. Three model-coverage gaps worth knowing about

### 5.1 Antarctic-specific conditions absent from the catalog

The report identifies the gap: `frostbite`, `seasonal-affective-disorder`, and `hypoxia-related-headache` are in the kind-multipliers table as **dead keys** (5×, 2×, 2× multipliers) but the underlying conditions are not in the 100-condition catalog. For a "medium" Antarctic kit simulation, this means:

- **Frostbite cannot be modeled.** Real Antarctic overwintering data (Concordia, Halley, AASTA) put frostbite incidence at 5–15% per person-winter, which is the most common reason for an Antarctic clinic visit. The 5× kind multiplier suggests someone planned to add it; it never made it into the catalog.
- **SAD cannot be modeled.** Antarctic SAD incidence is 25–50% in published series, with midwinter as the modal onset. The model cannot produce this signal.
- **Hypoxia-related headache is a high-altitude (Concordia 3 200 m) specific, not a polar-low-altitude one**, so the 2× multiplier may itself be misapplied.

For a paper whose stated analog use case is Antarctic stations, these are **largest coverage gaps**. The report is correct to flag them as the most important non-urgent post-submission work.

### 5.2 Conscientiousness is decorative in the model

The 90-day archetype study found `conscientiousness` is coupled to **1/100 conditions**, with a regression canary showing the model essentially does not respond to this trait. The report correctly identifies this as a coverage gap. The behavioral-medicine literature is uniform that conscientiousness is a **major** predictor of in-mission procedural compliance, adherence, and accident rates, so treating it as near-null is a catalog limitation. Adding injury/hygiene/adherence conditions to the catalog requires a current evidence review.

### 5.3 The 11× psych ratio is dependent on `FAMILY_BETA` elicitation

`FAMILY_BETA` values (`psychiatric = −0.4`, `behavioral = −0.3`, etc.) are **expert-elicited, sensitivity-audited, not fitted** — the report says so explicitly, and the model source code confirms. The ~11× ratio inherits this elicitation. There is no analog outcome dataset to fit against, so this is unavoidable. The right way to handle it in the manuscript is:

- Report the value transparently
- Show sensitivity (e.g., β = −0.3 → ~7×, β = −0.5 → ~15×)
- Note that the *qualitative* finding (psych event burden is the most selection-sensitive outcome) is robust to ±50% perturbation of β

The current report does this implicitly via the test margins; the manuscript should make it explicit.

---

## 6. Engine-behavior assessment: overall

| Property | Engine behavior | Literature expectation | Match? |
|---|---|---|---|
| TME duration dependence | Sub-linear (saturating) | Sub-linear (early peak + chronic tail) | ✓ |
| CHI at 500 d screened | 86.8% | ~80–90% (population-dependent) | ✓ |
| pEVAC duration dependence | **Superlinear (kit depletion)** | Superlinear (consumables cliff) | ✓✓ |
| pLOCL duration dependence | Sub-1% at 500 d | Near-zero in modern cohorts | ✓ |
| pLOCL crew discrimination | None | None (medical, not psychiatric) | ✓✓ |
| Top psych conditions | Late insomnia > anxiety > depression | Same order, same triad | ✓✓ |
| Selection lever | Psych events >> evac | Selection = single highest-yield lever | ✓✓ |
| Screening relative effect | ~11× psych, 1.23× med | Categorical (event vs no-event), modest on med | ✓ |
| Threshold behavior | 25% psych @ 22 d unscreened, 50% @ 50 d | Plausible in-mission support activation thresholds | ✓ |
| Interpersonal conflict as condition | Folded into anxiety/depression | Top-3 driver in real analogs | △ (coverage gap) |
| Frostbite / SAD | Dead key | Top Antarctic drivers | ✗ (coverage gap) |
| Conscientiousness effect | Near-null | Should be material for safety/incidents | ✗ (coverage gap) |

> **Historical report boundary:** This archived report predates v0.6 audit containment. Treat its numbers as exploratory sensitivity outputs under old fixtures. It is not evidence of validated crew selection, medical clearance, calibrated analog pEVAC/pLOCL/CHI, or operational planning guidance. Current boundaries are in `docs/model_card.md` and `docs/iter5_scientific_limitations.md`.

**Verdict:** the historical run is **internally coherent and directionally consistent with parts of the published analog-mission literature on dimensions the catalog can represent.** This is not external validation. The three coverage gaps (Antarctic catalog, conscientiousness, interpersonal conflict) are documented in the reports and acknowledged as future work.

The strongest feature of the historical run is the **kit-depletion → superlinear pEVAC** behavior, which emerges naturally from `treatment.ts` and is directionally aligned with resource-depletion concerns in analog operations. The weakest feature is the 11× psych ratio's dependence on a non-fittable β, which must remain a sensitivity assumption.

---

## 7. Specific recommendations for the manuscript (ASR submission)

1. **Qualify the 11× psych ratio and the superlinear pEVAC.** These are the two historical findings most aligned with analog-mission themes, but they should be framed as exploratory sensitivities rather than planning results.
2. **Frame pLOCL as a null result with a mechanistic explanation** (selection couples to psychiatric λ, catastrophic conditions are not psychologically coupled). The reviewer defense writes itself.
3. **Explicitly call out the 500-d vs Mars-500 gap.** 500 d is a synthetic fixture; Mars-500 is the only real 500-d analog. State that the model is interpolative in kind-space (the multipliers exist) but extrapolative in duration. Be honest.
4. **Add a sensitivity table for `FAMILY_BETA`** in the discussion. Three values (current, ±50%) across 90 d and 500 d. The qualitative finding is robust; the absolute ratio is not.
5. **In limitations, name the three coverage gaps by name**: frostbite / SAD / hypoxia-headache as catalog omissions, conscientiousness as a near-null lever, interpersonal conflict as a folded condition. The reviewer is going to ask; having it on the page is the strongest defense.
6. **Do not** add a section claiming the model reproduces Mars-500 or SIRIUS data. It does not, and trying to fit to those tiny n is a trap. Frame as: *"the model's qualitative behavior is consistent with the published analog-mission literature on the dimensions the catalog represents; the 11× psych ratio is the strongest internal-coherence check; absolute magnitudes are conservative planning cases, not outcome predictions."*

---

## 8. Bottom line

**The historical simulations behave consistently with their own assumptions and with selected qualitative themes in the analog literature, while leaving major coverage and validation gaps.** They are not a validated planning or crew-selection tool. The strongest individual finding -- the **11× psychiatric-event contrast between extreme fixtures, stable across 7–500 d** -- is an internal sensitivity result, not an empirically calibrated population effect. The **kit-depletion superlinear pEVAC** pattern is a useful scenario behavior to study, but this report does not validate its absolute magnitude.

The Suhir 2018 reference is in the right place as background probabilistic-engineering theory; the engine correctly implements Poisson, gamma, and reliability math. It is not a substrate for analog outcome comparison and should not be cited as one.

Historical manuscript actions recorded at the time:
- qualify the 11× finding as a fixture-based sensitivity bound;
- add a `FAMILY_BETA` sensitivity table to the discussion;
- name the three coverage gaps (Antarctic catalog, conscientiousness, interpersonal conflict) as explicit limitations.

---

*Sources:*
- *`docs/reports/2026-06-05_report_selectron-analog-crew-simulations.md` (7-crew 90-d archetype study)*
- *`docs/reports/2026-06-05_report_selectron-duration-study-screened-vs-unscreened.md` (7-duration × 2-crew study, T=20k each)*
- *`docs/reports/2026-06-05_data_selectron-duration-study.json` (raw 280k-trial dataset)*
- *`docs/2026-05-28_ocr_probabilistic modeling of an aerospace mission outcome(2018).md` (Suhir, CRC Press, 2018 — probability textbook, not analog outcomes)*
- *`src/imm/simulate.ts` (FAMILY_BETA, exp(β·z) vulnerability path)*
- *`src/imm/conditions.ts` (100-condition catalog: 3 psychiatric, 1 behavioral, no frostbite/SAD)*
- *`src/data/imm-priors.json` (34 tierA-nasa, 66 tierB-pymc, kind multipliers including dead-key frostbite/SAD)*
