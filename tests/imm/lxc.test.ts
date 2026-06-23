// tests/imm/lxc.test.ts
// Tests for the IMM → HSRB LxC adapter. Verifies that the IMM Calculator
// outputs (IMMOutcome) feed correctly into the NASA JSC-66705 Rev A
// likelihood × consequence matrix, including the crew-gate fast-fail path.

import { describe, it, expect } from "vitest";
import { assessIMMLxC } from "../../src/imm/lxc";
import type { IMMOutcome, CrewGateResult, PosteriorSummary } from "../../src/imm/types";

function summary(mean: number, sd = 1): PosteriorSummary {
  return {
    mean, sd,
    ci90: [mean - 1.645 * sd, mean + 1.645 * sd],
    ci95: [mean - 1.96  * sd, mean + 1.96  * sd],
  };
}

function fakeOutcome(opts: { chiPct: number; missionSuccessPct: number }): IMMOutcome {
  return {
    tme:            summary(100),
    chi:            summary(opts.chiPct),
    pEvac:          summary(5),
    pLocl:          summary(0.4),
    missionSuccess: summary(opts.missionSuccessPct),
    perConditionDrivers: [],
    convergence:    { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
  };
}

describe("assessIMMLxC — happy paths", () => {
  it("excellent CHI + near-certain success → green (L1×C1=1)", () => {
    // chi=99.9% → fractionLost=0.001 → C1 (≤0.01); missionSuccess=99.999% → pFailure=0.00001 → L1 (≤0.0001).
    const r = assessIMMLxC(fakeOutcome({ chiPct: 99.9, missionSuccessPct: 99.999 }));
    expect(r.consequence).toBe(1);
    expect(r.likelihood).toBe(1);
    expect(r.score).toBe(1);
    expect(r.color).toBe("green");
  });

  it("typical issHMS-tier sim (95% CHI, 95% mission success) → yellow per JSC bands", () => {
    // chi=95% → fractionLost=0.05 → C2 (≤0.05); missionSuccess=95% → pFailure=0.05 → L4 (≤0.10).
    // L4×C2 = 13 per the JSC-66705 priority matrix = yellow.
    const r = assessIMMLxC(fakeOutcome({ chiPct: 95, missionSuccessPct: 95 }));
    expect(r.fractionLost).toBeCloseTo(0.05, 5);
    expect(r.pMissionFailure).toBeCloseTo(0.05, 5);
    expect(r.consequence).toBe(2);
    expect(r.likelihood).toBe(4);
    expect(r.score).toBe(13);
    expect(r.color).toBe("yellow");
  });

  it("low CHI + high pFailure → max LxC score, red", () => {
    // CHI=10% → fractionLost=0.90 → C5; missionSuccess=5% → pFailure=0.95 → L5.
    const r = assessIMMLxC(fakeOutcome({ chiPct: 10, missionSuccessPct: 5 }));
    expect(r.fractionLost).toBeCloseTo(0.90, 5);
    expect(r.pMissionFailure).toBeCloseTo(0.95, 5);
    expect(r.likelihood).toBe(5);
    expect(r.consequence).toBe(5);
    expect(r.score).toBe(25);
    expect(r.color).toBe("red");
  });

  it("clamps degenerate inputs into [0,1]", () => {
    // missionSuccess = 105% (impossible but tolerate) → pFailure clamped to 0.
    const r = assessIMMLxC(fakeOutcome({ chiPct: 100, missionSuccessPct: 105 }));
    expect(r.pMissionFailure).toBe(0);
    expect(r.fractionLost).toBe(0);
    // Expect lowest cells.
    expect(r.likelihood).toBeLessThanOrEqual(2);
    expect(r.consequence).toBeLessThanOrEqual(2);
  });
});

describe("assessIMMLxC — crew gate review flags", () => {
  it("crewVerdict=disqualified reports review flags without overriding the IMM result", () => {
    const greatOutcome = fakeOutcome({ chiPct: 99, missionSuccessPct: 99 });
    const failedCrew: CrewGateResult = {
      crewVerdict: "disqualified",
      perMemberResults: {},
      disqualifiedMemberIds: ["mike", "alice"],
    };
    const r = assessIMMLxC(greatOutcome, failedCrew);
    expect(r.disqualified).toBe(true);
    expect(r.likelihood).toBeLessThan(5);
    expect(r.consequence).toBeLessThan(5);
    expect(r.score).toBeLessThan(25);
    expect(r.reason).toMatch(/mike/);
    expect(r.reason).toMatch(/alice/);
  });

  it("crewVerdict=qualified does NOT short-circuit — Monte Carlo result drives verdict", () => {
    // Very-low-failure path: pure-IMM result must come through (no disqualified flag).
    const greatOutcome = fakeOutcome({ chiPct: 99.9, missionSuccessPct: 99.999 });
    const qualifiedCrew: CrewGateResult = {
      crewVerdict: "qualified",
      perMemberResults: {},
      disqualifiedMemberIds: [],
    };
    const r = assessIMMLxC(greatOutcome, qualifiedCrew);
    expect(r.disqualified).toBeUndefined();
    expect(r.color).toBe("green");
    expect(r.score).toBe(1); // L1×C1
  });

  it("no gate supplied → uses Monte Carlo result", () => {
    const r = assessIMMLxC(fakeOutcome({ chiPct: 50, missionSuccessPct: 50 }));
    // 50% loss + 50% failure should land mid-matrix; specific cell depends on JSC bands.
    expect(r.disqualified).toBeUndefined();
    expect(r.fractionLost).toBe(0.5);
    expect(r.pMissionFailure).toBe(0.5);
  });
});

describe("assessIMMLxC — IMM unit conversion (percent ↔ fraction)", () => {
  it("converts IMM chi (0-100 percent) → consequence input (0-1 fractionLost)", () => {
    // chi = 70% → fractionLost = 0.30 exactly (within float epsilon).
    const r = assessIMMLxC(fakeOutcome({ chiPct: 70, missionSuccessPct: 80 }));
    expect(r.fractionLost).toBeCloseTo(0.30, 9);
  });

  it("converts IMM missionSuccess (0-100 percent) → likelihood input (0-1 pFailure)", () => {
    const r = assessIMMLxC(fakeOutcome({ chiPct: 80, missionSuccessPct: 80 }));
    expect(r.pMissionFailure).toBeCloseTo(0.20, 9);
  });

  it("returns labels + definitions from the JSC-66705 verbatim band tables", () => {
    const r = assessIMMLxC(fakeOutcome({ chiPct: 95, missionSuccessPct: 95 }));
    expect(r.likelihoodLabel).toBeTruthy();
    expect(r.likelihoodDefinition).toBeTruthy();
    expect(r.consequenceLabel).toBeTruthy();
    expect(r.consequenceDefinition).toBeTruthy();
  });
});
