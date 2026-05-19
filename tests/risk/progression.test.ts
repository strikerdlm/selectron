import { describe, it, expect } from "vitest";
import { sampleSeverity } from "@/risk/progression";
import { makeRng } from "@/engine/prng";
import { SelectronError } from "@/engine/errors";

describe("sampleSeverity", () => {
  it("returns 0 or 1 only", () => {
    const rng = makeRng(0xabcd);
    for (let i = 0; i < 1000; i++) {
      const s = sampleSeverity(rng, 0.5);
      expect(s === 0 || s === 1).toBe(true);
    }
  });

  it("mean ≈ q within 2% for q=0.3", () => {
    const rng = makeRng(0xabcd);
    let sum = 0;
    const N = 50_000;
    for (let i = 0; i < N; i++) sum += sampleSeverity(rng, 0.3);
    expect(Math.abs(sum / N - 0.3) / 0.3).toBeLessThan(0.02);
  });

  it("mean ≈ q within 2% for q=0.7", () => {
    const rng = makeRng(0xabcd);
    let sum = 0;
    const N = 50_000;
    for (let i = 0; i < N; i++) sum += sampleSeverity(rng, 0.7);
    expect(Math.abs(sum / N - 0.7) / 0.7).toBeLessThan(0.02);
  });

  it("q=0 always returns 0", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) expect(sampleSeverity(rng, 0)).toBe(0);
  });

  it("q=1 always returns 1", () => {
    const rng = makeRng(1);
    for (let i = 0; i < 100; i++) expect(sampleSeverity(rng, 1)).toBe(1);
  });

  it("throws E_BAD_PRIOR for q outside [0,1]", () => {
    const rng = makeRng(1);
    expect(() => sampleSeverity(rng, -0.1)).toThrow(SelectronError);
    expect(() => sampleSeverity(rng, 1.1)).toThrow(SelectronError);
    try {
      sampleSeverity(rng, 1.5);
    } catch (e) {
      expect((e as SelectronError).code).toBe("E_BAD_PRIOR");
    }
  });

  it("throws E_BAD_PRIOR for non-finite q", () => {
    const rng = makeRng(1);
    expect(() => sampleSeverity(rng, Number.NaN)).toThrow(SelectronError);
    expect(() => sampleSeverity(rng, Number.POSITIVE_INFINITY)).toThrow(SelectronError);
  });
});
