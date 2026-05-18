---
ref_id: K15
classification: architecture
first_author: Keenan
year: 2015
title: "The Integrated Medical Model: A Probabilistic Simulation Model Predicting In-Flight Medical Risks"
venue: 45th International Conference on Environmental Systems (ICES-2015), Bellevue, WA, July 12-16 2015
doi: null
url: https://ntrs.nasa.gov/citations/20150018879
pdf_url: https://ntrs.nasa.gov/api/citations/20150018879/downloads/20150018879.pdf
report_number: GRC-E-DAA-TN21386
mcp_tool_used: firecrawl-mcp (NTRS metadata) + curl + pdftotext (canonical body)
fetched_utc: 2026-05-18T21:29:03+00:00
verified: true
pages: 12
spec_sections_supported:
  - "1. What Iter 3 adds — concept and architecture"
  - "3. Mathematical models — IMM architecture lineage"
  - "5. 12-condition analog catalog — IMM's 100-condition parent"
  - "8. UI — input parameters (mission length, EVA count, crew characteristics)"
authors_full:
  - Keenan, Alexandra (Wyle ST&E, Houston, TX)
  - Young, Millennia (Wyle ST&E)
  - Saile, Lynn (Wyle ST&E)
  - Boley, Lynn (Wyle ST&E)
  - Walton, Marlei (Wyle ST&E)
  - Kerstman, Eric (Texas Univ. Galveston, TX)
  - Shah, Ronak (Texas Univ. Galveston)
  - Goodenow, Debra A. (NASA Glenn Research Center)
  - Myers, Jerry G., Jr. (NASA GRC)
math_anchors:
  - "IMM input: mission length, EVA schedule, crew characteristics (sex, coronary artery calcium score, contacts, dental crowns, history of abdominal surgery, EVA eligibility). Selectron Stage-A score vector z_i extends this."
  - "100 medical conditions modeled; iMED SQL database holds all model inputs (incidence, event duration, resource utilization, crew functional impairment)."
  - "Severity: dichotomized best/worst-case scenarios per condition; outcome distributions bounded by fully-treated and untreated extremes."
  - "Treatment availability assessed at simulated event onset; outcomes generated based on crewmember status including pre-existing functional impairments and concurrent treatments."
  - "Primary outcomes: probability of evacuation, loss of crew life, time lost due to medical events, resource utilization."
  - "K15 is the architectural reference cited by M18 [ref 31] and A22; first paper to publish the full IMM concept end-to-end."
---

45th International Conference on Environmental Systems                                     ICES-2015-[insert submission number]
12-16 July 2015, Bellevue, Washington




            The Integrated Medical Model: A probabilistic simulation
                     model predicting in-flight medical risks

                        Alexandra Keenan1, Millennia Young2, Lynn Saile3, Lynn Boley4, Marlei Walton5,
                           Wyle Science, Technology and Engineering Group, Houston, Texas, 77058

                                                  Eric Kerstman6, Ronak Shah7,
                            University of Texas Medical Branch at Galveston, Galveston, Texas, 77555

                                          Debra A. Goodenow8, Jerry G. Myers, Jr.9
                                     NASA Glenn Research Center, Cleveland, Ohio, 44135




                     The Integrated Medical Model (IMM) is a probabilistic model that uses simulation to
                 predict human spaceflight mission medical risk. Given a specific mission and crew scenario,
                 medical events are simulated using Monte Carlo methodology to provide estimates of resource
                 utilization, probability of evacuation, probability of loss of crew, and the amount of mission
                 time lost due to illness. Mission and crew scenarios are defined by mission length,
                 extravehicular activity (EVA) schedule, and crew characteristics including: sex, coronary
                 artery calcium score, contacts, dental crowns, history of abdominal surgery, and EVA
                 eligibility.


                     The Integrated Medical Evidence Database (iMED) houses the model inputs for 100
                 medical conditions using in-flight, analog, and terrestrial medical data. Inputs include
                 incidence, event durations, resource utilization, and crew functional impairment. Severity of
                 conditions is addressed by defining statistical distributions on the dichotomized best and
                 worst-case scenarios for each condition. The outcome distributions for conditions are bounded
                 by the treatment extremes of the fully treated scenario – in which all required resources are
                 available – and the untreated scenario – in which no required resources are available. Upon
                 occurrence of a simulated medical event, treatment availability is assessed, and outcomes are


        1
          Mathematical Modeler, Advanced Technologies for Engineering and Medicine, Wyle Science, Technology and
        Engineering, 1290 Hercules Avenue, Houston, TX 77058.
        2
          Mathematical Modeler, Advanced Technologies for Engineering and Medicine, Wyle Science, Technology and
        Engineering, 1290 Hercules Avenue, Houston, TX 77058.
        3
          iMED Lead, Advanced Technologies for Engineering and Medicine, Wyle Science, Technology and Engineering,
        1290 Hercules Avenue, Houston, TX 77058.
        4
          Clinical Informaticist and IMM Operations Lead, Advanced Technologies for Engineering and Medicine, Wyle
        Science, Technology and Engineering, 1290 Hercules Avenue, Houston, TX 77058.
        5
          IMM Project Scientist, Advanced Technologies for Engineering and Medicine, Wyle Science, Technology and
        Engineering, 1290 Hercules Avenue, Houston, TX 77058.
        6
           IMM Clinical Lead, Advanced Technologies for Engineering and Medicine, Wyle Science, Technology and
        Engineering, 1290 Hercules Avenue, Houston, TX 77058.
        7
          Deputy Element Scientist, NASA Lyndon B Johnson Space Center Exploration Medical Capability, 2101 NASA
        Parkway/MS, Houston, TX 77058.
        8
          Electrical Engineer, NASA John H Glenn Research Center Energy Systems Branch, 21000 Brookpark Road/MS 86-
        5, Cleveland, OH 44135
        9
          IMM Technical Director, NASA John H Glenn Research Center Fluid Physics and Transport Processes Branch,
        21000 Brookpark Road/MS 110-3, Cleveland, OH 44135.
         generated depending on the status of the affected crewmember at the time of onset, including
         any pre-existing functional impairments or ongoing treatment of concurrent conditions.


             The main IMM outcomes, including probability of evacuation and loss of crew life, time
         lost due to medical events, and resource utilization, are useful in informing mission planning
         decisions. To date, the IMM has been used to assess mission-specific risks with and without
         certain crewmember characteristics, to determine the impact of eliminating certain resources
         from the mission medical kit, and to design medical kits that maximally benefit crew health
         while meeting mass and volume constraints.


                                                 I. Introduction

S    ERIOUS medical consequences associated with the extreme space environment represent a potentially significant
     limiting factor for long-duration human spaceflight. Given the relative dearth of opportunities to study the
physiologic effects of the space environment and the difficulties in mimicking such conditions through analog
environments, computational models serve to augment space medicine research, assess risk, prioritize funding
decisions, and ultimately aid in mitigating potential hazards to astronaut health. Many of these models produce
simulations that answer targeted questions about human physiologic changes in response to spaceflight and the
microgravity environment.1-8 To complement these efforts, a broad view of in-flight astronaut health and resource
usage is useful to program, project, and mission planners in establishing meaningful mission parameters for crew
health and safety. Assad et al. published a deterministic model of astronaut health and resource utilization for long-
duration spaceflight that provides an aggregate estimate of astronaut health and the mass of medical consumables used
during the mission.9 The Integrated Medical Model (IMM) expands upon these capabilities by providing a measure of
quality time lost during the mission due to medical events, the probability of evacuation, the probability of loss of
crew life, and resource utilization. Granularity at the medical condition level and resource type level is also achieved
and provides information about drivers of evacuation, loss of crew, and overall poor health.
        As a quantitative, evidence-based decision support tool that integrates organizational knowledge, published
literature, and in-flight medical event data, the IMM provides comparative estimates of in-flight medical risks and
resource utilization between different mission profiles, crew profiles, and medical kits. This probabilistic simulation
uses Monte Carlo methodology with input from medical condition incidence data, medical condition outcome data,
and treatment data on 100 medical conditions that have either occurred in flight or are of considerable concern to
human spaceflight. Using these medical inputs, combined with crew and mission characteristics, the IMM generates
a large number of simulated missions to predict the amount of time lost during the mission due to medical events, the
probability of evacuation, the probability of a loss of crew life, and an estimate of resources required. As certain
medical conditions have higher likelihoods if an individual has an associated risk factor (e.g., use of contacts is
correlated with a greater risk of corneal ulcer), the IMM takes as input a crew profile defining several risk factors,
including sex, presence of contacts, presence of coronary artery calcium, presence of crowns, and history of abdominal
surgery. Further, medical conditions associated with space adaptation (SA) are modeled to occur only once in flight.
     The IMM goes beyond more traditional risk management tools in that it not only models risk, it also models risk
mitigations in the form of medical condition treatment, and subsequent clinical outcomes based on medical resource
mitigations available. The IMM also accounts for events unique to the spaceflight environment, such as solar particle
events (SPE), which expose the crew to radiation, and extravehicular activities (EVAs), or ‘spacewalks’, that may
lead to associated conditions and adverse medical outcomes. The model exhibits sufficient flexibility to allow for
additional mission event types should data be made available. Currently, the input data is baselined to the International
Space Station; however, the IMM is designed to be extensible, to support research, and to support capability
development in order to enable long-term exploration class missions.


                                                   II. Methods
    The IMM is implemented in MATLAB and draws model inputs from user-defined scripts and an SQL database.10
In concept, the IMM architecture follows the practices of probabilistic risk assessment (PRA). 11 However, the
implementation of the IMM diverges from strict PRA implementation to accommodate the broad assumptions required
to implement medical treatment and outcome simulations. These enhancements maintain appropriate statistical

                                                           2
  International Conference on Environmental Systems
practices and result in a robust and extensible tool. Figures 1 and 2 provide overviews of model inputs and simulation
flow, respectively.




A. Model Inputs
    A SQL database called the integrated Medical Evidence Database (iMED) houses the medical-condition-model
inputs. Within the database, clinical subject matter experts (SMEs) populate and maintain data on 100 medical
conditions that have either occurred in flight or are of considerable concern or interest to human spaceflight. The
following section outlines the data housed in the iMED and used by the model.




                                       Figure 1. Summary of IMM inputs and outputs.



1. User-defined
    Model users must define the mission, number of crew, and certain crewmember characteristics including sex,
presence of dental crowns, presence of contact lenses, presence of coronary artery calcium (CAC), and history of
abdominal surgery. An EVA schedule must also be defined for each crewmember. These crew characteristics indicate
the appropriate incidence data for applicable medical conditions associated with crew-health-risk factors.

2. Incidence Rates
     In-flight data inform the medical condition incidence data for the medical conditions simulated in the IMM
wherever possible. The NASA Lifetime Surveillance of Astronaut Health (LSAH) and information from published
literature provides the IMM with in-flight data.12-14 The current version of the model uses in-flight data from shuttle
missions STS 1-114, except STS-51-L (Challenger) and STS-107 (Columbia), International Space Station expeditions
1-13, Apollo, Skylab, and Shuttle/Mir. Data from some later flights inform medical condition inputs related to visual
impairment and intracranial pressure (VIIP).
     Where observational data are insufficient to adequately define the in-flight medical risk, the IMM uses terrestrial
analog and general population data, Bayesian updates to pre- and postflight astronaut data from terrestrial data15,
analog condition terrestrial data, and external probabilistic modules to model and estimate medical-event
likelihoods. Acquisition of terrestrial incidence is through analog and general population published literature. For
some medical conditions, such as the occurrence of in-flight renal stones, Bayesian updates can be made to
terrestrial data. External models are used to estimate incidence of very rare, but high impact, events, such as the a
bone-fracture-risk model.16 The current list of the IMM medical conditions, along with the incidence data source
type (i.e., in-flight data, terrestrial data, Bayesian updates to terrestrial data, or external model data), and the
distributions sampled for each incidence rate may be found in the Appendix. Medical conditions associated with
causative mission events and risk factors affecting medical condition likelihoods, are also indicated.



                                                            3
  International Conference on Environmental Systems
3. Scenario
   The severity of a medical condition occurrence is modeled as a best- or worst-case event scenario with medical
event outcomes defined separately for each scenario. Outcomes associated with these two scenarios represent the best
and worst possible outcomes for the affected crewmember given defined resource, treatment, and environmental
constraints. The probability of a best or worst-case scenario is specified in the iMED as being uniformly distributed
over a range defined by clinical SMEs and informed by the literature for each of the medical conditions.

4. Treatment
    The IMM models mitigations to the medical risks in the form of treatments. Resource types and quantities used to
model medical risk mitigation in the IMM are derived from the International Space Station (ISS) Health Maintenance
System. A treatment is defined for each medical condition/scenario combination and consists of required quantities of
medical resources, the per day dosage, and a resource category, if applicable. The resource is assigned to a category
so that in the event of an insufficient quantity of a primary resource, a suitable alternate may be considered from the
same category during simulation. The iMED contains an alternative resource table that lists equivalent dosages for
resources within the same category. Treatments are defined by clinical SMEs to reflect acceptable medical standards
of care.

5. Outcomes
    Medical event outcomes are defined in the iMED for each medical event/scenario combination for the situation
where sufficient medical resources are available to treat the medical condition and the situation where insufficient
resources are available. These outcomes include functional impairments, durations, the probability that an evacuation
should be considered (pEVAC), and the probability of loss of crew life (meaning one or more crew) (pLOCL).
Functional impairments and durations, and pEVAC and pLOCL are generated using beta-pert distributions. Functional
impairments (FI) and durations (DT) are defined for each of three clinical phases: diagnosis and initial treatment
(Clinical Phase 1), ongoing treatment and convalescence (Clinical Phase 2), and permanent impairment for the
remainder of the mission (Clinical Phase 3). FI and DT are specified as ranges (min and max) assuming a Beta-Pert
distribution with the midpoint serving as the most likely value. FI, DT, and end state outcome (pLOCL and pEVAC)
specifications are ascertained from a combination of impairment guidelines, best evidence from ground-based analog
populations, and clinical SME experience with the medical condition. 17 It should be noted that evacuation and loss of
                                                      crew life endstate data is not drawn from in-flight data, as these
                                                      events are rare. As end-state outcomes are largely impacted by
                                                      medical resource limitations, their specification relies heavily on
                                                      clinical expertise within the NASA community.

                                                       B. Simulation

                                                       6.    Medical Condition Occurrences
                                                            SA conditions are simulated to occur at most once during the
                                                        mission and, with the exception of conditions associated with
                                                        VIIP, occur within the first 5 days. The incidence of a SA
                                                        condition is defined in the iMED as an incidence proportion (IP)
                                                        or events per person task. The IP is either fixed or generated from
                                                        a Beta distribution, and the occurrence of the event is drawn from
                                                        a Bernoulli distribution defined by the IP. If the SA medical
                                                        condition occurs, the time-of-occurrence is then generated from
                                                        a Beta-Pert distribution specified in the iMED.
                                                         For each scheduled EVA for a crewmember, an EVA-
                                                        associated medical event occurrence is drawn from a Bernoulli
                                                        distribution defined by the medical condition IP, which is either
fixed or generated from a Beta distribution. If the event occurs, the time-of-occurrence is the start time of the scheduled
   Figure 2. Overview of IMM simulation.               EVA.
                                                         The only condition currently in the model that is associated with
SPEs is acute radiation syndrome (ARS). An SPE incidence is generated from a gamma distribution defined in the
iMED, and SPEs are simulated as a Poisson process with time between events generated via an exponential distribution
with lambda equal to the incidence rate (IR). The SPE schedule is generated in this way at the beginning of every

                                                            4
  International Conference on Environmental Systems
mission. If an SPE occurs, all crewmembers are at risk for ARS. ARS occurrences are predicted from a Bernoulli
distribution defined by a fixed incidence proportion.
    For general conditions (non-EVA, non-SPE, and non-SA), medical event occurrences are simulated as a Poisson
process with time between events generated via an exponential distribution with lambda equal to the incidence rate.
For all medical condition occurrences, the best-case or worst-case scenario type is generated from a Bernoulli
distribution.

7. Treatment
    Within the simulation, medical resources used to treat each
medical event are taken out of the medical kit the order of
medical event occurrence. While the resource types and
quantities are specified model inputs, these treatments may be
modified within the simulation to account for remaining
mission time (for example, if the medical event occurs near the
end of the mission), or to account for overlap with treatment
of concurrent conditions within the same crewmember. If a
required resource is unavailable or the quantity is insufficient
and an alternative is specified in the iMED, the alternate will
be used as the mitigation. Note that medical event outcomes
are simulated from statistical distributions that are specified
for the situation where all required resources are available
(fully treated) and also when no required resources are
available (untreated). To predict outcomes for a medical event
where some but not all of the required essential resources are Figure 3. Sample statistical distributions for functional
available to treat the medical event, a partial treatment scheme impairment (FI) for varying RAF values ranging from 100%
                                                                 (all required resources available) to 0% (no required
is employed that allows for a continuum between the fully- resources available).
treated and untreated situations. To address partial treatment
outcomes between these two extremes, we use a resource availability factor (RAF), calculated as the proportion of
required resources available, to generate statistical distributions that are shifted between the fully treated and
completely untreated distributions (Figure 3).

8. Outcomes
     Functional impairments and clinical phase durations, and probabilities of loss of crew and evacuation are generated
from Beta-Pert distributions. Loss of crew and evacuation are simulated from Bernoulli distributions using the
generated probabilities. Simulated outcomes for a given medical event may affect downstream events on the timeline.
If a medical condition results in an evacuation or loss of crew life, no further medical events may occur for the affected
crewmember. Furthermore, a crewmember in Clinical Phases 1 and 2 of a medical event may not experience a second
concurrent occurrence of the identical medical event during that time.

9. Outputs
    Primary outcomes describing the impact of medical events on the mission are measured by the Crew Health Index
(CHI), probability of evacuation (pEVAC), probability of loss of crew life (pLOCL), and total medical events (TME).
The CHI is a function of quality-adjusted life years lost due to medical events. Given n overlapping functional
impairments <f1,f2, f3,…,fn> at a point in time within a crewmember due to medical events, the overall functional
impairment ftotal can be calculated using function: ftotal = 1-(1-f1)×(1-f2) × (1-f3) ×…× (1-fn). The quality time lost is
calculated as the product of ftotal and the duration of the time interval over which the functional impairment is applied.
Total quality time lost (QTL) over a mission is calculated as the sum of products of the functional impairments and
durations. The CHI is an estimate of total jcrew health and is calculated in the following way: CHI = 100%×(1-
QTLtotal/(L×c)) where c is the number of crew, L is the mission length in hours, and QTLtotal is the total amount of
quality time lost for all crewmembers on a mission. The contributions of individual medical conditions to each primary
output, as well as descriptive statistics on the individual resources used are also available.

                                                   III. Results
   Example results from 100k trials for an ISS 6-month Design Reference Mission (DRM) with a 4-male, 2-female
crew are provided here. Crew risk factors include: 1 crewmember with a CAC score greater than zero, 3 crewmembers

                                                            5
  International Conference on Environmental Systems
with contacts, 2 crewmembers with crowns, 1 crewmember with a history of abdominal surgery, and 2 crewmembers
who perform 6 EVAs each. Three risk mitigation scenarios are modeled: one in which no medical resources are
available, one in which the ISS Health Maintenance System is available (with no resupply), and one in which unlimited
quantities of consumables in the ISS Health Maintenance System are available. A summary of these outputs can be
found in Table 1, and the distributions that some of these outputs assume can be seen in Figures 4-5. The outputs
provided here are for the crewmembers as an aggregate. As is expected, the worst CHI, pEVAC and pLOCL outcomes
occur in the untreated scenario, with outcomes improving as more resources become available. Notably, total medical
events (TME) are reduced in the scenario where no medical resources are available. This is reflective of the increased
precedence of early termination of crewmembers’ missions due to death or evacuation. For comparison, CHI data
from an exploration-class Mars 2.5-year DRM is provided in Figure 6 with available medical resources derived from
the ISS Health Maintenance System and with an identical crew profile to the ISS DRM with the exception that 2
crewmembers perform 2 EVAs per week each. Figure 7 provides a comparison of CHI on the ISS 6-month and Mars
2.5-year DRMS with limited quantities of ISS Health Maintenance System resources available.

                                               Table 1. ISS 6 month, 6 crew mission.
                                                              ISS Health                Unlimited Medical
                              No Medical Resources
                                                          Maintenance System                Resources

                                     95% Confidence              95% Confidence              95% Confidence
                                        Interval                    Interval                    Interval
                              Mean                       Mean                       Mean
                                      Lower     Upper            Lower Upper                 Lower    Upper
                                      Bound     Bound            Bound Bound                 Bound    Bound

                     TME      98.3      73       122      106        87    126         106    87       126
                      CHI     59.2     43.36    71.25 94.93 84.32          98.46    94.98 84.44       98.47
                    pEVAC 66.9         66.57    67.14     5.57    5.43     5.72     4.93      4.8      5.07
                    pLOCL 2.89         2.78      2.99     0.44       0.4   0.49     0.45     0.41      0.49




           Figure 4. Total medical events for three medical risk mitigation scenarios for an ISS 6-month, 6-crew mission.




                                                                 6
  International Conference on Environmental Systems
                         Figure 5. Crew health index over 100,000 trials for an ISS 6-month, 6-crew mission.




                         Figure 6. Crew health index over 100,000 trials for a Mars 2.5-year, 6-crew mission.




Figure 7. Crew Health Index comparison with limited quantities of resources from the ISS Health Maintenance System available on ISS
                                               6-month and Mars 2.5-year missions.

                                                    IV. Conclusions
   Effective risk management is an integral aspect of human spaceflight and is critical to program and project success.
 The IMM serves as a quantitative, objective tool for risk managers and mission planners by providing aggregate
 risks that can be compared across mission profiles as well as more granular information such as medical conditions,
 crew characteristics, and mitigations most influential to those risks. For example, the IMM has been used to
 determine the impact of certain resources being unavailable, the impact of crewmember medical attributes, and
 which consumable resources are most sought on a long-duration mission. Information from the IMM has also been
                                                                  7
  International Conference on Environmental Systems
used for a medical kit optimization routine that generates medical kits to meet mass and volume constraints while
maximizing CHI or minimizing pLOCL and pEVAC for specified mission and crew profile constraints.18
  The IMM was initially developed for ISS planning, and model inputs were baselined to the ISS. To make the
model more meaningful for exploration-class mission, some model outputs could be reconsidered. For example, on
exploration missions, evacuation is not possible in the same sense as was intended when the parameter was initially
developed. A loss-of-mission output metric might be more meaningful in the context of exploration missions and
this development is currently underway. Further, the complexities of multiple co-morbidities and the effects of a
crewmember with a communicable medical condition on the probability that other crewmembers contract the same
illness are not modeled. Future work might also include modeling ISS countermeasures beyond medical resources,
such as the advanced resistive exercise device (ARED) and treadmill, modeling the failure of medical risk
mitigations, modeling radiation risks beyond those associated with SPEs, and modeling vehicle environmental
systems with medical condition correlates.




                                                       8
International Conference on Environmental Systems
                                                             Appendix
                                                              Incidence Data       Incidence
                                    Medical Condition                                            Risk factors
                                                                  Source          Distribution
                                      Abdominal Injury           Terrestrial        Gamma
                               Abdominal Wall Hernia             Terrestrial        Gamma
                           Abnormal Uterine Bleeding             Terrestrial         Fixed           Sex
                                         Acute Arthritis         Terrestrial         Fixed           Sex
                                                             Astronaut pre- and
                      Acute Cholecystitis/Biliary Colic       postflight data,    Lognormal          Sex
                                                              Terrestrial data
                        Acute Compartment Syndrome               Terrestrial         Fixed           Sex
                                    Acute Diverticulitis         Terrestrial         Fixed
                                       Acute Glaucoma            Terrestrial         Fixed           Sex
                                      Acute Pancreatitis         Terrestrial         Fixed
                                       Acute Prostatitis         Terrestrial         Fixed           Sex
                            Acute Radiation Syndrome             Terrestrial         Fixed          SPE
                                         Acute Sinusitis          In-flight         Gamma
                  Allergic Reaction (mild to moderate)            In-flight         Gamma
                                      Altitude Sickness          Terrestrial      Lognormal
                                            Anaphylaxis          Terrestrial         Fixed
                         Angina/Myocardial Infarction            Terrestrial         Fixed           Sex
                                    Ankle Sprain/Strain           In-flight         Gamma
                                                 Anxiety         Terrestrial         Fixed           Sex
                                                             Astronaut pre- and
                                            Appendicitis      postflight data,    Lognormal
                                                              Terrestrial data
                                                             Astronaut pre- and
                       Atrial Fibrillation/ Atrial Flutter    postflight data,    Lognormal          Sex
                                                              Terrestrial data
                                             Back Injury          In-flight         Gamma
                         Back Pain (Space Adaptation)             In-flight          Beta
                          Barotrauma (ear/sinus block)            In-flight         Gamma
                                Behavioral Emergency             Terrestrial         Fixed
                               Burns secondary to Fire        External model         Fixed
  Cardiogenic Shock secondary to Myocardial Infarction           Terrestrial         Fixed           Sex
                                            Chest Injury         Terrestrial        Gamma
                           Choking/Obstructed Airway              In-flight         Gamma
                        Constipation (space adaptation)           In-flight          Beta
   Decompression Sickness Secondary to Extravehicular
                                                                 Terrestrial         Beta           EVA
                                             Activity
                                 Dental : Exposed Pulp           Terrestrial         Fixed
                                                             Astronaut pre- and
                                           Dental Caries      postflight data,    Lognormal
                                                              Terrestrial data
                                                             Astronaut pre- and
                                        Dental: Abscess       postflight data,    Lognormal
                                                              Terrestrial data
                        Dental: Avulsion (Tooth Loss)            Terrestrial         Fixed


                                                                  9
International Conference on Environmental Systems
                                                         Incidence Data       Incidence
                                 Medical Condition                                          Risk factors
                                                             Source          Distribution
                                 Dental: Crown Loss         Terrestrial         Fixed         Crowns
                                 Dental: Filling Loss       Terrestrial         Fixed
                                          Depression        Terrestrial         Fixed           Sex
                                            Diarrhea         In-flight         Gamma
                                  Elbow Dislocation         Terrestrial         Fixed
                                 Elbow Sprain/Strain         In-flight         Gamma
                        Eye Abrasion (foreign body)          In-flight         Gamma
                                 Eye Chemical Burn           In-flight         Gamma
                                  Eye Corneal Ulcer         Terrestrial         Fixed        Contacts
                                       Eye Infection         In-flight         Gamma
                      Eye Penetration (foreign body)        Terrestrial         Fixed
                                  Finger Dislocation         In-flight         Gamma
                             Fingernail Delamination         In-flight          Beta           EVA
                                      Gastroenteritis        In-flight         Gamma
                                         Head Injury        Terrestrial        Gamma
                            Headache (CO2 induced)           In-flight         Gamma
                                    Headache (Late)          In-flight         Gamma
                        Headache (space adaptation)          In-flight          Beta
                                       Hearing Loss          In-flight         Gamma
                                        Hemorrhoids          In-flight         Gamma
                Herpes Zoster Reactivation (shingles)        In-flight         Gamma
                                   Hip Sprain/Strain         In-flight         Gamma
                       Hip/Proximal Femur Fracture       External model      Lognormal          Sex
                                       Hypertension         Terrestrial         Fixed
                                          Indigestion        In-flight         Gamma
                                           Influenza         In-flight         Gamma
                         Insomnia (space adaptation)         In-flight          Beta
                                  Knee Sprain/Strain         In-flight         Gamma
                                      Late Insomnia          In-flight         Gamma
               Lower Extremity (LE) Stress Fracture         Terrestrial         Fixed           Sex
                              Lumbar Spine Fracture      External model      Lognormal          Sex
              Medication Overdose/Adverse Reaction           In-flight         Gamma
                                        Mouth Ulcer          In-flight         Gamma
                 Nasal Congestion (space adaptation)         In-flight          Beta
                                         Neck Injury         In-flight         Gamma
                                                        Astronaut pre- and
                                      Nephrolithiasis    postflight data,    Lognormal
                                                         Terrestrial data
                                  Neurogenic Shock          Terrestrial         Fixed
                       Nose bleed (space adaptation)         In-flight          Beta
                                       Otitis Externa        In-flight         Gamma

                                                            10
International Conference on Environmental Systems
                                                                   Incidence Data       Incidence
                                          Medical Condition                                                  Risk factors
                                                                       Source          Distribution
                                                 Otitis Media          In-flight         Gamma
                                                  Paresthesias         In-flight          Beta                  EVA
                                                  Pharyngitis          In-flight         Gamma
                                         Respiratory Infection         In-flight         Gamma
                                          Retinal Detachment          Terrestrial         Fixed                  Sex
                                                                  Astronaut pre- and
                                                     Seizures      postflight data,    Lognormal
                                                                   Terrestrial data
                                                       Sepsis         Terrestrial         Fixed
                                         Shoulder Dislocation         Terrestrial         Fixed
                                       Shoulder Sprain/Strain          In-flight         Gamma
                                                Skin Abrasion          In-flight         Gamma
                                                Skin Infection         In-flight         Gamma
                                              Skin Laceration          In-flight         Gamma
                                                    Skin Rash          In-flight         Gamma

                                                                                                             History of
                                     Small Bowel Obstruction          Terrestrial         Fixed
                                                                                                          abdominal surgery

                                            Smoke Inhalation       External model         Fixed
                     Space Motion Sickness (space adaptation)          In-flight          Beta
                                                                  Astronaut pre- and
                             Stroke (cerebrovascular accident)     postflight data,    Lognormal                 Sex
                                                                   Terrestrial data
                                                                                                           Coronary artery
                                       Sudden Cardiac Arrest          Terrestrial         Fixed
                                                                                                              calcium
                                   Toxic Exposure: Ammonia         External model         Fixed
                               Traumatic Hypovolemic Shock            Terrestrial         Fixed
                       Urinary Incontinence (space adaptation)         In-flight          Beta                   Sex
                          Urinary Retention (space adaptation)         In-flight          Beta                   Sex
                                       Urinary Tract Infection         In-flight         Gamma                   Sex
                                      Vaginal Yeast Infection         Terrestrial        Gamma                   Sex
      Visual Impairment and Intracranial Pressure (VIIP)(space
                                                                       In-flight          Beta
                                                   adaptation)
                                               Wrist Fracture      External model      Lognormal
                                           Wrist Sprain/Strain         In-flight         Gamma


                                                                 References
1.     Kassemi, M., Brock, R., Nemeth, N., “A combined transport-kinetics model for the growth of renal calculi.” Journal of Crystal
       Growth, Vol 332, No. 1, 2011, pp. 48-57.
2.     Summers, R. L., Platts, S., Myers, J. G., Coleman, T. G., “Theoretical analysis of the mechanisms of a gender differentiation
       in the propensity for orthostatic intolerance after spaceflight.” Theor Biol Med Model. Vol. 7, No. 8, 2010.
3.     Rose, W. C., “Computational simulation to understand vision changes during prolonged weightlessness.” Engineering in
       Medicine and Biology Society (EMBC), 2013 35th Annual International Conference of the IEEE. Osaka, 2013, pp. 4094-4097.
4.     Iskovitz, I., Kassemi, M., and Thomas, J. D., “Impact of Weightlessness on Cardiac Shape and Left Ventricular Stress/Strain
       Distributions,” Journal of Biomechanical Engineering, Vol. 135, No. 12, 2013.
5.     Stevens, S. A., Lakin, W. D., Penar, P. L., “Modeling steady-state intracranial pressures in supine, head-down tilt and
       microgravity conditions,” Aviat Space Environ Med, Vol. 76, No. 4, 2005, pp. 329-338.

                                                                      11
     International Conference on Environmental Systems
6.    West, J. B., Elliott, A. R., Guy, H. J. B., and Prisk, K., “Pulmonary Function in Space,” JAMA, Vol. 277, No. 24, 1997, pp.
      1957-1961.
7.    Heldt, T., Shim, E. B., Kamm, R. D., and Mark, R. G., “Computational modeling of cardiovascular response to orthostatic
      stress,” J Appl Physiol, Vol. 92, No. 3, 2002, pp. 1239-1254.
8.    Cucinotta, F.A., Kim, M. H., Chappell, L. J., Huff, J. L., “How safe is safe enough? Radiation risk for a human mission to
      Mars,” PLoS One, Vol. 8, No. 10, 2013.
9.    Assad, A., de Weck, O. L., “Model of medical supply and astronaut health for long-duration human space flight,” Acta
      Astronautica, Vol. 106, 2015, pp. 47-62.
10.   MATLAB, Parallel Computing and Statistics Toolboxes Release 2014a, The MathWorks, Inc., Natick, Massachusetts, United
      States.
11.   Stamatelatos, M. and Dezfuli, H., Probabilistic Risk Assessment Procedures Guide for NASA Managers and Practitioners,
      2nd ed., National Aeronautics and Space Administration, Washington D.C., 2005.
12.   Hamm, P. B., Nicogossian, A. E., Pool, S. L., Wear, M. L., Billica, R. D., “Design and current status of the longitudinal study
      of astronaut health,” Aviat Space Environ Med, Vol 17, No. 6, 2000, pp. 564-570.
13.   Scheuring, R. A., Mathers, C. H., Jones, J. A., Wear, M. L., “Musculoskeletal injuries and minor trauma in space: incidence
      and injury mechanisms in U.S. astronauts.,” Aviat Space Environ Med, Vol. 80, No. 2, 2009, pp. 117-124
14.   Kerstman, E. L., Scheuring, R. A., Barnes, M. G., DeKorse, T. B., Saile, L. G., “Space adaptation back pain: a retrospective
      study,” Aviat Space Environ Med, Vol. 83, No. 1, 2012, pp. 2-7.
15.   Gilkey, Kelly M., McRae, Michael P., Griffin, Elise A., Kalluri, Aditya S., Myers, Jerry G., “Bayesian Analysis for Risk
      Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort” NASA TP-2012-217120, 2012.
16.   Nelson, E. S., Lewandowski, B., Licata, A., and Meyers, J. G., “Development and validation of a predictive bone fracture risk
      model for astronauts.,” Annals of Biomedical Engineering, Vol. 37, No. 11, 2009, pp. 2337-2359.
17.   Andersson, G. B. J., and Cocchiarella, L., Guides to the Evaluation of Permanent Impairment, 5th ed., American Medical
      Association, 2005.
18.   Minard, C. G., de Carvalho, M. F., Iyengar, M. S., “Optimizing medical resources for spaceflight using the integrated medical
      model,” Aviat Space Environ Med, Vol. 82, No. 9, 2011, pp. 890-894.




                                                                 12
     International Conference on Environmental Systems
