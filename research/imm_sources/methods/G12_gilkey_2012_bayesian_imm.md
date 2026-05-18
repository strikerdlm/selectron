---
ref_id: G12
classification: methods
first_author: Gilkey
year: 2012
title: "Bayesian analysis for risk assessment of selected medical events in support of the Integrated Medical Model effort"
nasa_tp: NASA/TP-2012-217120
doi: null
url: https://core.ac.uk/download/pdf/10569519.pdf
ntrs: https://ntrs.nasa.gov/citations/20120013096
onedrive_share: https://1drv.ms/b/c/6122c89c30f64940/IQBASfYwnMgiIIBhuKMBAAAAAbJ3m4Xb44drHcOihAAxjRc
mcp_tool_used: firecrawl-mcp (CORE) + ocr-pipeline (Mistral mistral-ocr-latest) on NTRS original
fetched_utc: 2026-05-18T21:22:35+00:00
reverified_utc: 2026-05-18T22:50:00+00:00
verified: true
cross_source_verified: true  # CORE republication + NTRS original 20120013096.pdf (md5 28897e5168c3b501fb793f9dc61a4e8f) cross-OCR'd 2026-05-18; equations and convergence rule match
pages: 46
spec_sections_supported:
  - "3.6 Lognormal-Poisson MCMC"
  - "Section 7 PyMC notebook spec"
  - "Section 9 V&V convergence rule"
  - "Appendix B (CI -> EF conversion) — referenced by Selectron prior-elicitation helper"
authors_full:
  - Gilkey, K. M.
  - McRae, M. P.
  - Griffin, E. A.
  - Kalluri, A. S.
  - Myers, J. G.
notes: |
  Primary method paper. Lognormal prior + Poisson likelihood + WinBUGS Gibbs
  sampling. 75 000 MC samples; convergence rule = MC error < 5 % of sample mean
  OR Brooks-Gelman-Rubin statistic < 1.2 (whichever first). Both conditions
  achieved with 75 000 samples per G12. Selectron Iter 3 ports this model to
  PyMC (NUTS) and validates against JAGS on a subset.

  2026-05-18: cross-source-verified against the NTRS original PDF Diego shared
  via OneDrive (file 20120013096.pdf, md5 28897e5168c3b501fb793f9dc61a4e8f,
  Adobe Acrobat Pro 10, July 2012, author kglatzer). The CORE-derived OCR in
  the body below preserves the full text but rendered Equation (1) as
  "...×0=1.645×0" (σ collapsed to "0"); the NTRS OCR rendered it correctly as
  ln(EF) = Φ(0.95)×σ = 1.645×σ. The corrected equation and verbatim WinBUGS
  model block are reproduced in the Selectron-Iter-3 synthesis section below,
  and verbatim math_anchors are pinned to the NTRS render.
math_anchors:
  # All quotes verbatim from the NTRS original 20120013096.pdf
  # (NASA/TP-2012-217120, July 2012).
  - "EF parameterization, G12 §1.2 Eq. (1): 'ln(EF) = Φ(0.95) × σ = 1.645 × σ ... where σ is the standard deviation, Φ is the cumulative distribution function, 0.95 is the standard deviation at the 95th percentile of the distribution, and 1.645 is a constant representing the value of Φ at 0.95.'"
  - "EF definition, G12 §1.2: 'The EF represents the variance in the model, which is defined as the square root of the ratio of the 95th and 5th percentiles.' (Equation B3: EF = sqrt(95th / 5th).)"
  - "Likelihood and prior, G12 §1.2: 'All prior data used to define the incidence rate were assumed to be lognormal. The Poisson distribution was chosen to be the governing probability distribution (i.e., likelihood) for incidence values because it includes time (person-years) as an element in the probability equation.'"
  - "Sampler, G12 §1.2: 'All Bayesian updates were performed using the open-source numerical update code called the Bayesian inference Using Gibbs Sampling (WinBUGS). WinBUGS is a computer software program that uses Markov-chain Monte Carlo methods to perform Bayesian analysis of complex statistical models.'"
  - "Convergence rule, G12 §1.2 (verbatim): 'For this analysis, 75 000 Monte Carlo samplings were used for all medical events because this was a relatively safe indication that the Markov chain had reached its steady state. As rule of thumb for convergence, the WinBUGS manual suggests running until the Monte Carlo error is < 5 percent of the sample mean or until the Brooks-Gelman-Rubin statistic is < 1.2. These conditions were achieved with 75 000 samples in all cases.'"
  - "WinBUGS model block, G12 Appendix C.2 (verbatim, applied to every medical event with only mean/EF/events/time differing): 'model { events ~ dpois(mean.poisson); mean.poisson <- lambda*time; lambda ~ dlnorm(mu, tau); tau <- 1/pow(sigma, 2); sigma <- log(EF)/1.645; mu <- log(mean) - pow(sigma, 2)/2 } list(mean=<μ_prior>, EF=<EF_prior>, events=<k>, time=<person-years>)'"
  - "Sample-monitor reporting, G12 Appendix C.1 (verbatim): 'Type \"lambda\" into the drop-down box labeled \"node,\" click \"set,\" and then select. Type \"1001\" into the box labeled \"beg\" and highlight \"5,\" \"median,\" and \"95\" under \"percentiles.\"' — i.e., burn-in = 1000 iterations; posterior reported as MEAN + (5th, MEDIAN, 95th) percentiles + STD DEV. This is the IMM reporting template Selectron-Iter-3 should mirror."
  - "CI -> EF conversion, G12 Appendix B.1, Eq. (B1) (verbatim): 'σ = sqrt(n) × width_95% / z_{α/2}', with z_{α/2} = 1.96 for the 95% CI and 1.645 used elsewhere for the lognormal mapping. Eq. (B2): 'z_{α/2} × σ/sqrt(n) = width_90%' (z_{α/2} = 1.64 for the 90% CI). Eq. (B3): 'EF = sqrt(95th / 5th)'. Pipeline: 95% CI -> σ -> 90% CI -> 5th & 95th percentiles -> EF."
  - "Multi-step Bayesian update structure, G12 §2.1 (verbatim, angina worked example): 'Three steps and Bayesian updates were performed. The first step used the general population data (Ref. 5) as priors to update the analog astronaut population data ... The posterior results from this step describe the angina incidence rates for the analog astronaut population. In the second step, the data from these posterior results, namely the mean and the 5th and 95th percentiles, were used as the priors to update the preflight astronaut data ... In the third step, the data from the preflight posterior results were used as the priors to update the in-flight astronaut data.' Posterior-as-next-prior carries only (mean, 5th-pct, 95th-pct) — i.e., the prior chain is summarised by EF + mean."
  - "PRA framing, G12 §1.1 (verbatim): 'Within PRA aleatory models, most of the parameters are uncertain. This layer of imprecision is defined as epistemic uncertainty ... If an aleatory model is used (e.g., binomial) or a deterministic model is used (e.g., a fault tree), and if any parameter of these models is uncertain, then the model has epistemic uncertainty. Bayesian quantification methods are utilized to determine the nature of the epistemic uncertainty.'"
  - "Reporting unit convention, G12 Table 1+ (verbatim repeated across all 12 medical events): incidence rates reported as 'incidences per person-year' with paired '95-percent CI' and back-calculated EF. Numbers carry 3–4 significant figures (e.g., 'mean=0.00063, EF=1.77' for angina-male prior); event counts are integers; person-years carry 1 decimal (e.g., 'time=22137.0')."
---

## Selectron-Iter-3 relevance synthesis

> Added 2026-05-18 after cross-OCR of the NTRS original (file `20120013096.pdf`, md5
> `28897e5168c3b501fb793f9dc61a4e8f`) Diego shared via OneDrive
> (`https://1drv.ms/b/c/6122c89c30f64940/IQBASfYwnMgiIIBhuKMBAAAAAbJ3m4Xb44drHcOihAAxjRc`).
> The CORE-derived body below was re-verified against the NTRS render; this
> synthesis pins the math and reporting conventions that Selectron Iter-3
> consumes.

**What this paper calculates.** Twelve in-flight medical-event incidence rates
(angina, appendicitis, atrial fibrillation, atrial flutter, dental abscess,
dental caries, dental periodontal disease, gallstone disease, herpes zoster,
renal stones, seizure, stroke) for the NASA astronaut corps, each as a
posterior probability distribution over the rate λ (events per person-year),
conditioned on three layered evidence sources: (a) a general-population prior
(US population, US Submarine Force, or UK community cohort, depending on the
condition), (b) the NASA Johnson Space Center "analog astronaut" cohort
(LSAH), and (c) preflight and in-flight astronaut counts from LSAH. Output is
posterior λ as a *lognormal-Poisson* distribution, summarised by mean, median,
5th percentile, 95th percentile, and standard deviation.

**How it calculates.** Each Bayesian update is the same parametric model,
ported one-to-one from G12 Appendix C.2 — this is the canonical reference for
the Selectron Iter-3 Phase 3B engine:

```
events ~ dpois(mean.poisson)
mean.poisson <- lambda * time          # Poisson likelihood with person-years exposure
lambda ~ dlnorm(mu, tau)               # lognormal prior on the incidence rate
tau   <- 1 / pow(sigma, 2)             # WinBUGS parameterises lognormal by precision tau
sigma <- log(EF) / 1.645               # EF -> sigma via Eq. (1) below
mu    <- log(mean) - pow(sigma, 2) / 2 # median-correction so E[lambda] = mean
list(mean = <prior_mean>, EF = <prior_EF>, events = <k_observed>, time = <person_years>)
```

The two scalars driving the prior are the **mean incidence rate** and the
**error factor (EF)**. EF parameterisation, G12 §1.2 Eq. (1):

```
ln(EF) = Φ(0.95) × σ = 1.645 × σ
EF     = sqrt(λ_95 / λ_5)                # Eq. (B3), defining identity
```

When the source paper reports a 95 %-confidence interval instead of an EF,
G12 Appendix B gives the conversion pipeline (Eqs. B1-B3, from Lapin's text):

```
σ          = sqrt(n) × width_95% / z_{α/2}    (Eq. B1, z_{α/2} = 1.96)
width_90%  = z_{α/2} × σ / sqrt(n)            (Eq. B2, z_{α/2} = 1.64)
λ_5, λ_95  = mean ∓ width_90% / 2
EF         = sqrt(λ_95 / λ_5)                 (Eq. B3)
```

Inference is by Gibbs sampling in WinBUGS over **75 000 Monte Carlo
samplings** per update, with the first 1000 iterations burned in (G12
Appendix C.1: "type '1001' into the box labeled 'beg'"). Multi-step chains
re-summarise each posterior down to (mean, λ_5, λ_95) and feed those forward
as the next prior — so the inter-step prior is itself a lognormal
parameterised by EF = sqrt(λ_95 / λ_5).

**How it reports.** Verbatim G12 §1.2 stopping rule:

> "For this analysis, 75 000 Monte Carlo samplings were used for all medical
> events because this was a relatively safe indication that the Markov chain
> had reached its steady state. As rule of thumb for convergence, the WinBUGS
> manual suggests running until the Monte Carlo error is < 5 percent of the
> sample mean or until the Brooks-Gelman-Rubin statistic is < 1.2. These
> conditions were achieved with 75 000 samples in all cases."

Each posterior is reported as a row of (**mean, 5th percentile, 95th
percentile, standard deviation**) for the rate λ in events per person-year.
Units are **per person-year**; numeric precision is 3-4 significant figures
for rates (e.g., `mean = 0.00063, EF = 1.77` for angina-male prior); event
counts are integers; person-years carry one decimal (`time = 22137.0`). Tables
group results by sex (male / female / total) and by phase (preflight /
in-flight). The reporting is *frequentist-in-language but Bayesian-in-content*
— "95-percent CI" is used to label what is in fact a 5th-to-95th-percentile
credible interval over the posterior λ. Selectron Iter-3 should display these
as 90 %-credible intervals (5th-95th) consistent with G12's actual
construction, not 95 %-CIs.

**Concrete numeric anchors for Selectron Iter-3.**

- *Sampler budget.* Default MCMC budget = 75 000 post-burn-in samples (G12
  §1.2). Selectron's PyMC NUTS port should target the same effective sample
  size; 75 000 in Gibbs is roughly equivalent to 4 chains × 5000 NUTS draws
  after tuning.
- *Burn-in.* 1000 iterations (G12 Appendix C.1).
- *Convergence rule, primary.* Brooks-Gelman-Rubin (i.e., R-hat) < 1.2 per
  monitored parameter. Selectron's spec §9 default of 1.01 is *stricter*
  than G12 — keep the stricter rule but record this difference in the V&V
  dossier (Task 60).
- *Convergence rule, secondary.* MC standard error < 5 % of the posterior
  mean of λ. This is the practical stopping criterion when R-hat is borderline.
- *Reporting template.* Posterior summary = (mean, λ_5, MEDIAN, λ_95, SD).
  Selectron Iter-3 UI tables should mirror this column layout for any imported
  IMM prior.
- *Prior elicitation helper.* If the source paper gives a 95 %-CI on a rate,
  apply G12 Eqs. B1-B3 (Lapin's pipeline) to derive EF. The helper inputs are
  (mean, n, width_95%) → EF; the output (mean, EF) plugs directly into the
  WinBUGS block above. This is the smallest reusable computational unit in
  G12 — Selectron should ship it as `cgem_ext.imm.prior_from_ci(...)` or
  equivalent.
- *Reference EFs from G12 Tables.* For sense-checking, G12 reports EF = 1.77
  (angina male), 2.08 (angina female, sparse), 1.56 (AF male), 2.97 (AF
  female, sparse), 1.2 (appendicitis general). EFs ≤ 1.5 indicate well-pinned
  priors; ≥ 2 indicate diffuse priors that should not dominate the posterior.

**Discrepancies vs Iter-3 spec.**

- *Credible vs confidence interval.* G12 calls the 5th-to-95th-percentile band
  a "95-percent CI" but constructs it from a Bayesian posterior; it is a
  90 %-credible interval. Iter-3 spec §3.6 should label these as "5/95
  credible bounds" not "95 % CI".
- *R-hat threshold.* Iter-3 spec defaults to R-hat < 1.01 (PyMC convention);
  G12 uses < 1.2 (WinBUGS convention). Keep the stricter Iter-3 threshold but
  document that G12 results were accepted at the looser bound.
- *Burn-in convention.* G12 uses 1000-iteration burn-in (Gibbs). Iter-3 (NUTS)
  should rely on PyMC's adaptive `tune` (default 1000 + warmup); cross-check
  against G12 by reporting effective sample size.
- *Posterior-as-next-prior summarisation.* G12 collapses a posterior to
  (mean, λ_5, λ_95) before the next update — a 3-number summary. Iter-3
  should either replicate this (lossy but G12-faithful) or feed the full
  posterior samples forward (lossless but architecturally heavier). Default
  to lossy replication and flag in §9 V&V.

---

View metadata, citation and similar papers at core.ac.uk [https://ntrs.nasa.gov/search.jsp?R=20120013096](https://ntrs.nasa.gov/search.jsp?R=20120013096) 2019-08-30T21:40:04+00:00Z _brought to you by_ **CORE** _provided by NASA Technical Reports Server_

## NASA/TP—2012-217120

# Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated

# Medical Model Effort

_Kelly M. Gilkey, Michael P. McRae, Elise A. Griffi n, Aditya S. Kalluri, and Jerry G. Myers_

### Glenn Research Center, Cleveland, Ohio

## July 2012

* * *

Since its founding, NASA has been dedicated to the
advancement of aeronautics and space science. The
NASA Scientifi c and Technical Information (STI)
program plays a key part in helping NASA maintain
this important role.

The NASA STI Program operates under the auspices
of the Agency Chief Information Offi cer. It collects,
organizes, provides for archiving, and disseminates
NASA’s STI. The NASA STI program provides access
to the NASA Aeronautics and Space Database and
its public interface, the NASA Technical Reports
Server, thus providing one of the largest collections
of aeronautical and space science STI in the world.
Results are published in both non-NASA channels
and by NASA in the NASA STI Report Series, which
includes the following report types:

• TECHNICAL PUBLICATION. Reports of
completed research or a major signifi cant phase
of research that present the results of NASA
programs and include extensive data or theoretical
analysis. Includes compilations of signifi cant
scientifi c and technical data and information
deemed to be of continuing reference value.
NASA counterpart of peer-reviewed formal
professional papers but has less stringent
limitations on manuscript length and extent of
graphic presentations.

• TECHNICAL MEMORANDUM. Scientifi c
and technical fi ndings that are preliminary or
of specialized interest, e.g., quick release
reports, working papers, and bibliographies that
contain minimal annotation. Does not contain
extensive analysis.

• CONFERENCE PUBLICATION. Collected
papers from scientifi c and technical
conferences, symposia, seminars, or other
meetings sponsored or cosponsored by NASA.

• SPECIAL PUBLICATION. Scientifi c,
technical, or historical information from
NASA programs, projects, and missions, often
concerned with subjects having substantial
public interest.

• TECHNICAL TRANSLATION. Englishlanguage translations of foreign scientifi c and
technical material pertinent to NASA’s mission.

Specialized services also include creating custom
thesauri, building customized databases, organizing
and publishing research results.

For more information about the NASA STI
program, see the following:

• Access the NASA STI program home page at
[http://www.sti.nasa.gov](http://www.sti.nasa.gov/)

• E-mail your question to [help@sti.nasa.gov](mailto:help@sti.nasa.gov)

• Fax your question to the NASA STI
Information Desk at 443–757–5803

• Phone the NASA STI Information Desk at
443–757–5802

• Write to:
STI Information Desk
NASA Center for AeroSpace Information
7115 Standard Drive
Hanover, MD 21076–1320

* * *

## NASA/TP—2012-217120

# Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated

# Medical Model Effort

_Kelly M. Gilkey, Michael P. McRae, Elise A. Griffi n, Aditya S. Kalluri, and Jerry G. Myers_

### Glenn Research Center, Cleveland, Ohio

### National Aeronautics and Space Administration

### Glenn Research Center Cleveland, Ohio 44135

## July 2012

* * *

Acknowledgments

The authors would like to express their thanks to Marlei Walton, Ph.D., and Dr. Eric Kerstman, both of Wyle Integrated
Science and Engineering at the NASA Johnson Space Center, for their thoughtful review and discussions of the
data presented in this document. The authors would also like to acknowledge support from the
Exploration Medical Capability Element of NASA’s Human Research Program.

This report contains preliminary fi ndings,
subject to revision as analysis proceeds.

NASA Center for Aerospace Information
7115 Standard Drive

7115 Standard Drive
Hanover, MD 21076–1320

Trade names and trademarks are used in this report for identifi cation
only. Their usage does not constitute an offi cial endorsement,
either expressed or implied, by the National Aeronautics and
Space Administration.

National Technical Information Service
5301 Shawnee Road
Alexandria, VA 22312

Hanover, MD 21076–1320

Available electronically at [http://www.sti.nasa.gov](http://www.sti.nasa.gov/)

* * *

Contents

Summary.....1
2.0 Introduction.....1
1.1 Bayesian Analysis.....1
1.2 Methods.....2
2.0 Medical Events.....3
2.1 Angina Pectoris.....3
2.1.1 Data and Methods.....3
2.1.2 Bayesian Updates To Improve Estimates of Angina Incidence Rates, and Analysis Results.....4
2.1.3 Discussion.....4
2.2 Appendicitis.....5
2.2.1 Data and Methods.....5
2.2.2 Bayesian Updates To Improve Estimates of Appendicitis Incidence Rates, and Analysis Results.....5
2.2.3 Discussion.....6
2.3 Atrial Fibrillation.....6
2.3.1 Data and Methods.....7
2.3.2 Bayesian Updates To Improve Estimates of Atrial Fibrillation Incidence Rates, and Analysis Results.....7
2.3.3 Discussion.....8
2.4 Atrial Fl

* * *

2.10.2 Bayesian Updates To Improve Estimates of Renal Stone Incidence Rates, and Analysis Results.....18
2.10.3 Discussion.....18
2.11 Seizure.....18
2.11.1 Data and Methods.....19
2.11.2 Bayesian Updates To Improve Estimates of Seizure Incidence Rates, and Analysis Results.....19
2.11.3 Discussion.....20
2.12 Stroke.....20
2.12.1 Data and Methods.....20
2.12.2 Bayesian Updates To Improve Estimates of Stroke Incidence Rates, and Analysis Results.....21
2.12.3 Discussion.....21
3.0 Discussion.....21
Appendix A. —Data from Lifetime Surveillance of Astronaut Health (LSAH).....23
Appendix B. —Calculating Error Factor From 95-Percent Confidence Intervals.....25
B.1 Angina P

* * *

Bayesian Analysis for Risk Assessment of Selected Medical Events in
Support of the Integrated Medical Model Effort

Kelly M. Gilkey, Michael P. McRae, Elise A. Griffin, Aditya S. Kalluri, and Jerry G. Myers
National Aeronautics and Space Administration
Glenn Research Center
Cleveland, Ohio 44135

Summary

The Exploration Medical Capability project is creating a
catalog of risk assessments using the Integrated Medical
Model (IMM). The IMM is a software-based system intended
to assist mission planners in preparing for spaceflight missions
by helping them to make informed decisions about medical
preparations and supplies for combating and treating various
medical events. IMM uses Probabilistic Risk Assessment,
which deals with low-probability, high-consequence events of
complex physiological processes, although high-probability,
low-consequence events are also of interest. The objective is
to use statistical analyses to inform the IMM decision tool
with estimated probabilities of medical events occurring during an exploration mission. Because data regarding astronaut
health are limited, Bayesian statistical analysis is used.
Bayesian inference combines prior knowledge, such as data
from the general U.S. population, the U.S. Submarine Force,
or the analog astronaut population located at the NASA
Johnson Space Center, with observed data for the medical
condition of interest. The posterior results reflect the best
evidence for specific medical events occurring in flight.
Bayes’ theorem provides a formal mechanism for combining
available observed data with data from similar studies to
support the quantification process. This is especially relevant
when dealing with physiological data from the astronaut corps,
where data are relatively sparse (zero in some cases). Bayes’
theorem depends on the consideration of all uncertainties
(both known and unknown) that are fundamental to the
assessment of risk. All Bayesian updates were performed
using the open-source numerical update code called the
Bayesian inference Using Gibbs Sampling (WinBUGS).
WinBUGS is a computer software program that uses Markovchain Monte Carlo methods to perform Bayesian analysis of
complex statistical models.
The IMM team performed Bayesian updates on the follow-

1.0 Introduction

The Integrated Medical Model (IMM) is a software-based
system that will quantify health risks, identify medical needs,
develop potential mitigation procedures, and assist in the

preparation of spaceflight missions. Because data regarding
astronaut health are limited, the IMM team used Bayesian
statistical analysis. Bayesian inference combines prior knowledge, such as data from a similar study, with observed data for
the event of interest. The outcome is a posterior result that
reflects the best evidence for specific medical events occurring
in flight. The IMM team performed Bayesian updates on the
following medical events: angina, appendicitis, atrial fibrillation, atrial flutter, dental abscess, dental caries, dental periodontal disease, gallstone disease, herpes zoster, renal stones,
seizure, and stroke.

1.1 Bayesian Analysis

Because classical statistical techniques are not suitable for
assessing the risk of low-probability, high-consequence
events, an alternative risk-modeling framework, Probabilistic
Risk Assessment (PRA), was developed that works within a
scenario-based concept of risk that best informs decision
making (Ref. 1). PRA integrates a collection of models and
quantifies integral risk metrics and their uncertainties (e.g., the
probability of the loss of crew and the associated uncertainty).
This modeling framework is supported by the application of
Bayes’ theorem of probability. The theorem provides a formal
mechanism for combining all available information, such as
engineering and qualification test data, field experience, expert
judgment, and data from similar systems to support the
quantification process. This is especially relevant when
dealing with astronaut medical event data, which are relatively
sparse (zero in some cases). Bayes’ theorem depends on an
honest treatment of the uncertainties that are fundamental to
risk assessment and is based on a subjective interpretation of
probability (Ref. 1).
Within PRA aleatory models, most of the parameters are

Within PRA aleatory models, most of the parameters are
uncertain. This layer of imprecision is defined as epistemic
uncertainty, which represents how accurate the developer’s
state of knowledge is about the model, regardless of the model
type. If an aleatory model is used (e.g., binomial) or a deterministic model is used (e.g., a fault tree), and if any parameter
of these models is uncertain, then the model has epistemic
uncertainty. Bayesian quantification methods are utilized to
determine the nature of the epistemic uncertainty. In the
Bayesian approach, probability quantifies the degree of belief
and is used to describe the plausibility of an event. Frequentist
inference generally relies on a mathematically consistent way
to incorporate nonempirical data, which allows for the
propagation of uncertainties throughout the logic model

* * *

(Ref. 1). Often this approach is not available for astronaut
medical event data. A solution is to incorporate Bayesian
analysis, allowing for an alternative interpretation of probability. Information about the parameter, beyond what is in the
data, is included in the estimate, and Monte Carlo sampling is
used to propagate uncertainties through the logic analysis.
Some of the typical uncertainties associated with PRA

Some of the typical uncertainties associated with PRA
assumptions include disagreement or lack of accuracy when
the probabilities of physical processes are estimated, limited
knowledge of the parameters in phenomenological equations,
unknown parameter values, inaccurate parameter values, and
the inherent variability of stochastic processes. The Bayesian
approach provides a formal mechanism for combining all
available information, such as engineering and qualification
test data, field experience, expert judgment, and data from
similar systems. The types of information available for
parameter values might include prior data—general engineering knowledge and historical information from similar
events—and observed data for the event of interest in the
system under study.

1.2 Methods

For the medical events investigated in this study, the
astronaut population and the occurrences are very low.
Consequently, Bayesian methods were deemed to be necessary to produce better estimates of the probable incidence
rates. The Bayesian process allows researchers to make
inferences to determine the probability that a hypothesis is
true, conditional on all available evidence. In these Bayesian
updates, preflight and in-flight astronaut data (obtained from
the Lifetime Surveillance of Astronaut Health (LSAH), see
Appendix A) became the experimental data, and prior data
were found through a variety of sources, including the general
U.S. population, the U.S. Submarine Force, and the analog
astronaut population at the NASA Johnson Space Center. The
analog population is a group of people with similar physiological characteristics such as age, height, weight, health
conditions, and lifestyles—including activity levels and health
habits—as members of the astronaut corps. Preflight and
in-flight calculations varied slightly for different medical
events, based on when specific medical events started being
tracked by LSAH and what data were available at the time of
the specific request (Ref. 2). The renal stone data request was
the first request made to LSAH, and in-flight astronaut data
for this medical event includes shuttle transport system missions (STS–1 to STS–114), International Space Station
missions (Expeditions 1 to 8 and 10 to 13), and Mir missions
(seven astronauts total). The subsequent requests (in chronological order of request) were stroke, appendicitis, dental
problems (abscess, caries, and periodontal disease), herpes
zoster, atrial fibrillation, and atrial flutter (requests made
in June 2010), and angina, seizure, and gallstone disease
(requests made in December 2010).
All prior data used to define the incidence rate were
assumed to be lognormal. The Poisson distribution was chosen

to be the governing probability distribution (i.e., likelihood)
for incidence values because it includes time (person-years) as
an element in the probability equation. Time is an essential
variable because it allows the probabilities to increase as the
time of a space mission increases. Because Poisson distributions were used, an average rate for the incidences of these
medical events had to be assumed. Consequently, the
Bayesian update approach was used to calculate the distribution (mean and uncertainty) of the incidence rate associated
with the Poisson distribution, and this approach is described
for each of the medical events addressed in the report.
When Bayesian analyses are performed, certain data must

When Bayesian analyses are performed, certain data must
be present for the calculations. For the prior data, the mean
incidence rate and the error factor (EF) were required to
adequately parameterize the assumed lognormal distribution.
The EF represents the variance in the model, which is defined
as the square root of the ratio of the 95th and 5th percentiles.
This definition for the EF can be leveraged to relate percentiles of the standard normal distribution to define the percentiles of the lognormal distribution as illustrated by Bedford
and Cooke (Ref. 3). In this case,

\\ln(\\mathrm{E F})=\\Phi(0.95)\\times0=1.645\\times0

where σ is the standard deviation, Φ is the cumulative distribution function, 0.95 is the standard deviation at the 95th
percentile of the distribution, and 1.645 is a constant representing the value of Φ at 0.95. For additional discussion on
how the EF can be calculated from the confidence interval
(CI) (see Appendix B).
The numerical update code called Bayesian inference

(CI) (see Appendix B).
The numerical update code called Bayesian inference
Using Gibbs Sampling (WinBUGS) was used to perform all
Bayesian updates. WinBUGS is a computer software program that performs Bayesian analysis of complex statistical
models using Markov-chain Monte Carlo methods. It grew
from a statistical research project at the Medical Research
Council Biostatistics Unit, but it is now being developed
jointly with the Imperial College School of Medicine at
St. Mary’s, London. This open-source software is available
on the Web.
In most cases, the Bayesian process followed a standardized

on the Web.
In most cases, the Bayesian process followed a standardized
approach that combined the prior data with observed astronaut
incidence data. Depending on the medical event, two or more
Bayesian updates had to be performed with WinBUGS to
adequately capture all the available data relating to the
condition being examined. Appendix C provides the procedures that were used to construct and implement multiple
Bayesian analyses of each medical event. An outline of the
general procedure for completing a Bayesian update follows
(Ref. 1):

* * *

(2) Specify a prior distribution for the parameter(s) in this
update, quantifying epistemic uncertainty (quantifying
the degree of belief about the possible parameter
values). For the IMM Bayesian analysis, this involved
reviewing data identified in the Clinical Findings Form
and reviewing the literature to capture appropriate
(multistep) prior data.
(3) Obtain the observed data for the population of interest.

(3) Obtain the observed data for the population of interest.
Here data from the LSAH were heavily leveraged to
support the reserved data requirements. In the case of
no known incidents, only the total observation times in
the appropriate segregated time span (in-flight and preflight) were required.
(4) Obtain the posterior (i.e., updated) distribution for the

(4) Obtain the posterior (i.e., updated) distribution for the
parameter(s) of interest. Here one or more WinBUGS
scripts were created to perform the Markov-chain integration of the Bayesian analysis.
(5) Check the validity of the output. Output validity has

For this analysis, 75 000 Monte Carlo samplings were used
for all medical events because this was a relatively safe
indication that the Markov chain had reached its steady state.
As rule of thumb for convergence, the WinBUGS manual
suggests running until the Monte Carlo error is <5 percent of
the sample mean or until the Brooks-Gelman-Rubin statistic is
<1.2. These conditions were achieved with 75 000 samples in
all cases. Analysis validity was confirmed through review with
IMM team subject matter experts with regard to both the
process and the analysis findings.

Angina pectoris is chest pain that occurs when part of the
heart muscle does not get enough oxygenated blood. It is not
a disease, but is typically a symptom of coronary heart
disease—the most common type of heart disease in adults
and occurs when plaque builds up on the inner walls of the
coronary arteries, which can lead to a heart attack (Ref. 4).
There are several different types of angina: stable, unstable,
variant (Prinzmetal’s angina), and microvascular. The most
common type of angina is stable angina, which has a regular
pattern and occurs when the heart is working harder than usual

2.0 Medical Events

The following medical events were analyzed: angina,
appendicitis, atrial fibrillation, atrial flutter, dental abscess,
dental caries, dental periodontal disease, gallstone disease,
herpes zoster, renal stones, seizure, and stroke.

(Ref. 4). Stable angina is not a heart attack, but it can suggest
that a heart attack is more likely in the future. There are many
different risk factors for angina pectoris, including high
cholesterol, high blood pressure, smoking, diabetes or insulin
resistance, being overweight or obese, inactivity, unhealthy
diet, metabolic syndrome, familial history, and age—angina
risk increases for males over the age of 45 and females over
the age of 55 (Ref. 4).
Because of the potential severe medical problems associated

Because of the potential severe medical problems associated
with angina pectoris, understanding the probability of angina
pectoris occurring in flight was deemed to be necessary.
Incidence rates from the general population (Ref. 5), the
analog astronaut population, and the active astronaut corps
(Ref. 6, personal communication) were used to find this
probability. A Bayesian update was used to combine these
data to yield a probability distribution for the average incidence of angina pectoris during exploration missions.

2.1.1 Data and Methods

The data describing the average rate of angina incidence in
the general population came from an article in the British
Heart Journal (Ref. 5). The article follows 110 patients
(70 males and 40 females) who were 70 years of age or less
with no history of coronary heart disease when they presented
for the first time with typical angina. All data were supplied as
incidences per 1000 person-years and were reported for males
and females between the ages of 41 and 50. Table 1 reports the
average rates of angina for males and females, the corresponding 95-percent CIs, and the EFs (which were calculated as
described in Appendix B, Section B.1). Total CI data (for
males and females) between the ages of 41 and 50 were not
presented in this article and were, therefore, not calculated in
this analysis.
Incidences of angina in the analog astronaut population per

Incidences of angina in the analog astronaut population per
person-years were obtained from LSAH (see Table 2 and
Ref. 6, personal communication) because of the high number
of risk factors for angina pectoris.
Incidences of angina in the astronaut corps and the number

Incidences of angina in the astronaut corps and the number
of person-years for preflight and in-flight astronauts were
obtained from LSAH (see Table 3 and Ref. 6, personal
communication). There were no cases of angina during any
point in the study.

6.3{!\\timestimes!}10^{-4}

4.7!\\times\\!10^{-4}

TABLE 1.—INCIDENCE OF ANGINA PECTORIS IN ADULTS
IN THE UNITED KINGDOM
Statistic Males Females

| Statistic | Males | Females |
| --- | --- | --- |
| Angina incidence in adults 41 to50 years of age per 1000 person-years95-percent confidence interval (CI) for angina incidence in adults per 1000person-years | 0.630.24 to 1.02 | 0.470.12 to 0.82 |
| Angina incidence in adults 41 to50 years of age per person-yearError factor(EF)for angina incidencein adults41to50years of age | $6.3\\times10^{-4}$1.77 | $4.7\\times10^{-4}2.08$ |

* * *

TABLE 2.—INCIDENCE OF ANGINA PECTORIS IN
THE ANALOG ASTRONAUT POPULATION
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females

| Statistic | Males | Females |
| --- | --- | --- |
| Total person-years | 2213.0 | 2808.6 |
| Angina cases | 6 | 0 |
| Angina incidence rate, events per person-year | $2.71\\times10^{-4}$ | 0 |

2.71!\\times!10^{-4}

TABLE 3.—INCIDENCE OF ANGINA PECTORIS IN
PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]

| Statistic | Males | Females |
| --- | --- | --- |
| Preflight astronauts |  |  |
| Total person-years | 1970.4 | 264.8 |
| Angina cases | 0 | 0 |
| Angina incidence rate, events per person-year | 0 | 0 |
| In-flight astronauts |  |  |
| Total person-years | 32.0 | 6.5 |
| Angina cases | 0 | 0 |
| Angina incidence rate, events per person-year | 0 | 0 |

\\overline{{3.72\\times10^{-4}}}

2.1.2 Bayesian Updates To Improve Estimates of
Angina Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the angina incidence rate in the astronaut corps
and to find an approximation suitable for the IMM effort.
Three steps and Bayesian updates were performed. The first
step used the general population data (Ref. 5) as priors to
update the analog astronaut population data (Ref. 6, personal
communication). This step was performed two times, once
each for males and females. The posterior results from this
step describe the angina incidence rates for the analog astronaut population. In the second step, the data from these
posterior results, namely the mean and the 5th and 95th
percentiles, were used as the priors to update the preflight
astronaut data for males and females. In the third step, the data
from the preflight posterior results were used as the priors to
update the in-flight astronaut data for males and females.
Ultimately, four probability distributions were found to
describe the incidence rate for angina in preflight and in-flight
male and female astronauts. Appendix C provides the code
used in WinBUGS, and an outline of the input data for each
step follows.
Step 1: The general United Kingdom population incidence

1.77!\\times!10^{-4}

4.15!{\\times}!10^{-4}

\\lambda\_{\\mathrm{a n a l o g}},

TABLE 4.—RESULTS OF BAYESIAN ANALYSIS
FOR ANGINA PECTORIS IN THE ANALOG
ASTRONAUT POPULATION
Angina incidence rate, λ, events per person-year

| Angina incidence rate，λanalog，events per person-year |  |  |
| --- | --- | --- |
| Statistic | Males | Females |
| Mean | 4.15×10-4 | 3.72×10-4 |
| Standard deviation | 9.99×10-5 | 1.55×10-4 |
| 5 percent | 2.69×10-4 | 1.77×10-4 |
| 95 percent | 5.93×10-4 | 6.63×10-4 |

9.99!\\times!10^{-5}

6.63!\\times!10^{-4}

5.93!\\times!10^{-4}

TABLE 5.—RESULTS OF BAYESIAN ANALYSIS FOR
ANGINA PECTORIS IN PREFLIGHT MISSION-READY,
ACTIVE MALE AND FEMALE ASTRONAUTS
Angina incidence rate, λ, events per person-year

\\overline{{3.65!\\times!10^{-4}}}

\\lambda\_{\\mathrm{a s t r o n a u:}}

1.74!\\times!10^{-4}

| Angina incidence rate，λastronaut，events per person-year |  |  |
| --- | --- | --- |
| Statistic | Males | Females |
| Mean | $3.96\\times 10^{-4}$ | $3.65\\times 10^{-4}$ |
| Standard deviation | $9.38\\times 10^{-5}$ | $1.53\\times 10^{-4}$ |
| 5 percent | $2.62\\times 10^{-4}$ | $1.74\\times 10^{-4}$ |
| 95 percent | $5.56\\times 10^{-4}$ | $6.53\\times 10^{-4}$ |

\\overline{{3.96\\times10^{-4}}}

9.38!\\times!10^{-5}

2.62!\\times!10^{-4}

5.56!{\\times}!10^{-4}

TABLE 6.—RESULTS OF BAYESIAN ANALYSIS
FOR ANGINA PECTORIS IN IN-FLIGHT
MALE AND FEMALE ASTRONAUTS
Angina incidence rate, λ, events per person-year

\\overline{{3.64\\times10^{-4}}}

| Angina incidence rate，λastronaut，events per person-year |  |  |
| --- | --- | --- |
| Statistic | Males | Females |
| Mean | $3.95\\times 10^{-4}$ | $3.64\\times 10^{-4}$ |
| Standard deviation | $9.21\\times 10^{-5}$ | $1.53\\times 10^{-4}$ |
| 5 percent | $2.64\\times 10^{-4}$ | $1.74\\times 10^{-4}$ |
| 95 percent | $5.61\\times 10^{-4}$ | $6.53\\times 10^{-4}$ |

\\lambda\_{\\mathrm{a s t r o n a l t}},

1.53!\\times!10^{-4}

\\overline{{3.95!\\times!10^{-4}}}

9.21!\\times!10^{-5}

1.74!\\times!10^{-4}

5.61!\\times!10^{-4}

6.53!{\\times}!10^{-4}

Step 2: The posterior results from Step 1—the means and
the 5th and 95th percentiles from Table 4—along with the
LSAH preflight data in Table 3 were used in WinBUGS to
update the preflight astronaut data. The posterior results from
this Bayesian update were Poisson probability distributions for
angina incidence in preflight male and female astronauts.
Table 5 shows the means, 5th and 95th percentiles, and
standard deviations.
Step 3: The posterior results from Step 2—the means and
the 5th and 95th percentiles from Table 5, along with the

standard deviations.
Step 3: The posterior results from Step 2—the means and
the 5th and 95th percentiles from Table 5, along with the
LSAH in-flight data in Table 3 were used in WinBUGS to
update the in-flight astronaut data. The posterior results from
this Bayesian update were Poisson probability distributions for
angina incidence in in-flight male and female astronauts.
Table 6 shows the means, 5th and 95th percentiles, and
standard deviations.

* * *

43 percent, respectively) and a large proportion of individuals
classified as overweight and obese (50 and 27 percent,
respectively). An individual was classified as overweight if he
or she had a body mass index of 25 to 29 kg/m2, and an
individual was classified as obese if he or she had a body mass
index greater than or equal to 30 kg/m2. In addition, there may
be minor differences between the diets and lifestyles of the
United Kingdom population used in Gandhi et al. and the U.S.
astronaut population. However, both populations are from
well-developed, industrial countries in similar temperate
regions. Accordingly, the present analysis assumes that their
diets are similar to a high degree. The use of the analog
astronaut population data may help to counteract some of the
inaccuracies from these differences. The analog astronaut
population may more closely reflect the actual risk factors that
might influence an astronaut’s propensity to develop angina
pectoris. In spite of the limitations, the assumptions, and the
data available, this analysis is probably a reasonable approximation of the incidence of angina pectoris during exploration
missions. The current results can serve as a baseline for future
studies that include more data and risk parameters.

29~\\mathrm{k g/m}^{2}

30,\\mathrm{k g}/\\mathfrak{m}^{2}

2.2 Appendicitis

TABLE 7.—INCIDENCE OF APPENDICITIS IN U.S.
ADULTS 45 TO 64 YEARS OF AGE
Appendicitis incidence in adults 45 to 64 years

2.2.1 Data and Methods

General population data regarding the incidence rate of
appendicitis was extracted using a longitudinal, nationally
representative, population-based study that was conducted on
the incidence of appendicitis in the general U.S. population by
the National Ambulatory Medical Care Survey and National
Hospital Ambulatory Medical Care Survey (3-year average,
2003 to 2005) (Ref. 8). Because this source does not differentiate gender and ethnicity data by age, incidence rates differentiating between males and females and between whites and
blacks were not been included in this calculation. Only the
data for the hospital discharges (all-listed diagnoses) were
included, because these data are presumably more reliable
than data from ambulatory care visits. The incidence is
98/100 000 in females and 118/100 000 in males, for a ratio

9.30!{\\times}!10^{-4}

| Appendicitis incidence in adults 45 to 64 years of age per 100 000 persons per yeara | 93 |
| --- | --- |
| Appendicitis incidence rate in adults 45 to 64 years of age, events per person-year | $9.30\\times10^{-4}$ |

\\operatorname{y e a r}^{\\mathrm{a}}

a
All-listed diagnoses for hospital discharges.

1.22!\\times!10^{-3}

TABLE 8.—INCIDENCE OF APPENDICITIS IN PREFLIGHT
AND IN-FLIGHT MISSION-READY, ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

1.43!\\times!10^{-3}

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 1400 | 244 | 1644 |
| Appendicitis cases | 2 | 0 | 2 |
| Appendicitis incidence rate, events per person-year | $1.43\\times10^{-3}$ | 0 | $1.22\\times10^{-3}$ |
| In-flight astronauts |  |  |  |
| Total person-years | 31.9 | 6.4 | 38.3 |
| Appendicitis cases | 0 | 0 | 0 |
| Appendicitis incidence rate, events per person-year | 0 | 0 | 0 |

of 1:1.20. Table 7 shows the incidence rate of appendicitis in
U.S. adults 45 to 64 years of age (Ref. 8). The rate for adults
45 to 64 years of age was used because it more accurately
reflects the age of active astronauts and because the incidence rate is lower than that for people 15 to 24 years of age
(which have the highest incidence rate, Ref. 8). Data from
Addiss et al. (Ref. 7), which included data for males and
females that was differentiated by age groups, was used to
estimate the EF as 1.2.

Incidences of appendicitis in the analog astronaut popula-

estimate the EF as 1.2.

Incidences of appendicitis in the analog astronaut population were obtained from the LSAH (Ref. 9, personal communication) and are summarized in Table 8. There were no
occurrences of appendicitis in in-flight astronauts, and there

occurrences of appendicitis in in-flight astronauts, and there
were no occurrences in female astronauts. The highest
incidence rate was in preflight male astronauts. Because there
were no age-differentiated data for males and females available for the general population, the data for male and female
astronauts were combined.

occurrences of appendicitis in in-flight astronauts, and there
were no occurrences in female astronauts. The highest
incidence rate was in preflight male astronauts. Because there
were no age-differentiated data for males and females available for the general population, the data for male and female
astronauts were combined.

2.2.2 Bayesian Updates To Improve Estimates of
Appendicitis Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of appendicitis in the

the estimate of the incidence rate of appendicitis
astronaut corps and provide a first-order approximation
suitable for the IMM effort. General population data (Ref. 8)
were used to determine an informed lognormal conjugate for
the incidence rate of appendicitis in the general U.S. population (λgeneral). This was used as a prior to update LSAH
preflight data in Step

the estimate of the incidence rate of appendicitis in the
astronaut corps and provide a first-order approximation
suitable for the IMM effort. General population data (Ref. 8)
were used to determine an informed lognormal conjugate for
the incidence rate of appendicitis in the general U.S. popula-
This was used as a prior to update LSAH
1 of the Bayesian implementation,

preflight data in Step 1 of the Bayesian implementation,

(\\up\_{\\mathrm{g e n e r a l}})

* * *

yielding an updated appendicitis incidence rate. In Step 2, the
posterior result of Step 1 was used as the prior and was
updated with LSAH in-flight data in WinBUGS. The result
was an estimation of the appendicitis incidence rate in astronauts during an exploration mission. Appendix C provides the
code used in WinBUGS as well as the sampling procedure.

Step 1: First, WinBUGS was informed with the mean inci-

Step 1: First, WinBUGS was informed with the mean incidence rate of the general population from Table 7 and the EF
(1.2).
Step 2: The input parameters of Step 1 were used to perform

Step 2: The input parameters of Step 1 were used to perform
a Bayesian update with 75 000 Monte Carlo samples on the
number of events and time (person-years) from the LSAH
preflight data (Table 8).

Step 3: The posterior result of Step 2—the mean incidence

Step 3: The posterior result of Step 2—the mean incidence
rate—was dissected and used as the prior for the second
update. The 5th and 95th percentiles from the lognormal
Poisson distribution in Step 2 were used to calculate the EF.
Table 9 shows the results for preflight astronauts.
Step 4: The input parameters of Step 1 were used to perform

Table 9 shows the results for preflight astronauts.
Step 4: The input parameters of Step 1 were used to perform
a second Bayesian update with 75 000 Monte Carlo samples
on the number of in-flight events and person-years from the
LSAH in-flight data (Table 8). Appendix C provides details.
This process returned an estimate of the rate of appendicitis

TABLE 9.—RESULTS OF BAYESIAN ANALYSIS FOR
APPENDICITIS IN TOTAL PREFLIGHT MISSION-
READY, ACTIVE ASTRONAUTS
Appendicitis incidence rate, λ, events per person-year

| Mean | 9.35×10-4 |
| --- | --- |
| Standard deviation | 1.04×10-4 |
| 5 percent | 7.75×10-4 |
| Median | 9.29×10-4 |
| 95 percent | 1.11×10-3 |

TABLE 10.—RESULTS OF BAYESIAN ANALYSIS
FOR APPENDICITIS IN TOTAL IN-FLIGHT
ASTRONAUTS
Appendicitis incidence rate, λ, events per person-year

,\\lambda\_{\\mathrm{a s t r o n a l t}}

1.11!\\times!10^{-3}

\\lambda\_{\\mathrm{a s t r o n a l t}}

\\begin{array}{l}{^{9.35\\times10^{-4}}}\ {^{1.04\\times10^{-4}}}\\end{array}

7.75!\\times!10^{-4}

7.76!\\times!10^{-4}

9.28!\\times!10^{-4}

2.2.3 Discussion

This approximation is limited in that it assumes an average
incidence rate of appendicitis irrespective of environmental
conditions and the cause of appendicitis. There also were
limitations in the data for the general population in that the
incidence rate data for males and females and for blacks and
whites were not age-differentiated. Everhart reports that the
rate in whites was twice that of blacks and that the rate for
males was 20 percent greater than for females (Ref. 8, these
statements, however, do not take into account the ages being
reported). According to another source for general population
data, the highest incidence rates of appendicitis are found in
15 to 24 year olds, with 74 percent of all appendicitis cases
found in 5 to 34 year olds (Ref. 10). In the mission-ready
astronaut corps, the mean age for females is 43.8 years and the
mean age for males is 45.3 years. Another assumption was
made to use only hospital discharge data, not ambulatory care
data, because patients being discharged from the hospital
presumably carry a more definitive diagnosis of appendicitis
because of the availability of better imaging technology and
the increased likelihood that exploratory surgery was
conducted (Ref. 8). However, these Bayesian updates yield a
reasonable representation of the appendicitis incidence rate
given the occurrence data available and the assumptions made
during construction of the estimate.
Future estimates may be more accurate if data for males,

Future estimates may be more accurate if data for males,
females, and different ethnicities are available for various age
ranges. More accurate estimates also could be made with
further analysis of appendicitis occurrence in post-flight
astronauts as well as greater understanding of the physiological pathways that lead to the obstruction, inflammation, and
infection of the appendix. The current data will serve as the
baseline for future estimates that utilize additional physiological parameters.

2.3 Atrial Fibrillation

One of the most common forms of heart arrhythmias is
atrial fibrillation (AF). It is characterized by rapid, haphazard
atrial contractions. Although AF is known to increase the
likelihood of stroke and can be an underlying factor for death,
it generally is not immediately threatening. AF is accompanied
by debilitating symptoms, such as dizziness, shortness of
breath, heart palpitations, and fatigue. Although these symptoms may not pose great difficulties for the general population, an AF episode could be detrimental to an astronaut crew
on a space mission. Because of this high risk, determining the
probability of AF was deemed to be necessary to help keep
astronauts safe. Incidence rates from the astronaut corps
(Ref. 11, personal communication) and the general population
(Ref. 12) were used to determine this probability. A Bayesian
update was used to combine these data to yield a probability
distribution for AF incidence.

* * *

2.3.1 Data and Methods

used in this probability estimate came from an article in the
journal Circulation (Ref. 12). These data were gathered from a
cohort of patients at the Mayo Clinic in Olmsted County,
Minnesota, from 1980 to 2000. An AF event was included if it
was the first event for a particular patient and was verified by
an electrocardiogram. These data were separated by age and
year. In an attempt to closely approximate the current astro-

used in this probability estimate came from an article in the
journal Circulation (Ref. 12). These data were gathered from a
cohort of patients at the Mayo Clinic in Olmsted County,
Minnesota, from 1980 to 2000. An AF event was included if it
was the first event for a particular patient and was verified by
an electrocardiogram. These data were separated by age and
year. In an attempt to closely approximate the current astro-

year. In an attempt to closely approximate the current astronaut population, the most recent data from 1995 to 2000 for
males and females under 55 were used. Data included the
95-percent CI for males, females, and the total from 1995 to
2000\. However, these data were not specific to age, but were for
all ages from 1995 to 2000. It was assumed that the 95-percent

under 55. Appendix B, Section B.2, provides the steps for
calculating the EF. All data were supplied as incidences per
1000 person-years. Table 11 gives the average AF incidence per
person-year for men, women, and total, along with the EFs.
Incidences of AF in the astronaut corps and the number of

under 55. Appendix B, Section B.2, provides the steps for
calculating the EF. All data were supplied as incidences per
1000 person-years. Table 11 gives the average AF incidence per
person-year for men, women, and total, along with the EFs.
Incidences of AF in the astronaut corps and the number of

2.3.2 Bayesian Updates To Improve Estimates of Atrial
Fibrillation Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the AF incidence rate in the astronaut corps to

find an approximation suitable for the IMM effort. Two steps
and Bayesian updates were performed. The first step used
the general population data (Ref. 12) as priors to update the
LSAH preflight data (Ref. 11, personal communication).
This step was performed three times, once each for males,
females, and the total. The posterior results from this step
describe the AF incidence rate for preflight astronauts. In the
second step, the data from these posterior results, namely the
means and the 5th and 95th percentiles, were then used as
the priors to update the in-flight astronaut data for males,
females, and the total. Ultimately, six probability distributions were found describing the AF incidence rate for
preflight and in-flight male, female, and total astronauts.
Appendix C shows the code used in WinBUGS, and an
outline of the input data for each step follows.
Step 1: For females, males, and the total, the AF incidence

Step 1: For females, males, and the total, the AF incidence
per person-year in the general U.S. population (Table 11) and
the EF were used for the priors in WinBUGS to update the
number of AF cases for male and female astronauts from
LSAH data (Table 12). Table 13 gives the posterior data from
this step.
Step 2: The posterior results from Step 1—the means and

Step 2: The posterior results from Step 1—the means and
the 5th and the 95th percentiles (Table 13) were used as the
priors in WinBUGS to update the in-flight astronaut data
from LSAH (Table 12). Table 14 shows the posterior results
of this Bayesian update: a Poisson probability distribution
for the means, 5th and 95th percentiles, and standard deviations of the AF incidence rate of in-flight astronauts.

TABLE 11.—INCIDENCE OF ATRIAL FIBRILLATION (AF) IN U.S. ADULTS
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| AF incidence in adults under 55 years of age per 1000 person-years | 0.64 | 0.21 | 0.425 |
| 95-percent confidence interval (CI) for AF incidence in adults per 1000 person-years | 0.32 to 0.96 | 0.01 to 0.41 | 0.24 to 0.60 |
| AF incidence rate in adults under 55 years of age, events per person-year | $6.40\\times10^{-4}$ | $2.10\\times10^{-4}$ | $4.25\\times10^{-4}$ |
| Error factor(EF) for AF incidence in adults under 55 years of age | 1.56 | 2.97 | 1.45 |

TABLE 12.—INCIDENCE OF ATRIAL FIBRILLATION (AF) IN PREFLIGHT
AND IN-FLIGHT MISSION-READY, ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 6502.7 | 336.8 | 6839.5 |
| AF cases | 4 | 0 | 4 |
| AF incidence rate, events per person-year | $6.15\\times 10^{-4}$ | 0 | $5.85\\times 10^{-4}$ |
| In-flight astronauts |  |  |  |
| Total person-years | 31.8 | 6.5 | 38.3 |
| AF cases | 0 | 0 | 0 |
| AF incidence rate, events per person-year | 0 | 0 | 0 |

6.40!\\times!10^{-4}

6.15!{\\times}!10^{-4}

4.25!\\times!10^{-4}

5.85!\\times!10^{-4}

* * *

TABLE 13.—RESULTS OF BAYESIAN ANALYSIS
FOR ATRIAL FIBRILLATION (AF) IN PREFLIGHT
MISSION-READY, ACTIVE MALE, FEMALE,
AND TOTAL ASTRONAUTS
AF incidence rate, λ, events per person-year

| AF incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 6.29×10-4 | 2.02×10-4 | 4.43×10-4 |
| Standard deviation | 1.51×10-4 | 1.46×10-4 | 9.39×10-5 |
| 5 percent | 4.12×10-4 | 5.60×10-5 | 3.06×10-4 |
| 95 percent | 9.02×10-4 | 4.76×10-4 | 6.11×10-4 |

\\lambda\_{\\mathrm{a s t r o n a u t}}

6.29!{\\times}!10^{-4}

\\overline{{2.02\\times10^{-4}}}

4.43!\\times!10^{-4}

1.51!\\times!10^{-4}

1.46!\\times!10^{-4}

9.39!\\times!10^{-5}

4.12!{\\times}!10^{-4}

5.60!\\times!10^{-5}

9.02!\\times!10^{-4}

4.76!{\\times}!10^{-4}

3.06!{\\times}!10^{-4}

6.11!\\times!10^{-4}

TABLE 14.—RESULTS OF BAYESIAN ANALYSIS FOR
ATRIAL FIBRILLATION (AF) IN IN-FLIGHT MALE,
FEMALE, AND TOTAL ASTRONAUTS

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Mean | 6.28×10-4 | 2.02×10-4 | 4.42×10-4 |
| Standard deviation | 1.52×10-4 | 9.99×10-6 | 9.36×10-5 |
| 5 percent | 4.12×10-4 | 1.86×10-4 | 3.06×10-4 |
| 95 percent | 9.05×10-4 | 2.19×10-4 | 6.09×10-4 |

\\lambda\_{\\mathrm{a s t r o n a l t}};

6.28!\\times!10^{-4}

2.02!\\times!10^{-4}

1.52!\\times!10^{-4}

4.42!\\times!10^{-4}

9.99!\\times!10^{-6}

9.36!\\times!10^{-5}

4.12!\\times!10^{-4}

1.86!\\times!10^{-4}

9.05!{\\times}!10^{-4}

2.19!\\times!10^{-4}

3.06!{\\times}!10^{-4}

6.09!{\\times}!10^{-4}

2.3.3 Discussion

These results are limited because they assume an average
AF incidence rate and do not include specific data for ethnicity, previous cardiac diseases, or health. Also, assumptions
were made when non-age-specific 95-percent CI were used for
age-specific data. Understanding these limitations is necessary
in applying these results. In spite of this limitation, the
assumptions, and the data available, Table 13 and Table 14
present a reasonable approximation of AF incidence. These
results can serve as a baseline for future studies that include
further investigations into the causes of AF and more data and
risk parameters for AF.

2.4 Atrial Flutter

Although atrial flutter (AFL) is less prevalent than AF, both
are characterized by rapid atrial contractions. In contrast to
AF, the quick AFL contractions are conducted in a regular
pattern relative to ventricular contractions. Like AF, AFL is
not immediately life threatening, though it can raise the
chance of stroke. In addition, both atrial arrhythmias have
similar debilitating symptoms, and both conditions could
threaten the success of an astronaut if they were to occur in
space. So that the proper amount of medications can be on
hand for future in-flight AFL cases, the probability of AFL
must be determined. A Bayesian update was used to combine
experimental data from AFL incidence rates from the astronaut corps (Ref. 11, personal communication) and prior AFL
incidence data from the general population (Ref. 13) to find
this probability.

2.4.1 Data and Methods

The general population data describing the rate of AFL used
in this probabilistic calculation came from Granada et al.
(Ref. 13). This study examined the rate of AFL from the
Marshfield Epidemiologic Study Area in Wisconsin from
1991 to 1995. AFL cases were confirmed with electrocardiograms, using the International Classification of Disease code
ICD 427.32 to define AFL. To approximate the age of the
astronaut corps, the data recorded for men, women, and the
total under the age of 50 were used. Included with these data
were the 95-percent CI for men, women, and the total. These
95-percent CI were not specific to age, however, so they were
too wide to be applied directly to the data for adults less than
50 years of age. Ratios between the number of AFL cases and
95-percent CI width of all ages versus the incidence rates and
95-percent CI width for those under 50 were used to find a
new 95-percent CI width for adults under 50 years of age.
Appendix B, Section B.3, gives the steps for this calculation as
well as for the calculation of the 95-percent CI into the EF.
These data gave the number of incidences and the number of
person-years for males, females, and the total. Table 15 gives
the calculated incidence rates and the corresponding EFs.
AFL incidence data for the astronaut corps were supplied

the calculated incidence rates and the corresponding EFs.
AFL incidence data for the astronaut corps were supplied
by LSAH (Ref. 11, personal communication). The number of
AFL cases and person-years were included for in-flight and
preflight male, female, and total astronauts, as shown in
Table 16.

2.4.2 Bayesian Updates To Improve Estimates of Atrial
Flutter Incidence, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the AFL incidence rate in the astronaut corps
and provide an approximation suitable for the IMM effort.
This process took two steps. The first step was to update in
WinBUGS the AFL incidence rate data for preflight astronauts
performed three times, once each for males, females, and the
total. The posterior results from the first step, including the
means and the 5th and 95th percentiles, were used as the
priors for another Bayesian update to the in-flight astronaut
data. This was performed three times (once each for males,
females, and the total) and yielded the Poisson probability
distribution curves for the likelihood of an AFL occurrence in
space. After these two steps, six Bayesian updates were
performed with WinBUGS: for preflight and in-flight male,
female, and total astronauts. Appendix C provides the
WinBUGS code that was used, and an outline of each step,
including the data used, follows.
Step 1: The general population incidence rates and EFs for

including the data used, follows.
Step 1: The general population incidence rates and EFs for
males, females, and the total (Table 15) were used as the
priors for a Bayesian update with WinBUGS on the number of
cases and person-years for preflight astronauts from LSAH
(Table 16). Table 17 shows the posterior results from
this step.

* * *

TABLE 15.—INCIDENCE OF ATRIAL FLUTTER (AFL)
IN U.S. ADULTS FROM 1991 TO 1995

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| AFL cases in adults under 50 years of age | 6 | 2 | 8 |
| Number of person-years in the study | 84915 | 82250 | 167165 |
| 95-percent confidence interval (CI) for AFL in adults per 100000 person-years | $\\pm$0.24 | $\\pm$0.14 | $\\pm$0.13 |
| AFL incidence rate for adults under 50 years of age per person-year | $7.07\\times10^{-5}$ | $2.43\\times10^{-5}$ | $4.79\\times10^{-5}$ |
| Recalculated 95-percent CI for AFL incidence in adults per 100000 person-years | $\\pm$0.013 | $\\pm$0.004 | $\\pm$0.006 |
| Error factor (EF) for AFL incidence in adults under 55 years of age | 1.17 | 1.18 | 1.11 |

7.07!{\\times}!10^{-5}

2.43!\\times!10^{-5}

4.79!\\times!10^{-5}

TABLE 16.—INCIDENCE OF ATRIAL FLUTTER (AFL) IN
PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]

\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 6502.7 | 336.8 | 6839.4 |
| AFL cases | 0 | 0 | 0 |
| AFL incidence rate, events per person-year | 0 | 0 | 0 |
| In-flight astronauts |  |  |  |
| Total person-years | 31.8 | 6.5 | 38.3 |
| AFL cases | 0 | 0 | 0 |
| AFL incidence rate, events per person-year | 0 | 0 | 0 |

TABLE 17.—RESULTS OF BAYESIAN ANALYSIS FOR
ATRIAL FLUTTER (AFL) IN PREFLIGHT MISSION-READY,
ACTIVE MALE, FEMALE, AND TOTAL ASTRONAUTS
AFL incidence rate, λ, events per person-year

| AFL incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 7.05×10-5 | 2.43×10-5 | 4.77×10-5 |
| Standard deviation | 6.74×10-6 | 2.42×10-6 | 3.04×10-6 |
| 5 percent | 6.00×10-5 | 2.05×10-5 | 4.29×10-5 |
| 95 percent | 8.21×10-5 | 2.84×10-5 | 5.29×10-5 |

\\overline{{7.05!\\times!10^{-5}}}

\\underline{{\\lambda\_{\\mathrm{a s t r o n a u t}}}}

2.43!\\times!10^{-5}

^overline{{7.05\\times10^{-5}}}\_{\\cdots-6}

4.77!\\times!10^{-5}

2.45!\\times!10^{-1}

3.04!\\times!10^{-6}

6.00!\\times!10^{-5}

2.84!\\times!10^{-5}

3.04!\\times!10^{-6}

4.29!\\times!10^{-5}

Step 2: This step used WinBUGS to combine the posterior
results from Step 1—the means and the 5th and 95th percentiles (Table 17)—with the in-flight astronaut data from Table 16.
The result of this Bayesian update was the Poisson probability
distribution for the AFL incidence rate in in-flight male,
female, and total astronauts. Table 18 shows the means, the
5th and 95th percentiles, and the standard deviations.

Like the AF analysis, this analysis is also limited because it
assumes an average incidence rate of AFL. There are no
specific data for important risk factors such as ethnicity or
previous cardiac diseases and health. Also assumptions were
made when non-age-specific 95-percent CI were used for agespecific data. These limitations should be kept in mind when
this analysis is used. Despite the limitations, however, this
analysis is a reasonable approximation of AFL incidence and
can serve as a baseline until further investigations into the risk
parameters and causes of AFL are made.

2.4.3 Discussion

Because a dental abscess may greatly affect crewmember
performance, health, and morale, evaluating the probability
that an astronaut may encounter a dental abscess during an
exploration mission was deemed to be necessary. An abscess
results from the infection of pulp material in the tooth caused
by complications such as decayed, cracked, or broken teeth
(Ref. 14). U.S. Submarine Force (Ref. 15) and astronaut data
from LSAH (Ref. 16, personal communication) were used to
estimate the probability of an astronaut encountering dental
abscess. The submarine crew data analysis defined periapical
abscesses as 2010 ICD–9–CM code 522 (pulp and periapical),
and the astronaut data from LSAH defined dental abscess as
“abscess diagnosis,” with no reference to ICD–9 coding. A
Bayesian update was used to combine information from these
sources to estimate the average incidence rate of abscess.

2.5 Dental Abscess

Submarine force data were used because of the physiological similarity of the U.S. Submarine Force to astronauts.
Deutsch (Ref. 15) conducted studies from 1997 to 2000 on the
incidence of various dental emergencies in U.S. Submarine
Force personnel. The medical history of submarine missions
was useful for this statistical analysis because of their similarities to exploration-class missions. For example, both occur in
confined, remotely located environments where professional
medical care is not immediately available. Also, a medical
event of low probability and high consequence could cause a
mission to cease (Refs. 17 and 18). Although there are
similarities between a submarine mission and a space exploration mission, it is important to note that smoking was

2.5.1 Data and Methods

* * *

TABLE 19.—INCIDENCE OF DENTAL ABSCESS IN
240 PATROLS OF THE U.S. SUBMARINE FORCE

| Total person-years | 5946.9 |
| --- | --- |
| Total visits due to abscess | 21 |
| Abscess incidence rate, events per person-year | 3.53×10-3 |
| 95-percent confidence interval(CI) | 0.69 to 3.80 |
| Error factor(EF) | 1.48 |

3.53!\\times!10^{-3}

TABLE 20.—INCIDENCE OF DENTAL ABSCESS IN
PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE MALE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Preflight astronauts

| Preflight astronauts |  |
| --- | --- |
| Total person-years | 475.2 |
| Number of crewmembers | 77 |
| Abscess cases | 19 |
| Abscess incidence rate, events per person-year | $4.0\\times10^{-2}$ |
| In-flight astronauts |  |
| Total person-years | 31.9 |
| Abscess cases | 0 |
| Abscess incidence rate, events per person-year | 0 |

{.4.0\\times\ 10^{-2}}

TABLE 21.—RESULTS OF BAYESIAN ANALYSIS
FOR DENTAL ABSCESS IN PREFLIGHT MISSION-
READY, ACTIVE MALE ASTRONAUTS
Abscess incidence rate, λ, events per person-year

| Abscess incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 8.26×10-3 |
| Standard deviation | 1.80×10-3 |
| 5 percent | 5.64×10-3 |
| Median | 8.09×10-3 |
| 95 percent | 1.15×10-2 |

\\lambda\_{\\mathrm{a s t r o n a u t}},

8.26!\\times!10^{-3}

1.80!\\times!10^{-3}

5.64!\\times!10^{-3}

8.09!\\times!10^{-3}

1.15!\\times!10^{-2}

TABLE 22.—RESULTS OF BAYESIAN ANALYSIS
FOR DENTAL ABSCESS IN IN-FLIGHT
MALE ASTRONAUTS
Abscess incidence rate, λ, events per person-year

significantly associated with the occurrence of a periodontalrelated emergency and also with the occurrence of any dental

related emergency and also with the occurrence of any dental
emergency. There is probably a greater percentage of smokers
among the U.S. Submarine Force than among astronauts. In
addition, the submarine study is limited in that it applies only to
adult men and that the overwhelming majority (88.5 percent) of
the sailors followed in this study were Caucasian. In addition,
submarine crew members are generally more senior than the
average sailor (70.5 percent
Table 19 shows the submarine crew data. The EF was determined from the 95-percent CI as outlined in Appendix B,

related emergency and also with the occurrence of any dental
emergency. There is probably a greater percentage of smokers
among the U.S. Submarine Force than among astronauts. In
addition, the submarine study is limited in that it applies only to
adult men and that the overwhelming majority (88.5 percent) of
the sailors followed in this study were Caucasian. In addition,
submarine crew members are generally more senior than the
were 25 years old or older).
Table 19 shows the submarine crew data. The EF was deter-
CI as outlined in Appendix B,

mined from the 95-percent CI as outlined in Appendix B,
Section B.4.

5.58!\\times!10^{-3}

\\overline{{8.16!\\times!10^{-3}}}

7.98!\\times!10^{-3}

1.14!\\times!10^{-2}

1.80!\\times!10^{-3}

Table 20 shows the LSAH dental abscess data for the astronaut corps from LSAH (Ref. 16, personal communication).
For this analysis, data for the mission-ready, active female
astronaut population was not used because the U.S. Submarine
Force data used in the Bayesian update was for males only.

2.5.2 Bayesian Updates To Improve Estimates of Dental
Abscess Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of dental abscess in the
astronaut corps and provide a first-order approximation
suitable for the IMM effort. One Bayesian update was performed using data for the U.S. Submarine Force and for
mission-ready, active male astronauts. The submarine crew
data were used to form an informed lognormal conjugate prior
for the incidence rate of dental abscess in the U.S. Submarine
Force and data on preflight incidences in male astronauts,
yielding an updated incidence rate of abscess. In Step 3, the
posterior result of Step 1 was used as the prior and was
updated in WinBUGS with LSAH in-flight data. The result
was an estimate of the incidence rate of abscess in astronauts
during an exploration mission. Appendix C provides the code
used in WinBUGS as well as the sampling procedure.
Step 1: WinBUGS was informed with the mean abscess

Step 1: WinBUGS was informed with the mean abscess
incidence rate for the U.S. Submarine Force and the EF from
Table 19.
Step 2: A Bayesian update was performed with 75 000 Monte

Step 2: A Bayesian update was performed with 75 000 Monte
Carlo samplings on the number of events and person-years for
preflight male astronauts from LSAH data (Table 20).
Step 3: The mean incidence rate for preflight astronauts

Step 3: The mean incidence rate for preflight astronauts
from Step 1 (Table 21) was used as the prior for the second
update, and the EF was calculated as 1.43 from the 95th and
5th percentiles from Step 1.
Step 4: A second Bayesian update was performed with

Step 4: A second Bayesian update was performed with
75 000 Monte Carlo samples on the input parameters of
Step 3: the number of events and person-years for in-flight
male astronauts (Table 20). Appendix C provides details.
This process returned an estimate of the incidence rate of

(\\lambda\_{\\mathrm{a s t r o n a u t}})

3.53\\times{10}^{-3}

This process returned an estimate of the incidence rate of
dental abscess in the astronaut corps (λastronaut) with respect to
the U.S. Submarine Force. This can be used as the input rate to
a Poisson distribution to estimate the probability of abscess
occurring during flight. Table 22 illustrates the results of the
implementation.

The number of events per person-years for the submarine
–3 –3
population (Table 19) is 3.53×10 versus 8.16×10 for male
astronauts (Table 22). In both submarine and astronaut data,
there may be cases of underreporting. Astronaut health is
typically tracked through annual physicals, where questions
related to dental health may or may not be asked. There may
be demographic differences between the submarine and
astronaut data, including rates of smoking, age differences,
and racial differences. The age difference may be important
to note because recommended preventative dental practices

2.5.3 Discussion tend to evolve over time. Current recommended dental
practices include daily flossing, brushing teeth twice a day for
at least 2 minutes, seeing a dentist twice a year, and drinking
fluoridated water (the number of communities in the United
States with fluoridated water grows each year) (Refs. 19
to 22). The differences between population demographics and
access to fluoridated water may lead to discrepancies in
incidence rates. Also, because women do not serve as submarine crewmembers, female astronaut data were not used in
this Bayesian calculation. Future analyses should include data
for women.

4.88!\\times!10^{-3}

Because dental caries may greatly affect crewmember
performance, health, and morale, evaluating the probability
that an astronaut may encounter dental caries during an
exploration mission was deemed to be necessary. Caries are
caused by certain bacteria in the oral flora that release acid as
a byproduct of carbohydrate metabolism. The acid dissolves
the calcium phosphate of the enamel and dentin (Refs. 20
and 21). U.S. Submarine Force data (Ref. 15) and astronaut
data from LSAH (Ref. 16, personal communication) were
used to estimate the probability of an astronaut encountering
dental caries. The submarine crew data defined dental caries
as 2010 ICD–9–CM code 521 (hard tissues and caries), and
the astronaut data from LSAH defined dental caries as
“primary caries, secondary caries, or order unknown,” with
no reference to ICD–9 coding. For this analysis, the sum of
all three caries categories was used for astronauts. A Bayesian
update was used to combine the information from these
sources to estimate the average rate of caries.

2.6 Dental Caries

2.6.1 Data and Methods

TABLE 23.—INCIDENCE OF DENTAL CARIES IN
240 PATROLS OF THE U.S. SUBMARINE FORCE

The medical history of submarine missions was useful
because they are similar to exploration-class missions. For
example, both occur in confined, remotely located environments where professional medical care is not immediately
available. Also, a medical event of low probability and high
consequence could cause a mission to cease (Refs. 17 and
18). It is important to note that smoking was significantly
associated with the occurrence of a periodontal-related
emergency and also with the occurrence of any dental
emergency. It is likely that there is a greater percentage of
smokers among sailors than among the astronaut corps. This
study is limited in that it included only adult men and that
the overwhelming majority (88.5 percent) of these men were
Caucasian. In addition, submarine crew members are
generally more senior than the average sailor (70.5 percent
were 25 years old or older). Table 23 shows the submarine
crew data. The EF was determined from the 95-percent CI as
outlined in Appendix B, Section B.4.

Total person-years ..... 5946.9
Total visits due to caries ..... 29
Caries incidence rate, events per person-year..... $ 4.88\\times10^{-3} $
95-percent confidence interval (CI)..... 0.3 to 1.53
Error factor (EF)..... 1.11

3.54!\\times!10^{-1}

TABLE 24.—INCIDENCE OF DENTAL CARIES IN
PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE MALE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Preflight astronauts

| Preflight astronauts |  |
| --- | --- |
| Total person-years | 475.2 |
| Number of crewmembers | 77 |
| Caries cases | 168 |
| Caries incidence rate, events per person-year | 3.54×10-1 |
| In-flight astronauts |  |
| Total person-years | 31.9 |
| Caries cases | 0 |
| Caries incidence rate, events per person-year | 0 |

Table 24 shows the data from LSAH (Ref. 16, personal
communication). For this analysis, data for the mission-ready,
active female astronaut population was not used because the
U.S. Submarine Force data only included males.

2.6.2 Bayesian Updates To Improve Estimates of Dental
Caries Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of dental caries in the
astronaut corps and provide a first-order approximation
suitable for the IMM effort. One Bayesian update was done
using data for the U.S. Submarine Force and for missionready, active male astronauts. The submarine crew data were
used to form an informed lognormal conjugate prior for the
incidence rate of dental caries in U.S. Submarine Force
personnel as well as for preflight incidences in male astronauts, yielding a posterior result for the updated incidence rate
of caries. In Step 3, the posterior result of Step 1 was used as
the prior, and updated LSAH in-flight data were used in
WinBUGS. The result was an estimate for the incidence rate
of abscess in astronauts during an exploration mission
(Table 24). Appendix C shows the code used in WinBUGS as
well as the sampling procedure.
Step 1: WinBUGS was informed with the U.S. Submarine

Step 1: WinBUGS was informed with the U.S. Submarine
Force mean incidence rate and the EF from Table 23.
Step 2: A Bayesian update was performed with 75 000

* * *

TABLE 25.—RESULTS OF BAYESIAN ANALYSIS
FOR DENTAL CARIES IN PREFLIGHT MISSION-
READY, ACTIVE MALE ASTRONAUTS
Caries incidence rate, λ, events per person-year

| Caries incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 9.42×10-3 |
| Standard deviation | 5.94×10-4 |
| 5 percent | 8.48×10-3 |
| Median | 9.40×10-3 |
| 95 percent | 1.04×10-2 |

\\lambda\_{\\mathrm{a s t r o n a l t}}

\\overline{{9.42!\\times!10^{-3}}}

5.94!\\times!10^{-4}

8.48!\\times!10^{-3}

9.40!\\times!10^{-3}

1.04!\\times!10^{-2}

TABLE 26.—RESULTS OF BAYESIAN ANALYSIS
FOR DENTAL CARIES IN IN-FLIGHT MISSION-
READY, ACTIVE MALE ASTRONAUTS
Caries incidence rate, λ, events per person-year

| Caries incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 9.41×10-3 |
| Standard deviation | 5.95×10-4 |
| 5 percent | 8.46×10-3 |
| Median | 9.39×10-3 |
| 95 percent | 1.04×10-2 |

\\lambda\_{\\mathrm{a s t r o n a l t}},

\\overline{{9.41!\\times!10^{-3}}}

5.95!{\\times}!10^{-4}

8.46!{\\times}!10^{-3}

9.39!\\times!10^{-3}

1.04!\\times!10^{-2}

Step 3: The mean incidence rate from Step 1 (Table 25) was
used as the prior for the second update, and the EF was calculated as 1.11 from the 95th and 5th percentiles from Step 1.
Step 4: A second Bayesian update was performed with

Step 4: A second Bayesian update was performed with
75 000 Monte Carlo samples on the input parameters of Step 3:
the number of in-flight events and person-years for in-flight
male astronauts from LSAH data (Table 24). Appendix B,
Section B.4, provides details.
This process returned an estimate of the incidence rate of

Section B.4, provides details.
This process returned an estimate of the incidence rate of
dental caries in the astronaut corps (λastronaut) with respect to
the U.S. Submarine Force. This incidence rate was used as
input to a Poisson distribution to estimate the probability of
caries occurring during flight. Table 26 shows the results.

(\\upl\_{\\mathrm{a s t r o n a u t}})

2.6.3 Discussion

The number of dental caries events per person-year was
–3 –3
4.88×10 in the U.S. Submarine Force versus 9.41×10 for
male astronauts. In both the submarine crew and astronaut
data, there may be cases of underreporting. Astronaut health is
typically tracked through annual physicals, where questions
related to dental health may or may not be asked. There may
be demographic differences between the submarine crew and
astronaut data, including rates of smoking, age differences,
and racial differences. The age difference may be important to
note because recommended preventative dental practices tend
to evolve over time, as described in Section 2.5.3 and in
References 17 to 21. The differences between population
demographics and access to fluoridated water may have
produced discrepancies in incidence rates. Also, because
women do not serve as submarine crewmembers, female

0.41\\dot1\\times10^{-3}

astronaut data were not used in this Bayesian calculation.
Future analyses should include data for women.

4.88!\\times!10^{-3}

2.7 Dental Periodontal Disease

Because periodontal disease may greatly affect crewmember
performance, health, and morale, evaluating the probability
that an astronaut may develop periodontal disease during an
exploration mission was deemed to be necessary. Periodontal
disease involves inflammation and infection that destroy the
tissues that support the teeth, including the gums, the
periodontal ligaments, and the tooth sockets (alveolar bone)
(Ref. 22). Gingivitis is a form of periodontal disease due to the
long-term effects of plaque deposits. U.S. Submarine Force
data (Ref. 15) and astronaut data from LSAH (Ref. 16,
personal communication) were used to estimate the probability
of an astronaut encountering periodontal disease. The submarine crew data defined periodontal disease as 2010 ICD–9–
CM code 523 (gingival and periodontal disease), and LSAH
defined periodontal disease as “periodontal disease diagnosis,”
with no reference to ICD–9 coding. A Bayesian update was
used to combine information from these sources to estimate
the average rate of periodontal disease.

2.7.1 Data and Methods

The medical history of submarine missions was useful for
this statistical analysis because these missions are similar to
exploration-class missions: both occur in confined, remotely
located environments where professional medical care is not
immediately available. Also, a medical event of low probability and high consequence could cause a mission to fail
(Refs. 17 and 18). Data from Deutsch (Ref. 15) regarding the
incidence of periodontal disease and gingivitis in the U.S.
Submarine Force were used because of these similarities (see
Table 27). However, it is important to note that smoking was
significantly associated with the occurrence of a periodontalrelated emergency as it was with the occurrence of any dental
emergency. The percentage of smokers among sailors is
probably greater than among the astronaut corps. The U.S.
Submarine Force study is limited in that it applies only to
adult men, and the overwhelming majority (88.5 percent) of
these men were Caucasian. In addition, submarine crew
members are generally more senior than the average sailor
(70.5 percent were 25 years old or older). Table 27 shows the
results, where the EF was determined from the 95-percent CI
as outlined in Appendix B, Section B.4.
The IMM team obtained data regarding the incidence of

as outlined in Appendix B, Section B.4.
The IMM team obtained data regarding the incidence of
periodontal disease in the astronaut corps from LSAH (Ref. 16,
personal communication) (see Table 28). Because the U.S.
Submarine Force data used in this Bayesian update was for
males only, data for the mission-ready, active female astronaut
population were not used.

* * *

TABLE 27.—INCIDENCE OF GINGIVAL AND
PERIODONTAL DISEASE IN 240 PATROLS
OF THE U.S. SUBMARINE FORCE
Total person-years............................................... 5946.9

| Total person-years | 5946.9 |
| --- | --- |
| Total visits due to periodontal disease | 10 |
| Periodontal disease incidence rate, events per person-year | $1.68\\times10^{-3}$ |
| 95-percent confidence interval (CI) | 0.33 to 4.19 |
| Error factor(EF) | 6.24 |

1.68!\\times!10^{-3}

TABLE 28.—INCIDENCE OF PERIODONTAL DISEASE
IN PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE MALE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]

| Preflight astronauts |  |
| --- | --- |
| Total person-years | 475.2 |
| Number of crewmembers | 77 |
| Periodontal disease cases | 56 |
| Periodontal disease incidence rate, events per person-year | $1.18\\times10^{-1}$ |
| In-flight astronauts |  |
| Total person-years | 31.9 |
| Periodontal disease cases | 0 |
| Periodontal disease incidence rate, events per person-year | 0 |

TABLE 29.—RESULTS OF BAYESIAN ANALYSIS FOR
PERIODONTAL DISEASE IN TOTAL PREFLIGHT
MISSION-READY, ACTIVE MALE ASTRONAUTS
Periodontal disease incidence rate, λ, events per person-year

\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Preflight astronauts

1.09!\\times!10^{-1}

1.52!\\times!10^{-2}

8.62!\\times!10^{-2}

\\overline{{1.10\\times10^{-1}}}

1.18!\\times!10^{-1}

| Periodontal disease incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | $1.10\\times 10^{-1}$ |
| Standard deviation | $1.52\\times 10^{-2}$ |
| 5 percent | $8.62\\times 10^{-2}$ |
| Median | $1.09\\times 10^{-1}$ |
| 95 percent | $1.36\\times 10^{-1}$ |

\\lambda\_{\\mathrm{a s t r o n a u t}},

1.36!\\times!10^{-1}

2.7.2 Bayesian Updates To Improve Estimates of
Periodontal Disease Incidence Rates, and
Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of periodontal disease in the
astronaut corps and provide a first-order approximation
suitable for the IMM effort. One Bayesian update was performed using U.S. Submarine Force data and data for missionready, active male astronauts. The submarine crew data were
used to form an informed lognormal conjugate prior for the
incidence rate of periodontal disease in U.S. Submarine Force
personnel and male astronauts, yielding a posterior result of
the updated incidence rate of periodontal disease. In Step 3,
the posterior result of Step 1 was used as the prior and was
updated with LSAH in-flight data in WinBUGS. The result
was an estimation of the incidence rate of periodontal disease
in astronauts during an exploration mission. Appendix C
provides the code used in WinBUGS as well as the sampling
procedure.
Step 1: WinBUGS was informed with the U.S. Submarine

Step 1: WinBUGS was informed with the U.S. Submarine
Force mean incidence rate and the EF from Table 27.
Step 2: A Bayesian update was performed with 75 000 Monte

1.41!\\times!10^{-2}

8.16!\\times!10^{-2}

1.02!\\times!10^{-1}

1.03!\\times!10^{-1}

1.28!\\times!10^{-1}

TABLE 30.—RESULTS OF BAYESIAN ANALYSIS
FOR PERIODONTAL DISEASE IN IN-FLIGHT
MALE ASTRONAUTS

\\lambda\_{\\mathrm{a s t r o n a u t}},

| Periodontal disease incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 1.03×10-1 |
| Standard deviation | 1.41×10-2 |
| 5 percent | 8.16×10-2 |
| Median | 1.02×10-1 |
| 95 percent | 1.28×10-1 |

(\\lambda\_{\\mathrm{a s t r o n a u t}})

Step 4: A second Bayesian update was performed with
75 000 Monte Carlo samples on the input parameters of
Step 3: the number of events and person-years for in-flight
male astronauts from LSAH data (Table 28). Appendix C
provides details.
This process returned an estimate of the incidence rate of

This process returned an estimate of the incidence rate of
periodontal disease in the astronaut corps (λastronaut) with
respect to the U.S. Submarine Force (Table 30). This rate can
be used as the input rate to a Poisson distribution to estimate
the probability of periodontal disease occurring during
flight.

The number of periodontal disease events per person-year in
the submarine population is 2 orders of magnitude less than that
of the male astronauts. In both the submarine and astronaut data,
there may be cases of underreporting. Astronaut health is
typically tracked through annual physicals, where questions
related to dental health may or may not be asked. In addition,
there may be demographic differences between the submarine
crew and astronaut data, including rates of smoking, age, and
race. The age difference may be important to note because
recommended preventative dental practices tend to evolve over
time, as described in Section 2.5.3 and References 19 to 22.
These differences and differences in access to fluoridated water
may lead to discrepancies in incidence rates. Also, because
women do not serve as submarine crewmembers, female astronaut data were not used in this Bayesian calculation. Future
analyses should include data for women.

2.7.3 Discussion

* * *

2.8 Gallstone Disease

The presence of cholesterol stones or bile pigment-based
stones in the gallbladder is a relatively common condition that
can lead to a variety of serious complications. Risk factors for
gallstone disease include age, obesity, diabetes mellitus,
pregnancy, and alcohol use. In addition, during the reproductive years, the condition is about 4 times more likely in
women than in men. This gender discrepancy diminishes with
age. Although gallstones may be asymptomatic, the complications of symptomatic gallstone, or biliary disease may have a
negative impact on crewmember health, morale, and performance. The current standard treatment for most complications
of biliary disease is cholecystectomy, or surgical removal of
the gallbladder (Ref. 23). Three of the severe complications of
gallstone disease are acute cholecystitis, acute biliary pancreatitis, and acute cholangitis. Acute cholecystitis, or inflammation of the gallbladder, can lead to progressive pain, fever, and
possible necrosis of the gallbladder. Treatment requires
antibiotics and early surgical intervention (Ref. 23). Biliary
pancreatitis occurs when a gallstone passes into and through
the common bile duct, leading to abdominal pain and potential
inflammation. Treatment for this condition includes endoscopic removal of the stone and cholecystectomy (Ref. 23).
Cholangitis is the infection of an obstructed bile duct, causing
pain and fever (Ref. 24). Owing to the debilitating symptoms
of these conditions and the difficulties that surgical treatment
requirements pose for space exploration missions, calculating
the incidence rate of severe gallstone disease in astronauts was
deemed to be necessary. A Bayesian update was used to
combine the incidence rates of acute cholecystitis, biliary
pancreatitis, and cholangitis from a general population study
with data on the incidence of severe gallstone disease in the
astronaut corps from LSAH to yield a probability distribution
describing the incidence rate of severe gallstone disease in
astronauts (Ref. 6, personal communication).

So that a first-order estimate of the incidence rate of severe
gallstone disease in the astronaut and general populations
could be obtained, the assumption was first made that gallstone disease occurs at some characteristic constant rate
(λgallstone) over the period of interest. This allowed the number
of gallstone events to be represented as a Poisson process with
characteristic rate λgallstone.

The probability distribution describing this rate in the general population was determined from a study published in the
Canadian Medical Association Journal that used data from the
Canadian Institute for Health Information, the Ontario Health
Insurance Plan physicians claims database, and the Registered
Persons Database to determine the annual incidence rates of
acute cholecystitis, acute biliary pancreatitis, and acute
cholangitis per 100 000 people from 1988 to 2000. The study
determined incidence rates for the three events separately. In
addition, incidence rates were stratified by males and females
and by age (Ref. 6, personal communication).
Independence of occurrence was assumed for the different

(\\lambda\_{\\mathrm{g a l l s t o n e}})

\\lambda\_{\\mathrm{g a l l s t o n e}}

and by age (Ref. 6, personal communication).
Independence of occurrence was assumed for the different
age groups and different diseases when these incidence rates
were combined for the Bayesian analysis (as described in
Appendix D) to make sure that the estimate of severe gallstone
disease incidence in the total general population would be as
similar as possible to that in the astronaut corps. Incidences
provided in the study for ages 18 to 44 and 45 to 64 were
combined to estimate the incidence of severe gallstone disease
for a general population aged 18 to 64. It was assumed that the
distributions describing the two groups were independent. The
incidence rates for the three separate diseases determined in
this fashion were summed to provide an estimate of the total
severe gallstone disease incidence, again with the assumption
that the distributions were independent. This procedure was
repeated for men, women, and the total.

Appendix D provides the method used to combine incidence

repeated for men, women, and the total.

Appendix D provides the method used to combine incidence
rates with the assumption of statistical independence of the age
groups and conditions. Table 31 summarizes the incidence rates
in the general population that were determined via this procedure. The study provided 95-percent CIs for each incidence rate
that were combined in a fashion consistent with independent
distributions and were used to determine estimates for the
standard error of the general population incidence rates. These
standard error estimates were used to construct 90-percent CIs
for the incidence rates, which were used, in turn, to calculate the
EFs. Table 31 provides the calculated incidence rates for men,
women, and the total, along with the EFs. Appendix B,
Section B.5, summarizes the technique used to determine the EF
from the 95-percent CI provided in Reference 25.
Data concerning the incidence of severe gallstone disease in

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Gallstone cases in adults 18 to 64 years of age per 100 000 person-years(derived) | 76.9 | 126.6 | 101.7 |
| 90-percent confidence interval(CI) for gallstone disease occurrences(derived) | 76.1 to 77.6 | 125.6 to 127.5 | 101.2 to 102.3 |
| Gallstone incidence in adults 18 to 64 years of age,events/person-year | $7.69\\times10^{-4}$ | $1.27\\times10^{-3}$ | $1.02\\times10^{-3}$ |
| Error factor(EF) for gallstone incidence in adults 18 to 64 years of age | 1.01 | 1.01 | 1.01 |

Data concerning the incidence of severe gallstone disease in
the astronaut corps were obtained from the LSAH (Ref. 6,
personal communication), as summarized in Table 32. There
were no occurrences of severe gallstone disease in in-flight
astronauts, and there were no occurrences at any stage in
female astronauts. The three preflight occurrences of gallstone

* * *

TABLE 32.—INCIDENCE OF GALLSTONE DISEASE IN
PREFLIGHT AND IN-FLIGHT MISSION-READY,
ACTIVE MALE AND FEMALE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 1970.4 | 264.8 | 2235.2 |
| Gallstone cases | 3 | 0 | 3 |
| Gallstone incidence rate，$\\lambda\_{\\mathrm{astronaut}}$ events per person-year | $1.52\\times 10^{-3}$ | 0 | $1.34\\times 10^{-3}$ |
| In-flight astronauts |  |  |  |
| Total person-years | 32.0 | 6.5 | 38.5 |
| Gallstone cases | 0 | 0 | 0 |
| Gallstone incidence rate，$\\lambda\_{\\mathrm{astronaut}}$ events per person-year | 0 | 0 | 0 |

\\lambda\_{\\mathrm{a s t r o n a u t}},

1.52!\\times!10^{-3}

1.34!\\times!10^{-3}

\\lambda\_{\\mathrm{a s t r o n a u t}},

disease in men were all 3 to 6 years preflight. Table 32 shows
the preflight and in-flight incidence rates.

The following steps were taken with WinBUGS to obtain a
first-order estimate of the incident rate of gallstone disease in
the astronaut corps. The analysis combined information from
the Canadian general population with available information on
gallstone incidence in astronauts. Informed lognormal priors
for the incidence rate of gallstone disease in the general
population was determined from information in Urbach et al.
(Ref. 25), as described in Appendix D. Step 1 of the Bayesian
analysis used this prior to update the LSAH preflight data on
gallstone disease incidence in astronauts. This resulted in
posterior results describing the incidence rate in preflight
astronauts. The posterior results were used as priors for the
second step, which updated the LSAH data for gallstone
disease incidence in in-flight astronauts. The result was a firstorder estimate of the incidence rate of severe gallstone disease
in astronauts on a long-duration exploration-class mission.
This procedure was performed three times, once each for
male, female, and total astronauts. In each Bayesian update,
75 000 update steps were used. Appendix C provides the code
used in WinBUGS, and an outline of the input data used in
each step follows.
Step 1: For males, females, and the total, the general popu-

2.8.2 Bayesian Updates To Improve Estimates of
Gallstone Incidence Rates, and Analysis Results

each step follows.
Step 1: For males, females, and the total, the general population incidence rates and EFs were used to inform the
lognormal priors in WinBUGS. The LSAH preflight data that
were updated included the number of gallstone disease cases
and the recorded number of person-years for each population.
Table 33 shows the gallstone incidence rates for preflight
astronauts and provides the posterior results from this step: the
incidence of gallstone disease in male, female, and total
preflight astronauts.
Step 2: The posterior results from Step 1—the means and the

TABLE 33.—RESULTS OF BAYESIAN ANALYSIS
FOR GALLSTONE DISEASE IN PREFLIGHT
MISSION-READY, ACTIVE ASTRONAUTS
Gallstone incidence rate, λ, events per person-year

1.01!\\times!10^{-3}

1.27!\\times!10^{-3}

\\lambda\_{\\mathrm{a s t r o n a u t}},

| Gallstone incidence rate, $\\lambda\_{\\mathrm{a}\_{\\mathrm{astronaut}}}$, events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | $7.69\\times 10^{-4}$ | $1.27\\times 10^{-3}$ | $1.02\\times 10^{-3}$ |
| Standard deviation | $4.65\\times 10^{-6}$ | $7.64\\times 10^{-6}$ | $6.12\\times 10^{-6}$ |
| 5 percent | $7.62\\times 10^{-4}$ | $1.25\\times 10^{-3}$ | $1.01\\times 10^{-3}$ |
| 95 percent | $7.77\\times 10^{-4}$ | $1.28\\times 10^{-3}$ | $1.03\\times 10^{-3}$ |

1.25!\\times!10^{-3}

7.64!\\times!10^{-6}

1.28!\\times!10^{-3}

7.69!\\times!10^{-4}

TABLE 34.—RESULTS OF BAYESIAN ANALYSIS FOR
GALLSTONE DISEASE IN IN-FLIGHT ASTRONAUTS
Gallstone incidence rate, λ, events per person-year

6.18!\\times!10^{-6}

\\lambda\_{\\mathrm{a s t r o n a l t}},

| Gallstone incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 7.69×10-4 | 1.27×10-3 | 1.02×10-3 |
| Standard deviation | 4.65×10-6 | 7.68×10-6 | 6.18×10-6 |
| 5 percent | 7.62×10-4 | 1.25×10-3 | 1.01×10-3 |
| 95 percent | 7.77×10-4 | 1.28×10-3 | 1.03×10-3 |

1.27!{\\times}!10^{-3}

1.01!\\times!10^{-3}

4.65!{\\times}!10^{-6}

1.25!\\times!10^{-3}

1.03!\\times!10^{-3}

1.28!\\times!10^{-3}

(Table 32). This Bayesian update resulted in probability
distributions for the incidence of gallstone disease in male,
female, and total astronauts during spaceflight (Table 34).

2.8.3 Discussion

2.8.3 Discussion
Like the other analyses presented in this study, this analysis is
limited because it assumes a constant incidence rate for gallstone disease without accounting for physiological and environmental risk factors. Future analyses should consider
important risk factors, including age, obesity, and diet. In
addition, assumptions of independence were made to compute a
general gallstone disease incidence rate from the diseasespecific rates obtained from the literature, but the incidence
rates for different conditions and age groups might not be
wholly independent. Furthermore, this analysis uses the
combined incidence rates of three severe complications of
gallstone disease as an estimate of the incidence rate for total
gallstone disease, but these three conditions alone may not
provide a sufficiently broad consideration of the complications
of gallstone disease. This is evident in the fact that the incidence
rate of gallstone disease in the in-flight male astronauts
–3
(1.52×10 events/person-year) is almost twice that of the
–4
general male population (7.69×10 events/person-year in
Ref. 25)—a counterintuitive result. In addition, minor differences may exist between the diets and lifestyles of the Ontario
population used and the U.S. astronaut population (Ref. 25).
However, both populations are from well-developed, industrial
countries in similar North American temperate regions.

Accordingly, for the present analysis it was assumed that the
diets are similar to a high degree. Incorporation of additional
possible complications or related conditions might improve this
estimate. Any use of these results must account for these limitations, but this analysis is “a reasonable estimate” of the
incidence rate of gallstone-related diseases in astronauts.

(7.69{\\times}10^{-4}

* * *

The accuracy of this analysis could be improved if more
data relating to the risk factors for and the physiology of
gallstone formation and related complications were incorporated. The current results can serve as a baseline for future
gallstone disease predictions.

2.9 Herpes Zoster

The first infection of the varicella-zoster virus results in
chicken pox. Reactivation of this virus in the cranial nerve or
the dorsal root ganglia results in a painful rash known as
herpes zoster (HZ) (Ref. 26)—a skin disease more commonly
known as shingles. The cause for reactivation is unknown, but
higher incidence rates are found for the elderly, and reactivation is generally associated with a weakened immune sys-
tem (Ref. 26). Because the virus lives in the nerve, HZ is
extremely painful. The probability of HZ incidences must be
calculated to ensure that enough medications are supplied for
any and all shingles outbreaks during a space mission. The
general population data used in this calculation must roughly
match the age of active astronauts because HZ reactivation
rates increase exponentially with age. The general population
data used came from a 2005 article in the Journal of General
Internal Medicine (Ref. 26). A Bayesian update was use to
combine these data with HZ incidence data from the astronaut
corps to yield a probability distribution describing the average
HZ incidence rate in astronauts.

2.9.1 Data and Methods

For the general population data, Reference 26 pulled HZ
incidence rates from the Medstat MarketScan database, which

2001. Incidences of HZ were defined by the 9th revision of the
      ICD. Data included the number of HZ cases per the number of
      person-years for males, females, and the total who were 40 to
      49 years of age. These data were simplified to incidences per
      person-year for males, females, and the total. The 95-percent
      CI per 1000 person-years also is given for males, females, and
      the total for ages 40 to 49. These intervals were converted into
      the EFs for males, females, and the total. Appendix B, Section B.6, shows the steps for these conversions, and Table 35
      shows the average HZ incidence per person-year for males,
      females, and the total, along with the corresponding EFs.
      The LSAH supplied data that describe the incidence of HZ

The LSAH supplied data that describe the incidence of HZ
and the number of person-years for preflight and in-flight
male, female, and total astronauts (Table 36 and Refs. 27
and 28, personal communications).

2.9.2 Bayesian Updates To Improve Estimates of Herpes
Zoster Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of HZ in astronauts and
provide an approximation suitable for the IMM effort. The
first step was to perform a Bayesian update on the preflight
astronaut data for HZ incidence with the general population
data from Reference 26. An update was performed for males,
females, and the total. The posterior results from this step
describe the incidence rate of HZ in preflight astronauts.

The means and the 5th and 95th percentiles from this first
step then served as the priors for the second step and were
used to perform a Bayesian update on the in-flight astronaut
data. The update yielded the incidence rates of HZ in in-flight

TABLE 35.—INCIDENCE OF HERPES ZOSTER (HZ) IN U.S. ADULTS FROM 2000 TO 2001
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| HZ cases in adults 40 to 49 years of age | 473 | 740 | 1213 |
| Number of person-years in the study | 190653 | 228677 | 419330 |
| 95-percent confidence interval (CI) for HZ incidence in adults 40 to 49 years of age per 1000 person-years | 2.3 to 2.8 | 3.0 to 3.5 | 2.7 to 3.0 |
| HZ incidence rate in adults 40 to 49 years of age per person-year | $2.5\\times10^{-3}$ | $3.2\\times10^{-3}$ | $2.9\\times10^{-3}$ |
| Error factor(EF) for HZ incidence in adults 40 to 49 years of age | 1.09 | 1.07 | 1.04 |

TABLE 36.—INCIDENCE OF HERPES ZOSTER (HZ) IN PREFLIGHT AND
IN-FLIGHT MISSION-READY, ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 1985.9 | 273.1 | 2259.0 |
| HZ cases | 8 | 0 | 8 |
| HZ incidence rate, events per person-year | $4.0\\times10^{-3}$ | 0 | $3.5\\times10^{-3}$ |
| In-flight astronauts |  |  |  |
| Total person-years | 32.5 | 6.5 | 39.0 |
| HZ cases | 1 | 0 | 1 |
| HZ incidence rate, events per person-year | $3.08\\times10^{-3}$ | 0 | $2.56\\times10^{-3}$ |

* * *

TABLE 37.—RESULTS OF BAYESIAN ANALYSIS FOR
HERPES ZOSTER (HZ) IN PREFLIGHT MISSION-READY,
ACTIVE MALE, FEMALE, AND TOTAL ASTRONAUTS
HZ incidence rate, λ, events per person-year

| HZ incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 2.50×10-3 | 3.23×10-3 | 2.90×10-3 |
| Standard deviation | 1.31×10-4 | 1.33×10-4 | 6.91×10-5 |
| 5 percent | 2.29×10-3 | 3.02×10-3 | 2.78×10-3 |
| 95 percent | 2.72×10-3 | 3.45×10-3 | 3.01×10-3 |

\\lambda\_{\\mathrm{a s t r o n a u t}},

2.50!\\times!10^{-3}

3.23!\\times!10^{-3}

1.31!\\times!10^{-4}

2.90!\\times!10^{-3}

1.33!\\times!10^{-4}

2.29!\\times!10^{-3}

6.91!\\times!10^{-5}

3.02!\\times!10^{-3}

2.78!\\times!10^{-3}

2.72!\\times!10^{-3}

3.45!\\times!10^{-3}

3.01!\\times!10^{-3}

TABLE 38.—RESULTS OF BAYESIAN ANALYSIS
FOR HERPES ZOSTER IN IN-FLIGHT MALE,
FEMALE, AND TOTAL ASTRONAUTS
Herpes incidence rate, λ, events per person-year

| Herpes incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 2.51×10-3 | 3.23×10-3 | 2.90×10-3 |
| Standard deviation | 1.31×10-4 | 1.30×10-4 | 7.04×10-5 |
| 5 percent | 2.30×10-3 | 3.02×10-3 | 2.79×10-3 |
| 95 percent | 2.73×10-3 | 3.45×10-3 | 3.02×10-3 |

\\lambda\_{\\mathrm{a s t r o n a u t}}.

2.51!\\times!10^{-3}

3.23!\\times!10^{-3}

1.31!\\times!10^{-4}

1.30!\\times!10^{-4}

7.04!\\times!10^{-5}

2.30!\\times!10^{-3}

3.02!\\times!10^{-3}

2.79!\\times!10^{-3}

2.73!\\times!10^{-3}

3.45!\\times!10^{-3}

3.02!\\times!10^{-3}

astronauts. Appendix C provides the WinBUGS code used,
and an outline of the data for these steps follows.
Step 1: The general population HZ incidence per person-

Step 1: The general population HZ incidence per personyear for males, females, and the total and the corresponding
EFs used as the priors in this step came from Reference 26.
The LSAH data updated in this step included the number of
preflight person-years and HZ incidences for males, females,
and the total. Table 35 shows the incidence rates and the
corresponding EFs for the general population, and Table 36
shows the incidences for preflight astronauts. Table 37 shows
the posterior results: Poisson probability distributions for
males, females, and the total.
Step 2: The means and the 5th and 95th percentiles from the

Step 2: The means and the 5th and 95th percentiles from the
posterior results of Step 1 (Table 37) were used as the priors
for this step. Table 36 shows the LSAH data for in-flight
astronauts, and Table 38 shows the posterior results from
Step 2: the incidence of HZ in in-flight astronauts.

Understanding the limitation of assuming an average rate
for HZ incidence is necessary for the appropriate use of these
data. HZ incidence rate increases exponentially with age (the
rate for 50 to 59 year olds is double the rate for 40 to 49 year
olds). Therefore, capturing the ages closest to the astronaut
corps is imperative (Ref. 26). In spite of these limitations, this
analysis is a reasonable approximation of HZ incidence. These
data could also be used as a baseline for any future studies
relating to HZ.

2.9.3 Discussion

2.10 Renal Stones

Data from LSAH (Ref. 29, personal communication) and
the National Institutes of Health (NIH) (Ref. 30) were used to
estimate the probability of an astronaut developing a renal
stone during or after space flight. A Bayesian update was used
to combine information from these sources to estimate the
average rate of renal stone formation. This analysis uses only
data pertaining to renal stone occurrence, not data related to
blood or urine chemistry.

2.10.1 Data and Methods

The LSAH temporal distribution of renal stone formation
provided to the IMM team indicates that the assumptions that
(1) the rates (λ) of renal stone incidences are constant over the
period of interest and (2) the probability of occurrence follows
a Poisson distribution are probably erroneous. However, the
authors believe that these assumptions are currently the “best
approximation” on the basis of nonattributable data from
short-duration-mission (<20 days) participants. Only one data
point is available for renal stone incidence during longduration missions (~180 days) at this time.
Table 39 shows the general population incidence rate of

Table 39 shows the general population incidence rate of
renal stones from the NIH as of 2004 (Ref. 30). The incidence
of renal stones differed for males and females, but for this
analysis, the differences between males and females were not
considered, and the average incidence rate of renal stones of
–3
1.8×10 was used. An EF of 2.236 was found by taking the
square root of the ratio 3 to 0.6.

The LSAH data for the astronaut population at Johnson

1.8{\\times}10^{-3}

The LSAH data for the astronaut population at Johnson
were of interest because renal stone incidence is geographically dependent because of dietary habits, lifestyle, and other
factors. The LSAH data were used to capture discrepancies
due to geography. Table 40 shows the renal stone incidence
data for this ground-based comparison population from
Pietrzyk et al. (Ref. 31).
There have been no incidences of renal stones in in-flight

Pietrzyk et al. (Ref. 31).
There have been no incidences of renal stones in in-flight
astronauts (Table 41 and Ref. 31). In Table 41, the total
number of person-years reported includes the timeframe for
in-flight data.

TABLE 39.—INCIDENCE OF RENAL STONES IN
THE U.S. GENERAL POPULATION AS OF 2004
Statistic Males Females

1.8{times}0^{-3}

| Statistic | Males | Females |
| --- | --- | --- |
| Renal stone cases, events per 1000 person-years | 1 to 3 | 0.6 to 1 |
| Mean number of events per 1000 person-years......1.8 |  |  |
| Renal stone incidence rate, events per person-year......$1.8\\times10^{-3}$ |  |  |

* * *

TABLE 40.—INCIDENCE OF RENAL STONES IN THE
ANALOG ASTRONAUT POPULATION
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Number of participants............................................................. 927

| Number of participants | 927 |
| --- | --- |
| Renal stone cases | 74 |
| Number of person-years | 17740.8 |
| Renal stone incidence rate, events per person-year | $4.2\\times10^{-3}$ |

{4.2\\times\\o10^^{-3}}

TABLE 41.—INCIDENCE OF RENAL STONES
IN IN-FLIGHT ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Renal stone cases.......................................................................... 0

| Renal stone cases | 0 |
| --- | --- |
| Number of person-years | 25.1 |
| Renal stone incidence rate, events per person-year | 0 |

The following steps were taken with WinBUGS to improve
the estimate of the renal stone incidence rate for astronauts
and provide a first-order approximation suitable for the IMM
effort. One Bayesian update was performed without distinguishing between data for males and females. The data from
the NIH (Ref. 30) were used to form an informed lognormal
conjugate prior for the incidence rate of renal stones in the
general U.S. population (λgeneral). This prior was used to update
the LSAH astronaut data in Step 1 of the Bayesian implementation, yielding a posterior result for the updated incidence rate
of renal stones. In Step 2, the posterior result of Step 1 was
used as the prior to update the LSAH in-flight astronaut data
in WinBUGS. The result was an estimation of the incidence
rate of renal stone formation in astronauts during an exploration mission. Appendix C provides the code used in
WinBUGS as well as the sampling procedure.
Step 1: WinBUGS was informed with the mean incidence

2.10.2 Bayesian Updates To Improve Estimates of Renal
Stone Incidence Rates, and Analysis Results

(\\up\_{\\mathrm{g e n e r a l}})

Step 3: The posterior result of Step 2—the mean incidence
rate (Table 42) was dissected and used as the prior for the
second update. The 5th and 95th percentiles from the lognormal Poisson distribution in Step 2 (Table 43) were used to
calculate the EF.
Step 4: A second Bayesian update was performed with

4.58!{\\times}!10^{-4}

This process returned an estimate of the incidence rate of
renal stone formation in in-flight astronauts with respect to the
general population and the LSAH analog population (Table 43).
This can be used as the input rate to a Poisson distribution to
estimate the probability of a renal stone occurrence.

3.97!{\\times}!10^{-3}

3.24!\\times!10^{-3}

TABLE 42.—RESULTS OF BAYESIAN ANALYSIS
FOR RENAL STONES IN THE ANALOG
ASTRONAUT POPULATION
Renal stone incidence rate, λ, events per person-year

| Renal stone incidence rate，λanalog，events per person-year |  |
| --- | --- |
| Mean | 3.97×10-3 |
| Standard deviation | 4.58×10-4 |
| 5 percent | 3.24×10-3 |
| 95 percent | 4.74×10-3 |

\\lambda\_{\\mathrm{a n a l o g}},

4.74!\\times!10^{-3}

TABLE 43.—RESULTS OF BAYESIAN ANALYSIS
FOR RENAL STONES IN IN-FLIGHT
ASTRONAUTS (ESTIMATE)
Renal stone incidence rate, λ, events per person-year

3.96!\\times!10^{-3}

3.25!\\times!10^{-3}

4.60!\\times!10^{-4}

\\lambda\_{\\mathrm{a s t r o n a u t}};

4.76!\\times!10^{-3}

| Renal stone incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 3.96×10-3 |
| Standard deviation | 4.60×10-4 |
| 5 percent | 3.25×10-3 |
| 95 percent | 4.76×10-3 |

This analysis should be considered limited in that it assumes
an average incidence rate of renal stones, irrespective of the
renal stone type or environmental conditions. The results are a
reasonable representation of the renal stone incidence rate
given the data available and the assumptions made during
construction of the estimate.
More accurate estimates could be made with further analy-

2.10.3 Discussion

Because a seizure may greatly affect crewmember performance, health, and morale, evaluating the probability that an
astronaut may experience a seizure during an exploration
mission was deemed to be necessary. A seizure is a major
disruption of electrical signaling between neurons in the brain,
and epilepsy is a disorder characterized by the recurrence of
seizures. In normal brain function, neurons communicate with
other neurons, glands, and muscles via electrochemical
impulses. These neuronal impulses propagate along the axon,
initiating the release of neurotransmitters that flow across the
synaptic cleft to the dendrites of an adjacent cell. A balance
between excitatory and inhibitory neurotransmitters controls
the firing of electrical impulses. When excitatory neurotransmitters exceed the threshold, an action potential results. A
seizure is an episode of continual and uncontrolled neuronal
firing causing convulsions, muscle contractions, and unconsciousness. Seizures may be triggered by head trauma, physical

2.11 Seizure and emotional stress, fatigue, and external stimuli. However,
most cases of seizure are idiopathic (Ref. 32). Data from the
general population (Ref. 33) and astronaut data from the
LSAH (Ref. 6, personal communication) were used to estimate the probability of an astronaut experiencing a seizure. A
Bayesian update was used to combine the incidence rates of
seizure from these sources to yield an appropriate incidence
rate of seizure. The rate was assumed to be constant, and a
Poisson probability distribution was assumed to govern the
probability of seizure.

2.11.1 Data and Methods

General population data for the incidence rate of a first
unprovoked (idiopathic) seizure were obtained from a

Rochester, Minnesota, epidemiologic project (Ref. 33). A
seizure was defined as an abnormal and excessive discharge of
a set of neurons in the brain. In this study, incidence rates of
epilepsy and of all unprovoked seizures were considered. An
idiopathic seizure is one that occurs without an identified
cause. Of all seizures, 61 to 66 percent are idiopathic and 23 to
35 percent are generalized tonic-clonic (Refs. 33 and 34). The
incidence per 100 000 person-years of a first unprovoked
seizure in adults 40 to 54 years of age was slightly higher in
males (29) than in females (25). For this estimate, the incidence rate of seizures in males and females was averaged as
shown in Table 44. Because there is not a significant variation
in the incidence of seizure between males and females, the
average incidence rate was considered appropriate. The incidence of seizure is related to age—incidence rates were high
for infants younger than 1 year and highest for persons older
than 75 years of age. CI information was not available for a
first unprovoked seizure. Therefore, the EF was estimated
from the 90th-percentile CI constructed from total population
data for epilepsy. A person experiencing a single unprovoked
seizure was not diagnosed with epilepsy and thus was not
included in the CI data. The incidence rate of a first unprovoked seizure was 33 percent higher than the incidence rate of
epilepsy, primarily because individuals who experienced only
one unprovoked seizure were added. Data for this estimate
were averaged from three age ranges: 40 to 44, 45 to 49, and
50 to 54, yielding an average age of 47 years. The EF was
estimated to be 1.19 from a 90th-percentile CI constructed
from male and female data from a population aged 40 to
54 years (see Appendix B, Section B.7).
Data for the incidence of seizure in the astronaut corps were
obtained from the LSAH (Ref. 6, personal communication),

TABLE 44.—INCIDENCE OF TOTAL SEIZURES IN THE
GENERAL POPULATION AGED 40 TO 54 YEARS IN
ROCHESTER, MINNESOTA, FROM 1935 TO 1984
Average incidence per 100 000 person-years......................... 27

TABLE 45.—INCIDENCE OF SEIZURES IN PREFLIGHT
AND IN-FLIGHT MISSION-READY, ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

2.7!\\times!10^{-4}

54 years (see Appendix B, Section B.7).
Data for the incidence of seizure in the astronaut corps were
obtained from the LSAH (Ref. 6, personal communication),
and are summarized in Table 45. There were no occurrences
of seizure in in-flight astronauts.

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 1970.4 | 264.8 | 2235.2 |
| Seizure cases | 0 | 0 | 0 |
| Seizure incidence rate, events per person-year | 0 | 0 | 0 |
| In-flight astronauts |  |  |  |
| Total person-years | 32.0 | 6.6 | 38.6 |
| Seizure cases | 0 | 0 | 0 |
| Seizure incidence rate, events per person-year | 0 | 0 | 0 |

TABLE 46.—RESULTS OF BAYESIAN ANALYSIS
FOR SEIZURES IN TOTAL PREFLIGHT MISSION-
READY, ACTIVE ASTRONAUTS
Seizure incidence rate, λ, events per person-year

2.68!\\times!10^{4}

2.84!\\times!10^{\ 5}

2.67!\\times!10^{4}

| Seizure incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | $2.68\\times10^{-4}$ |
| Standard deviation | $2.84\\times10^{-5}$ |
| 5 percent | $2.24\\times10^{-4}$ |
| Median | $2.67\\times10^{-4}$ |
| 95 percent | $3.17\\times10^{-4}$ |

\\lambda\_{\\mathrm{a s t r o n a u t}};

3.17!\\times!10^{4}

2.11.2 Bayesian Updates To Improve Estimates of
Seizure Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence rate of seizure in the astronaut
corps and provide a first-order approximation suitable for the
IMM effort. The general population data (Ref. 33) were used
to determine an informed lognormal conjugate prior for the
incidence rate of seizure in the general U.S. population
(λgeneral). This prior was used to update LSAH preflight data in
Step 1 of the Bayesian implementation, yielding a posterior
result of the updated incidence rate of seizure. In Step 2, the
posterior result of Step 1 was used as the prior and was
updated with LSAH in-flight data in WinBUGS. The result
was an estimation of the incidence rate of seizure in astronauts
during an exploration mission. Appendix C contains the code
used in WinBUGS as well as the sampling procedure.
Step 1: WinBUGS was informed with the mean incidence

Step 1: WinBUGS was informed with the mean incidence
rate of the general population from Table 44 and the EF.
Step 2: A Bayesian update was performed with 75 000

Step 2: A Bayesian update was performed with 75 000
Monte Carlo samples on the input parameters of Step 1: the
number of events and person-years for preflight astronauts
from LSAH (Table 45).
Step 3: The posterior result of Step 2—the mean incidence

(\\upl\_\\mathrm{g e n e r a l})

Step 4: A second Bayesian update was performed with
75 000 Monte Carlo samples on the input parameters of
Step 1: the number of events and person-years for in-flight
astronauts (Table 45). Appendix C provides details.

* * *

TABLE 47.—RESULTS OF BAYESIAN ANALYSIS
FOR SEIZURES IN TOTAL IN-FLIGHT
ASTRONAUTS
Seizure incidence rate, λ, events per person-year

| Seizure incidence rate，λastronaut，events per person-year |  |
| --- | --- |
| Mean | 2.70×10-4 |
| Standard deviation | 2.88×10-5 |
| 5 percent | 2.25×10-4 |
| Median | 2.68×10-4 |
| 95 percent | 3.19×10-4 |

\\lambda\_{\\mathrm{a s t r o n a u t}},

2.70!10^{-4}

2.88!\\times!10^{\ 5}

2.25!\\times!10^{-4}

2.68!\\times!10^{-4}

3.19!\\times!10^{4}

2.11.3 Discussion

This analysis is limited in that it assumes an average incidence rate of seizure irrespective of the environmental
conditions and the cause of seizure. In addition, the EF was
calculated with epilepsy data, not unprovoked seizure data,
because Reference 33 did not have CI data on the first unprovoked seizure. Also, data regarding repeated occurrences of
seizures could influence the predicted rate of incidence
because it is known that having a single seizure greatly
increases the likelihood of subsequent seizures. The results
should be used with an understanding of these limitations.
However, these results probably give a reasonable representation of the incidence rate of seizures given the data available
and the assumptions made when the estimate was constructed.
More accurate estimates could be made with further analy-

Because a stroke may greatly affect crewmember performance and health, evaluating the probability that an astronaut
may experience a stroke during an exploration mission was
deemed to be necessary. The most common type of stroke is
ischemic stroke (also referred to as a cerebral infarction)
(Ref. 35), where blood flow to the brain is blocked by blood
clots and/or by fatty deposits called plaque in the blood vessel
linings. According to the Centers for Disease Control (CDC),
about 85 percent of all strokes are ischemic (Ref. 35). This
analysis only used data pertaining to stroke incidence for ages
similar to those of mission-ready astronauts, not data related to
blood pressure or other physiological conditions. A Bayesian
update was used to combine the incidence rates of stroke from
the LSAH (Ref. 36, personal communication) and the general
U.S. population (Ref. 37) to estimate the average rate of stroke.

As of 2010, the American Heart Association (Ref. 37) gave
the incidence rate of ischemic stroke in U.S. residents 45 to
54 years of age as 1.1 to 2.7 per 1000 person-years for males
and 0.7 to 2.2 per 1000 person–years for females.
Reference 37 considers the higher incidence rates for black

2.12.1 Data and Methods

2.12 Stroke

and 0.7 to 2.2 per 1000 person–years for females.
Reference 37 considers the higher incidence rates for black
men and women (2.7 and 2.2, respectively) to be unreliable,
although a rationale for this view is not specified. The lower
incidence rate data are for white men and women (1.1 and 0.7,
respectively). This Bayesian calculation only includes the data
for whites (see Table 48), although data for black men and
women were used in calculating the EFs: males, 1.567;
females, 1.773; and total, 1.254. Data from this publication
indicate that the prevalence of stroke among Hispanics and
Latinos is higher than among whites but smaller than among
blacks (Ref. 37).
As of 2007 there were 101 astronauts that were mission

As of 2007 there were 101 astronauts that were mission
ready (20 females and 81 males). The LSAH data were given
for males and females, so data for white males, females, and
the total were used for the general population calculation. For
this analysis, gender, age, ethnicity, and type of stroke—
ischemic—were simplified and assumed to be lognormal, as
shown in Table 48.
Data received from LSAH (Ref. 36, personal communica-

Data received from LSAH (Ref. 36, personal communication) are given in Table 49. Of the two incidents of preflight
stroke, one occurred 0 to 3 years prior to flight and one
occurred 3 to 6 years prior to flight. The fact that there were
no strokes recorded for female astronauts may negate the
assumption of an average incidence rate for the entire period
of interest.

TABLE 48.—INCIDENCE OF STROKE IN U.S. ADULTS
45 TO 54 YEARS OF AGE
Statistic Males Females Total

5.24!\\times!10^{-4}

TABLE 49.—INCIDENCE OF STROKE IN PREFLIGHT AND
IN-FLIGHT MISSION-READY, ACTIVE ASTRONAUTS
\[From Lifetime Surveillance of Astronaut Health (LSAH).\]
Statistic Males Females Total

5.75!\\times!10^{-4}

| Statistic | Males | Females | Total |
| --- | --- | --- | --- |
| Preflight astronauts |  |  |  |
| Total person-years | 3478.6 | 336.8 | 3815.4 |
| Stroke cases | 2 | 0 | 2 |
| Stroke incidence rate, events per person-year | $5.75\\times10^{-4}$ | 0 | $5.24\\times10^{-4}$ |
| In-flight astronauts |  |  |  |
| Total person-years | 31.8 | 6.5 | 38.3 |
| Stroke cases | 0 | 0 | 0 |
| Stroke incidence rate, events per person-year | 0 | 0 | 0 |

* * *

2.12.2 Bayesian Updates To Improve Estimates of Stroke
Incidence Rates, and Analysis Results

The following steps were taken with WinBUGS to improve
the estimate of the incidence of stroke in astronauts and provide a first-order approximation suitable for the IMM effort.
Two steps and Bayesian updates were performed. The first step
used the general population data (Ref. 37) as a prior to update
the LSAH preflight data (Ref. 36, personal communication).
This step was performed three times, once each for males,
females, and the total. The posterior results from this step
describe the stroke incidence rates for preflight astronauts. In
the second step, the data from these posterior results, namely
the means and the 5th and 95th percentiles, were used as the
priors to update the in-flight astronaut data for females, males,
and the total. Ultimately, six probability distributions were
found describing the stroke incidence rate for preflight and
in-flight male, female, and total astronauts. Appendix C
provides the code used in WinBUGS, and an outline of the
input data for each step follows.
Step 1: The stroke incidence per person-year for the general

input data for each step follows.
Step 1: The stroke incidence per person-year for the general
U.S. population for females, males, and the total and the EFs
were used as the priors in WinBUGS to update the LSAH data
(Table 49) for the number of stroke cases and person-years for
males, females, and the total. Table 50 provides the posterior
results from this step.
Step 2: A Bayesian update was performed with the posterior

Step 2: A Bayesian update was performed with the posterior
results from Step 1—the means and the 5th and 95th percentiles (Table 50) to update the LSAH in-flight astronaut data
(Table 49). The result was a probability distribution for the
stroke incidence rate in in-flight astronauts (Table 51).

TABLE 50.—RESULTS OF BAYESIAN ANALYSIS FOR
STROKE IN PREFLIGHT MISSION-READY, ACTIVE
MALE, FEMALE, AND TOTAL ASTRONAUTS
Stroke incidence rate, λ, events per person-year

| Stroke incidence rate,λastronaut,events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 9.81×10-4 | 6.80×10-4 | 8.78×10-4 |
| Standard deviation | 2.42×10-4 | 2.41×10-4 | 1.17×10-4 |
| 5 percent | 6.37×10-4 | 3.64×10-4 | 6.99×10-4 |
| Median | 9.54×10-4 | 6.42×10-4 | 8.70×10-4 |
| 95 percent | 1.4×10-3 | 1.1×10-3 | 1.1×10-3 |

\\underline{{\\lambda\_{\\mathrm{a s t r o n a u t}}}},

\\begin{array}{c}{{9.81!{\\times}10^{-4}}}\ {{2{.42}!{\\times}10^{-4}}}\\end{array}

6.80!\\times!10^{-4}

^begin{}{1.17\\times10^{-4}}\ {^{1.19\\times10^{-4}}}\\end{array}

2.41!\\times!10^{-4}

\\begin{array}{c}{{2.38!10^{-4}}}\ {{{}^{2.41!\\times!10^{-4}}}}\\end{array}

TABLE 51.—RESULTS OF BAYESIAN ANALYSIS FOR
STROKE IN IN-FLIGHT MALE, FEMALE,
AND TOTAL ASTRONAUTS
Stroke incidence rate, λastronaut, events per person-year

^{6.41\\times10^{-4}}{9{.}52\\times10^{-4}}

^begin{}{{}^{6.80{times}10^{-4}}}\ {{{}^{6.36{\\times}10^{-4}}}}\\end{array}

8.77\\times\\ensuremath{10^{-4}}

| Stroke incidence rate，λastronaut，events per person-year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Mean | 9.80×10-4 | 6.80×10-4 | 8.77×10-4 |
| Standard deviation | 2.38×10-4 | 2.36×10-4 | 1.22×10-4 |
| 5 percent | 6.41×10-4 | 3.71×10-4 | 6.93×10-4 |
| Median | 9.52×10-4 | 6.42×10-4 | 8.69×10-4 |
| 95 percent | 1.4×10-3 | 1.1×10-3 | 1.1×10-3 |

3.71!\\times!10^{-4}

\\underline{{\ 1.1!\\times!10^{-3}}}

^{1.22\\times10^{-4}}\_{infty4}

\\begin{array}{c}{{^.42!10!^{-4}}}\ {{^{6.42!\\times10^{-3}}}}\\end{array}

8.69!\\times!10^{-4}

8.70!{\\times}!10^{-4}

2.12.3 Discussion

This analysis is limited in that it assumes an average incidence rate of stroke, with little data regarding stroke type or
environmental conditions. Also, because the data for blacks in
the general population were considered to be unreliable, this
analysis only considered data from white males and females
from the general population. These results should be used with
a full understanding of these limitations. However, they are
reasonable representations of the incidence rate of stroke
given the data available and the assumptions made when the
estimate was constructed.
More accurate estimates could be made with further analy-

More accurate estimates could be made with further analysis of stroke incidence in post-flight astronauts and the
physiological data that pertain to stroke occurrence. If more
reliable data for the general U.S. population (specifically for
different ethnicities) becomes available in the future, this
analysis should be updated with that data. The current data
will serve as the baseline for future estimates.

Tables 52 and 53 summarize the results of the Bayesian
analyses for all medical events in preflight and in-flight
astronauts.
A review of the data for various medical events demon-

3.0 Discussion

astronauts.
A review of the data for various medical events demonstrates limitations that are common to all events. The analysis
of each medical condition assumes an average incidence rate
despite environmental effects and contributing physiological
factors. There are certainly discrepancies between the general
U.S. population, the U.S. Submarine Force, the analog
astronaut population at the NASA Johnson Space Center, and
the astronaut corps. The data reported in the literature for the
various medical events has inherent uncertainty and reliability
problems depending on the manner in which the study or
survey was conducted.
There are a host of factors that could improve the IMM

survey was conducted.
There are a host of factors that could improve the IMM
team’s ability to make more accurate estimates of the incidence rates, including incorporating biomedical parameters
into the model and having access to more precise data (in the
astronaut corps and in the general U.S. and submarine populations) related to age, ethnicity, gender, previous medical
conditions, existing lifestyle choices, and so on. Having age-,
ethnicity-, and gender-specific CI would greatly improve the
calculation of the total incidence rates. However, given that
these Bayesian analyses were performed to support the IMM
by providing input source data, the intrinsic nature of this
probabilistic model and its associated sensitivity analyses of
output data will also guide the need for future updates. As
components of IMM source input data, the incidence rate data
described herein will be subject to periodic review to ensure
that they are current and relevant as described in the IMM
Configuration Management Plan (Ref. 38).

* * *

TABLE 52.—RESULTS OF BAYESIAN ANALYSIS FOR ALL
MEDICAL EVENTS IN PREFLIGHT MISSION-READY,
ACTIVE MALE, FEMALE, AND TOTAL ASTRONAUTS
Medical event incidence rate, λ, events per year

| Medical event incidence rate, $\\lambda\_{\\mathrm{a astronaut}}$, events per year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Angina pectoris |  |  |  |
| Mean | $3.96\\times 10^{-4}$ | $3.65\\times 10^{-4}$ | N/A |
| Standard deviation | $9.38\\times 10^{-5}$ | $1.53\\times 10^{-4}$ | N/A |
| Appendicitis |  |  |  |
| Mean | N/A | N/A | $9.35\\times 10^{-4}$ |
| Standard deviation | N/A | N/A | $1.04\\times 10^{-4}$ |
| Atrial fibrillation(AF) |  |  |  |
| Mean | $6.29\\times 10^{-4}$ | $2.02\\times 10^{-4}$ | $4.43\\times 10^{-4}$ |
| Standard deviation | $1.51\\times 10^{-4}$ | $1.46\\times 10^{-4}$ | $9.39\\times 10^{-5}$ |
| Atrial flutter(AFL) |  |  |  |
| Mean | $7.05\\times 10^{-5}$ | $2.43\\times 10^{-5}$ | $4.77\\times 10^{-5}$ |
| Standard deviation | $6.71\\times 10^{-6}$ | $2.45\\times 10^{-6}$ | $3.04\\times 10^{-6}$ |
| Dental abscess |  |  |  |
| Mean | $8.26\\times 10^{-3}$ | N/A | N/A |
| Standard deviation | $1.80\\times 10^{-3}$ | N/A | N/A |
| Dental caries |  |  |  |
| Mean | $9.42\\times 10^{-3}$ | N/A | N/A |
| Standard deviation | $5.94\\times 10^{-4}$ | N/A | N/A |
| Dental periodontal disease |  |  |  |
| Mean | $1.10\\times 10^{-1}$ | N/A | N/A |
| Standard deviation | $1.52\\times 10^{-2}$ | N/A | N/A |
| Gallstone disease |  |  |  |
| Mean | $7.69\\times 10^{-4}$ | $1.27\\times 10^{-3}$ | $1.02\\times 10^{-3}$ |
| Standard deviation | $4.65\\times 10^{-6}$ | $7.64\\times 10^{-6}$ | $6.12\\times 10^{-6}$ |
| Herpes zoster(HZ) |  |  |  |
| Mean | $2.50\\times 10^{-3}$ | $3.23\\times 10^{-3}$ | $2.90\\times 10^{-3}$ |
| Standard deviation | $1.31\\times 10^{-4}$ | $1.33\\times 10^{-4}$ | $6.91\\times 10^{-5}$ |
| Renal stones |  |  |  |
| Mean | N/A | N/A | $3.97\\times 10^{-3}$ |
| Standard deviation | N/A | N/A | $4.58\\times 10^{-4}$ |
| Seizure |  |  |  |
| Mean | N/A | N/A | $2.68\\times 10^{-4}$ |
| Standard deviation | N/A | N/A | $2.84\\times 10^{-5}$ |
| Stroke |  |  |  |
| Mean | $9.81\\times 10^{-4}$ | $6.80\\times 10^{-4}$ | $8.78\\times 10^{-4}$ |
| Standard deviation | $2.42\\times 10^{-4}$ | $2.41\\times 10^{-4}$ | $1.17\\times 10^{-4}$ |

\\lambda\_{\\mathrm{a s t r o n a u t}},

\ overline{{396}times{10}^{-4}}

\ overline{3666\\times10^{-4}}

1.53!\\times!10^{-4}

1.04!\\times!10^{-4}

6.29!\\times!10^{-4}

2.02!\\times!10^{-4}

1.51!\\times!10^{-4}

1.46!\\times!10^{-4}

4.43!\\times!10^{-4}

\\overline{{7.05!\\times!10^{-5}}}

2.43!\\times!10^{-5}

9.39!\\times!10^{-5}

2.45!\\times!10^{-6}

6.71!\\times!10^{-6}

8.26!\\times!10^{-3}

1.80!\\times!10^{-3}

5.94!\\times!10^{-4}

\\overline{{9.42!\\times!10^{-3}}}

1.10!\\times!10^{-1}

1.52!{\\times}!10^{-2}

7.69!{\\times}!10^{-4}

1.27!\\times!10^{-3}

4.65!{\\times}!10^{-6}

7.64!\\times!10^{-6}

3.23!10!\ !\ \ \

\\overline{{4.42!\\times!10^{-4}}}

TABLE 53.—RESULTS OF BAYESIAN ANALYSIS FOR ALL
MEDICAL EVENTS IN IN-FLIGHT MALE, FEMALE,
AND TOTAL ASTRONAUTS

\\overline{{9.81!\\times!10^{-4}}}

1.33!\\times!10^{-4}

1.31!\\times!10^{-4}

3.97!\\times!10^{-3}

\ overline.{3.64\\times\\mathrm{10}^{-4}}

8.78!\\times!10^{-4}

\\lambda\_{\\mathrm{a s t r o n a u t}},

1.53!\\times!10^{-4}

9.36!\\times!10^{-5}

| Medical event incidence rate，$\\lambda\_{\\mathrm{a astronaut}}$，events per year |  |  |  |
| --- | --- | --- | --- |
| Statistic | Males | Females | Total |
| Angina pectoris |  |  |  |
| Mean | 3.95×10-4 | 3.64×10-4 | N/A |
| Standard deviation | 9.21×10-5 | 1.53×10-4 | N/A |
| Appendicitis |  |  |  |
| Mean | N/A | N/A | 9.34×10-4 |
| Standard deviation | N/A | N/A | 1.03×10-4 |
| Atrial fibrillation(AF) |  |  |  |
| Mean | 6.28×10-4 | 2.02×10-4 | 4.42×10-4 |
| Standard deviation | 1.52×10-4 | 9.99×10-6 | 9.36×10-5 |
| Atrial flutter(AFL) |  |  |  |
| Mean | 7.05×10-5 | 2.43×10-5 | 4.77×10-5 |
| Standard deviation | 6.74×10-6 | 2.42×10-6 | 3.04×10-6 |
| Dental abscess |  |  |  |
| Mean | 8.16×10-3 | N/A | N/A |
| Standard deviation | 1.80×10-3 | N/A | N/A |
| Dental caries |  |  |  |
| Mean | 9.41×10-3 | N/A | N/A |
| Standard deviation | 5.95×10-4 | N/A | N/A |
| Dental periodontal disease |  |  |  |
| Mean | 1.03×10-1 | N/A | N/A |
| Standard deviation | 1.41×10-2 | N/A | N/A |
| Gallstone disease |  |  |  |
| Mean | 7.69×10-4 | 1.27×10-3 | 1.02×10-3 |
| Standard deviation | 4.65×10-6 | 7.68×10-6 | 6.18×10-6 |
| Herpes zoster(HZ) |  |  |  |
| Mean | 2.51×10-3 | 3.23×10-3 | 2.90×10-3 |
| Standard deviation | 1.31×10-4 | 1.30×10-4 | 7.04×10-5 |
| Renal stones |  |  |  |
| Mean | N/A | N/A | 3.96×10-3 |
| Standard deviation | N/A | N/A | 4.60×10-4 |
| Seizure |  |  |  |
| Mean | N/A | N/A | 2.70×10-4 |
| Standard deviation | N/A | N/A | 2.88×10-5 |
| Stroke |  |  |  |
| Mean | 9.80×10-4 | 6.80×10-4 | 8.77×10-4 |
| Standard deviation | 2.38×10-4 | 2.36×10-4 | 1.22×10-4 |

6.91!\\times!10^{-5}

2.41!\\times!10^{-4}

2.84!\\times!10^{\ .}

\\overline{{4.77\\times10^{-5}}}

\\overline{{2.02\\times10^{-4}}}

3.04!\\times!10^{-6}

9.99!\\times!10^{-6}

1.52!\\times!10^{-4}

2.43!\\times!10^{-5}

6.74!{\\times}!10^{-6}

1.02!\\times!10^{-3}

\\overline{{8.16!\\times!10^{-3}}}

1.80!\\times!10^{-3}

5.95!\\times!10^{-4}

9.41!!\\times!10^{-3}

7.68!10^{-6}

2.90!\\times!10^{-3}

7.69!\\times!10^{-4}

4.65!{\\times}!10^{-6}

1.30!\\times!10^{-4}

3.23!1!\\times!10^{-3}

4.60!\\times!10^{-4}

\\overline{{3.96!\\times!10^{-3}}}

2.88\\times10^{5}

\\overline{{6.80\\times10^{-4}}}

2.36!\\times!10^{-4}

* * *

Appendix A.—Data from Lifetime Surveillance of Astronaut Health (LSAH)

Table 54 shows the data that were supplied by LSAH.

TABLE 54.—LIFETIME SURVEILLANCE OF ASTRONAUT HEALTH (LSAH) DATA
Preflight astronauts In-flight astronauts

| Preflight astronauts |  |  | In-flight astronauts |  |  |
| --- | --- | --- | --- | --- | --- |
| Statistic | Males | Females | Statistic | Males | Females |
| Angina pectoris |  |  |  |  |  |
| Total person-days | 719 196 | 96 669 | Total person-days | 11 680 | 2372.5 |
| Total person-years | 1970.4 | 264.8 | Total person-years | 32.0 | 6.5 |
| Angina cases | 0 | 0 | Angina cases | 0 | 0 |
| Appendicitis |  |  |  |  |  |
| Total person-days | 510 875 | 89 019 | Total person-days | 11 643.5 | 2336 |
| Total person-years | 1399.7 | 243.9 | Total person-years | 31.9 | 6.4 |
| Appendicitis cases | 2 | 0 | Appendicitis cases | 0 | 0 |
| Atrial fibrillation (AF) |  |  |  |  |  |
| Total person-days | 2 373 481 | 122 915 | Total person-days | 11 607 | 2372.5 |
| Total person-years | 6502.7 | 336.8 | Total person-years | 31.8 | 6.5 |
| AF cases | 4 | 0 | AF cases | 0 | 0 |
| Atrial flutter (AFL) |  |  |  |  |  |
| Total person-days | 2 373 481 | 122 915 | Total person-days | 11 607 | 2372.5 |
| Total person-years | 6502.7 | 336.8 | Total person-years | 31.8 | 6.5 |
| AFL cases | 0 | 0 | AFL cases | 0 | 0 |
| All dental problems studied |  |  |  |  |  |
| Total person-days | 173 450.6 | 43 855.2 | Total person-days | 11 643.5 | 2336 |
| Total person-years | 475.2 | 120.2 | Total person-years | 31.9 | 6.4 |
| Caries cases | 168 | 24 | Caries cases | 0 | 0 |
| Abscess cases | 19 | 1 | Abscess cases | 0 | 0 |
| Periodontal disease cases | 56 | 9 | Periodontal disease cases | 0 | 0 |
| Gallstone disease |  |  |  |  |  |
| Total person-days | 719 196 | 96 669 | Total person-days | 11 680 | 2372.5 |
| Total person-years | 1970.4 | 264.8 | Total person-years | 32.0 | 6.5 |
| Gallstone cases | 3 | 0 | Gallstone cases | 0 | 0 |
| Herpes zoster(HZ) |  |  |  |  |  |
| Total person-days | 724 861 | 99 684 | Total person-days | 11 862.5 | 2372.5 |
| Total person-years | 1985.9 | 273.1 | Total person-years | 32.5 | 6.5 |
| HZ cases | 8 | 0 | HZ cases | 1 | 0 |
| Renal stonesa |  |  |  |  |  |
| Total person-days | N/A | N/A | Total person-days |  | 9161.5 |
| Total person-years | N/A | N/A | Total person-years |  | 25.1 |
| Renal stone cases | N/A | N/A | Renal stone cases |  | 0 |
| Seizure |  |  |  |  |  |
| Total person-days | 719 196 | 96 669 | Total person-days | 11 680 | 2372.5 |
| Total person-years | 1970.4 | 264.8 | Total person-years | 32.0 | 6.5 |
| Seizure cases | 0 | 0 | Seizure cases | 0 | 0 |
| Stroke |  |  |  |  |  |
| Total person-days | 1 269 681 | 12 2915 | Total person-days | 11 607 | 2372.5 |
| Total person-years | 3478.6 | 336.8 | Total person-years | 31.8 | 6.5 |
| Stroke cases | 2 | 0 | Stroke cases | 0 | 0 |

a
Totals only—no breakdown by males and females.

* * *

* * *

Appendix B.—Calculating Error Factor From 95-Percent Confidence Intervals

For general population data to be applicable to these
Bayesian updates, the error factor (EF) for each data set had to
be found. Although no data in this study gave the EF, some
data gave the standard deviation, leading to an easy conversion to the EF. However, many times the standard deviation
was not given, so the EF had to be calculated using the
95-percent confidence interval (CI). The general steps involved converting the 95-percent CI into a 90-percent CI.
From the 90-percent CI, the 95th and 5th percentiles were
found and then used in a simple equation to calculate the EF.
The specific calculation steps for each medical event varied.
These steps are shown in Sections B.1 to B.7.

B.1 Angina Pectoris

The following steps were used to obtain the EF for the
angina data:

(1) The 95-percent CI width was used to find the standard
deviation σ from Equation (B1) from Lapin’s book
(Ref. 39):

\\odot=\\frac{\\sqrt{n}\\left(\\mathrm{w i d t h} _{9\ \ !9!}\\right)}{z_{\\alpha/2}}

(B1)

where zα/2is 1.96 for the 95-percent CI, n is the number
of participants, and width95%is 1.2 for males and 0.55
for females.
(2) Next, Equation (B1) and σ were used to find the

Z\_{\\alpha/2}

z\_{\\mathrm{a//2}}\\times\\frac{\\odot}{\\sqrt{n}}\ \ \ =\\bf{w i d t h}\_{90^{9}}\

where zα/2= 1.64 for the 90-percent CI. The 90-percent
CI width was calculated as 1.00 for males and 0.46 for
females.
(3) Then, the 95th percentile was found by adding the

z\_{022}11

E F={\\sqrt{\\frac{95\\mathrm{t h}}{5\\mathrm{t h}}}}

(3) Then, the 95th percentile was found by adding the
90-percent CI width to the mean, and the 5th percentile
was found by subtracting the 90-percent CI width from
the mean.

B.2 Atrial Fibrillation

(4) Finally Equation (B3) was used to find EF:

The following steps were used to obtain the EF for atrial
fibrillation (AF) data:

(1) The 95-percent CI width was used to find σ from
Equation (B1), where zα/2is 1.96 and width95% is 0.32
for males, 0.2 for females, and 0.18 for the total.
Next Equation (B1) and σ were used to find the
90-percent CI width—resulting in Equation (B2),
where zα/2 = 1.64 for the 90-percent CI.
(2) Then, the 95th percentile was found by adding the

α/2
(2) Then, the 95th percentile was found by adding the
90-percent CI width to the mean, and the 5th percentile
was found by subtracting the 90-percent CI width from
the mean.
(3) Finally, Equation (B3) was used to find EF.

z\_{\\omega/2}=1.64

(3) Finally, Equation (B3) was used to find EF.

With the atrial flutter (AFL) data, additional steps had to be
taken prior to converting the 95-percent CI into the 90-percent
CI. The CIs were too wide to be applied directly to the rates of
AFL for adults under 50 years of age because doing so would
have created negative values for the 5th and 2.5th percentile.
A proportion was set up to counter this problem. The proportion was between the number of cases for adults under
50 years of age and the number of cases for all ages. It was set
equal to the proportion of the unknown 95-percent CI width x
for adults under 50 years of age and the known 95-percent CI
width for all ages. An example of the calculation for the
95-percent CI for men under 50 years of age follows:

B.3 Atrial Flutter

\\begin{array}{c}{{\\displaystyle\\frac{\\mathrm{A F L\ }s c a s e s;i n;m e n;u n d e r;50;y e a r s}{\\mathrm{A F L\ c a s e s;i n;a l l;m e n}}}}\ {{\\displaystyle\\frac{95^{\\circ}0\_,{\\mathrm{C I}};;w imathrm t h d;f o r;m e n;u n d e r;50;y e a r s}{95^{\\circ}0\_{0},\\mathrm{C I};w i d h h;\ r o\ ;a l l;m m n}}}endend{}}

Men: ±0.013-percent cases per 100 000 person-years
Women: ±0.004-percent cases per 100 000 person-years
Total: ±0.006-percent cases per 100 000 person-years

\\frac{6,\\mathrm{A F L,\ a s{s s s}}}{112,\\mathrm{A F L,c a s e s}}!=!\\frac{x}{0.24}

This assumption of proportional 95-percent CI was applied to
the women and total adults under 50 years of age as well. The
three calculated 95-percent CIs for adults under 50 years of
age follow:

* * *

Because the journal article used (Ref. 13) did not include
the number of participants for each age group and gender,
Equation (B1), which was used to find the 90-percent CI for
the AF data, could not be used directly to find the 90-percent
CI for the AFL data. However, because σ and n remain
constant for the 90- and 95-percent CIs, they can be canceled
out, leaving Equation (B5):

(B6)

90%,\\mathrm{C I},{=},{\\frac{1.64}{1.96}}\\big(95%%{\\mathrm{C l}}\\big)

(B5)

The 95th and 5th percentiles and the EF for AF were found
with following the steps. More specifically, Steps 3 and 4 for
determining the EF from the AF section were used.

B.4 Dental Events (Abscess, Caries, and
Periodontal Disease)

The following steps were used to obtain the EF for the
dental data:

(1) The 95-percent CI width was used to find σ from
Equation (B1), where zα/2is 1.96 for the 95-percent CI
and width95%is 1.6 for abscess, 0.615 for caries, and
1.93 for periodontal disease.

\\mathbf{z}\_{\\alpha/2}

(2) Next, Equation (B1) and σ were used to find the
90-percent CI width—resulting in Equation (B2),
where zα/2= 1.64 for the 90-percent CI.

z\_{\\up02}=1.64

The 90-percent CI width was calculated as 1.3 for
abscess, 0.51 for caries, and 1.61 for periodontal disease.

(3) Then, the 95th percentile was found by adding the
90-percent CI width to the mean, and the 5th percentile
was found by subtracting the 90-percent CI width from
the mean.
The 95th percentile was calculated as 4.80 for abscess,

(1) The 95-percent CI was used to determine the standard
error SE from a modified form of Lapin’s equation
(Ref. 39):

The following steps were used to obtain the EF for the
gallstone data:

B.5 Gallstone Disease

The 95th percentile was calculated as 4.80 for abscess,
5.41 for caries, and 3.31 for periodontal disease. The
5th percentile was calculated as 2.20 for abscess, 4.39
for caries, and 0.09 for periodontal disease.
Finally, Equation (B3) was used to find EF.

Sit{E E=\\frac{\\mathrm{w i d t h} _{95/%}}{z_{0/2}}}

(4) Finally, Equation (B3) was used to find EF.

where SE = σ n and zα/2=1.96 for the 95-percent
CI.

!,,z z\_{\\alpha/2},=,1.96

(2) The standard error was used to compute the 95th and
5th percentiles according to the following definition:

\\begin{array}{l}{{95\\mathrm{t h},p\ c,c e n t i l e=,m e a n+z\_{\\alpha/2}\\left(S\\!E\\right)}}\ {{5\\mathrm{t h},,p e r c e n t i l e=,m e a n+z\_{\\alpha/2}\\left(S!E\\right)}}\\end{array}

where zα/2= 1.64 for the 90-percent CI.

(3) Then, the EF was computed with Equation (B3).

B.6 Herpes Zoster

The following steps were used to obtain the EF for the
herpes data:

(1) The 95-percent CI was converted to the 90-percent CI
using Equation (B7) from Lapin (Ref. 39, p. 311):

z\_{\\alpha/2}\\times\\frac{\\odot}{\\sqrt{n}}=\\mathbf{w i d t h}

where zα/2is 1.96 for the 95-percent CI and 1.64 for the
90-percent CI.

Z\_{u/2}

(2) Next, the 5th and 95th percentiles were found from the
90-percent CI. The 95th percentile was found by adding
the 90-percent CI width to the mean, and the 5th percentile was found by subtracting the 90-percent CI from
the mean.

(B8)

(3) Finally, the EF was found from Equation (B3).

Because Reference 26 did not include the number of participants or the standard deviation for each age group and gender,
Equation (B7) could not be used directly. Entering the
variables for the 95- and 90-percent CIs into the formula
resulted in Equation (B8):

(B9)

\\begin{array}{r l}{{95%,C I;\\mathrm{w i d t h} _{95^{\\circ_{0}}}=!}}&{{}.96!(\ \ frac\\\ n)!90%,C I;\\mathrm{w i d t h} _{90^{\\circ_{0}}mathrm C C I}}\ {{=\ }!}&{{}1.64\\frac\\varsigma n,\\mathrm\\end{n}}

90%,C\ !I!=!{frac11666}{\\big(}95%\ \ !I\ {\\big))}

* * *

B.7 Seizure

The following steps were used with the data from Hauser,
Annegers, and Kurland (Ref. 33 and Table 55) to obtain the
EF for the seizure data.

TABLE 55.—SEIZURE INCIDENCE OVER 10-YEAR PERIODS
PER 100 000 PERSON-YEARS IN THE GENERAL POPULATION
OF ROCHESTER, MINNESOTA, AGED 40 TO 54 YEARS
Age Years that data were collected

(B11)

| Age | Years that data were collected |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
| 1935 to 1944 | 1945 to 1954 | 1955 to 1964 | 1965 to 1974 | 1975 to 1984 |  |
| 40 to 44 | 12 | 32 | 42 | 19 | 26 |
| 45 to 49 | 7 | 35 | 29 | 20 | 23 |
| 50 to 54 | 26 | 31 | 49 | 18 | 32 |

(B12)

The mean seizure incidence (total) per 100 000 people was
26.73, and the standard deviation was 10.95.
A 90-percent CI was constructed as follows:

A 90-percent CI was constructed as follows:

z=\\frac{\\overline{{x}}-\\mumu}{\\left(\\frac{\\sigma}{\\sqrt{n}}\\right)}

(B10)

z!=!\\Phi^{-1}!(1!-!\\frac{\\alpha}{2}!)!=!\\Phi^{-1}!(0.95!))!=!1.645

where P is probability, z is the normal deviate of the stated
percentile, µ is the true mean, and Φ is the cumulative density
function. For significance level α = 0.10, sample mean x =
26.73, standard deviation σ = 10.95, and number of samples n
= 15,

a=0.10.

\\up=10.95

0.90=P(22.08\\leq11\\leq31.38)

(B14)

Thus, the EF was found by

E F=\\sqrt{\\frac{95\ /text\_{0}}{5\\textnot\_{0}}}=\\sqrt{\\frac{31.38}{22.08}}\ 1.19

* * *

* * *

Appendix C.—Bayesian Inference Using Gibbs
Sampling (WinBUGS) Procedure and Code

C.1 WinBUGS Procedure

To estimate of the probability of a certain medical event,
open WinBUGS and create a new document. Type the
WinBUGS script for the medical event of interest (see
Section C.2). Next, open the Specification Tool under the
Model tab. Highlight “model” in the code and click “check
model” in the Specification Tool. WinBUGS will respond
with “model is syntactically correct” in the status bar. If the
model is not syntactically correct, follow the prompts given
by WinBUGS in the status bar to modify the code. After the
model is checked, load the data by highlighting “list” in the
code and click “load data.” WinBUGS will respond “data
loaded.” Click “compile,” and WinBUGS will respond
“model compiled.” Click “gen inits,” and WinBUGS will
respond “initial values generated, model initialized.” Now
open the Sample Monitor Tool under the Inference tab. Type
“lambda” into the drop-down box labeled “node,” click
“set,” and then select. Type “1001” into the box labeled
“beg” and highlight “5,” “median,” and “95” under “percentiles.” Now open the Update Tool under the Model tab. In
the “updates” box, type “75000” and click “update.” When
the model has completed its iterations, the results of the
update may be viewed by returning to the Sample Monitor
Tool, selecting “lambda” under node, and clicking the “stats”
button. The lognormal Poisson distribution that was constructed may be viewed by clicking the “density" button on
the Sample Monitor Tool.

C.2 WinBUGS Code

C.2.1 Angina

Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(mean= 0.00063, EF= 1.77, events= 6, time= 22137.0)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.000415, EF=1.48, events= 0, time= 1970.4)

model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(mean= 0.000396, EF=1.46, events= 0, time= 32.0)_
_Females_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.00047, EF= 2.08, events= 0, time= 2808.6)
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(mean= 0.000372, EF=1.94, events= 0, time= 264.8)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.000365, EF=1.94, events= 0, time= 6.5)
C.2.2 Appendicitis

C.2.2 Appendicitis

Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(mean= 0.000930, EF= 1.2, events= 2, time= 1644)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.000935, EF=1.198, events= 0, time= 38.3)

* * *

C.2.3 Atrial Fibrillation

Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=4, time=6502.7, mean=0.000640, EF=1.56)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=31.8, mean=0.000629, super=0.000902,
sub=0.000412)
Females
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=336.8, mean=0.000210, EF=2.97)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=6.5, mean=0.000202, super=0.000476,
sub=0.000560)
Total

model {events ~ dpois(mean.poisson)
mean.poisson <- lambda\*time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=38.3, mean=0.000443, super=0.000611,
sub=0.000306)

Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda\*time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=4, time=6839.4, mean=0.000425, EF=1.45)

C.2.4 Atrial Flutter

C.2.4 Atrial Flutter
Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=6502.7, mean=0.0000707, EF=1.17)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=31.8, mean=0.0000705, super=0.0000821,
sub=0.0000600)
Females
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=336.8, mean=0.0000243, EF=1.18)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=6.5, mean=0.0000243, super=0.0000285,
sub=0.0000205)

* * *

Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=6839.4, mean=0.0000479, EF=1.11)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=0, time=38.3, mean=0.0000477, super=0.0000529,
sub=0.0000429)

C.2.5 Dental Abscess

model { events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=19, time=475.2, mean=0.00353, EF=1.48)_
_model { events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=31.9, mean=0.00826, EF=1.43)
C.2.6 Dental Caries
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=168, time=475.2, mean=0.00488, EF=1.11)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=31.9, mean=0.00942, EF=1.11)

C.2.7 Dental Periodontal Disease

model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=56, time=475.2, mean=0.00168, EF=6.24)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=31.9, mean=0.110, EF=1.26)

C.2.8 Gallstone Disease

Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=3, time=1970.4, mean=0.000769, EF=1.01)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=32.0, mean=0.0007691, EF=1.01)
Females
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=264.8, mean=0.001266, EF=1.01)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=6.5, mean=0.001266, EF=1.01)

* * *

Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2_
_time <- menpreflight + womenpreflight}_
_list(events=3, menpreflight=1970.4, womenpreflight = 264.8,_
_mean=0.001017, EF=1.01)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
time <- meninflight + womeninflight}
list(events=0, meninflight=32.0, womeninflight = 6.5,
mean=0.001017, EF=1.01)

C.2.9 Herpes Zoster

Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=8, time=1985.9, mean=0.0025, EF=1.09)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=1, time=32.5, mean=0.00250, super=0.00272,
sub=0.00229)
Females
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda\*time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=273.1, mean=0.0032, EF=1.07)

model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2_
_EF <- pow(div, 1/2)_
_div <- super/sub}_
_list(events=0, time=6.5, mean=0.00323, super=0.00345,_
_sub=0.00302)_
_Total_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=8, time=2259.0, mean=0.0029, EF=1.04)
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda\*time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2
EF <- pow(div, 1/2)
div <- super/sub}
list(events=1, time=39.0, mean=0.00290, super=0.00301,
sub=0.00278)
C.2.10 Renal Stones

C.2.10 Renal Stones

model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=74, time=17740.8, mean=0.0018, EF=2.236)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
EF <- pow(x,1/2)
x <- p95/p5
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.00397, p95= 0.00474, p5= 0.00324, events= 0,
time= 25.1)

* * *

C.2.11 Seizure
Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(mean= 0.00027, EF= 1.19, events= 0, time= 2235.2)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(mean= 0.00027, EF=1.19, events= 0, time= 38.6)
C.2.12 Stroke
Males
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=2, time=3478.6, mean=0.00110, EF=1.567)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=31.8, mean=0.000981, EF=1.482)

Females
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=0, time=336.8, mean=0.000700, EF=1.773)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=6.5, mean=0.000680, EF=1.739)
Total
model {events ~ dpois(mean.poisson)
mean.poisson <- lambda _time_
_lambda ~ dlnorm(mu, tau)_
_tau <- 1/pow(sigma, 2)_
_sigma <- log(EF)/1.645_
_mu <- log(mean) - pow(sigma, 2)/2}_
_list(events=2, time=3815.3, mean=0.000900, EF=1.254)_
_model {events ~ dpois(mean.poisson)_
_mean.poisson <- lambda_ time
lambda ~ dlnorm(mu, tau)
tau <- 1/pow(sigma, 2)
sigma <- log(EF)/1.645
mu <- log(mean) - pow(sigma, 2)/2}
list(events=0, time=38.3, mean=0.000878, EF=1.254)

* * *

* * *

Appendix D.—Statistical Combination of Independent Distributions

Although the objective of the current study is to obtain
estimates of incidence rate for various medical events in
astronauts, these rates are not always available for the events
under investigation. Instead, rates may be available for more
specific complications or diseases, which must then be
combined in a statistically correct fashion to provide an
estimate of the total incidence of the disease category under
study. In the current study, the analysis of gallstone disease
serves as a primary example. Urbach et al. (Ref. 25) provided
incidence data stratified by age and gender for three different
gallstone-related conditions: namely, acute cholecystitis, acute
biliary pancreatitis, and acute cholangitis. For an estimate of
total gallstone disease incidence in the general population to
be obtained, these incidence rates—and their associated
uncertainties—needed to be combined in a statistically
accurate fashion. The method in which this was accomplished
is presented in this appendix.
Combination of individual disease incidence rates depends

Combination of individual disease incidence rates depends
on an assumption of independence. This assumption allows
the uncertainties of the incidences to be combined in a fashion
dictated by the rules of probability. As noted in the following
discussion, the variance of the scaled sum of two independent
distributions is simply the sum of their variances, multiplied
by the square of the scaling factor:
Let X and Y be two independent random variables, and let

Let X and Y be two independent random variables, and let
Z = a(X + Y):

(D1)

\\up{{\\tt G}} _{z}^{2}=a^{2}\\left(\\upcirc_{x}^{2}+\\upcirc\_{y}^{2}\\right)

(D3)

\\scriptstyle{Z{=}\ a a(X+Y)}

Accordingly, the following relationship holds for the
standard deviation of the combined distribution:

(D2)

\ eth\_{z}=a\\sqrt{\\eth\_{x}^{2}+\\eth\_{y}^{2}}

This relation was applied to the data available for the various gallstone conditions in order to determine the combined
incidence of general gallstone disease. The raw data presented
in Reference 25 provided separate incidence rates for three
different gallstone conditions and for three discrete age
groups: 18 to 44, 45 to 64, and ≥65. Because the present study
required an estimate of total gallstone disease incidence in the
astronaut-like age range, 18 to 64, six separate distributions
had to be combined in this manner for males and females in
the three ranges.
Assumptions were made in the interpretation of the inci-

particular condition was assumed to be independent of the
incidence of the other two conditions. (3) The incidence in
males was assumed to be independent of the incidence in
females.
Reference 25 provided the annual incidence per 100 000

Reference 25 provided the annual incidence per 100 000
persons for each category, as well as a 95-percent CI for this
value. The standard error of each incidence rate was determined as follows:

\\9amond\_\\mathrm{C0CI-(mean-1.96\\bullet SE,,eean+1.96\\bullet SE)}

\\therefore S E={\\frac{95^{9}/ _{0};C I;\\mathrm{u p p e r};\\mathrm{l i m i t}-95^{9}/_{0};C I;\\mathrm{l o w e r};\\mathrm{l i m i t}}{3.92}}

(D4)

The standard error of the mean SE is the standard deviation
of the sample mean of a population distribution. Therefore, the
standard error can be used in the same fashion as the standard
deviation σ is used in Equation (D2) to properly account for
uncertainty when independent incidence rates are combined.
It was assumed that age groups were independent from each

It was assumed that age groups were independent from each
other, so an incidence rate λ for ages 18 to 64 was found for
each specific condition by averaging the λ provided for ages
18 to 44 and 45 to 64. The standard error for the new combined distribution was determined from Equations (D2) and
(D3):

\\lambda\_{18,\\mathrm{t o},,64}=\\mathcal{V} _{2}\\bigl(\\lambda_{18,\\mathrm{t o},44}+\\lambda\_{45,\\mathrm{t o},64}\\bigr)

\\therefore S E\_{18,\

(D5)

This process was used for all three gallbladder conditions
for data for both males and females to determine an incidence
rate for each condition. These three conditions were then
combined in a simple additive fashion, again with the assumption of the independence of incidence and applying the
formula for determining combined standard error:

\\lambda\_{\\mathrm{t o t a l}}=\\left(\\lambda\_{1}+\\lambda\_{2}+\\lambda\_{3}\\right)

\\therefore S E\_{\\mathrm{t o t a l}}=\\sqrt{S E\_{1}^{2}+S E\_{2}^{2}+S E\_{3}^{2}}

* * *

* * *

References

01. Dezfuli, Homayoon, et al.: Bayesian Inference for NASA
    Probabilistic Risk and Reliability Analysis. NASA/SP—
    2009-569, 2009.

02. Walton, M.: Guide to Integrated Medical Model

03. Walton, M.: Guide to Integrated Medical Model
    Incidence Values for In-flight Medical Conditions.
    Internal NASA document, in press, July 21, 2009.

04. Bedford, Tim; and Cooke, Roger M.: Probabilistic Risk

05. Bedford, Tim; and Cooke, Roger M.: Probabilistic Risk
    Analysis: Foundations and Methods. Cambridge University Press, Cambridge, 2001.

06. U.S. Department of Health & Human Services. National

07. U.S. Department of Health & Human Services. National
    Institutes of Health, June 1, 2011.
    [http://www.nhlbi.nih.gov/health/dci/Diseases/Angina/](http://www.nhlbi.nih.gov/health/dci/Diseases/Angina/)
    Angina\_WhatIs.html Accessed Dec. 19, 2011.

08. Gandhi, M.M.; Lampe, F.C.; and Wood, D.A.:

09. Gandhi, M.M.; Lampe, F.C.; and Wood, D.A.:
    Incidence, Clinical Characteristics, and Short-Term
    Prognosis of Angina Pectoris. Br. Heart J., vol. 73,
    1995, pp. 193‒198.

10. Mason, Sara: Data Request to LSAH for Angina, Seizure,

11. Addiss, D.G., et al.: The Epidemiology of Appendicitis
    and Appendectomy in the United States. Am. J.
    Epidemiol., vol. 132, no. 5, 1990, pp. 910–925.

12. Everhart, J.E., ed.: The Burden of Digestive Diseases in

13. Everhart, J.E., ed.: The Burden of Digestive Diseases in
    the United States. U.S. Department of Health and Human
    Services, Public Health Service, National Institutes of
    Health, National Institute of Diabetes and Digestive and
    Kidney Diseases, Washington, DC, U.S. Government
    Printing Office, 2008, NIH Publication No. 09–6443,
    pp. 89–91.

14. Halm, M.: Request to LSAH for Data Related to

15. Tooth Abscess. Medline Plus, U.S. National Library of
    Medicine, National Institutes of Health, Feb. 22, 2010.
    [http://www.nlm.nih.gov/medlineplus/ency/article/001060](http://www.nlm.nih.gov/medlineplus/ency/article/001060).
    htm Accessed Dec. 19, 2011.

16. Deutsch, Wayne M.: Dental Events During Periods of
    Isolation in the U.S. Submarine Force. Mil. Med.,
    vol. 173, no. 1, 2008, pp. 29–37.

17. Murray, Jocelyn: Request to LSAH for Incidences of
    Dental Caries, Abscesses and Periodontal Disease. Lifetime Surveillance of Astronaut Health (LSAH). E-mail
    correspondence, Aug. 4, 2010.

18. Ball, John R.; and Evans, Charles H., Jr., eds.: Safe
    Passage: Astronaut Care for Exploration Missions.
    Institute of Medicine, National Academy Press,
    Washington, DC, 2001.

19. Brown, L.R., et al.: Skylab Oral Health Studies. Biomedical Results from Skylab Program, Richard S. Johnston and
    Lawrence F. Dietlein, eds., NASA SP–377, 1977, pp. 35–44.

20. Dye, B.A., et al.: Trends in Oral Health Status: United
    States, 1988–1994 and 1999–2004. National Center for
    Health Statistics, Vital Health Stat, series 11, no. 248, 2007.

21. Rethman, J.: Trends in Preventive Care: Caries Risk
    Assessment and Indications for Sealants. J. Am. Dent.
    Assoc., vol. 131, no. 1, Suppl. 8S–12S, 2000.

22. Todar, Kenneth: The Normal Bacterial Flora of Humans.
    Online Textbook of Bacteriology, 2011, p. 5.
    [http://www.textbookofbacteriology.net/](http://www.textbookofbacteriology.net/)
    normalflora\_5.html Accessed Dec. 19, 2011.

23. Diseases of Oral Cavity, Salivary Glands, and Jaws
    (520–529). [http://www.icd9data.com/2012/Volume1/](http://www.icd9data.com/2012/Volume1/)
    520-579/ 520-529/default.htm

24. Schirmer, Bruce D.; Winters, Kathryne L.; and Edlich,
    Richard: Cholelithiasis and Cholecystitis. J. Long Term
    Eff Med. Implants, vol. 15, no. 3, 2005, pp. 329–338.

25. Sanders, Grant; and Kingsnorth, Andrew N.: Gallstones.
    BMJ, vol. 335, 2007, pp. 295–299.

26. Urbach, David R.; and Stukel, Therese A.: Rate of
    Elective Cholecystectomy and the Incidence of Severe
    Gallstone Disease. CMAJ, vol. 172, no. 8, 2005,
    pp. 1015–1019.

27. Insinga, Ralph P., et al.: The Incidence of Herpes Zoster
    in a United States Administrative Database. J. Gen.
    Intern. Med., vol. 20, 2005, pp. 748–753.

28. Halm, M.: Herpes Zoster Incidence Among the Astronaut
    Corps: Lifetime Surveillance of Astronaut Health
    (LSAH). August 2010, personal communication.

29. Walton, Marlei: Mir Data. Oct. 25, 2010, personal

30. Halm, M.: Request to LSAH for Data Related to
    Appendicitis: Lifetime Surveillance of Astronaut Health
    (LSAH). June 29, 2010, personal communication.

31. Soreide, O.: Appendicitis—A Study of Incidence, Death

32. Soreide, O.: Appendicitis—A Study of Incidence, Death
    Rates and Consumption of Hospital Resources. Postgrad.
    Med. J., vol. 60, no. 703, 1984, pp. 341–345.

33. Hartnett, H.: Atrial Fibrillation and Atrial Flutter


Med. J., vol. 60, no. 703, 1984, pp. 341–345.
11\. Hartnett, H.: Atrial Fibrillation and Atrial Flutter
Incidence Among the Astronaut Corps: Lifetime
Surveillance of Astronaut Health (LSAH). June 9, 2010,
Personal communication.

12. Miyasaka, Y., et al.: Secular Trends in Incidence of Atrial
    Fibrillation in Olmsted County, Minnesota, 1980 to 2000,
    and Implications on the Projections for Future Prevalence.
    Circulation, J. Amer. Heart Assoc., vol. 114, 2006,
    pp. 119–125.

13. Granada, Juan, et al.: Incidence and Predictors of Atrial

14. Walton, Marlei: Mir Data. Oct. 25, 2010, personal
    communication.


* * *

29. Wear, M.: Renal Stones. Lifetime Surveillance of Astronaut
    Health (LSAH). July 25, 2007, personal communication.

30. Litwin, Mark S.; and Saigal, Christopher S., eds.: Urologic
    Diseases in America Interim Compendium. National
    Institute of Diabetes & Digestive & Kidney Diseases,
    National Institutes of Health, Dept. of Health and Human
    Services, Bethesda, MD, 2004.

31. Pietrzyk, Robert A., et al.: Renal Stone Formation Among
    Astronauts. Aviat. Space Environ. Med., vol. 78, no. 4,
    section II, 2007, A9–A13.

32. Seizures and Epilepsy: Hope Through Research. National
    Institute of Neurological Disorders and Stroke, National
    Institutes of Health, Oct. 17, 2011.
    [http://www.ninds.nih.gov/disorders/epilepsy/](http://www.ninds.nih.gov/disorders/epilepsy/)
    detail\_epilepsy.htm#168893109 Accessed Dec. 27, 2011.

33. Hauser, W.A.; Annegers, J.F.; and Kurland, L.T.:
    Incidence of Epilepsy and Unprovoked Seizures in Rochester, Minnesota: 1935‒1984, Epilepsia, vol. 34, no. 3,
    1993, pp. 453‒458.

34. Moore-Sledge, C.M.: Evaluation and Management of
    First Seizures in Adults. Am. Fam. Physician, vol. 56,
    no. 4, 1997, pp. 1113‒1120.

35. Types of Stroke. Centers for Disease Control and
    Prevention. Atlanta, GA, Jan. 14, 2010.
    [http://www.cdc.gov/stroke/types\_of\_stroke.htm](http://www.cdc.gov/stroke/types_of_stroke.htm) Accessed
    Dec. 27, 2011.

36. Hartnett, H.: Strokes: Lifetime Surveillance of Astronaut
    Health (LSAH). June 2, 2010, personal communication.

37. Lloyd-Jones, Donald, et al.: Heart Disease and Stroke
    Statistics—2010 Update: A Report From the American
    Heart Association. Circulation, Journal of the American
    Heart Association, Dallas, TX, Dec. 17, 2009.
    [http://circ.ahajournals.org/cgi/reprint/121/7/e46](http://circ.ahajournals.org/cgi/reprint/121/7/e46) Accessed
    Dec. 27, 2011.

38. Johnson-Throop, Kathy A.; Freire de Carva, Mary; and
    Butler, Douglas J.: Human Research Program―Integrated
    Medical Model Configuration Management Document.
    NASA JSC Number 66113, 2011.

39. Lapin, Lawrence L.: Probability and Statistics for Modern
    Engineering. Second ed., Waveland Press, Long Grove,
    IL, 1990.


* * *

| REPORT DOCUMENTATION PAGE |  |  |  | Form ApprovedOMB No. 0704-0188 |
| --- | --- | --- | --- | --- |
| The public reporting burden for this collection of information is estimated to average 1 hour per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and compiling and reviewing the collection of information. Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to Department of Defense, Washington Headquarters Services, Directorate for Information Operations and Reqs (0704-0188), 213 Jefferson Davis Highway, Suite 129, Arlington, VA 22002-8402. Respondents should be aware that notwithstanding any provision of law, no person shall be subject to any penalty for failing to comply with a collection of information if it does not display a current valid OMB notice. |  |  |  |  |
| PLEASE DO NOT RETURN YOUR FORM TO THE ABOVE ADDRESS |  |  |  |  |
| 1\. REPORT DATE (DD-MM-YYYY)01-07-2012 | 2\. REPORT TYPE Technical Paper |  |  | 3\. DATES COVERED (From - To) |
| 4\. TITLE AND SUBTITLE Bayesian Analysis for Risk Assessment of Selected Medical Events in Support of the Integrated Medical Model Effort |  |  |  | 5a. CONTRACT NUMBER |
| 6\. AUTHOR(S) Gilkey, Kelly, M.; McRae, Michael, P.; Griffin, Elise, A.; Kalluri, Aditya, S.; Myers, Jerry, G. |  |  |  | 5b. GRANT NUMBER |
| 5c. PROGRAM ELEMENT NUMBER |  |  |  |  |
| 5d. PROJECT NUMBER |  |  |  |  |
| 5e. TASK NUMBER |  |  |  |  |
| 7\. PERFORMING ORGANIZATION NAME(S) AND ADDRESS(ES) National Aeronautics and Space Administration John H. Glenn Research Center at Lewis Field Cleveland, Ohio 44135-3191 |  |  |  | 8\. PERFORMING ORGANIZATION REPORT NUMBER E-17809 |
| 9\. SPONSORING/MONITORING AGENCY NAME(S) AND ADDRESS(ES) National Aeronautics and Space Administration Washington, DC 20546-0001 |  |  |  | 10\. SPONSORING/MONITOR'S ACROONY(M)S NASA |
| 11\. SPONSORING/MONITORING REPORT NUMBER NASA/TP-2012-217120 |  |  |  |  |
| 12\. DISTRIBUTION/AVAILABILITY STATEMENT Unclassified-Unlimited Subject Categories: 51, 52, and 54 Available electronically at [http://www.sti.nasa.gov](http://www.sti.nasa.gov/) This publication is available from the NASA Center for AeroSpace Information, 443-757-5802 |  |  |  |  |
| 13\. SUPPLEMENTARY NOTES |  |  |  |  |
| 14\. ABSTRACT The Exploration Medical Capability project is creating a catalog of risk assessments using the Integrated Medical Model (IMM). The IMM is a software-based system intended to assist mission planners in preparing for spaceflight missions by helping them to make informed decisions about medical preparations and supplies needed for combating and treating various medical events using Probabilistic Risk Assessment. The objective is to use statistical analyses to inform the IMM decision tool with estimated probabilities of medical events occurring during an exploration mission. Because data regarding astronaut health are limited, Bayesian statistical analysis is used. Bayesian inference combines prior knowledge, such as data from the general U.S. population, the U.S. Submarine Force, or the analog astronaut population located at the NASA Johnson Space Center, with observed data for the medical condition of interest. The posterior results reflect the best evidence for specific medical events occurring in flight. Bayes' theorem provides a formal mechanism for combining available observed data with data from similar studies to support the quantification process. The IMM team performed Bayesian updates on the following medical events: angina, appendicitis, arial fibrillation, atrial flutter, dental abscess, dental caries, dental periodontal disease, gallstone disease, herpes zoster, renal stones, seizure, and stroke. |  |  |  |  |
| 15\. SUBJECT TERMS Risk; Probability theory; Mission planning; Life sciences; Bayes theorem; Astronaut health; Space flight; Diseases |  |  |  |  |
| 16\. SECURITY CLASSIFICATION OF: |  |  | 17\. LIMITATION OF ABSTRACT UU | 18\. NUMBER OF PAGES 46 |
| a. REPORT U | b. ABSTRACT U | c. THIS PAGE U |  | 19a. NAME OF RESPONSIBLE PERSON STI Help Desk (email: [help@sti.nasa.gov](mailto:help@sti.nasa.gov))19b. TELEPHONE NUMBER (include area code) 443-757-5802 |

Standard Form 298 (Rev. 8-98)
Prescribed by ANSI Std. Z39-18

* * *

* * *