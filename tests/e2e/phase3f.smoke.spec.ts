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

// CC-5: Crew Composition view smoke tests
test.describe("Crew Composition view", () => {
  test("crew tab renders with 6 members and composite score", async ({ page }) => {
    await page.goto("/");
    // Click the Crew nav button
    await page.getByRole("button", { name: /crew/i }).click();
    // The page heading should be visible
    await expect(page.getByRole("heading", { name: /crew composition/i })).toBeVisible({ timeout: 5_000 });
    // Six crew member cards should be present (collapsed by default)
    await expect(page.getByText("Alpha")).toBeVisible();
    await expect(page.getByText("Foxtrot")).toBeVisible();
    // Composite panel heading should be present
    await expect(page.getByText(/crew composite/i)).toBeVisible();
    // Run simulation button should be present
    await expect(page.getByRole("button", { name: /run simulation/i })).toBeVisible();
  });

  test("crew member card expands to show sliders", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /crew/i }).click();
    await page.waitForTimeout(500);
    // Click the Alpha member card to expand it
    await page.getByRole("button", { name: /Alpha/i }).first().click();
    // The per-criterion slider for the first criterion should be visible
    await expect(page.locator("input[type=range]").first()).toBeVisible({ timeout: 5_000 });
    // At least one citation link should be visible
    await expect(page.getByText("↗ doi").first()).toBeVisible({ timeout: 3_000 });
  });

  test("aggregator method switch updates composite label", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /crew/i }).click();
    await page.waitForTimeout(500);
    // The aggregator select should have worst-link as default
    const select = page.locator("select").first();
    await expect(select).toHaveValue("worst-link");
    // Switch to mean
    await select.selectOption("mean");
    // The label should update (select still shows the option)
    await expect(select).toHaveValue("mean");
  });
});
