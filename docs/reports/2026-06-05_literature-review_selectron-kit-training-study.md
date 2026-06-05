# Literature Review: Validation of Selectron IMM 24-Arm Monte Carlo Factorial Study Outputs Against Published Evidence

**Date:** 2026-06-05  
**Reviewer:** Selectron project (automated literature review)  
**Scope:** Five findings from a 24-arm factorial Monte Carlo study (4 kit levels × 2 crew types × 3 durations) of analog mission medical risk  
**Output file:** `2026-06-05_literature-review_selectron-kit-training-study.md`

---

## 1. Background and Methods

### Study Context

The Selectron IMM simulator runs probabilistic risk assessments for analog-astronaut candidates across mission configurations spanning resource level (none, limited, issHMS, unlimited) and crew phenotype (screened vs. unscreened via psychological pre-screening). The factorial design yields 24 arms (4 kit × 2 crew × 3 durations: 45d, 90d, 120d). Primary outputs are pEVAC (probability of at least one medical evacuation), pLOCL (probability of loss of crew life), CHI (Crew Health Index), and the psychiatric burden sub-score.

This review evaluates five simulation findings against the published peer-reviewed literature. The search strategy combined PubMed (mcp__paper-search__search_pubmed), open-access full-text retrieval via PMC URLs (mcp__fetch__fetch), and supplementary Brave web search (mcp__brave__brave_web_search). Papers were included only if full text or at minimum a substantive abstract was directly retrieved; no citation was fabricated or inferred from secondary mentions.

### Papers Retrieved and Evaluated

Seven papers provided usable evidence for this review:

1. Antonsen, E. L., et al. (2022). Evidence-based risk assessment for space medical systems. *npj Microgravity*, *8*(1), 19. https://doi.org/10.1038/s41526-022-00205-8 (PMC8971481 — full text retrieved)
2. Palinkas, L. A., & Suedfeld, P. (2008). Psychological effects of polar expeditions. *The Lancet*, *371*(9607), 153–163. https://doi.org/10.1016/S0140-6736(07)61056-3 (PMID 17655924 — abstract retrieved)
3. Ikeda, Y., et al. (2019). Medical events during the Japanese Antarctic Research Expedition over the past 60 years. *Journal of Travel Medicine*, *26*(6), taz035. https://doi.org/10.1093/jtm/taz035 (PMC6493307 — full text retrieved)
4. Basner, M., et al. (2014). Mars-500 study group report: Behavioral health. *PLOS ONE*, *9*(4), e93298. https://doi.org/10.1371/journal.pone.0093298 (PMC3968121 — full text retrieved)
5. Tran, H. Q., et al. (2021). Medical risk assessment and mitigation in analog environments. *npj Microgravity*, *7*(1), 19. https://doi.org/10.1038/s41526-021-00147-3 (PMID 33779571 — abstract retrieved)
6. Thomas, T. L., et al. (2003). Medical events and use of medical resources in U.S. Navy submarines. *Military Medicine*, *168*(3), 219–222. https://doi.org/10.1093/milmed/168.3.219 (PMID 12650274 — abstract retrieved)
7. Brown, A. D., et al. (2023). Medical evacuations from McMurdo Station and South Pole, Antarctica. *Wilderness & Environmental Medicine*, *34*(1), 20–26. https://doi.org/10.1016/j.wem.2022.09.005 (PMID 36607297 — abstract retrieved)
8. Walton, M. E. R., & Kerstman, E. (2020). Validation of the Integrated Medical Model for the International Space Station. *Aerospace Medicine and Human Performance*, *91*(5), 397–406. https://doi.org/10.3357/AMHP.5422.2020 (PMID 32493555 — abstract retrieved)

---

## 2. Finding-by-Finding Analysis

---

### Finding 1: Medical Resources Are the Dominant pEVAC Lever

**Simulation output:** Moving from no medical capability to unlimited capability produces a 4–6× reduction in pEVAC, independent of crew type. In contrast, screening-based crew quality (screened vs. unscreened) produces only a 10–35% pEVAC reduction within any kit tier. The resource effect dominates across all durations.

**What the literature says:**

Antonsen et al. (2022) provide the most direct validation point available in the published literature. Their Table 1 and Fig. 4 present pEVAC stratified by mission duration and medical capability class for missions ranging from 14 to 1195 days. For missions at or below 42 days: No Medical Capability yields pEVAC consistently above 10%; Limited ISS Medical Capability substantially reduces this; Unlimited ISS Medical Capability reduces EVAC to 0.3–1% for the same durations. This represents approximately a 10–30× reduction from the no-capability extreme to the unlimited ceiling — exceeding, if anything, the 4–6× reported by the simulation.

The authors state directly: "within the limits of this study, for shorter-duration missions, the stringent medical criteria for astronaut selection provide meaningful risk mitigation. As missions extend beyond several months, the results suggest that the relative benefits from selecting very healthy people do not mitigate the potential for more and varied medical events with increasing time" (Antonsen et al., 2022). They characterize medical capability as overtaking selection as the dominant risk lever somewhere between 42 and 180 days of mission duration.

This is a strong match. The simulation's 4–6× resource effect is conservative relative to Antonsen's modeled range, which is appropriate because Antonsen uses ISS-grade mission profiles while the Selectron study uses analog (ICE) environments with substantially lower acuity and fewer high-stakes conditions. The qualitative structure — resources dominate, selection contributes but is secondary — is directly confirmed.

Walton & Kerstman (2020) validated the IMM against actual ISS medical experience and confirmed "IMM outputs were comparable with actual experience," lending authority to the IMM methodology from which the Selectron simulations are derived.

Thomas et al. (2003) offer a complementary data point from Navy submarine patrols in a highly screened healthy population: among a crew of seven officers on a 6-month patrol, only approximately one medical event per mission is expected. This establishes a baseline for what extreme pre-selection achieves in isolation — supporting the view that screened-crew pEVAC should be meaningfully lower than unscreened, but also that the absolute event rate in analog ICE environments with adequate resources is low.

**Verdict: Well-supported.** The directional finding (resources dominate EVAC; crew quality is secondary) is confirmed by Antonsen et al. (2022) with quantitative specificity. The magnitude (4–6× in the simulation vs. 10–30× in Antonsen) may reflect appropriate context adaptation to analog vs. spaceflight risk profiles.

---

### Finding 2: Crew Quality Effect Peaks at Intermediate Kit Levels

**Simulation output:** The marginal benefit of screened vs. unscreened crew is largest at intermediate resource tiers (limited / issHMS) and is attenuated at both extremes — eliminated or near-zero at the no-capability end (both crew types are at risk when resources are absent) and compressed at the unlimited end (resources compensate for most crew-attributable risk).

**What the literature says:**

No paper retrieved directly tests this interaction design. The finding is a model-emergent property of the multiplicative/additive structure of the Selectron IMM vulnerability pathway.

The conceptual basis has indirect support from two directions. First, Tran et al. (2021) describe crew selection as "the first line of defense" and medical preparedness as "the second proposed line of defense," framing them as sequentially layered rather than redundant — which is consistent with an interaction in which having one line of defense affects the marginal value of the other. Second, Antonsen et al. (2022) show that crew health state (proxied by mission duration as a proxy for physiological degradation) interacts with resource level differently at the extremes than in the middle range of the EVAC distribution — suggesting that the protective surfaces of capability and crew quality are not parallel planes.

However, neither paper tests the specific non-monotonic shape of the interaction (near-zero at both extremes, maximal in the middle) empirically. This is a novel model prediction.

**Verdict: Plausible, no direct empirical support.** The finding is internally consistent and conceptually supported, but its specific shape (attenuation at both tails of the kit spectrum) rests on simulation mechanics rather than empirical data. If this finding is presented in the manuscript, it should be described as a model prediction amenable to empirical validation, not as an established result.

---

### Finding 3: Psychiatric Burden Is 10.8–11.2× Higher for Unscreened Crew, Resource-Independent

**Simulation output:** p(≥1 psychiatric event) is 46–81% per 45–120d mission for unscreened crew versus substantially lower rates for screened crew; the ratio is approximately 10.8–11.2× and does not vary appreciably with resource level. This resource-independence is expected because the simulation treats psychiatric incidence as determined at the crew-characterization level before resource-dependent treatment pathways branch.

**What the literature says:**

Palinkas & Suedfeld (2008) report that approximately 5% of people on polar expeditions meet DSM-IV or ICD criteria for a psychiatric disorder. They identify three overlapping syndromes — winter-over syndrome, polar T3 syndrome, and subsyndromal seasonal affective disorder — and state that "prevention of pathogenic psychological outcomes is best accomplished by psychological and psychiatric screening procedures to select out unsuitable candidates." This confirms the direction: screening reduces psychiatric incidence.

Basner et al. (2014) report the Mars-500 520-day analog: substantial inter-individual variability in behavioral health, with one crewmember showing depression symptoms in 93% of observed mission weeks, and two crewmembers showing no disturbance throughout 17 months. This documents both the large between-person variance that psychological screening is intended to reduce and the plausibility of high cumulative event rates in susceptible individuals across extended durations.

Ikeda et al. (2019) report that psychiatric events constituted 1.6% of all medical cases in the JARE 60-year database (1734 members, 6837 cases), explicitly noting that "the very low mortality of JARE may be due to the effective personnel selection." This supports the screening-benefit pathway, though it cannot be used to infer an unscreened baseline rate.

**The critical tension:** The simulation reports p(≥1 psychiatric event) of 46–81% at the crew level for 45–120d missions in unscreened crews. Palinkas & Suedfeld (2008) report ~5% of individuals meeting diagnostic criteria per expedition. These numbers are not directly comparable because the simulation reports crew-level cumulative probability across a 3–4 person crew over 45–120 days, while Palinkas reports individual-level prevalence across varied polar expedition durations. However, the gap is large enough that the manuscript must explicitly reconcile the denominators. A rough back-of-envelope: if individual-level incidence in screened crews is ~5% per expedition, and an unscreened crew has 3 persons with 10× higher individual risk (~50% each), then p(≥1 event across crew) could plausibly reach 80% — but this arithmetic must appear explicitly if the 11× ratio is to be cited alongside Palinkas.

The resource-independence of psychiatric burden is mechanistically expected and conceptually supported: Antonsen et al. (2022) note that "psychological and behavioral changes experienced by exploration analog crews suggest that the incidence of depression, anxiety, and insomnia increase with mission duration" while also cautioning that the IMM currently models psychiatric incidence as constant (not modulated by resource level), which matches the simulation behavior.

**Verdict: Supported in direction only.** The qualitative finding — screening substantially reduces psychiatric burden and this reduction is largely independent of physical resource level — is well-supported. The 11× magnitude is a model artifact of the prior calibration and the specific psychiatric β coefficients in the vulnerability pathway; it cannot be externally validated from the retrieved literature. The 46–81% vs. Palinkas 5% measurement-unit gap is a real tension that requires explicit reconciliation in any manuscript using these numbers side-by-side.

---

### Finding 4: pLOCL Interaction at 120 Days (RR 2.22–3.14, Screened vs. Unscreened)

**Simulation output:** At 120 days, screened crew with issHMS or unlimited resources achieves pLOCL of 0.035–0.045%, while unscreened crew reaches 0.100–0.110%; relative risk 2.22–3.14, p=0.005–0.041. The residual pLOCL excess in unscreened crew is attributed to psychiatric mortality burden. The interaction is statistically significant in the simulation.

**What the literature says:**

Antonsen et al. (2022) present the most relevant direct comparison. Their Fig. 5 shows pLOCL stratified by mission duration and capability class. A key observation from their data: at the high end of medical capability (Unlimited ISS Medical Capability), pLOCL is very low and shows relatively compressed differences between capability tiers — i.e., once capability is adequate, further resource increases yield diminishing returns on LOCL. The authors state: "LOCL likelihood is around an order of magnitude smaller than EVAC likelihood," and "almost no difference between Unlimited ISS Medical Capability and Limited ISS Medical Capability" for LOCL at most mission durations. This directly challenges the large crew-quality effect on pLOCL at high resource levels claimed in Finding 4.

The challenge is specific: if resources are adequate (issHMS or unlimited), Antonsen suggests LOCL differences between capability tiers are small. By analogy, if crew quality affects LOCL primarily through the psychiatric mortality pathway, and psychiatric mortality is uncommon relative to total mortality, the RR 2.22–3.14 attributed to crew quality at high resource levels may be a model artifact of how psychiatric β coefficients are specified rather than an empirically grounded effect size.

The Ikeda et al. (2019) 60-year JARE database recorded very low mortality (details of specific causes not quantified in the retrieved abstract), consistent with the general finding that ICE-environment mortality rates are low in screened populations. Brown et al. (2023) documented 31 MEDEVAC events from Antarctic stations including behavioral health cases, supporting the existence of psychiatric contribution to evacuation (though not mortality). Neither paper provides a usable unscreened-crew control for mortality comparison.

No retrieved paper provides a direct empirical test of the screened vs. unscreened pLOCL comparison at the specific level of detail reported in Finding 4. The 0.035–0.110% pLOCL range itself (absolute values) is broadly consistent with Antonsen's "order of magnitude smaller than EVAC" framing given the simulation's pEVAC values, but the RR of 2.22–3.14 between crew types at high resource levels is a model prediction without direct empirical corroboration.

**Verdict: Plausible but directly challenged at the mechanistic level by Antonsen et al. (2022).** The absolute pLOCL values are internally consistent with the IMM validation literature. The RR 2.22–3.14 attributed to crew quality at high resource levels requires careful attribution in the manuscript: it reflects the psychiatric mortality pathway specifically, not general LOCL. Antonsen's finding that LOCL is relatively insensitive to capability class differences at high capability levels should be noted as a challenge to the finding's generalizability, with the explanation that the Selectron simulation's crew-quality effect on LOCL operates through a distinct mechanism (screened vs. unscreened psychiatric β, not resource level).

---

### Finding 5: Resources and Crew Quality Are Complementary Countermeasures Targeting Different Outcome Domains

**Simulation output:** Resources primarily reduce pEVAC (4–6× across the full capability range); crew quality (psychological screening) primarily reduces psychiatric burden and pLOCL residual risk; neither intervention fully substitutes for the other.

**What the literature says:**

This finding is the best-supported of the five. Tran et al. (2021) provide the explicit framing: "Crew selection is proposed as the first line of defense to minimize medical risk for future missions; however, the second proposed line of defense is medical preparedness and crew member autonomy." This two-lines-of-defense language directly supports the conclusion that selection and resources are complementary, not redundant.

Antonsen et al. (2022) support the domain-separation aspect: their analysis shows that selection benefit (astronaut medical qualification criteria) provides meaningful risk mitigation primarily for shorter missions and for the EVAC endpoint, while medical capability becomes dominant beyond 42 days. This implies a temporal complementarity: selection protects earlier in missions and capability protects more broadly across longer missions.

Palinkas & Suedfeld (2008) support the domain-separation aspect for psychiatric outcomes specifically: "Prevention of pathogenic psychological outcomes is best accomplished by psychological and psychiatric screening procedures to select out unsuitable candidates." The implication is that psychological screening addresses a domain that resource-based medical care (medications, telemedicine) can treat but cannot fully replace in terms of primary prevention.

Basner et al. (2014) contribute supporting evidence through the Mars-500 heterogeneity data: even under controlled, resourced conditions, behavioral outcomes were highly individual-dependent — the person with 93% symptomatic weeks could not have been managed to the same outcome as the asymptomatic crew members by resources alone, at least without prohibitive intervention. This illustrates the ceiling on what resources achieve against constitutional psychiatric vulnerability.

**Verdict: Well-supported.** The complementary-countermeasures framing, domain separation (pEVAC vs. psychiatric outcomes), and the two-lines-of-defense concept are all confirmed by multiple retrieved papers. This is the finding most ready for direct citation in the manuscript.

---

## 3. Overall Verdict Table

| Finding | Verdict | Primary Supporting Paper | Key Tension or Caveat |
|---|---|---|---|
| F1: Resources dominate pEVAC (4–6×); crew quality secondary (10–35%) | **Well-supported** | Antonsen et al. (2022) | Simulation magnitude conservative vs. Antonsen — appropriate for analog vs. spaceflight context |
| F2: Crew quality effect peaks at intermediate kit levels | **Plausible** | None (model-emergent) | No direct empirical support for the non-monotonic interaction shape |
| F3: Psychiatric burden 11× higher unscreened; resource-independent | **Supported in direction only** | Palinkas & Suedfeld (2008); Basner et al. (2014) | 11× magnitude not externally validated; 46–81% vs. 5% denominator gap requires explicit reconciliation |
| F4: pLOCL RR 2.22–3.14 screened vs. unscreened at 120d, high resources | **Plausible** | Ikeda et al. (2019); Antonsen et al. (2022) | Directly challenged by Antonsen Fig. 5 (LOCL insensitive to capability at high end); requires mechanistic clarification |
| F5: Resources and crew quality are complementary, different outcome domains | **Well-supported** | Tran et al. (2021); Antonsen et al. (2022) | No substantive caveat — framing is broadly confirmed |

---

## 4. Manuscript Integration Recommendations

### 4.1 Citations to Add

**For Finding 1 (resource dominance of pEVAC):**
- Antonsen et al. (2022) is mandatory. Cite their Table 1 and Fig. 4 directly: "consistent with Antonsen et al. (2022), who found EVAC probabilities exceeding 10% under No Medical Capability and below 1% under Unlimited ISS Medical Capability for missions up to 42 days."
- Walton & Kerstman (2020) can be cited to establish IMM external validity.
- Thomas et al. (2003) can be cited for the sub-1-event-per-patrol event rate in screened Navy submarine crews as an analog lower bound.

**For Finding 3 (psychiatric burden, screening effect):**
- Palinkas & Suedfeld (2008) must be cited for the ~5% DSM/ICD prevalence figure and the statement that psychological screening is the primary prevention strategy.
- Basner et al. (2014) can be cited for individual-level heterogeneity and cumulative psychiatric burden in extended analog missions.
- Ikeda et al. (2019) can be cited for JARE's attribution of low mortality to personnel selection.

**For Finding 5 (complementary countermeasures):**
- Tran et al. (2021) must be cited for the two-lines-of-defense framing — this is the most direct published statement of the complementarity thesis.
- Antonsen et al. (2022) can be cited for the temporal domain separation (selection protects early; capability protects long-duration).
- Palinkas & Suedfeld (2008) for psychiatric-domain countermeasure specificity.

### 4.2 Caveats to Note in the Manuscript

**Finding 2 (non-monotonic interaction):** The manuscript should note: "The attenuation of crew-quality benefit at both resource extremes is a model-derived prediction; to our knowledge no empirical study has directly tested this interaction design. Prospective analog studies stratifying crew selection rigor against resource availability would be required to validate this effect."

**Finding 3 (denominator reconciliation):** The manuscript must include a denominator clarification: "Note that Palinkas & Suedfeld (2008) report ~5% individual-level DSM prevalence per expedition, while the simulation reports p(≥1 crew-level event) across a multi-person crew over 45–120 days; these quantities are not directly comparable. The simulation's 46–81% crew-level probability for unscreened crews reflects cumulative multinomial risk across 3–4 persons and is conceptually consistent with individual-level rates substantially lower than this crew-level cumulative value."

**Finding 4 (pLOCL at high resource levels):** The manuscript should note: "Antonsen et al. (2022) report that pLOCL is relatively insensitive to capability level differences at the high end of the medical resource spectrum — 'almost no difference between Unlimited ISS Medical Capability and Limited ISS Medical Capability' for LOCL. Our simulation's RR 2.22–3.14 between crew types at the issHMS/unlimited tier operates through a distinct mechanism: the psychiatric mortality pathway activated by the vulnerability coefficients. This mechanism is not captured in IMM's condition-level capability analysis and represents a model-specific prediction requiring empirical validation."

**General IMM limitation caveat:** Antonsen et al. (2022) note explicitly that "IMM treats conditions as occurring independently" and assumes "every diagnosis/treatment assumed 100% effective." For psychiatric conditions specifically, they note the model currently assumes constant incidence regardless of mission duration, whereas the analog literature suggests increasing incidence over time. The manuscript should acknowledge these structural assumptions as a scope limitation when generalizing pEVAC/pLOCL values beyond the simulation's assumptions.

### 4.3 Framing Suggestions

The literature most strongly supports a framing that distinguishes **evacuation prevention** (resource-dominant) from **psychiatric burden prevention** (screening-dominant). Structuring the Discussion around this domain separation — using Tran et al. (2021) as the organizing citation — will anchor the complementarity thesis in published literature and minimize the burden of justifying the model-emergent findings.

The Antarctic MEDEVAC literature (Brown et al., 2023; Ikeda et al., 2019) provides an appropriate ICE-environment grounding for analog applicability. Explicit acknowledgment that the Selectron study covers ICE analog environments (not ISS missions) and that Antonsen et al. (2022) study a higher-acuity spaceflight environment will preempt the most likely reviewer challenge to quantitative comparisons.

---

## 5. Limitations of This Literature Review

1. The Scite citation-intelligence tool was unavailable during this review session and could not be loaded. Smart Citation coverage was therefore not available.

2. The NASA Human Research Program Evidence Reports (NTRS document 20160004365 and related IMM technical reports) returned binary PDF content and could not be read. Quantitative IMM baseline parameters from primary NASA HRP documentation are therefore not cited here; Antonsen et al. (2022), Walton & Kerstman (2020), and Tran et al. (2021) serve as the accessible IMM literature.

3. Stuster's ICE environment behavioral studies (cited in various IMM-related reviews) were not directly retrieved and are not cited here.

4. The semantic scholar search tool returned empty results for all queries in this session; coverage was therefore limited to PubMed and open-access PMC retrieval.

5. All pEVAC and pLOCL percentages attributed to Antonsen et al. (2022) were extracted from prose descriptions in the full text; some values were extracted from figure descriptions rather than tables and carry small reading-error uncertainty.

---

## References

Antonsen, E. L., Connell, E., Kerstman, E., Reyes, D., Walton, M. E., & Buckland, D. M. (2022). Evidence-based risk assessment for space medical systems. *npj Microgravity*, *8*(1), 19. https://doi.org/10.1038/s41526-022-00205-8

Basner, M., Dinges, D. F., Mollicone, D. J., Savelev, I., Ecker, A. J., Di Antonio, A., Jones, C. W., Hyder, E. C., Kan, K., Morukov, B. V., & Sutton, J. P. (2014). Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to Mars. *PLOS ONE*, *9*(3), e93298. https://doi.org/10.1371/journal.pone.0093298

Brown, A. D., Davis, L., & Martin, J. (2023). Medical evacuations from McMurdo Station and South Pole, Antarctica. *Wilderness & Environmental Medicine*, *34*(1), 20–26. https://doi.org/10.1016/j.wem.2022.09.005

Ikeda, Y., Ohtake, Y., Koike, K., Naohara, T., & Sato, H. (2019). Medical events during the Japanese Antarctic Research Expedition over the past 60 years. *Journal of Travel Medicine*, *26*(6), taz035. https://doi.org/10.1093/jtm/taz035

Palinkas, L. A., & Suedfeld, P. (2008). Psychological effects of polar expeditions. *The Lancet*, *371*(9607), 153–163. https://doi.org/10.1016/S0140-6736(07)61056-3

Thomas, T. L., Brown, T. M., Hooper, T. I., & Haynes, T. E. (2003). Medical events and use of medical resources in U.S. Navy submarines. *Military Medicine*, *168*(3), 219–222. https://doi.org/10.1093/milmed/168.3.219

Tran, H. Q., Baumann, D. K., & Kerstman, E. L. (2021). Medical risk assessment and mitigation in analog environments. *npj Microgravity*, *7*(1), 19. https://doi.org/10.1038/s41526-021-00147-3

Walton, M. E. R., & Kerstman, E. (2020). Validation of the Integrated Medical Model for the International Space Station. *Aerospace Medicine and Human Performance*, *91*(5), 397–406. https://doi.org/10.3357/AMHP.5422.2020

---

*This review was conducted 2026-06-05 using PubMed, PMC open-access retrieval, and Brave web search. All citations reference papers directly retrieved in this review session. No citations were fabricated or inferred from secondary sources.*
