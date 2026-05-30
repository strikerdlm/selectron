# Light Theme · +2pt Type · Correlation Analysis Tab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted light/dark theme, bump the type scale ~2pt, and ship a dedicated "Analysis" tab with five journal-grade multivariate/correlation ECharts figures — without touching the locked manuscript figures or their snapshots.

**Architecture:** Approach A from the spec — new theme infra (RGB-channel CSS vars, a new `selectron-dark` ECharts theme, a `ThemeProvider`/`useFigureTheme`) is consumed **only** by the 5 new Analysis figures and the app chrome. Existing figure components, `TestFigureHost`, paper figures, and `paper-figures.spec.ts` are untouched. All analysis math is pure and TDD'd before any UI consumes it.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind 3 (CSS-variable colors), ECharts 6 (`echarts/core` modular), `echarts-for-react/lib/core`, Dexie, vitest + @testing-library/react (jsdom), Playwright (regression only).

**Spec:** `docs/superpowers/specs/2026-05-30-selectron-light-theme-correlations-design.md`

**Conventions:** Commits use `feat:`/`fix:`/`test:`/`chore:`/`docs:`. **No AI co-author trailer** (Diego is sole author — overrides any default). Run from repo root `/root/repos/Selectron`. Single-file test run: `npx vitest run <path>`.

---

## File map

**New — analysis math (pure, no UI):**
- `src/analysis/correlation.ts` — pearson / spearman / correlationMatrix
- `src/analysis/imm-bubbles.ts` — conditionRate / severity / contribution / family→group / buildBubbleData
- `src/analysis/coupling.ts` — couplingMatrix
- `src/analysis/demo-cohort.ts` — seeded synthetic cohort with injected covariance

**New — theme infra:**
- `src/ui/theme/ThemeContext.tsx` — `ThemeProvider`, `useTheme()`
- `src/ui/theme/ThemeToggle.tsx` — header sun/moon button
- `src/ui/figures/theme-dark.ts` — registers `selectron-dark`
- `src/ui/figures/useFigureTheme.ts` — `{ themeName, tokens }` for active theme

**New — figures + view:**
- `src/ui/figures/ParallelCriteria.tsx`, `RiskBubbleScatter.tsx`, `CriteriaSplom.tsx`, `CriterionCorrelationHeatmap.tsx`, `VulnerabilityCouplingHeatmap.tsx`
- `src/ui/figures/captions/analysis.captions.ts`
- `src/ui/views/Analysis.tsx`

**Modified:**
- `src/imm/simulate.ts` — add `export` to `FAMILY_BETA` and `FAMILY_BETA_DEFAULT` (no behavior change)
- `src/index.css` — RGB-channel vars + `:root[data-theme="light"]`
- `tailwind.config.js` — colors → `rgb(var(--x) / <alpha-value>)`; `fontSize` +2px
- `index.html` — no-FOUC inline script
- `src/ui/figures/echarts-base.ts` — register Parallel/Heatmap/VisualMap
- `src/ui/App.tsx` — wrap in `ThemeProvider`, add `ThemeToggle`, add "analysis" nav + view
- `*.tsx` — ordered `text-[Npx]` +2px bump (mechanical)

**Tests:** `tests/analysis/{correlation,imm-bubbles,coupling,demo-cohort}.test.ts`, `tests/ui/{theme_toggle,analysis_figures}.test.tsx`

---

## Task 1: Correlation math (pearson / spearman / matrix)

**Files:**
- Create: `src/analysis/correlation.ts`
- Test: `tests/analysis/correlation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/analysis/correlation.test.ts
import { describe, it, expect } from "vitest";
import { pearson, spearman, rank, correlationMatrix } from "@/analysis/correlation";

describe("pearson", () => {
  it("is 1 for a perfect positive linear relation", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 10);
  });
  it("is -1 for a perfect negative linear relation", () => {
    expect(pearson([1, 2, 3, 4], [4, 3, 2, 1])).toBeCloseTo(-1, 10);
  });
  it("is 0 when a column is constant (no divide-by-zero)", () => {
    expect(pearson([1, 1, 1, 1], [1, 2, 3, 4])).toBe(0);
  });
  it("returns 0 for n < 2", () => {
    expect(pearson([5], [9])).toBe(0);
  });
});

describe("spearman", () => {
  it("is 1 for a monotonic but non-linear relation", () => {
    expect(spearman([1, 2, 3, 4], [1, 4, 9, 16])).toBeCloseTo(1, 10);
  });
  it("handles ties via average ranks", () => {
    expect(rank([10, 10, 20])).toEqual([1.5, 1.5, 3]);
  });
});

describe("correlationMatrix", () => {
  it("is symmetric with a unit diagonal", () => {
    const m = correlationMatrix([[1, 2, 3], [3, 2, 1], [1, 3, 2]], "pearson");
    expect(m[0][0]).toBe(1);
    expect(m[1][1]).toBe(1);
    expect(m[0][1]).toBeCloseTo(m[1][0], 12);
    expect(m[0][1]).toBeCloseTo(-1, 10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/analysis/correlation.test.ts`
Expected: FAIL — cannot resolve `@/analysis/correlation`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/analysis/correlation.ts
// Pure Pearson / Spearman correlation utilities. Deterministic, NaN-safe.

export function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  const den = Math.sqrt(dx2 * dy2);
  return den === 0 ? 0 : num / den;
}

// Average-rank transform (1-based), so Spearman handles ties correctly.
export function rank(x: number[]): number[] {
  const order = x.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const ranks = new Array<number>(x.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k][1]] = avg;
    i = j + 1;
  }
  return ranks;
}

export function spearman(x: number[], y: number[]): number {
  return pearson(rank(x), rank(y));
}

export function correlationMatrix(
  columns: number[][],
  method: "pearson" | "spearman" = "pearson",
): number[][] {
  const corr = method === "spearman" ? spearman : pearson;
  const k = columns.length;
  const m: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let i = 0; i < k; i++) {
    m[i][i] = 1;
    for (let j = i + 1; j < k; j++) {
      const r = corr(columns[i], columns[j]);
      m[i][j] = r; m[j][i] = r;
    }
  }
  return m;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/analysis/correlation.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/analysis/correlation.ts tests/analysis/correlation.test.ts
git commit -m "feat: add pearson/spearman correlation analysis utilities"
```

---

## Task 2: IMM bubble math (rate / severity / contribution / grouping)

**Files:**
- Create: `src/analysis/imm-bubbles.ts`
- Test: `tests/analysis/imm-bubbles.test.ts`

**Context:** `IMMPrior` (`src/imm/types.ts`) has `incidence.distribution ∈ {"Gamma-Poisson","Lognormal-Poisson","Beta-Bernoulli","Fixed"}` with optional `alpha`/`beta`/`mu_log_lambda`/`sigma_log_lambda`/`lambda_fixed`, and `severity.worst_case_prob_alpha|beta`, and `treated.fi_cp1|cp2|cp3` (each a `{min,mode,max}` Beta-Pert). `IMMCondition` has `family: IMMConditionFamily` (19 families) + `label`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/analysis/imm-bubbles.test.ts
import { describe, it, expect } from "vitest";
import {
  conditionRate, worstCaseSeverity, expectedContribution,
  familyToSystemGroup, SYSTEM_GROUP_ORDER, buildBubbleData,
} from "@/analysis/imm-bubbles";
import type { IMMPrior, IMMCondition, IMMConditionFamily } from "@/imm/types";

const ALL_FAMILIES: IMMConditionFamily[] = [
  "behavioral","cardiovascular","dental","dermatologic","ENT","endocrine","GI","GU",
  "hematologic","infectious","musculoskeletal","neurologic","ophthalmologic","psychiatric",
  "renal","respiratory","space-adaptation","toxicologic","traumatic",
];

function prior(over: Partial<IMMPrior> = {}): IMMPrior {
  const pert = { min: 0, mode: 0.1, max: 0.3 };
  return {
    conditionId: "x", provenance: "tierB-pymc", source_ref: "",
    incidence: { distribution: "Gamma-Poisson", alpha: 2, beta: 200, lambda_unit: "events-per-person-day" },
    severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 3 },
    treated: { fi_cp1: pert, dt_cp1_hours: pert, fi_cp2: pert, dt_cp2_hours: pert, fi_cp3: pert, p_evac: pert, p_locl: pert },
    untreated: { fi_cp1: pert, dt_cp1_hours: pert, fi_cp2: pert, dt_cp2_hours: pert, fi_cp3: pert, p_evac: pert, p_locl: pert },
    risk_factor_multipliers: {}, required_resources: {},
    ...over,
  } as IMMPrior;
}

describe("conditionRate", () => {
  it("Gamma-Poisson λ=α/β in events/1000-PY", () => {
    // 2/200 per day = 0.01/day → ×365×1000 = 3650
    expect(conditionRate(prior())).toBeCloseTo(3650, 6);
  });
  it("Fixed uses lambda_fixed", () => {
    expect(conditionRate(prior({ incidence: { distribution: "Fixed", lambda_fixed: 0.001 } } as Partial<IMMPrior>)))
      .toBeCloseTo(365, 6);
  });
  it("returns null for Beta-Bernoulli (per-event, not per-time)", () => {
    expect(conditionRate(prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>)))
      .toBeNull();
  });
});

describe("worstCaseSeverity", () => {
  it("is α/(α+β)", () => {
    expect(worstCaseSeverity(prior())).toBeCloseTo(0.25, 12); // 1/(1+3)
  });
});

describe("expectedContribution", () => {
  it("scales with mission length", () => {
    const short = expectedContribution(prior(), 30);
    const long = expectedContribution(prior(), 180);
    expect(long).toBeGreaterThan(short);
  });
  it("is 0 for non-rate priors", () => {
    expect(expectedContribution(prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>), 180)).toBe(0);
  });
});

describe("familyToSystemGroup", () => {
  it("maps every IMM family to a defined group", () => {
    for (const f of ALL_FAMILIES) {
      expect(SYSTEM_GROUP_ORDER).toContain(familyToSystemGroup(f));
    }
  });
});

describe("buildBubbleData", () => {
  it("includes rate-based conditions and excludes Beta-Bernoulli ones", () => {
    const conditions = [
      { id: "a", label: "A", family: "GI", incidenceSource: "in-flight", incidenceDist: "Gamma", processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: [] },
      { id: "b", label: "B", family: "infectious", incidenceSource: "in-flight", incidenceDist: "Beta", processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: [] },
    ] as unknown as IMMCondition[];
    const priors = { a: prior(), b: prior({ incidence: { distribution: "Beta-Bernoulli", alpha: 2, beta: 18 } } as Partial<IMMPrior>) };
    const { points, excluded } = buildBubbleData(conditions, priors, 180);
    expect(points).toHaveLength(1);
    expect(points[0].id).toBe("a");
    expect(points[0].rate).toBeGreaterThan(0);
    expect(excluded).toEqual(["b"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/analysis/imm-bubbles.test.ts`
Expected: FAIL — cannot resolve `@/analysis/imm-bubbles`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/analysis/imm-bubbles.ts
// Pure transforms turning IMM priors+conditions into bubble-scatter points:
// incidence rate (x) × worst-case severity (y) × system group (color) × contribution (size).
import type { IMMPrior, IMMCondition, IMMConditionFamily } from "@/imm/types";

const DAYS_PER_YEAR = 365;

// Events per person-day → events per 1000 person-years. null for non-rate (per-event) priors.
export function conditionRate(prior: IMMPrior): number | null {
  const inc = prior.incidence;
  let perDay: number;
  switch (inc.distribution) {
    case "Gamma-Poisson":
      if (inc.alpha == null || inc.beta == null || inc.beta === 0) return null;
      perDay = inc.alpha / inc.beta; break;
    case "Lognormal-Poisson":
      if (inc.mu_log_lambda == null || inc.sigma_log_lambda == null) return null;
      perDay = Math.exp(inc.mu_log_lambda + (inc.sigma_log_lambda ** 2) / 2); break;
    case "Fixed":
      if (inc.lambda_fixed == null) return null;
      perDay = inc.lambda_fixed; break;
    default:
      return null; // Beta-Bernoulli: per-EVA / per-SPE probability, not a per-person-time rate
  }
  if (!(perDay > 0)) return null;
  return perDay * DAYS_PER_YEAR * 1000;
}

export function worstCaseSeverity(prior: IMMPrior): number {
  const a = prior.severity.worst_case_prob_alpha;
  const b = prior.severity.worst_case_prob_beta;
  return a + b === 0 ? 0 : a / (a + b);
}

// Expected per-mission contribution proxy: expected event count × cumulative treated impairment.
export function expectedContribution(prior: IMMPrior, missionDays: number): number {
  const rate = conditionRate(prior);
  if (rate == null) return 0;
  const perDay = rate / (DAYS_PER_YEAR * 1000);
  const expectedCount = perDay * missionDays;
  const t = prior.treated;
  const impair = t.fi_cp1.mode + t.fi_cp2.mode + t.fi_cp3.mode;
  return expectedCount * impair;
}

export type SystemGroup =
  | "behavioral/psych" | "cardio/heme" | "neuro" | "infectious"
  | "musculoskeletal/trauma" | "GI/GU/renal" | "other";

export const SYSTEM_GROUP_ORDER: SystemGroup[] = [
  "behavioral/psych", "cardio/heme", "neuro", "infectious",
  "musculoskeletal/trauma", "GI/GU/renal", "other",
];

const FAMILY_GROUP: Record<IMMConditionFamily, SystemGroup> = {
  behavioral: "behavioral/psych", psychiatric: "behavioral/psych",
  cardiovascular: "cardio/heme", hematologic: "cardio/heme",
  neurologic: "neuro",
  infectious: "infectious",
  musculoskeletal: "musculoskeletal/trauma", traumatic: "musculoskeletal/trauma",
  GI: "GI/GU/renal", GU: "GI/GU/renal", renal: "GI/GU/renal",
  dental: "other", dermatologic: "other", ENT: "other", endocrine: "other",
  ophthalmologic: "other", respiratory: "other", "space-adaptation": "other",
  toxicologic: "other",
};

export function familyToSystemGroup(family: IMMConditionFamily): SystemGroup {
  return FAMILY_GROUP[family] ?? "other";
}

export type BubblePoint = {
  id: string; label: string; family: IMMConditionFamily; group: SystemGroup;
  rate: number; severity: number; contribution: number;
};

export function buildBubbleData(
  conditions: readonly IMMCondition[],
  priors: Record<string, IMMPrior>,
  missionDays: number,
): { points: BubblePoint[]; excluded: string[] } {
  const points: BubblePoint[] = [];
  const excluded: string[] = [];
  for (const c of conditions) {
    const p = priors[c.id];
    if (!p) continue;
    const rate = conditionRate(p);
    if (rate == null) { excluded.push(c.id); continue; }
    points.push({
      id: c.id, label: c.label, family: c.family, group: familyToSystemGroup(c.family),
      rate, severity: worstCaseSeverity(p), contribution: expectedContribution(p, missionDays),
    });
  }
  return { points, excluded };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/analysis/imm-bubbles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/analysis/imm-bubbles.ts tests/analysis/imm-bubbles.test.ts
git commit -m "feat: add IMM bubble-scatter data transforms (rate/severity/contribution)"
```

---

## Task 3: Vulnerability-coupling matrix

**Files:**
- Modify: `src/imm/simulate.ts` (add `export` to `FAMILY_BETA` line 38 and `FAMILY_BETA_DEFAULT` line 51 — keyword only, no behavior change)
- Create: `src/analysis/coupling.ts`
- Test: `tests/analysis/coupling.test.ts`

- [ ] **Step 1: Export the β-map from the engine**

In `src/imm/simulate.ts`, change:
```ts
const FAMILY_BETA: Partial<Record<IMMConditionFamily, number>> = {
```
to:
```ts
export const FAMILY_BETA: Partial<Record<IMMConditionFamily, number>> = {
```
and change:
```ts
const FAMILY_BETA_DEFAULT = -0.2;
```
to:
```ts
export const FAMILY_BETA_DEFAULT = -0.2;
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/analysis/coupling.test.ts
import { describe, it, expect } from "vitest";
import { couplingMatrix } from "@/analysis/coupling";
import type { IMMCondition, IMMConditionFamily } from "@/imm/types";
import type { Criterion } from "@/types";

const crit = (id: string): Criterion => ({
  id, family: "psychological", label: id, description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true, citations: [], minimumTier: "minimum",
} as unknown as Criterion);

const cond = (id: string, family: IMMConditionFamily, vc: string[]): IMMCondition => ({
  id, label: id, family, incidenceSource: "in-flight", incidenceDist: "Gamma",
  processType: "general-Poisson", riskFactors: [], vulnerabilityCriteria: vc,
} as unknown as IMMCondition);

describe("couplingMatrix", () => {
  it("accumulates |β| per (criterion, family) over coupled conditions", () => {
    const criteria = [crit("c0"), crit("c1")];
    const conditions = [
      cond("p1", "psychiatric", ["c0"]),
      cond("r1", "renal", ["c0", "c1"]),
      cond("u1", "GI", []), // uncoupled → contributes nothing
    ];
    const beta = { psychiatric: -0.4, renal: -0.15 };
    const { families, matrix } = couplingMatrix(criteria, conditions, beta, -0.2);
    const jPsy = families.indexOf("psychiatric");
    const jRen = families.indexOf("renal");
    expect(matrix[0][jPsy]).toBeCloseTo(0.4, 12); // c0 ← psychiatric
    expect(matrix[0][jRen]).toBeCloseTo(0.15, 12); // c0 ← renal
    expect(matrix[1][jPsy]).toBe(0); // c1 not coupled to psychiatric
    expect(matrix[1][jRen]).toBeCloseTo(0.15, 12); // c1 ← renal
  });
  it("uses the default β for families absent from the map", () => {
    const { families, matrix } = couplingMatrix([crit("c0")], [cond("g1", "GI", ["c0"])], {}, -0.2);
    expect(matrix[0][families.indexOf("GI")]).toBeCloseTo(0.2, 12);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/analysis/coupling.test.ts`
Expected: FAIL — cannot resolve `@/analysis/coupling`.

- [ ] **Step 4: Write minimal implementation**

```ts
// src/analysis/coupling.ts
// Criterion × condition-family vulnerability-coupling matrix.
// Cell = Σ over conditions in that family coupled to that criterion of |family β|.
import type { IMMCondition, IMMConditionFamily } from "@/imm/types";
import type { Criterion } from "@/types";

export function couplingMatrix(
  criteria: readonly Criterion[],
  conditions: readonly IMMCondition[],
  familyBeta: Partial<Record<IMMConditionFamily, number>>,
  defaultBeta: number,
): { families: IMMConditionFamily[]; matrix: number[][] } {
  const families = [...new Set(conditions.map((c) => c.family))].sort() as IMMConditionFamily[];
  const colIndex = new Map(families.map((f, j) => [f, j] as const));
  const rowIndex = new Map(criteria.map((c, i) => [c.id, i] as const));
  const matrix = criteria.map(() => new Array<number>(families.length).fill(0));
  for (const cond of conditions) {
    if (cond.vulnerabilityCriteria.length === 0) continue;
    const j = colIndex.get(cond.family);
    if (j == null) continue;
    const beta = Math.abs(familyBeta[cond.family] ?? defaultBeta);
    for (const cid of cond.vulnerabilityCriteria) {
      const i = rowIndex.get(cid);
      if (i == null) continue;
      matrix[i][j] += beta;
    }
  }
  return { families, matrix };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/analysis/coupling.test.ts && npx vitest run tests/imm`
Expected: PASS (coupling); IMM suites still PASS (export-only change is behavior-neutral).

- [ ] **Step 6: Commit**

```bash
git add src/analysis/coupling.ts tests/analysis/coupling.test.ts src/imm/simulate.ts
git commit -m "feat: add criterion x condition-family vulnerability-coupling matrix"
```

---

## Task 4: Deterministic demo cohort

**Files:**
- Create: `src/analysis/demo-cohort.ts`
- Test: `tests/analysis/demo-cohort.test.ts`

**Context:** Produces engine `Candidate[]` (`{ id, alias, scores: Record<criterionId, number> }`) with a known latent-factor covariance so the heatmap/SPLOM/parallel figures show real correlations. Seeded with the repo-standard `0xc0ffee`.

- [ ] **Step 1: Write the failing test**

```ts
// tests/analysis/demo-cohort.test.ts
import { describe, it, expect } from "vitest";
import { makeDemoCohort, DEMO_N, DEMO_SEED } from "@/analysis/demo-cohort";
import { correlationMatrix } from "@/analysis/correlation";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

describe("makeDemoCohort", () => {
  it("is deterministic for a fixed seed", () => {
    const a = makeDemoCohort(PLACEHOLDER_CRITERIA, DEMO_N, DEMO_SEED);
    const b = makeDemoCohort(PLACEHOLDER_CRITERIA, DEMO_N, DEMO_SEED);
    expect(a).toEqual(b);
    expect(a).toHaveLength(DEMO_N);
  });
  it("keeps every score within its criterion scale", () => {
    const cohort = makeDemoCohort(PLACEHOLDER_CRITERIA);
    for (const cand of cohort) {
      for (const c of PLACEHOLDER_CRITERIA) {
        const v = cand.scores[c.id];
        expect(v).toBeGreaterThanOrEqual(c.scale.min);
        expect(v).toBeLessThanOrEqual(c.scale.max);
      }
    }
  });
  it("reproduces the injected covariance structure", () => {
    const cohort = makeDemoCohort(PLACEHOLDER_CRITERIA);
    const col = (id: string) => cohort.map((c) => c.scores[id]);
    const r = (a: string, b: string) => correlationMatrix([col(a), col(b)])[0][1];
    expect(r("psych.conscientiousness", "psych.emotional_stability")).toBeGreaterThan(0.3);
    expect(r("psych.emotional_stability", "psych.mmpi2rf_eid")).toBeLessThan(-0.2);
    expect(r("physical.vo2max", "physical.sot5_equilibrium")).toBeGreaterThan(0.3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/analysis/demo-cohort.test.ts`
Expected: FAIL — cannot resolve `@/analysis/demo-cohort`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/analysis/demo-cohort.ts
// Seeded synthetic candidate cohort with a known latent-factor covariance, so the
// Analysis correlation figures display real (non-noise) structure on the journal site.
import type { Candidate, Criterion } from "@/types";

export const DEMO_SEED = 0xc0ffee;
export const DEMO_N = 40;

// LCG identical to TestFigureHost's, mapped to [0,1).
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}
// Standard normal via Box-Muller.
function gauss(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12), u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

type Loading = { psych: number; cog: number; fit: number; noise: number };
const LOADINGS: Record<string, Loading> = {
  "psych.conscientiousness":          { psych: 0.80, cog: 0.20, fit: 0.0, noise: 0.5 },
  "psych.emotional_stability":        { psych: 0.85, cog: 0.0, fit: 0.10, noise: 0.5 },
  "psych.resilience_cdrisc":          { psych: 0.80, cog: 0.0, fit: 0.20, noise: 0.5 },
  "psych.emotional_intelligence":     { psych: 0.70, cog: 0.30, fit: 0.0, noise: 0.5 },
  "psych.mmpi2rf_eid":                { psych: -0.75, cog: 0.0, fit: 0.0, noise: 0.5 },
  "psych.bdi2_baseline":              { psych: -0.70, cog: 0.0, fit: 0.0, noise: 0.5 },
  "behavioral.teamwork":              { psych: 0.60, cog: 0.20, fit: 0.0, noise: 0.6 },
  "cognitive.nasa_cognition_battery": { psych: 0.10, cog: 0.85, fit: 0.0, noise: 0.5 },
  "cognitive.pvt_b_rt_ms":            { psych: 0.0, cog: -0.80, fit: 0.0, noise: 0.5 },
  "physical.vo2max":                  { psych: 0.0, cog: 0.0, fit: 0.90, noise: 0.4 },
  "physical.sot5_equilibrium":        { psych: 0.0, cog: 0.10, fit: 0.70, noise: 0.5 },
  "professional.technical_competence":{ psych: 0.20, cog: 0.60, fit: 0.0, noise: 0.6 },
};

export function makeDemoCohort(
  criteria: readonly Criterion[],
  n = DEMO_N,
  seed = DEMO_SEED,
): Candidate[] {
  const rng = lcg(seed);
  const out: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    const fPsych = gauss(rng), fCog = gauss(rng), fFit = gauss(rng);
    const scores: Record<string, number> = {};
    for (const c of criteria) {
      const L = LOADINGS[c.id] ?? { psych: 0, cog: 0, fit: 0, noise: 1 };
      const z = L.psych * fPsych + L.cog * fCog + L.fit * fFit + L.noise * gauss(rng);
      const mid = (c.scale.min + c.scale.max) / 2;
      const span = c.scale.max - c.scale.min;
      const raw = mid + z * (span / 6);
      scores[c.id] = Math.min(c.scale.max, Math.max(c.scale.min, raw));
    }
    const tag = String(i + 1).padStart(2, "0");
    out.push({ id: `demo-${tag}`, alias: `DEMO-${tag}`, scores });
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/analysis/demo-cohort.test.ts`
Expected: PASS (determinism, clamping, and recovered-correlation signs/magnitudes).

- [ ] **Step 5: Commit**

```bash
git add src/analysis/demo-cohort.ts tests/analysis/demo-cohort.test.ts
git commit -m "feat: add seeded demo cohort with injected covariance for analysis figures"
```

---

## Task 5: Theme channel variables (CSS + Tailwind colors)

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.js`

**Context:** 77 call-sites use opacity modifiers on custom colors (`bg-signal/10`, `border-line/40`), so colors must be channel-form. CSS vars hold `R G B`; Tailwind consumes `rgb(var(--x) / <alpha-value>)`.

- [ ] **Step 1: Rewrite the `:root` block + add light overrides in `src/index.css`**

Replace the existing `:root { … }` block (lines ~8–25) with:

```css
:root {
  --bg-0: 8 9 10;
  --bg-1: 12 13 15;
  --bg-2: 19 21 23;
  --line: 31 34 38;
  --line-2: 42 46 52;
  --ink-0: 240 244 250;
  --ink-1: 216 221 228;
  --ink-2: 176 182 189;
  --ink-3: 138 143 150;
  --signal: 245 181 65;
  --signal-bright: 255 212 121;
  --go: 86 214 160;
  --warn: 255 107 94;
  --grid-dot: 255 255 255;
  --signal-dim: rgb(245 181 65 / 0.13);

  color-scheme: dark;
}

:root[data-theme="light"] {
  --bg-0: 247 248 250;
  --bg-1: 255 255 255;
  --bg-2: 238 241 245;
  --line: 216 222 230;
  --line-2: 195 204 214;
  --ink-0: 12 15 20;
  --ink-1: 43 50 60;
  --ink-2: 86 95 107;
  --ink-3: 107 116 128;
  --signal: 176 111 0;
  --signal-bright: 217 138 19;
  --go: 15 122 82;
  --warn: 194 56 31;
  --grid-dot: 12 15 20;
  --signal-dim: rgb(176 111 0 / 0.13);

  color-scheme: light;
}
```

- [ ] **Step 2: Update the direct `var()` color usages in `src/index.css`**

In the `@layer base`/`@layer components` blocks, every property that uses a palette var as a *color* must wrap it in `rgb(...)`. Apply these replacements (the `--signal-dim` var already holds a full color, so leave `var(--signal-dim)` as-is):

- `background-color: var(--bg-0);` → `background-color: rgb(var(--bg-0));`
- `color: var(--ink-0);` → `color: rgb(var(--ink-0));`
- In the dot-grid: `radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)` → `radial-gradient(rgb(var(--grid-dot) / 0.04) 1px, transparent 1px)`
- `::selection { background-color: var(--signal); color: var(--bg-0); }` → wrap both in `rgb(...)`
- `.label { color: var(--ink-2); }` → `rgb(var(--ink-2))`
- `.hairline` gradient `var(--line-2)` → `rgb(var(--line-2))`
- `.panel { background-color: var(--bg-1); border: 1px solid var(--line); }` → wrap both in `rgb(...)`
- `.panel::before/::after { border: 1px solid var(--ink-3); }` → `rgb(var(--ink-3))`
- `.signal-dot { background: var(--go); box-shadow: 0 0 0 0 var(--go); }` → `rgb(var(--go))` (both)
- range-slider `background: var(--line-2)` → `rgb(var(--line-2))`; thumb `background: var(--signal); border: 2px solid var(--bg-0); box-shadow: 0 0 0 1px var(--signal), 0 0 12px var(--signal-dim)` → wrap `--signal` and `--bg-0` in `rgb(...)`, leave `var(--signal-dim)`
- `@keyframes pulse` `box-shadow: 0 0 0 0 var(--go)` → `rgb(var(--go))`

Verify none remain: `grep -nE "var\(--(bg|ink|line|signal|go|warn|grid)" src/index.css | grep -v "rgb(" | grep -v "signal-dim"` should print nothing.

- [ ] **Step 3: Rewire `tailwind.config.js` colors to channel form**

Replace the `colors` object under `theme.extend` with:

```js
colors: {
  bg: {
    0: "rgb(var(--bg-0) / <alpha-value>)",
    1: "rgb(var(--bg-1) / <alpha-value>)",
    2: "rgb(var(--bg-2) / <alpha-value>)",
  },
  line: {
    DEFAULT: "rgb(var(--line) / <alpha-value>)",
    2: "rgb(var(--line-2) / <alpha-value>)",
  },
  ink: {
    0: "rgb(var(--ink-0) / <alpha-value>)",
    1: "rgb(var(--ink-1) / <alpha-value>)",
    2: "rgb(var(--ink-2) / <alpha-value>)",
    3: "rgb(var(--ink-3) / <alpha-value>)",
  },
  signal: {
    DEFAULT: "rgb(var(--signal) / <alpha-value>)",
    dim: "var(--signal-dim)",
    bright: "rgb(var(--signal-bright) / <alpha-value>)",
  },
  go: "rgb(var(--go) / <alpha-value>)",
  warn: "rgb(var(--warn) / <alpha-value>)",
},
```

- [ ] **Step 4: Verify the build compiles and dark mode is unchanged**

Run: `npm run build`
Expected: build succeeds. Then `npm run dev`, open the app (default = dark): visually identical to before this task (the dark channel values equal the old hex). The `:root` defaults are byte-equivalent dark, so nothing should shift.

- [ ] **Step 5: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat: convert theme to RGB-channel CSS variables (enables light mode)"
```

---

## Task 6: +2pt type scale

**Files:**
- Modify: `tailwind.config.js`
- Modify: many `*.tsx` (mechanical `text-[Npx]` bump)

- [ ] **Step 1: Add a +2px `fontSize` scale to `tailwind.config.js`**

Under `theme.extend`, add:

```js
fontSize: {
  xs:   ["0.875rem", { lineHeight: "1.25rem" }],  // 14px (was 12)
  sm:   ["1rem",     { lineHeight: "1.5rem" }],    // 16px (was 14)
  base: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px (was 16)
  lg:   ["1.25rem",  { lineHeight: "1.875rem" }],  // 20px (was 18)
  xl:   ["1.375rem", { lineHeight: "2rem" }],      // 22px (was 20)
  "2xl":["1.625rem", { lineHeight: "2.125rem" }],  // 26px (was 24)
  "3xl":["1.875rem", { lineHeight: "2.25rem" }],   // 30px (was 30 → keep generous)
},
```

- [ ] **Step 2: Bump hard-coded `text-[Npx]` literals +2px (ordered, largest→smallest)**

Run exactly (descending order prevents a freshly-bumped token from being re-matched):

```bash
grep -rlE 'text-\[(8|9|10|11|12|13|14|16)px\]' src --include='*.tsx' | xargs sed -i \
  -e 's/text-\[16px\]/text-[18px]/g' \
  -e 's/text-\[14px\]/text-[16px]/g' \
  -e 's/text-\[13px\]/text-[15px]/g' \
  -e 's/text-\[12px\]/text-[14px]/g' \
  -e 's/text-\[11px\]/text-[13px]/g' \
  -e 's/text-\[10px\]/text-[12px]/g' \
  -e 's/text-\[9px\]/text-[11px]/g' \
  -e 's/text-\[8px\]/text-[10px]/g'
```

Sanity check no tiny literals remain: `grep -rnE 'text-\[(8|9)px\]' src --include='*.tsx'` → should print nothing.

- [ ] **Step 3: Verify build + header layout at the larger scale**

Run: `npm run build` (expect success).
Run: `npm run dev`, open the app. The header (`SELECTRON … by Diego Malpica MD … iter 03`) must not wrap or overflow at desktop width; the responsive `hidden sm/md/lg` spans already drop meta on narrow widths. If the title row wraps at full width, reduce only the `h1` from `text-2xl` to `text-xl` in `src/ui/App.tsx`.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js src
git commit -m "feat: increase overall type scale by ~2pt"
```

---

## Task 7: ThemeProvider + toggle + no-FOUC + App wiring

**Files:**
- Create: `src/ui/theme/ThemeContext.tsx`
- Create: `src/ui/theme/ThemeToggle.tsx`
- Modify: `index.html`
- Modify: `src/ui/App.tsx`
- Test: `tests/ui/theme_toggle.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/ui/theme_toggle.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { ThemeToggle } from "@/ui/theme/ThemeToggle";

beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute("data-theme"); });
afterEach(cleanup);

describe("ThemeToggle", () => {
  it("defaults to dark and exposes a toggle control", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: /theme/i })).toBeTruthy();
  });
  it("switches to light and persists the choice", () => {
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    fireEvent.click(screen.getByRole("button", { name: /theme/i }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("selectron-theme")).toBe("light");
  });
  it("reads the persisted theme on mount", () => {
    localStorage.setItem("selectron-theme", "light");
    render(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/ui/theme_toggle.test.tsx`
Expected: FAIL — cannot resolve `@/ui/theme/ThemeContext`.

- [ ] **Step 3: Implement the context**

```tsx
// src/ui/theme/ThemeContext.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "selectron-theme";

function readInitialTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

- [ ] **Step 4: Implement the toggle button**

```tsx
// src/ui/theme/ThemeToggle.tsx
import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      className="mono uppercase tracking-cap text-ink-2 hover:text-ink-0 transition-colors inline-flex items-center gap-1"
    >
      <span aria-hidden>{isDark ? "☀" : "☾"}</span>
      <span className="hidden sm:inline">{isDark ? "light" : "dark"}</span>
    </button>
  );
}
```

- [ ] **Step 5: Add the no-FOUC script to `index.html`**

Remove `<meta name="color-scheme" content="dark" />`. Immediately before `<script type="module" src="/src/main.tsx"></script>` in `<body>` (or in `<head>`), add:

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("selectron-theme") === "light" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", t);
      document.documentElement.style.colorScheme = t;
    } catch (e) {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  })();
</script>
```

- [ ] **Step 6: Wire `ThemeProvider` + `ThemeToggle` into `src/ui/App.tsx`**

Add imports near the top:
```tsx
import { ThemeProvider } from "./theme/ThemeContext";
import { ThemeToggle } from "./theme/ThemeToggle";
```
Wrap the outermost returned tree: change `<DbProvider>` to be nested inside `<ThemeProvider>`:
```tsx
return (
  <ThemeProvider>
   <DbProvider>
    <CalibrationJobsProvider>
      {/* …existing tree… */}
    </CalibrationJobsProvider>
   </DbProvider>
  </ThemeProvider>
);
```
In the header meta cluster (the `div` with `className="mono flex items-center gap-4 …"`), add `<ThemeToggle />` as the first child (before the nav buttons).

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run tests/ui/theme_toggle.test.tsx`
Expected: PASS.

- [ ] **Step 8: Verify in-app**

Run: `npm run dev`. Toggle flips the whole chrome dark↔light; reload preserves the choice; no flash on reload.

- [ ] **Step 9: Commit**

```bash
git add src/ui/theme tests/ui/theme_toggle.test.tsx index.html src/ui/App.tsx
git commit -m "feat: add persisted light/dark theme toggle (dark default, no FOUC)"
```

---

## Task 8: ECharts registrations + selectron-dark theme + useFigureTheme

**Files:**
- Modify: `src/ui/figures/echarts-base.ts`
- Create: `src/ui/figures/theme-dark.ts`
- Create: `src/ui/figures/useFigureTheme.ts`

- [ ] **Step 1: Register the new chart types/components**

In `src/ui/figures/echarts-base.ts`, add to the imports:
```ts
import { BarChart, LineChart, ScatterChart, RadarChart, CustomChart, HeatmapChart, ParallelChart } from "echarts/charts";
```
and add `VisualMapComponent` and `ParallelComponent` to the components import:
```ts
import {
  GridComponent, LegendComponent, MarkAreaComponent, MarkLineComponent,
  RadarComponent, TitleComponent, TooltipComponent, VisualMapComponent, ParallelComponent,
} from "echarts/components";
```
and include all of them in the `echarts.use([...])` array (add `HeatmapChart, ParallelChart, VisualMapComponent, ParallelComponent`).

- [ ] **Step 2: Register the dark ECharts theme**

```ts
// src/ui/figures/theme-dark.ts
// Dark-mode ECharts theme for the Analysis figures (light text on dark panels).
// The existing `selectron-nature` theme (theme.ts) is the light variant and is untouched.
import { echarts } from "./echarts-base";

const OKABE_ITO = ["#0072B2","#E69F00","#009E73","#CC79A7","#56B4E9","#D55E00","#F0E442","#FFFFFF"];
const MONO = "'JetBrains Mono','Fira Mono',monospace";
const SANS = "'Inter',system-ui,-apple-system,sans-serif";

echarts.registerTheme("selectron-dark", {
  color: OKABE_ITO,
  backgroundColor: "transparent",
  animation: false,
  textStyle: { fontFamily: SANS, fontSize: 14, color: "#d8dde4" },
  title: {
    textStyle: { fontFamily: SANS, fontSize: 15, fontWeight: "bold", color: "#f0f4fa" },
    subtextStyle: { fontFamily: SANS, fontSize: 13, color: "#9aa3ad" },
  },
  categoryAxis: {
    axisLine: { show: true, lineStyle: { color: "#3a4048", width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: "#9aa3ad", fontFamily: SANS, fontSize: 13 },
    splitLine: { show: false },
  },
  valueAxis: {
    axisLine: { show: true, lineStyle: { color: "#3a4048", width: 1 } },
    axisTick: { show: false },
    axisLabel: { color: "#9aa3ad", fontFamily: MONO, fontSize: 13 },
    splitLine: { show: true, lineStyle: { color: "#262b31", type: "dashed", width: 1 } },
  },
  tooltip: {
    backgroundColor: "#08090a", borderColor: "#3a4048", borderWidth: 1, padding: [8, 12],
    textStyle: { color: "#f0f4fa", fontFamily: MONO, fontSize: 13 },
  },
  legend: { orient: "horizontal", bottom: 0, textStyle: { color: "#9aa3ad", fontFamily: MONO, fontSize: 13 } },
});

export const DARK_THEME_NAME = "selectron-dark";
```

- [ ] **Step 3: Implement useFigureTheme**

```ts
// src/ui/figures/useFigureTheme.ts
import { useTheme } from "@/ui/theme/ThemeContext";
import { NATURE_THEME_NAME } from "./theme";
import { DARK_THEME_NAME } from "./theme-dark";

export type ChartTokens = {
  label: string; axisLine: string; splitLine: string;
  tooltipBg: string; tooltipText: string; markerStroke: string;
  diverging: string[]; sequential: string[];
};

export const LIGHT_TOKENS: ChartTokens = {
  label: "#475569", axisLine: "#cbd5e1", splitLine: "#e5e7eb",
  tooltipBg: "#0c0d0f", tooltipText: "#ffffff", markerStroke: "#ffffff",
  diverging: ["#0072B2", "#74add1", "#f7f7f7", "#f4a582", "#D55E00"],
  sequential: ["#f7fbff", "#c6dbef", "#6baed6", "#2171b5", "#08306b"],
};

export const DARK_TOKENS: ChartTokens = {
  label: "#9aa3ad", axisLine: "#3a4048", splitLine: "#262b31",
  tooltipBg: "#08090a", tooltipText: "#f0f4fa", markerStroke: "#0c0d0f",
  diverging: ["#56B4E9", "#3a7ca5", "#4a4f57", "#c87f3a", "#E69F00"],
  sequential: ["#10243e", "#1b466e", "#2171b5", "#549fd6", "#9ecae1"],
};

export function useFigureTheme(): { themeName: string; tokens: ChartTokens } {
  const { theme } = useTheme();
  return theme === "light"
    ? { themeName: NATURE_THEME_NAME, tokens: LIGHT_TOKENS }
    : { themeName: DARK_THEME_NAME, tokens: DARK_TOKENS };
}
```

- [ ] **Step 4: Verify typecheck + the dark theme imports cleanly**

Run: `npm run typecheck`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/ui/figures/echarts-base.ts src/ui/figures/theme-dark.ts src/ui/figures/useFigureTheme.ts
git commit -m "feat: register selectron-dark ECharts theme + useFigureTheme tokens"
```

---

## Task 9: ParallelCriteria figure

**Files:**
- Create: `src/ui/figures/captions/analysis.captions.ts` (shared by all five figures — created in Step 1 here)
- Create: `src/ui/figures/ParallelCriteria.tsx`
- Test: `tests/ui/analysis_figures.test.tsx` (created here, extended via append in Tasks 10–14)

- [ ] **Step 1: Create the captions module (used by all five figures)**

```ts
// src/ui/figures/captions/analysis.captions.ts
import type { CaptionBlock } from "../FigureCaption";

const demoNote = (isDemo: boolean, n: number) =>
  isDemo
    ? `Synthetic demonstration cohort (N=${n}, seed 0xc0ffee) with an injected latent-factor covariance; not real candidate data.`
    : `Live candidate pool (N=${n}).`;

export const analysisCaptions = {
  parallel: ({ n, isDemo, k }: { n: number; isDemo: boolean; k: number }): CaptionBlock => ({
    figureId: "A1",
    oneLine: `Parallel-coordinates profile of ${n} candidates across ${k} selection criteria.`,
    methods: "Each polyline is one candidate; each vertical axis is one criterion on its native instrument scale. Line color encodes the total MCDA score (mean of min–max-normalized, orientation-corrected criterion scores; closed-form Dirichlet(1,…,1) weight mean = 1/K).",
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort; demo cohort is seeded (0xc0ffee).",
  }),
  bubble: ({ n, excluded, missionDays }: { n: number; excluded: number; missionDays: number }): CaptionBlock => ({
    figureId: "A2",
    oneLine: `${n} IMM conditions by incidence, severity, body system, and mission contribution.`,
    methods: `x = incidence (events/1000 person-years, log) from the calibrated priors; y = worst-case severity probability α/(α+β); color = body-system group; bubble area ∝ expected ${missionDays}-day mission contribution (expected events × cumulative treated impairment). ${excluded} per-event (Beta-Bernoulli, per-EVA/SPE) conditions are excluded from the rate axis.`,
    source: "src/data/imm-priors.json (34 tierA-nasa + 66 tierB-pymc) joined with src/imm/conditions.ts.",
    reproducibility: "Pure function of the committed priors + condition catalog.",
  }),
  splom: ({ n, isDemo, ids }: { n: number; isDemo: boolean; ids: string[] }): CaptionBlock => ({
    figureId: "A3",
    oneLine: `Scatterplot matrix of ${ids.length} representative criteria over ${n} candidates.`,
    methods: `Pairwise raw-score scatter for the criteria [${ids.join(", ")}]; diagonal labels the variable. Capped to ${ids.length} criteria for legibility — the full ${"12×12"} relationships appear in the correlation heatmap (A4).`,
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort.",
  }),
  correlation: ({ n, isDemo, k }: { n: number; isDemo: boolean; k: number }): CaptionBlock => ({
    figureId: "A4",
    oneLine: `Pearson correlation among all ${k} selection criteria.`,
    methods: "Cell = Pearson r between two criteria's raw scores across the cohort; diverging scale on [−1, 1].",
    source: demoNote(isDemo, n),
    reproducibility: "Deterministic given the cohort.",
  }),
  coupling: ({ k, families }: { k: number; families: number }): CaptionBlock => ({
    figureId: "A5",
    oneLine: `Vulnerability coupling: ${k} criteria × ${families} IMM condition families.`,
    methods: "Cell = Σ over conditions in that family that list the criterion in vulnerabilityCriteria of |family β| (FAMILY_BETA, psychiatric −0.4 → renal −0.15, default −0.2). Visualizes the Stage-A → λ modulation architecture (58/100 coupled conditions).",
    source: "src/imm/conditions.ts (vulnerabilityCriteria) + src/imm/simulate.ts (FAMILY_BETA).",
    reproducibility: "Pure function of the committed condition catalog + β map.",
  }),
};
```

- [ ] **Step 2: Write the figure**

```tsx
// src/ui/figures/ParallelCriteria.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { normalizeScore } from "@/engine/normalize";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function ParallelCriteria({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 2 || criteria.length < 2) {
    return <div className="grid h-[360px] place-items-center text-sm text-ink-2 mono">need ≥2 candidates and ≥2 criteria</div>;
  }
  const short = (s: string) => (s.length > 15 ? s.slice(0, 14) + "…" : s);
  const parallelAxis = criteria.map((c, i) => ({
    dim: i, name: short(c.label), min: c.scale.min, max: c.scale.max,
    nameTextStyle: { color: tokens.label, fontSize: 11 },
    axisLabel: { color: tokens.label, fontSize: 10 },
    axisLine: { lineStyle: { color: tokens.axisLine } },
    axisTick: { lineStyle: { color: tokens.axisLine } },
  }));
  const data = cohort.map((cand) => {
    const row = criteria.map((c) => cand.scores[c.id] ?? c.scale.min);
    const z = criteria.map((c) => normalizeScore(cand.scores[c.id] ?? c.scale.min, c.scale, c.higherIsBetter));
    const total = z.reduce((s, v) => s + v, 0) / z.length;
    return [...row, total];
  });
  const option = {
    animation: false,
    aria: { enabled: true },
    parallelAxis,
    parallel: { left: 32, right: 24, top: 28, bottom: 44 },
    visualMap: {
      type: "continuous", min: 0, max: 1, dimension: criteria.length,
      calculable: true, orient: "horizontal", left: "center", bottom: 4,
      inRange: { color: tokens.sequential },
      textStyle: { color: tokens.label, fontSize: 10 }, text: ["high score", "low"],
    },
    series: [{
      type: "parallel", smooth: false,
      lineStyle: { width: 1.4, opacity: 0.55 },
      emphasis: { lineStyle: { width: 2.4, opacity: 1 } },
      data,
    }],
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 400, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.parallel({ n: cohort.length, isDemo, k: criteria.length })} />
    </>
  );
}
```

- [ ] **Step 3: Write the render-smoke test (shared file, first figure)**

```tsx
// tests/ui/analysis_figures.test.tsx
// @vitest-environment jsdom
import { type ReactNode } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { ParallelCriteria } from "@/ui/figures/ParallelCriteria";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { makeDemoCohort } from "@/analysis/demo-cohort";

vi.mock("echarts-for-react/lib/core", () => ({
  default: ({ option }: { option: { series?: unknown[] } }) => (
    <div data-testid="echarts-mock" data-series-count={Array.isArray(option.series) ? option.series.length : 0} />
  ),
}));

afterEach(cleanup);
const wrap = (ui: ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);
const cohort = makeDemoCohort(PLACEHOLDER_CRITERIA);

describe("ParallelCriteria", () => {
  it("renders a chart + caption with the cohort", () => {
    const { container, getByTestId } = wrap(<ParallelCriteria cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A1");
  });
  it("shows an empty state with <2 candidates", () => {
    const { container } = wrap(<ParallelCriteria cohort={cohort.slice(0, 1)} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(container.textContent).toContain("need ≥2 candidates");
  });
});
```

- [ ] **Step 4: Run — verify fail then pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS (figure + caption render; empty state).

- [ ] **Step 5: Commit**

```bash
git add src/ui/figures/ParallelCriteria.tsx src/ui/figures/captions/analysis.captions.ts tests/ui/analysis_figures.test.tsx
git commit -m "feat: add parallel-coordinates Analysis figure (A1)"
```

---

## Task 10: RiskBubbleScatter figure

**Files:**
- Create: `src/ui/figures/RiskBubbleScatter.tsx`
- Test: extend `tests/ui/analysis_figures.test.tsx`

- [ ] **Step 1: Write the figure**

```tsx
// src/ui/figures/RiskBubbleScatter.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { SYSTEM_GROUP_ORDER, type BubblePoint, type SystemGroup } from "@/analysis/imm-bubbles";

const GROUP_COLOR: Record<SystemGroup, string> = {
  "behavioral/psych": "#0072B2", "cardio/heme": "#D55E00", neuro: "#CC79A7",
  infectious: "#009E73", "musculoskeletal/trauma": "#E69F00", "GI/GU/renal": "#56B4E9", other: "#9aa3ad",
};

type Props = { points: BubblePoint[]; excluded: number; missionDays: number };

export function RiskBubbleScatter({ points, excluded, missionDays }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (points.length === 0) {
    return <div className="grid h-[420px] place-items-center text-sm text-ink-2 mono">no rate-based conditions to plot</div>;
  }
  const maxContrib = Math.max(...points.map((p) => p.contribution), 1e-12);
  const series = SYSTEM_GROUP_ORDER.map((g) => ({
    name: g, type: "scatter",
    data: points.filter((p) => p.group === g).map((p) => ({
      value: [p.rate, p.severity, p.contribution], name: p.label,
      symbolSize: 6 + 34 * Math.sqrt(p.contribution / maxContrib),
    })),
    itemStyle: { color: GROUP_COLOR[g], opacity: 0.72, borderColor: tokens.markerStroke, borderWidth: 0.5 },
  }));
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 56, right: 20, top: 16, bottom: 70, containLabel: true },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { data: { name: string; value: number[] } }) =>
        `<b>${p.data.name}</b><br/>rate ${p.data.value[0].toFixed(1)} / 1000·PY` +
        `<br/>severity ${(p.data.value[1] * 100).toFixed(1)}%` +
        `<br/>contribution ${p.data.value[2].toExponential(2)}`,
    },
    legend: { type: "scroll", bottom: 0, textStyle: { color: tokens.label, fontSize: 12 } },
    xAxis: {
      type: "log", name: "incidence (events / 1000 PY, log)", nameLocation: "middle", nameGap: 40,
      nameTextStyle: { color: tokens.label, fontSize: 12 },
      axisLabel: { color: tokens.label }, axisLine: { lineStyle: { color: tokens.axisLine } },
      splitLine: { lineStyle: { color: tokens.splitLine, type: "dashed" } },
    },
    yAxis: {
      type: "value", name: "worst-case severity prob.", nameLocation: "middle", nameGap: 44, min: 0, max: 1,
      nameTextStyle: { color: tokens.label, fontSize: 12 },
      axisLabel: { color: tokens.label, formatter: (v: number) => v.toFixed(1) },
      axisLine: { lineStyle: { color: tokens.axisLine } },
      splitLine: { lineStyle: { color: tokens.splitLine, type: "dashed" } },
    },
    series,
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 440, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.bubble({ n: points.length, excluded, missionDays })} />
    </>
  );
}
```

- [ ] **Step 2: Extend the smoke test**

Append to `tests/ui/analysis_figures.test.tsx`:

```tsx
import { RiskBubbleScatter } from "@/ui/figures/RiskBubbleScatter";
import { buildBubbleData } from "@/analysis/imm-bubbles";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { loadIMMPriors } from "@/imm/priors";

describe("RiskBubbleScatter", () => {
  const { points, excluded } = buildBubbleData(IMM_CONDITIONS, loadIMMPriors().conditions, 180);
  it("renders bubbles + caption from the real priors", () => {
    const { container, getByTestId } = wrap(<RiskBubbleScatter points={points} excluded={excluded.length} missionDays={180} />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A2");
    expect(points.length).toBeGreaterThan(20);
  });
  it("shows an empty state with no points", () => {
    const { container } = wrap(<RiskBubbleScatter points={[]} excluded={0} missionDays={180} />);
    expect(container.textContent).toContain("no rate-based conditions");
  });
});
```

- [ ] **Step 3: Run — verify pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS. (Confirms `loadIMMPriors().conditions` + `buildBubbleData` integrate; `points.length > 20`.)

- [ ] **Step 4: Commit**

```bash
git add src/ui/figures/RiskBubbleScatter.tsx tests/ui/analysis_figures.test.tsx
git commit -m "feat: add multi-dimensional IMM risk bubble-scatter Analysis figure (A2)"
```

---

## Task 11: CriteriaSplom figure

**Files:**
- Create: `src/ui/figures/CriteriaSplom.tsx`
- Test: extend `tests/ui/analysis_figures.test.tsx`

- [ ] **Step 1: Write the figure**

```tsx
// src/ui/figures/CriteriaSplom.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import type { Candidate, Criterion } from "@/types";

// Legibility cap: one representative criterion per family.
export const SPLOM_IDS = [
  "psych.conscientiousness", "physical.vo2max", "cognitive.nasa_cognition_battery",
  "behavioral.teamwork", "psych.resilience_cdrisc",
];

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function CriteriaSplom({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  const cols = criteria.filter((c) => SPLOM_IDS.includes(c.id));
  const K = cols.length;
  if (cohort.length < 3 || K < 2) {
    return <div className="grid h-[480px] place-items-center text-sm text-ink-2 mono">need ≥3 candidates for a scatterplot matrix</div>;
  }
  const vectors = cols.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const grid: object[] = [], xAxis: object[] = [], yAxis: object[] = [], series: object[] = [], title: object[] = [];
  const span = 92 / K; // % per cell
  for (let r = 0; r < K; r++) {
    for (let c = 0; c < K; c++) {
      const idx = r * K + c;
      const left = 4 + c * span, top = 2 + r * span;
      grid.push({ left: `${left}%`, top: `${top}%`, width: `${span * 0.78}%`, height: `${span * 0.74}%` });
      xAxis.push({ gridIndex: idx, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
      yAxis.push({ gridIndex: idx, type: "value", scale: true, axisLabel: { show: false }, axisTick: { show: false }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitLine: { show: false } });
      if (r === c) {
        title.push({ left: `${left + span * 0.39}%`, top: `${top + span * 0.3}%`, textAlign: "center", text: cols[r].label.split(/[ (]/)[0], textStyle: { color: tokens.label, fontSize: 11, fontWeight: "normal" } });
      } else {
        series.push({
          type: "scatter", xAxisIndex: idx, yAxisIndex: idx, symbolSize: 4,
          data: cohort.map((_, k) => [vectors[c][k], vectors[r][k]]),
          itemStyle: { color: "#0072B2", opacity: 0.5 },
        });
      }
    }
  }
  const option = { animation: false, aria: { enabled: true }, grid, xAxis, yAxis, series, title };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 500, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.splom({ n: cohort.length, isDemo, ids: cols.map((c) => c.label.split(/[ (]/)[0]) })} />
    </>
  );
}
```

- [ ] **Step 2: Extend the smoke test**

Append:

```tsx
import { CriteriaSplom } from "@/ui/figures/CriteriaSplom";

describe("CriteriaSplom", () => {
  it("renders the matrix + caption", () => {
    const { container, getByTestId } = wrap(<CriteriaSplom cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A3");
  });
  it("empty state under 3 candidates", () => {
    const { container } = wrap(<CriteriaSplom cohort={cohort.slice(0, 2)} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(container.textContent).toContain("need ≥3 candidates");
  });
});
```

- [ ] **Step 3: Run — verify pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/figures/CriteriaSplom.tsx tests/ui/analysis_figures.test.tsx
git commit -m "feat: add scatterplot-matrix (SPLOM) Analysis figure (A3)"
```

---

## Task 12: CriterionCorrelationHeatmap figure

**Files:**
- Create: `src/ui/figures/CriterionCorrelationHeatmap.tsx`
- Test: extend `tests/ui/analysis_figures.test.tsx`

- [ ] **Step 1: Write the figure**

```tsx
// src/ui/figures/CriterionCorrelationHeatmap.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { correlationMatrix } from "@/analysis/correlation";
import type { Candidate, Criterion } from "@/types";

type Props = { cohort: Candidate[]; criteria: readonly Criterion[]; isDemo: boolean };

export function CriterionCorrelationHeatmap({ cohort, criteria, isDemo }: Props) {
  const { themeName, tokens } = useFigureTheme();
  if (cohort.length < 3 || criteria.length < 2) {
    return <div className="grid h-[460px] place-items-center text-sm text-ink-2 mono">need ≥3 candidates for a correlation heatmap</div>;
  }
  const cols = criteria.map((c) => cohort.map((cand) => cand.scores[c.id] ?? c.scale.min));
  const m = correlationMatrix(cols, "pearson");
  const labels = criteria.map((c) => (c.label.length > 14 ? c.label.slice(0, 13) + "…" : c.label));
  const data: [number, number, number][] = [];
  for (let i = 0; i < m.length; i++) for (let j = 0; j < m.length; j++) data.push([j, i, Number(m[i][j].toFixed(2))]);
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 130, right: 24, top: 16, bottom: 110 },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { value: [number, number, number] }) => `${labels[p.value[1]]} × ${labels[p.value[0]]}<br/>r = ${p.value[2]}`,
    },
    xAxis: { type: "category", data: labels, axisLabel: { color: tokens.label, fontSize: 9, rotate: 55 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    yAxis: { type: "category", data: labels, axisLabel: { color: tokens.label, fontSize: 9 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    visualMap: { min: -1, max: 1, calculable: true, orient: "horizontal", left: "center", bottom: 4, inRange: { color: tokens.diverging }, textStyle: { color: tokens.label, fontSize: 10 } },
    series: [{
      type: "heatmap", data,
      label: { show: true, fontSize: 8, color: tokens.label, formatter: (p: { value: [number, number, number] }) => p.value[2] },
      emphasis: { itemStyle: { borderColor: tokens.tooltipText, borderWidth: 1 } },
    }],
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 480, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.correlation({ n: cohort.length, isDemo, k: criteria.length })} />
    </>
  );
}
```

- [ ] **Step 2: Extend the smoke test**

Append:

```tsx
import { CriterionCorrelationHeatmap } from "@/ui/figures/CriterionCorrelationHeatmap";

describe("CriterionCorrelationHeatmap", () => {
  it("renders the heatmap + caption", () => {
    const { container, getByTestId } = wrap(<CriterionCorrelationHeatmap cohort={cohort} criteria={PLACEHOLDER_CRITERIA} isDemo />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A4");
  });
});
```

- [ ] **Step 3: Run — verify pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/ui/figures/CriterionCorrelationHeatmap.tsx tests/ui/analysis_figures.test.tsx
git commit -m "feat: add criterion-correlation heatmap Analysis figure (A4)"
```

---

## Task 13: VulnerabilityCouplingHeatmap figure

**Files:**
- Create: `src/ui/figures/VulnerabilityCouplingHeatmap.tsx`
- Test: extend `tests/ui/analysis_figures.test.tsx`

- [ ] **Step 1: Write the figure**

```tsx
// src/ui/figures/VulnerabilityCouplingHeatmap.tsx
import ReactEChartsCore from "echarts-for-react/lib/core";
import { echarts } from "./echarts-base";
import { useFigureTheme } from "./useFigureTheme";
import { FigureCaption } from "./FigureCaption";
import { analysisCaptions } from "./captions/analysis.captions";
import { couplingMatrix } from "@/analysis/coupling";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { FAMILY_BETA, FAMILY_BETA_DEFAULT } from "@/imm/simulate";
import type { Criterion } from "@/types";

type Props = { criteria: readonly Criterion[] };

export function VulnerabilityCouplingHeatmap({ criteria }: Props) {
  const { themeName, tokens } = useFigureTheme();
  const { families, matrix } = couplingMatrix(criteria, IMM_CONDITIONS, FAMILY_BETA, FAMILY_BETA_DEFAULT);
  const rowLabels = criteria.map((c) => (c.label.length > 16 ? c.label.slice(0, 15) + "…" : c.label));
  const data: [number, number, number][] = [];
  let maxV = 0;
  for (let i = 0; i < matrix.length; i++) for (let j = 0; j < families.length; j++) {
    const v = matrix[i][j];
    data.push([j, i, Number(v.toFixed(3))]);
    if (v > maxV) maxV = v;
  }
  const option = {
    animation: false,
    aria: { enabled: true },
    grid: { left: 150, right: 24, top: 16, bottom: 110 },
    tooltip: {
      backgroundColor: tokens.tooltipBg, borderColor: tokens.axisLine,
      textStyle: { color: tokens.tooltipText, fontSize: 12 },
      formatter: (p: { value: [number, number, number] }) => `${rowLabels[p.value[1]]}<br/>${families[p.value[0]]}<br/>coupling Σ|β| = ${p.value[2]}`,
    },
    xAxis: { type: "category", data: families, axisLabel: { color: tokens.label, fontSize: 9, rotate: 55 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    yAxis: { type: "category", data: rowLabels, axisLabel: { color: tokens.label, fontSize: 9 }, axisLine: { lineStyle: { color: tokens.axisLine } }, splitArea: { show: true } },
    visualMap: { min: 0, max: Math.max(maxV, 0.001), calculable: true, orient: "horizontal", left: "center", bottom: 4, inRange: { color: tokens.sequential }, textStyle: { color: tokens.label, fontSize: 10 } },
    series: [{ type: "heatmap", data, emphasis: { itemStyle: { borderColor: tokens.tooltipText, borderWidth: 1 } } }],
  };
  return (
    <>
      <ReactEChartsCore echarts={echarts} option={option} theme={themeName} style={{ height: 480, width: "100%" }} notMerge />
      <FigureCaption block={analysisCaptions.coupling({ k: criteria.length, families: families.length })} />
    </>
  );
}
```

- [ ] **Step 2: Extend the smoke test**

Append:

```tsx
import { VulnerabilityCouplingHeatmap } from "@/ui/figures/VulnerabilityCouplingHeatmap";

describe("VulnerabilityCouplingHeatmap", () => {
  it("renders the coupling heatmap + caption from the real catalog", () => {
    const { container, getByTestId } = wrap(<VulnerabilityCouplingHeatmap criteria={PLACEHOLDER_CRITERIA} />);
    expect(getByTestId("echarts-mock")).toBeTruthy();
    expect(container.textContent).toContain("Figure A5");
  });
});
```

- [ ] **Step 3: Run — verify pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS (exercises `couplingMatrix` over `IMM_CONDITIONS` + exported `FAMILY_BETA`).

- [ ] **Step 4: Commit**

```bash
git add src/ui/figures/VulnerabilityCouplingHeatmap.tsx tests/ui/analysis_figures.test.tsx
git commit -m "feat: add vulnerability-coupling heatmap Analysis figure (A5)"
```

---

## Task 14: Analysis view + nav wiring

**Files:**
- Create: `src/ui/views/Analysis.tsx`
- Modify: `src/ui/App.tsx`
- Test: extend `tests/ui/analysis_figures.test.tsx`

- [ ] **Step 1: Write the view**

```tsx
// src/ui/views/Analysis.tsx
import { useEffect, useState, type ReactNode } from "react";
import type { Candidate } from "@/types";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { listCandidates, listCriterionEntries } from "@/db/repository";
import { makeDemoCohort } from "@/analysis/demo-cohort";
import { buildBubbleData } from "@/analysis/imm-bubbles";
import { IMM_CONDITIONS } from "@/imm/conditions";
import { loadIMMPriors } from "@/imm/priors";
import { ParallelCriteria } from "@/ui/figures/ParallelCriteria";
import { RiskBubbleScatter } from "@/ui/figures/RiskBubbleScatter";
import { CriteriaSplom } from "@/ui/figures/CriteriaSplom";
import { CriterionCorrelationHeatmap } from "@/ui/figures/CriterionCorrelationHeatmap";
import { VulnerabilityCouplingHeatmap } from "@/ui/figures/VulnerabilityCouplingHeatmap";

const MIN_COHORT = 8;
const MISSION_DAYS = 180;

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="label mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function Analysis() {
  const criteria = PLACEHOLDER_CRITERIA;
  const [cohort, setCohort] = useState<Candidate[]>(() => makeDemoCohort(criteria));
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await listCandidates();
      const assembled: Candidate[] = [];
      for (const r of rows) {
        const entries = await listCriterionEntries(r.id);
        if (entries.length === 0) continue;
        const scores: Record<string, number> = {};
        for (const e of entries) scores[e.criterionId] = e.rawValue;
        assembled.push({ id: r.id, alias: r.alias, scores });
      }
      const wellScored = assembled.filter(
        (c) => criteria.filter((cr) => c.scores[cr.id] != null).length >= Math.ceil(criteria.length * 0.6),
      );
      if (!alive) return;
      if (wellScored.length >= MIN_COHORT) { setCohort(wellScored); setIsDemo(false); }
      else { setCohort(makeDemoCohort(criteria)); setIsDemo(true); }
    })();
    return () => { alive = false; };
  }, [criteria]);

  const { points, excluded } = buildBubbleData(IMM_CONDITIONS, loadIMMPriors().conditions, MISSION_DAYS);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="display text-xl text-ink-0">Correlation analysis</h1>
        <span className="mono text-[12px] uppercase tracking-cap text-ink-3">
          {isDemo ? "demo cohort · N=" + cohort.length : "live pool · N=" + cohort.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="A1 · Candidate profiles (parallel coordinates)">
          <ParallelCriteria cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A2 · IMM risk landscape (multi-dimensional)">
          <RiskBubbleScatter points={points} excluded={excluded.length} missionDays={MISSION_DAYS} />
        </Panel>
        <Panel title="A3 · Criteria scatterplot matrix">
          <CriteriaSplom cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A4 · Criterion correlation">
          <CriterionCorrelationHeatmap cohort={cohort} criteria={criteria} isDemo={isDemo} />
        </Panel>
        <Panel title="A5 · Vulnerability coupling">
          <VulnerabilityCouplingHeatmap criteria={criteria} />
        </Panel>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `src/ui/App.tsx`**

Add the import:
```tsx
import { Analysis } from "./views/Analysis";
```
Add to the `View` union:
```tsx
  | { kind: "analysis" };
```
Add a nav button after the "Calibration" button (mirror the existing button styling):
```tsx
<button
  className={`uppercase tracking-cap transition-colors ${
    view.kind === "analysis"
      ? "text-signal border-b border-signal pb-0.5"
      : "text-ink-2 hover:text-ink-0"
  }`}
  onClick={() => setView({ kind: "analysis" })}
>
  Analysis
</button>
```
Add the render branch in `<main>` after the calibration branch:
```tsx
{view.kind === "analysis" && (
  <ErrorBoundary fallbackLabel="The Analysis view crashed during render" onReset={() => setView({ kind: "dashboard" })}>
    <Analysis />
  </ErrorBoundary>
)}
```

- [ ] **Step 3: Extend the smoke test (view renders all five figure captions)**

Append to `tests/ui/analysis_figures.test.tsx`:

```tsx
import { Analysis } from "@/ui/views/Analysis";

vi.mock("@/db/repository", () => ({
  listCandidates: async () => [],
  listCriterionEntries: async () => [],
}));

describe("Analysis view", () => {
  it("renders all five figure panels with the demo cohort fallback", async () => {
    const { container, findByText } = wrap(<Analysis />);
    expect(await findByText(/Figure A1/)).toBeTruthy();
    for (const id of ["A2", "A3", "A4", "A5"]) {
      expect(container.textContent).toContain(`Figure ${id}`);
    }
    expect(container.textContent).toContain("demo cohort");
  });
});
```

- [ ] **Step 4: Run — verify pass**

Run: `npx vitest run tests/ui/analysis_figures.test.tsx`
Expected: PASS (all five figures render under the mocked empty DB → demo cohort).

- [ ] **Step 5: Verify in-app (both themes)**

Run: `npm run dev`. Click "Analysis". All five figures render; toggle dark↔light and confirm each figure re-themes (axis/label/tooltip colors switch). Captions show N and "demo cohort".

- [ ] **Step 6: Commit**

```bash
git add src/ui/views/Analysis.tsx src/ui/App.tsx tests/ui/analysis_figures.test.tsx
git commit -m "feat: add Analysis tab assembling the five correlation figures"
```

---

## Task 15: Full verification + docs

**Files:**
- Modify: `STATUS.md`, `README.md`, `CHANGELOG.md`

- [ ] **Step 1: Full test + typecheck + build**

Run: `npm run typecheck && npm test && npm run build`
Expected: typecheck 0 errors; all vitest suites pass (existing + 6 new); build succeeds.

- [ ] **Step 2: Manuscript-snapshot regression (Approach A gate)**

Run: `npx playwright test tests/e2e/paper-figures.spec.ts`
Expected: PASS unchanged (Approach A touched no shared figure; `:root` dark defaults are byte-equivalent). If Playwright browsers are missing, run `npx playwright install` first. If any snapshot diffs, STOP — investigate before proceeding (a shared figure was touched inadvertently).

- [ ] **Step 3: Capture before/after screenshots for the record**

Run: `npm run dev`, then via Playwright MCP or the `playwright-cli` capture `Analysis` in both themes to `/root/repos/exports/2026-05-30_selectron_analysis_dark.png` and `_light.png`, and the header at desktop width to confirm no wrap.

- [ ] **Step 4: Update `STATUS.md`** — append to the Audit log and update Current state:

Add an audit-log entry (UTC date 2026-05-30) summarizing: light/dark theme (RGB-channel vars, persisted toggle, no-FOUC), +2pt type scale, new Analysis tab with 5 figures (A1 parallel, A2 bubble, A3 SPLOM, A4 correlation, A5 coupling), all math TDD'd, render-smoke + theme-toggle suites green, manuscript snapshots unchanged. Note Approach A scope line and the N1 follow-up (existing working-view charts not yet dark-themed).

- [ ] **Step 5: Update `README.md` + `CHANGELOG.md`**

README: add an "Analysis tab" subsection (5 figures + light/dark toggle) under the UI/feature section. CHANGELOG: add a dated entry (theme, type scale, Analysis tab) under a new version bump consistent with the file's existing scheme.

- [ ] **Step 6: Commit**

```bash
git add STATUS.md README.md CHANGELOG.md
git commit -m "docs: record light theme, +2pt type, and Analysis tab; bump CHANGELOG"
```

---

## Self-review notes (for the implementer)

- **Spec coverage:** G1 theme → T5,T7,T8; G2 type → T6; G3 five figures + tab → T9–T14; G4 demo cohort + N captions → T4,T9–T14; G5 tests → every TDD task + T2/T7 + T15 regression. Non-goal N1 (existing charts dark) explicitly deferred.
- **Type consistency:** `Candidate.scores: Record<string,number>`; `normalizeScore(raw, scale, higherIsBetter)`; `loadIMMPriors().conditions: Record<string, IMMPrior>`; `IMM_CONDITIONS: IMMCondition[]`; `couplingMatrix(...) → { families, matrix }`; `buildBubbleData(...) → { points, excluded }`; `useFigureTheme() → { themeName, tokens }`. These names are used identically across tasks.
- **Watch items during execution:** (a) ECharts `log` x-axis requires all rates > 0 — `conditionRate`/`buildBubbleData` guarantee it. (b) If the +2pt header wraps, drop the `h1` to `text-xl` (T6 step 3). (c) Heatmap on-cell label color is a single token; if low-contrast on mid-range cells, acceptable for v1.
