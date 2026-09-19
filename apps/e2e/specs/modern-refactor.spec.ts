import { expect, test } from "@playwright/test";
import { createBrandTheme } from "@repo/design-system/lib/brand-theme";
import {
  expectNoHorizontalOverflow,
  settleModernPage,
} from "../fixtures/modern-visual-health";

const searchResultUrl = /(?:q|make)=BMW/;

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    ["GET", "HEAD"].includes(route.request().method())
      ? route.continue()
      : route.abort()
  );
});

for (const width of [320, 360, 390, 430]) {
  test(`mobile inventory preservation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('[data-slot="dealer-bottom-nav"]')).toBeVisible();
    await expect(page).toHaveScreenshot(`mobile-cars-${width}.png`);
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`desktop composition and controls at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
    await expect(
      page.locator('[data-slot="dealer-desktop-header"]')
    ).toBeVisible();
    await expect(hero).toBeVisible();
    await expect(
      page.locator(
        '[data-slot="dealer-desktop-discovery-content"] article:visible'
      )
    ).not.toHaveCount(0);
    await expect(page).toHaveScreenshot(`desktop-cars-${width}.png`);
    const search = hero.getByRole("combobox");
    await expect(search).toBeVisible();
    await search.fill("BMW");
    await search.press("Enter");
    await expect(page).toHaveURL(searchResultUrl);
    await expectNoHorizontalOverflow(page);
  });
}

for (const route of [
  "/sell",
  "/imports",
  "/lease",
  "/blog",
  "/contact",
  "/legal/privacy",
]) {
  test(`responsive route ${route}`, async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await settleModernPage(page);
      await expectNoHorizontalOverflow(page);
      await expect(page.locator("h1:visible")).toHaveCount(1);
    }
  });
}

for (const viewport of [
  { width: 768, height: 390 },
  { width: 1023, height: 800 },
]) {
  test(`mobile boundary and landscape at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(
      page.locator('[data-slot="dealer-desktop-home-hero"]')
    ).toBeHidden();
    await expect(page.locator('[data-slot="dealer-bottom-nav"]')).toBeVisible();
  });
}

test("validated dealer themes reach portalled filters and restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const accent of ["#164e63", "#facc15"]) {
    await page.goto("/cars");
    await settleModernPage(page);
    await page.evaluate((theme) => {
      for (const [name, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(name, value);
      }
    }, createBrandTheme(accent));
    const trigger = page
      .locator('[data-slot="dealer-desktop-home-hero"]')
      .getByRole("button", { name: "Филтри", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--brand").trim()
        )
      )
      .toBe(accent);
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue("--brand-foreground")
            .trim()
        )
      )
      .toBe(createBrandTheme(accent)["--brand-foreground"]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("vehicle details and unavailable routes retain accessible responsive frames", async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/listing/bmw-x5-m50d-sofia-2020");
    expect(response?.status()).toBe(200);
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("h1:visible")).toHaveCount(1);
    const missing = await page.goto("/refactor-missing-route");
    expect(missing?.status()).toBe(404);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

// Initial-load regression ceilings for the 12-vehicle demo; see refactor/evidence/IMPLEMENTATION.md.
for (const width of [390, 1440]) {
  test(`initial production payload budget at ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/cars", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const document = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        scriptBytes: resources
          .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
          .reduce((total, entry) => total + entry.encodedBodySize, 0),
        transferBytes: resources.reduce(
          (total, entry) => total + entry.transferSize,
          document.transferSize
        ),
        desktopHeroRequests: resources.filter((entry) =>
          entry.name.includes("lead-car-")
        ).length,
      };
    });
    await testInfo.attach("initial-payload", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
    expect(metrics.scriptBytes).toBeGreaterThan(0);
    expect(metrics.scriptBytes).toBeLessThan(750_000);
    expect(metrics.transferBytes).toBeLessThan(1_350_000);
    if (width < 1024) {
      expect(metrics.desktopHeroRequests).toBe(0);
    }
  });
}
