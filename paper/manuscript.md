---
title: "Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection"
running_header: "Bayesian MCDA + LxC for analog-astronaut selection"
author:
  - name: "Diego L. Malpica, MD"
    affiliation: "Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia"
    email: "dlmalpica@yahoo.com"
date: "2026-06-19"
target: "npj Microgravity"
bibliography: references.bib
---

## Abstract

<!-- T22: 200-word structured abstract — see paper/abstract.md -->

## 1. Introduction

<!-- T17: ~900 words; 4-point lead framing per spec §3 -->

## 2. Methods

### 2.1 Criterion taxonomy and three-tier accessibility model

The 12-criterion taxonomy organizes analog-astronaut selection requirements into five families: psychological (6 criteria), cognitive (2), behavioral (1), physical (2), and professional (1), derived from a Phase-0 literature synthesis spanning 10 published selection frameworks and 6 evidence-table domains [@phase0-criterion-taxonomy]. Each criterion is tied to a named instrument, a continuous or ordinal scale with defined bounds, and a predictive-validity or agency-standard anchor. The full criterion list with primary citations appears in Table 1.

The taxonomy is operationalized across three resource tiers controlling which criteria are active in a scoring run. The Minimum tier (8 active criteria) targets low-resource programs — such as the Colombian aerospace medicine research group used here as a worked example — where all instruments are free or open-source (no hardware beyond a smartphone). The Medium tier (10 active criteria) adds two criteria requiring commercially licensed computerized platforms accessible at a university psychology or sports-science department. The Elite tier (12 active criteria) adds the remaining two hardware-gated clinical instruments used by operational spaceflight programs [@phase0-test-battery-tiers]. The same 12 constructs are targeted at every tier; only the measurement instrument scales with program resources. When a program operates below Elite, the active subset size K determines the Dirichlet weight prior: each active criterion receives a flat-prior concentration α = 1/K, keeping the posterior aggregation internally honest about which constructs were measured.

Three Minimum-tier instruments require scale transforms before entry into the MCDA engine. The CD-RISC-10 resilience scale (0–40 native) is rescaled ×2.5 to match the CD-RISC-25 canonical 0–100 range [@campbellsills2007]. The PHQ-9 depression screen (0–27 native) is rescaled ×2.33 to align with the BDI-II 0–63 canonical scale [@kroenke2001]. The Functional Mobility Test obstacle course (time-to-complete, seconds, lower is better) requires an inverse mapping onto the SOT-5 Equilibrium Score 0–100 range (higher is better), with empirical calibration deferred to Iter-2 integration [@mulavara2010]. These are data-entry normalizations that place raw Tier-1 scores onto each criterion's canonical scale before z-scoring; they are not related to the single-sub-category assignment rule in JSC-66705 §3.2.4, which governs Likelihood × Consequence cells within a formal NASA hazard-reporting chain and does not apply to MCDA score preparation [@jsc66705].

### 2.2 Stage A — Bayesian multi-criteria decision analysis

Stage A is a Bayesian multi-criteria decision analysis (MCDA) engine that consumes per-criterion raw scores after tier-aware activation and returns, for each candidate, a posterior distribution over their total composite score with credible-interval rank semantics.

The weight vector $\mathbf{w} = (w_1, \dots, w_K)$ over the $K$ active criteria is treated as an uncertain quantity and assigned a Dirichlet prior, $\mathbf{w} \sim \mathrm{Dir}(\boldsymbol{\alpha})$. The Iter-1 operational default uses the flat concentration $\alpha_k = 1/K$ for all $k$, as established in §2.1. In general, the $\alpha_k$ encode elicited mean weights with $\alpha_0 = \sum_k \alpha_k$ serving as the operator's effective confidence in those elicited means: as $\alpha_0 \to \infty$ the posterior concentrates on the elicited mean weights and the framework reduces to classical deterministic MCDA, while as $\alpha_0 \to 0$ the prior approaches the uniform distribution on the weight simplex, recovering the SMAA-2 acceptability-index formulation in which all feasible weight vectors are integrated out [@sainthilary2017; @lahdelma2001]. The α-vector can be updated from the flat default using the Phase-0 criterion-importance evidence table; this is deferred to Iter-2 prior elicitation.

The per-candidate composite score is the Dirichlet-weighted sum of normalized criterion scores:

$$S_i = \sum_{k=1}^{K} w_k \cdot z(x_{i,k})$$

where $i$ indexes candidates, $k$ indexes the $K$ active criteria, $w_k$ is a weight drawn from $\mathrm{Dir}(\boldsymbol{\alpha})$, and $z(\cdot)$ is the criterion normalization defined below. Equation 1 is computed independently for each Monte Carlo draw; the resulting empirical distribution over $S_i$ is the posterior that supports rank comparisons and credible-interval statements.

The Monte Carlo sampler produces $T = 5{,}000$ IID draws from $\mathrm{Dir}(\boldsymbol{\alpha})$ per candidate. Each draw exploits the standard Dirichlet decomposition: $K$ independent $\mathrm{Gamma}(\alpha_k, 1)$ variates are sampled and divided by their sum [@bishop2006]. The Gamma variates are obtained using the Marsaglia–Tsang acceptance-rejection algorithm, which operates on a normal proposal and includes the Stuart boosting step for shape parameters $\alpha_k < 1$ [@marsagliatsang2000]. The underlying stream of uniform pseudo-random numbers is generated by the Mulberry32 32-bit PRNG [@mulberry32], initialized from a caller-supplied integer seed so that all figures and ranking tables are exactly reproducible from the reported seed value.

The normalization function $z(x)$ maps a raw criterion score $x$ from its instrument-specific range $[\mathrm{scale.min},\, \mathrm{scale.max}]$ linearly onto $[0, 1]$:

$$z(x) = \frac{x - \mathrm{scale.min}}{\mathrm{scale.max} - \mathrm{scale.min}}$$

For criteria where a lower raw score is preferable — such as the Functional Mobility Test obstacle-course time — the `higherIsBetter = false` flag causes the engine to return $1 - z(x)$ instead, so that all normalized scores carry the same polarity (higher is always better) before entry into Equation 1. Sampler health is assessed via an effective sample size (ESS) diagnostic computed from the lag-1 autocorrelation $\hat{\rho}_1$ of the draw sequence $\{S^{(t)}\}_{t=1}^{T}$: $\mathrm{ESS} = T \cdot (1 - \hat{\rho}_1)/(1 + \hat{\rho}_1)$. Because the Dirichlet draws are IID, $\hat{\rho}_1 \approx 0$ and $\mathrm{ESS} \approx T$ at any finite seed; a materially lower value signals an implementation error rather than a sampling-efficiency concern. The aggregate Monte Carlo mean and variance of $S_i$ are cross-checked against closed-form Dirichlet moments — the marginal $E[w_k] = \alpha_k/\alpha_0$, $\mathrm{Var}[w_k] = \alpha_k(\alpha_0 - \alpha_k)/(\alpha_0^2(\alpha_0 + 1))$, and the off-diagonal covariance $\mathrm{Cov}(w_k, w_l) = -\alpha_k \alpha_l / (\alpha_0^2(\alpha_0 + 1))$ for $k \neq l$; the closed-form composite-score variance $\mathrm{Var}(S_i) = \sum_k z_k^2 \,\mathrm{Var}(w_k) + \sum_{k \neq l} z_k z_l \,\mathrm{Cov}(w_k, w_l)$ is then compared to the sampler's empirical estimate — within stated numerical tolerances [@bishop2006]. Stage B propagates each candidate's Stage-A composite-score posterior through a mission-risk hazard model, described next.

### 2.3 Stage B — IMM-style mission-risk Monte Carlo

Stage B is a forward Monte Carlo simulation that propagates the Stage-A composite-score posterior through a mission-specific medical-risk hazard model and returns three outputs for each candidate crew: the posterior distribution of the Crew Health Index ($\chi$), the early-termination probability $P(\chi < \chi^*)$, and the expected lost crew-days $E[\mathrm{LCD}]$. Stage B consumes two inputs: the per-candidate Stage-A score vector from the Bayesian MCDA (§2.2), which enters as a vulnerability modifier on per-condition incidence rates, and a selected analog-mission profile from the mission library — encoding mission duration, crew size, EVA count, and available countermeasures [@mdrs; @hiseas; @amadee]. The architecture follows the Integrated Medical Model (IMM) event-tree structure documented in Antonsen et al. (2022) and Myers et al. (2018) [@imm-a22; @imm-m18].

Each Monte Carlo trial replicates one full mission run for the candidate crew against the 12 modeled analog conditions. Four steps execute per condition per crew member per trial. First, *occurrence*: for rate-process conditions (eight of twelve), the number of events during the mission is drawn from $\mathrm{Poisson}(\lambda_c \cdot t)$, where $\lambda_c$ is the per-person-day incidence rate sampled from the Gamma-Poisson posterior and $t$ is mission duration in days; for the three event-triggered conditions — interpersonal conflict, musculoskeletal injury, and early-termination request — occurrence is drawn from $\mathrm{Binomial}(n_\mathrm{EVA},\, p_\mathrm{event})$, where $n_\mathrm{EVA}$ is the mission EVA count and $p_\mathrm{event}$ is the clipped Poisson-equivalent probability [@imm-m18]. Second, *severity*: each occurrence is branched into a worst-case or best-case outcome by a $\mathrm{Bernoulli}(q_c)$ draw, where $q_c$ is the per-condition worst-case probability elicited from the isolation-and-confinement evidence corpus. Third, *treatment*: the lost-days for each occurrence are interpolated between the untreated and fully-treated distributions using a treatment fraction $\tau \in [0, 1]$ derived from the mission's countermeasure-availability vector: $D_j = (1 - \tau)\,D^{\mathrm{untreated}}_{c} + \tau\,D^{\mathrm{treated}}_{c}$ [@imm-m18]. Fourth, *aggregation*: the per-trial Quality Time Lost is $\mathrm{QTL}^{(\omega)} = \sum_{c,m,e} D_{c,m,e}^{(\omega)}$, where $m$ indexes crew members and $e$ indexes events.

The per-trial Crew Health Index is defined by:

$$\chi = 1 - \frac{\mathrm{QTL}}{t \cdot c}$$

where $t$ is mission duration in days, $c$ is crew size, and the denominator $t \cdot c$ is the total available person-days. QTL is the cumulative quality-time-lost summed across all crew members, conditions, and occurrences in the trial. $\chi$ ranges $[0, 1]$, with $\chi = 1$ indicating zero lost time and $\chi \to 0$ indicating mission-wide incapacitation. The early-termination probability $P(\chi < \chi^*)$ is the empirical fraction of trials falling below the operational threshold $\chi^*$, which defaults to 0.7 — consistent with the Antarctic winter-over historical evacuation base rate documented by Palinkas et al. (2004) [@palinkas2004]. $\chi^*$ is a programmable parameter and can be adjusted for mission-specific risk tolerance.

Selectron uses $T = 100{,}000$ trials per mission simulation as the default, matching the NASA IMM canonical configuration. Myers et al. (2018) state explicitly: "One hundred thousand trials (simulations of that particular mission) were generated for each mission" [@imm-m18]. Antonsen et al. (2022) confirm this figure, specifying that "each IMM simulation consists of 100,000 Monte-Carlo trials, where each trial is considered a unique mission simulation" [@imm-a22]. An internal audit against these sources (documented in `docs/iter3_nasa_monte_carlo_audit.md`) identified that the previous Selectron default of $T = 25{,}000$ was $4\times$ below the NASA canonical figure; the default was raised accordingly.

Convergence is assessed using the $\sigma < 5\%$ rule established in both NASA IMM reference papers [@imm-m18; @imm-a22]. The standard deviation of the $\chi$ sample sequence in the last 1,000 trials is compared to that in the penultimate 1,000 trials; the simulation is judged converged when the absolute fractional change is below 5%. This rule is codified in `tests/risk/m18_convergence.test.ts`, which verifies at $T = 100{,}000$ on a 14-day MDRS mission profile that the empirical $\sigma$ change is typically below 1% — well within tolerance. The convergence test constitutes V&V Factor 2 in the verification dossier (§2.6).

The 12 modeled conditions span five clinical families: psychiatric (insomnia, depression or anxiety, psychosocial withdrawal, and early-termination request — four conditions), physiologic (circadian disruption, immune dysregulation, and latent-virus reactivation — three conditions), team dynamics (interpersonal conflict and team-cohesion loss — two conditions), performance (psychomotor vigilance lapses and communication-delay coping failure — two conditions), and musculoskeletal injury (one condition). Each condition carries a per-person-day incidence rate $\lambda_c$ fitted to the isolation-and-confinement evidence corpus, an untreated and treated lost-days distribution, and a worst-case-branching probability $q_c$. The Stage-A composite score enters each trial through a log-linear vulnerability multiplier $\lambda_{c,i} = \lambda_c \cdot \exp(\boldsymbol{\beta}_c^\intercal \mathbf{z}_i)$, coupling the Bayesian MCDA output directly to the forward simulation. The resulting $\chi$ posterior from Stage B is the primary input to the NASA HSRB Likelihood × Consequence mapping in §2.4.

### 2.4 NASA HSRB Likelihood × Consequence mapping

<!-- T5: ~450 words; verbatim JSC-66705 Fig. 4 + §3.2.4 -->

### 2.5 Implementation and reproducibility

<!-- T6: ~250 words; commit SHA + Zenodo DOI -->

### 2.6 Verification and validation

<!-- T7: ~250 words; NASA-STD-7009A factors 1–3 -->

## 3. Results

<!-- T16: ~1800 words; worked example walking F3–F7 -->

## 4. Discussion

### 4.1 What the dual-novelty enables

<!-- T18: ~300 words -->

### 4.2 Positioning vs precedents

<!-- T19: ~350 words; from research/methodology_precedents.md -->

### 4.3 Open methodological risks

<!-- T20: ~300 words; six risks acknowledged -->

### 4.4 Limitations

<!-- T21: ~150 words -->

### 4.5 Future work

<!-- T21: ~100 words; Iter-3 sensitivity layer; retrospective cross-walk -->

## 5. Conclusion

<!-- T25: ~200 words -->

## References

<!-- BibTeX rendered via pandoc from paper/references.bib -->
