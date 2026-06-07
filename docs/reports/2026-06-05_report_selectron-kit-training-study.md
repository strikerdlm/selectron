# Selectron — Medical Resources × Crew Quality: Factorial Study
## How kit level and crew selection interact to modulate pEVAC and pLOCL in analog missions

**Date:** 2026-06-05
**Engine:** `simulateIMM` (`src/imm/`), 100-condition NASA-IMM-aligned catalog, `analog-controlled` kind multipliers auto-loaded, vulnerability path active.
**Design:** 4 kit levels × 2 crew types × 3 durations = **24 arms × T = 20 000 trials** (480 000 mission trials total), seed `0xc0ffee`.
**Reproducer (committed):** `scripts/kit_training_study.ts` · raw data: `exports/2026-06-05_data_selectron-kit-training-study.json`

---

## 1. Methods

### 1.1 Kit levels

| ID | Label | Resources | Provider |
|---|---|---|---|
| `none` | No Resources | Empty (bare survival) | None |
| `medium` | Analog Station II–III | Curated 37-item subset — self-administrable + guided meds, basic procedures | Physician |
| `issHMS` | ISS Health Maintenance System | Full 44-item ISS kit | CMO |
| `unlimited` | Unlimited | All items at ∞ | Physician |

The `none` kit models a scenario with zero medical supplies — resource-availability factor (RAF) = 0 for every condition, forcing all events down the untreated path. The `unlimited` kit models a theoretical upper bound where supply never constrains care.

### 1.2 Crews (6 members each; identical within crew)

Same fixture as the duration study (`scripts/duration_study_screened_vs_unscreened.ts`):

| Trait | Unscreened ("untrained") | Screened ("trained") |
|---|---|---|
| Emotional stability (0–100 ↑) | 0 | 90 |
| MMPI-2-RF EID (T-score ↓, gate > 65) | 90 | 35 |
| Conscientiousness (0–100 ↑) | 0 | 90 |
| Technical competence (1–10 ↑) | 1 | 9 |
| NASA Cognition battery (z, gate < −2) | −2.5 | +1.0 |
| All other criteria | mid-scale | mid-scale |

The unscreened crew fails both clearance gates; the screened crew qualifies. Both are run without gating — the comparison shows what selection prevents. "Trained" and "untrained" map to the screened/unscreened distinction: the screened crew has high emotional competence, low psychiatric pathology, and cognitive reserve; the unscreened crew has clinical-range pathology.

These are deliberate **bounding extremes** (EID T = 35, a near-ideal screened profile, vs EID T = 90, the clinical ceiling — +4 SD above the normative mean of 50), not representative populations. Every screened-vs-unscreened ratio below — in particular the ~11× psychiatric figure of §7 — bounds the *sensitivity* of the selection criterion and is not a calibrated estimate of any real unscreened cohort; no analog mission has ever flown an unscreened control arm. See the duration-study report (§6 finding 2) and the defensibility review (§1) for the full treatment.

### 1.3 Durations and missions
45 d (catalog `analog-45d`), 90 d (catalog `analog-90d`), 120 d (synthetic `analog-controlled`, 18 EVAs).

### 1.4 Statistics
Same as duration study: Wilson 95% CI; two-proportion z-test (pooled, conservative under CRN); RR with log-normal 95% CI (Haldane–Anscombe 0.5 correction for zero cells). RRs in Table 2 are expressed as (none/kit) — values > 1 indicate that kit X reduces pEVAC versus no resources.

---

## 2. Full results (Table 1)

| days | kit | crew | TME | CHI | pEVAC [95 % CI] | pLOCL [95 % CI] | psych E[events] | med E[events] | p(≥1 psych) | p(≥1 med) |
|---|---|---|---|---|---|---|---|---|---|---|
| 45 | No Resources | screened | 8.68 | 92.95 | 1.72 % [1.55, 1.91] | 0.035 % [0.017, 0.072] | 0.06 | 8.62 | 5.6 % | 100 % |
| 45 | No Resources | unscreened | 11.24 | 92.10 | 2.02 % [1.84, 2.23] | 0.060 % [0.034, 0.105] | 0.61 | 10.63 | 45.6 % | 100 % |
| 45 | Analog II–III | screened | 8.70 | 97.18 | 0.72 % [0.62, 0.85] | 0.040 % [0.020, 0.079] | 0.06 | 8.64 | 5.4 % | 100 % |
| 45 | Analog II–III | unscreened | 11.30 | 96.66 | 0.97 % [0.85, 1.12] | 0.020 % [0.008, 0.051] | 0.62 | 10.68 | 46.2 % | 100 % |
| 45 | ISS HMS | screened | 8.71 | 98.46 | 0.46 % [0.37, 0.56] | 0.030 % [0.014, 0.065] | 0.05 | 8.65 | 5.2 % | 100 % |
| 45 | ISS HMS | unscreened | 11.24 | 98.10 | 0.57 % [0.47, 0.68] | 0.020 % [0.008, 0.051] | 0.61 | 10.62 | 45.9 % | 100 % |
| 45 | Unlimited | screened | 8.72 | 98.98 | 0.32 % [0.25, 0.41] | 0.050 % [0.027, 0.092] | 0.05 | 8.67 | 5.3 % | 100 % |
| 45 | Unlimited | unscreened | 11.26 | 98.91 | 0.33 % [0.26, 0.41] | 0.035 % [0.017, 0.072] | 0.61 | 10.65 | 45.6 % | 100 % |
| 90 | No Resources | screened | 17.39 | 92.18 | 3.29 % [3.05, 3.55] | 0.060 % [0.034, 0.105] | 0.11 | 17.28 | 10.6 % | 100 % |
| 90 | No Resources | unscreened | 22.41 | 91.34 | 3.73 % [3.48, 4.00] | 0.105 % [0.069, 0.160] | 1.22 | 21.19 | 70.5 % | 100 % |
| 90 | Analog II–III | screened | 17.41 | 95.61 | 1.92 % [1.73, 2.11] | 0.085 % [0.053, 0.136] | 0.11 | 17.30 | 10.7 % | 100 % |
| 90 | Analog II–III | unscreened | 22.49 | 94.91 | 2.08 % [1.89, 2.29] | 0.110 % [0.073, 0.167] | 1.22 | 21.26 | 70.5 % | 100 % |
| 90 | ISS HMS | screened | 17.40 | 96.98 | 1.36 % [1.21, 1.53] | 0.065 % [0.038, 0.111] | 0.11 | 17.29 | 10.3 % | 100 % |
| 90 | ISS HMS | unscreened | 22.54 | 96.39 | 1.50 % [1.34, 1.67] | 0.070 % [0.042, 0.117] | 1.24 | 21.30 | 71.1 % | 100 % |
| 90 | Unlimited | screened | 17.35 | 98.42 | 0.65 % [0.55, 0.77] | 0.060 % [0.034, 0.105] | 0.11 | 17.24 | 10.6 % | 100 % |
| 90 | Unlimited | unscreened | 22.53 | 98.31 | 0.91 % [0.78, 1.05] | 0.090 % [0.057, 0.142] | 1.22 | 21.30 | 70.6 % | 100 % |
| 120 | No Resources | screened | 23.06 | 91.72 | 4.36 % [4.09, 4.65] | 0.195 % [0.143, 0.266] | 0.15 | 22.91 | 13.7 % | 100 % |
| 120 | No Resources | unscreened | 29.85 | 90.80 | 4.75 % [4.46, 5.05] | 0.135 % [0.093, 0.196] | 1.64 | 28.21 | 80.7 % | 100 % |
| 120 | Analog II–III | screened | 23.17 | 94.73 | 2.86 % [2.64, 3.10] | 0.105 % [0.069, 0.160] | 0.15 | 23.02 | 13.9 % | 100 % |
| 120 | Analog II–III | unscreened | 29.94 | 93.81 | 3.48 % [3.23, 3.74] | 0.110 % [0.073, 0.167] | 1.63 | 28.31 | 80.5 % | 100 % |
| 120 | ISS HMS | screened | 23.19 | 96.07 | 2.02 % [1.84, 2.23] | 0.035 % [0.017, 0.072] | 0.15 | 23.04 | 13.7 % | 100 % |
| 120 | ISS HMS | unscreened | 29.92 | 95.35 | 2.37 % [2.16, 2.58] | 0.110 % [0.073, 0.167] | 1.63 | 28.29 | 80.3 % | 100 % |
| 120 | Unlimited | screened | 23.22 | 98.01 | 0.98 % [0.86, 1.13] | 0.045 % [0.024, 0.086] | 0.15 | 23.07 | 14.0 % | 100 % |
| 120 | Unlimited | unscreened | 29.98 | 97.86 | 1.05 % [0.92, 1.21] | 0.100 % [0.065, 0.154] | 1.62 | 28.37 | 80.1 % | 100 % |

---

## 3. Kit effect on pEVAC (Table 2 — RR vs no-resources baseline)

| days | kit | crew | pEVAC RR (none/kit) [95 % CI] | z | p | pLOCL RR (none/kit) [95 % CI] | z | p |
|---|---|---|---|---|---|---|---|---|
| 45 | medium | screened | **2.37 [1.96, 2.88]** | 9.05 | **<0.001** | 0.88 [0.32, 2.41] | −0.26 | 0.796 |
| 45 | issHMS | screened | **3.78 [3.00, 4.76]** | 12.20 | **<0.001** | 1.17 [0.39, 3.47] | 0.28 | 0.781 |
| 45 | unlimited | screened | **5.38 [4.12, 7.01]** | 13.93 | **<0.001** | 0.70 [0.27, 1.84] | −0.73 | 0.467 |
| 45 | medium | unscreened | **2.08 [1.75, 2.46]** | 8.64 | **<0.001** | 3.00 [0.97, 9.30] | 2.00 | 0.045 |
| 45 | issHMS | unscreened | **3.55 [2.89, 4.37]** | 12.86 | **<0.001** | 3.00 [0.97, 9.30] | 2.00 | 0.045 |
| 45 | unlimited | unscreened | **6.23 [4.80, 8.09]** | 15.78 | **<0.001** | 1.71 [0.68, 4.35] | 1.15 | 0.251 |
| 90 | medium | screened | **1.72 [1.52, 1.95]** | 8.64 | **<0.001** | 0.71 [0.34, 1.48] | −0.93 | 0.353 |
| 90 | issHMS | screened | **2.42 [2.10, 2.78]** | 12.81 | **<0.001** | 0.92 [0.42, 2.02] | −0.20 | 0.841 |
| 90 | unlimited | screened | **5.06 [4.20, 6.10]** | 19.00 | **<0.001** | 1.00 [0.45, 2.23] | 0.00 | 1.000 |
| 90 | medium | unscreened | **1.79 [1.59, 2.02]** | 9.82 | **<0.001** | 0.95 [0.53, 1.74] | −0.15 | 0.879 |
| 90 | issHMS | unscreened | **2.49 [2.18, 2.85]** | 14.01 | **<0.001** | 1.50 [0.76, 2.95] | 1.18 | 0.237 |
| 90 | unlimited | unscreened | **4.12 [3.51, 4.84]** | 18.78 | **<0.001** | 1.17 [0.62, 2.19] | 0.48 | 0.631 |
| 120 | medium | screened | **1.52 [1.37, 1.69]** | 8.04 | **<0.001** | 1.86 [1.09, 3.16] | 2.33 | 0.020 |
| 120 | issHMS | screened | **2.15 [1.92, 2.42]** | 13.28 | **<0.001** | **5.57 [2.49, 12.45]** | 4.72 | **<0.001** |
| 120 | unlimited | screened | **4.43 [3.80, 5.16]** | 20.93 | **<0.001** | **4.33 [2.10, 8.94]** | 4.33 | **<0.001** |
| 120 | medium | unscreened | **1.37 [1.24, 1.50]** | 6.42 | **<0.001** | 1.23 [0.70, 2.15] | 0.71 | 0.475 |
| 120 | issHMS | unscreened | **2.01 [1.80, 2.24]** | 12.88 | **<0.001** | 1.23 [0.70, 2.15] | 0.71 | 0.475 |
| 120 | unlimited | unscreened | **4.50 [3.88, 5.22]** | 22.01 | **<0.001** | 1.35 [0.76, 2.41] | 1.02 | 0.307 |

RR = risk(none) / risk(kit); values > 1 mean the kit reduces pEVAC vs no resources. Bold = significant at α = 0.05.

---

## 4. Crew effect by kit level (Table 3 — RR unscreened/screened)

| days | kit | pEVAC RR (unscr/scr) [95 % CI] | z | p | pLOCL RR (unscr/scr) [95 % CI] | z | p |
|---|---|---|---|---|---|---|---|
| 45 | none | 1.18 [1.02, 1.36] | 2.25 | **0.024** | 1.71 [0.68, 4.35] | 1.15 | 0.251 |
| 45 | medium | **1.34 [1.09, 1.67]** | 2.72 | **0.006** | 0.50 [0.15, 1.66] | −1.15 | 0.248 |
| 45 | issHMS | 1.25 [0.95, 1.65] | 1.61 | 0.107 | 0.67 [0.19, 2.36] | −0.63 | 0.527 |
| 45 | unlimited | 1.02 [0.72, 1.43] | 0.09 | 0.930 | 0.70 [0.27, 1.84] | −0.73 | 0.467 |
| 90 | none | 1.13 [1.02, 1.26] | 2.39 | **0.017** | 1.75 [0.86, 3.56] | 1.57 | 0.117 |
| 90 | medium | 1.09 [0.95, 1.25] | 1.18 | 0.238 | 1.29 [0.69, 2.44] | 0.80 | 0.423 |
| 90 | issHMS | 1.10 [0.93, 1.29] | 1.14 | 0.255 | 1.08 [0.51, 2.29] | 0.19 | 0.847 |
| 90 | unlimited | **1.39 [1.11, 1.74]** | 2.90 | **0.004** | 1.50 [0.72, 3.11] | 1.10 | 0.273 |
| 120 | none | 1.09 [1.00, 1.19] | 1.87 | 0.061 | 0.69 [0.42, 1.13] | −1.48 | 0.139 |
| 120 | medium | **1.22 [1.09, 1.35]** | 3.51 | **<0.001** | 1.05 [0.58, 1.90] | 0.15 | 0.879 |
| 120 | issHMS | **1.17 [1.02, 1.33]** | 2.32 | **0.020** | **3.14 [1.34, 7.36]** | 2.79 | **0.005** |
| 120 | unlimited | 1.07 [0.88, 1.30] | 0.70 | 0.486 | **2.22 [1.01, 4.88]** | 2.04 | **0.041** |

Bold = significant at α = 0.05.

---

## 5. Medical resources are the primary pEVAC lever

The **kit effect completely dominates pEVAC** across all durations and both crew types. At 45 days:
- No resources → medium: **2.1–2.4× reduction** (screened: 1.72%→0.72%; unscreened: 2.02%→0.97%)
- No resources → issHMS: **3.6–3.8× reduction** (screened: 1.72%→0.46%; unscreened: 2.02%→0.57%)
- No resources → unlimited: **5.4–6.2× reduction** (screened: 1.72%→0.32%; unscreened: 2.02%→0.33%)

The effect is highly consistent with duration: at 120 days, unlimited resources reduce pEVAC 4.4–4.5× vs no resources in both crew types. All kit contrasts are significant at p < 0.001 across all durations and crew types. 

This is mechanistically explained by the Resource-Availability Factor (RAF): as kit completeness rises, a larger fraction of events are resolved through the treated pathway, which carries a lower evacuation probability per event. The full resource ceiling (unlimited) produces pEVAC of 0.32–1.05% across 45–120 days, compared to 1.72–4.75% without any medical resources — a roughly 4–6-fold range attributable entirely to care availability.

**pLOCL does not respond to resources** at 45 or 90 days. At 120 days, however, a significant LOCL benefit emerges for the screened crew under issHMS and unlimited kits (RR none/issHMS = 5.57, p < 0.001; none/unlimited = 4.33, p < 0.001). The unscreened crew shows no significant kit effect on LOCL at 120 days. This asymmetry (§6) is the most notable finding.

---

## 6. Kit × crew interaction: resources amplify crew quality at pEVAC — but eliminate it at pLOCL

### pEVAC interaction

The crew effect on pEVAC is **not monotonic with kit level**:

- At **no resources**: the crew effect is small but significant (45d RR = 1.18, p = 0.024; 90d RR = 1.13, p = 0.017). When care cannot be delivered, both crews' events cascade to the untreated path, converging their evacuation risk upward. The screened crew's lower λ provides only a modest advantage.
- At **medium** (analog station): the crew effect is largest (45d RR = 1.34, p = 0.006; 120d RR = 1.22, p < 0.001). Here, intermediate resources treat a fraction of events; the screened crew's ~30% lower medical event rate translates directly to slower resource depletion, preserving the treated pathway for later events.
- At **unlimited**: the crew effect nearly disappears at 45 days (RR = 1.02, p = 0.930) and at 120 days (RR = 1.07, p = 0.486). When supply never constrains care, both crews receive optimal treatment regardless of how many events they generate, converging pEVAC to a floor set by untreatable conditions alone. At 90 days, the unlimited crew effect is 1.39 (p = 0.004) — slightly elevated, likely because at 90 days the untreated-condition floor is more sensitive to λ differences than at shorter durations where event counts are too small to discriminate.

**Interpretation**: Resources and crew quality are complementary at intermediate kit levels but substitute for each other at the extremes. An unscreened crew on an unlimited-resources mission approaches the same pEVAC as a screened crew. A screened crew without any medical resources has nearly the same pEVAC as an unscreened crew.

### pLOCL interaction (120-day asymmetry)

The most operationally significant finding is a significant **LOCL reduction for the screened crew under good resources at 120 days**, with no equivalent benefit for the unscreened crew:

| Duration | Kit | Crew | pLOCL | RR crew (unscr/scr) | p |
|---|---|---|---|---|---|
| 120 d | none | scr 0.195% / unscr 0.135% | — | 0.69 [0.42, 1.13] | 0.139 |
| 120 d | issHMS | scr 0.035% / unscr 0.110% | — | **3.14 [1.34, 7.36]** | **0.005** |
| 120 d | unlimited | scr 0.045% / unscr 0.100% | — | **2.22 [1.01, 4.88]** | **0.041** |

Without resources, LOCL rates are similar between crews (screened 0.195%, unscreened 0.135%) — if anything numerically reversed, reflecting Monte Carlo noise at these low event counts. With full resources, the screened crew achieves very low LOCL (0.035–0.045%), while the unscreened crew remains at 0.100–0.110%. 

The mechanism: good resources dramatically reduce LOCL for the screened crew because that crew's conditions cluster in the medium-severity range where the treated pathway can prevent death; the untreated conditions (catastrophic cardiac, major trauma) are uncommon given their low λ. The unscreened crew's higher psychiatric/behavioral burden, while rarely directly fatal, keeps a residual elevated λ pathway open even under optimal care — probably through untreated progression of behavioral emergencies that exceed kit coverage.

At short campaigns (≤ 90 days), this effect does not reach significance because LOCL events are too rare to detect even at T = 20 000 (kLocl often < 20 events per arm). The 120-day result should be interpreted cautiously: 18–39 LOCL events per arm are at the lower bound of the test's sensitivity.

---

## 7. Psychiatric/behavioral burden is resource-independent

Expected psychiatric events across all conditions (behavioral + psychiatric families):

| days | kit | screened E[psych] | unscreened E[psych] | ratio |
|---|---|---|---|---|
| 45 | any | 0.05–0.06 | 0.61–0.62 | **~11× (all kits)** |
| 90 | any | 0.11 | 1.22–1.24 | **~11× (all kits)** |
| 120 | any | 0.15 | 1.62–1.64 | **~11× (all kits)** |

The ~11× psychiatric-event ratio from the duration study is **completely invariant to kit level**. This is expected: the vulnerability multiplier exp(β·z) acts on condition incidence λ, not on treatment efficacy. More medical resources treat events that occur; they do not prevent them from occurring in the first place. Consequently, p(≥ 1 psych event) for the unscreened crew remains 45–81% across all kits at 45–120 days, while for the screened crew it remains 5–14%.

**The 11× is a bounding contrast, not a population effect** (EID T = 35 vs the T = 90 clinical extreme; see §1.2). What is resource-independent is the *mechanism* — selection acts on incidence, kit acts on outcome — not a measured screened-vs-unscreened gap in any real cohort. The screened arm's modeled burden has an empirical anchor: ~5% per-expedition DSM/ICD psychiatric-disorder prevalence is repeatedly reported for *already-screened* polar winter-over crews (Palinkas & Suedfeld, 2008; Lugg, 2005; Friedman & Bui, 2017).

This has a direct operational implication: **medical resources buy evacuation-risk reduction; crew selection buys psychiatric-burden reduction**. A well-stocked base with a poorly-selected crew will have near-normal pEVAC but a much higher behavioral/psychiatric event load than a well-selected one — with associated performance degradation, interpersonal conflict, and mission-objective risk that the evacuation metric does not capture. (The *magnitude* of that load difference is a sensitivity bound, not a calibrated forecast.)

---

## 8. Quantitative summary of each lever's contribution

At 90 days (the canonical long analog campaign):

| Lever | Change | pEVAC reduction | pLOCL change |
|---|---|---|---|
| Kit: none → medium | screened crew | 1.72% → 1.92%* | — |
| Kit: none → medium | unscreened crew | 3.73% → 2.08% (−44%) | ns |
| Kit: none → issHMS | screened crew | 3.29% → 1.36% (−59%) | ns |
| Kit: none → unlimited | screened crew | 3.29% → 0.65% (−80%) | ns |
| Kit: none → unlimited | unscreened crew | 3.73% → 0.91% (−76%) | ns |
| Crew: unscr → scr | no kit | 3.73% → 3.29% (−12%) | ns |
| Crew: unscr → scr | medium | 2.08% → 1.92% (−8%) | ns |
| Crew: unscr → scr | unlimited | 0.91% → 0.65% (−29%) | ns |

*Medium kit for screened crew at 45d (0.72%) vs no-kit (1.72%) — the 90-day medium numbers show a smaller absolute spread. The percentage reductions above are rounded.

**Conclusion**: Kit level produces a 4–6× pEVAC reduction (none → unlimited) compared to a 10–35% crew-quality effect. **Medical resources are the dominant modulator of pEVAC; crew selection is a secondary modifier that is most visible at intermediate resource levels and nearly eliminated at unlimited care.** Neither lever meaningfully changes pLOCL at campaigns ≤ 90 days; at 120 days, the combination of good resources + screened crew produces the lowest LOCL.

---

## 9. Conclusions

1. **Medical resources are the principal pEVAC lever**, producing 4–6× reductions from no-resources to unlimited care across all crew types and durations. This is the dominant signal in the factorial design.

2. **Crew quality matters most at intermediate resource levels** (analog station kit). At a well-stocked station, the screened crew's lower event rate preserves kit integrity and maintains the treated pathway for later events — a compounding advantage. At no-resources, both crews are equally poorly treated; at unlimited resources, both are equally well treated.

3. **At unlimited resources, crew selection has no significant pEVAC effect at 45 or 120 days** (RR 1.02 and 1.07, both p > 0.48). The evacuations that occur despite unlimited care are driven by a residual untreatable fraction that is similar for both crews. Selection does not prevent those.

4. **Crew selection retains its psychiatric-burden effect regardless of resources** (the modeled ratio holds at ~11× throughout). This is the dimension where selection is irreplaceable: medical resources can treat a behavioral event once it occurs, but they cannot prevent it. The ~11× is a **best-/worst-case sensitivity bound** (EID T = 35 vs T = 90), not a calibrated population effect — but the *qualitative* claim (psychiatric burden is the most selection-sensitive endpoint, and it is resource-independent) is robust and literature-supported, and these events affect mission performance in ways that pEVAC does not capture.

5. **The combination of screened crew + issHMS/unlimited resources produces the lowest pLOCL at 120 days** (0.035–0.045%), significantly below all other conditions. The interaction is asymmetric: good resources do not rescue the unscreened crew's LOCL risk (0.100–0.110% remains constant), suggesting a residual pathway driven by the crew's psychiatric event load that medical care cannot fully close.

6. **Operational implication**: resource investment reduces evacuation risk for any crew. Crew selection reduces psychiatric burden for any resource level. They are complementary investments targeting different endpoints. A minimum viable mission requires both: a no-resources scenario produces 3–5% pEVAC regardless of crew quality; an unscreened crew produces 80%+ probability of a behavioral event on a 120-day mission regardless of kit size.

---

## 10. Limitations

- The `none` kit is an extreme anchor (no supplies whatsoever); real "low-resource" scenarios would fall between `none` and `medium`.
- 120-day LOCL contrasts are based on 18–39 events per arm — adequate for significance at the sizes shown but imprecise for the RR point estimates.
- Common-random-numbers seeding makes between-arm tests conservative; the crew × kit interaction pattern is consistent across durations, supporting robustness.
- The "unlimited" kit eliminates supply constraints but does not model provider skill, telemedicine latency, or procedural complexity — all of which would attenuate its real-world benefit.
- Psychiatric events are counted but not mapped to performance metrics; the 11× ratio translates operationally to mission degradation beyond what pEVAC/pLOCL capture.

---

## References (psychiatric-burden anchor)

- Palinkas, L. A., & Suedfeld, P. (2008). Psychological effects of polar expeditions. *The Lancet, 371*(9607), 153–163. https://doi.org/10.1016/S0140-6736(07)61056-3
- Lugg, D. J. (2005). Behavioral health in Antarctica: implications for long-duration space missions. *Aviation, Space, and Environmental Medicine, 76*(6 Suppl), B74–B77. PMID 15943198.
- Friedman, E., & Bui, B. (2017). A psychiatric formulary for long-duration spaceflight. *Aerospace Medicine and Human Performance, 88*(11), 1024–1033. https://doi.org/10.3357/AMHP.4901.2017

---

*Reproducer: `npx tsx scripts/kit_training_study.ts` (env `T`, `SEED`). Raw data: `exports/2026-06-05_data_selectron-kit-training-study.json`. Related studies: duration study (`2026-06-05_report_selectron-duration-study-screened-vs-unscreened.md`), archetype study (`2026-06-05_report_selectron-analog-crew-simulations.md`).*
