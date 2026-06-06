import { describe, it, expect } from "vitest";
import { simulateMission } from "@/risk/simulate";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import type { Candidate } from "@/types";

const antarctic = ANALOG_MISSIONS.find((m) => m.id === "antarctic-winter-over")!; // evaCount 0, 365 d
const crew = (teamwork: number, n = 4): Candidate[] =>
  Array.from({ length: n }, (_, i) => ({ id: `m${i}`, alias: `m${i}`, scores: { "behavioral.teamwork": teamwork } }));

const teamQTL = (post: ReturnType<typeof simulateMission>) =>
  ANALOG_CONDITIONS.filter((c) => c.family === "team")
    .reduce((s, c) => s + (post.perConditionQTL[c.id]?.mean ?? 0), 0);

describe("de-EVA: conflict fires on zero-EVA missions", () => {
  it("365-d Antarctic (evaCount=0) now produces > 0 team-condition QTL", () => {
    const post = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, { seed: 0xc0ffee, trials: 4000 });
    expect(teamQTL(post)).toBeGreaterThan(0);
  });
});

describe("dyadic scaling", () => {
  it("a 3-person crew has less team QTL than a 6-person crew, same composition", () => {
    const opt = { seed: 0xc0ffee, trials: 4000 } as const;
    const q3 = teamQTL(simulateMission(crew(5, 3), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt));
    const q6 = teamQTL(simulateMission(crew(5, 6), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt));
    expect(q3).toBeLessThan(q6);
  });
});

describe("determinism", () => {
  it("same seed → identical CHI mean across two runs", () => {
    const opt = { seed: 0xc0ffee, trials: 2000 } as const;
    const a = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt);
    const b = simulateMission(crew(5), antarctic, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, opt);
    expect(a.chi.mean).toBe(b.chi.mean);
  });
});
