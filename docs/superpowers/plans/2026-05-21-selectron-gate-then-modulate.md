# Selectron Gate-then-Modulate Architecture — Critical Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the missing select-out gate layer into Selectron so unfit candidates are excluded BEFORE Stage B runs, and amplify the candidate-quality modulation amplitude so passed candidates still produce visibly different outcomes by quality level. Resolves the "bad candidate on Antarctic/Mars goes green" architectural bug.

**Why this is critical:** Reproducer (`scripts/reproducer_bad_candidate.ts`, commit `c4de4a9`) demonstrates that the existing Stage B treats candidate quality as effectively orthogonal to mission outcome — worst-vs-best CHI delta of 0.12pp on Antarctic winter-over, both green. Advisor confirmed the math for a *qualified* candidate is correct (Palinkas 2004 ~6% Antarctic psychiatric incidence × 12-crew × 365-day → CHI ≈ 99.6%, matching engine output). The defect is the missing gate layer — NASA's actual selection process disqualifies on binary clearances; Selectron currently does not.

**Architecture:** Two-stage decision:

1. **Gate evaluation (NEW)** runs BEFORE Stage B Monte Carlo. Any failed binary clearance returns `{verdict: "DISQUALIFIED", failedGates: [...]}` and the LxC verdict is RED on principle, no simulation run.
2. **Stage B modulation (AMPLIFIED)** runs for candidates who pass all gates. Amplitude bumped via β increase + z-score normalization + non-zero β for all coupled condition families, so passed-but-poor candidates still produce visibly worse outcomes.

**Scope discipline:** This plan does NOT touch the new IMM Calculator module (`src/imm/`). The IMM Calculator's UI work (P2 of `2026-05-20-selectron-imm-calculator.md`) is paused. Once this gate-then-modulate fix lands and validates, the IMM Calculator plan can resume — and the IMM Calculator's vulnerability mode (Phase A2) will inherit the same gate logic.

**Branch:** `iter1-phase0` (continuation). No worktree.

**Commit convention:** `feat(gate): …` for new gate code, `fix(coupling): …` for amplitude/normalization fixes, `test(gate): …` for tests, `docs(gate): …` for prose.

---

## Task G1: GateResult type system + binary-gate criteria flags

**Files:**
- Modify: `src/types/index.ts` or `src/types/scenario.ts` (add `GateResult`, `GateOutcome`)
- Modify: `src/types/index.ts` or `src/data/placeholder-criteria.ts` Criterion type (add `gateThreshold?: { operator: "fail-if-below" | "fail-if-above"; value: number }`)
- Create: `tests/types/gate_types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/types/gate_types.test.ts
import { describe, it, expect } from "vitest";
import type { GateResult, Criterion } from "../../src/types";

describe("Gate types", () => {
  it("GateResult shape", () => {
    const r: GateResult = { verdict: "qualified", failedGates: [], evaluated: ["psych.psychopathology_clearance"] };
    expect(r.verdict).toBe("qualified");
  });
  it("Criterion.gateThreshold optional field", () => {
    const c: Criterion = {
      id: "psych.psychopathology_clearance",
      family: "psychological",
      label: "MMPI-2-RF psychopathology select-out",
      description: "...",
      instrument: "MMPI-2-RF Police Officer Selection Report",
      scale: { min: 0, max: 1 },
      higherIsBetter: true,
      citations: ["10.1037/pas0000013"],
      minimumTier: "elite",
      gateThreshold: { operator: "fail-if-below", value: 0.5 },
    };
    expect(c.gateThreshold).toBeDefined();
  });
});
```

- [ ] **Step 2: Run → fail**

Run: `npx vitest run tests/types/gate_types.test.ts`

- [ ] **Step 3: Add types**

In the appropriate type file:
```ts
export type GateVerdict = "qualified" | "disqualified";
export type GateResult = {
  verdict: GateVerdict;
  failedGates: string[];   // criterion ids that failed
  evaluated: string[];     // all criterion ids whose gateThreshold was checked
  notes?: string;
};
```

In `Criterion`:
```ts
gateThreshold?: { operator: "fail-if-below" | "fail-if-above"; value: number };
```

- [ ] **Step 4: Run → pass; typecheck clean**

- [ ] **Step 5: Commit**
```
git add src/types/ tests/types/gate_types.test.ts
git commit -m "feat(gate): GateResult + Criterion.gateThreshold types"
```

---

## Task G2: Gate engine — `evaluateGates(candidate, criteria)`

**Files:**
- Create: `src/engine/gates.ts`
- Create: `tests/engine/gates.test.ts`

- [ ] **Step 1: Test cases**

```ts
// tests/engine/gates.test.ts
import { describe, it, expect } from "vitest";
import { evaluateGates } from "../../src/engine/gates";
import type { Criterion } from "../../src/types";

const mmpi: Criterion = {
  id: "psych.psychopathology_clearance",
  family: "psychological", label: "MMPI",
  description: "", instrument: "",
  scale: { min: 0, max: 1 }, higherIsBetter: true,
  citations: [], minimumTier: "elite",
  gateThreshold: { operator: "fail-if-below", value: 0.5 },
};
const gma: Criterion = {
  id: "cognitive.gma_threshold",
  family: "cognitive", label: "GMA",
  description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true,
  citations: [], minimumTier: "elite",
  gateThreshold: { operator: "fail-if-below", value: 40 },
};
const noGate: Criterion = {
  id: "psych.bigfive.conscientiousness",
  family: "psychological", label: "Conscientiousness",
  description: "", instrument: "",
  scale: { min: 0, max: 100 }, higherIsBetter: true,
  citations: [], minimumTier: "minimum",
};

describe("evaluateGates", () => {
  it("qualified when all gates pass", () => {
    const r = evaluateGates({ id: "c1", alias: "c1", scores: { "psych.psychopathology_clearance": 1, "cognitive.gma_threshold": 70 } }, [mmpi, gma, noGate]);
    expect(r.verdict).toBe("qualified");
    expect(r.failedGates).toEqual([]);
    expect(r.evaluated).toEqual(["psych.psychopathology_clearance", "cognitive.gma_threshold"]);
  });
  it("disqualified on MMPI fail", () => {
    const r = evaluateGates({ id: "c2", alias: "c2", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 70 } }, [mmpi, gma]);
    expect(r.verdict).toBe("disqualified");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
  });
  it("disqualified collects ALL failed gates, not just first", () => {
    const r = evaluateGates({ id: "c3", alias: "c3", scores: { "psych.psychopathology_clearance": 0, "cognitive.gma_threshold": 30 } }, [mmpi, gma]);
    expect(r.failedGates.length).toBe(2);
  });
  it("missing score for a gated criterion → disqualified with E_MISSING_SCORE in notes", () => {
    const r = evaluateGates({ id: "c4", alias: "c4", scores: {} }, [mmpi]);
    expect(r.verdict).toBe("disqualified");
    expect(r.failedGates).toContain("psych.psychopathology_clearance");
    expect(r.notes).toMatch(/missing/i);
  });
  it("skip criteria without gateThreshold", () => {
    const r = evaluateGates({ id: "c5", alias: "c5", scores: { "psych.bigfive.conscientiousness": 50 } }, [noGate]);
    expect(r.evaluated).toEqual([]);
    expect(r.verdict).toBe("qualified");
  });
});
```

- [ ] **Step 2: Run → fail**

- [ ] **Step 3: Implement**

```ts
// src/engine/gates.ts
import type { Candidate, Criterion, GateResult } from "../types";

export function evaluateGates(candidate: Candidate, criteria: readonly Criterion[]): GateResult {
  const failedGates: string[] = [];
  const evaluated: string[] = [];
  const missingNotes: string[] = [];

  for (const c of criteria) {
    if (!c.gateThreshold) continue;
    evaluated.push(c.id);
    const score = candidate.scores[c.id];
    if (score === undefined || !Number.isFinite(score)) {
      failedGates.push(c.id);
      missingNotes.push(`missing score for ${c.id}`);
      continue;
    }
    const { operator, value } = c.gateThreshold;
    const fails = operator === "fail-if-below" ? score < value : score > value;
    if (fails) failedGates.push(c.id);
  }

  return {
    verdict: failedGates.length === 0 ? "qualified" : "disqualified",
    failedGates,
    evaluated,
    ...(missingNotes.length > 0 ? { notes: missingNotes.join("; ") } : {}),
  };
}
```

- [ ] **Step 4: Run → pass; typecheck clean**

- [ ] **Step 5: Commit**
```
git add src/engine/gates.ts tests/engine/gates.test.ts
git commit -m "feat(gate): evaluateGates engine — binary clearance check with failed-gate collection"
```

---

## Task G3: Wire gates into PLACEHOLDER_CRITERIA

**Files:**
- Modify: `src/data/placeholder-criteria.ts`

Set `gateThreshold` on the criteria that should be hard gates per NASA / clinical convention:

| Criterion id | Gate threshold | Rationale |
|---|---|---|
| `psych.psychopathology_clearance` (rename existing `psych.mmpi-2-rf-eid` or add new binary 0/1) | `fail-if-below: 0.5` | MMPI-2-RF psychopathology select-out — binary pass/fail per research/02_criterion_taxonomy.md |
| `psych.bigfive.emotional_stability` | `fail-if-below: 30` (T-score floor) | Emotional stability T-score < 30 (3 SDs below mean) is operationally disqualifying for long-duration confinement per OCHMO-STD-100.1A |
| `cognitive.nasa_cognition_battery` | `fail-if-below: -2.0` (z-score floor) | Composite z < -2 (2 SDs below astronaut cohort) is disqualifying per Basner 2015 NASA Cognition normative data |
| `cognitive.pvt_b_lapses` (if exists; check current taxonomy) | `fail-if-above: 8` | PVT-B lapse count > 8 in 3-min test = high-fatigue baseline; disqualifying per Dinges PVT operational threshold |
| `medical.binary_clearance` (NEW — single binary criterion that aggregates all hard medical disqualifiers: cardiac, vision, vestibular) | `fail-if-below: 0.5` | NASA medical-clearance binary; consolidates OCHMO standards. |

- [ ] **Step 1: Audit current criteria — list all 12 with their scale + label**

Run: `grep -E 'id:|scale:|label:' src/data/placeholder-criteria.ts | head -60`

- [ ] **Step 2: Add `gateThreshold` to the four/five gate criteria above. Where the criterion doesn't exist yet (e.g., `medical.binary_clearance`), add it as a new entry with binary 0/1 scale.**

- [ ] **Step 3: If a renamed criterion would break MCDA scoring (criterion ids referenced elsewhere) — DO NOT rename. Add `gateThreshold` to the existing criterion as-is.**

- [ ] **Step 4: Run existing tests to verify nothing else broke**

```
npx vitest run tests/engine/placeholder-criteria.test.ts && npm run typecheck
```

- [ ] **Step 5: Commit**
```
git add src/data/placeholder-criteria.ts
git commit -m "feat(gate): wire gateThreshold on psychiatric, cognitive, and medical clearance criteria"
```

---

## Task G4: LxC mapper accepts gate verdict + returns RED on disqualified

**Files:**
- Modify: `src/risk/lxc.ts` — extend `assessLxC` signature to accept optional `GateResult`; if `gate.verdict === "disqualified"`, return `{ likelihood: 5, consequence: 5, score: 25, color: "red", reason: `disqualified: ${gate.failedGates.join(", ")}` }`
- Modify: `src/risk/lxc-definitions.ts` if the LxCResult type doesn't already carry a `reason`/`disqualified` field — add `disqualified?: boolean`
- Modify: `tests/risk/lxc.test.ts` — add 2 new tests

- [ ] **Step 1: Add failing test for disqualified-RED path**

```ts
// append to tests/risk/lxc.test.ts
import { assessLxC } from "../../src/risk/lxc";
describe("assessLxC with gate verdict", () => {
  it("disqualified gate → red regardless of CHI", () => {
    const post = { chi: { mean: 0.99, ci90: [0.99, 0.99], ci95: [0.99, 0.99] }, pEarlyTermination: { mean: 0, ci90: [0,0] }, expectedLostCrewDays: { mean: 0, ci90: [0,0] }, perConditionQTL: {}, ess: 1000, trials: 1000 } as any;
    const result = assessLxC(post, { verdict: "disqualified", failedGates: ["psych.psychopathology_clearance"], evaluated: ["psych.psychopathology_clearance"] });
    expect(result.color).toBe("red");
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.disqualified).toBe(true);
  });
  it("qualified gate → normal LxC computation", () => {
    const post = { chi: { mean: 0.99, ci90: [0.99, 0.99], ci95: [0.99, 0.99] }, pEarlyTermination: { mean: 0, ci90: [0,0] }, expectedLostCrewDays: { mean: 0, ci90: [0,0] }, perConditionQTL: {}, ess: 1000, trials: 1000 } as any;
    const result = assessLxC(post, { verdict: "qualified", failedGates: [], evaluated: [] });
    expect(result.color).toBe("green");
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/risk/lxc.ts — extend assessLxC
export function assessLxC(posterior: RiskPosterior, gate?: GateResult): LxCResult {
  if (gate?.verdict === "disqualified") {
    return {
      likelihood: 5, consequence: 5, score: 25, color: "red",
      likelihoodLabel: "≥10% (disqualified)", consequenceLabel: "Loss of mission (disqualified)",
      fractionLost: 1.0,
      disqualified: true,
      reason: `disqualified: ${gate.failedGates.join(", ")}`,
    };
  }
  // ... existing logic ...
}
```

- [ ] **Step 3: Run + commit**

```
npx vitest run tests/risk/lxc.test.ts
git add src/risk/lxc.ts src/risk/lxc-definitions.ts tests/risk/lxc.test.ts
git commit -m "feat(gate): assessLxC returns RED disqualified verdict when gate fails"
```

---

## Task G5: Z-score normalization helper for vulnerability vector

**Files:**
- Create: `src/engine/normalize-cohort.ts`
- Modify: `src/risk/simulate.ts` (replace `vulnerabilityVector` to call the new normalizer)
- Create: `tests/engine/normalize_cohort.test.ts`

- [ ] **Step 1: Test**

```ts
import { describe, it, expect } from "vitest";
import { zScoreAgainstScale } from "../../src/engine/normalize-cohort";

describe("zScoreAgainstScale", () => {
  it("midpoint → 0", () => {
    expect(zScoreAgainstScale(50, { min: 0, max: 100 })).toBe(0);
  });
  it("max → +2 (operational range = ±2 SD)", () => {
    expect(zScoreAgainstScale(100, { min: 0, max: 100 })).toBe(2);
  });
  it("min → -2", () => {
    expect(zScoreAgainstScale(0, { min: 0, max: 100 })).toBe(-2);
  });
  it("works for non-zero-anchored scales", () => {
    expect(zScoreAgainstScale(60, { min: 20, max: 70 })).toBeCloseTo(1.2, 5);
  });
});
```

- [ ] **Step 2: Implement**

```ts
// src/engine/normalize-cohort.ts
export function zScoreAgainstScale(raw: number, scale: { min: number; max: number }): number {
  const mid = (scale.min + scale.max) / 2;
  const range = scale.max - scale.min;
  if (range <= 0) return 0;
  // Treat the scale's operational range as ±2 SD (4 SDs total)
  return ((raw - mid) / range) * 4;
}
```

- [ ] **Step 3: Update `vulnerabilityVector` in src/risk/simulate.ts to z-score**

Modify lines 70-81 of simulate.ts:

```ts
function vulnerabilityVector(
  member: Candidate,
  criterionIds: readonly string[],
  criteriaIndex: Map<string, Criterion>,
): Record<string, number> {
  const z: Record<string, number> = {};
  for (const cid of criterionIds) {
    const raw = member.scores[cid];
    const c = criteriaIndex.get(cid);
    if (raw === undefined || !Number.isFinite(raw) || !c) continue;
    const zVal = zScoreAgainstScale(raw, c.scale);
    z[cid] = c.higherIsBetter ? -zVal : zVal;  // higher-is-better criterion: HIGH raw → LOW vulnerability → negative z
  }
  return z;
}
```

Pass the `criteriaIndex` through from `simulateMission`.

- [ ] **Step 4: Add coupling-amplitude test**

```ts
// tests/risk/coupling_amplitude.test.ts
import { describe, it, expect } from "vitest";
import { simulateMission } from "../../src/risk/simulate";
import { synthesizeCrew, SYNTHETIC_PRIORS } from "../../src/data/synthetic-iter3";
import { ANALOG_MISSIONS } from "../../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../../src/risk/conditions";
import { PLACEHOLDER_CRITERIA } from "../../src/data/placeholder-criteria";

describe("coupling amplitude (post-G5+G6 fix)", () => {
  it("worst-vs-best CHI delta on hi-seas-45d ≥ 5 percentage points", () => {
    const buildCand = (frac: number) => {
      const scores: Record<string, number> = {};
      for (const c of PLACEHOLDER_CRITERIA) {
        const v = c.higherIsBetter
          ? c.scale.min + frac * (c.scale.max - c.scale.min)
          : c.scale.max - frac * (c.scale.max - c.scale.min);
        scores[c.id] = v;
      }
      return { id: `cand-${frac}`, alias: `cand-${frac}`, scores };
    };
    const m = ANALOG_MISSIONS.find(x => x.id === "hi-seas-45d")!;
    const worst = simulateMission(synthesizeCrew(buildCand(0), m.crewSize), m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 5000, chiStar: 0.7 });
    const best  = simulateMission(synthesizeCrew(buildCand(1), m.crewSize), m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 5000, chiStar: 0.7 });
    const delta = best.chi.mean - worst.chi.mean;
    expect(delta * 100).toBeGreaterThanOrEqual(5);  // at least 5pp spread
  }, 60_000);
});
```

This test WILL FAIL after G5 (z-score normalization) alone — G6 (β amplification) is the second half. Both tasks together make it pass.

- [ ] **Step 5: Commit (the coupling test goes into a "deferred" state until G6 lands)**

```
git add src/engine/normalize-cohort.ts src/risk/simulate.ts tests/engine/normalize_cohort.test.ts tests/risk/coupling_amplitude.test.ts
git commit -m "fix(coupling): z-score Stage A scores against criterion scale before vulnerability product"
```

---

## Task G6: Amplify `vulnerability_beta` magnitudes in SYNTHETIC_PRIORS

**Files:**
- Modify: `src/data/synthetic-iter3.ts`

- [ ] **Step 1: Replace the conservative β = -0.05 (psychiatric only) / 0.0 (everything else) with family-specific values**

Current line 56-62:
```ts
c.vulnerabilityCriteria.map((cid) => [
  cid,
  c.family === "psychiatric" ? -0.05 : 0.0,
]),
```

New:
```ts
c.vulnerabilityCriteria.map((cid) => [
  cid,
  // Negative β: higher-is-better Selectron criterion (already z-scored) → lower vulnerability
  c.family === "psychiatric"      ? -0.4 :
  c.family === "behavioral"       ? -0.3 :
  c.family === "infectious"       ? -0.25 :  // immune coupling
  c.family === "musculoskeletal"  ? -0.2 :   // VO2max coupling
  c.family === "neurologic"       ? -0.3 :
  c.family === "GI"               ? -0.15 :
  c.family === "cardiovascular"   ? -0.25 :
  c.family === "respiratory"      ? -0.2 :
  c.family === "renal"            ? -0.15 :
                                    -0.2,    // default for any unmentioned family
]),
```

The signs assume z-scored higher-is-better Selectron criteria; with the G5 z-score flip, a high-quality candidate has z ≈ +2, β · z ≈ -0.8, multiplier exp(-0.8) ≈ 0.45 (45% incidence). A low-quality candidate at z ≈ -2 yields multiplier exp(+0.8) ≈ 2.23. **3.6× spread between worst and best — meaningful.**

- [ ] **Step 2: Re-run the coupling amplitude test (added in G5)**

Run: `npx vitest run tests/risk/coupling_amplitude.test.ts`
Expected: PASS — worst-vs-best CHI delta ≥ 5pp on hi-seas-45d.

- [ ] **Step 3: Re-run the reproducer**

Run: `npx tsx scripts/reproducer_bad_candidate.ts 2>&1 | tail -40`

Verify (paste output in commit message):
- Antarctic + Mars500 still green for BEST (correct — qualified candidates should pass long missions with adequate medical kit)
- Antarctic + Mars500 now yellow or red for WORST (the disqualified-mode reproducer test below adds the explicit gate check)
- Delta worst-vs-best CHI ≥ 5pp on hi-seas-45d, ≥ 3pp on hi-seas-90d.

- [ ] **Step 4: Commit**

```
git add src/data/synthetic-iter3.ts
git commit -m "fix(coupling): amplify vulnerability_beta to family-specific operational magnitudes"
```

---

## Task G7: Wire gates into the Mission risk view

**Files:**
- Modify: `src/ui/views/Sim.tsx` or wherever the "Run Simulation" button + LxC verdict display lives. Search for `assessLxC(` to find the call site.

- [ ] **Step 1: Find and edit the call site**

Run: `grep -rn 'assessLxC(' src/ui/ src/risk/`

Wherever `assessLxC(post)` is called for the user-facing verdict, prepend a gate evaluation:

```tsx
import { evaluateGates } from "../../engine/gates";
import { PLACEHOLDER_CRITERIA } from "../../data/placeholder-criteria";
// ...
const gate = evaluateGates(candidate, PLACEHOLDER_CRITERIA);
const lxc = assessLxC(post, gate);
// ...
{gate.verdict === "disqualified" && (
  <div className="panel border-red-500 bg-red-50 mt-3 p-4 rounded">
    <strong>DISQUALIFIED</strong> — candidate failed the following clearance gates:
    <ul className="mt-2 list-disc list-inside">
      {gate.failedGates.map(g => <li key={g} className="font-mono text-sm">{g}</li>)}
    </ul>
    Stage B Monte Carlo was not run. LxC verdict: RED on principle.
  </div>
)}
```

- [ ] **Step 2: Add Playwright/RTL smoke that the disqualified banner appears for a candidate with `psych.psychopathology_clearance: 0`**

- [ ] **Step 3: Commit**

```
git add src/ui/views/Sim.tsx tests/ui/ ...
git commit -m "feat(gate-ui): disqualified-banner + LxC RED override in Mission risk view"
```

---

## Task G8: Reproducer rerun + acceptance gate

**Files:**
- Modify: `scripts/reproducer_bad_candidate.ts` — add a 4th candidate level "DISQUALIFIED" (sets `psych.psychopathology_clearance = 0`) and explicitly evaluates the gate
- Update STATUS.md

- [ ] **Step 1: Extend the reproducer**

Append at the top of the missions loop:

```ts
const DISQUALIFIED = (() => {
  const c = buildCandidate("DISQ", 0.5);  // average everywhere
  c.scores["psych.psychopathology_clearance"] = 0;  // fail the gate
  return c;
})();
```

And in the per-mission loop, add DISQUALIFIED to the candidates tested. Print its gate result alongside the LxC verdict.

- [ ] **Step 2: Run**

```
npx tsx scripts/reproducer_bad_candidate.ts 2>&1 | tail -50
```

**Acceptance criteria:**
- WORST candidate (all bad scores but psychiatric_clearance = 1 → passes gate) produces LxC yellow OR red on Antarctic / Mars / hi-seas-90d (long-duration mode). hi-seas-45d worst delta ≥ 5pp.
- DISQUALIFIED candidate (psychiatric_clearance = 0) produces LxC RED on every mission, with `disqualified: true` flag set.
- BEST candidate still green everywhere.

- [ ] **Step 3: Commit acceptance evidence + status update**

Append the reproducer output to STATUS.md under a new section "Gate-then-modulate validation". Mark the gate-then-modulate plan complete.

```
git add scripts/reproducer_bad_candidate.ts STATUS.md
git commit -m "test(gate): reproducer acceptance — WORST yellow/red on long missions, DISQUALIFIED red, BEST green"
```

---

## Task G9: V&V dossier update + push

**Files:**
- Modify: `docs/iter3_vv_dossier.md` — add a new §6 "Gate-then-modulate architecture (2026-05-21)"
- Push

- [ ] **Step 1: Append to V&V dossier**

```markdown
## 6. Gate-then-modulate architecture (added 2026-05-21)

### 6.1 Defect that triggered this revision
Reproducer (scripts/reproducer_bad_candidate.ts, commit c4de4a9) showed WORST and BEST candidates produced identical green LxC verdicts on Antarctic winter-over and Mars500. Worst-vs-best CHI delta: 0.12 pp.

### 6.2 Root cause
Three architectural defects:
1. `synthesizeCrew` (`src/data/synthetic-iter3.ts`) set `vulnerability_beta = 0` for non-psychiatric families.
2. Stage A scores passed raw without z-score normalisation.
3. No select-out gates: the criterion `psych.psychopathology_clearance` existed in the taxonomy (research/02_criterion_taxonomy.md) but was never wired as a binary exclusion.

### 6.3 Fix applied
- Tasks G1–G9 of docs/superpowers/plans/2026-05-21-selectron-gate-then-modulate.md.
- New module `src/engine/gates.ts` evaluates binary clearance gates before Stage B.
- `assessLxC` accepts a `GateResult` and returns RED on disqualification.
- `vulnerabilityVector` now z-scores against criterion scale (zScoreAgainstScale).
- `vulnerability_beta` magnitudes amplified family-specifically (-0.15 to -0.4 against z-scored inputs).

### 6.4 Post-fix validation
- Reproducer shows WORST candidate yellow/red on long missions, DISQUALIFIED candidate red everywhere, BEST candidate green everywhere.
- Coupling amplitude test (`tests/risk/coupling_amplitude.test.ts`) asserts CHI worst-vs-best spread ≥ 5pp on hi-seas-45d.
```

- [ ] **Step 2: Push**

```
git push origin iter1-phase0
```

- [ ] **Step 3: Commit + push**

```
git add docs/iter3_vv_dossier.md
git commit -m "docs(gate): V&V dossier §6 — gate-then-modulate architecture record"
git push origin iter1-phase0
```

---

## Acceptance criteria (plan-level)

1. New types: `GateResult`, `Criterion.gateThreshold`.
2. `src/engine/gates.ts::evaluateGates` returns qualified/disqualified verdict.
3. At least 3 criteria have `gateThreshold` wired (psych clearance, GMA, NASA Cognition floor).
4. `assessLxC` honors the gate verdict — RED on disqualified, normal computation otherwise.
5. `vulnerabilityVector` z-scores against scale before β·z.
6. `vulnerability_beta` magnitudes amplified family-specifically (no longer 0 for non-psych).
7. Mission risk UI shows DISQUALIFIED banner + LxC RED override.
8. Reproducer demonstrates: worst yellow/red on long mission, disqualified red, best green.
9. All vitest + typecheck + build green.

After acceptance, the IMM Calculator P2 UI plan (`2026-05-20-selectron-imm-calculator.md`) can resume — its Vulnerability mode (T48, T62, T63) will inherit the same gate logic via the shared `evaluateGates` + `GateResult` types.

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-21-selectron-gate-then-modulate.md`.**
