import { expect, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const removedPlatformRoutes = [
  "/dealers",
  "/bg/dealers",
  "/dealers/example-organization",
  "/bg/dealers/example-organization",
  "/registry",
  "/bg/registry",
  "/pricing",
  "/bg/pricing",
] as const;
const listingPathPattern = /\/(?:bg\/)?listing\//;
const legacyPlatformNamePattern = /AutoMarket|Dealer Studio/i;
const removedSitemapSurfacePattern =
  /AutoMarket|\/dealers(?:\/|<)|\/registry<|\/pricing</i;

const retainedShowroomRoutes = [
  "/bg",
  "/bg/cars",
  "/bg/imports",
  "/bg/sell",
  "/bg/lease",
  "/bg/contact",
  "/bg/guides",
  "/bg/blog",
  "/bg/legal/privacy",
  "/bg/legal/terms",
  "/bg/collections/chinese-ev-hybrids",
  "/bg/listing/bmw-x5-m50d-sofia-2020",
] as const;

test.describe("Day & Night client identity", () => {
  test("removes the platform-only public routes", async ({ page }) => {
    for (const route of removedPlatformRoutes) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), route).toBe(404);
      await expect(page.locator("body"), route).not.toContainText(
        legacyPlatformNamePattern
      );
    }
  });

  test("publishes only intentional showroom URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const sitemap = await response.text();

    expect(sitemap).toContain("/bg/cars");
    expect(sitemap).toContain("/bg/contact");
    expect(sitemap).not.toMatch(removedSitemapSurfacePattern);
  });

  test("keeps the showroom route family Day & Night-only", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });

    for (const route of retainedShowroomRoutes) {
      const errors = collectPublicPageErrors(page);
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("body"), route).not.toContainText(
        legacyPlatformNamePattern
      );
      expect(
        await page.locator("body").evaluate((body) => body.scrollWidth)
      ).toBe(await page.locator("body").evaluate((body) => body.clientWidth));
      await expectHealthyPublicPage(page, errors);
    }
  });

  test("keeps listing identity attached to Day & Night without directory links", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    const response = await page.goto("/bg/listing/bmw-x5-m50d-sofia-2020", {
      waitUntil: "domcontentloaded",
    });

    expect(response?.status()).toBe(200);
    await expect(page.locator("body")).toContainText("Day & Night Auto Group");
    await expect(page.locator('a[href*="/dealers"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(
      legacyPlatformNamePattern
    );
  });

  test("keeps mobile filters, menu, and listing navigation interactive", async ({
    page,
  }, testInfo) => {
    await page.goto("/bg/cars", { waitUntil: "domcontentloaded" });

    if (!testInfo.project.name.includes("mobile")) {
      await expect(
        page.locator('[data-slot="marketplace-masthead"]')
      ).toBeVisible();
      await expect(page.locator("body")).not.toContainText(
        legacyPlatformNamePattern
      );
      return;
    }

    const filterTrigger = page.locator(
      '[data-slot="mobile-discovery-filters"]'
    );
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();
    const filterOverlay = page.locator(
      '[data-slot="mobile-marketplace-overlay"]'
    );
    await expect(filterOverlay).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(filterOverlay).toBeHidden();
    await expect(filterTrigger).toBeFocused();

    const menuTrigger = page.getByRole("button", { exact: true, name: "Меню" });
    await menuTrigger.click();
    const menu = page.locator('[data-slot="dealer-mobile-menu"]');
    await expect(menu).toBeVisible();
    await page.getByRole("button", { name: "Затвори менюто" }).click();
    await expect(menu).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    const firstListing = page.locator('main a[href*="/listing/"]').first();
    await expect(firstListing).toBeVisible();
    await firstListing.click();
    await expect(page).toHaveURL(listingPathPattern);
    await expect(page.locator("body")).toContainText("Day & Night Auto Group");
  });
});
