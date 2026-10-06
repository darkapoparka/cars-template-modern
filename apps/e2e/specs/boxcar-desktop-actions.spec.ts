import { expect, test } from "@playwright/test";

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
    '[data-slot="desktop-save-car"][data-presentation="action"]:visible'
  );
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
  const heroRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/desktop-boxcars/hero.jpg")) {
      heroRequests.push(request.url());
    }
  });
  for (const width of [320, 390, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/en", "/en/cars", "/en/about", "/en/contact"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      await expect(
        page.locator(
          '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"][data-variant="inventory"], [data-slot="dealer-desktop-context-hero"][data-appearance="photo"] h1'
        )
      ).toBeHidden();
      await expect(
        page.locator(
          'head link[rel="preload"][as="image"][href$="/desktop-boxcars/hero.jpg"]'
        )
      ).toHaveAttribute("media", "(min-width: 1024px)");
    }
  }
  expect(heroRequests).toEqual([]);
  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/en", "/en/cars", "/en/about", "/en/contact"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await expect(
        page.locator(
          '[data-slot="dealer-desktop-home-hero"]:visible, [data-slot="dealer-desktop-context-hero"][data-variant="inventory"]:visible, [data-slot="dealer-desktop-context-hero"][data-appearance="photo"] h1:visible'
        )
      ).toBeVisible();
      await expect.poll(() => heroRequests.length).toBeGreaterThan(0);
      const preload = page.locator(
        'head link[rel="preload"][as="image"][href$="/desktop-boxcars/hero.jpg"]'
      );
      await expect(preload).toHaveCount(1);
      await expect(preload).toHaveAttribute("fetchpriority", "high");
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
  const action = page.locator('footer a[data-slot="button"]');
  expect(
    await action.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.color !== style.backgroundColor;
    })
  ).toBe(true);
});
