# Selectron IMM Calculator — Design Spec

**Status:** approved 2026-05-20. Next: invoke `writing-plans` for implementation breakdown.
**Owner:** Dr. Diego L. Malpica, MD.
**Branch (target):** `iter1-phase0` (continues the Iter-3 + Iter-4 manuscript chain — additive only).
**Validation gate:** reproduces K15 Table 1 (ISS 6 mo / 6 crew) within CI₉₅ across all three kit scenarios.

---

## 1. Purpose

Build a NASA-style probabilistic medical-risk calculator alongside Selectron's existing Stage B + HSRB LxC pipeline. The calculator:

- accepts user-defined mission, crew, and medical-kit inputs;
- runs a 4-step Integrated Medical Model (IMM) Monte Carlo over 100 medical conditions;
- emits the four canonical IMM outputs — **TME** (total medical events), **CHI** (Crew Health Index), **pEVAC** (probability an evacuation should be considered), **pLOCL** (probability of loss of one or more crew) — with 95 % confidence intervals;
- validates against the Keenan 2015 Table 1 (ISS 6 mo / 6 crew) reference;
- generalises to all eight Selectron analog missions and to the two TM21 Mars Design Reference Missions (AMM, SMM);
- offers an ML-augmented mode (surrogate for sub-millisecond UI updates; per-crewmember vulnerability modifier driven by Selectron Stage A) as a published-novelty hook.

## 2. Out of scope (v1)

- BNN priors elicitation (deferred to a follow-up methodology paper).
- Active-learning sensitivity tornado (follow-up).
- Co-morbidity correlation modelling.
- Communicable-disease propagation (Keenan 2015 §IV flags as out-of-scope).
- Vehicle environmental-system correlates (CO₂, ARED/treadmill, non-SPE radiation).
- Resupply scheduling on missions > 6 mo.

Each out-of-scope item is intentional — recorded here so the implementation does not drift into them.

## 3. Architectural anchors (agreed in brainstorming, 2026-05-20)

| Decision | Resolution |
|---|---|
| **Engine scope** | New parallel `src/imm/` module + new "IMM Calculator" top-level tab. Existing `src/risk/` and the HSRB LxC pipeline are untouched. |
| **Condition catalogue** | All 100 entries from the K15 appendix (`research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md`). |
| **Priors strategy** | Three-tier provenance per condition (`tierA-nasa` / `tierB-lit` / `tierC-synth`) with a global per-kit-scenario calibration multiplier back-fit to K15 Table 1. Every prior carries a `provenance` tag and a `source_ref` pointing to a markdown file in `research/`. |
| **UI shape** | Single-page form (mission · crew · kit · run · results · drivers). No wizard chrome. |
| **ML role** | Optional. Monte Carlo is the credibility anchor; ML rides on top (surrogate for interactivity; per-crewmember vulnerability modifier for novelty). Toggleable. |
| **Persistence** | Dexie v3 — additive new `imm_sessions` table. Existing tables untouched. |

## 4. Module layout

```
src/imm/
  types.ts                        IMMCondition, IMMCrewMember, IMMMission,
                                  IMMKitScenario, IMMOutcome, IMMPosterior,
                                  IMMPrior, IMMSession
  conditions.ts                   100 K15 appendix entries with metadata
  priors.ts                       loads + type-validates src/data/imm-priors.json
  incidence.ts                    Lognormal-Poisson, Gamma-Poisson,
                                  Beta-Bernoulli, SPE Poisson process
  severity.ts                     Bernoulli(worst-case)
  treatment.ts                    Resource Availability Factor (RAF);
                                  Beta-Pert distribution shifting
  outcomes.ts                     Beta-Pert sampler;
                                  3 clinical-phase FI + DT; pEVAC + pLOCL Bernoulli
  kits.ts                         IMM_KITS = { none, issHMS, unlimited, custom }
  simulate.ts                     runIMMTrial(), simulateIMM(); T=100k default
  calibration.ts                  Tier-C global multipliers; K15 residuals
  ml/
    surrogate.ts                  LightGBM-WASM inference
    vulnerability.ts              Bayesian MLP (TFJS) inference
    feature_engineering.ts        fixed-length feature vector
    models/
      imm_surrogate_v1.json
      vulnerability_v1.json
      training_provenance.md
    captions/
      I1.layperson.ts … I8.layperson.ts
  index.ts                        public barrel

src/data/
  imm-priors.json                 100 conditions × prior parameters
  imm-missions.ts                 ISS 6mo (K15), ISS DRM1/DRM2 (S20),
                                  AMM 426d (TM21), SMM 923d (TM21),
                                  plus existing 8 analog missions

src/ui/views/
  IMMCalculator.tsx               new top-level view

src/ui/components/
  IMMCrewBuilder.tsx              per-member risk-factor row + EVA count
  IMMKitPicker.tsx                None / ISS HMS / Unlimited / Custom radio
  IMMResultsCard.tsx              4-metric headline with CI95 bars

src/ui/figures/
  IMMHeadlineCard.tsx             I1 — hero-stat composite
  IMMPosteriorHist.tsx            I2 — 4-panel small-multiple histograms
  IMMConditionDrivers.tsx         I3 — lollipop sorted by pEVAC/pLOCL contribution
  IMMConvergencePlot.tsx          I4 — σ vs trials, 5 % rule
  IMMValidationCompare.tsx        I5 — dumbbell: your run vs K15 reference
  IMMSensitivityTornado.tsx       I6 — top 20 perturbations on pEVAC
  IMMCrewRiskHeat.tsx             I7 — crew × condition heatmap
  IMMVulnerabilityCalibration.tsx I8 — ML modifier calibration scatter
  FigureCaption.tsx               EXTENDED — adds `layperson?` field

src/db/schema.ts                  SCHEMA_VERSION = 3; new imm_sessions table

scripts/
  train_imm_surrogate.ts          generates 10k MC runs, fits LightGBM
  train_imm_vulnerability.ts      generates synthetic GT, fits Bayesian MLP
  calibrate_imm_priors.ts         back-fits Tier-C global multipliers
  validate_imm.ts                 prints K15/S20/TM21 deltas for V&V dossier

tests/imm/
  conditions.test.ts              all 100 entries valid
  incidence.test.ts               distribution moments
  outcomes.test.ts                Beta-Pert moments; RAF interpolation;
                                  concurrent FI formula 1 − Π(1 − f_i)
  simulate.test.ts                T=100k determinism; σ<5% convergence
  validation.test.ts              **gate** — reproduces K15 Table 1 within CI95
                                  AND TM21 AMM/SMM within ±20%
  calibration.test.ts             Tier-C multiplier idempotency
  surrogate.test.ts               ML surrogate vs MC held-out grid
  vulnerability.test.ts           ML modifier vs synthetic GT
```

## 5. Evidence corpus → prior provenance

Every per-condition prior cites a markdown file already in the repo. Tier-A sources (NASA-published):

| Source | Path | Conditions covered | What it gives |
|---|---|---|---|
| K15 (Keenan 2015) | `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md` | All 100 (appendix table) | Distribution family per condition; risk-factor map; Table 1 validation target |
| M18 (Myers 2018) | `research/imm_sources/methods/M18_myers_2018_imm_validation.md` | ~8 conditions | Numerical Poisson λ; worst-case Bernoulli q |
| G12 (Gilkey 2012) | `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md` | ~5 conditions | Lognormal-Poisson posterior μ, σ |
| A22 (Antonsen 2022) | `research/imm_sources/methods/A22_antonsen_2022_medical_risk_human_spaceflight.md` | Aggregate | 4-step trial verbatim; convergence rule |
| R21 (Roma 2021) | `research/imm_sources/methods/R21_roma_2021_behavioral_health_impact_imm.md` | All 100 | RDoC-domain BHP impact ratings |
| SP09 (NASA 2009) | `research/imm_sources/methods/SP09_nasa_2009_bayesian_pra_reference.md` | Foundational | Bayesian PRA math for V&V tests |
| S20 (Walton 2020) | `research/imm_sources/validation/S20_walton_kerstman_2020_iss_quantification.md` | ~10 conditions | ISS DRM1/DRM2 driving-condition odds |
| W14 (Walton 2014) | `research/imm_sources/validation/W14_walton_2014_nasa_std_7009.md` | (V&V framework) | NASA-STD-7009 factor weights |
| TM21 (Antonsen 2021) | `research/imm_sources/zotero_imm/antonsen-2021-comparison-of-health-and-performance.md` | ~25 conditions | Per-condition counts-per-100k-trials for AMM/SMM |
| Kreykes 2023 | `research/imm_sources/zotero_imm/kreykes-2023-selecting-medical-conditions-relevant-to.md` | 120 conditions | Cross-validation vs IMPACT 1.0 |
| Thompson 2008 | `research/imm_sources/zotero_imm/thomspon-2018-fingernail-injuries-and-nasas-integrated.md` | 1 (Fingernail Delamination) | 0.046 events/person-year exemplar |
| Goodenow-Messman 2022 | `research/imm_sources/zotero_imm/goodenowmessman-2022-numerical-characterization-of-astronaut-caox.md` | 1 (Nephrolithiasis) | Physiology-model-derived priors |

Tier-B sources (literature):

| Source | Path | What it gives |
|---|---|---|
| Phase-0 I&C corpus | `research/evidence/INDEX.md` + 31 OCR'd I&C markdowns | Analog-mission incidence rates (Mars-500, Antarctic, HI-SEAS, AMADEE, MDRS, EMMPOL, THOR) for ~30 behavioral / I&C conditions |
| NASA evidence-report bridges | `research/evidence/bridges/{nasa-bmed-evidence-report.pdf, nasa-teams-evidence-report-2022.pdf, patel-2020-red-risks-mars.pdf}` | NASA BHP and Mars-mission bridges spanning Tier-A spaceflight ↔ Tier-B I&C analogs |
| Phase-0 evidence tables | `research/evidence_tables/{medical, psychological, behavioral}.md` | Predictive-validity coefficients + epidemiology base rates |

Tier-C synthetic priors are constructed by back-fitting global per-scenario multipliers (one for `none`, one for `issHMS`, one for `unlimited`) so the simulator's aggregate output matches K15 Table 1 within CI₉₅. Tier-C is applied only to the ~10–20 conditions where neither Tier-A nor Tier-B data is available.

## 6. Data structures

```ts
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
  vulnerabilityCriteria: string[];   // Selectron Stage-A criterion IDs that modify incidence
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
  provenance: "tierA-nasa" | "tierB-lit" | "tierC-synth" | "user-custom";
  source_ref: string;
  incidence: {
    distribution: "Lognormal-Poisson" | "Gamma-Poisson" | "Beta-Bernoulli" | "Fixed";
    mu_log_lambda?: number; sigma_log_lambda?: number;
    alpha?: number; beta?: number;          // Beta-Bernoulli for SA / EVA / SPE
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
  selectronStageACandidateId?: string;     // optional link for ML vulnerability mode
};

export type IMMMission = {
  id: string;
  label: string;
  durationDays: number;
  crewSize: number;
  totalEVAs: number;
  evaSchedule: number[];                   // day numbers
};

export type IMMKitScenario = {
  scenarioId: "none" | "issHMS" | "unlimited" | "custom";
  label: string;
  resources: Record<string, number>;
};

export type PosteriorSummary = {
  mean: number; ci90: [number, number]; ci95: [number, number]; sd: number;
};

export type IMMOutcome = {
  tme: PosteriorSummary;
  chi: PosteriorSummary;
  pEvac: PosteriorSummary;
  pLocl: PosteriorSummary;
  perConditionDrivers: {
    conditionId: string;
    pEvacContrib: number; pLoclContrib: number; tmeContrib: number;
  }[];
  convergence: {
    trialCheckpoints: number[];
    sigmaChi: number[]; sigmaPevac: number[];
  };
};
```

## 7. Simulation flow (per-trial)

```
For each trial t = 1..T:
  1. SPE schedule: Poisson(λ_SPE × mission_duration) → SPE event times
  2. For each crewmember m:
     For each condition k:
       Determine processType:
         (a) "general-Poisson"  → Poisson(λ_k × t_mission × risk_factor_mult)
                                  exponential interarrivals
         (b) "space-adaptation" → Bernoulli(IP_k); Beta-Pert time in [0, 5 d]
         (c) "EVA-coupled"      → Bernoulli(IP_k) per scheduled EVA
         (d) "SPE-coupled"      → Bernoulli(IP_k) at each SPE time
         (e) "SA-VIIP-late"     → Bernoulli(IP_k); Beta-Pert time across mission
       For each occurrence e:
         severity:  Bernoulli(q_k) → best | worst
         RAF:       compute resource availability at time t_e
         outcomes:  sample from RAF-interpolated Beta-Pert distributions
                    FI_cp1, DT_cp1, FI_cp2, DT_cp2, FI_cp3
                    p_evac_e, p_locl_e
         EVAC_m   |= Bernoulli(p_evac_e)
         LOCL_m   |= Bernoulli(p_locl_e)
         if EVAC_m || LOCL_m: no further events for crewmember m
         decrement remaining resources × RAF
  3. Per-trial aggregates:
     TME_t  = total event count
     QTL_t  = Σ_m Σ_e f_total(t_e) × dt_e          where f_total = 1 − Π(1 − f_i)
     CHI_t  = 100% × (1 − QTL_t / (L × c))
     EVAC_t = ∃ m: EVAC_m == 1
     LOCL_t = ∃ m: LOCL_m == 1

After T trials (batch-means CIs):
  TME ± CI95, CHI ± CI95, pEVAC ± CI95, pLOCL ± CI95
  Per-condition drivers; convergence diagnostics (σ vs trial-count)
```

Two mathematical anchors that distinguish IMM from current Stage B:

- **Concurrent functional impairment** (K15 §II.A.9): `f_total = 1 − Π(1 − f_i)`. Composes overlapping impairments multiplicatively, not additively.
- **RAF distribution shifting** (K15 §II.B.7, Fig. 3): partial-resource events sample from a Beta-Pert whose `(min, mode, max)` is linearly interpolated between treated and untreated extremes by RAF. Preserves variance contribution that a flat multiplier would lose.

Both are gated by closed-form moment tests in `tests/imm/outcomes.test.ts`.

## 8. UI layout

Three columns at `lg:`, stacked vertically at `md:` and below.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: SELECTRON · IMM Calculator (v3 schema)            Engine: Monte ▼  │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│  MISSION                 │  CREW                    │  RESULTS              │
│  Mission name [____]     │  Member 1                │  Headline card I1     │
│  Duration       180 d    │   ☑ sex: male            │  TME / CHI / pEVAC /  │
│  Crew size      6        │   ☐ contacts             │  pLOCL with CI95 bars │
│  Total EVAs     12       │   ☐ crowns               │                       │
│   ├ schedule: even ▼     │   ☐ CAC > 0              │  vs K15 Table 1:      │
│  Kit:                    │   ☐ abdo-surg            │   ✓ within CI95       │
│   ◉ ISS HMS              │   ☑ EVA-eligible: 6 EVAs │                       │
│   ○ None / ○ Unlimited   │  Member 2 …              │  Per-condition driver │
│   ○ Custom ⚙             │  + Add member            │  table (top 15)       │
│  Trials: 100 000 ▼       │  Quick-load:             │                       │
│  Seed:   0xc0ffee        │   K15 reference / Mars   │                       │
│  Diagnostics ☑           │   AMM / Selectron Stage A│                       │
│  [▶  Run simulation  ]   │  Vulnerability mode:     │                       │
│  Convergence: σ 4.2 %    │   ◉ IMM Boolean flags    │                       │
│                          │   ○ Selectron Stage A    │                       │
│                          │     (ML modifier ✱)      │                       │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
   Per-condition drilldown (accordion, every prior overridable)
   8 Q1-style figures (I1–I8) rendered below the fold, each with caption +
   expert/lay-person toggle
```

## 9. Custom-value overrides

Every prior parameter is editable inline. Override flips the condition's `provenance` to `"user-custom"` for the session. The Validation badge ("vs K15 Table 1") goes from green to amber as soon as any override is active. The simulator method does not change — overridden values flow through the identical `IMMPrior` interface.

Two additional custom channels:

- **Custom mission profile** — duration, crew size, EVA count, schedule are free-text. The K15 reference is one point in the input space.
- **Custom kit** — the `Custom ⚙` radio opens a per-resource editor; zero out individual items, see impact on pEVAC/pLOCL.

Every session is persisted (Dexie `imm_sessions`) so users can re-run, share, compare configurations.

## 10. ML layer

### 10.1 Surrogate model (Phase A1)

LightGBM trained on a 10 000-point Monte Carlo grid over (mission duration ∈ [30, 1 000] days, crew size ∈ [3, 8], total EVAs ∈ [0, 500], kit ∈ {none, issHMS, unlimited}, 64 random crew risk-factor combinations per cell). Outputs: 8 scalars (TME mean+SD, CHI mean+SD, pEVAC mean+SD, pLOCL mean+SD). Inference time per prediction: < 1 ms. Held-out error: target ≤ 5 % MAPE on the 4 means, ≤ 10 % MAPE on the 4 SDs. Tested in `tests/imm/surrogate.test.ts`.

The Engine toggle in the UI defaults to Monte Carlo for credibility; user can switch to Surrogate for what-if exploration.

### 10.2 Per-crewmember ML vulnerability modifier (Phase A2 — publishable novelty)

Bayesian MLP (~10k parameters, TFJS) trained on synthetic (crew_features, ground_truth_modifier) pairs where:

- `crew_features` = concat(6 IMM boolean flags, 12 Selectron Stage A z-scores, age, prior analog mission count, …) — 22-dimensional input.
- `ground_truth_modifier` = per-condition incidence multiplier vector derived from R21 RDoC-domain impact ratings × Phase-0 evidence_tables/medical.md predictive-validity coefficients.

At inference, the user picks "IMM Boolean flags" (default — reproduces K15 Table 1 exactly) or "Selectron Stage A (ML modifier ✱)". The latter consumes the candidate's Stage A posterior and emits the per-condition vector that the IMM engine pulls in step (a) of the trial loop.

Held-out calibration: I8 (`IMMVulnerabilityCalibration.tsx`) — predicted vs ground-truth scatter with 45° reference line, expected calibration error (ECE) reported.

### 10.3 Deferred (Phase B, follow-up methodology paper)

- BNN priors elicitation trained on K15 + S20 + TM21 + M18 aggregates.
- Active-learning sensitivity tornado via Gaussian-process surrogate.
- Target venue: CMPB (Computer Methods and Programs in Biomedicine) or npj Microgravity methods follow-up.

## 11. Q1-grade figures (extends existing selectron-nature theme)

| ID | File | Pattern |
|---|---|---|
| I1 | `IMMHeadlineCard.tsx` | 4 stat cards + CI₉₅ whisker + convergence sparkline |
| I2 | `IMMPosteriorHist.tsx` | 4-panel small multiples: histograms with CI₉₀ shading + dashed μ |
| I3 | `IMMConditionDrivers.tsx` | Lollipop sorted by pEVAC contribution; tab for pLOCL |
| I4 | `IMMConvergencePlot.tsx` | σ vs trials, dashed 5 % rule |
| I5 | `IMMValidationCompare.tsx` | Dumbbell: your run vs K15 reference |
| I6 | `IMMSensitivityTornado.tsx` | Top 20 conditions by ±50 % perturbation on pEVAC |
| I7 | `IMMCrewRiskHeat.tsx` | Crew × condition heatmap |
| I8 | `IMMVulnerabilityCalibration.tsx` | Predicted vs ground-truth scatter |

All on the `selectron-nature` theme: Okabe-Ito + Inter sans + `animation: false` + `useUTC: true` + `aria.enabled: true` + `decal` patterns. Same Q1-publication settings as the existing F1–F7 figures.

`FigureCaption.tsx` gets a new `layperson?` field. Rendered below every chart:

```
Figure I2 | Posterior distributions … (T = 100 000).
   ▸ explain methodology   ▸ source   ▸ reproduce
   ▸ explain like I'm not a researcher                    ← hidden by default
```

Click "explain like I'm not a researcher" → 100–150 word plain-language paragraph that avoids jargon and explains why the chart matters for a mission planner. Lay-person captions live at `src/imm/ml/captions/I[1-8].layperson.ts` and are reviewed by Diego before merge.

## 12. Persistence (Dexie v3)

`SCHEMA_VERSION = 3`. New `imm_sessions` table — additive, no destructive migration. Schema in `src/db/schema.ts`:

```ts
type IMMSession = {
  id: string; candidateId: string | null; createdAt: string;
  mission: IMMMission; crew: IMMCrewMember[]; kit: IMMKitScenario;
  trials: number; seed: number;
  overrides: Record<string, Partial<IMMPrior>>;
  vulnerabilityMode: "boolean-flags" | "selectron-stage-a-ml";
  engine: "monte-carlo" | "surrogate-ml";
  outcomes: IMMOutcome;
  validation: { vsK15Table1: { delta_tme: number; delta_chi: number;
                                delta_pEvac: number; delta_pLocl: number;
                                within_ci95: boolean }; };
  laypersonCaptionsExpanded: Record<string, boolean>;
};
```

## 13. Testing

| Suite | Asserts | V&V Factor |
|---|---|---|
| `conditions.test.ts` | All 100 entries valid; risk-factor flags map cleanly | F1 (Verification) |
| `incidence.test.ts` | Lognormal-Poisson moments within 2 %; Beta-Bernoulli within 5 % | F1 |
| `outcomes.test.ts` | Beta-Pert moments within 2 %; RAF interpolation at 11 RAF values; concurrent FI `1 − Π(1 − f_i)` | F1 |
| `simulate.test.ts` | T = 100k determinism; σ < 5 % convergence | F1 + F2 |
| `validation.test.ts` | **Gate** — K15 Table 1 within CI₉₅ for all 3 kits; TM21 AMM/SMM within ±20 % | F2 (Validation) |
| `calibration.test.ts` | Tier-C multiplier idempotency | F4 (Input Pedigree) |
| `surrogate.test.ts` | ML surrogate vs MC: ≤ 5 % MAPE on means, ≤ 10 % MAPE on SDs | F2 |
| `vulnerability.test.ts` | ML modifier vs synthetic GT: ECE ≤ 0.05 | F2 |

`validation.test.ts` is the merge-gate. Failure blocks the build.

## 14. Documentation deliverables

| File | What changes |
|---|---|
| `README.md` | New "IMM Calculator" section; updated file-tree; `npm run train:imm` line |
| `CLAUDE.md` (Selectron) | IMM Calculator module section; Dexie v3 migration note; V&V dossier pointer |
| `docs/iter3_vv_dossier.md` | New §5 "IMM Calculator validation" — Tier counts, K15/S20/TM21 deltas, ML errors |
| `docs/iter3_nasa_monte_carlo_audit.md` | New §4 "IMM Calculator alignment" — σ<5% at T=100k; K15 §II.A.9 formula citation |
| `STATUS.md` | New rows tracking IMM Calculator tasks |
| `CITATION.cff` | Optional — training-script provenance pointers as `references` |
| `paper/manuscript.md` | **Unchanged** for the current Iter-4 submission. IMM Calculator is post-submission. |

## 15. Definition of done (v1)

1. `src/imm/` compiles; 100 conditions × full priors in `imm-priors.json`.
2. `tests/imm/validation.test.ts` reproduces K15 Table 1 within CI₉₅ for all 3 kits AND TM21 AMM/SMM within ±20 %.
3. IMM Calculator view live at the new top-level tab; form functional; per-condition prior overridable; Run button runs T = 100 000 in a Web Worker.
4. 8 figures I1–I8 render with `selectron-nature` theme + lay-person/expert toggle.
5. Engine toggle (Monte Carlo ↔ Surrogate) works; surrogate within ±5 % of MC on held-out grid.
6. ML vulnerability modifier works; "Import Selectron candidate" button wires Stage A → modifier vector.
7. Dexie v3 migration green; existing v2 candidates load without loss; new `imm_sessions` persists.
8. README, CLAUDE.md, V&V dossier updated.
9. `npm test`, `npm run typecheck`, `npm run e2e` all green.

## 16. Open follow-ups (not blockers for v1)

- **BNN priors elicitation** (Phase B1) — separate methodology paper.
- **Sensitivity tornado via Gaussian-process active learning** (Phase B2).
- **Co-morbidity correlation** (K15 §IV out-of-scope; revisit if iMED data becomes available).
- **Resupply scheduling** — future Mars-specific extension.

---

**Spec self-review (2026-05-20).** Placeholder scan: none. Internal consistency: §4 module layout matches §11 figure list (I1–I8) and §13 test suites; §6 type definitions match §12 persistence schema; §7 simulation flow matches §3 architectural anchors. Scope check: appropriately bounded for a single implementation plan (~80–120 tasks; ML follow-ups deferred). Ambiguity check: every "Tier C synthetic" condition is explicitly enumerated only after Tier A and Tier B fail — back-fit is the last resort. Implementation can begin against `writing-plans` once Diego signs off on this spec.
