# Selectron — Screened vs Unscreened Crews Across Analog-Mission Durations
## Statistical analysis: pEVAC, pLOCL, and medical/psychological condition probability over time

**Date:** 2026-06-05
**Engine:** `simulateIMM` (`src/imm/`), 100-condition NASA-IMM-aligned catalog, kit = `medium` ("Analog / Antarctic Station Level II–III"), `analog-controlled` kind multipliers auto-loaded, vulnerability path active (`criteria = PLACEHOLDER_CRITERIA`).
**Design:** 7 durations × 2 crews = **14 simulations × T = 20 000 trials** (280 000 mission trials total), seed `0xc0ffee`.
**Reproducer (committed):** `scripts/duration_study_screened_vs_unscreened.ts` · raw data: `exports/2026-06-05_data_selectron-duration-study.json`

---

## 1. Methods

**Missions.** 7/14/22/45/90-day campaigns from the mission catalog (`analog-7d` … `analog-90d`); 120-day and 500-day are synthetic `analog-controlled` fixtures (crew 6) with catalog-consistent EVA cadence (18 and 29 EVAs respectively, mirroring `analog-90d`/`analog-520d`).

**Crews** (6 members each, identical within crew; same fixtures as the committed test suite):

| Trait | Unscreened | Screened |
|---|---|---|
| Emotional stability (0–100 ↑) | 0 | 90 |
| MMPI-2-RF EID (T-score ↓, gate > 65) | 90 | 35 |
| Conscientiousness (0–100 ↑) | 0 | 90 |
| Technical competence (1–10 ↑) | 1 | 9 |
| NASA Cognition battery (z, gate < −2) | −2.5 | +1.0 |
| All other criteria | mid-scale | mid-scale |

The unscreened crew fails both clearance gates (whole-crew DQ if selection were applied); the screened crew qualifies. Both were *run anyway* — that is the point of the comparison: what selection would have prevented.

**Statistics.**
- pEVAC / pLOCL are per-trial Bernoulli outcomes: event counts k out of T = 20 000 trials per arm. **Wilson 95 % CIs** per arm; **two-proportion z-test** (pooled); **risk ratio** (unscreened/screened) with log-normal 95 % CI (Haldane–Anscombe 0.5 correction for zero cells).
- Both arms share the seed (house determinism convention). Common random numbers positively correlate the arms, so the independent-samples z-test is **conservative** — true significance is at least what is reported.
- Condition probabilities: per-condition expected events/trial (`perConditionDrivers.tmeContrib` = event-count sum / trials), grouped into **psychological** (families `behavioral` + `psychiatric`) vs **medical** (the other 17 families). p(≥ 1 event) is the Poisson approximation 1 − exp(−E[events]); labelled as such.

---

## 2. Full results (Table 1)

| days | crew | TME | CHI | pEVAC [95 % CI] | pLOCL [95 % CI] | psych E[events] | med E[events] | p(≥1 psych) | p(≥1 med) |
|---|---|---|---|---|---|---|---|---|---|
| 7 | screened | 1.36 | 98.68 | 0.10 % [0.06, 0.15] | 0.005 % [0.001, 0.028] | 0.008 | 1.35 | 0.8 % | 74.0 % |
| 7 | unscreened | 1.76 | 98.44 | 0.14 % [0.09, 0.20] | 0.005 % [0.001, 0.028] | 0.094 | 1.66 | 9.0 % | 81.0 % |
| 14 | screened | 2.69 | 98.30 | 0.20 % [0.15, 0.28] | 0.015 % [0.005, 0.044] | 0.016 | 2.67 | 1.6 % | 93.1 % |
| 14 | unscreened | 3.49 | 97.99 | 0.27 % [0.21, 0.35] | 0.020 % [0.008, 0.051] | 0.192 | 3.30 | 17.5 % | 96.3 % |
| 22 | screened | 4.26 | 97.99 | 0.36 % [0.29, 0.46] | 0.020 % [0.008, 0.051] | 0.028 | 4.23 | 2.7 % | 98.6 % |
| 22 | unscreened | 5.49 | 97.64 | 0.39 % [0.31, 0.49] | 0.025 % [0.011, 0.059] | 0.300 | 5.19 | 25.9 % | 99.4 % |
| 45 | screened | 8.70 | 97.18 | 0.72 % [0.62, 0.85] | 0.040 % [0.020, 0.079] | 0.055 | 8.64 | 5.4 % | 100 % |
| 45 | unscreened | 11.30 | 96.66 | 0.97 % [0.85, 1.12] | 0.020 % [0.008, 0.051] | 0.620 | 10.68 | 46.2 % | 100 % |
| 90 | screened | 17.41 | 95.61 | 1.92 % [1.73, 2.11] | 0.085 % [0.053, 0.136] | 0.113 | 17.30 | 10.7 % | 100 % |
| 90 | unscreened | 22.49 | 94.91 | 2.08 % [1.89, 2.29] | 0.110 % [0.073, 0.167] | 1.222 | 21.26 | 70.5 % | 100 % |
| 120 | screened | 23.17 | 94.73 | 2.86 % [2.64, 3.10] | 0.105 % [0.069, 0.160] | 0.150 | 23.02 | 13.9 % | 100 % |
| 120 | unscreened | 29.94 | 93.81 | 3.48 % [3.23, 3.74] | 0.110 % [0.073, 0.167] | 1.633 | 28.31 | 80.5 % | 100 % |
| 500 | screened | 95.11 | 86.75 | 13.82 % [13.35, 14.31] | 0.520 % [0.429, 0.630] | 0.595 | 94.51 | 44.8 % | 100 % |
| 500 | unscreened | 122.60 | 85.52 | 15.93 % [15.42, 16.44] | 0.580 % [0.484, 0.695] | 6.667 | 115.94 | 99.9 % | 100 % |

## 3. Hypothesis tests: unscreened vs screened (Table 2)

| days | pEVAC RR [95 % CI] | z | p | pLOCL RR [95 % CI] | z | p |
|---|---|---|---|---|---|---|
| 7 | 1.35 [0.76, 2.41] | 1.02 | 0.307 | 1.00 [0.06, 15.99] | 0.00 | 1.000 |
| 14 | 1.32 [0.88, 1.98] | 1.34 | 0.182 | 1.33 [0.30, 5.96] | 0.38 | 0.705 |
| 22 | 1.07 [0.78, 1.47] | 0.41 | 0.684 | 1.25 [0.34, 4.65] | 0.33 | 0.739 |
| 45 | **1.34 [1.09, 1.67]** | 2.72 | **0.006** | 0.50 [0.15, 1.66] | −1.15 | 0.248 |
| 90 | 1.09 [0.95, 1.25] | 1.18 | 0.238 | 1.29 [0.69, 2.44] | 0.80 | 0.423 |
| 120 | **1.22 [1.09, 1.35]** | 3.51 | **<0.001** | 1.05 [0.58, 1.90] | 0.15 | 0.879 |
| 500 | **1.15 [1.10, 1.21]** | 5.92 | **<0.001** | 1.12 [0.86, 1.45] | 0.81 | 0.417 |

RR = risk(unscreened) / risk(screened). Bold = significant at α = 0.05 (conservative under common random numbers).

---

## 4. pEVAC over time

1. **Duration is the dominant driver.** pEVAC rises from ~0.1 % (7 d) to ~14–16 % (500 d) in both arms — a ~140× increase across a 71× duration increase. The rise is **superlinear**: under a constant per-day evacuation hazard fitted at 7 d, the 500-day prediction would be ≈ 6.9 % (screened); the observed 13.8 % is twice that. The acceleration is mechanistically consistent with **medical-kit depletion**: as `medium`-kit consumables exhaust over long campaigns, later events fall through to the untreated path, which carries a higher per-event evacuation probability.
2. **Selection produces a modest, consistent relative reduction** — point RRs 1.07–1.35 across durations, i.e. the unscreened crew runs ~10–35 % higher evacuation risk. The effect reaches significance only where event counts give power: 45 d (RR 1.34, p = 0.006), 120 d (1.22, p < 0.001), 500 d (1.15, p < 0.001). Short campaigns (≤ 22 d) are underpowered at T = 20k (≤ 80 events/arm), not null.
3. **Why the effect is modest:** the selection criteria modulate λ mainly on psychiatric/behavioral and adaptation conditions, which are low-severity and rarely trigger evacuation. Evacuation risk is dominated by severity × kit coverage, which selection does not touch.

## 5. pLOCL over time

**No significant difference at any duration** (RRs 0.50–1.33, all p ≥ 0.25). pLOCL grows with duration (0.005 % → ~0.5–0.6 % at 500 d) identically in both arms. This is an honest and expected null: loss-of-crew-life in the model is driven by catastrophic conditions (cardiac, major trauma, toxic exposure) whose λ is **not coupled** to the psychological/cognitive selection criteria. **Selection on these criteria changes morbidity, not mortality.** Even at 500 d / 20 000 trials (~100–116 LOCL events per arm) the CI on the RR spans 1.

## 6. Probability of medical vs psychological conditions over time

Expected events per mission (E) and Poisson-approximate p(≥ 1):

| days | psych E (scr) | psych E (unscr) | **ratio** | med E (scr) | med E (unscr) | **ratio** |
|---|---|---|---|---|---|---|
| 7 | 0.008 | 0.094 | **11.3×** | 1.35 | 1.66 | 1.23× |
| 14 | 0.016 | 0.192 | **11.9×** | 2.67 | 3.30 | 1.23× |
| 22 | 0.028 | 0.300 | **10.9×** | 4.23 | 5.19 | 1.23× |
| 45 | 0.055 | 0.620 | **11.2×** | 8.64 | 10.68 | 1.24× |
| 90 | 0.113 | 1.222 | **10.8×** | 17.30 | 21.26 | 1.23× |
| 120 | 0.150 | 1.633 | **10.9×** | 23.02 | 28.31 | 1.23× |
| 500 | 0.595 | 6.667 | **11.2×** | 94.51 | 115.94 | 1.23× |

Findings:

1. **Proportional hazards, empirically confirmed.** The psychological-event ratio is constant at **10.8–11.9×** and the medical ratio at **1.23×** across a 71× duration range. This is exactly what the engine's time-invariant multiplier exp(β·z) predicts: relative risk is duration-independent; absolute burden scales with exposure.
2. **The ~11× psych ratio is quantitatively explained by the vulnerability math.** For a psychiatric condition coupled to both emotional stability and EID (β = −0.4): the screened crew's multipliers are exp(−0.4·1.6) × exp(−0.4·1.78) ≈ 0.26 and the unscreened crew's exp(0.8) × exp(0.27) ≈ 2.91 — a predicted ratio of **≈ 11.2×**, matching the observed 10.8–11.9×. The model's behavior is internally coherent, not an artifact.
3. **Event rates are linear in time.** Psychological events accrue at ≈ **0.40/crew-month** (unscreened) vs ≈ **0.036/crew-month** (screened); medical events at ≈ 7.0 vs 5.7 per crew-month. (Slight sub-linearity at 500 d from once-per-mission adaptation conditions saturating.)
4. **Where the difference bites operationally:** p(≥ 1 psychological event) for the unscreened crew crosses **25 % by 22 d**, **50 % by ~50 d**, **80 % by 120 d**, and is **virtually certain (99.9 %) at 500 d** — while the screened crew stays below 15 % out to 120 d. Medical events, by contrast, are near-certain for *any* crew on *any* campaign ≥ 45 d (p ≥ 1 medical event ≈ 100 %): selection does not buy freedom from medical events, it buys a ~19 % lower medical event count and an order-of-magnitude lower psychiatric burden. Dominant psych drivers in the unscreened crew at all durations: **late-insomnia > anxiety > depression**.

## 7. Conclusions

1. **Crew selection is, first and foremost, psychiatric-morbidity prevention.** Its largest, most duration-robust effect is a ~11× reduction in expected behavioral/psychiatric events — the difference between a 500-day campaign with a near-certain psychiatric event (99.9 %) and one where it remains less likely than not (44.8 %).
2. **Evacuation risk improves modestly** (RR ≈ 1.1–1.35 against the unscreened crew), detectable only on campaigns ≥ 45 days; **LOCL is unchanged** by selection on these criteria.
3. **Mission duration dominates everything**: no selection regime compensates for exposure time. pEVAC grows superlinearly with duration (kit depletion), and any crew on a ≥ 45-day campaign will almost surely generate medical events — kit sizing and resupply, not crew quality, govern the evacuation tail.
4. These results reinforce the §4 assessment from the archetype report: TME/CHI/psych-event burden are the metrics where selection acts; the evac/LOCL tails are kit- and severity-dominated.

## 8. Limitations

- Common-random-numbers seeding makes between-arm tests conservative; reported p-values are upper bounds.
- p(≥ 1 event) uses a Poisson approximation from expected counts (events are over-dispersed across trials; the approximation is adequate at these magnitudes but not exact).
- 120-day and 500-day missions are synthetic fixtures (catalog-consistent but not catalog-ratified); 500 d sits beyond the longest catalog campaign (520 d uses the same kind multipliers, so behavior is interpolative, not extrapolative, in kind-space — but EVA cadence is assumed).
- Crews are homogeneous archetype extremes; real unselected pools are heterogeneous (see the 90-day archetype study: a mixed 2-bad/4-average crew lands at ~55 % of the worst-crew penalty).
- FAMILY_BETA values are expert-elicited, sensitivity-audited, not fitted to analog outcome data (none exists); the ~11× psych ratio inherits that elicitation.
- The conscientiousness criterion is coupled to only 1/100 conditions (near-null lever; open model question logged in STATUS.md 2026-06-05).

---

*Reproducer: `npx tsx scripts/duration_study_screened_vs_unscreened.ts` (env `T`, `SEED`). Raw per-run data: `exports/2026-06-05_data_selectron-duration-study.json`. Related committed tests: `tests/imm/analog_45d_unscreened_crew.test.ts` (45 d + 22 d), `tests/imm/analog_90d_crew_archetypes.test.ts` (90 d, 7 archetypes).*
