import { describe, it, expect } from "vitest";
import { sampleDirichlet } from "@/engine/dirichlet";
import { makeRng } from "@/engine/prng";
import { ksStatistic, betaCDF } from "@/engine/ks";

describe("K-S marginal Dirichlet fit", () => {
  const T = 5_000;
  const alpha = [2, 3, 5];
  const alpha0 = alpha.reduce((a, b) => a + b, 0);
  const rng = makeRng(42);
  const samples: number[][] = Array.from({ length: alpha.length }, () => []);

  for (let t = 0; t < T; t++) {
    const w = sampleDirichlet(alpha, rng);
    for (let k = 0; k < alpha.length; k++) samples[k].push(w[k]);
  }

  const KS_CRIT_005 = 1.36 / Math.sqrt(T);

  for (let k = 0; k < alpha.length; k++) {
    it(`marginal w_${k} ~ Beta(${alpha[k]}, ${alpha0 - alpha[k]}) passes K-S at alpha=0.05`, () => {
      const sorted = [...samples[k]].sort((a, b) => a - b);
      const D = ksStatistic(sorted, (x) => betaCDF(x, alpha[k], alpha0 - alpha[k]));
      expect(D).toBeLessThan(KS_CRIT_005);
    });
  }

  it("rejects a misspecified distribution (wrong alpha)", () => {
    const sorted = [...samples[0]].sort((a, b) => a - b);
    const D = ksStatistic(sorted, (x) => betaCDF(x, 10, 10));
    expect(D).toBeGreaterThan(KS_CRIT_005);
  });
});
