# Calibration V&V Frontend — Design Spec

**Date:** 2026-05-27
**Scope:** Wire the empty V&V and Sensitivity API routers, replace the V&V placeholder panel with a K15 pass/fail table + sensitivity tornado chart, and upgrade the Batch Fit condition filter to a searchable dropdown with human-readable labels.

---

## 1. Backend — Wire empty API routers

### 1.1 Validation router (`python/api/routers/validate.py`)

- `POST /validate` — accepts `ValidateRequest` (trials: int, seed: int). Runs all 3 K15 scenarios (none/issHMS/unlimited).
- If `trials <= 5000`: run synchronously, return `ValidateResponse` directly.
- If `trials > 5000`: async job pattern (same as `/fit`). Returns `ValidateJobResponse { job_id, status }`. Poll via `GET /validate/{job_id}`.
- Calls `validate_k15()` from `selectron.validator`. Converts `K15ValidationReport` → `ValidateResponse`.
- `ValidateResponse` shape (already in `models.py`): `{ timestamp, trials, seed, n_total, n_within_ci95, metrics: MetricResult[] }`.
- `MetricResult` shape: `{ metric, scenario, observed, reference, ci95_low, ci95_high, delta, within_ci95 }`.

### 1.2 Sensitivity router (`python/api/routers/sensitivity.py`)

- `POST /sensitivity` — accepts `SensitivityRequest` (method: "sobol"|"morris", n_samples: int, trials: int, seed: int) + `top_n: int = 15` (max 30) + optional `condition_ids: list[str] | None`.
- Always async (job pattern). Returns `SensitivityJobResponse { job_id, status }`. Poll via `GET /sensitivity/{job_id}`.
- Calls `run_sobol_analysis()` or `run_morris_screening()` from `selectron.sensitivity`.
- Returns `SensitivityResponse { method, n_params, n_evaluations, indices: SensitivityIndex[] }`.
- `SensitivityIndex`: `{ parameter, condition_id, condition_label, s1, s1_conf, st, st_conf, mu_star, sigma }`. The router maps `parameter` (e.g. `"ankle-sprain-strain_alpha"`) back to `condition_id` and looks up `condition_label` from `IMM_CONDITIONS`.
- Indices sorted descending by primary metric (S1 for Sobol, mu_star for Morris), truncated to `top_n`.

### 1.3 Job store

Reuse the existing `job_store.py` async job infrastructure from the `/fit` router. Add `validate` and `sensitivity` job types.

---

## 2. Frontend API client (`src/api/calibration.ts`)

Add types and functions for validation and sensitivity, following the existing pattern:

**Validation:**
- `ValidateRequest { trials: number; seed: number }`
- `MetricResult { metric, scenario, observed, reference, ci95_low, ci95_high, delta, within_ci95 }`
- `ValidateResponse { timestamp, trials, seed, n_total, n_within_ci95, metrics: MetricResult[] }`
- `ValidateJobResponse { job_id, status }`
- `startValidation(req) → ValidateJobResponse`
- `getValidationStatus(jobId) → JobStatusResponse` (reuse existing shape, result field is `ValidateResponse | null`)

**Sensitivity:**
- `SensitivityRequest { method, n_samples, trials, seed, top_n }`
- `SensitivityIndex { parameter, condition_id, condition_label, s1, s1_conf, st, st_conf, mu_star, sigma }`
- `SensitivityResponse { method, n_params, n_evaluations, indices: SensitivityIndex[] }`
- `startSensitivity(req) → SensitivityJobResponse`
- `getSensitivityStatus(jobId) → JobStatusResponse`

---

## 3. V&V Panel (replaces `PlaceholderPanel`)

File: `src/ui/views/calibration/VVPanel.tsx` (replaces `PlaceholderPanel.tsx`).

### 3.1 Layout

Single scrollable panel with two sections separated by a divider. Each section has its own config form and Run button.

### 3.2 Validation section (top)

**Config form:**
- Trial count: button group (1k / 5k / 10k / 50k / 100k), default 10k.
- Seed: number input, default `0xc0ffee` (12648430).

**Run button:** "Run K15 Validation". Same running/polling UX as BatchFitPanel.

**Result display — pass/fail table:**
- Grouped by scenario (none / issHMS / unlimited), each with a header row.
- Columns: Metric | Observed | Reference | CI₉₅ | Delta | Status.
- Status column: green `PASS` badge if `within_ci95`, red `FAIL` badge otherwise.
- Summary line above table: `"N/12 within K15 CI₉₅"` with green/amber/red color (green if >=6, amber if >=3, red otherwise).

**Design tokens:** Same as existing panels — `panel`, `mono text-[11px]`, `label`, `text-go`/`text-warn` for pass/fail.

### 3.3 Sensitivity section (bottom)

**Config form:**
- Method: toggle button group (Sobol / Morris), default Morris (faster).
- N samples: number input, default 10 (Morris trajectories) or 64 (Sobol N).
- Trials per eval: number input, default 1000.
- Top N: dropdown (5 / 10 / 15 / 20 / 30), default 15.
- Seed: number input, default 42.

**Run button:** "Run Sensitivity Analysis". Async job poll.

**Result display:**
- **ECharts tornado chart** (see Section 5).
- Below chart: collapsible table with numeric indices for reference. Columns depend on method:
  - Sobol: Condition | S1 | S1 conf | ST | ST conf
  - Morris: Condition | mu* | sigma

---

## 4. Batch Fit condition dropdown

File: `src/ui/views/calibration/BatchFitPanel.tsx` — replace the free-text `conditionFilter` input.

**Component:** `ConditionCombobox` (inline in BatchFitPanel or small extracted component).

**Data source:** Import `IMM_CONDITIONS` from `src/imm/conditions.ts`. Each entry has `.id` (kebab-case) and `.label` (human-readable).

**Behavior:**
- Controlled text input with a dropdown list.
- Typeahead filtering: matches against both `.label` and `.id` (case-insensitive substring).
- First option: "All fittable" (sends `condition_id: null`).
- Each option displays: **label** in primary text, **id** in smaller secondary text.
- Non-fittable conditions (those where `IMM_CONDITIONS[].incidenceDist` is not `"Gamma"`) are shown grayed out with `opacity-40 cursor-not-allowed` and are not selectable.
- Click outside or Escape closes the dropdown.
- On selection, the input shows the label, the internal state stores the id.

**Styling:** Consistent with existing inputs — `mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm`. Dropdown: `absolute z-10 bg-bg-1 border border-line rounded-sm shadow-lg max-h-64 overflow-y-auto`.

---

## 5. ECharts tornado component

File: `src/ui/figures/SensitivityTornado.tsx`.

**Props:**
```typescript
interface SensitivityTornadoProps {
  indices: SensitivityIndex[];
  method: "sobol" | "morris";
  topN: number;
}
```

**Chart type:** Horizontal bar chart (`type: "bar"` with `yAxis: "category"`, `xAxis: "value"`).

**Registration:** Uses existing `echarts-base.ts` (already has `BarChart` + `GridComponent`). Uses `NATURE_THEME_NAME`.

**Sobol rendering:**
- Two overlapping series: S1 (solid Okabe-Ito blue `#0072B2`) and ST (semi-transparent orange `#E69F00` at 60% opacity).
- Sorted descending by S1.
- Tooltip shows: condition label, S1 +/- conf, ST +/- conf.

**Morris rendering:**
- Single bar series (mu*, Okabe-Ito blue).
- Error whiskers for sigma if available (via `markLine` or custom render).
- Sorted descending by mu*.

**Labels:** Y-axis labels are `condition_label` truncated at 25 chars. Full name in tooltip.

**Layout:** `grid.left` wide enough for labels (~180px). Height scales with topN (40px per bar, min 300px).

---

## 6. Wiring

- `Calibration.tsx`: change `tab === "validation"` to render `<VVPanel />` instead of `<PlaceholderPanel />`. Update tab tag from `"soon"` to `"gate"`.
- `PlaceholderPanel.tsx`: delete after VVPanel ships.

---

## 7. Non-goals

- No persistent storage of validation/sensitivity results (run and view, not save).
- No condition-level drill-down from the tornado chart (future scope).
- No Mars/interplanetary scenarios in validation (explicitly out of scope per STATUS.md).
