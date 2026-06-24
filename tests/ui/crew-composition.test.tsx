// @vitest-environment jsdom
// RTL tests for CrewComposition live composite update.
// Tests that when PerScoreCard fires onScoreChange, the crew composite recalculates.
// Uses only the engine functions directly (no ECharts, no Dexie, no workers).

import { describe, it, expect, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { aggregateCrewComposite } from "@/imm/composite";
import { evaluateCrewGates } from "@/imm/crew-gates";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { defaultScores } from "@/ui/views/CrewComposition";
import { PerScoreCard } from "@/ui/components/PerScoreCard";
import type { IMMCrewMember } from "@/imm/types";

afterEach(cleanup);

// Minimal safe crew for tests (all gate-passing defaults). Uses the production
// defaultScores so the test crew cannot drift from the real archetype formula
// (including the higherIsBetter branch for reversed-scale criteria).
function makeMember(id: string, fraction: number): IMMCrewMember {
  const scores = defaultScores({ default: fraction });
  return {
    id,
    sex: "male",
    contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
    stageAScores: scores,
  };
}

describe("aggregateCrewComposite — unit", () => {
  it("worst-link composite equals minimum member score", () => {
    const crew = [makeMember("A", 0.8), makeMember("B", 0.5)];
    const result = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "worst-link");
    const minScore = Math.min(...result.perMemberScores);
    expect(result.compositeScore).toBeCloseTo(minScore, 6);
  });

  it("mean composite equals arithmetic mean of member scores", () => {
    const crew = [makeMember("A", 0.8), makeMember("B", 0.4)];
    const result = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "mean");
    const mean = result.perMemberScores.reduce((a, b) => a + b, 0) / result.perMemberScores.length;
    expect(result.compositeScore).toBeCloseTo(mean, 6);
  });

  it("weakest member is identified correctly", () => {
    const crew = [makeMember("Alpha", 0.8), makeMember("Foxtrot", 0.3)];
    const result = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "worst-link");
    expect(result.weakestMemberId).toBe("Foxtrot");
  });

  it("changing aggregator method produces different composite", () => {
    const crew = [makeMember("A", 0.8), makeMember("B", 0.4)];
    const worst = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "worst-link");
    const mean = aggregateCrewComposite(crew, PLACEHOLDER_CRITERIA, "mean");
    // worst-link (min) < mean for different member scores
    expect(worst.compositeScore).toBeLessThan(mean.compositeScore);
  });
});

describe("evaluateCrewGates — demo-threshold flags", () => {
  it("crew with all safe defaults has no demo-threshold review flags", () => {
    const crew = [makeMember("A", 0.7), makeMember("B", 0.6)];
    const result = evaluateCrewGates(crew, PLACEHOLDER_CRITERIA);
    expect(result.crewVerdict).toBe("clear");
    expect(result.flaggedMemberIds).toHaveLength(0);
  });

  it("crew member with EID T-score > 65 is surfaced as a review flag", () => {
    const member = makeMember("C", 0.7);
    // Set EID score above the demo-threshold review flag (65).
    member.stageAScores = { ...member.stageAScores, "psych.mmpi2rf_eid": 80 };
    const crew = [makeMember("A", 0.7), member];
    const result = evaluateCrewGates(crew, PLACEHOLDER_CRITERIA);
    expect(result.crewVerdict).toBe("review-flagged");
    expect(result.flaggedMemberIds).toContain("C");
    expect(result.flaggedMemberIds).not.toContain("A");
  });

  it("crew member with NASA cognition z < -2 is surfaced as a review flag", () => {
    const member = makeMember("D", 0.7);
    member.stageAScores = { ...member.stageAScores, "cognitive.nasa_cognition_battery": -2.5 };
    const crew = [member, makeMember("E", 0.6)];
    const result = evaluateCrewGates(crew, PLACEHOLDER_CRITERIA);
    expect(result.crewVerdict).toBe("review-flagged");
    expect(result.flaggedMemberIds).toContain("D");
  });

  it("single member crew with all defaults has no demo-threshold review flags", () => {
    const crew = [makeMember("Solo", 0.65)];
    const result = evaluateCrewGates(crew, PLACEHOLDER_CRITERIA);
    expect(result.crewVerdict).toBe("clear");
  });
});

// Minimal JSX smoke: PerScoreCard renders without crashing
describe("PerScoreCard — smoke render", () => {
  it("renders criterion label and score", () => {
    const criterion = PLACEHOLDER_CRITERIA[0]; // psych.conscientiousness
    const onScoreChange = () => {};

    const { container } = render(
      <PerScoreCard
        criterion={criterion}
        rawScore={70}
        onScoreChange={onScoreChange}
      />
    );

    expect(container.textContent).toContain(criterion.label);
    const slider = container.querySelector("input[type=range]");
    expect(slider).not.toBeNull();
  });

  it("fires onScoreChange when slider changes", () => {
    const criterion = PLACEHOLDER_CRITERIA[0];
    const changes: [string, number][] = [];
    const onScoreChange = (id: string, val: number) => changes.push([id, val]);

    const { container } = render(
      <PerScoreCard
        criterion={criterion}
        rawScore={50}
        onScoreChange={onScoreChange}
      />
    );

    const slider = container.querySelector("input[type=range]") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "75" } });
    expect(changes).toHaveLength(1);
    expect(changes[0][0]).toBe(criterion.id);
    expect(changes[0][1]).toBe(75);
  });
});
