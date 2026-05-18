import type { AnalogMission } from "@/types";

// Iter-3 v1 analog-mission catalog (spec §6).
// Five canonical analog-mission profiles spanning the most studied
// isolation-and-confinement (I&C) settings in the analog literature.
// Each profile carries:
//   - countermeasures as Record<id, availability ∈ [0,1]>. The Stage-B
//     simulator queries this map during the treatment-path step.
//   - citations as a list of DOIs/slugs that ground the profile choice.
//     Slugs without DOI prefix point to research/evidence/ markdowns.
//
// Numeric mid-points used when the spec table gives a range:
//   - mdrs comms delay: 0–600 → 300 (midpoint)
//   - emmpol-6 duration: 8–14 → 10
//   - emmpol-6 comms delay: "varies" → 600 (typical short-delay sim)
//
// EVA counts are pulled from the cited primary mission reports; "yes (sim)"
// in the spec table is rendered as a concrete sim-EVA count drawn from the
// nearest published study.
export const ANALOG_MISSIONS: readonly AnalogMission[] = [
  {
    id: "antarctic-winter-over",
    type: "antarctic",
    label: "Antarctic winter-over (Concordia-class station)",
    durationDays: 365,
    crewSize: 12,
    evaCount: 0,
    commsDelaySec: 0,
    countermeasures: {
      exercise: 1,
      "social-comms-realtime": 1,
      "psych-support": 1,
    },
    citations: [
      "10.3402/ijch.v63i2.17702", // Palinkas 2004 — Antarctic psychiatric incidence baseline
      "10.1002/wsbm.1556", // Spinelli & Werner 2022 — Antarctic physiology
    ],
  },
  {
    id: "mars500-520d",
    type: "mars500",
    label: "Mars500 — 520-day Mars-mission simulation",
    durationDays: 520,
    crewSize: 6,
    evaCount: 0,
    commsDelaySec: 1320, // one-way comms delay during Mars-orbit phase
    countermeasures: {
      exercise: 1,
      "comms-delayed": 1,
      "psych-support": 1,
      "automated-psychotherapy": 1,
    },
    citations: [
      "10.1371/journal.pone.0093298", // Basner 2014 — Mars500 psych/behavior
      "10.1186/s12868-022-00723-x", // Abeln 2022 — Mars500/SIRIUS exercise
      "10.3357/ASEM.3612.2013", // Vigo 2013 — Mars500 circadian/HRV
      "10.1016/j.actaastro.2013.05.001", // Tafforin 2013 — Mars500 ethology
    ],
  },
  {
    id: "hi-seas-90d",
    type: "hi-seas",
    label: "HI-SEAS Mauna Loa habitat — 90-day mission",
    durationDays: 90,
    crewSize: 6,
    evaCount: 12, // HI-SEAS missions log ~1 sim-EVA per week
    commsDelaySec: 1200, // 20-min one-way sim delay
    countermeasures: {
      exercise: 1,
      "social-comms-delayed": 1,
      nutrition: 1,
    },
    citations: [
      "10.3389/fphys.2022.898841", // Dunn-Rosenberg 2022 — HI-SEAS biobehavioral stress
    ],
  },
  {
    id: "mdrs-2wk",
    type: "mdrs",
    label: "Mars Desert Research Station — 2-week rotation",
    durationDays: 14,
    crewSize: 6,
    evaCount: 5, // MDRS standard rotation logs ~5 EVAs per crew
    commsDelaySec: 300, // midpoint of spec's 0–600 s range
    countermeasures: {
      exercise: 1,
      "social-comms-realtime": 1,
    },
    citations: [
      "10.1089/space.2020.0048", // Cromwell 2021 — Earth-based analogs taxonomy
    ],
  },
  {
    id: "emmpol-6",
    type: "emmpol",
    label: "EMMPOL-6 — European Mars Mission analog (Polish Space Agency)",
    durationDays: 10, // midpoint of spec's 8–14 d range
    crewSize: 6,
    evaCount: 3,
    commsDelaySec: 600, // "varies" — typical short-delay sim
    countermeasures: {
      exercise: 1,
      "social-comms-realtime": 1,
    },
    citations: [
      "10.1007/s00421-024-05575-3", // Giacon 2024 — EMMPOL-6 stress biomarkers
    ],
  },
];
