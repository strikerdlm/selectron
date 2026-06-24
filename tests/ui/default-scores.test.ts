// tests/ui/default-scores.test.ts
//
// F5 regression guard: the archetype `defaultScores` generator must map an
// increasing archetype fraction to increasing *normalized goodness* for EVERY
// criterion, regardless of scale direction. The prior implementation applied
// `scale.min + f*(max-min)` to all criteria, which inverted the Alpha→Foxtrot
// strength ordering on reversed-scale criteria (PVT-B RT, BDI-II): a higher
// fraction produced a worse raw value, so the "strongest" archetype scored
// worst on vigilance and depression.

import { describe, it, expect } from "vitest";
import { defaultScores } from "@/ui/views/CrewComposition";
import { ACTIVE_CRITERION_CATALOG } from "@/data/demo-criteria";
import { normalizeScore } from "@/engine/normalize";

const CRITERIA = ACTIVE_CRITERION_CATALOG.criteria;

function goodness(fraction: number, criterionId: string): number {
  const c = CRITERIA.find((x) => x.id === criterionId)!;
  const raw = defaultScores({ default: fraction })[c.id];
  return normalizeScore(raw, c.scale, c.higherIsBetter);
}

describe("defaultScores — archetype fraction monotonicity (F5)", () => {
  it("normalized goodness strictly increases with fraction for every non-gate criterion", () => {
    const fractions = [0.1, 0.5, 0.9];
    for (const c of CRITERIA) {
      // MMPI-2-RF EID is gate-hardcoded to a constant safe T-score (35), so its
      // goodness is independent of fraction by design — exclude from the
      // strict-monotonicity check.
      if (c.id === "psych.mmpi2rf_eid") continue;
      const goods = fractions.map((f) => goodness(f, c.id));
      expect(goods[0], `${c.id}: goodness[0.1] < goodness[0.5]`).toBeLessThan(goods[1]);
      expect(goods[1], `${c.id}: goodness[0.5] < goodness[0.9]`).toBeLessThan(goods[2]);
    }
  });

  it("BDI-II: higher fraction yields lower (better) raw depression score", () => {
    const low = defaultScores({ default: 0.2 })["psych.bdi2_baseline"];
    const high = defaultScores({ default: 0.9 })["psych.bdi2_baseline"];
    expect(low).toBeGreaterThan(high);
  });

  it("Alpha (0.82) is strictly stronger than Foxtrot (0.48) on every non-gate criterion", () => {
    const alpha = defaultScores({ default: 0.82 });
    const foxtrot = defaultScores({ default: 0.48 });
    for (const c of CRITERIA) {
      if (c.id === "psych.mmpi2rf_eid") continue; // gate-hardcoded constant
      const ga = normalizeScore(alpha[c.id], c.scale, c.higherIsBetter);
      const gf = normalizeScore(foxtrot[c.id], c.scale, c.higherIsBetter);
      expect(ga, `${c.id}: Alpha goodness > Foxtrot goodness`).toBeGreaterThan(gf);
    }
  });

  it("goodness(f) ≈ f for both scale directions (the intended mapping)", () => {
    for (const c of CRITERIA) {
      if (c.id === "psych.mmpi2rf_eid") continue;
      // NASA Cognition Battery is clamped to >= -1.5 at very low fractions; use
      // a mid-range fraction where the clamp is inactive.
      const f = c.id === "cognitive.nasa_cognition_battery" ? 0.6 : 0.7;
      expect(goodness(f, c.id)).toBeCloseTo(f, 6);
    }
  });
});