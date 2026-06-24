import { test } from "@playwright/test";

test.describe("retired paper figure generator", () => {
  test.skip(
    "paper figure generation is retired after the 2026-06-24 scientific audit",
    async () => {
      // The previous spec wrote F3/F4/F6/F7 PNGs to paper/figures for the
      // retired private manuscript package. Those figures encoded obsolete
      // posterior, HSRB, and operational-verdict language and must not be
      // regenerated as active artifacts.
    },
  );
});
