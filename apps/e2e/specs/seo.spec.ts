import { expect, type Page, test } from "@playwright/test";
import { leadSite } from "@repo/marketplace/lead-site";

const invalidSitemapPathPattern = /undefined|\[locale\]/;
const hydrationErrorPattern = /hydration|Minified React error #418/i;
const httpUrlPattern = /^https?:\/\//;
const noindexFollowPattern = /noindex.*follow/i;
const normalizedMakeUrlPattern = /\/cars\/bmw\?fuel=diesel$/;
const englishGuideHrefPattern = /^\/en\/guides\//;

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
      `${origin}/guides`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="bg-BG"]')
    ).toHaveAttribute("href", `${origin}/guides`);
    const englishAlternate = page.locator(
      'link[rel="alternate"][hreflang="en"]'
    );
    if (leadSite.staticDemoMode) {
      await expect(englishAlternate).toHaveCount(0);
    } else {
      await expect(englishAlternate).toHaveAttribute(
        "href",
        `${origin}/en/guides`
      );
    }
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${origin}/lead-hero.jpg`
    );
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
      "content",
      `${origin}/lead-hero.jpg`
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
    await expect(page).toHaveURL(normalizedMakeUrlPattern);
    expect(new URL(page.url()).searchParams.get("fuel")).toBe("diesel");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${new URL(page.url()).origin}/cars/bmw`
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

test("English content routes obey the configured public language policy", async ({
  page,
}) => {
  if (leadSite.staticDemoMode) {
    const response = await page.request.get("/en/guides?topic=import", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, response.url()).pathname).toBe(
      "/guides"
    );
    expect(
      new URL(response.headers().location, response.url()).searchParams.get(
        "topic"
      )
    ).toBe("import");
    await page.goto("/en/guides?topic=import");
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    const origin = new URL(page.url()).origin;
    await expect(page).toHaveURL(`${origin}/guides?topic=import`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${origin}/guides`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveCount(0);
    const article = page.locator('main a[href*="/guides/"]').first();
    await expect(article).not.toHaveAttribute("href", englishGuideHrefPattern);
    const articleHref = await article.getAttribute("href");
    expect(articleHref).toBeTruthy();
    await article.click();
    await expect(page).toHaveURL(new URL(articleHref as string, origin).href);
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    await page.goBack();
    await expect(page).toHaveURL(`${origin}/guides?topic=import`);
    return;
  }
  await page.goto("/en/guides");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Guides and articles"
  );
  const origin = new URL(page.url()).origin;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${origin}/en/guides`
  );
  const article = page.locator('main a[href*="/guides/"]').first();
  await expect(article).toHaveAttribute("href", englishGuideHrefPattern);
  const articleHref = await article.getAttribute("href");
  expect(articleHref).toBeTruthy();
  await article.click();
  await expect(page).toHaveURL(new URL(articleHref as string, origin).href);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(`${origin}/en/guides`);
});
