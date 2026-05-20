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

The 12-criterion taxonomy organizes analog-astronaut selection requirements into five families: psychological (4 criteria), cognitive (2), behavioral (1), physical (2), and professional (3), derived from a Phase-0 literature synthesis spanning 10 published selection frameworks and 6 evidence-table domains [@phase0-criterion-taxonomy]. Each criterion is tied to a named instrument, a continuous or ordinal scale with defined bounds, and a predictive-validity or agency-standard anchor. The full criterion list with primary citations appears in Table 1.

The taxonomy is operationalized across three resource tiers controlling which criteria are active in a scoring run. The Minimum tier (8 active criteria) targets low-resource programs — such as the Colombian aerospace medicine research group used here as a worked example — where all instruments are free, paper-based, or open-source. The Medium tier (10 active criteria) adds two criteria requiring commercially licensed computerized platforms accessible at a university psychology or sports-science department. The Elite tier (12 active criteria) adds the remaining two hardware-gated clinical instruments used by operational spaceflight programs [@phase0-test-battery-tiers]. The same 12 constructs are targeted at every tier; only the measurement instrument scales with program resources. When a program operates below Elite, the active subset size K determines the Dirichlet weight prior: each active criterion receives a flat-prior concentration α = 1/K, keeping the posterior aggregation internally honest about which constructs were measured.

Three Minimum-tier instruments require scale transforms before entry into the MCDA engine. The CD-RISC-10 resilience scale (0–40 native) is rescaled ×2.5 to match the CD-RISC-25 canonical 0–100 range [@campbellsills2007]. The PHQ-9 depression screen (0–27 native) is rescaled ×2.33 to align with the BDI-II 0–63 canonical scale [@kroenke2001]. The Functional Mobility Test obstacle course (time-to-complete, seconds, lower is better) requires an inverse mapping onto the SOT-5 Equilibrium Score 0–100 range (higher is better), with empirical calibration deferred to Iter-2 integration [@mulavara2010]. These are data-entry normalizations that place raw Tier-1 scores onto each criterion's canonical scale before z-scoring; they are not related to the single-sub-category assignment rule in JSC-66705 §3.2.4, which governs Likelihood × Consequence cells within a formal NASA hazard-reporting chain and does not apply to MCDA score preparation [@jsc66705].

### 2.2 Stage A — Bayesian multi-criteria decision analysis

<!-- T3: ~600 words; Equation 1 -->

### 2.3 Stage B — IMM-style mission-risk Monte Carlo

<!-- T4: ~700 words; Equation 2; T = 100 000 justification -->

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
