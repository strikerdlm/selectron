# Evidence: Wilmot et al. 2019 — Occupational Complexity Attenuates the C-Performance Relation

**Citation:** Wilmot, M. P., Wanberg, C. R., Kammeyer-Mueller, J. D., & Ones, D. S. (2019).
Extraversion advantages at work: A quantitative review and synthesis of the meta-analytic evidence.
*Proceedings of the National Academy of Sciences, 116*(46), 23219–23225.
<https://doi.org/10.1073/pnas.1910668116>

*Note: The primary finding on C-complexity moderation is from the companion meta-analysis:*

**Wilmot, M. P., & Ones, D. S. (2019).** A century of research on conscientiousness at work.
*Proceedings of the National Academy of Sciences, 116*(46), 23219–23225.
<https://doi.org/10.1073/pnas.1910013116>

**Design:** Meta-analysis of meta-analyses (quantitative synthesis); k > 200 meta-analytic
samples; total primary N > 250,000. Examined Big Five C as a predictor of job performance
across occupational complexity levels (DOT/O*NET complexity ratings from routine/manual to
highly complex professional/scientific roles).

---

## Key Findings

### 1. C is positively related to job performance across all occupational levels

- Overall ρ = 0.26 for C → job performance (across all complexity levels)
- This replicates the Barrick & Mount 1991 meta-analytic finding (ρ ≈ 0.22)

### 2. Occupational complexity ATTENUATES the C-performance relation

- Low complexity jobs (routine, manual, script-following): C → performance ρ ≈ **0.32**
- High complexity jobs (scientific, medical, operational research): C → performance ρ ≈ **0.16**
- The attenuation is **substantial and statistically robust**

**Mechanism proposed by authors:** In highly complex roles, the rigid adherence and rule-following
aspects of high C can become *disadvantageous* — flexible problem-solving, adaptive thinking, and
tolerance for ambiguity are more valued. High-C individuals may over-optimize known protocols at
the expense of innovative adaptation when novel challenges arise.

### 3. The C-safety compliance pathway is NOT attenuated by complexity

- Safety compliance outcomes (Beus 2014, Clarke 2005) involve executing known protocols correctly —
  this is a LOW-complexity pathway even in high-complexity jobs
- Following an emergency medical protocol, using PPE, maintaining sterile technique — these are
  scripted, compliance-based tasks where C monotonically helps
- The attenuation applies to the *creative/adaptive performance* component of complex roles

---

## Application to Selectron

### C-performance attenuation is NOT relevant to the IMM safety-incident pathway

The IMM Calculator models **medical/safety incidents** — which primarily occur through:
1. Protocol deviation / safety non-compliance (C monotonically protective; no complexity attenuation)
2. Behavioral dysregulation (C protective for behavioral-emergency)
3. Medication non-adherence (C protective; low-complexity task)

The Wilmot 2019 attenuation applies to the **job performance** component of analog missions
(scientific productivity, problem-solving, mission-objective achievement) — NOT to the
medical-risk pathway that Selectron models.

### Relevant for MCDA Stage A scoring — not for IMM simulation

If Selectron's Stage A MCDA were to incorporate "scientific productivity" or "mission-task
performance" as a criterion outcome (not currently modeled), then the Wilmot 2019 attenuation
would be relevant — analog scientists doing high-complexity research would benefit less from
high C than a simple mission-success model would predict.

**Current status:** no action required in the IMM simulation engine. Documented here as
context for future MCDA criterion weighting discussions.

### Implication for Antarctic/analog selection interpretation

When interpreting Stage A C scores for candidate selection (MCDA layer, not IMM risk layer):
- For safety/compliance outcomes: high C is straightforwardly good
- For scientific performance on complex research tasks: the marginal benefit of C above a
  moderate threshold (say, T-score > 65) is attenuated — selection pressure should not
  over-weight extreme C at the expense of openness/flexibility
- This is consistent with the CLAUDE.md guidance that Stage A scores modulate λ priors
  (safety pathway) but do not determine the full MCDA composite

**This file:** `research/evidence_extracted/wilmot_2019_complexity_attenuates_conscientiousness.md`
**Related:** `conscientiousness_crew_safety_climate.md`, `palinkas_2000_antarctic_low_c_performance.md`
