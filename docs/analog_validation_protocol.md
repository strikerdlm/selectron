# External Analog Validation Protocol

**Status:** protocol defined; no external analog-outcome validation has been
performed.

**Scope:** v0.6 can run conditional scenario calculations. It must not be
described as an empirically calibrated analog-risk predictor until observed
analog outcomes are mapped, held out, and compared under this protocol.

## Claim Boundary

- Current claim allowed: external validation protocol defined.
- Current claim prohibited: observed analog-outcome validation, calibrated risk
  prediction, analog facility family prediction, medical disposition, crew
  selection, mission-success prediction, or medical-kit optimization.
- K15 remains an inter-model reference benchmark, not empirical validation.

## Cohort Definition

Each validation cohort must be defined before fitting or tuning:

| Field | Required definition |
|---|---|
| analog type | Antarctic station, controlled habitat, submarine, bed-rest/HERA-like, expedition field analog, or other named family |
| duration | mission days plus observation start/end dates |
| crew size | enrolled crew count and denominator used for person-time |
| medical-support tier | no resources, field/basic, station/limited, ISS-HMS-like, or explicitly custom |
| inclusion rules | mission/campaign eligibility, participant screening level, operational setting, and minimum observation completeness |
| exclusion rules | excluded non-analog campaigns, non-crew support staff, retrospective sources without event denominators, duplicate reporting, or endpoints not mappable below |
| censoring | early withdrawal, evacuation, missing logs, partial missions, and post-mission follow-up handling |

## Endpoint Mapping

Endpoint definitions must be frozen before extraction:

| Selectron endpoint | Observed analog mapping |
|---|---|
| TME | Count of medically relevant events meeting the predeclared condition-specific incident definition |
| EVAC-equivalent | Event requiring mission removal, outside medical transfer, termination request accepted for medical/behavioral reasons, or source-defined evacuation-equivalent escalation |
| LOCL-equivalent | Death or source-defined life-threatening loss-of-crew event; expected to be sparse or absent in analog cohorts |
| quality-time-lost / impairment-equivalent hours | Duty restriction, bed rest, clinical isolation, impaired participation, or source-defined lost operational time; mapping must state whether hours are observed or imputed |
| condition-specific incident | Per-condition case definition, numerator, denominator/person-time, repeated-measure structure, and source quote |

## Data Provenance

For each source family, record:

- source citation or persistent identifier;
- source file or archive path;
- extraction date;
- extractor and independent verifier;
- numerator and denominator/person-time;
- verbatim extraction quote or table locator;
- risk-of-bias note;
- transportability note for crew selection, medical support, environment, and
  outcome ascertainment;
- prior-value hash for any transformed parameter.

## Holdout Design

At least one mission or source family must be declared as held out before any
fit or tuning uses observed analog outcomes.

Permitted examples:

- fit on Antarctic station sources and hold out controlled-habitat campaigns;
- fit on controlled-habitat campaigns and hold out Antarctic station sources;
- fit on shorter campaigns and hold out a longer-duration family;
- fit on one source registry and hold out an independently collected mission log.

If no holdout is possible, the manuscript must state that only descriptive
scenario comparison was performed and no predictive validation claim is made.

## Calibration Metrics

Predeclare all metrics before looking at held-out outcomes:

- interval coverage for TME, EVAC-equivalent, LOCL-equivalent, and
  quality-time-lost/impairment-equivalent hours;
- observed-vs-predicted condition rates by condition family and analog type;
- aggregate endpoint comparison at mission level;
- calibration by duration and crew-size strata when sample size allows;
- divergence handling: record whether disagreement is attributed to endpoint
  mismatch, support-tier mismatch, source bias, transportability failure,
  stochastic imprecision, or model misspecification.

## Minimum Reporting Package

Before any manuscript claim beyond protocol definition:

1. Frozen Selectron source commit and release-freeze manifest.
2. Evidence-status snapshot and prior SHA-256.
3. Cohort inclusion/exclusion table.
4. Endpoint crosswalk table.
5. Held-out mission/source-family declaration.
6. Extraction ledger with extractor/verifier fields.
7. Calibration metric outputs and divergence log.
8. Statement of whether any model tuning used the held-out source.

Until these exist, the manuscript wording is:

> External validation protocol defined; no external analog-outcome validation
> has yet been performed.
