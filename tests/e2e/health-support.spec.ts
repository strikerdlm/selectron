// tests/e2e/health-support.spec.ts
//
// Smoke test for the Health Support tier-picker mounted in the CrewComposition
// view. Verifies that selecting the "Medium" tier updates the breakdown panel
// (aria-checked, Defibrillator item visible).
//
// NOTE: in resource-constrained / cold-start sandboxes the Vite dev server's
// unbundled ESM graph can load slowly under headless Chromium; the generous
// timeouts + `domcontentloaded` below make this robust for CI/local. (All repo
// e2e specs share this Vite-dev dependency.)

import { expect, test } from "@playwright/test";

test("selecting the Medium health-support tier updates the breakdown", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // Navigate to Crew Composition view (matches crew_composition.smoke.spec.ts convention)
  await page.getByRole("button", { name: /^Crew$/i }).click({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible({
    timeout: 20_000,
  });

  // The tier-picker renders a radiogroup; locate the Medium radio button by aria-label.
  const mediumBtn = page.getByRole("radio", { name: /Medium/i });
  await expect(mediumBtn).toBeVisible({ timeout: 20_000 });

  await mediumBtn.click();

  // After clicking, the button must carry aria-checked="true".
  await expect(mediumBtn).toHaveAttribute("aria-checked", "true", { timeout: 10_000 });

  // The care-capability dashboard is collapsed by default (Diego 2026-05-29) — expand it.
  await page.getByRole("button", { name: /Care capability/i }).click({ timeout: 10_000 });

  // The breakdown panel should now show a procedure item that requires a provider.
  // "Defibrillator / AED (ECG, pacing)" is a provider-class item; under Medium it
  // remains shown (provider deliverability 0.6 > 0 — it would dim only under None).
  await expect(page.getByText(/Defibrillator/i).first()).toBeVisible({ timeout: 10_000 });
});
