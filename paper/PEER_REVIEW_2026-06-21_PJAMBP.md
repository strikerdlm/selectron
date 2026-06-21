# Peer Review for PJAMBP Targeting

Manuscript reviewed: `paper/manuscript.md`

Target journal: *The Polish Journal of Aviation Medicine, Bioengineering and Psychology*

Recommended decision before submission: **major revision required**, then submit as original research.

## Major Findings

1. **The current draft is still written for Acta Astronautica, not for an aerospace-medicine audience.** The title, cover letter, and framing emphasize astronautics, NASA artifact fidelity, and software reproducibility. PJAMBP reviewers will need the first page to foreground aerospace medicine: aeromedical decision support, analog crew selection, human factors, and mission medical-risk communication.

2. **The manuscript is far over the PJAMBP limit.** Current source is about 13,300 words. PJAMBP original articles are capped at 6000 words excluding references/tables/figures. The submission version must be a focused manuscript, with detailed prior provenance, V&V contract mechanics, and long implementation notes moved to supplement/repository.

3. **The main claim needs to be narrower and safer.** The paper should claim a reproducible decision-support methodology for research and risk communication. It should not imply operational validation, clinical certification, NASA endorsement, or readiness for real astronaut selection. The limitations already say this, but the abstract and conclusion need the same discipline.

4. **The strongest PJAMBP hook is underused.** PJAMBP's scope includes bioengineering and psychology. The current draft has enough material to fit this well, but the revision should explicitly connect Stage A to human-factors/selection uncertainty and Stage B to aerospace-medicine risk communication.

5. **The K15 divergence discussion is too long for the target journal.** The essential result is enough: TME agrees across three kit scenarios; unlimited-resource CHI agrees; operational ISS-HMS CHI and pEVAC/pLOCL remain disclosed divergences. The detailed condition-level audit can be cited as repository/supplementary material.

6. **The abstract must be structured and shorter.** PJAMBP expects a structured abstract, typically up to 250 words. The current abstract is unstructured and aimed at a broad space-systems readership.

7. **References and citation style need conversion.** PJAMBP uses a modified Vancouver style. The Markdown source can retain citation keys, but the DOCX should be generated through a Vancouver CSL.

## Reviewer A: Aerospace Medicine

The manuscript has a defensible aerospace-medicine contribution because it connects analog crew selection to mission medical risk using a transparent uncertainty model. The paper should make clear that analog-mission programs often lack a common risk language and that Selectron provides a research framework for communicating medical risk, not a substitute for flight surgeon judgment.

Required revision: make the clinical/aeromedical boundary explicit in the Introduction, Methods, Discussion, and Conclusion.

## Reviewer B: Human Factors and Psychology

The Bayesian MCDA stage is relevant to human factors because it treats selection-rubric weights as uncertain rather than fixed. The current draft spends too much time on NASA IMM mechanics before readers understand why rank uncertainty matters for selection panels.

Required revision: add a concise selection-panel paragraph explaining why credible intervals/rank uncertainty are more honest than deterministic ordinal ranks.

## Reviewer C: Bioengineering/Modeling

The implementation is reproducible and well-audited, but the current manuscript presents too much engineering detail for a journal article. A short Methods section should describe the distributions, K15 alignment, and HSRB mapping. The full reproducibility lock and V&V gate can remain in the repository.

Required revision: keep only the validation checks that change reader confidence: closed-form Dirichlet moments, Poisson-Gamma checks, seeded replay, K15 reproduction, and HSRB grid fixtures.

## Reviewer D: Statistics

The Stage-A demonstration currently includes a degenerate midpoint candidate whose posterior collapses to a point mass. That is useful as a sanity check but weak as a centerpiece. The discriminative three-candidate case is the better demonstration for reviewers.

Required revision: lead Stage A results with the three-candidate example, and retain the midpoint case only as a reproducibility check if space allows.

## Reviewer E: Editorial Fit

PJAMBP will likely accept a computational methodology paper if it is presented as aerospace medicine, human factors, and bioengineering. It will be less receptive if it reads as a NASA software validation dossier.

Required revision: change the title, keywords, cover letter, and first contribution statement to match PJAMBP's scope.

## Submission Risk

Risk level after revision: **moderate**.

The paper is unusual for an aerospace-medicine journal because it is a software/methodology contribution, but PJAMBP's scope is broad enough to support it. The most important risk is overclaiming validation. The second risk is length. A 6000-word version with a structured abstract and strong limitations should be suitable for external review.

## Redaction Targets

- Title: replace "NASA-IMM/HSRB Risk-Mapping Pipeline" emphasis with "aerospace-medicine decision support" emphasis.
- Abstract: structured, <=250 words.
- Keywords: 3-7 MeSH-like terms.
- Figures: use 4 core figures at most in the main manuscript: pipeline, selection criteria/tiering, HSRB matrix, cross-mission comparison.
- Tables: keep K15 reproduction and sensitivity summary; move detailed priors to repository/supplement.
- Discussion: foreground human factors, aeromedical decision-making, and operational limits.
- Conclusion: one paragraph, no certification claim.
