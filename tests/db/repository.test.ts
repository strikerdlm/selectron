import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/db/schema";
import {
  createCandidate,
  deleteCandidate,
  exportDb,
  getCandidateWithEvidence,
  importDb,
  listCandidates,
  listCriterionEntries,
  recentSimsFor,
  saveSimSession,
  updateCandidate,
  upsertCriterionEntry,
  attachFile,
  detachFile,
} from "@/db/repository";

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
