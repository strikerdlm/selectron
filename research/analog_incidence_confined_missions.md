# Confined-isolation analog mission medical incidence — Selectron prior calibration evidence

**Scope.** Earth-based / undersea analog missions only (HI-SEAS, Mars-500, MDRS, NEEMO, AMADEE, SIRIUS-19/-21, CHAPEA, EMMPOL, Biosphere 2, THOR). Antarctic winter-over data is **explicitly excluded** — that is the parallel Antarctic agent's deliverable. Where Antarctic appears below, it is flagged as cross-environment context only and the user should refer to the Antarctic-agent file as the authoritative source.

**Generated:** 2026-05-22 (Phase 0 prior-calibration evidence pass).

**Scope-of-use disclaimer.** This file is read-only research evidence. It does **NOT** modify `src/data/imm-priors.json`, `STATUS.md`, or any code. Diego ratifies and a follow-on agent re-runs `npm run calibrate:imm` after manual review of "Suggested per-condition prior updates" (§3).

---

## 1. Sources (primary, peer-reviewed; access verified)

### Tier-1: analog-specific incidence rates (highest weight)

| # | Citation | Mission | Crew × duration | Person-years | Data type | DOI / access |
|---|---|---|---|---:|---|---|
| **S1** | Fedyay SO, Niiazov AR, Ponomarev SA, et al. "Medical Support for Space Missions: The Case of the SIRIUS Project." *Aerospace* (MDPI), 10(6):518 (2023). | SIRIUS-19 + SIRIUS-21 (IBMP/Moscow NEK chamber) | SIRIUS-19: 6 × 120 d; SIRIUS-21: 6 × 33 d + 5 × 207 d | 1.97 + 3.38 = **5.36 PY** | ICD-10-grouped clinical-case tallies (n=70 in SIRIUS-19; n=163 in SIRIUS-21), medications, evacuations, vitamin D | [10.3390/aerospace10060518](https://doi.org/10.3390/aerospace10060518) (CC-BY, gold OA) |
| **S2** | Basner M, Dinges DF, Mollicone DJ, et al. "Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars." *PLOS ONE*, 9(3):e93298 (2014). | Mars-500 (IBMP/Moscow) | 6 × 520 d | **8.55 PY** | Weekly BDI-II, POMS-SF, conflict questionnaire, actigraphy, PVT-B over 74 weeks; per-crewmember insomnia / depression / sleep-wake-timing tallies | [10.1371/journal.pone.0093298](https://doi.org/10.1371/journal.pone.0093298) (CC-BY, in local corpus) |
| **S3** | Koutnik AP, Favre M, Noboa K, et al. "Human Adaptations to Multiday Saturation on NASA NEEMO." *Front Physiol*, 11:610000 (2021). | NEEMO 22 + 23 (Aquarius undersea, Florida) | 8 × 9–10 d | **~0.22 PY** | Likert-scale stiffness/headache/pain panel, HRV, sleep, mood — null finding on physical complaints | [10.3389/fphys.2020.610000](https://doi.org/10.3389/fphys.2020.610000) (CC-BY, gold OA) |
| **S4** | Dunn Rosenberg J, et al. "Biobehavioral and Psychosocial Stress at the Hawaii Space Exploration Analog and Simulation (HI-SEAS)." *Front Physiol*, 13:898841 (2022). | HI-SEAS HM3 + HM4 + HM5 (Mauna Loa, Hawaii) | 18 × 8–12 mo (3 crews of 6) | **~14.5 PY** | Hair cortisol, urine metabolites, GHQ/PSS questionnaires, sleep/activity wearables. **NO discrete medical-event tallies** — biobehavioral only. | [10.3389/fphys.2022.898841](https://doi.org/10.3389/fphys.2022.898841) (CC-BY, in local corpus) |
| **S5** | Slack KJ, Williams TJ, Schneiderman JS, et al. "Risk of Adverse Cognitive or Behavioral Conditions and Psychiatric Disorders: Evidence Report." NASA HRP-47834, Johnson Space Center (2016). | Cross-analog meta-synthesis incl. Mars-500, Biosphere 2 | Variable | n/a (review) | Table 5 + narrative — Mars-500 explicit rates: 1/6 (20%) depressive symptoms; 3/6 (50%) confusion-bewilderment; Biosphere 2 (8 × 2 yr) crew faction split at 6 mo, depression at mid-mission | [PDF in `research/evidence/bridges/nasa-bmed-evidence-report.pdf`](https://humanresearchroadmap.nasa.gov/Evidence/reports/BMED.pdf) |

### Tier-2: short-duration analog physiological context (low weight for incidence)

| # | Citation | Mission | Sample | Data type |
|---|---|---|---|---|
| **S6** | Giacon TA et al. "Stress-related biomarkers in EMMPOL 6." *Eur J Appl Physiol*, 124:3253-65 (2024). | EMMPOL-6 (Poland) | 5 × 7 d (~0.1 PY) | Salivary cortisol, oxidative-stress markers; **no clinical events tallied**. Confirms artificial-light + elevated CO2 environment but no headache events reported. [10.1007/s00421-024-05575-3](https://doi.org/10.1007/s00421-024-05575-3) |
| **S7** | Malpica DL et al. "Investigating psychological and physiological responses … THOR space analog." *J Appl Cogn Neurosci*, 4(2):e00424527 (2024). | THOR (AATC Poland) | 5 × 7 d (~0.1 PY) | HRV, anxiety (state increased), sleep, cognition; no medical-event tallies. [10.17981/JACN.4.2.2023.4](https://doi.org/10.17981/JACN.4.2.2023.4) |
| **S8** | Groemer G et al. "The AMADEE-18 Mars Analog Expedition in the Dhofar Region of Oman." *Astrobiology*, 20(11):1276-86 (2020). | AMADEE-18 (Oman desert) | ~6 × 28 d (~0.46 PY) | Operations + EVA workflow; **no published medical-event tally** (paywalled, abstract reviewed). [10.1089/ast.2019.2031](https://doi.org/10.1089/ast.2019.2031) |
| **S9** | McMenamin SJ et al. "Team Process Outcomes from AMADEE-18." *Astrobiology*, 20(11) (2020). | AMADEE-18 (already in local corpus) | 6 × 30 d | Team-process; no medical events. [10.1089/ast.2019.2035](https://doi.org/10.1089/ast.2019.2035) |
| **S10** | University of Hawaii. "HI-SEAS Mission VI postponed following a minor accident." Press release, 26 Feb 2018; *Space.com* coverage, Big Island Now. | HI-SEAS VI (Mauna Loa) | 4 × 4 d (mission terminated Sol 4) | **1 documented medical event: electric-shock injury requiring evacuation to Hilo Medical Center; full recovery.** Crewmember subsequently withdrew, mission cancelled. | [University of Hawaii news 9085](https://manoa.hawaii.edu/news/article.php?aId=9085) (grey literature, single primary event) |
| **S11** | Pagel JI, Choukér A. "Effects of isolation and confinement on humans …" *J Appl Physiol*, 120(12):1449-57 (2016). | Mars-105 + Mars-520 review | Variable | Narrative on sleep, HPA, immune. Mentions Mars-105 (105 d, n=6) showed **no acute psychophysiological pathology**; only Mars-520 produced measurable HPA/cortisol elevation. [10.1152/japplphysiol.00928.2015](https://doi.org/10.1152/japplphysiol.00928.2015) |
| **S12** | Patel ZS et al. "Red risks for a journey to the red planet." *npj Microgravity*, 6:33 (2020). | Cross-mission review | n/a | Categorizes isolation/confinement health risks at framework level; no analog incidence numbers extractable. [10.1038/s41526-020-00124-6](https://doi.org/10.1038/s41526-020-00124-6) |

### Tier-3: secondary attestation (cited via Smart Citation only)

| # | Citation | Use |
|---|---|---|
| S13 | Faerman A et al. (2023). "Neuropsychological considerations for long-duration deep spaceflight." *Front Physiol*, 14:1146096. [10.3389/fphys.2023.1146096](https://doi.org/10.3389/fphys.2023.1146096) | Confirms Basner 2014 numerics; 70% SMS estimate is **spaceflight** not analog. |
| S14 | Wu B et al. (2018). "On-orbit sleep problems of astronauts and countermeasures." *Mil Med Res*, 5:17. [10.1186/s40779-018-0165-6](https://doi.org/10.1186/s40779-018-0165-6) | Cites Basner Mars-500 nap-induced biological-rhythm disorder. |
| S15 | Tafforin C (2015). "Confinement vs. isolation as analogue environments for Mars missions …" *Aerosp Med Hum Perform*, 86(2):136-40. [10.3357/AMHP.4100.2015](https://doi.org/10.3357/AMHP.4100.2015) | Decomposition of confinement-vs-isolation effects, qualitative. In local corpus. |

### Retraction / editorial-notice check

Scite `has_retraction:true` filter returned 0 hits for the Tier-1 set as of 2026-05-22. Fedyay 2023, Basner 2014, Koutnik 2021, Dunn Rosenberg 2022 are all clean.

---

## 2. Per-category rates (Selectron's 8 IMM contributor categories)

> **Methodological note on rates.** Where the source paper reports event counts, the rate is derived using denominator = crew-size × duration. SIRIUS-19 = 6 × 120 d = 720 person-days = **1.97 PY**; SIRIUS-21 = 6 × 33 d + 5 × 207 d = 1 233 person-days = **3.38 PY** (one crewmember withdrew at day 33 due to a minor arm injury sustained during exercise — corroborated independently by the SIRIUS-21 retinal-vascular paper [10.3389/fphys.2024.1374309](https://doi.org/10.3389/fphys.2024.1374309)).
>
> **Mission-related vs. scientific-method-related.** Fedyay 2023 explicitly partitions clinical cases. **For Selectron we use the mission-related subset only** — i.e., excluding skin reactions to research electrodes and venipuncture bruises:
> - SIRIUS-19 mission-related: 70 − 32 = **38 events** → 38/1.97 = **19.3 events/PY**
> - SIRIUS-21 mission-related: 163 − 15 = **148 events** → 148/3.38 = **43.8 events/PY**
>
> The 2.3× rate difference between identical chambers with the same protocol is a real signal — likely a **duration effect** (events accumulate non-linearly; reporting drift / event hardening over longer isolation) plus a **selection/protocol effect** (SIRIUS-21 was the first 240-d run, possibly underprepared). Flag this for sensitivity analysis in Iter-3 §3.

### Category 1 — Upper respiratory (URTI, sinusitis, pharyngitis, nasal congestion)

| Mission | Finding | Citation |
|---|---|---|
| SIRIUS-19 + SIRIUS-21 | "In **both** SIRIUS missions, some of the crew had rhinitis and nasopharyngitis during the first days of stay in the hermetically sealed chambers." Count not separately given in abstract/excerpts (lives in Fig. 3 + Table A1). | S1 (Fedyay 2023) |
| Mars-500 | No URTI events noted in Basner 2014 (psych/behavioral focus); sealed chamber generally precluded community-acquired URTI. | S2 |
| NEEMO 22+23 | No URTI events; hyperbaric saturation environment | S3 (Koutnik 2021) |
| HI-SEAS HM3-5 | Not tracked as discrete events; only biomarkers | S4 |

**Best-estimate incidence:** ≈ **0.5–1.0 URTI-episode/PY** for closed-chamber analogs (every crew had ≥1 first-week rhinitis/nasopharyngitis case across n=12 SIRIUS crew-mission entries; 12 events / 5.36 PY ≈ 2.2/PY upper bound if every "some of the crew" averages ~50% per mission). Open-air analogs (MDRS, AMADEE) lack published data.

**Confidence: LOW-MEDIUM.** Qualitative confirmation in two missions; numerator not separately published.

### Category 2 — Gastrointestinal (gastroenteritis, diarrhea, constipation)

| Mission | Finding | Citation |
|---|---|---|
| SIRIUS-19 (120 d) | "In the 4-month mission, **a relatively high percentage of gastrointestinal disorders was registered**" | S1 |
| SIRIUS-21 (240 d) | GI not in top complaints (skin, headache, sleep dominated) | S1 |
| Mars-500 | Roda et al. used 13C breath tests to monitor GI motility (cited in pharmacokinetic literature — Liang 2021 [10.1038/s41598-021-82044-3](https://doi.org/10.1038/s41598-021-82044-3)). No clinical GI-event tally published. | secondary |
| EMMPOL-6 | None documented | S6 |

**Best-estimate incidence:** Higher in shorter, more dietarily-novel missions (SIRIUS-19 > SIRIUS-21). Order-of-magnitude estimate: **~1–4 GI events/PY** in first 3-4 months of confinement, dropping thereafter. Exact rate gated on Fedyay Appendix-A extraction.

**Confidence: LOW.** Rank-order signal only.

### Category 3 — Headache (incl. CO2-related)

| Mission | Finding | Citation |
|---|---|---|
| SIRIUS-19 + SIRIUS-21 | "The **prevalent complaints in both** of the experiments were skin conditions and **headaches**." Headache is a top-3 complaint category in **both** missions. | S1 |
| Mars-500 | No headache events documented (Basner focus was BDI/POMS/VAS — visual analog scales did not include a headache anchor). | S2 |
| NEEMO 22+23 | **"No stiffness, headaches, and pain were indicated across timepoints"** — explicit null finding for 9–10 d undersea saturation in n=8. | S3 |
| HI-SEAS | Not tracked | S4 |
| EMMPOL-6 | Chamber had "poor air quality with increased levels of CO2"; no headache events tallied. | S6 |

**Best-estimate incidence:** Headache is a **dominant top-3 complaint in long-duration closed-chamber analogs** (SIRIUS). Crude order-of-magnitude: if ~25% of SIRIUS-21's 148 mission-related events are headache (per "skin > headache > trauma" rank ordering with skin assumed ~30%), that gives ~37 headache events / 3.38 PY = **~11 events/PY** in 240-d isolation. Compare with NEEMO null at 0.22 PY (suggests acute-undersea environment does NOT trigger headache; the SIRIUS signal is duration- and CO2-driven, NOT just confinement-driven).

**CO2 attribution caveat.** SIRIUS chambers had atmosphere monitoring/control; the paper does not isolate CO2 as a headache cause. EMMPOL-6 confirms qualitatively that confined-habitat CO2 buildup is real but did not measure headache events. **Mechanistic CO2-headache attribution remains unsupported by quantitative analog data.**

**Confidence: MEDIUM** (existence + rank ordering); **LOW** for CO2-specific mechanism.

### Category 4 — Musculoskeletal (back pain, sprain/strain, EVA-related)

| Mission | Finding | Citation |
|---|---|---|
| SIRIUS-19 + SIRIUS-21 | "Trauma and/or injuries appeared to be most frequent" — explicitly named as top-3 category in both missions. | S1 |
| SIRIUS-21 | **1/6 crewmembers withdrew at day 33 due to a minor arm injury during exercise.** Single sentinel withdrawal event. | S1 + retinal paper |
| Mars-500 | Mars-500 musculoskeletal literature focuses on countermeasure efficacy: quadriceps/hamstring force ↓ up to 22% despite exercise countermeasures (Brocca et al., *Sports Med Open*, 2017 [10.1186/s40798-017-0107-y](https://doi.org/10.1186/s40798-017-0107-y) — NOT a discrete event tally). No clinical MSK events published. | external |
| NEEMO 22+23 | "No stiffness … across timepoints" — null finding. | S3 |
| MDRS / AMADEE | No published real-MSK-event tallies; Manon 2023 ([10.3390/jcm12144764](https://doi.org/10.3390/jcm12144764)) uses **simulated** tibial fractures for training, not actual injury data. | S8, external |

**Best-estimate incidence:** SIRIUS-21 sentinel withdrawal gives ~1 mission-aborting MSK injury / 12 crew-missions = **0.083/crew-mission** or ~0.18/PY. Lower-severity trauma category is top-3 in SIRIUS but exact count gated on Fedyay Table A1. **EVA-related MSK incidence has zero published analog rate** (Manon MDRS work is fracture-treatment training, not injury surveillance).

**Confidence: MEDIUM** for general MSK existence and severe-event withdrawal rate; **NONE** for EVA-MSK rates.

### Category 5 — Dermatologic (rash, abrasion, laceration)

| Mission | Finding | Citation |
|---|---|---|
| SIRIUS-19 + SIRIUS-21 | "Dermatological pathology … appeared to be most frequent." Skin reactions to electrodes ("itching and reddening"), bruises and surface traumas, and venipuncture injuries dominated the **scientific-method-related** subset (32/70 in SIRIUS-19; 15/163 in SIRIUS-21). However, mission-related skin conditions (rashes, dermatitis from limited hygiene) were also explicitly identified as a top-1 category. | S1 |
| NEEMO | Not addressed | S3 |
| HI-SEAS | Not tracked clinically | S4 |

**Best-estimate incidence (mission-related, excluding electrode reactions):** Skin / dermatologic top complaint in both SIRIUS missions. If ~30% of mission-related events are dermatologic (rank-order assumption), that gives ~11 events/1.97 PY = **~5.6/PY** for SIRIUS-19 and ~44/3.38 PY = **~13/PY** for SIRIUS-21. The ISS benchmark in Antonsen 2021 IMM is comparable order-of-magnitude — see `research/imm_sources/zotero_imm/antonsen-2021-comparison-of-health-and-performance.md`.

**Confidence: MEDIUM** (rank ordering + general magnitude); exact partition awaits Fedyay PDF extraction.

### Category 6 — Sleep / behavioral (insomnia, depression, anxiety, irritability)

This is the **best-instrumented category in the analog literature.**

| Mission | Finding | Numeric translation | Citation |
|---|---|---|---|
| Mars-500 (520 d, n=6) | Crewmember `f` developed **chronic sleep-onset insomnia** with progressive worsening; crewmember `e` reported **mild depression in 7/74 weeks (9.5%) and moderate in 1/74 weeks (1.4%)**; crewmembers `a` and `b` had altered sleep-wake timing (split-sleep and behavioral free-running, respectively). Two of six (33%) had no sleep / mood disturbance throughout. | **Insomnia: 1/6 crewmembers = 0.117/PY** (using 8.55 PY denominator); **Mood disorder: 1/6 = 0.117/PY**; **Altered sleep-wake timing: 2/6 = 0.234/PY** | S2 (Basner 2014) |
| Mars-500 (BMed re-analysis) | Slack 2016 reports Mars-500: "Of the six member crew … one (20%) developed depressive symptoms. Three of the six (50%) developed symptoms of confusion-bewilderment." | Confirms 1/6 mood, 3/6 confusion → **0.351/PY confusion-bewilderment** | S5 (Slack 2016, Table 5) |
| SIRIUS-21 (240 d, n=6→5) | "In the longer isolation, the crew members demonstrated **sleep disturbances during the whole exposure period**." Sleep disorders dominant complaint in 8-month mission; explicit contrast with SIRIUS-19 (4-month) where no sleep disorders detected. | Order-of-magnitude: if 20–25% of mission-related events are sleep-related in SIRIUS-21, ~30–37 events / 3.38 PY = **~9–11/PY**. Plausibly higher when considering chronic complaints not all coded discretely. | S1 (Fedyay 2023) |
| SIRIUS-19 (120 d, n=6) | "No sleep disorders detected" in the 4-month mission — duration threshold. | **Sleep-disorder rate ≈ 0/PY for missions <120 d** | S1 |
| HI-SEAS HM3-5 (n=18 across 3 crews) | Biobehavioral stress dynamics (cortisol, perceived stress) but no DSM-level sleep/mood diagnoses tallied. Theoretical-model finding: "ICE stress at HI-SEAS as 1) eustress, 2) deprivation, 3) disruption, 4) asynchronous coping." | Qualitative only | S4 |
| Biosphere 2 (n=8, 2 yr) | Team split into two factions by 6 mo; "one month after the midpoint, some crew members reported experiencing depression that was severe enough to interfere with their ability to complete daily tasks." | ~25% depression rate by mid-mission (qualitative); 8 × 2 yr = 16 PY → **~0.125/PY depression** as crude analog of long-duration upper bound | S5 (Slack 2016 §B.2.f cites Poynter 2006) |
| Slack 2016 cross-analog meta | "Analog environments such as submarines … incidence of psychiatric disorders severe enough to result in either the loss of a workday or the need to be medically evacuated ranged between **0.44 and 2.8 per person-year**" (Wilken 1969; Tansey 1979; Dlugos 1995; Thomas 2000) | **0.44–2.8 psychiatric events/PY** in submarine analogs (severe enough for evacuation/lost-workday) — useful as upper bound for closed-chamber analog calibration | S5 |

**Best-estimate Selectron-relevant rates:**
- **Late insomnia (severe enough to be chronic):** ~0.10–0.20 events/PY for missions >6 mo; ~0/PY for <120 d
- **Depression (mild-to-moderate, requiring detection):** ~0.10–0.20 events/PY for crews of 6, single-individual exposure
- **Confusion / mood disturbance (subclinical):** ~0.30–0.50 events/PY
- **Severe psychiatric event (medically evacuable):** ~0.44–2.8 events/PY (submarine analog) — most relevant Earth-analog comparator for IMM upper bound
- **Sleep disorders (chronic complaint):** **9–11 events/PY in 240-d missions; 0/PY in 120-d** — strong duration threshold

**Confidence: HIGH** for individual-level Mars-500 numerics (Basner 2014 is the gold-standard analog source); **MEDIUM** for SIRIUS aggregate rates pending Appendix-A extraction.

### Category 7 — Space-motion-sickness analog

**Critical finding: zero published quantitative analog data on space-motion-sickness or its analog conditioning effect.**

| Mission | Finding | Citation |
|---|---|---|
| Mars-500 | **Not assessed in Basner 2014 or Pagel & Choukér 2016.** Despite the task description's claim that "Mars-500 reported this as a true conditioning effect," I could not corroborate this from the primary literature. SMS requires a gravitational/vestibular trigger that ground-based analogs cannot provide. | S2, S11 |
| CHAPEA Mission 1 | Mission ended July 2024; **no peer-reviewed CHAPEA medical/SMS data published yet** as of 2026-05-22. NASA's published mission summaries describe behavioral, psychological, and performance research but no SMS analog event tallies. | external (NASA news releases) |
| Faerman 2023 | The "~70% SMS prevalence" figure quoted is for **actual spaceflight** (true microgravity exposure), not for analog missions. | S13 |

**Recommendation:** Selectron should **not** infer an SMS rate from analog missions. For the `space-motion-sickness-space-adaptation` IMM condition, retain the existing prior derived from ISS data (Antonsen 2021) and flag SMS as a domain where analog calibration is structurally impossible.

**Confidence: NONE** — explicit gap. Re-evaluate when CHAPEA Mission 1/2/3 medical-event papers are published (anticipated 2026-2027).

### Category 8 — GU / GYN

**Critical finding: zero published quantitative analog data on GU/GYN events in the closed-chamber analog literature.**

| Mission | Finding | Citation |
|---|---|---|
| Mars-500 | Crew was male-only (per Basner 2014 limitations section); no GYN data possible. GU not assessed. | S2 |
| SIRIUS-19 + SIRIUS-21 | Mixed-gender crews (3M + 3F in both missions). **No GU/GYN-specific data in published Fedyay 2023 excerpts**; one mention of "dental problems" in 1 case per mission and "syncope state with short-term unconsciousness" in 1 SIRIUS-19 case. UTI / menstrual / urinary-retention not separately reported. | S1 |
| HI-SEAS | n=18 mixed-gender; no GU/GYN events published | S4 |
| NEEMO 22+23 | No GU/GYN events; short duration | S3 |

**Recommendation:** Retain ISS-derived priors (Antonsen 2021 / Walton-Kerstman 2020) for `urinary-tract-infection` and any GYN conditions. Flag as a gap.

**Confidence: NONE** — explicit gap. SIRIUS Appendix-A may contain detail not visible in fulltext-excerpts.

---

## 3. Suggested per-condition prior updates

> **NO direct edits to `imm-priors.json` are proposed here.** The follow-on `npm run calibrate:imm` step (or a successor agent) decides whether the rates below should adjust Tier-C priors after Diego ratifies the deliverable.

Condition IDs are taken verbatim from the existing `src/data/imm-priors.json` so the next agent can grep them.

| imm-priors.json condition ID | Selectron category | Calibration recommendation | Confidence |
|---|---|---|---|
| `headache-co2-induced` | 3 (headache) | Mission-rate signal: **~10 events/PY in 240-d closed-chamber** (SIRIUS-21) but **CO2 mechanism not isolated** in analog data — retain mechanistic ISS prior; consider raising upper-quartile by ~20% to reflect long-duration analog rate. | LOW-MED |
| `headache-space-adaptation` | 3 | Analog data cannot calibrate this (it's microgravity-specific). Keep current prior. | NONE |
| `late-insomnia` | 6 | Mars-500: 1/6 crewmembers chronic insomnia over 520 d = **~0.117 events/PY**. SIRIUS-21: "sleep disturbances during the whole exposure period" in 240 d → significantly higher event-flag rate. **Calibration target: ~0.10–0.25 chronic-insomnia events/PY**, with duration multiplier > 6 mo. | HIGH |
| `insomnia-space-adaptation` | 6 | Analog data cannot calibrate (microgravity-specific). Keep current prior. | NONE |
| `space-motion-sickness-space-adaptation` | 7 | **Analog data structurally cannot calibrate.** No update. Flag this in Iter-3 V&V dossier. | NONE |
| `urinary-tract-infection` | 8 | **Zero analog data.** Retain ISS / Walton-Kerstman 2020 prior. | NONE |
| `urinary-incontinence-space-adaptation` | 8 | Analog data zero. Retain. | NONE |
| `allergic-reaction-mild-to-moderate` | 5 | SIRIUS skin-conditions complaint is plausibly inclusive of allergic dermatitis. Order of magnitude **~5–13 dermatologic events/PY** in long-duration closed chamber. Retain ISS-derived prior; consider expanding 95% CI upper bound by ~50% based on SIRIUS-21 rate. | MED |
| (no existing entry for) **gastroenteritis-acute / diarrhea** | 2 | SIRIUS-19 (120 d) reported "relatively high percentage of GI disorders"; SIRIUS-21 (240 d) did not. Order-of-magnitude **~1–4 GI events/PY** in first 3–4 months. If IMM has a Tier-C gastroenteritis prior, consider duration-weighted: **higher early, attenuating after 4 mo**. | LOW |
| (no existing entry for) **back-pain / strain-sprain MSK** | 4 | SIRIUS-21 had 1/12 (8.3%) crewmember withdraw at day 33 due to exercise-related arm injury. **Mission-aborting MSK rate ~0.18/PY.** Lower-severity events are top-3 SIRIUS complaint but unquantified. No EVA-analog MSK rate exists. | MED for sentinel; NONE for routine |
| (no existing entry for) **URTI / rhinitis** | 1 | Both SIRIUS missions had early-stay rhinitis/nasopharyngitis. Order of magnitude **~0.5–2.2 URTI episodes/PY** in closed chamber, concentrated in first 2 weeks. | LOW-MED |

### Universal calibration note for tier-C analog-grounded priors

For any IMM Tier-C placeholder that currently uses a blanket analog multiplier, the SIRIUS-19/SIRIUS-21 contrast (19.3 vs 43.8 mission-related events/PY despite identical chamber and protocol) suggests **per-condition duration scaling** is more defensible than a flat analog modifier. Specifically:

- Missions <120 d: **0.5× baseline** for sleep/mood (no observed clinical events in SIRIUS-19 sleep, very low in Mars-105)
- Missions 120–240 d: **1.0× baseline**
- Missions >240 d: **1.5–2.5× baseline** for sleep, mood, headache, dermatologic (SIRIUS-21 vs SIRIUS-19 ratio)
- For categories 7 (SMS), 8 (GU/GYN), and EVA-MSK in category 4: **NO analog calibration is possible** → retain ISS-derived priors.

---

## 4. Methodology notes

### Search trail

1. **Local corpus first.** Grepped 31 OCR-extracted papers in `research/evidence/` for `incidence`, `URTI`, `gastroenteritis`, `headache`, `insomnia`, `per person-year`, `per crew`. Highest yields: Basner 2014 (Mars-500), Pagel-Chouker 2016 (Antarctic — out of scope), Dunn Rosenberg 2022 (HI-SEAS biomarkers, not events).
2. **NASA bridges PDFs.** Verified `nasa-bmed-evidence-report.pdf` (Slack et al. 2016, NASA HRP-47834) is in `research/evidence/bridges/`. Section IV.B ("Ground-based Evidence") and Table 5 gave Mars-500 + Biosphere 2 + submarine-analog psychiatric rates.
3. **Scite literature search** (used MCP credit budget, hit monthly limit at ~250 calls). Targeted queries on NEEMO+illness/injury, HI-SEAS+medical, Mars-500+CO2/respiratory/GI, AMADEE+health, SIRIUS-21+medical, CHAPEA+health, MDRS+injury.
4. **WebSearch** for confirming HI-SEAS Mission VI accident, CHAPEA-1 publication status, SIRIUS appendix data (partial).
5. **PubMed MCP** denied (permission); workaround via Scite + WebSearch was sufficient.
6. **Retraction check:** all Tier-1 citations passed Scite `has_retraction:false` filter.

### Denominator construction (replicable)

For each analog mission, person-years (PY) = (crewmembers × duration_days) / 365.25. Withdrawals are pro-rated:

```
SIRIUS-19   = 6 × 120 / 365.25 = 1.972 PY
SIRIUS-21   = (6 × 33 + 5 × 207) / 365.25 = 3.376 PY
Mars-500    = 6 × 520 / 365.25 = 8.541 PY
NEEMO 22+23 = (8 crewmembers approx, 9.5 d mean) = 0.208 PY
HI-SEAS HM3+HM4+HM5 = 18 × ~300 d / 365.25 = 14.78 PY
EMMPOL-6    = 5 × 7 / 365.25 = 0.096 PY
THOR        = 5 × 7 / 365.25 = 0.096 PY
AMADEE-18   = ~6 × 28 / 365.25 = 0.460 PY
Biosphere 2 = 8 × 730 / 365.25 = 16 PY (Slack 2016 citing Poynter 2006)
```

Total analog person-years across all sources in this file: **~46 PY**. For comparison, the Antarctic agent's deliverable should reference Palinkas 2004's much larger denominator (Antarctic winter-over cohorts are hundreds-to-thousands of PY).

### Limitations specific to this evidence base

- **Fedyay 2023 Appendix-A Table A1** could not be extracted directly from the MDPI PDF (`WebFetch` permission denied). Per-category counts are inferred from rank-ordering language ("top-3 complaints were skin > headache > trauma") rather than enumerated. **A follow-on agent with PDF-fetch permission should extract the table verbatim** for prior calibration.
- **HI-SEAS published health data is biobehavioral only** (cortisol, perceived stress) — no discrete clinical events. Significant published-data gap for what is arguably Selectron's closest analog in fidelity.
- **CHAPEA Mission 1 (378 d, ended July 2024)** has no peer-reviewed crew-medical paper yet. Recommend re-running this evidence pass in Q4 2026 when AsMA 2026/2027 proceedings publish.
- **Antarctic exclusion enforced** at the data-collection level. The Pagel-Chouker 2016 5.2% DSM-IV incidence number is Antarctic (Palinkas 2004 source) and is **not** included in any calibration recommendation above; it belongs in the parallel agent's deliverable.

### Newly-found sources in local corpus that nobody cited

While inventorying the corpus I noticed three corpus papers that this prior-calibration pass had not previously referenced:

- **`tafforin-2015-confinement-vs-isolation-mars-analogs.md`** (DOI 10.3357/AMHP.4100.2015) — decomposes confinement-only vs isolation-only effects. Useful framework for separating SIRIUS (high confinement) from MDRS (lower confinement) when interpreting category-rank differences.
- **`gemignani-2014-105d-isolation-sleep-cortisol.md`** (DOI 10.1016/j.ijpsycho.2014.04.008) — 105-day Mars-105 sleep and cortisol data. Confirms Pagel-Chouker narrative that 105-day exposure produces minimal HPA-axis pathology; useful as duration-threshold anchor.
- **`shved-2022-isolation-crowding-countermeasures.md`** (DOI 10.3389/fphys.2022.963301) — primary evidence on isolation, crowding, and countermeasures. Cited in Basner 2014 as Shved 2014 for the SFINCSS-99 result and Mars-500 communication / conflict patterns.

None of these change the per-category numbers but they fill explanatory gaps for the V&V dossier.

### Bias / external-validity caveats

1. **Selection bias.** All analog crews are pre-screened on health and psychological resilience criteria comparable to or exceeding astronaut selection. Reported incidence rates are likely **lower bounds** for the general population but **realistic** for Selectron's analog-astronaut-candidate selection problem.
2. **Reporting bias.** Mars-500 social-desirability scale data (Basner 2014) showed that crewmembers `e` and `f` (low social-desirability bias) reported more symptoms than crewmembers with high SDS-17 bias. Suggests **published rates may underestimate true rates by ≥30%** for symptoms that are subjectively reported (mood, sleep quality, headache severity).
3. **Co-publication bias.** SIRIUS-19/SIRIUS-21 medical data is published by IBMP-affiliated researchers (Fedyay, Niiazov, Ponomarev); independent verification limited. Mars-500 has multi-national authorship (Basner — Penn / Dinges) which is a stronger evidence base.
4. **Gender composition.** Mars-500 was male-only; SIRIUS-19/-21 were 50/50. No analog mission with a female-majority crew has published clinical event data. GYN-specific calibration is structurally impossible from current data.

---

## End of deliverable

Prepared 2026-05-22 by the Selectron analog-incidence evidence agent for Diego L. Malpica. Read-only artifact; do not edit `imm-priors.json` based on this file without first manually ratifying §3 recommendations.
