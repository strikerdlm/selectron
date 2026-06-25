# Selectron Model Card

**Version:** v0.6.0-rebaseline.0  
**Last updated:** 2026-06-25
**Status:** research prototype; not validated for operational prediction

## Intended Use

Selectron supports reproducible research on:

- uncertain-weight MCDA score propagation;
- conditional medical-event scenario simulation;
- sensitivity analysis over explicit priors, resources, mission duration, and operator-selected profile effects;
- software verification against declared regression and reference-model benchmarks.

It is not a clinical decision-support tool, medical-clearance system, applicant-tracking system, flight-certification product, or NASA HSRB verdict engine.

## Validation Status

No population, mission type, mission duration range, or analog facility family is currently validated for empirical prediction.

Current evidence status is:

- nominal accepted ledger rows: 4;
- malformed accepted ledger rows: 4;
- valid accepted active-parameter coverage: 0/4,849;
- release priors adjudicated: false.

K15 comparison is an inter-model reference benchmark against published IMM outputs. It is not validation against observed analog-mission clinical outcomes.

## Supported Interpretation

Outputs should be read as conditional scenario quantities under the loaded assumptions:

- Stage A intervals are MCDA score intervals induced by uncertain criterion weights.
- Stage B intervals are simulation intervals over modeled mission-to-mission variability under shared condition/trial incidence draws.
- MCSE and rare-event precision diagnostics describe numerical simulation stability, not empirical calibration.
- Quality-time lost / impairment-equivalent hours are summarized from raw per-trial QTL before CHI is clipped to the 0-100 display scale. This is not scheduled duty time.
- Severity sampling is mechanistic only until branch-specific outcome priors are adjudicated; current generated coverage is 0/101 distinct branch sets.
- Treatment resources are depleted per resource, but RAF treatment interpolation remains a proposal-stage screening approximation.
- Communications delay is a proposal-stage exploratory sensitivity effect and is off in default adjudicated mode.

## Canonical Engine Boundary

Browser and manuscript-grade scenario outputs should come from the TypeScript IMM engine in `src/imm/`. The Python package is an offline calibration and screening-analysis path. Its forward Monte Carlo, K15 validator, and sensitivity reports are simplified Python approximations and must not be combined with TypeScript application results as the same scientific model unless cross-language golden tests establish parity over event counts, timing, severity branches, terminal outcomes, QTL, resource depletion, and summaries.

## Unacceptable Extrapolations

Do not use Selectron outputs to:

- select, reject, clear, or rank real candidates;
- estimate calibrated absolute pEVAC, pLOCL, or CHI for a real mission;
- attribute outcomes causally to isolation, workload, privacy, autonomy, circadian lighting, hygiene, or communications delay;
- compare analog facilities as interchangeable populations;
- infer NASA-equivalent HSRB likelihood/consequence postures;
- support clinical, employment, credentialing, insurance, or safety-critical decisions.

## Validation Requirements Before Predictive Claims

Predictive claims require, at minimum:

- independently adjudicated evidence rows with event counts, denominators or exposure time, extraction quotations, source bias assessment, transportability assessment, independent verification, DOI/title/slug consistency, and active prior-value hashes;
- predeclared observed analog outcome cohorts with harmonized event and exposure definitions;
- at least one mission or source family held out before fitting;
- predicted-versus-observed calibration checks, proper scoring metrics, and condition-level rate comparisons;
- separately validated profile effects for each claimed causal or predictive mission-profile variable.

Until those requirements are met, Selectron is a verification-first scenario-analysis prototype, not an empirically calibrated analog-risk predictor.
