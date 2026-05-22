// src/data/imm-preset-crews.ts
// IMM-49: canonical preset crew configurations for the Crew Composition view's
// quick-load dropdown. Each preset materialises a complete `IMMCrewMember[]`
// (no Stage A scores attached — the CrewComposition view will recompute
// composite/gate verdicts from the bare risk-factor flags, falling back to the
// "no scores" branch in `aggregateCrewComposite` which yields 0 per member).
//
// Provenance notes per preset are in the JSDoc next to each `members` array.
//
// IMPORTANT: do NOT import from `src/imm/calibration.ts` — it pulls `node:fs`
// and would break the browser bundle. The K15 reference crew below is inlined
// verbatim from `K15_REFERENCE_CREW` in calibration.ts.

import type { IMMCrewMember } from "../imm/types";

export type IMMPresetCrew = {
  key: string;
  label: string;
  members: IMMCrewMember[];
};

/**
 * K15 Table 1 reference crew (Keenan 2015 §III).
 * 4M, 2F; 1 CAC+; 3 contacts; 2 crowns; 1 abdo-surg; 2 EVA-eligible × 6 EVAs each.
 * Inlined verbatim from `src/imm/calibration.ts::K15_REFERENCE_CREW`.
 */
const K15_REFERENCE: IMMCrewMember[] = [
  { id: "preset-k15-1", sex: "male",   contacts: true,  crowns: true,  CAC_positive: true,  abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "preset-k15-2", sex: "male",   contacts: true,  crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 6 },
  { id: "preset-k15-3", sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-k15-4", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-k15-5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-k15-6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 0 },
];

/**
 * MDRS 6-person 2-week rotation (Mars Desert Research Station, Hanksville UT).
 * Short surface walks count as EVAs (~1 per crew member over a 2-week rotation).
 * 3M / 3F. All low-risk profile: no CAC, no crowns, no contacts, no abdo-surg.
 */
const MDRS_ROTATION: IMMCrewMember[] = [
  { id: "preset-mdrs-1", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
  { id: "preset-mdrs-2", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
  { id: "preset-mdrs-3", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
  { id: "preset-mdrs-4", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
  { id: "preset-mdrs-5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
  { id: "preset-mdrs-6", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 1 },
];

/**
 * HI-SEAS Mission VI 6-person 6-month crew (Hawai'i Space Exploration Analog
 * & Simulation, Mauna Loa). Ages ~30s, mostly low-risk; 2 EVA-eligible × 8
 * EVAs each per the Mission VI protocol's surface-walk cadence.
 * 3M / 3F.
 */
const HI_SEAS_6MO: IMMCrewMember[] = [
  { id: "preset-hi-seas-1", sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 8 },
  { id: "preset-hi-seas-2", sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-hi-seas-3", sex: "male",   contacts: false, crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-hi-seas-4", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 8 },
  { id: "preset-hi-seas-5", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
  { id: "preset-hi-seas-6", sex: "female", contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: false, EVA_count: 0 },
];

/**
 * Antarctic 12-person winter-over (e.g. South Pole Amundsen-Scott / Concordia).
 * Typical demographic mix per Palinkas (2003) / Pattarini (2016): 8M/4F; broader
 * range of pre-existing risk factors than space-analog crews due to looser
 * select-in. Low EVA count per person — "EVAs" here are short outside-station
 * traverses in extreme cold.
 */
const ANTARCTIC_WINTER: IMMCrewMember[] = [
  { id: "preset-antarctic-1",  sex: "male",   contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 2 },
  { id: "preset-antarctic-2",  sex: "male",   contacts: false, crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 2 },
  { id: "preset-antarctic-3",  sex: "male",   contacts: false, crowns: false, CAC_positive: true,  abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-4",  sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: true,  EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-5",  sex: "male",   contacts: true,  crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 2 },
  { id: "preset-antarctic-6",  sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 2 },
  { id: "preset-antarctic-7",  sex: "male",   contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-8",  sex: "male",   contacts: false, crowns: true,  CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-9",  sex: "female", contacts: true,  crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-10", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: true,  EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-11", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
  { id: "preset-antarctic-12", sex: "female", contacts: false, crowns: false, CAC_positive: false, abdominal_surgery_history: false, EVA_eligible: true,  EVA_count: 1 },
];

export const PRESET_CREWS: Record<string, IMMPresetCrew> = {
  "k15-reference": {
    key: "k15-reference",
    label: "K15 reference (6-person ISS)",
    members: K15_REFERENCE,
  },
  "mdrs-rotation": {
    key: "mdrs-rotation",
    label: "MDRS 6-person rotation",
    members: MDRS_ROTATION,
  },
  "hi-seas-6mo": {
    key: "hi-seas-6mo",
    label: "HI-SEAS 6-month",
    members: HI_SEAS_6MO,
  },
  "antarctic-winter": {
    key: "antarctic-winter",
    label: "Antarctic winter-over (12-person)",
    members: ANTARCTIC_WINTER,
  },
};

/** Preset keys in display order. */
export const PRESET_KEYS = [
  "k15-reference",
  "mdrs-rotation",
  "hi-seas-6mo",
  "antarctic-winter",
] as const;
