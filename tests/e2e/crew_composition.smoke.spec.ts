// tests/e2e/crew_composition.smoke.spec.ts
//
// Manual UI smoke test for the CrewComposition view — verifies the IMM Phase 2
// UI batch (IMM-46 K15 validation badge + IMM-49 preset crews + IMM-50 session
// save/load/export) renders end-to-end against the real Vite dev server and a
// real browser. Complements the RTL unit tests in tests/ui/ by exercising the
// integration paths (browser navigation, ECharts rendering, Web Worker
// simulation, IndexedDB persistence) that jsdom can't reach.

import { expect, test } from "@playwright/test";

test.describe("CrewComposition smoke", () => {
  test("page loads, header renders, zero console errors before interaction", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    // SELECTRON header in the app shell
    await expect(page.getByRole("heading", { name: /SELECTRON/i })).toBeVisible();
    // Crew Composition is one of the nav tabs (header)
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible({ timeout: 5_000 });

    // Zero React/runtime console errors before any user interaction
    // (some echarts canvas warnings tolerated — filtered below).
    const realErrors = consoleErrors.filter((e) =>
      !e.includes("canvas") && !e.includes("WebGL") && !e.includes("React DevTools")
    );
    expect(realErrors, `unexpected console errors: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("crew size stepper removes members (manual configuration, presets eliminated)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // Presets were eliminated (Diego 2026-05-29) — the user configures crew size
    // manually. Default crew is 6 (Alpha…Foxtrot).
    await expect(page.getByText(/\bFoxtrot\b/).first()).toBeVisible();
    // Removing one member via the crew-size stepper drops the last member (Foxtrot).
    await page.getByRole("button", { name: /remove one crew member/i }).click();
    await expect(page.getByText(/\bFoxtrot\b/)).toHaveCount(0, { timeout: 5_000 });
  });

  test("save / load / export toolbar is fully available before a run (config-only saving)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // Load dropdown is always visible by design.
    await expect(page.getByLabel(/Load recent IMM session/i)).toBeVisible();
    // 2026-05-29: Save and Export are now always available so a config-only
    // session (no outcome yet) can be saved/exported before running.
    await expect(page.getByRole("button", { name: /Save current IMM session/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export current IMM session as JSON/i })).toBeVisible();
  });

  test("K15 validation badge only renders for K15 reference scenario", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // Pre-sim: badge is hidden (it requires an `outcome`).
    await expect(page.getByRole("status", { name: /K15 Table 1 reproduction badge/i })).toHaveCount(0);
  });

  test("scenario trait coupling exposes beta scale control", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    await expect(page.getByText("off for scientific mode")).toBeVisible();
    await page.getByRole("switch", { name: /off/i }).click();
    await expect(page.getByText("operator-supplied scenario analysis")).toBeVisible();
    await expect(page.getByLabel("scenario beta coefficient scale")).toBeVisible();
    await expect(page.getByText("scenario levers")).toBeVisible();
  });
});
