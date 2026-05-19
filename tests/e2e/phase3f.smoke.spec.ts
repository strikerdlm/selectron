import { expect, test } from "@playwright/test";

test("phase 3f dashboard renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /SELECTRON/i })).toBeVisible();
  await expect(page.getByText("+ New candidate").first()).toBeVisible();
});

test("wizard creates a candidate end-to-end", async ({ page }) => {
  await page.goto("/");
  // Create a synthetic candidate via the toolbar button
  await page.getByText("Generate synthetic").click();
  // Wait for the card to appear
  await page.waitForTimeout(1_000);
  // Click the first candidate card (the card itself is role="button" and triggers onEdit)
  // onEdit opens the wizard at step 2 (review), breadcrumb shows "step 3 of 4"
  // Use the panel div which has role="button" — pick the first one (there's only one card)
  const firstCard = page.locator('[role="button"]').first();
  await firstCard.click({ timeout: 5_000 });
  // Breadcrumb renders lowercase "step 3 of 4"
  await expect(page.getByText(/step 3 of 4/i)).toBeVisible({ timeout: 10_000 });
});

test.describe("figure snapshots", () => {
  for (const fid of ["F1", "F2", "F4", "F5", "F6"]) {
    test(`figure ${fid} snapshot`, async ({ page }) => {
      await page.goto(`/?testFigure=${fid}`);
      const fig = page.locator(`[data-figure-id="${fid}"]`);
      await expect(fig).toBeVisible({ timeout: 5_000 });
      // Wait for ECharts to finish rendering (canvas-based, no DOM sentinel)
      await page.waitForTimeout(800);
      await expect(fig).toHaveScreenshot(`${fid}.png`, { maxDiffPixels: 100 });
    });
  }
});
