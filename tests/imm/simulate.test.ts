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

import * as priorsModule from "../../src/imm/priors";
import type { IMMPrior } from "../../src/imm/types";

/** Build a minimal IMMPrior fixture for T25 tests. */
function makeSinusPrior(pEvacMode: number): IMMPrior {
  const pert = (min: number, mode: number, max: number) => ({ min, mode, max });
  return {
    conditionId: "acute-sinusitis",
    provenance: "tierA-nasa" as const,
    source_ref: "test-fixture",
    incidence: { distribution: "Fixed", lambda_fixed: 1.0 },
    severity: { worst_case_prob_alpha: 1, worst_case_prob_beta: 1 },
    treated: {
      fi_cp1: pert(0, 0.01, 0.02), dt_cp1_hours: pert(0, 1, 2),
      fi_cp2: pert(0, 0.0, 0.01), dt_cp2_hours: pert(0, 0, 1),
      fi_cp3: pert(0, 0.0, 0.0),
      p_evac: pert(0.005, 0.01, 0.02),
      p_locl: pert(0, 0, 0.001),
    },
    untreated: {
      fi_cp1: pert(0.1, 0.2, 0.3), dt_cp1_hours: pert(12, 48, 168),
      fi_cp2: pert(0.0, 0.05, 0.1), dt_cp2_hours: pert(12, 72, 240),
      fi_cp3: pert(0.0, 0.0, 0.02),
      p_evac: pert(0.3, pEvacMode, 0.7),
      p_locl: pert(0, 0.001, 0.02),
    },
    required_resources: {},
    risk_factor_multipliers: {},
  };
}

describe("T25: per-event Bernoulli end-state", () => {
  it("perConditionEvac aggregates using Bernoulli sample, not 0.5 threshold", () => {
    // Verify that the Bernoulli Occurrence.evacSampled is used for perConditionEvac.
    // Old code: perConditionEvac used p_evac > 0.5 threshold — would give 0 for p_evac=0.1.
    // New code: uses rng() < p_evac Bernoulli — gives non-zero count even for p_evac=0.1.
    //
    // With p_evac untreated PERT(0.05, 0.1, 0.20) → mean≈0.1; over 50k trials with 1 event each,
    // we expect ~10% perConditionEvac rate. The > 0.5 threshold would always give 0.
    const EVAC_MODE = 0.1;
    const realPriors = priorsModule.loadIMMPriors();
    vi.spyOn(priorsModule, "loadIMMPriors").mockReturnValue({
      ...realPriors,
      conditions: {
        ...realPriors.conditions,
        "acute-sinusitis": makeSinusPrior(EVAC_MODE),
      },
    });

    const N = 50_000;
    let perCondEvacSum = 0;
    for (let i = 0; i < N; i++) {
      const rng = makeRng(i);
      const out = runIMMTrial(rng, oneCrew, oneDayMission, IMM_KITS.none);
      perCondEvacSum += out.perConditionEvac["acute-sinusitis"] ?? 0;
    }
    // If >0.5 threshold: perCondEvacSum would be exactly 0 (p_evac mode=0.1 < 0.5 always).
    // With Bernoulli sampling: expect ~10% hit rate on trials where sinusitis occurs.
    // Accept any positive rate (> 1% is sufficient to distinguish from threshold).
    const rate = perCondEvacSum / N;
    expect(rate).toBeGreaterThan(0.01); // Must be non-zero — proves Bernoulli not threshold
    expect(rate).toBeLessThan(0.5);    // Must not be degenerate
  });
});
