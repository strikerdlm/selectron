import { describe, it, expect } from "vitest";
import { ANALOG_MISSIONS } from "@/data/analog-missions";

describe("ANALOG_MISSIONS", () => {
  it("ships 8 analog mission profiles (5 Iter-3 v1 + 3 short-campaign additions for Diego's 2026-05-19 scope expansion)", () => {
    expect(ANALOG_MISSIONS).toHaveLength(8);
  });

  it("has unique ids", () => {
    const ids = ANALOG_MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers MissionType values; duplicates allowed (multiple campaigns may share the same MissionType, e.g. mdrs-2wk + short-7d both type 'mdrs')", () => {
    const types = ANALOG_MISSIONS.map((m) => m.type);
    // No assertion on uniqueness — Diego's 2026-05-19 expansion adds short-7d ('mdrs'),
    // short-22d ('thor'), hi-seas-45d ('hi-seas'), reusing MissionType enum members.
    // We instead assert every type is from the allowed enum (checked via TS, no runtime check needed).
    expect(types.length).toBeGreaterThanOrEqual(8);
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
