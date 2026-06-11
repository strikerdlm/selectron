**To:** The Editors, *Advances in Space Research*
**From:** Diego L. Malpica, MD — Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia
**Re:** Manuscript submission — *From Mission Medical Risk to Crew Selection: A Reproducible NASA-IMM and HSRB Pipeline for Analog Astronauts*

Dear Editors,

I am submitting the attached manuscript for consideration as an original research article in *Advances in Space Research*. The paper presents **Selectron**, a reproducible TypeScript pipeline that combines two methodological contributions for analog-astronaut selection:

1. A Bayesian multi-criteria decision analysis (MCDA) pipeline that produces a posterior distribution over each candidate's total score with credible-interval rank semantics — to our knowledge the first *Bayesian* MCDA pipeline delivering per-candidate composite-score posteriors and rank credible intervals for analog-astronaut selection (deterministic and fuzzy MCDM for pilot/aircrew selection is established — e.g. Taylan et al., 2024 — but a Bayesian formulation coupled to a mission-risk model is not).
2. A formal mapping from the Stage-B IMM-style mission-risk Monte Carlo posterior to NASA's institutional Human System Risk Board Likelihood × Consequence framework as published in JSC-66705 Revision A — the first such mapping for analog-mission programs.

The IMM Calculator aligns to the NASA Integrated Medical Model of Keenan et al. (2015) and reproduces the K15 §II.A.9 sum-of-products per-event quality-time-lost formula across the 100-condition K15 catalogue at T = 100 000 trials, with one disclosed source-cited analog behavioral extension (`interpersonal-conflict`) in the released app. All 101 current per-condition priors are evidence-based (34 tier-A NASA-attributed, 66 tier-B PyMC NUTS-fitted from terrestrial, Antarctic, submarine, and military population epidemiological data across iterative calibration passes, and one tier-B literature extension); zero synthetic placeholders remain. A two-panel condition-set sensitivity analysis (§3.6) demonstrates that the K15 reproduction is non-circular: the 34 NASA-sourced conditions alone produce issHMS CHI within K15's published CI₉₅, and the tier-B conditions add evidence-based risk that is not back-calibrated against K15 aggregates.

Internal validation follows NASA-STD-7009A's first three credibility factors: closed-form Dirichlet moments, ESS, the Poisson-Gamma conjugate test, the verbatim JSC-66705 Figure 4 grid check, and the σ < 5 % convergence rule at the NASA-canonical T = 100 000 trials per Myers (2018) and Antonsen (2022). Outcome validation against analog-mission incident catalogues is explicitly out-of-scope and disclosed as a limitation; the paper is framed as a methodology contribution, not an outcome-prediction study.

The software artifact is MIT-licensed and will be archived at Zenodo before portal upload; the DOI will be inserted into the manuscript at that final archive step. The current figure-generation commit marker is `538e16ccff94`, and the repository at `github.com/strikerdlm/selectron` contains the full source, the test suite, the V&V dossier, and reproducibility instructions.

The manuscript fits *Advances in Space Research*'s scope on (a) computational modeling of medical risk in spaceflight and analog environments, (b) probabilistic risk assessment methodology for crewed space missions, and (c) quantitative translation of NASA institutional frameworks (HSRB, JSC-66705 Rev A, NASA-STD-7009A) into reproducible, externally usable artifacts. The NASA IMM community — Antonsen et al. (2022), Myers et al. (2018), Keenan et al. (2015) — provides the methodological foundation; we extend that line of work into the analog-mission domain with a Bayesian selection pipeline coupled to a fully open-source IMM-aligned simulator.

The manuscript is original work, has not been published elsewhere, and is not under consideration by any other journal. I am the sole author and declare no conflicts of interest. The work received no external funding. The submission complies with the journal's requirements: data availability, code availability, author contributions, funding, competing-interests, and ethics statements are included in the manuscript.

I appreciate your time and look forward to your editorial decision.

Sincerely,

Diego L. Malpica, MD
Direction of Aerospace Medicine, Colombian Aerospace Force (FAC)
dlmalpica@yahoo.com
