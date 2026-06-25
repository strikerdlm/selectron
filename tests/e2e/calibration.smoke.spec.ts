import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";

type Provenance = "tierA-nasa" | "tierB-lit" | "tierB-pymc" | "tierC-synth" | "user-custom";

interface PriorCondition {
  provenance: Provenance;
  incidence: {
    distribution: string;
  };
}

interface ConditionsFixture {
  conditions: Array<{
    condition_id: string;
    display_name: string;
    provenance: Provenance;
    distribution: string;
    fittable: boolean;
    fitted: boolean;
  }>;
  n_total: number;
  n_fittable: number;
  n_fittable_unfitted: number;
  n_fitted: number;
}

function titleCaseConditionId(id: string): string {
  return id.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function loadConditionsFixture(): ConditionsFixture {
  const path = new URL("../../src/data/imm-priors.json", import.meta.url);
  const priors = JSON.parse(readFileSync(path, "utf8")) as {
    conditions: Record<string, PriorCondition>;
  };
  const conditions = Object.entries(priors.conditions).map(([condition_id, prior]) => {
    const distribution = prior.incidence.distribution;
    const fittable =
      (prior.provenance === "tierB-lit" || prior.provenance === "tierB-pymc") &&
      distribution === "Gamma-Poisson";
    const fitted = prior.provenance === "tierB-pymc";
    return {
      condition_id,
      display_name: titleCaseConditionId(condition_id),
      provenance: prior.provenance,
      distribution,
      fittable,
      fitted,
    };
  });
  return {
    conditions,
    n_total: conditions.length,
    n_fittable: conditions.filter((c) => c.fittable).length,
    n_fittable_unfitted: conditions.filter((c) => c.fittable && !c.fitted).length,
    n_fitted: conditions.filter((c) => c.fitted).length,
  };
}

const conditionsFixture = loadConditionsFixture();

async function openCalibration(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /SELECTRON/i })).toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: /Calibration/i }).click();
}

test.describe("Calibration view", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }, testInfo) => {
    if (!testInfo.title.includes("handles API error")) {
      await page.route("**/conditions", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(conditionsFixture),
        }),
      );
    }
    await openCalibration(page);
  });

  test("renders Calibration header and tab strip", async ({ page }) => {
    await expect(page.locator("h2:has-text('Calibration')")).toBeVisible();
    await expect(page.locator("text=Python offline pipeline")).toBeVisible();
    await expect(page.locator("button:has-text('Conditions')")).toBeVisible();
    await expect(page.locator("button:has-text('Batch Fit')")).toBeVisible();
    await expect(page.locator("button:has-text('V&V')")).toBeVisible();
  });

  test("Conditions tab loads current condition catalog", async ({ page }) => {
    await expect(page.getByText(`${conditionsFixture.n_total} total`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator("th:has-text('Condition')")).toBeVisible();
    await expect(page.locator("th:has-text('Provenance')")).toBeVisible();
    await expect(page.locator("th:has-text('Distribution')")).toBeVisible();
    await expect(page.locator("th:has-text('Status')")).toBeVisible();
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBe(conditionsFixture.n_total);
  });

  test("Conditions tab shows fitted/fittable status badges", async ({ page }) => {
    await expect(page.getByText(`${conditionsFixture.n_total} total`)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${conditionsFixture.n_fitted} fitted`)).toBeVisible();
    await expect(page.getByText(`${conditionsFixture.n_fittable} fittable`)).toBeVisible();
    const statusCells = page.locator("tbody tr td:nth-child(4)");
    const fittedBadges = await statusCells.getByText("Fitted", { exact: true }).count();
    expect(fittedBadges).toBe(conditionsFixture.n_fitted);
    const fittableBadges = await statusCells.getByText("Fittable", { exact: true }).count();
    expect(fittableBadges).toBe(conditionsFixture.n_fittable_unfitted);
  });

  test("Conditions tab provenance filter works", async ({ page }) => {
    await expect(page.getByText(`${conditionsFixture.n_total} total`)).toBeVisible({ timeout: 10000 });
    const select = page.locator("select").first();
    await select.selectOption("tierB-pymc");
    const rows = page.locator("tbody tr");
    expect(await rows.count()).toBe(
      conditionsFixture.conditions.filter((c) => c.provenance === "tierB-pymc").length,
    );
  });

  test("Conditions tab handles API error gracefully", async ({ page }) => {
    await page.route("**/conditions", (route) => route.abort());
    await openCalibration(page);
    await expect(
      page.locator("text=Is the Python API running on localhost:8000?")
    ).toBeVisible({ timeout: 10000 });
  });

  test("Batch Fit tab renders config form", async ({ page }) => {
    await page.click("button:has-text('Batch Fit')");
    await expect(page.locator("h3:has-text('Batch Fit')")).toBeVisible();
    await expect(page.locator("text=Analytic Gamma-Poisson")).toBeVisible();
    await expect(page.locator("text=Evidence ledger not release-ready")).toBeVisible();
    await expect(page.locator("text=Sampler diagnostic")).toBeVisible();
    await expect(page.locator("label:has-text('draws')")).toBeVisible();
    await expect(page.locator("label:has-text('chains')")).toBeVisible();
    await expect(page.locator("label:has-text('seed')")).toBeVisible();
    await expect(page.locator("label:has-text('condition')")).toBeVisible();
    await expect(page.locator("button:has-text('Run Fit')")).toBeEnabled();
  });

  test("V&V tab shows reference-model regression and sensitivity panels", async ({ page }) => {
    await page.click("button:has-text('V&V')");
    await expect(page.locator("h3:has-text('Evidence Ledger Status')")).toBeVisible();
    await expect(page.locator("text=unadjudicated")).toBeVisible();
    await expect(page.locator("h3:has-text('K15 Reference-Model Regression')")).toBeVisible();
    await expect(page.locator("button:has-text('Run K15 Benchmark')")).toBeVisible();
    await expect(page.locator("h3:has-text('Sensitivity Analysis')")).toBeVisible();
  });

  test("screenshot: Conditions tab with data", async ({ page }, testInfo) => {
    await expect(page.getByText(`${conditionsFixture.n_total} total`)).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: testInfo.outputPath("calibration-conditions.png"), fullPage: true });
  });

  test("screenshot: Batch Fit tab", async ({ page }, testInfo) => {
    await page.click("button:has-text('Batch Fit')");
    await expect(page.locator("h3:has-text('Batch Fit')")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("calibration-batch-fit.png"), fullPage: true });
  });
});
