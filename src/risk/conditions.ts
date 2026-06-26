import type { Condition } from "@/types";

// Iter-3 v2 analog-condition catalog (spec §5).
// Thirty medical / behavioral / performance conditions selected to span the
// I&C evidence corpus (research/evidence/INDEX.md; Mars500, HI-SEAS, Antarctic,
// MDRS, EMMPOL, SIRIUS, MARS2013).
// Conditions 1–12: original Iter-3 v1 set (unchanged).
// Conditions 13–30: Iter-3 v2 expansion — literature-derived mean log-lambda
//   rates per condition; see synthetic-iter3.ts CONDITION_MEAN_LOG for values.
//
// vulnerabilityCriteria are the Stage-A criterion ids (Iter-1 placeholders
// here) that the candidate-vulnerability multiplier exp(β_k^T r_i) consumes.
// Spec §5 names finer-grained constructs (sleep quality, chronotype,
// comms-delay tolerance, immune marker, cognitive flexibility, training
// history) that Iter-1's 5-criterion placeholder set does NOT cover. Where
// the spec's construct has no Iter-1 analog, vulnerabilityCriteria is empty
// — Iter-2's ratified docs/criteria.md will fill these in; the conditions
// remain valid in the Stage-B simulator (they just rely on the base posterior
// without per-candidate modulation).
//
// Citation slugs reference research/evidence/<slug>.md frontmatter; DOIs are
// the canonical refs from the I&C corpus.
export const ANALOG_CONDITIONS: readonly Condition[] = [
  {
    id: "insomnia",
    label: "Mission-onset insomnia",
    family: "psychiatric",
    kind: "rate",
    // Iter-2 will add sleep-quality and chronotype criteria; empty for now.
    vulnerabilityCriteria: [],
    citations: [
      "10.1152/japplphysiol.00606.2016", // Pattyn 2017 — Antarctic polar insomnia
      "10.3389/fnhum.2026.1720237", // Glos 2026 — 4-month isolation sleep
      "10.1016/j.ijpsycho.2014.04.008", // Gemignani 2014 — 105d isolation sleep
    ],
  },
  {
    id: "depression-anxiety",
    label: "Depression or anxiety episode",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.emotional_stability"],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — Mars500
      "10.3402/ijch.v63i2.17702", // Palinkas 2004 — Antarctic psychiatric incidence
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — Antarctic psychological hibernation
      "10.1002/smi.3006", // Tortello 2020 — Antarctic coping
    ],
  },
  {
    id: "conflict-event",
    label: "Interpersonal conflict incident",
    family: "team",
    kind: "rate",
    vulnerabilityCriteria: ["behavioral.teamwork", "psych.conscientiousness"],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014
      "10.1108/S1534-085620160000018007", // Roma & Bedwell 2017 — team dynamics
      "10.1016/j.actaastro.2013.05.001", // Tafforin 2013 — Mars500 ethology
    ],
  },
  {
    id: "circadian-disruption",
    label: "Circadian disruption",
    family: "physiologic",
    kind: "rate",
    // Iter-2 will add chronotype and comms-delay-tolerance criteria.
    vulnerabilityCriteria: [],
    citations: [
      "10.3357/ASEM.3612.2013", // Vigo 2013 — Mars500 circadian/HRV
      "10.1152/japplphysiol.00606.2016", // Pattyn 2017
      "10.3389/fnhum.2026.1720237", // Glos 2026
    ],
  },
  {
    id: "immune-incident",
    label: "Immune dysregulation incident",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.3389/fimmu.2021.697435", // Ponomarev 2021 — immunology of I&C
      "10.3389/fphys.2022.963301", // Shved 2022 — isolation/crowding countermeasures
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — effects of I&C
    ],
  },
  {
    id: "latent-virus-reactivation",
    label: "Latent-virus (HSV/EBV/VZV/CMV) reactivation",
    family: "physiologic",
    kind: "rate",
    // Iter-2 will add immune-marker criterion; stress proxy via emotional_stability.
    vulnerabilityCriteria: ["psych.emotional_stability"],
    citations: [
      "10.3389/fimmu.2021.697435", // Ponomarev 2021
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016
    ],
  },
  {
    id: "musculoskeletal-injury",
    label: "Musculoskeletal injury (training or EVA)",
    family: "musculoskeletal",
    kind: "event",
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.1186/s12868-022-00723-x", // Abeln 2022 — Mars500/SIRIUS exercise
      "hudson-pre-antarctic-training", // Hudson n.d. — pre-Antarctic training
    ],
  },
  {
    id: "performance-drop-pvt",
    label: "Performance drop (PVT lapse spike)",
    family: "performance",
    kind: "rate",
    // Iter-2 will add sleep and cognitive-flexibility criteria.
    vulnerabilityCriteria: [],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — Mars500 PVT trajectories
    ],
  },
  {
    id: "team-cohesion-loss",
    label: "Team cohesion loss",
    family: "team",
    kind: "rate",
    vulnerabilityCriteria: ["behavioral.teamwork"],
    citations: [
      "10.3389/fpsyg.2019.00811", // Bell 2019 — team dynamics LDM
      "10.1089/ast.2019.2035", // McMenamin 2020 — AMADEE-18 team processes
      "10.1108/S1534-085620160000018007", // Roma & Bedwell 2017
    ],
  },
  {
    id: "psychosocial-withdrawal",
    label: "Psychosocial withdrawal",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.emotional_stability"],
    citations: [
      "10.3389/fpsyg.2018.02235", // Sandal 2018
      "10.1002/smi.3006", // Tortello 2020
    ],
  },
  {
    id: "early-termination-request",
    label: "Early-termination request (analog of medical evacuation)",
    family: "psychiatric",
    kind: "event",
    // Composite vulnerability per spec §5 — use all available Iter-1 criteria.
    vulnerabilityCriteria: [
      "psych.emotional_stability",
      "behavioral.teamwork",
      "physical.vo2max",
    ],
    citations: [
      "10.3402/ijch.v63i2.17702", // Palinkas 2004 — Antarctic evacuation incidence
    ],
  },
  {
    id: "comms-delay-coping-failure",
    label: "Communication-delay coping failure",
    family: "performance",
    kind: "rate",
    // Iter-2 will add comms-delay-tolerance criterion.
    vulnerabilityCriteria: [],
    citations: [
      "landon-communication-delay-research-state", // Landon n.d.
      "10.3389/fpsyg.2022.877509", // Verhoeven 2022 — multiteam systems LDE
    ],
  },

  // ── Iter-3 v2 expansion: 18 new conditions (conditions 13–30) ─────────────
  // Mean log-lambda priors for each are in synthetic-iter3.ts CONDITION_MEAN_LOG.
  // Citation slugs reference research/evidence/<slug>.md or direct DOIs.

  // ── Musculoskeletal ──────────────────────────────────────────────────────────
  {
    id: "low-back-pain",
    label: "Low-back pain episode",
    family: "musculoskeletal",
    kind: "rate",
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — sedentary I&C effects
      "10.1186/s12868-022-00723-x", // Abeln 2022 — Mars500/SIRIUS exercise and deconditioning
    ],
  },
  {
    id: "deconditioning-cardiorespiratory",
    label: "Cardiorespiratory deconditioning (VO₂max drop >10%)",
    family: "musculoskeletal",
    kind: "rate",
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.1186/s12868-022-00723-x", // Abeln 2022 — 10–15% VO₂max decline in sedentary controls
      "10.3389/fphys.2022.963301", // Shved 2022 — isolation/crowding exercise countermeasures
    ],
  },

  // ── Physiologic ─────────────────────────────────────────────────────────────
  {
    id: "upper-respiratory-infection",
    label: "Acute upper-respiratory infection",
    family: "physiologic",
    kind: "rate",
    // Rate is near-zero in true prolonged isolation (viral transmission blocked);
    // ~0.10/py captures early-phase or crew-rotation exposure windows.
    vulnerabilityCriteria: [],
    citations: [
      "10.3389/fimmu.2021.697435", // Ponomarev 2021 — no viral infections in 520d Mars-500
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — I&C immune effects
    ],
  },
  {
    id: "gastrointestinal-complaint",
    label: "Gastrointestinal complaint (constipation / nausea / diarrhoea)",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: [],
    citations: [
      "10.1186/s12868-022-00723-x", // Abeln 2022 — dietary changes in Mars500/SIRIUS
      "10.3389/fphys.2022.963301", // Shved 2022 — GI and microbiome under I&C
    ],
  },
  {
    id: "weight-loss-significant",
    label: "Significant body-mass loss (>3%)",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — nutritional/caloric deficit under I&C
      "10.1186/s12868-022-00723-x", // Abeln 2022 — body-composition changes in long-duration analogs
    ],
  },
  {
    id: "dental-problem",
    label: "Dental complaint (pain, abscess, fracture)",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: [],
    citations: [
      "10.1016/j.jss.2019.09.065", // Robertson 2020 — dental among 30 prioritised medical events in space/analog
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — general medical burden I&C
    ],
  },
  {
    id: "skin-complaint",
    label: "Dermatological complaint (rash, fungal, abrasion)",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: [],
    citations: [
      "10.3389/fimmu.2021.697435", // Ponomarev 2021 — dermatological manifestations under isolation stress
      "10.3389/fphys.2022.963301", // Shved 2022 — humidity-related skin issues in I&C habitats
    ],
  },
  {
    id: "headache-tension",
    label: "Tension / stress headache episode",
    family: "physiologic",
    kind: "rate",
    vulnerabilityCriteria: ["psych.emotional_stability"],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — somatic complaints in Mars500 crew
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — stress-related somatic symptoms in Antarctic
    ],
  },
  {
    id: "thermal-regulatory-challenge",
    label: "Thermal-regulation challenge (hypothermia / hyperthermia risk)",
    family: "physiologic",
    kind: "rate",
    // Relevant primarily for Antarctic-type and outdoor-EVA missions;
    // rate near-zero for climate-stable indoor habitats.
    vulnerabilityCriteria: ["physical.vo2max"],
    citations: [
      "10.1152/japplphysiol.00928.2015", // Pagel & Choukèr 2016 — thermal stress under I&C
      "10.3389/fphys.2022.963301", // Shved 2022 — cold-environment physiologic strain
    ],
  },

  // ── Psychiatric ──────────────────────────────────────────────────────────────
  {
    id: "third-quarter-phenomenon",
    label: "Third-quarter morale / motivation dip",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.resilience_cdrisc", "psych.bdi2_baseline"],
    citations: [
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — third-quarter phenomenon in Antarctic missions
      "10.1002/smi.3006", // Tortello 2020 — Antarctic coping and morale trajectories
    ],
  },
  {
    id: "monotony-boredom",
    label: "Significant monotony / boredom episode",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.emotional_intelligence"],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — sedentary under-stimulation in Mars500
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — psychological hibernation and boredom
    ],
  },
  {
    id: "sleep-aid-reliance",
    label: "Habitual sleep-aid use (≥3 consecutive days)",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.bdi2_baseline", "psych.emotional_stability"],
    citations: [
      "10.1152/japplphysiol.00606.2016", // Pattyn 2017 — Antarctic polar insomnia and pharmacology
      "10.3389/fnhum.2026.1720237", // Glos 2026 — 4-month isolation sleep and hypnotics
    ],
  },
  {
    id: "seasonal-affective-response",
    label: "Light-deprivation seasonal affective response",
    family: "psychiatric",
    kind: "rate",
    // Primarily relevant for Antarctic winter-over; rate near-zero in
    // tropical-latitude heated-habitat analogs (HI-SEAS, MDRS, EMMPOL).
    vulnerabilityCriteria: ["psych.emotional_stability", "psych.resilience_cdrisc"],
    citations: [
      "10.3402/ijch.v63i2.17702", // Palinkas 2004 — ~10% SAD prevalence Antarctic winter-over
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — polar photoperiod and mood
    ],
  },
  {
    id: "autonomy-frustration",
    label: "Autonomy / agency frustration episode",
    family: "psychiatric",
    kind: "rate",
    vulnerabilityCriteria: ["psych.emotional_intelligence"],
    citations: [
      "10.3389/fpsyg.2018.02235", // Sandal 2018 — autonomy loss as top Antarctic stressor
      "10.3389/fpsyg.2019.00811", // Bell 2019 — leadership and autonomy in LDM crews
    ],
  },

  // ── Performance ─────────────────────────────────────────────────────────────
  {
    id: "sustained-cognitive-decrement",
    label: "Sustained cognitive performance decrement (>1 week)",
    family: "performance",
    kind: "rate",
    vulnerabilityCriteria: ["cognitive.nasa_cognition_battery"],
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — 1/6 Mars500 crew sustained PVT/cognitive decline
      "10.3389/fnhum.2026.1720237", // Glos 2026 — 4-month isolation cognitive trajectory
    ],
  },
  {
    id: "operational-error",
    label: "Significant operational or procedural error",
    family: "performance",
    kind: "event",
    vulnerabilityCriteria: ["cognitive.nasa_cognition_battery"],
    citations: [
      "10.1089/ast.2013.1128", // Luger 2014 — MARS2013: field-crew medical/operational incidents
      "10.3389/fpsyg.2022.877509", // Verhoeven 2022 — multiteam systems and procedural failures
    ],
  },

  // ── Team ────────────────────────────────────────────────────────────────────
  {
    id: "leadership-challenge",
    label: "Leadership crisis or challenge episode",
    family: "team",
    kind: "rate",
    vulnerabilityCriteria: ["behavioral.teamwork", "psych.emotional_intelligence"],
    citations: [
      "10.3389/fpsyg.2019.00811", // Bell 2019 — leadership dynamics in long-duration missions
      "10.1108/S1534-085620160000018007", // Roma & Bedwell 2017 — team dynamics analog missions
    ],
  },
  {
    id: "role-ambiguity-conflict",
    label: "Crew role-ambiguity or role-boundary conflict",
    family: "team",
    kind: "rate",
    vulnerabilityCriteria: ["behavioral.teamwork"],
    citations: [
      "10.1089/ast.2019.2035", // McMenamin 2020 — AMADEE-18 role structure and conflict
      "10.1108/S1534-085620160000018007", // Roma & Bedwell 2017 — structural role conflict in analogs
    ],
  },
];
