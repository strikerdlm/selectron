# Selectron — Future Features Roadmap

**Created:** 2026-05-22 (during the analog-scope-down decision)
**Status:** Living document — review on every Selectron iteration
**Companion docs:** [`iter5_scientific_limitations.md`](iter5_scientific_limitations.md) (why these are deferred), [`iter5_priors_rev3_strategy.md`](iter5_priors_rev3_strategy.md) (the calibration phasing this roadmap fits into)

---

## Operating principle

Selectron v1 is scoped to **Earth-based analog isolation missions** (MDRS, HI-SEAS, Mars-500, Antarctic winter-over, etc.) and **LEO / ISS-baseline scenarios** (ISS 6mo K15 reference, S20 DRMs). These are the use cases for which:

- The K15 / S20 priors have direct in-flight / Earth-analog backing
- The IMM engine math (Lognormal-Poisson, Beta-Pert, concurrent FI) is appropriate as designed
- The inter-model verification benchmarks (K15 Table 1 reproduction) are defined

Everything below extends Selectron beyond that scope. **Do not enable any feature in this roadmap without first implementing its listed structural prerequisites.** The temptation to "just turn it on" is exactly how aerospace medical models start producing plausibly-shaped but quantitatively wrong outputs for missions they were never calibrated to.

---

## Feature 1 — Artemis missions (lunar transit + surface)

**Target users:** NASA Artemis programme analog studies; lunar-orbit transit risk planning; lunar-surface EVA workload modelling.

**Mission catalog to add to `src/data/imm-missions.ts`:**

| Artemis | Profile | duration | crew | EVAs | Status |
|---------|---------|----------|------|------|--------|
| **Artemis I** | uncrewed lunar flyby (Orion + EM-1) | 25 d | 0 | 0 | Already flown 2022; reference only for protocol |
| **Artemis II** | crewed lunar flyby | 10 d | 4 | 0 | Planned ~2026 |
| **Artemis III** | crewed lunar landing (south polar) | ~30 d (with ~6.5 d surface) | 4 (2 surface) | 2 surface | Planned ~2027 |
| **Artemis IV** | crewed Gateway + lunar surface | 30 d Gateway + lunar | 4 | varies | Planned ~2028 |
| **Artemis V+** | Gateway-assembled lunar base sorties | 60–180 d | 4 | varies | Programme TBD |

Tag in `src/data/imm-missions.ts`: `kind: "lunar-artemis-future"`. Currently filtered out of `ACTIVE_MISSIONS`.

**Structural engine prerequisites** (in dependency order):

1. **Comms-delay model.** Lunar one-way latency is ~1.3 s (vs ~0.6 s ISS Ku-band tail) — much smaller than Mars (22 min), so the comms-delay treatment-degradation factor is modest but non-zero. Engine extension: per-condition `treatment_under_comms_delay` modifier on `treated.fi_cp*` Beta-Pert distributions, lerped between full-treated and partial-treated based on the mission profile's latency. Lunar latency means modifier ≈ 0.05–0.10; effectively negligible vs ISS for most conditions but matters for time-critical (cardiac arrest, anaphylaxis, sepsis decompensation). Reference: Antonsen 2018 *Crew Health Risks for ISS Increments* §4.2.
2. **Lunar-surface EVA risk profile.** Different from ISS microgravity EVAs: dust exposure (NASA TM-2007-214755, Apollo data), 1/6-g falls, suit puncture from regolith, longer surface durations. Add `eva_kind: "iss-microgravity" | "lunar-surface" | "mars-surface"` to mission spec; per-EVA priors shift accordingly.
3. **Limited cumulative dose** for Artemis transit. 10–30 day lunar transits accumulate ~1–3 mSv galactic cosmic ray dose plus the Van Allen belt traversal (~5–10 mSv). Manageable; add `cumulative_dose_msv` accumulator to `IMMOutcome` but with simple linear-accrual; no cancer-risk endpoints needed for the 30-day timeframe.
4. **Partial-gravity bone & cardiovascular deconditioning.** 1/6 g over 6.5 days surface (Artemis III) is bounded; the existing space-adaptation prior set (back-pain-space-adaptation, headache-space-adaptation, etc.) is approximately right for short lunar surface stays. Re-elicit for longer Gateway-assembly Artemis missions.
5. **Lunar-medical-kit prior**. Different from ISS HMS — Artemis has tighter mass/volume constraints; some ISS HMS items unavailable. Add `IMM_KITS.artemis` to `src/imm/kits.ts` once NASA's actual Artemis medical kit manifest is publicly documented.

**Future benchmark/external-validation requirement to add as `IMM-87-lunar`:** Artemis-III aggregate pLOCL within band X% (TBD when reference numbers are published), plus explicit classification of whether the reference is a model-output benchmark or observed outcome data. Currently no published NASA Artemis IMM aggregate exists; this requirement is provisional.

**When to implement:** after rev3-c (the K15 'none' pEVAC fit) closes and the engine extension for comms-delay is small enough that the bulk of the work is in priors elicitation, not engine architecture.

---

## Feature 2 — Mars missions (interplanetary)

**Target users:** NASA Moon-to-Mars planning; SpaceX Mars architecture studies; Mars Design Reference Mission (TM21) analyses.

**Mission catalog (already in `src/data/imm-missions.ts`, currently tagged `kind: "interplanetary-mars-future"` and filtered out of `ACTIVE_MISSIONS`):**

- `amm-426d` Accelerated Mars Mission (TM21 AMM) — 426 d total, 4-crew, 60 EVAs
- `smm-923d` Standard Mars Mission (TM21 SMM) — 923 d total, 4-crew, 401 EVAs

**Structural engine prerequisites — these are HARD, not nice-to-have:**

1. **Comms-delay model — MARS scale (22-min one-way).** Order of magnitude greater than lunar. Most acute medical decisions cannot be ground-supported. Treatment outcomes for time-critical conditions (MI, sepsis, anaphylaxis, traumatic haemorrhage) degrade by 1.5×–3× depending on autonomy of onboard crew physician. Engine extension: same `treatment_under_comms_delay` modifier as Artemis but with mission-specific latency producing much larger effect. Per-condition lerp needs literature review (see Hodkinson et al. 2017 *Aerospace Medicine* on autonomous treatment evidence base).
2. **Cumulative-dose conditions.** 426–923 day deep-space missions accumulate 500–1 200 mSv GCR + sporadic SPE dose. The existing `incidence: { distribution: "Fixed", lambda_unit: "events-per-SPE" }` Acute Radiation Syndrome prior handles SPE acute events but does NOT capture: cumulative-dose-driven cancer mortality (Cucinotta 2014); radiation cataract (Chylack 2009); CNS radiation effects (Cucinotta 2017); late-onset cardiovascular (NASA STD-3001 §6.3). Engine extension: cumulative-dose accumulator with per-day GCR accrual + per-SPE event-driven accrual; endpoint conditions for radiation-cataract and radiation-CV with `incidence: { distribution: "Cumulative-Dose-Threshold", ... }` (new distribution kind in `IMMPrior`).
3. **Mars-surface EVA risk profile.** 0.38 g falls (higher injury rate than ISS, lower than lunar?), partial-pressure suit fatigue over 6–8 hr surface EVAs, suit-failure SPE-exposure modes. SMM has 401 EVAs — even a small per-EVA suit-failure probability accumulates. Engine extension: same `eva_kind` system as Artemis but with Mars-specific priors. Reference: NASA TM-2014-216537 *EVA Trauma and Decompression Risk for Long Duration Missions*.
4. **Crew-autonomy treatment matrix.** ISS treatments assume ground-team guidance + Earth-emergency-return option. Mars treatments assume neither. Add `autonomy_class: "ground-supported" | "limited-comms" | "autonomous"` to mission spec; per-condition `treated.*` Beta-Pert priors must have alternatives for each class.
5. **Resupply / no-resupply dimension.** ISS has Progress/Dragon/Cygnus resupply ~3–4×/year. Mars missions have NONE. Engine extension: per-resource consumption tracking already exists (kit.resources); add a no-resupply constraint that hard-fails treatments when kit runs out (currently it silently falls through to untreated). Mars 426d / 4-crew on a fixed kit may run out of critical resources before mission end.
6. **Compound-failure modes.** Simultaneous medical + life-support degradation, food/water shortages, planetary launch-window dependencies on crew capability — not modelled. Likely out of scope for v2; may need v3 architectural revisit.

**Future benchmark/external-validation requirement to add as `IMM-87-mars`:** TM21 AMM/SMM pEVAC + pLOCL within published spec bands (AMM pEVAC 25–40%, pLOCL 5–12%; SMM pEVAC 40–65%, pLOCL 15–30%), plus explicit classification of whether each reference is a model-output benchmark or observed outcome data. Per the 2026-05-22 diagnostic (`exports/2026-05-22_tm21_gap_diagnostic.txt`), current model misses pLOCL by 12–30×. Any future Mars validation or benchmark will fail until prerequisites 1–5 above are implemented.

**When to implement:** after Artemis is shipped AND a dedicated 3–6 month effort to elicit Mars-specific priors (with literature review of Hodkinson, Antonsen, Cucinotta, NASA Bioastronautics Roadmap sources). This is a separate Iter-N initiative, not a follow-up to rev3-c.

**Hard truth:** K15 inter-model agreement does not extend to Mars. Anyone pasting the model into a Mars-planning context without these prerequisites is misusing it.

---

## Feature 3 — additional analog missions (low-effort, no engine work)

The current `ACTIVE_MISSIONS` set has 11 entries (3 LEO-ISS + 8 Earth-analog). Easy adds:

- **AMADEE-XX** (Austrian Space Forum) — typically 30-day Mars-surface analog
- **D-MARS** (Israeli Mars analog) — 4–10 day rotations
- **Concordia (Antarctica)** — already covered by `antarctic-winter`; could add specific Concordia-vs-Vostok variant
- **SIRIUS-21 / 23** (Russian extended isolation) — successor programme to Mars-500
- **CHAPEA** (NASA Crew Health and Performance Exploration Analog, Houston) — 378-day Mars-surface analog in a closed habitat

For each, only need: prior elicitation from any published reports, mission profile entry in `src/data/imm-missions.ts` with `kind: "analog-isolation"`, single Playwright smoke test. No engine work.

**When to implement:** opportunistically as the analog community publishes mission data.

---

## Feature 4 — non-mission features (UI / methodology)

These are tracked in the IMM Calculator plan (`docs/superpowers/plans/2026-05-20-selectron-imm-calculator.md`) but flagged here for visibility:

- **Phase 3 ML layer** (IMM-52 → IMM-65) — surrogate model (LightGBM) + vulnerability MLP (TFJS). Currently PENDING; ML-layer validation badge is part of the K15 reproduction gate.
- **I6 IMMSensitivityTornado** (IMM-72) — needs a ±50% per-condition perturbation runner.
- **I7 IMMCrewRiskHeat** (IMM-73) — needs per-crew × per-condition counts surfaced from `runIMMTrial`.
- **I8 IMMVulnerabilityCalibration** (IMM-74) — depends on the vulnerability MLP from Phase 3.

These do not need scoping decisions like Artemis / Mars do — they're standard Selectron development tracked in STATUS.md.

---

## Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-22 | Scope Selectron v1 to Earth-analog + LEO-ISS only. Mars (TM21 AMM/SMM) and Artemis flagged as future features. | Per Diego: "this is critical for real missions, make sure the mathematics are sound, models are calibrated with the scientific evidence." TM21 diagnostic (`scripts/diagnose_tm21_gap.ts`) confirmed Mars pLOCL gap is structural (12–30× below spec band), not a calibration knob. Honest answer: scope down rather than ship miscalibrated. Artemis added to roadmap because lunar missions are the next operational use case once Selectron extends beyond Earth analog. |
