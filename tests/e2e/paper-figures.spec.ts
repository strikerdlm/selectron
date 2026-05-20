// paper-figures.spec.ts — T10
//
// Generates deterministic 1600×1000 PNG snapshots for manuscript figures
// F3, F4, F6, F7 using the canonical paper-* TestFigureHost fixtures.
//
// Canonical inputs (mirrored in TestFigureHost paper-* cases):
//   alias  = "DEMO-01"
//   seed   = 0xc0ffee
//   mission = hi-seas-45d  (spec asked for mdrs-45d; no such id exists in
//             the analog-missions catalog — hi-seas-45d is the 45-day proxy)
//   tier   = "medium"
//
// Each test navigates to ?testFigure=paper-<FN>, waits for the
// [data-testfigure-ready] attribute (set by useEffect after ECharts has
// painted / IDB pre-seed completes), then screenshots to paper/figures/<FN>.png.
//
// Run: npx playwright test tests/e2e/paper-figures.spec.ts
// Prereq: Vite dev server at http://localhost:5173

import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const FIGS = ["paper-F3", "paper-F4", "paper-F6", "paper-F7"] as const;

for (const fig of FIGS) {
  test(`generates ${fig} snapshot`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`http://localhost:5173/?testFigure=${fig}`);
    await page.waitForSelector("[data-testfigure-ready]", { timeout: 20_000 });
    mkdirSync("paper/figures", { recursive: true });
    const target = `paper/figures/${fig.replace("paper-", "")}.png`;
    await page.screenshot({ path: target, fullPage: false });
  });
}
