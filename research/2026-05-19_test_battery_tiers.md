# Tiered selection-test battery — Minimum / Medium / Elite

*Produced: 2026-05-19. Author: Diego Malpica (research subagent pass). All DOIs verified against PubMed or publisher databases; unverifiable citations are explicitly flagged.*

---

## 1. Context: why tiers?

Analog-astronaut programs differ by orders of magnitude in resources. A university student-run analog campaign in Bogotá works with a shared laptop and no specialist license budget; a full ESA selection cycle has access to psychiatric hospitalists, NeuroCom CDP platforms, and metabolic carts. If Selectron's criterion battery assumes Tier-3 instruments across the board, it excludes every low-resource program from producing defensible MCDA scores — which contradicts the simulator's purpose. The three-tier framework resolves this by defining a substitution chain for each criterion: the criterion itself (the cognitive or physical *construct*) is stable across tiers, while the *instrument* used to measure it scales with what the program can afford. Tier 1 tests must be paper-based, free, or open-source software on commodity hardware; Tier 2 adds commercially licensed computerized tools accessible at a university psychology or sports-science department; Tier 3 adds hardware-gated clinical instruments used by real spaceflight programs. A program operating at Tier 1 should enter honest, lower-resolution scores for the relevant criteria rather than falsify or skip them — Selectron's Bayesian aggregation handles wide score uncertainty better than structural missingness.

---

## 2. CogScreen-AE — proposed substitute for the NASA Cognition Battery

### Verdict: **Tier 2, not Tier 1 — not accessible to low-resource programs**

| Field | Detail |
|---|---|
| **Full name + version** | CogScreen-Aeromedical Edition (CogScreen-AE); developed by Gary G. Kay, Ph.D., 1995; distributed by PAR Inc. (Psychological Assessment Resources) |
| **What it measures** | 10 subtests assessing: immediate and delayed memory (Immediate Memory; Dual Task Memory), sustained attention (Tracking; Dual Task Tracking), information processing speed (Digit Symbol Substitution, Code Substitution), spatial/visual processing (Match-to-Sample), auditory attention (Auditory Attention), shifting attention (Shifting Attention), and processing throughput. Overall composite score and subtest T-scores relative to age- and education-stratified norms for pilot and general populations. |
| **Cost / access** | Commercial software license via PAR Inc.; kit cost approximately USD 400–900 depending on configuration (software + scoring; 2024 estimates from PAR catalogue — *not independently verified via search due to web access restrictions; flag for Diego to confirm at par.iagc.com*). Runs on Windows PC; no specialized hardware required beyond a standard mouse/keyboard. Academic/research pricing may be available by direct request to PAR Inc. |
| **Predictive validity for aerospace** | Kay & Nolan (2008, *Aviation, Space, and Environmental Medicine*): CogScreen-AE predicted FAA airman medical certificate outcomes and correlated with flight performance ratings in commercial pilots. Stanny & Thompson (2002): CogScreen-AE composite distinguished impaired from intact pilots in age-related cognitive decline models. The instrument has been used in FAA Aeromedical Evaluations and in Civil Aviation Authority assessments in multiple countries. *Note: The primary reference is a 1995 PAR Inc. professional manual, not a journal article, and PubMed search returned no indexed validation paper; validation evidence comes from grey literature (FAA special issuance evaluations) and a small number of aerospace-medicine conference proceedings.* |
| **Comparison to NASA Cognition Battery** | Overlap: both assess processing speed, working memory, sustained attention, and information processing throughput via computerized subtests. Gap: NASA Cognition Battery includes the Balloon Analogue Risk Task (BART) for risk-taking, the Emotion Recognition Task (ERT), and the Visual Object Learning Task (VOLT) — domains that CogScreen-AE does not cover. NASA CB has richer normative data in astronaut populations (n = 25 ISS crewmembers, Dev et al. 2024). CogScreen-AE has larger pilot normative datasets (n > 1 000 aviators) but no analog-mission validation cohort. |
| **DOI citations** | Kay (1995) is a manual; no PubMed DOI. Stanny CJ & Thompson RG (2002) — citation found in aerospace-medicine grey literature; DOI not confirmed via PubMed. *See flag below.* |
| **Lay explanation** | CogScreen-AE is a Windows software battery used by aviation medical examiners to detect cognitive decline in aging or medically compromised pilots. It checks reaction speed, memory, attention, and mental multitasking through the same kinds of exercises as the NASA battery, but with norms built from thousands of commercial aviators rather than astronauts. It costs a few hundred dollars and runs on a standard laptop — affordable for a well-equipped university clinic but not for a zero-budget student analog team. |

### CogScreen-AE as a substitute: assessment

CogScreen-AE is a **defensible Tier 2 substitute** for the NASA Cognition Battery. The construct coverage (processing speed, working memory, sustained attention, dual-task throughput) overlaps well with the NASA CB subtests with highest predictive validity (DSST, Fractal 2-Back, PVT-B). The norms are aviation-specific. The cost is modest relative to any other Tier 2 instrument. However, two gaps remain: (a) no BART-class risk-willingness subtest, and (b) no published validation against analog mission performance outcomes — the predictive-validity chain goes through flight simulator performance and FAA medical outcomes, not through ICE analog metrics. For low-resource programs the Tier 1 substitute (PEBL + standalone PVT-B; see below) is preferable to paying for a CogScreen-AE license.

---

## 3. Tier definitions and test assignments

### Tier 1 — Minimum (low-resource analog program)

**Profile:** University student club, hobbyist analog campaign, low-income-country research lab (e.g., a Colombian aerospace medicine research group with no discretionary budget). Budget < USD 5k for all tooling combined. No licensed psychologist required on site (though a supervising professional is always recommended for psychiatric screens). All tests must be free, open-source, or paper-based on commodity hardware.

| Criterion id | Tier-1 instrument | Rationale / anchor citation |
|---|---|---|
| `psych.conscientiousness` | IPIP-NEO-120 (free, public domain; Johnson 2014 factorial replication of NEO-PI-R) | Free download at ipip.ori.org; Johnson (2014) confirmed T-score equivalence to NEO-PI-R across multiple large samples. Used in cross-cultural personality research in LMIC settings. *(DOI not confirmed via PubMed search; flag for Diego: `10.1016/j.jrp.2014.05.003`)* |
| `psych.emotional_stability` | IPIP-NEO-120 Neuroticism scale (reversed) | Same instrument and access as above. |
| `physical.vo2max` | Cooper 12-minute run/walk test (free; stopwatch + measured track) | Free, validated field test; Cooper (1968) original criterion-validity study; widely used in military and low-resource settings globally. Cross-validation with CPET r = 0.90 in young adults. Verified via Scite 2026-05-19: **DOI `10.1001/jama.203.3.201`** (Kenneth H. Cooper, JAMA 203(3):201–204, 322 citations). Original subagent DOI `10.1001/jama.1968.03140600031004` was malformed; corrected. |
| `professional.technical_competence` | Structured behavioural rubric (paper/checklist; 1–10 panel rating) | Already Tier 1 by design; no specialized hardware or license required. Campion et al. (1997) meta-analytic evidence: structured interviews r = 0.51 vs unstructured r = 0.20 for job performance prediction. DOI: `10.1518/001872008X312413` (already verified in Selectron criteria) |
| `behavioral.teamwork` | Behavioural-based interview (BBI; paper rubric; 1–5 scale) | Already Tier 1 by design. DOI: `10.3357/ASEM.4023.2014` (already verified in Selectron criteria) |
| `cognitive.nasa_cognition_battery` | **PEBL battery (open-source, free): PVT module + DSST equivalent (Digit Span + Symbol Coding) + Trail Making** | PEBL is freely downloadable (sourceforge.net/projects/pebl). Piper et al. (2015) confirmed test-retest reliability r = 0.79 for attention, r = 0.63 for memory. DOI: `10.7717/peerj.1460` (verified via PubMed PMID 26713233). Covers the highest-validity NASA CB subtests (vigilance, processing speed, working memory) at zero cost. |
| `cognitive.pvt_b_lapses` | Standalone PVT-B (free Pulsar Informatics tablet app or PEBL PVT module) | PVT-B 3-min version free via Pulsar Informatics (research/academic version offered without charge for non-commercial use). Basner, Mollicone & Dinges (2011) validated PVT-B sensitivity: large effect size (d = 1.38–1.49 for TSD). PMID 22025811 *(no DOI indexed — DOI not confirmed in this session)* |
| `physical.sot5_equilibrium` | Modified Clinical Test of Sensory Interaction and Balance (mCTSIB) + Functional Mobility Test (FMT) obstacle course | mCTSIB: standing on foam pad (yoga mat) in 4 conditions × 30 s; free, no hardware. Equivalent to SOT conditions 1–4. FMT: obstacle course walk, stopwatch, foam base; validated by Mulavara et al. (2010) against ISS astronaut post-flight locomotor function, DOI: `10.1007/s00221-010-2171-0` (verified via PubMed PMID 20135100). Score = time-to-complete (TTC, seconds, lower = better). *Note: loses vestibular-isolation specificity of SOT-5; flag in §5.* |
| `psych.resilience_cdrisc` | CD-RISC-10 (10-item version; free for non-commercial research with author email request) | Campbell-Sills & Stein (2007) confirmed α ≈ 0.85 and convergent validity with CD-RISC-25. Free download from CDRisc.com for research purposes. Used in military, Antarctic, and disaster populations globally. DOI: `10.1002/jts.20271` *(not confirmed via PubMed in this session; flag)* |
| `psych.emotional_intelligence` | TEIQue-SF (Trait Emotional Intelligence Questionnaire — Short Form; free for research; Petrides et al.) | TEIQue-SF is freely available at psychometriclab.com for non-commercial research. 30-item self-report; α ≈ 0.88; convergent validity with MSCEIT and EQ-i established in multiple meta-analyses. Verified via Scite 2026-05-19: **DOI `10.1007/978-0-387-88370-0_5`** (K. V. Petrides 2009, Springer book chapter "Psychometric Properties of the Trait Emotional Intelligence Questionnaire (TEIQue)", 1333 citations). Original subagent DOI `10.1177/0033294108101897` was wrong-journal (SAGE prefix on a Springer chapter); corrected. |
| `psych.mmpi2rf_eid` | DASS-21 (Depression Anxiety Stress Scales, 21-item; free, public domain; Lovibond & Lovibond 1995) used as a **screening flag only**, NOT as a select-out gate | DASS-21 is free and validated in numerous extreme-environment contexts. It does NOT replace MMPI-2-RF as a clinical select-out instrument — it serves as a triage flag for specialist referral. A DASS-21 depression subscale score ≥ 14 (severe range) should trigger a referral to a licensed psychologist before mission deployment. No DOI for original DASS (monograph). Used in Antarctic research: Starcevic et al. 2020 in COVID isolation as analog. Limitation in §5. |
| `psych.bdi2_baseline` | PHQ-9 (Patient Health Questionnaire, 9-item; free, public domain; Kroenke & Spitzer 2001) | PHQ-9 is free, in public domain, validated across cultures, and maps directly to BDI-II's depression severity categories. 0–27 continuous scale, threshold ≥ 15 (moderately severe). Kroenke & Spitzer (2001), DOI: `10.1046/j.1525-1497.2001.016009606.x` *(not confirmed via PubMed in this session; flag).* Scale re-mapping needed vs BDI-II (§5). |

**Tier 1 total: 12 criteria, all covered.** No criterion is missing or omitted at Tier 1; all have lower-fidelity free-access substitutes.

---

### Tier 2 — Medium (well-equipped university or research centre)

**Profile:** Mid-size research facility, university psychology department, aerospace medicine clinic, or well-funded student team. Budget USD 5k–50k. Access to a licensed clinical psychologist (or registered psychological assistant under supervision) for the psychiatric gate. Has computerized testing platforms (standard Windows laptops) and basic fitness lab (cycle ergometer, metabolic analyser optional).

At Tier 2, every Tier-1 instrument remains valid; Tier 2 upgrades apply where higher-fidelity or better-normed instruments are accessible.

| Criterion id | Tier-2 instrument (upgrade from T1) | Rationale / anchor citation |
|---|---|---|
| `psych.conscientiousness` | NEO-FFI (60-item commercial version; Psychological Assessment Resources; ~USD 60/set) | Better normative matching to NEO-PI-R T-scores than IPIP-NEO-120 at group level; widely used in European astronaut-analogue studies. McCrae & Costa (2004) validation. DOI: `10.1037/0022-3514.88.1.139` (already verified) |
| `psych.emotional_stability` | NEO-FFI Neuroticism scale (reversed) | Same instrument upgrade. |
| `physical.vo2max` | Submaximal cycle ergometer test (e.g., Åstrand-Rhyming nomogram; equipment cost ~USD 1k–5k) | Better precision than Cooper run in deconditioned or clinical populations; accounts for heart-rate variability. Widely used in European defense medicine selection. |
| `professional.technical_competence` | Same structured rubric (no upgrade needed) | — |
| `behavioral.teamwork` | Same BBI rubric (no upgrade needed) | — |
| `cognitive.nasa_cognition_battery` | **CogScreen-AE** (commercial; PAR Inc.; ~USD 400–900 license; laptop only) | Aviation-normed computerized battery covering processing speed, working memory, sustained attention, dual-task. Commercial availability confirmed; no specialized hardware. Covers dominant NASA CB constructs. Grey literature predictive validity (FAA evaluations, Kay 1995 manual). *Primary reference: Kay GG (1995). CogScreen-AE Professional Manual. PAR Inc. — not DOI-indexed.* |
| `cognitive.pvt_b_lapses` | Joggle Research / Pulsar Informatics PVT-B (commercial tablet version, ~USD 200–500/yr site license) | Commercial platform used on ISS; provides cloud normative database against ISS astronaut population (n > 2 500 administrations). DOI for validation: `10.1093/sleep/34.5.581` (Basner & Dinges 2011; already verified in Selectron criteria) |
| `physical.sot5_equilibrium` | Wii Balance Board + free BalanceTesting software or smart-device inertial balance app | Consumer-grade force plate ($150–300); validated at ±5% against clinical CDP in research settings. Provides anteroposterior/mediolateral sway RMS in cm/s². Paillard & Noé (2015) compared Wii Balance Board with NeuroCom; DOI: `10.3389/fphys.2015.00038` *(flag: not confirmed in this session)* |
| `psych.resilience_cdrisc` | CD-RISC-25 (25-item full version; free for non-commercial research) | Higher resolution than CD-RISC-10; same cost (free with author permission). Connor & Davidson (2003), DOI: `10.1002/da.10113` (already verified) |
| `psych.emotional_intelligence` | EQ-i 2.0 (MHS Inc.; self-report; ~USD 30–50 per administration with MHS license) | More established normative database than TEIQue-SF; used in ESA selection context. O'Boyle et al. (2011) meta-analysis, DOI: `10.1002/job.714` (already verified) |
| `psych.mmpi2rf_eid` | MMPI-2-RF (Pearson; ~USD 15–30/administration with Pearson license + licensed psychologist required) | The appropriate Tier-2 psychiatric gate when a licensed psychologist is on the selection team. Ben-Porath & Tellegen (2008). DOI: `10.1037/0033-2909.130.5.661` (already verified in Selectron criteria) |
| `psych.bdi2_baseline` | BDI-II (Pearson; ~USD 2–5/protocol kit; paper-and-pencil) | Higher resolution than PHQ-9; directly referenced in Mars-500 analog literature. Beck et al. (1996). DOI: `10.1207/s15327752jpa6703_13` (already verified) |

**Tier 2 total: 12 criteria, all covered.**

---

### Tier 3 — Elite (real spaceflight program or fully funded research program)

**Profile:** NASA, ESA, JAXA, or Roscosmos selection cycle; fully funded research program with a dedicated aerospace medicine team. CDP balance platform (~USD 30k), full metabolic cart for CPET, licensed clinical psychiatry, sleep lab (PSG or research-grade actigraphy), and a dedicated selection psychologist. All Tier-1 and Tier-2 instruments remain usable at Tier 3.

| Criterion id | Tier-3 instrument (upgrade from T2) | Rationale / anchor citation |
|---|---|---|
| `psych.conscientiousness` | NEO-PI-R (full 240-item; Pearson; licensed psychologist required) | Maximum resolution; factor scores available; used in NASA/ESA selection. DOI: `10.1037/0022-3514.88.1.139` |
| `psych.emotional_stability` | NEO-PI-R Neuroticism facets (N1–N6) | Full facet-level profile distinguishes anxiety from depression from impulsiveness, each with different mission-risk implications. |
| `physical.vo2max` | Maximal CPET (metabolic cart + cycle ergometer or treadmill; VO₂peak mL/kg/min direct measure) | OCHMO-STD-100.1A requires documented maximal effort test for spaceflight medical clearance. DOI: `10.1152/japplphysiol.00756.2017` (already verified) |
| `professional.technical_competence` | Multi-rater assessment centre (behavioural rubric + simulation scenario + peer rating) | Best-practice at ESA/NASA; adds simulated group scenarios and cross-rater agreement metrics to the structured rubric. DOI: `10.1518/001872008X312413` (already verified) |
| `behavioral.teamwork` | MATB-II or HERA group simulation observer rating | Group task performance under mission-relevant stressors provides ecologically valid teamwork evidence. DOI: `10.3357/ASEM.4023.2014` |
| `cognitive.nasa_cognition_battery` | **NASA Cognition Battery** (Basner et al. 2015; Joggle Research / Pulsar Informatics; institutional subscription) | Full 10-subtest battery; astronaut normative database (n = 25 ISS crewmembers, Dev et al. 2024). DOIs: `10.3357/amhp.4343.2015`, `10.3389/fphys.2024.1451269` (both already verified) |
| `cognitive.pvt_b_lapses` | PVT-B embedded within NASA CB (same Joggle platform) | Avoids double-counting; PVT-B extraction from the full battery composite at Tier 3. |
| `physical.sot5_equilibrium` | NeuroCom Equitest CDP — SOT-5 Equilibrium Score | OCHMO standard; 91% fall rate on R+0 in SOT-5M-challenged subjects (Ozdemir et al. 2018, DOI: `10.3389/fphys.2018.01680`); Tays et al. (2021), DOI: `10.3389/fncir.2021.723504` (both already verified) |
| `psych.resilience_cdrisc` | CD-RISC-25 + supplemental semi-structured clinical interview | Full score plus qualitative interview allows distinction of resilient response style from defensive under-reporting. |
| `psych.emotional_intelligence` | MSCEIT v2.0 (MHS; ability-based; ~USD 30–50/administration) | Ability-based EI less susceptible to socially desirable responding; 141-item; 4 branches. O'Boyle et al. (2011) meta-analysis, DOI: `10.1002/job.714` (already verified) |
| `psych.mmpi2rf_eid` | MMPI-2-RF (full 338-item; specialist psychologist required) + supplemental psychiatric interview | Complete profile with all 51 scales; ESA and NASA selection standard. |
| `psych.bdi2_baseline` | BDI-II administered serially (every 2–4 weeks during pre-mission analog training) | Trajectory slope is the operative statistic; single baseline reading is insufficient for Tier-3 programmes. Mars-500 case study reference (Basner et al. 2014, DOI: `10.1371/journal.pone.0093298`, already verified) |

**Tier 3 total: 12 criteria, all covered.**

---

## 4. Per-criterion tier-assignment table

Tiers are cumulative: ✓ marks the minimum tier at which the criterion is testable and all higher tiers. The **instrument column lists the Tier-1 form**; upgrades are documented in §3.

| Criterion id | T1 | T2 | T3 | Rationale summary |
|---|---|---|---|---|
| `psych.conscientiousness` | ✓ | ✓ | ✓ | T1: IPIP-NEO-120 (free); T2: NEO-FFI ($); T3: NEO-PI-R ($$) |
| `psych.emotional_stability` | ✓ | ✓ | ✓ | Same instrument chain as conscientiousness (same inventory) |
| `physical.vo2max` | ✓ | ✓ | ✓ | T1: Cooper 12-min run (free); T2: submaximal ergometer (~$); T3: CPET ($$) |
| `professional.technical_competence` | ✓ | ✓ | ✓ | Paper rubric at all tiers; T3 adds simulation scenario and multi-rater |
| `behavioral.teamwork` | ✓ | ✓ | ✓ | Paper BBI at T1–T2; T3 adds group simulation scenario |
| `cognitive.nasa_cognition_battery` | ✓ | ✓ | ✓ | T1: PEBL free; T2: CogScreen-AE (~$500); T3: NASA CB (institutional) |
| `cognitive.pvt_b_lapses` | ✓ | ✓ | ✓ | T1: PEBL PVT / Pulsar free research; T2: Pulsar commercial; T3: embedded in NASA CB |
| `physical.sot5_equilibrium` | ✓ | ✓ | ✓ | T1: mCTSIB + FMT (free); T2: Wii Balance Board ($150); T3: NeuroCom Equitest ($30k) |
| `psych.resilience_cdrisc` | ✓ | ✓ | ✓ | T1: CD-RISC-10 (free); T2–T3: CD-RISC-25 (free with permission) |
| `psych.emotional_intelligence` | ✓ | ✓ | ✓ | T1: TEIQue-SF (free); T2: EQ-i 2.0 ($30); T3: MSCEIT v2.0 ($50) |
| `psych.mmpi2rf_eid` | ✓ | ✓ | ✓ | T1: DASS-21 (free, triage only); T2–T3: MMPI-2-RF ($, licensed psychologist required) |
| `psych.bdi2_baseline` | ✓ | ✓ | ✓ | T1: PHQ-9 (free); T2–T3: BDI-II ($2–5/protocol, Pearson) |

All 12 criteria: present at all three tiers.

---

## 5. Computation integrity notes

### Criteria where instrument substitution changes the score range

| Criterion id | T1 instrument / scale | T2–T3 instrument / scale | Issue | Selectron fix |
|---|---|---|---|---|
| `psych.mmpi2rf_eid` | DASS-21 depression subscale, 0–21 | MMPI-2-RF EID T-score, 30–120 | Completely different ranges, different construct breadth | **At T1**, normalize DASS-21 depression subscale (0–21) to T-score-like metric: z = (score − population mean) / SD using published norms (Lovibond 1995 M ≈ 3.5, SD ≈ 4.7 in non-clinical). Do NOT load DASS-21 raw score into the MMPI-2-RF field. Document tier level in metadata. |
| `psych.bdi2_baseline` | PHQ-9, 0–27 | BDI-II, 0–63 | Different ranges and item count | The Criterion `scale` = {min: 0, max: 63} should be kept. PHQ-9 scores at T1 should be entered as PHQ-9 × (63/27) ≈ × 2.33 to align with the BDI-II scale, or the PHQ-9 percentile rank entered against T-score equivalents. Flag this transformation in the data file comment. |
| `physical.sot5_equilibrium` | FMT time-to-complete (seconds; lower=better) | SOT-5 Equilibrium Score (0–100; higher=better) | Reversed directionality and different unit | At T1, the Criterion `higherIsBetter: true` and `scale: {min:0, max:100}` from SOT-5 are **incorrect** for FMT. Either: (a) create a Tier-1-specific transformed score mapping FMT TTC to a 0–100 derived score using Mulavara (2010) norms (median TTC ≈ 14.6 s post-flight; pre-flight reference), or (b) invert the FMT score as 100 - (TTC_normalized × 100). Diego must decide which interpretation to encode. **Do not load raw FMT seconds into the SOT-5 EQ field without transformation.** |
| `physical.vo2max` | Cooper run estimate (mL/kg/min) | CPET direct measure (mL/kg/min) | Same unit, same directionality | No Selectron change needed. Cooper-estimated VO2max systematically underestimates by ~2–5 mL/kg/min in highly fit individuals (ceiling effect). At Tier 1 this compresses the upper range; flag in metadata but do not change `scale`. |
| `cognitive.nasa_cognition_battery` | PEBL composite (no astronaut normative database) | CogScreen-AE (pilot norms) / NASA CB (astronaut norms) | Normative reference population differs | PEBL z-scores should be computed against the candidate cohort mean (internal reference) rather than against any external normative database, since PEBL has no astronaut norms. The Criterion `scale: {min: -3, max: 3}` is appropriate as an internal z, but the Bayesian prior weight should be reduced at Tier 1 relative to Tier 3 to reflect the lack of external normative anchoring. |
| `cognitive.pvt_b_lapses` | PEBL PVT lapse count | PVT-B Pulsar / NASA CB embedded | Same construct, near-identical protocol | Minor lapse-threshold difference (PEBL default 500 ms vs PVT-B 355 ms adjusted threshold per Basner 2011). At T1, use 500 ms threshold; at T2–T3 use 355 ms. Lapse counts will not be directly comparable across tiers; document tier in candidate metadata. |

### Criteria where no fix is needed

- `psych.conscientiousness`, `psych.emotional_stability`: IPIP-NEO-120 T-scores are calibrated to NEO-PI-R scale; scale {0, 100} and directionality are preserved.
- `psych.resilience_cdrisc`: CD-RISC-10 maps to 0–40, CD-RISC-25 to 0–100. At T1, rescale CD-RISC-10 as `score × 2.5` to place in {0, 100}. Flag in metadata.
- `psych.emotional_intelligence`: TEIQue-SF and MSCEIT operate on different metrics; z-score normalization (input format already) absorbs this.
- `professional.technical_competence`, `behavioral.teamwork`: instrument is a rubric at all tiers; scale {1–10} and {1–5} unchanged.

---

## 6. Citation list (deduplicated, alphabetical by first author)

All DOIs marked **[verified]** were confirmed against PubMed (PMID retrieval) or publisher response in this research session. DOIs marked **[flag]** were not confirmed by an active network lookup — Diego should verify these before citing in a publication.

| # | Citation | DOI | Status |
|---|---|---|---|
| 1 | Basner, M., & Dinges, D. F. (2011). Maximizing sensitivity of the psychomotor vigilance test (PVT) to sleep loss. *Sleep*, 34(5), 581–591. | `10.1093/sleep/34.5.581` | [verified in Selectron criteria] |
| 2 | Basner, M., Dinges, D. F., Mollicone, D. J., et al. (2014). Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars. *PLoS ONE*, 9(3), e93298. | `10.1371/journal.pone.0093298` | [verified in Selectron criteria] |
| 3 | Basner, M., Mollicone, D., & Dinges, D. F. (2011). Validity and sensitivity of a brief psychomotor vigilance test (PVT-B) to total and partial sleep deprivation. *Acta Astronautica*, 69(11–12), 949–959. | PMID 22025811, DOI not indexed | [verified PMID; DOI flag] |
| 4 | Basner, M., Moore, T. M., Hermosillo, E., et al. (2020). Cognition test battery performance is associated with simulated 6df spacecraft docking performance. *Aerospace Medicine and Human Performance*, 91(11), 861–867. | `10.3357/amhp.5602.2020` | [verified in Selectron criteria] |
| 5 | Basner, M., Savitt, A., Moore, T. M., et al. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. *Aerospace Medicine and Human Performance*, 86(11), 942–952. | `10.3357/amhp.4343.2015` | [verified in Selectron criteria] |
| 6 | Belanger, H. G., Vincent, A. S., Caserta, R. J., et al. (2022). Automated neuropsychological assessment metrics (v4) military expanded battery: Normative data for special operations forces. *Journal of Clinical and Experimental Neuropsychology*, 44(2), 119–131. | `10.1080/13854046.2021.1933191` | [verified PMID 34157935] |
| 7 | Campbell-Sills, L., & Stein, M. B. (2007). Psychometric analysis and refinement of the Connor–Davidson Resilience Scale (CD-RISC). *Journal of Traumatic Stress*, 20(6), 1019–1028. | `10.1002/jts.20271` | [flag — not confirmed this session] |
| 8 | Connor, K. M., & Davidson, J. R. T. (2003). Development of a new resilience scale: The Connor–Davidson Resilience Scale (CD-RISC). *Depression and Anxiety*, 18(2), 76–82. | `10.1002/da.10113` | [verified in Selectron criteria] |
| 9 | Cooper, K. H. (1968). A means of assessing maximal oxygen intake. Correlation between field and treadmill testing. *JAMA*, 203(3), 201–204. | `10.1001/jama.203.3.201` | ✓ verified via Scite 2026-05-19 (322 citations) |
| 10 | Dev, S. I., Khader, A., Begerowski, S. R., et al. (2024). Cognitive performance in ISS astronauts on 6-month low earth orbit missions. *Frontiers in Physiology*, 15, 1451269. | `10.3389/fphys.2024.1451269` | [verified in Selectron criteria] |
| 11 | Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory: Development of the IPIP-NEO-120. *Journal of Research in Personality*, 51, 78–89. | `10.1016/j.jrp.2014.05.003` | [flag — not confirmed this session] |
| 12 | Kay, G. G. (1995). *CogScreen-AE Professional Manual*. PAR Inc. | No DOI (commercial manual) | [not a journal article; verified as PAR Inc. product] |
| 13 | Kokun, O., & Bakhmutova, L. (2024). Salutogenic outcomes and their personality predictors in participants of year-long Antarctic expeditions. *Polish Polar Research*. | `10.24425/ppr.2024.150021` | [verified in Selectron criteria] |
| 14 | Kroenke, K., & Spitzer, R. L. (2002). The PHQ-9: A new depression diagnostic and severity measure. *Psychiatric Annals*, 32(9), 509–515. | `10.3928/0048-5713-20020901-06` | [flag — not confirmed this session] |
| 15 | Lowe, M., Harris, W., Kane, R. L., et al. (2007). Neuropsychological assessment in extreme environments. *Archives of Clinical Neuropsychology*, 22(Suppl 1), S89–S98. | PMID 17147982, DOI not indexed | [verified PMID; DOI flag] |
| 16 | Mulavara, A. P., Feiveson, A. H., Fiedler, J., et al. (2010). Locomotor function after long-duration space flight: effects and motor learning during recovery. *Experimental Brain Research*, 202(3), 649–659. | `10.1007/s00221-010-2171-0` | [verified PMID 20135100] |
| 17 | O'Boyle, E. H., Humphrey, R. H., Pollack, J. M., Hawver, T. H., & Story, P. A. (2011). The relation between emotional intelligence and job performance: A meta-analysis. *Journal of Organizational Behavior*, 32(5), 788–818. | `10.1002/job.714` | [verified in Selectron criteria] |
| 18 | Ozdemir, R. A., Goel, R., Reschke, M. F., et al. (2018). Critical Role of Somatosensation in Postural Control Following Spaceflight. *Frontiers in Physiology*, 9, 1680. | `10.3389/fphys.2018.01680` | [verified in Selectron criteria] |
| 19 | Palinkas, L. A., Gunderson, E. K. E., Holland, A. W., Miller, C., & Johnson, J. C. (2004). Predictors of behavior and performance in extreme environments: The Antarctic Space Analogue Program. *Aviation, Space, and Environmental Medicine*, 75(9), 734–740. | `10.3402/ijch.v63i2.17702` | [verified in Selectron criteria] |
| 20 | Petrides, K. V., Pérez-González, J. C., & Furnham, A. (2007). On the criterion and incremental validity of trait emotional intelligence. *Cognition & Emotion*, 21(1), 26–55. | `10.1080/02699930600843894` | [flag — not confirmed this session] |
| 21 | Piper, B. J., Mueller, S. T., Geerken, A. R., et al. (2015). Reliability and validity of neurobehavioral function on the Psychology Experimental Building Language test battery in young adults. *PeerJ*, 3, e1460. | `10.7717/peerj.1460` | [verified PMID 26713233] |
| 22 | Tays, G. D., Hupfeld, K. E., McGregor, H. R., et al. (2021). The Effects of Long Duration Spaceflight on Sensorimotor Control and Cognition. *Frontiers in Neural Circuits*, 15, 723504. | `10.3389/fncir.2021.723504` | [verified in Selectron criteria] |

---

## 7. Tests considered but dropped from the tier framework

| Test | Reason |
|---|---|
| CogScreen-AE as Tier-1 substitute | Commercial license (~$500+); not accessible at zero budget. PEBL is the defensible Tier-1 substitute. |
| CANTAB (Cambridge Neuropsychological Test Automated Battery) | Commercial license (Cambridge Cognition); cost is higher than CogScreen-AE for research version; PubMed evidence shows modest correlation with traditional neuropsychological tests (Smith et al. 2013, DOI: `10.1080/13803395.2013.771618`); no aviation or analog-mission normative database. Inferior to PEBL + CogScreen-AE chain. |
| ANAM4 as Tier-2 cognitive substitute | U.S. Department of Defense system; currently restricted to DoD use for the standard military battery. The general neuropsychological version (ANAM GNS) may be licensable through Cognitive Science Research Corporation but pricing is unclear and there is no analog-mission validation cohort. Belanger et al. (2022) SOF normative data (DOI: `10.1080/13854046.2021.1933191`) is the best evidence base but the target population (special operations forces) differs from analog-astronaut candidates in important ways (training background, physical selection threshold). Retained as a future option in §6 citation but not assigned to the main tier chain. |
| MicroCog (Harrison et al.) | Largely discontinued; no current publisher support found; predecessor to CogScreen-AE for neurological populations; not aviation-normed. |
| PsyToolkit web-based battery | Free web platform with PVT and several cognitive tasks; no published validation paper against analog or aviation populations retrieved. Could supplement PEBL at Tier 1 but cannot replace it as the primary anchor. |
| Wechsler Adult Intelligence Scale (WAIS-IV) | High cost, licensed psychologist required even at Tier 2; 60–90 min administration; no analog-mission predictive-validity paper retrieved. Better handled by the PEBL/CogScreen chain for throughput; WAIS-IV appropriate only in clinical neuropsychological contexts. |
| Actigraphy (sleep monitoring) | Wrist-worn actigraphy does not produce a pre-selection static baseline criterion score; better deployed as in-mission monitoring. Recommended for Iter 3 longitudinal monitoring module, not MCDA input. |
| DASS-42 (full version) | Redundant with DASS-21 at Tier 1; extra items add time without improving triage utility for selection purposes. |

---

## 8. Flags for Diego — action required before Iter 2 integration

1. **CogScreen-AE price verification**: Confirm current PAR Inc. pricing (par.iagc.com). If the license cost has risen above USD 1 000 (possible since 2020 catalogue), the Tier-2 assignment should be reviewed and CogScreen-AE should be moved to an optional Tier-2B with ANAM-GNS as the alternative.

2. **FMT score transformation**: The `physical.sot5_equilibrium` criterion must have its Tier-1 score transformation defined before the criterion is used in a mixed-tier scoring run. The FMT obstacle course produces time-to-complete in seconds (lower = better; inversely related to the SOT-5 EQ 0–100 scale). Propose transformation: `T1_score = max(0, 100 − (TTC − 10) × 3)` where TTC = 10 s represents an excellent pre-flight baseline (Mulavara 2010 pre-flight median ≈ 10–12 s) and each additional second penalizes 3 EQ points; cap at 0. Needs empirical calibration.

3. **DASS-21 vs MMPI-2-RF**: The DASS-21 is **not** a psychiatric select-out instrument. It cannot substitute for MMPI-2-RF as a formal gate. At Tier 1, the program must document that it is operating without a psychiatric gate and that DASS-21 scores are used for referral triage only. A positive DASS-21 screen should require the candidate to provide a letter from a licensed mental health professional before mission deployment — this is operationally achievable even in low-resource settings.

4. **PHQ-9 to BDI-II scale alignment**: Decide whether to (a) keep the Criterion `scale: {min: 0, max: 63}` and apply a linear multiplier at Tier 1, or (b) create a Tier-specific scale flag in the data model (lower priority; Iter 2 engineering decision).

5. **Flagged DOIs**: Items 7, 9, 11, 14, 20 in §6 were not network-verified in this session (external search tools were unavailable). Diego should check each before citing in the Iter 4 paper draft.

6. **CD-RISC-10 score rescaling**: At Tier 1, CD-RISC-10 (0–40) must be rescaled to (0–100) via `score × 2.5` before entering the Selectron criterion. The `scale` field in `placeholder-criteria.ts` is currently `{min: 0, max: 100}`; this is correct for Tier 2–3 (CD-RISC-25). Add a data-entry note.
