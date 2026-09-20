import { chromium, expect } from "@playwright/test";

const browser = await chromium.launch();
try {
  for (const width of [390, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") {
        errors.push(m.text());
      }
    });
    for (const [name, path] of [
      ["home", "/"],
      ["cars", "/cars"],
    ]) {
      await page.goto(`http://localhost:3002${path}`);
      await page.locator("[data-slot=marketplace-main]").waitFor();
      await expect(
        page.locator("[data-slot=desktop-search-query] input").first()
      ).toBeEnabled();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() =>
        [...document.images]
          .filter((image) => {
            if (!image.getClientRects().length) {
              return false;
            }
            const bounds = image.getBoundingClientRect();
            if (bounds.top >= innerHeight || bounds.bottom <= 0) {
              return false;
            }
            const carousel = image.closest("[data-slot=carousel-content]");
            if (!carousel) {
              return true;
            }
            const clip = carousel.getBoundingClientRect();
            return bounds.right > clip.left && bounds.left < clip.right;
          })
          .every((image) => image.complete && image.naturalWidth > 0)
      );
      await page.evaluate(async () => {
        await Promise.all(
          [...document.images]
            .filter((i) => i.complete && i.naturalWidth)
            .map((i) => i.decode())
        );
      });
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(size.content).toBeLessThanOrEqual(size.viewport);
      expect(errors).toEqual([]);
      await page.screenshot({ path: `desktop-polish-${name}-${width}.png` });
      console.log(JSON.stringify({ name, width, ...size, errors }));
    }
    await page.close();
  }
} finally {
  await browser.close();
}
