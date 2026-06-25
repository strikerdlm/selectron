# Selectron — Scientific Limitations of the Current IMM Calibration

**Created:** 2026-05-22 (post priors-rev3-b)
**Last updated:** 2026-06-25 — calculation hierarchy hardening; severity-branch coverage generated; accepted-evidence coverage remains 0/4,849
**Status:** Living document — update on every priors revision or engine extension
**Companion docs:** [`iter5_priors_rev3_strategy.md`](iter5_priors_rev3_strategy.md), [`iter3_vv_dossier.md`](iter3_vv_dossier.md) §5, [`future_features.md`](future_features.md)

> **NOT-FOR-FLIGHT — analog scope only.** Selectron v1 is a research tool + methodology demonstrator scoped to **Earth-based analog isolation missions** (MDRS, HI-SEAS, Mars-500, Antarctic winter-over) and **LEO / ISS-baseline scenarios** (ISS 6 mo K15 reference, S20 DRMs). It is **NOT** a Mars-mission tool, **NOT** an Artemis-mission tool, **NOT** a flight-medical-kit sizing tool, **NOT** a medical-clearance or crew-selection instrument, and **NOT** a NASA HSRB verdict engine. Mars and Artemis are catalogued in [`future_features.md`](future_features.md) with their structural prerequisites; do not enable them in `ACTIVE_MISSIONS` until those prerequisites land. The limitations below apply to the *in-scope* analog + LEO use case and are real and material.

> **v0.6 evidence boundary.** Source-attribution provenance in `imm-priors.json` is not the same as accepted evidence adjudication. The evidence ledger currently contains four nominal `accepted` rows, all malformed, yielding **0/4,849 valid accepted active-parameter coverage** and `releasePriorsAdjudicated = false`. K15 agreement is inter-model verification against a public NASA model output, not external validation against observed analog clinical outcomes.

---

## 1 · What is mechanically verified

The following are mechanically verified or unit-tested. They do not establish empirical prediction, crew-selection validity, or operational acceptance:

- **Stage A uncertain-weight MCDA** (`src/engine/`) — Dirichlet weights, Marsaglia–Tsang Gamma sampler, Mulberry32 PRNG, score normalization, finite-alpha validation, finite raw-score/range validation, positive integer iteration validation, and IID draw-count reporting. Closed-form mean / variance match Monte Carlo within 2 % / 5 % at 50k samples. These are induced score distributions, not suitability posteriors.
- **IMM engine math** (`src/imm/`) — Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli incidence samplers; Beta-Pert outcomes (mean = (a+4m+b)/6); concurrent FI formula `1 − Π(1 − f_i)` per K15 §II.A.9 verbatim; sequential-phase QTL accumulator (cp1 + cp2 + cp3) per K15 §II.A.9; per-event Bernoulli end-state sampling per spec; T=100 000 canonical trial count per M18 / A22.
- **Condition-level incidence hierarchy** — Gamma-Poisson, lognormal-Poisson, and Beta-Bernoulli condition rates/probabilities are now drawn once per condition per trial and shared across crew members before individual event sampling. This treats the stored distributions as trial-level parameter uncertainty rather than independent person-level rate noise; a separate fitted frailty layer is still future work.
- **Severity uncertainty layer** — severity Beta distributions now draw one condition/trial severity probability before event-level severity Bernoulli sampling, so Beta concentration affects between-trial uncertainty. Current priors still duplicate legacy outcome branches unless branch-specific outcomeScenarios are adjudicated.
- **Treatment resource accounting** — resource depletion now consumes each required resource as `min(required, available)` in chronological event order. The RAF scalar still controls treated/untreated interpolation and remains a screening approximation, not a treatment-state model.
- **Monte Carlo precision diagnostics** — MCSE, relative MCSE, Wilson 95 % intervals for rare binary probabilities, CHI clamp count/proportion, and independent-seed replication status are reported for current IMM scenario outputs. Independent-seed acceptance now includes TME spread and requires every replicated seed run to satisfy its own precision gate. Legacy σ checkpoint arrays remain compatibility diagnostics and are not presented as empirical convergence proof.
- **Runtime request validation** — the public simulation boundary rejects malformed mission/crew requests, including duplicate crew IDs, invalid sex values, crew-size mismatch, unordered or out-of-range EVA schedules, inconsistent total/per-member EVA counts, and nonzero EVA exposure for ineligible crew members.
- **HSRB-inspired developer adapter** — LxC translation remains available only for historical/developer comparison. The active analog workflow does not present NASA-equivalent HSRB verdicts, select/reject decisions, or L5/C5 override semantics.
- **Tier multipliers** — applied at each distribution-specific sampling site (λ-site for Poisson; per-Bernoulli for SA-once and EVA-coupled). Variance-correct by construction (Poisson closed under rate scaling; Bernoulli(p)×Bernoulli(mult) = Bernoulli(p·mult)). Commit `ce97dda`.

These do not absolve the priors of the issues below.

---

## 2 · What the priors are

`src/data/imm-priors.json` carries the 100-condition K15 reference catalog plus one source-cited analog behavioral extension (`interpersonal-conflict`), with source-attribution provenance tags:

| Tier | Count | Source character |
|------|-------|------------------|
| `tierA-nasa` | **34** | Attributed to a NASA-published IMM source (K15, M18, G12, TM21, S20, A22). Per-condition incidence numbers remain Selectron elicitation when the public source does not publish the internal NASA value. |
| `tierB-pymc` | **66** | Historical provenance tag for source-transcribed or historically fitted terrestrial/analog epidemiology. Current calibration code uses the analytic Gamma-Poisson posterior as the oracle when valid event/exposure rows exist, but current valid accepted coverage is 0/4,849; source heterogeneity and transportability remain unmodeled. |
| `tierB-lit` | **1** | Source-cited analog behavioral extension (`interpersonal-conflict`) retained as literature-anchored rather than PyMC-fitted because it is not represented in the proposal CSV evidence table. |
| `tierC-synth` | 0 | Fully eliminated (2026-05-26). The former tier-C conditions are retained only as source-attributed priors; their numerical parameters do not count as valid accepted evidence coverage. |

The K15 Appendix lists the 100 conditions with their incidence-source category and distribution family but **does NOT publish per-condition numerical incidence rates**. Those live in NASA's internal iMED SQL database which is not externally accessible.

**Consequence:** for tier-A and (especially) tier-B conditions, the specific numerical λ / Beta-Pert parameters are Selectron priors, not NASA's internal database values. They are reviewable but not independently verified against in-flight observation per condition.

**Evidence-ledger status:** the machine-readable accepted-evidence ledger is not release-ready. All four nominal accepted rows are malformed and excluded from accepted coverage. The valid accepted active-parameter coverage is **0/4,849**, and the current coverage denominator includes profile-effect parameters as well as `imm-priors.json` numeric parameters.

---

## 3 · Calibration limitations

### 3.1 The calibration target is itself a model output

`K15_TABLE1_REF` in `src/imm/calibration.ts` (TME 98.3 / 106 / 106 across the three kit scenarios) is the published output of NASA's iMED Monte Carlo simulator for the K15 reference crew. It is the best public anchor available, but **it is not directly observed in-flight data**.

The actual observed data (M18 Table 2: zero observed EVAC and zero observed LOCL across STS 1-114 + ISS 1-13) is consistent with K15's predictions but the observation window is too narrow to discriminate between, say, K15's 5.57 % pEVAC and our rev3-b 8.66 % — both give Poisson λ ≈ 0.7–1.1 over 13 ISS expeditions × 6 months, and both are consistent with the zero observed EVAC.

This means: our K15 "reproduction" demonstrates that we can reproduce another model's outputs, not that we have validated against reality.

### 3.2 The tier-B blanket multiplier has been retired

Earlier rev3-b calibration used a blanket `global_calibration.tierB_multiplier = 0.55` to pull aggregate total medical events into the K15 CI95 envelope. That scalar was a calibration aid, not a scientific claim about every tier-B condition.

The current manuscript-freeze prior file no longer relies on that blanket adjustment: tier-A, tier-B, and tier-C multipliers are all 1.0. The current source-attributed prior file comes from per-condition source transcription and historical fitting passes, not from a hidden global shrinkage factor. Because valid accepted active-parameter coverage is 0/4,849, this is not an adjudicated empirical calibration.

Residual limitation: several tier-B conditions remain sourced or historically fit from small-n, single-cohort, or proxy-condition evidence. The limitation is input-data pedigree, not an undisclosed multiplier. Those weaker priors are identified by their `source_ref` strings in `src/data/imm-priors.json` and require independent per-condition adjudication before any stronger empirical claim.

### 3.3 Reproducibility depends on the exact priors file

`simulateIMM` auto-loads `global_calibration.tierA/B/C_multiplier` defaults and `kind_multipliers` from `imm-priors.json`. The current tier multipliers are all 1.0, but the broader reproducibility rule remains: the same `(seed, priors-json-state)` pair gives the same output, while the same seed with a mutated priors file does not.

Snapshot tests and manuscript locks must therefore include the SHA-256 hash of `src/data/imm-priors.json`, not only the git commit and random seed.

### 3.4 Persistent-impairment classification is clinical-judgment-based

The rev3-e `fi_cp3` audit classified 68/100 conditions as fully-resolving (cp3 zeroed) and 32 as persistent-impairment (cp3 retained). This classification is clinical judgment, not NASA-iMED-derived. Per-condition fi_cp3 values remain NASA-internal. Further refinement against published persistent-impairment literature (rev3-f scope) would tighten the issHMS CHI fit.

### 3.5 'none' kit scenario divergence (accepted limitation)

The 'none' (no medical kit) scenario produces values that diverge from K15:

| Metric | Selectron (current 34+66+1 prior set) | K15 'none' ref | Δ |
|--------|--------------------------|-----------------|----|
| TME    | 97.8  | 98.30  | -0.5 ✓ |
| CHI    | 79.1  | 59.20  | +19.9 ✗ |
| pEVAC  | 12.52 % | 66.90 % | −54.38 ✗ |
| pLOCL  | 0.25 % | 2.89 % | −2.64 ✗ |

**Decision (2026-05-22): accept the divergence as a principled limitation.** Rationale:

1. **Scenario-construct extreme.** No real Earth-analog or LEO mission has ever launched with zero medical resources.
2. **K15 'none' is model-construct, not observed data.** NASA's iMED produces 'none' values by setting all resources to zero and running its internal untreated-outcome priors, which are not publicly published.
3. **Resource scenarios have benchmark anchors.** issHMS and unlimited are retained for inter-model comparison, but the current K15 benchmark result is reported as 4/12 interval overlaps rather than a general validation pass.
4. **Closing the gap would over-correct operational scenarios.** Blanket inflation of `untreated.fi_cp1/cp2` / `untreated.p_evac` would propagate through the RAF-interpolated path on issHMS and break the CI₉₅ fit.
5. **Per-condition `untreated.p_evac` anchored to Pattarini 2016.** Antarctic MEDEVAC rate (0.036/py) is the operational anchor.

**Sensitivity confirmation (2026-05-26).** The closed-form rescale predicted in `iter5_priors_rev3_strategy.md` §3.3 was implemented (`scripts/rescale_outcome_parameters.ts`) and checked as a sensitivity run. Results: untreated `p_evac` scaled by 8.42× and treated `p_evac` by 3.16× brings 'none' pEVAC to 63.90 % (target 66.90 %) and unlimited pEVAC to 4.86 % (target 4.93 %) — strong fit to that model-output target. However, the same rescale drives issHMS pEVAC to 53.39 % (target 5.57 %) via RAF-interpolated fall-through coupling, confirming prediction #4 exactly. The priors were reverted; the script is preserved for sensitivity analysis but is not merged into production priors.

Selectron's 'none' scenario should be interpreted as a sensitivity-analysis lower bound, not a calibrated prediction.

### 3.6 Severity-branch coverage is currently mechanistic only

Severity sampling is operational in the engine, but the active prior catalog does not yet contain independently adjudicated best/worst outcome branches. The generated coverage table is [`severity_branch_coverage.md`](severity_branch_coverage.md):

| Item | Current count |
|---|---:|
| Conditions with distinct best/worst outcome branches | 0 |
| Conditions with duplicated legacy branches | 101 |
| Conditions with independently adjudicated severity evidence | 0 |

Therefore severity draws currently modulate branch labels and future-proof the engine architecture; they should not be described as validated condition-specific severity outcome evidence.

### 3.7 Treatment model remains proposal-stage screening

The 2026-06-25 patch fixed non-conservative partial resource consumption, but the treatment model still reduces multi-resource availability to one RAF scalar and linearly interpolates between treated and untreated outcome distributions. It omits threshold treatment states, contraindications, provider skill, treatment delay, failed treatment, adverse effects, and resource interactions. Use it for conditional resource-scenario screening only, not clinical treatment-policy optimization or medical-kit sizing.

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

## 5 · Verification and validation status

**IMM-86** — K15 Table 1 benchmark. **K15 all-3-scenario inter-model comparison (T=100k, seed 0xc0ffee, current source-attributed priors):**

| Scenario | TME | ref | Δ | CHI | pEVAC | pLOCL |
|---|---|---|---|---|---|---|
| none | **97.8** | 98.30 | -0.5 ✓ | 79.1 | 12.52% | 0.25% |
| issHMS | **98.1** | 106.00 | -7.9 (known) | 82.8 | 9.65% | 0.23% |
| unlimited | **98.8** | 106.00 | -7.2 (known) | 95.3 | 1.78% | 0.18% |

K15 is a public model-output benchmark, not an observed analog-outcome dataset. Current scientific agreement is intentionally reported as **4/12 interval overlaps**, with **8/12 documented divergences**. Regression brackets protect against software drift; they do not convert model-output agreement into empirical validation. Written as a formal vitest benchmark at `tests/imm/validation_k15.test.ts`.

**IMM-87** — TM21 AMM/SMM ±20 % benchmark. **Not written.** Mars missions are out of scope (§4); this benchmark is deferred until the structural engine prerequisites in [`future_features.md`](future_features.md) are implemented.

**NASA-STD-7009 / 7009A** — full standard PDF still not in corpus. W14 (Task 27) is a 1-page poster, not the full document. Resolution path: NTRS direct download or institutional library proxy.

**New diagnostics (2026-05-24 math-hardening):**

- **K-S marginal Dirichlet fit** (`tests/engine/dirichlet_ks.test.ts`): 3 marginal Beta fits at T=5000 pass K-S at α=0.05 (D < 0.019); 1 rejection of misspecified Beta(10,10). More discriminating than the lag-1 ESS diagnostic for the IID Gamma-normalization sampler.
- **Gelman-Rubin R̂** (`tests/imm/rhat_convergence.test.ts`): 4 independent chains (seeds 0xc0ffee / 0xdeadbeef / 0x12345678 / 0xfeedface) × T=25k on issHMS. R̂(CHI) ≤ 1.01. This is numerical stability evidence, not external validation.
- **α₀ robustness panel** (`tests/engine/alpha0_robustness.test.ts`): Stage A score distribution at α₀ ∈ {1, 10, 100} with heterogeneous candidate. Central interval width monotonically decreases (0.50 → 0.21 → 0.07). Closed-form mean matches MC within 2% at all three concentrations.
- **Leave-calibrated-out sensitivity** (`tests/imm/validation_k15_loo.test.ts`): K15 reproduction with source-attributed conditions only (tier-A + source-cited tier-B). TME drops from ~100 → ~42; CHI rises from ~90% → ~97%. Demonstrates honest degradation when calibration-circular conditions are removed. This is a sensitivity test, not a validation study. (Test fixture reflects a pre-2026-05-25 provenance snapshot; current provenance tags are 34 tierA-nasa + 66 tierB-pymc + 1 tierB-lit.)

---

## 6 · What Selectron IS appropriate for (v1 scope)

- **Conditional scenario analysis** — comparing how explicit mission duration, crew composition, medical-kit, profile-effect mode, and prior-multiplier assumptions affect outputs under the same engine.
- **LEO / ISS-baseline software benchmarks** — ISS 6 mo K15 reference and S20 DRM scenarios as inter-model verification anchors, not analog validation.
- **Selection-criteria sensitivity analysis** — testing how different uncertain-weight MCDA assumptions change candidate score distributions. No real select/reject, clearance, or validated ranking use is supported.
- **Verification-first methods/software manuscript** — transparent separation of uncertain-weight MCDA, IMM-style scenario simulation, evidence accounting, and model-management controls. It must report 0/4,849 valid accepted coverage, 4/12 K15 interval overlap, and no external analog-outcome validation.
- **Educational tool** — teaching uncertain-weight MCDA, IMM-style Monte Carlo, evidence provenance, and model-credibility boundaries.

## 7 · What Selectron is NOT appropriate for

- **Mars mission planning, risk certification, or medical kit sizing** — out of scope by design as of 2026-05-22. See [`future_features.md`](future_features.md) §2 for the structural prerequisites required to extend Selectron to interplanetary missions.
- **Artemis (lunar) mission planning** — out of scope by design as of 2026-05-22. See [`future_features.md`](future_features.md) §1 for the structural prerequisites.
- **Flight medical kit sizing** (any destination) — use NASA's actual iMED + IMM workflow with NASA-internal priors
- **Individual crew-member fitness-to-fly decisions** — the gate-then-modulate architecture is illustrative; clinical disposition requires the full NASA Class I/II/III qualification process and individual medical workup
- **Analog-astronaut selection or rejection** — the Stage-A catalog is demonstration-only and lacks ratified criteria, elicited decision-maker weights, rank acceptability, construct validation, criterion validity, and fairness assessment.
- **NASA-equivalent HSRB verdicts** — HSRB-inspired adapters are developer comparisons only and are not board-equivalent operational risk postures.
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
- an inter-model verification benchmark or external-validation study is written — update §5 and distinguish those categories explicitly
- a per-condition source audit is done — list which tier-B conditions were verified and against what source

Diego reviews this doc before publishing any results derived from Selectron.
