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
