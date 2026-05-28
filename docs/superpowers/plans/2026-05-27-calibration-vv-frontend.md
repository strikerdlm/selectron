# Calibration V&V Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the empty V&V and Sensitivity API routers, replace the placeholder panel with a K15 pass/fail table and sensitivity tornado chart, and upgrade the Batch Fit condition filter to a searchable combobox.

**Architecture:** Python FastAPI backend has complete engine modules (`validator.py`, `sensitivity.py`) and Pydantic models (`models.py`) but empty router stubs. Frontend has a `PlaceholderPanel` for V&V. We wire the routers using the same async job pattern as `/fit`, add TS API client types, build the V&V panel with two sections (validation table + sensitivity tornado), and replace the Batch Fit text input with a combobox sourced from `IMM_CONDITIONS`.

**Tech Stack:** Python 3.12 / FastAPI / Pydantic, TypeScript / React 18 / Tailwind 3.4, ECharts 6 (via `echarts-base.ts` + `selectron-nature` theme), Vitest.

**Spec:** `docs/superpowers/specs/2026-05-27-calibration-vv-frontend.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `python/api/routers/validate.py` | K15 validation async job endpoint |
| Modify | `python/api/routers/sensitivity.py` | Sobol/Morris async job endpoint |
| Modify | `python/api/models.py` | Add `ValidateJobResponse`, `SensitivityJobResponse` |
| Modify | `src/api/calibration.ts` | TS client: validate + sensitivity types and fetch functions |
| Create | `src/ui/views/calibration/VVPanel.tsx` | V&V panel with validation table + sensitivity section |
| Create | `src/ui/figures/SensitivityTornado.tsx` | ECharts horizontal bar tornado chart |
| Create | `src/ui/views/calibration/ConditionCombobox.tsx` | Searchable dropdown for condition selection |
| Modify | `src/ui/views/calibration/BatchFitPanel.tsx` | Replace text input with ConditionCombobox |
| Modify | `src/ui/views/Calibration.tsx` | Wire VVPanel, update tab label |
| Delete | `src/ui/views/calibration/PlaceholderPanel.tsx` | Replaced by VVPanel |

---

### Task 1: Validation API Router

**Files:**
- Modify: `python/api/routers/validate.py`
- Modify: `python/api/models.py`

- [ ] **Step 1: Add `ValidateJobResponse` to models**

In `python/api/models.py`, add after the `SensitivityResponse` class:

```python
class ValidateJobResponse(BaseModel):
    job_id: str
    status: str
```

- [ ] **Step 2: Implement the validation router**

Replace the contents of `python/api/routers/validate.py`:

```python
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import ValidateRequest, ValidateJobResponse, JobStatusResponse, ValidateResponse, MetricResult
from ..dependencies import IMM_PRIORS_PATH
from selectron.validator import validate_k15

logger = logging.getLogger(__name__)
router = APIRouter()


async def _run_validation(job_id: str, trials: int, seed: int) -> None:
    try:
        store.update(job_id, status="running")
        report = validate_k15(
            trials=trials,
            seed=seed,
            scenarios=["none", "issHMS", "unlimited"],
            priors_path=IMM_PRIORS_PATH,
        )
        metrics = []
        for m in report.metrics:
            metrics.append({
                "metric": m.metric,
                "scenario": m.scenario,
                "observed": round(m.observed, 4),
                "reference": round(m.reference, 4),
                "ci95_low": round(m.ci95[0], 4),
                "ci95_high": round(m.ci95[1], 4),
                "delta": round(m.delta, 4),
                "within_ci95": m.within_ci95,
            })
        store.update(
            job_id,
            status="done",
            result={
                "timestamp": report.timestamp,
                "trials": report.trials,
                "seed": report.seed,
                "n_total": report.n_total,
                "n_within_ci95": report.n_within_ci95,
                "metrics": metrics,
            },
        )
    except Exception as exc:
        logger.exception("Validation job %s failed", job_id)
        store.update(job_id, status="failed", error=str(exc))


@router.post("", response_model=ValidateJobResponse)
async def start_validation(request: ValidateRequest, background_tasks: BackgroundTasks):
    job = store.create()
    if request.trials <= 5000:
        await _run_validation(job.id, request.trials, request.seed)
        return ValidateJobResponse(job_id=job.id, status="done")
    background_tasks.add_task(_run_validation, job.id, request.trials, request.seed)
    return ValidateJobResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_validation_status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        result=job.result,
        error=job.error,
    )
```

- [ ] **Step 3: Smoke-test the API**

```bash
cd /root/repos/Selectron/python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000 &
sleep 2
curl -s -X POST http://localhost:8000/validate \
  -H "Content-Type: application/json" \
  -d '{"trials": 1000, "seed": 42}' | python3 -m json.tool
# Expect: {"job_id": "...", "status": "done"}
# Then fetch result:
# curl -s http://localhost:8000/validate/<job_id> | python3 -m json.tool
# Expect: result with 12 MetricResult entries
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add python/api/routers/validate.py python/api/models.py
git commit -m "feat(api): wire K15 validation router with async job pattern"
```

---

### Task 2: Sensitivity API Router

**Files:**
- Modify: `python/api/routers/sensitivity.py`
- Modify: `python/api/models.py`

- [ ] **Step 1: Add `SensitivityJobResponse` and update `SensitivityRequest` in models**

In `python/api/models.py`, add:

```python
class SensitivityJobResponse(BaseModel):
    job_id: str
    status: str
```

Also update `SensitivityRequest` to add `top_n` and `condition_ids`:

```python
class SensitivityRequest(BaseModel):
    method: Literal["sobol", "morris"] = "morris"
    n_samples: int = 10
    trials: int = 1000
    seed: int = 42
    top_n: int = 15
    condition_ids: list[str] | None = None
```

- [ ] **Step 2: Implement the sensitivity router**

Replace the contents of `python/api/routers/sensitivity.py`:

```python
import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..job_store import store
from ..models import SensitivityRequest, SensitivityJobResponse, JobStatusResponse
from selectron.sensitivity import run_morris_screening, run_sobol_analysis
from selectron.priors_io import load_priors

logger = logging.getLogger(__name__)
router = APIRouter()

# Build a condition_id → label map from imm-priors.json condition IDs.
# The sensitivity engine uses "{cid}_alpha"/"{cid}_beta" as parameter names.
def _build_label_map() -> dict[str, str]:
    """Map condition-id to human-readable label (title-cased from kebab)."""
    priors = load_priors()
    return {
        cid: cid.replace("-", " ").title()
        for cid in priors["conditions"]
    }


def _extract_condition_id(param_name: str) -> str:
    """'ankle-sprain-strain_alpha' → 'ankle-sprain-strain'."""
    for suffix in ("_alpha", "_beta"):
        if param_name.endswith(suffix):
            return param_name[: -len(suffix)]
    return param_name


async def _run_sensitivity(
    job_id: str,
    method: str,
    n_samples: int,
    trials: int,
    seed: int,
    top_n: int,
    condition_ids: list[str] | None,
) -> None:
    try:
        store.update(job_id, status="running")

        priors = load_priors()
        all_gp_ids = [
            cid for cid, p in priors["conditions"].items()
            if p["incidence"]["distribution"] == "Gamma-Poisson"
        ]
        ids_to_use = condition_ids if condition_ids else all_gp_ids

        if method == "morris":
            report = run_morris_screening(
                condition_ids=ids_to_use,
                n_trajectories=n_samples,
                trials_per_eval=trials,
                seed=seed,
            )
        else:
            report = run_sobol_analysis(
                condition_ids=ids_to_use,
                n_samples=n_samples,
                trials_per_eval=trials,
                seed=seed,
            )

        label_map = _build_label_map()

        # Aggregate alpha+beta per condition: take max of primary index
        cond_agg: dict[str, dict] = {}
        for idx in report.indices:
            name = idx.get("name", idx.get("parameter", ""))
            cid = _extract_condition_id(name)
            label = label_map.get(cid, cid.replace("-", " ").title())

            if cid not in cond_agg:
                cond_agg[cid] = {
                    "parameter": cid,
                    "condition_id": cid,
                    "condition_label": label,
                    "s1": None, "s1_conf": None,
                    "st": None, "st_conf": None,
                    "mu_star": None, "sigma": None,
                }

            entry = cond_agg[cid]
            if method == "sobol":
                s1 = idx.get("S1", 0)
                st = idx.get("ST", 0)
                if entry["s1"] is None or abs(s1) > abs(entry["s1"]):
                    entry["s1"] = round(s1, 6)
                    entry["s1_conf"] = round(idx.get("S1_conf", 0), 6)
                if entry["st"] is None or abs(st) > abs(entry["st"]):
                    entry["st"] = round(st, 6)
                    entry["st_conf"] = round(idx.get("ST_conf", 0), 6)
            else:
                ms = idx.get("mu_star", 0)
                if entry["mu_star"] is None or ms > entry["mu_star"]:
                    entry["mu_star"] = round(ms, 6)
                    entry["sigma"] = round(idx.get("sigma", 0), 6)

        # Sort and truncate
        sort_key = "s1" if method == "sobol" else "mu_star"
        sorted_indices = sorted(
            cond_agg.values(),
            key=lambda x: abs(x.get(sort_key) or 0),
            reverse=True,
        )[:top_n]

        store.update(
            job_id,
            status="done",
            result={
                "method": report.method,
                "n_params": report.n_params,
                "n_evaluations": report.n_evaluations,
                "indices": sorted_indices,
            },
        )
    except Exception as exc:
        logger.exception("Sensitivity job %s failed", job_id)
        store.update(job_id, status="failed", error=str(exc))


@router.post("", response_model=SensitivityJobResponse)
async def start_sensitivity(request: SensitivityRequest, background_tasks: BackgroundTasks):
    job = store.create()
    background_tasks.add_task(
        _run_sensitivity,
        job.id,
        request.method,
        request.n_samples,
        request.trials,
        request.seed,
        request.top_n,
        request.condition_ids,
    )
    return SensitivityJobResponse(job_id=job.id, status=job.status)


@router.get("/{job_id}", response_model=JobStatusResponse)
async def get_sensitivity_status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(
        job_id=job.id,
        status=job.status,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
        result=job.result,
        error=job.error,
    )
```

- [ ] **Step 3: Smoke-test the sensitivity endpoint**

```bash
cd /root/repos/Selectron/python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000 &
sleep 2
# Morris with small N (fast):
curl -s -X POST http://localhost:8000/sensitivity \
  -H "Content-Type: application/json" \
  -d '{"method":"morris","n_samples":4,"trials":100,"seed":42,"top_n":5,"condition_ids":["depression","anxiety","dental-caries"]}' | python3 -m json.tool
# Expect: {"job_id":"...","status":"queued"}
sleep 15
# curl -s http://localhost:8000/sensitivity/<job_id> | python3 -m json.tool
kill %1
```

- [ ] **Step 4: Commit**

```bash
git add python/api/routers/sensitivity.py python/api/models.py
git commit -m "feat(api): wire sensitivity router with Sobol/Morris + async jobs"
```

---

### Task 3: Frontend API Client Types

**Files:**
- Modify: `src/api/calibration.ts`

- [ ] **Step 1: Add validation types and functions**

Append to `src/api/calibration.ts`:

```typescript
// ── Validation ────────────────────────────────────────────────────────────

export interface ValidateRequest {
  trials: number;
  seed: number;
}

export interface MetricResult {
  metric: string;
  scenario: string;
  observed: number;
  reference: number;
  ci95_low: number;
  ci95_high: number;
  delta: number;
  within_ci95: boolean;
}

export interface ValidateResponse {
  timestamp: string;
  trials: number;
  seed: number;
  n_total: number;
  n_within_ci95: number;
  metrics: MetricResult[];
}

export interface ValidateJobResponse {
  job_id: string;
  status: string;
}

export function startValidation(request: ValidateRequest): Promise<ValidateJobResponse> {
  return _fetch<ValidateJobResponse>("/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function getValidationStatus(jobId: string): Promise<JobStatusResponse> {
  return _fetch<JobStatusResponse>(`/validate/${encodeURIComponent(jobId)}`);
}
```

- [ ] **Step 2: Add sensitivity types and functions**

Append to `src/api/calibration.ts`:

```typescript
// ── Sensitivity ───────────────────────────────────────────────────────────

export interface SensitivityRequest {
  method: "sobol" | "morris";
  n_samples: number;
  trials: number;
  seed: number;
  top_n: number;
}

export interface SensitivityIndex {
  parameter: string;
  condition_id: string;
  condition_label: string;
  s1: number | null;
  s1_conf: number | null;
  st: number | null;
  st_conf: number | null;
  mu_star: number | null;
  sigma: number | null;
}

export interface SensitivityResponse {
  method: string;
  n_params: number;
  n_evaluations: number;
  indices: SensitivityIndex[];
}

export interface SensitivityJobResponse {
  job_id: string;
  status: string;
}

export function startSensitivity(request: SensitivityRequest): Promise<SensitivityJobResponse> {
  return _fetch<SensitivityJobResponse>("/sensitivity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function getSensitivityStatus(jobId: string): Promise<JobStatusResponse> {
  return _fetch<JobStatusResponse>(`/sensitivity/${encodeURIComponent(jobId)}`);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/api/calibration.ts
git commit -m "feat(api): add validation + sensitivity TS client types"
```

---

### Task 4: SensitivityTornado ECharts Component

**Files:**
- Create: `src/ui/figures/SensitivityTornado.tsx`

- [ ] **Step 1: Create the tornado chart component**

Create `src/ui/figures/SensitivityTornado.tsx`:

```tsx
import { useEffect, useRef } from "react";
import { echarts } from "./echarts-base";
import { NATURE_THEME_NAME } from "./theme";
import type { SensitivityIndex } from "@/api/calibration";

interface SensitivityTornadoProps {
  indices: SensitivityIndex[];
  method: "sobol" | "morris";
  topN: number;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function SensitivityTornado({ indices, method, topN }: SensitivityTornadoProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, NATURE_THEME_NAME);
    instanceRef.current = chart;

    const sorted = [...indices]
      .sort((a, b) => {
        const va = method === "sobol" ? Math.abs(a.s1 ?? 0) : Math.abs(a.mu_star ?? 0);
        const vb = method === "sobol" ? Math.abs(b.s1 ?? 0) : Math.abs(b.mu_star ?? 0);
        return va - vb; // ascending so top of chart = highest
      })
      .slice(-topN);

    const labels = sorted.map((d) => truncate(d.condition_label, 25));
    const fullLabels = sorted.map((d) => d.condition_label);

    const series: echarts.EChartsOption["series"] =
      method === "sobol"
        ? [
            {
              name: "S1 (first-order)",
              type: "bar",
              data: sorted.map((d) => d.s1 ?? 0),
              itemStyle: { color: "#0072B2" },
              barGap: "-100%",
              barWidth: "60%",
            },
            {
              name: "ST (total-order)",
              type: "bar",
              data: sorted.map((d) => d.st ?? 0),
              itemStyle: { color: "rgba(230, 159, 0, 0.5)" },
              barWidth: "60%",
            },
          ]
        : [
            {
              name: "μ* (Morris)",
              type: "bar",
              data: sorted.map((d) => d.mu_star ?? 0),
              itemStyle: { color: "#0072B2" },
              barWidth: "60%",
            },
          ];

    chart.setOption({
      grid: { left: 180, right: 40, top: 20, bottom: 40, containLabel: false },
      xAxis: {
        type: "value",
        name: method === "sobol" ? "Sensitivity Index" : "μ* (mean absolute effect)",
        nameLocation: "center",
        nameGap: 28,
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 10 },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const idx = params[0]?.dataIndex;
          if (idx == null) return "";
          const label = fullLabels[idx];
          const d = sorted[idx];
          if (method === "sobol") {
            return `<b>${label}</b><br/>S1: ${(d.s1 ?? 0).toFixed(4)} ± ${(d.s1_conf ?? 0).toFixed(4)}<br/>ST: ${(d.st ?? 0).toFixed(4)} ± ${(d.st_conf ?? 0).toFixed(4)}`;
          }
          return `<b>${label}</b><br/>μ*: ${(d.mu_star ?? 0).toFixed(4)}<br/>σ: ${(d.sigma ?? 0).toFixed(4)}`;
        },
      },
      legend: method === "sobol" ? { show: true } : { show: false },
      series,
    });

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
    };
  }, [indices, method, topN]);

  const height = Math.max(300, topN * 40);

  return <div ref={chartRef} style={{ width: "100%", height }} />;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/figures/SensitivityTornado.tsx
git commit -m "feat(ui): SensitivityTornado ECharts horizontal bar chart"
```

---

### Task 5: ConditionCombobox Component

**Files:**
- Create: `src/ui/views/calibration/ConditionCombobox.tsx`

- [ ] **Step 1: Create the combobox component**

Create `src/ui/views/calibration/ConditionCombobox.tsx`:

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { IMM_CONDITIONS } from "@/imm/conditions";

interface ConditionComboboxProps {
  value: string | null;
  onChange: (conditionId: string | null) => void;
}

export function ConditionCombobox({ value, onChange }: ConditionComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const cond = IMM_CONDITIONS.find((c) => c.id === value);
    return cond?.label ?? value;
  }, [value]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return IMM_CONDITIONS;
    return IMM_CONDITIONS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string | null) {
    onChange(id);
    setQuery("");
    setOpen(false);
  }

  const isFittable = (c: (typeof IMM_CONDITIONS)[number]) =>
    c.incidenceDist === "Gamma";

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? query : value ? selectedLabel : ""}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="All fittable conditions"
        className="w-full mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal placeholder:text-ink-3"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-bg-1 border border-line rounded-sm shadow-lg max-h-64 overflow-y-auto">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full text-left px-3 py-2 hover:bg-bg-2/50 transition-colors border-b border-line/50"
          >
            <span className="mono text-[11px] text-signal">All fittable</span>
          </button>
          {filtered.map((c) => {
            const fittable = isFittable(c);
            return (
              <button
                key={c.id}
                type="button"
                disabled={!fittable}
                onClick={() => fittable && handleSelect(c.id)}
                className={`w-full text-left px-3 py-1.5 transition-colors ${
                  fittable
                    ? "hover:bg-bg-2/50 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                <div className="mono text-[11px] text-ink-0">{c.label}</div>
                <div className="mono text-[10px] text-ink-3">{c.id}</div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-2 mono text-[10px] text-ink-3">no matches</div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into BatchFitPanel**

In `src/ui/views/calibration/BatchFitPanel.tsx`:

1. Add import at top:
```typescript
import { ConditionCombobox } from "./ConditionCombobox";
```

2. Change state from `const [conditionFilter, setConditionFilter] = useState("")` to:
```typescript
const [conditionId, setConditionId] = useState<string | null>(null);
```

3. Replace the condition filter `<div className="flex flex-col gap-1">` block (lines 165-174) with:
```tsx
<div className="flex flex-col gap-1">
  <label className="label text-ink-3">condition</label>
  <ConditionCombobox value={conditionId} onChange={setConditionId} />
</div>
```

4. In `handleStart`, change `condition_id: conditionFilter.trim() || null` to:
```typescript
condition_id: conditionId,
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/ui/views/calibration/ConditionCombobox.tsx src/ui/views/calibration/BatchFitPanel.tsx
git commit -m "feat(ui): searchable condition combobox for Batch Fit panel"
```

---

### Task 6: VVPanel — Validation Section

**Files:**
- Create: `src/ui/views/calibration/VVPanel.tsx`

- [ ] **Step 1: Create VVPanel with validation section**

Create `src/ui/views/calibration/VVPanel.tsx`:

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MetricResult,
  type ValidateResponse,
  type SensitivityIndex,
  type SensitivityResponse,
  startValidation,
  getValidationStatus,
  startSensitivity,
  getSensitivityStatus,
} from "@/api/calibration";
import { SensitivityTornado } from "@/ui/figures/SensitivityTornado";

const TRIAL_OPTIONS = [1_000, 5_000, 10_000, 50_000, 100_000];
const DEFAULT_SEED = 0xc0ffee;
const TOP_N_OPTIONS = [5, 10, 15, 20, 30];
const SCENARIO_ORDER = ["none", "issHMS", "unlimited"];

function fmtDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function StatusBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <span className="mono text-[10px] uppercase tracking-cap text-go">pass</span>
  ) : (
    <span className="mono text-[10px] uppercase tracking-cap text-warn">fail</span>
  );
}

function SummaryBadge({ n, total }: { n: number; total: number }) {
  const color = n >= 6 ? "text-go" : n >= 3 ? "text-signal" : "text-warn";
  return (
    <span className={`label ${color}`}>
      {n}/{total} within K15 CI₉₅
    </span>
  );
}

// ── Validation Section ──────────────────────────────────────────────────

function ValidationSection() {
  const [trials, setTrials] = useState(10_000);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidateResponse | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running || !startTime) return;
    const t = setInterval(() => {
      if (mounted.current) setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const checkJob = useCallback(async (jobId: string) => {
    try {
      const status = await getValidationStatus(jobId);
      if (!mounted.current) return;
      if (status.status === "done" && status.result) {
        setResult(status.result as unknown as ValidateResponse);
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else if (status.status === "failed") {
        setError(status.error ?? "Unknown error");
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, []);

  async function handleRun() {
    setError(null);
    setResult(null);
    setElapsed(0);
    setRunning(true);
    setStartTime(Date.now());
    try {
      const res = await startValidation({ trials, seed });
      if (!mounted.current) return;
      if (res.status === "done") {
        await checkJob(res.job_id);
      } else {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(() => checkJob(res.job_id), 2000);
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  }

  const groupedMetrics: Record<string, MetricResult[]> = {};
  if (result) {
    for (const m of result.metrics) {
      (groupedMetrics[m.scenario] ??= []).push(m);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-x-3">
        <h3 className="display text-xl text-ink-0 tracking-tight">K15 Validation Gate</h3>
        <span className="label text-ink-3">3 scenarios × 4 metrics</span>
      </div>

      {/* Config */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">trials</label>
          <div className="flex gap-1">
            {TRIAL_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrials(t)}
                className={`mono text-[10px] px-2 py-1 border rounded-sm transition-colors ${
                  trials === t
                    ? "border-signal text-signal bg-signal/10"
                    : "border-line text-ink-2 hover:text-ink-0"
                }`}
              >
                {t >= 1000 ? `${t / 1000}k` : t}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">seed</label>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number(e.target.value))}
            className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-28"
          />
        </div>
        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className={`mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-sm transition-colors ${
            running
              ? "border-line text-ink-3 cursor-not-allowed"
              : "border-signal text-signal hover:bg-signal/10"
          }`}
        >
          {running ? "Running…" : "▶ Run Validation"}
        </button>
        {running && (
          <span className="flex items-center gap-2">
            <span className="signal-dot" />
            <span className="mono text-[11px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[11px] text-warn">{error}</p>
        </div>
      )}

      {/* Results table */}
      {result && (
        <div className="panel p-6 fadein space-y-4">
          <div className="flex items-baseline gap-x-3">
            <h4 className="display text-lg text-ink-0 tracking-tight">Results</h4>
            <SummaryBadge n={result.n_within_ci95} total={result.n_total} />
            <span className="mono text-[10px] text-ink-3 ml-auto">
              T={result.trials.toLocaleString()} · {fmtDuration(elapsed)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line">
                  {["Metric", "Observed", "Reference", "CI₉₅", "Δ", "Status"].map((h) => (
                    <th key={h} className="label px-3 py-2 text-ink-3 sticky top-0 bg-bg-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCENARIO_ORDER.map((scenario) => {
                  const metrics = groupedMetrics[scenario];
                  if (!metrics) return null;
                  return [
                    <tr key={`h-${scenario}`} className="border-b border-line bg-bg-2/30">
                      <td colSpan={6} className="px-3 py-1.5 mono text-[10px] uppercase tracking-cap text-ink-2">
                        {scenario}
                      </td>
                    </tr>,
                    ...metrics.map((m) => (
                      <tr key={`${scenario}-${m.metric}`} className="border-b border-line/50 hover:bg-bg-2/50 transition-colors">
                        <td className="px-3 py-2 mono text-[11px] text-ink-0">{m.metric}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.observed.toFixed(2)}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.reference.toFixed(2)}</td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-2">
                          [{m.ci95_low.toFixed(2)}, {m.ci95_high.toFixed(2)}]
                        </td>
                        <td className="px-3 py-2 mono text-[11px] text-ink-1">{m.delta >= 0 ? "+" : ""}{m.delta.toFixed(2)}</td>
                        <td className="px-3 py-2"><StatusBadge pass={m.within_ci95} /></td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sensitivity Section ─────────────────────────────────────────────────

function SensitivitySection() {
  const [method, setMethod] = useState<"sobol" | "morris">("morris");
  const [nSamples, setNSamples] = useState(10);
  const [trialsPerEval, setTrialsPerEval] = useState(1000);
  const [topN, setTopN] = useState(15);
  const [seed, setSeed] = useState(42);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SensitivityResponse | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running || !startTime) return;
    const t = setInterval(() => {
      if (mounted.current) setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(t);
  }, [running, startTime]);

  const checkJob = useCallback(async (jobId: string) => {
    try {
      const status = await getSensitivityStatus(jobId);
      if (!mounted.current) return;
      if (status.status === "done" && status.result) {
        setResult(status.result as unknown as SensitivityResponse);
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      } else if (status.status === "failed") {
        setError(status.error ?? "Unknown error");
        setRunning(false);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, []);

  async function handleRun() {
    setError(null);
    setResult(null);
    setElapsed(0);
    setRunning(true);
    setStartTime(Date.now());
    try {
      const res = await startSensitivity({
        method,
        n_samples: nSamples,
        trials: trialsPerEval,
        seed,
        top_n: topN,
      });
      if (!mounted.current) return;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => checkJob(res.job_id), 3000);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : String(e));
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline gap-x-3">
        <h3 className="display text-xl text-ink-0 tracking-tight">Sensitivity Analysis</h3>
        <span className="label text-ink-3">Sobol / Morris</span>
      </div>

      {/* Config */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">method</label>
          <div className="flex gap-1">
            {(["morris", "sobol"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setNSamples(m === "morris" ? 10 : 64);
                }}
                className={`mono text-[10px] px-2 py-1 border rounded-sm transition-colors ${
                  method === m
                    ? "border-signal text-signal bg-signal/10"
                    : "border-line text-ink-2 hover:text-ink-0"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        {[
          { label: method === "morris" ? "trajectories" : "N samples", value: nSamples, onChange: setNSamples, min: 2, max: 2048 },
          { label: "trials/eval", value: trialsPerEval, onChange: setTrialsPerEval, min: 100, max: 100_000 },
          { label: "seed", value: seed, onChange: setSeed, min: 0, max: 999999 },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1">
            <label className="label text-ink-3">{f.label}</label>
            <input
              type="number"
              min={f.min}
              max={f.max}
              value={f.value}
              onChange={(e) => f.onChange(Number(e.target.value))}
              className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal w-24"
            />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="label text-ink-3">top N</label>
          <select
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="mono text-[11px] bg-bg-1 border border-line text-ink-1 px-2 py-1.5 rounded-sm focus:outline-none focus:border-signal cursor-pointer"
          >
            {TOP_N_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          disabled={running}
          onClick={handleRun}
          className={`mono uppercase tracking-cap text-[11px] px-4 py-2 border rounded-sm transition-colors ${
            running
              ? "border-line text-ink-3 cursor-not-allowed"
              : "border-signal text-signal hover:bg-signal/10"
          }`}
        >
          {running ? "Running…" : "▶ Run Analysis"}
        </button>
        {running && (
          <span className="flex items-center gap-2">
            <span className="signal-dot" />
            <span className="mono text-[11px] text-ink-2">{fmtDuration(elapsed)}</span>
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="panel p-4 border-warn/50">
          <p className="mono text-[11px] text-warn">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="panel p-6 fadein space-y-4">
          <div className="flex items-baseline gap-x-3">
            <h4 className="display text-lg text-ink-0 tracking-tight">
              {result.method === "sobol" ? "Sobol" : "Morris"} — Top {result.indices.length}
            </h4>
            <span className="label text-ink-3">
              {result.n_evaluations.toLocaleString()} evaluations · {fmtDuration(elapsed)}
            </span>
          </div>

          <SensitivityTornado indices={result.indices} method={method} topN={topN} />

          {/* Numeric table (collapsible) */}
          <details>
            <summary className="mono text-[10px] uppercase tracking-cap text-ink-2 cursor-pointer hover:text-ink-0 transition-colors">
              numeric indices
            </summary>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line">
                    {method === "sobol"
                      ? ["Condition", "S1", "S1 conf", "ST", "ST conf"]
                      : ["Condition", "μ*", "σ"]
                    }
                    {/* workaround: map header */}
                  </tr>
                </thead>
                <thead>
                  <tr className="border-b border-line">
                    {(method === "sobol"
                      ? ["Condition", "S1", "S1 conf", "ST", "ST conf"]
                      : ["Condition", "μ*", "σ"]
                    ).map((h) => (
                      <th key={h} className="label px-3 py-2 text-ink-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.indices.map((d) => (
                    <tr key={d.condition_id} className="border-b border-line/50 hover:bg-bg-2/50 transition-colors">
                      <td className="px-3 py-2 mono text-[11px] text-ink-0">{d.condition_label}</td>
                      {method === "sobol" ? (
                        <>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.s1 ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.s1_conf ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.st ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.st_conf ?? 0).toFixed(4)}</td>
                        </>
                      ) : (
                        <>
                          <td className="px-3 py-2 mono text-[11px] text-ink-1">{(d.mu_star ?? 0).toFixed(4)}</td>
                          <td className="px-3 py-2 mono text-[11px] text-ink-2">{(d.sigma ?? 0).toFixed(4)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ── Main VV Panel ────────────────────────────────────────────────────────

export function VVPanel() {
  return (
    <div className="fadein space-y-8">
      <ValidationSection />
      <div className="border-t border-line" />
      <SensitivitySection />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/ui/views/calibration/VVPanel.tsx
git commit -m "feat(ui): VVPanel with K15 validation table + sensitivity tornado"
```

---

### Task 7: Wire VVPanel into Calibration View

**Files:**
- Modify: `src/ui/views/Calibration.tsx`
- Delete: `src/ui/views/calibration/PlaceholderPanel.tsx`

- [ ] **Step 1: Update Calibration.tsx**

In `src/ui/views/Calibration.tsx`:

1. Replace the `PlaceholderPanel` import with:
```typescript
import { VVPanel } from "./calibration/VVPanel";
```

2. Change the tab label tag from `"soon"` to `"gate"`:
```typescript
validation: { label: "V&V", tag: "gate" },
```

3. Change the panel render from `<PlaceholderPanel />` to `<VVPanel />`:
```tsx
{tab === "validation" && <VVPanel />}
```

- [ ] **Step 2: Delete PlaceholderPanel**

```bash
trash src/ui/views/calibration/PlaceholderPanel.tsx
```

- [ ] **Step 3: Verify TypeScript compiles and dev server runs**

```bash
npx tsc --noEmit
npm run dev &
# Open http://localhost:5173 → Calibration tab → V&V tab
# Verify the panel renders with the two sections.
kill %1
```

- [ ] **Step 4: Fix the duplicate `<thead>` in VVPanel**

In `src/ui/views/calibration/VVPanel.tsx`, the sensitivity numeric table has a duplicate `<thead>` block. Remove the first empty one (lines with just `<tr className="border-b border-line">` without `<th>` elements). Keep only the second `<thead>` that has the `.map((h) => ...)`.

- [ ] **Step 5: Commit**

```bash
git add src/ui/views/Calibration.tsx src/ui/views/calibration/VVPanel.tsx
git commit -m "feat(ui): wire VVPanel into Calibration view, remove PlaceholderPanel"
```

---

### Task 8: Integration Smoke Test

**Files:** None (manual verification)

- [ ] **Step 1: Start both servers**

```bash
# Terminal 1: Python API
cd /root/repos/Selectron/python
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000

# Terminal 2: Vite dev
cd /root/repos/Selectron
npm run dev
```

- [ ] **Step 2: Test Batch Fit condition combobox**

1. Open http://localhost:5173 → Calibration → Batch Fit.
2. Click the condition input. Verify dropdown appears with "All fittable" at top.
3. Type "ankle". Verify "Ankle Sprain/Strain" appears with `ankle-sprain-strain` below it.
4. Verify non-Gamma conditions (e.g. "Abnormal Uterine Bleeding" with incidenceDist "Fixed") are grayed out.
5. Select a condition. Verify the input shows the label.
6. Click outside. Verify dropdown closes.

- [ ] **Step 3: Test K15 Validation**

1. Go to Calibration → V&V tab.
2. Select 1k trials. Click "Run Validation".
3. Verify the table appears with 12 rows grouped by scenario (none / issHMS / unlimited).
4. Verify PASS/FAIL badges render in green/red.
5. Verify summary badge shows "N/12 within K15 CI₉₅".

- [ ] **Step 4: Test Sensitivity Analysis**

1. In the Sensitivity section, keep Morris defaults (10 trajectories, 1000 trials/eval, top 15).
2. Click "Run Analysis". Wait for completion (may take 1-5 min depending on condition count).
3. Verify tornado chart renders with horizontal bars.
4. Verify tooltip shows condition name + μ* + σ on hover.
5. Click "numeric indices" to expand the collapsible table.
6. Switch to Sobol. Verify two series (S1 blue, ST orange) render.

- [ ] **Step 5: Final commit with any fixes**

```bash
git add -A
git commit -m "fix(ui): integration polish for V&V panel"
```
