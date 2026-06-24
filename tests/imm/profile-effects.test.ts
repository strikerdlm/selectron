import { describe, it, expect } from "vitest";
import {
  DESCRIPTIVE_ONLY_FIELDS,
  ISOLATION_CONFINEMENT_EXPOSURE_MODELED,
  PROFILE_EFFECTS,
  PROFILE_MAPPING_VERSION,
} from "@/imm/profile-effects";

describe("profile-effects registry (F2)", () => {
  it("has a versioned registry with modeled and descriptive-only entries", () => {
    expect(PROFILE_MAPPING_VERSION).toMatch(/2026-06/);
    expect(PROFILE_EFFECTS.length).toBeGreaterThan(4);
    expect(DESCRIPTIVE_ONLY_FIELDS.every((e) => e.evidenceStatus === "unsupported")).toBe(true);
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
