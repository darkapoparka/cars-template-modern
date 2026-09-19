import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  testMatch: "modern-refactor.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.002 },
  },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/refactor/results.json" }],
  ],
  outputDir: "test-results/refactor/artifacts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3002",
    locale: "bg-BG",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "modern-refactor-chromium", use: { browserName: "chromium" } },
  ],
});
