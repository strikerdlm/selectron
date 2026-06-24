# Selectron — Analog-Mission Crew Simulations: Results & Model-Adjustment Assessment

**Date:** 2026-06-05
**Repo / branch:** `Selectron` · `iter1-phase0` (PR #1)
**Session commits:** `15b1e5c` · `79507f1` · `bb378c7` · `5cd03d8` · `ee06923` · `42ddcd5`
**Engine config (all runs):** `simulateIMM`, kit = `medium` ("Analog / Antarctic Station Level II–III"), seed `0xc0ffee`, T = 3 000 trials, `criteria = PLACEHOLDER_CRITERIA` (vulnerability path active), auto-loaded `analog-controlled` kind multipliers.
**Stability protocol:** every asserted contrast was swept across 3 seeds (`0xc0ffee`, `1234`, `99`) × 2 trial counts (3 000, 8 000) before margins were locked. Metrics that sign-inverted anywhere in the sweep were deliberately left unasserted.

> **Historical report boundary:** This archived report predates v0.6 audit containment. Treat its numbers as exploratory sensitivity outputs under old fixtures. It is not evidence of validated crew selection, medical clearance, calibrated analog pEVAC/pLOCL/CHI, or operational planning guidance. Current boundaries are in `docs/model_card.md` and `docs/iter5_scientific_limitations.md`.

---

## 1. What was done

1. **UI fix (`15b1e5c`)** — `KindMultipliersTable` and the **I6 Analog Bayesian MCMC Posterior** panel now render **pre-run** in an un-gated "Analog mission context" region of Crew Composition. Previously both sat inside the `{outcome && …}` figures region, so every mission switch (which clears the outcome via the stale-outcome guard) blanked them until a fresh T=100k run. The I6 data path (calibration API + worker sweep) never depended on the main run; only the render was gated. TDD: RED (2 failed) → GREEN (7/7).
2. **45-day unscreened-crew test (`79507f1`, `bb378c7`)** — `tests/imm/analog_45d_unscreened_crew.test.ts`.
3. **22-day same-crew test (`ee06923`)** — extension of the same file.
4. **90-day crew-archetype comparison (`42ddcd5`)** — `tests/imm/analog_90d_crew_archetypes.test.ts`, seven crews.

All 16 analog-crew tests pass; full suite **74 files / 557 passed / 0 failed** (at `15b1e5c`; +11 tests since); typecheck 0; phase3f e2e 12/12; K15 invariance canary green throughout (the engine itself was never modified — fixtures and UI gating only).

---

## 2. Crew profiles

Base member: every criterion at mid-fraction 0.5 of its scale (direction-corrected). Named-trait overrides (raw instrument scores):

| Trait | Unscreened ("bad") | Screened control | Population-average |
|---|---|---|---|
| `psych.emotional_stability` (0–100 ↑) | **0** | 90 | 50 (base) |
| `psych.mmpi2rf_eid` (30–120 T, ↓, gate > 65) | **90** | 35 | **50** (population mean) |
| `psych.conscientiousness` (0–100 ↑) | **0** | 90 | 50 (base) |
| `professional.technical_competence` (1–10 ↑) | **1** | 9 | 5.5 (base) |
| `cognitive.nasa_cognition_battery` (−3…+3 z, gate < −2) | **−2.5** | +1.0 | 0 (base) |

**Mechanism map (verified in `src/imm/conditions.ts`):**

| Criterion | λ-coupled conditions | Gate | Role |
|---|---|---|---|
| emotional_stability | **20** | — | strongest risk lever (psych β = −0.4) |
| mmpi2rf_eid | 3 | fail > 65T | **dual-role** (gate + λ) |
| nasa_cognition_battery | 7 | fail < −2.0 | **dual-role** (gate + λ) |
| conscientiousness | **1** | — | near-null risk lever |
| technical_competence | **0** | — | Stage-A composite only — never moves IMM risk |

---

## 3. Results

### 3.1 45-day campaign (`analog-45d`) — unscreened vs screened

At `0xc0ffee` / T=3k:

| Crew | TME | CHI | pEVAC | pLOCL | MSP |
|---|---|---|---|---|---|
| screened | 8.72 | 97.21 | 0.90 % | 0.07 % | 99.03 % |
| unscreened | **11.27** | **96.61** | 1.03 % | 0.00 % | 98.97 % |

Sweep (3 seeds × {3k, 8k}): ΔTME **+2.53…+2.61** (asserted > +1.5); ΔCHI **−0.33…−0.61** (asserted < −0.1). ΔpEVAC/ΔpLOCL/ΔMSP sign-invert across seeds (45-day rare-event tails) → unasserted.

Additional assertions: gates whole-crew-DQ the unscreened crew (EID 90T > 65; cognition −2.5 < −2.0) while the screened control qualifies; Stage-A mean composite degrades (the only path where technical competence acts); negative control — without a `criteria` catalog both crews are **bit-identical** (< 1e-12), proving the criteria coupling carries the entire effect.

### 3.2 22-day campaign (`analog-22d`) — same crews

| Crew | TME | CHI | pEVAC | MSP |
|---|---|---|---|---|
| screened | 4.25 | 98.03 | 0.33 % | 99.67 % |
| unscreened | **5.49** | **97.58** | 0.43 % | 99.57 % |

Sweep: ΔTME **+1.19…+1.29** (asserted > +0.7); ΔCHI **−0.36…−0.44** (asserted < −0.1); tails sign-invert → unasserted. Duration monotonicity asserted: same unscreened crew, 22-day TME (5.49) ≪ 45-day TME (11.27). The *relative* selection penalty is duration-stable (~+29 % TME at both 22 and 45 days) because the vulnerability multiplier acts proportionally on λ; the *absolute* burden scales with exposure days.

### 3.3 90-day campaign (`analog-90d`) — seven crew archetypes

| Crew archetype | Gates | Composite | TME | CHI | pEVAC | pLOCL | MSP |
|---|---|---|---|---|---|---|---|
| **screened (control)** | ✓ qualified | 0.650 | 17.23 | 95.64 | 2.10 % | 0.17 % | 97.70 % |
| **unselected-average** | ✓ qualified | 0.523 | 18.30 | 95.45 | 2.27 % | 0.10 % | 97.63 % |
| **low-conscientiousness** | ✓ qualified | 0.481 | 18.30 | 95.47 | 2.10 % | 0.13 % | 97.77 % |
| **cognitively-weak** | ✗ DQ(6) | 0.488 | 19.24 | 95.49 | 1.97 % | 0.03 % | 97.93 % |
| **mixed (2 worst + 4 avg)** | ✗ DQ(2) | 0.458 | 19.66 | 95.15 | 2.17 % | 0.00 % | 97.83 % |
| **emotionally-unstable** | ✗ DQ(6) | 0.444 | 20.70 | 95.04 | 2.90 % | 0.10 % | 97.00 % |
| **worst-combined** | ✗ DQ(6) | 0.326 | 22.59 | 94.87 | 2.20 % | 0.00 % | 97.80 % |

Sweep-durable contrasts (all 6 seed/T configs), as asserted in the test:

| Contrast (TME) | Sweep range | Asserted margin |
|---|---|---|
| average − screened | +0.93 … +1.07 | > +0.5 |
| emotionally-unstable − average | +2.11 … +2.41 | > +1.5 |
| cognitively-weak − average | +0.94 … +1.14 | > +0.5 |
| **conscientiousness − average** | **−0.03 … +0.07** | **\|Δ\| < 0.5 (regression canary)** |
| mixed − average | +1.18 … +1.41 | > +0.7 |
| worst − average | +4.05 … +4.29 | > +3 |
| CHI: worst − screened | −0.73 … −0.92 | < −0.5 |

### 3.4 Cross-cutting observations

1. **Gates are clinical select-out, not quality select-in.** A population-average unselected crew passes every gate yet still carries **+~1 TME** vs the screened crew — that margin is purely the sub-clinical vulnerability path. Selection buys both the DQ filter *and* this margin.
2. **Emotional instability dominates** (+2.1…+2.4 TME vs average; 23 coupled conditions at β = −0.4). Cognition is moderate (+1.0; 7 conditions). The mixed pool shows the realistic failure mode: 2 bad members DQ the whole crew and drag risk to intermediate levels.
3. **Evacuation tails do not discriminate crews** — pEVAC/pLOCL/MSP are statistically flat across archetypes even at 90 days. Evac is severity × kit/treatment-dominated; crew quality shifts λ (visible in TME/CHI), and the corresponding tail shift is real but below MC noise at T=3k. **TME and CHI are the correct readouts for crew-quality contrasts.**
4. **Fixture adjustment made:** "average person" profiles must anchor MMPI-2-RF EID at the **population mean (50T)**, not the raw scale midpoint — the midpoint is 75T = +2.5 SD, clinically elevated, and silently mislabels every ordinary crew as gate-failing.

---

## 4. Model-adjustment assessment

**Historical verdict:** the run showed internally consistent scenario behavior under old fixtures. K15 is an inter-model verification benchmark, not analog-outcome validation; the seed-stable crew contrasts are sensitivity findings, not validated crew discrimination. The simulations exposed three targeted **calibration/coverage** candidates that remain claim-boundary issues rather than submission-ready validation details.

### Recommended (ranked)

1. **EID neutral-point convention** — small, principled, cheap.
   `zScoreAgainstScale` treats the *scale midpoint* as neutral (z = 0). For EID that midpoint is 75T, but the population mean is 50T — so a genuinely average crew receives a protective multiplier (exp(β·z) ≈ 0.64) on the 3 EID-coupled conditions instead of sitting at baseline. Fix: optional `neutral` anchor on `Criterion` (default = midpoint; EID sets 50). K15 untouched. Contained TDD change.

2. **Conscientiousness coupling — scientific decision required.**
   Coupled to **1/100 conditions**, the trait is effectively decorative in the risk model, while the safety-behavior literature (adherence, procedural compliance, accident rates) argues it should not be. Expanding coverage to injury/hygiene/adherence-mediated conditions with a modest β requires a literature pass + evidence dossier (same discipline as the `kind_multipliers` work) and changes the manuscript's "58/100 coupled" count. The regression canary in `analog_90d_crew_archetypes.test.ts` forces this to be a conscious change.

3. **Antarctic catalog gap.**
   The `frostbite` (5×), `seasonal-affective-disorder`, and `hypoxia-related-headache` kind multipliers are **dead keys** — those conditions are absent from the 100-condition catalog, so the model structurally cannot produce its most Antarctic-specific risks. Largest *coverage* limitation for the analog/Antarctic use case. Catalog + priors + manuscript work.

### Explicitly not recommended

- **Do not "fix" pEVAC flatness across crews** — it is correct behavior (kit-dominated tails), not a defect; differences resolve at T=100k and remain small.
- **Do not refit the committed priors** — the committed set is an accreted, manuscript-anchored artifact; a naive refit supersedes the published numbers. Re-validate; never refit casually.
- **Do not attempt to fit FAMILY_BETA** — no analog outcome dataset exists to fit against. It stays an expert-elicited, sensitivity-audited, documented limitation.

### Timing

These candidates should be treated as prerequisites for stronger scientific claims, not as post-submission polish. Recommended batching: **v0.6 "vulnerability-path refinement"** (items 1–3 together, each with its own evidence dossier and the K15 invariance canary as the safety net), keeping manuscript and code in sync.

---

## 5. Verification summary

| Check | Result |
|---|---|
| typecheck (`tsc --noEmit`) | 0 errors |
| Full vitest (minus 15-min calibration file) | 74 files / 557 passed / 0 failed (at `15b1e5c`; +11 tests added since, all green) |
| Analog crew test files (45d/22d + 90d archetypes) | 16/16 |
| phase3f e2e (incl. I6 antarctic snapshot) | 12/12 |
| K15 invariance canary | green (engine never modified) |
| Live app verification | I6 + kind-multipliers table render pre-run with real API draws ("config only (no run yet)") |
| Pushed | `origin/iter1-phase0`, PR #1 — https://github.com/strikerdlm/selectron/pull/1 |

**Test files:**
- `tests/imm/analog_45d_unscreened_crew.test.ts` — 8 tests (45d + 22d blocks)
- `tests/imm/analog_90d_crew_archetypes.test.ts` — 8 tests (90d archetype comparison)
- `tests/ui/crew_composition_i6.test.tsx` — +2 pre-run render tests (7 total)
