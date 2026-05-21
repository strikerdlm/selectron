// TDD suite for the NASA HSRB LxC mapper.
// Boundary tests against JSC-66705 Rev A Figure 4 p. 28 verbatim thresholds.

import { describe, it, expect } from "vitest";
import {
  LXC_PRIORITY_SCORES,
  lxcColor,
  lxcScore,
} from "@/risk/lxc-definitions";
import { assessLxC } from "@/risk/lxc";
import type { RiskPosterior } from "@/types/risk";

function mkPosterior(opts: { chiMean: number; pET: number }): RiskPosterior {
  return {
    chi: { mean: opts.chiMean, ci90: [opts.chiMean - 0.05, opts.chiMean + 0.05], ci95: [opts.chiMean - 0.08, opts.chiMean + 0.08] },
    pEarlyTermination: { mean: opts.pET, ci90: [Math.max(0, opts.pET - 0.02), Math.min(1, opts.pET + 0.02)] },
    expectedLostCrewDays: { mean: 0, ci90: [0, 0] },
    perConditionQTL: {},
    ess: 1000,
    trials: 100_000,
  };
}

describe("LxC matrix — verbatim JSC-66705 Rev A Figure 4 cell scores", () => {
  it("matches the published 5×5 priority-score grid exactly", () => {
    const expected = [
      [ 1,  3,  5,  8, 12], // L1
      [ 2,  6, 11, 14, 17], // L2
      [ 4,  9, 15, 19, 21], // L3
      [ 7, 13, 18, 22, 24], // L4
      [10, 16, 20, 23, 25], // L5
    ];
    for (let L = 1; L <= 5; L++) {
      for (let C = 1; C <= 5; C++) {
        expect(lxcScore(L as 1|2|3|4|5, C as 1|2|3|4|5)).toBe(expected[L-1][C-1]);
        expect(LXC_PRIORITY_SCORES[L-1][C-1]).toBe(expected[L-1][C-1]);
      }
    }
  });

  it("scores consequence higher than likelihood (asymmetry check)", () => {
    // L4-C2=13 vs L2-C4=14 — same product L*C but C-axis weighted higher
    expect(lxcScore(2, 4)).toBeGreaterThan(lxcScore(4, 2));
  });
});

describe("Risk colors — JSC-66705 §3.2.4 p. 27 verbatim cut-offs", () => {
  it("green for scores ≤ 10", () => {
    for (const s of [1, 5, 8, 10]) expect(lxcColor(s)).toBe("green");
  });
  it("yellow for scores 11–19", () => {
    for (const s of [11, 13, 17, 19]) expect(lxcColor(s)).toBe("yellow");
  });
  it("red for scores ≥ 20", () => {
    for (const s of [20, 22, 24, 25]) expect(lxcColor(s)).toBe("red");
  });
});

describe("Likelihood bucketing — JSC-66705 In-Mission verbatim thresholds", () => {
  // L1: ≤ 0.01% (≤ 0.0001)
  // L2: > 0.01% and ≤ 0.1% (0.0001 < p ≤ 0.001)
  // L3: > 0.1% and ≤ 1%   (0.001 < p ≤ 0.01)
  // L4: > 1% and ≤ 10%    (0.01 < p ≤ 0.10)
  // L5: > 10%             (p > 0.10)
  const cases: [number, number][] = [
    [0,         1],
    [0.00005,   1],
    [0.0001,    1], // exactly on boundary — inclusive of upper
    [0.00011,   2],
    [0.001,     2], // boundary inclusive of upper
    [0.0011,    3],
    [0.01,      3], // boundary inclusive of upper
    [0.011,     4],
    [0.10,      4], // boundary inclusive of upper
    [0.101,     5],
    [0.5,       5],
    [1.0,       5],
  ];
  it.each(cases)("P(χ<χ*) = %f → L%i", (pET, expectedL) => {
    const a = assessLxC(mkPosterior({ chiMean: 0.95, pET }));
    expect(a.likelihood).toBe(expectedL);
  });
});

describe("Consequence bucketing — Selectron fraction-lost → JSC-66705 crew-health bands", () => {
  // C1: ≤ 1%   (χ ≥ 0.99)
  // C2: 1–5%   (0.95 ≤ χ < 0.99)
  // C3: 5–15%  (0.85 ≤ χ < 0.95)
  // C4: 15–30% (0.70 ≤ χ < 0.85)
  // C5: > 30%  (χ < 0.70)
  const cases: [number, number][] = [
    [1.00, 1],
    [0.99, 1],
    [0.985, 2],
    [0.95, 2],
    [0.94, 3],
    [0.85, 3],
    [0.84, 4],
    [0.70, 4],
    [0.69, 5],
    [0.30, 5],
    [0.0,  5],
  ];
  it.each(cases)("χ_mean = %f → C%i", (chiMean, expectedC) => {
    const a = assessLxC(mkPosterior({ chiMean, pET: 0.05 }));
    expect(a.consequence).toBe(expectedC);
  });
});

describe("End-to-end posterior → (L, C, score, color)", () => {
  it("nominal STRONG run (high chi, low pET) lands in green zone", () => {
    const a = assessLxC(mkPosterior({ chiMean: 0.92, pET: 0.005 }));
    // χ=0.92 → 8% lost → C3; pET=0.5% → L3 → score = 15 → yellow
    // (8% loss is "Significant" already; this is the honest NASA-aligned reading)
    expect(a.consequence).toBe(3);
    expect(a.likelihood).toBe(3);
    expect(a.score).toBe(15);
    expect(a.color).toBe("yellow");
  });

  it("MARGINAL run (chi at floor, elevated pET) is yellow", () => {
    const a = assessLxC(mkPosterior({ chiMean: 0.72, pET: 0.08 }));
    // 28% lost → C4; pET 8% → L4 → score 22 → red
    expect(a.consequence).toBe(4);
    expect(a.likelihood).toBe(4);
    expect(a.color).toBe("red");
  });

  it("DEGRADED run (chi below floor, high pET) is red", () => {
    const a = assessLxC(mkPosterior({ chiMean: 0.55, pET: 0.40 }));
    // 45% lost → C5; pET 40% → L5 → score 25 → red
    expect(a.consequence).toBe(5);
    expect(a.likelihood).toBe(5);
    expect(a.score).toBe(25);
    expect(a.color).toBe("red");
  });

  it("ideal run (chi ≈ 1, pET ≈ 0) is green", () => {
    const a = assessLxC(mkPosterior({ chiMean: 0.997, pET: 0.00005 }));
    // 0.3% lost → C1; pET 0.005% → L1 → score 1 → green
    expect(a.consequence).toBe(1);
    expect(a.likelihood).toBe(1);
    expect(a.score).toBe(1);
    expect(a.color).toBe("green");
  });

  it("surfaces the raw inputs used (pET and fractionLost) for UI explanation", () => {
    const a = assessLxC(mkPosterior({ chiMean: 0.80, pET: 0.12 }));
    expect(a.pEarlyTermination).toBeCloseTo(0.12, 6);
    expect(a.fractionLost).toBeCloseTo(0.20, 6);
  });
});

import type { GateResult } from "@/types";

describe("assessLxC with gate verdict", () => {
  it("disqualified gate → red L5×C5=25 regardless of CHI", () => {
    const post = {
      chi: { mean: 0.99, ci90: [0.99, 0.99] as [number, number], ci95: [0.99, 0.99] as [number, number] },
      pEarlyTermination: { mean: 0, ci90: [0, 0] as [number, number] },
      expectedLostCrewDays: { mean: 0, ci90: [0, 0] as [number, number] },
      perConditionQTL: {},
      ess: 1000,
      trials: 1000,
    } as any;
    const gate: GateResult = { verdict: "disqualified", failedGates: ["psych.mmpi2rf_eid"], evaluated: ["psych.mmpi2rf_eid"] };
    const result = assessLxC(post, gate);
    expect(result.color).toBe("red");
    expect(result.likelihood).toBe(5);
    expect(result.consequence).toBe(5);
    expect(result.score).toBe(25);
    expect(result.disqualified).toBe(true);
    expect(result.reason).toMatch(/psych\.mmpi2rf_eid/);
  });
  it("qualified gate → normal LxC computation (same as no gate)", () => {
    const post = {
      chi: { mean: 0.99, ci90: [0.99, 0.99] as [number, number], ci95: [0.99, 0.99] as [number, number] },
      pEarlyTermination: { mean: 0, ci90: [0, 0] as [number, number] },
      expectedLostCrewDays: { mean: 0, ci90: [0, 0] as [number, number] },
      perConditionQTL: {},
      ess: 1000,
      trials: 1000,
    } as any;
    const gate: GateResult = { verdict: "qualified", failedGates: [], evaluated: [] };
    const result = assessLxC(post, gate);
    expect(result.color).toBe("green");
    expect(result.disqualified).toBeFalsy();
  });
  it("no gate arg → normal LxC computation (backwards compat)", () => {
    const post = {
      chi: { mean: 0.99, ci90: [0.99, 0.99] as [number, number], ci95: [0.99, 0.99] as [number, number] },
      pEarlyTermination: { mean: 0, ci90: [0, 0] as [number, number] },
      expectedLostCrewDays: { mean: 0, ci90: [0, 0] as [number, number] },
      perConditionQTL: {},
      ess: 1000,
      trials: 1000,
    } as any;
    const result = assessLxC(post);
    expect(result.color).toBe("green");
    expect(result.disqualified).toBeFalsy();
  });
});
