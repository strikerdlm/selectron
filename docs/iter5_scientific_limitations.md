# Selectron — Scientific Limitations of the Current IMM Calibration

**Created:** 2026-05-22 (post priors-rev3-b)
**Status:** Living document — update on every priors revision or engine extension
**Companion docs:** [`iter5_priors_rev3_strategy.md`](iter5_priors_rev3_strategy.md), [`iter3_vv_dossier.md`](iter3_vv_dossier.md) §5

> **NOT-FOR-FLIGHT:** Selectron is a research tool + methodology demonstrator. It is not a flight-medical-kit sizing tool, not a Mars-mission risk-certification instrument, and not a substitute for individual crew-member fitness-to-fly assessment. The limitations below are not aspirational TODOs — they are real and material.

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

### 3.2 The tier-B blanket multiplier is atheoretical

rev3-b set `global_calibration.tierB_multiplier = 0.55` — a single scalar that scales every tier-B condition's sampled incidence by 0.55. This was the simplest knob that brought aggregate TME within K15 CI₉₅ across all three scenarios.

**It is not a scientific claim that every tier-B prior was elicited 1.8× too high.** Individual tier-B conditions are almost certainly over-elicited (a 1.8× scalar is too much) or under-elicited (it is not enough); the blanket multiplier moves the AGGREGATE to match while obscuring per-condition errors.

A scientifically defensible alternative would be a **per-condition audit**: spot-check each tier-B condition against the primary source(s), correct individual incidence values, and let the aggregate fall where it falls. We do not have the analyst-hours nor the per-condition source data to do this for all 42 tier-B conditions in this iteration.

### 3.3 Stochastic rounding preserves mean only

The rev3-b engine extension applies tier multipliers via stochastic rounding (`floor(count × mult) + Bernoulli(frac)`). This preserves the expected value exactly but **distorts higher moments** — variance is no longer `Var(Poisson(λ · mult))`. For CI₉₅ reporting (which is the whole point of the Monte Carlo), this is a known issue.

The principled fix is to thread the multiplier into the **sampling site**: sample directly from `Poisson(λ · mult)` (or `Lognormal-Poisson(μ + log(mult), σ)`, etc.) rather than post-multiplying the count. This is a one-line change in `src/imm/incidence.ts` and tracked as a follow-up TODO in `src/imm/simulate.ts`.

Until that follow-up lands, **CI₉₅ widths on metrics that depend on multiplied tiers are slightly under-reported**.

### 3.4 The auto-load behaviour shifts RNG streams

`simulateIMM` auto-loads `global_calibration.tierA/B/C_multiplier` defaults from `imm-priors.json`. When any multiplier is ≠ 1.0, a `rng()` draw is consumed inside the multiplier path, shifting the RNG stream for all downstream Bernoulli samples (severity, p_evac, p_locl).

**Reproducibility verification** (`scripts/validate_imm_explicit_baseline.ts`, 2026-05-22): calling `simulateIMM` with explicit `{tierA: 1, tierB: 1, tierC: 1}` reproduces the pre-rev3-b baseline numbers exactly to two decimal places, confirming the multiplier path is the only source of RNG-stream divergence.

**Implication:** the same `(seed, priors-json-state)` pair gives the same output. The same `(seed, mutated-priors-json)` does not. Snapshot tests must include priors-json provenance.

---

## 4 · Where the model is wildly miscalibrated

### 4.1 TM21 Mars-class missions

`exports/2026-05-22_validate_imm_rev3b_tierB055.txt` shows:

| DRM | Engine pEVAC | TM21 spec band | Engine pLOCL | TM21 spec band |
|-----|--------------|----------------|--------------|----------------|
| AMM 426d | 14.15 % | 25–40 % | 0.41 % | 5–12 % |
| SMM 923d | 30.05 % | 40–65 % | 0.95 % | 15–30 % |

**pLOCL is 12–30× too low.** This is not addressable by any blanket multiplier or per-event probability rescale. The TM21 spec bands almost certainly encode effects our engine does not model:

- **Treatment-decision degradation under comms delay** (22-minute one-way Mars latency). A myocardial infarction or septic event treated with ground-team guidance is much worse on Mars than on ISS. Our engine has no comms-delay model.
- **Cumulative-dose conditions** (renal stones, radiation cataract, late-onset cardiac, bone-fracture risk) that compound over 400+ days. Our priors are per-event Poisson with constant λ; no cumulative-dose pathway exists.
- **Mars-surface EVA risk profile** ≠ ISS-microgravity EVA. SMM has 401 EVAs in our mission profile — each with risks the K15 priors did not characterize for partial-gravity surface ops.
- **Compound failures**: simultaneous medical + life-support degradation, food/water shortages, planetary launch-window dependencies on crew capability. None of these are modeled.

`scripts/diagnose_tm21_gap.ts` (run 2026-05-22) shows ARS dominates Mars pLOCL contribution (34 % of total) and cardiogenic shock is #2 (19 % on SMM) — but absolute numbers remain 12–30× below TM21 spec bands. **Re-elicitation alone will not close this gap.** A structural engine extension (comms-delay modulation; cumulative-dose accumulator; Mars-EVA risk vector) is required.

### 4.2 'none' pEVAC under-elicited

The 'none' (no medical kit) scenario gives pEVAC = 13.7 % vs K15 ref 66.9 %. The K15 baseline expects that 2-of-3 crews on a 6-month mission without any medical resources would face an EVAC decision. Our priors give 1-of-7. This is a per-event `untreated.p_evac` under-elicitation (rev3-c scope) — but see §4.1: the same fix may not generalize to TM21.

### 4.3 issHMS CHI residual (Δ −19.3)

CHI = 1 − QTL / available. On issHMS, our CHI = 75.6 % vs K15 ref 94.93 %. This is independent of incidence (rev3-b) and per-event probability (rev3-c) — it reflects per-event SEVERITY (`fi_cp1/2/3` × `dt_cp1/2/3_hours` Beta-Pert distributions) and the issHMS kit's actual coverage of treatment paths. Likely needs per-condition severity audit, not blanket scaling.

---

## 5 · Validation gates we do NOT have

The IMM Calculator plan §86 / §87 specifies two validation tests:

- **IMM-86** K15 Table 1 reproduction test (12 metrics within K15 CI₉₅). Currently **5 of 12 pass** post rev3-a + rev3-b. PENDING.
- **IMM-87** TM21 AMM/SMM ±20 % gate. Currently **fails by orders of magnitude on pLOCL**. PENDING and not addressable without structural engine work.

Neither validation gate is written as a vitest test yet. Both are required for IMM Phase 2 acceptance (`IMM-51`) and IMM Phase 5 release (`IMM-95`).

---

## 6 · What Selectron IS appropriate for

- **Analog-mission planning** — assessing relative crew composition risk for MDRS / HI-SEAS / Mars500 / SIRIUS scenarios where the priors are closer to in-flight observation
- **Selection-criteria sensitivity analysis** — testing how different MCDA weight elicitations change ranking under the same posterior
- **Methodology paper for the npj Microgravity / Aerospace Medicine venue** — the V&V approach (NASA-STD-7009A factors 1-3 explicit) is the publishable contribution; the priors are illustrative
- **Educational tool** — teaching the IMM Monte Carlo workflow, Bayesian MCDA, NASA HSRB LxC

## 7 · What Selectron is NOT appropriate for

- **Flight medical kit sizing** — use NASA's actual iMED + IMM workflow with NASA-internal priors
- **Mars-mission risk certification** — the TM21 generalization gap (§4.1) precludes this
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
