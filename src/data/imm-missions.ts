// src/data/imm-missions.ts
import type { IMMMission } from "../imm/types";

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
    evaSchedule: [30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 170, 175] },
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
    durationDays: 7, crewSize: 6, totalEVAs: 3, evaSchedule: [2, 4, 6] },
  { id: "analog-10d", label: "10-day campaign",
    kind: "analog-controlled",
    durationDays: 10, crewSize: 6, totalEVAs: 4, evaSchedule: [2, 4, 6, 8] },
  { id: "analog-14d", label: "14-day campaign",
    kind: "analog-controlled",
    durationDays: 14, crewSize: 6, totalEVAs: 6,
    evaSchedule: [3, 5, 7, 9, 11, 13] },
  { id: "analog-22d", label: "22-day campaign",
    kind: "analog-controlled",
    durationDays: 22, crewSize: 6, totalEVAs: 5, evaSchedule: [4, 8, 12, 16, 20] },
  { id: "analog-45d", label: "45-day campaign",
    kind: "analog-controlled",
    durationDays: 45, crewSize: 6, totalEVAs: 8,
    evaSchedule: [5, 12, 18, 24, 30, 36, 40, 43] },
  { id: "analog-90d", label: "90-day campaign",
    kind: "analog-controlled",
    durationDays: 90, crewSize: 6, totalEVAs: 14,
    evaSchedule: Array.from({length: 14}, (_, i) => 6 + i * 6) },
  { id: "antarctic-winter", label: "365-day campaign",
    kind: "antarctic-station",
    durationDays: 365, crewSize: 12, totalEVAs: 24,
    evaSchedule: Array.from({length: 24}, (_, i) => Math.round((i + 1) * 365 / 25)) },
  { id: "analog-520d", label: "520-day campaign",
    kind: "analog-controlled",
    durationDays: 520, crewSize: 6, totalEVAs: 30,
    evaSchedule: Array.from({length: 30}, (_, i) => Math.round((i + 1) * 520 / 31)) },
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
  m => m.kind === "analog-isolation" || m.kind === "analog-controlled" || m.kind === "antarctic-station" || m.kind === "leo-iss",
);

/**
 * Future-scoped missions, catalogued for the docs/future_features.md roadmap.
 * Engine paths that reference these (calibration.ts K15_TABLE1_REF) keep them
 * available; the UI picker does not.
 */
export const FUTURE_MISSIONS: IMMMission[] = IMM_MISSIONS.filter(
  m => m.kind === "lunar-artemis-future" || m.kind === "interplanetary-mars-future",
);
