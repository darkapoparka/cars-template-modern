import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const webBaseUrl = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3001";
const appBaseUrl = process.env.E2E_APP_URL ?? "http://127.0.0.1:3100";
const apiBaseUrl = process.env.E2E_API_URL ?? "http://127.0.0.1:3002";
const startServers = process.env.E2E_START_SERVERS !== "false";

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: "test-results",
  preserveOutput: "failures-only",
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: "tablet-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1024, width: 768 },
      },
    },
    {
      name: "laptop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 720, width: 1280 },
      },
    },
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1100, width: 1440 },
      },
    },
  ],
  reporter: process.env.CI
    ? [["line"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 2 : 0,
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
  testDir: "./specs",
  timeout: 45_000,
  use: {
    baseURL: webBaseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer: startServers
    ? [
        {
          command: "pnpm --filter web dev",
          cwd: repositoryRoot,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          url: webBaseUrl,
        },
        {
          command: "pnpm --filter app exec next dev -p 3100",
          cwd: repositoryRoot,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          url: appBaseUrl,
        },
        {
          command: "pnpm --filter api run next-dev",
          cwd: repositoryRoot,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          url: `${apiBaseUrl}/health`,
        },
      ]
    : undefined,
  workers: process.env.CI ? 2 : 1,
});
