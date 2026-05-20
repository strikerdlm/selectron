import { describe, it, expect } from "vitest";
import { samplePoisson } from "../../src/imm/incidence";
import { makeRng } from "../../src/engine/prng";

describe("samplePoisson", () => {
  it("mean ≈ lambda within 2% over 50k draws (small lambda)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 2.5;
    const n = 50_000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += samplePoisson(rng, lambda);
    expect(sum / n).toBeCloseTo(lambda, 1);
  });

  it("mean ≈ lambda within 2% (large lambda — PTRS regime)", () => {
    const rng = makeRng(0xc0ffee);
    const lambda = 50;
    const n = 20_000;
    let sum = 0, sumSq = 0;
    for (let i = 0; i < n; i++) { const x = samplePoisson(rng, lambda); sum += x; sumSq += x * x; }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    expect(mean).toBeCloseTo(lambda, 0);
    expect(variance / lambda).toBeCloseTo(1, 0);  // variance ≈ lambda for Poisson
  });

  it("returns 0 for lambda = 0", () => {
    const rng = makeRng(0);
    expect(samplePoisson(rng, 0)).toBe(0);
  });
});
