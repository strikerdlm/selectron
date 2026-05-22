import { describe, expect, test, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "@/db/schema";
import type { DbCandidate } from "@/db/schema";

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe("Dexie schema v2 — DbCandidate.accessTier", () => {
  test("SCHEMA_VERSION is at least 2 (v2 contract still satisfied after later additive migrations)", () => {
    // v2 added DbCandidate.accessTier; that contract is preserved under v3+.
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(2);
  });

  test("can write a candidate with accessTier and read it back", async () => {
    const c: DbCandidate = {
      id: "v2-test",
      alias: "v2-test",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessTier: "minimum",
    };
    await db.candidates.add(c);
    const got = await db.candidates.get("v2-test");
    expect(got?.accessTier).toBe("minimum");
  });

  test("candidates created without an accessTier remain readable (backwards-compat)", async () => {
    const c: DbCandidate = {
      id: "v1-legacy",
      alias: "legacy",
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.candidates.add(c);
    const got = await db.candidates.get("v1-legacy");
    expect(got).toBeDefined();
    expect(got?.accessTier).toBeUndefined();
  });
});
