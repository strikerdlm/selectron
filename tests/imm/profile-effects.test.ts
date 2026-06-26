import { describe, it, expect } from "vitest";
import {
  ACCEPTED_PROFILE_EFFECTS,
  DESCRIPTIVE_ONLY_FIELDS,
  ISOLATION_CONFINEMENT_EXPOSURE_MODELED,
  PROPOSAL_PROFILE_EFFECTS,
  PROFILE_EFFECTS,
  PROFILE_MAPPING_VERSION,
} from "@/imm/profile-effects";

describe("profile-effects registry (F2)", () => {
  it("has a versioned registry with modeled and descriptive-only entries", () => {
    expect(PROFILE_MAPPING_VERSION).toMatch(/2026-06/);
    expect(PROFILE_EFFECTS.length).toBeGreaterThan(4);
    expect(ACCEPTED_PROFILE_EFFECTS.every((e) => e.evidenceStatus === "accepted")).toBe(true);
    expect(PROPOSAL_PROFILE_EFFECTS.every((e) => e.evidenceStatus === "proposal")).toBe(true);
    expect(DESCRIPTIVE_ONLY_FIELDS.every((e) => e.evidenceStatus === "unsupported")).toBe(true);
  });

  it("separates default/adjudicated effects from proposal-stage exploratory effects", () => {
    expect(ACCEPTED_PROFILE_EFFECTS.map((e) => e.profilePath).sort()).toEqual([
      "mission.durationDays",
      "mission.evaSchedule",
    ]);
    expect(PROPOSAL_PROFILE_EFFECTS.map((e) => e.profilePath).sort()).toEqual([
      "kit.resources",
      "mission.kind",
      "profile.communication.delaySec",
    ]);
  });

  it("comms delay is a proposal-stage exploratory incidence driver", () => {
    const comms = PROFILE_EFFECTS.find((e) => e.profilePath === "profile.communication.delaySec");
    expect(comms?.evidenceStatus).toBe("proposal");
    expect(comms?.target).toBe("incidence");
    expect(comms?.estimate).toBeGreaterThan(0);
  });

  it("does not flag profile-level isolation/confinement exposure as accepted-modeled", () => {
    expect(ISOLATION_CONFINEMENT_EXPOSURE_MODELED).toBe(false);
  });

  it("keeps terrestrial field-EVA type descriptive until analog-specific priors exist", () => {
    const fieldEva = PROFILE_EFFECTS.find((e) => e.profilePath === "profile.eva.type");
    expect(fieldEva?.evidenceStatus).toBe("unsupported");
    expect(fieldEva?.target).toBe("incidence");
    expect(fieldEva?.note).toContain("analog-specific exposure denominators");
  });
});
