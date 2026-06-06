# Bayesian Conflict / Team Modeling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Bayesian conflict/team layer to the `src/risk/` analog engine: crew-level dyadic conflict (de-EVA), NHPP latent-class temporal dynamics, shared-frailty/Negative-Binomial coupling, β-uncertainty propagation, and a literature-anchored validation harness — with medical conditions provably unperturbed.

**Architecture:** Three-phase, substream-isolated trial. Phase 0 draws a shared per-trial latent state (crew strain `G`, member strain `hᵢ`, latent class `c`, β shift); Phase 1a runs medical conditions on a dedicated RNG substream (unchanged); Phase 1b runs psychiatric/performance conditions with frailty+NHPP+NB; Phase 2 runs crew-level team conditions. Three identifiable parameters are PyMC-fit; the rest are literature-anchored synthetic defaults.

**Tech Stack:** TypeScript (Vitest), seeded Mulberry32 PRNG (`@/engine/prng`), `sampleGamma` from `@/engine/gamma`, Python PyMC (NUTS) for the offline fit.

**Spec:** `docs/superpowers/specs/2026-06-06-selectron-conflict-team-bayesian-design.md`

**Conventions:** Commits use `feat:`/`test:`/`docs:`, **no AI co-author line** (Diego is sole author, per CLAUDE.md). Canonical seed `0xc0ffee`. Run a single file with `npx vitest run <path>`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/risk/incidence.ts` (modify) | Add `sampleStandardNormal`, `sampleFrailty`, `sampleGammaPoisson` |
| `src/risk/temporal.ts` (create) | NHPP integrated-intensity + `firstEventFraction` bisection |
| `src/risk/condition-behavior.ts` (create) | Map `Condition` → `{scope, temporal, dispersion, frailtyCoupled}` |
| `src/risk/crew-state.ts` (create) | Phase-0 `drawTrialLatentState` + `TrialLatentState` type |
| `src/risk/crew-conditions.ts` (create) | Phase-2 crew-level team hazard + attribution |
| `src/risk/priorsSchema.ts` (modify) | Add optional `team` hyper-prior block + validation |
| `src/types/risk.ts` (modify) | Optional behavior-override fields on `Condition` |
| `src/risk/conditions.ts` (modify) | Reclassify team conditions (de-EVA) |
| `src/risk/simulate.ts` (modify) | Three-pass `runMissionTrial`; thread latent state; diagnostics |
| `src/data/synthetic-iter3.ts` (modify) | Build `team` block; merge PyMC JSON + synthetic defaults |
| `src/data/conflict-team-priors.json` (create) | PyMC posterior samples |
| `python/selectron/conflict_fit.py` (create) | PyMC NUTS fitter emitting the JSON |
| `tests/risk/*` (create/modify) | Unit tests per module + `conflict_ppc.test.ts` |

---

## Phase 1 — Sampling primitives & temporal intensity

### Task 1: Add `sampleStandardNormal`, `sampleFrailty`, `sampleGammaPoisson` to risk incidence

**Files:**
- Modify: `src/risk/incidence.ts`
- Test: `tests/risk/incidence.test.ts`

- [ ] **Step 1: Write the failing tests** (append to `tests/risk/incidence.test.ts`)

```ts
import { sampleStandardNormal, sampleFrailty, sampleGammaPoisson } from "@/risk/incidence";
import { makeRng } from "@/engine/prng";

describe("sampleStandardNormal", () => {
  it("has mean ~0 and sd ~1 over many draws", () => {
    const rng = makeRng(0xc0ffee);
    const n = 200_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const z = sampleStandardNormal(rng); sum += z; sumsq += z * z; }
    const mean = sum / n;
    const sd = Math.sqrt(sumsq / n - mean * mean);
    expect(Math.abs(mean)).toBeLessThan(0.02);
    expect(Math.abs(sd - 1)).toBeLessThan(0.02);
  });
});

describe("sampleFrailty (mean 1, var 1/phi)", () => {
  it("has mean ~1 and variance ~1/phi", () => {
    const rng = makeRng(0xc0ffee);
    const phi = 4, n = 200_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const g = sampleFrailty(rng, phi); sum += g; sumsq += g * g; }
    const mean = sum / n;
    const variance = sumsq / n - mean * mean;
    expect(Math.abs(mean - 1)).toBeLessThan(0.02);
    expect(Math.abs(variance - 1 / phi)).toBeLessThan(0.02);
  });
  it("throws on non-positive phi", () => {
    const rng = makeRng(1);
    expect(() => sampleFrailty(rng, 0)).toThrow();
  });
});

describe("sampleGammaPoisson (Negative-Binomial marginal)", () => {
  it("matches shared-frailty Poisson: mean ~lambda, var ~lambda + lambda^2/phi", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 3, phi = 2, n = 300_000;
    let sum = 0, sumsq = 0;
    for (let i = 0; i < n; i++) { const k = sampleGammaPoisson(rng, lambda, phi); sum += k; sumsq += k * k; }
    const mean = sum / n;
    const variance = sumsq / n - mean * mean;
    expect(Math.abs(mean - lambda)).toBeLessThan(0.05);
    expect(Math.abs(variance - (lambda + (lambda * lambda) / phi))).toBeLessThan(0.2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/incidence.test.ts`
Expected: FAIL — `sampleStandardNormal`/`sampleFrailty`/`sampleGammaPoisson` not exported.

- [ ] **Step 3: Implement** (append to `src/risk/incidence.ts`; add the import at the top)

```ts
import { sampleGamma } from "@/engine/gamma";

/** Standard normal via Box–Muller. Deterministic given a seeded rng. */
export function sampleStandardNormal(rng: Rng): number {
  const u1 = Math.max(rng(), 1e-12);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Frailty multiplier ~ Gamma(shape=phi, scale=1/phi): mean 1, variance 1/phi.
 * phi → ∞ collapses to 1 (no overdispersion). Used for shared crew strain G
 * and per-member strain h_i.
 */
export function sampleFrailty(rng: Rng, phi: number): number {
  if (!Number.isFinite(phi) || phi <= 0) {
    throw new SelectronError("E_BAD_PRIOR", `frailty phi must be a finite positive number, got ${phi}`, { phi });
  }
  return sampleGamma(phi, rng) / phi;
}

/**
 * Negative-Binomial count via Gamma-Poisson: Poisson(mean · G), G ~ Gamma(phi,1/phi).
 * Marginal mean = mean, variance = mean + mean^2/phi. Convenience for uncoupled
 * overdispersed counts and for testing the NB ⟺ shared-frailty equivalence.
 */
export function sampleGammaPoisson(rng: Rng, mean: number, phi: number): number {
  if (!Number.isFinite(mean) || mean < 0) {
    throw new SelectronError("E_BAD_PRIOR", `NB mean must be finite non-negative, got ${mean}`, { mean });
  }
  return samplePoisson(rng, mean * sampleFrailty(rng, phi));
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/incidence.test.ts`
Expected: PASS (all describe blocks green).

- [ ] **Step 5: Commit**

```bash
git add src/risk/incidence.ts tests/risk/incidence.test.ts
git commit -m "feat(risk): add normal/frailty/gamma-poisson samplers for conflict layer"
```

---

### Task 2: Temporal NHPP module (`temporal.ts`)

**Files:**
- Create: `src/risk/temporal.ts`
- Test: `tests/risk/temporal.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/risk/temporal.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { integratedIntensity, firstEventFraction } from "@/risk/temporal";
import { makeRng } from "@/engine/prng";

describe("integratedIntensity", () => {
  it("stable class integrates to 1", () => {
    expect(integratedIntensity(0, 2, 2)).toBeCloseTo(1, 12);
  });
  it("unstable class integrates to 1 + a/(p+1)", () => {
    // a=2, p=2 → 1 + 2/3
    expect(integratedIntensity(1, 2, 2)).toBeCloseTo(1 + 2 / 3, 12);
  });
});

describe("firstEventFraction", () => {
  it("right-censors to 1.0 when expected count is ~0", () => {
    const rng = makeRng(7);
    expect(firstEventFraction(rng, 1e-9, 0, 2, 2)).toBe(1);
  });
  it("stable class: empirical P(event by 0.4) ≈ 1 - exp(-0.4*mean)", () => {
    const rng = makeRng(0xc0ffee);
    const mean = 3, n = 100_000;
    let byPoint4 = 0;
    for (let i = 0; i < n; i++) if (firstEventFraction(rng, mean, 0, 2, 2) <= 0.4) byPoint4++;
    const p = byPoint4 / n;
    expect(Math.abs(p - (1 - Math.exp(-0.4 * mean)))).toBeLessThan(0.01);
  });
  it("unstable class front-loads LESS than stable (back-loaded ramp)", () => {
    const rng = makeRng(0xc0ffee);
    const mean = 3, n = 100_000;
    const pBy = (cls: 0 | 1) => {
      const r = makeRng(0xc0ffee);
      let c = 0;
      for (let i = 0; i < n; i++) if (firstEventFraction(r, mean, cls, 2, 2) <= 0.4) c++;
      return c / n;
    };
    expect(pBy(1)).toBeLessThan(pBy(0)); // unstable later onset for same total mean
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/temporal.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** (`src/risk/temporal.ts`)

```ts
type Rng = () => number;

/** Latent class: 0 = stable (flat), 1 = unstable (back-loaded rising). */
export type LatentClass = 0 | 1;

/** g_c(u): stable = 1; unstable = 1 + a·u^p. */
function intensityShape(u: number, cls: LatentClass, a: number, p: number): number {
  return cls === 0 ? 1 : 1 + a * Math.pow(u, p);
}

/** M_c(u) = ∫₀ᵘ g_c. stable = u; unstable = u + a·u^(p+1)/(p+1). */
function cumulativeShape(u: number, cls: LatentClass, a: number, p: number): number {
  return cls === 0 ? u : u + (a * Math.pow(u, p + 1)) / (p + 1);
}

/** ∫₀¹ g_c du — the duration-independent average intensity factor. */
export function integratedIntensity(cls: LatentClass, a: number, p: number): number {
  return cumulativeShape(1, cls, a, p);
}

/**
 * Mission-fraction of the first event for an NHPP whose total expected count is
 * `totalMean`. Draws E~Exp(1); solves Λ(u*)=E where Λ(u)=totalMean·M_c(u)/M_c(1).
 * Returns 1.0 (right-censored) when no event occurs within the mission.
 */
export function firstEventFraction(
  rng: Rng,
  totalMean: number,
  cls: LatentClass,
  a: number,
  p: number,
): number {
  if (!(totalMean > 0)) return 1;
  const E = -Math.log(Math.max(rng(), 1e-12)); // Exp(1)
  const M1 = cumulativeShape(1, cls, a, p);
  const target = (E / totalMean) * M1; // want M_c(u*) = target
  if (target >= M1) return 1; // beyond mission end → censored
  // bisection on u ∈ [0,1] for M_c(u) = target (M_c monotone increasing)
  let lo = 0, hi = 1;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    if (cumulativeShape(mid, cls, a, p) < target) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/temporal.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/risk/temporal.ts tests/risk/temporal.test.ts
git commit -m "feat(risk): NHPP integrated-intensity + first-event-fraction (latent-class temporal)"
```

---

## Phase 2 — Condition behavior & latent state

### Task 3: Condition-behavior classifier

**Files:**
- Modify: `src/types/risk.ts` (optional override fields)
- Create: `src/risk/condition-behavior.ts`
- Test: `tests/risk/condition_behavior.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/risk/condition_behavior.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { conditionBehavior } from "@/risk/condition-behavior";
import type { Condition } from "@/types";

const mk = (family: Condition["family"]): Condition => ({
  id: "x", label: "x", family, kind: "rate", vulnerabilityCriteria: [], citations: [],
});

describe("conditionBehavior", () => {
  it("team → crew scope, latent temporal, negbin, frailty-coupled", () => {
    expect(conditionBehavior(mk("team"))).toEqual({
      scope: "crew", temporal: "latent", dispersion: "negbin", frailtyCoupled: true,
    });
  });
  it("psychiatric/performance → member, latent, negbin, frailty-coupled", () => {
    for (const f of ["psychiatric", "performance"] as const) {
      expect(conditionBehavior(mk(f))).toEqual({
        scope: "member", temporal: "latent", dispersion: "negbin", frailtyCoupled: true,
      });
    }
  });
  it("physiologic/musculoskeletal → member, stationary, poisson, uncoupled (unchanged)", () => {
    for (const f of ["physiologic", "musculoskeletal"] as const) {
      expect(conditionBehavior(mk(f))).toEqual({
        scope: "member", temporal: "stationary", dispersion: "poisson", frailtyCoupled: false,
      });
    }
  });
  it("respects explicit overrides on the Condition", () => {
    const c = { ...mk("physiologic"), frailtyCoupled: true };
    expect(conditionBehavior(c).frailtyCoupled).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/condition_behavior.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3a: Add optional override fields** to `src/types/risk.ts` `Condition` type (insert before the closing `}` of the `Condition` type, after `citations`)

```ts
  // Optional behavior overrides for the conflict/team Bayesian layer.
  // When omitted, behavior is derived from `family` (see condition-behavior.ts).
  scope?: "member" | "crew";
  temporal?: "stationary" | "latent";
  dispersion?: "poisson" | "negbin";
  frailtyCoupled?: boolean;
```

- [ ] **Step 3b: Implement** (`src/risk/condition-behavior.ts`)

```ts
import type { Condition } from "@/types";

export type ConditionBehavior = {
  scope: "member" | "crew";
  temporal: "stationary" | "latent";
  dispersion: "poisson" | "negbin";
  frailtyCoupled: boolean;
};

/**
 * Family-derived defaults, overridable per Condition.
 *  - team                      → crew-level, latent temporal, NB, frailty-coupled
 *  - psychiatric / performance → per-member, latent temporal, NB, frailty-coupled
 *  - physiologic / musculoskeletal → per-member, stationary, Poisson, uncoupled (unchanged)
 */
export function conditionBehavior(c: Condition): ConditionBehavior {
  const isTeam = c.family === "team";
  const isBehavioral = c.family === "psychiatric" || c.family === "performance";
  const base: ConditionBehavior = isTeam
    ? { scope: "crew", temporal: "latent", dispersion: "negbin", frailtyCoupled: true }
    : isBehavioral
      ? { scope: "member", temporal: "latent", dispersion: "negbin", frailtyCoupled: true }
      : { scope: "member", temporal: "stationary", dispersion: "poisson", frailtyCoupled: false };
  return {
    scope: c.scope ?? base.scope,
    temporal: c.temporal ?? base.temporal,
    dispersion: c.dispersion ?? base.dispersion,
    frailtyCoupled: c.frailtyCoupled ?? base.frailtyCoupled,
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/condition_behavior.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/types/risk.ts src/risk/condition-behavior.ts tests/risk/condition_behavior.test.ts
git commit -m "feat(risk): condition-behavior classifier (family defaults + overrides)"
```

---

### Task 4: Team hyper-prior schema block

**Files:**
- Modify: `src/risk/priorsSchema.ts`
- Test: `tests/risk/team_priors_schema.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/risk/team_priors_schema.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { validatePriorsJson, type PriorsJson } from "@/risk/priorsSchema";

const base = (): PriorsJson => ({
  model_version: "t", fitted_at: "t",
  conditions: {
    a: { missions: { antarctic: { log_lambda_samples: [-7], mean_log_lambda: -7, sd_log_lambda: 0.1 } },
      vulnerability_beta: {}, worst_case_prob_q: 0.25, treated_lost_days_mean: 1, untreated_lost_days_mean: 4 },
  },
});

const team = () => ({
  crew_frailty_phi_samples: [2, 3], member_frailty_phi: 4,
  pi_unstable_base: 0.658, alpha_fit: -0.5, sigma_log_beta: 0.3,
  temporal_a: 2, temporal_p: 2, beta_het: 0.3, beta_weak: 0.4, dyad_ref_n: 6,
  lambda_base_samples: { "conflict-event": [0.01, 0.012] },
});

describe("validatePriorsJson team block", () => {
  it("accepts a valid optional team block", () => {
    expect(() => validatePriorsJson({ ...base(), team: team() })).not.toThrow();
  });
  it("accepts priors with NO team block (backward compatible)", () => {
    expect(() => validatePriorsJson(base())).not.toThrow();
  });
  it("rejects pi_unstable_base outside [0,1]", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), pi_unstable_base: 1.5 } })).toThrow();
  });
  it("rejects empty crew_frailty_phi_samples", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), crew_frailty_phi_samples: [] } })).toThrow();
  });
  it("rejects non-positive member_frailty_phi", () => {
    expect(() => validatePriorsJson({ ...base(), team: { ...team(), member_frailty_phi: 0 } })).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/team_priors_schema.test.ts`
Expected: FAIL — `team` accepted as `any`, the rejection cases don't throw.

- [ ] **Step 3a: Add the type** to `src/risk/priorsSchema.ts` (after `ConditionPrior`)

```ts
export type TeamHyperPriors = {
  crew_frailty_phi_samples: number[]; // shared crew strain G ~ Gamma(phi,1/phi)
  member_frailty_phi: number;         // per-member strain h_i shape
  pi_unstable_base: number;           // base P(unstable) at mean fit (Tu 2024 ≈ 0.658)
  pi_unstable_samples?: number[];     // optional PyMC posterior for the base rate
  alpha_fit: number;                  // fit → instability slope (≤ 0)
  sigma_log_beta: number;             // β lognormal width (≥ 0)
  temporal_a: number;                 // unstable ramp amplitude
  temporal_p: number;                 // unstable ramp exponent (> 1 back-loads)
  beta_het: number;                   // heterogeneity coefficient (≥ 0)
  beta_weak: number;                  // weakest-link coefficient (≥ 0)
  dyad_ref_n: number;                 // reference crew size (D(6)=15)
  lambda_base_samples: Record<string, number[]>; // per team-condition base rate posterior
};
```

- [ ] **Step 3b: Add `team` to `PriorsJson`** (add `team?: TeamHyperPriors;` field after `conditions: ...`)

- [ ] **Step 3c: Validate in `validatePriorsJson`** (insert before the final closing brace of the function, after the conditions loop)

```ts
  if (x.team !== undefined) {
    if (!isObject(x.team)) bail("priors.json 'team' must be an object");
    const t = x.team;
    if (!Array.isArray(t.crew_frailty_phi_samples) || t.crew_frailty_phi_samples.length === 0) {
      bail("team.crew_frailty_phi_samples must be a non-empty array");
    }
    for (const s of t.crew_frailty_phi_samples) checkNonNeg(s, "team.crew_frailty_phi_samples[]");
    checkNonNeg(t.member_frailty_phi, "team.member_frailty_phi");
    if ((t.member_frailty_phi as number) <= 0) bail("team.member_frailty_phi must be > 0");
    checkProb(t.pi_unstable_base, "team.pi_unstable_base");
    if (t.pi_unstable_samples !== undefined) {
      if (!Array.isArray(t.pi_unstable_samples) || t.pi_unstable_samples.length === 0) bail("team.pi_unstable_samples must be a non-empty array when present");
      for (const s of t.pi_unstable_samples) checkProb(s, "team.pi_unstable_samples[]");
    }
    checkNum(t.alpha_fit, "team.alpha_fit");
    checkNonNeg(t.sigma_log_beta, "team.sigma_log_beta");
    checkNonNeg(t.temporal_a, "team.temporal_a");
    checkNonNeg(t.temporal_p, "team.temporal_p");
    checkNonNeg(t.beta_het, "team.beta_het");
    checkNonNeg(t.beta_weak, "team.beta_weak");
    checkNonNeg(t.dyad_ref_n, "team.dyad_ref_n");
    if ((t.dyad_ref_n as number) < 2) bail("team.dyad_ref_n must be ≥ 2");
    if (!isObject(t.lambda_base_samples)) bail("team.lambda_base_samples must be an object");
    for (const [k, arr] of Object.entries(t.lambda_base_samples)) {
      if (!Array.isArray(arr) || arr.length === 0) bail(`team.lambda_base_samples["${k}"] must be a non-empty array`);
      for (const s of arr) checkNonNeg(s, `team.lambda_base_samples["${k}"][]`);
    }
  }
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/team_priors_schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/risk/priorsSchema.ts tests/risk/team_priors_schema.test.ts
git commit -m "feat(risk): optional team hyper-prior block in priors schema"
```

---

### Task 5: Phase-0 latent state (`crew-state.ts`)

**Files:**
- Create: `src/risk/crew-state.ts`
- Test: `tests/risk/crew_state.test.ts`

Reuse the existing z-scoring helper. NOTE: `vulnerabilityVector` in `src/risk/simulate.ts:84` is currently module-private. **Step 3a exports it** so `crew-state.ts` and `crew-conditions.ts` can reuse the exact sign convention.

- [ ] **Step 1: Write the failing test** (`tests/risk/crew_state.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { drawTrialLatentState, type TeamHyper } from "@/risk/crew-state";
import { makeRng } from "@/engine/prng";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type { Candidate, Criterion } from "@/types";

const idx = new Map<string, Criterion>(PLACEHOLDER_CRITERIA.map((c) => [c.id, c]));
const hyper: TeamHyper = {
  crewFrailtyPhi: 4, memberFrailtyPhi: 4, piUnstableBase: 0.658, alphaFit: -0.5,
  sigmaLogBeta: 0.3, fitCriterionId: "behavioral.teamwork",
};
const crewOf = (teamwork: number, n: number): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": teamwork } }));

describe("drawTrialLatentState", () => {
  it("memberFrailty has length = crew size, all positive", () => {
    const s = drawTrialLatentState(crewOf(6, 4), idx, hyper, makeRng(0xc0ffee));
    expect(s.memberFrailty).toHaveLength(4);
    for (const f of s.memberFrailty) expect(f).toBeGreaterThan(0);
    expect(s.crewFrailty).toBeGreaterThan(0);
  });
  it("better-fit crews are unstable LESS often (alphaFit < 0)", () => {
    const frac = (teamwork: number) => {
      const rng = makeRng(0xc0ffee);
      let u = 0; const n = 20_000;
      for (let i = 0; i < n; i++) if (drawTrialLatentState(crewOf(teamwork, 4), idx, hyper, rng).latentClass === 1) u++;
      return u / n;
    };
    expect(frac(9)).toBeLessThan(frac(3)); // high teamwork → less instability
  });
  it("betaLogShift is finite and centered near 0 across draws", () => {
    const rng = makeRng(0xc0ffee);
    let sum = 0; const n = 50_000;
    for (let i = 0; i < n; i++) sum += drawTrialLatentState(crewOf(6, 4), idx, hyper, rng).betaLogShift;
    expect(Math.abs(sum / n)).toBeLessThan(0.02);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/crew_state.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3a: Export `vulnerabilityVector`** — in `src/risk/simulate.ts` change `function vulnerabilityVector(` to `export function vulnerabilityVector(`.

- [ ] **Step 3b: Implement** (`src/risk/crew-state.ts`)

```ts
import type { Candidate, Criterion } from "@/types";
import { zScoreAgainstScale } from "@/engine/normalize-cohort";
import { sampleFrailty, sampleStandardNormal } from "./incidence";

type Rng = () => number;

export type TeamHyper = {
  crewFrailtyPhi: number;
  memberFrailtyPhi: number;
  piUnstableBase: number;
  alphaFit: number;
  sigmaLogBeta: number;
  fitCriterionId: string; // proxy for person-group fit (Iter-1: behavioral.teamwork)
};

export type TrialLatentState = {
  latentClass: 0 | 1;
  memberFrailty: number[];
  crewFrailty: number;
  betaLogShift: number; // β_trial = β · exp(betaLogShift)
};

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Mean z of the fit-proxy criterion across the crew (0 if unavailable). */
function meanFitZ(crew: readonly Candidate[], idx: ReadonlyMap<string, Criterion>, fitId: string): number {
  const c = idx.get(fitId);
  if (!c) return 0;
  let sum = 0, k = 0;
  for (const m of crew) {
    const raw = m.scores[fitId];
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const z = zScoreAgainstScale(raw, c.scale);
    sum += c.higherIsBetter ? z : -z;
    k++;
  }
  return k === 0 ? 0 : sum / k;
}

/** Phase 0: draw the shared per-trial latent state from a dedicated substream. */
export function drawTrialLatentState(
  crew: readonly Candidate[],
  idx: ReadonlyMap<string, Criterion>,
  hyper: TeamHyper,
  rng: Rng,
): TrialLatentState {
  const fitZ = meanFitZ(crew, idx, hyper.fitCriterionId);
  const alpha0 = Math.log(hyper.piUnstableBase / (1 - hyper.piUnstableBase));
  const piUnstable = logistic(alpha0 + hyper.alphaFit * fitZ);
  const latentClass: 0 | 1 = rng() < piUnstable ? 1 : 0;
  const memberFrailty = crew.map(() => sampleFrailty(rng, hyper.memberFrailtyPhi));
  const crewFrailty = sampleFrailty(rng, hyper.crewFrailtyPhi);
  const betaLogShift = hyper.sigmaLogBeta * sampleStandardNormal(rng);
  return { latentClass, memberFrailty, crewFrailty, betaLogShift };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/crew_state.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/risk/crew-state.ts src/risk/simulate.ts tests/risk/crew_state.test.ts
git commit -m "feat(risk): Phase-0 trial latent state (class, frailties, beta shift)"
```

---

## Phase 3 — Crew-level team conditions

### Task 6: Crew-condition hazard + attribution (`crew-conditions.ts`)

**Files:**
- Create: `src/risk/crew-conditions.ts`
- Test: `tests/risk/crew_conditions.test.ts`

- [ ] **Step 1: Write the failing test** (`tests/risk/crew_conditions.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { dyadFactor, heterogeneityFactor, weakestLinkFactor, attributeEvents } from "@/risk/crew-conditions";
import { makeRng } from "@/engine/prng";

describe("dyadFactor (relative to reference n)", () => {
  it("n=6 → 1, n=4 → 0.4, n=3 → 0.2, n=1 → 0", () => {
    expect(dyadFactor(6, 6)).toBeCloseTo(1, 12);
    expect(dyadFactor(4, 6)).toBeCloseTo(0.4, 12);
    expect(dyadFactor(3, 6)).toBeCloseTo(0.2, 12);
    expect(dyadFactor(1, 6)).toBe(0);
  });
});

describe("composition factors", () => {
  it("heterogeneity rises with spread of proneness", () => {
    expect(heterogeneityFactor([0, 0, 0, 0], 0.3)).toBeCloseTo(1, 12);
    expect(heterogeneityFactor([-1, -1, 1, 1], 0.3)).toBeGreaterThan(1);
  });
  it("weakest-link rises with the worst member", () => {
    expect(weakestLinkFactor([-1, -1, 2], 0.4)).toBeCloseTo(Math.exp(0.4 * 2), 12);
  });
});

describe("attributeEvents (concentration)", () => {
  it("distributes N events to members ∝ proneness weights, summing to N", () => {
    const rng = makeRng(0xc0ffee);
    const w = [3, 0.2, 0.2]; // member 0 most prone
    const counts = attributeEvents(rng, 10_000, w);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(10_000);
    expect(counts[0]).toBeGreaterThan(counts[1] + counts[2]); // concentration
  });
  it("returns all-zero for N=0", () => {
    expect(attributeEvents(makeRng(1), 0, [1, 1])).toEqual([0, 0]);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/crew_conditions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** (`src/risk/crew-conditions.ts`)

```ts
type Rng = () => number;

/** D(n)=n(n−1)/2 normalized to the reference crew size. n<2 → 0 (no dyads). */
export function dyadFactor(n: number, refN: number): number {
  const d = (x: number) => (x * (x - 1)) / 2;
  if (n < 2) return 0;
  return d(n) / d(refN);
}

function sd(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
  return Math.sqrt(v);
}

/** exp(β_het · SD(proneness)). */
export function heterogeneityFactor(proneness: readonly number[], betaHet: number): number {
  return Math.exp(betaHet * sd(proneness));
}

/** exp(β_weak · max(proneness)). */
export function weakestLinkFactor(proneness: readonly number[], betaWeak: number): number {
  const worst = proneness.length ? Math.max(...proneness) : 0;
  return Math.exp(betaWeak * worst);
}

/**
 * Distribute N crew-level events to members by a weighted multinomial with
 * weights ∝ (proneness shifted to be positive). Reproduces conflict concentration.
 */
export function attributeEvents(rng: Rng, n: number, weights: readonly number[]): number[] {
  const counts = new Array<number>(weights.length).fill(0);
  if (n <= 0 || weights.length === 0) return counts;
  const minW = Math.min(...weights);
  const shift = minW < 0.01 ? 0.01 - minW : 0; // keep strictly positive
  const w = weights.map((x) => x + shift);
  const total = w.reduce((a, b) => a + b, 0);
  for (let e = 0; e < n; e++) {
    let r = rng() * total;
    let k = 0;
    while (k < w.length - 1 && r >= w[k]) { r -= w[k]; k++; }
    counts[k]++;
  }
  return counts;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/crew_conditions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/risk/crew-conditions.ts tests/risk/crew_conditions.test.ts
git commit -m "feat(risk): crew-level dyad/heterogeneity/weakest-link factors + event attribution"
```

---

## Phase 4 — Priors wiring (synthetic defaults + PyMC merge)

### Task 7: Reclassify team conditions (de-EVA) + build the `team` synthetic block

**Files:**
- Modify: `src/risk/conditions.ts` (de-EVA the team conditions)
- Modify: `src/data/synthetic-iter3.ts` (build `team` block)
- Test: `tests/risk/synthetic_priors_coverage.test.ts` (extend)

- [ ] **Step 1: Write the failing test** (append to `tests/risk/synthetic_priors_coverage.test.ts`)

```ts
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";

describe("team conditions are de-EVA'd (kind rate, crew scope)", () => {
  it("conflict-event and leadership-challenge are no longer event-kind", () => {
    const byId = new Map(ANALOG_CONDITIONS.map((c) => [c.id, c]));
    for (const id of ["conflict-event", "leadership-challenge"]) {
      expect(byId.get(id)!.kind).toBe("rate");
    }
  });
});

describe("SYNTHETIC_PRIORS team block", () => {
  it("has a team block with lambda_base_samples for every team-family condition", () => {
    expect(SYNTHETIC_PRIORS.team).toBeDefined();
    const teamIds = ANALOG_CONDITIONS.filter((c) => c.family === "team").map((c) => c.id);
    for (const id of teamIds) {
      expect(SYNTHETIC_PRIORS.team!.lambda_base_samples[id]?.length ?? 0).toBeGreaterThan(0);
    }
  });
  it("temporal_p > 1 (back-loaded) and pi_unstable_base ≈ 0.658", () => {
    expect(SYNTHETIC_PRIORS.team!.temporal_p).toBeGreaterThan(1);
    expect(SYNTHETIC_PRIORS.team!.pi_unstable_base).toBeCloseTo(0.658, 2);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/synthetic_priors_coverage.test.ts`
Expected: FAIL — `kind` still `"event"`, `SYNTHETIC_PRIORS.team` undefined.

- [ ] **Step 3a: De-EVA the team conditions** in `src/risk/conditions.ts` — change `kind: "event"` to `kind: "rate"` for `conflict-event` (line ~54) and `leadership-challenge` (line ~371). (`team-cohesion-loss` and `role-ambiguity-conflict` are already `kind: "rate"`.)

- [ ] **Step 3b: Build the `team` block** in `src/data/synthetic-iter3.ts`. Add this constant and merge it into the returned object. Place after `buildSyntheticPriors`’s `conditions` are built, before the `return`:

```ts
// Synthetic-structural defaults for the conflict/team Bayesian layer (spec §5–§7).
// PyMC-fit params (pi_unstable_base, lambda_base_samples, crew_frailty_phi_samples)
// are OVERWRITTEN by conflict-team-priors.json when present (Task 10); these are the
// fallback values so the engine runs without the Python service.
function buildTeamBlock(): NonNullable<PriorsJson["team"]> {
  const teamIds = ANALOG_CONDITIONS.filter((c) => c.family === "team").map((c) => c.id);
  // Base per-crew-per-day conflict rate so P(≥1 by 40% of a 90-d mission) ≈ 0.97:
  //   1 - exp(-λ·0.4·90) = 0.97 → λ ≈ 0.0974/day. One shared posterior per team condition.
  const lambdaBase = 0.097;
  const lambda_base_samples: Record<string, number[]> = {};
  for (const id of teamIds) {
    lambda_base_samples[id] = makeLogLambdaSamples(Math.log(lambdaBase), 0.25, (PRIORS_SEED ^ 0x7a3b) + id.length)
      .map((x) => Math.exp(x));
  }
  return {
    crew_frailty_phi_samples: [2, 2.5, 3, 3.5, 4], // weakly-identified; wide (Basner n=2/6)
    member_frailty_phi: 4,
    pi_unstable_base: 0.658, // Tu 2024 133/202
    alpha_fit: -0.5,
    sigma_log_beta: 0.3,     // ≈ ±35% on β (analysis §5.3)
    temporal_a: 2,
    temporal_p: 2,           // back-loaded
    beta_het: 0.3,
    beta_weak: 0.4,
    dyad_ref_n: 6,
    lambda_base_samples,
  };
}
```

Then in `buildSyntheticPriors`’s return object add `team: buildTeamBlock(),` and add `export const PRIORS_SEED` if not already exported (it is a module const at line 16 — change `const PRIORS_SEED` to `export const PRIORS_SEED` so the helper can reference it cleanly, or just reference the in-scope const since `buildTeamBlock` is module-level: keep `PRIORS_SEED` as-is and call `buildTeamBlock()` from inside `buildSyntheticPriors`).

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/synthetic_priors_coverage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/risk/conditions.ts src/data/synthetic-iter3.ts tests/risk/synthetic_priors_coverage.test.ts
git commit -m "feat(risk): de-EVA team conditions + synthetic team hyper-prior defaults"
```

---

## Phase 5 — Engine integration (three-pass trial)

### Task 8: Refactor `runMissionTrial` into three substream-isolated passes

**Files:**
- Modify: `src/risk/simulate.ts`
- Test: `tests/risk/simulate_threepass.test.ts`

This is the integration task. `runMissionTrial`’s signature changes from `(crew, mission, priors, conditions, rng, criteriaIndex)` to `(crew, mission, priors, conditions, seed, criteriaIndex, hyper)`. `simulateMission` constructs `hyper` from `priors.team` and passes a per-trial `seed` (e.g. `options.seed + t`).

- [ ] **Step 1: Write the failing tests** (`tests/risk/simulate_threepass.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { simulateMission } from "@/risk/simulate";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import type { Candidate } from "@/types";

const antarctic = ANALOG_MISSIONS.find((m) => m.id === "antarctic-winter-over")!; // evaCount 0, 365 d
const crew = (teamwork: number, n = 4): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": teamwork } }));

const teamQTL = (post: ReturnType<typeof simulateMission>) =>
  ANALOG_CONDITIONS.filter((c) => c.family === "team")
    .reduce((s, c) => s + (post.perConditionQTL[c.id]?.mean ?? 0), 0);

describe("de-EVA: conflict fires on zero-EVA missions", () => {
  it("365-d Antarctic (evaCount=0) now produces > 0 team-condition QTL", () => {
    const post = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 4000 });
    expect(teamQTL(post)).toBeGreaterThan(0);
  });
});

describe("dyadic scaling", () => {
  it("a 3-person crew has less team QTL than a 6-person crew, same composition", () => {
    const opt = { seed: 0xc0ffee, trials: 4000 } as const;
    const q3 = teamQTL(simulateMission(crew(5, 3), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt));
    const q6 = teamQTL(simulateMission(crew(5, 6), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt));
    expect(q3).toBeLessThan(q6);
  });
});

describe("determinism", () => {
  it("same seed → identical CHI mean across two runs", () => {
    const opt = { seed: 0xc0ffee, trials: 2000 } as const;
    const a = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt);
    const b = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt);
    expect(a.chi.mean).toBe(b.chi.mean);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/risk/simulate_threepass.test.ts`
Expected: FAIL — team QTL is 0 (still per-member EVA path) or signature mismatch.

- [ ] **Step 3: Implement the three-pass refactor** in `src/risk/simulate.ts`. Replace the body of `runMissionTrial` with the version below and update `simulateMission` to call it with a per-trial seed and `hyper`. Add the imports at the top.

```ts
// add to imports
import { makeRng } from "@/engine/prng";
import { sampleFrailty, sampleGammaPoisson } from "./incidence";
import { conditionBehavior } from "./condition-behavior";
import { drawTrialLatentState, type TeamHyper, type TrialLatentState } from "./crew-state";
import { dyadFactor, heterogeneityFactor, weakestLinkFactor, attributeEvents } from "./crew-conditions";
import { integratedIntensity, firstEventFraction, type LatentClass } from "./temporal";

// substream salts — keep medical isolated from all new randomness
const SALT_MEDICAL = 0x00abcd01;
const SALT_PSYCH = 0x00abcd02;
const SALT_CREW = 0x00abcd03;
const SALT_LATENT = 0x00abcd04;

function defaultHyper(team: NonNullable<PriorsJson["team"]> | undefined, rng0: Rng): TeamHyper | undefined {
  if (!team) return undefined;
  const pick = (arr: number[]) => arr[Math.min(Math.floor(rng0() * arr.length), arr.length - 1)];
  return {
    crewFrailtyPhi: pick(team.crew_frailty_phi_samples),
    memberFrailtyPhi: team.member_frailty_phi,
    piUnstableBase: team.pi_unstable_samples ? pick(team.pi_unstable_samples) : team.pi_unstable_base,
    alphaFit: team.alpha_fit,
    sigmaLogBeta: team.sigma_log_beta,
    fitCriterionId: "behavioral.teamwork",
  };
}
```

Replace `runMissionTrial` with:

```ts
export function runMissionTrial(
  crew: readonly Candidate[],
  mission: AnalogMission,
  priors: PriorsJson,
  conditions: readonly Condition[],
  seed: number,
  criteriaIndex?: ReadonlyMap<string, Criterion>,
): TrialResult {
  const idx = criteriaIndex ?? new Map<string, Criterion>();
  let totalQTL = 0;
  const perCondition: Record<string, number> = {};

  // Phase 0 — shared latent state (dedicated substream)
  const team = priors.team;
  const rngLatent = makeRng((seed ^ SALT_LATENT) >>> 0);
  const hyper = team ? defaultHyper(team, rngLatent) : undefined;
  const latent: TrialLatentState | null =
    hyper ? drawTrialLatentState(crew, idx, hyper, rngLatent) : null;

  // Phase 1a — medical/physiologic (UNCHANGED behavior, isolated substream)
  // Phase 1b — psychiatric/performance (frailty + latent temporal + NB)
  const rngMedical = makeRng((seed ^ SALT_MEDICAL) >>> 0);
  const rngPsych = makeRng((seed ^ SALT_PSYCH) >>> 0);
  for (const c of conditions) {
    const beh = conditionBehavior(c);
    if (beh.scope === "crew") continue; // handled in Phase 2
    const condPrior = priors.conditions[c.id];
    if (!condPrior) continue;
    const missionPrior = condPrior.missions[mission.type];
    if (!missionPrior) continue;
    const rng = beh.frailtyCoupled ? rngPsych : rngMedical;

    for (let mi = 0; mi < crew.length; mi++) {
      const member = crew[mi];
      const logLambda = sampleFromPosterior(rng, missionPrior.log_lambda_samples);
      const baseLambda = Math.exp(logLambda);
      const z = vulnerabilityVector(member, c.vulnerabilityCriteria, idx);
      // β-uncertainty: shift β by the trial's lognormal factor
      const beta = latent
        ? Object.fromEntries(Object.entries(condPrior.vulnerability_beta).map(([k, v]) => [k, v * Math.exp(latent.betaLogShift)]))
        : condPrior.vulnerability_beta;
      let lambdaI = applyVulnerabilityMultiplier(baseLambda, beta, z);
      if (latent && beh.frailtyCoupled) lambdaI *= latent.crewFrailty * latent.memberFrailty[mi];

      let n = 0;
      if (c.kind === "rate") {
        let mean = lambdaI * mission.durationDays;
        if (latent && beh.temporal === "latent" && team) {
          mean *= integratedIntensity(latent.latentClass as LatentClass, team.temporal_a, team.temporal_p);
        }
        n = beh.dispersion === "negbin" && team
          ? sampleGammaPoisson(rng, mean, team.member_frailty_phi)
          : samplePoisson(rng, mean);
      } else {
        n = sampleBinomial(rng, mission.evaCount, clampProb(lambdaI));
      }
      if (n === 0) continue;
      totalQTL += accumulateLostDays(rng, c.id, n, condPrior, mission, perCondition);
    }
  }

  // Phase 2 — crew-level team conditions
  if (latent && team) {
    const rngCrew = makeRng((seed ^ SALT_CREW) >>> 0);
    totalQTL += runCrewPass(crew, mission, conditions, priors, team, latent, rngCrew, idx, perCondition);
  }

  const available = mission.durationDays * mission.crewSize;
  const cappedQTL = Math.min(totalQTL, available);
  const chi = computeCHI(cappedQTL, available);
  return { chi, qtl: totalQTL, perCondition };
}

/** Shared lost-days accumulation (extracted so all passes reuse it). */
function accumulateLostDays(
  rng: Rng, cid: string, n: number, condPrior: PriorsJson["conditions"][string],
  mission: AnalogMission, perCondition: Record<string, number>,
): number {
  const tau = treatmentFraction(cid, mission);
  const dBest = lostDays(condPrior.untreated_lost_days_mean, condPrior.treated_lost_days_mean, tau);
  let q = 0;
  for (let j = 0; j < n; j++) {
    const severity = sampleSeverity(rng, condPrior.worst_case_prob_q);
    const dj = dBest * (severity === 1 ? WORST_CASE_MULTIPLIER : 1.0);
    q += dj;
    perCondition[cid] = (perCondition[cid] ?? 0) + dj;
  }
  return q;
}

/** Phase 2: crew-level team-condition hazard. */
function runCrewPass(
  crew: readonly Candidate[], mission: AnalogMission, conditions: readonly Condition[],
  priors: PriorsJson, team: NonNullable<PriorsJson["team"]>, latent: TrialLatentState,
  rng: Rng, idx: ReadonlyMap<string, Criterion>, perCondition: Record<string, number>,
): number {
  let q = 0;
  const dyad = dyadFactor(crew.length, team.dyad_ref_n);
  if (dyad === 0) return 0;
  // proneness w_i = −z on the fit criterion (low teamwork → high proneness)
  const proneness = crew.map((m) => {
    const z = vulnerabilityVector(m, ["behavioral.teamwork"], idx)["behavioral.teamwork"];
    return Number.isFinite(z) ? -z : 0;
  });
  const het = heterogeneityFactor(proneness, team.beta_het);
  const weak = weakestLinkFactor(proneness, team.beta_weak);
  const intg = integratedIntensity(latent.latentClass as LatentClass, team.temporal_a, team.temporal_p);

  for (const c of conditions) {
    if (conditionBehavior(c).scope !== "crew") continue;
    const samples = team.lambda_base_samples[c.id];
    const condPrior = priors.conditions[c.id];
    if (!samples || samples.length === 0 || !condPrior) continue;
    const lambdaBase = samples[Math.min(Math.floor(rng() * samples.length), samples.length - 1)];
    const mean = lambdaBase * dyad * het * weak * mission.durationDays * intg * latent.crewFrailty;
    const n = samplePoisson(rng, mean);
    if (n === 0) continue;
    // attribute to members for concentration (counts unused for QTL total but advances rng deterministically)
    attributeEvents(rng, n, proneness);
    q += accumulateLostDays(rng, c.id, n, condPrior, mission, perCondition);
  }
  return q;
}
```

Update `simulateMission`’s trial loop: replace `runMissionTrial(crew, mission, priors, conditions, rng, criteriaIndex)` with `runMissionTrial(crew, mission, priors, conditions, options.seed + t, criteriaIndex)` and delete the now-unused top-level `const rng = makeRng(options.seed);` (the substreams are derived per trial from `options.seed + t`).

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/risk/simulate_threepass.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the full risk suite, fix any callers, commit**

Run: `npx vitest run tests/risk/ && npx tsc --noEmit`
Expected: PASS / 0 errors. (If `m18_convergence.test.ts` or `coupling_amplitude.test.ts` assert exact pre-refactor values for team/psychiatric conditions, rebaseline those specific expectations once — documented — since the substream restructure changes their draw sequence. Medical/physiologic expectations should be unaffected.)

```bash
git add src/risk/simulate.ts tests/risk/simulate_threepass.test.ts
git commit -m "feat(risk): three-pass substream-isolated trial (de-EVA, frailty, NHPP, crew pass)"
```

---

### Task 9: Determinism negative-control test (medical invariant to features)

**Files:**
- Test: `tests/risk/determinism_control.test.ts`

- [ ] **Step 1: Write the test** (`tests/risk/determinism_control.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { simulateMission } from "@/risk/simulate";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import type { Candidate } from "@/types";

const mission = ANALOG_MISSIONS.find((m) => m.id === "antarctic-winter-over")!;
const crew: Candidate[] = Array.from({ length: 4 }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": 5 } }));
const MEDICAL = ANALOG_CONDITIONS.filter((c) => c.family === "physiologic" || c.family === "musculoskeletal");

describe("medical conditions are invariant to the conflict layer (feature toggle)", () => {
  it("medical per-condition QTL is identical with team block present vs absent", () => {
    const withTeam = { ...SYNTHETIC_PRIORS };
    const withoutTeam = { ...SYNTHETIC_PRIORS, team: undefined };
    const opt = { seed: 0xc0ffee, trials: 3000 } as const;
    const a = simulateMission(crew, mission, withTeam, ANALOG_CONDITIONS, opt);
    const b = simulateMission(crew, mission, withoutTeam, ANALOG_CONDITIONS, opt);
    for (const c of MEDICAL) {
      expect(a.perConditionQTL[c.id]?.mean).toBe(b.perConditionQTL[c.id]?.mean);
    }
  });
});
```

- [ ] **Step 2: Run to verify it passes (this is the control)**

Run: `npx vitest run tests/risk/determinism_control.test.ts`
Expected: PASS — medical QTL byte-identical across the toggle (proves substream isolation). If it FAILS, the medical substream is leaking; do not proceed until green.

- [ ] **Step 3: Commit**

```bash
git add tests/risk/determinism_control.test.ts
git commit -m "test(risk): medical conditions invariant to conflict layer (substream control)"
```

---

## Phase 6 — PyMC fitter (offline) + emitted JSON

### Task 10: Python `conflict_fit.py` fitter + emitted `conflict-team-priors.json`

**Files:**
- Create: `python/selectron/conflict_fit.py`
- Create: `python/tests/test_conflict_fit.py`
- Create (emitted): `src/data/conflict-team-priors.json`
- Modify: `src/data/synthetic-iter3.ts` (load + merge the JSON when present)

- [ ] **Step 1: Write the failing Python test** (`python/tests/test_conflict_fit.py`)

```python
import json
import numpy as np
from selectron.conflict_fit import fit_conflict_team_priors

def test_pi_unstable_recovers_tu2024():
    out = fit_conflict_team_priors(seed=42, draws=500, tune=500, team_condition_ids=["conflict-event"])
    pi = np.array(out["team"]["pi_unstable_samples"])
    assert 0.55 < pi.mean() < 0.76  # Tu 2024 133/202 ≈ 0.658

def test_lambda_base_hits_bell_anchor():
    out = fit_conflict_team_priors(seed=42, draws=500, tune=500, team_condition_ids=["conflict-event"])
    lam = np.array(out["team"]["lambda_base_samples"]["conflict-event"])
    # P(>=1 by 40% of 90d) = 1 - exp(-lam*0.4*90); expect ~0.9-0.99
    p = 1 - np.exp(-lam.mean() * 0.4 * 90)
    assert 0.85 < p < 0.995

def test_emitted_json_is_deterministic():
    a = fit_conflict_team_priors(seed=7, draws=300, tune=300, team_condition_ids=["conflict-event"])
    b = fit_conflict_team_priors(seed=7, draws=300, tune=300, team_condition_ids=["conflict-event"])
    assert a["team"]["pi_unstable_samples"][:5] == b["team"]["pi_unstable_samples"][:5]
```

- [ ] **Step 2: Run to verify failure**

Run: `cd python && pytest tests/test_conflict_fit.py -q`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** (`python/selectron/conflict_fit.py`)

```python
"""Offline PyMC fit of the anchorable conflict/team parameters.

Fits three blocks from published analog-mission evidence:
  - pi_unstable      Beta-Binomial on Tu 2024 (133 unstable / 202 crews)
  - lambda_base[k]   Beta-Binomial on Bell 2019 "all teams >=1 conflict by 40%/90d",
                     mapped to a per-day rate via 1 - exp(-lambda * 0.4 * 90)
  - crew_frailty_phi weakly-identified Gamma dispersion anchored to Basner concentration

Synthetic-default params (member_frailty_phi, alpha_fit, sigma_log_beta, temporal_a/p,
beta_het, beta_weak, dyad_ref_n) are filled in by the TS layer, not fit here.
"""
from __future__ import annotations
import numpy as np
import pymc as pm

# Evidence rows (DOIs in the design spec §12).
TU2024_UNSTABLE, TU2024_TOTAL = 133, 202          # latent-class split
BELL2019_WITH_CONFLICT, BELL2019_TEAMS = 71, 72    # ~all teams >=1 by 40%/90d
BASNER_SHARE, BASNER_TOPK_FRAC = 0.85, 1 / 3       # 85% of conflicts from top-third

def fit_conflict_team_priors(seed: int, draws: int, tune: int, team_condition_ids: list[str]) -> dict:
    rng = np.random.default_rng(seed)

    with pm.Model():
        pi = pm.Beta("pi", alpha=1 + TU2024_UNSTABLE, beta=1 + (TU2024_TOTAL - TU2024_UNSTABLE))
        idata_pi = pm.sample(draws=draws, tune=tune, chains=2, random_seed=seed,
                             progressbar=False)
    pi_samples = idata_pi.posterior["pi"].values.reshape(-1)

    with pm.Model():
        p40 = pm.Beta("p40", alpha=1 + BELL2019_WITH_CONFLICT,
                      beta=1 + (BELL2019_TEAMS - BELL2019_WITH_CONFLICT))
        # map by-40% probability to a per-day base rate: p = 1 - exp(-lam*0.4*90)
        lam = pm.Deterministic("lam", -pm.math.log(1 - p40) / (0.4 * 90))
        idata_lam = pm.sample(draws=draws, tune=tune, chains=2, random_seed=seed,
                              progressbar=False)
    lam_samples = idata_lam.posterior["lam"].values.reshape(-1)
    lam_samples = lam_samples[np.isfinite(lam_samples) & (lam_samples > 0)]

    # crew frailty phi: weakly identified. Sample a wide prior consistent with high
    # concentration (small phi => high overdispersion). Disclosed as wide.
    phi_samples = rng.gamma(shape=2.0, scale=1.5, size=2000)  # mean 3, wide
    phi_samples = phi_samples[phi_samples > 0.2]

    return {
        "model_version": "conflict-team-fit-v1",
        "fitted_at": "2026-06-06T00:00:00Z",
        "team": {
            "pi_unstable_samples": [float(x) for x in pi_samples[:2000]],
            "lambda_base_samples": {cid: [float(x) for x in lam_samples[:2000]] for cid in team_condition_ids},
            "crew_frailty_phi_samples": [float(x) for x in phi_samples[:2000]],
        },
    }

def main() -> None:
    import json, pathlib
    team_ids = ["conflict-event", "team-cohesion-loss", "leadership-challenge", "role-ambiguity-conflict"]
    out = fit_conflict_team_priors(seed=0xC0FFEE & 0xFFFFFFFF, draws=1000, tune=1000, team_condition_ids=team_ids)
    dest = pathlib.Path(__file__).resolve().parents[2] / "src" / "data" / "conflict-team-priors.json"
    dest.write_text(json.dumps(out, indent=2))
    print(f"wrote {dest}")

if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the Python tests, then emit the JSON**

Run: `cd python && pytest tests/test_conflict_fit.py -q`
Expected: PASS (allow a minute — small NUTS runs).
Then emit the committed JSON: `cd python && python -m selectron.conflict_fit`
Expected: `wrote .../src/data/conflict-team-priors.json`.

- [ ] **Step 5: Merge the JSON in `synthetic-iter3.ts`** — import it and override the three fitted fields when present:

```ts
import conflictTeamPriors from "@/data/conflict-team-priors.json";
// inside buildTeamBlock(), before the return, override the PyMC-fit fields:
const fitted = (conflictTeamPriors as { team?: Partial<NonNullable<PriorsJson["team"]>> }).team;
// ...spread `...fitted` over the synthetic defaults in the returned object so
// pi_unstable_samples, lambda_base_samples, crew_frailty_phi_samples win when present.
```

Adjust `buildTeamBlock`’s return to `return { ...syntheticDefaults, ...(fitted ?? {}) };` (keep synthetic `lambda_base_samples` as a fallback merged per-id).

- [ ] **Step 6: Run TS + commit**

Run: `npx vitest run tests/risk/synthetic_priors_coverage.test.ts tests/risk/simulate_threepass.test.ts && npx tsc --noEmit`
Expected: PASS / 0 errors.

```bash
git add python/selectron/conflict_fit.py python/tests/test_conflict_fit.py src/data/conflict-team-priors.json src/data/synthetic-iter3.ts
git commit -m "feat(calibration): PyMC conflict/team fitter + emitted priors JSON; merge into synthetic priors"
```

---

## Phase 7 — Validation harness (B5)

### Task 11: Posterior-predictive checks vs literature anchors

**Files:**
- Modify: `src/risk/simulate.ts` (emit team diagnostics under `options.diagnostics`)
- Test: `tests/risk/conflict_ppc.test.ts`

- [ ] **Step 1: Add team diagnostics to the engine.** Extend `RiskPosteriorWithDiagnostics.diagnostics` (in `simulate.ts`) to optionally carry `teamFirstFractions: number[]`, `latentClassFlags: number[]`, and `teamMemberConcentration: number[][]`. In `runMissionTrial`, when a `diag` collector is passed, push: the first-event mission-fraction (via `firstEventFraction(rngCrew, mean, latent.latentClass, team.temporal_a, team.temporal_p)`) for the primary `conflict-event` condition, the `latent.latentClass`, and the `attributeEvents` counts. Thread a collector object through `runMissionTrial` only when `options.diagnostics` is true.

```ts
// in simulateMission, when options.diagnostics:
const teamFirstFractions: number[] = [];
const latentClassFlags: number[] = [];
const teamMemberConcentration: number[][] = [];
// pass these arrays into runMissionTrial via an optional `diag` param and push within Phase 2.
// then attach to posterior.diagnostics.
```

- [ ] **Step 2: Write the PPC test** (`tests/risk/conflict_ppc.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { simulateMission } from "@/risk/simulate";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import type { Candidate } from "@/types";

const m90 = ANALOG_MISSIONS.find((m) => m.id === "hi-seas-90d")!;
const crew = (teamwork: number, n = 6): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": teamwork } }));
const run = (c: Candidate[]) =>
  simulateMission(c, m90, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 8000, diagnostics: true });

describe("B5 posterior-predictive checks", () => {
  it("Bell 2019 onset: ref crew P(>=1 conflict by 40%) >= 0.9", () => {
    const d = run(crew(5)).diagnostics!;
    const byPoint4 = d.teamFirstFractions!.filter((u) => u <= 0.4).length / d.teamFirstFractions!.length;
    expect(byPoint4).toBeGreaterThan(0.9);
  });
  it("Tu 2024 split: unstable fraction is lower for high-fit crews", () => {
    const frac = (c: Candidate[]) => {
      const f = run(c).diagnostics!.latentClassFlags!;
      return f.reduce((a, b) => a + b, 0) / f.length;
    };
    expect(frac(crew(9))).toBeLessThan(frac(crew(3)));
  });
  it("Basner concentration: top member's share of attributed conflicts > 1/n", () => {
    const conc = run(crew(3)).diagnostics!.teamMemberConcentration!;
    const totals = [0, 0, 0];
    let all = 0;
    for (const row of conc) row.forEach((v, i) => { totals[i] += v; all += v; });
    const topShare = Math.max(...totals) / Math.max(all, 1);
    expect(topShare).toBeGreaterThan(1 / 3);
  });
});
```

- [ ] **Step 3: Run to verify failure, then implement diagnostics until pass**

Run: `npx vitest run tests/risk/conflict_ppc.test.ts`
Expected: first FAIL (diagnostics undefined), then PASS after Step 1 wiring.

- [ ] **Step 4: Full suite + typecheck**

Run: `npx vitest run tests/risk/ && npx tsc --noEmit`
Expected: PASS / 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/risk/simulate.ts tests/risk/conflict_ppc.test.ts
git commit -m "feat(risk): B5 posterior-predictive check harness (onset/split/concentration)"
```

---

### Task 12: STATUS.md update + V&V note

**Files:**
- Modify: `STATUS.md` (Current state + Audit log)
- Modify: `docs/iter3_vv_dossier.md` (new section for the conflict/team layer)

- [ ] **Step 1:** Add a "Current state" entry to `STATUS.md` summarizing the conflict/team Bayesian layer (engine `src/risk/`, three-pass, de-EVA, frailty/NB, NHPP latent-class, β-uncertainty, PPC), with commit SHAs and test counts. Append an Audit-log row.

- [ ] **Step 2:** Add a V&V dossier section documenting: the substream determinism control, the three PyMC-fit anchors with their posteriors, the weak identification of `phi`, and the eight PPC checks.

- [ ] **Step 3: Final full verification**

Run: `npx vitest run && npx tsc --noEmit`
Expected: full risk suite green; 0 type errors. (Run `cd python && pytest -m "not slow"` separately for the fitter.)

- [ ] **Step 4: Commit**

```bash
git add STATUS.md docs/iter3_vv_dossier.md
git commit -m "docs: STATUS + V&V for conflict/team Bayesian layer"
```

---

## Self-Review (completed during authoring)

**Spec coverage:** A1 de-EVA → Task 7 + Task 8 test; A2 dyadic → Task 6 + Task 8; A3 NHPP/latent-class → Task 2 + Task 5 + Task 8; B1 Negative-Binomial → Task 1 + Task 8; B3 shared frailty → Task 1 + Task 5 + Task 8; B4 β-uncertainty → Task 5 + Task 8 (betaLogShift applied); B5 PPC → Task 11; hybrid priors → Task 10; determinism control → Task 9. All spec sections map to a task.

**Placeholders:** none — every code step shows complete code; Task 11 Step 1 and Task 12 are described with concrete field names and the exact diagnostics to push.

**Type consistency:** `TeamHyper` (crew-state) vs `TeamHyperPriors` (priorsSchema) are intentionally distinct — the former is the per-trial resolved struct, the latter the JSON block; `defaultHyper` (Task 8) bridges them. `TrialLatentState` fields (`latentClass`, `memberFrailty`, `crewFrailty`, `betaLogShift`) are used identically in Tasks 5/8/11. `dyadFactor(n, refN)`, `heterogeneityFactor(proneness, betaHet)`, `weakestLinkFactor(proneness, betaWeak)`, `attributeEvents(rng, n, weights)` signatures match between Task 6 and Task 8.

**Risk note (rebaseline):** Task 8 Step 5 flags that exact-value expectations for team/psychiatric conditions in pre-existing tests may need a one-time rebaseline due to substream restructuring; medical/physiologic expectations are protected by the Task 9 control.
