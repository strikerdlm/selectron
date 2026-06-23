import { describe, expect, it } from "vitest";
import { buildEqualWeightPrior } from "@/engine";

describe("buildEqualWeightPrior", () => {
  it("builds alpha_k = kappa * meanWeight_k", () => {
    const prior = buildEqualWeightPrior(4, 12);

    expect(prior.meanWeights).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(prior.kappa).toBe(12);
    expect(prior.alpha).toEqual([3, 3, 3, 3]);
    expect(prior.source).toBe("equal-weight-demo");
    expect(prior.evidenceStatus).toBe("demo");
  });

  it("defaults to the current Dirichlet(1,...,1) behavior", () => {
    const prior = buildEqualWeightPrior(5);
    expect(prior.kappa).toBe(5);
    expect(prior.alpha).toEqual([1, 1, 1, 1, 1]);
  });
});
