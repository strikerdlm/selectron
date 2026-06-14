# A reproducible Bayesian MCDA and NASA-IMM/HSRB risk-mapping pipeline for analog astronaut selection

**Acta Astronautica conversion draft — not submission-ready.** This file is the Acta-specific manuscript scaffold. It must be completed from the frozen Selectron software commit, converted to numbered references, and checked against `submission_checklist.md` before rendering.

Diego L. Malpica, MD\*  
Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia  
\*Corresponding author. E-mail: dlmalpica@yahoo.com  
**Full postal address:** TODO — required by Acta Astronautica.

## Abstract

Analog-astronaut selection combines heterogeneous psychological, cognitive, behavioral, physical, and professional criteria, yet selection panels often reduce those criteria to deterministic ordinal rankings. Mission medical risk is likewise difficult to communicate across programs because analog-mission outputs are rarely expressed in the institutional risk language used by human-spaceflight programs. We present Selectron, a reproducible TypeScript implementation of a two-stage computational methodology for analog-astronaut selection research. Stage A applies Bayesian multi-criteria decision analysis (MCDA): criterion weights are represented by a Dirichlet distribution and propagated into posterior distributions over candidate composite scores. Stage B implements a NASA Integrated Medical Model (IMM)-aligned Monte Carlo simulator over the K15 100-condition medical-event catalogue and maps Crew Health Index (CHI), evacuation, loss-of-crew-life, and mission-success outputs onto the NASA Human System Risk Board (HSRB) Likelihood × Consequence matrix. Verification uses closed-form Dirichlet moments, seeded deterministic replay, Poisson-Gamma checks, convergence diagnostics, and exact reproduction of the HSRB priority-score grid. Inter-model agreement against the public K15 reference crew shows that total medical events fall within the published 95% confidence interval across all three medical-resource scenarios and that unlimited-resource CHI falls within the K15 interval; operational ISS-HMS CHI and several evacuation/loss-of-crew-life metrics remain documented divergences. Selectron is not a clinical decision-support system, autonomous selector, or flight-certification tool. It is an offline, reproducible methodology for analog-mission crew-selection research and transparent risk communication.

**Keywords:** analog astronaut; mission medical risk; Integrated Medical Model; Bayesian decision analysis; probabilistic risk assessment; reproducible software

**Abbreviations:** CHI, Crew Health Index; HSRB, Human System Risk Board; IMM, Integrated Medical Model; MCDA, multi-criteria decision analysis; MSP, Mission Success Probability; QTL, quality time lost.

## 1. Introduction

Analog-astronaut programs require defensible selection and mission-risk procedures, but the available evidence base is fragmented across psychological screening, cognitive performance, team behavior, occupational medicine, and space-medicine risk modeling. Conventional selection workflows tend to collapse multiple criteria into an ordinal list, even when the criterion weights are uncertain and the difference between two candidates is smaller than the weight-elicitation error. This creates an appearance of precision that is not supported by the underlying measurements.

A separate communication problem exists for analog-mission medical risk. Programs may report incident counts, clinical judgments, or early-termination risk in local terms, but these outputs do not automatically map onto the NASA Human System Risk Board (HSRB) Likelihood × Consequence language used for programmatic risk communication. The absence of a bridge from analog-mission Monte Carlo outputs to an institutional risk matrix limits comparability between Earth-based analog missions and human-spaceflight risk-management frameworks.

Selectron addresses these two problems as a reproducible computational artifact. Stage A models candidate ranking as Bayesian multi-criteria decision analysis (MCDA), returning posterior score distributions rather than point ranks. Stage B implements an IMM-aligned mission medical-risk Monte Carlo and maps the resulting mission-health posterior to the NASA HSRB matrix. The contribution is methodological: a transparent, deterministic, browser-resident pipeline for research and decision support. It is not a clinical decision-support system, not an autonomous selector, and not a flight-certification tool.

**Citation conversion note:** all citations from the ASR manuscript must be converted from author-date Pandoc syntax to Acta numbered square-bracket citations ordered by first appearance.

## 2. Material and methods

### 2.1 Software artifact, scope, and reproducibility boundary

Selectron is implemented as a TypeScript browser application with deterministic seeded simulation and no required production backend. The Python calibration package is retained for offline prior elicitation and sensitivity analysis but is not required for runtime scoring. The Acta submission must be locked to a frozen Selectron commit, a Zenodo archived release, a hash of `src/data/imm-priors.json`, and a figure-generation command recorded in `reproducibility-lock.json`.

The present manuscript is scoped to Earth-based analog isolation missions and LEO/ISS-baseline scenarios. Mars and Artemis missions are explicitly out of scope because the current model does not yet include comms-delay treatment degradation, cumulative radiation-dose pathways, partial-gravity EVA risk profiles, autonomous medical-resource depletion, or compound medical/life-support failures.

### 2.2 Stage A — Bayesian MCDA candidate scoring

For candidate *i* and active criterion *k*, Selectron computes a composite score by linear additive aggregation:

\[
S_i = \sum_{k=1}^{K} w_k z(x_{i,k}),
\tag{1}
\]

where *x* is the raw criterion score, *z*(·) maps the raw instrument scale to [0,1] with common polarity, and *w* is a criterion-weight vector sampled from a Dirichlet distribution. The output is an empirical posterior over *S_i*, not a single deterministic rank. The sampler uses the standard Gamma decomposition of the Dirichlet distribution and is checked against closed-form Dirichlet moments.

The selection taxonomy contains 12 criteria distributed across psychological, cognitive, behavioral, physical, and professional families. A three-tier accessibility model activates 8, 10, or 12 criteria depending on available instruments. This permits low-resource analog programs to use the same construct taxonomy as better-resourced programs while preserving explicit uncertainty about unmeasured or inactive criteria.

### 2.3 Stage B — IMM-aligned mission medical-risk Monte Carlo

Stage B simulates medical risk across the K15 100-condition catalogue. Each Monte Carlo trial runs a mission-level sequence of incidence sampling, severity branching, treatment/resource interpolation, and quality-time-lost aggregation. Incidence distributions include Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli, and Fixed-Poisson paths depending on condition provenance and event type.

Per-event quality time lost is computed with a sequential-phase formulation:

\[
QTL_{event} = f_{cp1}\Delta t_{cp1}^{clamp} + f_{cp2}\Delta t_{cp2}^{clamp} + f_{cp3}\max(0, t_{end} - t_{event} - \Delta t_{cp1}^{clamp} - \Delta t_{cp2}^{clamp}).
\tag{2}
\]

This preserves the K15 distinction between sequential clinical phases of a single event and overlapping impairments across different events. Trial-level Crew Health Index (CHI) is then:

\[
\chi = 1 - QTL/(t c),
\tag{3}
\]

where *t* is mission duration and *c* is crew size. Mission Success Probability (MSP) is the fraction of trials with no evacuation, no loss of crew life, and CHI above the operator-supplied threshold.

### 2.4 NASA HSRB Likelihood × Consequence mapping

Selectron maps the mission-failure probability, defined as 1 − MSP, to the HSRB in-mission likelihood axis. Consequence is mapped from the mission-time-lost fraction, 1 − mean(CHI), using the Mission Objectives Impact interpretation. The 5×5 HSRB priority-score grid is redrawn from the published numerical matrix rather than reproduced as a screenshot. The figure files must be submitted as author-generated artwork, with the source document cited.

### 2.5 Verification and validation

Verification includes closed-form Dirichlet moment checks, effective-sample-size behavior for independent Dirichlet draws, Poisson-Gamma conjugacy checks, deterministic seeded replay, convergence diagnostics, and exact fixture tests for the 25 HSRB priority-score cells.

Validation is reported as **inter-model agreement**, not observed-outcome validation. The public K15 reference model is itself a simulator output, not a held-out clinical or flight dataset. The current K15 reproduction gate therefore evaluates whether Selectron reproduces the published K15 output envelope where public data allow comparison, while preserving explicit documented divergences.

### 2.6 Sex and gender handling

Sex is used only where the K15 reference crew or published epidemiological priors define male/female model inputs. Gender identity is not modeled, inferred, or used for selection. The binary sex coding reflects limitations of the source models and should not be interpreted as a general biological or social model of sex or gender diversity.

## 3. Results

### 3.1 Stage-A posterior behavior

The Stage-A demonstration should be regenerated from the frozen Selectron commit. The Acta version should retain two examples: a midpoint synthetic candidate showing the expected degenerate posterior when every normalized criterion score equals 0.5, and a differentiated multi-candidate example showing non-trivial credible intervals and rank uncertainty.

### 3.2 K15 inter-model agreement

The final Acta submission must regenerate this table from the frozen commit. Current manuscript values are retained here only as the starting point for conversion.

**Table 1. K15 Table 1 reproduction draft values.** Final values must be regenerated from the frozen commit at T = 100,000 and seed 0xc0ffee.

| Scenario | Metric | Selectron draft | K15 reference | K15 CI95 | Interpretation |
|---|---:|---:|---:|---:|---|
| No kit | TME | 97.8 | 98.30 | [73, 122] | within |
| No kit | CHI | 79.1% | 59.20% | [43.36, 71.25] | documented divergence |
| No kit | pEVAC | 12.52% | 66.90% | [66.57, 67.14] | documented divergence |
| No kit | pLOCL | 0.25% | 2.89% | [2.78, 2.99] | documented divergence |
| ISS HMS | TME | 98.1 | 106.00 | [87, 126] | within |
| ISS HMS | CHI | 82.8% | 94.93% | [84.30, 98.50] | marginal documented divergence |
| ISS HMS | pEVAC | 9.65% | 5.57% | [5.43, 5.72] | documented divergence |
| ISS HMS | pLOCL | 0.23% | 0.44% | [0.40, 0.49] | documented divergence |
| Unlimited | TME | 98.8 | 106.00 | [87, 126] | within |
| Unlimited | CHI | 95.3% | 94.98% | [84.40, 98.50] | within |
| Unlimited | pEVAC | 1.78% | 4.93% | [4.80, 5.07] | documented divergence |
| Unlimited | pLOCL | 0.18% | 0.45% | [0.41, 0.49] | documented divergence |

### 3.3 HSRB verdict mapping

The HSRB figure should report the final frozen K15 reference configuration and the relevant L×C cell. The discussion must separate the mapping procedure from the underlying medical-risk calibration: if a different model output maps to a different color, that is a model-output difference, not a failure of the HSRB grid reconstruction.

### 3.4 Cross-mission comparison

The cross-mission comparison should be retained as a sensitivity and behavior check across representative Earth analog and LEO/ISS-baseline mission profiles. It should not be presented as validation against observed analog-mission incident registries.

### 3.5 Sensitivity analysis

The Acta version should retain condition-set decomposition and tier-B multiplier sweep tables. These are important because they support the non-circularity argument and bound the contribution of independently fitted terrestrial/analog priors.

## 4. Discussion

Selectron’s main contribution is a transparent bridge between two decision problems that are usually handled separately: uncertain candidate scoring and mission medical-risk communication. Stage A gives selection panels posterior score distributions and rank uncertainty. Stage B converts mission-health Monte Carlo outputs into NASA HSRB risk language. Together, they provide a reproducible research methodology rather than a proprietary or opaque point-score system.

The principal limitation is outcome validity. The current evidence supports mathematical verification, deterministic reproducibility, and inter-model agreement with a public NASA reference output. It does not establish predictive validity for real applicant outcomes, real analog-mission incidents, or operational flight certification. This distinction should remain explicit in the abstract, discussion, limitations, and cover letter.

A second limitation is source-model dependency. K15 provides public aggregate outputs but not the internal iMED per-condition numerical database. Selectron’s condition priors are therefore a mixture of NASA-attributed sources and independently fitted terrestrial/analog/military priors. The Acta submission must regenerate and report exact provenance counts from the frozen `imm-priors.json` file.

A third limitation is scope. Earth analogs and LEO/ISS-baseline scenarios are in scope. Mars and Artemis are not. Enabling those missions requires structural model extensions, not mere recalibration.

## 5. Conclusions

Selectron provides a reproducible computational methodology for analog-astronaut selection research. It propagates criterion-weight uncertainty into Bayesian MCDA candidate-score posteriors, implements an IMM-aligned medical-risk Monte Carlo, and maps mission-health outputs into the NASA HSRB Likelihood × Consequence framework. The current evidence supports publication as a method and software-validation contribution, provided the manuscript avoids operational validation claims and preserves the documented K15 divergences.

## Acknowledgements

TODO. Keep separate from the title page. Include only individuals or services that provided non-author help.

## Funding

This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

## CRediT authorship contribution statement

Diego L. Malpica: Conceptualization; Methodology; Software; Validation; Formal analysis; Investigation; Data curation; Writing – original draft; Writing – review & editing; Visualization; Supervision; Project administration; Funding acquisition.

## Declaration of competing interest

The author declares that there are no known competing financial interests or personal relationships that could have appeared to influence the work reported in this paper.

## Ethics declaration

This is a computational methodology study using synthetic data and publicly described model outputs. No human participants, animal subjects, clinical records, applicant files, or operational crew records were collected, accessed, or analyzed.

## Data and code availability

All synthetic data, model priors, simulation code, figure-generation code, and verification tests will be available in the frozen Selectron source release and archived at Zenodo. The release DOI and exact commit SHA must be inserted before submission.

## Declaration of generative AI and AI-assisted technologies in the manuscript preparation process

During the preparation of this work, the author used AI-assisted tools for coding assistance, automated test generation, figure-rendering code, bibliography-verification support, and copy-editing of author-written prose for grammar and readability. After using these tools, the author reviewed and edited the content as needed and takes full responsibility for the content of the published article. No AI tool was used as an author or co-author.

## References

TODO: Convert `paper/references.bib` from the ASR author-date workflow into Acta numbered references ordered by first appearance. Web references must include access dates. The frozen Selectron Zenodo release must be cited as software.
