// Iter-3 risk-module types (spec §4.3).
// These are the contract between Stage A (Iter-1/2 selection scoring) and
// Stage B (analog-mission forward-Monte-Carlo simulator). They do NOT replace
// any Iter-1 type; the risk module imports `Candidate` and `Criterion` from
// Iter-1 and adds these on top.

export type MissionType =
  | "antarctic"
  | "mars500"
  | "hi-seas"
  | "mdrs"
  | "emmpol"
  | "thor";

// Countermeasure availability for a given mission profile. Keys are
// countermeasure ids (e.g. "exercise", "psych-support"); values are availability
// fractions in [0, 1]. A countermeasure absent from the record is treated as
// availability = 0. The Stage-B simulator uses this to compute the
// per-occurrence treatment fraction τ via the resource-gating lookup in
// src/risk/treatment.ts.
export type CountermeasureSet = Record<string, number>;

export type AnalogMission = {
  id: string; // e.g. "antarctic-winter-over", "mars500-520d"
  type: MissionType;
  label: string;
  durationDays: number;
  crewSize: number;
  evaCount: number;
  commsDelaySec: number; // 0 for Antarctic real-time; 1320 for Mars Distant-DRM
  countermeasures: CountermeasureSet;
  citations: string[]; // DOIs from research/evidence/ and research/imm_sources/
};

export type ConditionFamily =
  | "psychiatric"
  | "physiologic"
  | "musculoskeletal"
  | "performance"
  | "team";

export type ConditionKind = "rate" | "event";

export type Condition = {
  id: string; // e.g. "insomnia", "depression-anxiety"
  label: string;
  family: ConditionFamily;
  kind: ConditionKind; // "rate" → Poisson; "event" → Binomial
  vulnerabilityCriteria: string[]; // Iter-1/2 criterion ids that modulate λ
  citations: string[];
  // Optional behavior overrides for the conflict/team Bayesian layer.
  // When omitted, behavior is derived from `family` (see src/risk/condition-behavior.ts).
  scope?: "member" | "crew";
  temporal?: "stationary" | "latent";
  dispersion?: "poisson" | "negbin";
  frailtyCoupled?: boolean;
};

export type SimulationInterval = readonly [number, number];

export type RiskScenarioSummary = {
  mean: number;
  ci90: SimulationInterval;
  ci95?: SimulationInterval;
};

export type RiskScenarioResult = {
  chi: { mean: number; ci90: SimulationInterval; ci95: SimulationInterval };
  pEarlyTermination: { mean: number; ci90: SimulationInterval };
  expectedLostCrewDays: { mean: number; ci90: SimulationInterval };
  perConditionQTL: Record<string, RiskScenarioSummary>;
  ess: number;
  trials: number;
};
