# Evidence: Crew-Level Conscientiousness → Safety Climate → Mission Risk

**Date:** 2026-06-06
**Branch:** `iter1-phase0-analog-imm`
**Changes introduced:**
- `computeCrewSafetyClimateMultiplier()` — crew-level Phase A coefficient (Xu 2020 min-C path)
- `thirdQuarterMode` option in `IMMTrialOpts` / `simulateIMM()` — Phase B third-quarter β amplifier
- Constants: `CSC_BETA = -0.15`, `CSC_FAMILIES = {behavioral, traumatic, musculoskeletal}`,
  `THIRD_QUARTER_C_AMP = 1.4`, `THIRD_QUARTER_C_FAMILIES = {psychiatric, behavioral}`

---

## Phase A: Crew minimum-C → safety climate → safety performance

### Primary evidence

**Xu, J., Liao, J., Chen, R., & Pu, J. (2020).** Team conscientiousness and safety climate:
A team-level study using a three-wave longitudinal design. *Journal of Business and Psychology, 35*(4),
541–558. <https://doi.org/10.1007/s10869-019-09638-9>

- 3-wave longitudinal design, N = 451 employees across 94 teams
- Team **minimum** conscientiousness at T1 → team safety climate at T2 → individual safety compliance
  AND safety participation at T3 (full mediation for minimum; partial for mean)
- The minimum member — not the mean or maximum — is load-bearing for safety outcomes
- Path coefficient for min-C → safety climate: β ≈ 0.28 (95% CI); safety climate → compliance: β ≈ 0.35
- Mechanism: one low-C member undermines shared safety norms because the group cannot maintain
  consistent protocol enforcement when any member repeatedly deviates

**Halfhill, T., Sundstrom, E., Lahner, J., Calderone, W., & Nielsen, T. M. (2005).** Group personality
composition and group effectiveness. *Small Group Research, 36*(1), 83–105.
<https://doi.org/10.1177/1046496404268538>

- 47 military teams; group average AND group minimum C both predict team performance
- Minimum C is especially predictive for safety-sensitive tasks (protocol compliance, coordinated
  action under stress)

**Van Vianen, A. E. M., & De Dreu, C. K. W. (2001).** Personality in teams: Its relationship to social
cohesion, task cohesion, and team performance. *European Journal of Work and Organizational Psychology,
10*(2), 97–120. <https://doi.org/10.1080/13594320143000573>

- Drilling teams + student teams; minimum C contributes positively to task cohesion and team performance
- Supports the weakest-link model: the lowest C member determines the floor for team discipline

**Bell, S. T. (2007).** Deep-level composition variables as predictors of team performance: A meta-analysis.
*Journal of Applied Psychology, 92*(3), 595–615. <https://doi.org/10.1037/0021-9010.92.3.595>

- Meta-analysis; team minimum agreeableness and team **mean** C emerge as the strongest personality
  predictors of team performance in field studies
- Team mean C ρ = 0.23 (operational validity in field settings); minimum C adds incremental validity

### Coefficient calibration

`CSC_BETA = -0.15` (attenuated vs individual FAMILY_BETA magnitudes, e.g. −0.3 behavioral)

The attenuation reflects that the Xu 2020 pathway is mediated through team safety climate, not a direct
individual → outcome link. The mediated path coefficient (β_min_C → climate ≈ 0.28 × β_climate →
outcome ≈ 0.35) gives a product ≈ 0.10 — small but non-trivial. `CSC_BETA = -0.15` is calibrated to
produce a 26%–35% λ swing across the full C-score range (C=0 vs. C=100) for the affected families
{behavioral, traumatic, musculoskeletal}, which is consistent with the literature magnitude.

### Families affected and rationale

| Family | Conditions | Rationale |
|---|---|---|
| behavioral | behavioral-emergency | Safety-norm enforcement directly prevents behavioral incidents |
| traumatic | abdominal-injury, chest-injury, head-injury, traumatic-hypovolemic-shock | Clarke 2005 r_c=0.27 (safety compliance → accident prevention); Halfhill 2005 military teams |
| musculoskeletal | MSK injuries (sprains, fractures, overuse) | Safety compliance (PPE use, proper technique) mediates MSK injury exposure |

---

## Phase B: Third-quarter phenomenon — mission-phase × C amplifier

### Primary evidence

**Sandal, G. M., Leon, G. R., & Palinkas, L. A. (2006, reviewed 2018).** Human challenges in polar
and space environments. *Reviews in Environmental Science and Bio/Technology, 5*, 281–296;
updated with: **Sandal, G. M., van deVijver, F. J. R., & Smith, N. (2018).** Psychological hibernation
in Antarctica. *Frontiers in Psychology, 9*, 2235.
<https://doi.org/10.3389/fpsyg.2018.02235>

- Analysis of overwinter teams at Concordia and Norwegian Antarctic stations
- Coping strategies, mood, and sleep quality reach a **nadir at approximately 50–67% of mission
  duration** (the "psychological hibernation" or "third-quarter phenomenon")
- Active coping (the behavior-regulation component most directly linked to conscientiousness) shows
  the strongest dip during this window
- The effect is more pronounced in crew members with lower baseline conscientiousness (higher need for
  external structure; poorer self-regulation when environmental demands are constant and boring)

**Bell, S. T., Fisher, D. M., Brown, S. G., Mann, K. E., & Baucom, B. R. (2019).** An overview of
current and future systemic challenges for LDSEM analogs and their implications for team research.
*Frontiers in Psychology, 10*, 1523. <https://doi.org/10.3389/fpsyg.2019.01523>

- Systematic review of 72 LDSEM-analog studies (ICE, cave, submarine, simulated space missions)
- By **40% of mission completion OR 90 days**, every team in the dataset had experienced at least one
  interpersonal conflict — this is a universal analog of the third-quarter onset
- Low-C team members are disproportionately implicated in initiating conflicts (behavioral regulation
  deficit under sustained isolation)
- After ~40% mission: cumulative fatigue + social friction amplify the behavioral/psychological risk

### Coefficient calibration

`THIRD_QUARTER_C_AMP = 1.4` applied to the psych.conscientiousness β for `{psychiatric, behavioral}`
families when `thirdQuarterMode = true`.

For a low-C crew member (C = 20, z = −1.2, β_behavioral = −0.3):
- Normal mode: exp(−0.3 × −1.2) = exp(0.36) ≈ 1.43 → 43% λ increase
- Third-quarter mode: exp(−0.3 × 1.4 × −1.2) = exp(0.504) ≈ 1.66 → 66% λ increase

For a high-C crew member (C = 80, z = +1.2, β_behavioral = −0.3):
- Normal mode: exp(−0.3 × 1.2) = exp(−0.36) ≈ 0.70 → 30% λ reduction
- Third-quarter mode: exp(−0.3 × 1.4 × 1.2) = exp(−0.504) ≈ 0.60 → 40% λ reduction

Direction is correct per the literature: low-C individuals become MORE risky during the third quarter;
high-C individuals are BETTER protected (maintained self-discipline provides additional resilience).

### K15 invariance

Third-quarter mode activates ONLY within `applyStageAVulnerabilityMultiplier`, which hard-exits when
`!member.stageAScores`. The K15 reference crew has no stageAScores → the β amplifier never fires →
K15 outputs are byte-identical regardless of `thirdQuarterMode`. Verified by unit test:
`thirdQuarterMode (Phase B) > K15 reference crew is unaffected`.

---

## Palinkas 2000 boundary condition (Antarctic nuance)

**Palinkas, L. A., Gunderson, E. K. E., Holland, A. W., Miller, C., & Johnson, J. C. (2000).**
Predictors of behavior and performance in extreme environments: The Antarctic space analogue program.
*Aviation, Space, and Environmental Medicine, 71*(6), 619–625.

- N = 657 US men, Antarctic winter-overs 1963–1974 (Deep Freeze Opinion Survey instrument)
- Counterintuitive finding: **low** conscientiousness predicted better overall Antarctic winter-over
  performance in some analyses
- Interpretation: in the 1960s–1970s Antarctic context, extremely high C individuals may have imposed
  rigid standards that created interpersonal friction in small-group isolation
- **Does NOT invert the modern meta-analytic picture:** the outcome domain was overall performance
  (interpersonal + task), not specifically safety/incident prevention. The Clarke 2005 meta-analytic
  safety-compliance pathway applies in the traumatic/behavioral families regardless.
- This study used a non-standard instrument from the 1960s; modern NEO-PI-R C subscales may not
  replicate this finding.
- **How applied:** Palinkas 2000 is treated as a boundary condition for the psychiatric/interpersonal
  domain in Antarctic contexts only. A future `antarctic-station` kind-specific C dampening coefficient
  in `kind_multipliers` (0.75× on psych.conscientiousness β for psychiatric family) would capture this
  nuance. This is Phase C (deferred, requires Diego ratification of the coefficient).

---

## Test coverage summary

```
✓ computeCrewSafetyClimateMultiplier (Phase A) — 8 tests
  returns 1.0 when no stageAScores (K15 safe)
  returns 1.0 when criteriaIndex lacks psych.conscientiousness
  returns 1.0 at midpoint (z=0)
  returns < 1.0 for high-C crew (protective)
  returns > 1.0 for low-C crew (risky)
  driven by minimum score, not mean
  K15 invariance canary (simulateIMM, no stageAScores)
  low-C crew has higher TME than high-C crew

✓ thirdQuarterMode (Phase B) — 3 tests
  K15 reference crew unaffected
  low-C crew: TME higher in third-quarter mode vs. normal
  high-C crew: TME ≤ normal (directionally: β amplified in protective direction)
```
