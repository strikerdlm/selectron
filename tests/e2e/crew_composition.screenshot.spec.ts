// Captures a CrewComposition screenshot for human-eye review.
// Run with: npx playwright test tests/e2e/crew_composition.screenshot.spec.ts --reporter=list
// Screenshot lands at: exports/2026-05-22_crew_composition_initial.png

import { test } from "@playwright/test";
import path from "node:path";

test("screenshot CrewComposition initial state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1800 });
  await page.goto("/");
  await page.getByRole("button", { name: /^Crew$/i }).click();
  await page.waitForSelector('h2:has-text("Crew Composition")', { timeout: 5_000 });
  await page.waitForTimeout(800); // settle ECharts mini-figures
  const date = new Date().toISOString().slice(0, 10);
  const out = path.resolve(`exports/${date}_crew_composition_initial.png`);
  await page.screenshot({ path: out, fullPage: true });
  // eslint-disable-next-line no-console
  console.log(`Screenshot → ${out}`);
});

test("screenshot CrewComposition after K15 preset crew loaded", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1800 });
  await page.goto("/");
  await page.getByRole("button", { name: /^Crew$/i }).click();
  await page.waitForSelector('h2:has-text("Crew Composition")', { timeout: 5_000 });
  await page.getByLabel(/Load preset crew configuration/i).selectOption("k15-reference");
  await page.waitForTimeout(800);
  const date = new Date().toISOString().slice(0, 10);
  const out = path.resolve(`exports/${date}_crew_composition_k15_preset.png`);
  await page.screenshot({ path: out, fullPage: true });
  // eslint-disable-next-line no-console
  console.log(`Screenshot → ${out}`);
});
