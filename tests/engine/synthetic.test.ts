import { describe, it, expect } from "vitest";
import { generateCandidate, generateCandidates } from "@/engine/synthetic";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

describe("generateCandidate", () => {
  it("produces scores within each criterion's scale", () => {
    const c = generateCandidate(PLACEHOLDER_CRITERIA, 1);
    for (const k of PLACEHOLDER_CRITERIA) {
      expect(c.scores[k.id]).toBeGreaterThanOrEqual(k.scale.min);
      expect(c.scores[k.id]).toBeLessThanOrEqual(k.scale.max);
    }
  });

  it("is deterministic given the same seed", () => {
    const a = generateCandidate(PLACEHOLDER_CRITERIA, 42);
    const b = generateCandidate(PLACEHOLDER_CRITERIA, 42);
    expect(a.scores).toEqual(b.scores);
  });
});

describe("generateCandidates", () => {
  it("produces N candidates with unique ids", () => {
    const xs = generateCandidates(PLACEHOLDER_CRITERIA, 10, 99);
    expect(xs.length).toBe(10);
    expect(new Set(xs.map((c) => c.id)).size).toBe(10);
  });
});
