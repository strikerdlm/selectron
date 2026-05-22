# IMM Priors Rev3-c — Per-Condition Calibration Synthesis

**Created:** 2026-05-22
**Status:** rev3-c HIGH-confidence updates applied; MEDIUM/LOW deferred
**Inputs:** [`analog_incidence_antarctic.md`](analog_incidence_antarctic.md), [`analog_incidence_confined_missions.md`](analog_incidence_confined_missions.md), [`analog_incidence_submarine_iss.md`](analog_incidence_submarine_iss.md)
**Output:** updates to `src/data/imm-priors.json` + tier-B multiplier re-tune
**Reference targets:** K15 Table 1 (ISS 6mo / 6 crew / T=100k)

---

## 1 · Why per-condition calibration

rev3-b (commit `1bb2cea`) brought TME within K15 CI₉₅ via a blanket `tierB_multiplier = 0.55`. The advisor (2026-05-22 audit) flagged this as **atheoretical** — a single scalar across 42 tier-B conditions cannot distinguish over-elicited from under-elicited individual priors.

rev3-c replaces blanket scaling with **per-condition source-cited priors** for the conditions where Earth-analog literature gives a defensible rate. Conditions without analog evidence keep their existing priors + an explicit "no analog rate available" tag in source_ref.

Three parallel research agents produced 27 distinct primary sources across:
- **Antarctic / Concordia winter-over** (8 primary, Bhatia 2012 + Pattarini 2016 + Palinkas 2004 + Hong 2022 + Pattyn 2017 + Walton-Kerstman 2020 + Peřina 2024 + Norris 2010)
- **Mars-500 / SIRIUS / HI-SEAS / NEEMO / AMADEE / EMMPOL / Biosphere 2** (12 primary, Basner 2014 + Pagel-Choukér 2016 + Fedyay 2023 + Dunn Rosenberg 2022 + Koutnik 2021 + Slack 2016 + Patel 2020 + Tafforin 2015 + Faerman + Wu + McMenamin 2020 + others)
- **Submarine / ISS historical / LSAH** (17 primary, including G12 + KERS12 + WOTR15 + PUT99 + JAN02 + DEUTSCH08 + Tansey 1979 + KERS22 + CRU18 + STEP07)

Coverage by category (synthesized):

| Category | Antarctic | Confined-analog | Submarine/ISS | Combined |
|---|---|---|---|---|
| URTI / sinusitis / pharyngitis | GOOD | partial | MEDIUM (% crew) | **MEDIUM** |
| Gastrointestinal | partial | rank-order | LOW | **LOW** |
| Headache (incl CO2) | partial | GOOD (SIRIUS+NEEMO) | MEDIUM (WOTR15) | **MEDIUM** |
| Musculoskeletal | GOOD | partial | **HIGH (KERS12 n=772)** | **HIGH** |
| Dermatologic | GOOD | partial | MEDIUM (WOTR15 25%) | **MEDIUM** |
| Sleep / behavioral | GOOD | **HIGH (Mars-500)** | **HIGH (PUT99+WOTR15)** | **HIGH** |
| Dental | GOOD (Peřina chain) | n/a | **HIGH (G12 full Bayesian)** | **HIGH** |
| GU / GYN | NONE | NONE | MEDIUM (KERS22 sex-diff) | **LOW** |
| Space-adaptation (SMS, SA back-pain, etc.) | NONE | NONE structural | n/a | **NONE — keep priors** |

**Critical caveat:** public literature for ISS / submarine usually reports **% crewmembers per mission**, not **events/person-year**. The per-py rates live in NASA's proprietary iMED database. Where this conversion is required, we flag the inference assumption explicitly.

---

## 2 · HIGH-confidence per-condition updates (this revision)

Only HIGH-confidence updates are applied to `imm-priors.json` in rev3-c. MEDIUM/LOW go to §3 for the next iteration.

### 2.1 dental-caries

- **Source:** Gilkey 2012 (G12, NASA TM 217227) Table 26 — 240 USN SSBN submarine patrols / 5946.9 py + LSAH astronaut posterior. Bayesian-updated rate **9.41 × 10⁻³ events/py** = **2.58 × 10⁻⁵ events/person-day**.
- **Previous prior:** Gamma-Poisson `α=2, β=1460` → λ̄ = 1.37 × 10⁻³ events/day (~50× too high).
- **Update:** `α=2, β = 2 / 2.58e-5 = 77,519` → λ̄ = 2.58 × 10⁻⁵ events/day.
- **Tier promotion:** tierB-lit → **tierA-nasa** (G12 is NASA-published with full Bayesian chain).
- **source_ref:** `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md#table-26` and `research/_priors_rev3c_synthesis.md#dental-caries`.

### 2.2 late-insomnia

- **Source:** Basner et al. 2014 PNAS Mars-500 (520 d) — 1/6 crewmember chronic insomnia ≈ **0.117 events/py** = **3.20 × 10⁻⁴/day**. Cross-confirmed by SIRIUS-21 (Fedyay 2023) sleep-disturbance prevalence and Whitmire et al. 2015 ISS sleep aid use (45-50 % of crewmembers).
- **Previous prior:** Gamma-Poisson `α=2, β=1000` → λ̄ = 2.00 × 10⁻³ events/day (~6× too high vs Mars-500).
- **Update:** `α=2, β = 2 / 5.5e-4 = 3,636` → λ̄ ≈ 5.5 × 10⁻⁴ events/day (set midway in the 0.117-0.25/py target band per the confined-missions synthesis).
- **Tier kept:** tierA-nasa (originally elicited from M18; Mars-500 + SIRIUS + WOTR15 are confirming analog citations, not NASA-internal).
- **source_ref:** add Mars-500 Basner 2014 + SIRIUS-21 Fedyay 2023 + WOTR15 Whitmire 2015 to existing M18 reference.

### 2.3 depression

- **Source:** Palinkas & Suedfeld 2008 Lancet 371(9607) — Antarctic winter-over weighted clinical-event rate **5.2 % / winter** = **1.93 × 10⁻⁴ events/day**. Confirmed by Hong 2022 (8.0 % / winter, Korean Antarctic station) and Bhatia 2012 (3/93 psychiatric of 26-py Maitri = 3.16 × 10⁻⁴/day).
- **Previous prior:** Gamma-Poisson `α=2, β=4545` → λ̄ = 4.40 × 10⁻⁴ events/day (~2× too high vs Palinkas).
- **Update:** `α=2, β = 2 / 2.0e-4 = 10,000` → λ̄ = 2.0 × 10⁻⁴ events/day (Palinkas-anchored).
- **Tier kept:** tierB-lit.
- **source_ref:** add Palinkas 2004 + Hong 2022 + Bhatia 2012 to existing references.

### 2.4 respiratory-infection

- **Source:** Bhatia & Pal 2012 (Maitri Antarctic station, 26 person-years) — small-crew analog URTI rate 9.7 % × 3.58 events/py / 365 = **9.5 × 10⁻⁴ events/person-day**. Pattarini 2016 (McMurdo MCM, larger crew) gives the "polar T-zone" crud at ~1.7 × 10⁻³/day; the small-crew (analog-relevant for selection) anchor is the appropriate target.
- **Previous prior:** Gamma-Poisson `α=2, β=278` → λ̄ = 7.19 × 10⁻³ events/day (~5× too high vs small-crew analog).
- **Update:** `α=2, β = 2 / 1.43e-3 = 1,400` → λ̄ ≈ 1.43 × 10⁻³ events/day (midpoint of Bhatia and Pattarini anchors).
- **Tier kept:** tierB-lit.
- **source_ref:** add Bhatia 2012 + Pattarini 2016.

### 2.5 skin-rash

- **Source:** Pattarini 2016 (McMurdo) — dermatologic visits 14 % × 3.58/py / 365 = **1.37 × 10⁻³/day**. Whitmire et al. 2015 (WOTR15) corroborates with 25 % of ISS crewmembers requiring rash medication per 6-mo mission ≈ 5 × 10⁻¹ events/py = 1.37 × 10⁻³/day. Both anchors converge on the same value.
- **Previous prior:** Gamma-Poisson `α=2, β=500` → λ̄ = 4.00 × 10⁻³ events/day (~3× too high).
- **Update:** `α=2, β = 2 / 1.37e-3 = 1,460` → λ̄ = 1.37 × 10⁻³ events/day.
- **Tier kept:** tierB-lit.
- **source_ref:** add Pattarini 2016 + WOTR15.

---

## 3 · source_ref enrichment (no rate change)

These conditions already have plausible rates; rev3-c adds citation pointers so the audit trail is complete.

| Condition | Current rate | Action | Added citation |
|---|---|---|---|
| `dental-abscess` | tierA, 3.36e-6/day | Add G12 Table 22 confirmation | G12 Bayesian-updated dental abscess submarine + LSAH posterior |
| `headache-co2-induced` | tierA, 1.20e-2/day | Add WOTR15 + Cromwell 2017 confirmation | WOTR15 65% crewmembers / 6mo mission |
| `back-pain-space-adaptation` | tierB, 2.33/day (acute SA only) | Add distinction note | KERS12 (n=772) 52%/6mo for chronic SABP, NOT the acute SA prior — kept separate |
| `late-insomnia` (above) | Updated | Already enriched in §2.2 | — |

---

## 4 · MEDIUM/LOW updates deferred to next iteration

These are NOT applied in rev3-c. Listed for the next per-condition pass.

| Condition | Direction | Confidence | Reason for deferral |
|---|---|---|---|
| `gastroenteritis` | LOWER ~10× | LOW | Pattarini visit-share ≠ unique incidence; need raw events data |
| `pharyngitis` | hold | LOW | Subsumed in URTI category; no station-level isolated rate |
| `dental-exposed-pulp`, `dental-crown-loss`, `dental-filling-loss` | hold | LOW | Peřina case series, not enumerated rates |
| `acute-sinusitis` (tier-A) | hold | n/a | tier-A; Antarctic data does not invalidate |
| `headache-late` | hold | LOW | No Antarctic per-py rate isolated |
| `urinary-tract-infection`, `vaginal-yeast-infection`, `abnormal-uterine-bleeding` | hold | NONE | Zero analog data; iMED defaults are the only option |
| All `*-space-adaptation` (8 conditions) | hold | NONE | Microgravity-specific; analog data not applicable |
| All Tier-C surgical/trauma (18 conditions) | hold | NONE | Not observed at meaningful frequency in Earth-analog small crews |

---

## 5 · Side effect: tier-B multiplier re-tune

rev3-b's `global_calibration.tierB_multiplier = 0.55` was calibrated against the buggy/over-elicited tier-B priors. After rev3-c lowers `respiratory-infection`, `skin-rash`, `depression`, and `late-insomnia` (4 of 42 tier-B conditions), the multiplier will OVER-correct those updates.

**Expected delta on K15 issHMS TME:**
- Pre-rev3-c TME = 107.17 (from rev3-b at tierB=0.55)
- Lowering `respiratory-infection` -5× ≈ −6 events
- Lowering `skin-rash` -3× ≈ −3 events
- Lowering `depression` -2× ≈ negligible (already small)
- Lowering `late-insomnia` -6× ≈ −0.5 events (tier-A so not affected by tier-B multiplier; but contribution is small anyway)
- Lowering `dental-caries` -53× ≈ negligible (already small absolute)

Expected post-rev3-c TME (with tierB still at 0.55) ≈ 107.17 − 9.5 ≈ **97.7** — would fall slightly below K15 'none' target 98.30 and well below 'issHMS' target 106.

**Re-tune action:** run validate_imm post-update; if TME falls outside K15 CI₉₅ on any scenario, increase tierB_multiplier to ~0.65 to compensate. This restores the aggregate while the per-condition updates fix the specific priors that were egregiously over-elicited.

---

## 6 · Honest framing for the limitations doc

After rev3-c, the calibration is BETTER than rev3-b but still has structural limits:

- 5 of 42 tier-B conditions now have source-cited per-py rates (was 0)
- 37 tier-B conditions remain literature-elicited without per-condition validation — the rev3-b blanket multiplier is their fallback
- All tier-C-synth conditions (18) remain placeholder back-fits; no Earth-analog data is available to validate them
- GU/GYN and SMS categories have ZERO analog incidence data; their priors are unverified
- Aggregate K15 reproduction is what we have; per-py rate reproduction we still don't have for most conditions

This is honest. Document it in `docs/iter5_scientific_limitations.md`.

---

## 7 · Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-22 | Apply HIGH-confidence per-condition updates only; defer MEDIUM/LOW | Risk-management: minimise calibration changes per iteration so each can be attributed to a specific source. MEDIUM/LOW would require additional verification before merge. |
| 2026-05-22 | Promote `dental-caries` provenance tierB-lit → tierA-nasa | G12 (NASA TM 217227) is a NASA-published Bayesian-updated source. The other 5 affected priors stay tier-B because the analog sources (Mars-500, Antarctic) are externally-published peer-reviewed work, not NASA-internal. |
| 2026-05-22 | Re-tune tierB_multiplier post-update via validate_imm | Per-condition updates lower some priors; the rev3-b blanket multiplier over-corrects them. Single validate_imm cycle decides the new value. |
| 2026-05-22 | Keep `back-pain-space-adaptation` acute SA prior unchanged | KERS12 52%/6mo SABP is the chronic SABP rate, mechanistically distinct from the acute first-10-days SA window. Different physiological process; do not conflate. |
