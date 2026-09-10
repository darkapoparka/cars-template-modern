import { expect, test } from "@playwright/test";

const defaultLocalePrefix = /^\/bg(?=\/)/;

for (const width of [320, 360, 390, 430, 844]) {
  test(`mobile header stays aligned across navigation at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await page.addInitScript(() => {
      const samples: number[][] = [];
      Object.assign(window, { chromeSamples: samples });
      const sample = () => {
        const slots = [
          "mobile-dealer-chrome",
          "mobile-dealer-brand-row",
          "mobile-dealer-primary-control",
          "mobile-dealer-content",
        ];
        const nodes = slots.map((slot) =>
          [...document.querySelectorAll(`[data-slot="${slot}"]`)].find(
            (node) => node.getBoundingClientRect().height > 0
          )
        );
        if (nodes.every(Boolean) && window.scrollY === 0) {
          const positions = nodes.map(
            (node) => node?.getBoundingClientRect().y ?? -1
          );
          if (JSON.stringify(samples.at(-1)) !== JSON.stringify(positions)) {
            samples.push(positions);
          }
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.goto("/");
    const nav = page.getByRole("navigation", {
      name: "Навигация на автокъщата",
      exact: true,
    });
    let logoBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null = null;
    for (const label of [null, "Лизинг", "Внос", "Продай", "Коли", "Лизинг"]) {
      if (label) {
        const link = nav.getByRole("link", { name: label, exact: true });
        const href = await link.getAttribute("href");
        await link.click();
        await page.waitForURL(
          (url) =>
            `${url.pathname}${url.search}` ===
            href?.replace(defaultLocalePrefix, "")
        );
      }
      await expect(
        nav.getByRole("button", { name: "Меню", exact: true })
      ).toBeVisible();
      const chrome = page.locator('[data-slot="mobile-dealer-chrome"]:visible');
      await expect(chrome).toBeVisible();
      await page.waitForLoadState("networkidle");
      const logo = chrome.locator('img[alt="Day & Night Auto Group"]');
      const current = await logo.boundingBox();
      if (logoBox) {
        expect(current).toEqual(logoBox);
      } else {
        logoBox = current;
      }
      const content = page.locator(
        '[data-slot="mobile-dealer-content"]:visible'
      );
      expect((await content.boundingBox())?.y).toBe(128);
      expect(
        (
          await chrome
            .locator('[data-slot="mobile-dealer-primary-control"]')
            .boundingBox()
        )?.y
      ).toBe(64);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
    const samples = await page.evaluate(
      () => (window as unknown as { chromeSamples: number[][] }).chromeSamples
    );
    expect(samples.length).toBeGreaterThan(0);
    for (const positions of samples) {
      expect(positions).toEqual([0, 12, 64, 128]);
    }
    await page.goBack();
    await expect(
      page.locator('[data-slot="mobile-discovery-search"]:visible')
    ).toBeVisible();
    expect(
      (
        await page
          .locator('[data-slot="mobile-dealer-content"]:visible')
          .boundingBox()
      )?.y
    ).toBe(128);
  });
}
