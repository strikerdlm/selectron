import { describe, it, expect } from "vitest";
import { integratedIntensity, firstEventFraction } from "@/risk/temporal";
import { makeRng } from "@/engine/prng";
import { SelectronError } from "@/engine/errors";

describe("integratedIntensity", () => {
  it("stable class integrates to 1", () => {
    expect(integratedIntensity(0, 2, 2)).toBeCloseTo(1, 12);
  });
  it("unstable class integrates to 1 + a/(p+1)", () => {
    // a=2, p=2 → 1 + 2/3
    expect(integratedIntensity(1, 2, 2)).toBeCloseTo(1 + 2 / 3, 12);
  });
});

describe("firstEventFraction", () => {
  it("right-censors to 1.0 when expected count is ~0", () => {
    const rng = makeRng(7);
    expect(firstEventFraction(rng, 1e-9, 0, 2, 2)).toBe(1);
  });
  it("stable class: empirical P(event by 0.4) ≈ 1 - exp(-0.4*mean)", () => {
    const rng = makeRng(0xc0ffee);
    const mean = 3, n = 100_000;
    let byPoint4 = 0;
    for (let i = 0; i < n; i++) if (firstEventFraction(rng, mean, 0, 2, 2) <= 0.4) byPoint4++;
    const p = byPoint4 / n;
    expect(Math.abs(p - (1 - Math.exp(-0.4 * mean)))).toBeLessThan(0.01);
  });
  it("unstable class front-loads LESS than stable (back-loaded ramp)", () => {
    const mean = 3, n = 100_000;
    const pBy = (cls: 0 | 1) => {
      const r = makeRng(0xc0ffee);
      let c = 0;
      for (let i = 0; i < n; i++) if (firstEventFraction(r, mean, cls, 2, 2) <= 0.4) c++;
      return c / n;
    };
    expect(pBy(1)).toBeLessThan(pBy(0)); // unstable later onset for same total mean
  });
});

describe("shape-parameter guards", () => {
  it("throws on negative a (would break M_c monotonicity)", () => {
    expect(() => integratedIntensity(1, -3, 2)).toThrow(SelectronError);
  });
  it("throws on non-positive p", () => {
    expect(() => firstEventFraction(makeRng(1), 3, 1, 2, 0)).toThrow(SelectronError);
  });
});
