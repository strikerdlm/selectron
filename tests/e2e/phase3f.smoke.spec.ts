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
    // Six crew member cards should be present (collapsed by default).
    // Use .first() because some member ids (e.g. Foxtrot as the weakest-link)
    // also appear in the composite-panel "weakest · X" label.
    await expect(page.getByText("Alpha").first()).toBeVisible();
    await expect(page.getByText("Foxtrot").first()).toBeVisible();
    // Composite panel heading should be present (use getByRole to avoid the
    // screen-reader "Crew composite: NN%, no demo-threshold flags." sr-only live region also
    // matching the regex).
    await expect(page.getByRole("heading", { name: /crew composite/i })).toBeVisible();
    // Run simulation button should be present (the button's accessible name
    // comes from its aria-label "run IMM Monte Carlo simulation").
    await expect(page.getByRole("button", { name: /run IMM Monte Carlo simulation/i })).toBeVisible();
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
    // Anchor on the aggregator select specifically — the page now has 3 selects
    // (mission picker, IMM-49 preset crew dropdown, this aggregator). Use the
    // existing "Aggregation method" label to disambiguate.
    const select = page.getByLabel(/aggregation method/i);
    await expect(select).toHaveValue("worst-link");
    // Switch to mean
    await select.selectOption("mean");
    await expect(select).toHaveValue("mean");
  });

  // CC-6: 2026-06-04 — mission-kind context badge snapshot.
  //
  // Switches the mission picker to the 365-day campaign (Antarctic) and
  // captures the [data-testid="mission-kind-context"] region. The badge
  // is now a `<button>` (was a `<p>`); the snapshot includes the closed
  // state of the explanation <details> so the layout (label + chevron)
  // is what the test guards against. Light theme is the manuscript /
  // snapshot generation path (FigureThemeContext default is light).
  test("crew mission-kind-context badge snapshot (Antarctic)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /crew/i }).click();
    await page.waitForTimeout(500);
    // The mission picker is the first <select> on the page (the page
    // has 3 selects: mission, IMM-49 preset crew, aggregator). Select
    // by the option's `value` attribute (the mission id is
    // `antarctic-winter`). Playwright's selectOption does not accept
    // regex for the label.
    const missionSelect = page.locator("select").first();
    await expect(missionSelect).toBeVisible();
    await missionSelect.selectOption("antarctic-winter");
    // Wait for the badge text to flip to the Antarctic context.
    const badge = page.locator("[data-testid='mission-kind-context']");
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/Antarctic winter-over priors/i);
    // Snapshot the badge + its sibling <details> container. The
    // <details> starts closed by default — that's the canonical state.
    const region = page.locator("[data-testid='mission-kind-context']")
      .locator("xpath=.."); // parent <div>
    await page.waitForTimeout(300); // allow font fallback settle
    await expect(region).toHaveScreenshot("mission-kind-context.png", { maxDiffPixels: 100 });
  });

  // CC-7: 2026-06-05 — I6 analog predictive-uncertainty figure snapshot.
  //
  // Switches the mission picker to the 365-day campaign (antarctic-station),
  // runs the simulation, and snapshots the I6 region. The figure body only
  // mounts once the worker-offloaded predictive sweep reaches its
  // "done" state, which requires the optional Python calibration API to be
  // reachable. We therefore:
  //   • HARD-assert only region visibility — the panel renders for every
  //     antarctic/controlled run regardless of API state, so CI without the
  //     API stays green (the panel shows its api-error message instead).
  //   • SOFT-wait for the figure's `pp-pEvac` done-sentinel so that, when the
  //     API IS live (as it was when this snapshot was captured locally), the
  //     screenshot captures the real predictive figure rather than the
  //     "fetching…"/"running…" spinner. The wait is non-throwing: if the
  //     sentinel never appears (API down), the test still passes on the
  //     region assertion.
  //   • Use raw element.screenshot() (not toHaveScreenshot) so no comparison
  //     baseline is created — the PNG would otherwise diff-fail across API
  //     states (offline-first contract).
  test("i6 analog predictive figure renders for antarctic mission", async ({ page }) => {
    // The full 100k-trial worker sim + the predictive sweep can take
    // well over the 60s default; allow generous headroom for this one test.
    test.setTimeout(150_000);
    await page.goto("/");
    await page.getByRole("button", { name: /crew/i }).click();
    await page.waitForTimeout(500);

    // Mission picker is the first <select> (mission, IMM-49 preset crew, aggregator).
    const missionSelect = page.locator("select").first();
    await expect(missionSelect).toBeVisible();
    await missionSelect.selectOption("antarctic-winter");

    // Run the IMM Monte Carlo sim (button accessible name from its aria-label).
    await page.getByRole("button", { name: /run IMM Monte Carlo simulation/i }).click();

    // HARD assertion: the I6 panel must be visible for the antarctic kind.
    // The panel lives inside the {outcome && …} block, so it only appears once
    // the worker-offloaded full IMM sim (100k trials) completes — give it 60s.
    const region = page.getByTestId("imm-i6-posterior");
    await expect(region).toBeVisible({ timeout: 60_000 });

    // SOFT wait: let the worker sweep finish so the snapshot captures the real
    // figure when the calibration API is live. Non-throwing by design.
    await page
      .locator("[data-testid='pp-pEvac']")
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(() => {});
    await page.waitForTimeout(800); // allow ECharts histogram to settle

    await region.screenshot({
      path: "tests/e2e/__snapshots__/phase3f.smoke.spec.ts/i6-analog-posterior.png",
    });
  });
});
