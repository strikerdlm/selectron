import type { Condition } from "@/types";

export type ConditionBehavior = {
  scope: "member" | "crew";
  temporal: "stationary" | "latent";
  dispersion: "poisson" | "negbin";
  frailtyCoupled: boolean;
};

/**
 * Family-derived defaults, overridable per Condition.
 *  - team                      → crew-level, latent temporal, NB, frailty-coupled
 *  - psychiatric / performance → per-member, latent temporal, NB, frailty-coupled
 *  - physiologic / musculoskeletal → per-member, stationary, Poisson, uncoupled (unchanged)
 */
export function conditionBehavior(c: Condition): ConditionBehavior {
  const isTeam = c.family === "team";
  const isBehavioral = c.family === "psychiatric" || c.family === "performance";
  const base: ConditionBehavior = isTeam
    ? { scope: "crew", temporal: "latent", dispersion: "negbin", frailtyCoupled: true }
    : isBehavioral
      ? { scope: "member", temporal: "latent", dispersion: "negbin", frailtyCoupled: true }
      : { scope: "member", temporal: "stationary", dispersion: "poisson", frailtyCoupled: false };
  return {
    scope: c.scope ?? base.scope,
    temporal: c.temporal ?? base.temporal,
    dispersion: c.dispersion ?? base.dispersion,
    frailtyCoupled: c.frailtyCoupled ?? base.frailtyCoupled,
  };
}
