import { describe, it, expect } from "vitest";
import { sampleSeverity } from "../../src/imm/severity";
import { makeRng } from "../../src/engine/prng";

describe("sampleSeverity", () => {
  it("mean worst-case ≈ alpha/(alpha+beta) over 50k draws", () => {
    const rng = makeRng(0xdeadbeef);
    const alpha = 3;
    const beta = 7;
    const n = 50_000;
    let worstCount = 0;
    for (let i = 0; i < n; i++) {
      if (sampleSeverity(rng, alpha, beta) === "worst") worstCount++;
    }
    const expected = alpha / (alpha + beta); // 0.3
    expect(worstCount / n).toBeCloseTo(expected, 1);
  });

  it("alpha=0 always returns 'best'", () => {
    const rng = makeRng(0x1234);
    for (let i = 0; i < 1_000; i++) {
      expect(sampleSeverity(rng, 0, 5)).toBe("best");
    }
  });
});
