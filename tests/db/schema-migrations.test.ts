import { describe, expect, test } from "vitest";
import "fake-indexeddb/auto";
import { db, SCHEMA_VERSION } from "@/db/schema";

describe("schema migrations", () => {
  test("v1 schema opens cleanly", async () => {
    await db.delete();
    await db.open();
    expect(db.verno).toBe(SCHEMA_VERSION);
  });

  test("future v2 migration scaffold — no-op for now", async () => {
    // Placeholder: when SCHEMA_VERSION bumps to 2, add a Dexie.version(2).upgrade(...)
    // block to schema.ts and replace this test with a real round-trip.
    expect(SCHEMA_VERSION).toBe(1);
  });
});
