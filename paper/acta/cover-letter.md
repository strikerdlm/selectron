# Cover letter draft — Acta Astronautica

**Not submission-ready.** Fill the Zenodo DOI, frozen commit SHA, full postal address, and final manuscript title before use.

Editor-in-Chief  
*Acta Astronautica*

Dear Editor,

I am submitting the original research manuscript entitled **“A reproducible Bayesian MCDA and NASA-IMM/HSRB risk-mapping pipeline for analog astronaut selection”** for consideration in *Acta Astronautica*.

This manuscript presents Selectron, a reproducible computational methodology for analog-astronaut selection research. The work combines two components that are usually treated separately. First, it applies Bayesian multi-criteria decision analysis to candidate scoring, representing criterion-weight uncertainty with a Dirichlet distribution and reporting posterior composite-score distributions rather than deterministic ordinal ranks. Second, it implements a NASA Integrated Medical Model (IMM)-aligned medical-risk Monte Carlo over the K15 100-condition catalogue and maps mission-health outputs onto the NASA Human System Risk Board (HSRB) Likelihood × Consequence framework.

The manuscript is framed as a computational and probabilistic-risk methodology contribution for Earth-based analog missions and LEO/ISS-baseline scenarios. It does not present Selectron as a clinical decision-support system, autonomous selector, operational flight-certification tool, or Mars/Artemis medical-risk engine. The validation language is deliberately conservative: the K15 comparison is reported as inter-model agreement against a public NASA reference output, not as validation against observed analog-mission or flight outcomes.

The principal contributions are:

1. A reproducible Bayesian MCDA pipeline for analog-astronaut candidate-score uncertainty.
2. An IMM-aligned mission medical-risk Monte Carlo with deterministic seeded replay.
3. A formal mapping from mission-health outputs to the NASA HSRB Likelihood × Consequence matrix.
4. A K15 reproduction gate showing total-medical-event agreement across the three resource scenarios and unlimited-resource CHI agreement within the published 95% confidence interval, with remaining divergences explicitly documented.
5. A browser-resident, MIT-licensed software artifact archived at Zenodo.

The subject matter fits *Acta Astronautica* because the contribution is a space-systems methodology for the conception, design, and operation of Earth-based analog mission decision-support workflows. Medical and behavioral variables enter as model inputs and validation targets; the manuscript’s primary contribution is the reproducible computational risk-assessment architecture.

The work has not been published previously and is not under consideration elsewhere. No human-subject data, clinical records, applicant files, or operational crew records were collected or analyzed. The author declares no competing financial interests or personal relationships that could have appeared to influence the work. This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

The complete source code, priors, tests, and figure-generation artifacts will be archived at Zenodo before submission. The version of record will be identified by DOI and frozen commit SHA:

- Zenodo DOI: TODO
- Selectron commit SHA: TODO
- `imm-priors.json` SHA-256: TODO

Sincerely,

Diego L. Malpica, MD  
Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia  
Corresponding author: dlmalpica@yahoo.com  
Full postal address: TODO
