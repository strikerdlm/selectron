// Regression test: pickComparisonSet must find comparison rows even when
// notes are prefixed with "tier=<tier> · " (the format written since the
// AccessTier scope expansion). The original code used startsWith("comparison-run-")
// which silently dropped all tier-prefixed rows.

import { describe, it, expect } from "vitest";
import { pickComparisonSet } from "../../src/ui/figures/MissionComparison";
import { ANALOG_MISSIONS } from "../../src/data/analog-missions";
import type { SimSession } from "../../src/db/schema";

function fakeSession(missionId: string, notes: string): SimSession {
  return {
    id: `fake-${missionId}`,
    candidateId: "cand-1",
    missionId,
    runAt: "2026-05-24T00:00:00.000Z",
    trials: 25000,
    chiStar: 0.7,
    seed: 0xfeed,
    priorsVersion: "synthetic-v1",
    posterior: {
      chi: { mean: 0.95, ci90: [0.90, 0.99] as readonly [number, number], ci95: [0.88, 0.99] as readonly [number, number] },
      pEarlyTermination: { mean: 0.0, ci90: [0.0, 0.0] as readonly [number, number] },
      expectedLostCrewDays: { mean: 3.0, ci90: [1.0, 6.0] as readonly [number, number] },
      perConditionQTL: {},
      ess: 25000,
      trials: 25000,
    },
    chiSamples: [0.95],
    qtlSamples: [3.0],
    notes,
  };
}

describe("pickComparisonSet", () => {
  const runId = "2026-05-24T00:00:00.000Z";

  it("finds comparison set with tier-prefixed notes", () => {
    const rows = ANALOG_MISSIONS.map((m) =>
      fakeSession(m.id, `tier=minimum · comparison-run-${runId}`),
    );
    const result = pickComparisonSet(rows);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(ANALOG_MISSIONS.length);
  });

  it("finds comparison set with bare comparison-run notes (legacy format)", () => {
    const rows = ANALOG_MISSIONS.map((m) =>
      fakeSession(m.id, `comparison-run-${runId}`),
    );
    const result = pickComparisonSet(rows);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(ANALOG_MISSIONS.length);
  });

  it("returns null when set is incomplete", () => {
    const rows = ANALOG_MISSIONS.slice(0, 3).map((m) =>
      fakeSession(m.id, `tier=minimum · comparison-run-${runId}`),
    );
    const result = pickComparisonSet(rows);
    expect(result).toBeNull();
  });

  it("returns null when no comparison rows exist", () => {
    const rows = ANALOG_MISSIONS.map((m) =>
      fakeSession(m.id, `tier=minimum`),
    );
    const result = pickComparisonSet(rows);
    expect(result).toBeNull();
  });

  it("picks the most recent complete set when multiple exist", () => {
    const oldRunId = "2026-05-23T00:00:00.000Z";
    const newRunId = "2026-05-24T12:00:00.000Z";
    const oldRows = ANALOG_MISSIONS.map((m) =>
      fakeSession(m.id, `tier=minimum · comparison-run-${oldRunId}`),
    );
    const newRows = ANALOG_MISSIONS.map((m) => ({
      ...fakeSession(m.id, `tier=minimum · comparison-run-${newRunId}`),
      id: `new-${m.id}`,
    }));
    const result = pickComparisonSet([...oldRows, ...newRows]);
    expect(result).not.toBeNull();
    expect(result![0].id).toMatch(/^new-/);
  });
});
