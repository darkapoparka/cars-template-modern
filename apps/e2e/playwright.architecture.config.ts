import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  testMatch: /architecture-(navigation|persistence)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["json", { outputFile: "test-results/architecture/results.json" }],
  ],
  outputDir: "test-results/architecture/artifacts",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3187",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "architecture-chromium", use: { browserName: "chromium" } },
    { name: "architecture-webkit", use: { browserName: "webkit" } },
  ],
});
