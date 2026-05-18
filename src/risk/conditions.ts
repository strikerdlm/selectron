import type { Condition } from "@/types";

// Iter-3 v1 analog-condition catalog (spec §5).
// Twelve medical / behavioral / performance conditions selected to span the
// I&C evidence corpus (research/evidence/INDEX.md = 31 papers across Mars500,
// HI-SEAS, Antarctic, MDRS, EMMPOL, SIRIUS).
//
// vulnerabilityCriteria are the Stage-A criterion ids (Iter-1 placeholders
// here) that the candidate-vulnerability multiplier exp(β_k^T z_i) consumes.
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
    kind: "event",
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
];
