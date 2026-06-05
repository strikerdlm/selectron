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
