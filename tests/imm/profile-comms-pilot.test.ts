import { describe, it, expect } from "vitest";
import { runIMMTrial } from "@/imm/simulate";
import { makeRng } from "@/engine/prng";
import { ACTIVE_MISSIONS } from "@/data/imm-missions";
import { IMM_KITS } from "@/imm/kits";
import type { IMMCrewMember, IMMMission, ProfileEffectMode } from "@/imm/types";

const CREW: IMMCrewMember[] = [
  {
    id: "c1",
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: false,
    EVA_count: 0,
  },
];

/** Behavioral family condition with non-negligible λ on long analog missions. */
const PILOT_CONDITION = "interpersonal-conflict";

function meanConditionCount(
  mission: IMMMission,
  seeds: number[],
  profileEffectMode?: ProfileEffectMode,
): number {
  let sum = 0;
  for (const seed of seeds) {
    const rng = makeRng(seed);
    const trial = runIMMTrial(rng, CREW, mission, IMM_KITS.none, {
      profileEffectMode,
    });
    sum += trial.perConditionCounts[PILOT_CONDITION] ?? 0;
  }
  return sum / seeds.length;
}

describe("simulateIMM — profile comms delay pilot", () => {
  it("does not apply proposal-stage comms delay in adjudicated default mode", () => {
    const base = ACTIVE_MISSIONS.find((m) => m.id === "analog-520d")!;
    const realtime: IMMMission = {
      ...base,
      profile: {
        ...base.profile!,
        communication: {
          ...base.profile!.communication,
          delaySec: 0,
        },
      },
    };
    const delayed: IMMMission = {
      ...base,
      profile: {
        ...base.profile!,
        communication: {
          ...base.profile!.communication,
          delaySec: 1320,
        },
      },
    };

    const seeds = Array.from({ length: 80 }, (_, i) => 0xc0ffee + i * 9973);
    const rtMean = meanConditionCount(realtime, seeds);
    const dlMean = meanConditionCount(delayed, seeds);

    expect(dlMean).toBe(rtMean);
  });

  it("raises behavioral-family incidence under delayed comms only in exploratory mode", () => {
    const base = ACTIVE_MISSIONS.find((m) => m.id === "analog-520d")!;
    const realtime: IMMMission = {
      ...base,
      profile: {
        ...base.profile!,
        communication: {
          ...base.profile!.communication,
          delaySec: 0,
        },
      },
    };
    const delayed: IMMMission = {
      ...base,
      profile: {
        ...base.profile!,
        communication: {
          ...base.profile!.communication,
          delaySec: 1320,
        },
      },
    };

    const seeds = Array.from({ length: 80 }, (_, i) => 0xc0ffee + i * 9973);
    const rtMean = meanConditionCount(realtime, seeds, "exploratory");
    const dlMean = meanConditionCount(delayed, seeds, "exploratory");

    expect(dlMean).toBeGreaterThan(rtMean);
  });
});
