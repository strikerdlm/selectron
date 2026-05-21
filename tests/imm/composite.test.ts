// tests/imm/composite.test.ts
import { describe, it, expect } from "vitest";
import { aggregateCrewComposite } from "../../src/imm/composite";
import type { IMMCrewMember } from "../../src/imm/types";
import type { Criterion } from "../../src/types";

// ── Fixtures ─────────────────────────────────────────────────────────────────

const CRITERIA: readonly Criterion[] = [
  {
    id: "psych.score_a",
    family: "psychological",
    label: "Score A",
    description: "Test criterion A",
    instrument: "test",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: [],
    minimumTier: "minimum",
  },
  {
    id: "psych.score_b",
    family: "psychological",
    label: "Score B",
    description: "Test criterion B",
    instrument: "test",
    scale: { min: 0, max: 100 },
    higherIsBetter: true,
    citations: [],
    minimumTier: "minimum",
  },
];

function makeMember(id: string, scoreA?: number, scoreB?: number): IMMCrewMember {
  return {
    id,
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: true,
    EVA_count: 0,
    stageAScores:
      scoreA !== undefined || scoreB !== undefined
        ? {
            ...(scoreA !== undefined ? { "psych.score_a": scoreA } : {}),
            ...(scoreB !== undefined ? { "psych.score_b": scoreB } : {}),
          }
        : undefined,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("aggregateCrewComposite", () => {
  it("empty crew returns compositeScore 0 and null weakestMemberId", () => {
    const result = aggregateCrewComposite([], CRITERIA, "mean");
    expect(result.compositeScore).toBe(0);
    expect(result.perMemberScores).toHaveLength(0);
    expect(result.weakestMemberId).toBeNull();
    expect(result.method).toBe("mean");
  });

  it("mean strategy: arithmetic mean of per-member normalised scores", () => {
    // Member A: both criteria at 75/100 → normalised 0.75 each → memberScore = 0.75
    // Member B: both criteria at 25/100 → normalised 0.25 each → memberScore = 0.25
    // Crew mean = (0.75 + 0.25) / 2 = 0.50
    const crew = [
      makeMember("a", 75, 75),
      makeMember("b", 25, 25),
    ];
    const result = aggregateCrewComposite(crew, CRITERIA, "mean");
    expect(result.compositeScore).toBeCloseTo(0.5, 6);
    expect(result.perMemberScores[0]).toBeCloseTo(0.75, 6);
    expect(result.perMemberScores[1]).toBeCloseTo(0.25, 6);
    expect(result.weakestMemberId).toBe("b");
    expect(result.method).toBe("mean");
  });

  it("worst-link strategy: minimum per-member score", () => {
    const crew = [
      makeMember("x", 80, 80), // memberScore = 0.80
      makeMember("y", 60, 60), // memberScore = 0.60
      makeMember("z", 40, 40), // memberScore = 0.40 — weakest
    ];
    const result = aggregateCrewComposite(crew, CRITERIA, "worst-link");
    expect(result.compositeScore).toBeCloseTo(0.4, 6);
    expect(result.weakestMemberId).toBe("z");
  });

  it("geometric-mean strategy: nth root of product of per-member scores", () => {
    // Member a: both criteria at 100 → memberScore = 1.0
    // Member b: both criteria at 50  → memberScore = 0.5
    // Geometric mean of [1.0, 0.5] = sqrt(0.5) ≈ 0.7071
    const crew = [
      makeMember("a", 100, 100),
      makeMember("b", 50, 50),
    ];
    const result = aggregateCrewComposite(crew, CRITERIA, "geometric-mean");
    expect(result.compositeScore).toBeCloseTo(Math.sqrt(0.5), 5);
    expect(result.method).toBe("geometric-mean");
  });

  it("geometric-mean with a zero score returns 0", () => {
    const crew = [
      makeMember("a", 100, 100), // memberScore = 1.0
      makeMember("b", 0, 0),     // memberScore = 0.0
    ];
    const result = aggregateCrewComposite(crew, CRITERIA, "geometric-mean");
    expect(result.compositeScore).toBe(0);
  });

  it("member without stageAScores contributes score 0", () => {
    // Member a has scores; member b has no stageAScores → score 0
    const crew = [
      makeMember("a", 100, 100), // memberScore = 1.0
      makeMember("b"),           // memberScore = 0.0 (no stageAScores)
    ];
    const resultMean = aggregateCrewComposite(crew, CRITERIA, "mean");
    expect(resultMean.compositeScore).toBeCloseTo(0.5, 6);
    expect(resultMean.perMemberScores[1]).toBe(0);
    expect(resultMean.weakestMemberId).toBe("b");
  });
});
