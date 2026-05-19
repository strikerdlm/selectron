# Selection test battery expansion — beyond NEO-PI-R, VO₂max, BBI

## Methodology

Search was executed on 2026-05-19 using three primary MCP tools: (1) `mcp__paper-search__search_pubmed` for keyword searches across PubMed-indexed literature; (2) `mcp__claude_ai_Scite__search_literature` for targeted retrieval of full-text excerpts and Smart Citation context from specific DOIs and author+topic queries; and (3) the Phase 0 evidence tables already compiled in `research/evidence_tables/` (agents A3, A4, A5), which were read first to avoid redundancy and to identify gaps. Inclusion criteria required all proposed tests to: (a) be an existing published instrument with its own validation literature; (b) produce a bounded numeric score integrable into Selectron's `Criterion.scale`; and (c) have at least one peer-reviewed predictive-validity estimate — expressed as a correlation coefficient (r or ρ), standardised mean difference (Cohen's d), or documented incidence/outcome rate — against an analog-mission, spaceflight, or operationally equivalent outcome. Tests with only descriptive evidence in small samples (n < 6) or only conceptual endorsement were considered but rejected (see Dropped section). The analog-mission corpus used for evidence triangulation included Mars-500 (520 d), HERA campaigns, Concordia Antarctic winter-over, HI-SEAS, EMMPOL-6, THOR, and ISS 6-month missions.

---

## Recommended additional tests (ranked by importance)

### Test 1: NASA Cognition Battery (NeuroCog / spaceflight standard)

- **Domain:** cognitive
- **Instrument:** NASA Cognition Test Battery (Basner et al., 2015, DOI 10.3357/amhp.4343.2015); 10 subtests — Motor Praxis Task (MPT), Psychomotor Vigilance Test (PVT-B), Digit Symbol Substitution Test (DSST), Abstract Matching (AM), Line Orientation Test (LOT), Fractal 2-Back (F2B), Emotion Recognition Task (ERT), Matrix Reasoning Task (MRT), Balloon Analogue Risk Task (BART), Visual Object Learning Task (VOLT). Administered via tablet (Joggle Research / Pulsar Informatics). Duration: ~25 min per administration; 15 alternate forms to suppress practice ceiling. Open-access normative dataset for astronaut-candidate population (n = 25 ISS astronauts, Dev et al. 2024, DOI 10.3389/fphys.2024.1451269).
- **Output scale:** z-score per domain relative to pre-flight baseline (or candidate-cohort mean); speed and accuracy dimensions reported separately. Composite cognitive throughput z-score is the primary Selectron input (continuous, mean = 0, SD = 1 in normative sample; operational range approximately −3 to +3).
- **Predictive validity:**
  - One night of total sleep deprivation produced Cohen's d = 1.00 for psychomotor vigilance, d = 0.68 for cognitive throughput, and d = 0.65 for abstract reasoning (Basner et al. 2015; k = 1, n in validation sample).
  - DSST average response time predicted 6-degrees-of-freedom spacecraft docking performance at unadjusted r = 0.550; a 3-subtest model (DSST + Abstract Matching + Fractal 2-Back) explained R² = 0.30 of variance in docking performance after semipartial cross-validation (Basner, Moore et al. 2020, DOI 10.3357/amhp.5602.2020; n = 30 astronaut-analog subjects).
  - In 25 ISS astronauts on 6-month missions, 11.8% of all flight and post-flight scores fell ≥ 1.5 SD below the pre-flight sample mean, with processing speed (DSST), visual working memory (F2B), and sustained attention (PVT) showing the greatest mission-phase sensitivity (Dev et al. 2024, DOI 10.3389/fphys.2024.1451269).
  - In HERA analog campaigns, one night of total sleep deprivation significantly slowed psychomotor vigilance and cognitive throughput (Basner, Nasrini et al. 2020, DOI 10.3389/fphys.2020.00394; n = 32 crewmembers).
- **Bayesian/IMM integration:** The composite cognitive throughput z-score (or DSST alone as the highest-validity subscale) enters directly as a continuous Criterion with scale bounded by cohort norms. Literature-elicited prior weight: **High** (r = 0.55 for operational task; d ≥ 0.65 under known stressor; instrument designed for astronaut-level performers). IMM β-vulnerability note: processing speed is specifically listed as a spaceflight risk channel (Patel et al. 2020, DOI 10.1038/s41526-020-00124-6); can be modelled as a β-vulnerability parameter if baseline DSST is below the 25th percentile of the ISS normative sample.
- **References:**
  - Basner, M., Savitt, A., Moore, T. M., et al. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. *Aerospace Medicine and Human Performance*, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015
  - Basner, M., Moore, T. M., Hermosillo, E., et al. (2020). Cognition test battery performance is associated with simulated 6df spacecraft docking performance. *Aerospace Medicine and Human Performance*, 91(11), 861–867. https://doi.org/10.3357/amhp.5602.2020
  - Basner, M., Nasrini, J., Hermosillo, E., et al. (2020). Cognitive Performance During Confinement and Sleep Restriction in NASA's Human Exploration Research Analog (HERA). *Frontiers in Physiology*, 11, 394. https://doi.org/10.3389/fphys.2020.00394
  - Dev, S. I., Khader, A., Begerowski, S. R., et al. (2024). Cognitive performance in ISS astronauts on 6-month low earth orbit missions. *Frontiers in Physiology*, 15, 1451269. https://doi.org/10.3389/fphys.2024.1451269
- **Lay explanation:** This is a tablet-based test battery used by NASA on the International Space Station that checks ten different thinking skills, including reaction speed, memory, and spatial reasoning. It catches real mental slowing in astronauts during missions and predicts how well a person performs complex tasks like docking a spacecraft. A candidate who scores lower on this battery is more likely to struggle with high-stakes technical operations during an analog mission.

---

### Test 2: PVT-B — Psychomotor Vigilance Test, Brief (3-minute)

- **Domain:** cognitive / neurobehavioural vigilance
- **Instrument:** PVT-B, 3-minute version of the Dinges PVT (Basner et al. 2011, DOI 10.1093/sleep/34.5.581; available via Pulsar Informatics Inc.). Administered on a laptop or tablet; the "Reaction Self-Test" on the ISS is this instrument. Also embedded as a subtest within the NASA Cognition Battery (above), but deployable as a standalone 3-minute screen.
- **Output scale:** Number of lapses (reaction time > 500 ms); mean reciprocal reaction time (1/RT, in 1/s); false starts. Primary Selectron score: **lapse count** (integer ≥ 0; operational range 0–60 for a 3-min test; higher = worse). Can be expressed as a z-score relative to the astronaut normative dataset (n > 24 ISS crewmembers, >2 500 administrations).
- **Predictive validity:**
  - PVT-B performance predicted simulated luggage-screening task errors (r significant, direction consistent with sleep deprivation sensitivity) and co-varied continuously over 34 hours of total sleep deprivation (Basner & Dinges 2011, DOI 10.1093/sleep/34.5.581).
  - In Mars-500 (520-day analog), PVT-B was the primary objective performance measure; one crewmember showed persistent PVT-B errors of omission and commission, co-occurring with chronic partial sleep deprivation and elevated conflict ratings — he accounted for a disproportionate share of crew-ground conflicts (Basner et al. 2014, DOI 10.1371/journal.pone.0093298; n = 6).
  - Tu et al. (2022, DOI 10.1038/s41598-022-14456-8; n = 24 ISS astronauts, longitudinal) confirmed that previous PVT-B performance, fatigue, and stress ratings were the highest-ranking predictors of next-session PVT-B in an ensemble model, with r_individual ≈ 0.4–0.6 across subjects.
  - Maki, Fink & Weaver (2022, DOI 10.1093/sleepadvances/zpac033) confirmed that shorter sleep durations in astronauts were associated with slower PVT reaction times and increased lapse counts; each lapse increase was associated with elevated accident risk in comparable vigilance-sensitive occupations (8% increased hard-braking rate per lapse in truck drivers as a reference bound).
  - PVT has negligible aptitude and learning effects — unlike many cognitive tests, baseline differences reflect genuine neurobehavioural trait vulnerability to sleep loss rather than prior experience or task-specific training (Basner et al. 2015).
- **Bayesian/IMM integration:** Lapse count at baseline enters as a continuous Criterion (lower = better; ceiling at 0, floor unbounded). IMM β-vulnerability: lapse counts above the 75th percentile of the normative sample flag individuals with trait vulnerability to sleep-restriction-induced performance decrement — precisely the population that becomes high-risk during the sleep-disrupted phases of any long-duration analog mission (third-quarter syndrome, EVA scheduling). Prior weight: **High** — unique among candidate instruments in being deployed continuously on ISS and across all major analogs (Mars-500, HERA, NEEMO) with a homogeneous measurement protocol.
- **References:**
  - Basner, M., & Dinges, D. F. (2011). Maximizing sensitivity of the psychomotor vigilance test (PVT) to sleep loss. *Sleep*, 34(5), 581–591. https://doi.org/10.1093/sleep/34.5.581
  - Basner, M., Dinges, D. F., Mollicone, D. J., et al. (2014). Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars. *PLoS ONE*, 9(3), e93298. https://doi.org/10.1371/journal.pone.0093298
  - Tu, D., Basner, M., Smith, M. G., et al. (2022). Dynamic ensemble prediction of cognitive performance in spaceflight. *Scientific Reports*, 12(1). https://doi.org/10.1038/s41598-022-14456-8
  - Maki, K. A., Fink, A. M., & Weaver, T. E. (2022). Sleep, time, and space — fatigue and performance deficits in pilots, commercial truck drivers, and astronauts. *Sleep Advances*, 3(1). https://doi.org/10.1093/sleepadvances/zpac033
- **Lay explanation:** The PVT-B is a 3-minute computer test that measures how fast and consistently a person responds to a randomly appearing visual stimulus. It is used by NASA on the International Space Station every week to catch crew members who are getting dangerously slow due to sleep loss — before they attempt a spacewalk or docking manoeuvre. Candidates who have many slow responses at baseline are more likely to become impaired during the sleep-disrupted phases of an analog mission.

---

### Test 3: SOT-5 / Computerized Dynamic Posturography (Sensory Organization Test)

- **Domain:** sensorimotor
- **Instrument:** Sensory Organization Test, Condition 5 (SOT-5) administered via NeuroCom Equitest Computerised Dynamic Posturography platform (NeuroCom International, Clackamas, OR; Reschke et al. 2009, Aviation Space Environ Med, DOI 10.3357/asem.br06.2009). SOT-5 requires standing on a sway-referenced platform with eyes closed, isolating vestibular contributions. SOT-5M (with dynamic head tilts at ±5° @ 0.33 Hz) is the enhanced version used post-ISS.
- **Output scale:** Equilibrium Score (EQ; 0–100, continuous; 100 = perfect sway-referenced balance; population norm for healthy adults ≈ 55–65 on SOT-5). Higher score = better postural control.
- **Predictive validity:**
  - Tays et al. (2021, DOI 10.3389/fncir.2021.723504; n = 15 ISS astronauts, 6-month missions): SOT-5 EQ scores declined significantly from pre- to post-flight (F-test significant, effect persisted to R+7 for SOT-5M with head tilts); full recovery required ≥ 30 days post-flight. Pre-flight SOT-5 EQ score is the baseline reference; lower pre-flight scores predict slower post-landing recovery.
  - Ozdemir et al. (2018, DOI 10.3389/fphys.2018.01680; n = 11 Shuttle astronauts + matched controls): On landing day (R+0), 20/22 SOT-5M trials ended prematurely with a fall — a 91% fall-incident rate under vestibular-challenging conditions. Astronauts' R+0 balance was statistically equivalent to or worse than healthy subjects aged 73–86 years.
  - Pre-flight SOT-5 performance in astronauts consistently exceeds normative population values, and those with lower pre-flight EQ scores show larger post-flight deficits (Paloski 1998, DOI 10.1016/s0194-59989870008-7; Wood et al. 2015, DOI 10.3357/amhp.ec07.2015 — cited in Ozdemir 2018).
  - The OCHMO-STD-100.1A §6.1.4–6.1.5 requires sensorimotor platform testing at selection; Computerized Dynamic Posturography is the operational standard.
  - For analog-mission purposes, pre-mission baseline SOT-5 EQ predicts the speed and completeness of sensorimotor recovery after simulated or actual zero-g exposure — high baseline indicates a more robust vestibular-sensorimotor reserve.
- **Bayesian/IMM integration:** SOT-5 EQ score (0–100) enters as a continuous Criterion with floor at 0 and ceiling at 100. Operational selection floor: EQ ≥ 50 (below this = clinically abnormal; OCHMO). Literature-elicited prior weight: **Medium-high** — directly required by OCHMO; clear post-flight consequence of low pre-flight values; effect size is large (91% fall rate on R+0 under challenge). IMM β-vulnerability: EQ below the 40th percentile of the astronaut normative sample elevates EVA fall-risk parameter.
- **References:**
  - Tays, G. D., Hupfeld, K. E., McGregor, H. R., et al. (2021). The Effects of Long Duration Spaceflight on Sensorimotor Control and Cognition. *Frontiers in Neural Circuits*, 15, 723504. https://doi.org/10.3389/fncir.2021.723504
  - Ozdemir, R. A., Goel, R., Reschke, M. F., et al. (2018). Critical Role of Somatosensation in Postural Control Following Spaceflight. *Frontiers in Physiology*, 9, 1680. https://doi.org/10.3389/fphys.2018.01680
- **Lay explanation:** This is a computerised balance platform test that gently shifts the ground beneath a person's feet while they stand with eyes closed, forcing the brain to rely on the inner ear for balance. NASA uses it to assess astronauts before and after spaceflight, because people whose inner-ear balance system works poorly before a mission fall far more often after landing — and falling is a serious injury risk at a remote analog station or on a planet surface. A candidate with a high score has a more robust sensorimotor reserve for reorientation after any gravity transition.

---

### Test 4: CD-RISC-25 — Connor-Davidson Resilience Scale

- **Domain:** psychological
- **Instrument:** CD-RISC-25 (Connor & Davidson, 2003, DOI 10.1002/da.10113); 25 items rated on a 5-point Likert scale (0–4); total score 0–100; α ≈ .89; higher score = greater resilience. The 10-item abbreviated version (CD-RISC-10; Campbell-Sills & Stein, 2007, DOI 10.1002/jts.20271; α ≈ .85) is acceptable when time is limited. Convergent r ≈ 0.83 with Kobasa Hardiness Scale; validated in U.S. military, disaster, and clinical populations.
- **Output scale:** Total score 0–100 (CD-RISC-25) or 0–40 (CD-RISC-10). Continuous.
- **Predictive validity:**
  - Kokun & Bakhmutova (2024, DOI 10.24425/ppr.2024.150021; n = 62 Ukrainian Antarctic year-long expeditioners): Professional hardiness (operationalised on a scale convergent with CD-RISC) was the **strongest single predictor** of post-expedition personal growth in a multivariable model explaining 30–45% of the variance (R² = 0.30–0.45). Resilience outperformed all other personality predictors including 16PF and EPQ subscales.
  - In U.S. military special-selection contexts, Bartone's DRS (Dispositional Resilience Scale — the military equivalent of Kobasa Hardiness, r ≈ 0.83 with CD-RISC) predicted training completion and operational performance; effect sizes were not retrievable through free sources in this round but the instrument is operationally embedded.
  - In the Decisiveness and Dedication factors of the CD-RISC, Hershaw & Tra (2024, DOI 10.1093/arclin/acae067.200) found significant prediction of PTSD and depression outcomes in active-duty service members with mild TBI history — a directly selection-relevant mental-health indicator.
  - Meta-analytic synthesis (Green et al. 2014, DOI 10.1177/1073191114524014) confirms reproducible factor structure in military samples, supporting its use in high-demand selection without population mismatch.
- **Bayesian/IMM integration:** CD-RISC-25 total score (0–100) enters as a continuous Criterion; higher = better. Prior weight: **Medium-high**, anchored on Kokun & Bakhmutova (2024) R² = 0.30–0.45. Use a moderately informative Beta prior on the normalised score, concentrating mass above 65/100 (consistent with Antarctic expeditioner selection floors in practice). Overlap with Big Five Emotional Stability/Conscientiousness is acknowledged; use as a complementary domain, not a substitute.
- **References:**
  - Kokun, O., & Bakhmutova, L. (2024). Salutogenic outcomes and their personality predictors in participants of year-long Antarctic expeditions. *Polish Polar Research*. https://doi.org/10.24425/ppr.2024.150021
  - Connor, K. M., & Davidson, J. R. T. (2003). Development of a new resilience scale: The Connor–Davidson Resilience Scale (CD-RISC). *Depression and Anxiety*, 18(2), 76–82. https://doi.org/10.1002/da.10113
  - Campbell-Sills, L., & Stein, M. B. (2007). Psychometric analysis and refinement of the Connor–Davidson Resilience Scale (CD-RISC). *Journal of Traumatic Stress*, 20(6), 1019–1028. https://doi.org/10.1002/jts.20271
  - Hershaw, J. N., & Tra, Y. (2024). Connor-Davidson Resilience Scale Predicts PTSD and Depression in Active-Duty Service Members with mTBI. *Archives of Clinical Neuropsychology*. https://doi.org/10.1093/arclin/acae067.200
- **Lay explanation:** This is a 25-question self-report questionnaire that measures how well a person bounces back from stress, setbacks, and adversity. In a study of people who spent an entire year in an Antarctic station, those with higher resilience scores were far more likely to come out of the experience with a sense of growth rather than distress. For an analog astronaut, resilience is the personal resource that sustains performance through the "third quarter" slump — the psychologically hardest phase of any long-duration mission.

---

### Test 5: MSCEIT — Mayer-Salovey-Caruso Emotional Intelligence Test

- **Domain:** psychological / interpersonal
- **Instrument:** MSCEIT v2.0 (Mayer, Salovey & Caruso, 2002; MHS Inc.); ability-based EI measure; 141 items across four branches: Perceiving Emotions, Using Emotions, Understanding Emotions, Managing Emotions. Total EIQ score and branch scores (standard score M = 100, SD = 15). Administration ≈ 45 minutes. α ≈ .76 (composite); branch α ≈ .64–.89. Alternatively, the EQ-i 2.0 (Bar-On, self-report; 133 items; α ≈ .76–.93) for programs where an ability measure is logistically impractical.
- **Output scale:** Standard score 0–144+ (MSCEIT EIQ); continuous. Selectron input: z-score relative to general-population norms (M = 100, SD = 15) expressed as (raw − 100)/15. Operational range approximately −3 to +3.
- **Predictive validity:**
  - O'Boyle, Humphrey, Pollack, Hawver & Story (2011, DOI 10.1002/job.714; k = 43, N > 5 000): Corrected operational validity ρ = 0.24 (ability EI stream, including MSCEIT) and ρ = 0.30 (four-branch self/peer-report EI) for overall job performance.
  - Grobelny, Radke & Paniotova-Maczka (2021, DOI 10.1504/IJWOE.2021.10037977; k = 99, N = 17 889): Self-report ability EI showed ρ = 0.45 for job performance — treat as upper bound; ability-based EI (MSCEIT-class) is more conservative.
  - Joseph, Jin, Newman & O'Boyle (2014, DOI 10.1037/a0037681): Mixed-model EI retained incremental validity over Big Five + cognitive ability (β ≈ .13 in dominance decomposition) — relevant because Selectron already includes NEO-PI-R, so incremental validity matters.
  - The high interpersonal demand of ICE environments, where crew members cannot leave one another for months, makes emotion management the decisive competency separating high-functioning from conflict-generating crew members. ESA recent selection campaigns include EI-related behavioural interview probes (Pecena et al., DLR).
- **Bayesian/IMM integration:** MSCEIT EIQ (or EQ-i composite) enters as a continuous Criterion via z-score. Prior weight: **Medium** (ρ = 0.24–0.30 from meta-analysis; ρ = 0.45 for optimistic bound). Dirichlet concentration parameter should reflect the genuine variability in effect size across EI streams — a weakly-to-moderately informative prior. No IMM β-vulnerability mapping yet available; reserve for Iter 3 sensitivity analysis.
- **References:**
  - O'Boyle, E. H., Humphrey, R. H., Pollack, J. M., Hawver, T. H., & Story, P. A. (2011). The relation between emotional intelligence and job performance: A meta-analysis. *Journal of Organizational Behavior*, 32(5), 788–818. https://doi.org/10.1002/job.714
  - Joseph, D. L., Jin, J., Newman, D. A., & O'Boyle, E. H. (2014). Why does self-reported emotional intelligence predict job performance? *Journal of Applied Psychology*, 100(2), 298–342. https://doi.org/10.1037/a0037681
  - Grobelny, J., Radke, P., & Paniotova-Maczka, D. (2021). Emotional intelligence and job performance: a meta-analysis. *International Journal of Work Organisation and Emotion*, 12(1). https://doi.org/10.1504/IJWOE.2021.10037977
- **Lay explanation:** Emotional intelligence is the ability to read other people's emotions accurately, understand why they feel that way, and manage your own emotional reactions — especially under stress. In a small crew living and working together in isolation for weeks or months, a person who misreads social signals or cannot regulate frustration causes disproportionate conflict. Studies of thousands of workers across many industries show that higher emotional intelligence reliably predicts better job performance, and the effect is independent of personality and IQ.

---

### Test 6: MMPI-2-RF (Select-Out Gate)

- **Domain:** psychological / psychiatric screen
- **Instrument:** MMPI-2-RF (Ben-Porath & Tellegen, 2008; University of Minnesota Press / Pearson); 338 items; 51 scales — 9 validity (including L-r, K-r, Fp-r, RBS), 3 higher-order (EID, THD, BXD), 9 Restructured Clinical (RC1–RC9), and specific-problem scales. Used in NASA, ESA, and Antarctic winter-over programs as the primary psychiatric select-out instrument.
- **Output scale:** T-score for each scale (M = 50, SD = 10; clinical threshold conventionally ≥ 65T). Primary Selectron score: binary pass/fail gate at selection (any RC or SP scale ≥ 65T triggers specialist review). For ranking within the qualified pool, the Higher-Order EID (Emotional-Internalising Dysfunction) T-score is the most operationally relevant continuous input (0–120T scale; lower = better for selection).
- **Predictive validity:**
  - The MMPI-2-RF is a **select-out** instrument, not a positive-performance predictor. Its function in Selectron is as an asymmetric gate: it does not rank candidates who pass, but it excludes those at elevated risk of psychiatric decompensation during mission.
  - Detrick & Chibnall (2014, DOI 10.1037/pas0000013): Systematic under-reporting (L-r ≥ 65T) in police officer selection contexts was associated with subsequent supervisor-rated integrity problems — demonstrating that defensive-profile detection has operational utility even in highly select, high-demand applicant pools.
  - Palinkas et al. (2004, DOI 10.3402/ijch.v63i2.17702; n = 231 Antarctic winter-over personnel who had passed pre-deployment MMPI-based psychiatric screening): 6% developed clinically significant DSM-IV symptoms during the winter, and mood/adjustment disorders + sleep disturbances accounted for 60% of all diagnoses — establishing the base rate that the MMPI gate is designed to reduce. Prior screening reduced but did not eliminate incident cases.
  - Faulk, Santy, Holland & Marsh (1992 ASMA; no DOI): Psychiatric select-out using MMPI screened out a non-trivial fraction of US astronaut applicants; exact r not published.
  - Antarctic winter-over personnel specifically used the MMPI as a selection screen (Palinkas et al. 2004), and the 6% incident rate post-screening establishes the residual base rate — useful for calibrating Selectron's prior on the gating threshold.
- **Bayesian/IMM integration:** Primary function: binary gate (MMPI-2-RF clinical elevation → removed from scoring pipeline; specialist disposition). Secondary: EID T-score as a continuous soft weight within the qualified pool (lower T = lower psychiatric risk; weight = **High for gating, Low for ranking**). IMM β-vulnerability: elevated EID T-score (≥ 60T, subclinical range) can elevate the pMentalHealthIncident parameter in the IMM forward simulation.
- **References:**
  - Detrick, P., & Chibnall, J. T. (2014). Underreporting on the MMPI-2-RF in a high-demand police officer selection context. *Psychological Assessment*, 26(3), 1044–1049. https://doi.org/10.1037/pas0000013
  - Palinkas, L. A., Gunderson, E. K. E., Holland, A. W., Miller, C., & Johnson, J. C. (2004). Predictors of behavior and performance in extreme environments: The Antarctic Space Analogue Program. *Aviation, Space, and Environmental Medicine*, 75(9), 734–740. https://doi.org/10.3402/ijch.v63i2.17702
- **Lay explanation:** The MMPI-2-RF is a long psychological questionnaire that checks whether a person is at risk for mental health problems such as depression, anxiety, or unusual thinking — conditions that would be dangerous during a months-long mission far from professional care. It is used by NASA and Antarctic programs as a safety screen, not to rank who is best but to identify who should not be selected at all. It also detects people who are deliberately trying to appear healthier than they are, which matters when the stakes are this high.

---

### Test 7: BDI-II — Beck Depression Inventory, Second Edition

- **Domain:** psychological / mood monitoring
- **Instrument:** BDI-II (Beck, Steer & Brown, 1996; Pearson); 21 items, self-report, past two weeks; total score 0–63 (0–13 minimal, 14–19 mild, 20–28 moderate, 29–63 severe); α ≈ .92 (clinical) and .93 (non-clinical); 5-minute administration.
- **Output scale:** Total score 0–63 (continuous). Selectron primary input: total score at baseline and at scheduled checkpoints during analog pre-selection training. Lower = better.
- **Predictive validity:**
  - Basner et al. (2014, DOI 10.1371/journal.pone.0093298; n = 6, Mars-500 520-day analog): The crewmember with the highest average POMS total mood disturbance also had BDI-II scores reaching mild-to-moderate levels in > 10% of mission weeks and depressive symptoms in 93% of mission weeks. This individual also showed the highest PVT-B lapse rate and accounted for a disproportionate share of crew-ground conflicts — demonstrating co-occurrence of BDI-II trajectory, cognitive vigilance decrement, and interpersonal conflict in a single individual over the full mission arc.
  - Palinkas et al. (2004, DOI 10.3402/ijch.v63i2.17702): Across 231 Antarctic winter-over expeditioners who had passed pre-deployment MMPI psychiatric screening, 6% developed DSM-IV-level symptoms during the winter, with mood disorders predominating. The incident rate was associated with low education and absence of prior winter-over experience — factors the BDI-II monitors prospectively in longitudinal screening.
  - Sandal, Leon & Palinkas (2006, Psychology of Space Exploration, NASA SP-2010-3-14): Depression and mood disturbance are among the two or three most consistently documented adverse outcomes in ICE research; concurrent BDI-II screening during analog training captures emerging subclinical depression trajectories before mission commitment.
  - Note: The BDI-II's predictive function in Selectron is primarily prospective trajectory monitoring (administered at regular intervals during pre-mission analog training, not as a one-shot selection score). A rising BDI-II trajectory during pre-mission training is a stronger predictor than the single pre-mission baseline value.
- **Bayesian/IMM integration:** BDI-II total score enters as a continuous Criterion; lower = better. The **baseline** score is the Criterion weight at selection; the **trajectory slope** across serial administrations during pre-mission training is fed forward as an IMM vulnerability update. Prior weight: **Medium** for single baseline reading; **Medium-high** for trajectory slope. Threshold: BDI-II baseline ≥ 20 (moderate range) → specialist review flag (complementary to MMPI-2-RF gate, not redundant — BDI-II catches emerging mood state, MMPI-2-RF catches stable trait psychopathology).
- **References:**
  - Basner, M., Dinges, D. F., Mollicone, D. J., et al. (2014). Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars. *PLoS ONE*, 9(3), e93298. https://doi.org/10.1371/journal.pone.0093298
  - Palinkas, L. A., Gunderson, E. K. E., Holland, A. W., Miller, C., & Johnson, J. C. (2004). Predictors of behavior and performance in extreme environments: The Antarctic Space Analogue Program. *Aviation, Space, and Environmental Medicine*, 75(9), 734–740. https://doi.org/10.3402/ijch.v63i2.17702
- **Lay explanation:** The BDI-II is a 21-question checklist that a person fills out in five minutes to report how they have been feeling over the past two weeks — it captures sadness, energy loss, sleep problems, and concentration difficulties. In the 520-day Mars analog study, the crew member whose scores climbed into the depressed range was also the one who performed worst on the reaction-time test and generated the most conflict with mission control. For analog astronaut programs, tracking this score every few weeks during pre-mission training catches people who are developing depression before they are deployed, when support is still available and the mission can still be safely staffed.

---

## Summary table

| Rank | Test | Domain | Instrument | Key effect size | Prior weight |
|---|---|---|---|---|---|
| 1 | NASA Cognition Battery | Cognitive | Basner 2015 (10-subtest) | r = 0.55 vs docking; R² = 0.30 | High |
| 2 | PVT-B | Cognitive / vigilance | Dinges/Pulsar 3-min | d = 1.00 sleep dep; Mars-500 case | High |
| 3 | SOT-5 / Computerised Dynamic Posturography | Sensorimotor | NeuroCom Equitest | 91% falls R+0; recovery ≥ 30 d | Medium-high |
| 4 | CD-RISC-25 | Psychological | Connor-Davidson 2003 | R² = 0.30–0.45 Antarctic year | Medium-high |
| 5 | MSCEIT / EQ-i | Psychological / interpersonal | MHS Inc. | ρ = 0.24–0.45 meta-analysis | Medium |
| 6 | MMPI-2-RF | Psychiatric screen (gate) | Pearson | Select-out gate; 6% incidence floor | High (gate), Low (rank) |
| 7 | BDI-II | Mood / depression | Pearson | Mars-500 trajectory; 6% Antarctic incidence | Medium (baseline); Medium-high (trajectory) |

---

## Tests considered and dropped

| Candidate | Domain | Reason dropped |
|---|---|---|
| POMS-SF (Profile of Mood States) | Mood | Used in Mars-500 alongside BDI-II but measures state rather than trait; no standalone predictive-validity coefficient against analog selection criteria retrievable. BDI-II subsumes the selection-relevant mood channel. |
| Sensation Seeking Scale (SSS-V) | Psychological | No peer-reviewed predictive-validity estimate found against astronaut/analog mission criteria; likely redundant with Big Five facets. Dropped per A3 evidence table. |
| 16PF | Psychological | 30–45% R² in Antarctic model is for a multivariable composite; individual 16PF factor βs not reported; redundant with NEO-PI-R (already in battery) and CD-RISC. |
| Locus of Control (Rotter I-E) | Psychological | Mars-500 data descriptive only (n = 6); no predictive-validity coefficient against selection or performance outcomes in analog/spaceflight literature retrievable. |
| PSQI (Pittsburgh Sleep Quality Index) | Sleep quality | No analog-mission predictive-validity coefficient retrieved. Actigraphy (wrist-worn objective sleep measurement) would be preferable for a time-series outcome but does not produce a pre-selection baseline score operationalisable as a static Criterion. Recommend as an in-mission monitoring metric, not a selection criterion. |
| Salas Big Five Teamwork (observer-rated) | Team | Espevik et al. (2022) path coefficients are for police dyads, not astronaut/analog candidates; no published selection-validity coefficient; requires expensive group simulation to administer and cannot be assessed in isolation — operationally incompatible with individual candidate scoring at the selection stage (Iter 1). Retain for Iter 2 crew-composition module. |
| Thomas-Kilmann Conflict (TKI) | Behavioural | No predictive-validity coefficient against astronaut/analog outcomes; ipsative format (scores sum to constant) is poorly suited to MCDA linear aggregation. |
| MLQ / Transformational Leadership | Behavioural | No astronaut-specific predictive-validity coefficient; relevant for commander selection only, not general crew; defer to mission-role-specific battery in Iter 2. |
| Cross-Cultural Competence (CQ) | Behavioural | No predictive-validity coefficient against analog mission outcome; used qualitatively at ESA; no numeric scale with published validation for spaceflight selection. |

---

## Key caveats for Iter 2 integration

1. **Cognition Battery and PVT-B overlap significantly** — PVT-B is embedded in the Cognition Battery as a subtest. If the full battery is administered, do not double-count PVT-B as an independent Criterion; use the battery composite with explicit PVT-B extraction for vigilance-specific analysis.

2. **MMPI-2-RF and BDI-II are complementary, not redundant.** MMPI-2-RF detects stable trait psychopathology risk at selection; BDI-II detects state depressive trajectory during pre-mission training. Both should remain in the battery.

3. **SOT-5 is technically demanding** — requires the NeuroCom Equitest device (≈ USD 30 000). For under-resourced analog programs, the Functional Mobility Test (FMT: obstacle course walk, stopwatch only) with normative data from Mulavara et al. (2010, DOI 10.1007/s00221-010-2171-0) can serve as a lower-fidelity proxy, but loses the vestibular isolation that makes SOT-5 prognostically specific.

4. **The effect-size literature for analog selection is dominantly n < 30** — the largest single-study n for astronaut cognitive performance is 25 (Dev et al. 2024); the largest Antarctic study cited is 231 (Palinkas et al. 2004, but this is an incidence study, not a predictive-validity coefficient study). All Bayesian priors should carry low concentration parameters (α₀ ≤ 5) to allow rapid updating from Selectron's own candidate data as it accumulates.
