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

export type TreatmentModelDisclosure = {
  id: "raf-linear-interpolation-v1";
  label: string;
  status: "screening-approximation";
  evidenceStatus: "proposal";
  mechanism: "weighted-resource-scalar-then-parameter-linear-interpolation";
  appliesTo: "treated-untreated-outcome-parameters";
  limitations: readonly string[];
  requiredUpgrade: string;
};

export type AnalogFieldExposureDisclosure = {
  id: "analog-field-exposure-gap-v1";
  label: string;
  status: "not-modeled";
  evidenceStatus: "unsupported";
  appliesWhen: "terrestrial-analog";
  profileEvaType: string;
  crewEvaEventCount: number;
  missionTotalEVAs: number;
  spaceEvaPriorsReused: false;
  excludedSpaceEvaConditionIds: readonly string[];
  omittedAnalogProcessFamilies: readonly string[];
  limitations: readonly string[];
  requiredUpgrade: string;
};

export type IMMSeverityScenarioOutcomes = {
  treated: IMMConditionOutcomes;
  untreated: IMMConditionOutcomes;
  /**
   * `legacy-v1-duplicated` means a pre-scenario prior was copied into both
   * severity branches for compatibility. It is mechanistically active, but not
   * independent evidence for a best/worst outcome split.
   */
  evidenceStatus?: "accepted" | "scenario" | "legacy-v1-duplicated";
};

export type IMMSeverityOutcomeScenarios = {
  best: IMMSeverityScenarioOutcomes;
  worst: IMMSeverityScenarioOutcomes;
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
  /**
   * Scenario-specific outcomes selected after sampling best/worst severity.
   * Legacy priors may omit this; the simulator then treats top-level
   * treated/untreated outcomes as duplicated best and worst branches.
   */
  outcomeScenarios?: IMMSeverityOutcomeScenarios;
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
   * Keys are criterion IDs from DEMO_CRITERIA or a future ratified catalog.
   * When present, used in `simulateIMM` to compute z-scored vulnerability multipliers
   * that modulate per-condition λ (gate-then-modulate, Commit 5).
   */
  stageAScores?: Record<string, number>;
};

/**
 * Mission taxonomy. Selectron v1 supports analog-isolation / analog-controlled /
 * antarctic-station / leo-iss. LEO/ISS runs have K15 reference-model anchors;
 * terrestrial analog runs are conditional scenarios and are not empirically
 * validated against observed analog outcomes.
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
  /**
   * Structured analog context. Required for analog-facing scientific runs so
   * results are conditional on documented habitat, operations, autonomy, and
   * medical-support assumptions rather than duration alone.
   */
  profile?: AnalogMissionProfile;
};

export type AnalogMissionProfile = {
  habitat: {
    name: string;
    usableVolumeM3PerCrew?: number;
    privacyLevel: "none" | "shared" | "partial" | "private";
    sleepingArrangement: "shared" | "partitioned" | "private";
  };
  environment: {
    setting: "controlled-habitat" | "antarctic-station" | "field-analog" | "leo-reference";
    altitudeM?: number;
    hypoxia: "none" | "mild" | "moderate" | "severe";
    temperatureExposure: "controlled" | "cold" | "heat" | "variable";
    outsideExposure: "none" | "limited" | "routine" | "high";
  };
  operations: {
    autonomyLevel: "low" | "moderate" | "high";
    workload: "low" | "moderate" | "high" | "surge";
    shiftDesign: "day-shift" | "rotating" | "continuous-ops";
    circadianLightControl: "natural" | "scheduled" | "limited" | "polar";
    researchBurden: "low" | "moderate" | "high";
  };
  communication: {
    delaySec: number;
    schedule: "continuous" | "scheduled" | "delayed-windowed";
    missionControl: "none" | "local" | "remote" | "remote-delayed";
    supportTeam: "minimal" | "standard" | "full";
  };
  logistics: {
    resupply: "none" | "limited" | "scheduled" | "available";
    foodConstraint: "low" | "moderate" | "high";
    hygieneConstraint: "low" | "moderate" | "high";
  };
  medicalSupport: {
    provider: CareProvider;
    telemedicine: Telemedicine;
    evacuationTimeHours?: number;
    emergencyProcedures: "basic" | "documented" | "rehearsed";
    countermeasureLevel: "none" | "basic" | "analog" | "station";
  };
  crew: {
    roleStructure: "minimal" | "defined" | "mission-like";
    priorAcquaintance: "unknown" | "none" | "partial" | "high";
    languageCulture: "homogeneous" | "mixed" | "international";
    trainingLevel: "minimal" | "standard" | "extensive";
  };
  eva: {
    type: "none" | "habitat-egress" | "terrain-field" | "polar-field" | "iss-reference";
    terrain: "none" | "indoor" | "desert" | "volcanic" | "ice" | "orbital";
    equipmentHazard: "low" | "moderate" | "high";
  };
  evidenceGrade: "development" | "scenario" | "adjudicated" | "validated";
  citations: string[];
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

export type ScenarioSummary = {
  mean: number; ci90: [number, number]; ci95: [number, number]; sd: number;
};

/**
 * Summary of a true posterior-predictive parameter-draw distribution. This
 * intentionally uses a separate name from ordinary `ScenarioSummary` outputs
 * so non-posterior IMM runs do not inherit posterior terminology.
 */
export type PredictiveSummary = ScenarioSummary;

/**
 * @deprecated Use ScenarioSummary for ordinary simulateIMM outputs and
 * PredictiveSummary for posterior-predictive parameter-draw outputs. Retained
 * only for persisted sessions and historical imports.
 */
export type PosteriorSummary = ScenarioSummary;

export type MonteCarloErrorSummary = {
  trials: number;
  tmeMeanMcse: number;
  chiMeanMcse: number;
  pEvacMcsePct: number;
  pLoclMcsePct: number;
  healthCriterionMcsePct: number;
  /** Number of trials with at least one EVAC terminal outcome. */
  pEvacEventCount: number;
  /** Number of trials without an EVAC terminal outcome. */
  pEvacNonEventCount: number;
  /** Number of trials with at least one LOCL terminal outcome. */
  pLoclEventCount: number;
  /** Number of trials without a LOCL terminal outcome. */
  pLoclNonEventCount: number;
  /** Number of trials satisfying the composite health criterion. */
  healthCriterionEventCount: number;
  /** Number of trials failing the composite health criterion. */
  healthCriterionNonEventCount: number;
  /** Wilson score 95% interval for the binary pEVAC estimator, percent scale. */
  pEvacWilson95Pct: [number, number];
  /** Wilson score 95% interval for the binary pLOCL estimator, percent scale. */
  pLoclWilson95Pct: [number, number];
  /** Wilson score 95% interval for the binary health-criterion estimator, percent scale. */
  healthCriterionWilson95Pct: [number, number];
  tmeRelativeMcse: number | null;
  chiRelativeMcse: number | null;
  pEvacRelativeMcse: number | null;
  pLoclRelativeMcse: number | null;
  healthCriterionRelativeMcse: number | null;
};

export type MonteCarloPrecisionTargets = {
  /** Relative MCSE ceiling for the total-medical-events mean. */
  tmeRelativeMcseMax: number;
  /** Absolute MCSE ceiling for the CHI mean, percentage-point scale. */
  chiMcseMaxPp: number;
  /** Absolute MCSE ceiling for pEVAC, percentage-point scale. */
  pEvacMcseMaxPp: number;
  /** Absolute MCSE ceiling for pLOCL, percentage-point scale. */
  pLoclMcseMaxPp: number;
  /** Absolute MCSE ceiling for the composite health criterion, percentage-point scale. */
  healthCriterionMcseMaxPp: number;
  /** Maximum Wilson 95% interval width for binary probabilities, percentage-point scale. */
  binaryWilsonWidthMaxPp: number;
  /** Minimum count required in both binary tails before rare-event precision is treated as stable. */
  minBinaryEventCount: number;
  /** Minimum independent seeds required before a run is treated as replicated. */
  minIndependentSeeds: number;
  /** Maximum across-seed spread for percent-scale means, percentage-point scale. */
  maxSeedMeanSpreadPp: number;
};

export type MonteCarloPrecisionCheck = {
  metric: "tme" | "chi" | "pEvac" | "pLocl" | "healthCriterion";
  criterion: "relativeMcse" | "absoluteMcse" | "wilsonWidth" | "eventCount";
  observed: number | null;
  target: number;
  unit: "ratio" | "pp" | "count";
  passed: boolean;
  recommendedTrials: number | null;
};

export type MonteCarloSeedReplicationAssessment = {
  requiredSeeds: number;
  observedSeeds: number;
  targetMaxMeanSpreadPp: number;
  maxMeanSpreadPp: number | null;
  passed: boolean | null;
};

export type MonteCarloPrecisionAssessment = {
  targets: MonteCarloPrecisionTargets;
  checks: MonteCarloPrecisionCheck[];
  stoppingRulePassed: boolean;
  requiredTrials: number;
  stoppingRule: string;
  independentSeedReplication: MonteCarloSeedReplicationAssessment;
  /** True only when the MCSE/Wilson stopping rule passes and seed replication passes. */
  passed: boolean;
};

export type MonteCarloIndependentSeedSummary = {
  seeds: number[];
  trialsPerSeed: number;
  metrics: {
    tmeMeanRange: number;
    chiMeanRangePp: number;
    pEvacMeanRangePp: number;
    pLoclMeanRangePp: number;
    healthCriterionMeanRangePp: number;
  };
  assessment: MonteCarloSeedReplicationAssessment;
};

export type IMMOutcome = {
  tme: ScenarioSummary;
  chi: ScenarioSummary;
  pEvac: ScenarioSummary;
  pLocl: ScenarioSummary;
  /**
   * Probability of meeting the specified composite health criterion (×100,
   * percent scale, same as pEvac/pLocl). A trial meets the criterion when:
   * EVAC=0 AND LOCL=0 AND CHI >= chiStar×100.
   */
  healthCriterionAttainment?: ScenarioSummary;
  /**
   * Legacy alias retained for persisted sessions and historical tests. New UI
   * should use healthCriterionAttainment terminology.
   */
  missionSuccess: ScenarioSummary;
  /**
   * Per-condition diagnostic attribution rates.
   *
   * pEvacContrib and pLoclContrib are percent-scale expected counts of
   * terminal events attributed to each condition per trial, so they are
   * comparable to pEvac/pLocl means but are not an additive probability
   * decomposition. A trial-level headline probability can differ from the sum
   * of condition attributions because of termination paths, interactions, and
   * top-N display truncation. tmeContrib remains expected events per trial.
   */
  perConditionDrivers: {
    conditionId: string;
    pEvacContrib: number; pLoclContrib: number; tmeContrib: number;
  }[];
  convergence: {
    trialCheckpoints: number[];
    sigmaChi: number[]; sigmaPevac: number[];
  };
  monteCarloError?: MonteCarloErrorSummary;
  precisionAssessment?: MonteCarloPrecisionAssessment;
  chiClamp?: {
    count: number;
    proportion: number;
  };
  /**
   * Scientific qualification for the active treatment/resource pathway model.
   * simulateIMM populates this field; it is optional only for historical saved
   * sessions created before model-disclosure provenance was added.
   */
  treatmentModel?: TreatmentModelDisclosure;
  /**
   * Terrestrial analog EVA/field-exposure provenance. Populated for terrestrial
   * analog missions to make clear that space-EVA priors were not reused and
   * terrain/polar field hazards remain unsupported until analog-specific
   * exposure denominators and event priors are adjudicated.
   */
  analogFieldExposure?: AnalogFieldExposureDisclosure;
  /**
   * Raw per-trial CHI samples (percent scale, 0–100).
   * Only populated when `diagnostics: true` is passed to `simulateIMM`.
   * Used by R-hat convergence tests (tests/imm/rhat_convergence.test.ts).
   */
  diagnostics?: { chiSamples: number[] };
};

// ── Prior-uncertainty predictive types ───────────────────────────────────────

/**
 * Output of `posteriorPredictiveSimulateIMM`. Each summary is a predictive
 * distribution over the metric (one value per parameter draw, not per trial).
 * Reuses the same summary shape per metric so the UI renders point + interval
 * estimates without extra aggregation.
 */
export type PosteriorPredictiveOutcome = {
  /** Predictive distribution of pEVAC (% scale, 0..100) over the N draws. */
  pEvacPost: PredictiveSummary;
  /** Predictive distribution of pLOCL (% scale, 0..100). */
  pLoclPost: PredictiveSummary;
  /** Predictive distribution of CHI (% scale, 0..100). */
  chiPost: PredictiveSummary;
  /** Per-condition predictive expected TME contribution (per-draw mean tmeContrib, events per trial). */
  perConditionTmeContribPost: Record<string, PredictiveSummary>;
  /** Number of parameter draws used. */
  nDraws: number;
  /** Monte Carlo trials run per parameter draw. */
  trialsPerDraw: number;
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

export type CrewGateVerdict = "clear" | "review-flagged";

/**
 * Result of `evaluateCrewGates`.
 * This demo-threshold gate only reports whether review flags are present.
 */
export type CrewGateResult = {
  /** "clear" iff no crew member triggered a demo-threshold review flag. */
  crewVerdict: CrewGateVerdict;
  /** Per-member gate results keyed by member.id. */
  perMemberResults: Record<string, import("../types/gate").GateResult>;
  /**
   * IDs of crew members that triggered at least one demo-threshold review flag.
   * Empty when crewVerdict === "clear".
   */
  flaggedMemberIds: string[];
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
  couplingMode?: VulnerabilityCouplingMode;
  /**
   * F3: full simulation-assumption provenance. Every saved result records the
   * operative controls that generated it so a reloaded session cannot be
   * silently re-run under different assumptions. All fields optional for
   * backward compatibility with pre-existing Dexie rows.
   */
  familyBetaScale?: number;
  profileEffectMode?: ProfileEffectMode;
  chiStar?: number;
  aggregator?: CrewCompositeMethod;
  criterionCatalogId?: string;
  criterionCatalogVersion?: string;
  profileMappingVersion?: string;
  /** SHA-256 over the canonical JSON of the loaded prior set at save time. */
  priorsHash?: string;
  /** SHA-256 over the active kind_multipliers block at save time. */
  kindMultiplierHash?: string;
  /** SHA-256 over PROFILE_EFFECTS at save time. */
  profileEffectsHash?: string;
  /** Active profile-effect estimates under the saved profileEffectMode. */
  activeProfileEffects?: Array<{
    profilePath: string;
    estimate: number;
    evidenceStatus: import("./profile-effects").ProfileEffectEvidenceStatus;
  }>;
  /** Frozen evidence-ledger status snapshot (F4) — the operative coverage. */
  evidenceStatusSnapshot?: import("./provenance").EvidenceStatusSnapshot;
  /** Selectron software version at save time (src/version.ts). */
  softwareVersion?: string;
  /** Source/build commit at save time. */
  sourceCommit?: string;
  /** Current-state comparison assigned on load, not persisted by older rows. */
  loadStatus?: import("./provenance").SavedOutcomeStatus;
  validation: {
    vsK15Table1: {
      delta_tme: number; delta_chi: number;
      delta_pEvac: number; delta_pLocl: number;
      within_ci95: boolean;
    };
  };
  interpretationCaptionsExpanded: Record<string, boolean>;
};

export type VulnerabilityCouplingMode = "off" | "scenario";
export type ProfileEffectMode = import("./profile-effects").ProfileEffectMode;
