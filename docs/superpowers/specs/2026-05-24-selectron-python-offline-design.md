# Selectron Python Offline Calibration Pipeline — Design Spec

**Date:** 2026-05-24
**Owner:** Diego
**Status:** Draft
**Companion docs:** `docs/iter5_priors_rev3_strategy.md`, `docs/iter5_scientific_limitations.md`, `research/imm_sources/methods/G12_gilkey_2012_bayesian_imm.md`

---

## 1. Purpose

The TypeScript IMM engine (`src/imm/`) runs at T=100,000 in-browser and is the runtime source of truth. But the 100 per-condition priors in `src/data/imm-priors.json` were hand-elicited — 41 tier-B conditions rely on a blanket `tierB_multiplier = 0.55` rather than evidence-derived per-condition rates. This Python module replaces hand-elicitation with proper Bayesian inference for those 41 conditions, validates the result against K15 Table 1, writes the updated priors back to the shared JSON, and runs global sensitivity analysis to identify the conditions that drive the most variance.

The pipeline produces artifacts the TS engine consumes. It does not replace the TS engine.

## 2. Scope

### In scope

- **Module 1 (Fitter):** PyMC NUTS lognormal-Poisson posterior fitting for the 41 tier-B conditions, using evidence from `research/evidence_extracted/incidence_rates.csv`.
- **Module 2 (Validator):** Forward MC in Python/numpy (cross-validated against TS engine) to check K15 Table 1 reproduction with the new priors.
- **Module 3 (Writer):** Atomic merge of fitted priors back into `src/data/imm-priors.json`, updating provenance tags.
- **Module 4 (Sensitivity):** Sobol and Morris global sensitivity indices over the 100-condition parameter space via SALib. Produces data for the I6 IMMSensitivityTornado figure.

### Out of scope (deferred)

- LightGBM surrogate model training (Phase 3 ML, Tasks IMM-52–56)
- Vulnerability MLP training (Phase 3 ML, Tasks IMM-57–61)
- Mars/Artemis prior extension
- Real-time Python backend (this is offline/batch only)

## 3. Architecture

```
research/evidence_extracted/
    incidence_rates.csv          ← evidence source (condition_id, person_days, events)
        │
        ▼
python/src/selectron/fitter.py   ← Module 1: PyMC NUTS per condition
        │
        ▼
python/outputs/fitted_priors/    ← per-condition ArviZ InferenceData + summary JSON
        │
        ▼
python/src/selectron/validator.py ← Module 2: numpy forward MC + K15 comparison
        │
        ▼
python/outputs/validation/       ← K15 delta report (JSON + markdown)
        │
        ▼
python/src/selectron/writer.py   ← Module 3: merge fitted priors → imm-priors.json
        │
        ▼
src/data/imm-priors.json         ← shared interchange artifact (TS reads, Python writes)
        │
        ▼
python/src/selectron/sensitivity.py ← Module 4: Sobol/Morris via SALib
        │
        ▼
python/outputs/sensitivity/      ← Sobol indices JSON + tornado data for I6
```

### Directory layout

```
python/
├── pyproject.toml               # project metadata + dependencies
├── src/
│   └── selectron/
│       ├── __init__.py
│       ├── fitter.py            # Module 1: PyMC NUTS lognormal-Poisson
│       ├── validator.py         # Module 2: numpy forward MC + K15 gate
│       ├── writer.py            # Module 3: atomic priors JSON merge
│       ├── sensitivity.py       # Module 4: Sobol/Morris via SALib
│       ├── forward_mc.py        # shared: numpy reimplementation of IMM trial
│       ├── priors_io.py         # shared: load/save imm-priors.json
│       └── k15_reference.py     # shared: K15 Table 1 constants
├── tests/
│   ├── test_fitter.py
│   ├── test_validator.py
│   ├── test_writer.py
│   ├── test_sensitivity.py
│   ├── test_forward_mc.py       # cross-validation against TS engine
│   └── conftest.py              # shared fixtures
├── outputs/                     # gitignored except summary JSONs
│   ├── fitted_priors/
│   ├── validation/
│   └── sensitivity/
└── notebooks/
    └── prior_fitting_walkthrough.ipynb  # interactive exploration
```

## 4. Module Details

### 4.1 Module 1 — Fitter (`fitter.py`)

**Model per G12 §1.2:**

```python
with pm.Model() as model:
    # Prior: λ ~ LogNormal(μ, σ)
    # G12 Eq. (1): σ = ln(EF) / 1.645
    # G12 Appendix C.2: tau = 1/σ², mu = ln(mean) - σ²/2
    mu = pm.Normal("mu", mu=prior_mu, sigma=2.0)
    sigma = pm.HalfNormal("sigma", sigma=1.0)
    lam = pm.LogNormal("lambda", mu=mu, sigma=sigma)

    # Likelihood: events ~ Poisson(λ × person_days)
    obs = pm.Poisson("obs", mu=lam * person_days, observed=events)

    # Inference
    idata = pm.sample(
        draws=2000,
        tune=1000,
        chains=4,
        nuts_sampler="nutpie",
        random_seed=42,
        return_inferencedata=True,
    )
```

**Input:** `incidence_rates.csv` rows filtered by `condition_id`. Multiple rows per condition (different studies) contribute as repeated observations.

**Output per condition:**
- `mu_log_lambda`: posterior mean of μ (the log-rate location)
- `sigma_log_lambda`: posterior mean of σ (the log-rate scale)
- ArviZ `InferenceData` (.nc file) for diagnostics
- Summary JSON: {condition_id, mu, sigma, r_hat, ess_bulk, ess_tail, divergences, n_studies, total_person_days, total_events}

**Convergence criteria (per G12 §1.2):** R̂ < 1.01 AND ESS_bulk > 400 AND zero divergences. Conditions that fail are flagged, not silently included.

**Missing-data handling:** Tier-B conditions with zero rows in `incidence_rates.csv` are skipped with a warning. Their priors remain unchanged (blanket multiplier fallback). The fitter logs which conditions were skipped and why, so Diego can prioritize evidence extraction for those conditions.

**CLI:**
```bash
python -m selectron.fitter --condition depression     # single condition
python -m selectron.fitter --tier B                    # all 41 tier-B
python -m selectron.fitter --tier B --dry-run          # show what would be fit
```

### 4.2 Module 2 — Validator (`validator.py`)

**Python forward MC reimplementation (`forward_mc.py`):**

A numpy-vectorized implementation of the 4-step IMM trial loop:
1. Sample λ from lognormal prior → Poisson(λ × duration) event count
2. Sample severity via Bernoulli(worst_case_prob_q)
3. Compute lost days via linear interpolation (treatment partial credit)
4. Aggregate CHI = 1 − QTL/(t × c)

Run at T=100,000 trials per K15 spec.

**Cross-validation contract:** `test_forward_mc.py` runs both the Python and TS engines on seed `0xc0ffee` with the same priors and asserts TME/CHI/pEVAC/pLOCL match within 0.5%. The TS engine is invoked via:
```bash
npx tsx scripts/validate_imm_explicit_baseline.ts --seed=0xc0ffee --json
```

**K15 gate:** Same reference values as `tests/imm/validation_k15.test.ts`:
- `none`: TME=98.3, CHI=59.20, pEVAC=66.90%, pLOCL=2.89%
- `issHMS`: TME=106, CHI=94.93, pEVAC=5.57%, pLOCL=0.44%
- `unlimited`: TME=106, CHI=94.98, pEVAC=4.93%, pLOCL=0.45%

**Output:** `python/outputs/validation/k15_report.json` + `k15_report.md` with per-metric deltas, CI₉₅ membership, and improvement/regression flags vs. the previous priors.

**CLI:**
```bash
python -m selectron.validator                          # full K15 gate
python -m selectron.validator --scenario issHMS        # single scenario
python -m selectron.validator --compare-to baseline    # diff vs. saved baseline
```

### 4.3 Module 3 — Writer (`writer.py`)

**Merge logic:**
1. Load current `src/data/imm-priors.json`
2. For each fitted tier-B condition: replace `incidence.mu_log_lambda` and `incidence.sigma_log_lambda` with the posterior means from Module 1
3. Update `provenance` to `"tierB-pymc"` and `source_ref` to `"python/outputs/fitted_priors/<condition_id>.json"`
4. Preserve all other fields (severity, treated/untreated outcomes, risk_factor_multipliers, required_resources)
5. Write atomically (write to `.tmp`, validate JSON schema, rename)

**Safety:** `--dry-run` mode shows a diff without writing. `--apply` writes and runs the K15 validator automatically to catch regressions.

**CLI:**
```bash
python -m selectron.writer --dry-run                   # show what would change
python -m selectron.writer --apply                     # write + auto-validate
python -m selectron.writer --apply --skip-validation   # write without K15 check (dangerous)
```

### 4.4 Module 4 — Sensitivity (`sensitivity.py`)

**Global sensitivity analysis via SALib:**

1. Define the parameter space: 100 conditions × {mu_log_lambda, sigma_log_lambda} = 200 parameters
2. Generate Saltelli sample (N=1024 → 200×(1024+2) = ~205k parameter sets)
3. For each parameter set: run the numpy forward MC at T=10,000 (reduced for speed)
4. Compute Sobol first-order (S1) and total-order (ST) indices for each of the 200 parameters on each output metric (TME, CHI, pEVAC, pLOCL)
5. Also compute Morris elementary effects (μ*, σ) as a cheaper screening method

**Output:**
- `python/outputs/sensitivity/sobol_indices.json` — per-condition S1/ST for 4 metrics
- `python/outputs/sensitivity/morris_screening.json` — per-condition μ*/σ
- `python/outputs/sensitivity/tornado_data.json` — sorted by S1(CHI) descending, ready for I6 IMMSensitivityTornado figure consumption

**CLI:**
```bash
python -m selectron.sensitivity --method sobol --n 1024
python -m selectron.sensitivity --method morris --n 100   # fast screening
python -m selectron.sensitivity --output-format echarts    # tornado JSON for I6
```

## 5. Data Contracts

### 5.1 Evidence CSV schema (input to Module 1)

```csv
condition_id,mission_type,study_doi,study_slug,person_days,events,notes,extracted_by,extracted_at_utc
depression,antarctic-winter,10.1176/appi.ajp.161.12.2179,palinkas-2004,114245,13,"mood disorder cases",Diego,2026-05-18
```

### 5.2 imm-priors.json contract (shared with TS)

The Python writer modifies only these fields per condition:
- `incidence.mu_log_lambda` (float)
- `incidence.sigma_log_lambda` (float)
- `provenance` ("tierB-lit" → "tierB-pymc")
- `source_ref` (string, path to fit output)

All other fields are preserved unchanged. The `global_calibration` block is not modified by the writer — tier multipliers are a separate calibration concern.

### 5.3 Tornado data contract (output of Module 4, consumed by I6)

```json
[
  {
    "conditionId": "dental-caries",
    "family": "dental",
    "label": "Dental caries",
    "s1_chi": 0.142,
    "st_chi": 0.168,
    "s1_tme": 0.089,
    "direction": "positive"
  },
  ...
]
```

## 6. Dependencies

```toml
[project]
name = "selectron-offline"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "pymc>=5.16",
    "arviz>=0.18",
    "nutpie>=0.13",
    "numpy>=1.26,<2.0",
    "pandas>=2.2",
    "scipy>=1.12",
    "SALib>=1.5",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
]
```

Virtual environment: `python3 -m venv python/.venv` (per workspace convention — no conda).

## 7. Testing Strategy

| Test | What it validates | Speed |
|------|------------------|-------|
| `test_fitter.py::test_single_condition_convergence` | PyMC fit on dental-caries (tier-A reference) produces μ within 10% of G12 Table 1 | ~30s |
| `test_fitter.py::test_no_data_condition_skipped` | Conditions with zero evidence rows are flagged, not fit | <1s |
| `test_fitter.py::test_divergence_detection` | Pathological priors trigger divergence flag | ~10s |
| `test_forward_mc.py::test_cross_validation_ts` | Python MC matches TS engine within 0.5% on seed 0xc0ffee | ~30s |
| `test_forward_mc.py::test_poisson_gamma_conjugate` | Closed-form conjugate check (same as TS test) | <1s |
| `test_validator.py::test_k15_gate_current_priors` | Current imm-priors.json reproduces 7/12 K15 metrics | ~60s |
| `test_writer.py::test_round_trip` | Load → modify → write → reload → assert match | <1s |
| `test_writer.py::test_schema_preservation` | Non-tier-B conditions unchanged after write | <1s |
| `test_sensitivity.py::test_morris_screening` | Morris on 5-condition subset produces finite indices | ~30s |

Total test time: ~3 minutes. The long tests (fitter, forward_mc, validator) are marked `@pytest.mark.slow` and excluded from the default `pytest` run.

## 8. Workflow

Typical developer workflow:

```bash
# 1. Set up environment
cd python && python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 2. Fit a single condition to test the pipeline
python -m selectron.fitter --condition depression

# 3. Check convergence diagnostics
# → outputs/fitted_priors/depression/summary.json (R̂, ESS, divergences)
# → outputs/fitted_priors/depression/trace_plot.png (ArviZ)

# 4. Fit all 41 tier-B conditions
python -m selectron.fitter --tier B

# 5. Validate against K15
python -m selectron.validator

# 6. If K15 gate passes: write priors
python -m selectron.writer --dry-run    # inspect diff
python -m selectron.writer --apply      # write + auto-validate

# 7. Run sensitivity analysis
python -m selectron.sensitivity --method sobol --n 1024

# 8. Run TS tests to confirm nothing broke
cd .. && npx vitest run tests/imm/validation_k15.test.ts
```

## 9. What This Does NOT Change

- The TS engine (`src/imm/`) is untouched
- The browser UI is untouched
- The `global_calibration` tier multipliers are not modified
- Tier-A (41 NASA-sourced) and tier-C (18 synthetic) priors are not modified
- The K15 validation gate (`tests/imm/validation_k15.test.ts`) remains the acceptance criterion
- The existing evidence OCR pipeline (`research/evidence/`) is read-only

## 10. Success Criteria

1. **Per-condition R̂ < 1.01** on all 41 fitted tier-B conditions (no divergences, ESS_bulk > 400)
2. **K15 gate improvement:** ≥ 7/12 metrics within CI₉₅ (at least as good as current 7/12; goal is 9/12)
3. **Cross-validation:** Python forward MC matches TS engine within 0.5% on same-seed runs
4. **Blanket multiplier retired:** `tierB_multiplier` can be set to 1.0 because per-condition fits carry the incidence information that the multiplier was proxying
5. **Sobol S1 indices:** top-5 conditions by S1(CHI) identified and ranked
6. **Reproducibility:** all fits are seeded and produce identical output across runs
