# Analog-Habitat IMM Model — Proposal for Ratification

**Status:** DRAFT proposal (awaiting Diego's ratification of the condition triage before calibration).
**Branch:** `iter1-phase0-analog-imm` (off `iter1-phase0`).
**Date:** 2026-06-04.
**Decisions taken (user, 2026-06-04):** (1) Scope = *extend the manuscript*; (2) anchors = *research-and-propose, Diego ratifies*; (3) pLOCL = *near-zero, focus on pEVAC*.

**Manuscript safety:** all work is branch-isolated and does **not** touch the ready-to-upload R4 ASR submission package. The hold-R4-vs-publish-as-follow-up decision is deferred to Phase 6, once the analog results exist — nothing here forces that call now.

---

## 1. Goal

Make the analog-habitat kinds (`analog-controlled`, `antarctic-station`) compute Bayesian medical risk from **general-population base rates over the conditions that actually occur under terrestrial isolation & confinement (I&C) only** — dropping the spaceflight-specific conditions. The emergent pEVAC/pLOCL then reflect the analog reality, and the I3 condition-driver chart becomes genuinely scenario-specific.

**Hard invariant:** the `leo-iss` path stays byte-identical (K15 invariance canary in `tests/imm/simulate.test.ts` must stay green). All analog behaviour rides on per-kind `kind_multipliers`; the ISS/K15 engine is untouched.

## 2. Mechanism — incidence side (multipliers only)

The engine already supports per-`(kind, condition)` multipliers (`imm-priors.json::global_calibration.kind_multipliers[kind][conditionId]`), applied to the incidence λ at the sampling site. **`mult = 0` ⇒ the condition never fires ⇒ contributes 0 to pEVAC/pLOCL and drops off I3's top-N automatically.** So "use I&C conditions only" = set `mult = 0` for every spaceflight-specific condition, per analog kind. pEVAC is **emergent** (not settable); we tune the kept-condition rates until emergent analog pEVAC matches literature anchors — the same relationship K15 has to ISS.

**Caveat (important):** multipliers act on **incidence only**. pLOCL lives on a *different* axis — severity × treatment × evacuation *given* an event — that the multipliers do not reach. So pLOCL≈0 is **not** automatic from the triage; it is the one place this design may need more than multipliers. See §5.

## 3. Condition triage (the part to ratify)

Catalog = 100 `IMM_CONDITIONS` (`src/imm/conditions.ts`). Proposed **ZERO-for-analog** set below. Everything not listed is **KEPT** at general-population/terrestrial base rates (most are already `tierB-pymc`, i.e. PyMC-fitted from terrestrial epidemiology).

### 3a. ZERO — Group A: microgravity space-adaptation (`family: space-adaptation`) — 10
Physiology of weightlessness; impossible in 1-g terrestrial habitats.
- `back-pain-space-adaptation`
- `constipation-space-adaptation`
- `headache-space-adaptation`
- `insomnia-space-adaptation` *(already zeroed both kinds)*
- `nasal-congestion-space-adaptation`
- `nose-bleed-space-adaptation`
- `space-motion-sickness-space-adaptation`
- `urinary-incontinence-space-adaptation`
- `urinary-retention-space-adaptation`
- `visual-impairment-and-intracranial-pressure-viip-space-adaptation` (VIIP/SANS) *(already zeroed both kinds)*

> **Gap today:** only `insomnia-space-adaptation` + VIIP are zeroed. The other **8 still fire on analog missions** — the root cause of the user's "analog uses ISS conditions" observation.

### 3b. ZERO — Group B: spaceflight environment hazards — 4
- `acute-radiation-syndrome` — SPE radiation; atmosphere + magnetosphere shield terrestrial analogs.
- `decompression-sickness-secondary-to-extravehicular-activity` — vacuum/prebreathe DCS; analog "EVAs" are 1-atm surface walks. *(already zeroed both kinds)*
- `headache-co2-induced` — spacecraft ECLSS CO₂; analog habitats sit at atmospheric CO₂. *(already zeroed both kinds)*
- `toxic-exposure-ammonia` — ISS external ammonia coolant loop; no analog equivalent.

### 3c. ZERO? — Group C: spacesuit/EVA-specific (flagged for your call) — 2
- `fingernail-delamination` — EVA-glove onycholysis (NASA phalanx/glove studies). Analog suited surface ops are far milder → propose **0** (or strong suppress).
- `paresthesias` — EVA-coupled (suit fit/ischemia). Propose **0** (or strong suppress).

### 3d. KEEP but reconsider source — fire/combustion (flagged) — 2
- `burns-secondary-to-fire`, `smoke-inhalation` — currently calibrated to the **spacecraft** fire catalog (Guibaud 2022). Terrestrial-habitat fire risk is real but different. Propose **keep**, recalibrated to terrestrial-habitat fire base rates (or leave as-is if you prefer conservatism).

### 3e. RECONSIDER — `barotrauma-ear-sinus-block` (inherited over-zero, flag)
Currently zeroed for **both** analog kinds in the existing block — but ear/sinus barotrauma is an ordinary **terrestrial ENT** condition (colds/congestion in a confined habitat), not spaceflight-specific. This looks like an over-zero carried over from the 2026-06-04 commit. **Propose: un-zero** (restore to terrestrial base rate) unless you intend otherwise.

### 3f. KEEP — the ~82 terrestrial I&C conditions
Musculoskeletal sprains/strains/fractures, GI, ENT, ophthalmologic, dermatologic, dental, cardiovascular, renal, GU, and the **I&C-elevated** psych/behavioral cluster (`depression`, `anxiety`, `late-insomnia`, `behavioral-emergency`). These stay at general-population rates, modulated by the existing analog context multipliers.

### 3g. Per-kind environmental nuance (already partly encoded)
- **`antarctic-station`** keeps/elevates cold-/altitude-exposure: `frostbite` 5.0×, `altitude-sickness` 4.0× (Pole/Concordia), `hypoxia-related-headache` 2.0×, `seasonal-affective-disorder` 2.0×; suppresses `respiratory-infection` 0.2×, `gastroenteritis` 0.1×, `depression` 0.5×, `skin-rash` 0.33× (anchored on Bhatia 2012 / Palinkas 2004 / Pattarini 2016 / Hong 2022 / Peřina 2024 / Nirwan 2022).
- **`analog-controlled`** (sea-level, heated): cold/altitude conditions = 0; mild URTI/depression suppression. Sea-level so `altitude-sickness` = 0 (already set).

*(`frostbite`, `hypoxia-related-headache`, `seasonal-affective-disorder` are referenced in the multiplier block but are not yet in `IMM_CONDITIONS` — they are forward-compat; adding them as real conditions is a sub-task.)*

## 4. pEVAC literature anchors (to research after triage is ratified)
Validation targets for the emergent analog pEVAC (research-and-propose):
- **Antarctic medevac rates** — USAP winter-over medical evacuation frequency (per station-season / per person-year).
- **Submarine / deployed-military** medical evacuation rates (closest sealed-habitat analog).
- **Analog-mission medical incident → termination** rates (MDRS/HI-SEAS/Mars500 logs).
These become an **analog validation gate** paralleling K15-for-ISS (manuscript "extend" scope).

## 5. pLOCL ≈ 0 — the one place multipliers aren't enough
pLOCL is emergent from **severity × treatment-availability × evacuation given an event** — an axis the incidence multipliers (§2) do **not** touch. Zeroing the space-only conditions removes ARS, but the kept terrestrial catastrophes (`sudden-cardiac-arrest`, `sepsis`, `anaphylaxis`, `angina-myocardial-infarction`, `traumatic-hypovolemic-shock`) keep firing at population rates with their LOCL outcome probabilities intact. So `kind_multipliers` **alone will not** make analog pLOCL ≈ 0. Three ways to get there — pick one:

- **(a) Accept emergent near-zero (recommended; keeps the clean multipliers-only design).** Don't force it; report the residual analog pLOCL as-is (should be small once the high-lethality space conditions are gone). No new code.
- **(b) Drive it via the medical-support / evacuation (RAF) axis.** Model analog missions as high evac/treatment availability so LOCL-given-event collapses. **Caveat:** that path is keyed off `state.kit` (user-selected), **not** `state.mission.kind`, so it is not automatic per-kind — it would need wiring to default analog kinds to a high-availability evac context.
- **(c) Explicit analog `LOCL→0` clamp.** A small *new* per-kind mechanism. Most direct, but it breaks the otherwise multipliers-only design.

This is the single design fork that decides whether the build stays "multipliers-only." (Note: deep-winter Antarctic genuinely has no-medevac windows — the "Per kind" pLOCL option would have modeled that; the chosen "near-zero everywhere" overrides it.)

## 6. Phased plan
1. **Triage ratification** (this doc) — you confirm/adjust §3 (esp. Groups C/D and the pLOCL question).
2. **Research** — pEVAC anchors (§4) + any I&C incidence refinements; evidence written to `research/evidence_extracted/`.
3. **Priors** — extend `kind_multipliers` (zero Groups A/B [+C], complete both kinds); recalibrate kept conditions via the PyMC pipeline where evidence warrants. Re-run `npm run calibrate:imm`; never hand-edit priors.
4. **Engine/validation** — add the analog validation reference + test; assert `leo-iss` byte-identical (K15 canary) + analog pEVAC within anchor bounds. `npm run validate:imm`.
5. **UI** — the legacy-chrome cleanup (done); migrate stale `analog-isolation` sessions → `analog-controlled`; I3 now genuinely analog-specific.
6. **Manuscript** — methods + analog validation section + figures; full re-validation before resubmission.

## 7. Ratification
**Proceeding unless vetoed** (unambiguous spaceflight-only physiology / clear wins):
- Zero **Group A** (8 remaining space-adaptation) + **Group B** (ARS, ammonia).
- Add `frostbite` / `hypoxia-related-headache` / `seasonal-affective-disorder` as real `IMM_CONDITIONS` (Antarctic-relevant; currently forward-compat references only).

**Genuine forks (need your call):**
- **Q-C.** Group C EVA-suit (`fingernail-delamination`, `paresthesias`): zero / suppress / keep?
- **Q-D.** Fire (`burns-secondary-to-fire`, `smoke-inhalation`): keep-as-spacecraft / recalibrate-terrestrial / zero?
- **Q-baro.** `barotrauma-ear-sinus-block`: un-zero to terrestrial rate (recommended) / keep zeroed?
- **Q-pLOCL.** Path to near-zero analog pLOCL: (a) accept emergent / (b) evac-RAF axis / (c) explicit clamp?
