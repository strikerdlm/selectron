// Regression guard for the "thor" mission-type gap (2026-05-29).
//
// The mission catalog was expanded with short-22d (type "thor") but the
// hardcoded SYNTHETIC_PRIORS MISSION_TYPES list was not updated, so that
// mission found no prior for ANY condition → zero events → CHI = 100 %
// (a spurious "perfect, GO" verdict in the F7 mission comparison). These tests
// fail loudly if any ANALOG_MISSIONS type is ever left without priors again.

import { describe, it, expect } from "vitest";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { SYNTHETIC_PRIORS } from "@/data/synthetic-iter3";
import { validatePriorsJson } from "@/risk/priorsSchema";

describe("SYNTHETIC_PRIORS mission-type coverage", () => {
  const types = Array.from(new Set(ANALOG_MISSIONS.map((m) => m.type)));

  it("covers every mission type present in the catalog (incl. 'thor')", () => {
    expect(types).toContain("thor");
    for (const c of ANALOG_CONDITIONS) {
      const cond = SYNTHETIC_PRIORS.conditions[c.id];
      expect(cond, `no prior for condition ${c.id}`).toBeDefined();
      for (const t of types) {
        expect(
          cond.missions[t],
          `condition "${c.id}" has no prior for mission type "${t}" — that mission would score CHI=100%`,
        ).toBeDefined();
      }
    }
  });

  it("no mission type is left with zero condition coverage (the CHI=100% trap)", () => {
    for (const t of types) {
      const covered = ANALOG_CONDITIONS.some(
        (c) => SYNTHETIC_PRIORS.conditions[c.id]?.missions[t],
      );
      expect(covered, `mission type "${t}" has no condition priors`).toBe(true);
    }
  });
});

describe("team conditions are de-EVA'd (kind rate, crew scope)", () => {
  it("conflict-event and leadership-challenge are no longer event-kind", () => {
    const byId = new Map(ANALOG_CONDITIONS.map((c) => [c.id, c]));
    for (const id of ["conflict-event", "leadership-challenge"]) {
      expect(byId.get(id)!.kind).toBe("rate");
    }
  });
});

describe("SYNTHETIC_PRIORS team block", () => {
  it("has a team block with lambda_base_samples for every team-family condition", () => {
    expect(SYNTHETIC_PRIORS.team).toBeDefined();
    const teamIds = ANALOG_CONDITIONS.filter((c) => c.family === "team").map((c) => c.id);
    for (const id of teamIds) {
      expect(SYNTHETIC_PRIORS.team!.lambda_base_samples[id]?.length ?? 0).toBeGreaterThan(0);
    }
  });
  it("temporal_p > 1 (back-loaded) and pi_unstable_base ≈ 0.658", () => {
    expect(SYNTHETIC_PRIORS.team!.temporal_p).toBeGreaterThan(1);
    expect(SYNTHETIC_PRIORS.team!.pi_unstable_base).toBeCloseTo(0.658, 2);
  });
  it("team block validates against the schema", () => {
    expect(() => validatePriorsJson(SYNTHETIC_PRIORS)).not.toThrow();
  });
});
