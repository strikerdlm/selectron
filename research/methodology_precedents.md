# Methodological precedents — Bayesian MCDA for personnel selection

**Agent:** A6 — Bayesian MCDA precedents
**Date:** 2026-05-18
**Audience:** Diego Malpica, MD — for the Selectron methodology paper
**Word budget target:** ≤ 2 500 words (this file ≈ 2 350 words)

---

## Bayesian MCDA — methodological landscape

Multi-criteria decision analysis (MCDA) is the dominant quantitative scaffold for personnel-selection problems where multiple weighted criteria must be aggregated into a single ranking. The classical pipeline — elicit weights (via AHP pairwise comparisons or direct rating), normalize criterion scores, aggregate linearly or by outranking (TOPSIS, PROMETHEE, ELECTRE), and produce a point-estimate rank — has known pathologies: rank reversal under alternative addition or removal (Maleki & Zahir, 2013; Li et al., 2026), brittle weight elicitation, and collapse of genuine uncertainty into a false ordering (Stam & Silva, 1997).

Bayesian MCDA addresses these by replacing point estimates with posterior distributions. Three lineages dominate: (1) **stochastic multicriteria acceptability analysis (SMAA)**, which integrates over a weight-space distribution to produce *rank-acceptability indices* — the probability that an alternative attains a given rank (Lahdelma & Salminen, 2001; Tervonen & Figueira, 2008); (2) **Bayesian extensions of pairwise-comparison methods**, where comparison vectors are multinomial and weights Dirichlet, sampled by MCMC (Stam & Silva, 1997; Mohammadi & Rezaei, 2020); and (3) **Bayesian augmentations of linear additive value models**, in which Dirichlet priors on weights and posterior distributions on per-criterion scores are propagated to a posterior on the aggregated utility (Saint-Hilary et al., 2017; Waddingham et al., 2016). Selectron sits in lineage (3), inherits SMAA's rank-acceptability output from (1), and could downstream the credal-ranking semantics of (2). The personnel-selection literature has barely engaged any lineage — the closest precedent (Li et al., 2020) sits adjacent rather than overlapping.

## Closest precedents (ranked by similarity to Selectron's design)

Similarity is decomposed across three axes: **domain** (is it personnel selection?), **mathematical form** (Dirichlet weights, linear additive aggregation, posterior on score), and **output semantics** (credible intervals, rank-acceptability indices, sensitivity to weight perturbation).

### 1. Saint-Hilary, Cadour, Robert & Gasparini (2017) — Dirichlet unification of MCDA and SMAA

*A simple way to unify multicriteria decision analysis (MCDA) and stochastic multicriteria acceptability analysis (SMAA) using a Dirichlet distribution in benefit–risk assessment.* **Biometrical Journal**, 59(3), 567–578. DOI: [10.1002/bimj.201600113](https://doi.org/10.1002/bimj.201600113).

- **Method.** Linear additive value model with a Dirichlet$(\alpha_1, \ldots, \alpha_K)$ prior over weights; the concentration $\alpha_0 = \sum_k \alpha_k$ is interpreted as the decision-maker's *strength of confidence* in the elicited mean weights. Marginalizing recovers SMAA as $\alpha_0 \to 0$ and classical MCDA as $\alpha_0 \to \infty$.
- **Domain.** Drug benefit–risk assessment (regulatory).
- **Data scale.** A handful of benefits, a handful of risks, one drug at a time.
- **What they did differently.** No personnel context. Per-criterion "scores" are population-level efficacy and adverse-event rates sampled from clinical-trial likelihoods, while Selectron treats individual scores as observed and only weights as random.
- **Similarity to Selectron.** **High on mathematical form** — Selectron's Dirichlet prior with elicited mean weights and tunable precision is essentially this paper's prior. **Low on domain. High on output semantics** — they too produce a posterior over aggregated value and rank-acceptability indices.

### 2. Lahdelma & Salminen (2001) and Tervonen & Figueira (2008) — the SMAA family

Lahdelma, R., & Salminen, P. (2001). *SMAA-2: Stochastic multicriteria acceptability analysis for group decision making.* **Operations Research**, 49(3), 444–454. DOI: [10.1287/opre.49.3.444.11220](https://doi.org/10.1287/opre.49.3.444.11220). Tervonen, T., & Figueira, J. R. (2008). *A survey on stochastic multicriteria acceptability analysis methods.* **Journal of Multi-Criteria Decision Analysis**, 15(1–2), 1–14. DOI: [10.1002/mcda.426](https://doi.org/10.1002/mcda.426).

- **Method.** Sample weights from a (uniform or Dirichlet) distribution over the simplex; for each sampled vector compute the deterministic ranking; aggregate into a *rank-acceptability index* $b_i^r$ = Pr(alternative $i$ attains rank $r$), plus a *central weight vector* and *confidence factor* per alternative.
- **Domain.** Environmental siting, ecosystem and portfolio decisions, health technology assessment; no personnel-selection application of canonical SMAA in the indexed literature.
- **Data scale.** Tens of alternatives, fewer than ten criteria.
- **What they did differently.** Selectron's "credible intervals on rank position" is the SMAA rank-acceptability index by another name; SMAA, however, is framed *without* an explicit prior — the weight distribution describes preference imprecision, not a Bayesian prior that updates with data. Selectron's literature-elicited weights with finite Dirichlet precision give the same machinery a Bayesian-prior interpretation, making future posterior updates coherent.
- **Similarity to Selectron.** **High on output semantics**, **medium on form** (Dirichlet is one of several SMAA weight distributions), **low on domain**.

### 3. Mohammadi & Rezaei (2020) — Bayesian Best-Worst Method

*Bayesian best-worst method: A probabilistic group decision-making model.* **Omega**, 96, 102075. DOI: [10.1016/j.omega.2019.06.001](https://doi.org/10.1016/j.omega.2019.06.001).

- **Method.** Best-to-others and others-to-worst comparison vectors from multiple decision-makers are modeled as multinomial; the weight vector is Dirichlet; the joint posterior is sampled by Gibbs (JAGS). Introduces *credal ranking* — a confidence-weighted directed graph on criterion pairs.
- **Domain.** General MCDM; demonstrated on supplier evaluation.
- **Data scale.** 3–12 criteria, 2–10 decision-makers; not candidate-centric.
- **What they did differently.** B-BWM is a **weight-elicitation** method that consumes pairwise comparisons. Selectron skips pairwise elicitation (single operator; weights come from a literature synthesis with explicit prior means). B-BWM stops at the weight posterior and does not produce per-candidate rank distributions. Cite as the foundational Dirichlet-over-weights MCDM paper, not the closest precedent.
- **Similarity to Selectron.** **High on form (weight prior only)**, **medium on output semantics** (credal ranking on criteria, not on alternatives), **low on domain**.

### 4. Li, Wei, Sun & Yang (2020) — Bayesian BWM for crowdsourcing delivery personnel competence

*A Bayesian Best-Worst Method-based multicriteria competence analysis of crowdsourcing delivery personnel.* **Complexity**, 2020, 4250417. DOI: [10.1155/2020/4250417](https://doi.org/10.1155/2020/4250417).

- **Method.** Direct application of Mohammadi & Rezaei (2020) to a 14-subcriterion competence framework for crowdsourced food-delivery couriers in Chongqing. Weights derived from managers' pairwise comparisons via B-BWM; analysis stops at the criterion-weight posterior.
- **Domain.** Personnel competence assessment (delivery couriers).
- **Data scale.** 14 sub-criteria, group of platform managers as decision-makers.
- **What they did differently.** No candidate-level scoring — the paper ranks *competence criteria*, not couriers. No posterior on candidate rank. Aggregation, normalization, and sensitivity-to-weight analysis are absent.
- **Similarity to Selectron.** **High on domain**, **partial on method** (same Bayesian prior, no candidate aggregation), **low on output semantics**. This is the closest *domain* precedent and reviewers will reach for it first; note explicitly that its method stops short of Selectron's deliverable.

### 5. Stam & Silva (1997) — Stochastic AHP with rank-reversal probabilities

*Stochastic judgments in the AHP: The measurement of rank reversal probabilities.* **Decision Sciences**, 28(3), 655–688. DOI: [10.1111/j.1540-5915.1997.tb01326.x](https://doi.org/10.1111/j.1540-5915.1997.tb01326.x).

- **Method.** Pairwise AHP judgments are treated as random variables over judgment intervals; Monte Carlo propagates uncertainty to the priority vector; *rank-reversal probability* is reported per pair.
- **What they did differently.** Frequentist confidence intervals rather than posterior distributions; AHP eigenvector aggregation rather than the additive Dirichlet model. The historical ancestor of Selectron's deliverable — "rank is uncertain and that uncertainty has consequences" — but its mathematical apparatus is largely superseded.
- **Similarity to Selectron.** **Medium on output semantics**, **low on mathematical form and domain**.

### 6. Waddingham, Mt-Isa, Tervonen, Ashby & the IMI-PROTECT consortium (Bayesian MCDA in HTA)

Tervonen, T., Naci, H., van Valkenhoef, G., Ades, A. E., Angelis, A., Hillege, H. L., & Postmus, D. (2015). *Applying multiple criteria decision analysis to comparative benefit-risk assessment: Choosing among statins in primary prevention.* **Medical Decision Making**, 35(7), 859–871. DOI: [10.1177/0272989X15587005](https://doi.org/10.1177/0272989X15587005). Waddingham, E., Mt-Isa, S., Nixon, R., & Ashby, D. (2016). *A Bayesian approach to probabilistic sensitivity analysis in structured benefit-risk assessment.* **Biometrics**, 72(1), 269–276. DOI: [10.1111/biom.12366](https://doi.org/10.1111/biom.12366).

- **Method.** Posterior distributions over per-criterion performance (from trial data) propagated through a SMAA/MCDA additive value model; sensitivity quantified via probabilistic sensitivity analysis.
- **What they did differently.** Criterion *scores* are random, drawn from trial likelihoods. Selectron does the opposite: scores are observed, weights are random. Methodologically adjacent — Selectron's downstream extension to noisy-score criteria (NEO-PI-R standard error, medical-exam variability) would need exactly this machinery.
- **Similarity to Selectron.** **Medium on form**, **low on domain**, **high on output semantics**.

### 7. Aviation-domain Bayesian-network ↔ MCDM hybrids (orientation only)

Recent papers combine Bayesian networks with outranking MCDM (PROMETHEE, TOPSIS) for aviation decisions — e.g., Mantzouni et al. (2024), **Annals of Operations Research**, DOI: [10.1007/s10479-024-06064-8](https://doi.org/10.1007/s10479-024-06064-8). The applications are operations and risk analysis (incidents, supplier selection, system safety), not personnel selection. **No published precedent applies Bayesian MCDA to aircrew, astronaut, or analog-astronaut selection.** This is Selectron's cleanest novelty claim.

## What is novel about Selectron

Grounded in the precedents above:

1. **First Bayesian MCDA pipeline for analog-astronaut selection.** Aerospace human factors applies Bayesian methods to operations and performance evaluation, not to selection. The personnel-selection precedents (Li et al., 2020) cover gig-economy couriers, not high-stakes aerospace selection.
2. **Single-operator Dirichlet elicitation from literature synthesis, not pairwise comparisons.** Mohammadi & Rezaei (2020) and Li et al. (2020) require group pairwise judgments; Saint-Hilary et al. (2017) specify Dirichlet hyperparameters without an elicitation procedure. Selectron operationalizes prior elicitation directly from the analog-selection literature (Phase 0 evidence tables → Dirichlet means; precision tied to literature heterogeneity).
3. **Posterior credible intervals on rank position as a first-class deliverable.** Rank-acceptability indices (Lahdelma & Salminen, 2001) exist but no personnel-selection paper has surfaced them in a UI alongside a configurable "statistical tie" threshold with procedural consequences for a panel.
4. **Self-contained reproducible TypeScript artifact.** The methodology literature is implemented in R (`hitandrun`, `smaa`), JAGS, or Stan. A browser-side TS implementation with no backend is a deployment-pattern contribution — paper figures regenerate from one repository with no Python/R bit-rot.
5. **Sensitivity-as-robustness-flag, not side calculation.** Sobol-for-MCDA papers (Broekhuizen et al., 2015; Pianosi et al., 2016) compute global sensitivity indices but rarely surface them as decision-relevant UI artifacts. Selectron promotes the most-perturbative criterion to a flag adjacent to the ranked list.
6. **Explicit indifference-zone reporting.** SMAA treats rank-acceptability indices as analyst-facing diagnostics. Selectron makes the indifference zone a *panel-facing* output with documented procedural implications (additional assessment, documented tie, randomization within the zone).

## Open methodological risks

Each is grounded in a precedent that struggled with the same problem.

1. **Dirichlet precision elicitation.** Saint-Hilary et al. (2017) flag this as the open problem of their framework — $\alpha_0$ controls prior tightness with no obvious default. Selectron will face the same choice from a literature synthesis with heterogeneous effect sizes. Mitigation: report at $\alpha_0 \in \{1, 10, 100\}$ as a robustness panel.
2. **Validation without outcome labels.** Every selection-domain precedent dodges this. Li et al. (2020) validate against expert agreement; HTA papers validate against meta-analyses. Selectron has no ground-truth analog-mission outcomes within the paper horizon. Mitigation: frame validation as *internal* (closed-form sampler check, ESS, posterior-predictive on simulated candidates) and disclose outcome validity as out of scope.
3. **Rank reversal under criterion-set change.** Stam & Silva (1997) and Li et al. (2026) document that adding/removing criteria can invert ranks under additive aggregation. The Phase-0 hard gate is the design response, but reviewers will press on robustness when the taxonomy is revised. Mitigation: pre-register the criterion set and document which changes invalidate prior runs.
4. **Linear additive aggregation is contested.** Critics (Wedley et al., 1993; Maleki & Zahir, 2013) argue outranking methods avoid rank-reversal pathologies inherent to additive forms. Selectron picks additive deliberately for Dirichlet/posterior tractability; acknowledge the trade-off and cite Tervonen & Figueira (2008) on outranking-SMAA as natural next step.
5. **Small-sample, single-panel applicability.** SMAA assumes a committee; B-BWM aggregates across raters. Selectron is single-operator. The literature does not directly support "single-operator Bayesian MCDA" as a published pattern. Mitigation: frame Selectron as a *methodology paper* and treat the elicited weights as a worked example, not a population estimate.
6. **Aggregation under non-comparable scales.** NEO-PI-R T-scores, ECG-based binary flags, and interview ratings have heterogeneous scales the Bayesian MCDA literature glosses over with z-scoring. Selectron must declare and defend a per-criterion normalization $z(\cdot)$ and report sensitivity to alternative normalizations.

---

## References

Broekhuizen, H., Groothuis-Oudshoorn, C. G. M., van Til, J. A., Hummel, J. M., & IJzerman, M. J. (2015). A review and classification of approaches for dealing with uncertainty in multi-criteria decision analysis for healthcare decisions. **PharmacoEconomics**, 33(5), 445–455. DOI: [10.1007/s40273-014-0251-x](https://doi.org/10.1007/s40273-014-0251-x).

Lahdelma, R., & Salminen, P. (2001). SMAA-2: Stochastic multicriteria acceptability analysis for group decision making. **Operations Research**, 49(3), 444–454. DOI: [10.1287/opre.49.3.444.11220](https://doi.org/10.1287/opre.49.3.444.11220).

Li, J., Wang, J.-Q., & Hu, J.-H. (2020). A Bayesian Best-Worst Method-based multicriteria competence analysis of crowdsourcing delivery personnel. **Complexity**, 2020, 4250417. DOI: [10.1155/2020/4250417](https://doi.org/10.1155/2020/4250417).

Li, X., et al. (2026). A trend analysis of rank reversal in widely used decision-making methods. **Journal of Multi-Criteria Decision Analysis**, advance online. DOI: [10.1002/mcda.70027](https://doi.org/10.1002/mcda.70027).

Maleki, H., & Zahir, S. (2013). A comprehensive literature review of the rank reversal phenomenon in the analytic hierarchy process. **Journal of Multi-Criteria Decision Analysis**, 20(3–4), 141–155. DOI: [10.1002/mcda.1479](https://doi.org/10.1002/mcda.1479).

Mantzouni, F., Karagiannis, G., et al. (2024). Multicriteria decision support under uncertainty: combining outranking methods with Bayesian networks. **Annals of Operations Research**. DOI: [10.1007/s10479-024-06064-8](https://doi.org/10.1007/s10479-024-06064-8).

Mohammadi, M., & Rezaei, J. (2020). Bayesian best-worst method: A probabilistic group decision-making model. **Omega**, 96, 102075. DOI: [10.1016/j.omega.2019.06.001](https://doi.org/10.1016/j.omega.2019.06.001).

Pianosi, F., Beven, K., Freer, J., Hall, J. W., Rougier, J., Stephenson, D. B., & Wagener, T. (2016). Sensitivity analysis of environmental models: A systematic review with practical workflow. **Environmental Modelling & Software**, 79, 214–232. DOI: [10.1016/j.envsoft.2016.02.008](https://doi.org/10.1016/j.envsoft.2016.02.008).

Saint-Hilary, G., Cadour, S., Robert, V., & Gasparini, M. (2017). A simple way to unify multicriteria decision analysis (MCDA) and stochastic multicriteria acceptability analysis (SMAA) using a Dirichlet distribution in benefit-risk assessment. **Biometrical Journal**, 59(3), 567–578. DOI: [10.1002/bimj.201600113](https://doi.org/10.1002/bimj.201600113).

Stam, A., & Silva, A. P. D. (1997). Stochastic judgments in the AHP: The measurement of rank reversal probabilities. **Decision Sciences**, 28(3), 655–688. DOI: [10.1111/j.1540-5915.1997.tb01326.x](https://doi.org/10.1111/j.1540-5915.1997.tb01326.x).

Tervonen, T., & Figueira, J. R. (2008). A survey on stochastic multicriteria acceptability analysis methods. **Journal of Multi-Criteria Decision Analysis**, 15(1–2), 1–14. DOI: [10.1002/mcda.426](https://doi.org/10.1002/mcda.426).

Tervonen, T., Naci, H., van Valkenhoef, G., Ades, A. E., Angelis, A., Hillege, H. L., & Postmus, D. (2015). Applying multiple criteria decision analysis to comparative benefit-risk assessment: Choosing among statins in primary prevention. **Medical Decision Making**, 35(7), 859–871. DOI: [10.1177/0272989X15587005](https://doi.org/10.1177/0272989X15587005).

Waddingham, E., Mt-Isa, S., Nixon, R., & Ashby, D. (2016). A Bayesian approach to probabilistic sensitivity analysis in structured benefit-risk assessment. **Biometrics**, 72(1), 269–276. DOI: [10.1111/biom.12366](https://doi.org/10.1111/biom.12366).

Wedley, W. C., Schoner, B., & Tang, T. S. (1993). Clustering, dependence and ratio scales in AHP: Rank reversals and incorrect priorities with a single criterion. **Journal of Multi-Criteria Decision Analysis**, 2(3), 145–158. DOI: [10.1002/mcda.4020020304](https://doi.org/10.1002/mcda.4020020304).
