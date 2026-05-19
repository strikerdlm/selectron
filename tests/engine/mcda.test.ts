import { describe, it, expect } from "vitest";
import { scoreCandidate, closedFormMoments } from "@/engine/mcda";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import type { Candidate } from "@/types";

// Demo candidate — must carry a score for EVERY criterion in PLACEHOLDER_CRITERIA
// (Iter-1 placeholders + Diego 2026-05-19 scope expansion = 12 criteria) or
// scoreCandidate throws E_BAD_SCORE on the missing-key path.
const demo: Candidate = {
  id: "demo-1",
  alias: "Alpha",
  scores: {
    "psych.conscientiousness": 72,
    "psych.emotional_stability": 65,
    "physical.vo2max": 52,
    "professional.technical_competence": 8,
    "behavioral.teamwork": 4,
    "cognitive.nasa_cognition_battery": 1.2, // z-score
    "cognitive.pvt_b_lapses": 4, // baseline lapses (reversed → high z)
    "physical.sot5_equilibrium": 72, // SOT-5 EQ score
    "psych.resilience_cdrisc": 78, // CD-RISC-25 total
    "psych.emotional_intelligence": 0.9, // MSCEIT z
    "psych.mmpi2rf_eid": 48, // EID T-score (reversed → high z when low)
    "psych.bdi2_baseline": 6, // BDI-II baseline (reversed)
  },
};

const ALPHA = Array.from({ length: 12 }, () => 1);

describe("scoreCandidate", () => {
  it("returns a Posterior with samples, ess, mean, ci90, ci95", () => {
    const post = scoreCandidate({
      candidate: demo,
      criteria: PLACEHOLDER_CRITERIA,
      alpha: ALPHA,
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
    const alpha = ALPHA;
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
      alpha: ALPHA,
      iterations: 1000,
      seed: 99,
    };
    const a = scoreCandidate(args);
    const b = scoreCandidate(args);
    expect(a.mean).toBe(b.mean);
    expect(a.samples[0]).toBe(b.samples[0]);
  });
});
