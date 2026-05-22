import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "@/db/schema";
import type { DbCandidate } from "@/db/schema";
import type { IMMSession, PosteriorSummary } from "@/imm/types";

describe("schema migrations", () => {
  test("v1 schema opens cleanly", async () => {
    await db.delete();
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
  });

  test("SCHEMA_VERSION is 3 (v3 adds the immSessions table)", () => {
    // v3 additive migration (IMM Phase 2, 2026-05-22). Real round-trip
    // coverage lives in the "Dexie schema v3 — immSessions table" block below.
    expect(SCHEMA_VERSION).toBe(3);
  });
});

const emptyPosterior = (): PosteriorSummary => ({
  mean: 0,
  ci90: [0, 0],
  ci95: [0, 0],
  sd: 0,
});

function buildSession(id: string): IMMSession {
  return {
    id,
    candidateId: null,
    createdAt: new Date("2026-05-22T00:00:00Z").toISOString(),
    mission: {
      id: "mission-v3-test",
      label: "v3 round-trip",
      durationDays: 30,
      crewSize: 1,
      totalEVAs: 0,
      evaSchedule: [],
    },
    crew: [
      {
        id: "crew-1",
        sex: "male",
        contacts: false,
        crowns: false,
        CAC_positive: false,
        abdominal_surgery_history: false,
        EVA_eligible: false,
        EVA_count: 0,
      },
    ],
    kit: {
      scenarioId: "issHMS",
      label: "ISS HMS",
      resources: {},
    },
    trials: 1000,
    seed: 42,
    overrides: {},
    vulnerabilityMode: "boolean-flags",
    engine: "monte-carlo",
    outcomes: {
      tme: emptyPosterior(),
      chi: emptyPosterior(),
      pEvac: emptyPosterior(),
      pLocl: emptyPosterior(),
      missionSuccess: emptyPosterior(),
      perConditionDrivers: [],
      convergence: { trialCheckpoints: [], sigmaChi: [], sigmaPevac: [] },
    },
    validation: {
      vsK15Table1: {
        delta_tme: 0,
        delta_chi: 0,
        delta_pEvac: 0,
        delta_pLocl: 0,
        within_ci95: true,
      },
    },
    laypersonCaptionsExpanded: {},
  };
}

describe("Dexie schema v3 — immSessions table", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  test("opens cleanly at v3 and exposes the immSessions table", async () => {
    expect(db.verno).toBe(3);
    expect(db.immSessions).toBeDefined();
    expect(await db.immSessions.count()).toBe(0);
  });

  test("v2 tables remain readable after v3 upgrade", async () => {
    // Seed a v2-shaped row (candidate with accessTier) and confirm it
    // round-trips intact under the v3 schema — additive migration contract.
    const c: DbCandidate = {
      id: "v2-survives-v3",
      alias: "v2-survives-v3",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessTier: "minimum",
    };
    await db.candidates.add(c);
    const got = await db.candidates.get("v2-survives-v3");
    expect(got).toBeDefined();
    expect(got?.accessTier).toBe("minimum");
  });

  test("inserts and reads an IMMSession round-trip", async () => {
    const session = buildSession("imm-session-1");
    await db.immSessions.add(session);

    const got = await db.immSessions.get("imm-session-1");
    expect(got).toBeDefined();
    expect(got?.id).toBe("imm-session-1");
    expect(got?.mission.id).toBe("mission-v3-test");
    expect(got?.crew).toHaveLength(1);
    expect(got?.trials).toBe(1000);
    expect(got?.seed).toBe(42);
    expect(got?.engine).toBe("monte-carlo");
    expect(got?.validation.vsK15Table1.within_ci95).toBe(true);
  });

  test("immSessions supports the mission.id nested index", async () => {
    await db.immSessions.add(buildSession("imm-session-a"));
    await db.immSessions.add({
      ...buildSession("imm-session-b"),
      mission: { ...buildSession("imm-session-b").mission, id: "mission-other" },
    });
    const hits = await db.immSessions.where("mission.id").equals("mission-v3-test").toArray();
    expect(hits).toHaveLength(1);
    expect(hits[0].id).toBe("imm-session-a");
  });
});
