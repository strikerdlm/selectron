// tests/imm/missions.test.ts
import { describe, it, expect } from "vitest";
import { ACTIVE_MISSIONS, BENCHMARK_MISSIONS, IMM_MISSIONS } from "../../src/data/imm-missions";

describe("IMM_MISSIONS", () => {
  it("includes K15 ISS 6mo reference", () => {
    const iss6 = IMM_MISSIONS.find(m => m.id === "iss-6mo");
    expect(iss6).toBeDefined();
    expect(iss6!.durationDays).toBe(180);
    expect(iss6!.crewSize).toBe(6);
    expect(iss6!.totalEVAs).toBe(12);
  });

  it("includes TM21 AMM and SMM", () => {
    const amm = IMM_MISSIONS.find(m => m.id === "amm-426d");
    expect(amm).toBeDefined();
    expect(amm!.durationDays).toBe(426);
    const smm = IMM_MISSIONS.find(m => m.id === "smm-923d");
    expect(smm).toBeDefined();
    expect(smm!.durationDays).toBe(923);
  });

  it("includes the 8 existing analog missions for IMM-runnable parity", () => {
    const expectedIds = ["analog-7d","analog-10d","analog-14d","analog-22d","analog-45d","analog-90d","antarctic-winter","analog-520d"];
    for (const id of expectedIds) {
      expect(IMM_MISSIONS.find(m => m.id === id)).toBeDefined();
    }
  });

  it("uses analog missions as the active operational default set", () => {
    expect(ACTIVE_MISSIONS.length).toBeGreaterThan(0);
    expect(ACTIVE_MISSIONS.every((m) => m.kind !== "leo-iss")).toBe(true);
    expect(ACTIVE_MISSIONS.every((m) => m.profile)).toBe(true);
    expect(BENCHMARK_MISSIONS.some((m) => m.id === "iss-6mo")).toBe(true);
  });
});
