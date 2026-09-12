import { expect, test } from "@playwright/test";

const hydrationPattern = /hydration|Minified React error #418/i;
const invalidSitemapPattern = /undefined|\[locale\]/;
const listingPathPattern = /\/listing\/[^/?#]+$/;
const publicRoutes = [
  "/",
  "/cars",
  "/imports",
  "/imports/china",
  "/sell",
  "/lease",
  "/contact",
  "/guides",
  "/legal/privacy",
  "/legal/terms",
  "/motorbikes",
  "/trucks",
  "/vans",
  "/cars/bmw",
  "/cars/bmw/x5",
  "/collections/chinese-ev-hybrids",
];

for (const route of publicRoutes) {
  test(`showroom route ${route} renders without runtime or layout failures`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" && hydrationPattern.test(message.text())) {
        errors.push(message.text());
      }
    });
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("main").first()).toBeVisible();
    expect(await page.locator("body").innerText()).not.toBe("");
    await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true);
    const brokenImages = await page
      .locator("img:visible")
      .evaluateAll((images) =>
        images
          .filter((image) => {
            const element = image as HTMLImageElement;
            return element.complete && element.naturalWidth === 0;
          })
          .map((image) => (image as HTMLImageElement).src)
      );
    expect(brokenImages).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("static showroom exposes no account links, fake delivery result, or analytics bootstrap", async ({
  page,
}) => {
  await page.goto("/contact");
  await expect(page.locator("#analytics-consent-bootstrap")).toHaveCount(0);
  await expect(page.locator('a[href*="/sign-in"]')).toHaveCount(0);
  const phone = page.locator('a[href^="tel:"]').first();
  await expect(phone).toHaveAttribute("href", "tel:+359877733110");
  await expect(
    page.locator('a[href*="google.com/maps"]').first()
  ).toHaveAttribute("target", "_blank");
});

test("inventory listing links and intentional sitemap routes resolve", async ({
  page,
}) => {
  await page.goto("/cars");
  const hrefs = await page
    .locator('a[href*="/listing/"]')
    .evaluateAll((links) =>
      [...new Set(links.map((link) => link.getAttribute("href")))].filter(
        (href): href is string => Boolean(href)
      )
    );
  const listingHrefs = hrefs.filter((href) => listingPathPattern.test(href));
  expect(listingHrefs.length).toBeGreaterThan(0);
  for (const href of listingHrefs) {
    const response = await page.request.get(href);
    expect(response.status()).toBe(200);
    expect(await response.text()).not.toContain("Page not found");
  }
  const sitemap = await page.request.get("/sitemap.xml");
  const xml = await sitemap.text();
  expect(sitemap.status()).toBe(200);
  expect(xml).not.toMatch(invalidSitemapPattern);
  expect(xml).not.toContain("/dealers");
  expect(xml).not.toContain("/registry");
});
