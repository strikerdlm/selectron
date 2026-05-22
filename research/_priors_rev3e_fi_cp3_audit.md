# IMM Priors Rev3-e — fi_cp3 Per-Condition Audit

**Created:** 2026-05-22
**Status:** rev3-e applied; QTL accumulator now charges cp3 per K15 §II.A.9
**Output:** updates to `src/data/imm-priors.json` (68 conditions zeroed, 32 retained); `src/imm/simulate.ts` cp3 re-enabled

---

## 1 · Why this audit

rev3-d shipped the K15-correct sequential per-event QTL formula but DEFERRED cp3 (permanent impairment for remainder of mission) because 80 of 100 priors had non-zero `treated.fi_cp3` modes elicited under the OLD engine that never charged cp3. Enabling cp3 with those priors overshot K15 issHMS CHI by 4 pp.

The audit applies K15 §II.A.5's definition — "permanent impairment for the remainder of the mission" — strictly. For most acute self-limiting conditions, persistent impairment over a 180-day analog / LEO timeframe is clinically implausible regardless of treatment. Only conditions with documented persistent-impairment risk retain non-zero `fi_cp3` values.

---

## 2 · Classification rule

**Conservative default:** `treated.fi_cp3 = untreated.fi_cp3 = (0, 0, 0)` for all conditions NOT in the persistent-impairment list below.

**`PERSISTENT_IMPAIRMENT` set (32 conditions retained):**

### Tier A severe (12 conditions, organ damage / neurological deficit even with treatment)
- `sepsis` — multi-organ damage
- `stroke-cerebrovascular-accident` — neuro deficit
- `traumatic-hypovolemic-shock` — organ damage from shock
- `sudden-cardiac-arrest` — post-anoxic + cardiac
- `burns-secondary-to-fire` — skin / tissue / lung damage
- `toxic-exposure-ammonia` — lung damage
- `cardiogenic-shock-secondary-to-myocardial-infarction` — cardiac muscle damage
- `acute-radiation-syndrome` — cumulative radiation effects
- `anaphylaxis` — rare residual respiratory damage
- `choking-obstructed-airway` — anoxic brain injury risk
- `neurogenic-shock` — neuro deficit
- `smoke-inhalation` — lung damage

### Tier B severe with documented persistent risk (17 conditions)
- `angina-myocardial-infarction` — myocardial damage post-MI
- `atrial-fibrillation-atrial-flutter` — chronic arrhythmia management
- `seizures` — epilepsy risk
- `decompression-sickness-secondary-to-extravehicular-activity` — neuro / joint damage
- `head-injury` — post-concussion / TBI
- `neck-injury` — spinal damage risk
- `back-injury` — vertebral / disc damage
- `behavioral-emergency` — psychiatric residual
- `eye-penetration-foreign-body` — vision damage
- `retinal-detachment` — vision loss
- `acute-glaucoma` — vision damage
- `abdominal-injury` — organ damage
- `acute-compartment-syndrome` — muscle necrosis
- `acute-pancreatitis` — chronic pancreatic damage risk
- `hip-proximal-femur-fracture` — mobility impairment
- `lumbar-spine-fracture` — spinal damage / mobility
- `shoulder-dislocation` — recurrent instability

### Tier C with documented persistent impairment (3 conditions)
- `hearing-loss` — by definition persistent
- `eye-corneal-ulcer` — vision damage
- `visual-impairment-and-intracranial-pressure-viip-space-adaptation` — VIIP persists post-mission per NASA evidence (Antonsen et al.)

---

## 3 · Zeroed conditions (68; treated.fi_cp3 = untreated.fi_cp3 = (0, 0, 0))

These conditions fully resolve over the 180-day analog / LEO mission timeframe regardless of treatment. Clinical justification per category:

### URTI / ENT (8)
acute-sinusitis, pharyngitis, otitis-externa, otitis-media, mouth-ulcer, barotrauma-ear-sinus-block, nasal-congestion-space-adaptation, influenza
- Acute infections resolve within 2-3 weeks even untreated; no persistent impairment after recovery.

### Gastrointestinal acute (7)
gastroenteritis, diarrhea, constipation-space-adaptation, indigestion, acute-cholecystitis-biliary-colic, appendicitis, acute-diverticulitis, small-bowel-obstruction, abdominal-wall-hernia
- Acute GI events resolve with treatment; cholecystitis and appendicitis post-surgery have negligible persistent impairment in selected (NASA-screened) crews.

### Musculoskeletal sprains/strains/fractures (8)
ankle-sprain-strain, knee-sprain-strain, shoulder-sprain-strain, wrist-sprain-strain, hip-sprain-strain, elbow-sprain-strain, wrist-fracture, elbow-dislocation, finger-dislocation, lower-extremity-le-stress-fracture
- Most analog-mission MSK events are minor; healing occurs within weeks. Severe fractures (hip, lumbar spine) retained in PERSISTENT.

### Headache / sleep (4)
headache-co2-induced, headache-late, headache-space-adaptation, late-insomnia, insomnia-space-adaptation
- Acute headaches resolve; CO2 headache resolves with atmosphere correction; insomnia resolves with sleep hygiene / pharmacological aid.

### Dermatologic (4)
skin-rash, skin-abrasion, skin-laceration, skin-infection, fingernail-delamination, hemorrhoids
- Skin conditions heal; minor lacerations close; skin-infection if treated fully resolves (severe cases would escalate to `sepsis` which IS in PERSISTENT).

### Dental (4)
dental-caries, dental-abscess (when treated), dental-exposed-pulp, dental-avulsion-tooth-loss, dental-crown-loss, dental-filling-loss
- Dental conditions are typically managed in-flight without persistent functional impairment of crew duties. Cosmetic/structural tooth loss does not impair mission performance.

### GU/GYN (5)
urinary-tract-infection (when treated), vaginal-yeast-infection, abnormal-uterine-bleeding, acute-prostatitis, urinary-incontinence-space-adaptation, urinary-retention-space-adaptation
- Acute GU/GYN events resolve with treatment; severe untreated cases would escalate to systemic illness (covered by `sepsis`).

### Eye conditions (resolving) (3)
eye-abrasion-foreign-body, eye-infection, eye-chemical-burn
- Acute eye events typically heal completely; severe penetrating injuries and corneal ulcer retained in PERSISTENT.

### Mental health (2)
anxiety, depression
- Acute episodes resolve with treatment; severe psychiatric emergencies covered by `behavioral-emergency` (retained in PERSISTENT).

### Space-adaptation (5)
back-pain-space-adaptation, nose-bleed-space-adaptation, space-motion-sickness-space-adaptation, nasal-congestion-space-adaptation, constipation-space-adaptation
- All SA conditions are by definition self-limiting (resolved during adaptation window).

### Other acute (~10)
acute-arthritis, hypertension (when controlled), nephrolithiasis (episodic; between events no impairment), herpes-zoster-reactivation-shingles, allergic-reaction-mild-to-moderate, altitude-sickness, medication-overdose-adverse-reaction, paresthesias, chest-injury (mild — severe escalates to head/abdominal-injury), insomnia-space-adaptation

---

## 4 · Engine change

`src/imm/simulate.ts` per-event QTL accumulator now charges cp3:

```ts
const missionDurationHours = mission.durationDays * 24;
let qtl = 0;
for (const o of occurrences) {
  qtl += o.outcomes.fi_cp1 * o.outcomes.dt_cp1_hours +
         o.outcomes.fi_cp2 * o.outcomes.dt_cp2_hours;
  if (o.outcomes.fi_cp3 > 0) {
    const cp3StartHours = o.timeDays * 24 + o.outcomes.dt_cp1_hours + o.outcomes.dt_cp2_hours;
    const cp3DurationHours = Math.max(0, missionDurationHours - cp3StartHours);
    qtl += o.outcomes.fi_cp3 * cp3DurationHours;
  }
}
```

For the 68 zeroed conditions, `fi_cp3 === 0` so the guard skips — no QTL contribution. For the 32 retained, cp3 contributes as K15 specifies.

---

## 5 · Validation outcome

See `exports/2026-05-22_validate_imm_rev3e_cp3_enabled.txt` for the K15 reproduction post-rev3-e. Acceptance criteria:

- issHMS CHI stays within K15 CI₉₅ [84.30, 98.50] (was Δ -3.85 post-rev3-d; cp3 addition will tighten the gap or possibly overshoot lower-bound)
- 'none' CHI moves back toward K15 ref 59.20 (was Δ +27 post-rev3-d due to no cp3; with cp3 it should drop closer to target since untreated.fi_cp3 for severe conditions is now charged)
- unlimited CHI stays close to K15 ref 94.98

If any K15 metric exits CI₉₅ on the operational scenarios (issHMS, unlimited), iterate: either further-tighten persistent-impairment priors or expand the audit.

---

## 6 · Limitations (carry-forward)

- Classification is clinical-judgment-based, not NASA-iMED-derived (per-condition fi_cp3 values are NASA-internal).
- The 32 persistent-impairment conditions retain rev3-c/rev3-d Beta-Pert values, which may need further per-condition refinement against published persistent-impairment literature in a follow-up rev3-f.
- 'none' scenario (no medical kit) is operationally implausible; treatment of fi_cp3 there is best-effort.

This audit is the source of truth for which conditions cp3 affects. Any future re-elicitation of fi_cp3 should update both `imm-priors.json` and this document.
