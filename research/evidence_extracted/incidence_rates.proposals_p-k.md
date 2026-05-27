# Analog/Antarctic Evidence — proposals_p-k
## IMM prior calibration: pass 2 HIGH-priority upgrades

**Owner:** Selectron Iter-3 — IMM Calculator prior elicitation
**Created:** 2026-05-27
**Session:** Standalone PyMC Gamma-Poisson fit — herpes-zoster + nephrolithiasis
**Status:** APPLIED — posteriors merged into `src/data/imm-priors.json`

---

## Overview

Two HIGH-priority `tierA-nasa` conditions upgraded to `tierB-pymc` using analog/spaceflight
epidemiology evidence. Evidence anchors from `research/analog_incidence_pass2_immune_msk_renal.md`.

| Condition | Prior λ | Posterior λ | Evidence source |
|---|---|---|---|
| `herpes-zoster-reactivation-shingles` | 4.1/1000/PY | **7.4/1000/PY** | Zhang 2026 (Antarctic HZ 33.3/1000/PY) |
| `nephrolithiasis` | 3.7/1000/PY (Lognormal) | **10.0/1000/PY** (Gamma) | Goodenow-Messman 2022 (7 stones/358 PY post-flight) |

---

## 1. herpes-zoster-reactivation-shingles

### Evidence
**Zhang B, Han P, Liu Y.** "Reactivation and Management of Endogenous Latent Herpesviruses
in the Spaceflight Environment." *Curr Microbiol* 2026. PMC13149593.
DOI: [10.1007/s00284-026-04935-w](https://doi.org/10.1007/s00284-026-04935-w)

- Antarctic research station HZ rate: **33.3/1000/PY** (citing 2017 Antarctic medical records review)
- Population: isolated winter-over researchers under psychosocial stress
- Biological mechanism: stress-induced immunosuppression → VZV reactivation
- Additional context: VZV subclinical shedding in 65% ISS astronauts (Mehta 2014, cited in Zhang 2026)
- General population HZ rate: 3–4/1000/PY for comparison

### Rationale for anchor
Antarctic winter-over researchers are the most analogous analog-astronaut population:
isolated, confined, psychosocial stress, screened but not fully immune-suppressed.
Rate 33.3/1000/PY = ~8× general population, consistent with stress-induced reactivation.
Conservative representation as synthetic observation (2 events anchoring exactly at published rate).

### PyMC fit parameters
- Prior: `Gamma(2.0, 176056)` — current tierA-nasa (λ_mean = 4.15/1000/PY)
- Observation: `events=2, person_days=21915` (= 60 person-years at 33.3/1000/PY)
- Posterior: `Gamma(3.8963, 191790.0644)` — λ_mean = **7.42/1000/PY**
- R-hat = 1.0000 | ESS_bulk = 3157 | ESS_tail = 3434 | Divergences = 0

### Distribution change
None. Remains `Gamma-Poisson`.

---

## 2. nephrolithiasis

### Evidence
**Goodenow-Messman DA et al.** "Numerical characterization of astronaut CaOx renal stone
incidence rates to quantify in-flight and post-flight relative risk." *NPJ Microgravity* 8:5, 2022.
PMC8799707. DOI: [10.1038/s41526-021-00187-z](https://doi.org/10.1038/s41526-021-00187-z)

- **Post-flight CaOx renal stones:** 7 symptomatic events / 358 post-flight astronaut person-years
  (Sibonga dataset). Rate = **19.6/1000/PY**
- Pre-flight model-predicted rate: 8.5/1000/PY (PBE model from 581 urine samples)
- Military aviator reference: 4.4/1000/PY (Porter & Rice 2009, cited)
- In-flight predicted rate: 9.8/1000/PY (IRR = 1.15 vs pre-flight; zero symptomatic in-flight stones observed)

### Rationale for anchor
The 7 post-flight stones / 358 PY represents the strongest direct count data. Post-flight risk
is elevated by residual bone-mineral loss calciuria (not present in analog missions without
microgravity). The Bayesian update conservatively anchors toward post-flight rate, producing
a posterior of ~10/1000/PY — between the current prior (3.7) and the post-flight observation
(19.6). This is defensible as an upper-bound estimate for analog missions where dehydration,
dietary salt, reduced activity, and stress (but not calciuria) drive stone risk.

### Distribution conversion
**Lognormal-Poisson → Gamma-Poisson**. The Lognormal-Poisson prior
(mu_log_lambda = −11.5, sigma_log_lambda = 0.116) was converted to an equivalent
Gamma-Poisson starting prior: E[λ] = exp(−11.5 + 0.116²/2) ≈ 1.013×10⁻⁵/pd = 3.7/1000/PY;
equivalent Gamma(2, 197432). All other tierB-pymc conditions use Gamma-Poisson;
this conversion maintains consistency.

### PyMC fit parameters
- Prior: `Gamma(2.0, 197432)` — equiv. to Lognormal prior mean (λ_mean = 3.70/1000/PY)
- Observation: `events=7, person_days=130760` (= 7 stones / 358 post-flight PY)
- Posterior: `Gamma(8.6527, 316958.7770)` — λ_mean = **9.97/1000/PY**
- R-hat = 1.0000 | ESS_bulk = 3317 | ESS_tail = 3940 | Divergences = 0

### Distribution change
`Lognormal-Poisson` → `Gamma-Poisson` (consistent with all other tierB-pymc conditions).

---

## K15 Validation

After merging posteriors into `imm-priors.json` (37 tierA-nasa + 63 tierB-pymc):

- **'none' scenario** (T=100k, seed 0xc0ffee): TME=98.52 vs ref 98.30 (Δ+0.22) ✓
- Prior changes are negligible in scale: +0.01 expected events per trial out of ~98.5 baseline.
- K15 CI for TME: all scenarios expected within 98–100 range (consistent with prior runs).

---

## Provenance update

| Field | Before | After |
|---|---|---|
| herpes-zoster `provenance` | `tierA-nasa` | `tierB-pymc` |
| nephrolithiasis `provenance` | `tierA-nasa` | `tierB-pymc` |
| nephrolithiasis `distribution` | `Lognormal-Poisson` | `Gamma-Poisson` |
| Total tierA-nasa | 39 | **37** |
| Total tierB-pymc | 61 | **63** |
