// tests/e2e/health-support.spec.ts
//
// Smoke test for the Health Support tier-picker mounted in the CrewComposition
// view. Verifies that selecting the "Medium" tier updates the breakdown panel
// (aria-checked, Defibrillator item visible) against the real Vite dev server.

import { expect, test } from "@playwright/test";

test("selecting the Medium health-support tier updates the breakdown", async ({ page }) => {
  await page.goto("/");

  // Navigate to Crew Composition view (matches crew_composition.smoke.spec.ts convention)
  await page.getByRole("button", { name: /^Crew$/i }).click();
  await expect(page.getByRole("heading", { name: /^Crew Composition$/i })).toBeVisible({
    timeout: 5_000,
  });

  // The tier-picker renders a radiogroup; locate the Medium radio button by aria-label.
  const mediumBtn = page.getByRole("radio", { name: /Medium/i });
  await expect(mediumBtn).toBeVisible({ timeout: 5_000 });

  await mediumBtn.click();

  // After clicking, the button must carry aria-checked="true".
  await expect(mediumBtn).toHaveAttribute("aria-checked", "true");

  // The breakdown panel should now show a procedure item that requires a provider.
  // "Defibrillator / AED (ECG, pacing)" is a provider-class item; under Medium it
  // remains shown (provider deliverability 0.6 > 0 — it would dim only under None).
  await expect(
    page.getByText(/Defibrillator/i).first()
  ).toBeVisible({ timeout: 5_000 });
});
