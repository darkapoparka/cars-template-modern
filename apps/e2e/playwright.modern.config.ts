import { defineConfig, devices } from "@playwright/test";
import { modernMobileStatePath } from "./fixtures/modern-session.setup";

export default defineConfig({
  testDir: "./specs",
  testMatch: [
    "mobile-chrome.spec.ts",
    "modern-mobile.spec.ts",
    "modern-mobile-architecture.spec.ts",
    "modern-mobile-completion.spec.ts",
    "modern-mobile-service-help.spec.ts",
    "modern-mobile-welcome.spec.ts",
  ],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  globalSetup: "./fixtures/modern-session.setup.ts",
  retries: 0,
  reporter: "list",
  outputDir: "test-results/modern-mobile",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001",
    locale: "bg-BG",
    storageState: modernMobileStatePath,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "modern-mobile-chromium",
      use: {
        ...devices["Pixel 5"],
        locale: "bg-BG",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "modern-mobile-webkit",
      use: {
        ...devices["iPhone 13"],
        locale: "bg-BG",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
