# Medical & Physiological Screening Criteria — Astronaut and Analog Selection

**Selectron / Agent A4 — 2026-05-18.** Scope: cross-walk of current medical/physiological selection criteria across NASA, ESA, JAXA, FAA Class III, and analog programs (Concordia, HI-SEAS, CHAPEA, MDRS).

**Primary sources:**
- NASA **OCHMO-STD-100.1A** (Apr 2023): https://www.nasa.gov/wp-content/uploads/2023/04/ochmo-std-100.1a.pdf
- NASA-STD-3001 Vol 1 Rev C (Sep 2023): https://www.nasa.gov/wp-content/uploads/2023/11/nasa-std-3001-vol-1-rev-c-with-signature.pdf
- ESA Astronaut Applicant Handbook 2021–22 + 2008 Medical Examination List (= JAR-FCL 3 / Part-MED Class 2)
- JAXA *Space Medicine 3-6* (iss.jaxa.jp/med)
- THESEUS / MASC (Russomano et al., 2018)
- FAA AME Guide (14 CFR Part 67)
- NASA TR 20180003611 (VO₂max standard)

Thresholds tagged [OCHMO §X] are verbatim from OCHMO-STD-100.1A.

---

### Cardiovascular

- **Authoritative source(s):** OCHMO-STD-100.1A §J (Cardiovascular); NASA-STD-3001 Vol 1 §3.2; ESA Part-MED Class 2 (equivalent to JAR-FCL 3 Class 2); JAXA annual medical exam (ECG, exercise tolerance).
- **Thresholds (real programs):**
  - **Resting BP (NASA):** HTN defined as *"sustained systolic ≥ 140 mmHg or diastolic ≥ 90 mmHg"* → disqualifying [OCHMO §J.3]; selection screen *"BP not to exceed 140/90 sitting"* (FS-2011-11-057). **FAA III analog floor:** ≤ 155/95.
  - **Resting 12-lead ECG:** required at selection + annually; any dysrhythmia / conduction defect → AMB review [OCHMO §J.8].
  - **Ambulatory ECG:** atrial ectopy > 20%, VT ≥ 11 beats, PVCs > 1% → AMB review [OCHMO §J.8.A–B].
  - **Channelopathy:** prolonged QT > 500 ms or Brugada → disqualifying [OCHMO §J.8].
  - **Structural:** LVEF < 50% post-cardiomyopathy → specialist; PFO → specialist [OCHMO §J.2, §J.6.C].
  - **Atherosclerosis:** coronary calcium score at selection (5-yr cadence males > 40, females > 50); carotid IMT + plaque; annual ASCVD risk [OCHMO Table 4].
  - **Stress test (treadmill/Bruce):** required at selection; max HR, max workload, ventilatory threshold; abnormal → cardiology.
  - **Lipids (annual):** TC, HDL, LDL, TG, hs-CRP [OCHMO Table 3]; managed under "metabolic syndrome per established guidelines" [§K.6.E].
- **Divergence:** NASA 140/90 = hard cutoff at selection (waivers at recert). ESA Part-MED Class 2 permits treated stable HTN under waiver. JAXA harmonises to NASA via ISS MMOP. FAA III = analog floor.
- **Defensibility:** 140/90 = JSC 1970s heritage, now aligned with ACC/AHA stage-2 HTN — evidence-based for ≥ 6-mo missions. Analogs < 30 d can use 155/95 (FAA III). ASCVD risk evidence-based (ACC/AHA Pooled Cohort Equations).
- **Selectron encoding:** **3 sub-criteria** — (1) resting BP (continuous, mmHg, hard ceiling); (2) ECG (binary normal/abnormal-review); (3) stress test (pass/fail at age-predicted max HR + arrhythmia). ASCVD continuous secondary (≥ 7.5% → review).

---

### Respiratory

- **Authoritative source(s):** OCHMO-STD-100.1A §M (Respiratory); ESA Part-MED Class 2; JAXA annual pulmonary function test.
- **Thresholds:** PFT required at selection [OCHMO Table 6]; *"abnormal PFTs require specialist evaluation"* [§M.3.C] — no public hard % predicted cutoff (AMB case-by-case). Asthma/reactive airway disease disqualifying; childhood asthma with full recovery + normal PFT may be waivable. Spontaneous pneumothorax disqualifying unless treated (pleurodesis/pleurectomy), normal CXR/PFT/thin-cut CT [§M]. Lobectomy with normal PFT waivable; bilobectomy rejecting. Bronchiectasis disqualifying [§M.4].
- **Divergence:** ESA Part-MED Class 2 = FEV₁ ≥ 70% predicted (formal); NASA AMB judgement, no public cutoff. FAA III disqualifies bullous disease, recurrent pneumothorax, active asthma on chronic therapy.
- **Defensibility:** Asthma exclusion = heritage from cabin-decompression / EVA risk; for non-hypobaric analogs not well-supported. Could relax to "controlled, ICS-only, no exacerbation 2 yr."
- **Selectron encoding:** **2 sub-criteria** — (1) FEV₁ % predicted (continuous; ≥ 80 optimal, 70–80 review, < 70 fail); (2) airway/pleural disease history (ordinal: none/resolved/active).

---

### Neurological

- **Authoritative source(s):** OCHMO-STD-100.1A §N (Neurological); ESA Part-MED Class 2.
- **Thresholds:** Brain MRI + MRA required at selection [OCHMO Table 6]. **Seizure:** single seizure without CNS sequelae after 5 yr → specialist; any seizure < 5 yr or recurrent → disqualifying; febrile convulsions < age 5 not disqualifying [§N.11]. **TBI:** LOC > 30 min or skull defects → disqualifying; LOC < 30 min may be waivable; leptomeningeal cysts/brain abscess/AVM disqualifying [§N.12]. **Migraine:** *"Migraine with visual or motor involvement, or any continuous/incapacitating headache"* disqualifying [§N.14]; acephalgic → specialist. **MS / demyelinating:** disqualifying; AIDP without sequelae 5 yr → specialist [§N.6]. **EEG:** abnormalities with clinical/lab evidence → specialist [§N.15]. **Cerebellar:** finger-to-nose, gait, Romberg, nystagmus, neurovestibular platform [§6.1.4–6.1.5].
- **Divergence:** ESA Part-MED Class 2 = any epilepsy history disqualifying (no 5-yr window). JAXA = MMOP. FAA III = epilepsy, unexplained disturbance of consciousness disqualifying.
- **Defensibility:** 5-yr seizure-free window = FAA Class I heritage (epilepsy recurrence ~5%/yr after 5 yr). Migraine-with-aura exclusion supported (G-triggered aura, white-matter changes, hypobaric contraindication). Non-EVA analogs can relax migraine bar to "no incapacitating episodes in 2 yr."
- **Selectron encoding:** **3 sub-criteria** — (1) seizure history (ordinal: none/single > 5 yr/recurrent or < 5 yr); (2) head injury (ordinal: none/mild < 30 min LOC/moderate-severe); (3) migraine (ordinal: none/without aura/with aura or incapacitating).

---

### Ophthalmologic

- **Authoritative source(s):** OCHMO-STD-100.1A §G (Eyes); NASA Astronaut Selection FS-2011-11-057; ESA Part-MED Class 2.
- **Thresholds (NASA):** **Acuity:** must be correctable to 20/20 each eye [§G.10.A]. **Refractive error:** cycloplegic > +5.50 / −5.50 D any meridian disqualifying [§G.10.B.i]; 2008 selection FS narrows finalist band to **+3.50 to −4.00 D**, astigmatism ≤ 2.00 D, anisometropia ≤ 2.50 D. **Astigmatism:** > 3.00 D disqualifying [§G.10.B.ii]. **Refractive surgery:** PRK / LASEK / epi-LASIK permitted if (i) clinical eligibility (corneal thickness etc.), (ii) pre-op cycloplegic between +4.00 / −8.00 sphere, ≤ 3.00 D cyl, (iii) ≥ 6 mo stable post-op, (iv) two refractions ≥ 1 mo apart within ±0.50 D sphere / ±0.25 D cyl, (v) within applicant standards, (vi) no glare/contrast/night-vision sequelae [§G.10]. Flap-based LASIK historically not permitted. **Color vision:** > mild deficiency on red-green or blue-yellow disqualifying [§G.15]. **Phoria:** > 10 PD eso/exo at 6 m disqualifying [§G.12]. **Stereopsis:** ≥ 40 arc-sec [§G.13]. **Glaucoma / ocular HTN:** any history disqualifying [§G.16.A]; ESA Class 2: IOP > 21 mmHg → specialist.
- **ESA Class 2:** 20/20 each eye corrected; refractive error +5 / −8 D; astigmatism ≤ 3 D; normal color (Ishihara / Nagel).
- **Divergence:** ESA more permissive on refraction (+5/−8 vs NASA finalist +3.50/−4.00). JAXA = MMOP. FAA III = 20/40 each eye corrected; aviation signal colors only.
- **Defensibility:** Tight refractive limits driven by SANS (Spaceflight-Associated Neuro-Ocular Syndrome) post-2011 microgravity-induced refractive shift. Non-microgravity analogs can relax to ESA or Class III.
- **Selectron encoding:** **4 sub-criteria** — (1) corrected acuity each eye (continuous); (2) refractive error (continuous, signed D); (3) color vision (binary); (4) ocular structural abnormality (expert-flagged binary).

---

### ENT / Vestibular

- **Authoritative source(s):** OCHMO-STD-100.1A §H (Ears) + §6.1.7 (Hearing Assessment); ESA Part-MED Class 2; OCHMO Table 11 (Pure Tone Audiometry).
- **Thresholds (pure tone audiometry):**

  | Frequency (Hz) | 500 | 1000 | 2000 | 3000 | 4000 |
  |---|---|---|---|---|---|
  | Candidate selection — both ears max dB HL | 30 | 25 | 25 | 35 | 50 |
  | Annual — better ear max dB HL | 30 | 25 | 25 | 35 | 50 |
  | Annual — poorer ear max dB HL | 35 | 50 | 50 | 75 | 75 |

  [OCHMO §7E.6 / Table 11]. **Word recognition fallback:** ≥ 92% better ear, ≥ 88% poorer ear [§7E.6.C]. **ESA speech test:** must understand ordinary speech at 2 m, back turned. **Tympanogram:** selection + annual [Table 6]. **SMS:** no formal exclusion; medication ground testing mandatory [§6.8.2]. **Vertigo/Ménière's/vestibular disorders** disqualifying [§H].
- **Divergence:** Roscosmos pre-1995 used rotating-chair vestibular cutoffs (~30% rejection); modern NASA/ESA/JAXA dropped because of poor predictive validity for in-microgravity SMS. FAA III = no audiometric cutoff (conversational voice at 6 ft).
- **Defensibility:** Audiometry evidence-based (occupational noise, comms safety). SMS susceptibility correlates weakly (r ≈ 0.3) with in-flight SMS (Reschke) — *not* defensible for selection.
- **Selectron encoding:** **1 multi-frequency continuous criterion** (5-frequency audiometry vector) + **1 binary** (vestibular disorder history). Drop SMS from scoring.

---

### Musculoskeletal / Anthropometry

- **Authoritative source(s):** OCHMO-STD-100.1A §T (Anthropometry); NASA Astronaut Selection FS-2011-11-057; ESA 2021–22 Handbook.
- **Thresholds:** **Height:** NASA 62–75 in (157.5–190.5 cm); ESA 150–190 cm (< 130 cm = disability stream); JAXA 149.5–190.5 cm (relaxed 2021 from 158–175). Sitting height/limb length screened for Orion/Soyuz/EMU fit. **BMI:** no public hard cutoff in OCHMO; *"failure to satisfy anthropometric criteria, including height and weight"* [§T.1]; operational JSC range BMI 18.5–30. **Spine:** recurrent mechanical pain with disabling episodes → specialist [§F.E]; HNP/fractures with persistent neurodeficit disqualifying [§F.D]. **MRI shoulder** required at selection [Table 6] (EVA shoulder-injury epidemiology). ESA: *"normal range of motion in all joints."*
- **Divergence:** Height ranges differ by vehicle/suit fit (Soyuz cap 190 cm, EMU sizing), not physiology.
- **Defensibility:** 100% heritage from vehicle/suit fit. For ground analogs cap can be dropped; floor justified only by ergonomic fit (bunks, hatches, simulator seats).
- **Selectron encoding:** **2 sub-criteria** — (1) anthropometric fit (continuous, bounded interval for height/sitting/weight); (2) spine/joint disorder (ordinal).

---

### Dental

- **Authoritative source(s):** OCHMO-STD-100.1A §Q (Dental); JAXA annual dental exam.
- **Thresholds:** Dental exam + full orthopantomogram (panoramic) or full-mouth X-ray series required at selection [§6.1.10]. **Active caries:** must be restored pre-selection [§Q.4]. **Periodontal disease:** active infection disqualifying until treated [§Q.4]. **Third molars:** partially erupted/impacted with risk of pericoronitis/erosion/periodontal defect disqualifying until corrected [§Q.7]. **Endodontic/periapical infection** disqualifying until resolved [§Q.8]. **Removable prostheses** that would leave inadequate teeth if lost disqualifying [§Q.3]. **Active orthodontia** disqualifying until completed [§Q.9].
- **Divergence:** Functionally identical across NASA / ESA / JAXA. FAA III = no formal dental requirement.
- **Defensibility:** Strong — in-mission dental emergencies (Mir, ISS) well-documented; limited in-flight dental capability.
- **Selectron encoding:** **1 binary criterion** (dentist pass/fail) + optional continuous secondary (active caries count, periodontal pocket depth) for analog finer-grain.

---

### Renal / Metabolic

- **Authoritative source(s):** OCHMO-STD-100.1A §O (Renal), §K (Endocrine/Metabolic).
- **Thresholds:** Annual labs: urea, creatinine, electrolytes (Na, Cl, K), uric acid, HbA1c, fasting glucose, TSH, free T4, anti-thyroid antibodies, lipid panel [OCHMO Table 3]. **Nephrolithiasis:** recurrent/unresolved disqualifying [§O.8]; single resolved stone with normal metabolic workup → specialist. **Single kidney / PKD:** disqualifying [§O.B, O.3]. **Chronic nephropathy:** disqualifying [§O.4]. **Diabetes:** insulin-requiring DM disqualifying; T2DM on pharma generally disqualifying; *"metabolic syndrome per established guidelines"* disqualifying [§K.6.E]. **HbA1c/glucose:** no public numeric cutoff; operational target HbA1c < 5.7%. **Thyroid:** untreated disqualifying; treated euthyroid waivable. **Adrenal medulla/cortex disorders** disqualifying [§K.5].
- **Divergence:** Roscosmos historically excluded any renal-stone history. NASA permits single-stone under specialist review. FAA III disqualifies insulin DM (special issuance possible).
- **Defensibility:** Renal-stone exclusion evidence-based for microgravity (bone resorption ↑ Ca²⁺, ~5× stone incidence; Smith et al., NASA). Ground analogs: exclude only recurrent + active metabolic abnormality. Diabetes exclusion evidence-based for all analogs (acute hypoglycemia risk).
- **Selectron encoding:** **3 sub-criteria** — (1) eGFR/creatinine (continuous); (2) HbA1c (continuous); (3) nephrolithiasis history (ordinal).

---

### Pharmacologic (Medication Exclusions)

- **Authoritative source(s):** OCHMO-STD-100.1A §A (General Disqualifications); 14 CFR §67.107(b) and §67.207(b) for FAA reference.
- **Thresholds:** *"Chronic use of any medication requires AMB review"* [§A.6]; no published auto-disqualify list — any chronic prescription = case-by-case waiver. *"Habitual use of tobacco products"* disqualifying [§A.5]. **Selection labs:** urine drug-of-abuse panel; CDT + ethyl glucuronide (alcohol biomarkers) [Table 3]. **Implicit exclusions** (tied to disqualifying underlying conditions): anticoagulants, insulin, antiseizure meds, lithium, antipsychotics, opioid maintenance, immunosuppressives, biologics. **FAA III explicit Do-Not-Fly:** opioids, benzodiazepines, sedating antihistamines, anticholinergics, antipsychotics, MAOIs, oral hypoglycemics other than metformin, oral steroids > prednisone 20 mg/d.
- **Divergence:** OCHMO permissive in writing, operationally strict (only contraceptives, antihistamines, statins, occasional ACE-I have flown long-duration since 1990s). ESA/JAXA harmonise via MMOP. FAA III list = most actionable analog reference.
- **Defensibility:** Most meds excluded by analogy to underlying condition. FAA-style transparent class list more defensible than blanket "AMB review."
- **Selectron encoding:** **1 multi-class criterion** — vector of binary drug-class flags (cardiovascular, neurological, psychotropic, immunosuppressive) with weighted penalties; not a single score.

---

### Reproductive / Pregnancy

- **Authoritative source(s):** OCHMO-STD-100.1A §P (Obstetrics & Gynecology).
- **Thresholds:** Selection: *"candidates are examined while not pregnant; pregnancy itself will not deny appointment"* [§P.10.A]. Flight: *"pregnancy is disqualifying for spaceflight until complete post-partum recovery"* [§P.10.B]. Cervical cancer screening per USPSTF at selection [Table 6]. Endometriosis, dysmenorrhea, recurrent ovarian cysts, PCOS → specialist if symptomatic [§P.2–8]. hCG measured at selection + multiple pre-launch checkpoints.
- **Divergence:** ESA / JAXA align with NASA. FAA III = no pregnancy disqualification; many CAAs permit flight to ~28 wk gestation.
- **Defensibility:** Flight exclusion evidence-based (radiation, fluid shift, limited medical care, teratogens). Ground analogs: similar rationale (isolation, prenatal-care access, attrition risk).
- **Selectron encoding:** **1 binary** (pregnant at start: yes/no) + **1 ordinal** (gynecologic disorder needing management).

---

### Aerospace-Specific Fitness: VO₂max, +Gz Tolerance, Sensorimotor

- **Authoritative source(s):** NASA-STD-3001 Vol 1 §4 (Human Performance); OCHMO §6.4.4 *Test for Aerobic Functional Capacity*; NASA TR 20180003611; STANAG / USAF G-tolerance standards (1986, ADA170441).
- **Thresholds:** **VO₂max:** task-based EVA floor **32.9 mL·kg⁻¹·min⁻¹** (NASA-STD-3001); recommended pre-flight / selection range **38.7–43.8 mL·kg⁻¹·min⁻¹** (NASA TR 20180003611). Maximum exercise stress test (treadmill or cycle ergometer) at selection + annually [OCHMO §6.4.4]. **+Gz tolerance:** not formally required for NASA selection (Shuttle ≈ +3 Gz; Soyuz reentry ≤ +4 Gz nominal, ≤ +9 Gz ballistic). USAF/Polish AF fighter selection: 7 G × 15 s upright or 8 G × 15 s F-16 seat (Burton 1986). Commercial spaceflight participants: +4 to +5 Gz threshold for G-LOC/A-LOC in untrained volunteers. **Sensorimotor:** must be within population norms [NASA-STD-3001 V1 4005] — balance, gaze stability, computerized dynamic posturography. **Hypobaric:** altitude-chamber familiarization to 25 000 ft equivalent at selection.
- **Divergence:** NASA = soft VO₂max target (no hard selection pass/fail). Roscosmos historically used 45 mL·kg⁻¹·min⁻¹. ESA aligns with NASA. FAA = no VO₂max requirement. +Gz selection = military-aviation heritage, not spaceflight.
- **Defensibility:** VO₂max evidence-based for EVA tolerance + post-flight orthostatic-tolerance prediction (Convertino 1996). Non-EVA analogs: 6-min walk or sub-max ergometer is enough. +Gz NOT defensible for ground analogs; if needed, retain ordinal categorical.
- **Selectron encoding:** **2 sub-criteria** — (1) VO₂max (continuous, floor + target band); (2) sensorimotor composite (continuous z-score vs age/sex norms). +Gz dropped for non-launch analogs; if needed, ordinal (untested / familiarised / cleared ≤ +4 Gz / ≤ +7 Gz).

---

### Analog-Program Divergence Summary

| Program | Medical floor | Divergence from NASA spaceflight standard |
|---|---|---|
| **HI-SEAS** (NASA-funded Mars analog, Hawai'i) | Class 2 flight physical; 21–65 yr; tobacco-free (U. Hawai'i 2016) | No height/weight cap, no centrifuge, no VO₂max minimum; psychological screen primary. |
| **MDRS** (Mars Society) | Self-report questionnaire; "able to operate in a desert in a pressure suit" | Far more permissive; no formal AMB. |
| **CHAPEA** (NASA 1-year ground Mars sim) | OCHMO-aligned (BMI, BP, audiometry, ECG mirror OCHMO-STD-100.1A) | Closest to spaceflight; relaxes refractive surgery and some cardiology criteria. |
| **Concordia** (ESA/IPEV/PNRA Antarctic winter-over) | ESA Class 2 + altitude tolerance (3 233 m); heavier psych screen (SOAP, NEO-PI-R) | No centrifuge; medical bar = ESA Class 2. |
| **THESEUS / MASC** (Mars planning) | Spaceflight medical criteria + radiation-cancer-aware (age, BRCA, family history) | Tighter psychological resilience screening for long-duration. |
| **FAA Class III** (reference floor) | 20/40 each eye, BP ≤ 155/95, color signal, no insulin DM, no epilepsy, no psychosis | "Minimum sane floor" for unfunded community analogs. |

---

### References

1. OCHMO-STD-100.1A Rev A (2023); 2. NASA-STD-3001 Vol 1 Rev C (2023); 3. NASA Astronaut Selection FS-2011-11-057; 4. OCHMO MTB-002 *Waivered Health Conditions* (2024); 5. NASA TR 20180003611 *VO₂max standard*; 6. ESA *Astronaut Applicant Handbook 2021–22* + 2008 Medical Examination List; 7. JAXA *Space Medicine 3-6*; 8. Russomano et al., *MASC*, 2018; 9. FAA AME Guide / 14 CFR Part 67; 10. Burton, *G-Tolerance Standards*, USAF SAM-TR-86 (DTIC ADA170441); 11. Hearing loss in space flights, PMC11114227 (2024).
