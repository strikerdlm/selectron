import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/db/schema";
import {
  createCandidate,
  createIMMSession,
  deleteCandidate,
  deleteIMMSession,
  exportDb,
  getCandidateWithEvidence,
  getIMMSession,
  importDb,
  listCandidates,
  listCriterionEntries,
  listIMMSessions,
  recentIMMSessionsFor,
  recentSimsFor,
  saveSimSession,
  updateCandidate,
  updateIMMSession,
  upsertCriterionEntry,
  attachFile,
  detachFile,
} from "@/db/repository";
import type {
  IMMCrewMember,
  IMMKitScenario,
  IMMMission,
  IMMOutcome,
  IMMSession,
  PosteriorSummary,
} from "@/imm/types";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe("createCandidate / listCandidates", () => {
  test("createCandidate persists a row with generated id + timestamps", async () => {
    const c = await createCandidate({ alias: "alpha" });
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(c.alias).toBe("alpha");
    expect(c.status).toBe("draft");
    expect(new Date(c.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
    expect(c.updatedAt).toBe(c.createdAt);
  });

  test("listCandidates returns rows in updatedAt desc order", async () => {
    await createCandidate({ alias: "alpha" });
    await new Promise((r) => setTimeout(r, 5));
    await createCandidate({ alias: "beta" });
    const rows = await listCandidates();
    expect(rows.map((r) => r.alias)).toEqual(["beta", "alpha"]);
  });
});

describe("updateCandidate", () => {
  test("bumps updatedAt and merges patch", async () => {
    const c = await createCandidate({ alias: "alpha" });
    await new Promise((r) => setTimeout(r, 5));
    const u = await updateCandidate(c.id, { fullName: "Alpha Astronaut", status: "ready" });
    expect(u.fullName).toBe("Alpha Astronaut");
    expect(u.status).toBe("ready");
    expect(u.updatedAt > c.updatedAt).toBe(true);
  });

  test("throws on missing id", async () => {
    await expect(updateCandidate("missing", { alias: "x" })).rejects.toThrow(/not found/);
  });
});

describe("deleteCandidate", () => {
  test("removes the row", async () => {
    const c = await createCandidate({ alias: "alpha" });
    await deleteCandidate(c.id);
    expect(await listCandidates()).toHaveLength(0);
  });

  test("keeps shared attachment BLOB when first candidate is deleted", async () => {
    // Candidate A and B each attach the SAME file (dedup → same attachment id).
    const candA = await createCandidate({ alias: "alpha" });
    const candB = await createCandidate({ alias: "beta" });

    const entryA = await upsertCriterionEntry({
      candidateId: candA.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const entryB = await upsertCriterionEntry({
      candidateId: candB.id,
      criterionId: "psych.conscientiousness",
      rawValue: 55.0,
    });

    // Both entries attach the same bytes → dedup hits → same attachment id.
    const att = await attachFile(await makeBlob("shared-pdf-content"), entryA.id);
    const attB = await attachFile(await makeBlob("shared-pdf-content"), entryB.id);
    expect(attB.id).toBe(att.id); // confirm dedup

    // Delete candidate A — attachment must STILL exist (B still references it).
    await deleteCandidate(candA.id);
    const stillPresent = await db.attachments.get(att.id);
    expect(stillPresent).toBeDefined();
  });

  test("removes orphan attachment BLOB when last referencing candidate is deleted", async () => {
    // Candidate A and B each attach the SAME file (dedup → same attachment id).
    const candA = await createCandidate({ alias: "alpha" });
    const candB = await createCandidate({ alias: "beta" });

    const entryA = await upsertCriterionEntry({
      candidateId: candA.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const entryB = await upsertCriterionEntry({
      candidateId: candB.id,
      criterionId: "psych.conscientiousness",
      rawValue: 55.0,
    });

    const att = await attachFile(await makeBlob("shared-pdf-content"), entryA.id);
    await attachFile(await makeBlob("shared-pdf-content"), entryB.id); // dedup → same id

    // Delete both candidates — after the second delete, no references remain.
    await deleteCandidate(candA.id);
    await deleteCandidate(candB.id);
    const gone = await db.attachments.get(att.id);
    expect(gone).toBeUndefined();
  });
});

describe("getCandidateWithEvidence", () => {
  test("returns candidate + empty criterionEntries for a fresh draft", async () => {
    const c = await createCandidate({ alias: "alpha" });
    const bundle = await getCandidateWithEvidence(c.id);
    expect(bundle.candidate.alias).toBe("alpha");
    expect(bundle.criterionEntries).toEqual([]);
  });
});

describe("upsertCriterionEntry / listCriterionEntries", () => {
  test("creates a fresh entry then upserts in place", async () => {
    const c = await createCandidate({ alias: "alpha" });
    const e1 = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.1,
      instrument: "NEO-PI-R",
      citationFree: "internal report 2026-05-10",
    });
    expect(e1.id).toBeDefined();

    const e2 = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 62.0,
    });
    expect(e2.id).toBe(e1.id); // same (candidateId+criterionId) → upsert
    expect(e2.rawValue).toBe(62.0);

    expect(await listCriterionEntries(c.id)).toHaveLength(1);
  });

  test("cascade-deletes when candidate is deleted", async () => {
    const c = await createCandidate({ alias: "alpha" });
    await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    await deleteCandidate(c.id);
    expect(await listCriterionEntries(c.id)).toHaveLength(0);
  });
});

async function makeBlob(content: string): Promise<File> {
  return new File([content], "test.txt", { type: "text/plain" });
}

describe("attachFile / detachFile", () => {
  test("attachFile stores BLOB and returns id", async () => {
    const c = await createCandidate({ alias: "alpha" });
    const entry = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const a = await attachFile(await makeBlob("hello"), entry.id);
    expect(a.sizeBytes).toBe(5);
    expect(a.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test("attachFile dedups by sha256", async () => {
    const c = await createCandidate({ alias: "alpha" });
    const entry = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const a1 = await attachFile(await makeBlob("same content"), entry.id);
    const a2 = await attachFile(await makeBlob("same content"), entry.id);
    expect(a2.id).toBe(a1.id); // dedup hit
  });

  test("detachFile removes attachment only when refcount hits zero", async () => {
    const c = await createCandidate({ alias: "alpha" });
    const e1 = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const e2 = await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.emotional_stability",
      rawValue: 50.0,
    });
    const a = await attachFile(await makeBlob("shared"), e1.id);
    await attachFile(await makeBlob("shared"), e2.id); // dedup → same id, refcount 2

    await detachFile(a.id, e1.id);
    const stillThere = await db.attachments.get(a.id);
    expect(stillThere).toBeDefined();

    await detachFile(a.id, e2.id);
    const goneNow = await db.attachments.get(a.id);
    expect(goneNow).toBeUndefined();
  });
});

function fakePosterior() {
  return {
    chi: { mean: 0.95, ci90: [0.91, 0.99] as [number, number], ci95: [0.90, 1.00] as [number, number] },
    pEarlyTermination: { mean: 0, ci90: [0, 0] as [number, number] },
    expectedLostCrewDays: { mean: 3.87, ci90: [1.0, 7.5] as [number, number] },
    perConditionQTL: {},
    ess: 25000,
    trials: 25000,
  };
}

describe("simSessions", () => {
  test("saveSimSession persists + recentSimsFor returns desc by runAt", async () => {
    const c = await createCandidate({ alias: "alpha" });
    await saveSimSession({
      candidateId: c.id,
      missionId: "mdrs-2wk",
      trials: 25000,
      chiStar: 0.7,
      seed: 0xc0ffee,
      priorsVersion: "synthetic-iter3-ui-scaffold",
      posterior: fakePosterior(),
      chiSamples: [0.9, 0.95, 0.98],
      qtlSamples: [4, 3, 2],
    });
    const sims = await recentSimsFor(c.id);
    expect(sims).toHaveLength(1);
    expect(sims[0].missionId).toBe("mdrs-2wk");
  });
});

// ───────────────────────────────────────────────────────────────────────────
// IMMSession CRUD (IMM-38, v3 schema)
// ───────────────────────────────────────────────────────────────────────────

function fakePosteriorSummary(mean: number): PosteriorSummary {
  return {
    mean,
    ci90: [mean * 0.9, mean * 1.1],
    ci95: [mean * 0.85, mean * 1.15],
    sd: mean * 0.05,
  };
}

function fakeMission(id = "mars-transit"): IMMMission {
  return {
    id,
    label: "Mars Transit (180d)",
    durationDays: 180,
    crewSize: 4,
    totalEVAs: 0,
    evaSchedule: [],
  };
}

function fakeCrewMember(id = "m1"): IMMCrewMember {
  return {
    id,
    sex: "male",
    contacts: false,
    crowns: false,
    CAC_positive: false,
    abdominal_surgery_history: false,
    EVA_eligible: false,
    EVA_count: 0,
  };
}

function fakeKit(): IMMKitScenario {
  return {
    scenarioId: "issHMS",
    label: "ISS HMS-equivalent kit",
    resources: { "antibiotic-broad-spectrum": 12, "iv-fluids-1L": 6 },
  };
}

function fakeOutcome(): IMMOutcome {
  return {
    tme: fakePosteriorSummary(3.2),
    chi: fakePosteriorSummary(0.92),
    pEvac: fakePosteriorSummary(2.4),
    pLocl: fakePosteriorSummary(0.31),
    missionSuccess: fakePosteriorSummary(96.1),
    perConditionDrivers: [
      { conditionId: "renal.stone", pEvacContrib: 0.42, pLoclContrib: 0.05, tmeContrib: 0.18 },
    ],
    convergence: {
      trialCheckpoints: [1000, 5000, 10000],
      sigmaChi: [0.04, 0.018, 0.012],
      sigmaPevac: [0.06, 0.025, 0.017],
    },
  };
}

function fakeIMMSessionInput(
  overrides: Partial<Omit<IMMSession, "id" | "createdAt">> = {},
): Omit<IMMSession, "id" | "createdAt"> {
  return {
    candidateId: null,
    mission: fakeMission(),
    crew: [fakeCrewMember("m1"), fakeCrewMember("m2")],
    kit: fakeKit(),
    trials: 25000,
    seed: 0xc0ffee,
    overrides: {},
    vulnerabilityMode: "selectron-stage-a-ml",
    engine: "monte-carlo",
    outcomes: fakeOutcome(),
    validation: {
      vsK15Table1: {
        delta_tme: 0.05,
        delta_chi: 0.01,
        delta_pEvac: 0.03,
        delta_pLocl: 0.02,
        within_ci95: true,
      },
    },
    laypersonCaptionsExpanded: {},
    ...overrides,
  };
}

describe("IMMSession CRUD", () => {
  test("createIMMSession + getIMMSession round-trip with full nested shape", async () => {
    const id = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-1" }));
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    const back = await getIMMSession(id);
    expect(back).not.toBeNull();
    expect(back!.id).toBe(id);
    expect(back!.candidateId).toBe("cand-1");
    expect(back!.mission.id).toBe("mars-transit");
    expect(back!.crew).toHaveLength(2);
    expect(back!.outcomes.chi.mean).toBeCloseTo(0.92, 5);
    expect(back!.outcomes.perConditionDrivers[0].conditionId).toBe("renal.stone");
    expect(new Date(back!.createdAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test("getIMMSession returns null when row is missing", async () => {
    expect(await getIMMSession("nope")).toBeNull();
  });

  test("listIMMSessions returns rows sorted by createdAt desc", async () => {
    const id1 = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-A" }));
    await new Promise((r) => setTimeout(r, 5));
    const id2 = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-B" }));
    await new Promise((r) => setTimeout(r, 5));
    const id3 = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-C" }));
    const list = await listIMMSessions();
    expect(list.map((r) => r.id)).toEqual([id3, id2, id1]);
  });

  test("listIMMSessions filters by candidateId === null (ad-hoc crew)", async () => {
    await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-A" }));
    await createIMMSession(fakeIMMSessionInput({ candidateId: null }));
    await createIMMSession(fakeIMMSessionInput({ candidateId: null }));
    const adHoc = await listIMMSessions({ candidateId: null });
    expect(adHoc).toHaveLength(2);
    expect(adHoc.every((s) => s.candidateId === null)).toBe(true);
  });

  test("listIMMSessions filters by missionId via nested-key index", async () => {
    await createIMMSession(fakeIMMSessionInput({ mission: fakeMission("mars-transit") }));
    await createIMMSession(fakeIMMSessionInput({ mission: fakeMission("iss-6mo") }));
    await createIMMSession(fakeIMMSessionInput({ mission: fakeMission("mars-transit") }));
    const mars = await listIMMSessions({ missionId: "mars-transit" });
    expect(mars).toHaveLength(2);
    expect(mars.every((s) => s.mission.id === "mars-transit")).toBe(true);
  });

  test("listIMMSessions composes candidateId + missionId filters", async () => {
    await createIMMSession(
      fakeIMMSessionInput({ candidateId: "cand-A", mission: fakeMission("mars-transit") }),
    );
    await createIMMSession(
      fakeIMMSessionInput({ candidateId: "cand-A", mission: fakeMission("iss-6mo") }),
    );
    await createIMMSession(
      fakeIMMSessionInput({ candidateId: "cand-B", mission: fakeMission("mars-transit") }),
    );
    const got = await listIMMSessions({ candidateId: "cand-A", missionId: "mars-transit" });
    expect(got).toHaveLength(1);
    expect(got[0].candidateId).toBe("cand-A");
    expect(got[0].mission.id).toBe("mars-transit");
  });

  test("listIMMSessions honors limit", async () => {
    for (let i = 0; i < 5; i++) {
      await createIMMSession(fakeIMMSessionInput({ candidateId: `cand-${i}` }));
      await new Promise((r) => setTimeout(r, 2));
    }
    const got = await listIMMSessions({ limit: 2 });
    expect(got).toHaveLength(2);
  });

  test("updateIMMSession merges patch and preserves id + createdAt", async () => {
    const id = await createIMMSession(fakeIMMSessionInput({ trials: 25000 }));
    const before = await getIMMSession(id);
    await new Promise((r) => setTimeout(r, 5));
    await updateIMMSession(id, { trials: 50000, seed: 0xdeadbeef });
    const after = await getIMMSession(id);
    expect(after!.id).toBe(before!.id);
    expect(after!.createdAt).toBe(before!.createdAt);
    expect(after!.trials).toBe(50000);
    expect(after!.seed).toBe(0xdeadbeef);
    expect(after!.outcomes.chi.mean).toBeCloseTo(0.92, 5); // untouched
  });

  test("updateIMMSession throws on missing id", async () => {
    await expect(updateIMMSession("missing", { trials: 1 })).rejects.toThrow(/not found/);
  });

  test("deleteIMMSession removes the row and is idempotent on not-found", async () => {
    const id = await createIMMSession(fakeIMMSessionInput());
    await deleteIMMSession(id);
    expect(await getIMMSession(id)).toBeNull();
    // Second delete must NOT throw (matches saveSimSession-family convention).
    await expect(deleteIMMSession(id)).resolves.toBeUndefined();
    await expect(deleteIMMSession("never-existed")).resolves.toBeUndefined();
  });

  test("recentIMMSessionsFor returns desc-by-createdAt for a candidate, honors limit", async () => {
    await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-A" }));
    await new Promise((r) => setTimeout(r, 5));
    const id2 = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-A" }));
    await new Promise((r) => setTimeout(r, 5));
    const id3 = await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-A" }));
    await createIMMSession(fakeIMMSessionInput({ candidateId: "cand-B" })); // noise

    const recent = await recentIMMSessionsFor("cand-A", 2);
    expect(recent).toHaveLength(2);
    expect(recent.map((r) => r.id)).toEqual([id3, id2]);
    expect(recent.every((r) => r.candidateId === "cand-A")).toBe(true);
  });
});

describe("exportDb / importDb", () => {
  test("round-trips candidates + criterion entries + sims", async () => {
    const c = await createCandidate({ alias: "alpha" });
    await upsertCriterionEntry({
      candidateId: c.id,
      criterionId: "psych.conscientiousness",
      rawValue: 60.0,
    });
    const dump = await exportDb();
    await db.delete();
    await db.open();
    expect(await listCandidates()).toHaveLength(0);
    await importDb(dump);
    expect(await listCandidates()).toHaveLength(1);
    expect((await listCriterionEntries(c.id))[0].rawValue).toBe(60.0);
  });
});
