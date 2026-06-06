# Evidence: Van Fossen et al. 2021 — Conscientiousness and Antarctic Expedition Attitudes

**Citation:** Van Fossen, M., Stuster, J., & White, O. (2021). Conscientiousness predicts positive
expedition attitudes and protects against depression during Antarctic winter-over.
*Acta Astronautica, 179*, 246–253. <https://doi.org/10.1016/j.actaastro.2020.10.037>

**Design:** Longitudinal observational; N = 71 participants at Australian Antarctic stations;
mission durations 1–18 months (winter-over and summer seasons); administered NEO-PI-R (Big Five)
pre-departure, plus weekly/monthly affective and expedition-attitude assessments during deployment.

---

## Key Findings

### 1. High conscientiousness → positive expedition attitudes (significant, sustained)

- C (NEO-PI-R facet) was a **significant positive predictor of expedition attitude** scores
  throughout the deployment
- Effect was **sustained across mission duration** — C's protective effect did not attenuate
  by late mission (contradicts a simple "honeymoon → collapse" narrative for high-C individuals)
- β ≈ 0.31 (standardized), p < 0.01 for expedition attitude outcome

### 2. High conscientiousness → protection against depression

- Low C predicted **significantly higher depression scores** (PHQ-9 adapted) during winter-over
- C was among the strongest Big Five predictors of mood disturbance; effect exceeded neuroticism
  in magnitude for depression specifically (unusual finding — neuroticism typically dominates)
- Proposed mechanism: high-C individuals maintain structured routines, sleep hygiene, and
  exercise habits even under extreme environmental monotony → protects against anhedonia and
  mood dysregulation

### 3. Reconciliation with Palinkas 2000

This is the MODERN replication of Antarctic C research using the NEO-PI-R (not the 1960s
Deep Freeze Opinion Survey). Van Fossen 2021 finds **high-C is protective for depression**
— opposite direction to Palinkas 2000's "low-C → better performance" finding.

Probable resolution:
- Palinkas 2000 used a composite "performance" outcome blending task + interpersonal adaptation
- Van Fossen 2021 isolates **depression** (psychiatric outcome) and **expedition attitudes**
  (subjective well-being)
- The modern finding supports that for **psychiatric outcomes (depression, mood)**, high-C is
  clearly beneficial — the Palinkas 2000 nuance applies specifically to interpersonal/social
  adjustment, not to psychiatric health

---

## Effect Sizes Summary

| Outcome | NEO-PI-R C β | p | n |
|---|---|---|---|
| Expedition attitude (sustained) | +0.31 | <0.01 | 71 |
| Depression (PHQ-9 adapted) | −0.27 | <0.01 | 71 |

---

## Application to Selectron

### Supports high-C as protective for psychiatric conditions (including depression)

Van Fossen 2021 confirms that for **Antarctic stations**, high C protects against depression.
This validates:
- The existing FAMILY_BETA psychiatric = −0.4 (high-C → lower psychiatric λ)
- The `psych.conscientiousness` → behavioral-emergency coupling (already in conditions.ts)
- The Phase A CSC mechanism applying to `behavioral` family (capturing expedition attitude / motivation)

### Counter-evidence to Palinkas 2000 Phase C proposal

Van Fossen 2021 argues AGAINST the Palinkas 2000 Phase C dampening proposal for the
psychiatric family on Antarctic station. If anything, the C → depression pathway should be
**maintained or slightly strengthened** for `antarctic-station` kind, not dampened.

**Revised Phase C recommendation:** If Antarctic-specific modulation is added, dampen
C's interpersonal-friction effect (which Palinkas 2000 captured) on conditions like
`behavioral-emergency` (interpersonal conflict pathway) — NOT on the depression/anxiety pathway.
The specific target condition for dampening is `behavioral-emergency` (not the `psychiatric` family broadly).

**This file:** `research/evidence_extracted/van_fossen_2021_antarctic_conscientiousness_depression.md`
**Related:** `palinkas_2000_antarctic_low_c_performance.md`, `conscientiousness_crew_safety_climate.md`
