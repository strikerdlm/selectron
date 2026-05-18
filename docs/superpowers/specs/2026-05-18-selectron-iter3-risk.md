# Selectron Iter 3 — analog-mission risk module (NASA-IMM-inspired)

**Author:** Diego L. Malpica, MD (drafted by controller; ratify before implementation)
**Date:** 2026-05-18
**Status:** Draft (pre-Iter-2; ratification gates implementation)
**Predecessor specs:**
- [Selectron design spec](2026-05-18-selectron-design.md)
- Iter 1/2 plan: [`docs/superpowers/plans/2026-05-18-selectron-iter1-phase0.md`](../plans/2026-05-18-selectron-iter1-phase0.md)

**Methodological sources (all primary, verified verbatim via firecrawl):**

| Ref | Citation | Role in Iter 3 |
|---|---|---|
| [G12] | Gilkey, K. M., McRae, M. P., Griffin, E. A., Kalluri, A. S., & Myers, J. G. (2012). *Bayesian analysis for risk assessment of selected medical events in support of the Integrated Medical Model effort.* NASA/TP-2012-217120. ([NTRS](https://ntrs.nasa.gov/citations/20120013096); [CORE PDF](https://core.ac.uk/download/pdf/10569519.pdf)) | **Primary method paper.** Lognormal prior + Poisson likelihood + WinBUGS (Markov-chain Monte Carlo via Gibbs sampling) for IMM rare-event incidence rates. 75,000 MC samples; MC error < 5%. |
| [M18] | Myers, J. G., Garcia, Y., Arellano, J., Boley, L., Goodenow, D., Kerstman, E., Koslovsky, M., Reyes, D., Saile, L., Taiym, W., & Young, M. (2018). *Validation of the NASA Integrated Medical Model: A space flight medical risk prediction tool.* PSAM 14 Proceedings, Paper 174. ([IAPSAM PDF](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf)) | **Primary architecture + validation paper.** Poisson process for rate-dependent conditions; binomial for event-triggered conditions; 100,000 trials per mission; convergence rule (< 5% σ change over last two 1,000-trial increments). |
| [A22] | Antonsen, E. L., Myers, J. G., Boley, L., Arellano, J., Kerstman, E., Kadwa, B., Buckland, D. M., & Van Baalen, M. (2022). Estimating medical risk in human spaceflight. *npj Microgravity*, 8, 8. [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | **Most current overview.** 4-step Monte Carlo trial: occurrence → progression → treatment → outcome. Defines CHI, pEVAC, pLOCL. |
| [K15] | Keenan, A. M., et al. (2015). *The Integrated Medical Model: A probabilistic simulation model predicting in-flight medical risks.* NASA NTRS 20150018879. | Concept and architecture reference. |
| [W14] | Walton, M. E., Mulugeta, L., Nelson, E. S., & Myers, J. G. (2014). *NASA-STD-7009 guidance document for human health and performance models and simulations.* NASA NTRS 20140017301. | V&V rubric. Eight credibility factors. |
| [S20] | Walton, M. E., & Kerstman, E. L. (2020). Quantification of medical risk on the ISS using the IMM. *Aerosp Med Hum Perform*, 91(4), 332–342. [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | ISS-specific validation; benchmark for analog validation strategy. |

---

## 1. What Iter 3 adds

Iter 3 extends Selectron from a **selection-scoring engine** (Iter 1 + Iter 2) to a
**selection + analog-mission risk-management framework**, by adding a second
engine modelled on NASA's Integrated Medical Model (IMM) but adapted to
Earth-based analog missions (Mars500, HI-SEAS, MDRS, Antarctic winter-over,
EMMPOL, THOR).

Concretely, Iter 3 ships:

1. **Stage B engine** (`src/risk/`) — a forward-Monte-Carlo simulator over a
   PRA event tree for a selected crew on a chosen analog mission, returning
   posterior distributions on:
   - `pEarlyTermination` — analog for [S20]'s pEVAC.
   - `pAdverseEvent` per condition — analog for IMM's per-condition output.
   - `expectedLostCrewDays` — analog for IMM's Quality Time Lost (QTL) [M18 §2.1.2].
   - `crewHealthIndex` (CHI) — direct adoption of [A22] Fig. 1 / [M18 §2.1.2]
     normalized measure (Available Mission Time − QTL) / Available Mission Time.

2. **Frozen offline-fit posteriors** (`src/risk/priors.json`) — output of a
   PyMC notebook (`notebooks/iter3_imm_fit.ipynb`) that implements the
   hierarchical Bayesian model of [G12] (lognormal prior + Poisson likelihood
   + MCMC via Gibbs sampling, ported from WinBUGS to PyMC's NUTS sampler with
   posterior-equivalent results), updated against the 31-paper I&C evidence
   corpus in `research/evidence/`. The notebook is run **once**, off the
   critical path; only the frozen posterior is shipped with the TS app.

3. **Two-stage UI** — adds a Risk panel to the existing Selectron UI: select
   crew (Stage A output) + pick analog mission → posterior risk metrics with
   credible intervals and per-condition contributions.

4. **Iter 3 acceptance + V&V** following [W14] NASA-STD-7009's eight
   credibility factors, adapted for the analog-mission domain (the standard is
   spaceflight-specific; some factors require explicit reframing for analog
   data).

---

## 2. Why this is novel and worth shipping

Triangulated against [A6's precedent map](../../../research/methodology_precedents.md):

1. **No published Bayesian MCDA for astronaut/analog selection** (Iter 1's
   novelty, confirmed by A6).
2. **No published PRA/IMM-class model for analog missions.** IMM itself is
   spaceflight-only and closed government code. The Antarctic/Mars500/HI-SEAS
   medical-event literature is descriptive rather than simulation-based. This
   is the second methodological novelty.
3. **First two-stage selection-then-risk architecture** in personnel
   selection — most selection frameworks stop at a ranked list; coupling
   selection to a downstream condition-occurrence simulator is itself a
   contribution.
4. **First open-source TypeScript implementation of an IMM-class model.**
   IMM ships in proprietary software [M18 ref 37 = IMM-Plan-101]; PyMC + TS
   gives a fully reproducible artifact.

This becomes **Paper #2 of the Selectron series**. Target venue: *npj
Microgravity* (engages the IMM authorship community) or *Computers in Biology
and Medicine* (engineering-focused). *Aerospace Medicine and Human
Performance* held as fallback.

---

## 3. The four mathematical models (verbatim from primary sources)

### 3.1 Rate-dependent condition occurrence — Poisson process [M18 §2.1.2]

> "Generated incidence rates IMM ... for rate-dependent conditions are
> assumed constant for the duration of a simulated mission and event
> occurrences are governed by a **Poisson Process (exponential waiting
> times between events)**." — [M18]

For condition $k$ on mission $m$ of duration $t_m$ person-days and crew
size $c$:

$$
N_{k,m} \mid \lambda_k \;\sim\; \mathrm{Poisson}\bigl(\lambda_k \cdot t_m \cdot c\bigr)
$$

where $\lambda_k$ is the per-person-day incidence rate. Selectron Iter 3
**extends this** with a candidate-vulnerability multiplier conditioned on
Stage A's normalized score vector $\boldsymbol{z}_i$ for crew member $i$:

$$
\lambda_{k,i} \;=\; \lambda_k^{\text{base}} \cdot \exp\bigl(\boldsymbol{\beta}_k^\top \boldsymbol{z}_i\bigr)
$$

where $\boldsymbol{\beta}_k$ is a per-condition log-linear vulnerability
coefficient vector elicited from the corpus (e.g., $\beta_{\text{psychiatric}, \text{neuroticism}} > 0$
from Palinkas 2004). This is the standard PRA scaling convention and
preserves Poisson conjugacy.

### 3.2 Event-triggered condition occurrence — Binomial [M18 §2.1.2]

> "The IMM assumes conditions associated with specific mission events, such
> as during adaptation to the spaceflight environment, extravehicular
> activity (EVA) or following solar particle events, follow a **binomial
> distribution**." — [M18]

For condition $k$ triggered by event $e$ (e.g., a planned EVA simulation, a
medical countermeasure session, a docking exercise):

$$
N_{k,e} \mid p_k, n_e \;\sim\; \mathrm{Binomial}(n_e, p_k)
$$

where $n_e$ is the number of trigger events scheduled on the mission and
$p_k$ is the per-event probability of condition occurrence.

### 3.3 Severity branching — best/worst case [A22 methods + M18 §2.1.2]

> "Each IMM Monte-Carlo iteration includes medical condition occurrence
> along the Mission Timeframe that progress to a **Best or Worst Case
> scenario** in the Progression Path Assessment Step. Best and worst-case
> scenarios for medical conditions are generated based on probability
> distributions." — [A22]

For each condition occurrence:

$$
\text{Severity} \mid q_k \;\sim\; \mathrm{Bernoulli}(q_k)
$$

where $q_k$ is the per-condition worst-case probability from the evidence
corpus.

### 3.4 Treatment path — partial credit [M18 §2.1.2]

> "The IMM generates outcomes for a condition based on the **proportion of
> treatment available** allowing for partial credit in having some but not
> all of the resources required for treatment of a simulated event. The
> IMM implements this partial credit by defining outcome distributions for
> the fully-treated and untreated distributions as the extremes, and using
> the proportion of treatment available to shift continuously between
> them." — [M18]

For occurrence $j$ of condition $k$ with severity $s_j \in \{0, 1\}$ and
treatment fraction $\tau_j \in [0, 1]$ (set by countermeasure availability
and mission-rules look-up):

$$
\text{LostCrewDays}_j \;=\; (1 - \tau_j) \cdot D_{k, s_j}^{\text{untreated}} \;+\; \tau_j \cdot D_{k, s_j}^{\text{treated}}
$$

where $D_{k, s}^{\cdot}$ are the per-condition severity-conditional lost-day
distributions (lognormal or empirical) from the corpus.

### 3.5 Mission-level aggregation — CHI, pEarlyTermination [A22 + M18]

For each Monte Carlo trial $\omega$:

$$
\mathrm{QTL}^{(\omega)} \;=\; \sum_{i, k, j} \text{LostCrewDays}_j^{(\omega)}
$$

$$
\mathrm{CHI}^{(\omega)} \;=\; 1 \;-\; \mathrm{QTL}^{(\omega)} / (t_m \cdot c)
$$

$$
\mathbb{1}[\text{EarlyTermination}]^{(\omega)} \;=\; \mathbb{1}\bigl[\mathrm{CHI}^{(\omega)} \le \chi^*\bigr]
$$

where $\chi^*$ is the analog-mission early-termination threshold (e.g.,
$\chi^* = 0.7$ — calibrate from Antarctic winter-over historical evacuation rates).

Posterior estimates:

$$
\widehat{\mathrm{CHI}} = \frac{1}{T}\sum_\omega \mathrm{CHI}^{(\omega)}, \quad
\widehat{p}_{\text{ET}} = \frac{1}{T}\sum_\omega \mathbb{1}[\text{EarlyTermination}]^{(\omega)}
$$

with $T = 100{,}000$ trials per [M18 §2.2.2] convergence criterion.

### 3.6 Upstream Bayesian fit for $\lambda_k$ — Lognormal–Poisson via MCMC [G12]

This is the part of the pipeline the user called "Monte Carlo Markov
Chains". Verbatim methodology from [G12 §1.2 + §3-style template]:

> "All prior data used to define the incidence rate were assumed to be
> **lognormal**. The **Poisson distribution** was chosen to be the
> governing probability distribution (i.e., likelihood) for incidence
> values because it includes time (person-years) as an element in the
> probability equation. ... All Bayesian updates were performed using the
> open-source numerical update code called the Bayesian inference Using
> Gibbs Sampling (WinBUGS). WinBUGS is a computer software program that
> uses **Markov-chain Monte Carlo methods** to perform Bayesian analysis
> of complex statistical models." — [G12]

> "For this analysis, **75 000 Monte Carlo samplings** were used for all
> medical events because this was a relatively safe indication that the
> **Markov chain had reached its steady state**. As rule of thumb for
> convergence, the WinBUGS manual suggests running until the **Monte Carlo
> error is < 5%**." — [G12]

**Selectron's Iter 3 port:** WinBUGS is unmaintained. Re-implement the
identical statistical model in **PyMC** (NUTS sampler — modern HMC variant,
posterior-equivalent to Gibbs for this conjugate-friendly model, with
better diagnostics) **plus** validate equivalence by running JAGS in
parallel on a subset of conditions and confirming posterior summaries
match to within Monte Carlo error.

Per-condition $k$, with $J$ evidence-source studies indexed by $j$:

$$
\begin{aligned}
\log \lambda_k &\sim \mathcal{N}(\mu_k^{\text{lit}}, (\sigma_k^{\text{lit}})^2) \quad \text{(lognormal prior on incidence rate)} \\
N_{k,j} \mid \lambda_k, T_{k,j} &\sim \mathrm{Poisson}(\lambda_k \cdot T_{k,j}) \quad \text{(per-study likelihood)}
\end{aligned}
$$

where $\mu_k^{\text{lit}}, \sigma_k^{\text{lit}}$ are derived from the
literature via Gilkey's [G12] error-factor parameterization:

$$
\text{EF}_k = \sqrt{\lambda_k^{(95)} / \lambda_k^{(5)}}, \quad \sigma_k = \frac{\ln(\text{EF}_k)}{1.645}
$$

**Hierarchical extension** (this is where the Iter 3 contribution adds
genuine novelty over [G12]'s flat model): partial pooling across analog
mission types:

$$
\begin{aligned}
\mu_k &\sim \mathcal{N}(0, 10^2) \\
\tau_k &\sim \mathrm{HalfCauchy}(2.5) \\
\log \lambda_{k,m} &\sim \mathcal{N}(\mu_k, \tau_k^2) \quad \text{(mission-type random effect)} \\
N_{k,m,j} \mid \lambda_{k,m}, T_{k,m,j} &\sim \mathrm{Poisson}(\lambda_{k,m} \cdot T_{k,m,j})
\end{aligned}
$$

This lets a 5-event Antarctic dermatology series inform an HI-SEAS prior
without overweighting either cohort. The posterior on $\{\mu_k, \tau_k, \lambda_{k,m}\}$
is what gets exported to JSON.

---

## 4. Module map

### 4.1 New folders

```
src/
  risk/                          # new — Stage B engine
    incidence.ts                 # Poisson + Binomial samplers w/ vulnerability multiplier
    progression.ts               # severity Bernoulli
    treatment.ts                 # partial-credit lookup; resource gating
    mission.ts                   # mission profile types (duration, EVA count, comms delay)
    conditions.ts                # 12 analog-relevant conditions (data, not logic)
    chi.ts                       # CHI, QTL, pEarlyTermination aggregation
    simulate.ts                  # main entry: runMissionTrial(crew, mission, priors, seed)
    priors.json                  # frozen output of PyMC notebook (DO NOT hand-edit)
    index.ts                     # barrel
  data/
    analog-missions.ts           # 5 analog mission profiles
  ui/
    components/
      MissionPicker.tsx          # new
      RiskCard.tsx               # CHI, pEarlyTermination, expected lost crew-days
      ConditionContribution.tsx  # per-condition stacked-bar of QTL contribution
      RiskHistogram.tsx          # ECharts plot of CHI / pET posteriors
tests/
  risk/
    incidence.test.ts            # Poisson sampler vs closed-form mean/variance
    progression.test.ts          # Bernoulli sampler
    treatment.test.ts            # partial-credit interpolation correctness
    chi.test.ts                  # CHI bounds [0, 1]; QTL non-negative
    simulate.test.ts             # end-to-end determinism by seed; convergence per [M18]
    priors.test.ts               # JSON schema validation; coverage of all 12 conditions × 5 missions
notebooks/
  iter3_imm_fit.ipynb            # offline PyMC fit; produces priors.json
  iter3_jags_crosscheck.ipynb    # JAGS cross-validation on subset of conditions
research/
  evidence_extracted/
    incidence_rates.csv          # extracted (person-days, events) from corpus per (condition, mission_type, study)
```

### 4.2 Reuse from Iter 1/2

`src/engine/prng.ts` (Mulberry32) — reused. Same seed contract.
`src/engine/gamma.ts` — reused for Gamma-Poisson conjugate sanity tests.
`src/engine/normalize.ts` — reused for z-score normalization of Stage A scores into Stage B vulnerability multipliers.
`src/engine/errors.ts` — extend `SelectronErrorCode` union with `E_BAD_MISSION`, `E_BAD_CONDITION`, `E_BAD_PRIOR`.

### 4.3 Stable contract between stages

```typescript
// src/types/risk.ts
export type AnalogMission = {
  id: string;                     // "antarctic-winter-over" | "mars500-520d" | ...
  type: "antarctic" | "mars500" | "hi-seas" | "mdrs" | "emmpol" | "thor";
  durationDays: number;
  crewSize: number;
  evaCount: number;
  commsDelaySec: number;          // 0 for Antarctic, 1320 for Mars Distant-DRM
  countermeasures: CountermeasureSet;
  citations: string[];            // DOIs from research/evidence/
};

export type Condition = {
  id: string;                     // "insomnia" | "depression-anxiety" | ...
  family: "psychiatric" | "physiologic" | "musculoskeletal" | "performance" | "team";
  kind: "rate" | "event";         // Poisson vs Binomial
  vulnerabilityCriteria: string[]; // Iter 1/2 criterion ids that modulate λ
  citations: string[];
};

export type RiskPosterior = {
  chi: { mean: number; ci90: [number, number]; ci95: [number, number] };
  pEarlyTermination: { mean: number; ci90: [number, number] };
  expectedLostCrewDays: { mean: number; ci90: [number, number] };
  perConditionQTL: Record<string, { mean: number; ci90: [number, number] }>;
  ess: number;
  trials: number;
};
```

---

## 5. The 12-condition analog catalog (Iter-3 v1)

Mapped to the 31-paper corpus. Each row names the primary source(s) Selectron
will use to elicit $(\mu_k^{\text{lit}}, \sigma_k^{\text{lit}})$:

| # | Condition id | Kind | Vulnerability criterion (Iter 2 ↦) | Primary source(s) in `research/evidence/` |
|---|---|---|---|---|
| 1 | `insomnia` | rate | sleep quality, chronotype | Pattyn 2017, Glos 2026, Gemignani 2014 |
| 2 | `depression-anxiety` | rate | emotional_stability | Basner 2014, Palinkas 2004, Sandal 2018, Tortello 2020 |
| 3 | `conflict-event` | event | teamwork, conscientiousness | Basner 2014, Roma & Bedwell 2017, Tafforin 2013 |
| 4 | `circadian-disruption` | rate | chronotype, comms-delay tolerance | Vigo 2013, Pattyn 2017, Glos 2026 |
| 5 | `immune-incident` | rate | physical fitness, sleep | Ponomarev 2021, Shved 2022, Pagel & Choukér 2016 |
| 6 | `latent-virus-reactivation` | rate | immune marker, stress | Ponomarev 2021, Pagel & Choukér 2016 |
| 7 | `musculoskeletal-injury` | event | VO₂max, training history | Hudson n.d., Abeln 2022 |
| 8 | `performance-drop-PVT` | rate | sleep, cognitive flexibility | Basner 2014 (PVT trajectories) |
| 9 | `team-cohesion-loss` | rate | teamwork | Bell 2019, McMenamin 2020, Roma & Bedwell 2017 |
| 10 | `psychosocial-withdrawal` | rate | emotional_stability | Sandal 2018, Tortello 2020 |
| 11 | `early-termination-request` | event | composite | Palinkas 2004 (Antarctic incidence) |
| 12 | `comms-delay-coping-failure` | rate | comms-delay tolerance | Landon n.d., Verhoeven 2022 |

If [G12]'s set is 12 conditions, Selectron's analog set is also 12 — same
cardinality, different domain. Coincidence, but a nice symmetry for the
methodology paper.

---

## 6. The 5 analog mission profiles (Iter-3 v1)

| id | type | duration (d) | crew | EVAs | comms delay (s) | countermeasures (binary set) |
|---|---|---|---|---|---|---|
| `antarctic-winter-over` | antarctic | 365 | 12 | 0 | 0 | exercise, social comms (real-time), psych support |
| `mars500-520d` | mars500 | 520 | 6 | 0 | 1320 | exercise, comms (delayed), psych support, automated psychotherapy |
| `hi-seas-90d` | hi-seas | 90 | 6 | yes (sim) | 1200 (sim) | exercise, social comms (delayed), nutrition |
| `mdrs-2wk` | mdrs | 14 | 6 | yes (sim) | 0–600 | exercise, comms (mostly real-time) |
| `emmpol-6` | emmpol | 8–14 | 6 | yes (sim) | varies | exercise, social comms |

Mission profiles cite Cromwell 2021 (analog taxonomy), Barros-Delben 2026
(analog habitat protocol), Tafforin 2013/2015 (Mars-500/Tara), Dunn
Rosenberg 2022 (HI-SEAS), Giacon 2024 (EMMPOL-6), Malpica 2024 (THOR).

---

## 7. Offline PyMC notebook spec (`notebooks/iter3_imm_fit.ipynb`)

**Inputs.** `research/evidence_extracted/incidence_rates.csv` —
hand-curated extraction from the 31-paper corpus, schema:

```
condition_id, mission_type, study_doi, person_days, events, notes
```

Hand-curation is acceptable because (a) the corpus is small (31 papers,
manageable), (b) per [G12], the hardest part is exactly this extraction
("Subject matter experts assess the quality of the medical data, and the
iMED management enforces a strict configuration management process to
maintain medical data consistency"), and (c) the alternative (LLM
extraction) would introduce a credibility problem Iter 3 cannot afford.
Diego curates this in Iter 3 Phase A; controller-staged subagents may
*propose* candidate rows for Diego to review but must not commit them.

**Model.** Hierarchical Poisson–Lognormal (Section 3.6 above) in PyMC:

```python
import pymc as pm
import numpy as np
import pandas as pd

df = pd.read_csv("../research/evidence_extracted/incidence_rates.csv")
conditions = df["condition_id"].unique()
missions = df["mission_type"].unique()

with pm.Model() as imm_analog:
    mu = pm.Normal("mu_lograte", mu=0, sigma=10, dims="condition")
    tau = pm.HalfCauchy("tau_lograte", beta=2.5, dims="condition")

    log_lambda = pm.Normal("log_lambda", mu=mu[df["condition_idx"].values],
                                       sigma=tau[df["condition_idx"].values],
                                       dims="obs")
    rate = pm.math.exp(log_lambda) * df["person_days"].values
    pm.Poisson("events_obs", mu=rate, observed=df["events"].values, dims="obs")

    trace = pm.sample(draws=4000, tune=2000, chains=4, target_accept=0.95,
                       random_seed=0xC0FFEE)

# Verify against [G12] convergence rule
assert (pm.stats.summary(trace)["r_hat"] < 1.01).all()
assert (pm.stats.summary(trace)["ess_bulk"] > 1000).all()
```

**Cross-check.** A second notebook (`iter3_jags_crosscheck.ipynb`) runs
the same model in JAGS on a sub-sample of 4 conditions × 3 mission types,
to confirm NUTS posterior summaries match Gibbs to within MC error. Per
[G12]'s rule, MC error < 5% on incidence rate point estimates.

**Output.** `src/risk/priors.json` with schema:

```json
{
  "model_version": "iter3-v1",
  "fitted_at": "ISO-8601 timestamp",
  "pyMC_version": "5.x",
  "r_hat_max": "<float>",
  "ess_min": "<int>",
  "conditions": {
    "<condition_id>": {
      "missions": {
        "<mission_type>": {
          "log_lambda_samples": "<float[]>",  // 1000 thinned posterior samples
          "mean_log_lambda": "<float>",
          "sd_log_lambda": "<float>"
        }
      },
      "vulnerability_beta": {
        "<criterion_id>": "<float>"           // hand-elicited or fitted in Iter 4
      },
      "worst_case_prob_q": "<float>",
      "treated_lost_days_mean": "<float>",
      "untreated_lost_days_mean": "<float>"
    }
  }
}
```

1000 thinned posterior samples per (condition, mission) is enough for
forward MC in the browser without blowing up bundle size (~500 KB JSON).

---

## 8. UI extensions

Iter 3 adds a single new top-level tab to the existing Selectron UI:
**"Mission risk"**. Layout:

```
┌──────────────────────────────────────────────────────────────┐
│  Selectron — Mission risk                                    │
├──────────────────────────────────────────────────────────────┤
│  Crew (from Stage A):  [● Cand-007] [● Cand-014] [● ...]     │
│  Analog mission:       [Antarctic winter-over ▼]             │
│  Countermeasures:      [✓ exercise] [✓ psych support] [...]  │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  CHI posterior   |  pEarlyTermination  |  Lost crew-days ││
│  │   mean: 0.83     |    mean: 0.12        |   mean: 62 d   ││
│  │   CI₉₀: 0.74-0.91|    CI₉₀: 0.05-0.22   |   CI₉₀: 30-110 ││
│  └──────────────────────────────────────────────────────────┘│
│  Per-condition QTL contribution (stacked bar):               │
│   ████ depression-anxiety (mean 22d)                         │
│   ███  insomnia (mean 18d)                                   │
│   ██   immune-incident (mean 11d)                            │
│   ...                                                        │
│  CHI posterior histogram (ECharts):                          │
│   [▁▁▂▃▅▇█▇▅▃▂▁▁]    mean 0.83, CI₉₀ shaded                  │
└──────────────────────────────────────────────────────────────┘
```

ECharts components already registered in Iter 1 (`PosteriorPlot.tsx`); the
new `RiskHistogram.tsx` is a thin wrapper with different bin counts and
axis labels.

---

## 9. V&V — NASA-STD-7009 adapted for analog domain [W14]

[W14] defines eight credibility factors. Iter 3 must explicitly address each:

| # | Factor | Iter 3 evidence |
|---|---|---|
| 1 | Verification | Closed-form Poisson-Gamma conjugate sanity check (analog of Iter-1's Dirichlet check at `tests/engine/mcda.test.ts`); fixed-value PRNG determinism per seed. |
| 2 | Validation | Leave-one-mission-type-out cross-validation: fit on Mars500 + HI-SEAS + Antarctic, predict EMMPOL incidence; report % within 90% CI per condition. Mirrors [M18 §3] but on analog data. |
| 3 | Development data pedigree | `research/evidence/INDEX.md` lists 31 papers with DOIs; `incidence_rates.csv` carries study DOI per row. |
| 4 | Input data pedigree | Hand-curated by Diego; documented in `notebooks/iter3_imm_fit.ipynb` audit cell. |
| 5 | Uncertainty characterization | Full posterior reported with CI₉₀ and CI₉₅, not point estimates. Per-condition contribution shown. |
| 6 | Results robustness | Sensitivity analysis: rerun forward MC with $\tau_k$ scaled by $\{0.5, 1, 2\}$; report rank stability of mission rankings. |
| 7 | Model use history | Iter 4 (methodology paper) IS the use-history publication. |
| 8 | Model management | Git history; `priors.json` versioned by `model_version` field. |

---

## 10. Sequencing — Iter 3 phases

Iter 3 cannot start until Iter 2 is in. Within Iter 3:

| Phase | Owner | Deliverable | Blocking gate |
|---|---|---|---|
| **3A — Evidence extraction** | Diego (+ controller-staged subagent proposals only) | `research/evidence_extracted/incidence_rates.csv` curated from the 31 papers | Diego ratifies CSV before 3B starts |
| **3B — Offline PyMC fit** | Controller | `notebooks/iter3_imm_fit.ipynb` + `iter3_jags_crosscheck.ipynb` + `src/risk/priors.json` | r-hat < 1.01 on all parameters; JAGS cross-check agrees within MC error |
| **3C — TS engine** | Implementer subagents (5 tasks: incidence, progression, treatment, chi, simulate; TDD each) | `src/risk/*.ts` + matching `tests/risk/*.test.ts`; full vitest green; closed-form Poisson check < 2% on mean | Math reviewer + quality reviewer sign-off |
| **3D — UI** | Implementer subagents (3 tasks: MissionPicker, RiskCard, RiskHistogram) | `src/ui/components/Risk*.tsx`; smoke build green; manual UI sanity by Diego | Diego manual sanity |
| **3E — Acceptance** | Controller | Full-suite test green; manual end-to-end smoke (select crew → pick mission → see risk posterior); release commit | Diego release approval |
| **3F — Paper** | Diego + controller | Methods section from this spec verbatim; results from running Selectron on 6 simulated candidate cohorts × 5 missions; discussion citing [G12], [M18], [A22] | Submission |

Effort budget: 3A ≈ 1 week (slow, careful); 3B ≈ 3 days; 3C ≈ 1 week; 3D ≈ 3 days;
3E ≈ 1 day; 3F ≈ 3 weeks. Total ≈ 5 weeks of focused work.

---

## 11. Risks and explicit non-goals

### Risks

1. **Curation throughput.** Section 3A bottlenecks on Diego's bandwidth for
   hand-extracting `(person-days, events)` tuples from 31 papers. Many
   papers do not report person-days explicitly. Mitigation: extract only
   where unambiguous; flag the rest as "indeterminate" and exclude from
   the fit. Per [M18 §3], IMM itself has indeterminate conditions; this
   is acceptable in the literature.
2. **Between-analog heterogeneity.** Mars500 ≠ HI-SEAS ≠ Antarctic on
   conflict-event rates (different crew composition, mission duration,
   communication patterns). The hierarchical model handles this if and
   only if there are ≥ 2 missions per type. For thin types (THOR, EMMPOL),
   the model falls back to the cross-type prior. Document this honestly.
3. **Vulnerability coefficient elicitation.** $\boldsymbol{\beta}_k$
   ideally would be fitted from individual-level data, but the corpus
   reports group-level aggregates. Iter 3 v1 hand-elicits $\boldsymbol{\beta}_k$
   from effect-size meta-data in the A3 / A4 / A5 evidence tables; Iter 4
   could fit individual-level $\boldsymbol{\beta}_k$ if a multi-mission
   individual-level dataset becomes available.
4. **Out-of-scope validation.** Selectron has no analog-mission outcome
   labels (we are not running analog missions; we are modelling them).
   Validation is therefore internal (closed-form, cross-mission CV) plus
   face-validity panel of analog-mission PIs. Disclose explicitly.

### Non-goals for Iter 3

- Real-time biomonitoring or wearable integration. Out of scope; defer to a
  separate project.
- A full taxonomy of all possible analog-mission conditions. Iter 3 ships
  12; future versions can expand.
- Mission-design optimization (analog of [Minard 2011] medical-kit
  optimization). Possible Iter 4 extension; explicitly deferred.
- MCMC inside the browser. The offline-fit + frozen-JSON pattern is a
  deliberate choice — see Section 3.6 rationale.

---

## 12. Open questions for Diego

1. **Mission types.** Should THOR (your own analog) be included in v1, or
   held for v2 when you have more THOR data? Including it now risks
   over-fitting to your own data; including it later may smell like
   self-promotion. *Recommendation: include if ≥ 1 paper has reportable
   (person-days, events) for THOR.*
2. **CHI threshold $\chi^*$.** What value for early termination? Antarctic
   winter-over historical rate of medical evacuation is ~0.5–2% per
   season ([Palinkas 2004]); $\chi^* = 0.7$ probably matches. Confirm.
3. **Venue.** *npj Microgravity* engages IMM authors directly but is a
   higher bar; *CBM* is friendlier but loses the IMM-community signal.
   *AMHP* is the safe fallback. Pick before 3F starts.
4. **Co-authorship.** Should this paper invite an IMM author (e.g., Antonsen
   or Myers) as a co-author? *Recommendation: not for v1 — keep it as your
   methodology paper. Cite generously instead.*
5. **Stage A ↔ Stage B coupling strength.** Iter 3 v1 couples through
   $\boldsymbol{\beta}_k^\top \boldsymbol{z}_i$ multipliers (Section 3.1).
   An alternative is full Bayesian propagation: sample $\boldsymbol{w}$ →
   sample $\boldsymbol{\lambda}$ jointly in the same trial. Stronger but
   tighter coupling. *Recommendation: ship v1 with the multiplier path;
   note joint sampling as Iter 4.*

---

## 13. What Iter 3 deliberately does NOT change in Iter 1/2

- The Iter 1 engine (`src/engine/mcda.ts`) — untouched. Stage B reads its
  outputs but does not modify it.
- The Iter 2 ratified `docs/criteria.md` — untouched. Stage B's
  `vulnerabilityCriteria` field references criterion ids defined there.
- The Iter 1/2 UI — extended, not rewritten. Existing tabs remain.

This guarantees Iter 3 is **additive** and can be reverted by deleting
`src/risk/` and the new UI components without breaking the Iter 1/2 artifact.
