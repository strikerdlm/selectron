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
