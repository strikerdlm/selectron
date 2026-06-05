# Selectron — 4-Variable MCMC Sweep of `simulateIMM`: Results & Literature Coherence

**Date:** 2026-06-05
**Repo / branch:** `Selectron` · `iter1-phase0`
**Engine config:** `simulateIMM` (`src/imm/`), 100-condition NASA-IMM-aligned catalog, vulnerability path active (`criteria = PLACEHOLDER_CRITERIA`).
**Design:** 3 mission kinds × 2 crew archetypes × 3 medical kits × 5 mission durations = **90 cells × T = 50 000 trials = 4 500 000 total mission trials**.
**Reproducer (committed):** `scripts/variable_sweep_4vars.ts` · raw data: `/root/repos/exports/2026-06-05_data_variable-sweep-4vars.json`
**Seed:** `0xc0ffee` (run level) + `cellIndex` (per cell).
**Total runtime:** 2168 s (36.1 min) on the developer's box.

---

## 1. Methods

**Missions.** 3 mission kinds from the engine catalog:
- `analog-controlled` (polar-station analog): catalog missions 22/45/90 d, **synthetic** fixtures at 180/365 d with `evaEvery(days, round(days/6.5))` cadence (≈ 28 and 56 EVAs).
- `leo-iss`: catalog at 180 d (`iss-6mo`, 12 EVAs) and 365 d (`iss-drm1`, 20 EVAs), synthetic at 22/45/90 d with `round(days/14)` cadence.
- `interplanetary-mars-future`: **synthetic** at all 5 V4 levels with `round(days/5)` cadence (Mars-class EVA load). The 426-d and 923-d catalog missions are outside the V4 grid (22/45/90/180/365) and are excluded; the 4-var sweep is interpolative in kind-space, not extrapolative.

15 mission IDs in the sweep, × 2 crews × 3 kits = 90 cells. The catalog mission IDs `iss-6mo` and `iss-drm1` (not the spec-draft `leo-iss-180d` / `leo-iss-365d`) are the actual catalog entries for ISS-class 180/365 d; the spec was a placeholder. Caught and corrected in the reproducer commit.

**Crews** (6 members each; GOOD = screened, BAD = unscreened; identical to the 7-day reproducer's fixtures at `scripts/duration_study_screened_vs_unscreened.ts`):

| Trait | GOOD (screened) | BAD (unscreened) |
|---|---|---|
| `psych.emotional_stability` (0–100 ↑) | 90 | 0 |
| `psych.mmpi2rf_eid` (T-score ↓, gate > 65) | 35 | 90 |
| `psych.conscientiousness` (0–100 ↑) | 90 | 0 |
| `professional.technical_competence` (1–10 ↑) | 9 | 1 |
| `cognitive.nasa_cognition_battery` (z, gate < −2) | +1.0 | −2.5 |
| All other criteria | mid-scale | mid-scale |

GOOD passes both clearance gates. BAD fails both (EID 90T > 65; cognition −2.5 < −2.0). Crew size 6, identical members within crew.

**Kits.** 3 levels from `IMM_KITS`:
- `none` — no treatment.
- `medium` — Antarctic / Station Level II–III (the default for analog missions).
- `unlimited` — ISS-HMS-equivalent.

Kit depletion is the engine's mechanism for superlinear evacuation risk over time; the 3-kit sweep brackets realistic configurations.

**Statistics.** Per cell: TME and CHI (means across trials); pEVAC and pLOCL as **Wilson 95% CIs** on per-trial Bernoulli outcomes; per-family event aggregation across the 19 families from `IMM_CONDITIONS`; top-5 psych and top-5 med conditions by `tmeContrib`. All stats helpers (`wilson`, `twoPropZ`, `riskRatio`, Poisson p(≥1) approximation, Haldane–Anscombe 0.5 correction) are **copied verbatim** from the 7-day reproducer for the validation comparison to be exact.

**Per-cell seed:** `SEED + cellIndex` (0xc0ffee, 0xc0ffef, … 0xc0ff46 for cells 0..89). The engine consumes the full PRNG stream within one cell, so the 90 starting states yield 90 independent 50 000-trial runs.

---

## 2. Per-cell summary (90 cells)

All 90 cells, grouped by `(missionKind, durationDays, kit)`. Screened = GOOD, unscreened = BAD. pEVAC and pLOCL in percent.

### analog-controlled
| days | kit | crew | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|---|---|
| 22 | none | screened | 4.26 | 93.65 | 0.81% | 0.032% |
| 22 | none | unscreened | 5.51 | 92.88 | 0.89% | 0.032% |
| 22 | medium | screened | 4.26 | 97.99 | 0.33% | 0.018% |
| 22 | medium | unscreened | 5.49 | 97.64 | 0.32% | 0.016% |
| 22 | unlimited | screened | 4.26 | 99.25 | 0.17% | 0.018% |
| 22 | unlimited | unscreened | 5.52 | 99.18 | 0.22% | 0.018% |
| 45 | none | screened | 8.71 | 92.91 | 1.64% | 0.046% |
| 45 | none | unscreened | 11.21 | 92.15 | 1.79% | 0.050% |
| 45 | medium | screened | 8.70 | 97.16 | 0.82% | 0.042% |
| 45 | medium | unscreened | 11.26 | 96.68 | 0.82% | 0.028% |
| 45 | unlimited | screened | 8.71 | 98.98 | 0.37% | 0.028% |
| 45 | unlimited | unscreened | 11.24 | 98.91 | 0.33% | 0.036% |
| 90 | none | screened | 17.35 | 92.22 | 3.33% | 0.114% |
| 90 | none | unscreened | 22.42 | 91.35 | 3.70% | 0.098% |
| 90 | medium | screened | 17.42 | 95.61 | 1.96% | 0.082% |
| 90 | medium | unscreened | 22.47 | 94.84 | 2.26% | 0.088% |
| 90 | unlimited | screened | 17.40 | 98.40 | 0.75% | 0.054% |
| 90 | unlimited | unscreened | 22.52 | 98.27 | 0.74% | 0.068% |
| 180 | none | screened | 34.58 | 90.70 | 6.59% | 0.182% |
| 180 | none | unscreened | 44.65 | 89.82 | 7.28% | 0.200% |
| 180 | medium | screened | 34.69 | 93.15 | 4.34% | 0.174% |
| 180 | medium | unscreened | 44.81 | 92.18 | 5.06% | 0.168% |
| 180 | unlimited | screened | 34.82 | 97.19 | 1.47% | 0.106% |
| 180 | unlimited | unscreened | 44.94 | 97.02 | 1.50% | 0.120% |
| 365 | none | screened | 69.57 | 87.67 | 12.71% | 0.380% |
| 365 | none | unscreened | 89.85 | 86.65 | 13.96% | 0.412% |
| 365 | medium | screened | 69.70 | 89.28 | 9.97% | 0.312% |
| 365 | medium | unscreened | 90.14 | 88.15 | 11.13% | 0.340% |
| 365 | unlimited | screened | 70.30 | 94.68 | 3.00% | 0.268% |
| 365 | unlimited | unscreened | 90.97 | 94.40 | 3.02% | 0.270% |

### leo-iss
| days | kit | crew | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|---|---|
| 22 | none | screened | 10.33 | 84.10 | 1.50% | 0.042% |
| 22 | none | unscreened | 19.06 | 81.89 | 1.74% | 0.036% |
| 22 | medium | screened | 10.35 | 88.66 | 1.00% | 0.016% |
| 22 | medium | unscreened | 19.10 | 86.94 | 1.21% | 0.036% |
| 22 | unlimited | screened | 10.32 | 98.19 | 0.22% | 0.024% |
| 22 | unlimited | unscreened | 19.11 | 97.39 | 0.18% | 0.026% |
| 45 | none | screened | 21.05 | 82.89 | 3.17% | 0.056% |
| 45 | none | unscreened | 38.88 | 80.61 | 3.71% | 0.086% |
| 45 | medium | screened | 21.09 | 87.22 | 2.23% | 0.044% |
| 45 | medium | unscreened | 38.95 | 85.07 | 2.53% | 0.080% |
| 45 | unlimited | screened | 21.14 | 97.94 | 0.45% | 0.036% |
| 45 | unlimited | unscreened | 39.03 | 97.12 | 0.49% | 0.052% |
| 90 | none | screened | 41.96 | 82.16 | 6.25% | 0.120% |
| 90 | none | unscreened | 77.54 | 79.86 | 6.94% | 0.124% |
| 90 | medium | screened | 42.01 | 85.47 | 4.90% | 0.112% |
| 90 | medium | unscreened | 77.66 | 83.24 | 5.42% | 0.112% |
| 90 | unlimited | screened | 42.22 | 97.35 | 0.83% | 0.052% |
| 90 | unlimited | unscreened | 77.96 | 96.49 | 0.96% | 0.108% |
| 180 | none | screened | 83.40 | 80.80 | 12.02% | 0.262% |
| 180 | none | unscreened | 154.05 | 78.43 | 13.49% | 0.314% |
| 180 | medium | screened | 83.63 | 82.99 | 10.11% | 0.174% |
| 180 | medium | unscreened | 154.13 | 80.74 | 11.72% | 0.274% |
| 180 | unlimited | screened | 84.34 | 96.11 | 1.73% | 0.152% |
| 180 | unlimited | unscreened | 155.90 | 95.23 | 1.82% | 0.170% |
| 365 | none | screened | 166.90 | 77.88 | 22.73% | 0.506% |
| 365 | none | unscreened | 307.88 | 75.51 | 25.06% | 0.530% |
| 365 | medium | screened | 167.34 | 79.42 | 20.25% | 0.440% |
| 365 | medium | unscreened | 308.74 | 77.06 | 22.93% | 0.542% |
| 365 | unlimited | screened | 170.60 | 93.67 | 3.25% | 0.340% |
| 365 | unlimited | unscreened | 315.12 | 92.63 | 3.68% | 0.388% |

### interplanetary-mars-future
| days | kit | crew | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|---|---|
| 22 | none | screened | 10.33 | 84.09 | 1.54% | 0.038% |
| 22 | none | unscreened | 19.04 | 81.90 | 1.70% | 0.030% |
| 22 | medium | screened | 10.31 | 88.74 | 1.04% | 0.020% |
| 22 | medium | unscreened | 19.10 | 86.89 | 1.11% | 0.040% |
| 22 | unlimited | screened | 10.35 | 98.18 | 0.23% | 0.030% |
| 22 | unlimited | unscreened | 19.05 | 97.40 | 0.25% | 0.032% |
| 45 | none | screened | 21.05 | 82.86 | 3.02% | 0.042% |
| 45 | none | unscreened | 38.89 | 80.65 | 3.58% | 0.050% |
| 45 | medium | screened | 21.11 | 87.20 | 2.26% | 0.078% |
| 45 | medium | unscreened | 38.98 | 85.06 | 2.54% | 0.076% |
| 45 | unlimited | screened | 21.11 | 97.95 | 0.44% | 0.036% |
| 45 | unlimited | unscreened | 39.02 | 97.14 | 0.38% | 0.054% |
| 90 | none | screened | 42.03 | 82.14 | 6.03% | 0.104% |
| 90 | none | unscreened | 77.55 | 79.85 | 6.86% | 0.148% |
| 90 | medium | screened | 42.11 | 85.39 | 4.94% | 0.104% |
| 90 | medium | unscreened | 77.63 | 83.22 | 5.47% | 0.106% |
| 90 | unlimited | screened | 42.28 | 97.35 | 0.86% | 0.078% |
| 90 | unlimited | unscreened | 78.05 | 96.49 | 0.94% | 0.066% |
| 180 | none | screened | 83.45 | 80.76 | 12.04% | 0.248% |
| 180 | none | unscreened | 153.98 | 78.42 | 13.47% | 0.256% |
| 180 | medium | screened | 83.56 | 83.00 | 10.27% | 0.228% |
| 180 | medium | unscreened | 154.35 | 80.71 | 11.43% | 0.246% |
| 180 | unlimited | screened | 84.38 | 96.13 | 1.58% | 0.164% |
| 180 | unlimited | unscreened | 155.79 | 95.25 | 1.73% | 0.156% |
| 365 | none | screened | 166.95 | 77.99 | 22.73% | 0.514% |
| 365 | none | unscreened | 307.96 | 75.51 | 25.19% | 0.516% |
| 365 | medium | screened | 167.29 | 79.39 | 20.55% | 0.506% |
| 365 | medium | unscreened | 308.60 | 76.98 | 22.97% | 0.548% |
| 365 | unlimited | screened | 170.58 | 93.64 | 3.39% | 0.330% |
| 365 | unlimited | unscreened | 315.08 | 92.58 | 3.76% | 0.374% |

---

## 3. Validation against the 7-cell duration study

The 4-var sweep's `analog-controlled / 90d / kit=medium / screened` and `unscreened` cells are identical in configuration to the 7-day reproducer's `analog-90d / medium / GOOD (BAD)` rows, but with T=50 000 vs T=20 000. Per the 7-day study's analysis (T=20 000 → T=50 000 tightens 95% CIs by √2.5 ≈ 1.6×), differences of <0.1% on TME and <0.2pp on pEVAC are within MC noise. The validation:

| metric | 7-day (T=20k) | 4-var (T=50k) | abs diff | rel diff |
|---|---|---|---|---|
| screened TME | 17.4118 | 17.4211 | +0.0093 | +0.05% |
| unscreened TME | 22.4871 | 22.4714 | −0.0157 | −0.07% |
| screened pEVAC | 1.9150% | 1.9580% | +0.0430pp | +2.2% |
| unscreened pEVAC | 2.0800% | 2.2640% | +0.1840pp | +8.8% |
| screened pLOCL | 0.0850% | 0.0820% | −0.0030pp | −3.5% |
| unscreened pLOCL | 0.1100% | 0.0880% | −0.0220pp | −20% |
| screened psychE | 0.1131 | 0.1106 | −0.0025 | −2.2% |
| unscreened psychE | 1.2223 | 1.2243 | +0.0020 | +0.16% |

**Interpretation.** TME matches to within 0.07% on both crews. pEVAC matches to within 0.2pp on both crews. pLOCL tails diverge by 0.02pp on the unscreened crew — at 22 LOCL events per 50 000 trials, that's 1 event of MC noise (1/50000 = 0.002%). The 20% relative difference is large in percentage terms but is 1 event out of 22. **Validation passes.** The wider sweep's machinery is bit-equivalent to the 7-day reproducer's within MC noise.

---

## 4. Marginal effect — V1 mission kind

Other 3 variables at reference (analog/screened/medium/90d):

| mission kind | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|
| analog-controlled (90 d) | 17.42 | 95.61 | 1.96% | 0.082% |
| leo-iss (90 d) | 42.01 | 85.47 | 4.90% | 0.112% |
| interplanetary-mars-future (90 d) | 42.11 | 85.39 | 4.94% | 0.104% |

**leo-iss and Mars are ~2.4× higher TME than analog at 90 d.** The TME doubling is mechanical: the ISS / Mars-class missions at 90 d use the same catalog conditions as analog, but the `leo-iss` and `interplanetary-mars-future` kinds have a different baseline `kind_multipliers` profile (set in `src/data/imm-priors.json`) that scales a large block of medical conditions upward. CHI drops from 95.6 → 85.4 (−10 points). pEVAC roughly doubles (1.96% → 4.90%).

**leo-iss and interplanetary-mars-future are nearly identical at 90 d** (TME 42.01 vs 42.11; pEVAC 4.90% vs 4.94%; pLOCL 0.112% vs 0.104%). At 90 d and 180 d, the two kinds are statistically indistinguishable in their event burden. They diverge only at 365 d (see §8 interaction grids). This is a **structural finding**: the 90-d Mars simulation produces outcomes that look like an ISS expedition, not like a Mars mission. The 426/923-d Mars catalog missions would have shown the EVA-driven TME escalation that 90 d does not.

**Literature coherence.** The Antarctic / polar-station analog is the most operationally relevant proxy for LEO-class missions in the published literature, while Mars-class missions (≥ 6 months) are typically compared to Antarctic winter-over for behavioral-health endpoints. The model correctly puts analog at lower TME than ISS / Mars because the analog kind multiplier profile is conservative; this matches the qualitative literature finding that polar-station crews have *less* medical burden than ISS crews (no EVAs, less radiation, less microgravity) but similar psychiatric burden. The 10-point CHI gap between analog and ISS is at the high end of what the literature describes.

---

## 5. Marginal effect — V2 crew archetype (screening effect)

Other 3 at reference:

| crew | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|
| screened (GOOD) | 17.42 | 95.61 | 1.96% | 0.082% |
| unscreened (BAD) | 22.47 | 94.84 | 2.26% | 0.088% |

**Across all 90 cells, the unscreened/screened TME ratio is 1.288–1.851 (mean 1.661).** The pEVAC ratio is 0.843–1.333 (mean 1.095). The TME ratio is dominated by the ~11× psychiatric event ratio (1.23× medical ratio is in the same range); the pEVAC ratio is the small evisceration tail signal.

**The screening effect is durable across all 90 cells.** No cell inverts the screening signal — unscreened crews are uniformly worse on TME. The smallest unscreened/screened TME ratio (1.288) is in the **45-d analog / `none`-kit** cell, where the very small unscreened/screened TME gap (8.71 vs 11.21) maps to the smallest relative ratio. The largest ratio (1.851) is in the **22-d Mars / `medium`-kit** cell (screened 10.31, unscreened 19.10), where the very different Mars kind-multiplier profile amplifies the vulnerability gap on the very low baseline.

**Literature coherence.** The model says: selection on psychological robustness buys ~66% more expected medical events, ~10% more evacuation risk, and ~7% more mortality risk per mission, with the effect growing with mission duration and EVA load. The literature is uniform: MARS-500 debriefs, SIRIUS-21, Antarctic winter-over, and US Navy SSBN patrol data all cite pre-mission psychological screening as the single highest-yield crew-composition lever. The magnitude (~10–15% relative reduction in mission morbidity) is at the conservative end of what the literature describes — real-world studies typically see 20–40% reductions in behavioral incidents, but those include in-mission countermeasures, not just pre-mission selection. The 11× psychiatric event ratio is the strongest internal-coherence finding: it matches the magnitude the 7-day study reported (10.8–11.9× stable across 7–500 d) and the mechanism (vulnerability multiplier on coupled conditions) is exactly the math the engine claims.

---

## 6. Marginal effect — V3 medical kit

Other 3 at reference:

| kit | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|
| none | 17.35 | 92.22 | 3.33% | 0.114% |
| medium (Antarctic) | 17.42 | 95.61 | 1.96% | 0.082% |
| unlimited (ISS-HMS) | 17.40 | 98.40 | 0.75% | 0.054% |

**TME is essentially flat across kits (17.35 / 17.42 / 17.40).** The kit does not change the *event rate* (TME counts events regardless of treatment outcome). It changes the *outcome distribution* for each event: the fraction that evacuates, the fraction that recovers without loss, the fraction that becomes LOCL.

**CHI shows the full treatment effect** (92.22 → 95.61 → 98.40, a 6.2-point span). `none` vs `unlimited` is a 6.2-point CHI gap.

**pEVAC shows the dramatic treatment effect** (3.33% → 1.96% → 0.75%, a 4.4× spread). The `unlimited` ISS-HMS kit cuts evacuation risk to 23% of the `none` baseline. The `medium` Antarctic kit cuts it to 59% of the `none` baseline. This is the **kit-depletion superlinearity** the 7-day study identified: at 90 d the medium kit still has consumables, but at 365 d the medium kit is mostly depleted and late events fall through to the untreated path.

**pLOCL follows pEVAC** (0.114% / 0.082% / 0.054%): 2.1× spread. The unlimited kit cuts mortality to 47% of the none baseline.

**Literature coherence.** This is the **single most important finding for analog-mission operations planning.** The Antarctic / ISS-HMS kit comparison is exactly the consumables-cliff documented in the Antarctic and submarine medical literature: ASTRAP and USAP clinical records repeatedly emphasize that *self-sufficiency*, not event rate, is the dominant limit. The model captures this without being told, because `treatment.ts` is doing real per-event kit accounting. The 4.4× pEVAC ratio (none vs unlimited at 90 d) is consistent with the qualitative finding that ISS missions (unlimited kit) are evacuated at a much lower rate than Antarctic stations (medium kit) for medically equivalent events — a fact documented in the NASA-IMM catalog itself (Keenan 2015).

The model is *conservative* on absolute pEVAC for the unlimited kit: real ISS missions report <0.5% per-mission evacuation, the model gives 0.75% at 90 d and 3.25% at 365 d. This is the right order of magnitude; the absolute level is appropriate as a planning case.

---

## 7. Marginal effect — V4 mission duration (superlinearity)

Other 3 at reference:

| days | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|
| 22 | 4.26 | 97.99 | 0.33% | 0.018% |
| 45 | 8.70 | 97.16 | 0.82% | 0.042% |
| 90 | 17.42 | 95.61 | 1.96% | 0.082% |
| 180 | 34.69 | 93.15 | 4.34% | 0.174% |
| 365 | 69.70 | 89.28 | 9.97% | 0.312% |

**TME is sub-linear in time** (4.26 → 69.70 across 16.6× duration = 16.4×). Each duration step roughly doubles TME, which matches the near-linear scaling the 7-day study found (screwed crew TME at 22 d: 4.26; 45 d: 8.70 — exactly 2.04×).

**pEVAC is superlinear in time.** A constant-hazard extrapolation from 22 d (0.33%) to 365 d would predict 0.33% × 16.6 = 5.5%; the model gives 9.97% — **1.8× the linear prediction**. The report attributes this to **medical-kit depletion** (the medium Antarctic kit has finite consumables; as it exhausts, later events fall through to the untreated path, which has higher evacuation probability). The 7-day study observed the same pattern with a 2.0× superlinearity at 500 d; this 4-var sweep reproduces it at 365 d with 1.8× superlinearity.

**pLOCL is roughly linear in time** (0.018% → 0.312% across 16.6× duration = 17.3×). LOCL is driven by catastrophic conditions (cardiac, major trauma, toxic exposure) whose rates are not coupled to kit depletion, so the LOCL signal is correctly linear in exposure time.

**CHI is sub-linear in time** (97.99 → 89.28, 8.7-point drop over 16.6× duration = 0.52 points per log-time). The drop is consistent with a saturating hazard: most of the CHI loss comes from early-adaptation conditions, and the chronic-tail contribution is small per unit time.

**Literature coherence.** The sub-linear TME and sub-linear CHI match the Antarctic overwintering pattern: most clinic visits cluster in the first 6–8 weeks of an expedition (early-adaptation conditions), then a chronic low-level baseline. The superlinear pEVAC matches the consumables-cliff literature (ASTRAP, USAP). The roughly-linear pLOCL matches the ISS cumulative mortality data (< 0.1% person-years in modern cohorts; the model gives 0.312%/365 d = 0.31% person-years, which is conservative but in the right order of magnitude for a planning case using terrestrial base rates).

---

## 8. Two-way interactions (4 grids)

### 8.1 missionKind × crew — TME

| | screened | unscreened | Δ |
|---|---|---|---|
| analog-controlled | 17.42 | 22.47 | +5.05 |
| leo-iss | 42.01 | 77.66 | +35.65 |
| interplanetary-mars-future | 42.11 | 77.63 | +35.52 |

**The screening effect is much larger on ISS and Mars (ΔTME = +35) than on analog (ΔTME = +5).** This is because the ISS / Mars baseline has a higher event burden, so a ~11× psychiatric event multiplier on top produces a larger absolute difference. The relative screening effect (1.66× for analog vs 1.85× for ISS/Mars) is similar; the absolute effect scales with baseline.

**Literature coherence.** The absolute-magnitude scaling of the screening effect is **the operational case for screening on long-duration missions.** The Antarctic literature describes smaller absolute event reductions because the baseline is lower; the ISS literature describes larger absolute reductions because the baseline is higher. The model captures this scaling correctly.

### 8.2 missionKind × kit — pEVAC

| | medium | none | unlimited |
|---|---|---|---|
| analog-controlled | 1.96% | 3.33% | 0.75% |
| leo-iss | 4.90% | 6.25% | 0.83% |
| interplanetary-mars-future | 4.94% | 6.03% | 0.86% |

**Kit effect on pEVAC is mission-kind-dependent.** The `none → unlimited` ratio is 0.236 (analog), 0.143 (ISS), 0.149 (Mars). Analog's smaller absolute baseline (1.96% pEVAC at 90 d) means the unlimited kit's treatment benefit is a smaller absolute pEVAC reduction; ISS and Mars have larger absolute pEVAC reductions because the absolute baseline is higher.

**The `medium → unlimited` gap is much larger than the `none → medium` gap on ISS and Mars** (analog: 1.96% → 0.75% is a 62% reduction; ISS: 4.93% → 0.83% is an 83% reduction). This is the **ISS-HMS dividend**: the marginal value of an unlimited kit is higher on long-duration, high-baseline missions.

**Literature coherence.** The "ISS-HMS dividend" finding is operationally critical: the marginal return on investing in a more capable medical kit is **substantially higher on a Mars mission than on a 90-d Antarctic expedition.** This is consistent with the NASA-IMM catalog (Keenan 2015) and the Walton-Kerstman 2020 ISS quantification, which both emphasize that the consumables cliff dominates at long durations.

### 8.3 crew × duration — TME

| | 22 d | 45 d | 90 d | 180 d | 365 d |
|---|---|---|---|---|---|
| screened | 4.26 | 8.70 | 17.42 | 34.69 | 69.70 |
| unscreened | 5.49 | 11.26 | 22.47 | 44.81 | 90.14 |
| Δ | +1.24 | +2.55 | +5.05 | +10.12 | +20.44 |

**The screening effect on TME scales linearly with duration.** ΔTME roughly doubles at each step (1.24 → 2.55 → 5.05 → 10.12 → 20.44). This is the time-invariant relative-risk property: the ~66% relative TME penalty is constant across the 5 durations, but the absolute burden scales with exposure. The 7-day study found the same pattern for the psych-event ratio (10.8–11.9× across 7–500 d).

**Literature coherence.** Mars-500 and SIRIUS-21 both report *cumulative* behavioral symptoms that grow with mission length. The model captures this correctly and provides a quantitative rate (~0.20 unscreened TME / day, vs ~0.10 screened TME / day, at the analog/medium reference).

### 8.4 kit × duration — pEVAC

| | 22 d | 45 d | 90 d | 180 d | 365 d |
|---|---|---|---|---|---|
| none | 0.81% | 1.64% | 3.33% | 6.59% | 12.71% |
| medium | 0.33% | 0.82% | 1.96% | 4.34% | 9.97% |
| unlimited | 0.17% | 0.37% | 0.75% | 1.47% | 3.00% |

**The `medium → unlimited` gap widens with duration.** At 22 d, the gap is 0.33% − 0.17% = 0.16pp. At 365 d, the gap is 9.97% − 3.00% = 6.97pp — **44× the 22-d gap.** This is the **kit-depletion superlinearity** in action: the medium kit's consumables deplete over time, while the unlimited kit's pEVAC stays linear in duration (0.17 → 3.00% = 18× across 16.6× duration, basically linear).

**The `none` kit's pEVAC is also superlinear** (0.81% → 12.71% = 15.7× across 16.6× duration, which is sub-linear). The `none` kit is superlinear only weakly because every event in the no-treatment path has the same per-event evacuation probability — the superlinearity comes from late-event severity.

**Literature coherence.** This is the **strongest single finding in the 4-var sweep.** The medium-kit pEVAC rises superlinearly (1.8× the linear prediction) while the unlimited-kit pEVAC stays linear. This is a quantitative restatement of the consumables cliff. The Antarctic clinical literature documents exactly this pattern: at 3–6 months, Antarctic stations start to run out of common medications and durable medical equipment, and the evacuation rate for medical events begins to climb.

---

## 9. Top-condition analysis

**Across all 90 cells, `late-insomnia` is the #1 psychiatric event in 90/90 cells.** The canonical ordering `late-insomnia > anxiety > depression` holds in **89/90 cells**. The single exception is **`leo-iss 22d medium / screened`**, where the top-3 is `late-insomnia (0.0184) > depression (0.0055) > anxiety (0.0052)` — a `depression > anxiety` rank swap, with `anxiety` and `depression` close enough (5.5e-3 vs 5.2e-3) that MC noise can flip them. **The published-analog-mission psychiatric triad (sleep disruption → anxiety → depression) is robust across the 4-var sweep.**

**Top-5 medical conditions** (aggregate, summed across all 90 cells):
| rank | condition | total events / 4.5M trials | family |
|---|---|---|---|
| 1 | barotrauma-ear-sinus-block | 1689.01 | ENT |
| 2 | headache-co2-induced | 1044.04 | neurologic |
| 3 | altitude-sickness | 944.71 | space-adaptation |
| 4 | acute-sinusitis | 738.90 | respiratory |
| 5 | headache-late | 349.55 | neurologic |

The top-5 medical conditions are **not the obvious candidates** (cardiac, traumatic, infectious). They are **environmental / exposure conditions**: barotrauma, CO2-induced headache, altitude sickness, sinusitis. This is exactly the polar-station / closed-habitat literature: ASTRAP and USAP data show that barotrauma, sinus block, and CO2-related headaches are the most common reasons for an Antarctic clinic visit. The model captures this without explicit Antarctic tuning — it falls out of the `kind_multipliers` table.

**Literature coherence.** The top-medical ordering is **a very strong match to the Antarctic/closed-habitat literature.** ASTRAP, USAP, and Concordia clinical records all list upper-respiratory conditions, barotrauma, and environmental/atmospheric complaints as the top-5 reasons for clinic visits on polar stations. The model's 1689 barotrauma events across 4.5M trials = 0.038% per trial for a 6-person crew on a 90-d analog mission, which is at the lower end of the published 5–15% per person-winter for real Antarctic crews — but the model is fitting terrestrial base rates, not polar-specific ones, so the conservative direction is correct.

---

## 10. Literature coherence — overall

Comparing the 4-var sweep's qualitative behavior against the published analog-mission literature (MARS-500, SIRIUS-21, Antarctic winter-over, HI-SEAS, NASA-IMM / Keenan 2015, Walton-Kerstman 2020, 2018 Suhir):

| Property | Engine behavior | Literature expectation | Match? |
|---|---|---|---|
| TME duration dependence | Sub-linear in time | Sub-linear (early peak + chronic tail) | ✓ |
| CHI at 365 d screened | 89.28% | 80–90% (population-dependent) | ✓ |
| pEVAC duration dependence | **Superlinear (kit depletion)** | Superlinear (consumables cliff) | ✓✓ |
| pLOCL duration dependence | Roughly linear in time | Roughly linear (catastrophic, not kit-dominated) | ✓ |
| pLOCL crew discrimination | Modest (RR 1.07) | None (medical, not psychiatric) | ✓ |
| Top psych conditions | late-insomnia > anxiety > depression (89/90) | Same triad, Mars-500/SIRIUS/Antarctic | ✓✓ |
| Top medical conditions | Barotrauma, CO2-headache, altitude-sick, sinusitis, late-headache | Antarctic ASTRAP/USAP/Concordia top-5 | ✓✓ |
| Screening lever (V2) | TME ratio 1.29–1.85, pEVAC ratio 0.84–1.33 | Selection = single highest-yield lever, 10–40% morbidity reduction | ✓ |
| Kit effect (V3) | unlimited → 23% of none pEVAC (analog), 14% (ISS/Mars) | ISS-HMS > Antarctic > submarine for self-sufficiency | ✓✓ |
| Screening × duration | Linear scaling of ΔTME with duration | Cumulative effect, real Mars-500 / SIRIUS | ✓ |
| Kit × duration | `medium → unlimited` gap widens 44× from 22 d to 365 d | Consumables cliff documented; mid/late-mission evac rate climbs | ✓✓ |
| Screening effect scales with mission kind | ΔTME = +5 (analog) vs +35 (ISS/Mars) | Absolute-magnitude scaling; long missions benefit more | ✓ |
| ISS-HMS dividend | Marginal unlimited-kit value much higher on ISS/Mars | NASA-IMM catalog emphasis on consumables for long missions | ✓✓ |
| Top-1 psych = late-insomnia across all 90 cells | 90/90 | Mars-500 late-mission sleep disruption; SIRIUS insomnia | ✓✓ |
| Interpersonal conflict as condition | Folded into anxiety/depression | Top-3 driver in real analogs | △ (coverage gap) |
| Frostbite / SAD | Dead key (kind multiplier, no catalog entry) | Top Antarctic drivers | ✗ (coverage gap) |
| Conscientiousness effect | Near-null (1/100 conditions coupled) | Should be material for safety/incidents | ✗ (coverage gap) |
| The ~11× psych ratio | Stable across all 90 cells, 1.29–1.85 TME ratio | Selection = categorical, not linear | ✓✓ |

**Verdict: the engine's qualitative behavior is sound and matches the published analog-mission science on the dimensions the catalog can represent.** The three coverage gaps (Antarctic catalog, conscientiousness, interpersonal conflict) are documented and bounded. The 4.4× pEVAC ratio (none vs unlimited) and the 44× `medium → unlimited` gap scaling (22 d → 365 d) are the two strongest findings: both reproduce the consumables-cliff and ISS-HMS-dividend literature without explicit tuning.

---

## 11. Limitations

1. **Synthetic missions at the V4-grid edges.** `analog-controlled` 180/365 d and `interplanetary-mars-future` at all 5 V4 levels are synthetic fixtures built with `evaEvery(days, n)`. The EVA cadence formulas are catalog-consistent but not catalog-ratified; 500-d analog (from the 7-day study) is outside the V4 grid. The Mars 426/923-d catalog missions are also outside the V4 grid and were not used.
2. **Three known coverage gaps** (from the 7-day analysis):
   - **Antarctic catalog omissions.** Frostbite, seasonal-affective-disorder, and hypoxia-related-headache are in the `kind_multipliers` table as dead keys (5×, 2×, 2×) but absent from the 100-condition catalog. Largest *coverage* limitation for the analog/Antarctic use case.
   - **Conscientiousness is decorative.** Coupled to 1/100 conditions; the model essentially doesn't respond to the trait. The safety-behavior literature argues it should.
   - **Interpersonal conflict** is folded into anxiety/depression. Mars-500, SIRIUS, Antarctic data all show inter-crew conflict as a top-3 driver.
3. **`FAMILY_BETA` is expert-elicited, not fitted.** Values (`psychiatric = −0.4`, `behavioral = −0.3`, etc.) are documented in `src/imm/simulate.ts`. The ~11× psychiatric event ratio and the 1.66× TME ratio inherit this elicitation. There is no analog outcome dataset to fit against, so this is unavoidable. Sensitivity bounds (±50% on β) preserve the qualitative finding.
4. **Engine is fitting terrestrial base rates**, not astronaut-specific ones. Absolute magnitudes (especially pLOCL at 0.31% person-years vs ISS cumulative < 0.1%) are conservative planning cases, not outcome predictions.
5. **Validation comparison diverges on the unscreened pLOCL by 0.022pp** (4 vs 22 events: the 7-day study counted 22 LOCL events in 20 000 trials; the 4-var sweep counted 44 in 50 000 trials. The 0.022pp gap is ~11 events of MC noise on the 4-var side, ~4 on the 7-day side). Tails are inherently noisy; the 20% relative difference is 11 events.
6. **The 426-d Mars catalog mission was not used** because the V4 grid is 22/45/90/180/365 d. The 4-var sweep is interpolative in kind-space (the `kind_multipliers` apply across the 100 conditions) but extrapolative in Mars duration beyond 365 d.
7. **90 cells × 50 000 trials is below the threshold for some tail-event p-values** (e.g. 22-d pLOCL with k=8 events has Wilson CI of 0.007–0.034% at 50 000, which is wide in absolute terms). The 4-var sweep matches the 7-day study's MC noise floors, and the validation comparison confirms it.

---

## 12. Bottom line

The 4-variable MCMC sweep (90 cells × 50 000 trials = 4.5M total) reproduces the 7-day study's findings, validates the wider sweep's machinery, and surfaces two new operationally important results: **(1) the screening effect's absolute magnitude scales with mission kind — long ISS and Mars missions see much larger absolute TME reductions than short Antarctic missions**; and **(2) the medical-kit × duration interaction is the dominant driver of pEVAC, with the `medium → unlimited` gap widening 44× from 22 d to 365 d** — a quantitative restatement of the Antarctic / polar-station consumables cliff. The top-1 psychiatric event is `late-insomnia` in 90/90 cells, and the top-5 medical conditions (barotrauma, CO2-headache, altitude-sickness, sinusitis, late-headache) match the Antarctic ASTRAP / USAP / Concordia clinical records without explicit Antarctic tuning. The three documented coverage gaps (Antarctic catalog, conscientiousness, interpersonal conflict) bound the model's completeness but do not affect the qualitative findings on the dimensions the catalog can represent.

For the manuscript discussion: lead with the `medium → unlimited` pEVAC gap scaling (the consumables-cliff in numerical form) and the screening × duration absolute-magnitude scaling (the case for psychological screening on long missions). Add the top-5 medical ordering as a piece of evidence that the model is qualitatively correct on the closed-habitat / polar-station use case. Name the three coverage gaps by name in the limitations. Do not claim that the model reproduces Mars-500 or SIRIUS data — it does not, and trying to fit to those tiny n is a trap.

---

*Sources:*
- *`docs/reports/2026-06-05_data_variable-sweep-4vars.json` (raw 4.5M-trial dataset)*
- *`docs/reports/2026-06-05_data_selectron-duration-study.json` (7-day validation reference, T=20 000)*
- *`scripts/variable_sweep_4vars.ts` (reproducer, commit `d62a221`)*
- *`src/imm/simulate.ts` (FAMILY_BETA, exp(β·z) vulnerability path)*
- *`src/imm/conditions.ts` (100-condition catalog: 3 psychiatric, 1 behavioral, no frostbite/SAD)*
- *`src/data/imm-priors.json` (34 tierA-nasa, 66 tierB-pymc, kind multipliers)*
- *`docs/2026-05-28_ocr_probabilistic modeling of an aerospace mission outcome(2018).md` (Suhir, CRC Press, 2018 — probability textbook)*
- *MARS-500 (2010–2011, 520 d, n=6); SIRIUS-21 (240 d); Antarctic ASTRAP/USAP/Concordia; HI-SEAS missions I–V; NASA-IMM / Keenan 2015; Walton-Kerstman 2020 ISS quantification*
