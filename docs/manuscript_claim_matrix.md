# Manuscript Claim Matrix

**Status:** active claim-audit companion to `docs/model_card.md`
**Last updated:** 2026-06-25

Use this matrix before any manuscript, abstract, README badge, figure caption, or release note claims Selectron results.

## Mechanically Verified

These claims may be made when tied to a specific source commit, prior hash, evidence snapshot, seed policy, and test-log archive:

| Claim | Required support |
|---|---|
| Stage A implements an uncertain-weight additive MCDA calculation | TypeScript unit tests for normalization, Dirichlet sampling, closed-form moments, and deterministic replay |
| Stage B runs a chronological IMM-style event simulation | `src/imm/simulate.ts` tests for condition/trial shared incidence draws, chronological resource depletion, mutually exclusive terminal outcomes, overlap-aware QTL integration, and input validation |
| The simulator reports Monte Carlo precision diagnostics | `monteCarloError`, Wilson intervals, sparse-tail flags, independent-seed replication summaries, and associated tests |
| The current prior/evidence state is machine-readable | `research/evidence_extracted/evidence_status.json`, `src/data/evidence-status.json`, and `npm run evidence:check` |
| The release/manuscript source can be frozen | `npm run release:freeze:check` for inspection and `npm run release:freeze` for an archival manifest |

## Assumption-Conditional

These claims require wording such as "under the loaded assumptions", "scenario estimate", or "sensitivity analysis":

| Claim | Required qualification |
|---|---|
| One mission duration, crew, or kit scenario differs from another | Same prior catalog, same model version, same seed/trial policy, and MCSE/independent-seed diagnostics reported |
| Resource kits affect CHI, TME, pEVAC, or pLOCL | RAF treatment interpolation is proposal-stage screening only, not medical-kit optimization |
| Stage-A trait coupling changes incidence | `vulnerabilityCouplingMode: "scenario"` must be explicitly enabled; default scientific runs keep it off |
| Communications delay changes behavioral/psychiatric incidence | `profileEffectMode: "exploratory"` must be explicitly enabled; current coefficient is proposal-stage |
| Expected duty hours lost are reported | Interpret as raw-QTL simulation output before CHI display clamping, not observed duty-time prediction |

## Empirically Unvalidated

These claims are not currently supported as empirical predictions:

| Claim area | Current status |
|---|---|
| Accepted evidence coverage | 0/4,849 active parameter paths have valid accepted coverage |
| Absolute pEVAC, pLOCL, CHI, TME, or duty-time prediction | No external held-out analog outcome validation |
| Analog profile transportability | Most privacy, workload, circadian, autonomy, hygiene, evacuation-delay, and terrestrial field-EVA fields are descriptive or unsupported |
| Severity branch validity | 0/101 conditions have distinct adjudicated best/worst outcome branches |
| Python scientific-analysis parity | Python forward MC is simplified and is not canonical TypeScript IMM output without future golden parity tests |
| K15 | Inter-model reference/regression benchmark only; not observed analog-mission validation |

## Prohibited Operational Interpretations

Do not claim, imply, or caption Selectron outputs as:

- candidate selection, rejection, suitability, clearance, or ranking evidence for real people;
- medical or psychological disposition;
- calibrated analog-mission risk prediction;
- mission-success probability;
- NASA-equivalent HSRB verdicts or risk postures;
- medical-kit sizing, adequacy, or optimization;
- cross-habitat safety comparison among MDRS, HI-SEAS, HERA, SIRIUS, Antarctic stations, or other analog platforms;
- causal estimates for isolation, workload, privacy, autonomy, circadian lighting, hygiene, or communications delay.

## Manuscript Freeze Checklist

Before submission:

1. Tag one exact application commit.
2. Run and archive fast, slow, browser, K15, analog, Python, evidence, severity-coverage, and release-freeze logs for that tag.
3. Regenerate figures and tables from the tag.
4. Record the exact prior SHA-256, evidence status, source commit, package version, and source dirty-state flag from `npm run release:freeze`.
5. Replace any legacy `missionSuccess` or MSP wording with composite health-criterion attainment.
6. Report valid accepted evidence coverage as 0/4,849 unless the generated evidence status changes.
7. State that no external analog-outcome validation has been performed.
