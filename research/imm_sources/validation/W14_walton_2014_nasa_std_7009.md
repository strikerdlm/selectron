---
ref_id: W14
classification: validation
first_author: Walton
year: 2014
title: "NASA-STD-7009 Guidance Document for Human Health and Performance Models and Simulations"
venue: NASA Human Research Program Investigators Workshop, Galveston TX, Feb 11-13 2014 (poster)
doi: null
url: https://ntrs.nasa.gov/citations/20140017301
pdf_url: https://ntrs.nasa.gov/api/citations/20140017301/downloads/20140017301.pdf
report_number: GRC-E-DAA-TN17433
mcp_tool_used: firecrawl-mcp (NTRS metadata) + curl + pdftotext (canonical body)
fetched_utc: 2026-05-18T21:29:03+00:00
verified: true
pages: 1
spec_sections_supported:
  - "Section 9 V&V — eight credibility factors (poster table with weights)"
authors_full:
  - Walton, Marlei (Wyle Integrated Science & Engineering Group, Houston TX)
  - Mulugeta, Lealem (USRA / Space Life Sciences, Houston TX)
  - Nelson, Emily S. (NASA Glenn Research Center, Cleveland OH)
  - Myers, Jerry G. (NASA GRC)
caveat: |
  ⚠ This NTRS deposit is a 1-page poster, NOT the full NASA-STD-7009
  Guidance Document. The poster contains a TABLE of credibility-assessment
  weighting factors but the labels differ from the canonical eight factors
  cited verbatim by M18 (Myers 2018). The full NASA-STD-7009 / 7009A standard
  document is held at NASA OCIO and is NOT publicly archived on NTRS. For
  Iter-3 V&V, USE M18's eight-factor list (Verification, Validation,
  Development Data Pedigree, Input Data Pedigree, Uncertainty Characterization,
  Results Robustness, Model Use History, Model Management) as canonical.
math_anchors:
  - "Poster credibility-factor TABLE (with weights, not the canonical list): Verification (0.20), Validation (0.25), Input Pedigree (0.10), Results Uncertainty (0.10), Results Robustness (0.10), Use History (0.15), M&S Management (0.05), People Qual. (0.05). Sum = 1.00."
  - "Poster scoring formula: Overall Credibility = sum over factors 1-5 of (Evidence Weight × CAS_score_i + Tech Review Weight × CAS_score_i) × CAS_Weight_i + sum over factors 6-8 of CAS_score_i × CAS_Weight_i."
  - "Threshold rule: 'if the defined threshold is surpassed, the combined sufficiency threshold should increase proportionately' (prevents artificial gain to overall score)."
  - "Review-level scoring: Level 4 = favorable external peer review + independent factor evaluation (committee >=75%); Level 3 = favorable external peer review; Level 2 = favorable formal internal peer review; (level 1 implied for self-review only)."
  - "Personnel roles defined: Developers (fundamental principles + math abstractions), Operators (execute model), [Validators / Customers presumably also defined in full standard]."
  - "DISCREPANCY: poster lists 'People Qual.' as factor 8 (qualifications of personnel); M18 §1 lists 'Model Management' as the 8th canonical factor. Resolution: NASA-STD-7009A revised the factor list between W14 (2014) and M18 (2018). Use M18 wording for Iter-3 V&V dossier; cite W14 poster only for the WEIGHTS, not the names."
---

                                   NASA-STD-7009 Guidance Document for Human Health and Performance
                                                       Models and Simulations
                                                                            Marlei Walton1, Lealem Mulugeta2, Emily Nelson3, and Jerry Myers3
                             1Wyle Science, Technology, and Engineering Group, Houston, TX, 2Universities Space Research Association, Division of Space Life Sciences, Houston, TX, 3NASA Glenn Research

                             Center, Cleveland, OH




               INTRODUCTION                                                                                                                                                               RESULTS
Rigorous verification, validation, and credibility                                                                                                                                      APPLICATION
(VV&C) processes are imperative to ensure that
models and simulations (M&S) are sufficiently reliable                                                                 Flow Diagram Example                                                                                               External Community
to address issues within their intended scope. The
                                                                                                                                                                                                       Results of the Interagency Modeling and Analysis Group (IMAG) discussion panel and NASA’s
NASA standard for M&S, NASA-STD-7009, was a                                                                                                                                                            approach to credibility assessment motivated the establishment of the “Committee for
resultant outcome of the Columbia Accident                                                                                                                                                             Developing Credible Multiscale Models for Healthcare”.
Investigation Board to ensure M&S are developed,                                                                                                                                                       The Academy of Science is currently holding a series of meetings
                                                                                                                                                                                                                                                                     g on the V&V and Uncertainty
applied, and interpreted appropriately for making                                                                                                                                                      Quantification of complex models and NASA has been
decisions that may impact crew or mission safety.                                                                                                                                                      asked to contribute to the biomedical modeling portion.
The NASA-STD-7009 Guidance Document is being
developed to augment the governing standard and
handbook to provide information, tools, and                                                                                                                                                            As a direct consequence of a presentation given NIH/IMAG regarding how NASA uses the
techniques applicable to the probabilistic and                                                                                                                                                         NASA-STD-7009 to vet biomedical models, the Food and Drug Administration is heavily
deterministic biological M&S more prevalent in                                                                                                                                                         leveraging 7009 to develop a new standard for “Verification and Validation of Computational
                                                                                                                                                                                                       Modeling of Medical Devices”.
human health and performance (HHP) and space
                                                                                                                                                                                                       The FDA regularly consults with HRP modeling teams in the development of this new
biomedical research and operations.                                                                                                                                                                    standard and NASA has a presence on the ASME V&V40 Sub-committee that is working with
                                                                                                                                                                                                       the FDA to develop the standard for “Verification and Validation of Computational Modeling of
                                                                                                                                                                                                       Medical Devices”.
                 PHILOSOPHY
                                                                                                                                                                                                                                           Getting It Right: Better Validation Key to Progress in Biomedical
                                                                                                                                                                                                                                           Computing - Bringing models closer to reality
Inherent in this guidance is the understanding that the
                                                                                                                                                                                                       Groundwork laid by the Digital Astronaut Project and Integrated Medical Model was featured
 application of many of these human health and                                                                                                                                                         in the 2012 fall issue (10/19/12) of the Biomedical Computation Review magazine and lauded
 systems M&S is to provide insight and information to                                                                                                                                                  as a “Comprehensive Validation” method.
 areas where such information is lacking, versus for
 design purposes. The key is that a) all parameters                                                                                                                            DISTINCTIVE FEATURES
 may not be known a priori, and b) the fundamental
 relationships between and among parameters may                             Credibility Assessment Weighting Factors                                                                 Criteria for Technical Review                                Personnel Roles and Responsibilities
 not be known. Thus in many cases, the M&S are                                                                                                                          Level 4 – Favorable external peer review accompanied by           Qualifications of the people involved in the development
 truly research efforts just to generate one simulation.             Credibility
                                                                    Assessment
                                                                                               Evidence          Tech. Review
                                                                                                                                Factor
                                                                                                                                         Weighted
                                                                                                                                          Factor
                                                                                                                                                  Overall Sufficiency   independent factor evaluation.                                    and implementation of the M&S should be evaluated
 This lack of specificity in the M&S is not a reason for              Factors
                                                                                         Score Weight Threshold Score Threshold Score     Score    Score Threshold
                                                                                                                                                                        Suggested process: Stand-up review with non-advocate              based on two criteria:
                                                                                          2     0.20      3       2       3       2        0.40
                                                                 1 Verification
                                                                                                                                                                        committee accompanied with hands-on use and evaluation of         1. What is the primary expertise of the personnel based
 the developer or customer to reduce the rigor in                2 Validation             2     0.25      2       2       3       2        0.50
                                                                 3 Input Pedigree         2     0.10      3       2       3       2        0.20
                                                                                                                                                                        the M&S by committee members using their own benchmarks              on their academic training and years of experience in
 assessing model credibility. Quite the opposite- the            4 Results Uncertainty
                                                                 5 Results Robustness
                                                                                          0
                                                                                          2
                                                                                                0.10
                                                                                                0.10
                                                                                                          2
                                                                                                          2
                                                                                                                  0
                                                                                                                  2
                                                                                                                          3
                                                                                                                          3
                                                                                                                                  0
                                                                                                                                  2
                                                                                                                                           0.00
                                                                                                                                           0.20   1.75      2.54        to score the M&S performance within the intended use.                the field?
                                                                 6 Use History            1     0.15      2      N/A     N/A      1        0.15
 more the models “are plastic”, the more rigor the               7 M&S Management         2     0.05      3      N/A     N/A      2        0.10                         Pass criteria: A favorable review by at least 75% of the          2. How well do the personnel’s academic and experience
                                                                 8 People Qual.           4     0.05      3      N/A     N/A      4        0.20
 developer must take and the customer must expect in                                                                                                                    committee is required to achieve this level.                         match with the task which they have been assigned
                                                                                                                                                                                                                                             within the M&S activity.
 order to adequately quantify the understanding of               ܱ‫ݕݐ݈ܾ݅݅݅݀݁ݎܥ݈݈ܽݎ݁ݒ‬                                                                                    Level 3 – Favorable external peer review.
                                                                        ହ
 model output application. By communicating a                                                                                                                           Suggested process: Stand-up review with non-advocate              NASA-STD-7009 categories of personnel:
                                                                 ൌ  ෍ሺ‫ ݐ݄ܹ݃݅݁݁ܿ݊݁݀݅ݒܧ‬ൈ ‫݁ݎ݋̴ܿܵܵܣܥ‬௜ ൅ ݄ܶ݁ܿǤ ܴ݁‫ݐ݄ܹ݃݅݁ݓ݁݅ݒ‬                                              group accompanied with mechanism to gain hands-on insight
 complete understanding as possible of the model’s                                                                                                                                                                                        Developers – Establish the fundamental principles and
                                                                      ௜ୀଵ                                                                                               of inner workings of M&S. May request to review the source
 effective abstraction of the real world human health                                                                   ଼                                                                                                                 mathematical abstractions of the model. Responsibility is
                                                                                                                                                                        code.
                                                                 ൈ ‫݁ݎ݋̴ܿܵܵܣܥ‬௜ ሻ ൈ ‫ݐ̴݄ܹ݃݅݁ܵܣܥ‬௜  ൅  ෍ ‫݁ݎ݋̴ܿܵܵܣܥ‬௜                                                                                                                          scientific and technical application of various principles to
 system, including level of validation and parameter                                                                                                                    Pass criteria: A favorable review by at least 75% of the
                                                                                                                                                                                                                                          provide a means of creating relevant simulations. Should
                                                                                                                       ௜ୀ଺
 sensitivities, the model becomes credible to the                                                                                                                       committee is required to achieve this level.
                                                                 ൈ ‫ݐ̴݄ܹ݃݅݁ܵܣܥ‬௜                                                                                                                                                           have a strong background in fundamental and applied
 decision maker and an integral part of their decision          To prevent artificial gain to the contribution of overall score, if                                     Level 2 – Favorable formal internal peer review.                  mathematics, physics and computational sciences.
 making process.                                                                                                                                                        Suggested process: Stand-up review internal review team           Responsible for credibility and validation of the model.
                                                                the defined threshold is surpassed, the combined sufficiency
                                                                threshold should increase proportionately.                                                              to score model’s performance accompanied with hands-on            Operators – Execute the model to perform a simulation.
                                                                                                                                                                        use and evaluation using their own benchmarks to score the        Generally the least technical but most familiar with using
                                                                                                                                                                        M&S performance within the intended use. An independent           the model.
       DISTINCTIVE FEATURES                                                                                                                                             factor rating is not required. May request to review the source
                                                                                                                                                                                                                                          Analysts – Define the initial conditions and boundaries
                                                                                                                                                                        code.
                                                                                                                                                                                                                                          of a simulation, and review and interpret the results of
                                                                                                                                                                        Pass criteria: A favorable review by at least 75% of the
                                                                                                                                                                                                                                          the simulation. Responsible for the credibility and
Three areas of the NASA-STD-7009 Guidance                                                                                                                               committee is required to achieve this level.
                                                                                                                                                                                                                                          validation of the simulations (not the model). Tend to be
Document that we consider unique from the governing                                                                                                                     Level 1 – Favorable informal internal peer review.                subject matter experts within the specific area which is
standard are:                                                                                                                                                           Suggested process: Technical interchange meetings or              being simulated.
                                                                                                                                                                        document reviews at major mile-stones of the M&S phases as
1. Credibility assessment weighting factors- different                                                                                                                  defined in the project schedule.
                                                                                                                                                                                                                                          A team member may hold more than one of these three
   for probabilistic and deterministic models                                                                                                                                                                                             roles within the M&S process. However, that individual’s
                                                                                                                                                                        Pass criteria: A favorable review by at least 75% of the
                                                                                                                                                                                                                                          level of qualification to accomplish that task must be
                                                                                                                                                                        committee is required to achieve this level.
2. Criteria for technical review- including not only the                                                                                                                                                                                  evaluated appropriately.
   details of technical review but also who should be                                                                                                                   Level 0 – Insufficient evidence.
   involved at each level
3. Personnel roles and responsibilities
                                                                                                                                                                           LESSONS LEARNED
                                                                        • Establishing M&S credibility starts before model development.
                REFERENCES                                              • M&S credibility includes modeling team with end user and/or customer at all stages of development and implementation.
[1] NASA-STD-7009: Standard for Models and                              • Lack of specificity in the M&S is not a reason for the developer or customer to reduce the rigor in assessing model credibility.
Simulations, 2008. Washington, DC: NASA.
                                                                        • Successful M&S will have ongoing credibility assessments throughout life of model; it is a continuous process.
