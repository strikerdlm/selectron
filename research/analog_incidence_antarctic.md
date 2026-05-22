# Antarctic winter-over medical incidence — Selectron prior calibration evidence

**Owner:** Selectron Iter 3 — IMM Calculator prior elicitation
**Created:** 2026-05-22
**Status:** Synthesis draft — feeds controller's per-condition prior update pass.
  Do not apply to `imm-priors.json` directly; controller cross-walks against the other
  per-domain analog evidence packets first.

## Purpose

Replace the blanket "tier-B-lit" and "tier-C-synth" prior-multiplier hacks for the
Selectron IMM Calculator's behavioral / dermatologic / dental / musculoskeletal /
GI / GU / sleep families with per-condition rates anchored on **published per-person-year
Antarctic winter-over incidence**. Antarctic stations are the closest Earth-based
analog to long-duration spaceflight (isolation, confinement, no in/out access during
~9-month austral winter, chronic hypoxia at South Pole, limited fresh food, formal
clinical screening of crew).

---

## Coverage matrix (8 categories × evidence strength)

| Category | Evidence strength | Number of primary sources | Quality of denominator |
|---|---|---|---|
| Upper respiratory | **Good (n≥2)** | Pattarini 2016 (visit-share), Bhatia 2012 (incidence), Norris 2010 cite of Lugg 2000 (rank-order) | Mixed (visit-share + per-py) |
| Gastrointestinal | **Partial (n≥2 but disjoint)** | Pattarini 2016 (visit-share 6% at MCM), Bhatia 2012 (oral ulcers 30.8% per crew, GI subsumed in "medicine" 34%) | Per-py only for oral ulcer; rest visit-share |
| Headache (CO2 / altitude / general) | **Partial (1 source)** | Pattarini 2016 (SP-only) — altitude-mediated, not CO2 | Visit-share only |
| Musculoskeletal (incl. lacerations / sprain-strains) | **Good (n≥2)** | Bhatia 2012 (29%, 1.6/py), Pattarini 2016 (18%/13%/12%), Norris 2010 cite of Lugg 2000 (42%) | Per-py + visit-share + rank-order |
| Dermatologic | **Good (n≥2)** | Pattarini 2016 (14%/9%/19% by station), Norris 2010 cite of Lugg 2000 (rank #3) | Visit-share + rank-order |
| Sleep / behavioral | **Good (n≥3)** | Palinkas 2004 (5.2% wt'd / 12.5% raw), Hong 2022 (8.0%), Pattyn 2017 (70% subjective), Pattarini 2016 (4–11% visit share), Norris 2010 (4–5% DSM-IV) | Per-winter-over + subjective + visit-share |
| Dental | **Good (n≥2)** | Peřina 2024 aggregating 4 stations (10–15% in winter), Pattarini 2016 (1%), Bhatia 2012 (2.2%) | Visit-share + case-mix-share |
| GU / GYN | **None (no per-py rate)** | (Pattarini sub-1%, no GU breakdown; Bhatia 26-man crew has no GYN data; no published Antarctic GU per-py rate located) | n/a |

## Sources

Each source carries a 1-line characterization, study population, observation
window, and whether rates are observed or modelled. **DOIs are the citation key
of record** — every claim in this document must trace to one of these.

| # | Citation | DOI | Station / population | n | Years | Type | Rate quality |
|---|---|---|---|---|---|---|---|
| **1** | Pattarini JM, Scarborough JR, Sombito VL, Parazynski SE. Primary Care in Extreme Environments: Medical Clinic Utilization at Antarctic Stations, 2013–2014. *Wilderness Environ Med* 27(1):69–77, 2016. | [10.1016/j.wem.2015.11.010](https://doi.org/10.1016/j.wem.2015.11.010) | US Antarctic Program — McMurdo (MCM), Amundsen–Scott South Pole (SP), Palmer (PAL) | 1,555 MCM encounters / 658 individuals; 744 SP visits / 212 individuals; 128 PAL encounters / 71 individuals | March 2013 – February 2014 | observational (Sitrep + Clinic Log retro audit) | Clinic-visit utilization rates; per-category as *visit share*, not unique incidence |
| **2** | Bhatia A, Pal R. Morbidity Pattern of the 27th Indian Scientific Expedition to Antarctica. *Wilderness Environ Med* 23(3):231–238, 2012. | [10.1016/j.wem.2012.04.003](https://doi.org/10.1016/j.wem.2012.04.003) | Maitri Station, India (70°45′E, 11°44′S), 26-man winter team | 26 men × 12 months = **26 person-years**; 93 illness incidents | February 2008 – January 2009 | observational (medical-room consultations) | **Best clean per-person-year denominator in the corpus.** Counts unique illness incidents, not repeat encounters. |
| **3** | Palinkas LA, Glogower F, Dembert M, Hansen K, Smullen R. Incidence of psychiatric disorders after extended residence in Antarctica. *Int J Circumpolar Health* 63(2):157–168, 2004. | [10.3402/ijch.v63i2.17702](https://doi.org/10.3402/ijch.v63i2.17702) | McMurdo + South Pole stations, US Antarctic Program | 220 men + 93 women debriefed (out of full winter cohort); SIGH-SAD + DSM-IV diagnosis by 3 psychiatrists + 1 clinical psychologist | 1994 – 1997 austral winters | observational (post-winter structured psychiatric debrief) | Per-winter-over psychiatric incidence; weighted for participation rate |
| **4** | Hong S-N, et al. Mood and Sleep Status and Mental Disorders During Prolonged Winter-Over Residence in Two Korean Antarctic Stations. *Nat Sci Sleep* 14:1387–1396, 2022. | [10.2147/NSS.S370659](https://doi.org/10.2147/NSS.S370659) | King Sejong + Jang Bogo Stations, Korean Antarctic Program | 88 winter-over crew | 2017 – 2020 (multi-year cohort) | observational (BDI / ISI / PSQI longitudinal + clinical diagnosis) | Per-winter-over diagnosed-mental-disorder rate (insomnia, depression) |
| **5** | Walton M, Kerstman E. Quantification of Medical Risk on the ISS using the IMM. *Aerosp Med Hum Perform* 91(4):332–342, 2020. | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | (Antarctic analog citations only) — cites McMurdo 1992–1996 (5 summer deployments × 4 mo) and 2013–2014 US Antarctic stations | (cited 1992–1996 evac data + 2013–2014 evac data from Pattarini 2016 = ref 38) | 1992–1996 / 2013–2014 | secondary citation (NASA IMM validation paper) | Per-py *medical evacuation* rate — analog upper-bound on serious-event rate |
| **6** | Peřina V, Bartáková J, Pires Freitas A, et al. Analysis of dental care in Antarctic crews: Dental problems, case studies and treatments. *Czech Polar Reports* 13(2), 2024. | [10.5817/cpr2023-2-13](https://doi.org/10.5817/cpr2023-2-13) | Czech Antarctic Program (Mendel station, 2007–2023) + Brazilian Antarctic Program (Comandante Ferraz, 2018–2023); secondary cites Japanese Showa (Ohno 2018) + Ukrainian Vernadsky (Moiseyenko 2016) | Czech: 5 dental cases / 15 expedition-years (short-term summer); Brazilian + Ukrainian + Japanese: dental = 10–15% of winter-over medical case mix | 2007 – 2023 (combined window) | observational (case-series + secondary literature pull) | Dental as share of total medical cases; **denominator is total-medical-cases**, not person-years |
| **7** | Pattyn N, Mairesse O, Cortoos A, Marcoen N, Neyt X, Meeusen R. Sleep during an Antarctic summer expedition: new light on "polar insomnia". *J Appl Physiol* 122:788–794, 2017. | [10.1152/japplphysiol.00606.2016](https://doi.org/10.1152/japplphysiol.00606.2016) | Princess Elisabeth Antarctica (Belgian station), 21 healthy male subjects | 21 men, summer expedition (constant illumination) | 4-mo summer expedition (year not stated in OCR — likely 2010–2015 window) | observational (ambulatory PSG + saliva melatonin/cortisol + POMS + PVT) | Subjective sleep-complaint prevalence + objective PSG changes; not a per-py rate |
| **8** | Norris K, Paton D, Ayton J. Future directions in Antarctic psychology research. *Antarctic Science* 22(4):335–342, 2010. | [10.1017/s0954102010000271](https://doi.org/10.1017/s0954102010000271) | Australian Antarctic Program — review of literature on AAP personnel | n/a — secondary review citing Lugg 2000 (10-yr AAP records review) + Lugg 1991 + Lugg 2005 | 1988–1997 (window in cited Lugg 2000 data) | review | Rank-order of 5 most frequent physiological complaints; 4–5% DSM-IV rate per winter-over (from Lugg 1991) |

**Coverage caveat — sources NOT located, flagged for manual follow-up:**

- **Otto C, Hamilton DR, Levin DR, et al. 2015. "Into the abyss: the National Aeronautics and Space Administration's Tektite II revisited." Aerosp Med Hum Perform.** — Not findable via paper-search, scite, or Google search. May not exist under the cited title in 2015; might be conference paper or different year. (Original Tektite II medical reports are 1971, PubMed 4653761-4653764, but that's the saturated-diving habitat, not the analog reanalysis the task expects.)
- **Lugg DJ. Antarctic medicine, 1775-2000. MJA 173(11-12):613-7, 2000.** — *Med J Aust* publication. The JAMA piece by same author DOI 10.1001/jama.283.16.2082 is a brief "From the World of Medicine" perspective, not the systematic 10-year AAP morbidity review. The MJA paper itself is paywalled and not in the local Selectron / Zotero corpus. Secondary citation in Norris 2010 establishes the rank order of complaint categories.
- **Tibbo SE — McMurdo / Amundsen-Scott medical event data.** — No matching publication located. May be unpublished NASA / NSF program data.
- **Ohnishi T et al. — Japanese Showa Station winter-over data.** — Cited via Peřina 2024 (Ohno et al. 2018), not retrieved as primary.

---

## Per-category rates

### Upper respiratory (sinusitis, pharyngitis, URTI, "polar T-zone" / "McMurdo Crud")

- **Pattarini 2016 (US Antarctic Program, 2013–2014, MCM clinic):** Upper respiratory infections accounted for **17%** of MCM clinic encounters (rank #2 after orthopedic 18%) — "the McMurdo Crud" is a well-documented phenomenon attributed to viral reservoir effect with the larger summer-staff population. At SP and PAL upper-respiratory was a *smaller* relative share, and Bhatia explicitly contradicts "URTI common in Antarctica."
- **Bhatia & Pal 2012 (Maitri, 26-man crew, 1 winter):** "Our data provides support to the contention that upper respiratory tract infections are not common in Antarctica. A probable reason for this could be that Antarctica has a relatively sterile environment." ENT (which includes URTI) was 9/93 = **9.7%** of incidents at Maitri = ~0.35 ENT events/py. URTI subset not separately broken out.
- **Norris 2010 citing Lugg 2000:** Respiratory complaints ranked #2 in 10-year AAP medical-records review.
- **Selectron prior mapping:** conditions affected = [`acute-sinusitis`, `respiratory-infection`, `pharyngitis`, `nasal-congestion-space-adaptation`, `influenza`]
- **Conclusion:** Analog data is **discordant** by station (high at large coastal MCM, low at small isolated stations Maitri / SP). The "polar T-zone" / "McMurdo Crud" is reservoir-driven (large population + frequent crew turnover), not isolation-driven. The Selectron model has small crews of 4–14 — the **Maitri small-crew rate is the better analog**, suggesting NASA M18 priors for `respiratory-infection` and `acute-sinusitis` may *overstate* small-crew analog risk.

### Gastrointestinal (gastroenteritis, diarrhea, constipation, oral ulcers)

- **Pattarini 2016 (MCM, 2013–2014):** GI complaints **6%** of MCM clinic encounters; not separately reported at SP/PAL.
- **Bhatia & Pal 2012 (Maitri, 26 men × 12 mo):**
  - Total "medicine" category (which subsumes GI) was 32/93 = **34%**. Constipation noted "mainly in the month of July, which is the coldest time of the year and the most stressful period in Antarctica."
  - **Oral ulcers** noted in 8 (of 26 men) participants primarily during early wintering = 8/26 = **30.8% prevalence per crew member per 12-mo winter** = ~0.31 events/py (assuming non-recurrence within mission). Attributed to lack of fresh food and stress.
- **Selectron prior mapping:** conditions affected = [`diarrhea`, `gastroenteritis`, `indigestion`, `constipation-space-adaptation`, `mouth-ulcer`]
- **Conclusion:** Oral ulcers / mouth ulcers stand out as **explicitly elevated** in Antarctic data (~0.31/py at Maitri vs. NASA M18 prior of α=2, β=500 → λ ≈ 0.004/day = 1.46/py). The current NASA prior may actually be **too high**, OR the Maitri 30% is an underestimate (per-patient prevalence, not per-event count). Flag for manual elicitation. GI more broadly under-reported (no Pattarini breakdown by ICD).

### Headache (CO2 / hypoxia / general / altitude)

- **Pattarini 2016 (US Antarctic Program, 2013–2014):** Headache "reported only at the South Pole Station" (SP altitude 2,834 m, density altitudes >3,353 m) — likely altitude-related not CO2-related. Specific percentage not extracted from text (Pattarini Figure 1 — under text but no numeric label in OCR-accessible portion).
- **Bhatia & Pal 2012:** Headache not separately broken out in incident category list; falls under "medicine" 34%.
- **Norris 2010 citing Lugg 2000:** "Disruptions to the nervous system and sensory organ functioning" ranked #4 in AAP records (subsumes headache + neuro complaints).
- **Selectron prior mapping:** conditions affected = [`headache-co2-induced`, `headache-space-adaptation`, `headache-late`]
- **Conclusion:** Headache rate in Antarctic small-crew analogs is **not well quantified per-py**. Altitude-specific rate is exclusively a South Pole / high-altitude station phenomenon (Concordia 3,233 m → also relevant per Caputo 2020) and **does not map cleanly to space CO2-headache**. Keep current NASA M18 prior for `headache-co2-induced` (α=2, β=167 → λ ≈ 0.012/day = 4.38/py) since it's tier-A.

### Musculoskeletal (back pain, knee/shoulder/wrist sprain-strains, hip strain, lacerations)

- **Pattarini 2016:** **Orthopedic injuries (particularly muscular strain) were most common at MCM, 18%** of clinic encounters. At SP, orthopedic 13% (rank #1). At PAL, orthopedic 12% (rank #3).
- **Bhatia & Pal 2012:** **Most common single category: musculoskeletal injuries, bruises, and lacerations = 27/93 = 29.0%** of all illness incidents at Maitri = **1.04 events/py** for the combined MSK+lacerations category. Orthopedics specifically (separate from MSK injuries category) was an additional 15/93 = 16.1% = 0.58/py. Combined MSK = **~1.6 events/py.**
- **Norris 2010 citing Lugg 2000:** "Injuries and poisonings" ranked **#1** in 10-yr AAP records (42% of all medical presentations in another AAP cohort cited by Wallace 2019; 3,910 cases over 1988–1997).
- **Selectron prior mapping:** conditions affected = [`ankle-sprain-strain`, `wrist-sprain-strain`, `shoulder-sprain-strain`, `hip-sprain-strain`, `knee-sprain-strain`, `elbow-sprain-strain`, `back-pain-space-adaptation`, `back-injury`, `neck-injury`, `skin-laceration`, `skin-abrasion`]
- **Conclusion:** MSK is the **#1 medical event category in every Antarctic winter-over dataset reviewed**. Bhatia's combined rate ~1.6/py for an unscreened cohort of 26 men puts an analog upper bound. NASA tier-A priors for `ankle-sprain-strain` (λ=0.0008/day = 0.29/py), summed across all MSK conditions in M18, are probably **plausible-to-conservative** vs. Antarctic. The Selectron tier-B-lit priors for `wrist/shoulder/hip/knee/elbow-sprain-strain` (α=2, β=2500 each → λ=0.0008/day = 0.29/py each, summed across 5 → 1.46/py) are **directionally consistent** with Bhatia's MSK 1.6/py — confidence: **MEDIUM**, keep as is or marginally narrow.

### Dermatologic (skin rash, abrasion, laceration, eczema, frostbite-adjacent)

- **Pattarini 2016:** Dermatologic complaints **14%** at MCM, **9%** at SP, **19% at PAL** (PAL highest rank!).
- **Bhatia & Pal 2012:** Not separately reported (skin would fall under "surgery" 28% which includes lacerations).
- **Norris 2010 citing Lugg 2000:** "Damage/irritation of skin and subcutaneous tissue" ranked **#3** in AAP records.
- **Selectron prior mapping:** conditions affected = [`skin-rash`, `skin-laceration`, `skin-abrasion`, `skin-infection`]
- **Conclusion:** Dermatologic is consistently top-3 or top-4 across stations. The current Selectron tier-B-lit `skin-rash` prior (α=2, β=500 → λ=0.004/day = 1.46/py) is in the right order of magnitude relative to a 14% share of ~3.6 events/py overall = ~0.50/py. Tier-B prior may be **slightly high** but defensible; confidence **MEDIUM**.

### Sleep / behavioral (insomnia, depression, anxiety, psychiatric events)

This is the best-evidenced category with **3 independent primary sources**.

- **Palinkas et al. 2004 (313 US winter-overs, 1994–1997):** 39/313 = **12.5% raw** met DSM-IV criteria for at least one psychiatric disorder during a single winter-over. Weighted for participation rate = **5.2% per winter-over**. Distribution of diagnoses: mood 30.2%, adjustment 27.9%, sleep-related 20.9%, personality 11.6%, substance 9.3%.
- **Hong et al. 2022 (88 Korean winter-overs, 2017–2020):** **7/88 = 8.0% diagnosed with mental disorders** (predominantly insomnia in early winter). Population was already pre-screened by Korean Antarctic Program.
- **Norris 2010 citing Lugg 1991:** "c. 4–5% of expeditioners" fulfill DSM-IV per winter-over. Mood + adjustment + sleep disorders together account for 60% of those diagnoses.
- **Pattarini 2016:** Insomnia explicitly noted as **4%** of MCM clinic visits, **11%** of SP clinic visits (rank #2 at SP, attributed to altitude + isolation), and PAL had **7%** "psychological or behavioral concerns" (highest among 3 stations).
- **Pattyn 2017 (21 men, Belgian summer expedition):** Subjective: **70%** reported sleep-maintenance trouble; **70%** reported non-restorative sleep. Objective PSG: SE dropped from 92.7% to 80.7%; SWS dropped from 32.0% to 13.2% (p<0.001 for each).
- **Selectron prior mapping:** conditions affected = [`late-insomnia`, `insomnia-space-adaptation`, `depression`, `anxiety`, `behavioral-emergency`]
- **Conclusion:** Per-winter-over rates of clinically-diagnosable psychiatric disorder in screened Antarctic cohorts are **4–12.5% per 9–12-month winter**. Converting Palinkas 5.2%/winter to events-per-person-day (assuming 9-month exposure) = 0.052 / (9 × 30) = **1.93e-4/day** = 0.070/py. Current Selectron `depression` prior (α=2, β=4545 → λ=4.40e-4/day = 0.161/py) is **2× higher** than Palinkas weighted rate, but is also consistent with Bhatia's 3/93 = 3.2% psychiatry rate at Maitri (= 0.115/py). Confidence: **HIGH** that 0.04–0.16 events/py is the right ballpark. Insomnia rates are far higher subjectively (Pattyn 70%) — these are screening cut-offs, not clinical-event lambda values. Keep prior tight on **diagnosed** events, not screening prevalence.

### Dental (caries, crown/filling loss, abscess)

- **Peřina 2024 (Czech + Brazilian + secondary Japanese + Ukrainian):**
  - Overwintering crews: dental problems are **10–15% of overall medical cases**.
  - Summer-only expeditions: **≤5%** of cases.
  - Specific stations: Japanese Showa 13.0% (Ohno 2018, 50-yr longitudinal cited); Ukrainian Vernadsky 11.9% (7 expeditions, Moiseyenko 2016 cited); Indian Maitri 2% in single expedition (Bhatia 2012).
  - Czech expeditions (short-term, summer): 5 dental cases over 15 years total.
  - Most common dental issues, in seriousness order: (1) caries + infection, (2) pulpitis / apical abscess, (3) abscesses, (4) gingivitis, (5) pericoronitis (Langdana 2014, cited via Peřina).
  - Lloro 2019 (cited via Peřina): "higher dental incidence rate in Antarctica compared to non-isolated conditions" based on 70 cases.
- **Pattarini 2016:** **12 dental examinations or procedures over the year (1% of total visits at SP)**. Includes preventive exams, not emergencies.
- **Bhatia & Pal 2012:** Dentistry **2/93 = 2.2%** of incidents = ~0.08/py at Maitri. Very low.
- **Selectron prior mapping:** conditions affected = [`dental-caries`, `dental-crown-loss`, `dental-filling-loss`, `dental-exposed-pulp`, `dental-avulsion-tooth-loss`, `dental-abscess`]
- **Conclusion:** Dental event rate in long-term overwintering is **substantially higher than summer-only or screened-astronaut expectations**. Per Peřina 13% × ~3.6/py overall ≈ **0.47/py for all dental events combined** at long-term stations; or Bhatia 0.08/py for tightly-screened small-crew Indian Antarctic Program. Selectron tier-B-lit dental priors range λ = 4e-7 to 0.0013/day (i.e. 1.5e-4 to 0.49/py per condition). **Sum across 5 dental conditions ≈ 0.85/py** — close to Peřina upper bound (0.47/py). Slightly conservative-to-too-high relative to long-term Antarctic; **defensible**, confidence **MEDIUM**.

### GU / GYN (UTI, vaginal yeast infection, abnormal uterine bleeding)

- **Pattarini 2016:** Not separately reported in extracted excerpts; sub-1% of total visits at all 3 US stations (insufficient signal to report a per-category percentage).
- **Bhatia & Pal 2012:** 26-man-only crew; no GYN data possible. UTI/GU not in extracted excerpts.
- **Hong 2022:** Mixed-sex Korean Antarctic cohort, but no GU/GYN breakdown in published abstract.
- **Selectron prior mapping:** conditions affected = [`urinary-tract-infection`, `vaginal-yeast-infection`, `abnormal-uterine-bleeding`, `urinary-incontinence-space-adaptation`, `urinary-retention-space-adaptation`]
- **Conclusion:** **No published per-person-year Antarctic rate located** for any GU / GYN condition. Current Selectron priors are unverified from analog data. Tier-A `urinary-tract-infection` (α=2, β=252525 → λ ≈ 7.9e-6/day = 0.0029/py) is NASA M18 derived — keep as is, flag for analog re-elicitation in Iter 4 if mixed-sex crew populations become primary use case.

---

## Suggested per-condition prior updates

Table format: **conditionId** | **current α** | **current β** | **current λ̄/day** (= α/β) | **derived source λ/day** | **citation** | **confidence** | **action**

Rate conversion: All Antarctic per-py rates → per-day via `λ_day = λ_py / 365.25`.

Bhatia 2012 overall rate = 93 incidents / (26 × 365.25) = 9.79e-3/py-day (3.58/py).

| conditionId | current α | current β | current λ̄/day | source-derived λ/day | source citation | confidence | recommended action |
|---|---|---|---|---|---|---|---|
| `respiratory-infection` (tierB-lit) | 2 | 278 | 7.19e-3 | 9.7% × 3.58/py / 365 = **9.5e-4** (Bhatia small-crew) ⟷ 17% × ~3.6/py / 365 = **1.7e-3** (Pattarini MCM) | Bhatia 2012, Pattarini 2016 | MEDIUM | **LOWER prior** by ~5× for small-crew analog (Maitri-anchored); flag MCM "crud" reservoir effect as crew-size-dependent risk factor in V&V dossier |
| `pharyngitis` (tierB-lit) | 2 | 400 | 5.00e-3 | Falls under "URTI" 9.7% above | Bhatia 2012 | LOW | **Hold** — current prior is reasonable; no station-level data isolates pharyngitis |
| `acute-sinusitis` (tierA-nasa) | 2 | 204 | 9.80e-3 | (Tier-A NASA — should not be down-rated from analog) | M18; cross-check Bhatia | LOW | **Keep** — tier-A; Antarctic data does not invalidate |
| `gastroenteritis` (tierB-lit) | 2 | 370 | 5.41e-3 | 6% × 3.58 / 365 = **5.9e-4** (Pattarini MCM); GI broadly subsumed in Bhatia 34% medicine | Pattarini 2016 | LOW | **LOWER prior** by ~10× — Pattarini visit share suggests current value is too high. CAVEAT: Pattarini visit share ≠ unique incidence |
| `mouth-ulcer` (tierB-lit) | 2 | 500 | 4.00e-3 | 8/26 = 30.8% per 1-yr winter = **8.4e-4/day** (per-person prevalence) | Bhatia 2012 | LOW | **Hold** — Bhatia gives per-person prevalence, not event rate; conversion uncertain. Current prior is plausible |
| `diarrhea` (tierA-nasa) | 2 | 455 | 4.40e-3 | (Tier-A NASA) | M18 | n/a | **Keep** |
| `skin-rash` (tierB-lit) | 2 | 500 | 4.00e-3 | 14% × 3.58 / 365 = **1.37e-3** (Pattarini MCM dermatologic share) | Pattarini 2016 | MEDIUM | **LOWER prior** ~3× — Pattarini dermatologic is broader than rash; tighten beta |
| `skin-laceration` (tierA-nasa) | 2 | 741 | 2.70e-3 | (Tier-A NASA) | M18 | n/a | **Keep** — Bhatia MSK+lacerations 29% includes lacerations subsumed |
| `skin-abrasion` (tierA-nasa) | 2 | 556 | 3.60e-3 | (Tier-A NASA) | M18 | n/a | **Keep** |
| `skin-infection` (tierA-nasa) | 2 | 6,591,624 | 3.03e-7 | Not separately measured in Antarctic data | — | LOW | **Keep** |
| `ankle-sprain-strain` (tierA-nasa) | 2 | 2500 | 8.00e-4 | Bhatia MSK+lacerations 29% / 365 = **8.0e-4/day** for all-MSK; single condition ~1/8 of that | Bhatia 2012 | MEDIUM | **Keep** — consistent w/ Antarctic small-crew rate when summed across MSK family |
| `wrist-sprain-strain` (tierB-lit) | 2 | 2500 | 8.00e-4 | Subsumed in Bhatia MSK 29% | Bhatia 2012 | MEDIUM | **Keep** — small-crew Antarctic-consistent |
| `shoulder-sprain-strain` (tierB-lit) | 2 | 2500 | 8.00e-4 | Same | Bhatia 2012 | MEDIUM | **Keep** |
| `hip-sprain-strain` (tierB-lit) | 2 | 2500 | 8.00e-4 | Same | Bhatia 2012 | MEDIUM | **Keep** |
| `knee-sprain-strain` (tierB-lit) | 2 | 2500 | 8.00e-4 | Same | Bhatia 2012 | MEDIUM | **Keep** |
| `elbow-sprain-strain` (tierB-lit) | 2 | 2500 | 8.00e-4 | Same | Bhatia 2012 | MEDIUM | **Keep** |
| `back-injury` (tierA-nasa) | 2 | 4,922,471 | 4.06e-7 | (Tier-A — rare event for traumatic spine injury) | M18 | n/a | **Keep** |
| `back-pain-space-adaptation` (tierB-lit) | 7 | 3 | 2.33 events/day | (Acute "space-adaptation" — no Antarctic analog at all; back pain at Maitri subsumed in MSK 29%) | — | n/a | **Antarctic data does NOT inform this prior; keep current value, flag for separate spaceflight-corpus calibration** |
| `late-insomnia` (tierA-nasa) | 2 | 1,000 | 2.00e-3 | (Tier-A — applies to chronic insomnia not the acute space-adaptation form) | M18 | n/a | **Keep** — note Antarctic Pattyn 70% subjective dwarfs this but is a screening-prevalence figure not a clinical-event rate |
| `insomnia-space-adaptation` (tierB-lit) | 7 | 3 | 2.33/day | Pattyn 2017 subjective insomnia 70% per winter; SP clinic insomnia 11% of visits per Pattarini | Pattyn 2017, Pattarini 2016 | HIGH (direction); LOW (numeric) | **Hold** — current prior is space-adaptation specific (first 10 days post-launch); Antarctic "polar insomnia" is chronic not acute; do not down-rate from Antarctic |
| `depression` (tierB-lit) | 2 | 4545 | 4.40e-4 | Palinkas 5.2%/winter / 270 d = **1.93e-4/day**; Hong 8.0%/winter / 365 = **2.19e-4/day**; Bhatia 3/93 psychiatry = **3.16e-4/day** | Palinkas 2004, Hong 2022, Bhatia 2012 | HIGH | **LOWER prior** ~2× — set β ≈ 9000–10000 to land on Palinkas weighted rate. Document Antarctic-vs-screened-astronaut discrepancy (caveat below) |
| `anxiety` (tierA-nasa) | 2 | 25,000 | 8.00e-5 | (Tier-A — Palinkas 27.9% adjustment + 11.6% personality dx together = ~half of psych dx | M18 | n/a | **Keep** — current value is consistent with implied Antarctic anxiety-related fraction within the 5.2%-per-winter clinical envelope |
| `behavioral-emergency` (tierA-nasa) | 2 | 400,000 | 5.00e-6 | (Tier-A — extreme psych emergency) | M18 | n/a | **Keep** — Pattarini reports 1 suicidal-ideation MEDEVAC from PAL over 1 year against 67-person summer / 19-person winter mixed cohort = ~0.015/py raw rate, consistent with current NASA value when reweighted for screened crews |
| `dental-caries` (tierB-lit) | 2 | 1460 | 1.37e-3 | 13% × 3.58 / 365 / 5-dental-conditions = **2.55e-4/day per condition** (Peřina 13% share) | Peřina 2024 | MEDIUM | **Hold** — current prior is conservatively higher; analog supports tightening but tier-B-lit caries is within order of magnitude |
| `dental-exposed-pulp` (tierB-lit) | 2 | 3000 | 6.67e-4 | Same; subset of "pulpitis" per Langdana | Peřina 2024 | MEDIUM | **Hold** |
| `dental-avulsion-tooth-loss` (tierB-lit) | 2 | 5000 | 4.00e-4 | Tooth loss extremely rare in Antarctic literature — no Bhatia, no Pattarini dental loss noted | Peřina 2024 (case series) | LOW | **Hold** |
| `dental-crown-loss` (tierB-lit) | 2 | 2000 | 1.00e-3 | Same Peřina aggregate; not broken out | Peřina 2024 | LOW | **Hold** |
| `dental-filling-loss` (tierB-lit) | 2 | 1500 | 1.33e-3 | Same Peřina aggregate; included in case series | Peřina 2024 | LOW | **Hold** |
| `dental-abscess` (tierA-nasa) | 2 | 595059 | 3.36e-6 | (Tier-A — emergency, rare) | M18 | n/a | **Keep**; Langdana cites abscesses #3 cause but no per-py rate |
| `urinary-tract-infection` (tierA-nasa) | 2 | 252525 | 7.92e-6 | No Antarctic rate located | — | LOW | **Keep**; no analog data to update |
| `vaginal-yeast-infection` (tierB-lit) | 2 | 700 | 2.86e-3 | No Antarctic rate located | — | LOW | **No Antarctic analog rate located; current Selectron prior is unverified — flag for separate elicitation** |
| `abnormal-uterine-bleeding` (tierB-lit) | 2 | 1000 | 2.00e-3 | No Antarctic rate located | — | LOW | **No Antarctic analog rate located; current Selectron prior is unverified — flag for separate elicitation** |
| `barotrauma-ear-sinus-block` (tierB-lit) | 2 | 1000 | 2.00e-3 | Pattarini ENT 4% MCM clinic share; mostly URTI; barotrauma not separately reported | Pattarini 2016 (indirect) | LOW | **Hold** |
| `headache-co2-induced` (tierA-nasa) | 2 | 167 | 1.20e-2 | (Tier-A; CO2-specific to ECLSS environments) | M18 | n/a | **Keep** — Antarctic altitude-related headache (SP, Concordia) is mechanistically different |
| `headache-space-adaptation` (tierB-lit) | 6 | 4 | 1.50/day | (Space-adaptation acute window) | — | n/a | **Antarctic data does NOT inform this prior; keep current value, flag for separate spaceflight-corpus calibration** |
| `headache-late` (tierB-lit) | 2 | 700 | 2.86e-3 | Antarctic headache not separately rated; subsumed in nervous-system #4 of AAP Lugg | Norris 2010 (cite of Lugg) | LOW | **Hold** |
| All `*-space-adaptation` (tierB-lit, 8 conditions) | varies | varies | varies | n/a — Antarctic does not have a 0-g acute adaptation phase | — | n/a | **Antarctic data does NOT inform these priors; keep current values, flag for separate spaceflight-corpus calibration** |
| All Tier-C-synth surgical / trauma conditions (18 conditions) | varies | varies | varies | Pattarini 2016 MEDEVAC list includes appendicitis, atrial-fib, nephrolithiasis, trauma, malignancy, angina — these are NASA tier-A; remaining tier-C surgical (e.g., `abdominal-injury`, `acute-pancreatitis`, `hip-proximal-femur-fracture`) are not observed in Antarctic small-crew analogs at meaningful frequency | — | LOW | **No Antarctic analog rate located for any tier-C surgical / trauma condition; current Selectron priors are unverified — keep + flag for separate elicitation (likely spaceflight-corpus or general-medicine base-rate calibration)** |
| `medical evacuation rate (cross-cutting)` | n/a | n/a | n/a | McMurdo 1992–1996: **0.036/py**; US Antarctic stations 2013–2014: **0.01/py** | Walton & Kerstman 2020 (citing Johnston 1998 + Pattarini 2016) | HIGH | **Use as Stage B cross-validation anchor**; Selectron IMM whole-crew pEVAC should sum to within this analog range for a 6-person 6-mo mission |

---

## Methodology notes

### Rate-conversion arithmetic

- **Per-person-year (events/py) → per-person-day (events/day):** divide by 365.25.
- **Per-winter-event prevalence → per-day:** Assume Antarctic winter = 9 months ≈ 270 d. So 5.2% per winter / 270 d = 1.93e-4 events/person-day. This is an upper bound when the event is one-and-done (e.g., DSM-IV diagnosis), or a lower bound when the event can recur. **Per advisor consultation: use Bhatia 2012's 93-events / 26-person-year denominator as the anchor for absolute λ; use Pattarini 2016's percentages for relative category structure only.**
- **Gamma-Poisson prior mean λ̄ = α / β** (where β is the rate parameter, not scale).
- All Selectron `imm-priors.json` rates use `events-per-person-day` as `lambda_unit`.

### Cross-station rate blending (explicit approximation)

Per-category absolute rates in the Suggested Prior Updates table are computed by
multiplying **Pattarini 2016 *visit-share* percentages (MCM)** by **Bhatia 2012's
*per-person-year* anchor (3.58/py at Maitri)**. This implicitly assumes the
relative case-mix at MCM / SP / PAL applies to Maitri, which is reasonable given
that the injuries → respiratory → dermatologic rank-order is consistent across
all four stations in the data (Pattarini Fig. 1; Bhatia abstract; Lugg 2000 cited
in Norris 2010), but it is flagged here as a **known approximation** — the
controller should treat any single per-condition λ derived this way as ±2× of
the reported value.

### Visit-vs-event chronicity adjustment (advisor flagged)

**Pattarini 2016 reports rates per clinic visit / encounter, NOT per unique event onset.** Three indicators:

1. MCM: 1,555 encounters / 658 unique individuals = **2.36 encounters per unique patient** (the same patient with the same condition presents multiple times).
2. SP: 1,637 diagnoses / 658 individuals at MCM, and 811 diagnoses / 212 individuals at SP = ~2.5 and ~3.8 diagnoses per individual.
3. SP: "**93 individuals accounting for 637 of the 744 clinic visits**" — **44% of the visiting patients drive 86% of visits**, indicating heavy chronicity / repeat-visit behavior.

This means Pattarini's per-category percentages cannot be directly read as per-person-year incidence; they must be interpreted as **visit-share evidence** about relative category importance. The unique-diagnosis count (1,637 MCM, 811 SP, 129 PAL) is a closer approximation to events than encounters, but is still inflated by chronic-condition follow-ups (especially at SP where altitude-related insomnia / headache drive repeat visits).

### Antarctic-vs-NASA-astronaut screening gap (S20 caveat — must be flagged)

Per Walton & Kerstman 2020 (S20): **Antarctic populations are *less rigorously screened* than NASA astronauts** — "variable body habitus, more frequent comorbidities, and wider ranges of age and permissible fitness level in the Antarctic population." This means **Antarctic rates are upper bounds for the Selectron candidate population (which is itself screened analog-astronauts).** Specifically:

- Bhatia & Pal 2012 included 9/26 expeditioners with pre-existing illness (HTN 4, DM 2, etc.) — would be DQ'd from most astronaut programs.
- Pattarini 2016 explicitly notes summer staff at MCM "subject to more liberal screening requirements" inflating the URTI/derm summer rate.
- Hong 2022 Korean cohort was pre-screened more rigorously and shows lower mental-disorder rate (8.0% vs Palinkas 12.5% raw / 5.2% weighted).

**The controller must not paste Bhatia 2012's 3.58 events/py rate directly into a Selectron tier-B prior — Antarctic rates need a screening-adjustment factor (suggested 0.5–0.8×) before being used as analog upper bounds for screened crews.**

### Gaps where Selectron's priors are entirely unverified

- **All `*-space-adaptation` conditions (8):** Antarctic has no 0-g acute adaptation phase. Priors must be calibrated against a spaceflight (ISS) corpus, not Antarctic.
- **All GU / GYN conditions (5):** No Antarctic small-crew per-py rates published; flag for OB/GYN consultative elicitation or general-medicine base-rate substitution.
- **All Tier-C synthetic surgical / trauma conditions (~18):** Antarctic literature does not surface these at meaningful per-py rates (small crews + screened populations + rapid medevac mask the rate). Use NASA tier-A where it exists; keep current tier-C with explicit "synth" provenance otherwise.
- **CO2-specific physiology (`headache-co2-induced`):** Mechanism is ECLSS-environment-specific; Antarctic altitude-related headache (Concordia 3,233 m; SP 2,834 m) has a different causal pathway and should not be used as direct analog.

### What this evidence packet DOES support, at high confidence

1. **MSK injuries are the #1 medical event category in Antarctic winter-overs** — 18% MCM / 13% SP / 12% PAL / 29% Maitri / 42% AAP 10-yr Lugg. NASA tier-A `ankle-sprain-strain` + tier-B-lit other-joint sprain-strains *summed* (current 1.46/py) is **consistent** with Bhatia's 1.6/py observed at Maitri. **No change recommended** — current Selectron priors are already analog-anchored.
2. **Psychiatric DSM-IV diagnoses occur in 4–12% of winter-overs.** Selectron current `depression` prior is ~2× the Palinkas weighted rate; recommend lowering β by 2×.
3. **Dental events at long-term overwintering stations are 10–15% of all medical cases** (Peřina aggregated 4-station data). Current Selectron dental priors summed give ~0.85/py, slightly above Peřina-implied 0.47/py — defensible.
4. **URTI / "polar T-zone" is a large-station reservoir effect, NOT a generic isolation effect.** Selectron's small-crew analog use case suggests current `respiratory-infection` prior may be too high; recommend lowering by 5× to match Maitri small-crew data.

### What this evidence packet DOES NOT support

- Any update to spaceflight-acute (`*-space-adaptation`) conditions.
- Any update to GU / GYN conditions.
- Any update to surgical / trauma tier-C synth conditions.
- Direct comparison of Antarctic *visit-share* rates to spaceflight *incidence* rates without chronicity adjustment.

---

## Local-corpus discoveries (rates not previously catalogued)

These Selectron `research/evidence/` papers were already OCR'd but had per-category rate
data that was NOT cited in the existing `_beta_elicitation_audit.md`. The controller's
synthesis pass should add them to the prior-trail:

| Local file | Citation embedded | Rate of interest |
|---|---|---|
| `palinkas-2004-antarctic-psychiatric-disorders.md` | Palinkas 2004 (DOI 10.3402/ijch.v63i2.17702) | 5.2% weighted DSM-IV per winter-over (n=313); mood 30%, adjustment 28%, sleep 21% of all psych dx |
| `pattyn-2017-antarctic-sleep-polar-insomnia.md` | Pattyn 2017 (DOI 10.1152/japplphysiol.00606.2016) | 70% subjective sleep-maintenance trouble; SE 92.7%→80.7% / SWS 32%→13% objective drop |
| `nirwan-2022-antarctic-psychophysiology.md` | Nirwan 2022 (DOI 10.25259/SRJHS_4_2022) | >50% Antarctic expeditioners uplifted to high altitude experience AMS symptoms; injuries are most common morbidity |
| `zimmer-2013-antarctic-psychological-changes-systematic-overview.md` | Zimmer 2013 systematic overview | Cognitive impairment cited in 63.6% of reviewed studies; depression 56.8%; anxiety 47.7%; irritability 45.4%; only ~5% met clinical DSM-IV / ICD-10 criteria |
| `leon-2011-human-performance-polar-environments.md` | Leon 2011 (DOI 10.1016/j.jenvp.2011.08.001) | 64.1% McMurdo personnel reported sleep difficulties in winter (Palinkas 1992 cited) |

The existing `imm_sources/_beta_elicitation_audit.md` had flagged that "the original
Pattarini 2016 / Barratt-Johnston source isn't in the corpus" — this packet **provides
the missing Pattarini 2016 numbers** for the controller's prior-update synthesis pass.

---

## Cross-references (Selectron working files)

- IMM priors data file: `src/data/imm-priors.json` (schema_version 1; 100 conditions; calibration_target K15 Table 1 ISS 6mo 6-crew)
- Existing audit: `research/imm_sources/_beta_elicitation_audit.md` (notes the missing Pattarini citation chain — this packet closes that gap)
- Existing IMM corpus: `research/imm_sources/INDEX.md` (10 NASA-IMM primary methodology sources)
- Existing I&C analog corpus: `research/evidence/INDEX.md` (31 OCR'd papers including 6 Antarctic-specific ones used above)
- V&V dossier targets: `docs/iter3_vv_dossier.md` §5 (IMM Calculator validation)
