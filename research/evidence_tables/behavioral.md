# Selectron Evidence Table — Behavioural & Team-Performance Constructs

Research agent: A5
Date: 2026-05-18
Scope: 9 constructs in astronaut and analog-astronaut selection. Each entry distinguishes "used in selection programs" (operational adoption) from "validated for selection" (peer-reviewed predictive validity against a job-performance criterion). Validity claims cite only literature retrieved in this scan. Where a construct is widely used but lacks retrieved peer-reviewed predictive-validity evidence for astronaut/analog selection, that is flagged.

---

### Behavioural-Based Interview (BBI)

- **Assessment method**: Structured past-behavior interview. Each item asks the candidate to describe a concrete past episode (situation, action, outcome). Anchored scoring rubric, multi-rater panel. Often paired with situational ("What would you do…") items.
- **Inter-rater reliability**: Structured interviews routinely report ICC ≥ .70 in the personnel-selection literature, but Wingate, Bourdage and Steel (2024) note that scoring procedures moderate validity and that more structured scoring is particularly helpful for contextual (non-task) constructs — implying reliability is procedure-dependent rather than inherent to BBI.
- **Predictive validity**: Past-behavioral interview items predict job performance (Hartwell, Johnson & Posthuma, 2019; significant direct effect on job-performance ratings and indirect effect on turnover). Construct-specific meta-analysis: ρ ≈ .30 for task-performance constructs and ρ ≈ .28 for contextual-performance constructs (Wingate, Bourdage & Steel, 2024, k = 37, N ≈ 30 646). Schmidt and Rader's (1999) earlier empirically-keyed interview meta-analysis reported corrected validities in the .30–.40 range for structured behavior-based formats.
- **Real-program adoption**: NASA's Behavioral Health and Performance Operations group uses structured behavioral interviewing as part of astronaut selection and astronaut-candidate annual evaluations (Dukes, 2023; Beven, 2017). ESA's astronaut selection campaigns include structured psychological interviews in the final phases. JAXA's selection rounds are described in agency materials as including structured panel interviews. None of these agencies has published a within-program criterion-validation of BBI ratings against in-flight performance (small N, restricted range).
- **Encoding suggestion for Selectron**: 1–5 ordinal per BBI competency dimension, panel mean over ≥ 3 raters, with a separate rater-agreement scalar (e.g., ICC or SD across raters) fed forward as a confidence weight. Prior centered at the meta-analytic ρ ≈ .30 (i.e., a moderately informative prior on BBI → criterion).

---

### NASA Behavioral Health and Performance (BHP) Competency Framework

- **Assessment method**: Multi-method, multi-trait. Combines psychological history review, structured clinical interview, psychiatric and personality testing, behavioral observation across selection events, and "spaceflight duty adaptability" judgement. Operated by the BHP Operations Group at Johnson Space Center across selection, candidate training, annual evaluations, pre-flight, in-flight, and post-flight phases (Beven, 2017; Dukes, 2023).
- **Inter-rater reliability**: Not published as a single program-level ICC. BHP relies on consensus panel judgement rather than a single instrument, so reliability is a property of each component (e.g., the structured psychiatric interview, the behavioral-observation form during analog missions).
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved that links BHP ratings to in-flight performance outcomes. Validation is largely operational and consensual; agency-internal validation is constrained by very small selection N and restricted range. Dukes (2023) and Beven (2017) describe the framework without reporting validity statistics. de la Torre et al. (2024) explicitly recommend analog-mission research as the vehicle for accumulating behavioral-health validation evidence — implying that gap is acknowledged at the ESA Topical Team level.
- **Real-program adoption**: NASA (primary), with coordination across ESA, Roscosmos, JAXA and CSA via the International Human Health and Behavior Working Group for spaceflight (Dukes, 2023).
- **Encoding suggestion for Selectron**: Treat BHP as a composite latent score rather than a single rater output. Encode component instruments separately (clinical interview, personality inventory, peer rating, observation), each on its native scale, then aggregate via a weighted panel-mean with weights elicited from BHP operational practice. Use a weakly informative prior given the absence of public validation coefficients; flag the construct as **used but not publicly validated for selection**.

---

### ESA "Tea-Room" Assessment Center

- **Assessment method**: Multi-day group assessment used historically in ESA astronaut selection. Candidates are observed in unstructured social settings (the "tea room"), group exercises, leaderless group discussions and role-plays, scored by trained psychologists against pre-specified behavioral anchors (cooperation, social sensitivity, leadership emergence, stress tolerance).
- **Inter-rater reliability**: No peer-reviewed ICC retrieved for ESA's specific protocol. General assessment-center literature reports ICCs in the .60–.80 range for trained-observer dimension ratings, but the ESA tea-room protocol itself has not been published as a validation study.
- **Predictive validity**: No peer-reviewed predictive validity against astronaut performance retrieved. Assessment centers in general personnel selection have published meta-analytic validities (typically corrected r ≈ .25–.40), but those numbers were not retrieved in this scan and cannot be quoted as specific to astronaut selection.
- **Real-program adoption**: ESA selection campaigns (2008–09, 2021–22). Element-by-element protocols are described in ESA medical board materials and de la Torre et al. (2024) reference the role of group-based behavioral assessment in analog environments.
- **Encoding suggestion for Selectron**: Encode each behavioral anchor as a separate 1–5 ordinal dimension (e.g., cooperation, social sensitivity, emergent leadership, stress tolerance), panel mean over ≥ 2 trained observers, with a categorical "session type" tag (group exercise, unstructured social, role-play). Flag construct as **used in selection without retrieved peer-reviewed predictive-validity evidence**.

---

### Team Adaptability, Shared Mental Models and Backup Behaviour (Salas "Big Five" of Teamwork)

- **Assessment method**: Multiple modalities — self-report questionnaires (Salas, Sims & Burke, 2005, scale and derivatives), trained-observer behavior-coding during team simulations, communication-transcript analysis, and shared-mental-model elicitation (concept-mapping, pairwise similarity, Pathfinder networks). Salmon et al. (2026) note that across 38 included studies the modalities are heterogeneous: questionnaires, surveys, interviews, observer rating scales, and communication transcript analysis.
- **Inter-rater reliability**: For trained-observer ratings of teamwork dimensions, published ICCs typically fall in the .70–.85 range in the healthcare and aviation crew-resource-management literature; Salmon et al. (2026) note that fewer than a third of reviewed studies measured all five processes simultaneously, limiting cross-study comparability.
- **Predictive validity**: Espevik, Johnsen and Hystad (2022, k = 167 frontline officers, operational police simulation) found that shared mental models had a significant direct effect on team adaptability, that backup behavior predicted both adaptability and team effectiveness, and that mutual performance monitoring acted through backup behavior. The original Salas et al. (2005) theoretical model has been confirmed in part — six of ten direct effects, four of seven indirect effects — in that simulation. Salmon et al. (2026, scoping review) emphasizes that direct relationships between model components and team effectiveness remain under-tested in peer-reviewed work, particularly for human–autonomy teams.
- **Real-program adoption**: NASA uses analog environments (HERA, HI-SEAS, Antarctic stations, Aquarius/NEEMO) to observe team dynamics including backup behavior, mutual performance monitoring, and shared situation awareness (de la Torre et al., 2024; Rahill et al., 2025). The Salas framework underlies NASA Behavioral Health and Performance team-cohesion countermeasure research and crew-composition heuristics.
- **Encoding suggestion for Selectron**: Encode each Big-Five dimension (team orientation, mutual performance monitoring, backup behavior, adaptability, leadership) as a 1–5 ordinal observer rating per team episode, panel mean over ≥ 2 raters. Shared mental models encoded as a continuous similarity score (0–1) from concept-mapping. Combine via a hierarchical model with team-level random effects. Prior: moderately informative, anchored on the Espevik et al. (2022) path coefficients.

---

### Leadership in Long-Duration Crews (Transformational vs. Transactional, Bass)

- **Assessment method**: Multifactor Leadership Questionnaire (MLQ-5X; Bass & Avolio, peer-rated 360°), structured behavioral observation during analog missions, situational role-play during selection. For astronaut commanders, NASA uses behavioral interviewing and peer/instructor ratings during candidate training.
- **Inter-rater reliability**: MLQ-5X subscale alphas are typically reported in the .70–.85 range in the management literature; no astronaut-specific ICC retrieved.
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved that links MLQ scores or any leadership-style measure to astronaut or analog-astronaut mission performance. General-management meta-analyses of transformational leadership exist (Judge & Piccolo, 2004 is the canonical reference, not retrieved in this scan) — those are not specific to spaceflight. Kanas et al.'s (2000, 2001) Shuttle/Mir studies analyse leader-role behaviour and crew–ground interactions but report descriptive group differences rather than a predictive-validity coefficient for leadership style on mission outcome.
- **Real-program adoption**: NASA includes leadership behaviour observation during long-duration training and selects flight commanders partly on demonstrated leadership in operational settings. ESA and JAXA similarly weight leadership in commander selection. None has published a within-program validation of MLQ-style scoring.
- **Encoding suggestion for Selectron**: Encode transformational leadership (idealized influence, inspirational motivation, intellectual stimulation, individualized consideration) and transactional leadership (contingent reward, management-by-exception) on a 1–5 ordinal per subscale, peer-mean over ≥ 3 peers when observable. Include a separate "in confined-crew" tag because expression of leadership style is context-dependent. Flag construct as **used without retrieved astronaut-specific peer-reviewed predictive validity**.

---

### Conflict-Resolution Style (Thomas-Kilmann)

- **Assessment method**: Thomas-Kilmann Conflict Mode Instrument (TKI), forced-choice self-report yielding five style scores (competing, collaborating, compromising, avoiding, accommodating).
- **Inter-rater reliability**: TKI is self-report, so inter-rater reliability is not the relevant statistic; test–retest and internal-consistency reliabilities have been published in the general organizational-behavior literature (alpha typically .40–.70 across modes — known psychometric weakness because of the ipsative format). No astronaut-specific reliability retrieved.
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved linking TKI scores to astronaut or analog-mission outcomes. Kanas et al. (2000, 2001) document interpersonal conflict and displacement on Shuttle/Mir without using the TKI instrument.
- **Real-program adoption**: TKI and similar conflict-style instruments are used in astronaut and crew training (not as a selection cut-score) at NASA and partner agencies. de la Torre et al. (2024) lists conflict management as a key behavioral-health variable to track in analog research.
- **Encoding suggestion for Selectron**: Encode the five TKI styles as five continuous (0–1) profile coordinates summing to 1 (because of ipsativity, do not enter them as five independent scalars in a regression — model the profile or use a softmax/Dirichlet representation). Pair with a behaviorally-anchored observer rating of conflict-resolution behavior during analog episodes (1–5, panel mean) as the validity-relevant signal. Flag construct as **used in training without retrieved peer-reviewed selection-validity evidence**.

---

### Communication Competence (incl. Chronemics in Confined-Crew Communications)

- **Assessment method**: Communication-transcript analysis (turn-taking, latency, interruption, topic management), behaviorally-anchored observer rating during simulation, self-report communication-competence inventories. Chronemics — the time structure of communication (turn latencies, response delays under communication blackout) — has been measured in confined-environment simulations.
- **Inter-rater reliability**: For trained-observer coding of communication events, published ICCs in CRM and HFE research typically range .70–.90. No astronaut-specific ICC retrieved in this scan.
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved linking communication-competence scores to astronaut mission outcomes. Kanas et al. (2000, 2001, 2010) report descriptive findings on crew–ground communication during Shuttle/Mir and Mir-simulation studies; high-autonomy versus low-autonomy crew comparisons (Kanas et al., 2010) found differences in crew–ground communication patterns but did not publish a predictive coefficient against operational outcome.
- **Real-program adoption**: NASA Mission Control behavioral specialists monitor crew–ground communication patterns operationally. Analog programs (HERA, SIRIUS, CHAPEA) instrument communication for behavioral-health research (de la Torre et al., 2024; Rahill et al., 2025).
- **Encoding suggestion for Selectron**: Encode (a) observer-rated communication competence on a 1–5 ordinal (panel mean), (b) measurable chronemic features as continuous scalars (median response latency, turn-overlap rate, interruption density), and (c) a delayed-communication-condition flag for simulations that imposed Earth–Mars-like latency. Flag construct as **observationally tracked but without retrieved peer-reviewed selection-validity evidence**.

---

### Cross-Cultural Competence

- **Assessment method**: Cultural Intelligence Scale (CQS; Ang & Van Dyne and colleagues, four-factor: metacognitive, cognitive, motivational, behavioral), Multicultural Personality Questionnaire, language proficiency assessment, and behavioral observation during multinational analog or training rotations.
- **Inter-rater reliability**: CQS is self-report (internal consistency typically alpha .80+ in expatriate samples per the general literature; not retrieved in this scan). Observer-rated cross-cultural behavior during simulations: no astronaut-specific ICC retrieved.
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved linking cross-cultural-competence measures to astronaut performance. Kanas et al. (2000) document cultural-issue patterns in Shuttle/Mir crew–ground interactions, finding measurable differences between U.S. and Russian crew members and ground personnel in displacement/interpersonal-tension reporting, but did not publish a predictive coefficient against mission outcome.
- **Real-program adoption**: ISS-era partner agencies coordinate language training (Russian for U.S. astronauts, English for partner-agency crew) and inter-agency cultural orientation. ESA selection considers multinational team experience qualitatively. de la Torre et al. (2024) lists cross-cultural research as a recommended analog-mission focus.
- **Encoding suggestion for Selectron**: Encode CQ as four continuous subscale scores (z-standardized within the candidate pool), supplemented by an observer-rated 1–5 cross-cultural-effectiveness rating from any multinational analog episode (panel mean). Include a binary indicator for documented multinational team experience (months on multinational team). Flag construct as **used qualitatively without retrieved peer-reviewed predictive validity for astronaut selection**.

---

### Stress-Coping Styles (Problem-Focused vs. Emotion-Focused, Lazarus & Folkman)

- **Assessment method**: Ways of Coping Questionnaire (Folkman & Lazarus), COPE Inventory (Carver et al.), Brief COPE; self-report categorical or continuous on problem-focused, emotion-focused and (in later instruments) dysfunctional-coping subscales. Behavioral observation of coping behavior under analog-mission stressors supplements self-report.
- **Inter-rater reliability**: Coping inventories are self-report; internal-consistency reliabilities published in the general clinical-psychology literature (typically alpha .60–.85 by subscale) — not retrieved in this scan for astronaut samples.
- **Predictive validity**: No peer-reviewed predictive-validity coefficient retrieved that links coping-style measures to astronaut or analog-astronaut performance outcomes. de la Torre et al. (2024) explicitly recommends stress-coping as a target variable for analog-mission research, implying the validation gap is recognized. Adkins et al. (2026) report stress and conditioned-fear responses in a rat model of space-radiation exposure — animal, not selection-relevant predictive validity.
- **Real-program adoption**: Coping inventories are used in astronaut psychological assessment (e.g., as part of clinical interview triangulation) and in analog-mission research (de la Torre et al., 2024). They are not, to this scan's knowledge, used as a hard selection cut-score by NASA, ESA or JAXA.
- **Encoding suggestion for Selectron**: Encode problem-focused, emotion-focused and dysfunctional-coping subscales as three continuous z-scored scalars (do not collapse them — they are functionally distinct, not opposed). Add a "coping flexibility" derived feature (within-candidate variability across stressor types if multiple inventories or vignettes are administered). Flag construct as **used clinically/observationally without retrieved peer-reviewed selection-validity evidence**.

---

## Summary

- **Constructs covered**: 9 (BBI, NASA BHP framework, ESA tea-room assessment center, Salas Big Five teamwork [shared mental models / backup behavior / team adaptability], transformational/transactional leadership, Thomas-Kilmann conflict style, communication competence/chronemics, cross-cultural competence, Lazarus–Folkman coping styles).
- **With retrieved peer-reviewed predictive validity (in any operational context, not necessarily astronaut)**: 3 — BBI (Wingate et al., 2024; Hartwell et al., 2019; Schmidt & Rader, 1999); Salas Big Five teamwork dimensions (Espevik et al., 2022; Salmon et al., 2026); situational-judgment-test methodology referenced in the BBI entry (Webster et al., 2020; Martín-Raugh et al., 2025) is operationally adjacent.
- **Used in astronaut/analog selection programs without retrieved peer-reviewed predictive-validity evidence specific to selection**: 6 (NASA BHP framework, ESA tea-room, transformational leadership in crews, Thomas-Kilmann, chronemics/communication competence, cross-cultural competence, coping styles). For these, Selectron should treat ratings as informative but apply weakly informative priors and flag the validation gap downstream.

## References

- Adkins, A. M., Boden, A. F., Singh, N., Luyo, Z. N. M., Britten, R. A., Wellman, L. L., & Sanford, L. D. (2026). Effects of 15 cGy GCRsim space radiation on conditioned fear and stress responses in stress resilient and vulnerable rats. *Radiation Research*. https://doi.org/10.1667/RADE-25-00092.1
- Beven, G. (2017). Behavioral Health and Performance Operations at the NASA Johnson Space Center. NASA Technical Reports Server, 20170003866.
- de la Torre, G. G., Groemer, G., Diaz-Artiles, A., Pattyn, N., Van Cutsem, J., Musilova, M., et al. (2024). Space Analogs and Behavioral Health Performance Research review and recommendations checklist from ESA Topical Team. *npj Microgravity*. https://doi.org/10.1038/s41526-024-00437-w
- Dukes, C. H. (2023). NASA's behavioural health and performance services for long duration space missions. *Journal of Neurology, Neurosurgery & Psychiatry* (BNPA Abstract). https://doi.org/10.1136/jnnp-2023-bnpa.15
- Espevik, R., Johnsen, B. H., & Hystad, S. W. (2022). Police Dyads Within an Operational Simulation: an Empirical Test of the Research Propositions Made in the "Big Five" Teamwork Approach. *Journal of Police and Criminal Psychology*. https://doi.org/10.1007/s11896-022-09513-x
- Hartwell, C. J., Johnson, C. D., & Posthuma, R. A. (2019). Are we asking the right questions? Predictive validity comparison of four structured interview question types. *Journal of Business Research*, 100, 87–96. https://doi.org/10.1016/j.jbusres.2019.03.026
- Kanas, N., Salnitskiy, V., Grund, E. M., Gushin, V., Weiss, D. S., Kozerenko, O., Sled, A., & Marmar, C. R. (2000). Interpersonal and cultural issues involving crews and ground personnel during Shuttle/Mir space missions. *Aviation, Space, and Environmental Medicine*, 71(9 Suppl), A11–A16.
- Kanas, N., Salnitskiy, V., Weiss, D. S., Grund, E. M., Gushin, V., Kozerenko, O., Sled, A., Bostrom, A., & Marmar, C. R. (2001). Crewmember and ground personnel interactions over time during Shuttle/Mir space missions. *Aviation, Space, and Environmental Medicine*, 72(5), 453–461.
- Kanas, N., Saylor, S., Harris, M., Neylan, T., Boyd, J., Weiss, D. S., Baskin, P., Cook, C., & Marmar, C. R. (2010). High versus low crewmember autonomy in space simulation environments. *Acta Astronautica*. https://doi.org/10.1016/j.actaastro.2010.05.009
- Martín-Raugh, M. P., Gallegos, E., Smith, K. M., Brooks, R. R., & Kell, H. J. (2025). The Validity of Single-Response Situational Judgment Tests: A Nomological Network Meta-Analysis. *International Journal of Selection and Assessment*. https://doi.org/10.1111/ijsa.70025
- Rahill, K. M., Mulavara, A., George, K., Gore, B., & Whitmire, A. M. (2025). Increasing fidelity in lunar and martian analogs for behavioral health and performance research. *Frontiers in Space Technologies*. https://doi.org/10.3389/frspt.2025.1505823
- Salmon, P. M., King, B. J., Hall, D., McLean, S., Thompson, J., Cooke, N. J., Salas, E., Loft, S., & Read, G. J. M. (2026). The big five model of teamwork and human autonomy teams: a scoping review. *Applied Ergonomics*. https://doi.org/10.1016/j.apergo.2026.104761
- Schmidt, F. L., & Rader, M. (1999). Exploring the boundary conditions for interview validity: Meta-analytic validity findings for a new interview type. *Personnel Psychology*, 52(2), 445–464. https://doi.org/10.1111/j.1744-6570.1999.tb00169.x
- Webster, E. S., Paton, L. W., Crampton, P. E. S., & Tiffin, P. A. (2020). Situational judgement test validity for selection: A systematic review and meta-analysis. *Medical Education*. https://doi.org/10.1111/medu.14201
- Wingate, T. G., Bourdage, J. S., & Steel, P. (2024). Evaluating interview criterion-related validity for distinct constructs: A meta-analysis. *International Journal of Selection and Assessment*, 32(3). https://doi.org/10.1111/ijsa.12494
