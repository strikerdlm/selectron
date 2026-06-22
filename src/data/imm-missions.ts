// src/data/imm-missions.ts
import type { AnalogMissionProfile, IMMMission } from "../imm/types";

function profile(
  overrides: {
    setting?: AnalogMissionProfile["environment"]["setting"];
    privacyLevel?: AnalogMissionProfile["habitat"]["privacyLevel"];
    sleepingArrangement?: AnalogMissionProfile["habitat"]["sleepingArrangement"];
    altitudeM?: number;
    hypoxia?: AnalogMissionProfile["environment"]["hypoxia"];
    temperatureExposure?: AnalogMissionProfile["environment"]["temperatureExposure"];
    outsideExposure?: AnalogMissionProfile["environment"]["outsideExposure"];
    autonomyLevel?: AnalogMissionProfile["operations"]["autonomyLevel"];
    workload?: AnalogMissionProfile["operations"]["workload"];
    shiftDesign?: AnalogMissionProfile["operations"]["shiftDesign"];
    circadianLightControl?: AnalogMissionProfile["operations"]["circadianLightControl"];
    researchBurden?: AnalogMissionProfile["operations"]["researchBurden"];
    delaySec?: number;
    communicationSchedule?: AnalogMissionProfile["communication"]["schedule"];
    missionControl?: AnalogMissionProfile["communication"]["missionControl"];
    supportTeam?: AnalogMissionProfile["communication"]["supportTeam"];
    resupply?: AnalogMissionProfile["logistics"]["resupply"];
    foodConstraint?: AnalogMissionProfile["logistics"]["foodConstraint"];
    hygieneConstraint?: AnalogMissionProfile["logistics"]["hygieneConstraint"];
    provider?: AnalogMissionProfile["medicalSupport"]["provider"];
    telemedicine?: AnalogMissionProfile["medicalSupport"]["telemedicine"];
    evacuationTimeHours?: number;
    emergencyProcedures?: AnalogMissionProfile["medicalSupport"]["emergencyProcedures"];
    countermeasureLevel?: AnalogMissionProfile["medicalSupport"]["countermeasureLevel"];
    roleStructure?: AnalogMissionProfile["crew"]["roleStructure"];
    priorAcquaintance?: AnalogMissionProfile["crew"]["priorAcquaintance"];
    languageCulture?: AnalogMissionProfile["crew"]["languageCulture"];
    trainingLevel?: AnalogMissionProfile["crew"]["trainingLevel"];
    evaType?: AnalogMissionProfile["eva"]["type"];
    terrain?: AnalogMissionProfile["eva"]["terrain"];
    equipmentHazard?: AnalogMissionProfile["eva"]["equipmentHazard"];
    evidenceGrade?: AnalogMissionProfile["evidenceGrade"];
    citations: string[];
  },
): AnalogMissionProfile {
  return {
    habitat: {
      name: overrides.setting === "antarctic-station" ? "Antarctic station" : "Controlled analog habitat",
      privacyLevel: overrides.privacyLevel ?? "partial",
      sleepingArrangement: overrides.sleepingArrangement ?? "partitioned",
    },
    environment: {
      setting: overrides.setting ?? "controlled-habitat",
      altitudeM: overrides.altitudeM,
      hypoxia: overrides.hypoxia ?? "none",
      temperatureExposure: overrides.temperatureExposure ?? "controlled",
      outsideExposure: overrides.outsideExposure ?? "limited",
    },
    operations: {
      autonomyLevel: overrides.autonomyLevel ?? "moderate",
      workload: overrides.workload ?? "moderate",
      shiftDesign: overrides.shiftDesign ?? "day-shift",
      circadianLightControl: overrides.circadianLightControl ?? "scheduled",
      researchBurden: overrides.researchBurden ?? "moderate",
    },
    communication: {
      delaySec: overrides.delaySec ?? 0,
      schedule: overrides.communicationSchedule ?? "continuous",
      missionControl: overrides.missionControl ?? "remote",
      supportTeam: overrides.supportTeam ?? "standard",
    },
    logistics: {
      resupply: overrides.resupply ?? "limited",
      foodConstraint: overrides.foodConstraint ?? "moderate",
      hygieneConstraint: overrides.hygieneConstraint ?? "moderate",
    },
    medicalSupport: {
      provider: overrides.provider ?? "cmo",
      telemedicine: overrides.telemedicine ?? "video",
      evacuationTimeHours: overrides.evacuationTimeHours,
      emergencyProcedures: overrides.emergencyProcedures ?? "documented",
      countermeasureLevel: overrides.countermeasureLevel ?? "analog",
    },
    crew: {
      roleStructure: overrides.roleStructure ?? "defined",
      priorAcquaintance: overrides.priorAcquaintance ?? "unknown",
      languageCulture: overrides.languageCulture ?? "mixed",
      trainingLevel: overrides.trainingLevel ?? "standard",
    },
    eva: {
      type: overrides.evaType ?? "terrain-field",
      terrain: overrides.terrain ?? "volcanic",
      equipmentHazard: overrides.equipmentHazard ?? "moderate",
    },
    evidenceGrade: overrides.evidenceGrade ?? "development",
    citations: overrides.citations,
  };
}

/**
 * Full mission catalog including future-scoped (lunar Artemis, Mars TM21)
 * destinations. Future-tagged missions remain in the catalog so the engine
 * code paths stay live (calibration.ts K15_TABLE1_REF still references the
 * TM21 references for forward-compat), but they are EXCLUDED from
 * `ACTIVE_MISSIONS` and therefore from the CrewComposition mission picker.
 *
 * To re-enable Mars or Artemis: see `docs/future_features.md` for the
 * engine-extension requirements (comms-delay treatment degradation,
 * cumulative-dose pathways, partial-gravity EVA risk profiles). Without
 * those extensions the priors do not generalize beyond ISS / Earth analog
 * — see `docs/iter5_scientific_limitations.md` for the underlying analysis.
 */
export const IMM_MISSIONS: IMMMission[] = [
  // ── LEO / ISS-baseline (operational calibration anchors) ──────────────────
  { id: "iss-6mo", label: "ISS 6 month (K15 reference)",
    kind: "leo-iss",
    durationDays: 180, crewSize: 6, totalEVAs: 12,
    evaSchedule: [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 170, 175],
    profile: profile({
      setting: "leo-reference", privacyLevel: "partial", sleepingArrangement: "shared",
      outsideExposure: "routine", autonomyLevel: "low", workload: "high",
      shiftDesign: "continuous-ops", delaySec: 0, missionControl: "remote",
      supportTeam: "full", resupply: "scheduled", provider: "cmo",
      telemedicine: "video", emergencyProcedures: "rehearsed", countermeasureLevel: "station",
      roleStructure: "mission-like", trainingLevel: "extensive", evaType: "iss-reference",
      terrain: "orbital", equipmentHazard: "high", evidenceGrade: "scenario",
      citations: ["research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md"],
    }) },
  { id: "iss-drm1", label: "ISS DRM1 (S20)",
    kind: "leo-iss",
    durationDays: 365, crewSize: 6, totalEVAs: 20,
    evaSchedule: Array.from({length: 20}, (_, i) => Math.round((i + 1) * 365 / 21)) },
  { id: "iss-drm2", label: "ISS DRM2 (S20)",
    kind: "leo-iss",
    durationDays: 180, crewSize: 6, totalEVAs: 10,
    evaSchedule: Array.from({length: 10}, (_, i) => Math.round((i + 1) * 180 / 11)) },

  // ── FUTURE: TM21 Mars DRMs (catalogued for forward compat; not in picker) ──
  //   Re-enable after structural engine extensions land per future_features.md.
  { id: "amm-426d", label: "Accelerated Mars Mission (TM21 AMM — FUTURE)",
    kind: "interplanetary-mars-future",
    durationDays: 426, crewSize: 4, totalEVAs: 60,
    evaSchedule: Array.from({length: 60}, (_, i) => 180 + Math.floor(i / 2)) },
  { id: "smm-923d", label: "Standard Mars Mission (TM21 SMM — FUTURE)",
    kind: "interplanetary-mars-future",
    durationDays: 923, crewSize: 4, totalEVAs: 401,
    evaSchedule: Array.from({length: 401}, (_, i) => 200 + Math.floor(i * 1.5)) },

  // ── Earth-based analog missions (active) ──────────────────────────────────
  //   2026-06-04: split `analog-isolation` into `analog-controlled` (heated
  //   habitat: MDRS/HI-SEAS/EMMPOL/THOR) and `antarctic-station` (occupationally
  //   exposed: extreme cold, high altitude, chronic hypoxia). ID strings are
  //   preserved so persisted Dexie IMMSession rows still load.
  { id: "analog-7d", label: "7-day campaign",
    kind: "analog-controlled",
    durationDays: 7, crewSize: 6, totalEVAs: 3, evaSchedule: [2, 4, 6],
    profile: profile({
      delaySec: 0, communicationSchedule: "continuous", workload: "moderate",
      resupply: "available", evacuationTimeHours: 2, citations: ["10.1089/ast.2019.2035"],
    }) },
  { id: "analog-10d", label: "10-day campaign",
    kind: "analog-controlled",
    durationDays: 10, crewSize: 6, totalEVAs: 4, evaSchedule: [2, 4, 6, 8],
    profile: profile({
      delaySec: 600, communicationSchedule: "scheduled", workload: "moderate",
      evacuationTimeHours: 2, citations: ["10.1007/s00421-024-05575-3"],
    }) },
  { id: "analog-14d", label: "14-day campaign",
    kind: "analog-controlled",
    durationDays: 14, crewSize: 6, totalEVAs: 6,
    evaSchedule: [3, 5, 7, 9, 11, 13],
    profile: profile({
      delaySec: 300, communicationSchedule: "scheduled", workload: "moderate",
      evacuationTimeHours: 4, citations: ["10.1089/space.2020.0048"],
    }) },
  { id: "analog-22d", label: "22-day campaign",
    kind: "analog-controlled",
    durationDays: 22, crewSize: 6, totalEVAs: 5, evaSchedule: [4, 8, 12, 16, 20],
    profile: profile({
      workload: "high", researchBurden: "high", delaySec: 300,
      missionControl: "remote", evacuationTimeHours: 3,
      citations: ["10.17981/JACN.4.2.2023.4"],
    }) },
  { id: "analog-45d", label: "45-day campaign",
    kind: "analog-controlled",
    durationDays: 45, crewSize: 6, totalEVAs: 8,
    evaSchedule: [5, 12, 18, 24, 30, 36, 40, 43],
    profile: profile({
      delaySec: 1200, communicationSchedule: "delayed-windowed",
      missionControl: "remote-delayed", autonomyLevel: "high", resupply: "none",
      foodConstraint: "high", hygieneConstraint: "moderate", evacuationTimeHours: 8,
      citations: ["10.1089/space.2020.0048"],
    }) },
  { id: "analog-90d", label: "90-day campaign",
    kind: "analog-controlled",
    durationDays: 90, crewSize: 6, totalEVAs: 14,
    evaSchedule: Array.from({length: 14}, (_, i) => 6 + i * 6),
    profile: profile({
      delaySec: 1200, communicationSchedule: "delayed-windowed",
      missionControl: "remote-delayed", autonomyLevel: "high", workload: "high",
      resupply: "none", foodConstraint: "high", evacuationTimeHours: 8,
      citations: ["10.3389/fphys.2022.898841"],
    }) },
  { id: "antarctic-winter", label: "365-day campaign",
    kind: "antarctic-station",
    durationDays: 365, crewSize: 12, totalEVAs: 24,
    evaSchedule: Array.from({length: 24}, (_, i) => Math.round((i + 1) * 365 / 25)),
    profile: profile({
      setting: "antarctic-station", privacyLevel: "partial", sleepingArrangement: "shared",
      altitudeM: 2800, hypoxia: "moderate", temperatureExposure: "cold",
      outsideExposure: "routine", autonomyLevel: "moderate", workload: "surge",
      shiftDesign: "continuous-ops", circadianLightControl: "polar",
      missionControl: "remote", supportTeam: "standard", resupply: "scheduled",
      foodConstraint: "moderate", hygieneConstraint: "moderate", provider: "physician",
      telemedicine: "video", evacuationTimeHours: 72, emergencyProcedures: "rehearsed",
      countermeasureLevel: "station", roleStructure: "defined", languageCulture: "international",
      trainingLevel: "extensive", evaType: "polar-field", terrain: "ice",
      equipmentHazard: "high", citations: ["10.3402/ijch.v63i2.17702", "10.1002/wsbm.1556"],
    }) },
  { id: "analog-520d", label: "520-day campaign",
    kind: "analog-controlled",
    durationDays: 520, crewSize: 6, totalEVAs: 30,
    evaSchedule: Array.from({length: 30}, (_, i) => Math.round((i + 1) * 520 / 31)),
    profile: profile({
      delaySec: 1320, communicationSchedule: "delayed-windowed",
      missionControl: "remote-delayed", autonomyLevel: "high", workload: "high",
      shiftDesign: "continuous-ops", resupply: "none", foodConstraint: "high",
      hygieneConstraint: "high", evacuationTimeHours: 24, roleStructure: "mission-like",
      trainingLevel: "extensive", citations: ["10.1371/journal.pone.0093298", "10.3357/ASEM.3612.2013"],
    }) },
];

/**
 * Active mission set — excludes future-tagged destinations. Use this in the
 * UI picker, in default IMMSession initialisation, and in any new validation
 * tests. Engine code that needs the full catalog (e.g. K15 reference lookup)
 * can still import `IMM_MISSIONS` directly.
 *
 * 2026-06-04: filter expanded to include the two new `analog-controlled` and
 * `antarctic-station` kinds. Legacy `analog-isolation` rows (none remain in the
 * active catalog) still pass through for any persisted Dexie session that
 * references a kind literal removed by the retag.
 */
export const ACTIVE_MISSIONS: IMMMission[] = IMM_MISSIONS.filter(
  m => m.kind === "analog-isolation" || m.kind === "analog-controlled" || m.kind === "antarctic-station",
);

/** Developer/verification benchmarks, not analog-facing operational profiles. */
export const BENCHMARK_MISSIONS: IMMMission[] = IMM_MISSIONS.filter(
  m => m.kind === "leo-iss",
);

/**
 * Future-scoped missions, catalogued for the docs/future_features.md roadmap.
 * Engine paths that reference these (calibration.ts K15_TABLE1_REF) keep them
 * available; the UI picker does not.
 */
export const FUTURE_MISSIONS: IMMMission[] = IMM_MISSIONS.filter(
  m => m.kind === "lunar-artemis-future" || m.kind === "interplanetary-mars-future",
);
