import { describe, it, expect } from "vitest";
import { IMM_KITS } from "../../src/imm/kits";
import {
  gateAvailable, DELIVERABILITY, RESOURCE_DELIVERY_CLASS,
} from "../../src/imm/health-support";
import { simulateIMM } from "../../src/imm/simulate";
import { K15_REFERENCE_CREW } from "../../src/imm/calibration";
import { ACTIVE_MISSIONS } from "../../src/data/imm-missions";

describe("health-support delivery-class gating", () => {
  it("is the identity transform for issHMS (K15 invariant)", () => {
    const gated = gateAvailable(IMM_KITS.issHMS.resources, "issHMS");
    expect(gated).toEqual(IMM_KITS.issHMS.resources);
  });

  it("is the identity transform for unlimited (K15 invariant)", () => {
    const gated = gateAvailable(IMM_KITS.unlimited.resources, "unlimited");
    expect(gated).toEqual(IMM_KITS.unlimited.resources);
  });

  it("zeroes guided + provider classes for the none tier", () => {
    const probe = { "iv-fluid": 6, "defibrillator": 1, "analgesic-mild": 60 };
    const gated = gateAvailable(probe, "none");
    expect(gated["iv-fluid"]).toBe(0);
    expect(gated["defibrillator"]).toBe(0);
    expect(gated["analgesic-mild"]).toBe(60);
  });

  it("scales provider-class quantities by 0.6 for medium, keeps guided + self", () => {
    const probe = { "defibrillator": 1, "iv-fluid": 6, "analgesic-mild": 60 };
    const gated = gateAvailable(probe, "medium");
    expect(gated["defibrillator"]).toBeCloseTo(0.6, 10);
    expect(gated["iv-fluid"]).toBe(6);
    expect(gated["analgesic-mild"]).toBe(60);
  });

  it("defaults unknown resources to the self class (deliverability 1 everywhere)", () => {
    const gated = gateAvailable({ "made-up-item": 5 }, "none");
    expect(gated["made-up-item"]).toBe(5);
  });

  it("DELIVERABILITY rows for issHMS/unlimited are all 1", () => {
    for (const t of ["issHMS", "unlimited"] as const) {
      expect(DELIVERABILITY[t]).toEqual({ self: 1, guided: 1, provider: 1 });
    }
  });

  it("every issHMS resource key has a delivery-class assignment", () => {
    for (const k of Object.keys(IMM_KITS.issHMS.resources)) {
      expect(RESOURCE_DELIVERY_CLASS[k]).toBeDefined();
    }
  });
});

describe("health-support engine integration", () => {
  const iss6 = ACTIVE_MISSIONS.find((m) => m.id === "iss-6mo")!;

  it("issHMS TME is unchanged by gating (identity → K15 safe)", () => {
    const out = simulateIMM({
      crew: K15_REFERENCE_CREW, mission: iss6,
      kit: IMM_KITS.issHMS, trials: 3000, seed: 0xc0ffee,
    });
    expect(out.tme.mean).toBeGreaterThan(87);
    expect(out.tme.mean).toBeLessThan(126);
  });

  it("medium CHI sits strictly between none and issHMS", () => {
    const opts = { crew: K15_REFERENCE_CREW, mission: iss6, trials: 4000, seed: 0xc0ffee };
    const none = simulateIMM({ ...opts, kit: IMM_KITS.none }).chi.mean;
    const medium = simulateIMM({ ...opts, kit: IMM_KITS.medium }).chi.mean;
    const iss = simulateIMM({ ...opts, kit: IMM_KITS.issHMS }).chi.mean;
    expect(medium).toBeGreaterThan(none);
    expect(medium).toBeLessThan(iss);
  });
});
