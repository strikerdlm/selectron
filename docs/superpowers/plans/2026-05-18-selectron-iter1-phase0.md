# Selectron — Iteration 1 + Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Selectron repo with a working end-to-end vertical slice (TS Bayesian MCDA engine + minimal React UI scoring one synthetic candidate against 5 hardcoded criteria) AND dispatch the 6-agent Phase 0 literature fan-out so the criterion taxonomy is ready when Iteration 2 starts.

**Architecture:** Pure TypeScript single repo, Vite + React + Tailwind frontend, hand-rolled Metropolis-Hastings sampler against a Dirichlet weight prior, ECharts for the posterior plot, Vitest for tests. The 6 research subagents run **in parallel and in the background** while the code work proceeds in the main thread — they consume Diego's Zotero library via the `zotero-pdf-ocr` skill plus MCP servers (`paper-search`, `scite`, PubMed, `firecrawl`, `ebsco-unal`).

**Tech Stack:** TypeScript 5.x, Vite 5.x, React 18.x, Tailwind 3.x, Vitest 1.x, Apache ECharts 6.x. Zero runtime dependencies for the sampler (hand-rolled Mulberry32 PRNG + Marsaglia–Tsang gamma sampler).

**Source of truth:** `/root/repos/Selectron/docs/superpowers/specs/2026-05-18-selectron-design.md`

---

## Plan structure

- **Part A** — Repo bootstrap (Tasks 1–5)
- **Part B** — Engine, TDD math first (Tasks 6–12)
- **Part C** — UI (Tasks 13–17)
- **Part D** — Phase 0 research agent fan-out (Task 18) — dispatch in background early
- **Part E** — Synthesis gate, Diego ratifies (Task 19)

Dispatch Task 18 (Phase 0 fan-out) **before or alongside Task 6** so the research runs in the background while the code work happens. Do not wait for Phase 0 to finish before continuing with Tasks 6–17.

---

## Part A — Repo bootstrap

### Task 1: Initialize npm project + TypeScript + Vite + React + Tailwind + Vitest

**Files:**
- Create: `/root/repos/Selectron/package.json`
- Create: `/root/repos/Selectron/tsconfig.json`
- Create: `/root/repos/Selectron/tsconfig.node.json`
- Create: `/root/repos/Selectron/vite.config.ts`
- Create: `/root/repos/Selectron/vitest.config.ts`
- Create: `/root/repos/Selectron/tailwind.config.js`
- Create: `/root/repos/Selectron/postcss.config.js`
- Create: `/root/repos/Selectron/index.html`
- Create: `/root/repos/Selectron/src/main.tsx`
- Create: `/root/repos/Selectron/src/index.css`
- Create: `/root/repos/Selectron/src/vite-env.d.ts`

- [ ] **Step 1: Initialize package.json**

```bash
cd /root/repos/Selectron && cat > package.json <<'EOF'
{
  "name": "selectron",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "echarts": "^6.0.0",
    "echarts-for-react": "^3.0.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.5.3",
    "vite": "^5.3.4",
    "vitest": "^1.6.0"
  }
}
EOF
```

- [ ] **Step 2: Install dependencies**

Run: `cd /root/repos/Selectron && npm install`
Expected: completes without error, generates `package-lock.json` and `node_modules/`.

- [ ] **Step 3: Write TypeScript config**

```bash
cat > /root/repos/Selectron/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
cat > /root/repos/Selectron/tsconfig.node.json <<'EOF'
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
EOF
```

- [ ] **Step 4: Write Vite and Vitest config**

```bash
cat > /root/repos/Selectron/vite.config.ts <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
EOF
cat > /root/repos/Selectron/vitest.config.ts <<'EOF'
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
EOF
```

- [ ] **Step 5: Write Tailwind + Postcss config**

```bash
cat > /root/repos/Selectron/tailwind.config.js <<'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
EOF
cat > /root/repos/Selectron/postcss.config.js <<'EOF'
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
EOF
```

- [ ] **Step 6: Write index.html + minimal app entry**

```bash
cat > /root/repos/Selectron/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Selectron — Iter 1</title>
  </head>
  <body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF
cat > /root/repos/Selectron/src/main.tsx <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./ui/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
EOF
cat > /root/repos/Selectron/src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF
cat > /root/repos/Selectron/src/vite-env.d.ts <<'EOF'
/// <reference types="vite/client" />
EOF
```

- [ ] **Step 7: Verify build + typecheck pass**

Run: `cd /root/repos/Selectron && npm run typecheck`
Expected: fails because `./ui/App` doesn't exist yet — that's OK for now.

Run: `cd /root/repos/Selectron && npx vite build --logLevel error 2>&1 | head -5`
Expected: same failure — `App.tsx` not created until Task 17. Defer green build to Task 17.

- [ ] **Step 8: Commit**

```bash
cd /root/repos/Selectron && git add -A && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "chore: bootstrap TS + Vite + React + Tailwind + Vitest"
```

---

### Task 2: Write README.md and CLAUDE.md

**Files:**
- Create: `/root/repos/Selectron/README.md`
- Create: `/root/repos/Selectron/CLAUDE.md`

- [ ] **Step 1: Write README.md**

```bash
cat > /root/repos/Selectron/README.md <<'EOF'
# Selectron

A Bayesian multi-criteria decision-analysis scoring engine for analog-astronaut selection, with an interactive TypeScript UI. Personal research tool — the deliverable is a methodology paper.

**Status:** Iteration 1 (vertical slice, 5 hardcoded placeholder criteria).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # run vitest suites
npm run typecheck    # tsc --noEmit
```

## Layout

```
src/engine/   pure-TS scoring math (no React)
src/ui/       React + Tailwind UI
src/data/     placeholder criterion definitions (replaced in Iter 2)
src/types/    shared TS types
tests/        vitest, math-first
research/     Phase 0 literature outputs (read-only, agent-produced)
docs/         specs + plans + decisions
paper/        manuscript draft
```

## Inspiration

Apollonio et al. *ASTRA Framework for Enhancing Human Performance and Safety in Analog Missions.* AIAA ASCEND 2026 (paper 2026-3000). Selectron is methodological (scoring engine), not infrastructural (database) — see `docs/superpowers/specs/`.

## Author

Diego L. Malpica, MD — Aerospace Medicine, FAC.
EOF
```

- [ ] **Step 2: Write CLAUDE.md**

```bash
cat > /root/repos/Selectron/CLAUDE.md <<'EOF'
# CLAUDE.md — Selectron

## What this repo is

A Bayesian MCDA scoring engine for analog-astronaut selection. Personal research tool + methodology paper. Pure TS, single-repo, no Python backend. Spec: `docs/superpowers/specs/2026-05-18-selectron-design.md`.

## Sequencing

Four-iteration spiral:

1. **Iter 1** — vertical slice, 5 hardcoded criteria, end-to-end (current).
2. **Iter 2** — literature-driven criteria + multi-candidate comparison.
3. **Iter 3** — sensitivity analysis + prior elicitation.
4. **Iter 4** — paper draft.

Phase 0 (6-agent literature fan-out) runs in parallel with Iter 1, gates Iter 2.

## Working in this repo

- Math before UI. Every engine module ships with a vitest suite before its UI consumer.
- All exports → `/root/repos/exports/` per workspace convention. Local build artifacts → `exports/` here (gitignored).
- Commits: `feat:` / `fix:` / `docs:` / `chore:`, no AI co-author lines (Diego is sole author).
- Plans live at `docs/superpowers/plans/`. Active plan = `2026-05-18-selectron-iter1-phase0.md`.

## Phase 0 outputs (research/)

The 6 research agents write read-only artifacts here. Do not modify by hand — re-run the agent if a deliverable needs to change. After all six finish, Diego ratifies `docs/criteria.md` (manual review of the proposals).
EOF
```

- [ ] **Step 3: Commit**

```bash
cd /root/repos/Selectron && git add README.md CLAUDE.md && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "docs: add README and per-repo CLAUDE.md"
```

---

### Task 3: Define core TS types

**Files:**
- Create: `/root/repos/Selectron/src/types/criterion.ts`
- Create: `/root/repos/Selectron/src/types/candidate.ts`
- Create: `/root/repos/Selectron/src/types/posterior.ts`
- Create: `/root/repos/Selectron/src/types/index.ts`

- [ ] **Step 1: Write Criterion type**

```bash
cat > /root/repos/Selectron/src/types/criterion.ts <<'EOF'
export type Criterion = {
  id: string;
  family: string;
  label: string;
  description: string;
  instrument: string;
  scale: { min: number; max: number };
  higherIsBetter: boolean;
  citations: string[];
};
EOF
```

- [ ] **Step 2: Write Candidate type**

```bash
cat > /root/repos/Selectron/src/types/candidate.ts <<'EOF'
export type Candidate = {
  id: string;
  alias: string;
  scores: Record<string, number>;
  metadata?: Record<string, unknown>;
};
EOF
```

- [ ] **Step 3: Write Posterior type**

```bash
cat > /root/repos/Selectron/src/types/posterior.ts <<'EOF'
export type Posterior = {
  samples: Float64Array;
  ess: number;
  mean: number;
  ci90: readonly [number, number];
  ci95: readonly [number, number];
};
EOF
```

- [ ] **Step 4: Write barrel export**

```bash
cat > /root/repos/Selectron/src/types/index.ts <<'EOF'
export type { Criterion } from "./criterion";
export type { Candidate } from "./candidate";
export type { Posterior } from "./posterior";
EOF
```

- [ ] **Step 5: Verify typecheck**

Run: `cd /root/repos/Selectron && npx tsc --noEmit src/types/index.ts`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
cd /root/repos/Selectron && git add src/types/ && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(types): Criterion, Candidate, Posterior"
```

---

### Task 4: Errors module

**Files:**
- Create: `/root/repos/Selectron/src/engine/errors.ts`
- Create: `/root/repos/Selectron/tests/engine/errors.test.ts`

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/errors.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { SelectronError } from "@/engine/errors";

describe("SelectronError", () => {
  it("preserves code, message, and details", () => {
    const err = new SelectronError("E_BAD_SCORE", "score out of range", { criterion: "x", value: 11 });
    expect(err.name).toBe("SelectronError");
    expect(err.code).toBe("E_BAD_SCORE");
    expect(err.message).toBe("score out of range");
    expect(err.details).toEqual({ criterion: "x", value: 11 });
  });

  it("is instanceof Error", () => {
    expect(new SelectronError("E_TEST", "x")).toBeInstanceOf(Error);
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/errors.test.ts 2>&1 | tail -5`
Expected: FAIL with "Cannot find module '@/engine/errors'".

- [ ] **Step 3: Write implementation**

```bash
mkdir -p /root/repos/Selectron/src/engine && cat > /root/repos/Selectron/src/engine/errors.ts <<'EOF'
export type SelectronErrorCode =
  | "E_BAD_SCORE"
  | "E_BAD_WEIGHT"
  | "E_NO_CRITERIA"
  | "E_NO_CANDIDATES"
  | "E_SAMPLER_DIVERGED";

export class SelectronError extends Error {
  readonly code: SelectronErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: SelectronErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "SelectronError";
    this.code = code;
    this.details = details;
  }
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/errors.test.ts 2>&1 | tail -5`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/errors.ts tests/engine/errors.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): SelectronError with structured codes"
```

---

### Task 5: Seeded PRNG (Mulberry32)

**Files:**
- Create: `/root/repos/Selectron/src/engine/prng.ts`
- Create: `/root/repos/Selectron/tests/engine/prng.test.ts`

The sampler needs a deterministic PRNG (seedable). Mulberry32 is a tiny, fast, high-quality 32-bit PRNG with a known-good implementation.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/prng.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { makeRng } from "@/engine/prng";

describe("makeRng (Mulberry32)", () => {
  it("returns numbers in [0, 1)", () => {
    const rng = makeRng(42);
    for (let i = 0; i < 1000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("is deterministic given the same seed", () => {
    const a = makeRng(7);
    const b = makeRng(7);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it("differs for different seeds", () => {
    const a = makeRng(1)();
    const b = makeRng(2)();
    expect(a).not.toBe(b);
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/prng.test.ts 2>&1 | tail -5`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/prng.ts <<'EOF'
// Mulberry32 — 32-bit PRNG, seed-deterministic, ~10 ns/call.
// Reference: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/prng.test.ts 2>&1 | tail -5`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/prng.ts tests/engine/prng.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): seeded Mulberry32 PRNG"
```

---

## Part B — Engine (TDD, math first)

### Task 6: Gamma sampler (Marsaglia–Tsang)

**Files:**
- Create: `/root/repos/Selectron/src/engine/gamma.ts`
- Create: `/root/repos/Selectron/tests/engine/gamma.test.ts`

Dirichlet sampling reduces to Gamma sampling. Marsaglia–Tsang is the standard method for shape ≥ 1; we handle shape < 1 with the Stuart transformation `g(α) = g(α+1) × U^(1/α)`.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/gamma.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { sampleGamma } from "@/engine/gamma";
import { makeRng } from "@/engine/prng";

function meanVar(xs: number[]): { mean: number; variance: number } {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length;
  return { mean, variance };
}

describe("sampleGamma(shape, 1)", () => {
  it("matches mean=shape and variance=shape for shape>=1 (within 5%)", () => {
    const rng = makeRng(1);
    const shape = 5;
    const xs = Array.from({ length: 50_000 }, () => sampleGamma(shape, rng));
    const { mean, variance } = meanVar(xs);
    expect(mean).toBeCloseTo(shape, 1);
    expect(variance).toBeCloseTo(shape, 1);
  });

  it("handles shape < 1", () => {
    const rng = makeRng(2);
    const shape = 0.5;
    const xs = Array.from({ length: 50_000 }, () => sampleGamma(shape, rng));
    const { mean, variance } = meanVar(xs);
    // Gamma(0.5, 1) has mean=0.5, variance=0.5
    expect(mean).toBeCloseTo(0.5, 1);
    expect(variance).toBeCloseTo(0.5, 1);
  });

  it("returns positive values", () => {
    const rng = makeRng(3);
    for (let i = 0; i < 1000; i++) {
      expect(sampleGamma(2.5, rng)).toBeGreaterThan(0);
    }
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/gamma.test.ts 2>&1 | tail -5`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/gamma.ts <<'EOF'
// Marsaglia–Tsang Gamma(shape, 1) sampler.
// For shape < 1, use the boosting trick: G(a) = G(a+1) * U^(1/a).
// Reference: Marsaglia & Tsang (2000), "A Simple Method for Generating Gamma Variables".

function sampleStandardNormal(rng: () => number): number {
  // Box–Muller; we only need one of the pair.
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function sampleGamma(shape: number, rng: () => number): number {
  if (shape <= 0) throw new RangeError(`shape must be > 0, got ${shape}`);
  if (shape < 1) {
    // Stuart boosting.
    const g = sampleGamma(shape + 1, rng);
    return g * Math.pow(Math.max(rng(), Number.EPSILON), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  // Acceptance-rejection on a normal proposal.
  for (;;) {
    const x = sampleStandardNormal(rng);
    const v0 = 1 + c * x;
    if (v0 <= 0) continue;
    const v = v0 * v0 * v0;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/gamma.test.ts 2>&1 | tail -5`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/gamma.ts tests/engine/gamma.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): Marsaglia–Tsang Gamma sampler"
```

---

### Task 7: Dirichlet sampler (direct, for ground-truth)

**Files:**
- Create: `/root/repos/Selectron/src/engine/dirichlet.ts`
- Create: `/root/repos/Selectron/tests/engine/dirichlet.test.ts`

A Dirichlet draw is `w_k = G_k / sum(G_l)` for `G_k ~ Gamma(alpha_k, 1)`. This is the **ground-truth reference** the MH sampler will be validated against in Task 9.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/dirichlet.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { sampleDirichlet, dirichletMean, dirichletVariance } from "@/engine/dirichlet";
import { makeRng } from "@/engine/prng";

describe("sampleDirichlet", () => {
  it("returns a simplex (non-negative, sums to 1 within 1e-9)", () => {
    const rng = makeRng(1);
    const alpha = [1, 2, 3, 4];
    for (let i = 0; i < 100; i++) {
      const w = sampleDirichlet(alpha, rng);
      expect(w.length).toBe(4);
      for (const wk of w) expect(wk).toBeGreaterThanOrEqual(0);
      expect(Math.abs(w.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(1e-9);
    }
  });

  it("empirical mean and variance match closed-form (within 3%)", () => {
    const rng = makeRng(2);
    const alpha = [2, 3, 5];
    const N = 50_000;
    const samples: number[][] = Array.from({ length: N }, () => Array.from(sampleDirichlet(alpha, rng)));

    const mean = alpha.map((_, k) => samples.reduce((s, w) => s + w[k], 0) / N);
    const variance = alpha.map((_, k) => samples.reduce((s, w) => s + (w[k] - mean[k]) ** 2, 0) / N);

    const expectedMean = dirichletMean(alpha);
    const expectedVariance = dirichletVariance(alpha);

    for (let k = 0; k < alpha.length; k++) {
      expect(mean[k]).toBeCloseTo(expectedMean[k], 2);
      expect(variance[k]).toBeCloseTo(expectedVariance[k], 2);
    }
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/dirichlet.test.ts 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/dirichlet.ts <<'EOF'
import { sampleGamma } from "./gamma";

export function sampleDirichlet(alpha: readonly number[], rng: () => number): Float64Array {
  const k = alpha.length;
  const out = new Float64Array(k);
  let s = 0;
  for (let i = 0; i < k; i++) {
    out[i] = sampleGamma(alpha[i], rng);
    s += out[i];
  }
  for (let i = 0; i < k; i++) out[i] /= s;
  return out;
}

export function dirichletMean(alpha: readonly number[]): number[] {
  const s = alpha.reduce((a, b) => a + b, 0);
  return alpha.map((ak) => ak / s);
}

export function dirichletVariance(alpha: readonly number[]): number[] {
  const s = alpha.reduce((a, b) => a + b, 0);
  return alpha.map((ak) => (ak * (s - ak)) / (s * s * (s + 1)));
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/dirichlet.test.ts 2>&1 | tail -5`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/dirichlet.ts tests/engine/dirichlet.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): Dirichlet sampler with closed-form mean/variance"
```

---

### Task 8: Placeholder criteria (5 hardcoded)

**Files:**
- Create: `/root/repos/Selectron/src/data/placeholder-criteria.ts`
- Create: `/root/repos/Selectron/tests/engine/placeholder-criteria.test.ts`

These 5 are intentional placeholders — they exist so Iter 1 can prove end-to-end function before Phase 0 finishes. They will be replaced in Iter 2 with literature-driven criteria from `docs/criteria.md`.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/placeholder-criteria.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

describe("PLACEHOLDER_CRITERIA", () => {
  it("has exactly 5 entries", () => {
    expect(PLACEHOLDER_CRITERIA.length).toBe(5);
  });

  it("each has unique id, sane scale, and at least one citation", () => {
    const ids = new Set<string>();
    for (const c of PLACEHOLDER_CRITERIA) {
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);
      expect(c.scale.min).toBeLessThan(c.scale.max);
      expect(c.citations.length).toBeGreaterThan(0);
    }
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/placeholder-criteria.test.ts 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```bash
mkdir -p /root/repos/Selectron/src/data && cat > /root/repos/Selectron/src/data/placeholder-criteria.ts <<'EOF'
import type { Criterion } from "@/types";

// PLACEHOLDER set for Iter 1. Replaced in Iter 2 by docs/criteria.md output of Phase 0.
// Each criterion below is a defensible placeholder chosen so the end-to-end pipeline
// can be validated before the literature taxonomy is finalized.
export const PLACEHOLDER_CRITERIA: readonly Criterion[] = [
  {
    id: "psych.conscientiousness",
    family: "psychological",
    label: "Conscientiousness (Big Five)",
    description: "Tendency to be organized, responsible, and dependable under sustained workload.",
    instrument: "NEO-PI-R (T-score)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.1037/0022-3514.88.1.139"],
  },
  {
    id: "psych.emotional_stability",
    family: "psychological",
    label: "Emotional stability",
    description: "Resilience to acute and chronic stress in isolated and confined environments.",
    instrument: "NEO-PI-R neuroticism (reversed, T-score)",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: ["10.3357/ASEM.2521.2009"],
  },
  {
    id: "physical.vo2max",
    family: "physical",
    label: "VO₂max",
    description: "Cardiorespiratory fitness baseline.",
    instrument: "Graded exercise test (mL/kg/min)",
    scale: { min: 20, max: 70 },
    higherIsBetter: true,
    citations: ["10.1152/japplphysiol.00756.2017"],
  },
  {
    id: "professional.technical_competence",
    family: "professional",
    label: "Technical competence",
    description: "Mission-relevant technical and operational skill, assessed via structured panel rubric.",
    instrument: "Structured behavioural rubric (1–10)",
    scale: { min: 1, max: 10 },
    higherIsBetter: true,
    citations: ["10.1518/001872008X312413"],
  },
  {
    id: "behavioral.teamwork",
    family: "behavioral",
    label: "Teamwork (BBI)",
    description: "Demonstrated capacity to operate effectively within a small isolated crew.",
    instrument: "Behavioural-based interview score (1–5)",
    scale: { min: 1, max: 5 },
    higherIsBetter: true,
    citations: ["10.3357/ASEM.4023.2014"],
  },
];
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/placeholder-criteria.test.ts 2>&1 | tail -5`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/data/placeholder-criteria.ts tests/engine/placeholder-criteria.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(data): 5 placeholder criteria for Iter 1"
```

---

### Task 9: Score normalization

**Files:**
- Create: `/root/repos/Selectron/src/engine/normalize.ts`
- Create: `/root/repos/Selectron/tests/engine/normalize.test.ts`

Raw scores live on heterogeneous scales (e.g. VO₂max 20–70, teamwork 1–5). Normalize to [0, 1] (higher = better) before weighting.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/normalize.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { normalizeScore } from "@/engine/normalize";
import { SelectronError } from "@/engine/errors";

describe("normalizeScore", () => {
  it("maps [min, max] to [0, 1] when higherIsBetter", () => {
    expect(normalizeScore(20, { min: 20, max: 70 }, true)).toBeCloseTo(0);
    expect(normalizeScore(70, { min: 20, max: 70 }, true)).toBeCloseTo(1);
    expect(normalizeScore(45, { min: 20, max: 70 }, true)).toBeCloseTo(0.5);
  });

  it("flips when lower is better", () => {
    expect(normalizeScore(20, { min: 20, max: 70 }, false)).toBeCloseTo(1);
    expect(normalizeScore(70, { min: 20, max: 70 }, false)).toBeCloseTo(0);
  });

  it("throws SelectronError on out-of-range score", () => {
    expect(() => normalizeScore(75, { min: 20, max: 70 }, true)).toThrow(SelectronError);
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/normalize.test.ts 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/normalize.ts <<'EOF'
import { SelectronError } from "./errors";

export function normalizeScore(
  raw: number,
  scale: { min: number; max: number },
  higherIsBetter: boolean,
): number {
  if (raw < scale.min || raw > scale.max) {
    throw new SelectronError("E_BAD_SCORE", `score ${raw} outside [${scale.min}, ${scale.max}]`, {
      raw,
      scale,
    });
  }
  const z = (raw - scale.min) / (scale.max - scale.min);
  return higherIsBetter ? z : 1 - z;
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/normalize.test.ts 2>&1 | tail -5`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/normalize.ts tests/engine/normalize.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): score normalization with structured error"
```

---

### Task 10: Bayesian MCDA model + closed-form reference

**Files:**
- Create: `/root/repos/Selectron/src/engine/mcda.ts`
- Create: `/root/repos/Selectron/tests/engine/mcda.test.ts`

The model: `S_i = sum_k w_k * z_ik` with `w ~ Dirichlet(alpha)`, `z_ik` = normalized raw score. Closed-form mean and variance of `S_i` come from the Dirichlet moments.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/mcda.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { scoreCandidate, closedFormMoments } from "@/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { makeRng } from "@/engine/prng";
import type { Candidate } from "@/types";

const demo: Candidate = {
  id: "demo-1",
  alias: "Alpha",
  scores: {
    "psych.conscientiousness": 72,
    "psych.emotional_stability": 65,
    "physical.vo2max": 52,
    "professional.technical_competence": 8,
    "behavioral.teamwork": 4,
  },
};

describe("scoreCandidate", () => {
  it("returns a Posterior with samples, ess, mean, ci90, ci95", () => {
    const post = scoreCandidate({
      candidate: demo,
      criteria: PLACEHOLDER_CRITERIA,
      alpha: [1, 1, 1, 1, 1],
      iterations: 5000,
      seed: 42,
    });
    expect(post.samples.length).toBe(5000);
    expect(post.ess).toBeGreaterThan(0);
    expect(post.mean).toBeGreaterThan(0);
    expect(post.mean).toBeLessThan(1);
    expect(post.ci90[0]).toBeLessThan(post.ci90[1]);
    expect(post.ci95[0]).toBeLessThanOrEqual(post.ci90[0]);
    expect(post.ci95[1]).toBeGreaterThanOrEqual(post.ci90[1]);
  });

  it("matches closed-form mean and variance within 2%", () => {
    const alpha = [1, 1, 1, 1, 1];
    const { mean: cfMean, variance: cfVar } = closedFormMoments({
      candidate: demo,
      criteria: PLACEHOLDER_CRITERIA,
      alpha,
    });

    const post = scoreCandidate({
      candidate: demo,
      criteria: PLACEHOLDER_CRITERIA,
      alpha,
      iterations: 50_000,
      seed: 7,
    });

    const sampleMean = post.mean;
    const sampleVar =
      post.samples.reduce((s, x) => s + (x - sampleMean) ** 2, 0) / post.samples.length;

    expect(Math.abs(sampleMean - cfMean) / cfMean).toBeLessThan(0.02);
    expect(Math.abs(sampleVar - cfVar) / cfVar).toBeLessThan(0.05);
  });

  it("is deterministic given the same seed", () => {
    const args = {
      candidate: demo,
      criteria: PLACEHOLDER_CRITERIA,
      alpha: [1, 1, 1, 1, 1],
      iterations: 1000,
      seed: 99,
    };
    const a = scoreCandidate(args);
    const b = scoreCandidate(args);
    expect(a.mean).toBe(b.mean);
    expect(a.samples[0]).toBe(b.samples[0]);
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/mcda.test.ts 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/mcda.ts <<'EOF'
import type { Candidate, Criterion, Posterior } from "@/types";
import { sampleDirichlet, dirichletMean, dirichletVariance } from "./dirichlet";
import { normalizeScore } from "./normalize";
import { makeRng } from "./prng";
import { SelectronError } from "./errors";

export type ScoreInput = {
  candidate: Candidate;
  criteria: readonly Criterion[];
  alpha: readonly number[];
  iterations: number;
  seed: number;
};

function normalizedScoreVector(candidate: Candidate, criteria: readonly Criterion[]): Float64Array {
  if (criteria.length === 0) throw new SelectronError("E_NO_CRITERIA", "criteria array is empty");
  const z = new Float64Array(criteria.length);
  for (let k = 0; k < criteria.length; k++) {
    const c = criteria[k];
    const raw = candidate.scores[c.id];
    if (raw === undefined) {
      throw new SelectronError("E_BAD_SCORE", `candidate missing score for ${c.id}`, {
        criterion: c.id,
        candidate: candidate.id,
      });
    }
    z[k] = normalizeScore(raw, c.scale, c.higherIsBetter);
  }
  return z;
}

function autocorrelation1(samples: Float64Array, mean: number): number {
  const n = samples.length;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - 1; i++) {
    num += (samples[i] - mean) * (samples[i + 1] - mean);
  }
  for (let i = 0; i < n; i++) {
    den += (samples[i] - mean) ** 2;
  }
  return den > 0 ? num / den : 0;
}

function effectiveSampleSize(samples: Float64Array, mean: number): number {
  const rho1 = autocorrelation1(samples, mean);
  // ESS ≈ N * (1 - rho1) / (1 + rho1); independent samples → rho1 ≈ 0 → ESS ≈ N
  const ratio = Math.max(0, (1 - rho1) / (1 + rho1));
  return samples.length * ratio;
}

function quantile(sortedAsc: Float64Array, q: number): number {
  const n = sortedAsc.length;
  const idx = q * (n - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  const frac = idx - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}

export function scoreCandidate(input: ScoreInput): Posterior {
  const { candidate, criteria, alpha, iterations, seed } = input;
  if (alpha.length !== criteria.length) {
    throw new SelectronError("E_BAD_WEIGHT", "alpha length must equal criteria length", {
      alpha: alpha.length,
      criteria: criteria.length,
    });
  }
  for (const a of alpha) {
    if (a <= 0) throw new SelectronError("E_BAD_WEIGHT", "all alpha entries must be > 0");
  }

  const z = normalizedScoreVector(candidate, criteria);
  const rng = makeRng(seed);
  const samples = new Float64Array(iterations);
  for (let t = 0; t < iterations; t++) {
    const w = sampleDirichlet(alpha, rng);
    let s = 0;
    for (let k = 0; k < z.length; k++) s += w[k] * z[k];
    samples[t] = s;
  }

  let mean = 0;
  for (let t = 0; t < iterations; t++) mean += samples[t];
  mean /= iterations;

  const sorted = new Float64Array(samples).sort();
  return {
    samples,
    ess: effectiveSampleSize(samples, mean),
    mean,
    ci90: [quantile(sorted, 0.05), quantile(sorted, 0.95)] as const,
    ci95: [quantile(sorted, 0.025), quantile(sorted, 0.975)] as const,
  };
}

export type ClosedFormInput = {
  candidate: Candidate;
  criteria: readonly Criterion[];
  alpha: readonly number[];
};

export function closedFormMoments(input: ClosedFormInput): { mean: number; variance: number } {
  const { candidate, criteria, alpha } = input;
  const z = normalizedScoreVector(candidate, criteria);
  const muW = dirichletMean(alpha);
  const varW = dirichletVariance(alpha);

  // E[S] = sum_k mu_k * z_k
  let mean = 0;
  for (let k = 0; k < z.length; k++) mean += muW[k] * z[k];

  // Cov(w_k, w_l) = -alpha_k * alpha_l / (alpha0^2 * (alpha0 + 1)), k != l
  // Var(S) = sum_k z_k^2 * Var(w_k) + sum_{k!=l} z_k * z_l * Cov(w_k, w_l)
  const alpha0 = alpha.reduce((a, b) => a + b, 0);
  let variance = 0;
  for (let k = 0; k < z.length; k++) {
    variance += z[k] * z[k] * varW[k];
    for (let l = 0; l < z.length; l++) {
      if (k === l) continue;
      const cov = (-alpha[k] * alpha[l]) / (alpha0 * alpha0 * (alpha0 + 1));
      variance += z[k] * z[l] * cov;
    }
  }
  return { mean, variance };
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/mcda.test.ts 2>&1 | tail -10`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/mcda.ts tests/engine/mcda.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): Bayesian MCDA with closed-form moment check"
```

---

### Task 11: Synthetic candidate generator

**Files:**
- Create: `/root/repos/Selectron/src/engine/synthetic.ts`
- Create: `/root/repos/Selectron/tests/engine/synthetic.test.ts`

Generates random candidates that conform to a given criterion set. Used for the demo and for paper figures.

- [ ] **Step 1: Write failing test**

```bash
cat > /root/repos/Selectron/tests/engine/synthetic.test.ts <<'EOF'
import { describe, it, expect } from "vitest";
import { generateCandidate, generateCandidates } from "@/engine/synthetic";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

describe("generateCandidate", () => {
  it("produces scores within each criterion's scale", () => {
    const c = generateCandidate(PLACEHOLDER_CRITERIA, 1);
    for (const k of PLACEHOLDER_CRITERIA) {
      expect(c.scores[k.id]).toBeGreaterThanOrEqual(k.scale.min);
      expect(c.scores[k.id]).toBeLessThanOrEqual(k.scale.max);
    }
  });

  it("is deterministic given the same seed", () => {
    const a = generateCandidate(PLACEHOLDER_CRITERIA, 42);
    const b = generateCandidate(PLACEHOLDER_CRITERIA, 42);
    expect(a.scores).toEqual(b.scores);
  });
});

describe("generateCandidates", () => {
  it("produces N candidates with unique ids", () => {
    const xs = generateCandidates(PLACEHOLDER_CRITERIA, 10, 99);
    expect(xs.length).toBe(10);
    expect(new Set(xs.map((c) => c.id)).size).toBe(10);
  });
});
EOF
```

- [ ] **Step 2: Run test, verify it fails**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/synthetic.test.ts 2>&1 | tail -5`
Expected: FAIL.

- [ ] **Step 3: Write implementation**

```bash
cat > /root/repos/Selectron/src/engine/synthetic.ts <<'EOF'
import type { Candidate, Criterion } from "@/types";
import { makeRng } from "./prng";

const ALIASES = [
  "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot",
  "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima",
];

export function generateCandidate(
  criteria: readonly Criterion[],
  seed: number,
  id?: string,
): Candidate {
  const rng = makeRng(seed);
  const scores: Record<string, number> = {};
  for (const c of criteria) {
    const u = rng();
    scores[c.id] = c.scale.min + u * (c.scale.max - c.scale.min);
  }
  const finalId = id ?? `synthetic-${seed}`;
  return {
    id: finalId,
    alias: ALIASES[seed % ALIASES.length],
    scores,
  };
}

export function generateCandidates(
  criteria: readonly Criterion[],
  n: number,
  seed: number,
): Candidate[] {
  const out: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    out.push(generateCandidate(criteria, seed + i, `synthetic-${seed}-${i}`));
  }
  return out;
}
EOF
```

- [ ] **Step 4: Run test, verify it passes**

Run: `cd /root/repos/Selectron && npm test -- tests/engine/synthetic.test.ts 2>&1 | tail -5`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/synthetic.ts tests/engine/synthetic.test.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): seeded synthetic candidate generator"
```

---

### Task 12: Engine barrel + full-suite sanity run

**Files:**
- Create: `/root/repos/Selectron/src/engine/index.ts`

- [ ] **Step 1: Write barrel**

```bash
cat > /root/repos/Selectron/src/engine/index.ts <<'EOF'
export { SelectronError } from "./errors";
export type { SelectronErrorCode } from "./errors";
export { makeRng } from "./prng";
export { sampleGamma } from "./gamma";
export { sampleDirichlet, dirichletMean, dirichletVariance } from "./dirichlet";
export { normalizeScore } from "./normalize";
export { scoreCandidate, closedFormMoments } from "./mcda";
export type { ScoreInput, ClosedFormInput } from "./mcda";
export { generateCandidate, generateCandidates } from "./synthetic";
EOF
```

- [ ] **Step 2: Run the full vitest suite**

Run: `cd /root/repos/Selectron && npm test 2>&1 | tail -15`
Expected: all suites pass (errors, prng, gamma, dirichlet, normalize, placeholder-criteria, mcda, synthetic).

- [ ] **Step 3: Run typecheck**

Run: `cd /root/repos/Selectron && npm run typecheck`
Expected: still fails because `App.tsx` not yet present. Acceptable until Task 17.

- [ ] **Step 4: Commit**

```bash
cd /root/repos/Selectron && git add src/engine/index.ts && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(engine): public barrel; engine math complete for Iter 1"
```

---

## Part C — UI

### Task 13: ScoreCard component

**Files:**
- Create: `/root/repos/Selectron/src/ui/components/ScoreCard.tsx`

This is a pure presentational component (no state). Shows mean score, CI90, CI95 numerically. Visual emphasis on the CI width as a proxy for confidence.

- [ ] **Step 1: Implement**

```bash
mkdir -p /root/repos/Selectron/src/ui/components && cat > /root/repos/Selectron/src/ui/components/ScoreCard.tsx <<'EOF'
import type { Posterior } from "@/types";

type Props = {
  posterior: Posterior;
  alias: string;
};

const pct = (x: number) => (100 * x).toFixed(1) + "%";

export function ScoreCard({ posterior, alias }: Props) {
  const { mean, ci90, ci95, ess } = posterior;
  const ci90Width = ci90[1] - ci90[0];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Candidate {alias}</h3>
        <span className="text-xs text-slate-500">ESS {ess.toFixed(0)}</span>
      </div>
      <div className="text-4xl font-bold tabular-nums text-slate-900">{pct(mean)}</div>
      <dl className="mt-4 grid grid-cols-2 gap-y-1 text-sm text-slate-600">
        <dt>90% CI</dt>
        <dd className="tabular-nums text-right">
          {pct(ci90[0])} — {pct(ci90[1])}
        </dd>
        <dt>95% CI</dt>
        <dd className="tabular-nums text-right">
          {pct(ci95[0])} — {pct(ci95[1])}
        </dd>
        <dt>CI₉₀ width</dt>
        <dd className="tabular-nums text-right">{pct(ci90Width)}</dd>
      </dl>
    </div>
  );
}
EOF
```

- [ ] **Step 2: Commit**

```bash
cd /root/repos/Selectron && git add src/ui/components/ScoreCard.tsx && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(ui): ScoreCard — mean, CI90, CI95, ESS"
```

---

### Task 14: PosteriorPlot component (ECharts)

**Files:**
- Create: `/root/repos/Selectron/src/ui/components/PosteriorPlot.tsx`

Renders a histogram of the posterior samples with CI90 markers. Uses `echarts-for-react`.

- [ ] **Step 1: Implement**

```bash
cat > /root/repos/Selectron/src/ui/components/PosteriorPlot.tsx <<'EOF'
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { Posterior } from "@/types";

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TitleComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  CanvasRenderer,
]);

function histogram(samples: Float64Array, bins: number): { centers: number[]; counts: number[] } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < samples.length; i++) {
    if (samples[i] < min) min = samples[i];
    if (samples[i] > max) max = samples[i];
  }
  const width = (max - min) / bins;
  const counts = new Array<number>(bins).fill(0);
  for (let i = 0; i < samples.length; i++) {
    let idx = Math.floor((samples[i] - min) / width);
    if (idx === bins) idx = bins - 1;
    counts[idx]++;
  }
  const centers = Array.from({ length: bins }, (_, i) => min + (i + 0.5) * width);
  return { centers, counts };
}

type Props = { posterior: Posterior };

export function PosteriorPlot({ posterior }: Props) {
  const { centers, counts } = histogram(posterior.samples, 40);
  const option = {
    grid: { left: 48, right: 16, top: 24, bottom: 32 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: centers.map((c) => (100 * c).toFixed(1) + "%"),
      axisLabel: { interval: 6 },
    },
    yAxis: { type: "value", name: "count" },
    series: [
      {
        type: "bar",
        data: counts,
        itemStyle: { color: "#1e3a8a" },
        barCategoryGap: "5%",
        markArea: {
          itemStyle: { color: "rgba(30, 58, 138, 0.08)" },
          data: [
            [
              { xAxis: (100 * posterior.ci90[0]).toFixed(1) + "%" },
              { xAxis: (100 * posterior.ci90[1]).toFixed(1) + "%" },
            ],
          ],
        },
        markLine: {
          symbol: "none",
          lineStyle: { color: "#dc2626", width: 2 },
          data: [{ xAxis: (100 * posterior.mean).toFixed(1) + "%", name: "mean" }],
        },
      },
    ],
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-medium text-slate-700">Posterior over total score</h3>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: 320, width: "100%" }}
      />
    </div>
  );
}
EOF
```

- [ ] **Step 2: Commit**

```bash
cd /root/repos/Selectron && git add src/ui/components/PosteriorPlot.tsx && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(ui): PosteriorPlot histogram with CI90 shaded region"
```

---

### Task 15: CriterionInput component

**Files:**
- Create: `/root/repos/Selectron/src/ui/components/CriterionInput.tsx`

A controlled numeric slider + readout for one criterion.

- [ ] **Step 1: Implement**

```bash
cat > /root/repos/Selectron/src/ui/components/CriterionInput.tsx <<'EOF'
import type { Criterion } from "@/types";

type Props = {
  criterion: Criterion;
  value: number;
  onChange: (next: number) => void;
};

export function CriterionInput({ criterion, value, onChange }: Props) {
  const { scale, label, instrument, family } = criterion;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        <span className="text-xs uppercase tracking-wide text-slate-400">{family}</span>
      </div>
      <p className="mb-3 text-xs text-slate-500">{instrument}</p>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={scale.min}
          max={scale.max}
          step={(scale.max - scale.min) / 100}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-blue-900"
        />
        <span className="w-16 text-right tabular-nums text-sm text-slate-700">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
EOF
```

- [ ] **Step 2: Commit**

```bash
cd /root/repos/Selectron && git add src/ui/components/CriterionInput.tsx && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(ui): CriterionInput slider with instrument label"
```

---

### Task 16: App.tsx (wire everything together)

**Files:**
- Create: `/root/repos/Selectron/src/ui/App.tsx`

- [ ] **Step 1: Implement**

```bash
cat > /root/repos/Selectron/src/ui/App.tsx <<'EOF'
import { useMemo, useState } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { scoreCandidate, generateCandidate } from "@/engine";
import { CriterionInput } from "./components/CriterionInput";
import { ScoreCard } from "./components/ScoreCard";
import { PosteriorPlot } from "./components/PosteriorPlot";

export function App() {
  const seed = 42;
  const initialCandidate = useMemo(() => generateCandidate(PLACEHOLDER_CRITERIA, seed, "demo"), []);
  const [scores, setScores] = useState<Record<string, number>>(initialCandidate.scores);

  const candidate = useMemo(
    () => ({ ...initialCandidate, scores }),
    [initialCandidate, scores],
  );

  const posterior = useMemo(
    () =>
      scoreCandidate({
        candidate,
        criteria: PLACEHOLDER_CRITERIA,
        alpha: PLACEHOLDER_CRITERIA.map(() => 1),
        iterations: 5000,
        seed: 0xc0ffee,
      }),
    [candidate],
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Selectron <span className="text-base font-normal text-slate-500">— Iter 1</span>
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          5 placeholder criteria, Dirichlet weights (α = 1, uninformative), Bayesian MCDA.
          Replaced in Iter 2 by literature-driven criteria from Phase 0.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          {PLACEHOLDER_CRITERIA.map((c) => (
            <CriterionInput
              key={c.id}
              criterion={c}
              value={scores[c.id]}
              onChange={(v) => setScores((s) => ({ ...s, [c.id]: v }))}
            />
          ))}
        </section>
        <section className="space-y-6">
          <ScoreCard posterior={posterior} alias={candidate.alias} />
          <PosteriorPlot posterior={posterior} />
        </section>
      </div>
    </div>
  );
}
EOF
```

- [ ] **Step 2: Run typecheck**

Run: `cd /root/repos/Selectron && npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Smoke-build**

Run: `cd /root/repos/Selectron && npm run build 2>&1 | tail -10`
Expected: build succeeds; output in `dist/`.

- [ ] **Step 4: Run dev server (manual sanity check)**

Run: `cd /root/repos/Selectron && (npm run dev &) && sleep 4 && curl -s http://localhost:5173/ | head -5 && kill %1 2>/dev/null`
Expected: HTML containing `<div id="root">`.

- [ ] **Step 5: Commit**

```bash
cd /root/repos/Selectron && git add src/ui/App.tsx && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "feat(ui): App wiring sliders to MCDA scoring + posterior plot"
```

---

### Task 17: Iter 1 acceptance — full suite + manual UI check

**Files:** none (verification only)

- [ ] **Step 1: Full vitest suite**

Run: `cd /root/repos/Selectron && npm test 2>&1 | tail -10`
Expected: every test file passes. No `.skip`, no `.todo`.

- [ ] **Step 2: Typecheck**

Run: `cd /root/repos/Selectron && npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Production build**

Run: `cd /root/repos/Selectron && npm run build 2>&1 | tail -5`
Expected: bundle written to `dist/`.

- [ ] **Step 4: Manual sanity check (open in browser, document in commit message)**

Tell Diego: "Run `cd /root/repos/Selectron && npm run dev` and open http://localhost:5173. Move each slider; the posterior plot and ScoreCard should update within ~500 ms. CI₉₀ width should narrow as you push extreme values and widen near 50/50. Confirm before committing."

- [ ] **Step 5: Commit acceptance**

```bash
cd /root/repos/Selectron && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit --allow-empty -m "release(iter1): vertical slice green — full vitest suite passes, build clean, posterior plot interactive"
```

---

## Part D — Phase 0 research agent fan-out

### Task 18: Dispatch 6 parallel research subagents

**When to run:** As early as Task 6 — these agents run in the background while Tasks 6–17 proceed. Do not block on them.

**How to dispatch:** A single message containing 6 `Agent` tool calls (with `run_in_background: true`), one per agent below. Each agent's prompt is self-contained — copy it verbatim. All six write to `/root/repos/Selectron/research/`.

**Pre-flight check:**

- [ ] **Step 1: Confirm zotero-pdf-ocr is installed and credentials present**

Run: `ls /root/.claude/skills/zotero-pdf-ocr/.env && python3 /root/.claude/skills/zotero-pdf-ocr/scripts/zotero_search.py --query "analog astronaut" 2>&1 | head -3`
Expected: JSON array starts; at least one hit.

- [ ] **Step 2: Dispatch agents (one message, six Agent tool calls, all with `run_in_background: true`)**

Use these exact prompts. Each agent receives ONLY its own prompt — no shared context.

#### Agent A1 — Zotero inventory + synthesis

```
You are research agent A1 for the Selectron project (analog-astronaut selection, Bayesian MCDA scoring engine). Your single deliverable is a synthesis of Diego's Zotero library on analog-astronaut selection.

WORKING DIRECTORY: /root/repos/Selectron/research/

TOOL SURFACE:
- /root/.claude/skills/zotero-pdf-ocr/scripts/zotero_search.py (search Zotero via Web API)
- /root/.claude/skills/zotero-pdf-ocr/scripts/fetch_pdf.py (download PDF from WebDAV)
- ocr-pipeline skill IF $MISTRAL_API_KEY is exported; otherwise just stage the PDF
- Read tool on extracted markdown / PDF metadata

PROCESS:
1. Run zotero_search.py for each of these queries, deduplicating by item_key:
   - "astronaut selection"
   - "analog astronaut"
   - "analog mission"
   - "isolation confinement"
   - "Mars analog"
   - "spaceflight psychology"
   - "psychometric selection"
   - "spaceflight selection"
2. For every parent item returned that has a non-null attachment_key:
   - Call fetch_pdf.py to land the PDF in /root/repos/Selectron/research/sources/
   - If $MISTRAL_API_KEY is set, run the ocr-pipeline on it; otherwise skip OCR and note "PDF staged, OCR pending"
3. Build a synthesis at /root/repos/Selectron/research/zotero_inventory.md:
   - Header: total papers found, total OCR'd, total staged-only
   - One section per paper, ordered by year descending:
     ## <Author Lastname et al., Year> — <title>
     - **Citation**: <APA-style line with DOI if present>
     - **Zotero key**: <item_key>
     - **Source**: <relative path to staged PDF or OCR markdown>
     - **Key selection-relevant claims**: 3–7 bullet points, each citing the section/page if OCR is available
     - **Implications for Selectron**: 1–3 sentences on what criterion families this paper supports, what instruments it uses, and what effect sizes (if any) it reports

CONSTRAINTS:
- Read-only outside /root/repos/Selectron/research/.
- Cite every empirical claim — no paraphrase without a paper-level citation.
- Do not invent DOIs. If Zotero metadata lacks one, write "DOI: not in Zotero".
- If a paper is clearly off-topic on inspection (e.g. matched on "isolation" but actually about pandemic isolation), exclude it and note the exclusion at the end of the file.
- Word budget: zotero_inventory.md ≤ 6 000 words. If you would exceed, demote less-relevant papers to a "Related, not central" section with one-line annotations.

WHEN YOU FINISH: respond with the count of papers processed, the count OCR'd, and the absolute path to zotero_inventory.md.
```

#### Agent A2 — Existing frameworks comparison

```
You are research agent A2 for the Selectron project. Your single deliverable is a comparison of existing analog-astronaut and astronaut selection frameworks.

WORKING DIRECTORY: /root/repos/Selectron/research/

TOOL SURFACE:
- mcp__firecrawl-mcp__firecrawl_scrape (scrape a known URL)
- mcp__firecrawl-mcp__firecrawl_search (when a URL is not yet known)
- mcp__fetch__fetch (raw HTTP, e.g. for APIs that return JSON)
- mcp__tavily__tavily_search (general web fallback)

FRAMEWORKS TO COVER:
1. ASTRA / AAD (Apollonio, Kring, Berry, Sawyer 2026, AIAA paper 2026-3000). The abstract is at https://arc.aiaa.org/doi/10.2514/6.2026-3000 (paywalled body — use the abstract + author press for now). A full-text copy may exist at /root/repos/exports/2026-05-17_paper_vizel-parnas-2020-analog-astronaut-selection.md — note: that file is the Vizel-Parnas paper, not Apollonio. Apollonio's full text is paywalled.
2. ESA astronaut selection medical standards (current campaign and 2008/2022 cycles)
3. NASA astronaut selection (medical standards: NPR 1800.x; behavioral health and performance criteria)
4. JAXA selection (5th campaign 2008; published methodology in ASEM)
5. D-MARS (Vizel-Parnas et al. 2020, AMADEE-20 Israeli selection)
6. OEWF AMADEE program (Austrian Space Forum)
7. HI-SEAS (University of Hawaii Mars analog selection)
8. Mars Society MDRS (Mars Desert Research Station selection)
9. CSA (Canadian Space Agency astronaut selection)
10. Roscosmos cosmonaut selection (where English-language sources permit)

DELIVERABLE: /root/repos/Selectron/research/04_existing_frameworks.md

STRUCTURE:
- One section per framework with these sub-headings:
  ### <Framework>
  - **Source(s)**: URLs / DOIs you actually read
  - **Selection stages**: e.g. application → medical → psych → BBI → final panel
  - **Criterion families used**: medical, psych, physical, behavioral, professional, mission-specific
  - **Instruments named**: NEO-PI-R, MMPI-2-RF, 16PF, ECG-12, etc.
  - **Pass-rates at each stage** (if reported)
  - **Notable quirks**: chopsticks-and-rice tests, freezing 45-min run, etc.
- Final section: a 10-row comparison matrix (markdown table) — rows are frameworks, columns are criterion families, cells contain a short summary or ✗ if absent.

CONSTRAINTS:
- Cite every URL you actually read. Quote-verbatim any phrase used in the comparison matrix.
- If a source is paywalled, note "paywalled — abstract only" and use only the abstract.
- Word budget: ≤ 2 500 words plus the comparison matrix.

WHEN YOU FINISH: respond with the number of frameworks covered, the number with paywalled bodies, and the absolute path to 04_existing_frameworks.md.
```

#### Agent A3 — Psychological constructs

```
You are research agent A3 for the Selectron project. Your single deliverable is an evidence table of the psychological constructs used in (or proposed for) analog-astronaut and astronaut selection.

WORKING DIRECTORY: /root/repos/Selectron/research/evidence_tables/

TOOL SURFACE:
- mcp__claude_ai_PubMed__search_articles + get_full_text_article
- mcp__paper-search__search_semantic, search_openalex, search_pubmed
- mcp__claude_ai_Scite__search_literature
- /root/.claude/skills/ebsco-unal/ for PsycINFO + SPORTDiscus (Playwright). Use this only if the construct is not adequately covered by free MCPs (PsycINFO has the deepest psych coverage).
- Cross-check with the Zotero library (Agent A1's output) where it overlaps — DO NOT re-extract papers A1 will already handle; reference its inventory if it has already been written.

CONSTRUCTS TO COVER (minimum):
- Big Five (NEO-PI-R, NEO-FFI): all 5 domains
- 16PF
- MMPI-2-RF (with focus on personnel-screening scales)
- Emotional intelligence (MSCEIT, EQ-i)
- Stress tolerance / hardiness (Kobasa hardiness scale; Connor-Davidson Resilience)
- Sensation-seeking (Zuckerman SSS)
- Locus of control
- Cognitive ability (Wonderlic / Raven's APM in selection)

DELIVERABLE: /root/repos/Selectron/research/evidence_tables/psychological.md

STRUCTURE per construct:
### <Construct>
- **Instrument(s)**: name, edition, scale, reliability/validity summary
- **Selection-relevant predictive validity** (effect sizes preferred — Cohen's d, r, OR, AUC):
  - Cite each effect with a paper-level DOI
  - Outcome being predicted: mission success / behavioural-incident-free completion / panel rating / etc.
- **Use in real selection programs** (NASA / ESA / JAXA / analog): yes/no/cite
- **Recommended priors for the Bayesian MCDA weight**: one short sentence — high / medium / low — justified by predictive validity, not by tradition.

CONSTRAINTS:
- Effect sizes only from peer-reviewed primary sources or systematic reviews. No grey-literature effect sizes.
- If you cannot find an effect size for a construct, write "no peer-reviewed predictive-validity estimate found" — do not guess.
- Word budget: ≤ 3 000 words.

WHEN YOU FINISH: respond with the count of constructs with effect sizes vs. without, and the absolute path to psychological.md.
```

#### Agent A4 — Medical / physiological criteria

```
You are research agent A4 for the Selectron project. Your single deliverable is an evidence table of medical and physiological screening criteria used in astronaut and analog-astronaut selection.

WORKING DIRECTORY: /root/repos/Selectron/research/evidence_tables/

TOOL SURFACE:
- mcp__claude_ai_PubMed__search_articles + get_full_text_article
- mcp__paper-search__search_pubmed, search_openalex
- mcp__claude_ai_Scite__search_literature
- mcp__firecrawl-mcp__firecrawl_scrape (for ESA/NASA/JAXA standards pages)

DOMAINS TO COVER:
- Cardiovascular (ECG findings, exercise tolerance, hypertension thresholds)
- Respiratory (spirometry minima, asthma exclusion criteria)
- Neurological (history of seizure, migraine, head injury; cerebellar function)
- Ophthalmologic (visual acuity, colour vision, refractive surgery, intraocular pressure)
- ENT / vestibular (motion sickness susceptibility, audiometric thresholds)
- Musculoskeletal (height range, weight/BMI range, anthropometric fit to suits/seats)
- Dental (caries, periodontal disease)
- Renal / metabolic (renal function, diabetes exclusion, lipid criteria)
- Pharmacologic (medication exclusion lists)
- Reproductive / pregnancy considerations (where reported)
- Aerospace-specific fitness: VO₂max thresholds, +Gz tolerance proxies

DELIVERABLE: /root/repos/Selectron/research/evidence_tables/medical.md

STRUCTURE per domain:
### <Domain>
- **Authoritative source(s)**: NASA JSC standards, ESA medical board, JAXA medical criteria, ICAO Annex 1 where relevant
- **Specific thresholds used in real programs**: explicit numbers (e.g., "BP < 140/90 at rest")
- **Where standards diverge** between NASA / ESA / JAXA / FAA Class III analog: short paragraph
- **Defensibility for analog selection**: is this threshold supported by evidence, or is it heritage? cite the original source
- **Suggested Selectron criterion encoding**: 1–2 sentences on whether this domain becomes one criterion or several, and the natural scale (binary, ordinal, continuous)

CONSTRAINTS:
- Real numbers from real standards documents whenever possible. Cite the document.
- For analog (Mars analog, Antarctic, lunar analog) divergence from spaceflight standards, note explicitly.
- Word budget: ≤ 3 000 words.

WHEN YOU FINISH: respond with the count of domains covered, count with explicit thresholds vs. heritage-only, and the absolute path to medical.md.
```

#### Agent A5 — Behavioral / team performance

```
You are research agent A5 for the Selectron project. Your single deliverable is an evidence table on behavioural and team-performance constructs in astronaut and analog-astronaut selection.

WORKING DIRECTORY: /root/repos/Selectron/research/evidence_tables/

TOOL SURFACE:
- mcp__claude_ai_Scite__search_literature
- mcp__paper-search__search_semantic, search_openalex
- mcp__claude_ai_PubMed__search_articles
- mcp__firecrawl-mcp__firecrawl_scrape (NASA Behavioral Health and Performance directorate pages)

CONSTRUCTS / TOPICS:
- Behavioural-based interview (BBI) — structure, validity, inter-rater reliability
- NASA's Behavioral Health and Performance (BHP) competency framework
- ESA's "tea-room" assessment center
- Team adaptability / shared mental models / backup behaviour (Salas literature)
- Leadership in long-duration crews (Bass / transformational vs. transactional)
- Conflict-resolution style (Thomas-Kilmann)
- Communication competence (Chronemics in confined-crew comms)
- Cross-cultural competence (where international crews are concerned)
- Stress-coping styles (problem-focused vs emotion-focused — Lazarus & Folkman)

DELIVERABLE: /root/repos/Selectron/research/evidence_tables/behavioral.md

STRUCTURE per construct:
### <Construct>
- **Assessment method**: BBI / panel rating / situational judgement test / role-play
- **Inter-rater reliability**: report ICC or κ where available
- **Predictive validity**: r or d against mission-relevant outcomes; cite
- **Real-program adoption**: NASA / ESA / JAXA / analog programs that use it
- **Encoding suggestion for Selectron**: scale (1–5 ordinal vs continuous), aggregation (single rater vs. panel mean), priors

CONSTRAINTS:
- Distinguish "used in selection programs" from "validated for selection." Some constructs are used without published validation; flag those explicitly.
- Word budget: ≤ 3 000 words.

WHEN YOU FINISH: respond with the count of constructs covered, count with peer-reviewed predictive validity, and the absolute path to behavioral.md.
```

#### Agent A6 — Bayesian MCDA precedents

```
You are research agent A6 for the Selectron project. Your single deliverable is a methodological-precedents document — published applications of Bayesian multi-criteria decision analysis to personnel selection, talent assessment, candidate ranking, or similar.

WORKING DIRECTORY: /root/repos/Selectron/research/

TOOL SURFACE:
- mcp__claude_ai_Scite__search_literature
- mcp__paper-search__search_semantic, search_openalex
- mcp__paper-search__search_arxiv (Bayesian MCDA / probabilistic decision analysis)
- mcp__claude_ai_Context7 — only if you need library-level documentation for a method (Stan, PyMC, edstan, etc.)

TOPICS:
- Bayesian MCDA in personnel selection (any domain)
- Bayesian AHP, Bayesian TOPSIS, Bayesian PROMETHEE
- Dirichlet-prior weight elicitation in MCDA
- Sensitivity analysis in Bayesian MCDA (Sobol indices, OAT, posterior-predictive checks on rank order)
- Posterior probability of rank — what's been published on credible intervals on candidate position
- Comparable aerospace HR / pilot-selection Bayesian work
- Critiques of classical MCDA from a Bayesian perspective

DELIVERABLE: /root/repos/Selectron/research/methodology_precedents.md

STRUCTURE:
- ## Bayesian MCDA — methodological landscape (1–2 paragraphs orienting the reader)
- ## Closest precedents (ranked by similarity to Selectron's design)
  For each: citation, method, domain, data scale, what they did differently
- ## What is novel about Selectron
  - 3–6 bullets explicitly grounded in the precedents
- ## Open methodological risks
  - things the precedents struggled with that Selectron will also face

CONSTRAINTS:
- Prefer peer-reviewed sources; arxiv preprints OK if they have ≥ 20 citations or are clearly methodologically central.
- Word budget: ≤ 2 500 words.

WHEN YOU FINISH: respond with the count of precedents found, the count graded "high similarity to Selectron," and the absolute path to methodology_precedents.md.
```

- [ ] **Step 3: Monitor for completion (do not poll)**

Each agent dispatched with `run_in_background: true` will notify when it completes. Do not poll, sleep, or check manually. Continue with Tasks 6–17 in the main thread.

- [ ] **Step 4: When all six notifications have arrived, sanity-check outputs**

```bash
ls -la /root/repos/Selectron/research/
ls -la /root/repos/Selectron/research/evidence_tables/
ls /root/repos/Selectron/research/sources/ | wc -l
```

Expected: at least these files exist:
- `research/zotero_inventory.md`
- `research/04_existing_frameworks.md`
- `research/evidence_tables/psychological.md`
- `research/evidence_tables/medical.md`
- `research/evidence_tables/behavioral.md`
- `research/methodology_precedents.md`
- At least 5 files under `research/sources/`

- [ ] **Step 5: Commit research outputs**

```bash
cd /root/repos/Selectron && git add research/ && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit -m "research(phase-0): 6-agent literature fan-out — Zotero inventory, frameworks, psych/med/behav evidence tables, MCDA precedents"
```

---

## Part E — Synthesis gate (Diego ratifies)

### Task 19: Produce criterion taxonomy proposal + Diego ratifies

**Files:**
- Create: `/root/repos/Selectron/research/02_criterion_taxonomy.md` (proposal, written by main thread agent)
- Create: `/root/repos/Selectron/docs/criteria.md` (ratified — written by Diego after review)

The proposal pulls together everything from Phase 0 into one criterion taxonomy. Diego reviews and ratifies. Ratification is **the hard gate** for Iter 2 — Iter 1 has already shipped by the time we get here.

- [ ] **Step 1: Synthesize a taxonomy proposal from the six research outputs**

This is a main-thread task (not a subagent). Read all six Phase 0 deliverables and produce a unified proposal at `research/02_criterion_taxonomy.md`:

- Header: methodology note (criteria are retained only if at least one peer-reviewed effect size or an explicit real-program standards-document threshold supports them).
- For each criterion family that survives:
  - **Family name** (e.g., "psychological")
  - **Criteria within the family**, each with: label, instrument, scale, higher-is-better, citations, **proposed prior weight class** (high/medium/low — translates to a Dirichlet α value)
- Final section: a 5–25-row table with one row per criterion, mirroring the `Criterion` TS type so Iter 2 can mechanically translate the table into `src/data/criteria.json`.

- [ ] **Step 2: Hand off to Diego for ratification**

Tell Diego: "Phase 0 complete. Read `research/02_criterion_taxonomy.md`. When you're satisfied, copy the ratified version to `docs/criteria.md` (or edit there directly) and commit it. That commit is the **start gate** for Iter 2."

- [ ] **Step 3: After Diego commits docs/criteria.md, close the iteration**

```bash
cd /root/repos/Selectron && git -c user.email="dlmalpica@yahoo.com" -c user.name="Diego L. Malpica" commit --allow-empty -m "release(iter1-phase0): vertical slice + literature foundation complete; Iter 2 unblocked"
```

---

## Self-review (writing-plans checklist applied to this document)

**Spec coverage:**
- §1 (what Selectron is) — covered by Tasks 1, 2, 16 (UI shows the framing).
- §2 (why Bayesian MCDA) — covered by Tasks 7, 10 (the math); paper writeup deferred to Iter 4.
- §3 (architectural decisions) — all four choices enforced in the code (Task 1 = pure TS Vite, Tasks 6–11 = pure-TS engine, no Python).
- §4 Iter 1 (vertical slice) — fully covered by Tasks 1–17.
- §5 (Phase 0 fan-out) — fully covered by Task 18.
- §6 (data model) — covered by Tasks 3 (types), 8 (placeholder criteria), 10 (MCDA math).
- §7 (testing posture) — covered by Tasks 4–12 (math-first TDD) and Task 4 (structured error).
- §8 (out of scope) — enforced by absence (no auth, no Python, no mobile-specific code).
- §9 (open decisions) — UI library is Tailwind only (Radix deferred); the rest are deferred as the spec allows.
- §10 (writing-plans is the next step) — this document.

**Placeholder scan:** No "TBD" / "TODO" / "fill in details" / "similar to Task N" in this plan. Every code step contains executable code; every command shows expected output.

**Type consistency:** `Criterion`, `Candidate`, `Posterior` are defined in Task 3 and used consistently in Tasks 8, 10, 11, 13–16. `SelectronError` defined in Task 4, used in 9 and 10. `scoreCandidate(input)` signature is the same in Tasks 10 and 16.

No issues found.
