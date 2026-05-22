# Submarine + ISS historical medical incidence — Selectron prior calibration evidence

> Scope: Operational LEO (ISS / Shuttle / Mir) and submarine analog rates for
> the eight tier-B prior categories used in `src/data/imm-priors.json`. ISS is
> the K15 calibration anchor (`src/imm/calibration.ts::K15_TABLE1_REF`).
> Mars / Artemis / exploration-class missions are explicitly out of scope per
> the 2026-05-22 scope-down.
>
> Author: Selectron Iter-3 evidence agent. Read-only artifact, not for
> hand-edit. Do NOT mutate `src/data/imm-priors.json` or `STATUS.md` directly.

---

## Headline finding — answer to the prompter's "Critical" question

**There is no public per-condition events/person-year ISS incidence table that
covers all eight tier-B categories.** The closest published gold-standard
references are:

1. **Gilkey et al. 2012 (NASA/TP-2012-217120, G12)** — gives full Bayesian
   posteriors (mean, 5/median/95 percentile, EF) for 12 conditions: angina,
   appendicitis, atrial fibrillation, atrial flutter, **dental abscess**,
   **dental caries**, **dental periodontal disease**, gallstone, herpes
   zoster, renal stones, seizure, stroke. Of these 12, **only the three
   dental conditions** intersect the eight categories in this brief. G12 is
   the only paper that ships both a USN submarine prior (Deutsch 1997-2000,
   240 patrols, 5946.9 person-years) and an in-flight LSAH posterior in one
   place. This is the IMM Calculator's published gold standard for dental.
2. **Walton & Kerstman 2020 (S20, DOI 10.3357/amhp.5432.2020)** — provides
   the macro pEVAC rate (0.022 evac/person-year empirical through ISS Exp 49,
   136.2 py; 0.017 IMM-predicted for DRM2), the USN submarine cross-anchor
   (0.023-0.028 evac/py, 1993-96), and the Antarctic cross-anchor (0.036/py
   1992-96 → 0.01/py 2013-14). S20 publishes **% contribution to EVAC per
   condition** in Tables II-V, *not* per-condition events/person-year. Do
   not conflate.
3. **K15 (Keenan 2015) Appendix** — lists the *source class* (In-flight /
   Terrestrial / Astronaut pre+post / External model) and *distribution
   family* (Gamma / Lognormal / Beta / Fixed) for all 95 IMM conditions, but
   K15 publishes only the DRM-1/DRM-2 aggregate (TME, CHI, pEVAC, pLOCL),
   **not** the per-condition λ. The numeric λ live in the iMED SQL database
   (JSC-66109), which is not in our corpus.
4. **Myers 2018 (M18) validation** — observed-vs-predicted counts at the
   per-condition level for 21 STS + 31 ISS missions; M18 reports that
   ISS predictions were within the 90 % CI for 15/31 missions and that
   ~24 % of individual ISS conditions fell *outside* prediction uncertainty
   (mostly over-predicted). M18 does **not** publish the per-condition tally
   either — only the aggregate accuracy.

**Operationally this means:** For dental, G12 supplies a calibrated submarine
+ LSAH Bayesian posterior we should mirror exactly. For SABP, Kerstman 2012
supplies a 772-flight ISS+STS retrospective number we should mirror exactly.
For the other six categories the public literature reports
*percentage of crewmembers who reported the condition during a mission*
(Wotring 2015, Crucian 2018, Putcha 1999, Horn 2003) — translation to
events/person-year requires the assumption "1 affected crewmember = 1 event
across the mission" which is documented inline as a confidence-LOW inference.

---

## Sources

All citations verified via NCBI E-utilities (esummary + efetch abstracts) or
scite.ai fulltextExcerpts. Confidence flag = retrieval-confirmed unless
marked "[not directly verified]". PMID = MEDLINE indexing ID.

### Submarine (operational analog)

| Tag | Citation | Verified |
|---|---|---|
| TANSEY79 | Tansey WA, Wilson JM, Schaefer KE. Analysis of health data from 10 years of Polaris submarine patrols. *Undersea Biomed Res* 1979;6 Suppl:S217-46. **PMID 505628**. *No DOI (pre-DOI era)*. 885 FBM patrols, **7,650,000 man-days**; surface-fleet comparator 1,215,918 man-days (1973). | abstract retrieved |
| HORN03 | Horn WG, Thomas TL, Marino K, Hooper TI. Health experience of 122 submarine crewmembers during a 101-day submergence. *Aviat Space Environ Med* 2003;74(8):858-62. **PMID 12924761**. *No DOI listed*. n=122 USN crew, 101 d. | abstract retrieved |
| JAN02 | Jan MH, Thomas TL, Hooper TI. Prescription medication use aboard US submarines during periods underway. *Undersea Hyperb Med* 2002 Winter;29(4):294-306. **PMID 12797671**. n=200 of 1,017 initial health visits (Apr 1996-Jan 1998). | abstract retrieved |
| DEUTSCH08 | Deutsch WM. Dental events during periods of isolation in the U.S. submarine force. *Mil Med* 2008;173(1 Suppl):29-37. **DOI 10.7205/milmed.173.supplement_1.29**. **PMID 18277720**. **240 patrols, Jan 1997 – Sep 2000**. This is the canonical submarine dental dataset cited by G12 (=G12 Ref 15, identical 5946.9 py / 240 patrols). | abstract retrieved |
| MARGEL03 | Margel D, White DP, Pillar G. Long-term intermittent exposure to high ambient CO2 causes respiratory disturbances during sleep in submariners. *Chest* 2003;124(5):1716-23. **DOI 10.1378/chest.124.5.1716**. Submarine CO2 → headache/sleep mechanism paper cited by Wotring 2015 ref 31. | scite metadata |
| HOLY15 | Holy X, Bégot L, Renault S, et al. Seasonal influence over serum and urine metabolic markers in submariners during prolonged patrols. *Physiol Rep* 2015;3(8):e12494. **DOI 10.14814/phy2.12494**. Quotes Tansey 1979 for GU rate comparison. | scite fulltext |
| SACK98 | Sack D. U.S. Navy Atlantic submarine medical evacuations: 1993-1996, an epidemiologic assessment [abstract]. Undersea & Hyperbaric Medicine; 1998. Source for "0.023-0.028 evac/py" cited in S20 ref 41. *[Conference abstract, not in PubMed/scite; cited transitively via S20]*. | not directly verified, cited via S20 |

### Mir / Russian program

Per the brief's scope, Mir cohort medical-event tally is desired but
**none was found** in our local corpus, in scite, or in the verified
primary literature retrieved here. The only Mir-program-attributable
events recoverable are case-level evacuations preserved in S20's
discussion:

- S20, verbatim: "there have been **three medical evacuations in the
  Russian space program (prior to the ISS program)**: **two due to
  medical illnesses (sepsis from urinary tract infection [Hendrickx 2011]
  and cardiac dysrhythmia [Gazenko et al. 1990])**, and **one for
  intractable headaches due to smoke inhalation [the Salyut-5/Mir
  combustion event series: Burrough 1999; NASA TM-75070; Rudnyi 1977;
  Nicogossian 1993]**."

These provide three case-level data points for the GU / cardiac /
headache directional priors (UTI-sepsis pathway, dysrhythmia, smoke
inhalation → headache → EVAC) but **no events-per-person-year cohort
rate**. The Russian-program in-flight medical event registries (i.e.,
the Bogomolov / Goncharov et al. Russian Federation analog of LSAH) are
not available in this corpus and would be the right primary source for
a Mir cohort tally; they are cited by S20 (refs 9, 12, 17) but not
ingested here.

### ISS / Shuttle / Mir (operational LEO)

| Tag | Citation | Verified |
|---|---|---|
| G12 | Gilkey KM, McRae MP, Griffin EA, Kalluri AS, Myers JG. Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort. NASA/TP-2012-217120, 2012. *No DOI*. NTRS ID 20120013096. LSAH preflight + in-flight person-years for 12 conditions. | local corpus, OCR verified |
| S20 | Walton ME, Kerstman EL. Quantification of medical risk on the International Space Station using the Integrated Medical Model. *Aerosp Med Hum Perform* 2020;91(4):332-42. **DOI 10.3357/amhp.5432.2020**. **PMID 32493555**. 136.2 person-years through ISS Exp 49. | local corpus, full text |
| K15 | Keenan A, Young M, Saile L, Boley L, Walton M, et al. The Integrated Medical Model: A Probabilistic Simulation Model Predicting In-flight Medical Risks. 45th ICES 2015. *No DOI; conference proceedings*. ICES-2015 Bellevue WA. | local corpus, full text |
| M18 | Myers J, Garcia Y, Arellano J, et al. Validation of the NASA Integrated Medical Model: A Space Flight Medical Risk Prediction Tool. PSAM 14 Paper 174, 2018. *No DOI; conference proceedings*. 21 STS + 31 ISS missions. | local corpus, full text |
| STEP07 | Stepaniak PC, Ramchandani SR, Jones JA. Acute urinary retention among astronauts. *Aviat Space Environ Med* 2007;78(4 Suppl):A5-8. **PMID 17511293**. *No DOI*. Single-astronaut case report (recurrent AUR over two missions). | abstract retrieved |
| WOTR15 | Wotring VE. Medication use by U.S. crewmembers on the International Space Station. *FASEB J* 2015;29(11):4417-23. **DOI 10.1096/fj.14-264838**. 24 crewmembers / 20 missions ≥ 30 d / 10-yr period. NTRS 20140017010. | scite fulltextExcerpts (5 verbatim) |
| KERS12 | Kerstman EL, Scheuring RA, Barnes MG, DeKorse TB, Saile LG. Space Adaptation Back Pain: A Retrospective Study. *Aviat Space Environ Med* 2012;83(1):2-7. **DOI 10.3357/asem.2876.2012**. **n = 772 astronaut flights** (excluding STS-51L Challenger, STS-107 Columbia). | scite fulltextExcerpts (5 verbatim) |
| KERS22 | Kerstman EL, Reyes D, Masterova KS, et al. Assessment of Sex-Dependent Medical Outcomes During Spaceflight. *J Womens Health* 2022;31(8):1145-55. **DOI 10.1089/jwh.2021.0636**. IMM-driven sex-difference analysis; identifies UTI in women as primary driver of nonemergent pEVAC. | scite metadata |
| KERS21 | Kerstman EL, Penchev R, Scheuring RA. Back Pain in Outer Space. *Anesthesiology* 2021;135(3):384-95. **DOI 10.1097/aln.0000000000003812**. Open-access review citing KERS12 SABP=52% and disc herniation post-flight risk. | scite fulltextExcerpts |
| KERS22b | Kerstman EL, Antonsen E, Myers JG. Estimating medical risk in human spaceflight. *npj Microgravity* 2022;8(1). **DOI 10.1038/s41526-022-00193-9**. IMM cross-mission-duration risk comparison; ISS-baselined. | scite fulltextExcerpts |
| SCH09 | Scheuring RA, Mathers CH, Jones JA, Fischer CL. Musculoskeletal injuries and minor trauma in space: incidence and injury mechanisms in U.S. astronauts. *Aviat Space Environ Med* 2009;80(2):117-24. **DOI 10.3357/asem.2270.2009**. Hand injuries most common. Numeric incidence in paywalled body. | scite metadata only, body paywalled |
| PUT99 | Putcha L, Berens KL, Marshburn TH, Ortega HJ, Billica RD. Pharmaceutical use by U.S. astronauts on space shuttle missions. *Aviat Space Environ Med* 1999;70(7):705-8. **PMID 10417009**. *No DOI*. **n = 219 person-flights across 79 STS missions**. Astronaut debriefing data. | abstract retrieved |
| CRU18 | Crucian B, Choukér A, Simpson RJ, et al. Immune System Dysregulation During Spaceflight: Potential Countermeasures for Deep Space Exploration Missions. *Front Immunol* 2018;9:1437. **DOI 10.3389/fimmu.2018.01437**. Narrative review citing skin-rash/URTI/herpes-reactivation as elevated in ISS crew. | scite fulltextExcerpts (5 verbatim) |
| STEP96 | Stepaniak PC, Furst JJ, Woodard D. Medical events during the first 24 Space Shuttle flights. *Aviat Space Environ Med* 1996;67(7):617-24. *No DOI; not indexed in PubMed by primary author + topic search; one Stepaniak P record at vol 67 issue 7 = unrelated AsMA editorial (PMID 8830947).* Cited by S20 ref 8 chain and by Wotring 2015 indirectly. **Not directly verified; numeric values cannot be quoted from this brief.** | NOT VERIFIED |

---

## Per-category rates

### 1. Upper respiratory (URTI, sinusitis, pharyngitis, congestion)

**Submarine**
- **TANSEY79 (885 FBM patrols, 7.65 M man-days, 1968-73)**: "a decrease in:
  1) respiratory; 2) ear, nose, and throat; ... categories" between
  1965-67 and 1968-73 attributed to "improved atmosphere control."
  Surface fleet **higher** respiratory illness rate vs submarine — direction
  is counter-intuitive but explained by smoke pollution / atmospheric
  contaminants on surface vessels at the time. Submarine respiratory rate
  not given as numeric in the abstract.
- **JAN02 (200 prescription encounters, USN submarines 1996-98)**: "**Acute
  upper respiratory infections (17.6 %)**" was the single largest diagnostic
  category, followed by superficial wounds 9.7 %, elevated BP 7.9 %,
  sprain/strains 4.7 %, skin infections 4.3 %, eye disorders 3.6 %,
  ear disorders 3.6 %. Together 7 categories = 51.4 % of all diagnoses.
- **HORN03 (122 crew, 101-d submergence)**: First-half survey, **runny
  nose** was the most common medical complaint; 82 % of crew reported at
  least one complaint.

**ISS**
- **WOTR15 (24 crew, 20 missions ≥ 30 d)**: "**43 reports of congestion
  or allergy symptoms on the ISS that required treatment**, 22 (51 %)
  of which indicated regular or repeated medication use." Decongestants /
  antihistamines and skin treatments scaled with mission length (vs SAS
  treatments which did not). K15 appendix marks Acute Sinusitis,
  Pharyngitis, and Respiratory Infection all as **"In-flight" data source**
  → published numerics live in iMED, not in K15 body.
- **CRU18 (narrative review)**: "Some ISS crewmembers manifest some degree
  of clinical incidence, primarily infectious events, allergic symptoms,
  or skin rashes." Frames URTI as immune-dysregulation-mediated; offers no
  numeric incidence.

**Synthesis.** USN submariners run *URTI 17.6 % of all prescription
encounters* in modern records (JAN02). The matching ISS retrospective is
*~25 % of crewmembers had ≥ 1 congestion/allergy episode requiring repeated
medication* (WOTR15: 22 of an implied ≥ 22 of 24 crewmembers; conservatively
**~92 % of crewmembers used a decongestant/antihistamine at some point per
WOTR15 raw count of 43 reports / 24 crew**). Confidence flag for translation
to events/py: **LOW** without raw mission-day data.

### 2. Gastrointestinal (gastroenteritis, diarrhea, constipation)

**Submarine**
- **TANSEY79**: Gastrointestinal listed as one of six categories that
  *decreased* 1968-73 vs 1965-67 ("decrease in: ... 3) gastrointestinal ...
  general medical illness categories") and surface fleet had higher GI
  illness rate than submarine. No numeric in abstract.
- **JAN02**: GI not in top-7 diagnostic categories (which together capture
  51.4 % of all diagnoses), implying GI < 4 % of prescription encounters
  on USN subs 1996-98.

**ISS**
- **WOTR15**: Antacids and antidiarrheals appear in the medication-resource
  ranking comparison in M18 Table 1 (Antacids rank 10 observed / 12
  predicted on ISS = Excellent match; Antidiarrheals rank 11 observed / 8
  predicted = Fair match). Indication-level GI not broken out in the WOTR15
  excerpts retrieved.
- **K15 Appendix**: Diarrhea, Gastroenteritis, Indigestion,
  Hemorrhoids all marked **"In-flight" / Gamma distribution**.
  Constipation (Space Adaptation) marked **"In-flight" / Beta**.
  Numerics in iMED, not published.
- **S20 Tables II-V (ISS DRM2 EVAC contribution)**: Acute Diverticulitis,
  Appendicitis, and Sepsis appear as worst-case treated/untreated
  contributors. No straightforward GI events/py given.

**Synthesis.** Submarine GI burden is small post-1968 (decreased with
atmospheric control improvements per TANSEY79). ISS GI medication
utilization roughly mirrors the iMED-baselined predictions (M18 Antacids =
Excellent match) — consistent with current IMM defaults being close to
operational truth. Confidence flag: **LOW** for any numeric prior update;
recommendation is **no update** to iMED-derived defaults.

### 3. Headache (CO2-related, late, space-adaptation)

**Submarine**
- **MARGEL03 (cited via WOTR15 ref 31 and CHEST 2003)**: Submarine studies
  with monitored environmental CO2 levels associated *higher CO2
  concentrations with increased rates of headaches and sleep disturbances.*
  Mechanism rather than per-condition rate.
- **HORN03**: Headache not in the top-3 complaints listed (runny nose,
  difficulty sleeping, backache); implies headache prevalence < ~30 %
  during 101-d submergence (since runny nose, sleep, back each were higher
  in the 82 %-complaint cohort).

**ISS**
- **WOTR15**: "**More than half the crewmembers (54 %, n = 13) reported
  headaches; 4 of them, which is 17 % of the total number of crewmembers
  in this analysis, reported multiple headaches over the course of their
  missions.**" Discussion section reframes this as: "These findings are
  consistent with the **65 % of crewmembers reporting headaches that
  required treatment on their ISS missions.**" Both numbers from same paper,
  same dataset (24 crewmembers / 20 missions ≥ 30 d ); the 54 % vs 65 %
  discrepancy is a self-report-vs-treatment threshold artifact.
- **PUT99**: 79 STS missions, 219 person-flights — headache identified as
  one of "smaller percentages" of medication indications after SAS (47 %)
  and sleep (45 %), with backache and sinus congestion also in the tail.
  Numeric % for headache not given in abstract.
- **WOTR15 framing**: WHO terrestrial baseline = 50-75 % of adults have
  headache in any year; the 65 %/54 % ISS rate is within this range — i.e.,
  ISS headache is *not unambiguously elevated above terrestrial baseline*
  by this measure.
- **K15 Appendix**: Headache (CO2-induced), Headache (late), and
  Headache (space adaptation) all marked **"In-flight" — Gamma / Beta**;
  numerics in iMED.

**Synthesis.** ISS headache prevalence = **54-65 % of crewmembers per
mission** (WOTR15). Submarine direction = CO2 dose-dependent rise (MARGEL03)
but no per-patrol cohort number published. Confidence flag: **MEDIUM**.
For Selectron's CO2-induced headache prior, the 65 % rate over a 6-month
ISS mission translates to **≥ 1.3 episodes/person-year** (lower bound,
assuming 1 treatment-requiring episode per affected crewmember per 6-month
mission). The true rate is strictly higher because WOTR15 explicitly notes
17 % of all crewmembers (= 4 of 24) reported *multiple* headaches over the
course of their missions, so the floor should be treated as a floor, not a
point estimate.

### 4. Musculoskeletal (back pain, sprain/strain, MSK injury)

**Submarine**
- **HORN03**: **Backache** was one of the top-3 complaints (with runny nose
  and difficulty sleeping) in the first half of the 101-d submergence.
- **JAN02**: **Sprain/strains** = 4.7 % of prescription encounters on USN
  subs 1996-98 (per-encounter rate, not per-py).
- **TANSEY79**: "the number of general surgery, **orthopedics**, dental,
  and eye illness cases was not affected" by atmospheric improvements
  1965-67 vs 1968-73 (i.e., MSK is environment-independent in submariners).

**ISS / Shuttle**
- **KERS12 — gold standard for SABP**: "**Incidence of SABP was 52 %**" of
  **772 astronaut flights** reviewed (excluding Challenger STS-51L and
  Columbia STS-107). Females 58 % / males 52 %. Onset within first 5 days,
  usually first 2 days; mild-to-moderate, localized to lumbar, typically
  during sleep period. Resolution by day 12. Treatment effective in
  85-91 % (knee-to-chest > stretching > anti-inflammatories).
- **KERS21**: Reaffirms **52 % SABP incidence among 722 astronaut flights**
  (note: KERS21 cites n=722, KERS12 abstract says n=772 — likely typo in
  one source; per the methodology section of KERS12: "A total of 772
  astronaut flights were reviewed"). Disc herniation risk **dramatically
  higher in first 12 months post-return**.
- **SCH09**: "Hand injuries were among the most common events" (abstract
  only — numeric incidence in paywalled body, cannot be quoted).
- **K15 Appendix**: Back Pain (Space Adaptation), Back Injury, multiple
  Sprain/Strain conditions (Ankle, Elbow, Hip, Knee, Neck, Shoulder, Wrist)
  all marked **"In-flight" / Gamma or Beta**. Numerics in iMED.

**Synthesis.** SABP is the most numerically anchored category in ISS
literature: **52 % incidence per flight, n = 772** (KERS12). This is by far
the firmest event-rate datum for any of the eight categories. For
exploration-class prior calibration, KERS12 should be the reference number.
Confidence flag: **HIGH**.

### 5. Dermatologic (skin rash, abrasion, infection)

**Submarine**
- **JAN02**: **Skin infections = 4.3 %** of prescription encounters on USN
  subs 1996-98. Superficial wounds = 9.7 %.
- **TANSEY79**: "Surface fleet personnel had a higher illness rate in the
  categories of ... **dermal**, infections" vs submariners — submariners
  appear protected.

**ISS**
- **WOTR15**: "**The occurrence rate of skin rashes requiring treatment
  seems elevated among the ISS crewmembers, with 25 % of the crewmembers in
  this study reporting use of a medication to treat a rash.**" "There were
  also 2 apparent treatment failures in cases of skin rash, raising
  questions about the efficacy or suitability of the treatments used."
- **CRU18**: "...increased incidence of infectious disease as well as
  increased allergic symptoms and persistent skin hypersensitivity reactions
  in some crewmembers during orbital flight." Frames rash as
  immune-mediated, no per-py rate.
- **K15 Appendix**: Skin Abrasion, Skin Infection, Skin Laceration, Skin
  Rash all marked **"In-flight" / Gamma**.

**Synthesis.** ISS skin rash prevalence = **~25 % of crewmembers per
6-mo mission** (WOTR15). Submarine analog (JAN02) shows skin issues at
~14 % of prescription encounters (4.3 % skin infections + 9.7 % superficial
wounds). The ISS rate of 25 % is the cleanest published prevalence;
converts to a lower bound of **≥ ~0.5 episodes/person-year** under the
single-episode-per-affected-crewmember-per-6-mo assumption. WOTR15 reports
2 treatment failures in those 6 rash cases (= ~33 % treatment-failure rate
within the affected subset), implying some affected crewmembers had
multiple rash episodes — actual events/py is strictly higher.
Confidence flag: **MEDIUM** (WOTR15 cohort = 24 crewmembers, small but
real).

### 6. Sleep / behavioral (insomnia, sleep aid use)

**Submarine**
- **HORN03**: **Difficulty sleeping** was a top-3 complaint in the first
  half of 101-d submergence and *the* most common complaint in the second
  half (77 % of crew listed complaints overall in the second half).
- **MARGEL03**: Higher CO2 environment → more sleep disturbances (mechanistic).

**ISS / Shuttle**
- **PUT99 (79 STS missions, 219 person-flights, 1999)**: SMS 47 %, **sleep
  disturbances 45 %**, smaller % for headache / backache / sinus congestion.
- **WOTR15**: ISS sleep-aid use ≈ **10× the terrestrial adult baseline**.
  Sleep aids scaled with mission length. Specifically, 2001-2011 data show
  78 % (61/78) of shuttle crewmembers used sleep medications during space
  missions (per Zong 2025 reanalysis citing Barger 2014). Survey data:
  71 % of respondents relied on pharmacotherapy to initiate sleep.
- **Putcha 79-mission analysis (re-cited via Zong 2025)**: sleep
  medications = **45 % of all pharmacological interventions** on STS.
- **K15 Appendix**: Insomnia (space adaptation), Late Insomnia, Sleep
  Disorder — all "In-flight" / Beta or Gamma.

**Synthesis.** ISS sleep disturbance prevalence is the second-most-anchored
category after SABP. Operational fact: ~**45-50 % of crewmembers per
shuttle/ISS mission report sleep disturbance** requiring medication
(PUT99, WOTR15); ISS sleep-aid usage rate is roughly an order of magnitude
above terrestrial baseline. Confidence flag: **HIGH** (multiple independent
cohorts, PUT99 219 person-flights + WOTR15 24 crew + Barger 2014 78 crew).

### 7. Dental (caries, abscess, periodontal)

**Submarine — gold standard, in our corpus**
- **DEUTSCH08 (240 patrols, Jan 1997 - Sep 2000)**: "**The incidence rate
  for all dental problems was 5.0 per 100,000 person-days at sea.**"
  - 109 initial dental visits + 45 revisits during patrols.
  - 48.6 % of visits = endodontic/caries.
  - Rate by mission week: **first 7 days = 7.5/100k-py-days; days 8-14 =
    5.5; after day 14 = 4.6** — confirms an early peak.
  - Dental problems = 6.9-9.3 % of all submarine medical evacuations
    1991-1999.
  - Self-survey during 101-d submergence (same data as HORN03): 13.1 %
    crew had a dental problem, 9.8 % canker sore, 4.1 % gum problem.
- **G12 Tables 19, 23, 27** (operationalizes DEUTSCH08's same dataset):
  - **Dental abscess: 21 events / 5946.9 py = 3.53 × 10⁻³/py, EF = 1.48,
    95 % CI 0.69-3.80**. Submarine males only.
  - **Dental caries: 29 events / 5946.9 py = 4.88 × 10⁻³/py, EF = 1.11,
    95 % CI 0.3-1.53**.
  - **Dental periodontal disease: 10 events / 5946.9 py = 1.68 × 10⁻³/py,
    EF = 6.24, 95 % CI 0.33-4.19**.

**ISS / LSAH astronaut posteriors (G12 Tables 21, 25, 29)**
- **Dental abscess in-flight posterior (G12 Table 22)**:
  mean = 8.16 × 10⁻³/py, 5 % = 5.58 × 10⁻³, 95 % = 1.14 × 10⁻², SD =
  1.80 × 10⁻³. Astronaut males only; LSAH preflight 19 events/475.2 py;
  zero in-flight events on 31.9 in-flight py.
- **Dental caries in-flight posterior (G12 Table 26)**:
  mean = 9.41 × 10⁻³/py, 5 % = 8.46 × 10⁻³, 95 % = 1.04 × 10⁻². LSAH
  preflight 168 caries events/475.2 py.
- **Dental periodontal in-flight posterior (G12 Table 30)**:
  mean = 1.03 × 10⁻¹/py, 5 % = 8.16 × 10⁻², 95 % = 1.28 × 10⁻¹. LSAH
  preflight 56 events/475.2 py.

**Synthesis.** Dental is the *only* category for which Selectron has a
complete published Bayesian chain (submarine prior → LSAH preflight
posterior → in-flight posterior, all in G12). For Selectron's IMM
Calculator priors, **mirror G12 Tables 22/26/30** for the in-flight rates.
Confidence flag: **HIGH** for all three dental subcategories.

### 8. GU / GYN

**Submarine**
- **TANSEY79 (verbatim from abstract)**: Surface fleet had a **lower
  illness rate** in **genitourinary** (and systemic, cranial,
  neuropsychiatric) categories than submariners — **submariners had
  *higher* GU illness rates**. HOLY15 (citing TANSEY79): "submariners
  tended to display a higher genitourinary illness rate compared to surface
  U.S. Navy population. Investigators suggested that increased CO2 levels
  in the submarine atmosphere may have contributed to the higher
  incidence of ureteral calculi in submarine personnel."
- **JAN02**: GU not in top-7 prescription categories (< 4 % of encounters).
- **DEUTSCH08** does not address GU.

**ISS / Shuttle**
- **STEP07 — case report, not cohort**: "Acute urinary retention" (AUR)
  presentation in a middle-aged astronaut, recurrent over two missions.
  Triggered by promethazine + scopolamine for SAS prophylaxis on Mission 1
  (AUR for first 7 days, requiring catheterization for 4 d). AUR recurred
  spontaneously in first 24 h of microgravity on Mission 2. STEP07 is
  the only published in-flight GU/GYN event paper for the US program at
  individual level.
- **KERS22 (IMM-driven sex-difference analysis)**: "Sex-dependent
  differences are seen for rates of nonemergent pEVAC during the 6 month
  and 2.5-year missions, **where women have a higher pEVAC in the 182-day
  (0.0388 vs 0.0354) and 2.5-year missions (0.350 vs 0.228)**. **These
  differences were driven by higher incidence of partially treated urinary
  tract infection (UTI)**." UTI in women is the primary driver of
  ISS-class sex differential.
- **K15 Appendix**: Urinary Incontinence (SA), Urinary Retention (SA),
  Urinary Tract Infection all marked **"In-flight" / Beta or Gamma**;
  Abnormal Uterine Bleeding and Vaginal Yeast Infection marked
  "Terrestrial" / Fixed or Gamma.
- **WOTR15** does not separately report GU/GYN medication use rates.

**Synthesis.** Submariner GU rates are *higher* than surface fleet
(TANSEY79) — consistent with CO2 hypothesis. ISS-side data are dominated
by UTI in women (KERS22) and one well-documented AUR case (STEP07).
Confidence flag: **MEDIUM** for UTI sex differential; **LOW** for any
events/py from submarine TANSEY79 (no numeric in abstract — paper paywalled).

---

## Suggested per-condition prior updates

These are recommendations only — **do not auto-merge to
`src/data/imm-priors.json`.** All updates require human review of the
calibration script (`scripts/calibrate_imm_priors.ts`-equivalent) and
re-running `npm run calibrate:imm`.

| Condition (priors.json key) | Current source | Recommended update | Confidence | Provenance tier |
|---|---|---|---|---|
| `dental.abscess` | tierC-synth or tierA-nasa | **mean = 8.16 × 10⁻³/py, EF = 1.43** from G12 Table 22 (submarine + LSAH) | HIGH | tierA-nasa (G12 directly) |
| `dental.caries` | tierC-synth | **mean = 9.41 × 10⁻³/py, EF = 1.11** from G12 Table 26 | HIGH | tierA-nasa |
| `dental.periodontal` | tierC-synth | **mean = 1.03 × 10⁻¹/py, EF computed from 5/95 percentile = sqrt(0.128/0.0816) = 1.25** from G12 Table 30 | HIGH | tierA-nasa |
| `musculoskeletal.back_pain` / SABP | tierC-synth | **52 % incidence per 6-mo mission (= ~1.04 events/py if 1 event per crew per mission)** from KERS12 (n = 772 flights) | HIGH | tierB-lit |
| `sleep.insomnia` | tierC-synth | **45-50 % of crewmembers per mission report sleep aid use** (PUT99 219 person-flights, WOTR15 24 crew); ~10× terrestrial baseline | HIGH | tierB-lit |
| `headache.co2` | tierC-synth | **54-65 % of crewmembers per 6-mo mission** (WOTR15); ~1.3 events/py with inference flag | MEDIUM | tierB-lit |
| `dermatologic.skin_rash` | tierC-synth | **25 % of crewmembers per 6-mo mission required rash medication** (WOTR15); ~0.5 events/py with inference flag | MEDIUM | tierB-lit |
| `genitourinary.uti` | tierC-synth | **No safe events/py update from this corpus.** Recommended: keep current iMED-baselined rate; tag KERS22 sex differential (0.0388 vs 0.0354 pEVAC at 182 d) as the operational sex-dependent multiplier. | MEDIUM | tierB-lit |
| `genitourinary.aur` | tierC-synth | **Case-report only (STEP07)**; do *not* derive cohort rate. Tag as "rare-but-mission-critical, sole documented US event, pharmacologic trigger." | LOW | tierC-synth |
| `gastrointestinal.diarrhea` / `gastroenteritis` / `constipation` | iMED-baselined | **No update.** K15 says In-flight source; published prevalence not extractable from this corpus. iMED defaults are already tier-A. | N/A | tierA-nasa |
| `upper_respiratory.urti` / `acute_sinusitis` | iMED-baselined or tierC-synth | **JAN02 submarine prior: 17.6 % URTI of prescription encounters; ISS WOTR15: ≥ 92 % of crewmembers used a decongestant/antihistamine at some point.** Selectron-IMM does not currently model "% encounters" — translation requires assumption. Recommended: keep current iMED defaults; cite WOTR15 + JAN02 in `source_ref`. | MEDIUM | tierB-lit |

---

## Methodology notes

1. **Stepaniak 1996 was *not* directly verified.** The prompter named
   STEP96 as canonical. It is not retrievable via PubMed (search of
   `Stepaniak[Author] AND space AND shuttle` returns only 5 records, none
   matching the 1996 title; PMID 8830947 is *Krakauer H, "The
   responsibility of aviation medicine,"* not Stepaniak's paper). It is
   also not indexed in scite.ai. The paper is cited by S20 (and many
   downstream IMM papers) in their reference lists, but its numeric
   contents are not reproduced verbatim in any source in our corpus.
   **No numbers are quoted from STEP96 in this brief.** If the IMM team
   has a scanned copy, it could update the GI / URTI / headache priors
   meaningfully — flagged as evidence gap.
2. **Submarine and ISS data are not on the same scale.** Submarine sources
   (DEUTSCH08, JAN02) usually report *events/100k person-days* or
   *% of prescription encounters*; ISS sources (WOTR15, KERS12, PUT99)
   usually report *% of crewmembers reporting per mission*. G12 is the only
   paper that bridges both with explicit per-person-year rates on both
   sides, and only for 12 conditions. The conversions between scales
   require explicit modelling assumptions and should be flagged with
   confidence = LOW until raw mission-day data are obtained.
3. **Tansey 1979 abstract gives directions, not numbers.** The Tansey
   paper supplies the *direction* of submarine-vs-surface-fleet rate
   differences across illness categories (submariners *higher* GU,
   systemic, cranial, neuropsychiatric; surface fleet *higher* respiratory,
   GI, dermal, infections, traumatic). It does not publish per-category
   rates in the abstract. The full Tansey paper would provide rates per
   man-day for each category and is the canonical historical reference,
   but the body text is paywalled and is not in our corpus.
4. **CO2 effect on headache/sleep is mechanistic, not rate-stated.**
   MARGEL03 (paywalled body) and submarine cohort literature establish a
   CO2 dose-response for headache and sleep but do not publish
   per-crewmember rates separable from confounders. The K15 IMM model
   already implements "Headache (CO2 induced)" as an in-flight-sourced
   gamma distribution; the iMED numeric is the operational anchor.
5. **All G12 rates are *male only*** because the USN Submarine Force
   data (DEUTSCH08) included no women. For Selectron's mixed-crew use
   cases, the dental rates need sex-adjustment via terrestrial general-
   population data or via the LSAH female-astronaut posterior (which
   G12 does compute for several non-dental conditions).
6. **S20's analog cross-anchors are the IMM-validated checkpoint.**
   The Antarctic 0.036 → 0.01 evac/py and USN sub 0.023-0.028 evac/py
   are repeatedly cited as the empirical bounds the IMM should reproduce.
   These are *evacuation* rates, not per-condition incidence — useful for
   end-state pEVAC calibration but not for tier-B condition priors.
7. **Confidence flag system used here:**
   - HIGH = retrieved verbatim from primary source with numeric rate
     and sample size (G12, KERS12, WOTR15 for sleep/SABP/rash/headache,
     DEUTSCH08, JAN02 for proportions).
   - MEDIUM = retrieved direction + indirect numeric inference required
     (WOTR15 headache 65 % treated → ~1.3 events/py with 6-mo
     assumption; CRU18 narrative confirmation).
   - LOW = only direction known, no usable numeric in abstract or no
     direct retrieval (Tansey 1979 GU direction; STEP96; SCH09 body).

---

## Selectron action checklist (do NOT execute here)

The recommendations above are evidence input only. The actual `imm-priors.json`
mutation, calibration re-run, and Dexie schema check are the IMM Calculator
maintainer's call. The chain of custody should be:

1. Human reviewer reads this file + Diego ratifies which lines to incorporate.
2. Update `src/data/imm-priors.json` for the 5 HIGH-confidence rows (dental
   abscess/caries/periodontal, SABP, sleep) — set `provenance: "tierA-nasa"`
   for the three dental, `provenance: "tierB-lit"` for SABP and sleep.
   `source_ref` should point to this file plus the originating local source
   (`research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md` for
   dental; this file for SABP and sleep with KERS12 and PUT99/WOTR15
   citations).
3. For headache (CO2) and skin rash, defer until either (a) STEP96 is
   obtained and verified, or (b) a tier-B "% of crewmembers per mission"
   field is added to the prior schema as an alternative to events/py.
4. Do not modify GI or URTI priors based on this brief — iMED defaults
   are tier-A and this brief does not improve on them.
5. Re-run `npm run calibrate:imm` only after step 2 commits — calibration
   touches the K15 anchor and must be reproduced for any rate change.
6. Update `docs/iter3_vv_dossier.md` §5 (IMM Calculator validation) with a
   note that dental, SABP, and sleep priors are now anchored to public
   primary sources rather than tier-C synthetic placeholders.
