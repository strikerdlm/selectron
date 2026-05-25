import { test, expect } from "@playwright/test";

test.describe("Calibration view — Python API integration", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.click("button:has-text('Calibration')");
  });

  test("renders Calibration header and tab strip", async ({ page }) => {
    await expect(page.locator("h2:has-text('Calibration')")).toBeVisible();
    await expect(page.locator("text=Python offline pipeline")).toBeVisible();
    await expect(page.locator("button:has-text('Conditions')")).toBeVisible();
    await expect(page.locator("button:has-text('Batch Fit')")).toBeVisible();
    await expect(page.locator("button:has-text('V&V')")).toBeVisible();
  });

  test("Conditions tab loads 100 conditions from Python API", async ({ page }) => {
    await expect(page.locator("text=100 total")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("th:has-text('Condition')")).toBeVisible();
    await expect(page.locator("th:has-text('Provenance')")).toBeVisible();
    await expect(page.locator("th:has-text('Distribution')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBe(100);
  });

  test("Conditions tab shows fitted/fittable status badges", async ({ page }) => {
    await expect(page.locator("text=100 total")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=35 fitted")).toBeVisible();
    await expect(page.locator("text=6 fittable")).toBeVisible();
    const fittedBadges = await page.locator("td >> text=Fitted").count();
    expect(fittedBadges).toBe(35);
    const fittableBadges = await page.locator("td >> text=Fittable").count();
    expect(fittableBadges).toBe(6);
  });

  test("Conditions tab provenance filter works", async ({ page }) => {
    await expect(page.locator("text=100 total")).toBeVisible({ timeout: 10000 });
    const select = page.locator("select").first();
    await select.selectOption("tierB-pymc");
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBe(35);
  });

  test("Conditions tab handles API error gracefully", async ({ page }) => {
    await page.route("**/conditions", (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 10000 });
    await page.click("button:has-text('Calibration')");
    await expect(
      page.locator("text=Is the Python API running on localhost:8000?")
    ).toBeVisible({ timeout: 10000 });
  });

  test("Batch Fit tab renders config form", async ({ page }) => {
    await page.click("button:has-text('Batch Fit')");
    await expect(page.locator("h3:has-text('Batch Fit')")).toBeVisible();
    await expect(page.locator("text=PyMC NUTS")).toBeVisible();
    await expect(page.locator("label:has-text('draws')")).toBeVisible();
    await expect(page.locator("label:has-text('chains')")).toBeVisible();
    await expect(page.locator("label:has-text('seed')")).toBeVisible();
    await expect(page.locator("label:has-text('condition filter')")).toBeVisible();
    await expect(page.locator("button:has-text('Run Fit')")).toBeEnabled();
  });

  test("V&V tab shows placeholder", async ({ page }) => {
    await page.click("button:has-text('V&V')");
    await expect(page.locator("text=Validation & Sensitivity")).toBeVisible();
    await expect(page.locator("text=coming soon")).toBeVisible();
  });

  test("screenshot: Conditions tab with data", async ({ page }) => {
    await expect(page.locator("text=100 total")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "/root/repos/exports/calibration-conditions.png", fullPage: true });
  });

  test("screenshot: Batch Fit tab", async ({ page }) => {
    await page.click("button:has-text('Batch Fit')");
    await expect(page.locator("h3:has-text('Batch Fit')")).toBeVisible();
    await page.screenshot({ path: "/root/repos/exports/calibration-batch-fit.png", fullPage: true });
  });
});
