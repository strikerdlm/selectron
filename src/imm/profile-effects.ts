// src/imm/profile-effects.ts
//
// F2: explicit, versioned mapping from mission-profile fields to modeled effects.
// Populated accepted estimates are applied only in adjudicated profile-effect
// mode; proposal estimates require explicit exploratory mode.

export type ProfileEffectTarget =
  | "incidence"
  | "severity"
  | "treatment-delay"
  | "recovery";

export type ProfileEffectModel =
  | "log-hazard"
  | "odds-ratio"
  | "time-shift"
  | "exposure-time"
  | "resource-gating";

export type ProfileEffectEvidenceStatus =
  | "accepted"
  | "proposal"
  | "unsupported";

export type ProfileEffectMode = "off" | "exploratory" | "adjudicated";

export type ProfileEffect = {
  profilePath: string;
  conditionId?: string;
  target: ProfileEffectTarget;
  model: ProfileEffectModel;
  estimate: number | null;
  uncertainty?: unknown;
  evidenceStatus: ProfileEffectEvidenceStatus;
  sourceIds: string[];
  note: string;
};

export const PROFILE_EFFECTS: readonly ProfileEffect[] = [
  {
    profilePath: "mission.durationDays",
    target: "incidence",
    model: "exposure-time",
    estimate: 1.0,
    evidenceStatus: "accepted",
    sourceIds: ["imm-k15"],
    note: "Per-condition λ scaled by mission duration (Poisson exposure time).",
  },
  {
    profilePath: "mission.kind",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "proposal",
    sourceIds: ["imm-priors.kind_multipliers"],
    note: "Per-(kind, condition) incidence multipliers from imm-priors.json (proposal-stage).",
  },
  {
    profilePath: "mission.evaSchedule",
    target: "incidence",
    model: "exposure-time",
    estimate: 1.0,
    evidenceStatus: "accepted",
    sourceIds: ["imm-k15"],
    note: "Space-EVA-coupled conditions sampled at scheduled EVA times for ISS/future space runs; terrestrial analogs exclude these priors.",
  },
  {
    profilePath: "kit.resources",
    target: "treatment-delay",
    model: "resource-gating",
    estimate: null,
    evidenceStatus: "proposal",
    sourceIds: ["imm-k15", "health-support"],
    note: "Kit RAF and delivery-class gating modulate treatment paths (proposal-stage).",
  },
  {
    profilePath: "profile.communication.delaySec",
    target: "incidence",
    model: "log-hazard",
    estimate: 0.12,
    evidenceStatus: "proposal",
    sourceIds: ["10.1371/journal.pone.0093298"],
    note:
      "Exploratory operator-selected I&C sensitivity lever: log10(1 + delayMin) scaling on " +
      "behavioral/psychiatric incidence. The cited Mars-500 literature does not identify this " +
      "as an isolated communication-delay hazard coefficient.",
  },
  {
    profilePath: "profile.habitat.privacyLevel",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.habitat.sleepingArrangement",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.operations.workload",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.operations.circadianLightControl",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.operations.autonomyLevel",
    target: "treatment-delay",
    model: "time-shift",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.logistics.hygieneConstraint",
    target: "incidence",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.medicalSupport.evacuationTimeHours",
    target: "severity",
    model: "log-hazard",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; no modeled effect.",
  },
  {
    profilePath: "profile.eva.type",
    target: "incidence",
    model: "exposure-time",
    estimate: null,
    evidenceStatus: "unsupported",
    sourceIds: [],
    note: "Descriptive only; terrestrial analog field-EVA hazards require separate analog-specific exposure denominators and priors.",
  },
];

export const DESCRIPTIVE_ONLY_FIELDS: readonly ProfileEffect[] = PROFILE_EFFECTS.filter(
  (e) => e.evidenceStatus === "unsupported",
);

export const ISOLATION_CONFINEMENT_EXPOSURE_MODELED: boolean = PROFILE_EFFECTS.some(
  (e) =>
    e.evidenceStatus === "accepted" &&
    e.profilePath.startsWith("profile."),
);

export const PROFILE_MAPPING_VERSION = "2026-06-v0.6-rebaseline";
