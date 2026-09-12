import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const publicMode = process.env.E2E_PUBLIC_MODE;

if (publicMode !== "demo" && publicMode !== "unavailable") {
  throw new Error(
    "E2E_PUBLIC_MODE must be either demo or unavailable for public E2E"
  );
}

const unavailableMode = publicMode === "unavailable";
const publicPort = Number.parseInt(process.env.E2E_PUBLIC_PORT ?? "3001", 10);
if (!Number.isInteger(publicPort) || publicPort < 1024 || publicPort > 65_535) {
  throw new Error("E2E_PUBLIC_PORT must be a valid non-privileged port");
}
const publicRunId = (process.env.E2E_PUBLIC_RUN_ID ?? `manual-${process.pid}`)
  .replace(/[^a-zA-Z0-9_-]/g, "-")
  .slice(0, 80);
const webBaseUrl = `http://127.0.0.1:${publicPort}`;

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  outputDir: path.join(
    repositoryRoot,
    "apps",
    "e2e",
    "test-results",
    `public-${publicMode}-${publicRunId}`
  ),
  preserveOutput: "failures-only",
  projects: [
    {
      name: "public-mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: "public-desktop-chromium",
      testIgnore: "**/modern-mobile*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 1100, width: 1440 },
      },
    },
  ],
  reporter: process.env.CI ? "line" : "list",
  retries: process.env.CI ? 1 : 0,
  testDir: "./specs",
  testMatch: unavailableMode
    ? "**/public-unavailable.spec.ts"
    : [
        // Standalone showroom assertions; platform specs remain in playwright.config.ts.
        "**/modern-mobile*.spec.ts",
        "**/modern-public.spec.ts",
        "**/seo.spec.ts",
      ],
  timeout: 45_000,
  use: {
    baseURL: webBaseUrl,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "off",
  },
  workers: 1,
});
