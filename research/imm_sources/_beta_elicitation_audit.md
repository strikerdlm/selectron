# Iter-3 Task 41 — `priors.json` hand-elicitation audit

Per spec §11 Risk 3: the I&C corpus reports group aggregates (incidence rates, SMDs), not individual-level vulnerability scores. The IMM `vulnerability_beta`, `worst_case_prob_q`, `treated_lost_days_mean`, and `untreated_lost_days_mean` parameters cannot be MCMC-fit; they are hand-elicited by Diego from the evidence tables (`research/evidence_tables/{psychological,medical,behavioral}.md`, Phase 0 outputs A3/A4/A5) and committed into `src/risk/priors.json` directly.

This document is the audit trail. For each condition, Diego writes:
- One paragraph justifying each `β_k` from a cited effect size (SMD, OR, HR).
- A sentence justifying `worst_case_prob_q` (P(progression to severe) per spec §3.3).
- A sentence justifying `treated_lost_days_mean` + `untreated_lost_days_mean` (from analog corpus durations or general clinical literature; spec §3.4).

The template below provides the structure + candidate sources per condition. Diego fills the numbers.

**Citation format:** `[author year, evidence-table §section, effect size]`. Example: `[Palinkas 2004, psychological.md §Hardiness, SMD = 0.41]`.

**β scale:** log-rate multiplier. β = +0.40 means a 1-SD increase in the predictor multiplies λ by `exp(0.40) ≈ 1.49`. Per Cox/Poisson-regression convention.

**q scale:** probability ∈ [0, 1]. `q = 0.25` means 25% of occurrences progress to a severe event (per spec §3.3 Bernoulli severity sampler).

**Lost-days scale:** days. Used by `lostDays(d_untreated, d_treated, τ)` linear interp (spec §3.4).

---

## Condition: `insomnia`

**Family:** physiologic · **Kind:** rate · **vulnerabilityCriteria (current):** [pending docs/criteria.md ratification — likely `psych.neuroticism`, `physiologic.prior_sleep_disorder`]

### β candidates (Diego fills values)

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Trait neuroticism (high) | `+0.??` | `psychological.md §Big Five — NEO neuroticism` | Higher neuroticism → more sleep complaints in I&C analogs. See Basner 2014 + Pattyn 2017 polar insomnia. |
| Prior insomnia history | `+0.??` | clinical literature | Most consistent predictor of operational insomnia. |
| Age | `+0.??` per decade | Antarctic winter-over literature | Mild positive in older crew. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Justification: of all insomnia occurrences, what fraction progress to clinically significant performance loss (e.g. PVT slowing > 20%)? Reference [Basner 2014 Mars500 — N/M crew with significant sleep loss] or general sleep-deprivation literature.

### Lost-days

- `treated_lost_days_mean = ?? d` (1–3 d typical for melatonin / behavioral intervention)
- `untreated_lost_days_mean = ?? d` (5–10 d typical for unresolved chronic insomnia; consult Pattyn 2017 Antarctic data)

---

## Condition: `depression-anxiety`

**Family:** psychiatric · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `psych.neuroticism`, `psych.hardiness`, `psych.emotional_stability`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Trait neuroticism (high) | `+0.40` to `+0.50` | `psychological.md §Big Five` | Palinkas 2004 reports SMD ≈ 0.41 for neuroticism predicting psychiatric incident in Antarctic winter-over. **This is the spec's worked example.** |
| Hardiness (low — reversed) | `+0.??` | `psychological.md §Stress Tolerance / Hardiness` | Kobasa Hardiness inverse-predicts psychiatric outcome. Use Bartone 2009 polar data if available. |
| Locus of control (external) | `+0.??` | `psychological.md §Locus of Control` | External locus weakly predictive in I&C. |
| Cross-cultural mismatch | `+0.??` | `behavioral.md §Cross-Cultural Competence` | Multinational analog crews (Mars500). |

### `worst_case_prob_q`

Proposal: `q = 0.??`. From Palinkas 2004: of debriefed winter-overs, X% reported psychiatric symptoms; of those, Y% met DSM-IV adjustment-disorder threshold. q ≈ Y/X.

### Lost-days

- `treated_lost_days_mean = ?? d` (typical brief intervention: 5–10 d to remission)
- `untreated_lost_days_mean = ?? d` (mid-mission untreated depression in I&C: weeks; see Antarctic winter-over)

---

## Condition: `conflict-event`

**Family:** team · **Kind:** event · **vulnerabilityCriteria (current):** [likely `behavioral.conflict_resolution`, `behavioral.team_adaptability`, `behavioral.cross_cultural`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Conflict-resolution style (Thomas-Kilmann avoidance) | `+0.??` | `behavioral.md §Conflict-Resolution Style` | Avoidant style predicts unresolved conflict escalation. |
| Low team adaptability | `+0.??` | `behavioral.md §Team Adaptability` | Salas "Big Five" missing-adaptability → conflict rate. |
| High autocratic leadership | `+0.??` | `behavioral.md §Leadership` | Tafforin 2013 + Roma 2017. |
| Comms delay (mission-level) | `+0.??` | spec §5 | Higher delays raise crew↔MC conflict (Basner 2014: 41 crew↔MC vs 8 crew↔crew). |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of conflict events that escalate to mission-impacting incident (e.g., role refusal, formal grievance). Most analog data shows low escalation — q likely small.

### Lost-days

- `treated_lost_days_mean = ?? d` (mediated resolution: 1–3 d productivity loss)
- `untreated_lost_days_mean = ?? d` (escalated: ≥10 d, factional dynamics)

---

## Condition: `circadian-disruption`

**Family:** physiologic · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `physiologic.chronotype`, `psych.neuroticism`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Chronotype morningness (mismatch with mission schedule) | `+0.??` | sleep-medicine literature | MEQ / MCTQ; well-established. |
| Prior circadian disorder | `+0.??` | clinical | DSWPD / ASWPD history. |
| Comms delay | `+0.??` | spec §5 | Reduces circadian zeitgebers from Earth interactions. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. From Vigo 2013 Mars500: HRV / circadian markers show partial entrainment failure; fraction with frank desynchronosis is small.

### Lost-days

- `treated_lost_days_mean = ?? d` (light therapy + scheduled sleep: 2–5 d)
- `untreated_lost_days_mean = ?? d` (chronic Mars500-style desynchronosis: 14+ d)

---

## Condition: `immune-incident`

**Family:** physiologic · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `physiologic.cortisol_regulation`, `psych.hardiness`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Chronic cortisol dysregulation | `+0.??` | `medical.md §Cardiovascular` (HPA proxy) | Ponomarev 2021 Mars500 immune review. |
| Low hardiness | `+0.??` | `psychological.md §Hardiness` | Stress-buffering, immune-mediated. |
| Age | `+0.??` per decade | clinical | Linear positive. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of immune dysregulation episodes that progress to clinically significant infection requiring intervention. Low in healthy young analog crews.

### Lost-days

- `treated_lost_days_mean = ?? d` (course of antibiotics + rest: 5–7 d)
- `untreated_lost_days_mean = ?? d` (complicated infection: 14+ d)

---

## Condition: `latent-virus-reactivation`

**Family:** physiologic · **Kind:** event · **vulnerabilityCriteria (current):** [likely `physiologic.cortisol_regulation`, `physiologic.serostatus` (preflight CMV/EBV/VZV/HSV)]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Preflight VZV/EBV/HSV seropositive | `+1.0+` | clinical (effectively gates the event) | Without seropositive history, reactivation impossible — set as a near-deterministic precondition or use very high β. |
| Cortisol dysregulation | `+0.??` | NASA EVA + ISS reactivation literature | Mehta + Crucian astronaut shedding studies. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Most VZV/EBV reactivations are asymptomatic shedding; fraction that progress to clinical shingles or mononucleosis-like syndrome is small (<10% per Mehta).

### Lost-days

- `treated_lost_days_mean = ?? d` (antiviral course: 5–7 d)
- `untreated_lost_days_mean = ?? d` (shingles untreated: 14–28 d)

---

## Condition: `musculoskeletal-injury`

**Family:** musculoskeletal · **Kind:** event · **vulnerabilityCriteria (current):** [likely `physical.vo2max`, `physical.lean_mass`, `physical.injury_history`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Low VO₂max | `+0.??` | `medical.md §VO₂max` | Lower fitness → higher injury rate in EVA-equivalent loads. |
| Prior injury history | `+0.??` | sports-medicine literature | Strongest predictor. |
| Age | `+0.??` per decade | clinical | Modest positive. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. From Thompson 2008 (fingernail injury 0.046/py, but that's an IMM ISS-derived rate). For analog EVAs the equivalent rate is poorly characterized; q is the fraction that disable >1 day.

### Lost-days

- `treated_lost_days_mean = ?? d` (sprain / strain: 2–5 d)
- `untreated_lost_days_mean = ?? d` (severe: 14+ d; surgical conditions per Babocs 2024 Mars review)

---

## Condition: `performance-drop-pvt`

**Family:** performance · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `psych.cognitive_ability`, `physiologic.baseline_pvt`, `physiologic.sleep_quality`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Baseline PVT (low) | `+0.??` | `psychological.md §Cognitive Ability` | Negative direction — better baseline → fewer drops. |
| Sleep deprivation susceptibility | `+0.??` | sleep-medicine literature | Highly heritable; some individuals tolerant. |
| Age | `+0.??` per decade | clinical | Modest. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of PVT slowing episodes that exceed operationally significant threshold (e.g., >50 ms slowing or >2× lapse rate). From Basner 2014 Mars500: most crew had statistically significant slowing; clinical significance lower.

### Lost-days

- `treated_lost_days_mean = ?? d` (counter-fatigue intervention: 1–2 d)
- `untreated_lost_days_mean = ?? d` (chronic SWS deficit: 7+ d compounding)

---

## Condition: `team-cohesion-loss`

**Family:** team · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `behavioral.teamwork`, `behavioral.team_adaptability`, `behavioral.leadership`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| BBI teamwork score (low) | `+0.??` | `behavioral.md §Behavioural-Based Interview` | Negative direction — higher → lower risk. |
| Mission duration | `+0.??` per 30 days | Roma 2017 + Bell 2019 reviews | Decline curve over confinement duration. |
| Mixed-nationality crew | `+0.??` | `behavioral.md §Cross-Cultural Competence` | Tafforin 2013 Mars500. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of cohesion declines that progress to mission-threatening fracture (factionalization, scapegoating). Rare but high-consequence.

### Lost-days

- `treated_lost_days_mean = ?? d` (re-team intervention: 5–10 d)
- `untreated_lost_days_mean = ?? d` (factionalized crew: 30+ d, mission-end-of-effectiveness)

---

## Condition: `psychosocial-withdrawal`

**Family:** psychiatric · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `psych.extraversion` (reversed), `psych.hardiness`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Low extraversion | `+0.??` | `psychological.md §Big Five` | Sandal 2018 hibernation traits. |
| Low hardiness | `+0.??` | `psychological.md §Hardiness` | Stress-buffering. |
| Long-duration confinement | `+0.??` per 90 days | I&C corpus | Compounding. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of withdrawal episodes that progress to operational disengagement (refusing assignments, breaking comms protocol).

### Lost-days

- `treated_lost_days_mean = ?? d` (re-engagement intervention: 3–7 d)
- `untreated_lost_days_mean = ?? d` (sustained withdrawal: 14+ d)

---

## Condition: `early-termination-request`

**Family:** psychiatric · **Kind:** event · **vulnerabilityCriteria (current):** [aggregate — likely `psych.neuroticism`, `psych.hardiness`, `behavioral.teamwork`, `physiologic.prior_psychiatric_history`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Neuroticism (high) | `+0.??` | `psychological.md §Big Five` | Same predictor as depression-anxiety; share β with caveat. |
| Hardiness (low) | `+0.??` | `psychological.md §Hardiness` | |
| Prior psychiatric history | `+1.0+` | clinical screening | Often disqualifying; very strong predictor when present. |
| Mission duration | `+0.??` per 30 days | I&C corpus | Compounding. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Per S20 (ISS-derived) the evacuation rate is `0.0035` per person-year. For analog missions early-termination requests are higher (no actual evac risk), but the proportion that result in mission abort is small.

Also relevant: S20 Antarctic medical evacuation rate `0.036/py` at McMurdo (cited but the original Pattarini 2016 / Barratt-Johnston source isn't in the corpus).

### Lost-days

- `treated_lost_days_mean = ?? d` (counseling + reintegration: 5–10 d if crew stays)
- `untreated_lost_days_mean = ?? d` (mission abort: equals remaining mission duration — handled as a top-cap in spec §3.5)

---

## Condition: `comms-delay-coping-failure`

**Family:** performance · **Kind:** rate · **vulnerabilityCriteria (current):** [likely `behavioral.stress_coping`, `psych.locus_of_control`]

### β candidates

| Predictor | β proposal | Source | Notes |
|---|---|---|---|
| Emotion-focused coping (high) | `+0.??` | `behavioral.md §Stress-Coping Styles` | Lazarus & Folkman — problem-focused better for solvable stressors. |
| External locus of control | `+0.??` | `psychological.md §Locus of Control` | Worse outcomes when control is reduced. |
| Mission comms delay (sec) | `+0.??` per 100 sec | spec §5 | Direct dose-response. |

### `worst_case_prob_q`

Proposal: `q = 0.??`. Fraction of coping failures that escalate to operational error (mis-executed procedure due to misinterpreted MC guidance). Landon n.d. + Tafforin 2015 cite anecdotes but no integer counts.

### Lost-days

- `treated_lost_days_mean = ?? d` (procedure re-brief + recovery: 1–3 d)
- `untreated_lost_days_mean = ?? d` (sustained miscommunication impact: 7+ d if loop closure delayed)

---

## Diego's elicitation workflow

For each condition above:

1. **Fill the β table** with concrete numerical values + source citations from the evidence tables.
2. **Replace `q = 0.??`** with a concrete number ∈ [0, 1] + one-sentence justification.
3. **Replace lost-days `?? d`** with concrete day counts.
4. **Cross-check** against `src/risk/conditions.ts` for the current `vulnerabilityCriteria` list. If a predictor in your β table isn't in the criteria list, decide whether to (a) add it to the criteria during Iter-2 `docs/criteria.md` ratification, or (b) drop it from the β table for v1.
5. **Once all 12 conditions are filled**, run the T40 notebook (after T37 curation is complete) to produce `src/risk/priors.json` with the MCMC `mu/tau`, then **manually merge** your β / q / lost-days values into the same JSON.
6. **Schema validation**: `validatePriorsJson` in `src/risk/priorsSchema.ts` enforces the structural contract — any drift will fire at engine load time.

The audit doc is itself committed (so the elicitation rationale is traceable from `priors.json` back to the evidence tables).

---

## Caveats

- **Spec divergence flagged in STATUS** (Task 52): the current `priors.json` schema collapses the spec §3.3 / §3.4 severity-conditional lost-day distributions into a flat `WORST_CASE_MULTIPLIER = 1.5`. The `treated_lost_days_mean` and `untreated_lost_days_mean` fields above are 2-state; if you elicit a richer severity-conditional distribution, the engine schema must be expanded at Iter-3 v2.
- **vulnerabilityCriteria placeholder**: as of this writing, only 4 of 12 conditions have populated `vulnerabilityCriteria` in `src/risk/conditions.ts` (Iter-1 placeholders); the other 8 are empty. Iter-2 ratification of `docs/criteria.md` is the gate that populates the rest. Until then, β values for those 8 conditions will not influence the simulator (the multiplier defaults to 1 when no criteria match).
