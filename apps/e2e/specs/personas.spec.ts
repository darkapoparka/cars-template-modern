import { existsSync } from "node:fs";
import {
  type BrowserContextOptions,
  expect,
  type FullProject,
  test,
} from "@playwright/test";
import { personaJourneys } from "../fixtures/personas";
import { e2eUrls, toUrl } from "../fixtures/urls";

const signInPathPattern = /\/sign-in(?:\/|$)/;

const browserContextOptionsFor = (
  projectUse: FullProject["use"]
): BrowserContextOptions => {
  const {
    acceptDownloads,
    baseURL,
    bypassCSP,
    clientCertificates,
    colorScheme,
    contextOptions,
    deviceScaleFactor,
    extraHTTPHeaders,
    geolocation,
    hasTouch,
    httpCredentials,
    ignoreHTTPSErrors,
    isMobile,
    javaScriptEnabled,
    locale,
    offline,
    permissions,
    proxy,
    serviceWorkers,
    timezoneId,
    userAgent,
    viewport,
  } = projectUse;

  const explicitOptions = Object.fromEntries(
    Object.entries({
      acceptDownloads,
      baseURL,
      bypassCSP,
      clientCertificates,
      colorScheme,
      deviceScaleFactor,
      extraHTTPHeaders,
      geolocation,
      hasTouch,
      httpCredentials,
      ignoreHTTPSErrors,
      isMobile,
      javaScriptEnabled,
      locale,
      offline,
      permissions,
      proxy,
      serviceWorkers,
      timezoneId,
      userAgent,
      viewport,
    }).filter(([, value]) => value !== undefined)
  ) as BrowserContextOptions;

  return {
    ...contextOptions,
    ...explicitOptions,
  };
};

for (const [persona, journey] of Object.entries(personaJourneys)) {
  test(`${persona} can traverse its launch-critical workspace`, async ({
    browser,
  }, testInfo) => {
    const storageState = process.env[journey.storageStateEnvironment];
    // biome-ignore lint/suspicious/noSkippedTests: persona state must be supplied without committing private sessions
    test.skip(
      !(storageState && existsSync(storageState)),
      `Set ${journey.storageStateEnvironment} to a local Playwright storage state`
    );

    const context = await browser.newContext({
      ...browserContextOptionsFor(testInfo.project.use),
      storageState,
    });
    const page = await context.newPage();
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    for (const path of journey.paths) {
      const response = await page.goto(toUrl(e2eUrls.app, path));
      expect(response?.status()).toBe(200);
      expect(new URL(page.url()).pathname).toBe(path);
      expect(page.url()).not.toMatch(signInPathPattern);
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 1 }).first()
      ).toBeVisible();
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1
        )
      ).toBe(true);
    }

    for (const path of journey.deniedPaths) {
      const response = await page.goto(toUrl(e2eUrls.app, path));
      expect(response?.status()).toBe(404);
    }

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    await context.close();
  });
}
