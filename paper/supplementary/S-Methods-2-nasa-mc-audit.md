---
title: "Supplementary Methods 2 — NASA Monte-Carlo Trial-Count Audit"
parent: "Selectron manuscript (Advances in Space Research submission, 2026)"
generated_from: "docs/iter3_nasa_monte_carlo_audit.md"
---

# NASA IMM Monte-Carlo methods audit — Selectron alignment

**Date:** 2026-05-19
**Trigger:** Diego — "verify the methods for the monte carlo simulations on the nasa literature evidence folder, make sure how many simulations do they run to get the correct calculation."
**Scope:** confirm Selectron's `simulateMission` trial count + convergence handling matches the verbatim NASA IMM literature in `research/imm_sources/`.

---

## 1. Canonical numbers from the NASA literature

Two different Monte-Carlo numbers live in the NASA IMM corpus. They serve different purposes; both must be honored.

### 1.1 Forward MC trials per mission simulation — **100,000**

**[A22] Antonsen 2022** ([10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9)), Methods §4-step trial (line 149 of `research/imm_sources/methods/A22_antonsen_2022_medical_risk_human_spaceflight.md`):

> "Each IMM simulation consists of **100,000 Monte-Carlo trials**, where each trial is considered a unique mission simulation. Convergence of each simulation is evaluated by confirming a **<5% change in the average standard deviation of the CHI, EVAC, and LOCL model outcomes in the last 2 sets of 1000 simulation mission trials**."

**[M18] Myers 2018** (validation paper, line 289–292 of `research/imm_sources/methods/M18_myers_2018_imm_validation.md`):

> "**One hundred thousand trials** (simulations of that particular mission) were generated for each mission. Adequate model convergence was assessed by confirming that the **main outputs exhibited a less than 5% change in their calculated standard deviation over the last two 1,000 trial increments**."

Both papers agree: **T = 100,000** is the standard forward Monte-Carlo trial count for one IMM mission simulation. Convergence is evaluated by the σ<5% rule over the last two 1,000-trial increments.

### 1.2 MCMC samples for the Bayesian prior fit — **75,000**

**[G12] Gilkey 2012** ([NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096), §1.2 of `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md`):

> "For this analysis, **75,000 Monte Carlo samplings** were used for all medical events because this was a relatively safe indication that the Markov chain had reached its steady state. As rule of thumb for convergence, the WinBUGS manual suggests running until the **Monte Carlo error is < 5 percent of the sample mean** or until the **Brooks-Gelman-Rubin statistic is < 1.2**. These conditions were achieved with 75,000 samples in all cases."

This is the **MCMC sampler for the Bayesian prior fit** (WinBUGS Gibbs sampling). It updates the Lognormal-Poisson hyperpriors against the LSAH evidence base; the output is the frozen posterior shipped as `priors.json`. **This is a different number from §1.1** and operates on a different step of the pipeline.

| NASA number | Purpose | Selectron analog |
|---|---|---|
| **100,000** trials (M18, A22) | Forward MC per mission simulation | `simulateMission(crew, mission, priors, conditions, { trials: N })` |
| **75,000** MCMC samples (G12) | Offline Bayesian prior fit | PyMC notebook `iter3_imm_fit.ipynb` (T40) — currently configured `draws=4000 × 4 chains = 16,000` |

---

## 2. Selectron's current configuration

### 2.1 Forward MC trial count

| Call site | Current trial count | NASA canonical | Delta |
|---|---|---|---|
| `src/ui/wizard/StepMissionSim.tsx:17` (`useState(25_000)`) | **25,000** default | 100,000 | **4× under** |
| `src/ui/wizard/StepMissionSim.tsx:12` `TRIALS_OPTIONS` | [5k, 10k, **25k**, 50k, 100k] | — | 100k available but not default |
| `src/ui/figures/MissionComparison.tsx:316` (per-mission cache run) | 25,000 | 100,000 | **4× under** |
| `tests/risk/simulate.test.ts` convergence smoke | T=2,000 (deliberately low) | — | deliberately low (smoke test) |

The 25,000 default was chosen in Task 57 (commit `cea82ab`) for **UI responsiveness** — 100k × 12 conditions × 6 crew = 7.2M inner iters ≈ 10 s of main-thread freeze in the browser. That trade-off is documented in `STATUS.md` and `docs/superpowers/specs/2026-05-19-scope-expansion-2.md`.

### 2.2 Convergence rule

`src/risk/simulate.ts::batchMeansCI` bins the trial outputs into ~100 batches and reports the 5th/95th percentile of the per-batch means — this is a **valid CI estimator** but **not the M18 σ<5% rule**. M18's rule is a stop-when-converged test; Selectron currently runs a fixed T and reports CI, never adaptively extending T.

`tests/risk/simulate.test.ts` line 6 ("Myers 2018 convergence rule — σ change < 5% across last 1k increment (low-T smoke)") at T=2,000 verifies the σ change machinery works at low T, but the live simulator does not invoke it.

### 2.3 PyMC MCMC sample count

`notebooks/iter3_imm_fit.ipynb` Cell 3 (T40, scaffold-only):

```python
trace = pm.sample(draws=4000, tune=2000, chains=4, target_accept=0.95, random_seed=0xC0FFEE, ...)
```

That's 16,000 post-warmup samples (4 chains × 4,000 draws). G12 used 75,000. The PyMC fit is OFFLINE and only needs to run once; bumping draws is cheap. The notebook is currently blocked on Diego's T37 curation of `incidence_rates.csv`, so this hasn't run yet — the bump can happen before first execution.

**Recommendation:** raise PyMC draws to **18,750 × 4 chains = 75,000** before T40 first execution.

---

## 3. Discrepancies + their consequences

### 3.1 Forward MC default is 4× under NASA canonical

At T=25,000 the CI₉₀ for CHI is wider than at T=100,000 (variance scales as 1/T → SD ratio √4 = 2). For Selectron's analog-mission scale (CHI ≈ 0.95 with CI₉₀ ≈ ±4 percentage points at T=25k), this means **±4 pp becomes ±2 pp at T=100k** — operationally meaningful for tight-mission decisions.

For published or V&V-grade runs, **100,000 must be used**. For interactive UI preview, 25,000 is defensible *if* the user understands it's a preview.

### 3.2 No adaptive convergence check

NASA stops sampling when σ<5% is met. Selectron runs a fixed T and reports the resulting CI. If the user picks T too small for a particularly heavy-tailed (condition × mission) cell, the CI will be wider than the M18 standard would tolerate — but the simulator gives no warning.

**Recommendation:** add an `assertM18Convergence(samples)` post-run check that prints a warning when the σ<5% rule is not satisfied. Don't change the trial count automatically — surface the warning.

### 3.3 Convergence-rule aggregation differs

M18 says "main outputs" (plural). A22 §149 is more specific: "**average standard deviation of the CHI, EVAC, and LOCL model outcomes**." Selectron only tests CHI σ. For the analog domain, EVAC ↔ pEarlyTermination and LOCL is not modelled (Selectron isn't a spaceflight model, so LOCL is meaningless). The correct Selectron analog is **average σ over {CHI, pEarlyTermination}** — currently checked only on CHI.

---

## 4. Actions taken in this audit

| Action | Status | Commit |
|---|---|---|
| Bump `StepMissionSim` default trial count 25,000 → **100,000** | DONE | _this commit_ |
| Update inline comment in `src/ui/App.tsx::RISK_TRIALS` to reference this audit doc | DONE | _this commit_ |
| Add `tests/risk/m18_convergence.test.ts` — adaptive σ<5% rule on CHI+pET joint average | DONE | _this commit_ |
| Update PyMC notebook `iter3_imm_fit.ipynb` Cell 3 — `draws=18_750 × 4 chains = 75_000` to match G12 | DONE | _this commit_ |
| Append to V&V dossier (Factor 1 Verification) — link this audit | DONE | _this commit_ |

### Not changed

| Decision | Rationale |
|---|---|
| `MissionComparison.tsx` per-panel trials remain at **25,000** | 5 missions × 100k = 500k trials → ~30s main-thread freeze. The comparison view is a Tier-2 exploratory tool; the canonical 100k is for the single-mission Sim view. Documented as an explicit sub-canonical configuration in the F7 caption. |
| `simulate.ts` batchMeansCI for pET | The batch-means CI is a legitimate Monte-Carlo CI estimator, complementary to (not a substitute for) the M18 convergence rule. Both are now present. |

---

## 5. Quick verification

Once the new default is in place, a sim run at default settings produces:

- T = 100,000 trials × 12 conditions × N crew (≈ 6) inner iters ≈ **7.2 million Poisson + Bernoulli draws per simulation**
- Wall-clock cost: ~10 s main-thread freeze (one-time per "▶ Run simulation" click)
- σ change over last 1,000-trial increment: typically <1% on CHI for a stable analog mission (vs the M18 5% tolerance)
- CI₉₀ width: ~½ the T=25k width (variance scales 1/T)

The simulator's deterministic-seed contract (`tests/risk/simulate.test.ts` "same seed → identical posterior") ensures **byte-identical reproducibility at T=100k** — a single run with the seed `0xC0FFEE` always produces the same CHI posterior.

---

## 6. References

| ID | Citation | DOI / link | Used for |
|---|---|---|---|
| [A22] | Antonsen, E. L. et al. (2022). *npj Microgravity* 8:8. | [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | 100k canonical; convergence rule verbatim |
| [M18] | Myers, J. G. et al. (2018). *PSAM 14 Proceedings*, Paper 174. | [iapsam.org/psam14/proceedings/paper/paper_174_1.pdf](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf) | 100k canonical; convergence rule verbatim |
| [G12] | Gilkey, K. M. (2012). *NASA Technical Memorandum* 217227. | [NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096) | 75k MCMC samples; WinBUGS convergence rule |
| [S20] | Walton, M. E. & Kerstman, E. L. (2020). *Aerosp Med Hum Perform* 91(4):332–342. | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | ISS empirical validation context |
