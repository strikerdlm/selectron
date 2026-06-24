import { describe, it, expect } from "vitest";
import { scoreCandidate, closedFormMoments } from "@/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type { Candidate } from "@/types";

// Heterogeneous candidate — deliberately avoids midpoint scores that produce
// degenerate posteriors. Covers the full span of the 12-criterion battery.
const HETERO: Candidate = {
  id: "hetero-1",
  alias: "Heterogeneous",
  scores: {
    "psych.conscientiousness": 85,
    "psych.emotional_stability": 40,
    "physical.vo2max": 60,
    "professional.technical_competence": 3,
    "behavioral.teamwork": 4,
    "cognitive.nasa_cognition_battery": 2.0,
    "physical.sot5_equilibrium": 85,
    "psych.resilience_cdrisc": 90,
    "psych.emotional_intelligence": 1.5,
    "psych.mmpi2rf_eid": 42,
    "psych.bdi2_baseline": 3,
  },
};

const K = PLACEHOLDER_CRITERIA.length; // 12

// Build symmetric Dirichlet alpha vector for a given concentration alpha0.
// Each element is alpha0 / K so that sum(alpha) = alpha0.
function makeAlpha(alpha0: number): number[] {
  const alphaK = alpha0 / K;
  return Array.from({ length: K }, () => alphaK);
}

// Run all three alpha0 conditions at describe scope so every test in this block
// can share the results without re-computing. Vitest may execute individual
// `it` blocks in any order; computing at describe scope guarantees all three
// score distributions are available before any assertion runs.
const T = 50_000;
const SEED = 42;

const alpha0Values = [1, 10, 100] as const;

// Pre-compute closed-form moments and MC score distributions for each alpha0.
const results = alpha0Values.map((alpha0) => {
  const alpha = makeAlpha(alpha0);
  const cf = closedFormMoments({ candidate: HETERO, criteria: PLACEHOLDER_CRITERIA, alpha });
  const post = scoreCandidate({
    candidate: HETERO,
    criteria: PLACEHOLDER_CRITERIA,
    alpha,
    iterations: T,
    seed: SEED,
  });
  return { alpha0, cf, post };
});

const [r1, r10, r100] = results;

describe("alpha0 robustness panel {1, 10, 100}", () => {
  it("alpha0=1: closed-form mean matches MC within 2%", () => {
    const { cf, post } = r1;
    const relErr = Math.abs(post.mean - cf.mean) / cf.mean;
    expect(relErr).toBeLessThan(0.02);
  });

  it("alpha0=10: closed-form mean matches MC within 2%", () => {
    const { cf, post } = r10;
    const relErr = Math.abs(post.mean - cf.mean) / cf.mean;
    expect(relErr).toBeLessThan(0.02);
  });

  it("alpha0=100: closed-form mean matches MC within 2%", () => {
    const { cf, post } = r100;
    const relErr = Math.abs(post.mean - cf.mean) / cf.mean;
    expect(relErr).toBeLessThan(0.02);
  });

  it("central 90% interval width decreases monotonically as alpha0 increases", () => {
    const width = (r: (typeof results)[number]) => r.post.ci90[1] - r.post.ci90[0];
    const w1 = width(r1);
    const w10 = width(r10);
    const w100 = width(r100);
    expect(w10).toBeLessThan(w1);
    expect(w100).toBeLessThan(w10);
  });
});
