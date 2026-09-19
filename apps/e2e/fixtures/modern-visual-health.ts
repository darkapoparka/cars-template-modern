import { expect, type Page } from "@playwright/test";

export const settleModernPage = async (page: Page) => {
  await page.locator("main").first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator("img:visible").evaluateAll((images) => {
    for (const image of images) {
      (image as HTMLImageElement).loading = "eager";
    }
  });
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => {
        if (image.getClientRects().length === 0) {
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
