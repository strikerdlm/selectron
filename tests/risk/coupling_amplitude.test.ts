import { describe, it, expect } from "vitest";
import { simulateMission } from "../../src/risk/simulate";
import { synthesizeCrew, SYNTHETIC_PRIORS } from "../../src/data/synthetic-iter3";
import { ANALOG_MISSIONS } from "../../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../../src/risk/conditions";
import { PLACEHOLDER_CRITERIA } from "../../src/data/placeholder-criteria";

describe("coupling amplitude (post-G6 fix)", () => {
  it("worst-vs-best CHI delta on hi-seas-45d ≥ 5 percentage points", () => {
    const buildCand = (frac: number) => {
      const scores: Record<string, number> = {};
      for (const c of PLACEHOLDER_CRITERIA) {
        const v = c.higherIsBetter
          ? c.scale.min + frac * (c.scale.max - c.scale.min)
          : c.scale.max - frac * (c.scale.max - c.scale.min);
        scores[c.id] = v;
      }
      return { id: `cand-${frac}`, alias: `cand-${frac}`, scores };
    };
    const m = ANALOG_MISSIONS.find((x) => x.id === "hi-seas-45d")!;
    const worst = simulateMission(synthesizeCrew(buildCand(0), m.crewSize), m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 5000, chiStar: 0.7 });
    const best  = simulateMission(synthesizeCrew(buildCand(1), m.crewSize), m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 5000, chiStar: 0.7 });
    const delta = (best.chi.mean - worst.chi.mean) * 100;
    expect(delta).toBeGreaterThanOrEqual(5);
  }, 60_000);
});
