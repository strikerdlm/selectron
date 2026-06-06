import { describe, it, expect } from "vitest";
import { dyadFactor, heterogeneityFactor, weakestLinkFactor, attributeEvents } from "@/risk/crew-conditions";
import { makeRng } from "@/engine/prng";

describe("dyadFactor (relative to reference n)", () => {
  it("n=6 → 1, n=4 → 0.4, n=3 → 0.2, n=1 → 0", () => {
    expect(dyadFactor(6, 6)).toBeCloseTo(1, 12);
    expect(dyadFactor(4, 6)).toBeCloseTo(0.4, 12);
    expect(dyadFactor(3, 6)).toBeCloseTo(0.2, 12);
    expect(dyadFactor(1, 6)).toBe(0);
  });
});

describe("composition factors", () => {
  it("heterogeneity rises with spread of proneness", () => {
    expect(heterogeneityFactor([0, 0, 0, 0], 0.3)).toBeCloseTo(1, 12);
    expect(heterogeneityFactor([-1, -1, 1, 1], 0.3)).toBeGreaterThan(1);
  });
  it("weakest-link rises with the worst member", () => {
    expect(weakestLinkFactor([-1, -1, 2], 0.4)).toBeCloseTo(Math.exp(0.4 * 2), 12);
  });
});

describe("attributeEvents (concentration)", () => {
  it("distributes N events to members ∝ proneness weights, summing to N", () => {
    const rng = makeRng(0xc0ffee);
    const w = [3, 0.2, 0.2]; // member 0 most prone
    const counts = attributeEvents(rng, 10_000, w);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(10_000);
    expect(counts[0]).toBeGreaterThan(counts[1] + counts[2]); // concentration
  });
  it("returns all-zero for N=0", () => {
    expect(attributeEvents(makeRng(1), 0, [1, 1])).toEqual([0, 0]);
  });
});
