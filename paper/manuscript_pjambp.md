# Bayesian Aerospace-Medicine Decision Support for Analog-Astronaut Selection and Mission-Risk Mapping

Diego L. Malpica, MD  
Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogota, Colombia  
Correspondence: dlmalpica@yahoo.com

## Abstract

**Introduction:** Analog-astronaut and isolated-confined-environment programs combine heterogeneous psychological, cognitive, behavioral, physical, and professional selection criteria, but often report deterministic rankings and program-specific risk verdicts. We developed Selectron as a reproducible aerospace-medicine decision-support method for expressing both selection uncertainty and mission medical risk in auditable terms.

**Methods:** Stage A models selection-criterion weights with a Dirichlet prior and propagates weight uncertainty into posterior candidate scores. Stage B implements a NASA Integrated Medical Model (IMM)-aligned Monte Carlo simulator over the K15 100-condition catalog plus one disclosed analog behavioral extension, then maps Crew Health Index and mission-success probability to the NASA Human System Risk Board Likelihood x Consequence matrix. Verification used closed-form Dirichlet moments, Poisson-Gamma checks, seeded replay, JSC-66705 grid fixtures, and K15 reference-crew reproduction.

**Results:** In the discriminative Stage-A example, two high-performing candidates had overlapping 95% credible intervals, while a lower-performing candidate separated clearly. In Stage B, total medical events fell within the K15 CI95 envelope across all three resource scenarios, and unlimited-resource Crew Health Index was within CI95. Operational ISS-HMS Crew Health Index and evacuation/loss-of-crew-life metrics remained disclosed divergences.

**Discussion and conclusions:** Selectron provides a transparent research framework for analog crew-selection uncertainty and aerospace-medicine risk communication. It is not a clinical, certification, or operational astronaut-selection tool.

**Keywords:** Aerospace medicine; Astronauts; Decision support systems; Human factors; Risk assessment; Bayes theorem; Monte Carlo method

## Introduction

Analog-astronaut programs and other isolated, confined, and extreme-environment missions ask selection panels to combine psychological resilience, cognitive performance, teamwork, medical fitness, and professional experience into a defensible crew recommendation. The decision problem is intrinsically uncertain. Candidate scores are measured on different scales, criteria differ in relevance by mission, and the relative weights assigned by a panel are rarely known with precision. Nevertheless, selection workflows commonly collapse this uncertainty into deterministic ordinal rankings.

This matters for aerospace medicine because crew selection and crew medical risk are not independent decisions. A candidate profile judged "best" by a fixed rubric may not remain best when criterion weights vary within plausible expert ranges. A mission medical-risk assessment described as "low" or "acceptable" in one analog program may be difficult to compare with a risk verdict produced by another program. Existing analog-mission frameworks have emphasized standardization of selection, training, and behavioral-health-performance reporting [@apollonio2026; @delatorre2024], while recent discussions of astronaut selection in commercial and government contexts have emphasized mission-specific and risk-informed screening [@evetts2026]. A quantitative bridge between selection uncertainty and aerospace-medicine risk communication remains underdeveloped.

Selectron was built to address that gap as a reproducible research artifact. It combines two linked stages. Stage A is a Bayesian multi-criteria decision-analysis (MCDA) engine for analog crew selection. It treats criterion weights as uncertain, samples them from a Dirichlet prior, and reports posterior distributions over candidate composite scores instead of only point ranks. Stage B is an IMM-aligned mission medical-risk simulator. It estimates Crew Health Index, total medical events, evacuation probability, loss-of-crew-life probability, and mission-success probability, then maps the mission posterior to the NASA Human System Risk Board (HSRB) Likelihood x Consequence matrix described in JSC-66705 [@jsc66705].

The aim of this article is not to certify Selectron for operational use. The contribution is methodological: a transparent, offline, seed-reproducible aerospace-medicine decision-support pipeline that can help analog programs report selection uncertainty and mission medical risk in a common language. The manuscript is framed for research use, with explicit limits on clinical, regulatory, and flight-certification interpretation.

## Methods

### Study Design

This is a reproducible computational-methodology study. No human subjects, clinical records, personnel files, or analog-mission incident registries were collected or analyzed. All selection examples use synthetic candidate profiles. Medical-risk reproduction uses the K15 reference-crew configuration described in the NASA IMM literature [@imm-k15] and implemented as a deterministic software test fixture.

### Stage A: Bayesian Selection Model

Stage A represents a candidate by a vector of normalized criterion scores. The current Selectron taxonomy contains 12 criteria grouped into psychological, cognitive, behavioral, physical, and professional families. The taxonomy is deployed across three accessibility tiers: Minimum, Medium, and Elite. The tiering is intended for analog programs with different resource levels; lower tiers use free or low-cost instruments, while higher tiers admit commercially licensed or hardware-gated assessments.

For a candidate with K active criteria, the criterion-weight vector is modeled as

$$\mathbf{w} = (w_1,\ldots,w_K) \sim \mathrm{Dirichlet}(\boldsymbol{\alpha}).$$

The default prior uses equal concentration across active criteria. Candidate score is the weighted sum

$$S_i = \sum_{k=1}^{K} w_k z_{ik},$$

where $z_{ik}$ is the normalized criterion score for candidate $i$, transformed so that higher values always indicate more favorable performance. Dirichlet draws are generated through the standard Gamma decomposition [@bishop2006; @marsagliatsang2000]. The output is a posterior distribution for each candidate score, including credible intervals and rank uncertainty.

This structure is related to stochastic multicriteria acceptability analysis and Bayesian MCDA in health benefit-risk assessment [@lahdelma2001; @sainthilary2017]. Its application here is to selection-panel uncertainty: when two candidates have overlapping posterior score intervals, a deterministic point rank should not be treated as a stable decision object.

### Stage B: Aerospace-Medicine Risk Simulator

Stage B implements a mission medical-risk Monte Carlo simulator aligned with the NASA Integrated Medical Model (IMM) architecture [@imm-k15; @imm-m18; @imm-a22]. The current release carries 101 conditions: the 100-condition K15 catalog plus one disclosed analog behavioral extension, `interpersonal-conflict`, included because isolated/confined-environment missions surface team-conflict risk as an operational driver.

For each mission trial, event incidence is sampled per condition and crew member using the condition's specified incidence distribution. Severity, functional impairment, and treatment duration are then sampled from condition-level priors. Resource availability shifts treated and untreated outcome distributions according to the medical-kit configuration. The per-event quality-time-lost contribution follows the K15 sequential-phase interpretation: diagnosis/treatment phase, convalescence phase, and any permanent impairment phase are accumulated in sequence, with event duration clamped to the remaining mission time.

Crew Health Index is defined as in the IMM literature:

$$\chi = 1 - \frac{\mathrm{QTL}}{t \cdot c},$$

where QTL is quality time lost, $t$ is mission duration in hours, and $c$ is crew count. Stage B also reports total medical events, evacuation probability, loss-of-crew-life probability, and mission-success probability, defined as the trial fraction with no evacuation, no loss of crew life, and $\chi$ above the operator-specified threshold.

Stage A can pass candidate scores into Stage B as vulnerability modifiers on condition incidence rates. That coupling path is implemented and unit-tested, but it is not active in the validation results reported here. The K15 reference crew carries no Stage-A scores; therefore, the reported Stage-B runs evaluate the uncoupled IMM-aligned pathway.

### HSRB Risk Mapping

The Stage-B posterior is mapped to the HSRB Likelihood x Consequence framework using JSC-66705 Revision A [@jsc66705]. Mission-failure probability $1 - \mathrm{MSP}$ determines likelihood level. The consequence level is assigned from $1 - \chi_{\mathrm{mean}}$, interpreted as the fraction of crew mission-time lost under the Mission Objectives Impact subcategory. The priority-score grid and color rule are reproduced as software fixtures: scores <=10 are green, 11-19 are yellow, and >=20 are red, matching the JSC-66705 color thresholds.

### Verification and Reproducibility

Verification focused on checks that are meaningful for a research decision-support tool. Stage A was checked against closed-form Dirichlet moments. Stage B was checked with Poisson-Gamma conjugacy, seeded replay, the NASA-canonical 100,000-trial configuration for K15 reproduction, and the sigma <5% convergence rule described in the IMM validation literature [@imm-m18; @imm-a22]. The HSRB mapping was checked against all 25 JSC-66705 priority-score cells.

The software is implemented in TypeScript and runs in the browser. The version of record is Selectron v0.5.6, archived at `https://doi.org/10.5281/zenodo.20693257`. The source repository is `https://github.com/strikerdlm/selectron`. The figure-generation commit marker in the source manuscript is `538e16ccff94`.

## Results

![Figure 1. Selectron pipeline. Stage A produces a Bayesian posterior over each candidate score; Stage B runs an IMM-aligned mission medical-risk Monte Carlo; the output is mapped to the HSRB Likelihood x Consequence matrix.](figures/F1_pipeline.png){#fig:pipeline width=95%}

### Stage-A Selection Uncertainty

The Medium-tier demonstration uses 10 active criteria. A midpoint candidate with identical normalized scores on every criterion produces a degenerate posterior at $S_i = 0.500$, as expected: when all $z_k = 0.5$, the weighted sum is 0.5 for every possible Dirichlet weight draw. This is a useful implementation check but not a realistic selection-panel case.

The more informative example uses three differentiated synthetic candidates. ALPHA is strong on psychological and physical criteria but weaker on cognitive criteria. BRAVO is strong on cognitive and professional criteria. CHARLIE is uniformly below average. With 5000 Dirichlet draws, ALPHA and BRAVO show overlapping 95% credible intervals, while CHARLIE separates clearly below both (Table 1).

**Table 1. Stage-A discriminative example.** Medium tier, K = 10 active criteria, 5000 Dirichlet draws, seed 0xc0ffee.

| Candidate | Profile summary | Mean score | 90% CI | 95% CI | ESS |
|---|---|---:|---|---|---:|
| ALPHA | Strong psychological/physical; weaker cognitive | 0.684 | 0.568-0.773 | 0.542-0.785 | 4890 |
| BRAVO | Strong cognitive/professional; moderate elsewhere | 0.626 | 0.549-0.720 | 0.540-0.740 | 4939 |
| CHARLIE | Uniformly below average | 0.402 | 0.389-0.414 | 0.387-0.417 | 5159 |

The practical interpretation is straightforward. ALPHA has the higher mean score, but BRAVO can outrank ALPHA under weight draws that emphasize cognitive and professional criteria. A selection panel should therefore treat ALPHA versus BRAVO as a decision requiring additional review, not as a settled ordinal rank. CHARLIE's upper 95% bound remains below BRAVO's lower 95% bound, supporting a stable reject or defer signal under the modeled weighting uncertainty.

![Figure 2. Criterion taxonomy and accessibility-tier matrix. Selectron uses 12 criteria across three resource tiers so low-resource analog programs and higher-resource programs can use the same decision structure with different active instruments.](figures/F2_criterion_tiers.png){#fig:tiers width=85%}

### K15 Reference-Crew Reproduction

The K15 reproduction run used the published 6-person reference crew, 100,000 trials, seed 0xc0ffee, and three medical-resource scenarios: no kit, ISS Health Maintenance System (ISS-HMS), and unlimited resources. Total medical events fell within the K15 CI95 envelope in all three scenarios. Unlimited-resource Crew Health Index also fell within the K15 CI95 envelope. Operational ISS-HMS Crew Health Index and evacuation/loss-of-crew-life metrics remained documented divergences (Table 2).

**Table 2. K15 Table 1 reproduction summary.** Bold values fall within the K15 CI95 interval. Divergent values are retained as tracked model limitations, not hidden by recalibration.

| Scenario | Metric | Selectron | K15 reference | K15 CI95 | Status |
|---|---|---:|---:|---|---|
| No kit | TME | **97.8** | 98.30 | 73-122 | Within |
| No kit | CHI | 79.1% | 59.20% | 43.36-71.25% | Divergent |
| No kit | pEVAC | 12.52% | 66.90% | 66.57-67.14% | Divergent |
| No kit | pLOCL | 0.25% | 2.89% | 2.78-2.99% | Divergent |
| ISS-HMS | TME | **98.1** | 106.00 | 87-126 | Within |
| ISS-HMS | CHI | 82.8% | 94.93% | 84.30-98.50% | Divergent |
| ISS-HMS | pEVAC | 9.65% | 5.57% | 5.43-5.72% | Divergent |
| ISS-HMS | pLOCL | 0.23% | 0.44% | 0.40-0.49% | Divergent |
| Unlimited | TME | **98.8** | 106.00 | 87-126 | Within |
| Unlimited | CHI | **95.3%** | 94.98% | 84.40-98.50% | Within |
| Unlimited | pEVAC | 1.78% | 4.93% | 4.80-5.07% | Divergent |
| Unlimited | pLOCL | 0.18% | 0.45% | 0.41-0.49% | Divergent |

The cleanest agreement target is the unlimited-resource CHI result because it removes kit-resource pathway effects. The operational ISS-HMS CHI result was 1.5 percentage points below the lower K15 CI95 bound after evidence-based community/military incidence recalibration. The divergence is therefore presented as an open calibration and outcome-parameter issue rather than a passed validation result.

### HSRB Mapping

For the K15 reference crew on the ISS 6-month mission with the ISS-HMS kit, mission-success probability was 86.0%, so mission-failure probability was 14.0%. This places the run in likelihood level L5 under the in-mission thresholds. Mean CHI was 0.828, giving a mission-time fraction lost of 0.172 and consequence level C4. The resulting L5 x C4 priority score is 23, a red verdict (Fig. 3).

![Figure 3. HSRB Likelihood x Consequence mapping for the K15 reference crew on the ISS 6-month mission with the ISS-HMS kit. The highlighted L5 x C4 cell gives a priority score of 23, red.](figures/F6.png){#fig:lxc width=80%}

This verdict is a risk-communication output, not an operational flight-readiness decision. For comparison, the same model under unlimited resources yields CHI 95.3%, fraction lost 4.7%, and a yellow verdict. The color shift is therefore driven by medical-resource assumptions and evidence-based incidence rates, not by the HSRB grid itself.

### Cross-Mission Comparison

The model was also run across representative analog and LEO/ISS mission profiles using the ISS-HMS kit and the same reference crew structure. CHI declined monotonically with duration: MDRS 2-week, 95.70%; HI-SEAS 45-day, 90.01%; HI-SEAS 90-day, 86.71%; ISS 6-month, 82.78%; ISS DRM1 365-day, 77.69%; Antarctic winter-over 365-day/12-person, 76.67%; and Mars-500 520-day, 73.70%.

![Figure 4. Cross-mission comparison across representative Earth-analog and LEO/ISS missions. CHI decreases with mission duration and HSRB color escalates as mission medical risk accumulates.](figures/F7.png){#fig:missions width=95%}

The cross-mission panel is best interpreted as an internal consistency check and scenario-comparison screen. It is not validation against observed analog-mission outcomes. Such validation would require access to comparable analog-program incident registries or longitudinal crew health data, which were not available for this study.

### Sensitivity Results

Condition-set decomposition showed that the 34 NASA-sourced conditions alone produced ISS-HMS CHI 97.3%, within the K15 CI95 interval, while the 66 literature-fitted tier-B conditions contributed most of the additional event count and lowered full-model ISS-HMS CHI to 82.8%. A tier-B multiplier sweep showed monotonic behavior: increasing tier-B incidence raised total medical events and lowered CHI. At multiplier 0.50, ISS-HMS CHI was 89.9%; at 0.75, 86.4%; at the production value 1.00, 82.8%; and at 2.00, 68.7%.

These results support two conclusions. First, the model behaves directionally as expected when mission duration and incidence assumptions change. Second, the K15 divergences are concentrated in the evidence-based tier-B incidence layer and in per-condition evacuation/loss-of-crew-life outcome parameters, which remain audit targets.

## Discussion

Selectron's practical value for aerospace medicine is the separation of two kinds of uncertainty that are often conflated. Stage A quantifies selection-rubric uncertainty: how much a candidate's apparent rank depends on criterion weights. Stage B quantifies mission medical-risk uncertainty: how much risk accumulates across a mission profile and medical-resource configuration. The HSRB mapping then translates the Stage-B posterior into a familiar risk-priority language.

For analog programs, this creates a more transparent decision record. A panel can see when two candidates are genuinely close under plausible weighting assumptions. A medical or mission-risk reviewer can see how a crew and mission profile map to green, yellow, or red risk language. Neither layer makes the decision automatically. The method supplies an auditable decision object that can be reviewed, challenged, and rerun.

The work also has a human-factors rationale. Deterministic rankings can falsely imply precision, especially when candidates have mixed profiles. In the discriminative Stage-A example, ALPHA and BRAVO switch relative preference under different plausible weights. That result is not a model failure; it is the point of the model. The credible intervals disclose where panel judgment remains necessary.

The main limitation is validation. Selectron has internal verification and inter-model agreement checks, but it does not have outcome validation against observed analog-mission medical incidents, operational astronaut-selection outcomes, or flight-crew health data. The K15 reproduction is inter-model agreement against NASA's published IMM reference outputs, not proof that either model predicts real mission events. The paper therefore avoids claims of clinical validity, operational readiness, or certification.

A second limitation is the partially heterogeneous evidence base for the medical priors. Some conditions are tied directly to NASA IMM sources; others are fitted from terrestrial, Antarctic, submarine, military, or analog-mission literature. Those sources are appropriate for a transparent research model, but they are not equivalent to a unified prospective aerospace-medicine incident registry. The tier-B sensitivity results show that these assumptions materially affect CHI and HSRB color.

A third limitation is that the Stage-A to Stage-B coupling path is implemented but not exercised in the validation results. The reported Stage-B outputs use the uncoupled K15 reference path because the reference crew has no selection scores. A future coupled demonstration should quantify how candidate profiles alter medical-risk outputs and should test the family-specific vulnerability coefficients.

Finally, the HSRB mapping is a communication bridge. It uses the published matrix structure and color thresholds, but it does not place the work inside NASA's formal risk-governance process. Analog programs using the tool would still require local medical oversight, ethics review where human data are collected, and expert review of any mission-specific risk interpretation.

## Conclusions

Selectron provides a reproducible aerospace-medicine decision-support framework for analog crew-selection research. It represents selection weights probabilistically, reports candidate-score uncertainty, simulates mission medical risk with an IMM-aligned Monte Carlo model, and maps outputs to HSRB-style risk language. The method is useful for transparent research and risk communication, but it is not a clinical, regulatory, or operational astronaut-selection system.

## Statements

**Data availability.** All examples in this manuscript use synthetic candidate data or published K15 reference-crew configurations. No human-subjects data, clinical records, or analog-mission incident registries were collected or analyzed.

**Code availability.** The Selectron source is released under the MIT License at `https://github.com/strikerdlm/selectron` and archived at `https://doi.org/10.5281/zenodo.20693257`.

**Funding.** No external funding was received.

**Competing interests.** The author declares no competing interests.

**Ethics declarations.** No human or animal subjects were involved, and no institutional review board approval was required for the synthetic and published-reference analyses reported here.

**Declaration of generative AI and AI-assisted technologies.** During preparation of this work, the author used AI tools for coding assistance, automated test generation, figure-rendering code, bibliography-verification queries, and copy-editing of author-written prose for grammar and readability. The author reviewed and edited the content and takes full responsibility for the manuscript. No generative-AI tool was used to choose statistical methods, interpret results, or select references.

## References
