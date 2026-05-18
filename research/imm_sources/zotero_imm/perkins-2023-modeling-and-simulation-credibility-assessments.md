---
ref_id: zotero_TI9KLVR4
classification: zotero_imm
first_author: Perkins
year: 2023
title: "Modeling and simulation credibility assessments of whole-body finite element computational models for use in NASA extravehicular activity applications"
doi: 10.1080/10255842.2023.2293653
url: https://doi.org/10.1080/10255842.2023.2293653
zotero_key: TI9KLVR4
mcp_tool_used: zotero-pdf-ocr
fetched_utc: 2026-05-18T21:52:01Z
verified: true
pages: 15
spec_sections_supported:
  - "Section 9 V&V — NASA-STD-7009 eight-factor scoring applied to a whole-body finite-element computational human-body model"
notes: |
  Auto-OCRed from Diego's Zotero library (Task 29). See math_anchors
  for any verbatim quotes anchoring Selectron Iter-3 claims.
math_anchors:
  - "Peer-reviewed 2023 application of NASA-STD-7009 credibility-assessment factor scoring to a human-body biomechanical FE model — gives Selectron a worked V&V dossier template in a journal-quality artifact."
---

# Modeling and simulation credibility assessments of whole-body finite element computational models for use in NASA extravehicular activity applications

Richard A. Perkins, Christopher A. Gallo, Athena E. Ivanoff, Keegan M. Yates, Courtney M. Schkurko, Jeffrey T. Somers, Nathaniel J. Newby, Jerry G. Myers Jr. &amp; Raj K. Prabhu

To cite this article: Richard A. Perkins, Christopher A. Gallo, Athena E. Ivanoff, Keegan M. Yates, Courtney M. Schkurko, Jeffrey T. Somers, Nathaniel J. Newby, Jerry G. Myers Jr. &amp; Raj K. Prabhu (21 Dec 2023): Modeling and simulation credibility assessments of whole-body finite element computational models for use in NASA extravehicular activity applications, Computer Methods in Biomechanics and Biomedical Engineering, DOI: 10.1080/10255842.2023.2293653

To link to this article: https://doi.org/10.1080/10255842.2023.2293653

This work was authored as part of the Contributor's official duties as an Employee of the United States Government and is therefore a work of the United States Government. In accordance with 17 USC. 105, no copyright protection is available for such works under US Law.

Published online: 21 Dec 2023.

Article views: 312

View Crossmark data

View supplementary material

Submit your article to this journal

View related articles



---

# Modeling and simulation credibility assessments of whole-body finite element computational models for use in NASA extravehicular activity applications

Richard A. Perkins $^{a}$, Christopher A. Gallo $^{b}$, Athena E. Ivanoff $^{a}$, Keegan M. Yates $^{c}$, Courtney M. Schkurko $^{b}$, Jeffrey T. Somers $^{d}$, Nathaniel J. Newby $^{c}$, Jerry G. Myers, Jr. $^{b}$ and Raj K. Prabhu $^{d}$

$^{a}$Universities Space Research Association, Glenn Research Center, Cleveland, OH, USA; $^{b}$National Aeronautics and Space Administration, Glenn Research Center, Cleveland, OH, USA; $^{c}$KBR, Inc., Houston, TX, USA; $^{d}$National Aeronautics and Space Administration, Johnson Space Center, Houston, TX, USA

# ABSTRACT

Computational finite element (FE) models are used in suited astronaut injury risk assessments; however, these models' verification, validation, and credibility (VV&amp;C) procedures for simulating injuries in altered gravity environments are limited. Our study conducts VV&amp;C assessments of THUMS and Elemance whole-body FE models for predicting suited astronaut injury biomechanics using eight credibility factors, as per NASA-STD-7009A. Credibility factor ordinal scores are assigned by reviewing existing documentation describing VV&amp;C practices, and credibility sufficiency thresholds are assigned based on input from subject matter experts. Our results show the FE models are credible for suited astronaut injury investigation in specific ranges of kinematic and kinetic conditions correlating to highway and contact sports events. Nevertheless, these models are deficient when applied outside these ranges. Several credibility elevation strategies are prescribed to improve models' credibility for the NASA-centric application domain.

# ARTICLE HISTORY

Received 9 October 2023

Accepted 5 December 2023

# KEYWORDS

Finite element; credibility assessment; extravehicular activity; whole-body computational models

# 1. Introduction

Finite element (FE) models are computational tools that have been widely used for simulation-based investigations of human dynamic and traumatic injury mechanisms. The societal issues surrounding the concussion and the design of protective helmets in contact sports brought forth the effectiveness of FE models in studying human head injuries and designing helmets. In a number of these studies (Bastien et al. 2020; Bruneau and Cronin 2021), Commercially-Off-The-Shelf (COTS) whole-body FE models, such as GHBMC or THUMS, have been used to quantify the biomechanical responses of the human head and neck due to mechanical insults. These COTS models have been developed over several years through many calibrations, and Verification and Validation (V&amp;V) procedures to ensure they adequately simulate the real-world responses of highway and contact sport injury scenarios (Iwamoto et al. 2012; Untaroiu et al. 2013; Schwartz et al. 2015). The Modeling and Simulation (M&amp;S)

credibility assessment factors - V&amp;V, data and input parameter pedigree, simulation result sensitivities, model results' Uncertainty Quantification (UQ), and model use history - are essential to the FE modeling and simulation development process. They are vital to ensure that an FE model is credible in the intended application domain - highway and contact sports applications in cases of the Elemance and THUMS models.

Within the NASA ecosystem, FE models are widely utilized for design and mission-based applications to predict failure mechanisms of aerospace and aeronautical structures or injury metrics for suited crew members. Here, FE models inform NASA decision-makers regarding design or process flaws, failure risks, and insight into how to prevent accidents or injuries from occurring in future missions. As NASA prepares for future missions to the Moon and Mars as part of the Artemis program, quantitative information is being collected to ensure crew safety, vehicular design, and mission planning. In preparation for these future missions, NASA has been using COTS simplified pedestrian and occupant versions of



---

whole-body FE models -- Elemance and THUMS -- to study and quantify potential injury modalities suited astronauts might encounter during training or in mission. In this regard, M&S credibility assessment procedures, as mentioned above, play a critical role in evaluating the credibility of FE models for application in suited astronaut injury investigations.

Credibility standards have been previously proposed for assessing computational models such as the ASME V&V 40 standard, (ASME 2006) the NIH's ten rules for performing M&S credibility practices (Erdemir et al. 2020), and FDA's guidance for qualification of medical device development tools (Food & Drug Administration 2017). These credibility guidances were created to serve researchers through a standardized methodology and suggested guidelines for assessing a given model's M&S capabilities within a specific context of application. Within NASA, subsequent to the Columbia accident investigation that led to standardization of credibility assessments of computational models used in NASA-centric designs and informed decision-making, additional credibility assessment criteria (or credibility factors) for the traceability of experimental data utilized in defining model initial and boundary conditions, model use and history, model management, and people qualification were added (NASA Headquarters 2008). The NASA-STD-7009 was then revised and updated to NASA-STD-7009A, which features a similar V&V evaluation criteria as other credibility assessment standards (NASA Headquarters 2016). Akin to NASA-STD-7009, NASA-STD-7009A also includes credibility assessments of the inputted model parameters, understanding how any associated uncertainty or variance in model input parameter can affect M&S results, model use and history, and model management. However, people qualifications credibility factor is excluded from NASA-STD-7009A.

Currently, comprehensive M&S credibility assessments -- especially for NASA Extravehicular Activity (EVA)-centric astronaut injury biomechanics applications -- of THUMS or Elemance computational models is limited. Such assessments are needed to convey the credibility of these models within a NASA-related context of use. Additionally, these assessments inform of the credibility of the underlying modeling abstractions and assumptions that differ from on-Earth highway and contact sport applications, for which these COTS have been verified and validated. In this study, we evaluate the M&S credibility of two existing COTS whole-body FE models -- THUMS and the Elemance simplified pedestrian models.

Here, we present a methodology to quantify the credibility of these models for six of the eight factors outlined in the NASA-STD-7009A. More specifically, we focus on performing credibility assessments of THUMS and Elemance models for the Falling From Heights (FFH) EVA injury scenario. These credibility assessments are conducted for potential injury mechanisms identified within the FFH injury scenario. The injury mechanisms are based on documented clinical evidence and expert opinions from Subject Matter Experts (SMEs), internal and external to NASA. In this manuscript, the Methods section (Section 2) details the credibility assessment procedures. The results of our findings are described in the Results section (Section 3), a synthesis of assessments are given in the Discussion section (Section 4), and results summarized in the Conclusions section (Section 5). Lastly, evidence of the clinical information for the FFH injury scenario (A1.0), assessment methodology (A2.0), and documentations pertaining to the FE model's credibility assessments (A3.0) are presented in the Supplementary Material.

## Materials and methods

The credibility assessment process used in this study evaluates the M&S credibility of the aforementioned FE models in simulating injury mechanisms associated with FFH injury scenario. In this assessment, we evaluate the data and input pedigree, V&V, results uncertainty and robustness credibility factors in NASA-STD-7009A. Further, the V&V factors are subdivided by assessing code/solution verification and conceptual/referent validation credibility factors (see Supplemental Section A2.0 for details). A summary of the assessed credibility factors is shown in Table 1. Our implemented methodology is summarized by Figure 1. Firstly, suspected injury scenarios are defined by NASA EVA injury biomechanics SMEs based on a suited injury matrix, which is developed based on existing evidence (Reiber et al. 2022). Specifically, in this study the FE models are evaluated for a FFH injury scenario, which is classified as an EVA scenario within NASA contexts. Vertebral, lower limb, shoulder, and thorax injuries arising from this injury scenario are suspected to occur during instances of falling from the SpaceX Starship, (maximum height of 50 m) or falling into a crater on the lunar surface with a worst-case slope of 20 degrees.

For each of these injury mechanisms, an initial conceptual evaluation of the model is conducted to determine if the FE model consists of sufficient anatomical inclusions to capture the biomechanical response of the injury mechanisms. Insufficient anatomical

---

Table 1. NASA 7009 A credibility factors considered in this study and the corresponding descriptions.

|  Credibility factor | Data pedigree | Input pedigree | Code/Solution verification | Conceptual/Referent validation | Results uncertainty | Results robustness  |
| --- | --- | --- | --- | --- | --- | --- |
|  Credibility Sufficiency Threshold | 2 | 2 | 2 | 3 | 3 | 3  |
|  Model relations | Material properties | Input boundary conditions/contact | Verification analysis | Validation analysis | Uncertainty quantification | Sensitivity analysis  |
|  Description | Data supplying the conceptual implementation | Data supplying the boundary/initial conditions | Evidence the concept is implemented correctly | Evidence the concept resembles the real-world system of interest | Propagation of variations throughout the FE model for the input conditions and properties specified | Changes in the outputs of the simulation due to variations in the input and design of the FE model  |

representation results in an ordinal score of 0 for data pedigree and conceptual validation credibility factors. The ordinal scores vary between 0-4 for each credibility factor, with the scoring details shown in Supplemental Table 1. Credibility sufficiency thresholds for each factor are specified by NASA EVA SMEs (Figure 1) for the FFH injury scenario. In this study, credibility sufficiency thresholds of 2 are specified for data and input pedigree, and code and solution verification while a threshold score of 3 is specified for the conceptual and referent validation, results uncertainty and robustness. Information is assimilated from the published literature, NASA reports, and model developer provided documentation for evidence of the computational models' calibration, training, V&amp;V, credibility, model history, and management procedures. Based on evidence identified in this search, ordinal factor scores are assigned for each credibility factor within the injury mechanisms, using a weighted average approach detailed in the Supplementary Material A2.0 (Figure 1). For each of the FFH injury mechanisms, if the ordinal scores for the FE model achieves the threshold level, the FE models are considered reliable for simulating the FFH EVA injury scenario. If the resulting score is below the credibility sufficiency threshold, score elevation strategies are identified to achieve satisfactory credibility levels.

Details regarding each of these credibility factors can be found in the 7009 A standard documentation; however, a brief overview will be provided in this section. For the data and input pedigree factors, documentation which describes the traceability of the material properties and boundary conditions in the model is considered. Additionally, V&amp;V studies assess if the conceptual implementation is correctly formulated for the intended real-world scenario. For the FFH injury scenario considered in this study, an impact velocity range between  $0 - 15\mathrm{m / s}$  is defined by falling from the top of SpaceX Starship

lander (worst case impact velocity of  $12.8\mathrm{m / s}$ ) or falling into a crater (worst case impact velocity of  $2.06\mathrm{m / s}$ ), which is defined based on information reported by SMEs and derived by kinematic relationships. Based on the recommendations of computational modeling and EVA injury biomechanics SMEs, agreement between simulations and experiments within an acceptable uncertainty range (assumed to be approximately  $20\%$  difference) is used to define the credibility score for the responses. Additionally, it is recommended that impacts within  $20\%$  of the impact velocity used in the validation case correlate to this defined credibility score, with decreasing scores outside of this range. Within the referent validation credibility factor, impact velocities and loading directions are considered to define the factor scores. This is an appropriate assessment procedure based on the NASA standard for achieving an ordinal score of 3 (NASA Headquarters 2016). Finally, the credibility factor scores for results uncertainty and robustness are specified by literature which assesses changes or variations in the solutions by input parameter uncertainty or variance, respectively.

The factor scores for the FE models are depicted by comparing the ordinal factor scores (shown in 'yellow') against the sufficiency thresholds (shown in 'gray'). Also, these scores are compared to the elevated factor scores (shown in 'blue') in a separate figure. Finally, credibility ranges corresponding to the referent validation cases identified in literature for the FE models are shown through the histogram-type contour plots representing the credibility scores for each loading orientation (prone, supine, top, standing, lateral) and relevant impact velocities  $(0 - 15\mathrm{m / s})$

# 3. Results

This study presents M&amp;S credibility assessments of THUMS and Elemance FE models for simulating

---

![img-0.jpeg](img-0.jpeg)
Figure 1. Flow chart for the falls from height injury scenario credibility assessment performed in this study.

FFH injury mechanisms by evaluating 8 credibility factors. Scores are assigned for each of the credibility factors for injury mechanisms within the FFH scenario (Figures 2-9) and elevation strategies are summarized by Tables 2 and 3.

# 3.1. Vertebral injury mechanism

The credibility scores for the vertebral injury mechanism are shown for the FE models in Figure 3. Resultant credibility factor scores for the data pedigree, conceptual and referent validation, and results robustness factors

---

![img-1.jpeg](img-1.jpeg)
Credibility Threshold

![img-2.jpeg](img-2.jpeg)
Credibility Improvement

![img-3.jpeg](img-3.jpeg)
Figure 2. Results of the M&amp;S credibility assessment for the vertebral injury mechanism showing the ordinal credibility factor scores (a) and potential elevated credibility factor scores (b) for the Elemance model and the ordinal credibility factor scores (c) and potential elevated credibility factor scores (d) for the THUMS model.

![img-4.jpeg](img-4.jpeg)

![img-5.jpeg](img-5.jpeg)
Figure 3. Fall from heights injury scenario credibility heat map describing the impact velocity ranges assessed in the available literature for the Elemance (a) and THUMS (b) FE models in the vertebral injury mechanism.

![img-6.jpeg](img-6.jpeg)

are defined as 1 for Elemance and all other factor scores are set at 0 (Figures 2(a,b)). Further, credibility scores for THUMS regarding the data and input pedigree, conceptual validation, referent validation, and results robustness credibility factors are prescribed 1 (Figures 2(c,d)). The elevated credibility factor scores for

Elemance and THUMS are shown in Figure 2(b,d), respectively. The updated factor scores for Elemance are 1 for the input pedigree, 2 for the data pedigree, code and solution verification, results uncertainty and robustness, and 3 for the referent validation credibility factors (Figure 2(b), Table 2). Similarly, for THUMS, factor

---

![img-7.jpeg](img-7.jpeg)
Credibility Threshold

![img-8.jpeg](img-8.jpeg)
Credibility Score

![img-9.jpeg](img-9.jpeg)
Figure 4. Results of the M&amp;S credibility assessment for the lower limb injury mechanism showing the ordinal credibility factor scores (a) and potential elevated credibility factor scores (b) for the Elemance model and the ordinal credibility factor scores (c) and potential elevated credibility factor scores (d) for the THUMS model.

![img-10.jpeg](img-10.jpeg)

![img-11.jpeg](img-11.jpeg)
Figure 5. Falls from heights injury scenario credibility heat map describing the impact velocities ranges assessed in the available literature for the Elemance (a) and THUMS (b) FE models for the lower limb injury mechanism.

![img-12.jpeg](img-12.jpeg)

scores can be increased to values of 1 for the results uncertainty, 2 for the data and input pedigree, code and solution verification, and results robustness, and 3 for the conceptual and referent validation credibility factors

(Figure 2(d), Table 3). Figure 3 depicts a summary of the current Elemance (Figure 3(a)) and THUMS (Figure 3(b)) referent validation cases for impact conditions within the FFH injury scenario.

---

![img-13.jpeg](img-13.jpeg)
Credibility Threshold

![img-14.jpeg](img-14.jpeg)
Credibility Improvement

![img-15.jpeg](img-15.jpeg)
Figure 6. Results of the M&amp;S credibility assessment for the thoracic injury mechanism showing the ordinal credibility factor scores (a) and potential elevated credibility factor scores (b) for the Elemance model and the ordinal credibility factor scores (c) and potential elevated credibility factor scores (d) for the THUMS model.

![img-16.jpeg](img-16.jpeg)

![img-17.jpeg](img-17.jpeg)
Figure 7. Falls from heights injury scenario credibility heat map describing the impact velocities ranges assessed in the available literature for the Elemance (a) and THUMS (b) FE models for the thoracic injury mechanism.

![img-18.jpeg](img-18.jpeg)

# 3.2. Lower limb injury mechanism

The lower limb injury mechanism ordinal and elevated credibility scores are shown in Figure 4 for Elemance (Figure 4(a,b)) and THUMS (Figure 4(c,d)). Credibility factor scores of 1 are assigned for the data and input pedigree, and conceptual and referent

validation factors for Elemance (Figure 4(a)). Additionally, the data and input pedigree, code verification, and conceptual validation credibility factors for THUMS are defined as 1 and the referent validation factor is set as 2 for this model (Figure 4(c)). The credibility factor scores for the rest of the factors are 0

---

![img-19.jpeg](img-19.jpeg)
Credibility Threshold
Credibility Improvement

![img-20.jpeg](img-20.jpeg)

![img-21.jpeg](img-21.jpeg)
Figure 8. Results of the M&amp;S credibility assessment for the shoulder injury showing the ordinal credibility factor scores (a) and potential elevated credibility factor scores (b) for the Elemance model and the ordinal credibility factor scores (c) and potential elevated credibility factor scores (d) for the THUMS model.

![img-22.jpeg](img-22.jpeg)

![img-23.jpeg](img-23.jpeg)
Figure 9. Falls from heights injury scenario credibility heat map describing the impact velocities ranges assessed in the available literature for the Elemance (a) and THUMS (b) FE models for the shoulder injury mechanism.

![img-24.jpeg](img-24.jpeg)

in Figure 4(a,c). Elevation strategies are identified to elevate all credibility scores to 2 for the Elemance model, except for the conceptual validation factor, which is elevated to 3 (Figure 4(b), Table 2). Elevation strategies for THUMS result in achieving the sufficiency thresholds for all factors other than results

uncertainty (elevated factor score of 2) (Figure 4(d), Table 3). Figure 5(a,b) present contour plots that describe the referent validation cases identified in the literature, which are corresponding to FFH impact conditions in five different landing postures using the Elemance and THUMS models, respectively.

---

Table 2. Summary of elevation strategies and corresponding score updates for the Elemance FE model for injury mechanisms within the fall from heights injury scenario.

|  Injury Mechanism | M&S Credibility Factor | Original Credibility Score | Score Improvement Potential | Elemance Simplified Pedestrian Finite Element Model Credibility Enhancement Strategy  |
| --- | --- | --- | --- | --- |
|  Vertebral | Data Pedigree | 1 | 2 | Add deformable vertebral bone (cervical, thoracic), add IVD inclusions (cervical, lumbar) correlating to experimental properties.  |
|   |  Input Pedigree | 0 | 1 | Contact properties and loading inputs between vertebrae should be updated using experimental evidence.  |
|   |  Code/Solution Verification | 0 | 2 | Code and solution verification analysis need to be assessed for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 1 | 2 | Conduct stress-state conceptual assessments to determine reliability in the vertebral model.  |
|   |  Conceptual Validation | 1 | 2 | Update of constitutive models to capture stress and strain rate dependencies are needed for vertebral bone and IVD  |
|   |  Referent Validation | 1 | 3 | Conduct validation cases in a prone, supine, top, and standing conditions for FFH relevant velocities showing good agreement.  |
|   |  Results Uncertainty | 0 | 2 | Quantify most sources of uncertainty associated with the simulations within the FFH scenario and identify key uncertainties.  |
|   |  Results Robustness | 1 | 2 | Assess sensitivities associated with key material properties.  |
|  Lower Limb | Data Pedigree | 1 | 2 | Add deformable ankle/foot elements with traceable material properties and 2-D and 3-D elements for ankle ligaments.  |
|   |  Data Pedigree | 1 | 2 | Add traceable material data for patella bone and knee ligaments  |
|   |  Input Pedigree | 0 | 2 | Friction coefficients specified for the contact between regions should be updated based on experimental evidence  |
|   |  Code/Solution Verification | 0 | 2 | Code and solution verification analysis need to be assessed for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 1 | 3 | Perform additional conceptual assessments using dynamic strain rates in compression, shear, and bending stress states  |
|   |  Referent Validation | 1 | 2 | Perform additional validation cases in a prone, supine, lateral, and standing (velocities exceeding 8m/s) with good agreement to experiments.  |
|   |  Results Uncertainty | 0 | 2 | Quantify most sources of uncertainty associated with the simulations within the FFH scenario and identify key uncertainties.  |
|   |  Results Robustness | 0 | 2 | Assess key sensitivities related to the material properties and FFH boundary conditions.  |
|  Thoracic | Data Pedigree | 1 | 2 | Material properties for soft tissues, sternum, and rib cortical bone should be updated with experimental derived evidence.  |
|   |  Code/Solution Verification | 0 | 2 | Code and solution verification analysis need to be assessed for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 2 | 3 | Conduct conceptual evaluation of axial impacts to the ribs along with evaluation of remainder of features in this region  |
|   |  Referent Validation | 2 | 3 | Perform referent validation cases in prone, supine, and lateral impact conditions with good experimental agreement  |
|   |  Results Uncertainty | 0 | 2 | Quantify most sources of uncertainty associated with the simulations within the FFH scenario and identify key uncertainties.  |
|   |  Results Robustness | 1 | 2 | Assess key sensitivities related to the material properties and FFH boundary conditions.  |
|  Shoulder | Data Pedigree | 0 | 2 | Soft tissue representations should be added along with traceable material properties throughout the full region  |
|   |  Input Pedigree | 0 | 2 | Friction coefficients and joint loading curves should be updated based on anatomically appropriate experimental data.  |
|   |  Code/Solution Verification | 0 | 2 | Code and solution verification analysis need to be assessed for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 0 | 3 | Assess the anatomical features to evaluate the resemblance of the RWS in simulations.  |
|   |  Referent Validation | 1 | 2 | Conduct Prone, supine, and standing referent validation cases.  |
|   |  Referent Validation | 1 | 3 | Show improved agreement in a lateral impact orientation.  |
|   |  Results Uncertainty | 0 | 2 | Quantify most sources of uncertainty associated with the simulations within the FFH scenario and identify key uncertainties.  |
|   |  Results Robustness | 0 | 2 | Perform assessments for key sensitivities related to the material properties and FFH boundary conditions.  |

Table 3. Summary of elevation strategies and corresponding score updates for the THUMS FE model for injury mechanisms within the fall from heights injury scenario.

|  Injury Mechanism | M&S Credibility Factor | Original Credibility Score | Score Improvement Potential | THUMS Finite Element Model Credibility Enhancement Strategy  |
| --- | --- | --- | --- | --- |
|  Vertebral | Data Pedigree | 1 | 2 | Update cervical ligaments, meninges, spinal cord, cervical muscle activation with traceable evidence.  |
|   |  Data Pedigree | 1 | 1 | Update cortical vertebral bone with corresponding anatomical experimental derivations.  |
|   |  Input Pedigree | 1 | 2 | Update contact coefficients (especially for IVD-cortical bone contact) based on observed evidence from RWS.  |
|   |  Code/Solution Verification | 0 | 2 | Perform Code and solution verification analysis for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 1 | 3 | Conduct dynamic stress-state dependent validations of vertebral interface with good agreement to experiments.  |
|   |  Referent Validation | 1 | 3 | Perform additional validation cases for supine, lateral, top, standing orientations for FFH velocities.  |
|   |  Referent Validation | 1 | 1 | Perform validation cases for prone orientation below 10m/s with good agreement to experiments.  |
|  Lower Limb | Data Pedigree | 1 | 2 | Update menisci, patella bone, ankle/foot tendons and ligaments with traceable experimental data.  |
|   |  Data Pedigree | 1 | 1 | Update trabecular bone with experimental data from appropriate anatomical sources.  |
|   |  Input Pedigree | 1 | 2 | Add muscular anatomy and activation features, BMD considerations for fracture, and stress-state and strain rate properties.  |
|   |  Input Pedigree | 1 | 2 | Update contact coefficients between cortical bone and soft tissues based on observed evidence from RWS.  |
|   |  Input Pedigree | 1 | 1 | Evaluate knee and ankle joint constraints to ensure boundary conditions in FFH can be captured.  |
|   |  Code Verification | 1 | 2 | Conduct a verification of fibula and ankle ligament models should be conducted for an evaluation of the physics-based representations.  |
|   |  Solution Verification | 0 | 2 | Conduct Mesh convergence studies for key features.  |
|   |  Conceptual Validation | 1 | 3 | Perform dynamic assessments of fibula and femur in bending and compression stress-states with good experimental agreement.  |
|   |  Conceptual Validation | 1 | 3 | Perform ankle and knee joint validation in dynamic flexion and extension.  |
|   |  Referent Validation | 2 | 2 | Conduct prone orientation validation using impact velocities beyond 5m/s.  |
|   |  Referent Validation | 2 | 3 | Show improved Agreement in lateral and standing impact orientations.  |
|  Thoracic | Data Pedigree | 1 | 2 | Update material properties for rib trabecular bone, sternum bone, and rib soft tissues with traceable anatomically representative experimental data.  |
|   |  Input Pedigree | 1 | 2 | Update contact coefficients with experimental data.  |
|   |  Input Pedigree | 1 | 2 | Evaluate constraints between cortical bone and rib ligaments to ensure resemblance of RWS.  |
|   |  Code/Solution Verification | 0 | 2 | Perform Code and solution verification analysis for key anatomical regions within the FFH scenario.  |
|   |  Conceptual Validation | 1 | 3 | Conduct dynamic axial and bending stress-state validations of anterior thoracic.  |
|   |  Referent Validation | 1 | 3 | Perform validation in supine and lateral impact orientations at FFH relevant velocities with good experimental agreement.  |
|  Shoulder | Data Pedigree | 1 | 2 | Update bone material properties with anatomically appropriate data derived from experiments  |
|   |  Data Pedigree | 1 | 2 | Update ligaments should be updated based on traceable experimental data.  |
|   |  Input Pedigree | 1 | 2 | Update contact coefficients with experimentally derived values.  |
|   |  Input Pedigree | 1 | 2 | Update joint movement with loading conditions to model interaction with vEMU suit in the FFH scenario.  |
|   |  Code/Solution Verification | 0 | 2 | Perform Code and solution verification analysis for key anatomical regions within the FFH scenario.  |

---

### Thoracic injury mechanism

The results of the credibility assessment pertaining to the thoracic injury mechanism is shown by Figure 6 for the Elemance (Figure 6(a,b)) and THUMS (Figure 6(c,d)) FE models. Factor scores of 1 are assigned for the data and input pedigree for both models and for THUMS' conceptual and referent validation factors. Additionally, factor scores of 2 are specified for Elemance's conceptual and referent validation and THUMS' results robustness factors (Figure 6(a,c)). For Figures 6(a,c), credibility factors not mentioned above have a score of 0. Elevated factor scores of 2 are identified for Elemance pertaining to the data pedigree, code and solution verification, and results uncertainty and robustness and 3 for the conceptual and referent validation factors (Figure 6(b), Table 2). For THUMS, the identified elevation strategies increase the factor scores by 2 (Figure 6(d), Table 3). Finally, the identified referent validation cases pertaining to the FFH injury scenario for five different impact postures are shown for Elemance in Figure 7(a) and THUMS in Figure 7(b).

### Shoulder injury mechanism

The results of the credibility assessment for the shoulder injury mechanism are shown in Figures 9(a,b) for Elemance and in Figure 8(c,d) for THUMS. The credibility factor scores for Elemance are limited to the referent validation factor with a score of 1 (Figure 8(a)). The remaining credibility factors are assigned a score of 0. Factor scores of 1 are defined for the data pedigree, input pedigree, and referent validation credibility factors for THUMS, with all other factors assigned scores of 0 (Figure 8(c)). Elevation strategies of the credibility scores result in identical elevated factor scores between Elemance and THUMS with newly defined values of 2 for the data and input pedigree, code and solution verification, results uncertainty and robustness and 3 for the conceptual and referent validation factors (Figures 8(b,d), Tables 2 and 3). The referent validation contour plots are also depicted for five different impact conditions within FFH for Elemance and THUMS by Figure 9(a,b), respectively.

## Discussion

Our study presents a credibility assessment using the NASA-STD-7009A for two COTS FE models -- Elemance and THUMS whole-body FE models -- for simulating astronaut injury biomechanics within the context of NASA-centric applications. V&V is an essential part of the development process for computational models; however, the results of the V&V procedures are often significantly influenced by data and input parameters used to develop these computational models. By using the NASA-STD-7009A, comprehensive credibility assessments of these models are conducted by ascertaining the M&S credibility across the input parameters, and several V&V procedures. Each model's M&S credibility is evaluated based on the evidence compiled through an extensive literature search, and scores are assigned according to reported model V&V procedural evidence for each M&S credibility factor. Details regarding the evidence for prescribing the credibility factor scores and the evaluation of the overall scores can be found in the Supplemental Section A3.0. To the best of the author's knowledge, this is a first-of-its-kind comprehensive assessment for performing a verification and validation credibility assessment of computational models for EVA-related suited astronaut injury modeling, specifically for injury mechanisms associated with the FFH injury scenario.

During our credibility assessment, the FE model input parameters are taken into account by establishing the traceability of the source of data (to published literature or reported experimental evidence). The input parameters herein fall under the data and input pedigree credibility factors, as per NASA-STD-7009A. As an example, the elastic-plastic material properties of the lower limb cortical bones (femur, tibia, and fibula), excluding the foot/ankle skeletal features, are traceable to experimental evidence from tensile tests for the THUMS model (Yamada and Evans 1970), and are defined using experimental data across multiple loading (or stress) states for the Elemance model (Burstein et al. 1976; Linde and Hvid 1989; Keller et al. 1990). However, the trabecular bone properties defined for the femur, tibia, and fibula is derived from experimental data using vertebral and knee samples for THUMS and Elemance, respectively. There is an inherent mismatch in the assignment of these material properties to femur, tibia, and fibula model components, where the experimental data used for deriving these material properties come from vertebral or patella specimens. It is plausible that the material properties used in these FE models for femur, tibia, fibula, vertebral, and patella trabecular bones are similar, albeit not justifiable without observed evidence as the anatomical differences could also correlate to different bone fracture and failure criteria. Furthermore, but not limited to these, the mechanical behavior parameters for the knee ligaments, shoulder bones, thoracic, and lumbar vertebrae in Elemance or the ankle, shoulder, cervical

---

ligaments, patella, and humerus bone in THUMS are not found to have traceable evidence, which are defined by a credibility score of 0 due to the insufficient evidence. For most FFH injury scenario-related injury mechanism investigations, the use of Elemance or THUMS FE models would result in factor scores between 0 and 1 for data and input pedigree credibility factors. In essence, these scores are often limited by the lack of formal traceability to experimental data used for calculating their properties, or the applied assumptions, such as those associated with the contact and interfacial definitions lacking observed evidence.

Documented evidence supporting the code or solution verification factors of these FE models (THUMS and Elemance) for simulating FFH injury mechanisms, either by representing the real-world injury scenario, or a sufficiently analogous referent injury scenario, is sparse. A unit verification study is reported by Iwamoto et al. (2005) for THUMS' femur and tibia models using a single FE element model to replicate experimental compressive and tensile behaviors (Iwamoto et al. 2005), resulting in a code verification factor score of 1 (Figure 4(c)). However, unit verification studies for the other anatomical features of THUMS, or the solution verification (mesh convergence) study for the whole FE model is lacking in published or documented literature. Hence, almost all scores for code and solution verification credibility factors for THUMS FE injury mechanisms are 0 (Figures 2(c), 4(c), 6(c) and 8(c)). Similarly, code or solution verification procedures are not reported in the literature for Elemance, and as such, the corresponding credibility scores are 0 (Figures 2(a), 4(a), 6(a) and 8(a)).

Conceptual validation cases for THUMS are presented exclusively for assessments of stress-state dependent responses such as those performed for the lumbar vertebrae in compression, bending, shear, torsion, and extension (Iwamoto and Nakahira 2015). These stress-state based assessments are also presented for Elemance through bending or compression loads (Untaroiu et al. 2013); however, additional conceptual assessments are performed by comparing the simplified Elemance model to a model with the same geometry but more detailed conceptual implementations such as the assessments presented for the vertebral region (Gepner et al. 2020). These assessments support the specified conceptual validation factor scores for these FE models of 1--2 for the vertebral, lower limb, and thorax injury mechanisms (Figures 2, 4, and 6).

Both the Elemance and THUMS models have been extensively validated with over 80 combined referent validation cases, as reported in the published literature. Several of these validation cases are implemented through rigid impacts and outputs such as force-time histories (Iwamoto et al. 2005; Shin et al. 2012). (Iwamoto et al. 2012; Perez-Rapela et al. 2019). When evaluating the validation cases within the NASA application domain, mismatches between the kinematic ranges for current referent validation studies and the kinematic range of the FFH led to overall referent validation credibility scores between 1 and 2. In particular, the T1 and T8 FE vertebrae in THUMS are shown to have good agreement with experiments with a velocity range between 13.8 and 20.7 m/s. However, the validation impact test velocities are significantly higher than those relevant for the FFH scenario (Figure 3(a)) (Iwamoto et al. 2012). Additionally, for several cases the prone, supine, top, standing, or lateral loading directions related to the EVA injury scenario are not assessed for both THUMS and Elemance (Figures 3, 5, 7, and 9). Specifically, these loading direction-based limitations are significant in the shoulder injury mechanism as only validation cases are available for a lateral impact orientation for relevant FFH impact velocities. Contrarily, simulating the thorax injury mechanism using the Elemance model indicates credibility levels between 1 and 2 for several impact velocities within prone, supine, standing, and lateral orientations; however, these values are below the specified credibility sufficiency threshold (Figure 7(a)). This is primarily caused by insufficient agreement between the simulations and experimental data for validation cases that fall within the kinematic range for FFH EVA injury scenario (Figure 7(a); prone, supine, lateral). This may also elucidate underlying conceptual limitations in the models for the loading conditions pertinent for these NASA scenarios, which are explored later in the credibility improvement procedures for these models.

Credibility assessments for the model's uncertainty quantification (UQ; results uncertainty credibility factor) or sensitivity analyses (results robustness credibility factor) of the model results are currently limited to a few studies (Li et al. 2010; Afewerki 2016; Hwang et al. 2020; Ye et al. 2020). Literature on sensitivity analysis is primarily focused on vertebral and thorax regions. These studies rendered a credibility score of 1 for investigating vertebral (THUMS and Elemance) (Figure 2(a,b)), and 1 (Elemance) and 2 (THUMS) for thorax injury mechanisms (Figures 6(a,c)). Specifically, these assessments provide insights into the sensitivities in material properties in Elemance's thoracic region (Hwang et al. 2020), material and input parameters

---

within THUMS' vertebral region (Afewerki 2016), and some mesh specifications in the Elemance thorax model (Li et al. 2010). Further, some spaceflight-related boundary conditions have been assessed for the lumbar vertebrae in the Elemance model (Ye et al. 2020). Otherwise, there is little evidence in published literature for UQ for these FE models. Uncertainty and sensitivity assessments for these models are essential for establishing the credibility of these models as these types of analyses can be used to ascertain the FE results confidence intervals and potential variations in the model predictions for injuries relating to anthropometric variations within the broader astronaut population.

Our analysis of these FE models also identified several strategies to elevate their credibility factor scores and are discussed in this section relating to THUMS and Elemance FE model-based in silico studies of vertebral, lower limb, thoracic, and shoulder injury mechanisms in the context of FFH injury scenario. The results of our study indicate these models warrant additional anatomical, and conceptual feature implementations to increase their credibility levels before employing in FFH assessments. For all injury mechanisms, sufficient traceability in the relevant material and input parameters is not achieved (Figures 2, 4, 6, and 8). Therefore, updates in several of these material and input properties are needed to establish traceability of defined parameters. The credibility elevation recommendations for specific model anatomy abstractions, and the associated elevated scores are given in Tables 2 and 3. These recommendations would not only improve the traceability of the data used in model calibration procedures but also provide experimental evidence for developing conceptual implementations necessary for the contextual simulation of FFH injury scenario (Tables 2 and 3).

Verification and validation procedures are essential aspects of credibility analysis to ensure the model's credibility within the intended application domain. Additional verification and validation procedures are needed to ensure model features and conceptual formulations appropriately represent their real-world cases for improving code/solution verification and conceptual validation factor scores (Tables 2 and 3). It is well understood that performing verification and validation procedures for lunar conditions is difficult; however, a sufficiently analogous referent for lunar conditions would be appropriate for improving the credibility scores for V&V credibility factors. The loading condition (stress-state) dependencies at impact velocity ranges relevant for the FFH injury scenario, which have not been addressed in the current literature, need to be implemented as novel conceptual stress-state dependency formulations to increase the reliability of the models in multi-axial loading conditions (Figures 3, 5, 7, and 9). Additionally, model validation results should indicate good agreement with the experimental data to improve these validation factor scores (Tables 2 and 3). The goodness of the model results, in comparison to the experimental data, should be assessed through model-experimental data CORA (Gehre et al. 2009), ISO (Barbat et al. 2013), correlation coefficient (R^{2}) scores or similar approaches. Further, sensitivity analysis and uncertainty quantification should be conducted for key features in the model (such as femur, fibula, and tibia modulus and yield strength in Figure 4(b,d)) and FFH relevant boundary conditions for elevation of the results uncertainty and robustness credibility factor scores (Tables 2 and 3).

Lastly, when considering the credibility elevation strategies for the models in the specific application domain, it is noteworthy that several of the previously mentioned elevation strategies need to be implemented together with input data updates, conceptual formulation implementation, and associated V&V methods. For instance, when implementing conceptual formulations to better capture tissue material property stress state and loading velocity (or strain rate) dependencies in the THUMS lower limb, the use of the additional data needed to capture these stress-state and strain-rate dependencies could elevate the data pedigree credibility factor score to a value of 2 (Figure 4(d), Table 3). The conceptual formulation would have to be unit tested through code verification procedures and then validated using experimental data, all of which led to score elevations for verification and validation credibility factors (Figure 4(d), Table 3). Subsequently, ascertaining uncertainty propagations and model result sensitivities of the newly defined input data may be used in UQ and sensitivity analysis, which would elevate the results uncertainty and robustness factor scores (Figure 4(d), Table 3). These credibility elevation strategies would in essence assist in increasing the M&S credibility of THUMS and Elemance FE models for application in NASA's FFH injury scenario and associated injury modalities. Through these elevation strategies, finite element analysis (FEA) can be conducted using these FE models for injury risk assessments relevant to future Artemis missions. However, several underlying challenges are inherently associated with the development and design of any FE simulations. For instance, when investigating NASA-relevant mission designs, the development

---

of the FE simulation must capture the boundary conditions imposed by the spacesuit used in missions (such as the Axiom Extravehicular Mobility Unit) and the environmental loading conditions during intravehicular (IVA) or extravehicular (EVA) activity injury scenarios. These implementations warrant future work and VV&C assessments to ensure the reliability of the simulation results. Additionally, other subject-specific factors, such as differing individual geometric conditions that are associated with a crewmember's musculoskeletal system or underlying material properties, are difficult to capture and should be accounted for in the uncertainties of the simulations. Finally, FE simulations often require a large computational cost, so the necessary resources should be accounted for when designing and performing these studies. Despite these challenges, FEA possesses tremendous capabilities in performing these injury risk assessments as it offers the ability to test numerous scenarios that may result in crew member injuries using various mission parameters without the underlying risks that would be associated with experimental methods. Additionally, several mitigation strategies can be assessed using FE simulations to provide stakeholders with vital information regarding protective factors during mission preparation.

## Conclusions

FE models can be used to determine significant amounts of mission related information for the future NASA missions; however, ensuring the M&S credibility of the implemented models is essential. Our study investigates the COTS FE models THUMS and Elemance through a credibility analysis relating to vertebral, lower limb, thoracic, and shoulder injury mechanisms, which can exist within an FFH injury scenario. Credibility levels are determined for these models through an extensive literature search and credibility factor scores are assigned as outlined in NASA-STD-7009A. The results of our study indicate that the credibility levels for these models are below NASA subject matter expert-informed credibility sufficiency thresholds relating to input parameter pedigrees and applied V&V practices (Figures 2, 4, 6, and 8) when simulating FFH injury mechanisms. In the context of FFH injury mechanisms, certain referent validation cases for THUMS and Elemance model can provide higher credibility scores for referent validation within a specific kinematic range (Figure 3(a); lateral, Figures 5(a) and 7(a); standing, Figures 5(b) and 7(b); prone). However, additional referent validation procedures need to be conducted to cover the kinematic ranges for all potential FFH situations. Elevation of the credibility factor scores can be accomplished for these models through newly defined material properties and input parameters corresponding to experimental evidence (Tables 2 and 3). Further, additional V&V practices are warranted along with assessments of the uncertainty and sensitivities in the model relating to the anticipated EVA conditions (Tables 2 and 3). Increasing the credibility of these models will improve their reliability as they are employed in human space exploration assessments in support of the future NASA missions.

The authors would like to acknowledge the NASA Human Research Project (HRP) for supporting this work.

## Disclosure statement

No potential conflict of interest was reported by the author(s).

## Disclosure statement

No potential conflict of interest was reported by the author(s).

## References

1. Afewerki H. 2016. Biofidelity evaluation of thoracolumbar spine model in THUMS. Master's thesis in Biomedical Engineering. Department of Applied Mechanics Division of Vehicle Safety. Gothenburg, Sweden: Chalmers University of Technology.
2. Barbat S, Fu Y, Zhan Z, Yang R-J, Gehre C. 2013. Objective rating metric for dynamic systems. 23rd International Technical Conference on the Enhanced Safety of Vehicles (ESV). Seoul, Republic of Korea: National Highway Traffic Safety Administration.
3. Bastien C, Neal-Sturgess C, Davies H, Cheng X. 2020. Computing brain white and grey matter injury severity in a traumatic fall. MCA. 25(3):61. doi: 10.3390/mca25030061.
4. Bruneau DA, Cronin DS. 2021. Brain response of a computational head model for prescribed skull kinematics and simulated football helmet impact boundary conditions. J Mech Behav Biomed Mater. 115:104299. doi: 10.1016/J.JMBBM.2020.104299.
5. Burstein AH, Reilly DT, Martens M. 1976. Aging of bone tissue: mechanical properties. J Bone Joint Surg. 58(1):82--86. doi: 10.2106/00004623-197658010-00015.
6. Erdemir A, Mulugeta L, Ku JP, Drach A, Horner M, Morrison TM, Peng GCY, Vadigepalli R, Lytton WW, Myers JG. 2020. Credible practice of modeling and simulation in healthcare: ten rules from a multidisciplinary

---

perspective. J Transl Med. 18(1):369. doi: 10.1186/S12967-020-02540-4/FIGURES/3.Gehre C, Gades H, Wernicke P. 2009. Objective rating of signals using test and simulation responses. 21st International Technical Conference on the Enhanced Safety of Vehicles Conference (ESV). Stuttgart, Germany: National Highway Traffic Safety Administration; p. 9--407.Gepner BD, Kerrigan JR, Moreau D, Rawska K, Toczyski J. 2020. Sensitivity of human body model response relative to the lumbar spine and pelvic tissue formulation. International Research Council on the Biomechanics of Injury (IRCOBI Conference), Munich, Germany.Guide for verification and validation in computational solid mechanics. 2006. Transmitted by L.E. Schwer, Chair PTC 60 /V&V 10. ASME.Hwang E, Hu J, Reed MP. 2020. Validating diverse human body models against side impact tests with post-mortem human subjects. J Biomech. 98:109444. doi: 10.1016/J.JBIOMECH.2019.109444.Iwamoto M, Miki K, Tanaka E. 2005. Ankle skeletal injury predictions using anisotropic inelastic constitutive model of cortical bone taking into account damage evolution. 49th Stapp Car Crash Conference. Washington, D.C.: SAE Technical Papers. November, 2005. doi: 10.4271/2005-22-0007Iwamoto M, Nakahira Y. 2015. Development and validation of the Total HUman Model for Safety (THUMS) version 5 containing multiple 1D muscles for estimating occupant motions with muscle activation during side impacts. Stapp car crash journal, Society of Automotive Engineers. vol. 59, 2015 November. doi: 10.4271/2015-22-0003Iwamoto M, Nakahira Y, Kimpara H, Sugiyama T, Min K. 2012. Development of a human body finite element model with multiple muscles and their controller for estimating occupant motions and impact responses in frontal crash situations. Stapp Car Crash J. 56:231--268. doi: 10.4271/2012-22-0006.Keller TS, Mao Z, Spengler DM. 1990. Young's modulus, bending strength, and tissue physical properties of human compact bone. J Orthop Res. 8(4):592--603. doi: 10.1002/JOR.1100080416.Li Z, Kindig MW, Kerrigan JR, Untaroiu CD, Subit D, Crandall JR, Kent RW. 2010. Rib fractures under anterior-posterior dynamic loads: experimental and finite-element study. J Biomech. 43(2):228--234. doi: 10.1016/J.JBIOMECH.2009.08.040.Linde F, Hvid I. 1989. The effect of constraint on the mechanical behaviour of trabecular bone specimens. J Biomech. 22(5):485--490. doi: 10.1016/0021-9290(89)90209-1.NASA standard for models and simulations, NASA-STD-7009. 2008. National Aeronautics and Space Administration. Washington, D.C.NASA standard for models and simulations, NASA-STD-7009A. 2016. National Aeronautics and Space Administration. Washington, D.C.Perez-Rapela D, Markusic C, Whitcomb B, Pipkorn B, Forman J, Crandall J. 2019. Comparison of the simplified GHBMC to PMHS kinematics in far-side impact. International Research Council on the Biomechanics of Injury (IRCOBI Conference), Florence, Italy.Qualification of Medical Device Development Tools. 2017.U.S. Department of Health and Human Services. Rockville, MD: Food & Drug Administration.Reiber T, Newby N, Scheuring R, Walton M, Norcross J, Harman G, Somers JT. 2022. Development of the suited injury matrix for identification of top injury risks in lunar missions and training NASA/TM-20220007605. Big Sky, MT: IEEE Aerospace Meeting.Schwartz D, Guleyupoglu B, Koya B, Stitzel JD, Gayzik FS. 2015. Development of a computationally efficient full human body finite element model. Traffic Inj Prev. 16(supp1):S49--S56. doi: 10.1080/15389588.2015.1021418.Shin J, Yue N, Untaroiu CD. 2012. A finite element model of the foot and ankle for automotive impact applications. Ann Biomed Eng. 40(12):2519--2531. doi: 10.1007/S10439-012-0607-3.Untaroiu C, Yue N, Shin J. 2013. A finite element model of the lower limb for simulating automotive impacts. Ann Biomed Eng. 41(3):513--526. doi: 10.1007/s10439-012-0687-0.Yamada H, Evans FG. Strength of biological materials. ISBN-13: 978-0683093230. Williams & Wilkins. 1970.Ye X, Jones DA, Gaewsky JP, Koya B, McNamara KP, Saffarzadeh M, Putnam JB, Somers JT, Gayzik FS, Stitzel JD, et al. 2020. Lumbar spine response of computational finite element models in multidirectional spaceflight landing conditions. J Biomech Eng. 142(5):0510071--05100716. doi: 10.1115/1.4045401/1067326.
