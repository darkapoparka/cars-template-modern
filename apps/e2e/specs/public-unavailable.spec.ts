import { expect, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const ENGLISH_CARS_SITEMAP_ENTRY = /<loc>https?:\/\/[^<]+\/cars<\/loc>/;
const LEGACY_PLATFORM_NAME_PATTERN = /AutoMarket/i;

test("production mode reports unavailable inventory without demo listings", async ({
  page,
}) => {
  const errors = collectPublicPageErrors(page);
  const homeResponse = await page.goto("/bg", {
    waitUntil: "domcontentloaded",
  });

  expect(homeResponse?.status()).toBe(200);
  const productionCsp = homeResponse?.headers()["content-security-policy"];
  expect(productionCsp).toContain("script-src 'self' 'unsafe-inline'");
  expect(productionCsp).not.toContain("'unsafe-eval'");
  await expect(page.locator("#analytics-consent-bootstrap")).toHaveCount(1);
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
  expect(sitemap).toContain("/bg/cars");
  expect(sitemap).toMatch(ENGLISH_CARS_SITEMAP_ENTRY);
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
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).not.toContainText(
      LEGACY_PLATFORM_NAME_PATTERN
    );
    await expectHealthyPublicPage(page, errors);
  }
});
