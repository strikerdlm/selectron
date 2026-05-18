import { describe, it, expect } from "vitest";
import { ANALOG_MISSIONS } from "@/data/analog-missions";

describe("ANALOG_MISSIONS", () => {
  it("ships exactly 5 analog mission profiles for Iter-3 v1", () => {
    expect(ANALOG_MISSIONS).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = ANALOG_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers all six MissionType values exactly once or zero times (no duplicates)", () => {
    const types = ANALOG_MISSIONS.map((m) => m.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("every mission has positive duration and crew size", () => {
    for (const m of ANALOG_MISSIONS) {
      expect(m.durationDays).toBeGreaterThan(0);
      expect(m.crewSize).toBeGreaterThan(0);
      expect(m.evaCount).toBeGreaterThanOrEqual(0);
      expect(m.commsDelaySec).toBeGreaterThanOrEqual(0);
    }
  });

  it("every mission carries at least one citation", () => {
    for (const m of ANALOG_MISSIONS) {
      expect(m.citations.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("countermeasure availability values are in [0, 1]", () => {
    for (const m of ANALOG_MISSIONS) {
      for (const v of Object.values(m.countermeasures)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
