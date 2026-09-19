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
      .filter((image) => image.getClientRects().length > 0)
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
