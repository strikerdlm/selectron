# Selectron — Scientific Limitations of the Current IMM Calibration

**Created:** 2026-05-22 (post priors-rev3-b)
**Last updated:** 2026-05-27 — analog/Antarctic evidence passes 2+3 + PyMC calibration; provenance 37+63+0; K15 all 3 scenarios pass
**Status:** Living document — update on every priors revision or engine extension
**Companion docs:** [`iter5_priors_rev3_strategy.md`](iter5_priors_rev3_strategy.md), [`iter3_vv_dossier.md`](iter3_vv_dossier.md) §5, [`future_features.md`](future_features.md)

> **NOT-FOR-FLIGHT — analog scope only.** Selectron v1 is a research tool + methodology demonstrator scoped to **Earth-based analog isolation missions** (MDRS, HI-SEAS, Mars-500, Antarctic winter-over) and **LEO / ISS-baseline scenarios** (ISS 6 mo K15 reference, S20 DRMs). It is **NOT** a Mars-mission tool, **NOT** an Artemis-mission tool, **NOT** a flight-medical-kit sizing tool, and **NOT** a substitute for individual crew-member fitness-to-fly assessment. Mars and Artemis are catalogued in [`future_features.md`](future_features.md) with their structural prerequisites; do not enable them in `ACTIVE_MISSIONS` until those prerequisites land. The limitations below apply to the *in-scope* analog + LEO use case and are real and material.

---

## 1 · What is mathematically rigorous

The following are verified against primary sources and have closed-form-moment unit tests:

- **Stage A Bayesian MCDA** (`src/engine/`) — Dirichlet weights, Marsaglia–Tsang Gamma sampler, Mulberry32 PRNG, score normalization. Closed-form mean / variance match Monte Carlo within 2 % / 5 % at 50k samples.
- **IMM engine math** (`src/imm/`) — Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli incidence samplers; Beta-Pert outcomes (mean = (a+4m+b)/6); concurrent FI formula `1 − Π(1 − f_i)` per K15 §II.A.9 verbatim; sequential-phase QTL accumulator (cp1 + cp2 + cp3) per K15 §II.A.9; per-event Bernoulli end-state sampling per spec; T=100 000 canonical trial count per M18 / A22.
- **Convergence diagnostic** — σ(CHI) and σ(pEVAC) recorded at every 1 000-trial checkpoint per the M18 / A22 5 % rule.
- **NASA HSRB LxC verdict** — per JSC-66705 Rev A Fig. 4 verbatim; explicit "disqualified" overrides set L=5, C=5.
- **Tier multipliers** — applied at each distribution-specific sampling site (λ-site for Poisson; per-Bernoulli for SA-once and EVA-coupled). Variance-correct by construction (Poisson closed under rate scaling; Bernoulli(p)×Bernoulli(mult) = Bernoulli(p·mult)). Commit `ce97dda`.

These do not absolve the priors of the issues below.

---

## 2 · What the priors are

`src/data/imm-priors.json` carries the 100-condition K15 reference catalog plus one source-cited analog behavioral extension (`interpersonal-conflict`), with three provenance tiers:

| Tier | Count | Source character |
|------|-------|------------------|
| `tierA-nasa` | **34** | Directly attributed to a NASA-published IMM source (K15, M18, G12, TM21, S20, A22). Per-condition incidence numbers were elicited from these papers when explicit; otherwise from clinical-SME judgment guided by the paper. ISS-specific conditions (CO2 headache, VIIP, EVA-DCS) and conditions with corroborated but insufficient analog denominators remain here. Full list in `STATUS.md`. |
| `tierB-pymc` | **66** | PyMC NUTS Gamma-Poisson posteriors fitted against primary-source terrestrial/analog epidemiology (analog missions, Antarctic, submarine, military, spaceflight). Provenance chain: evidence CSV → `fit_gamma_poisson()` → R-hat/ESS/divergence gate → `merge_fitted_priors()` → imm-priors.json. Includes rev3-f severity tuning (32/32 persistent-impairment K15 conditions). |
| `tierB-lit` | **1** | Source-cited analog behavioral extension (`interpersonal-conflict`) retained as literature-anchored rather than PyMC-fitted because it is not represented in the proposal CSV evidence table. |
| `tierC-synth` | 0 | Fully eliminated (2026-05-26). Final 2 conditions: acute-radiation-syndrome (literature-validated, Beta-Bernoulli retained) + smoke-inhalation (PyMC NUTS fit, Guibaud 2022). |

The K15 Appendix lists the 100 conditions with their incidence-source category and distribution family but **does NOT publish per-condition numerical incidence rates**. Those live in NASA's internal iMED SQL database which is not externally accessible.

**Consequence:** for tier-A and (especially) tier-B conditions, the specific numerical λ / Beta-Pert parameters are *our elicitation*, not NASA's. They are reviewable but not independently verified against in-flight observation per-condition.

---

## 3 · Calibration limitations

### 3.1 The calibration target is itself a model output

`K15_TABLE1_REF` in `src/imm/calibration.ts` (TME 98.3 / 106 / 106 across the three kit scenarios) is the published output of NASA's iMED Monte Carlo simulator for the K15 reference crew. It is the best public anchor available, but **it is not directly observed in-flight data**.

The actual observed data (M18 Table 2: zero observed EVAC and zero observed LOCL across STS 1-114 + ISS 1-13) is consistent with K15's predictions but the observation window is too narrow to discriminate between, say, K15's 5.57 % pEVAC and our rev3-b 8.66 % — both give Poisson λ ≈ 0.7–1.1 over 13 ISS expeditions × 6 months, and both are consistent with the zero observed EVAC.

This means: our K15 "reproduction" demonstrates that we can reproduce another model's outputs, not that we have validated against reality.

### 3.2 The tier-B blanket multiplier is atheoretical (partially addressed in rev3-c)

rev3-b set `global_calibration.tierB_multiplier = 0.55` — a single scalar that scales every tier-B condition's sampled incidence by 0.55. This was the simplest knob that brought aggregate TME within K15 CI₉₅ across all three scenarios.

**It is not a scientific claim that every tier-B prior was elicited 1.8× too high.** Individual tier-B conditions are almost certainly over-elicited (a 1.8× scalar is too much) or under-elicited (it is not enough); the blanket multiplier moves the AGGREGATE to match while obscuring per-condition errors.

**rev3-c partial fix (2026-05-22):** 5 tier-B conditions were replaced with source-cited per-py rates derived from Earth-analog primary literature (Antarctic, Mars-500, SIRIUS-21, submarine, ISS WOTR15 — 27 primary citations total across 3 research-agent deliverables). The conditions calibrated: `dental-caries` (promoted to tier-A via G12 Bayesian chain), `late-insomnia`, `depression`, `respiratory-infection`, `skin-rash`. Plus source_ref enrichment on `dental-abscess`, `headache-co2-induced`, `back-pain-space-adaptation`. See [`research/_priors_rev3c_synthesis.md`](../research/_priors_rev3c_synthesis.md) for the consolidated table.

**Residual: 37 of 42 tier-B conditions still rely on the blanket multiplier as fallback.** They lack per-condition Earth-analog evidence (most are minor everyday medical events whose per-py rate is in NASA's proprietary iMED database, not published literature). Further per-condition calibration is iterative — each requires its own source verification.

### 3.3 The auto-load behaviour shifts RNG streams

`simulateIMM` auto-loads `global_calibration.tierA/B/C_multiplier` defaults from `imm-priors.json`. When any multiplier is ≠ 1.0, a `rng()` draw is consumed inside the multiplier path, shifting the RNG stream for all downstream Bernoulli samples (severity, p_evac, p_locl).

**Reproducibility verification** (`scripts/validate_imm_explicit_baseline.ts`, 2026-05-22): calling `simulateIMM` with explicit `{tierA: 1, tierB: 1, tierC: 1}` reproduces the pre-rev3-b baseline numbers exactly to two decimal places, confirming the multiplier path is the only source of RNG-stream divergence.

**Implication:** the same `(seed, priors-json-state)` pair gives the same output. The same `(seed, mutated-priors-json)` does not. Snapshot tests must include priors-json provenance.

### 3.4 Persistent-impairment classification is clinical-judgment-based

The rev3-e `fi_cp3` audit classified 68/100 conditions as fully-resolving (cp3 zeroed) and 32 as persistent-impairment (cp3 retained). This classification is clinical judgment, not NASA-iMED-derived. Per-condition fi_cp3 values remain NASA-internal. Further refinement against published persistent-impairment literature (rev3-f scope) would tighten the issHMS CHI fit.

### 3.5 'none' kit scenario divergence (accepted limitation)

The 'none' (no medical kit) scenario produces values that diverge from K15:

| Metric | Selectron (2026-05-27, 37+63) | K15 'none' ref | Δ |
|--------|--------------------------|-----------------|----|
| TME    | 98.52  | 98.30  | +0.22 ✓ |
| CHI    | 78.88  | 59.20  | +19.68 ✗ |
| pEVAC  | 12.52 % | 66.90 % | −54.38 ✗ |
| pLOCL  | 0.24 % | 2.89 % | −2.65 ✗ |

**Decision (2026-05-22): accept the divergence as a principled limitation.** Rationale:

1. **Operationally implausible.** No real Earth-analog or LEO mission has ever launched with zero medical resources.
2. **K15 'none' is model-construct, not observed data.** NASA's iMED produces 'none' values by setting all resources to zero and running its internal untreated-outcome priors, which are not publicly published.
3. **Operational scenarios reproduce well.** issHMS and unlimited both reproduce K15 within CI₉₅ on CHI.
4. **Closing the gap would over-correct operational scenarios.** Blanket inflation of `untreated.fi_cp1/cp2` / `untreated.p_evac` would propagate through the RAF-interpolated path on issHMS and break the CI₉₅ fit.
5. **Per-condition `untreated.p_evac` anchored to Pattarini 2016.** Antarctic MEDEVAC rate (0.036/py) is the operational anchor.

**Empirical confirmation (2026-05-26).** The closed-form rescale predicted in `iter5_priors_rev3_strategy.md` §3.3 was implemented (`scripts/rescale_outcome_parameters.ts`) and validated. Results: untreated `p_evac` scaled by 8.42× and treated `p_evac` by 3.16× brings 'none' pEVAC to 63.90 % (target 66.90 %) and unlimited pEVAC to 4.86 % (target 4.93 %) — excellent fit. However, the same rescale drives issHMS pEVAC to 53.39 % (target 5.57 %) via RAF-interpolated fall-through coupling, confirming prediction #4 exactly. The priors were reverted; the script is preserved for sensitivity analysis but is not merged into production priors.

Selectron's 'none' scenario should be interpreted as a sensitivity-analysis lower bound, not a calibrated prediction.

---

## 4 · Out-of-scope: Mars (TM21) and Artemis (lunar)

Selectron's IMM engine in v1 does not model:
- Treatment-decision degradation under comms delay (Artemis ~1.3 s, Mars ~22 min)
- Cumulative-dose conditions over 400+ days (GCR, SPE accumulation)
- Mars-surface / lunar-surface EVA risk profile (different from ISS microgravity EVA)
- Crew-autonomy treatment matrices (no ground-team guidance, no emergency-return)
- No-resupply resource consumption hard-failure modes
- Compound-failure modes (medical + life-support degradation, food/water shortage)

These are out-of-scope **by design** as of 2026-05-22. The catalogued AMM/SMM Mars DRMs (and the future Artemis I–IV entries) are tagged `kind: "*-future"` in `src/data/imm-missions.ts` and filtered out of `ACTIVE_MISSIONS` so the UI picker cannot reach them. The engine remains capable of running them, but the priors will produce **plausibly-shaped but quantitatively wrong** outputs without the structural prerequisites in [`future_features.md`](future_features.md). Do not bypass the `ACTIVE_MISSIONS` filter without first implementing those prerequisites and a Mars / Artemis-specific validation gate.

---

## 5 · Validation status

**IMM-86** — K15 Table 1 reproduction gate. **K15 all-3-scenario validation (2026-05-27, T=100k, seed 0xc0ffee, 37+63 provenance):**

| Scenario | TME | ref | Δ | CHI | pEVAC | pLOCL |
|---|---|---|---|---|---|---|
| none | **98.52** | 98.30 | +0.22 ✓ | 78.88 | 12.52% | 0.24% |
| issHMS | **98.73** | 106.00 | −7.27 (known) | 82.79 | 9.74% | 0.24% |
| unlimited | **99.62** | 106.00 | −6.38 (known) | 95.23 | 1.78% | 0.17% |

All TME within K15 CI₉₅ ✓. CHI/pEVAC/pLOCL divergences are documented pre-existing limitations (§3.5). Written as a formal vitest gate at `tests/imm/validation_k15.test.ts` (13 tests, 3 scenarios × 4 metrics + 1 inventory). Documented-divergent metrics use wider brackets with `tracking` fields pointing at open backlog items. 37/37 simulate tests pass. Commit `04543d9`.

**IMM-87** — TM21 AMM/SMM ±20 % gate. **Not written.** Mars missions are out of scope (§4); this gate is deferred until the structural engine prerequisites in [`future_features.md`](future_features.md) are implemented.

**NASA-STD-7009 / 7009A** — full standard PDF still not in corpus. W14 (Task 27) is a 1-page poster, not the full document. Resolution path: NTRS direct download or institutional library proxy.

**New diagnostics (2026-05-24 math-hardening):**

- **K-S marginal Dirichlet fit** (`tests/engine/dirichlet_ks.test.ts`): 3 marginal Beta fits at T=5000 pass K-S at α=0.05 (D < 0.019); 1 rejection of misspecified Beta(10,10). More discriminating than the lag-1 ESS diagnostic for the IID Gamma-normalization sampler.
- **Gelman-Rubin R̂** (`tests/imm/rhat_convergence.test.ts`): 4 independent chains (seeds 0xc0ffee / 0xdeadbeef / 0x12345678 / 0xfeedface) × T=25k on issHMS. R̂(CHI) ≤ 1.01. Each chain individually satisfies the M18 σ<5% stability rule. Supplements the within-chain σ<5% with between-chain convergence proof.
- **α₀ robustness panel** (`tests/engine/alpha0_robustness.test.ts`): Stage A posterior at α₀ ∈ {1, 10, 100} with heterogeneous candidate. CI₉₀ width monotonically decreasing (0.50 → 0.21 → 0.07). Closed-form mean matches MC within 2% at all three concentrations.
- **Leave-calibrated-out sensitivity** (`tests/imm/validation_k15_loo.test.ts`): K15 reproduction with evidence-based conditions only (tier-A + source-cited tier-B). TME drops from ~100 → ~42; CHI rises from ~90% → ~97%. Demonstrates honest degradation when calibration-circular conditions are removed. (Test fixture reflects pre-2026-05-25 provenance snapshot; counts in test file may differ from current 37+63.)

---

## 6 · What Selectron IS appropriate for (v1 scope)

- **Earth-based analog-mission planning** — assessing relative crew composition risk for MDRS / HI-SEAS / Mars-500 / SIRIUS / Antarctic winter-over / AMADEE / D-MARS / CHAPEA scenarios where the priors are closer to in-flight or terrestrial-analog observation
- **LEO / ISS-baseline scenarios** — ISS 6 mo K15 reference; S20 DRM1/DRM2; analog-mission planners using ISS as the comparator
- **Selection-criteria sensitivity analysis** — testing how different MCDA weight elicitations change ranking under the same posterior
- **Methodology paper for the npj Microgravity / Aerospace Medicine venue** — the V&V approach (NASA-STD-7009A factors 1-3 explicit) is the publishable contribution; the priors are illustrative
- **Educational tool** — teaching the IMM Monte Carlo workflow, Bayesian MCDA, NASA HSRB LxC

## 7 · What Selectron is NOT appropriate for

- **Mars mission planning, risk certification, or medical kit sizing** — out of scope by design as of 2026-05-22. See [`future_features.md`](future_features.md) §2 for the structural prerequisites required to extend Selectron to interplanetary missions.
- **Artemis (lunar) mission planning** — out of scope by design as of 2026-05-22. See [`future_features.md`](future_features.md) §1 for the structural prerequisites.
- **Flight medical kit sizing** (any destination) — use NASA's actual iMED + IMM workflow with NASA-internal priors
- **Individual crew-member fitness-to-fly decisions** — the gate-then-modulate architecture is illustrative; clinical disposition requires the full NASA Class I/II/III qualification process and individual medical workup
- **Insurance / actuarial actual-loss prediction** — calibration is not against observed in-flight losses

---

## 8 · Resolved items (audit trail)

| Former section | Issue | Resolution | Commit |
|---|---|---|---|
| §3.3 (old) | Stochastic rounding preserved mean but distorted variance (~45 % under-reported for tierB=0.55) | Tier multiplier threaded into λ-sampling site; variance-correct by construction | `ce97dda` |
| §3.5 (old) | cp3 (permanent impairment) deferred from QTL accumulator | Per-condition fi_cp3 audit: 68 zeroed (fully-resolving), 32 retained (persistent-impairment); cp3 now charged per K15 §II.A.9 | `4521390` |
| §4.2 (old) | issHMS CHI residual Δ −19.3 | Concurrent-FI engine fix: `fi_cp1×dt_cp1 + fi_cp2×dt_cp2` (sequential phases, not overlapping); Δ now −4.68, within K15 CI₉₅ | `3ac5480` |
| §1 (new) | README claimed Metropolis-Hastings sampler; code is Gamma-normalization | README fixed to match code; manuscript was already correct | `60551ee` |
| §1 (new) | Stage B "ESS (= trials)" label was mathematically vacuous | RiskCard row collapsed to single "trials" row; ScoreCard annotated as invariant | `2eadc10` |

---

## 9 · How to extend this document

Every time:

- a new priors revision lands — add or update a §3 subsection with the calibration and its residuals
- the engine gains a new model (comms delay, cumulative dose, Mars EVA) — update §4
- a validation gate is written — update §5
- a per-condition source audit is done — list which tier-B conditions were verified and against what source

Diego reviews this doc before publishing any results derived from Selectron.
