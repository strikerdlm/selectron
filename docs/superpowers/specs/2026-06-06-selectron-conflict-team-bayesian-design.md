# Selectron — Bayesian Conflict / Team Modeling for Analog Missions

**Date:** 2026-06-06
**Engine:** `src/risk/` (Stage-B analog pipeline) — `src/imm/` is **untouched**
**Status:** Design (brainstorming complete; awaiting implementation plan)
**Author:** Diego Malpica

---

## 1. Motivation

The recent interpersonal-conflict addition (`conflict-event`, commit `859d7f3`) exposed three
structural mismatches between the `src/risk/` engine and the analog-mission science:

1. **Conflict is bound to EVA count.** `conflict-event`, `leadership-challenge`, and
   `role-ambiguity-conflict` are `kind: "event"` sampled via `sampleBinomial(rng, mission.evaCount, p)`.
   The two flagship analog fixtures — `antarctic-winter-over` (365 d) and `mars500-520d` (520 d) —
   have `evaCount: 0`, so these conditions fire **exactly zero events** on precisely the missions
   where the literature says conflict dominates morbidity (Basner 2014; Palinkas 2021).
2. **Per-member independence.** The trial loop is `for (member of crew)`; every condition is an
   independent per-individual draw. Conflict is inherently **dyadic / crew-level** (it scales with
   `n(n−1)/2` pairs) and is **concentrated** (Basner: 2 of 6 crew accounted for 85% of conflicts).
3. **Stationary hazard.** `samplePoisson(λ × durationDays)` — a flat rate. The literature describes
   crew-dependent, time-varying instability (Tu 2024 latent trajectories; Dunn 2022 "after halfway"),
   and is explicit that the classic third-quarter dip is **not** robust (Bell 2019).

This design adds a Bayesian conflict/team layer that fixes all three, plus overdispersion,
cross-condition coupling, β-uncertainty propagation, and a literature-anchored validation harness.

## 2. Decisions (locked during brainstorming)

| Decision | Choice | Rationale |
|---|---|---|
| Target engine | **`src/risk/`** | Conflict already lives here; keeps the manuscript engine + K15 canary untouched |
| Scope | **A1+A2+B1, A3, B3+B4, B5** (all four bundles) | Structural + temporal + Bayesian coupling/uncertainty + validation |
| Priors source | **Hybrid PyMC + synthetic** | PyMC-fit the 3 identifiable params; synthetic defaults elsewhere |
| Trial architecture | **Approach 1 — three-pass, substream-isolated** | Fixes per-member independence while keeping medical conditions bit-identical |

Aspect → recommendation mapping (from the literature review):
A1 de-EVA · A2 crew-level dyadic · A3 NHPP + latent class · B1 Negative-Binomial overdispersion ·
B3 shared-frailty coupling · B4 β-uncertainty propagation · B5 posterior-predictive checks.

## 3. Architecture — three-phase trial with independent RNG substreams

```
runMissionTrial(crew, mission, priors, conditions, seed, criteriaIndex)
├─ Phase 0  rng_latent  = makeRng(seed ^ 0xLATENT)
│     draw trial latent state: latentClass c, memberFrailty h[i], crewFrailty G, β sample
├─ Phase 1a rng_medical = makeRng(seed ^ 0xMEDICAL)   ← DEDICATED stream, isolated from new machinery
│     per-member: medical/physiologic conditions → Poisson (no frailty, no NHPP)
├─ Phase 1b rng_psych   = makeRng(seed ^ 0xPSYCH)
│     per-member: psychiatric/performance → λ ×= G·h[i], NHPP, NB
└─ Phase 2  rng_crew    = makeRng(seed ^ 0xCREW)
      per-crew, per team-condition: crew-level λ from composition stats → NHPP → NB (λ ×= G)
```

**Determinism via substreams.** Each phase/family derives an independent RNG from the trial seed.
Medical/physiologic conditions draw from a **dedicated `rng_medical` substream that never sees any
latent, psychiatric, or team draws**, so their per-condition QTL is **invariant to the new conflict
machinery** — toggling the conflict/frailty/latent features on vs off (legacy fallback) yields
**identical medical QTL**. This is the meaningful negative control: it proves the new layer does not
perturb the medical model. (Note: this is *feature-toggle* invariance, not byte-identity to the
pre-refactor commit — restructuring the medical conditions onto their own substream changes their
exact draw sequence once, so any exact-value medical fixtures are rebaselined a single documented time;
behavioral/margin tests are unaffected. There is no published exact-value canary in `src/risk/` — that
discipline is IMM-only.) New randomness (Phase 0, 1b, 2) is isolated by construction.

### 3.1 Module map

| File | Change |
|---|---|
| `src/risk/crew-state.ts` | **new** — `drawTrialLatentState()` (Phase 0): latent class, frailties, β draw |
| `src/risk/crew-conditions.ts` | **new** — `runCrewConditionTrial()` (Phase 2): crew-level team hazard + attribution |
| `src/risk/temporal.ts` | **new** — NHPP integrated-intensity + `firstEventFraction()` (bisection) |
| `src/risk/incidence.ts` | **extend** — add `sampleGamma`, `sampleGammaPoisson` (NB). Independent of `src/imm/` per CLAUDE.md |
| `src/risk/condition-behavior.ts` | **new** — derives `{scope, temporal, dispersion, frailtyCoupled}` from `family` + optional `Condition` overrides |
| `src/risk/simulate.ts` | **refactor** — `runMissionTrial` → three-pass; thread latent state; new diagnostics |
| `src/risk/priorsSchema.ts` | **extend** — new **optional** blocks + validation; schema version bump |
| `src/data/synthetic-iter3.ts` | **extend** — synthetic structural defaults; merge PyMC-fit JSON |
| `src/data/conflict-team-priors.json` | **new** — PyMC posterior samples (π_unstable, λ_base per team condition, crew-frailty φ) |
| `python/selectron/conflict_fit.py` (+ tests) | **new** — PyMC NUTS fitter emitting the JSON |
| `tests/risk/*` | **new + updated** — unit tests per module + B5 PPC harness |

**Boundary:** team-family conditions (`conflict-event`, `team-cohesion-loss`, `leadership-challenge`,
`role-ambiguity-conflict`) **leave the per-member loop** and live only in Phase 2. Psychiatric/performance
conditions **stay** per-member but gain frailty+NHPP+NB. Medical/physiologic conditions are **untouched**.

## 4. Team-condition hazard model (A1 + A2)

Per team condition `k`, a crew-level intensity replaces the per-member EVA-binomial. Define each
member's **conflict-proneness** `wᵢ = −zᵢ` on the relevant trait (low teamwork / high neuroticism ⇒ high `w`):

```
Λ_k  =  λ_base,k                         crew-level base rate (PyMC-fit)
       × dyadFactor(n)                   = D(n)/D(6),  D(n)=n(n−1)/2
       × exp(β_het · SD_i(wᵢ))           heterogeneity → tension (Kanas 1998)
       × exp(β_weak · max_i wᵢ)          worst member dominates (Basner 2014)
       × ∫₀ᴰ g_c(t/D) dt                 temporal shape by latent class (§6)
N_k  ~  NegBinomial(mean = Λ_k · G)      G = crew frailty (§5); NB = overdispersion
```

- `dyadFactor`: n=6→1.0, n=4→0.40, n=3→0.20, **n=1→0** (solo operator: no interpersonal conflict).
- `β_het, β_weak > 0` (synthetic defaults). `D(6)` is a fixed constant (no crew-dependent division by zero).
- **Person–group fit is NOT a factor here** — it feeds `π_unstable` (§5), so each composition signal is used once.
- **Attribution (for B5 + lost-days):** the crew total `N_k` is distributed to members/dyads by a weighted
  multinomial (`∝ wᵢ` / `wᵢ+wⱼ`), reproducing Basner's "85%-in-a-minority" as a model output and letting
  team lost-days attribute to the involved member while summing to the crew total.

**A1 falls out for free:** crew-level time-driven `Λ_k` integrates over `durationDays`; `evaCount` never
enters. `conflict-event` / `leadership-challenge` change `kind: "event"` → crew-scoped rate, and the
zero-conflict defect on the 365-d / 520-d fixtures disappears by construction.

## 5. Trial latent state (B3 + B4 + A3 core)

Phase 0 draws four shared things per trial (from `rng_latent`):

1. **Shared crew strain `G ~ Gamma(φ, 1/φ)`** (mean 1). Multiplies λ of *every* frailty-coupled
   condition (member psych/perf **and** crew team). High-`G` trial = a "bad mission" where conflict,
   insomnia, and cognitive decrement rise together → B3 co-occurrence.
2. **Per-member idiosyncratic strain `hᵢ ~ Gamma(φ_m, 1/φ_m)`** (mean 1). Member λ `×= G·hᵢ`;
   team λ `×= G`. Couples a member's own conditions and adds individual differences.
3. **Latent class `c ~ Bernoulli(π_unstable)`**, `π_unstable = logistic(α₀ + α_fit · meanFit_z)`.
   Base ≈ **0.658** (Tu 2024 133/202); better fit ⇒ lower `π`. Selects temporal shape `g_c` (§6).
4. **β draw (B4): `β_trial = β_elicited · exp(σ_logβ · ε)`, `ε ~ N(0,1)`** — lognormal, sign never flips.
   Shared across the trial ⇒ propagating it gives the screened/unscreened ratio a **credible interval**.

### 5.1 B1 and B3 are one object (Gamma-Poisson)

```
Poisson(λ · G),  G ~ Gamma(φ)   ⟺   NegBinomial(mean=λ, dispersion=φ)
              └ shared draw ┘            └ marginal ┘
```

We sample Poisson **conditional on** the Gamma frailties; the **marginal is automatically
Negative-Binomial** (B1) while the **shared draw is the coupling** (B3). `φ` is literally the NB
dispersion. A shared `G` (vs independent per-condition NB) makes the dispersions **correlated** —
the empirical point of Somaraju 2021 and Basner's co-occurring insomnia+conflict.

## 6. Temporal NHPP shapes (A3)

`g_c(u)`, `u = t/D ∈ [0,1]` (fractional mission time):

- **Stable** `g₀(u) = 1` (flat). `∫₀¹ = 1`.
- **Unstable** `g₁(u) = 1 + a·uᵖ`, `p > 1` (back-loaded, monotone rising — cohesion decays into the
  second half and does **not** recover; Dunn 2022 / Kanas 1996). Deliberately **not** a symmetric
  third-quarter dip (Bell 2019 found that unreliable).

Fractional-time normalization matches Bell's own anchor ("by 40% of completion or 90 days").
`firstEventFraction()` inverts the cumulative `M_c(u)=∫₀ᵘ g_c` by bounded bisection (deterministic),
feeding the B5 onset check and the per-trial onset diagnostic; right-censors to 1.0 if no event.

## 7. Priors / PyMC data flow (hybrid)

New fitter `python/selectron/conflict_fit.py` (NUTS) emits `src/data/conflict-team-priors.json`:

| Fitted block | Evidence → likelihood | Note |
|---|---|---|
| `pi_unstable_samples` | Tu 2024 133/202 → Beta-Binomial | clean anchor |
| `lambda_base_samples[k]` | Bell 2019 "≥1 by 40%" → Beta-Binomial on by-40% prob, mapped via `1−exp(−λ·M_c(0.4))` | per team condition |
| `phi_samples` (crew frailty) | Basner 85%-from-minority → target event-share, sim-based calibration | **weakly identified** (n=2/6); wide posterior, disclosed |

```
conflict-team-priors.json ─► synthetic-iter3.ts ─► extended PriorsJson ─► simulateMission
  (PyMC posteriors)            merges with synthetic defaults                (seeded indexing,
                               φ_m, α_fit, σ_logβ, a, p, β_het, β_weak        like sampleFromPosterior)
```

`src/risk/` consumes a PyMC-fitted JSON **for the first time** (mirrors how `src/imm/` loads
`imm-priors.json`, kept independent per CLAUDE.md). `priorsSchema.ts` gains optional blocks
(`latent_class`, `crew_frailty`, `member_frailty`, `beta_hyper`, `temporal`, `team_coeffs`,
per-condition `lambda_base`); `validatePriorsJson` checks `π∈[0,1]`, shapes `>0`, samples non-empty.

**Backward compatibility:** every new block is **optional**. When absent (existing `tests/risk/`
fixtures) the engine falls back to today's behavior — stationary Poisson, no frailty, no crew pass.
New behavior activates only when the extended `SYNTHETIC_PRIORS` is supplied.

## 8. Validation (B5) — posterior-predictive check harness

`tests/risk/conflict_ppc.test.ts` — regression tests **and** manuscript validation evidence:

| Check | Assertion | Anchor |
|---|---|---|
| Onset | ref crew P(≥1 by u=0.4) ≥ 0.95 | Bell 2019 |
| Latent split | unstable fraction ≈ 0.66; **lower for high-fit crews** (assert ordering) | Tu 2024 |
| Concentration | top-⅓ proneness members ≈ 85% of conflicts | Basner 2014 |
| De-EVA (A1) | 365-d Antarctic (`evaCount=0`) yields **>0** conflict; invariant to `evaCount`, scales with `durationDays` | the defect |
| Dyadic (A2) | λ ratio across n matches `D(n)/D(6)`; **n=1 → 0** | dyad model |
| Coupling (B3) | corr(team, psych) > 0; **= 0 when φ→∞** (negative control) | Somaraju 2021 |
| β-uncertainty (B4) | screened/unscreened ratio reported with CI width > 0 | analysis §5.3 |
| Determinism | medical/physiologic QTL **identical with conflict features on vs off** (feature toggle) | substream control |

## 9. Testing strategy

TDD, "math before UI". Unit tests RED→GREEN per new module before integration:
`incidence` (Gamma mean/var; NB ↔ shared-frailty equivalence), `temporal` (integrals, bisection
inversion, monotonicity), `crew-state` (frailty mean≈1, π≈fit, β sign preserved), `crew-conditions`
(dyad/heterogeneity/weakest-link math, solo→0, attribution sums to N). Then `simulate` three-pass +
B5 suite. Python `pytest` for `conflict_fit` (recovers π≈0.658 from synthetic data; emitted-JSON
determinism — reuse the IMM CRC32-seeding lesson). Canonical seed `0xc0ffee`; **no unseeded randomness.**

## 10. Error handling

Gamma/NB samplers validate `shape > 0`, finite → `SelectronError("E_BAD_PRIOR")` (matching existing
samplers). `n=1` ⇒ `dyadFactor 0` (no throw). New priors blocks validated; **absent → legacy fallback,
not an error.** `firstEventFraction` bisection is bounded, right-censors to 1.0. β draw guards `ε`
finite, `σ_logβ ≥ 0`. `clampProb` retained for any residual event-prob paths.

## 11. Scope boundary (YAGNI — explicitly NOT doing)

- ❌ Per-dyad network simulation (Approach 2) — dyad attribution is recorded but dyad-level dynamics
  are not simulated; future extension.
- ❌ Daily cross-lagged dynamics — captured at trial-aggregate via shared `G`, not day-by-day.
- ❌ Any change to `src/imm/`, medical/physiologic conditions, frostbite/SAD catalog, or full-PyMC of
  the synthetic-default params (`φ_m`, `α_fit`, `σ_logβ`, `a`, `p`, `β_het`, `β_weak`).

## 12. References (literature anchors)

- Basner et al. 2014, *PLoS ONE* — Mars-500 behavioral/psychological (conflict concentration; co-occurrence). DOI 10.1371/journal.pone.0093298
- Bell et al. 2019, *Front. Psychol.* — analog team-dynamics systematic review (≥1 conflict by 40%/90 d; third-quarter not robust).
- Kanas 1998, *Acta Astronautica* — crew heterogeneity → subgrouping/scapegoating.
- Tu et al. 2024, *Current Psychology* — parallel-process growth-mixture (stable/unstable latent classes; person-group fit).
- Van Fossen et al. 2021, *Acta Astronautica* — neuroticism → conflict; conscientiousness protective.
- Somaraju et al. 2021, *J. Occup. Health Psychol.* — daily conflict→strain spiral (workload-moderated).
- Dunn Rosenberg et al. 2022, *Front. Physiol.* — HI-SEAS phase model (adversity after halfway).
- Kanas et al. 1996, *Aviat. Space Environ. Med.* — Mir simulation (cohesion drop in last third).
- Pajunen 2012 — NASA Dynamic PRA (agency precedent for dynamic medical-event modeling).
- Myers et al. 2018 — IMM validation (constant-rate-across-mission-type weakness).
