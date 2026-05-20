**To:** The Editors, *npj Microgravity*
**From:** Diego L. Malpica, MD — Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia
**Re:** Manuscript submission — *Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection*

Dear Editors,

I am submitting the attached manuscript for consideration as an original research article in *npj Microgravity*. The paper presents **Selectron**, a reproducible TypeScript pipeline that combines two methodological contributions for analog-astronaut selection:

1. A Bayesian multi-criteria decision analysis (MCDA) pipeline that produces a posterior distribution over each candidate's total score with credible-interval rank semantics — the first such pipeline applied to astronaut, aircrew, or analog-astronaut selection in the indexed literature.
2. A formal mapping from the Stage-B IMM-style mission-risk Monte Carlo posterior to NASA's institutional Human System Risk Board Likelihood × Consequence framework as published in JSC-66705 Revision A — the first such mapping for analog-mission programs.

Internal validation follows NASA-STD-7009A's first three credibility factors: closed-form Dirichlet moments, ESS, the Poisson-Gamma conjugate test, the verbatim JSC-66705 Figure 4 grid check, and the σ < 5 % convergence rule at the NASA-canonical T = 100 000 trials per Myers (2018) and Antonsen (2022). Outcome validation against analog-mission incident catalogues is explicitly out-of-scope and disclosed as a limitation; the paper is framed as a methodology contribution, not an outcome-prediction study.

The software artifact is MIT-licensed and Zenodo-archived (doi:`__ZENODO_DOI__`) at the commit used to generate every figure. The repository at `github.com/strikerdlm/selectron` contains the full source, the test suite (171 vitest + 7 Playwright snapshot tests), the V&V dossier, and reproducibility instructions.

The manuscript fits *npj Microgravity*'s scope on (a) modeling and simulation of medical risk in spaceflight and analog environments, (b) reproducible quantitative methodology for human-research operational contexts, and (c) translation of NASA institutional frameworks (HSRB, JSC-66705 Rev A) into externally usable artifacts. The Antonsen et al. (2022, 2023) papers from this journal are central methodological anchors for Stage B; we extend that line of work into the analog-mission domain.

The manuscript is original work, has not been published elsewhere, and is not under consideration by any other journal. I am the sole author and declare no conflicts of interest. The work received no external funding. The submission complies with the journal's reproducibility requirements: data availability, code availability, CRediT contributions, funding, competing-interests, and ethics statements are included in the manuscript Statements section.

I appreciate your time and look forward to your editorial decision.

Sincerely,

Diego L. Malpica, MD
Direction of Aerospace Medicine, Colombian Aerospace Force (FAC)
dlmalpica@yahoo.com
