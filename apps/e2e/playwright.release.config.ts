import { defineConfig, devices } from "@playwright/test";
import { validateAuthenticatedPreviewEnvironment } from "./fixtures/authenticated-preview-contract.mts";

if (process.env.E2E_PROTECTED_RELEASE !== "true") {
  throw new Error(
    "Protected release E2E must run through scripts/run-authenticated-preview.mjs"
  );
}

const contract = validateAuthenticatedPreviewEnvironment();

export default defineConfig({
  expect: { timeout: 12_000 },
  forbidOnly: true,
  fullyParallel: false,
  globalTimeout: 12 * 60_000,
  outputDir: "test-results/authenticated-preview",
  preserveOutput: "failures-only",
  projects: [
    {
      name: "authenticated-preview-setup",
      testMatch: "**/authenticated-preview.setup.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: contract.appOrigin,
        screenshot: "off",
        trace: "off",
        video: "off",
      },
    },
    {
      name: "authenticated-preview-chromium",
      dependencies: ["authenticated-preview-setup"],
      testMatch: "**/authenticated-preview.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: contract.appOrigin,
        screenshot: "off",
        trace: "off",
        video: "off",
        viewport: { height: 900, width: 1280 },
      },
    },
  ],
  reporter: [
    ["line"],
    [
      "junit",
      {
        outputFile: "playwright-report/authenticated-preview/results.xml",
      },
    ],
  ],
  retries: 0,
  testDir: "./specs",
  timeout: 90_000,
  webServer: undefined,
  workers: 1,
});
