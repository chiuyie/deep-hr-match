import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/** Dedicated port so E2E can force PAYMENTS_MODE=mock without colliding with a local `npm run dev`. */
const e2ePort = process.env.E2E_PORT?.trim() || "3001";
const baseURL =
  process.env.E2E_BASE_URL?.trim() || `http://localhost:${e2ePort}`;
const authFile = path.join(__dirname, "e2e", ".auth", "employer.json");
const skipWebServer = Boolean(process.env.E2E_SKIP_WEBSERVER?.trim());

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
      testIgnore: /global\.setup\.ts/,
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        // Production server on :3001 so E2E can force mock payments while `next dev` stays on :3000.
        command: "node scripts/e2e-webserver.mjs",
        url: baseURL,
        reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
        timeout: 300_000,
        env: {
          ...process.env,
          E2E_PORT: e2ePort,
          PORT: e2ePort,
          PAYMENTS_MODE: "mock",
        },
      },
});
