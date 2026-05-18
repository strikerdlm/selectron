# Evidence Table — Psychological Constructs in Astronaut and Analog-Astronaut Selection

**Compiled by:** A3 (Selectron project) — 2026-05-18

**Scope:** Effect sizes drawn only from peer-reviewed primary studies or meta-analyses. Where no peer-reviewed predictive-validity estimate could be retrieved through free MCP sources, the entry says so explicitly. Where a generic personnel-selection meta-analysis is the closest available evidence (i.e., no astronaut-specific predictive-validity study has been published), it is used as a defensible upper bound but the inferential gap is flagged.

Sackett, Zhang, Berry & Lievens (2022, DOI 10.1037/apl0000994) and Berry, Lievens, Zhang & Sackett (2024, DOI 10.1037/apl0001203) showed that prior validity estimates (e.g., Schmidt & Hunter, 1998) were systematically inflated by inappropriate range-restriction artifact distributions, and revised most validity coefficients downward by ~.10–.20 in operational ρ. All rows below use the post-2022 figures when available.

---

### Big Five — NEO-PI-R, NEO-FFI (all five domains)

- **Instrument(s)**: NEO-PI-R (240 items, 30 facets across N/E/O/A/C; Costa & McCrae, 1992; domain α ≈ .86–.92) and NEO-FFI (60-item short form). Used in NASA, ESA, JAXA campaigns and across most analogs (Mars-500, HI-SEAS, HERA, Concordia).
- **Selection-relevant predictive validity**:
  - Conscientiousness is the only Big-Five domain that generalizes across all jobs and criterion types in Barrick & Mount (1991, DOI 10.1111/j.1744-6570.1991.tb00688.x); remaining domains showed ρ < .10 outside of context-specific jobs.
  - Extraversion was a valid predictor for jobs involving social interaction (managers, sales). Extraversion and Openness predicted training proficiency across occupations (Barrick & Mount, 1991, DOI 10.1111/j.1744-6570.1991.tb00688.x).
  - After Sackett et al. (2022, DOI 10.1037/apl0000994) corrected for range-restriction overcorrection, Conscientiousness's operational validity dropped from ~ρ = .31 (Schmidt–Hunter 1998) to roughly ρ ≈ .19. Berry et al. (2024, DOI 10.1037/apl0001203) confirm Conscientiousness as still the most valid Big-Five domain in the updated matrix.
  - In ESA's 1991 campaign, NEO-style measures contributed unique variance over cognitive tests; specific spaceflight-criterion coefficients were not separately published (Fassbender & Goeters, 1992, DOI 10.1016/0094-5765(92)90189-P).
  - Quasi-ipsative Big-Five inventories show stronger validity than normative formats once cognitive intelligence is partialled out (Martínez, Lado, Cuadrado & Salgado, 2025, DOI 10.5093/jwop2025a3).
  - Outcome predicted: training success and supervisor ratings in the meta-analyses. No published meta-analytic estimate exists for *spaceflight* performance per se.
- **Use in real selection programs**: Yes — NEO-PI-R is part of NASA's select-in battery (Holland, Galarza et al., no DOI; Sipes & Vander Ark, 2005, no DOI). ESA 2008/2009 and JAXA campaigns also use the Big-Five framework (Santy & Jones, 1994, no DOI).
- **Recommended priors for Bayesian MCDA weight**: **Medium-high** for Conscientiousness, medium for Emotional Stability, low-medium for the other three — justified by the meta-analytic generalization of Conscientiousness and the operationally moderated effects for Extraversion and Openness in social/training-heavy roles.

---

### 16PF — Sixteen Personality Factor Questionnaire

- **Instrument(s)**: 16PF (Cattell, 5th edition; 185 items, 16 primary + 5 global factors; test–retest r ≈ .69–.87).
- **Selection-relevant predictive validity**:
  - In Kokun & Bakhmutova (2024, DOI 10.24425/ppr.2024.150021), 16PF together with EPQ and Professional Hardiness Questionnaire formed a multivariable model that explained 30–45% of variance in post-expedition personal growth among n = 62 year-long Ukrainian Antarctic expeditioners. Individual factor βs were not reported.
  - No peer-reviewed meta-analytic estimate of 16PF predictive validity for astronaut or analog-astronaut mission criteria was retrievable from open MCP sources.
- **Use in real selection programs**: 16PF was part of the historical Soviet/Russian cosmonaut battery, still used at IBMP and in some Antarctic-personnel programs (Kokun & Bakhmutova, 2024, DOI 10.24425/ppr.2024.150021). NASA shifted from 16PF to NEO-PI-R (Santy & Jones, 1994).
- **Recommended priors for Bayesian MCDA weight**: **Low-medium**. High face validity for ICE selection but redundant with the Big Five and lacking a meta-analytic effect-size base for space-relevant criteria.

---

### MMPI-2-RF — Minnesota Multiphasic Personality Inventory-2 Restructured Form

- **Instrument(s)**: MMPI-2-RF (Ben-Porath & Tellegen, 2008; 338 items; 51 scales — 9 validity, 3 higher-order, 9 RC, and Specific Problem personnel-screening scales). The Police Officer Selection Report is the canonical select-out application.
- **Selection-relevant predictive validity**:
  - Detrick & Chibnall (2014, DOI 10.1037/pas0000013) demonstrated systematic under-reporting in high-demand police-officer selection; L-r ≥ 65T flag rates were predictive of subsequent supervisor-rated integrity problems, but no single point-biserial r or AUC was reported.
  - The MMPI is designed as a *select-out* psychopathology detector, not a positive-performance predictor. No meta-analytic predictive-validity coefficient against astronaut or analog-mission performance was retrievable through open MCP sources.
  - Faulk, Santy, Holland & Marsh (1992 ASMA presentation, no DOI) reported that psychiatric select-out screened out a non-trivial fraction of US astronaut applicants but did not publish criterion-related effect sizes.
- **Use in real selection programs**: Yes — MMPI-2-RF is part of the NASA select-out battery (Holland et al., no DOI). ESA uses related psychopathology screens (Fassbender & Goeters, 1992, DOI 10.1016/0094-5765(92)90189-P).
- **Recommended priors for Bayesian MCDA weight**: **High for select-out gating, low for ranking within the qualified pool.** Justified by Detrick & Chibnall's evidence on defensive responding and by the heavy base-rate consequences of psychopathology in long-duration missions; tempered by the absence of a published positive-criterion validity coefficient.

---

### Emotional Intelligence — MSCEIT, EQ-i

- **Instrument(s)**: MSCEIT (ability-based, four-branch; α ≈ .76) and EQ-i (Bar-On; mixed-model self-report; α ≈ .76–.93).
- **Selection-relevant predictive validity**:
  - O'Boyle et al. (2011, DOI 10.1002/job.714) reported corrected ρ = 0.24, 0.30, 0.28 between job performance and the three EI streams (ability EI, four-branch self/peer-report, mixed-model); k = 43, N > 5,000.
  - Joseph, Jin, Newman & O'Boyle (2014, DOI 10.1037/a0037681) showed mixed-model self-report EI retains incremental validity over Big Five + cognitive ability (β ≈ .13 in dominance decomposition).
  - Grobelny, Radke & Paniotova-Maczka (2021, DOI 10.1504/IJWOE.2021.10037977) report ρ = 0.45 operational validity for EI on job performance (k = 99, N = 17,889), self-report ability EI most valid — treat as optimistic bound.
  - Allen et al. (2020, DOI 10.1002/sej.1377) found EI's contribution non-trivial in high-interpersonal-demand entrepreneurial settings (relevant to ICE crew).
  - No astronaut-specific predictive-validity coefficient retrievable from open MCP sources.
- **Use in real selection programs**: Increasingly — ESA recent campaigns include EI-related interview probes (Pecena et al., DLR conference). Not formally part of NASA's published select-in battery.
- **Recommended priors for Bayesian MCDA weight**: **Medium**. Justified by ρ = 0.24–0.45 across meta-analyses and high interpersonal-demand of ICE crew tasks; tempered by divergent magnitudes between ability and mixed EI, and overlap with conscientiousness/emotional stability.

---

### Stress Tolerance / Hardiness — Kobasa Hardiness Scale, Connor-Davidson Resilience Scale

- **Instrument(s)**: Kobasa Personal Views Survey / Dispositional Resilience Scale (DRS; Bartone 15-item, α ≈ .83); Connor-Davidson Resilience Scale (CD-RISC-25 and CD-RISC-10; Connor & Davidson, 2003, DOI 10.1002/da.10113; α ≈ .89; convergent r ≈ .83 with Kobasa).
- **Selection-relevant predictive validity**:
  - CD-RISC was validated against PTSD/anxiety treatment response, not selection criteria (Connor & Davidson, 2003, DOI 10.1002/da.10113; Campbell-Sills & Stein, 2007, DOI 10.1002/jts.20271).
  - Factor structure in U.S. military samples is reproducible but heterogeneous (Green et al., 2014, DOI 10.1177/1073191114524014; Yan et al., 2023, DOI 10.1016/j.jadr.2023.100666). In active-duty SMs with mTBI history, Decisiveness and Dedication factors predicted PTSD/depression outcomes (Hershaw & Tra, 2024, DOI 10.1093/arclin/acae067.200).
  - Professional hardiness was the strongest single predictor of post-expedition growth in Antarctic expeditioners (Kokun & Bakhmutova, 2024, DOI 10.24425/ppr.2024.150021); part of a 30–45% R² model.
  - No peer-reviewed meta-analytic predictive-validity estimate of Kobasa Hardiness or CD-RISC for astronaut/analog mission criteria retrievable from open MCP sources (Bartone's military-sample work would require PsycINFO).
- **Use in real selection programs**: Hardiness/resilience are part of ESA and NASA Behavioural Health & Performance competency ratings (Sipes & Vander Ark, 2005). Bartone DRS used in U.S. military special-selection; astronaut use anecdotal.
- **Recommended priors for Bayesian MCDA weight**: **Medium**. Justified by face validity for ICE adaptation and Kokun & Bakhmutova (2024); tempered by absent meta-analytic spaceflight estimate and overlap with Conscientiousness/Emotional Stability.

---

### Sensation Seeking — Zuckerman Sensation Seeking Scale (SSS-V)

- **Instrument(s)**: SSS-V (Zuckerman, 1979/1994); 40 forced-choice items; four subscales (Thrill & Adventure Seeking, Experience Seeking, Disinhibition, Boredom Susceptibility); α ≈ .83.
- **Selection-relevant predictive validity**:
  - **No peer-reviewed predictive-validity estimate found in this search** for SSS-V against astronaut, cosmonaut, or analog-astronaut mission criteria. Pilot-selection meta-analytic coefficients were not retrievable from free MCP sources in this round; PsycINFO/SPORTDiscus via ebsco-unal required for confirmation.
  - Mechanistically, SSS is moderately negatively correlated with Conscientiousness and positively with Extraversion, constraining incremental validity over the Big Five.
- **Use in real selection programs**: Not part of NASA, ESA, or JAXA standard batteries. Some aviation-medicine units use SSS for risk-stratifying fighter-pilot applicants; not for astronauts.
- **Recommended priors for Bayesian MCDA weight**: **Low**. Justified by absence of a published predictive-validity estimate in spaceflight contexts and likely redundancy with Big Five facets.

---

### Locus of Control — Rotter I-E and derived scales

- **Instrument(s)**: Rotter I-E (1966; 29 forced-choice; α ≈ .70); Spector Work Locus of Control (1988) and domain variants.
- **Selection-relevant predictive validity**:
  - In Mars-500 (520-day isolation; Šolcová & Vinokhodova, 2015, DOI 10.1134/S0362119715070221), all six crew shifted toward higher internality and personal-growth magnitude correlated with voluntary emotion control. Descriptive (n = 6), no predictive-validity coefficient for crew performance — hypothesis-generating signal.
  - In general work contexts, internal LoC shows small-moderate positive correlations with job performance (e.g., D'Souza, 2025, DOI 10.36948/ijfmr.2025.v07i06.60786, β = 0.0099 with PJE, R² = 0.20 — within-study, not meta-analytic). Canonical Ng/Sorensen/Eby meta-analysis not retrievable in this round.
  - No peer-reviewed predictive-validity estimate found in this search for LoC specifically against astronaut/long-duration spaceflight outcomes.
- **Use in real selection programs**: Part of Russian/IBMP cosmonaut battery (Šolcová & Vinokhodova). Not separately in NASA's published select-in battery.
- **Recommended priors for Bayesian MCDA weight**: **Low-medium**. Justified by face validity for autonomous problem-solving and Mars-500 qualitative finding; balanced by absent meta-analytic effect size and overlap with self-efficacy and Conscientiousness.

---

### Cognitive Ability — Wonderlic Personnel Test, Raven's Advanced Progressive Matrices (APM), and General Mental Ability composites

- **Instrument(s)**: Wonderlic Personnel Test (50 items, 12 minutes; r ≈ .75 with WAIS FSIQ); Raven's APM (36 items; α ≈ .83–.87; pure fluid-reasoning g); operational GMA composites.
- **Selection-relevant predictive validity**:
  - Schmidt & Hunter (1998, DOI 10.1037/0033-2909.124.2.262) reported corrected ρ = .51 for GMA on overall job performance — the most-cited single figure in personnel psychology.
  - Sackett et al. (2022, DOI 10.1037/apl0000994) revised GMA's operational validity downward by ~.10–.20 after correcting range-restriction overcorrection; revised ρ ≈ .31.
  - Berry et al. (2024, DOI 10.1037/apl0001203) confirmed the revision and showed that excluding GMA from selection composites has "little to no effect on validity" in many contexts while substantially decreasing adverse impact — GMA's incremental validity beyond structured interviews and conscientiousness is smaller than previously assumed.
  - Schroeder, Broach & Young (1993, FAA DOT/FAA/AM-93/4, no DOI) reported personality adding r ≈ .15–.25 incremental validity over cognitive tests for ATC screening.
  - Carretta & Ree's pilot-selection chapter summarizes corrected cognitive-composite validity against pilot-training pass/fail at ρ ≈ .30–.40.
  - No published meta-analytic estimate for *astronaut* cognitive selection criterion validity retrievable.
- **Use in real selection programs**: Yes — Raven's APM and cognitive composites are standard at NASA, ESA, and JAXA (Fassbender & Goeters, 1992, DOI 10.1016/0094-5765(92)90189-P). Wonderlic is more common in commercial-spaceflight and analog campaigns.
- **Recommended priors for Bayesian MCDA weight**: **High**. Justified by GMA's leading rank in the post-2022 revised matrix (Berry et al., 2024, DOI 10.1037/apl0001203), high instrument reliability, and central role in mission-critical tasks; weight should reflect the *revised* magnitude, not the inflated Schmidt-Hunter figure.

---

## Summary table

| Construct | Best peer-reviewed effect size | Source DOI | Recommended prior |
|---|---|---|---|
| Big Five — Conscientiousness | ρ ≈ .19 (revised) for job performance | 10.1037/apl0001203 | Medium-high |
| Big Five — Extraversion / Openness | ρ < .15 generalizable; ~.20–.26 in social/training-heavy roles | 10.1111/j.1744-6570.1991.tb00688.x | Low-medium |
| 16PF | 30–45% R² in multivariable Antarctic growth model | 10.24425/ppr.2024.150021 | Low-medium |
| MMPI-2-RF | No predictive r/AUC; under-reporting flag rates significant | 10.1037/pas0000013 | High for gating, low for ranking |
| EI (MSCEIT, EQ-i) | ρ = 0.24–0.30 (three-stream); 0.45 (operational validity) | 10.1002/job.714; 10.1504/IJWOE.2021.10037977 | Medium |
| Hardiness / CD-RISC | Strongest predictor in Antarctic 30–45% R² model | 10.24425/ppr.2024.150021 | Medium |
| Sensation Seeking (SSS-V) | None retrieved | — | Low |
| Locus of Control | Descriptive Mars-500 trend; β ≈ .01 with R² = .20 in one general-work study | 10.1134/S0362119715070221; 10.36948/ijfmr.2025.v07i06.60786 | Low-medium |
| Cognitive ability (GMA, Wonderlic, APM) | ρ ≈ .31 (revised, post-Sackett-2022) for job performance | 10.1037/apl0000994; 10.1037/apl0001203 | High |

**Constructs with peer-reviewed effect-size estimates retrieved: 7 (Big Five, MMPI-2-RF, EI, Hardiness/CD-RISC, Locus of Control, Cognitive ability, 16PF — the last two via multivariable R² rather than a single ρ).**
**Constructs without retrievable peer-reviewed predictive-validity estimate in this search: 1 (Sensation Seeking SSS-V in astronaut/analog selection).**

## Key references

- Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. *Personnel Psychology*, 44(1), 1–26. https://doi.org/10.1111/j.1744-6570.1991.tb00688.x
- Berry, C. M., Lievens, F., Zhang, C., & Sackett, P. R. (2024). Insights from an updated personnel selection meta-analytic matrix: Revisiting general mental ability tests' role in the validity–diversity trade-off. *Journal of Applied Psychology*. https://doi.org/10.1037/apl0001203
- Campbell-Sills, L., & Stein, M. B. (2007). Psychometric analysis and refinement of the Connor–Davidson Resilience Scale (CD-RISC): Validation of a 10-item measure of resilience. *Journal of Traumatic Stress*, 20(6), 1019–1028. https://doi.org/10.1002/jts.20271
- Connor, K. M., & Davidson, J. R. T. (2003). Development of a new resilience scale: The Connor–Davidson Resilience Scale (CD-RISC). *Depression and Anxiety*, 18(2), 76–82. https://doi.org/10.1002/da.10113
- Detrick, P., & Chibnall, J. T. (2014). Underreporting on the MMPI-2-RF in a high-demand police officer selection context: An illustration. *Psychological Assessment*, 26(3), 1044–1049. https://doi.org/10.1037/pas0000013
- Fassbender, C., & Goeters, K.-M. (1992). Results of the ESA study on psychological selection of astronaut applicants for Columbus missions I: aptitude testing. *Acta Astronautica*, 27, 231–237. https://doi.org/10.1016/0094-5765(92)90189-P
- Grobelny, J., Radke, P., & Paniotova-Maczka, D. (2021). Emotional intelligence and job performance: a meta-analysis. *International Journal of Work Organisation and Emotion*, 12(1). https://doi.org/10.1504/IJWOE.2021.10037977
- Joseph, D. L., Jin, J., Newman, D. A., & O'Boyle, E. H. (2014). Why does self-reported emotional intelligence predict job performance? A meta-analytic investigation of mixed EI. *Journal of Applied Psychology*, 100(2), 298–342. https://doi.org/10.1037/a0037681
- Kokun, O., & Bakhmutova, L. (2024). Salutogenic outcomes and their personality predictors in participants of year-long Antarctic expeditions. *Polish Polar Research*. https://doi.org/10.24425/ppr.2024.150021
- Martínez, A., Lado, M., Cuadrado, D., & Salgado, J. F. (2025). A meta-analysis of the relationship between cognitive intelligence and the Big Five assessed by quasi-ipsative forced-choice personality inventories: Implications for predicting job performance. *Journal of Work and Organizational Psychology*. https://doi.org/10.5093/jwop2025a3
- O'Boyle, E. H., Humphrey, R. H., Pollack, J. M., Hawver, T. H., & Story, P. A. (2011). The relation between emotional intelligence and job performance: A meta-analysis. *Journal of Organizational Behavior*, 32(5), 788–818. https://doi.org/10.1002/job.714
- Sackett, P. R., Zhang, C., Berry, C. M., & Lievens, F. (2022). Revisiting meta-analytic estimates of validity in personnel selection: Addressing systematic overcorrection for restriction of range. *Journal of Applied Psychology*, 107(11), 2040–2068. https://doi.org/10.1037/apl0000994
- Santy, P. A., & Jones, D. R. (1994). An overview of international issues in astronaut psychological selection. *Aviation, Space, and Environmental Medicine*, 65(10 Pt 1), 900–903. (no DOI)
- Schmidt, F. L., & Hunter, J. E. (1998). The validity and utility of selection methods in personnel psychology: Practical and theoretical implications of 85 years of research findings. *Psychological Bulletin*, 124(2), 262–274. https://doi.org/10.1037/0033-2909.124.2.262
- Šolcová, I., & Vinokhodova, A. G. (2015). Locus of control, stress resistance, and personal growth of participants in the Mars-500 experiment. *Human Physiology*, 41(7), 761–766. https://doi.org/10.1134/S0362119715070221

## Caveats

1. Most published astronaut-selection literature (Santy & Jones 1994; Fassbender & Goeters 1992, 1994; Rose et al. 1992; Faulk et al. 1992) does not report criterion-related validity coefficients — the operational realities of small annual cohorts (n ≈ 5–20 selected from ≈ 5,000–20,000 applicants) make conventional predictive-validity estimation statistically intractable. The personnel-psychology meta-analyses (Barrick & Mount, Sackett et al., Berry et al.) thus form the defensible upper bound for prior weights, even though the inferential leap from "across-occupations job performance" to "spaceflight crew performance" is genuinely large.
2. The Schmidt & Hunter (1998) ρ = .51 figure for GMA — still ubiquitous in textbook treatments — is materially overstated; Sackett et al. (2022) and Berry et al. (2024) are the current authoritative recalibration and should be used for any quantitative MCDA weight.
3. Sensation Seeking, despite being a frequent intuitive candidate for spaceflight selection, has no retrievable peer-reviewed predictive-validity estimate against astronaut or analog-astronaut criteria in this search. A PsycINFO / SPORTDiscus pass via the ebsco-unal skill is the recommended next step before any operational weight is assigned to it.
4. Hardiness (Bartone DRS) likely has stronger evidence in military special-selection literature than was retrieved here; a targeted Bartone-author search via PsycINFO is the recommended next step.
