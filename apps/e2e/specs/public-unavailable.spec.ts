import { expect, test } from "@playwright/test";
import { leadSite } from "@repo/marketplace/lead-site";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const DEFAULT_CARS_SITEMAP_ENTRY = /<loc>https?:\/\/[^<]+\/cars<\/loc>/;
const LEGACY_PLATFORM_NAME_PATTERN = /AutoMarket/i;

test("production inventory follows the configured data mode without a database", async ({
  page,
}) => {
  const expectedNotFoundUrls = new Set<string>();
  const errors = collectPublicPageErrors(page, expectedNotFoundUrls);
  const homeResponse = await page.goto("/bg", {
    waitUntil: "domcontentloaded",
  });

  expect(homeResponse?.status()).toBe(200);
  const productionCsp = homeResponse?.headers()["content-security-policy"];
  expect(productionCsp).toContain("script-src 'self' 'unsafe-inline'");
  expect(productionCsp).not.toContain("'unsafe-eval'");
  // Static dealership mode never mounts optional analytics, including in outages.
  await expect(page.locator("#analytics-consent-bootstrap")).toHaveCount(0);
  if (leadSite.staticDemoMode) {
    // Standalone showrooms intentionally remain useful without the platform DB.
    const listingLinks = page.locator('a[href*="/listing/"]:visible');
    await expect(listingLinks.first()).toBeVisible();
    const listingHref = await listingLinks.first().getAttribute("href");
    expect(listingHref).toBeTruthy();
    const sitemapResponse = await page.request.get("/sitemap.xml");
    expect(sitemapResponse.status()).toBe(200);
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toMatch(DEFAULT_CARS_SITEMAP_ENTRY);
    expect(sitemap).toContain("/listing/");
    expect(sitemap).not.toContain("/en/");
    expect(sitemap).not.toContain("/dealers/");
    for (const route of ["/cars", "/en/cars", listingHref as string]) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "bg");
      await expect(page.locator("main").first()).toBeVisible();
      await expectHealthyPublicPage(page, errors);
    }
    await expect(
      page.locator('script[type="application/ld+json"]').first()
    ).toBeAttached();
    for (const route of ["/dealers", "/registry", "/pricing"]) {
      expectedNotFoundUrls.add(new URL(route, page.url()).href);
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status()).toBe(404);
      await expect(page.locator("body")).not.toContainText(
        LEGACY_PLATFORM_NAME_PATTERN
      );
      await expectHealthyPublicPage(page, errors);
    }
    return;
  }

  await expect(
    page.getByRole("heading", {
      exact: true,
      level: 1,
      name: "Обявите временно не са достъпни",
    })
  ).toBeVisible();
  await expect(page.locator('a[href*="/listing/"]')).toHaveCount(0);
  await expectHealthyPublicPage(page, errors);

  const sitemapResponse = await page.request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();
  expect(sitemap).toContain("/en/cars");
  expect(sitemap).toMatch(DEFAULT_CARS_SITEMAP_ENTRY);
  expect(sitemap).not.toContain("/listing/");
  expect(sitemap).not.toContain("/dealers/");

  const categoryResponse = await page.goto("/bg/cars", {
    waitUntil: "domcontentloaded",
  });
  expect(categoryResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      exact: true,
      level: 1,
      name: "Обявите временно не са достъпни",
    })
  ).toBeVisible();
  await expect(page.locator('a[href*="/listing/"]')).toHaveCount(0);
  await expectHealthyPublicPage(page, errors);

  const listingResponse = await page.goto(
    "/bg/listing/bmw-x5-m50d-sofia-2020",
    { waitUntil: "domcontentloaded" }
  );
  expect(listingResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      exact: true,
      level: 1,
      name: "Обявите временно не са достъпни",
    })
  ).toBeVisible();
  await expect(page).toHaveTitle(
    "Обявата не е налична | Day & Night Auto Group"
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow"
  );
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(
    0
  );
  await expectHealthyPublicPage(page, errors);

  const englishCategoryResponse = await page.goto("/en/cars", {
    waitUntil: "domcontentloaded",
  });
  expect(englishCategoryResponse?.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      exact: true,
      level: 1,
      name: "Listings are temporarily unavailable",
    })
  ).toBeVisible();
  await expect(page.locator('a[href*="/listing/"]')).toHaveCount(0);
  await expectHealthyPublicPage(page, errors);

  for (const path of ["/bg/dealers", "/bg/registry", "/bg/pricing"]) {
    expectedNotFoundUrls.add(
      new URL(path.replace("/bg/", "/"), page.url()).href
    );
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).not.toContainText(
      LEGACY_PLATFORM_NAME_PATTERN
    );
    await expectHealthyPublicPage(page, errors);
  }
});
