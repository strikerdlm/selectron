# Evidence: Peeters et al. 2006 — Team Conscientiousness Variance as a Negative Predictor

**Citation:** Peeters, M. A. G., Van Tuijl, H. F. J. M., Rutte, C. G., & Reymen, I. M. M. J. (2006).
Personality and team performance: A meta-analysis. *European Journal of Personality, 20*(5), 377–396.
<https://doi.org/10.1002/per.588>

**Design:** Meta-analysis; k = 26 studies, combined N ≈ 2,400 participants in work and student teams.
Examined Big Five mean, minimum, maximum, and variance as predictors of team task performance and
viability (team members' desire to continue working together).

---

## Key Findings

### 1. Team mean conscientiousness positively predicts performance

- Team mean C: ρ = **0.20** (95% CI: 0.09–0.30) for team task performance
- Broadly consistent with Bell 2007 (ρ = 0.23 in field studies)

### 2. Team variance in conscientiousness NEGATIVELY predicts performance (key finding)

- Within-team variance in C: ρ = **−0.24** (95% CI: −0.38 to −0.09) for task performance
- This is larger in magnitude than the mean-C positive effect
- Interpretation: teams where some members are highly conscientious and others are not
  experience **coordination failure** — high-C members carry disproportionate workload,
  resentment builds, protocol adherence becomes inconsistent across the team
- High C-variance is particularly damaging in tasks requiring coordinated sequential workflows
  (one dropped step by a low-C member invalidates a high-C member's earlier work)

### 3. Maximum C does not add predictive value

- Team maximum C: ρ ≈ 0.04 (non-significant)
- The ceiling (most conscientious member) does not protect against C-variance or low-minimum

### 4. Team viability (cohesion) also negatively predicted by C variance

- High C-variance: ρ = −0.19 for team viability (members' desire to continue together)
- Provides a direct link from C-variance to interpersonal conflict — teams with uneven C
  distribution are more likely to fracture, consistent with Bell 2019's conflict-onset findings

---

## Key Effect Sizes

| Aggregation | Trait | ρ (performance) | ρ (viability) |
|---|---|---|---|
| Mean | C | +0.20 | +0.11 |
| Variance | C | **−0.24** | −0.19 |
| Minimum | C | +0.17 | +0.14 |
| Maximum | C | +0.04 | +0.02 |

---

## Application to Selectron

### Current limitation: crew C variance is not modeled

The current Phase A CSC mechanism uses team **minimum** C (Xu 2020 anchor). Peeters 2006 shows
that team **variance** in C is an independent and comparably strong negative predictor (ρ = −0.24).

**Implication for future extension:** Add a C-variance component to the CSC calculation:
```
crewCSC = exp(CSC_BETA_MIN × z_minC + CSC_BETA_VAR × normalizedVarianceC)
```
where `CSC_BETA_VAR > 0` (positive β on variance → higher variance → higher λ, risky direction).

**Calibration:** With ρ_variance ≈ −0.24 and ρ_min ≈ 0.18 (Bell 2007), the variance effect is
~33% stronger than the minimum effect. A reasonable `CSC_BETA_VAR ≈ +0.10` would capture this
without overclaiming.

**Status:** not implemented; documented here for Phase C or future iteration. The current
minimum-only CSC is conservative (misses variance) but is defensible as a first-pass.

### Supports selection emphasis on crew C homogeneity

For crew composition decisions, Peeters 2006 argues that **C homogeneity matters** — not just
selecting for high mean C. In the Selectron crew selection workflow, this suggests:
- Flag crews where C variance is high (e.g., SD > 15 T-score points)
- Prefer crews with uniformly high C over crews with one outlier member

**This file:** `research/evidence_extracted/peeters_2006_team_conscientiousness_variance.md`
**Related:** `conscientiousness_crew_safety_climate.md`, `bell_2007_team_personality_meta_analysis.md`
