import { defineConfig } from "@playwright/test";

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: "only-on-failure",
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: "npm run dev -- --host 127.0.0.1",
          url: "http://127.0.0.1:5173",
          timeout: 60_000,
          reuseExistingServer: true,
        },
      }),
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: { args: ["--no-sandbox"] },
      },
    },
  ],
});
