# Journal Scout — Selectron

**Date**: 2026-05-27 (revised)
**Manuscript**: Bayesian MCDA with NASA HSRB LxC Mapping for Analog-Astronaut Selection
**Primary target**: Advances in Space Research (Elsevier/COSPAR, hybrid, subscription track free)
**npj Microgravity**: EXCLUDED — fully OA, APC $3,790 (no budget)

---

## Field Classification

- **Primary**: Aerospace medicine / spaceflight risk modeling
- **Secondary**: Bayesian decision analysis (MCDA), computational methodology
- **Tertiary**: Software engineering (reproducible TypeScript artifact)
- **Article type**: Methods paper (methodology + software + internal validation)
- **AI disclosure**: YES (coding assistance + copy-editing; declared in §2.7)
- **Author cost constraint**: No APC budget — subscription/hybrid track required

---

## Top 3 Recommendation

| Rank | Journal | Publisher | Q | APC path | Scope (/45) | Risk | IF (2024) | Indexing |
|---|---|---|---|---|---|---|---|---|
| **1** | **Acta Astronautica** | Elsevier | Q1 | Hybrid (sub track free) | **40** | MEDIUM | 3.5 | WoS SCIE, Scopus |
| **2** | **Computers in Biology and Medicine** | Elsevier | Q1 | Hybrid (sub track free) | **36** | MEDIUM | 7.0 | WoS SCIE, Scopus |
| **3** | **Reliability Eng. & System Safety** | Elsevier | Q1 | Hybrid (sub track free) | **34** | MEDIUM-HIGH | 8.1 | WoS SCIE, Scopus |

### 1. Acta Astronautica (Elsevier) — **Recommended Plan B**

**Scope match (40/45):** Acta Astronautica covers "all fields of basic, engineering, and applied research relevant to space science and technology." NASA IMM Monte Carlo reproduction, analog-mission medical risk PRA, and HSRB-aligned decision tools sit squarely in scope. The Antonsen et al. (2022) and Myers et al. (2018) NASA IMM community publishes regularly in this journal and in npj Microgravity — the Selectron manuscript cites both. Recent papers on PRA for crewed missions, astronaut health risk quantification, and Monte Carlo simulation of spaceflight medical events confirm active scope fit (2023–2025).

**Pre-screening risk: MEDIUM.** Q1 bar is high (acceptance ~25%), but the dual-novelty (first Bayesian MCDA for astronaut selection + first analog-HSRB mapping) is genuinely novel. The K15 IMM reproduction work adds engineering validation depth that Acta Astronautica editors value. The single-author, single-institution framing is a slight risk — Acta Astronautica typically publishes multi-institution teams.

**Author-cost path:** Elsevier hybrid. Submit as subscription-track (non-OA). No APC. Colombia Research4Life Group B offers 50% APC discount if OA is chosen later, but subscription track is the default path.

**AI policy:** Elsevier tolerant — disclosure in Methods required, no prohibition on AI-assisted coding/editing. §2.7 already compliant.

**Tradeoff vs npj Microgravity:** Acta Astronautica is broader (engineering + science) vs npj Microgravity's focus on microgravity/spaceflight biology. The MCDA methodology will be appreciated more by the Acta readership (systems engineering community) than by npj's primarily biomedical readership. IF is lower (3.5 vs npj ~5.0) but indexing and citation network are equivalent.

### 2. Computers in Biology and Medicine (Elsevier)

**Scope match (36/45):** CBM publishes "computational methods applied to biomedical and healthcare problems." The Bayesian MCDA engine, Monte Carlo medical-risk simulator, reproducible TypeScript artifact, and sensitivity analysis all fit the computational-methods-for-medicine framing. Recent papers on Bayesian decision support, Monte Carlo health simulation, and reproducible software artifacts confirm scope. The spaceflight domain is unusual for CBM but not exclusionary — the methodology is generalizable.

**Pre-screening risk: MEDIUM.** Scope match is strong on methodology but moderate on domain (CBM editors may see spaceflight as too niche). Framing the contribution as "Bayesian MCDA + Monte Carlo for high-stakes personnel selection, demonstrated on analog-astronaut programs" rather than leading with NASA/spaceflight would improve editorial reception.

**Author-cost path:** Elsevier hybrid, subscription track free. APC if OA: ~$3,560.

**AI policy:** Elsevier tolerant. §2.7 compliant.

**Tradeoff:** Higher IF (7.0) than Acta Astronautica (3.5) and npj Microgravity (~5.0). Broader audience (computational medicine community). But the space-specific framing (K15 reproduction, HSRB mapping, NASA-STD-7009A V&V) would need mild reframing to lead with the generalizable methodology.

### 3. Reliability Engineering & System Safety (Elsevier)

**Scope match (34/45):** RESS covers PRA, Monte Carlo simulation, system safety, and risk-informed decision making. Stage B (the IMM Calculator PRA, K15 reproduction, sensitivity analysis) is core RESS content. Stage A (Bayesian MCDA for personnel selection) is more peripheral — RESS typically publishes PRA for engineering systems, not personnel selection. The coupling between stages is the differentiator.

**Pre-screening risk: MEDIUM-HIGH.** The PRA methodology is strong scope match but the personnel-selection MCDA may be flagged as outside typical RESS content. Editors may suggest resubmission to a decision-analysis or aerospace journal. If submitting here, lead heavily with Stage B and frame Stage A as a "prior-conditioning input" rather than a co-equal contribution.

**Author-cost path:** Elsevier hybrid, subscription track free. APC if OA: ~$3,350.

**AI policy:** Elsevier tolerant. §2.7 compliant.

**Tradeoff:** Highest IF (8.1) among the three candidates. The PRA/Monte Carlo community at RESS would appreciate the K15 §II.A.9 clarification and the sensitivity analysis more deeply than either npj or Acta Astronautica readerships — but the scope risk is the highest of the three.

---

## Other Candidates Considered

| Journal | Q | Reason excluded or ranked lower |
|---|---|---|
| Life Sciences in Space Research (Elsevier) | Q1 | **Fully OA, APC $3,190** — excluded by APC filter. Strong scope but no subscription track. |
| Medical Decision Making (SAGE) | Q1 | Hybrid (sub free). Strong MCDA fit but spaceflight domain is niche for this readership. Acceptance rate ~15%. HIGH pre-screening risk on domain. |
| Journal of Multi-Criteria Decision Analysis (Wiley) | Q3 | Core MCDA scope. Sub track. But Q3 limits impact; the spaceflight PRA contribution (Stage B) would be undervalued here. Suitable as Plan C if all Q1 venues reject. |
| Aerospace (MDPI) | Q2 | **OA, APC ~$2,600** — excluded by APC filter. Good scope match otherwise. |
| Military Medicine (OUP) | Q2 | Sub track. Moderate scope for aeromedical selection — but heavily US-military clinical, not computational methodology. |

## Excluded — APC Required

| Journal | APC | Notes |
|---|---|---|
| Life Sciences in Space Research | $3,190 | Fully OA. Excellent scope. Re-eligible with `--allow-apc`. |
| Aerospace (MDPI) | ~$2,600 | Good scope. OA only. |
| Scientific Reports (Nature/Springer) | $2,490 | Broad scope. OA only. |
| PLOS ONE | $1,805 | Broad scope. OA only. |

## Excluded — AI-Policy Incompatible

| Journal | Reason |
|---|---|
| Aerospace Medicine and Human Performance (AsMA) | Denylist — 2026-05-08 Newman desk-rejection on declared AI use. See `AI_POLICY_FILTER.md` §4. |

---

## Strategic Recommendation

**Submit to Advances in Space Research first** (COSPAR, Q2, hybrid subscription track free, strongest scope match at lowest desk-rejection risk). No reframing needed — submit as-is.

**Plan B: Acta Astronautica** (Q1, Elsevier hybrid, free). Same Elsevier ecosystem, higher IF (3.5 vs 2.8), higher bar. If ASR rejects on scope, Acta Astronautica is the natural escalation.

**Plan C: Computers in Biology and Medicine** (Q1, Elsevier hybrid, free). Requires mild reframing to lead with generalizable computational methodology. Highest IF (7.0) but weakest spaceflight-domain fit.

## Excluded — APC Required

| Journal | APC | Notes |
|---|---|---|
| npj Microgravity (Nature/Springer) | $3,790 | Strong scope but APC unaffordable. Colombia R4L Group B = 50% discount ($1,895); discretionary waiver possible but not guaranteed. |
| Life Sciences in Space Research | $3,190 | Fully OA. Excellent scope. |
| Aerospace (MDPI) | ~$2,600 | Good scope. OA only. |
| Scientific Reports (Nature/Springer) | $2,490 | Broad scope. OA only. |
| PLOS ONE | $1,805 | Broad scope. OA only. |

---

✓ Journal Scout complete
  Papers scouted: 1
  Candidates evaluated: 10
  Top picks: Acta Astronautica, Computers in Biology and Medicine, Reliability Engineering & System Safety
