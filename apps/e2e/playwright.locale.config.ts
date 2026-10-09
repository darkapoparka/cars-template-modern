import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig(base, {
  testMatch: ["locale-language-flags.spec.ts", "modern-mobile-welcome.spec.ts"],
  outputDir: "test-results/locale",
  projects: [
    { name: "locale-chromium", use: { browserName: "chromium" } },
    { name: "locale-webkit", use: { browserName: "webkit" } },
  ],
});
