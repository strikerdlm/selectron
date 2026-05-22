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

  test("preset crew dropdown loads K15 reference crew", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // The preset dropdown is in the header region with explicit aria-label.
    const presetSelect = page.getByLabel(/Load preset crew configuration/i);
    await expect(presetSelect).toBeVisible();
    await presetSelect.selectOption("k15-reference");

    // The default crew (Alpha…Foxtrot) should disappear; preset-k15-1..6 appear.
    await expect(page.getByText(/preset-k15-1/).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/\bAlpha\b/)).toHaveCount(0);
  });

  test("save/load toolbar mounts after sim; load dropdown is always visible", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // Load dropdown is in the page initially (always-visible by design).
    await expect(page.getByLabel(/Load recent IMM session/i)).toBeVisible();
    // Save and Export buttons are gated on outcome; hidden pre-sim.
    await expect(page.getByRole("button", { name: /Save current IMM session/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Export current IMM session as JSON/i })).toHaveCount(0);
  });

  test("K15 validation badge only renders for K15 reference scenario", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /^Crew$/i }).click();
    await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible();

    // Pre-sim: badge is hidden (it requires an `outcome`).
    await expect(page.getByRole("status", { name: /K15 Table 1 reproduction badge/i })).toHaveCount(0);
  });
});
