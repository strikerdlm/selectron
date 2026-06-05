# Analog/ISS medical incidence — Evidence pass 3 (behavioral, sleep, GI, respiratory, allergy)
## Selectron IMM prior calibration evidence

**Owner:** Selectron Iter-3 — IMM Calculator prior elicitation
**Created:** 2026-05-27
**Session:** PubMed/PMC literature search pass 3 — 8 new primary sources extracted
**Status:** Evidence synthesis for controller review. Do NOT apply to `imm-priors.json` directly.

---

## Purpose

Extend the analog/Antarctic evidence base for **tierA-nasa** conditions not adequately
covered in passes 1–2. Target conditions:
`behavioral-emergency`, `headache-co2-induced`, `late-insomnia`, `diarrhea`,
`allergic-reaction-mild-to-moderate`, `influenza`, `indigestion`.

All seven are currently `provenance=tierA-nasa` with `prior={}` (rates inherited from K15/NASA
ISS-calibrated table).

---

## Current Priors (K15-inherited)

| Condition ID | α | β | λ_mean/day | λ/1000/PY |
|---|---|---|---|---|
| `behavioral-emergency` | 2 | 400,000 | 0.000005 | 1.8 |
| `headache-co2-induced` | 2 | 167 | 0.01198 | 4,371 |
| `late-insomnia` | 2 | 3,636 | 0.000550 | 200.8 |
| `diarrhea` | 2 | 455 | 0.004396 | 1,604 |
| `allergic-reaction-mild-to-moderate` | 2 | 20,000 | 0.000100 | 36.5 |
| `influenza` | 2 | 1,429 | 0.001400 | 510.8 |
| `indigestion` | 2 | 4,000 | 0.000500 | 182.5 |

---

## New Primary Sources Retrieved (PubMed, 2026-05-27)

| # | Citation | PMID | DOI | Study type | Population | Key metric |
|---|---|---|---|---|---|---|
| **P1** | Palinkas LA et al. "Incidence of psychiatric disorders after extended residence in Antarctica." *Int J Circumpolar Health* 63(2):157–168, 2004. | 15253482 | [10.3402/ijch.v63i2.17702](https://doi.org/10.3402/ijch.v63i2.17702) | Prospective psychiatric evaluation | 313 US crew (McMurdo + South Pole, 1994–1997); 4 assessors | Weighted DSM-IV incidence 5.2%; sleep disorders = 20.9% of all diagnoses |
| **P2** | Palinkas LA et al. "Subsyndromal seasonal affective disorder in Antarctica." *J Nerv Ment Dis* 184(9):530–534, 1996. | 8831642 | [10.1097/00005053-199609000-00003](https://doi.org/10.1097/00005053-199609000-00003) | Prospective repeated-measures survey | 70 crew at 3 US Antarctic stations, 1991 austral winter | Subsyndromal SAD: 10.5% → 28.4% during winter; 1 clinical SAD case |
| **P3** | Barger LK et al. "Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight." *Lancet Neurol* 13(9):904–912, 2014. | 25127232 | [10.1016/S1474-4422(14)70122-X](https://doi.org/10.1016/S1474-4422(14)70122-X) | Observational (actigraphy + daily logs) | 64 shuttle + 21 ISS crew; 4,173 shuttle-nights + 3,248 ISS-nights in-flight | 78% shuttle / 75% ISS crew used sleep meds in-flight; 11% of ISS nights required medication |
| **P4** | Law J et al. "Relationship between carbon dioxide levels and reported headaches on the International Space Station." *J Occup Environ Med* 56(5):477–483, 2014. | 24806559 | [10.1097/JOM.0000000000000158](https://doi.org/10.1097/JOM.0000000000000158) | Retrospective EMR + CO2 monitoring analysis | US ISS crew (duration not specified); 24-h and 7-day CO2 averages | Each 1 mmHg CO2 increase doubled headache odds; <1% headache risk if CO2 ≤ 2.5 mmHg; ISS range 1–9 mmHg |
| **P5** | Kang 2022 (already cited as P-J anchor) | 35982827 | [10.2147/NSS.S370659](https://doi.org/10.2147/NSS.S370659) | Prospective cohort | 88 Korean Antarctic crew, 2017–2020 | 7/88 (8.0%) diagnosed with mental disorder (insomnia + depression composite); ISI/PSQI scores increased in early winter |
| **P6** | Mullaney SB et al. "Magnitude, distribution, risk factors and care-seeking behaviour of acute gastrointestinal illness among US Army Soldiers: 2015." *Epidemiol Infect* 147:e151, 2019. | 30868988 | [10.1017/S0950268818003187](https://doi.org/10.1017/S0950268818003187) | Cross-sectional web survey | n = ~18,000 active-duty US Army; 30-day prevalence survey | 30-day AGI prevalence 18.5%; annual incidence rate 2.24 episodes/PY (95% CI 2.04–2.49) |
| **P7** | Shult PA et al. "Adenovirus 21 infection in an isolated Antarctic station: transmission of the virus and susceptibility of the population." *Am J Epidemiol* 133(6):599–607, 1991. | 2006647 | [10.1093/oxfordjournals.aje.a115932](https://doi.org/10.1093/oxfordjournals.aje.a115932) | Outbreak investigation | 200 combined (125 newcomers + 75 winter-over) at McMurdo, 5-week observation | Incidence of illness: 9.6% (winter-over) / 8.9% (newcomers) over 5 weeks; transmission rate 1.5 cases/100/week |
| **P8** | Wotring VE. "Medication use by U.S. crewmembers on the International Space Station." *FASEB J* 29(11):4417–4423, 2015. | 26187345 | [10.1096/fj.14-264838](https://doi.org/10.1096/fj.14-264838) | Retrospective medication record review | 24 ISS crewmembers on 20 missions >30 d over 10 yr | Most used: sleep, pain, congestion, allergy; sleep meds 10× Earth rate; 2 skin-rash treatment failures |

---

## Per-Condition Evidence Synthesis

---

### 1. behavioral-emergency

**Current prior:** α=2, β=400,000 → λ = 1.8/1000/PY

**Analog evidence:**

**Palinkas et al. 2004 (P1)** is the most rigorous psychiatric incidence study in an analog population.
- n = 313 US crew (McMurdo + South Pole), 4 austral winters 1994–1997
- Each crew member spent ~8–9 months (≈0.67–0.75 PY) in Antarctica
- 39/313 (12.5%) met DSM-IV criteria; weighted incidence = **5.2%** (adjusted for civilian non-response)
- Total denominator ≈ 313 × 0.71 PY ≈ 222 PY
- Weighted cases ≈ 313 × 0.052 = 16.3 cases
- Crude rate: 16.3/222 PY = **73/1000/PY** (any DSM-IV disorder)

Diagnosis breakdown: mood disorders 30.2%, adjustment disorders 27.9%, sleep-related 20.9%, personality disorders 11.6%, substance-related 9.3%.

**Behavioral emergency** as modeled in the IMM refers to acute crises requiring emergency medical response (acute psychosis, violent behavior, imminent self-harm, psychiatric evacuation) — NOT any DSM-IV diagnosis. Only the most severe fraction qualifies:
- Substance-related (9.3%) + personality disorders with acute crisis (portion of 11.6%) = likely ~15–20% of all diagnoses = behavioral emergency proxy
- Estimated behavioral emergency rate: 73 × 0.15–0.20 = **11–15/1000/PY** (upper bound)
- More conservative (only acute crises requiring evacuation): ~1–5/1000/PY

The current prior of **1.8/1000/PY** falls at the low end but within range of the analog evidence, consistent with:
- Walton & Kerstman 2020 (S20): all-cause MEDEVAC from Antarctic ≈ 0.01–0.036/PY; psychiatric fraction ~10–30% = 0.001–0.01/PY = 1–10/1000/PY
- The 1.8/1000/PY prior is internally consistent with these estimates

**Palinkas 1996 (P2)** provides context for subsyndromal mood changes (SAD: 10.5% → 28.4% in winter) — these are NOT clinical emergencies.

**Kang 2022 (P5):** 7/88 (8%) with mental disorder over 1 year = 80/1000/PY (any disorder), supporting the direction.

**Conclusion:** Current prior of 1.8/1000/PY is plausible and conservative for true behavioral emergencies. Palinkas 2004 data supports an any-DSM-IV disorder rate of 73/1000/PY in Antarctic analog, suggesting the current prior may underestimate ANY psychiatric disorder but appropriately models truly severe events.

**Upgrade recommendation:** LOW-MEDIUM confidence. No PyMC upgrade warranted without better definition of "emergency" threshold. Add Palinkas 2004 to source_ref as corroborating context.

**Suggested PyMC anchor if upgrading:** From Palinkas 2004 conservative interpretation:
- Events = 3 acute behavioral crises (estimated from ~16 weighted cases × 20% acute fraction over 222 PY)
- Person-days = 222 PY × 365 = 81,030
- α_anchor = 3, PD_anchor = 81,030
- Posterior: Gamma(α+3, β+81,030) → Gamma(5, 481,030) → λ_mean = 5/481,030/day = 3.8/1000/PY

---

### 2. headache-co2-induced

**Current prior:** α=2, β=167 → λ = 4,371/1000/PY (4.4 events/person/year)

**Analog evidence:**

**Law et al. 2014 (P4)** — only direct ISS study of CO2-headache relationship:
- For each 1 mmHg increase in CO2, headache odds doubled
- ISS CO2 range: 1–9 mmHg (current operational levels)
- To keep headache risk <1%: CO2 must be maintained ≤2.5 mmHg
- Qualitative: "headache incidence was not high" despite chronic low-level CO2 elevation

Existing source_ref already cites **Whitmire 2015 WOTR15**: "65% crewmembers/6mo mission with CO2-related headache complaint" — this supports the high 4371/1000/PY ISS rate.

**Critical analog context:** The CO2-headache condition is **ISS-specific**. In terrestrial analog missions:
- SIRIUS (IBP): CO2 tightly controlled; headache-co2-induced essentially absent
- Antarctic stations: CO2 near atmospheric (0.04%); zero CO2-induced headaches expected
- HI-SEAS/MDRS: CO2 moderately elevated in small habitats during sleep but below ISS levels

For analog missions on Earth, the 4371/1000/PY prior is **far too high** — the actual rate would approach 0. However, this condition has very low p_evac/p_locl (self-limiting, no evacuation) so its TME contribution is bounded.

**Conclusion:** Current prior appropriate for ISS. For terrestrial analog missions, CO2-induced headache is essentially absent (CO2 controlled). **No upgrade needed** — the condition is mission-environment-specific, not a general incidence parameter. The existing Whitmire 2015 source_ref is adequate. Law 2014 confirms the physiology.

**Note for manuscript:** Acknowledge that CO2 headache priors are ISS-specific; analog missions with well-controlled atmospheric CO2 should use a near-zero rate for this condition. This is a known limitation of the universal-prior approach.

---

### 3. late-insomnia

**Current prior:** α=2, β=3,636 → λ = 200.8/1000/PY (0.20 events/person/year)

Existing source_ref already references: Basner 2014 Mars-500 (1/6 crew chronic insomnia over 520d = 0.117 events/py), Fedyay 2023 SIRIUS-21, Whitmire 2015 WOTR15. Prior is NOT technically zero-evidence.

**New analog evidence:**

**Barger et al. 2014 (P3)** — largest objective sleep study in spaceflight history:
- 21 ISS crewmembers on 13 expeditions; 3,248 in-flight days
- **75% of ISS crewmembers (12/16 who answered)** reported using sleep-promoting medications in-flight
- Sleep medication used on **11% of in-flight nights** (96/852 ISS sleep logs)
- Average ISS sleep: 6.09 ± 0.67 h/night (vs 6.95 ± 1.04 post-mission)
- 43.8% of ISS nights: <6 h sleep
- Sleep medication use was 10–20× higher than terrestrial adults (Wotring 2015, P8)

Translating to analog incidence rate:
- If each discrete period of sleep medication self-initiation = 1 clinical episode
- 96 uses / (21 crew × 3248d / 365) = 96 / 186.9 PY = **514/1000/PY** (treating each night as an event)
- More conservatively, clustering consecutive nights: assume average cluster = 5 nights → 96/5 = 19 clusters / 186.9 PY = **102/1000/PY**

The range 100–514/1000/PY brackets the current prior of 200.8/1000/PY, supporting its general magnitude.

**Palinkas 2004 (P1)** — DSM-IV sleep disorders at McMurdo/South Pole:
- 20.9% of all DSM-IV diagnoses were sleep-related
- Estimated rate: 73/1000/PY (all diagnoses) × 0.209 = **15.3/1000/PY** (formal sleep disorder diagnoses)
- This is 13× lower than the current prior

The discrepancy is expected: formal DSM-IV sleep disorder diagnosis requires clinical presentation and structured interview; the current prior likely captures any sleep complaint requiring medication (broader definition).

**Kang 2022 (P5):** ISI/PSQI scores significantly increased in Antarctic winter-over; 7/88 diagnosed with mental disorders, with sleep as a component. This is consistent with the Palinkas estimate.

**Conclusion:** Current prior of 200.8/1000/PY is corroborated by Barger 2014 ISS data (100–514/1000/PY range depending on clustering). It is higher than the formal DSM-IV sleep disorder rate in Antarctic analog (~15/1000/PY) but reflects the broader "sleep complaint requiring medication" definition. The prior appears appropriate for ISS and may be slightly high for analog missions.

**Upgrade recommendation:** The prior already incorporates analog evidence (Basner 2014). Barger 2014 provides additional corroboration. **No PyMC upgrade needed** — add Barger 2014 to source_ref as additional corroboration.

---

### 4. diarrhea

**Current prior:** α=2, β=455 → λ = 1,604/1000/PY (1.60 events/person/year)

**Analog evidence:**

**Mullaney et al. 2019 (P6)** — US Army active duty:
- 30-day AGI prevalence 18.5%; annualized rate = **2.24 episodes/PY** (95% CI 2.04–2.49)
- n = ~18,000 soldiers; not isolated/confined

**Jones et al. 2004 (PMID 15211010)** — Peruvian military recruits in Amazon jungle:
- Attack rate 31.8% over 3 months; annualized = **1.28 episodes/PY**
- High-risk tropical environment; not comparable to analog missions

**Context for analog missions:**
- In truly isolated settings with controlled food supply (Antarctic stations, SIRIUS, HI-SEAS): GI illness rates should be substantially lower than open-population military data
- Bhatia 2012 (Indian Antarctic, 26 crew × 12 months = 26 PY): 93 total illness incidents; 32 classified as "medicine" — no specific diarrhea rate reported
- Pattarini 2016 McMurdo: GI illness mentioned but rates not reported per person-year in existing evidence files
- General principle: in isolated populations with controlled food, water, and sanitation, diarrheal illness drops significantly (no new enteric pathogen introduction)

**Estimated analog rate:** Probably 0.3–0.8/PY for well-controlled analog missions with screened food supply (compared to 1.28–2.24/PY in open military settings). Current prior of 1.60/PY is within 2–5× of this range.

**Conclusion:** The current prior of 1,604/1000/PY (1.60/PY) is broadly consistent with military data (1.28–2.24/PY) but likely overestimates diarrheal illness in truly isolated analog missions. The analog-specific rate would be lower. Without a direct analog-specific epidemiological study, a precise anchor cannot be derived.

**Upgrade recommendation:** LOW confidence. No PyMC upgrade warranted from this evidence. Document Mullaney 2019 as a general military upper-bound comparator.

---

### 5. allergic-reaction-mild-to-moderate

**Current prior:** α=2, β=20,000 → λ = 36.5/1000/PY (0.037 events/person/year)

**Analog evidence:**

**Wotring 2015 (P8)** — ISS medication review:
- Allergy medications were among the most frequently used on ISS (along with sleep, pain, congestion)
- Precise allergy medication frequency: not reported as events/PY; described qualitatively as "commonly used"
- 2 apparent treatment failures for skin rash (out of 24 crewmembers over 10 years = ~60 PY = ~1 treatment failure per 30 PY)

**Context:**
- General population: allergic rhinitis/urticaria prevalence ~10–30%/year = 100–300 events/1000/PY
- Spaceflight: reduced outdoor allergen exposure, but increased synthetic materials, dust recirculation, and altered immune function (Crucian 2016)
- Current prior of 36.5/1000/PY is well below general population rates, consistent with a reduced-allergen-exposure environment

No analog-specific incidence data found with event counts and person-time denominators.

**Conclusion:** Current prior of 36.5/1000/PY is plausible. Wotring 2015 confirms allergy medications are used in spaceflight but provides no quantitative rate. **No upgrade warranted.**

---

### 6. influenza

**Current prior:** α=2, β=1,429 → λ = 510.8/1000/PY (0.51 events/person/year)

**Analog evidence:**

**Shult et al. 1991 (P7)** — Adenovirus 21 outbreak at McMurdo Station, Antarctica:
- 89% of combined population (200 persons) was susceptible (neutralizing antibody < 1:3)
- After 75 winter-over crew joined 125 newcomers: only 15% infected during the 5-week observation
- Illness rate: 9.6% (winter-over) / 8.9% (newcomers) over 5 weeks
- Transmission rate: only **1.5 cases/100 persons/week** despite high susceptibility

If we annualize: 1.5/100/week × 52 weeks = 78/100/year = **780/1000/PY** during active outbreak exposure. But this was an outbreak scenario with new arrivals.

**Critical analog context — the "Antarctic burnout" effect:**
During initial isolation (pre-winter-over), all respiratory viruses circulating in the station are transmitted and then exhausted — the population becomes immune to resident pathogens. After 2–4 weeks in complete isolation, respiratory illness rates drop to near zero until the next crew change brings new viruses:
- During Antarctic winter (no new arrivals): respiratory illness essentially absent
- After resupply/new arrivals: outbreak risk resumes briefly

For spaceflight/analog missions:
- **ISS**: New crew exchanges every ~6 months → periodic reintroduction of respiratory pathogens. The 510/1000/PY prior may reflect the ISS crew-exchange cycle.
- **Long-duration analog without crew exchange** (SIRIUS, Mars-500, Antarctic winter): respiratory illness after initial isolation is effectively absent = ~0/1000/PY
- **Short-duration analog** (first 2–4 weeks): normal community respiratory illness rates apply (~200–500/1000/PY)

The 510/1000/PY prior is appropriate for ISS (crew exchanges) but substantially overestimates respiratory illness for truly isolated missions after initial quarantine.

**Conclusion:** The current prior of 510/1000/PY is ISS-calibrated with crew-exchange dynamics. For isolated analog missions (Antarctic winter-over, SIRIUS, Mars-500), the appropriate rate is much lower (approaching 0 after initial quarantine). This is a **mission-context-specific parameter** that ideally should vary by crew-exchange frequency.

**Upgrade recommendation:** No PyMC upgrade without a mission-type-specific model. Document the burnout effect as a known limitation. Suggest a future feature: mission-type multiplier for respiratory illness (e.g., 0.05–0.10 for isolated missions without crew exchange).

---

### 7. indigestion

**Current prior:** α=2, β=4,000 → λ = 182.5/1000/PY (0.18 events/person/year)

**Analog evidence:**

No specific analog/isolated-environment studies found for dyspepsia or non-specific indigestion.

**Context from literature search:**
- Hinninghofen & Enck 2006 (PMID 16962384) — airplane passengers: cabin pressure inhibits gastric emptying, induces dyspepsia-like symptoms. Not directly applicable to analog mission.
- Kast et al. 2017 (PMID 28533143) — drugs in space: mentions GI changes from microgravity affecting pharmacokinetics, but no indigestion incidence rate.
- Wotring 2015 (P8): antidiarrheal medication included in ISS kit; no mention of indigestion rate specifically.

**General population dyspepsia:** 5–15% annual prevalence in Western populations = 50–150/1000/PY. The current prior of 182.5/1000/PY is slightly above the upper end of general population rates.

**Conclusion:** No analog-specific data found. Current prior (182.5/1000/PY) is above but near the upper end of general population dyspepsia rates. **No evidence-based upgrade warranted.**

---

## Summary Table

| Condition | Current λ/1000/PY | New Evidence (pass 3) | Analog Estimated Range | Upgrade Decision |
|---|---|---|---|---|
| `behavioral-emergency` | 1.8 | Palinkas 2004: 73/1000/PY any-DSM-IV; acute emergency subset ~1–10 | 1–10/1000/PY | NO PyMC upgrade; add Palinkas ref |
| `headache-co2-induced` | 4,371 | Law 2014: odds double/mmHg CO2; ISS 1–9 mmHg; Whitmire 65% of crew | ISS: ~3000–4000; Analog: ~0 | NO upgrade; ISS-specific, not analog |
| `late-insomnia` | 200.8 | Barger 2014: 75% ISS crew used sleep meds; 11% of nights; Palinkas: ~15/1000/PY DSM-IV | 15–500/1000/PY (def-dependent) | NO upgrade; prior corroborated; add Barger ref |
| `diarrhea` | 1,604 | Mullaney 2019: 2,240/1000/PY (open Army); analog isolated: ~300–800 | 300–800 (isolated) | NO upgrade; no analog-specific data |
| `allergic-reaction-mild-to-moderate` | 36.5 | Wotring 2015: allergy meds used (no rate) | 30–100/1000/PY (estimate) | NO upgrade; insufficient evidence |
| `influenza` | 510.8 | Shult 1991: 780/1000/PY during outbreak; isolated: ~0 (burnout) | 0–780 (mission-specific) | NO upgrade; document burnout caveat |
| `indigestion` | 182.5 | No analog-specific data found | 50–150/1000/PY (gen. pop.) | NO upgrade; no evidence |

---

## Key Findings for Manuscript / Documentation

### 1. No new PyMC upgrade candidates from pass 3
None of the 7 conditions have sufficient analog-specific epidemiological data with person-time denominators to support a robust PyMC NUTS fit. The evidence either:
- Corroborates the current prior (late-insomnia, allergic-reaction)
- Suggests the current prior is ISS-calibrated and would need downward adjustment for isolated analog missions (headache-co2-induced, influenza)
- Is from non-isolated military populations that serve as an upper-bound comparator (diarrhea, behavioral-emergency)

### 2. ISS-Calibrated vs. Analog-Calibrated Rates: Mission-Context Gap
A recurring finding is that the K15-calibrated priors (ISS-based) systematically over-estimate several conditions for terrestrial analog missions with complete isolation:
- **Influenza/respiratory**: Near zero in true isolation (no new crew = no new respiratory pathogens)
- **CO2 headache**: Near zero in analog missions with atmospheric CO2
- **Diarrhea**: Lower in controlled-diet isolated environments

This is the expected behavior of a model calibrated to ISS conditions. The model's analog mission predictions should be interpreted with this context.

### 3. Sleep deficiency is pervasive and the current prior is appropriate
Barger et al. 2014 provides the strongest quantitative sleep data: 75% of ISS crew use sleep medications, on 11% of nights. The current `late-insomnia` prior of 200.8/1000/PY sits within the plausible range. Formal DSM-IV sleep disorder diagnosis rates from Antarctic analog (~15/1000/PY, Palinkas 2004) represent the lower bound (most severe cases only).

### 4. Behavioral psychiatry in Antarctic analog
Palinkas 2004 establishes Antarctic winter-over as producing a DSM-IV disorder rate of ~73/1000/PY (any diagnosis). This includes mild adjustment disorders. The behavioral-emergency IMM condition targets acute crises requiring emergency intervention (much rarer). The current prior of 1.8/1000/PY appears appropriate.

---

## Source References (DOIs)

- Law et al. 2014 — [10.1097/JOM.0000000000000158](https://doi.org/10.1097/JOM.0000000000000158)
- Barger et al. 2014 — [10.1016/S1474-4422(14)70122-X](https://doi.org/10.1016/S1474-4422(14)70122-X) (PMC4188436)
- Palinkas et al. 2004 — [10.3402/ijch.v63i2.17702](https://doi.org/10.3402/ijch.v63i2.17702)
- Palinkas et al. 1996 — [10.1097/00005053-199609000-00003](https://doi.org/10.1097/00005053-199609000-00003)
- Kang et al. 2022 — [10.2147/NSS.S370659](https://doi.org/10.2147/NSS.S370659) (PMC9379312) [already in pass p-j]
- Mullaney et al. 2019 — [10.1017/S0950268818003187](https://doi.org/10.1017/S0950268818003187)
- Shult et al. 1991 — [10.1093/oxfordjournals.aje.a115932](https://doi.org/10.1093/oxfordjournals.aje.a115932)
- Wotring 2015 — [10.1096/fj.14-264838](https://doi.org/10.1096/fj.14-264838)
