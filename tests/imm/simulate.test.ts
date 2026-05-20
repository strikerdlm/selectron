// tests/imm/simulate.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { runIMMTrial } from "../../src/imm/simulate";
import { makeRng } from "../../src/engine/prng";
import { IMM_KITS } from "../../src/imm/kits";
import type { IMMMission, IMMCrewMember } from "../../src/imm/types";

afterEach(() => {
  vi.restoreAllMocks();
});

const TRIAL_RNG = makeRng(0xc0ffee);
const oneDayMission: IMMMission = {
  id: "test-1d", label: "1-day test",
  durationDays: 1, crewSize: 1, totalEVAs: 0, evaSchedule: [],
};
const thirtyDayMission: IMMMission = {
  id: "test-30d", label: "30-day test",
  durationDays: 30, crewSize: 1, totalEVAs: 0, evaSchedule: [],
};
const oneCrew: IMMCrewMember[] = [{
  id: "c1", sex: "male", contacts: false, crowns: false,
  CAC_positive: false, abdominal_surgery_history: false,
  EVA_eligible: false, EVA_count: 0,
}];

describe("runIMMTrial", () => {
  it("returns shape {tme, qtl, evac, locl, perConditionCounts}", () => {
    const out = runIMMTrial(TRIAL_RNG, oneCrew, oneDayMission, IMM_KITS.none);
    expect(out).toHaveProperty("tme");
    expect(out).toHaveProperty("qtl");
    expect(out).toHaveProperty("evac");
    expect(out).toHaveProperty("locl");
    expect(out).toHaveProperty("perConditionCounts");
  });
  it("deterministic on the same seed", () => {
    const rngA = makeRng(42), rngB = makeRng(42);
    const outA = runIMMTrial(rngA, oneCrew, oneDayMission, IMM_KITS.none);
    const outB = runIMMTrial(rngB, oneCrew, oneDayMission, IMM_KITS.none);
    expect(outA).toEqual(outB);
  });
});

describe("T24: SA once-per-mission cap", () => {
  it("no crew member has more than 1 occurrence of any SA condition across 1000 trials", () => {
    // back-pain-space-adaptation is processType=space-adaptation-once and exists in priors.
    // Run 1000 trials; the once-cap must prevent count > 1 per crew member per condition.
    const SA_COND = "back-pain-space-adaptation";
    for (let seed = 0; seed < 1000; seed++) {
      const rng = makeRng(seed);
      const out = runIMMTrial(rng, oneCrew, thirtyDayMission, IMM_KITS.none);
      const count = out.perConditionCounts[SA_COND] ?? 0;
      expect(count).toBeLessThanOrEqual(1);
    }
  });
});
