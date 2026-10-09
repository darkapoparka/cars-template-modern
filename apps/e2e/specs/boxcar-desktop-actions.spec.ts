import { expect, test } from "@playwright/test";
import { publicSite } from "@repo/marketplace/site-config";
import { dismissModernWelcome } from "../fixtures/modern-session.setup";

test.beforeEach(async ({ context, baseURL }) => {
  await dismissModernWelcome(context.request, baseURL, "en");
});

test("desktop shortlist persists, updates across tabs and closes below its breakpoint", async ({
  page,
  context,
}) => {
  await page.goto("/en");
  const bookmark = page
    .locator('[data-slot="home-stock-grid"] [data-slot="desktop-save-car"]')
    .first();
  await expect(bookmark).toHaveAttribute("aria-pressed", "false");
  await bookmark.click();
  await expect(bookmark).toHaveAttribute("aria-pressed", "true");
  const saved = page.locator('header [data-slot="desktop-saved-cars"]:visible');
  await expect(saved).toHaveText("Saved (1)");
  await page.reload();
  await expect(saved).toHaveText("Saved (1)");
  await saved.click();
  const dialog = page.getByRole("dialog", { name: "Saved cars", exact: true });
  await expect(dialog.locator("article")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(saved).toBeFocused();
  const second = await context.newPage();
  await second.goto("/en");
  await second
    .locator('[data-slot="home-stock-grid"] [data-slot="desktop-save-car"]')
    .first()
    .click();
  await expect(saved).toHaveText("Saved");
  await second.close();
  await page.goto("/en/listing/bmw-x5-m50d-sofia-2020");
  const detailBookmark = page.locator(
    '[data-slot="desktop-save-car"][aria-label$="2020 BMW X5"]:visible'
  );
  await expect(detailBookmark).toHaveAccessibleName("Save 2020 BMW X5");
  await expect(detailBookmark).toHaveAttribute("aria-pressed", "false");
  await detailBookmark.click();
  await expect(detailBookmark).toHaveAttribute("aria-pressed", "true");
  await saved.click();
  await expect(dialog.locator("article")).toHaveCount(1);
  await expect(dialog.locator("article a")).toHaveAttribute(
    "href",
    "/en/listing/bmw-x5-m50d-sofia-2020"
  );
  await expect(dialog.locator("article h3")).toContainText("BMW X5");
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.goto("/en");
  await saved.click();
  await expect(
    dialog.getByText("Bookmark a car to keep your shortlist here.")
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(
    page.locator('[data-slot="dealer-desktop-header"]')
  ).toBeHidden();
  await expect(page.locator('[data-slot="dealer-bottom-nav"]')).toBeVisible();
});

test("the desktop hero preloads only at desktop widths", async ({ page }) => {
  // This matrix visits four routes at seven widths, including cold dev routes.
  test.setTimeout(120_000);
  const photo = (kind: "about" | "contact") => {
    const artwork =
      publicSite.artwork.desktopPageHeroes?.[kind] ??
      publicSite.artwork.desktopHeroScene ??
      publicSite.artwork.heroScene;
    if (!artwork) {
      throw new Error(`The ${kind} photo hero requires configured artwork.`);
    }
    return artwork;
  };
  const routes = [
    {
      path: "/en",
      assets: Object.values(
        publicSite.artwork.desktopDiscoveryVehicles ?? {}
      ).map(({ src }) => src),
      minWidth: 1200,
    },
    {
      path: "/en/cars",
      assets: Object.values(
        publicSite.artwork.desktopInventoryVehicles ?? {}
      ).map(({ src }) => src),
      minWidth: 1200,
    },
    { path: "/en/about", assets: [photo("about")], minWidth: 1024 },
    { path: "/en/contact", assets: [photo("contact")], minWidth: 1024 },
  ];
  const assetPaths = new Set(routes.flatMap(({ assets }) => assets));
  const heroRequests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if ([...assetPaths].some((asset) => path.endsWith(asset))) {
      heroRequests.push(path);
    }
  });
  for (const width of [320, 390, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    for (const { path, assets, minWidth } of routes) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      await expect(
        page.locator(
          '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"][data-variant="inventory"], [data-slot="dealer-desktop-context-hero"][data-appearance="photo"] h1'
        )
      ).toBeHidden();
      for (const asset of new Set(assets)) {
        await expect(
          page.locator(`head link[rel="preload"][as="image"][href$="${asset}"]`)
        ).toHaveAttribute("media", `(min-width: ${minWidth}px)`);
      }
    }
  }
  expect(heroRequests).toEqual([]);
  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const { path, assets, minWidth } of routes) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(
        page.locator(
          '[data-slot="dealer-desktop-home-hero"]:visible, [data-slot="dealer-desktop-context-hero"][data-variant="inventory"]:visible, [data-slot="dealer-desktop-context-hero"][data-appearance="photo"] h1:visible'
        )
      ).toBeVisible();
      for (const asset of new Set(assets)) {
        const preload = page.locator(
          `head link[rel="preload"][as="image"][href$="${asset}"]`
        );
        await expect(preload).toHaveCount(1);
        await expect(preload).toHaveAttribute("fetchpriority", "high");
        if (width >= minWidth) {
          await expect
            .poll(() => heroRequests.some((request) => request.endsWith(asset)))
            .toBe(true);
        }
      }
      if (minWidth === 1200) {
        const scene = page.locator(
          '[data-slot="dealer-desktop-hero-vehicles"]'
        );
        await expect(scene.locator("source").first()).toHaveAttribute(
          "media",
          "(min-width: 1200px)"
        );
        await expect
          .poll(() =>
            scene.locator("img").evaluateAll(
              (images, expected) =>
                images.length === 2 &&
                images.every((image) => {
                  const img = image as HTMLImageElement;
                  return expected.width < 1200
                    ? img.currentSrc.startsWith("data:image/gif")
                    : img.complete &&
                        img.naturalWidth > 1 &&
                        expected.assets.some((asset) =>
                          new URL(img.currentSrc).pathname.endsWith(asset)
                        );
                }),
              { width, assets }
            )
          )
          .toBe(true);
      }
    }
  }
});

test("desktop enquiry previews locally, preserves viewing intent and clears stale feedback", async ({
  page,
}) => {
  await page.goto("/en/contact?intent=viewing");
  const form = page.locator('[data-slot="desktop-contact-preview-form"]');
  await expect(form.locator('[name="interest"]')).toHaveValue("viewing");
  await form
    .getByRole("button", { name: "Preview enquiry", exact: true })
    .click();
  await expect(form.locator("output")).toHaveCount(0);
  await form.getByLabel("Full name", { exact: true }).fill("Preview visitor");
  await form
    .getByLabel("Email address", { exact: true })
    .fill("preview@example.com");
  await form
    .getByLabel("Your message", { exact: true })
    .fill("I would like to arrange a viewing.");
  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") {
      posts.push(request.url());
    }
  });
  await form
    .getByRole("button", { name: "Preview enquiry", exact: true })
    .click();
  await expect(form.locator("output")).toContainText("No message was sent.");
  await expect(form.locator('output a[href^="tel:"]')).toBeVisible();
  expect(posts).toEqual([]);
  await form
    .getByLabel("Your message", { exact: true })
    .fill("A different viewing question.");
  await expect(form.locator("output")).toHaveCount(0);
  const action = page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Get in touch", exact: true });
  await expect(action).toHaveAttribute("href", "/en/contact");
});
