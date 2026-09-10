import { expect, type Page, test } from "@playwright/test";

const invalidSitemapPathPattern = /undefined|\[locale\]/;
const hydrationErrorPattern = /hydration|Minified React error #418/i;
const httpUrlPattern = /^https?:\/\//;
const noindexFollowPattern = /noindex.*follow/i;

const getStructuredData = async (page: Page) => {
  const entries = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();

  return entries.map((entry) => JSON.parse(entry) as Record<string, unknown>);
};

const getFirstDeepHref = async (page: Page, family: "listing") => {
  const hrefs = await page
    .locator(`a[href*="/${family}/"]`)
    .evaluateAll((links) =>
      links.flatMap((link) => {
        const href = link.getAttribute("href");
        return href ? [href] : [];
      })
    );
  return hrefs.find((href) =>
    new RegExp(`/${family}/[^/?#]+(?:[?#]|$)`).test(href)
  );
};

test.describe("SEO contracts", () => {
  test("robots and sitemap expose canonical production paths", async ({
    request,
  }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const robotsText = await robots.text();
    expect(robotsText).toContain("Sitemap:");
    expect(robotsText).not.toContain("undefined");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain("<urlset");
    expect(sitemapText).toContain("/cars");
    expect(sitemapText).not.toMatch(invalidSitemapPathPattern);
  });

  test("localized landing metadata has canonical, hreflang, and social images", async ({
    page,
  }) => {
    await page.goto("/bg/guides");
    const origin = new URL(page.url()).origin;

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}/bg/guides`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="bg-BG"]')
    ).toHaveAttribute("href", `${origin}/bg/guides`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveAttribute("href", `${origin}/guides`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${origin}/-/opengraph-image.png`
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      `${origin}/-/opengraph-image.png`
    );
  });

  test("faceted URLs are crawlable but not indexable", async ({ page }) => {
    await page.goto("/cars?make=BMW&fuel=diesel");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${new URL(page.url()).origin}/cars`
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      noindexFollowPattern
    );
  });

  test("listing pages expose linked, absolute, localized JSON-LD", async ({
    page,
  }) => {
    await page.goto("/bg/cars");
    const listingHref = await getFirstDeepHref(page, "listing");
    expect(listingHref).toBeTruthy();
    await page.goto(listingHref ?? "/bg/cars");

    const graph = await getStructuredData(page);
    const vehicle = graph.find((entry) => entry["@type"] === "Vehicle");
    const offer = graph.find((entry) => entry["@type"] === "Offer");
    const breadcrumb = graph.find(
      (entry) => entry["@type"] === "BreadcrumbList"
    );

    expect(vehicle).toBeTruthy();
    expect(offer).toBeTruthy();
    expect(breadcrumb).toBeTruthy();
    expect(vehicle?.["@id"]).toEqual(expect.stringMatching(httpUrlPattern));
    expect(vehicle?.image).toEqual(
      expect.arrayContaining([expect.stringMatching(httpUrlPattern)])
    );
    expect(offer?.itemOffered).toEqual({ "@id": vehicle?.["@id"] });
    expect(JSON.stringify(breadcrumb?.itemListElement)).toContain("Автомобили");
  });

  test("make routes normalize case while preserving filters", async ({
    page,
  }) => {
    await page.goto("/bg/cars/BMW?fuel=diesel");
    expect(new URL(page.url()).pathname).toBe("/bg/cars/bmw");
    expect(new URL(page.url()).searchParams.get("fuel")).toBe("diesel");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${new URL(page.url()).origin}/bg/cars/bmw`
    );
  });

  test("localized 404 renders consistently without hydration errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });

    const response = await page.goto("/bg/seo-contract-missing-route");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Страницата не е намерена"
    );
    await expect(page).toHaveTitle(
      "Страницата не е намерена | Day & Night Auto Group"
    );
    expect(consoleErrors.join("\n")).not.toMatch(hydrationErrorPattern);
  });
});
