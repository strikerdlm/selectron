import { describe, it, expect } from "vitest";
import { conditionBehavior } from "@/risk/condition-behavior";
import type { Condition } from "@/types";

const mk = (family: Condition["family"]): Condition => ({
  id: "x", label: "x", family, kind: "rate", vulnerabilityCriteria: [], citations: [],
});

describe("conditionBehavior", () => {
  it("team → crew scope, latent temporal, negbin, frailty-coupled", () => {
    expect(conditionBehavior(mk("team"))).toEqual({
      scope: "crew", temporal: "latent", dispersion: "negbin", frailtyCoupled: true,
    });
  });
  it("psychiatric/performance → member, latent, negbin, frailty-coupled", () => {
    for (const f of ["psychiatric", "performance"] as const) {
      expect(conditionBehavior(mk(f))).toEqual({
        scope: "member", temporal: "latent", dispersion: "negbin", frailtyCoupled: true,
      });
    }
  });
  it("physiologic/musculoskeletal → member, stationary, poisson, uncoupled (unchanged)", () => {
    for (const f of ["physiologic", "musculoskeletal"] as const) {
      expect(conditionBehavior(mk(f))).toEqual({
        scope: "member", temporal: "stationary", dispersion: "poisson", frailtyCoupled: false,
      });
    }
  });
  it("respects explicit overrides on the Condition", () => {
    const c = { ...mk("physiologic"), frailtyCoupled: true };
    expect(conditionBehavior(c).frailtyCoupled).toBe(true);
  });
});
