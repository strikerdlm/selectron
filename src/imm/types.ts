// src/imm/types.ts

export type IMMConditionFamily =
  | "behavioral" | "cardiovascular" | "dental" | "dermatologic"
  | "ENT" | "endocrine" | "GI" | "GU" | "hematologic"
  | "infectious" | "musculoskeletal" | "neurologic" | "ophthalmologic"
  | "psychiatric" | "renal" | "respiratory" | "space-adaptation"
  | "toxicologic" | "traumatic";

export type IMMRiskFactor =
  | "sex-male" | "sex-female"
  | "contacts" | "crowns" | "CAC-positive"
  | "abdominal-surgery-history" | "EVA" | "SPE";

export type IMMProcessType =
  | "general-Poisson" | "space-adaptation-once"
  | "EVA-coupled" | "SPE-coupled" | "SA-VIIP-late";

export type IMMCondition = {
  id: string;
  label: string;
  family: IMMConditionFamily;
  incidenceSource: "in-flight" | "terrestrial" | "astronaut-pre-postflight" | "external-model";
  incidenceDist: "Gamma" | "Lognormal" | "Beta" | "Fixed";
  processType: IMMProcessType;
  riskFactors: IMMRiskFactor[];
  vulnerabilityCriteria: string[];
};

export type IMMBetaPert = { min: number; mode: number; max: number };

export type IMMConditionOutcomes = {
  fi_cp1: IMMBetaPert; dt_cp1_hours: IMMBetaPert;
  fi_cp2: IMMBetaPert; dt_cp2_hours: IMMBetaPert;
  fi_cp3: IMMBetaPert;
  p_evac: IMMBetaPert; p_locl: IMMBetaPert;
};

export type IMMPrior = {
  conditionId: string;
  provenance: "tierA-nasa" | "tierB-lit" | "tierB-pymc" | "tierC-synth" | "user-custom";
  source_ref: string;
  incidence: {
    distribution: "Lognormal-Poisson" | "Gamma-Poisson" | "Beta-Bernoulli" | "Fixed";
    mu_log_lambda?: number; sigma_log_lambda?: number;
    alpha?: number; beta?: number;
    lambda_fixed?: number;
    lambda_unit?: "events-per-person-day" | "events-per-EVA" | "events-per-SPE";
  };
  severity: { worst_case_prob_alpha: number; worst_case_prob_beta: number };
  treated: IMMConditionOutcomes;
  untreated: IMMConditionOutcomes;
  risk_factor_multipliers: Partial<Record<IMMRiskFactor, number>>;
  required_resources: Record<string, number>;
};

export type IMMCrewMember = {
  id: string;
  sex: "male" | "female";
  contacts: boolean;
  crowns: boolean;
  CAC_positive: boolean;
  abdominal_surgery_history: boolean;
  EVA_eligible: boolean;
  EVA_count: number;
  selectronStageACandidateId?: string;
  /**
   * Per-criterion Stage A scores (raw, instrument scale).
   * Keys are criterion IDs from PLACEHOLDER_CRITERIA / docs/criteria.md.
   * When present, used in `simulateIMM` to compute z-scored vulnerability multipliers
   * that modulate per-condition λ (gate-then-modulate, Commit 5).
   */
  stageAScores?: Record<string, number>;
};

/**
 * Mission taxonomy. Selectron v1 supports analog-isolation / analog-controlled /
 * antarctic-station / leo-iss — these are the operational scope for which the
 * IMM Calculator is calibrated and validated.
 *
 * v2026-06-04 — split `analog-isolation` into `analog-controlled` (heated,
 * climate-stable habitats: MDRS, HI-SEAS, EMMPOL, THOR) and `antarctic-station`
 * (occupationally exposed: extreme cold, high altitude at South Pole / Concordia,
 * chronic hypoxia, polar-night SAD). The legacy literal `analog-isolation` is
 * preserved for backward compatibility with persisted Dexie `IMMSession` rows
 * and the analog-missions analogue-catalog; the engine falls through to a 1.0
 * multiplier for the legacy kind, reproducing pre-2026-06-04 outputs.
 *
 * `lunar-artemis-future` and `interplanetary-mars-future` are catalogued for
 * forward compatibility but are FILTERED OUT of the active mission picker
 * because the engine does not yet model the structural risk drivers required
 * for those destinations (comms-delay treatment degradation, cumulative-dose
 * pathways, partial-gravity EVA risk profiles). See `docs/future_features.md`
 * for the implementation roadmap.
 */
export type IMMMissionKind =
  | "analog-isolation"            // LEGACY: heated-habitat + Antarctic (kept for Dexie backward compat)
  | "analog-controlled"           // Heated, climate-stable habitat (MDRS, HI-SEAS, EMMPOL, THOR)
  | "antarctic-station"           // Cold/altitude-exposed Antarctic winter-over
  | "leo-iss"                     // ISS expeditions and reference DRMs
  | "lunar-artemis-future"        // Artemis I/II/III/IV — planned future feature
  | "interplanetary-mars-future"; // TM21 AMM/SMM — planned future feature

export type IMMMission = {
  id: string;
  label: string;
  /** Mission category — controls whether the picker exposes it. */
  kind: IMMMissionKind;
  durationDays: number;
  crewSize: number;
  totalEVAs: number;
  evaSchedule: number[];
};

export type Telemedicine = "none" | "audio" | "video";
export type CareProvider = "none" | "cmo" | "physician";

export type IMMKitScenario = {
  scenarioId: "none" | "medium" | "issHMS" | "unlimited" | "custom";
  label: string;
  resources: Record<string, number>;
  /**
   * Health-support care capabilities (Health-Support feature, 2026-05-28).
   * Optional for backward-compat; absent → treated as full capability (identity).
   * UI-descriptive metadata only: the delivery-class gating in
   * src/imm/health-support.ts::gateAvailable keys off scenarioId/tierId, not this field.
   */
  capabilities?: { telemedicine: Telemedicine; provider: CareProvider };
};

export type PosteriorSummary = {
  mean: number; ci90: [number, number]; ci95: [number, number]; sd: number;
};

export type IMMOutcome = {
  tme: PosteriorSummary;
  chi: PosteriorSummary;
  pEvac: PosteriorSummary;
  pLocl: PosteriorSummary;
  /**
   * Mission Success Probability (×100, percent scale, same as pEvac/pLocl).
   * Fraction of trials where EVAC=0 AND LOCL=0 AND CHI >= chiStar×100.
   * chiStar defaults to 0.7 per spec §3.5 (Palinkas 2004 anchor).
   */
  missionSuccess: PosteriorSummary;
  perConditionDrivers: {
    conditionId: string;
    pEvacContrib: number; pLoclContrib: number; tmeContrib: number;
  }[];
  convergence: {
    trialCheckpoints: number[];
    sigmaChi: number[]; sigmaPevac: number[];
  };
  /**
   * Raw per-trial CHI samples (percent scale, 0–100).
   * Only populated when `diagnostics: true` is passed to `simulateIMM`.
   * Used by R-hat convergence tests (tests/imm/rhat_convergence.test.ts).
   */
  diagnostics?: { chiSamples: number[] };
};

// ── Crew-composite types (IMM Composite-Crew extension) ───────────────────────

/**
 * Aggregation strategy for crew-level composite score.
 * - "mean": arithmetic mean of per-member Stage A composite scores.
 * - "worst-link": minimum per-member score (weakest-link reliability model).
 * - "geometric-mean": nth root of the product of per-member scores.
 */
export type CrewCompositeMethod = "mean" | "worst-link" | "geometric-mean";

/**
 * Result of `aggregateCrewComposite`.
 * `compositeScore` is in [0, 1] (not percent).
 */
export type CrewComposite = {
  /** Aggregated crew-level score in [0, 1]. */
  compositeScore: number;
  /** Per-member composite scores (same order as input crew array). */
  perMemberScores: number[];
  /**
   * ID of the crew member with the lowest compositeScore.
   * null when crew is empty.
   */
  weakestMemberId: string | null;
  method: CrewCompositeMethod;
};

/**
 * Result of `evaluateCrewGates`.
 * The crew passes only if ALL members individually pass (weakest-link gate logic).
 */
export type CrewGateResult = {
  /** "qualified" iff every crew member individually qualifies. */
  crewVerdict: "qualified" | "disqualified";
  /** Per-member gate results keyed by member.id. */
  perMemberResults: Record<string, import("../types/gate").GateResult>;
  /**
   * IDs of crew members that individually failed their gate evaluation.
   * Empty when crewVerdict === "qualified".
   */
  disqualifiedMemberIds: string[];
};

export type IMMSession = {
  id: string;
  candidateId: string | null;
  createdAt: string;
  mission: IMMMission;
  crew: IMMCrewMember[];
  kit: IMMKitScenario;
  trials: number;
  seed: number;
  overrides: Record<string, Partial<IMMPrior>>;
  vulnerabilityMode: "boolean-flags" | "selectron-stage-a-ml";
  engine: "monte-carlo" | "surrogate-ml";
  /**
   * Monte Carlo result. `null` for a config-only session saved before a run
   * completes (Diego 2026-05-29 — "session saving for running simulations").
   * Loading such a session restores the setup; the user then runs it.
   */
  outcomes: IMMOutcome | null;
  validation: {
    vsK15Table1: {
      delta_tme: number; delta_chi: number;
      delta_pEvac: number; delta_pLocl: number;
      within_ci95: boolean;
    };
  };
  laypersonCaptionsExpanded: Record<string, boolean>;
};
