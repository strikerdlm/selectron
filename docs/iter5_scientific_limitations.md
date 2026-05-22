# Selectron — Scientific Limitations of the Current IMM Calibration

**Created:** 2026-05-22 (post priors-rev3-b)
**Last updated:** 2026-05-22 — analog-scope-down: Mars (TM21) and Artemis moved to [`future_features.md`](future_features.md)
**Status:** Living document — update on every priors revision or engine extension
**Companion docs:** [`iter5_priors_rev3_strategy.md`](iter5_priors_rev3_strategy.md), [`iter3_vv_dossier.md`](iter3_vv_dossier.md) §5, [`future_features.md`](future_features.md)

> **NOT-FOR-FLIGHT — analog scope only.** Selectron v1 is a research tool + methodology demonstrator scoped to **Earth-based analog isolation missions** (MDRS, HI-SEAS, Mars-500, Antarctic winter-over) and **LEO / ISS-baseline scenarios** (ISS 6 mo K15 reference, S20 DRMs). It is **NOT** a Mars-mission tool, **NOT** an Artemis-mission tool, **NOT** a flight-medical-kit sizing tool, and **NOT** a substitute for individual crew-member fitness-to-fly assessment. Mars and Artemis are catalogued in [`future_features.md`](future_features.md) with their structural prerequisites; do not enable them in `ACTIVE_MISSIONS` until those prerequisites land. The limitations below apply to the *in-scope* analog + LEO use case and are real and material.

---

## 1 · What is mathematically rigorous

The following are verified against primary sources and have closed-form-moment unit tests:

- **Stage A Bayesian MCDA** (`src/engine/`) — Dirichlet weights, Marsaglia–Tsang Gamma sampler, Mulberry32 PRNG, score normalization. Closed-form mean / variance match Monte Carlo within 2 % / 5 % at 50k samples.
- **IMM engine math** (`src/imm/`) — Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli incidence samplers; Beta-Pert outcomes (mean = (a+4m+b)/6); concurrent FI formula `1 − Π(1 − f_i)` per K15 §II.A.9 verbatim; per-event Bernoulli end-state sampling per spec; T=100 000 canonical trial count per M18 / A22.
- **Convergence diagnostic** — σ(CHI) and σ(pEVAC) recorded at every 1 000-trial checkpoint per the M18 / A22 5 % rule.
- **NASA HSRB LxC verdict** — per JSC-66705 Rev A Fig. 4 verbatim; explicit "disqualified" overrides set L=5, C=5.

These do not absolve the priors of the issues below.

---

## 2 · What the priors are

`src/data/imm-priors.json` carries 100 conditions with three provenance tiers:

| Tier | Count | Source character |
|------|-------|------------------|
| `tierA-nasa` | 40 | Directly attributed to a NASA-published IMM source (K15, M18, G12, TM21, S20, A22). Per-condition incidence numbers were elicited from these papers when explicit; otherwise from clinical-SME judgment guided by the paper. |
| `tierB-lit` | 42 | Literature-elicited from the Phase-0 I&C corpus (Pagel & Choukér 2016; NASA evidence reports; Bellagio II; the 31-paper analog-mission OCR set). Many priors were derived from terrestrial cohorts or single-paper retrospective tallies, not from in-flight observation. |
| `tierC-synth` | 18 | Synthetic placeholder back-fits constructed for the remaining ~10–20 catalog entries with no usable source. Calibrated against K15 Table 1 aggregate output as the only available anchor. |

The K15 Appendix lists the 100 conditions with their incidence-source category and distribution family but **does NOT publish per-condition numerical incidence rates**. Those live in NASA's internal iMED SQL database which is not externally accessible.

**Consequence:** for tier-A and (especially) tier-B conditions, the specific numerical λ / Beta-Pert parameters are *our elicitation*, not NASA's. They are reviewable but not independently verified against in-flight observation per-condition.

---

## 3 · Calibration limitations (rev3-a + rev3-b)

### 3.1 The calibration target is itself a model output

`K15_TABLE1_REF` in `src/imm/calibration.ts` (TME 98.3 / 106 / 106 across the three kit scenarios) is the published output of NASA's iMED Monte Carlo simulator for the K15 reference crew. It is the best public anchor available, but **it is not directly observed in-flight data**.

The actual observed data (M18 Table 2: zero observed EVAC and zero observed LOCL across STS 1-114 + ISS 1-13) is consistent with K15's predictions but the observation window is too narrow to discriminate between, say, K15's 5.57 % pEVAC and our rev3-b 8.66 % — both give Poisson λ ≈ 0.7–1.1 over 13 ISS expeditions × 6 months, and both are consistent with the zero observed EVAC.

This means: our K15 "reproduction" demonstrates that we can reproduce another model's outputs, not that we have validated against reality.

### 3.2 The tier-B blanket multiplier is atheoretical (partially addressed in rev3-c)

rev3-b set `global_calibration.tierB_multiplier = 0.55` — a single scalar that scales every tier-B condition's sampled incidence by 0.55. This was the simplest knob that brought aggregate TME within K15 CI₉₅ across all three scenarios.

**It is not a scientific claim that every tier-B prior was elicited 1.8× too high.** Individual tier-B conditions are almost certainly over-elicited (a 1.8× scalar is too much) or under-elicited (it is not enough); the blanket multiplier moves the AGGREGATE to match while obscuring per-condition errors.

**rev3-c partial fix (2026-05-22):** 5 tier-B conditions were replaced with source-cited per-py rates derived from Earth-analog primary literature (Antarctic, Mars-500, SIRIUS-21, submarine, ISS WOTR15 — 27 primary citations total across 3 research-agent deliverables). The conditions calibrated: `dental-caries` (promoted to tier-A via G12 Bayesian chain), `late-insomnia`, `depression`, `respiratory-infection`, `skin-rash`. Plus source_ref enrichment on `dental-abscess`, `headache-co2-induced`, `back-pain-space-adaptation`. See [`research/_priors_rev3c_synthesis.md`](../research/_priors_rev3c_synthesis.md) for the consolidated table.

**Residual: 37 of 42 tier-B conditions still rely on the blanket multiplier as fallback.** They lack per-condition Earth-analog evidence (most are minor everyday medical events whose per-py rate is in NASA's proprietary iMED database, not published literature). Further per-condition calibration is iterative — each requires its own source verification — and is tracked as a future rev3-d-and-beyond effort.

### 3.3 ~~Stochastic rounding preserves mean only~~ — RESOLVED 2026-05-22 (rev3-b-followup)

The rev3-b engine extension originally applied tier multipliers via stochastic rounding (`floor(count × mult) + Bernoulli(frac)`) which preserved mean but distorted variance: `Var[floor + Bernoulli(frac)] ≠ Var[Poisson(λ · mult)]`. For `tierB=0.55` this under-reported Poisson variance by ~45 % (Var becomes `mult² · λ + ε` instead of the correct `mult · λ`). CI₉₅ widths were correspondingly under-reported.

**Resolved in commit `<rev3-b-followup>`:** the tier multiplier is now threaded into each distribution-specific sampling site in `src/imm/simulate.ts::runIMMTrial`:

- **Lognormal-Poisson / Gamma-Poisson / Fixed-Poisson:** multiply `λ` before `samplePoisson(rng, λ · tierMult)` — preserves both mean and variance exactly (Poisson is closed under rate scaling).
- **space-adaptation-once / SA-VIIP-late (single Bernoulli):** apply `&& (tierMult === 1.0 || rng() < tierMult)` after the Bernoulli draw — variance-correct because `Bernoulli(p) × Bernoulli(mult) = Bernoulli(p · mult)`.
- **EVA-coupled (Binomial via per-EVA Bernoullis):** apply `&& (tierMult === 1.0 || rng() < tierMult)` inside the per-EVA loop — the sum of independent `Bernoulli(p · mult)` is `Binomial(n, p · mult)`, variance-correct.
- **SPE-coupled:** SPE schedule is external (sampled once per trial via `samplePoissonProcess` at `LAMBDA_SPE_PER_DAY`) and per-ARS-event Bernoulli is treated as physical infrastructure; tier multipliers do not apply to SPE timing.

The post-count stochastic-rounding block was removed entirely. New variance-correctness test in `tests/imm/simulate.test.ts::priors-rev3-b` asserts that the SD ratio between `mult=0.5` and `mult=1.0` runs lands in `(0.55, 0.85)` — distinguishing the new λ-site fix from the old post-count behaviour (which would have given SD ratio ≈ 0.5).

**Implication:** CI₉₅ widths reported by `simulateIMM` (and downstream by `assessIMMLxC` → NASA HSRB matrix verdict) are now variance-correct. K15 reproduction means are unchanged (mean preservation held both before and after the fix); CI₉₅ widths may be modestly wider after the fix because variance is no longer under-reported.

### 3.4 The auto-load behaviour shifts RNG streams

`simulateIMM` auto-loads `global_calibration.tierA/B/C_multiplier` defaults from `imm-priors.json`. When any multiplier is ≠ 1.0, a `rng()` draw is consumed inside the multiplier path, shifting the RNG stream for all downstream Bernoulli samples (severity, p_evac, p_locl).

**Reproducibility verification** (`scripts/validate_imm_explicit_baseline.ts`, 2026-05-22): calling `simulateIMM` with explicit `{tierA: 1, tierB: 1, tierC: 1}` reproduces the pre-rev3-b baseline numbers exactly to two decimal places, confirming the multiplier path is the only source of RNG-stream divergence.

**Implication:** the same `(seed, priors-json-state)` pair gives the same output. The same `(seed, mutated-priors-json)` does not. Snapshot tests must include priors-json provenance.

---

## 4 · Where the model is wildly miscalibrated (in-scope only)

This section now lists residuals **within the active analog + LEO-ISS scope only**. Mars (TM21) and Artemis-class missions are no longer "wildly miscalibrated" — they are **out of scope** and catalogued in [`future_features.md`](future_features.md) with their structural prerequisites. The TM21 12–30× pLOCL gap diagnostic (`exports/2026-05-22_tm21_gap_diagnostic.txt`) drove the scope-down decision, not a calibration push.

### 4.1 'none' pEVAC under-elicited (LEO-ISS scenario)

The 'none' (no medical kit, K15 reference crew on ISS 6mo) scenario gives pEVAC = 13.0 % (post-rev3-c) vs K15 ref 66.9 %. The K15 baseline expects that 2-of-3 crews on a 6-month mission without any medical resources would face an EVAC decision. Our priors give 1-of-7.

This is a per-event `untreated.p_evac` under-elicitation. Closed-form rescale is technically possible (given calibrated event count N, target per-event p ≈ 1 − (1 − P_K15)^(1/N)) but **NOT applied in rev3-c** because:
1. The 'none' scenario is operationally implausible — every analog and LEO mission has at minimum some medical kit
2. The K15 'none' value is a model-construct baseline (no actual mission has zero kit), so reproducing it via blanket p_evac inflation would over-correct the operationally-relevant issHMS/unlimited scenarios
3. Per-condition `untreated.p_evac` rates would need per-source elicitation (Pattarini 2016 MEDEVAC rate 0.036/py is the operational anchor, not the K15 'none' construct)

Status: open question whether to close this gap or document it as a K15-model-construct artifact. Decision deferred.

### 4.2 issHMS CHI residual (Δ −19.3)

CHI = 1 − QTL / available. On issHMS, our CHI = 75.6 % vs K15 ref 94.93 %. This is independent of incidence (rev3-b) and per-event probability (rev3-c) — it reflects per-event SEVERITY (`fi_cp1/2/3` × `dt_cp1/2/3_hours` Beta-Pert distributions) and the issHMS kit's actual coverage of treatment paths. Likely needs per-condition severity audit, not blanket scaling.

### 4.3 Out-of-scope: Mars (TM21) and Artemis (lunar)

Selectron's IMM engine in v1 does not model:
- Treatment-decision degradation under comms delay (Artemis ~1.3 s, Mars ~22 min)
- Cumulative-dose conditions over 400+ days (GCR, SPE accumulation)
- Mars-surface / lunar-surface EVA risk profile (different from ISS microgravity EVA)
- Crew-autonomy treatment matrices (no ground-team guidance, no emergency-return)
- No-resupply resource consumption hard-failure modes
- Compound-failure modes (medical + life-support degradation, food/water shortage)

These are out-of-scope **by design** as of 2026-05-22. The catalogued AMM/SMM Mars DRMs (and the future Artemis I–IV entries) are tagged `kind: "*-future"` in `src/data/imm-missions.ts` and filtered out of `ACTIVE_MISSIONS` so the UI picker cannot reach them. The engine remains capable of running them, but the priors will produce **plausibly-shaped but quantitatively wrong** outputs without the structural prerequisites in [`future_features.md`](future_features.md). Do not bypass the `ACTIVE_MISSIONS` filter without first implementing those prerequisites and a Mars / Artemis-specific validation gate.

---

## 5 · Validation gates we do NOT have

The IMM Calculator plan §86 / §87 specifies two validation tests:

- **IMM-86** K15 Table 1 reproduction test (12 metrics within K15 CI₉₅). Currently **5 of 12 pass** post rev3-a + rev3-b. PENDING.
- **IMM-87** TM21 AMM/SMM ±20 % gate. Currently **fails by orders of magnitude on pLOCL**. PENDING and not addressable without structural engine work.

Neither validation gate is written as a vitest test yet. Both are required for IMM Phase 2 acceptance (`IMM-51`) and IMM Phase 5 release (`IMM-95`).

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

## 8 · How to extend this document

Every time:

- a new priors revision lands (rev3-c, rev3-d, etc.) — add a §3.N subsection with the new calibration and its residuals
- the engine gains a new model (comms delay, cumulative dose, Mars EVA) — add a §4.N subsection documenting what's now modeled vs what's still missing
- a validation gate is written — promote from §5 to §1 with the test path
- a per-condition source audit is done — list which tier-B conditions were verified and against what source

Diego reviews this doc before publishing any results derived from Selectron.
