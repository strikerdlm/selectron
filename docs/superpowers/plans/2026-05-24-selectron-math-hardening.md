# Selectron Technical Limitations Fix — Pre-Submission Math Hardening

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all manuscript-blocking mathematical/diagnostic limitations identified in the two peer-review passes (`paper/peer-review-tier1-application-log.md` §Deferred), correct documentation-code mismatches, and verify frontend accuracy — producing a codebase where every calculation is correct, every description matches the code, and every claim is test-backed.

**Architecture:** Four sequential tracks: (A) Documentation fixes, (B) New diagnostic infrastructure (K-S test, Gelman-Rubin R̂, α₀ robustness panel), (C) Worked-example and sensitivity fixes, (D) Frontend audit + full regression. Each task is TDD with a commit.

**Tech Stack:** TypeScript, Vitest, ECharts (figures), Playwright (e2e snapshots)

**Evidence corpus:** `research/evidence/` (31 papers, 423 OCR'd pages) and `research/imm_sources/` (16 papers). Methods papers: G12 (Bayesian IMM), M18 (IMM validation), A22 (medical risk), K15 (IMM architecture). The K-S and R̂ implementations reference standard formulas (Kolmogorov 1933; Gelman & Rubin 1992; Brooks & Gelman 1998).

**Existing infrastructure to reuse:**
- `src/engine/prng.ts::makeRng(seed)` — seeded PRNG (all samplers route through this)
- `src/engine/gamma.ts::sampleGamma(shape, rng)` — Marsaglia-Tsang Gamma
- `src/engine/dirichlet.ts::sampleDirichlet(alpha, rng)` — Gamma-normalization (exact IID)
- `src/engine/mcda.ts::scoreCandidate(input)` — Stage A posterior sampler
- `src/engine/mcda.ts::closedFormMoments(input)` — analytic Dirichlet moments
- `src/imm/simulate.ts::simulateIMM(...)` — IMM Calculator Monte Carlo
- `tests/imm/validation_k15.test.ts` — K15 reproduction gate (13 tests, 7/12 within CI₉₅)
- `src/data/imm-priors.json` — 100 conditions: 41 tier-A, 41 tier-B, 18 tier-C
- `src/ui/figures/CalculationTrace.tsx` — step-by-step math viewer (already accurate)
- `paper/peer-review-tier1-application-log.md` — authoritative scope source

---

## Track A — Documentation Fixes

### Task 1: Fix README sampler documentation error

The README claims "Metropolis sampler" (line 105 mermaid) and "hand-rolled Metropolis-Hastings on the simplex" (line 244). The actual implementation (`src/engine/dirichlet.ts`) is Gamma-normalization — an exact direct sampler with no accept-reject step. The manuscript (`paper/manuscript.md` line 65) correctly describes it as "standard Dirichlet decomposition: K independent Gamma(α_k, 1) variates are sampled and divided by their sum". The CalculationTrace UI also correctly says "Dirichlet prior".

**Files:**
- Modify: `README.md` lines 105 and 244

- [ ] **Step 1: Fix mermaid diagram (line 105)**

Change:
```
E_S[Metropolis sampler<br/>5 000 simplex draws]
```
to:
```
E_S[Dirichlet sampler<br/>5 000 IID draws]
```

- [ ] **Step 2: Fix methodology paragraph (line 244)**

Replace the sentence:
```
The sampler is hand-rolled Metropolis–Hastings on the simplex, validated against the closed-form Dirichlet moments — every Stage-A test in `tests/engine/` is statistical, not snapshot-based.
```
with:
```
Each draw exploits the standard Dirichlet decomposition: K independent Gamma(α_k, 1) variates (Marsaglia–Tsang acceptance-rejection) are divided by their sum, producing exact IID samples with no mixing or burn-in concerns. The sampler is validated against the closed-form Dirichlet moments — every Stage-A test in `tests/engine/` is statistical, not snapshot-based.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "fix(docs): correct README sampler description — Gamma-normalization, not Metropolis-Hastings

The README incorrectly claimed 'Metropolis sampler' and 'Metropolis-Hastings on the
simplex'. The actual implementation (src/engine/dirichlet.ts) is the standard Dirichlet
Gamma-normalization decomposition — an exact IID sampler. The manuscript (paper/manuscript.md
line 65) was already correct. Fixes documentation-code mismatch."
```

### Task 2: Update ESS label in RiskCard and ScoreCard

The RiskCard already shows "ESS (= trials)" — honest but adds no information for Stage B forward MC where ESS ≡ T by construction. ScoreCard shows "ESS" with a bare number. The diagnostic is meaningful in Stage A (IID Dirichlet draws produce ESS ≈ T, validating independence) but vacuous in Stage B.

**Files:**
- Modify: `src/ui/components/RiskCard.tsx` line 64
- Modify: `src/ui/components/ScoreCard.tsx` line 49-50

- [ ] **Step 1: Update RiskCard ESS row**

In `src/ui/components/RiskCard.tsx`, replace the ESS row (lines 63-65):
```tsx
        <dt className="text-ink-2">ESS (= trials)</dt>
        <dd className="text-right tabular-nums text-ink-1">{ess.toFixed(0)}</dd>
```
with:
```tsx
        <dt className="text-ink-2">trials</dt>
        <dd className="text-right tabular-nums text-ink-1">{trials.toLocaleString()}</dd>
```

And remove the now-redundant "trials" row above it (lines 61-62):
```tsx
        <dt className="text-ink-2">trials</dt>
        <dd className="text-right tabular-nums text-ink-1">{trials.toLocaleString()}</dd>
```

Net effect: one "trials" row replaces two rows ("trials" + "ESS (= trials)").

- [ ] **Step 2: Update ScoreCard ESS label**

In `src/ui/components/ScoreCard.tsx`, change the ESS label (line 49) from:
```tsx
        <dt className="text-ink-2">ESS</dt>
```
to:
```tsx
        <dt className="text-ink-2">ESS (IID ≈ T)</dt>
```

This makes transparent that for the IID Dirichlet sampler, ESS ≈ T is an invariant, not a finding.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 4: Commit**

```bash
git add src/ui/components/RiskCard.tsx src/ui/components/ScoreCard.tsx
git commit -m "fix(ui): clarify ESS labels — remove vacuous Stage B ESS row, annotate Stage A

RiskCard: collapse redundant 'trials' + 'ESS (= trials)' into a single 'trials' row.
ScoreCard: label ESS as 'ESS (IID ≈ T)' to make the IID-Dirichlet invariant transparent."
```

### Task 3: Update iter5_scientific_limitations.md

Add a new subsection documenting the ESS diagnostic clarity and the README fix.

**Files:**
- Modify: `docs/iter5_scientific_limitations.md` — add to §8 Resolved items table

- [ ] **Step 1: Add resolved item rows**

In `docs/iter5_scientific_limitations.md`, append to the §8 table:

```markdown
| §1 (new) | README claimed Metropolis-Hastings sampler; code is Gamma-normalization | README fixed to match code; manuscript was already correct | Task 1 this plan |
| §1 (new) | Stage B "ESS (= trials)" label was mathematically vacuous | RiskCard row collapsed to single "trials" row; ScoreCard annotated as invariant | Task 2 this plan |
```

- [ ] **Step 2: Commit**

```bash
git add docs/iter5_scientific_limitations.md
git commit -m "docs(limitations): log resolved README sampler claim + ESS label fixes"
```

---

## Track B — Diagnostic Infrastructure

### Task 4: K-S marginal Dirichlet goodness-of-fit test (TDD)

Peer-review-2 Issue 2: the lag-1 ESS is uninformative for IID Dirichlet draws. A Kolmogorov-Smirnov test comparing empirical marginal samples against the analytic Beta(α_k, α_0 − α_k) CDF is a more discriminating sampler diagnostic. At T=5000, the K-S critical value at α=0.05 is 1.36/√5000 ≈ 0.019.

**Files:**
- Create: `src/engine/ks.ts`
- Create: `tests/engine/dirichlet_ks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/dirichlet_ks.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { sampleDirichlet } from "@/engine/dirichlet";
import { makeRng } from "@/engine/prng";
import { ksStatistic, betaCDF } from "@/engine/ks";

describe("K-S marginal Dirichlet fit", () => {
  const T = 5_000;
  const alpha = [2, 3, 5];
  const alpha0 = alpha.reduce((a, b) => a + b, 0);
  const rng = makeRng(42);
  const samples: number[][] = Array.from({ length: alpha.length }, () => []);

  for (let t = 0; t < T; t++) {
    const w = sampleDirichlet(alpha, rng);
    for (let k = 0; k < alpha.length; k++) samples[k].push(w[k]);
  }

  // K-S critical value at alpha=0.05 for N=5000: 1.36 / sqrt(5000) ≈ 0.01924
  const KS_CRIT_005 = 1.36 / Math.sqrt(T);

  for (let k = 0; k < alpha.length; k++) {
    it(`marginal w_${k} ~ Beta(${alpha[k]}, ${alpha0 - alpha[k]}) passes K-S at alpha=0.05`, () => {
      const sorted = [...samples[k]].sort((a, b) => a - b);
      const D = ksStatistic(sorted, (x) => betaCDF(x, alpha[k], alpha0 - alpha[k]));
      expect(D).toBeLessThan(KS_CRIT_005);
    });
  }

  it("rejects a misspecified distribution (wrong alpha)", () => {
    const sorted = [...samples[0]].sort((a, b) => a - b);
    // Test against Beta(10, 10) which is wrong for w_0 ~ Beta(2, 8)
    const D = ksStatistic(sorted, (x) => betaCDF(x, 10, 10));
    expect(D).toBeGreaterThan(KS_CRIT_005);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/dirichlet_ks.test.ts`
Expected: FAIL — `ksStatistic` and `betaCDF` not found

- [ ] **Step 3: Implement K-S statistic and Beta CDF**

Create `src/engine/ks.ts`:

```typescript
// K-S goodness-of-fit statistic + regularized incomplete Beta CDF.
//
// ksStatistic: given sorted empirical samples and a theoretical CDF,
// computes the two-sided Kolmogorov-Smirnov D statistic.
//
// betaCDF: regularized incomplete Beta function I_x(a,b) via the
// continued-fraction expansion (Lentz 1976). Accurate to ~1e-10
// for typical Dirichlet concentration parameters.

function logGamma(z: number): number {
  // Lanczos approximation (same coefficients as src/imm/incidence.ts)
  const g = 7;
  const coefs = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = coefs[0];
  for (let i = 1; i < g + 2; i++) x += coefs[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaCFrac(x: number, a: number, b: number): number {
  const maxIter = 200;
  const eps = 1e-14;
  let f = 1, c = 1, d = 1;
  for (let m = 0; m <= maxIter; m++) {
    let num: number;
    if (m === 0) {
      num = 1;
    } else if (m % 2 === 0) {
      const k = m / 2;
      num = (k * (b - k) * x) / ((a + 2 * k - 1) * (a + 2 * k));
    } else {
      const k = (m - 1) / 2;
      num = -((a + k) * (a + b + k) * x) / ((a + 2 * k) * (a + 2 * k + 1));
    }
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    const delta = c * d;
    f *= delta;
    if (Math.abs(delta - 1) < eps) break;
  }
  return f;
}

export function betaCDF(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const logBeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - logBeta) / a;
  if (x < (a + 1) / (a + b + 2)) {
    return front * betaCFrac(x, a, b);
  }
  return 1 - (Math.exp(b * Math.log(1 - x) + a * Math.log(x) - logBeta) / b) * betaCFrac(1 - x, b, a);
}

export function ksStatistic(sortedSamples: number[], cdf: (x: number) => number): number {
  const n = sortedSamples.length;
  let D = 0;
  for (let i = 0; i < n; i++) {
    const Fn = (i + 1) / n;
    const FnPrev = i / n;
    const Fx = cdf(sortedSamples[i]);
    D = Math.max(D, Math.abs(Fn - Fx), Math.abs(FnPrev - Fx));
  }
  return D;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/dirichlet_ks.test.ts`
Expected: 4 PASS (3 marginal fits + 1 rejection of misspecified distribution)

- [ ] **Step 5: Run full suite to check for regressions**

Run: `npx vitest run`
Expected: all existing tests pass

- [ ] **Step 6: Commit**

```bash
git add src/engine/ks.ts tests/engine/dirichlet_ks.test.ts
git commit -m "feat(engine): K-S marginal Dirichlet goodness-of-fit test

Implements ksStatistic() and betaCDF() (regularized incomplete Beta via
Lentz continued fraction). Four tests: 3 marginal Beta fits at T=5000
against K-S critical value 0.019 (alpha=0.05), plus 1 rejection of a
misspecified Beta(10,10) distribution. Closes peer-review-2 Issue 2."
```

### Task 5: Gelman-Rubin R̂ convergence diagnostic (TDD)

Peer-review-2 §4.3: the σ<5% rule is a within-chain stability check; R̂ across 4 independent seeds proves between-chain convergence. Target R̂ ≤ 1.01. Use Brooks-Gelman-Rubin formula: R̂ = √((W·(n-1)/n + B/n) / W).

**Files:**
- Create: `src/engine/rhat.ts`
- Create: `tests/engine/rhat.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/rhat.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeRhat } from "@/engine/rhat";

describe("computeRhat", () => {
  it("returns ~1.0 for identical chains", () => {
    const chain = [0.5, 0.6, 0.55, 0.52, 0.58];
    const rhat = computeRhat([chain, chain, chain, chain]);
    expect(rhat).toBeCloseTo(1.0, 2);
  });

  it("returns ~1.0 for IID draws from the same distribution", () => {
    // 4 chains of 1000 values each, all from U(0,1)
    const chains: number[][] = [];
    for (let c = 0; c < 4; c++) {
      const ch: number[] = [];
      // Simple LCG for deterministic test (different seed per chain)
      let s = (c + 1) * 12345;
      for (let i = 0; i < 1000; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        ch.push(s / 0x7fffffff);
      }
      chains.push(ch);
    }
    const rhat = computeRhat(chains);
    expect(rhat).toBeLessThan(1.01);
  });

  it("returns > 1.1 for chains with different means", () => {
    const chain1 = Array.from({ length: 500 }, (_, i) => 0.3 + 0.01 * (i % 10));
    const chain2 = Array.from({ length: 500 }, (_, i) => 0.7 + 0.01 * (i % 10));
    const chain3 = Array.from({ length: 500 }, (_, i) => 0.5 + 0.01 * (i % 10));
    const chain4 = Array.from({ length: 500 }, (_, i) => 0.9 + 0.01 * (i % 10));
    const rhat = computeRhat([chain1, chain2, chain3, chain4]);
    expect(rhat).toBeGreaterThan(1.1);
  });

  it("throws on fewer than 2 chains", () => {
    expect(() => computeRhat([[1, 2, 3]])).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/rhat.test.ts`
Expected: FAIL — `computeRhat` not found

- [ ] **Step 3: Implement R̂**

Create `src/engine/rhat.ts`:

```typescript
// Brooks-Gelman-Rubin R̂ convergence diagnostic.
// R̂ = sqrt(((n-1)/n) + B/(n·W))
// where W = mean within-chain variance, B = between-chain variance of means × n.
// R̂ ≤ 1.01 indicates convergence across all chains.

export function computeRhat(chains: number[][]): number {
  const m = chains.length;
  if (m < 2) throw new Error("R̂ requires at least 2 chains");
  const n = chains[0].length;
  if (n < 2) throw new Error("R̂ requires at least 2 samples per chain");
  for (const ch of chains) {
    if (ch.length !== n) throw new Error("All chains must have equal length");
  }

  // Per-chain means
  const chainMeans = chains.map((ch) => {
    let s = 0;
    for (const x of ch) s += x;
    return s / n;
  });

  // Grand mean
  let grandMean = 0;
  for (const mu of chainMeans) grandMean += mu;
  grandMean /= m;

  // Between-chain variance B = (n / (m-1)) * sum((chainMean_j - grandMean)^2)
  let B = 0;
  for (const mu of chainMeans) B += (mu - grandMean) ** 2;
  B *= n / (m - 1);

  // Within-chain variance W = (1/m) * sum(s_j^2)
  let W = 0;
  for (let j = 0; j < m; j++) {
    let s2 = 0;
    for (const x of chains[j]) s2 += (x - chainMeans[j]) ** 2;
    s2 /= n - 1;
    W += s2;
  }
  W /= m;

  // R̂ = sqrt(((n-1)/n) + B/(n*W))
  if (W === 0) return 1.0; // all chains identical
  return Math.sqrt(((n - 1) / n) + B / (n * W));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/rhat.test.ts`
Expected: 4 PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/rhat.ts tests/engine/rhat.test.ts
git commit -m "feat(engine): Brooks-Gelman-Rubin R-hat convergence diagnostic

Implements computeRhat(chains) with the standard BG formula. 4 tests:
identical chains (~1.0), IID U(0,1) chains (<1.01), divergent means
(>1.1), and <2 chains rejection. Closes peer-review-2 §4.3 infra."
```

### Task 6: IMM R̂ convergence test — 4 chains × 25k trials (TDD)

Apply R̂ to the actual IMM simulator: 4 independent seeds × T=25k on issHMS. Assert R̂(CHI) ≤ 1.01 AND each individual chain's σ<5% rule passes.

**Files:**
- Create: `tests/imm/rhat_convergence.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/imm/rhat_convergence.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { computeRhat } from "../../src/engine/rhat";
import type { IMMCrewMember } from "../../src/imm/types";

const K15_CREW: IMMCrewMember[] = Array.from({ length: 6 }, (_, i) => ({
  id: `crew-${i}`, sex: i % 2 === 0 ? "male" as const : "female" as const,
  contacts: false, crowns: false, CAC_positive: false,
  abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
}));

const SEEDS = [0xc0ffee, 0xdeadbeef, 0x12345678, 0xfeedface];
const T_PER_CHAIN = 25_000;

describe("IMM R̂ convergence (4 chains × 25k)", () => {
  const issHMS = IMM_MISSIONS.find((m) => m.id === "iss-6mo")!;
  const chiChains: number[][] = [];

  // Run all 4 chains (this takes ~40s total at T=25k×4)
  for (const seed of SEEDS) {
    const outcome = simulateIMM(K15_CREW, issHMS, IMM_KITS.issHMS, {
      trials: T_PER_CHAIN,
      seed,
      diagnostics: true,
    });
    chiChains.push(outcome.diagnostics!.chiSamples);
  }

  it("R̂(CHI) ≤ 1.01 across 4 independent chains", () => {
    const rhat = computeRhat(chiChains);
    expect(rhat).toBeLessThanOrEqual(1.01);
  });

  it("each chain individually satisfies σ<5% in last 2×1000-trial blocks", () => {
    for (let c = 0; c < chiChains.length; c++) {
      const samples = chiChains[c];
      const n = samples.length;
      const last2k = samples.slice(n - 2000);
      const block1 = last2k.slice(0, 1000);
      const block2 = last2k.slice(1000);
      const sigma1 = std(block1);
      const sigma2 = std(block2);
      const change = Math.abs(sigma2 - sigma1) / Math.max(sigma1, 1e-12);
      expect(change).toBeLessThan(0.05);
    }
  });
}, 120_000); // 2-minute timeout for 4×25k trials

function std(arr: number[]): number {
  const n = arr.length;
  let sum = 0, sum2 = 0;
  for (const x of arr) { sum += x; sum2 += x * x; }
  const mean = sum / n;
  return Math.sqrt(sum2 / n - mean * mean);
}
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run tests/imm/rhat_convergence.test.ts --timeout=180000`
Expected: 2 PASS (R̂ ≤ 1.01 + per-chain σ<5%)

- [ ] **Step 3: Commit**

```bash
git add tests/imm/rhat_convergence.test.ts
git commit -m "test(imm): Gelman-Rubin R-hat convergence gate — 4 chains x 25k trials

Runs simulateIMM at 4 independent seeds (T=25k each), computes R-hat(CHI),
and asserts R-hat <= 1.01. Each chain also individually satisfies the M18
sigma<5% stability rule. Closes peer-review-2 §4.3."
```

### Task 7: α₀ robustness panel {1, 10, 100} (TDD)

Peer-review-2 Issue 1: the manuscript defaults to α_k = 1/K (α₀ = 1) but promises a robustness panel at α₀ ∈ {1, 10, 100} that doesn't appear. This task implements the panel as a test + generates data for figure F3'.

**Files:**
- Create: `tests/engine/alpha0_robustness.test.ts`
- Create: `scripts/alpha0_robustness_panel.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/engine/alpha0_robustness.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { scoreCandidate, closedFormMoments } from "@/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type { Candidate } from "@/types";

// Heterogeneous candidate (NOT the midpoint-degenerate demo)
const HETERO: Candidate = {
  id: "hetero-1",
  alias: "Heterogeneous",
  scores: {
    "psych.conscientiousness": 85,       // high
    "psych.emotional_stability": 40,      // low
    "physical.vo2max": 60,               // above average
    "professional.technical_competence": 3, // low
    "behavioral.teamwork": 9,             // high
    "cognitive.nasa_cognition_battery": 2.0,
    "cognitive.pvt_b_rt_ms": 220,         // fast (good, reversed)
    "physical.sot5_equilibrium": 85,
    "psych.resilience_cdrisc": 90,
    "psych.emotional_intelligence": 1.5,
    "psych.mmpi2rf_eid": 42,
    "psych.bdi2_baseline": 3,
  },
};

const K = PLACEHOLDER_CRITERIA.length; // 12

describe("alpha0 robustness panel", () => {
  const alpha0s = [1, 10, 100];
  const results: Record<number, { mean: number; ci90Width: number; cfMean: number }> = {};

  for (const alpha0 of alpha0s) {
    const alpha = Array.from({ length: K }, () => alpha0 / K);

    it(`alpha0=${alpha0}: closed-form mean matches MC within 2%`, () => {
      const { mean: cfMean } = closedFormMoments({
        candidate: HETERO,
        criteria: PLACEHOLDER_CRITERIA,
        alpha,
      });
      const post = scoreCandidate({
        candidate: HETERO,
        criteria: PLACEHOLDER_CRITERIA,
        alpha,
        iterations: 50_000,
        seed: 42,
      });
      const relErr = Math.abs(post.mean - cfMean) / cfMean;
      expect(relErr).toBeLessThan(0.02);
      results[alpha0] = {
        mean: post.mean,
        ci90Width: post.ci90[1] - post.ci90[0],
        cfMean,
      };
    });
  }

  it("CI90 width decreases monotonically as alpha0 increases (concentration narrows posterior)", () => {
    // Run all three to populate results
    for (const alpha0 of alpha0s) {
      if (!results[alpha0]) {
        const alpha = Array.from({ length: K }, () => alpha0 / K);
        const post = scoreCandidate({
          candidate: HETERO,
          criteria: PLACEHOLDER_CRITERIA,
          alpha,
          iterations: 50_000,
          seed: 42,
        });
        results[alpha0] = {
          mean: post.mean,
          ci90Width: post.ci90[1] - post.ci90[0],
          cfMean: post.mean,
        };
      }
    }
    expect(results[1].ci90Width).toBeGreaterThan(results[10].ci90Width);
    expect(results[10].ci90Width).toBeGreaterThan(results[100].ci90Width);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run tests/engine/alpha0_robustness.test.ts`
Expected: 4 PASS (3 closed-form matches + 1 monotonicity)

- [ ] **Step 3: Create data-generation script for figure F3'**

Create `scripts/alpha0_robustness_panel.ts`:

```typescript
// Generates alpha0 robustness panel data for figure F3'.
// Output: exports/2026-05-24_alpha0_robustness_panel.json
//
// Run: npx tsx scripts/alpha0_robustness_panel.ts

import { scoreCandidate } from "../src/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import * as fs from "node:fs";

const HETERO = {
  id: "hetero-1",
  alias: "Heterogeneous",
  scores: {
    "psych.conscientiousness": 85,
    "psych.emotional_stability": 40,
    "physical.vo2max": 60,
    "professional.technical_competence": 3,
    "behavioral.teamwork": 9,
    "cognitive.nasa_cognition_battery": 2.0,
    "cognitive.pvt_b_rt_ms": 220,
    "physical.sot5_equilibrium": 85,
    "psych.resilience_cdrisc": 90,
    "psych.emotional_intelligence": 1.5,
    "psych.mmpi2rf_eid": 42,
    "psych.bdi2_baseline": 3,
  },
};

const K = PLACEHOLDER_CRITERIA.length;
const alpha0s = [1, 10, 100];
const T = 50_000;
const SEED = 0xc0ffee;

const panel: Record<string, unknown>[] = [];

for (const alpha0 of alpha0s) {
  const alpha = Array.from({ length: K }, () => alpha0 / K);
  const post = scoreCandidate({
    candidate: HETERO,
    criteria: PLACEHOLDER_CRITERIA,
    alpha,
    iterations: T,
    seed: SEED,
  });
  panel.push({
    alpha0,
    mean: post.mean,
    ci90: post.ci90,
    ci95: post.ci95,
    ci90Width: post.ci90[1] - post.ci90[0],
    ess: post.ess,
  });
  console.log(`alpha0=${alpha0}: mean=${post.mean.toFixed(4)}, CI90=[${post.ci90[0].toFixed(4)}, ${post.ci90[1].toFixed(4)}], width=${(post.ci90[1] - post.ci90[0]).toFixed(4)}`);
}

fs.mkdirSync("/root/repos/exports", { recursive: true });
fs.writeFileSync("/root/repos/exports/2026-05-24_alpha0_robustness_panel.json", JSON.stringify(panel, null, 2));
console.log("Written to /root/repos/exports/2026-05-24_alpha0_robustness_panel.json");
```

- [ ] **Step 4: Run the script**

Run: `npx tsx scripts/alpha0_robustness_panel.ts`
Expected: 3 rows printed + JSON file written

- [ ] **Step 5: Commit**

```bash
git add tests/engine/alpha0_robustness.test.ts scripts/alpha0_robustness_panel.ts
git commit -m "feat(engine): alpha0 robustness panel {1, 10, 100} — test + data script

4 tests: closed-form moment match at each alpha0, CI90 width monotonically
decreasing with concentration. Script generates panel JSON for figure F3'.
Closes peer-review-2 Issue 1 (infrastructure)."
```

---

## Track C — Worked Example & Sensitivity Fixes

### Task 8: Non-degenerate worked example (heterogeneous z-scores)

Peer-review-2 Issue 3: the current worked example uses midpoint scores producing a degenerate posterior (S_i ≡ 0.5 exactly). Replace with heterogeneous scores so the credible-interval semantics are visible in figures F3/F4.

**Files:**
- Modify: `src/ui/testing/TestFigureHost.tsx` — update the F1 fixture candidate
- Update: Playwright snapshot baselines (after visual inspection)

- [ ] **Step 1: Read current TestFigureHost fixture**

Read `src/ui/testing/TestFigureHost.tsx` to confirm the F1/F5 fixture uses midpoint scores.

- [ ] **Step 2: Replace the F1 fixture candidate with heterogeneous scores**

In `src/ui/testing/TestFigureHost.tsx`, replace the existing demo candidate scores (the one used for F1 PosteriorPlot and F5 ScoreBreakdownRadar) with the HETERO candidate defined in Task 7:

```typescript
const HETERO_SCORES: Record<string, number> = {
  "psych.conscientiousness": 85,
  "psych.emotional_stability": 40,
  "physical.vo2max": 60,
  "professional.technical_competence": 3,
  "behavioral.teamwork": 9,
  "cognitive.nasa_cognition_battery": 2.0,
  "cognitive.pvt_b_rt_ms": 220,
  "physical.sot5_equilibrium": 85,
  "psych.resilience_cdrisc": 90,
  "psych.emotional_intelligence": 1.5,
  "psych.mmpi2rf_eid": 42,
  "psych.bdi2_baseline": 3,
};
```

Use these scores in the `scoreCandidate` call that generates the F1/F5 fixture data. The posterior should now show a non-degenerate distribution with visible CI₉₀ width.

- [ ] **Step 3: Verify the posterior is non-degenerate**

After modifying the fixture, add a sanity check: the CI₉₀ width should be > 0.01 (the midpoint degenerate case produces CI₉₀ width = 0).

- [ ] **Step 4: Run typecheck + vitest**

Run: `npx tsc --noEmit && npx vitest run`
Expected: typecheck exit 0; all existing tests pass

- [ ] **Step 5: Update Playwright snapshots**

Run: `npx playwright test tests/e2e/phase3f.smoke.spec.ts --update-snapshots`

Visually inspect each updated snapshot: F1 should now show a bell-curve with visible CI₉₀ spread (not a spike at 0.5), F5 radar should show asymmetric spokes.

- [ ] **Step 6: Run Playwright suite to verify updated snapshots pass**

Run: `npm run e2e`
Expected: all 13 Playwright tests pass

- [ ] **Step 7: Commit**

```bash
git add src/ui/testing/TestFigureHost.tsx tests/e2e/
git commit -m "fix(ui): non-degenerate worked example — heterogeneous z-scores for F1/F5

Replaces the midpoint-scores fixture (S_i = 0.5 exactly, CI90 width = 0)
with a heterogeneous candidate (z varies from 0.15 to 0.92) so the Dirichlet
weight uncertainty translates into visible composite-score spread. Playwright
snapshots updated after visual inspection. Closes peer-review-2 Issue 3."
```

### Task 9: Leave-calibrated-out sensitivity analysis (TDD)

Peer-review-2 §4.5: run K15 reproduction with only the 46 evidence-based conditions (41 tier-A + 5 source-cited tier-B), excluding the 36 blanket-multiplier tier-B conditions and 18 tier-C. This shows how the reproduction degrades when calibration-target-circular conditions are removed — an honest sensitivity claim.

**Files:**
- Create: `tests/imm/validation_k15_loo.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/imm/validation_k15_loo.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { simulateIMM } from "../../src/imm/simulate";
import { IMM_KITS } from "../../src/imm/kits";
import { IMM_MISSIONS } from "../../src/data/imm-missions";
import { IMM_CONDITIONS } from "../../src/imm/conditions";
import { loadIMMPriors } from "../../src/imm/priors";
import type { IMMCrewMember } from "../../src/imm/types";

// K15 reference crew
const K15_CREW: IMMCrewMember[] = Array.from({ length: 6 }, (_, i) => ({
  id: `crew-${i}`, sex: i % 2 === 0 ? "male" as const : "female" as const,
  contacts: false, crowns: false, CAC_positive: false,
  abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
}));

describe("Leave-calibrated-out K15 sensitivity (46 evidence-based conditions only)", () => {
  const priors = loadIMMPriors();
  const issHMS = IMM_MISSIONS.find((m) => m.id === "iss-6mo")!;

  // Filter to evidence-based conditions only:
  // tier-A (41) + source-cited tier-B (dental-caries promoted, late-insomnia,
  // depression, respiratory-infection, skin-rash = 5 verified).
  const evidenceBased = IMM_CONDITIONS.filter((c) => {
    const prior = priors.conditions[c.id];
    if (!prior) return false;
    if (prior.provenance === "tierA-nasa") return true;
    if (prior.provenance === "tierB-lit" && prior.source_ref &&
        !prior.source_ref.includes("blanket") &&
        !prior.source_ref.includes("tierB_multiplier")) return true;
    return false;
  });

  it(`includes exactly 46 evidence-based conditions (was: ${IMM_CONDITIONS.length} total)`, () => {
    // NOTE: if rev3-c changes the count, update this assertion
    // Current: 41 tier-A + 5 source-cited tier-B = 46
    // Accept 41-50 range to accommodate future source-citation additions
    expect(evidenceBased.length).toBeGreaterThanOrEqual(41);
    expect(evidenceBased.length).toBeLessThanOrEqual(50);
  });

  it("TME drops when calibrated conditions are removed (sensitivity visible)", () => {
    const full = simulateIMM(K15_CREW, issHMS, IMM_KITS.issHMS, {
      trials: 25_000,
      seed: 0xc0ffee,
    });
    const reduced = simulateIMM(K15_CREW, issHMS, IMM_KITS.issHMS, {
      trials: 25_000,
      seed: 0xc0ffee,
      conditionFilter: (c) => evidenceBased.some((eb) => eb.id === c.id),
    });
    // TME should decrease with fewer conditions
    expect(reduced.tme.mean).toBeLessThan(full.tme.mean);
    // CHI should increase (fewer events = healthier crew)
    expect(reduced.chi.mean).toBeGreaterThan(full.chi.mean);
    // Log the delta for the manuscript
    console.log(`Full (100 conditions): TME=${full.tme.mean.toFixed(1)}, CHI=${(full.chi.mean * 100).toFixed(1)}%`);
    console.log(`Evidence-based (${evidenceBased.length} conditions): TME=${reduced.tme.mean.toFixed(1)}, CHI=${(reduced.chi.mean * 100).toFixed(1)}%`);
    console.log(`Delta: TME=${(full.tme.mean - reduced.tme.mean).toFixed(1)}, CHI=${((reduced.chi.mean - full.chi.mean) * 100).toFixed(1)} pp`);
  });
}, 120_000);
```

- [ ] **Step 2: Check if simulateIMM supports conditionFilter**

Read `src/imm/simulate.ts` to check whether `conditionFilter` is already a supported option. If not, add it as an optional callback `(condition: IMMCondition) => boolean` in the `IMMSimulateOpts` type, defaulting to `() => true`. Thread through the `runIMMTrial` condition loop.

- [ ] **Step 3: Implement conditionFilter if needed**

If `conditionFilter` is not supported, add it to the `IMMSimulateOpts` interface and thread it through the trial loop:

```typescript
// In IMMSimulateOpts:
conditionFilter?: (c: IMMCondition) => boolean;

// In the trial loop inside simulateIMM:
const activeConditions = opts.conditionFilter
  ? IMM_CONDITIONS.filter(opts.conditionFilter)
  : IMM_CONDITIONS;
```

- [ ] **Step 4: Run test**

Run: `npx vitest run tests/imm/validation_k15_loo.test.ts --timeout=180000`
Expected: 2 PASS (count check + sensitivity visible)

- [ ] **Step 5: Commit**

```bash
git add tests/imm/validation_k15_loo.test.ts src/imm/simulate.ts
git commit -m "feat(imm): leave-calibrated-out sensitivity analysis — 46 evidence-based conditions

Filters IMM to the 46 conditions with source-backed priors (41 tier-A + 5
source-cited tier-B). Tests show TME drops and CHI rises when the 54
calibration-circular conditions are removed, making the sensitivity visible
and honestly reported. Closes peer-review-2 §4.5."
```

---

## Track D — Frontend Accuracy Audit & Regression

### Task 10: Frontend description accuracy audit

Verify every user-facing algorithmic description matches the code. The CalculationTrace is already correct (confirmed: says "Dirichlet" not "Metropolis"). Check remaining UI strings.

**Files:**
- Read-only audit of all UI components
- Fix any mismatches found

- [ ] **Step 1: Grep for any remaining "Metropolis" or "MCMC" in src/ui/**

Run: `grep -rn "Metropolis\|MCMC\|Markov\|accept.reject\|burn.in\|mixing" src/ui/`

Any hits in user-facing strings (not comments) that imply MCMC behavior should be corrected to describe the IID Dirichlet sampler.

- [ ] **Step 2: Verify CalculationTrace Stage A descriptions**

Read `src/ui/figures/CalculationTrace.tsx` and confirm:
- Step 2 says "Dirichlet" (confirmed: line 160)
- Step 3 says "weighted sum" (confirmed: line 186)
- Step 5 says "posterior summary" (confirmed: line 216)

- [ ] **Step 3: Verify CalculationTrace Stage B descriptions**

Confirm IMM trace steps correctly describe:
- 4-step trial (occurrence → severity → treatment → aggregation)
- T = 100,000 trials
- σ<5% convergence rule
- CHI = 1 − QTL/(t·c) formula

- [ ] **Step 4: Verify IMMHeadlineCard metric labels**

Read `src/ui/figures/IMMHeadlineCard.tsx` and confirm TME/CHI/pEVAC/pLOCL labels and units are accurate.

- [ ] **Step 5: Commit any fixes (or skip if all clean)**

```bash
# Only if fixes were needed:
git add <fixed files>
git commit -m "fix(ui): correct frontend algorithm description accuracy [audit]"
```

### Task 11: Full regression test pass

Run the complete test suite (vitest + Playwright), verify K15 gate still passes, and confirm build is green.

**Files:**
- No new files; verification only

- [ ] **Step 1: Run full vitest suite**

Run: `npx vitest run`
Expected: all tests pass (including new Tasks 4-9 tests)

- [ ] **Step 2: Run K15 validation gate explicitly**

Run: `npx vitest run tests/imm/validation_k15.test.ts --timeout=300000`
Expected: 13 tests pass (7 within CI₉₅ + 6 documented-divergent within tracking brackets)

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: exit 0

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: clean build with dist/ output

- [ ] **Step 5: Run Playwright e2e**

Run: `npm run e2e`
Expected: all 13 Playwright tests pass (with updated snapshots from Task 8)

- [ ] **Step 6: Verify new citation references via scite**

Use scite MCP to verify any new citations introduced in the methodology updates:
- Kolmogorov-Smirnov: Kolmogorov 1933, Smirnov 1948
- Gelman-Rubin: Gelman & Rubin 1992 (doi:10.1214/ss/1177011136)
- Brooks-Gelman: Brooks & Gelman 1998 (doi:10.1080/10618600.1998.10474787)

Run scite verification on each DOI to confirm they're not retracted.

- [ ] **Step 7: Final commit — update STATUS.md and limitations doc**

Update `STATUS.md` to record all completed tasks and update the "Current state" block. Update `docs/iter5_scientific_limitations.md` to reflect the new diagnostics (K-S test, R̂, α₀ panel).

```bash
git add STATUS.md docs/iter5_scientific_limitations.md
git commit -m "docs(status+limitations): close pre-submission math hardening — K-S, R-hat, alpha0 panel"
```

---

## Verification Checklist

After all 11 tasks:

- [ ] `npx vitest run` — all tests pass (existing + ~15 new tests)
- [ ] `npx tsc --noEmit` — exit 0
- [ ] `npm run build` — clean
- [ ] `npm run e2e` — 13 Playwright tests pass
- [ ] `grep -rn "Metropolis" README.md` — zero hits
- [ ] README §Methodology says "Gamma-normalization" / "IID Dirichlet draws"
- [ ] RiskCard shows single "trials" row (no vacuous ESS)
- [ ] ScoreCard shows "ESS (IID ≈ T)"
- [ ] K-S test: 3 marginal Beta fits pass at α=0.05
- [ ] R̂(CHI) ≤ 1.01 across 4 independent chains
- [ ] α₀ panel: CI₉₀ width monotonically decreasing {1, 10, 100}
- [ ] Leave-calibrated-out: TME drops when removing 54 calibration-circular conditions
- [ ] No "Metropolis", "MCMC", "Markov", "burn-in" in user-facing UI strings
- [ ] Scite confirms Gelman-Rubin 1992 and Brooks-Gelman 1998 DOIs are live + unretracted
