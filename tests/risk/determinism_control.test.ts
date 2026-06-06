import { describe, it, expect } from "vitest";
import { simulateMission } from "@/risk/simulate";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import type { Candidate } from "@/types";

const mission = ANALOG_MISSIONS.find((m) => m.id === "antarctic-winter-over")!;
const crew: Candidate[] = Array.from({ length: 4 }, (_, i) => ({
  id: `m${i}`,
  alias: `m${i}`,
  scores: { "behavioral.teamwork": 5 },
}));
const MEDICAL = ANALOG_CONDITIONS.filter(
  (c) => c.family === "physiologic" || c.family === "musculoskeletal",
);

describe("medical conditions are invariant to the conflict layer (feature toggle)", () => {
  it("medical per-condition QTL is identical with team block present vs absent", () => {
    const withTeam = { ...SYNTHETIC_PRIORS };
    const withoutTeam = { ...SYNTHETIC_PRIORS, team: undefined };
    const opt = { seed: 0xc0ffee, trials: 3000 } as const;
    const a = simulateMission(crew, mission, withTeam, ANALOG_CONDITIONS, opt);
    const b = simulateMission(crew, mission, withoutTeam, ANALOG_CONDITIONS, opt);
    for (const c of MEDICAL) {
      expect(a.perConditionQTL[c.id]?.mean).toBe(b.perConditionQTL[c.id]?.mean);
    }
  });
});
