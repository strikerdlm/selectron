import { describe, it, expect } from "vitest";
import { profileIncidenceMultiplier } from "@/imm/apply-profile-effects";
import { ACTIVE_MISSIONS } from "@/data/imm-missions";

describe("apply-profile-effects — comms delay pilot", () => {
  const realtime = ACTIVE_MISSIONS.find((m) => m.id === "analog-7d")!;
  const delayed = ACTIVE_MISSIONS.find((m) => m.id === "analog-45d")!;

  it("returns 1.0 for non behavioral/psychiatric families", () => {
    expect(profileIncidenceMultiplier(realtime, "infectious")).toBe(1.0);
  });

  it("returns 1.0 when delay is zero", () => {
    expect(profileIncidenceMultiplier(realtime, "behavioral")).toBe(1.0);
  });

  it("does not apply proposal comms-delay effects in adjudicated default mode", () => {
    const none = profileIncidenceMultiplier(realtime, "behavioral");
    const high = profileIncidenceMultiplier(delayed, "behavioral");
    expect(none).toBe(1.0);
    expect(high).toBe(1.0);
  });

  it("does not apply profile effects in off mode", () => {
    expect(profileIncidenceMultiplier(delayed, "behavioral", "off")).toBe(1.0);
  });

  it("increases behavioral incidence multiplier with comms delay only in exploratory mode", () => {
    const none = profileIncidenceMultiplier(realtime, "behavioral", "exploratory");
    const high = profileIncidenceMultiplier(delayed, "behavioral", "exploratory");
    expect(none).toBe(1.0);
    expect(high).toBeGreaterThan(1.0);
  });

  it("differentiates real-time vs delayed analog profiles for psychiatric λ in exploratory mode", () => {
    const marsLike = ACTIVE_MISSIONS.find((m) => m.id === "analog-520d")!;
    expect(profileIncidenceMultiplier(marsLike, "psychiatric", "exploratory")).toBeGreaterThan(
      profileIncidenceMultiplier(realtime, "psychiatric", "exploratory"),
    );
  });
});
