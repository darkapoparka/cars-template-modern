import { expect, type Page } from "@playwright/test";

const inventoryRoute =
  /^\/(?:bg\/|en\/)?(?:cars(?:\/.*)?|motorbikes|trucks|vans)?\/?$/;

export const settleModernPage = async (page: Page) => {
  await page.locator("main").first().waitFor();
  if (inventoryRoute.test(new URL(page.url()).pathname)) {
    await page.locator('[data-slot="marketplace-main"]').waitFor();
    await expect(
      page.locator('[data-slot="desktop-search-query"] input').first()
    ).toBeEnabled();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => {
        if (image.getClientRects().length === 0) {
          return false;
        }
        const imageBounds = image.getBoundingClientRect();
        if (imageBounds.top >= innerHeight || imageBounds.bottom <= 0) {
          return false;
        }
        const viewport = image.closest('[data-slot="carousel-content"]');
        if (!viewport) {
          return true;
        }
        // Off-canvas slides are not rendered in a screenshot. Verify them after navigation.
        const clip = viewport.getBoundingClientRect();
        const bounds = image.getBoundingClientRect();
        return bounds.right > clip.left && bounds.left < clip.right;
      })
      .every((image) => image.complete && image.naturalWidth > 0)
  );
  await expect(page.locator("body")).not.toContainText("Application error");
};

export const expectNoHorizontalOverflow = async (page: Page) => {
  const size = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(size.content).toBeLessThanOrEqual(size.viewport);
};
