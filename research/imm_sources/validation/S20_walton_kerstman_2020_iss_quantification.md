---
ref_id: S20
classification: validation
first_author: Walton
year: 2020
title: "Quantification of Medical Risk on the International Space Station Using the Integrated Medical Model"
venue: Aerospace Medicine and Human Performance, 91(4):332-342 (April 2020)
doi: 10.3357/AMHP.5432.2020
url: https://asma.kglmeridian.com/view/journals/amhp/91/4/article-p332.xml
pubmed: 32493555
mcp_tool_used: zotero-pdf-ocr (Mistral mistral-ocr-latest)
fetched_utc: 2026-05-18T21:48:52Z
verified: true
verified_full_text: true
pages: 11
spec_sections_supported:
  - "Section 9 V&V — analog of [S20] for analog-mission validation"
authors_full:
  - Walton, Marlei E.
  - Kerstman, Eric L.
math_anchors:
  - "Primary outputs S20 uses for ISS PRA integration: pEVAC and pLOCL (not CHI directly — S20 focuses on the decision-grade outputs)."
  - "Validation finding (verbatim): 'forecasted risk values of pEVAC and pLOCL due to medical events were improved by using the IMM with the ISS PRA model instead of using data from prior sources in which these values were underestimated.'"
  - "Trial count + convergence rule (verbatim): 'A total of 100,000 trials were run for each DRM; each trial can be considered an individual simulated mission. ... The number of trials was selected to ensure that the distribution of outcomes converges to <=5% change in the standard deviation of any primary model outcome; 95% confidence intervals (CI) for pEVAC and pLOCL were obtained using joint parameter bootstrap resampling of the simulation output using percentiles.' — Identical convergence rule as M18/G12."
  - "Historical-underestimate values (verbatim): 'ISS PRA v2.1.1 ... model calculations of 0.0035 and 0.0017 for pEVAC and pLOCL, respectively' — the pre-IMM ISS PRA values that IMM later improved."
  - "DRM2 IMM-forecasted EVAC: '5.0% risk of EVAC for 6-mo missions with 6-person crews (DRM2, Fig. 1A) translates into a calculated rate of 0.017 events/person-years (0.05 events/3 person-years).'"
  - "Empirical ground truth (verbatim): 'Using mission data through ISS Expedition 49, total human spaceflight time ... is 136.2 person-years, yielding an EVAC rate of 0.022 evacuations per person-year of flight (3 evacuations/136.2 person-years).' — IMM DRM2 (0.017) is within the empirical 0.01-0.06 range."
  - "Antarctic analog validation (verbatim): 'Antarctic McMurdo Station medical evacuation rates from 1992 to 1996, during 5 summer deployments of 4 mo each, were reported as 0.036 events per person-year. Analysis of more recent data resulted in a medical evacuation rate of 0.01 events per person-year from U.S. Antarctic stations from 2013 to 2014.' — DIRECT precedent for Selectron's analog-mission incidence priors."
  - "U.S. submarine analog (verbatim): 'U.S. submarine medical evacuation rates from 1993 to 1996 ranged from 0.023 to 0.028 events per person-year.' — Second analog population validating IMM outputs."
  - "Worst-case scenario contribution: 'Worst-case scenarios contributed the highest percentage of EVAC outcomes for both DRM1 (78%) and DRM2 (87%). Similarly, worst-case scenarios contributed the highest percentage of LOCL outcomes for DRM1 (89%); all LOCL outcomes for DRM2 resulted from worst-case scenarios.'"
  - "Selectron analog: Iter-3 Phase 3E V&V dossier should run leave-one-mission-type-out CV mirroring S20's empirical-vs-predicted ISS comparison and its Antarctic / submarine analog cross-checks."
zotero_key: SUBSQPG7
---

## Full Text (OCRed from Diego's Zotero library via Mistral OCR)

# Quantification of Medical Risk on the International Space Station Using the Integrated Medical Model

Marlei E. Walton; Eric L. Kerstman

INTRODUCTION: The Integrated Medical Model (IMM) is a quantified, evidence-based decision support tool developed by National Aeronautics and Space Administration (NASA) to assist in the assessment of the medical risk of human spaceflight missions. The IMM utilizes a probabilistic risk assessment (PRA) approach to simulate potential in-flight medical events and resultant health and mission outcomes.

METHODS: The IMM has been utilized to estimate the medical risk associated with International Space Station (ISS) missions. The IMM outputs that have been most informative to the ISS program are the probabilities of evacuation (pEVAC) and loss of crew life (pLOCL). These outputs are incorporated into a continuously maintained ISS PRA model so that its quantification of total ISS mission risk includes the medical risk.

RESULTS: Results of this analysis revealed that the forecasted risk values of pEVAC and pLOCL due to medical events were improved by using the IMM with the ISS PRA model instead of using data from prior sources in which these values were underestimated.

DISCUSSION: The IMM provides an evidence-based PRA approach to directly communicate and integrate medical risk with other ISS risks. A comparison of IMM outputs of pEVAC and pLOCL to empirical spaceflight data and analog population data revealed that IMM outputs were comparable with actual experience. With appropriate outcome context, these findings increase subject matter expert confidence in the accuracy of IMM risk estimates. IMM outputs provide quantifiable objective estimates of medical risk that can be used to inform mission risk assessments and to optimize crew health.

KEYWORDS: quantified risk tool, medical risk model, probabilistic risk assessment, International Space Station Program, evacuation, loss of crew life.

Walton ME, Kerstman EL. Quantification of medical risk on the International Space Station using the Integrated Medical Model. Aerosp Med Hum Perform. 2020; 91(4):332-342.

Assessing medical risk on the International Space Station (ISS) requires integration of information from several sources, including spaceflight and analog medical incidence and outcome data, as well as an understanding of the risk posed by the vehicle itself. An ISS probabilistic risk assessment (PRA) model was developed more than a decade ago to model ISS risk data.[42] This early ISS PRA model was limited in analysis of medical risk because it relied on an approach that applied broad medical assumptions, addressed only a small subset of medical conditions, and was based on pre-ISS medical information.[4,5] To improve upon this capability, the Integrated Medical Model (IMM), a quantified, evidence-based medical support tool,[1,8,10] was used to provide medical input to the ISS PRA model. The IMM incorporates evidence-based medicine and ISS medical capabilities to forecast mission end-state outcomes.[30] This is done by simulating medical events during a

spaceflight Design Reference Mission (DRM) and estimating the impact of these events on crew health and mission success.[23]

Although the IMM forecasts in-flight medical impacts for simulated DRMs to inform the risk decision process, it is not a clinical diagnostic or treatment tool, nor does it assess long-term or chronic postmission medical consequences. The IMM was developed using an ISS-based medical capability, which includes physical resources and readily available ground



---

support, and assumes an ISS operational environment of microgravity and low Earth orbit. For each IMM condition, a set of medical resources from the ISS medical capability is defined as the items necessary to diagnose and treat that condition. 23

The IMM uses data from independent medical conditions (Table I) that are categorized by the following: 1) medical illness; 2) initiating events of either injury or traumatic causes; or 3) environmental factors, including conditions specific to spaceflight and extravehicular activity (EVA). 7, 19, 23 This list encompasses medical conditions that have occurred in-flight as well as medical conditions that have the potential to occur based on subject matter expertise.

Conditions are further defined by best- or worst-case outcomes, which bound the clinical outcome uncertainty. 23 Best-case events are those that present in the mild-moderate spectrum of the condition, whereas worst-case events are those where presentation is in the severe spectrum of the condition. Incidence values for each IMM condition and best- or worst-case outcomes are determined, when available, using in-flight medical data from U.S. astronauts only. It is important to note that when such data are unavailable, evidence-based literature from analog populations or information from event-driven numerical simulations is substituted. 23, 30, 36

Although the IMM evidence base includes all in-flight medical conditions with additional source data from Apollo, Skylab, Mir, and Shuttle programs, it was baselined to the medical capabilities of the ISS as described above. Thus, model limitations include a framework that is defined by ISS operational capabilities and medical resources. Model outputs can be influenced by the availability of resources: resources can be defined as inexhaustible (e.g. in a scenario where resource resupply is available); alternatively, resources can have established and exhaustible limits, altering the likelihood of successful management of medical conditions and introducing the potential for untreated conditions. Model outputs include estimates of three parameters of interest:

1. Probability of evacuation (pEVAC), defined as the point at which onboard medical capabilities are exhausted or surpassed and evacuation (EVAC) of the affected crewmember for definitive treatment would be indicated (if available). Specifically, EVAC is defined as an end-state model output, and is specified on a case-by-case basis, given the listed medical condition, based on whether a crewmember would: a) experience high risk of mortality; b) suffer significant and permanent impairment; or c) be at high risk of intractable pain without rapid and definitive intervention that is unavailable aboard the ISS. When EVAC criteria are met, no consideration is given by the IMM regarding the availability of a return vehicle or the likelihood of a successful clinical outcome if the crewmember is successfully evacuated. EVAC is considered “emergent” if the severity of injury or illness suggests that a crewmember should be evacuated within 24 h of condition onset to improve the clinical expectation of a positive health outcome;
2. Probability of loss of crew life (pLOCL), which should be interpreted to mean that the clinical scenario resulted in death of the afflicted crewmember despite any intervention (including evacuation for definitive care);
3. Quality-adjusted time lost (QATL) during the DRM, a product of estimated functional impairment resulting from an injury or illness and the time interval of mission impairment. 23, 30

The IMM uses stochastic (random) processes via Monte Carlo simulation (mathematical modeling by probability distribution) in a three-step approach. First, mission and crewmember characteristics are specified to define a particular mission profile or DRM. Next, medical events, treatments, and outcomes during the spaceflight mission are randomly generated on the basis of predefined values and probability distributions. Once a condition occurs, it will follow either a best- or a worst-case scenario based on a probability distribution. Worst-case medical event scenarios generally require more resources for treatment and have higher probabilities of ending in negative outcomes. In the final step, crew health and medical outcomes are summarized. For this study, the primary model outcomes are QATL, pEVAC, and pLOCL.

To demonstrate the utility in using predictive quantitative estimates of spaceflight medical risk for the ISS Program, the outcomes of two ISS DRMs were assessed. These IMM results were compared to previous ISS PRA model calculations for ISS medical risk numbers (ISS PRA v2.1.1), as well as analysis of medical event rates within the astronaut population 44 to identify any disparity of IMM results from these expert-based estimations. Additionally, forecasted IMM risk numbers were correlated to actual medical event statistics from previous medical events during human spaceflight and comparable medical incidence rates in analog populations to identify whether this approach reflects actual risk of crew health events aboard the ISS.

## Methods

### Procedure

Two ISS DRMs were simulated using version three (V3) of the IMM, with data from the IMM database version iMED_20151118 (IMM Service Request number S-20,151,123-341). DRM simulations require definition of number of crewmembers, sex of crewmembers, crewmember medical histories, and number of EVAs, which correlates with the potential for EVA-related injuries. Both DRMs were 6 mo in duration with six crewmembers (one woman, five men) and included three planned EVAs with two crewmembers participating in each. All IMM conditions (Table I) were included in the IMM simulation. Current medical capabilities on the ISS were used for reference. In DRM1, baseline ISS medical capabilities were simulated with no available resupply; in this scenario, supplies are eventually depleted, and the potential exists for medical conditions to go untreated. In DRM2, resupply was allowed, resulting in no depletion of

---

Table I. Medical Conditions in the IMM by Category.

|  ENVIRONMENTAL | MEDICAL ILLNESS, Continued  |
| --- | --- |
|  Acute Radiation Syndrome | Anxiety  |
|  Altitude Sickness | Appendicitis  |
|  Barotrauma (ear/sinus block) | Atrial Fibrillation/Atrial Flutter  |
|  Burns secondary to Fire | Back Pain (space adaptation)  |
|  Decompression Sickness (secondary to EVA) | Behavioral Emergency  |
|  Eye Chemical Burn | Cardiogenic Shock secondary to Myocardial infarction  |
|  Headache (CO2 induced) | Choking/Obstructed Airway  |
|  Smoke Inhalation | Constipation (space adaptation)  |
|  Toxic Exposure: Ammonia | Dental: Exposed Pulp  |
|  INJURY/TRAUMA | Dental Caries  |
|  Abdominal Injury | Dental: Abscess  |
|  Acute Compartment Syndrome | Dental: Crown Loss  |
|  Ankle Sprain/Strain | Dental: Filling Loss  |
|  Back Sprain/Strain | Depression  |
|  Chest Injury | Diarrhea  |
|  Dental: Avulsion (tooth loss) | Eye Corneal Ulcer  |
|  Elbow Dislocation | Eye Infection  |
|  Elbow Sprain/Strain | Gastroenteritis  |
|  Eye Irritation/Abrasion | Headache (late)  |
|  Eye Penetration (foreign body) | Headache (space adaptation)  |
|  Finger Dislocation | Hearing Loss  |
|  Fingernail Delamination (secondary to EVA) | Hemorrhoids  |
|  Head Injury | Herpes Zoster Reactivation  |
|  Hip Sprain/Strain | Hypertension  |
|  Hip/Proximal Femur Fracture | Indigestion  |
|  Knee Sprain/Strain | Influenza  |
|  Lower Extremity Stress Fracture | Insomnia (space adaptation)  |
|  Lumbar Spine Fracture | Medication Overdose/Adverse Reaction  |
|  Neck Sprain/Strain | Mouth Ulcer  |
|  Neurogenic Shock | Nasal Congestion (space adaptation)  |
|  Paresthesia (secondary to EVA) | Nephrolithiasis  |
|  Shoulder Dislocation | Nosebleed (space adaptation)  |
|  Shoulder Sprain/Strain | Otitis Externa  |
|  Skin Abrasion | Otitis Media  |
|  Skin Laceration | Pharyngitis  |
|  Traumatic Hypovolemic Shock | Respiratory Infection  |
|  Wrist Fracture | Retinal Detachment  |
|  Wrist Sprain/Strain | Seizures  |
|  MEDICAL ILLNESS | Sepsis  |
|  Abdominal Wall Hernia | Skin Infection  |
|  Abnormal Uterine Bleeding | Skin Rash  |
|  Acute Angle-Closure Glaucoma | Sleep Disorder  |
|  Acute Arthritis | Small Bowel Obstruction  |
|  Acute Cholecystitis/Biliary Colic | Space Motion Sickness (space adaptation)  |
|  Acute Diverticulitis | Stroke (Cerebrovascular Accident)  |
|  Acute Pancreatitis | Sudden Cardiac Arrest  |
|  Acute Prostatitis | Urinary Incontinence (space adaption)  |
|  Acute Sinusitis | Urinary Retention (space adaptation)  |
|  Allergic Reaction (mild to moderate) | Urinary Tract Infection  |
|  Anaphylaxis | Vaginal Yeast Infection  |
|  Angina/Myocardial Infarction | Visual Impairment and Increased Intracranial Pressure (VIIP) (space adaptation)  |

supplies and full treatment of all medical events to the extent of ISS capabilities. The untreated scenario, with no medical resources, was also simulated.

## Statistical Analysis

A total of 100,000 trials were run for each DRM; each trial can be considered an individual simulated "mission." pEVAC and pLOCL are expressed as the probability of that outcome for a given trial. The number of trials was selected to ensure that

the distribution of outcomes converges to $\leq 5\%$ change in the standard deviation of any primary model outcome; $95\%$ confidence intervals (CI) for pEVAC and pLOCL were obtained using joint parameter bootstrap resampling of the simulation output using percentiles. Significance was assessed using $95\%$ CI between compared outcomes. Distributions of the percentages of QATL were obtained for the two DRMs, as well as the untreated DRM scenario, a simulation in which no resources are available.



---

The assessment of these IMM results falls within the scope of the IMM.³³ The IMM simulation and analysis described herein are appropriate relative to its intended use and within the assumptions, limitations, and constraints of the model²⁹ with no violations. In IMM V3, there are no correlations among medical conditions, and crewmembers may be assigned more than one end-state of EVAC or loss of crew life (LOCL) during the same mission. In addition, the IMM V3 does not include a mission timeline; all conditions are assumed to occur on day one of any simulated mission. In simulations where medical resupply is limited, any event that exceeds available resources during the course of treatment is considered untreated. The IMM does not consider the availability of any medical capabilities from the Russian operating system or from personal supplies of any crewmember.

These assumptions may result in slightly high (conservative) forecasts for the occurrence of either outcome. Finally, conditions are treated in order of highest-to-lowest incidence and by arbitrarily assigned crewmember number.

# RESULTS

ISS medical risk predictions by the IMM for DRM1 (no resupply) and DRM2 (resupply available) are described below. pEVACs and pLOCLs for the two DRMs are provided in Fig. 1.

Overall predicted pEVACs are higher in DRM1 than in DRM2. This increase is reflected in the three listed medical condition categories as well (medical illness, injury or trauma, and

![img-0.jpeg](img-0.jpeg)

![img-1.jpeg](img-1.jpeg)

Fig. 1. Probability outcomes and 95% confidence intervals of A) evacuation (EVAC) and B) loss of crew life (LOCL) for Design Reference Mission (DRM) scenarios. DRM1 (no resupply) and DRM2 (resupply available) are shown as well as contributions for these two DRMs from the three contributing medical condition categories: Medical (Medical Illness), Trauma (Injury/Trauma), and Environment (Environmental).



---

environmental causes). pLOCLs demonstrate similar outcomes with higher values for DRM1 than DRM2. Fig. 2 shows that only one crewmember experiences EVAC or LOCL in the majority of simulated trials in which EVAC or LOCL occurs in either DRM. Most trials, however, yielded no EVAC or LOCL events in either DRM (Fig. 2).

Influential medical conditions by rank for nonemergent and emergent EVAC in DRM1 (no resupply) and DRM2 (resupply available) are shown in Table II and Table III. Conditions of higher rank have greater contribution to the end state values.

Medical illnesses are associated with the greatest percentage of EVAC in both DRM1 and DRM2 (Fig. 1, Table II, Table III). Overall, the most frequent medical illnesses leading to EVAC in DRM1 are skin infection, visual impairment and increased intracranial pressure (VIIP, now classified as Spaceflight Associated Neuro-ocular Syndrome [SANS]²⁴), dental abscess, herpes zoster, and nephrolithiasis. In the injury or trauma category, lower-extremity stress fracture, finger dislocation, and skin laceration are most frequent. For the environmental causes category, eye chemical burn and burns secondary to fire are most frequent. Overall, the most frequent medical illnesses leading to EVAC in DRM2 are VIIP, dental abscess,

![img-2.jpeg](img-2.jpeg)

![img-3.jpeg](img-3.jpeg)
Fig. 2. Frequency of A) evacuation (EVAC) and B) loss of crew life (LOCL) per 100,000 trials for Design Reference Mission (DRM) scenarios DRM1 (no resupply) and DRM2 (resupply available).

nephrolithiasis, sepsis, stroke, atrial fibrillation/atrial flutter, and angina/myocardial infarction. In the injury or trauma category, wrist fracture and traumatic hypovolemic shock are most frequent. For the environmental category, smoke inhalation predominates. Considering all influential conditions contributing to EVAC in DRM1 conditions, the IMM estimates the likelihood of emergent EVAC at 3.36% of all medical events (22% of events leading to EVAC as an outcome), compared to 1.80% under DRM2 conditions (36% of events leading to EVAC outcome). Worst-case scenarios contributed the highest percentage of EVAC outcomes for both DRM1 (78%) and DRM2 (87%). Similarly, worst-case scenarios contributed the highest percentage of LOCL outcomes for DRM1 (89%); all LOCL outcomes for DRM2 resulted from worst-case scenarios of medical conditions.

Influential medical conditions by rank for LOCL in DRM1 and DRM2 are shown in Table IV and Table V. The most frequent medical illness conditions leading to LOCL in both ISS DRMs are sepsis, medication overdose/adverse reaction, stroke, and appendicitis. For the injury or trauma category, traumatic hypovolemic shock, chest trauma, and head injury are the most frequent. In the environmental category, smoke inhalation and toxic exposure due to ammonia predominate. The ramifications and context of these results are discussed below.

The percentage of QATL during an ISS 6-mo mission is shown for three DRMs in Fig. 3. Comparing the percent distribution of trials for DRM1 (no resupply) to that of DRM2 (resupply available) reveals a slight shift toward increased QATL; however, these two DRMs are more similar to each other than to the untreated DRM scenario with respect to the percentage of QATL during a 6-mo ISS mission.

# DISCUSSION

Although the QATLs associated with DRM1 and DRM2 are similar (Fig. 3), DRM2 provides a more realistic estimate of pEVACs and pLOCLs than DRM1 because it more accurately reflects regular ISS resupply and eliminates the model limitations associated with depletion of medical resources. The 5.0% risk of EVAC for 6-mo missions with 6-person crews (DRM2, Fig. 1A) translates into a calculated rate of 0.017 events/person-years (0.05 events/3 person-years). While there has never been an evacuation of a U.S. crewmember from a spaceflight mission, there have been three medical evacuations in the Russian space program (prior to the ISS program)⁴,⁵: two due to medical illnesses (sepsis from urinary tract infection¹⁷ and cardiac dysrhythmia⁹), and one for intractable headaches due to smoke inhalation from an onboard combustion event.⁴⁰,³⁵,³⁷ Using mission data through ISS Expedition 49,⁴³ total human spaceflight time (including data from the U.S., Russia, and international partners) is 136.2 person-years, yielding an EVAC rate of 0.022 evacuations per person-year of flight (3 evacuations/136.2 person-years). There have also been three near-evacuations, in which medical evacuations were being considered but were ultimately not required due to



---

Table II. Influential Medical Conditions Contributing To ~80% EVAC DRM1 (No Resupply).

|  RANK | CASE | TREATED | MEDICAL CONDITION | CATEGORY | EMERGENT | CONTRIBUTION (%)  |
| --- | --- | --- | --- | --- | --- | --- |
|  1 | Best | Untreated | Eye Chemical Burn | Environment |  | 15.473  |
|  2 | Worst | Untreated | Skin Infection | Medical |  | 14.211  |
|  3 | Worst | Treated | VIIP* (Space Adaptation) | Medical |  | 7.827  |
|  4 | Worst | Untreated | Eye Chemical Burn | Environment | Yes | 6.384  |
|  5 | Worst | Untreated | Dental Abscess | Medical |  | 4.803  |
|  6 | Worst | Untreated | Lower Extremity Stress Fracture | Trauma |  | 4.616  |
|  7 | Worst | Untreated | Herpes Zoster Reactivation | Medical |  | 4.422  |
|  8 | Best | Untreated | Finger Dislocation | Trauma |  | 4.064  |
|  9 | Worst | Untreated | Skin Laceration | Trauma | Yes | 2.672  |
|  10 | Best | Untreated | Dental Abscess | Medical |  | 2.223  |
|  11 | Best | Untreated | Burns Secondary To Fire | Environment |  | 2.188  |
|  12 | Worst | Treated | Dental Abscess | Medical |  | 1.808  |
|  13 | Worst | Treated | Nephrolithiasis | Medical | Yes | 1.506  |
|  14 | Worst | Untreated | Dental Exposed Pulp | Medical |  | 1.427  |
|  15 | Worst | Treated | Smoke Inhalation | Environment | Yes | 1.307  |
|  16 | Worst | Untreated | Otitis Externa | Medical |  | 1.074  |
|  17 | Best | Untreated | Nephrolithiasis | Medical |  | 1.074  |
|  18 | Worst | Treated | Sepsis | Medical | Yes | 1.046  |
|  19 | Worst | Untreated | Neck Sprain/Strain | Trauma |  | 1.000  |
|  20 | Worst | Untreated | Nephrolithiasis | Medical | Yes | 0.972  |

improvement of the medical condition. Two of these conditions were medical illnesses (nephrolithiasis $^{12}$ and dental abscess $^{14,15}$ ), and one was a toxic exposure (ethylene glycol $^{6}$ ). Nephrolithiasis and dental abscess are forecasted in DRM2 as potential causes of EVAC (Table III). Although toxic exposure is also forecasted by the IMM in DRM2 as an influential condition leading to evacuation, it was not a major contributor (0.76% contribution). Of the three diagnoses leading to actual evacuation (urosepsis, dysrhythmia, and headache), one was deemed emergent (urosepsis); this is consistent with the IMM DRM2 forecasted emergent pEVAC of 1.8% out of a total 5.0% likelihood of EVAC, or a 36% likelihood that IMM-predicted EVAC would be emergent.

Starting in 2011, the ISS PRA model incorporated the results of the IMM so that medical risk results would be included among other predicted ISS safety-related risks and thus a fully integrated risk posture could be communicated to the ISS Program. $^{13}$ Before the IMM was employed, risks of EVAC and

LOCL due to medical events in the ISS Program were based on model calculations of 0.0035 and 0.0017 for pEVAC and pLOCL, respectively (ISS PRA v2.1.1), and thus were underreported. Previous subject matter expert estimates for spaceflight medical evacuation rates (before development of the IMM) were based on analysis of medical event rates within the astronaut population, both during flight and during terrestrial operations, as well as medical event rates in analog populations.[44] These estimates have ranged from 0.01 to 0.06 events per person-year.

Data from populations exposed to spaceflight analog conditions, such as staff members at Antarctic research stations, can be used to validate IMM estimates of pEVACs and pLOCLs for ISS missions. The medical emergency rate in the general U.S. population is estimated to be approximately 0.06 events per person-year.[44] However, this rate may not be directly applicable to the current ISS Program because of population disparity, as the U.S. astronaut corps is highly screened and age limited, and

Table III. Influential Medical Conditions Contributing to ~80% EVAC DRM2 (Resupply Available).

|  RANK | CASE | TREATED | MEDICAL CONDITION | CATEGORY | EMERGENT | CONTRIBUTION (%)  |
| --- | --- | --- | --- | --- | --- | --- |
|  1 | Worst | Treated | VIIP (Space Adaptation) | Medical |  | 28.261  |
|  2 | Worst | Treated | Dental Abscess | Medical |  | 14.421  |
|  3 | Worst | Treated | Nephrolithiasis | Medical | Yes | 8.451  |
|  4 | Worst | Treated | Sepsis | Medical | Yes | 4.536  |
|  5 | Worst | Treated | Smoke Inhalation | Environment | Yes | 4.516  |
|  6 | Worst | Treated | Wrist Fracture | Trauma |  | 3.237  |
|  7 | Worst | Treated | Stroke | Medical | Yes | 1.977  |
|  8 | Best | Treated | Atrial Fibrillation/ Atrial Flutter | Medical |  | 1.919  |
|  9 | Worst | Treated | Back Sprain/Strain | Trauma |  | 1.880  |
|  10 | Worst | Treated | Hip/Proximal Femur Fracture | Trauma | Yes | 1.841  |
|  11 | Best | Treated | Stroke | Medical |  | 1.706  |
|  12 | Best | Treated | Angina/Myocardial Infarction | Medical |  | 1.667  |
|  13 | Worst | Treated | Traumatic Hypovolemic Shock | Trauma | Yes | 1.512  |
|  14 | Best | Treated | Seizures | Medical |  | 1.434  |
|  15 | Worst | Treated | Medication Overdose/Adverse Reaction | Medical | Yes | 1.279  |
|  16 | Worst | Treated | Head Injury | Trauma | Yes | 1.260  |



---

Table IV. Influential Medical Conditions Contributing to ~90% LOCL DRM1 (No Resupply).

|  RANK | CASE | TREATED | MEDICAL CONDITION | CATEGORY | CONTRIBUTION (%)  |
| --- | --- | --- | --- | --- | --- |
|  1 | Worst | Treated | Sepsis | Medical | 16.080  |
|  2 | Worst | Treated | Traumatic Hypovolemic Shock | Trauma | 11.725  |
|  3 | Worst | Untreated | Sepsis | Medical | 8.375  |
|  4 | Worst | Treated | Medication Overdose/Adverse Reaction | Medical | 8.208  |
|  5 | Worst | Treated | Stroke | Medical | 8.040  |
|  6 | Worst | Treated | Smoke Inhalation | Environment | 7.203  |
|  7 | Worst | Treated | Head Injury | Trauma | 4.020  |
|  8 | Worst | Untreated | Acute Diverticulitis | Medical | 3.685  |
|  9 | Best | Untreated | Appendicitis | Medical | 3.350  |
|  10 | Worst | Treated | Chest Injury | Trauma | 3.350  |
|  11 | Worst | Treated | Appendicitis | Medical | 3.183  |
|  12 | Worst | Untreated | Chest Injury | Trauma | 2.848  |
|  13 | Worst | Treated | Toxic Exposure: Ammonia | Environment | 2.178  |
|  14 | Best | Untreated | Sepsis | Medical | 1.675  |
|  15 | Worst | Treated | Sudden Cardiac Arrest | Medical | 1.675  |
|  16 | Worst | Untreated | Smoke Inhalation | Environment | 1.508  |
|  17 | Worst | Untreated | Acute Pancreatitis | Medical | 1.340  |
|  18 | Worst | Untreated | Traumatic Hypovolemic Shock | Trauma | 1.340  |
|  19 | Worst | Untreated | Appendicitis | Medical | 1.173  |

undergoes regular examination and preventive medicine interventions to ensure the highest level of health and fitness. $^{18,22}$ Antarctic stations are useful analogs because the conditions of isolation, confinement, and extreme environment are similar to some of the conditions faced by astronauts, and medical resources at stand-alone medical care facilities are limited. $^{27,28,36}$ Antarctic McMurdo Station medical evacuation rates from 1992 to 1996, during 5 summer deployments of 4 mo each, were reported as 0.036 events per person-year. $^{3,21}$ Analysis of more recent data resulted in a medical evacuation rate of 0.01 events per person-year from U.S. Antarctic stations from 2013 to 2014. $^{38}$ These evacuation rates are similar to the evacuation rate predicted by the IMM for DRM2 (0.017 events/person-year). However, while Antarctic populations are screened to ensure sufficient medical status to maintain operational capability for the duration of deployment, it should be noted that there are significant population disparities between Antarctic workers and the astronaut corps, including variable body habitus, more frequent comorbidities, and wider ranges of age and permissible fitness level in the Antarctic population. $^{38}$

U.S. military submarine crews are another useful analog population, particularly as military populations are similar to the astronaut corps with respect to screening, health status, and fitness levels, and they have similar resources used to maintain health. As with space operations, submarine operations

utilize stand-alone medical care capabilities in an isolated and remote environment. U.S. submarine medical evacuation rates from 1993 to 1996 ranged from 0.023 to 0.028 events per person-year. $^{2,41}$

The Lifetime Surveillance of Astronaut Health (LSAH) program collects data on the health status of active and retired astronauts. $^{16,18}$ A retrospective review of LSAH data conducted in 1999 estimated the incidence of terrestrial illness and injury among astronauts; these data were translated to potential spaceflight mission impact by estimations of severity and likelihood of evacuation if the medical event had occurred on the ISS. $^{3,44}$ The anticipated medical evacuation incidence, on the basis of this review, was estimated to be 0.02 events per person-year; the estimate was further reduced to 0.01 events per person-year based on an assumption that the ISS health maintenance system could manage less severe medical conditions. $^{3,44}$ Earlier reviews of astronaut data for the planned Space Station Freedom program provided subject matter expert evacuation rate estimates from 0.01 to 0.03 per person-year. $^{4}$

The IMM forecasts a pLOCL of 0.0046 for DRM2 (Fig. 1B), a six-person, 6-mo mission, which translates to 0.0015 events per person-year (0.0046 events/3 person-years). The general population mortality rate is 0.0084 deaths per person-year. $^{31}$ The average age of current active astronauts is about 48 yr for men and 43 yr for women; the age-specific mortality rate is

Table V. Influential Medical Conditions Contributing to ~90% LOCL DRM2 (Resupply Available).

|  RANK | CASE | TREATED | MEDICAL CONDITION | CATEGORY | CONTRIBUTION (%)  |
| --- | --- | --- | --- | --- | --- |
|  1 | Worst | Treated | Sepsis | Medical | 25.107  |
|  2 | Worst | Treated | Traumatic Hypovolemic Shock | Trauma | 16.738  |
|  3 | Worst | Treated | Medication Overdose/Adverse Reaction | Medical | 10.944  |
|  4 | Worst | Treated | Stroke | Medical | 10.730  |
|  5 | Worst | Treated | Smoke Inhalation | Environment | 9.442  |
|  6 | Worst | Treated | Chest Injury | Trauma | 5.365  |
|  7 | Worst | Treated | Appendicitis | Medical | 5.150  |
|  8 | Worst | Treated | Head Injury | Trauma | 5.150  |
|  9 | Worst | Treated | Toxic Exposure: Ammonia | Environment | 3.863  |



---

![img-4.jpeg](img-4.jpeg)
Fig. 3. Percentage of quality adjusted time lost (QATL) shown as a percent distribution of 100,000 trials for three Design Reference Mission (DRM) scenarios: black bar = DRM1 (no resupply); medium grey bar = DRM2 (resupply available); light grey bar = untreated DRM.

IP: 173.44.55.70 On: Tue, 17 Mar 2020 08:29:49

0.0038 events per person-year for a 48-yr-old man and 0.0016 events per person-year for a 43-yr-old woman.[31] The IMM-forecasted pLOCLs are comparable with these age-specific mortality rates. Comparing them to health- and age-similar populations, the average all-cause mortality rate for active-duty U.S. military personnel was 0.00052 deaths per person-year during the peacetime years of 1997–2000.[11] U.S. astronaut mortality data may be most useful for estimating mortality rates for astronauts on ISS missions. As of May 31, 2015, excluding all occupational accidents (including Space Shuttle Challenger, Space Shuttle Columbia, and Apollo 1 mishaps, and aircraft accidents), the astronaut career mortality rate is 0.0014 events per person-year.[25] Thus, IMM DRM2 forecasted mortality rates are similar to terrestrial mortality rates within the astronaut population and all-cause mortality rates for military personnel. IMM-predicted pLOCLs are estimations of mortality risk from in-flight medical emergencies. There has never been a U.S. crewmember death during spaceflight excluding those related to occupational mishaps.[25] The low forecasted pLOCL of less than 0.5% is thus not unreasonable in the context of zero in-flight events and the above terrestrial analog values.

IMM-forecasted influential medical conditions for LOCL are not unreasonable, but these results need to be interpreted within appropriate context and should not be considered all-inclusive. In the environmental category, smoke inhalation and toxic exposure due to ammonia are the top two conditions predicted to lead to LOCL (Tables IV and V). This was not surprising given the in-flight smoke inhalation event leading to EVAC described above,[35,37,40] and the fact that there have been several NASA reports of ISS ammonia leaks, notably a NASA Station Status report of 5.12.2013[34] when an unscheduled EVA was conducted to inspect and replace an ISS component leaking ammonia. Traumatic hypovolemic shock, chest trauma, and head injury are the most frequently predicted medical conditions in the injury or trauma category (Tables IV and V). Initially, these medical conditions may seem unlikely in a microgravity environment, especially since they have yet to occur during spaceflight. However, considering anecdotal reports of astronauts getting into "tight spots" while moving massive ISS components with high inertia in tight quarters, they become more plausible. It is important to remember that current model data come from terrestrial experience with these and a subset of other IMM medical conditions. These terrestrial data drive the



---

model output results in the absence of in-flight data and should be interpreted accordingly within this context. For example, although the pEVACs and pLOCLs secondary to traumatic hypovolemic shock are relatively low (about 1 in 1, 333 and 1 in 1300, respectively), these estimates may be significantly higher than reality because the approach used was to estimate the likelihood of traumatic hypovolemic shock in the ISS spaceflight environment using data from a higher risk terrestrial population and environment for traumatic hypovolemic shock. That said, the potential for these conditions should not be dismissed; it remains to be seen whether space mission activities, including EVA, are sufficiently benign that they will never be encountered. The most frequent forecasted medical illness conditions leading to LOCL are sepsis, medication overdose/adverse reaction, stroke, and appendicitis. A documented case of urosepsis in a cosmonaut leading to EVAC was described above,17 and in the astronaut population, an Apollo astronaut had symptoms consistent with a urosepsis diagnosis which “could have resulted in a serious inflight illness if the mission had lasted 24 hours longer.”20 Pharmacovigilance to prevent medication overdose/adverse reaction is a terrestrial concern45 as well as concern for spaceflight. Use of pharmaceuticals by U.S. astronauts and associated medication side effects have been documented,39 including medications with potentially serious side effects such as sleep medications.26 Although no in-flight cases of stroke or appendicitis have been documented in U.S. astronauts, there have been two cases of transient ischemic attacks and two cases of appendicitis in preflight mission-ready active astronauts10 so these medical conditions, while rare, are not out of the realm of possibility for in-flight occurrence. Additionally, more recent in-flight medical events have occurred that have not been accounted for directly by the IMM, such as the near-drowning event.32 Thus, forecasted spaceflight model results should be carefully interpreted by subject matter experts within the context of model limitations listed below.

As cited above, there are numerous limitations to model predictions of in-flight evacuation and mortality risk. At the time of this review, about 230 astronauts have visited the ISS, providing only a limited sample size for the extraction of incidence rates and the observation of health-related events. In addition, the model is built using terrestrial data sources from which in-flight data are unavailable. Terrestrial incidence of medical events would be expected to differ from spaceflight incidence because of the increased baseline health status of astronauts; careful screening, selection, and mission assignment; frequent health screening; stringent flight rules to ensure operational safety; and similar protections in place for astronauts. Additionally, some conditions are unique to spaceflight or altered due to the spaceflight environment. These disparities may account for the differences between IMM-predicted incidence and actual real-world medical event rates and the lack of evacuation need or crew mortality in ISS mission history. These differences between the model and the real-world system may indicate the relative success of medical intervention programs designed for early identification, mitigation, and maintenance of health as implemented by NASA's preventive medicine program. Finally, comparative real-world data are limited by reporting of crew or flight surgeons and data collection methods, which have been variable over the history of the ISS, and further limited by selection of best-approximation analog environments such as military or remote operations. Each of these comparison populations differs in important ways from the astronaut corps, providing only limited comparative value.

George Box stated that “all models are wrong, but some are useful.” As is true of all models, the IMM currently relies on assumptions that result in an imprecise representation of the simulated real world system environment. For example, the model assumes that all potential medical conditions occur on the first day of flight and are correctly diagnosed, and all attempted treatments are 100% effective. DRMs employed in this effort had six crewmembers, including only one woman. In reality, success of diagnosis and treatment would depend on the skill and clinical acumen of the crew medical officer(s) and associated ground medical team, the availability of appropriate medical resources for diagnosis and intervention, the baseline health or potential comorbidities of the affected individual, and even numerous potential confounders related to the space environment and the physiological alterations of the human body during flight. Medical event rates would be expected to vary according to crew composition, or altered men:women ratios may alter both model prediction and actual real-life health outcomes. Finally, the IMM is incapable of predicting human resourcefulness or ingenuity in an emergency.

Despite these limitations, the IMM has been used to inform decision-making where previous efforts have had to rely on subject matter expert opinion and best-guess estimations. Examples include examining the need for vehicle resources (e.g. oxygen) on a mission, assessing the medical risk of flying a specific crewmember with a waivered medical condition, evaluating medical capability parameters with and without optimization for a given mission, and estimating the effect of a specific medical condition in the context of a given aspect of a mission (e.g. severe space motion sickness during docking). The ability to quantify risk on the basis of actual medical data provides a useful framework within which medical risk can be weighed against other mission risks. The IMM provides quantitative and objective data regarding the use of medical resources, likelihood of specific medical risks, and the impact of crewmember medical history; use of such data can help inform mission optimization strategies to protect crew health and minimize the risk of evacuation or adverse health outcomes.30 Future efforts including more robust, population-appropriate incidence data could help improve IMM capabilities. Future versions of IMM (e.g. Version 4.1) are intended to provide enhanced predictive capability by inclusion of a mission timeline, so that medical events may happen spontaneously at any time on a mission. Partial treatment capabilities and alternative use of medications will also be added to address some of the limitations discussed here. Further, adjustment of model inputs to reflect design parameters of missions, vehicles, crew composition, and medical resources of future, non-ISS missions may help improve the relevance of IMM outputs for non-ISS missions.

---

A comparison of the IMM outputs of pEVAC and pLOCL to empirical spaceflight data and analog population data suggests that the IMM outputs are comparable with actual experience. The medical conditions forecasted by the IMM as probable causes of EVAC on ISS missions are congruous with historical spaceflight medical events that have resulted in either medical evacuations or near-evacuation medical events. The pLOCL forecasted by IMM is also within the range of the estimated mortality rates based on historical spaceflight data and analog population data. While these predicted rates are only estimates of medical scenario outcomes during ISS missions, the IMM is a useful tool in providing quantifiable and objective data to subject matter experts to inform medical risk predictions and to provide context for efforts aimed toward optimizing crew health.

## ACKNOWLEDGMENTS

The authors gratefully acknowledge the contribution of past and present IMM Project team members to this work. Additionally, we would like to thank our reviewers from the Exploration Medical Capability Element of NASA's Human Research Program for insightful comments and critique, as well as thoughtful input from members of the LSAH group from NASA's Johnson Space Center. We would also like to extend our heartfelt thanks to Dr. Ashot Sargsyan and Sergey Galkin for their Russian translation skills of several primary reference sources for the cited medical events, as well as the ISS PRA Team and ISS Program members for their thoughtful review and continued collaborations.

Financial Disclosure Statement: The authors have no conflicts to declare.

Authors and affiliations: Marlei E. Walton, Ph.D., M.S.E., KBR, Houston, TX; and Eric L. Kerstman, M.D., M.P.H., University of Texas Medical Branch, Department of Preventive Medicine and Population Health, Galveston, TX.

## REFERENCES

1. Antonsen E, Bayuse T, Blue R, Daniels V, Hailey M, Hussey S, et al. Risk of adverse health outcomes and decrements in performance due to in-flight medical conditions. Houston (TX): National Aeronautics and Space Administration; 2017. Technical Paper No: NASA/JSC-20170004604.
2. Ball JR, Evans CH, editors. Safe passage: Astronaut care for exploration missions. Washington (DC): National Academy Press; 2001.
3. Barratt MR, Pool SL, editors. Principles of clinical medicine for space flight. New York: Springer; 2008.
4. Billica R, Lloyd C, Doam C. Proceedings of the Space Station Freedom Clinical Experts Seminar. Johnson Space Center: National Aeronautics and Space Administration; 1990. TR No: NASA-CP-10069.
5. Billica RD, Simmons SC, Mathes KL, McKinley BA, Chuang CC, et al. Perception of the medical risk of spaceflight. Aviat Space Environ Med. 1996; 67:467-473.
6. Burrough B. Dragonfly: NASA and the crisis aboard Mir. London: Fourth Estate; 1999.
7. Canga M, Shah R, Mindock J, Antonsen E. A strategic approach to medical care for exploration missions. Guadalajara, Mexico: 67th International Astronautical Congress; September 26-30, 2016, Guadalajara, Mexico. Paris: International Astronautical Federation; 2016.
8. Fitts M, Myers J, Kerstman E, Minard CG, Walton M, et al. Assessment of medical risks and optimization of their management using the Integrated Medical Model. Proceedings of the 59th International Astronautical Congress; 2008 September 29–October 3; Glasgow, Scotland. Paris, France: International Astronautical Federation; 2008. Paper ID: 2370.

9. Gazenko OG, Grigoriev AI, Bugrov SA, Yegorov A.D., Bogomolov VV, Kozlovskaya IB, et al. Review of medical research results from the second prime crew on space station Mir. Kosmicheskaya Biologiya I Aviakosmicheskaya Meditsina 1990; 24:3-11.
10. Gilkey KM, McRae MP, Griffin EA, Kalluri AS, Myers JG. Bayesian analysis for risk assessment of selected medical events in support of the integrated medical model effort. Cleveland (OH): NASA, Glenn Research Center; 2012. No: NASA/TP-2012-217120.
11. Goldberg MS. Death and injury rates of U.S. military personnel in Iraq. Mil Med. 2010; 175(4):220-226.
12. Goncharov IB, Kovachevich IV, Zhernavkov AF. Incidence of disease and injury in space. In: Nicogossian AE, Mohler SR, Gazenko OG, Grigoriev AI, editors. Space biology and medicine: Vol. IV, Health, Performance, and Safety of Space Crews, Chap. 5. Reston (VA): American Institute of Aeronautics and Astronautics, Inc.; 2004:86-97.
13. Grant W, Lutomski M. Applications of the International Space Station Probabilistic Risk Assessment Model. Houston (TX): NASA, Johnson Space Center; 2011.
14. Grechko G. Off-nominal situation. In: Start into the Unknown. Moscow: Pravda; 1989 [In Russian] [Accessed 29 June 2018]. Available from: https://testpilot.ru/espace/bibl/grechko/start/obl-grechko.html
15. Grechko G. Space dentistry. In: Cosmonaut No. 34: From Rushlight to Aliens. 2013. [In Russian] [Accessed 29 June 2018.] Available from http://flibusta.is/b/388503/read
16. Hamm PB, Nicogossian AE, Pool SL, Wear ML, Billica RD. Design and current status of the longitudinal study of astronaut health. Aviat Space Environ Med. 2000; 71:564-570.
17. Hendrickx B. Illness in orbit. Spaceflight (Lond). 2011; 53:104-109.
18. Institute of Medicine Committee on the Longitudinal Study of Astronaut Health, Review of NASA's Longitudinal Study of Astronaut Health. Washington (DC): National Academies Press; 2004.
19. Integrated Medical Model Project. Integrated Medical Model List of Medical Conditions. Houston, TX: NASA, Johnson Space Center; 2011. No: JSC-66109.
20. Johnston RS, Dietlein LF, Berry CA, editors. Biomedical Results of Apollo. Washington (DC): NASA; 1975.
21. Johnston SL, Arenare BA, Smart KT. Medical evacuation and vehicles for transport. [Ref. 25. Johnston, SL. Medical Care at the South Pole. Presentation. 1st "Pushing the Envelope" Conference, University of Texas Medical Branch, Department of Preventive, Occupational and Environmental Medicine, Nassau Bay Hilton, Clear Lake, TX, 1998.] In: Barratt MR, Pool SL, editors. Principles of clinical medicine for space flight. New York: Springer; 2008:139-161.
22. Johnston SL, Blue RS, Jennings RT, Tarver WJ, Gray GW. Astronaut Medical Selection during the Shuttle Era: 1981-2011. Aviat Space Environ Med. 2014; 85(8):823-827.
23. Keenan A, Young M, Saile L, Boley L, Walton M, et al. The Integrated Medical Model: A Probabilistic Simulation Model Predicting In-flight Medical Risks. In: 45th International Conference on Environmental Systems. July 12-16, 2015, Bellevue, WA. ICES; 2015
24. Lee AG, Mader TH, Gibson CR, Tarver W. Space flight-associated neuroocular syndrome. JAMA Ophthalmol. 2017; 135(9):992-994.
25. Lifetime Surveillance of Astronaut Health. NASA LSAH Data Request. Houston (TX): NASA, Johnson Space Center; 2015.
26. Locke J, Leveton L, Keeton K, Whitmire A, Patterson H, Faulk J. Survey of on-orbit sleep quality: short-duration flyers. Houston (TX): NASA; 2010.
27. Lugg D, Shepanek M. Space analogue studies in Antarctica. Acta Astronaut. 1999; 44(7-12):693-699.
28. Lugg DJ. Behavioral health in Antarctica: implications for long-duration space missions. Aviat Space Environ Med. 2005; 76(6, Suppl.):B74-B77.
29. Minard C, de Carvalho M. Integrated medical model assumptions and limitations. Houston (TX): NASA JSC; 2011. No: JSC-66116.
30. Minard CG, de Carvalho MF, Iyengar MS. Optimizing medical resources for spaceflight using the integrated medical model. Aviat Space Environ Med. 2011; 82(9):890-894.
31. Murphy SL, Xu J, Kochanek K, Curtin S, Arias E. Deaths: Final Data for 2015. Natl Vital Stat Rep. 2017; 66(6):1-75.



---

32. NASA. International Space Station (ISS) EVA Suit Water Intrusion High Visibility Close Call. 20Dec2013. Mishap Investigation Report No: IRIS Case Number: S-2013-199-00005.
33. NASA. Technical Standard for Models and Simulations 7009 (NASA-STD-7009). Washington (D.C.): NASA; 2008.
34. NASA. Astronauts Complete Spacewalk to Repair Ammonia Leak, Station Changes Command. Johnson Space Center: National Aeronautics and Space Administration; 2013. Feature. [Accessed 13 October 2019.] Available from https://www.nasa.gov/mission_pages/station/expeditions/expedition35/e35_051113_eva.html
35. NASA TM-75070. Basic Results of the Medical Research Conducted during the Flight of Two Crews on the Salyut-5 Orbital station. Washington (DC): NASA; 1977. NASA Technical Translation 1977.
36. Nelson ES, Lewandowski B, Licata A, Myers JG. Development and validation of a predictive bone fracture risk model for astronauts. Ann Biomed Eng. 2009; 37(11):2337-2359.
37. Nicogossian AE, Pool SL, Ulrich JJ, et al. Historical perspectives. In: Nicogossian AE, Huntoon CL, Pool SL. editors. Space physiology and medicine. Malvern (PA): Lea &amp; Febiger; 1993:3-49.
38. Pattarini JM, Scarborough JR, Lee Sombito V, Parazynski SE. Primary care in extreme environments: medical clinic utilization at Antarctic Stations, 2013-2014. Wilderness Environ Med. 2016; 27(1): 69-77.

39. Putcha L, Berens KL, Marshburn TH, Ortega HJ, Billica RD. Pharmaceutical use by U.S. astronauts on space shuttle missions. Aviat Space Environ Med. 1999; 70:705-708.
40. Rudnyi NM, Gazenko OG, Gozulov SA, Pestov ID, Vasilev PV. [Basic results of the medical research performed during the flight of 2 crews on the "Saliut-5" orbital station]. Kosm Biol Aviakosm Med. 1977; 11:33-41 [In Russian].
41. Sack D. U.S. Navy Atlantic submarine medical evacuations: 1993-1996, an epidemiologic assessment. [Abstract]. North Palm Beach (FL): Undersea and Hyperbaric Medicine; 1998. [Accessed 4 Feb 2020.] Available from: http://archive.rubicon-foundation.org/xmlui/handle/123456789/712.
42. Smith C. Probabilistic Risk Assessment for the International Space Station. In: Proceedings of Joint ESA-NASA Spaceflight Safety Conference; 11-14 June, 2002; Noordwijk, Netherlands. Noordwijk, NL: European Space Agency; 2002.
43. Spacefacts. Astronauts and Cosmonauts (sorted by "Time in Space"). [Accessed 30 November 2017.] Available from http://spacefacts.de/.
44. Summers RL, Johnston SL, Marshburn TH, Williams DR. Emergencies in space. Ann Emerg Med. 2005; 46(2):1771-1784.
45. World Health Organization Team. Safety of Medicines: A Guide to Detecting and Reporting Adverse Drug Reactions: Why Health Professionals Need to Take Action. Geneva: World Health Organization; 2002.

![img-5.jpeg](img-5.jpeg)
IP: 173.44.55.70 On: Tue, 17 Mar 2020 08:29:49
Copyright: Aerospace Medical Association
Delivered by Ingenta
