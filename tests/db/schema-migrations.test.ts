import { describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "@/db/schema";

describe("schema migrations", () => {
  test("v1 schema opens cleanly", async () => {
    await db.delete();
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
  });

  test("SCHEMA_VERSION is 2 (v2 adds DbCandidate.accessTier)", async () => {
    // v2 promoted from placeholder. Real round-trip covered by schema_v2_migration.test.ts.
    expect(SCHEMA_VERSION).toBe(2);
  });
});
