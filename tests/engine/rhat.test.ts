import { describe, it, expect } from "vitest";
import { computeRhat } from "@/engine/rhat";

describe("computeRhat", () => {
  it("returns ~1.0 for identical chains", () => {
    const chain = [0.5, 0.6, 0.55, 0.52, 0.58];
    const rhat = computeRhat([chain, chain, chain, chain]);
    expect(rhat).toBeCloseTo(1.0, 2);
  });

  it("returns ~1.0 for IID draws from the same distribution", () => {
    const chains: number[][] = [];
    for (let c = 0; c < 4; c++) {
      const ch: number[] = [];
      let s = (c + 1) * 12345;
      for (let i = 0; i < 1000; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        ch.push(s / 0x7fffffff);
      }
      chains.push(ch);
    }
    const rhat = computeRhat(chains);
    expect(rhat).toBeLessThan(1.01);
  });

  it("returns > 1.1 for chains with different means", () => {
    const chain1 = Array.from({ length: 500 }, (_, i) => 0.3 + 0.01 * (i % 10));
    const chain2 = Array.from({ length: 500 }, (_, i) => 0.7 + 0.01 * (i % 10));
    const chain3 = Array.from({ length: 500 }, (_, i) => 0.5 + 0.01 * (i % 10));
    const chain4 = Array.from({ length: 500 }, (_, i) => 0.9 + 0.01 * (i % 10));
    const rhat = computeRhat([chain1, chain2, chain3, chain4]);
    expect(rhat).toBeGreaterThan(1.1);
  });

  it("throws on fewer than 2 chains", () => {
    expect(() => computeRhat([[1, 2, 3]])).toThrow();
  });
});
