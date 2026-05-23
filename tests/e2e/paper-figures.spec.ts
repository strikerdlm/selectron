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

// F3, F4 remain unchanged from Iter-3 (Stage A is unchanged in v0.5.x).
// F6, F7 are regenerated from the IMM-Calculator-backed fixtures (v0.5.1+).
//   - F6.png: K15 crew × ISS HMS × iss-6mo at T=100k → assessIMMLxC verdict
//   - F7.png: 7 missions × ISS HMS at T=25k → multi-mission comparison
const FIGS = [
  { id: "paper-F3", out: "F3.png" },
  { id: "paper-F4", out: "F4.png" },
  { id: "paper-F6-imm", out: "F6.png" },
  { id: "paper-F7-imm", out: "F7.png" },
] as const;

for (const fig of FIGS) {
  test(`generates ${fig.id} → ${fig.out}`, async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto(`http://localhost:5173/?testFigure=${fig.id}`);
    await page.waitForSelector("[data-testfigure-ready]", { timeout: 20_000 });
    mkdirSync("paper/figures", { recursive: true });
    await page.screenshot({ path: `paper/figures/${fig.out}`, fullPage: true });
  });
}
