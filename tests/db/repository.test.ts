import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/db/schema";
import {
  createCandidate,
  deleteCandidate,
  getCandidateWithEvidence,
  listCandidates,
  updateCandidate,
  listCriterionEntries,
  upsertCriterionEntry,
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
