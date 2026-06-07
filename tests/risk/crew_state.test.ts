import { describe, it, expect } from "vitest";
import { drawTrialLatentState, type TeamHyper } from "@/risk/crew-state";
import { makeRng } from "@/engine/prng";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type { Candidate, Criterion } from "@/types";

// behavioral.teamwork scale is { min: 1, max: 5 } (midpoint = 3).
// Adjusted from original 3/6/9 (9 was out-of-range) to 2/3/5:
//   2 = clearly below midpoint, 5 = max (clearly above midpoint).
const idx = new Map<string, Criterion>(PLACEHOLDER_CRITERIA.map((c) => [c.id, c]));
const hyper: TeamHyper = {
  crewFrailtyPhi: 4, memberFrailtyPhi: 4, piUnstableBase: 0.658, alphaFit: -0.5,
  sigmaLogBeta: 0.3, fitCriterionId: "behavioral.teamwork",
};
const crewOf = (teamwork: number, n: number): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": teamwork } }));

describe("drawTrialLatentState", () => {
  it("memberFrailty has length = crew size, all positive", () => {
    const s = drawTrialLatentState(crewOf(3, 4), idx, hyper, makeRng(0xc0ffee));
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
    expect(frac(5)).toBeLessThan(frac(2)); // high teamwork → less instability
  });
  it("betaLogShift is finite and centered near 0 across draws", () => {
    const rng = makeRng(0xc0ffee);
    let sum = 0; const n = 50_000;
    for (let i = 0; i < n; i++) sum += drawTrialLatentState(crewOf(3, 4), idx, hyper, rng).betaLogShift;
    expect(Math.abs(sum / n)).toBeLessThan(0.02);
  });
});
