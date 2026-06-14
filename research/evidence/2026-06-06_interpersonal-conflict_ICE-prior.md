# Interpersonal Conflict — ICE Environment Prior Derivation

**Condition ID:** `interpersonal-conflict`  
**Provenance:** `tierB-lit`  
**Date:** 2026-06-06  
**IMM family:** behavioral  
**Vulnerability criteria:** `psych.emotional_stability`, `behavioral.teamwork`, `psych.conscientiousness`

---

## Condition definition

A clinically significant interpersonal conflict episode experienced by an individual crewmember that:
- Causes functional impairment of ≥24 h (reduced work efficiency, sleep disruption, psychological distress)
- Corresponds to "interpersonal tensions" (type 3) or "interpersonal breakdowns" (type 4) in the Marcinkowski et al. (2021) ICE conflict typology
- Is distinct from `behavioral-emergency` (no sedation/antipsychotics required)
- Is distinct from everyday task disagreements (types 1–2 in Marcinkowski typology)

---

## Source papers

### Bell et al. (2019) — Systematic review, 72 sources, Frontiers in Psychology
- "By 40% of mission completion or 90 days, all teams reported at least one conflict"
- Key structural finding: conflict is universal in analog ICE environments; it is a when-not-if condition
- 253 effect sizes across Antarctic, space-chamber, and submarine analog populations
- **Limitation for prior derivation:** reports crew-level "any conflict" event, not individual-level clinically significant events

### Marcinkowski et al. (2021) — 5 four-person ICE crews, Acta Astronautica
- Daily open-ended conflict reports
- Typology: (1) noted discords, (2) work disagreements, (3) interpersonal tensions, (4) interpersonal breakdowns
- Only types 3–4 constitute clinically significant episodes requiring support/mediation
- Types 3–4 estimated at ~30–40% of all reported conflicts
- **Key anchor:** combined with Bell et al. to derive clinically-significant subset rate

### Basner et al. (2014) — Mars-500, 520d, 6 crew, PLoS ONE
- Weekly conflict questionnaire throughout mission
- Intra-crew conflicts reported at 5× lower rate than mission-control conflicts
- Two crewmembers accounted for 85% of perceived intra-crew conflicts
- **Key anchor:** intra-crew conflict is rare; most conflict is crew↔mission-control. Confirms ISS-type setting has lower intra-crew conflict rate than analog.

### Palinkas & Suedfeld (2021) — Review, Neuroscience & Biobehavioral Reviews
- 116 citations; comprehensive review of psychosocial issues in ICE environments
- Interpersonal conflict listed among top 3 individual stressors alongside depression and cognitive performance decrements
- No quantitative rate reported; qualitative confirmation of high relevance

---

## Incidence rate derivation

### Step 1: Analog anchor from Bell et al. + Marcinkowski

Bell et al.: all crews had ≥1 conflict (any type) by day 90 for analog 4-person crews.  
Marcinkowski typology: ~35% of all conflicts are clinically significant (types 3–4).

Inference: P(crew ≥1 clinically significant conflict by day 90) ≈ 0.50 for a 4-person analog crew.

For a Poisson process with rate λ per person-day:
```
P(crew ≥1 event in 90d) = 1 − exp(−n·λ·T)
0.50 = 1 − exp(−4·λ·90)
exp(−360λ) = 0.50
λ = ln(2) / 360 = 0.693 / 360 = 0.00193 /person/day  [analog baseline]
```

### Step 2: Scaling ISS baseline from analog

Basner (Mars-500): intra-crew conflict 5× lower than mission-control conflict and notably rare.  
ISS has real-time mission control support and higher crew selection stringency than typical analog.  
Estimated ISS ≈ 0.33 × analog rate:

```
λ_ISS = 0.00193 × 0.33 = 0.000637 /person/day  ≈ 0.000667 /person/day
```

### Step 3: Gamma-Poisson parameters

Chosen parameterization: α=2, β=3000  
- Mean λ = α/β = 2/3000 = **0.000667 /person/day**
- Variance = α/β² = 2.2×10⁻⁷ → CV ≈ 70% (appropriate uncertainty for 4-paper literature anchor)

Expected events per 6-person crew at ISS baseline:
- 90d: 0.000667 × 6 × 90 = **0.36 events**
- 180d: 0.000667 × 6 × 180 = **0.72 events**

### Step 4: Kind multipliers

| Context | Multiplier | Rationale |
|---|---|---|
| `antarctic-station` | **2.0×** | High isolation, no real-time support, overwinter confinement (Bell et al.; Palinkas & Suedfeld) |
| `analog-controlled` | **1.5×** | Moderate isolation, climate-stable habitat, real-time support available |
| `leo-iss` | 1.0 (default) | Calibration baseline |
| `interplanetary-mars-future` | 1.0 (default) | No comms-delay conflict model yet; left at baseline |

Antarctic 90d, 6-person crew: 0.00133 × 6 × 90 = **0.72 events** (P(≥1) ≈ 0.51)  
Antarctic 180d, 6-person crew: 0.00133 × 6 × 180 = **1.44 events** (P(≥1) ≈ 0.76)

---

## Severity parameters

Interpersonal conflict is self-limiting when mediated (fi_cp3 = 0 for both treated and untreated).  
Severity distribution: Beta(1.2, 4.8) → mean worst-case probability = 0.20 (20% of events reach significant functional impairment).

### Treated (counseling/mediation available)
- Initial impairment: mode 0.20 FI (moderate) — conflict active, disrupts work/sleep
- Resolution: mode 48h to second checkpoint
- No permanent residual impairment (fi_cp3 = 0)
- p_evac treated mode = 5×10⁻⁵ (managed conflict very rarely requires evacuation)
- p_locl ≈ 0

### Untreated (no mediation/support)
- Initial impairment: mode 0.45 FI — unresolved conflict significantly impairs function
- Escalation window: 168–720h before significant improvement without intervention
- p_evac untreated mode = 8×10⁻⁴ (escalation to behavioral emergency path; ~16× treated)
- p_locl ≈ 10⁻⁵ (rare; untreated conflict escalation can contribute to safety incidents)

---

## Required resources

`anti-anxiety: 3` — short-course anxiolytics for associated insomnia/stress symptoms.  
Conflict mediation itself is non-pharmacological (behavioral countermeasure, no kit consumption).

---

## Vulnerability criteria rationale

| Criterion | Direction | Justification |
|---|---|---|
| `psych.emotional_stability` | High → protective | Low emotional stability is a general ICE psychosocial vulnerability marker; retained as a conservative vulnerability proxy pending condition-specific coefficient fitting |
| `behavioral.teamwork` | High → protective | Poor team cohesion predicts conflict frequency and severity |
| `psych.conscientiousness` | High → protective | Conscientiousness is retained as a conservative proxy for task reliability and conflict-management behavior, not as a condition-specific fitted coefficient |

Note: adding `psych.conscientiousness` as a coupling criterion also addresses the known model weakness (1/100 conditions previously coupled to conscientiousness). This adds it as a second condition, expanding conscientiousness signal in the vulnerability path.

---

## Limitations

1. No quantitative per-person-day incidence data available from any source — all rates derived analytically from crew-level event anchors
2. Bell et al. (2019) anchor reports "any conflict", not "clinically significant conflict" — the 35% subset fraction is estimated from Marcinkowski typology, not directly observed
3. ISS scaling factor (0.33× analog) is expert judgment from Basner qualitative comparison, not fitted
4. The condition is modeled as individual-level; real interpersonal conflict is dyadic/group — this is a recognized limitation of the IMM individual-sampling framework
5. kind_multiplier for `interplanetary-mars-future` left at 1.0 — communication delay effects on conflict escalation are unmodeled (out of scope per CLAUDE.md)

---

## References

- Bell, S. T., et al. (2019). What We Know About Team Dynamics for Long-Distance Space Missions. *Frontiers in Psychology*, 10, 1583.
- Marcinkowski, M. A., et al. (2021). The nature of conflict for teams in isolated, confined, and extreme environments. *Acta Astronautica*, 188, 333–341.
- Basner, M., et al. (2014). Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars. *PLoS ONE*, 9(3), e93019.
- Palinkas, L. A., & Suedfeld, P. (2021). Psychosocial issues in isolated and confined extreme environments. *Neuroscience & Biobehavioral Reviews*, 126, 413–429.
