import { expect, type Page, test } from "@playwright/test";

const defaultLocalePrefix = /^\/bg(?=\/)/;
const serviceTitles: Record<string, string> = {
  Коли: "Открий автомобил",
  Лизинг: "Лизинг на автомобил",
  Внос: "Внос на автомобил",
  Продай: "Продай автомобил",
};

const primaryControlSlots: Record<string, string> = {
  Лизинг: "lease-mobile-vehicle-trigger",
  Внос: "mobile-import-search-trigger",
  Продай: "mobile-sell-vin-entry",
};

const waitForTitleFont = async (page: Page) => {
  await page.evaluate(async () => {
    const title = document.querySelector('[data-slot="mobile-dealer-title"]');
    if (title) {
      const style = getComputedStyle(title);
      const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const text = title.textContent ?? "";
      if (!document.fonts.check(font, text)) {
        await document.fonts.load(font, text);
      }
    }
  });
};

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
    await page.goto("/", { waitUntil: "domcontentloaded" });
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
            `${url.pathname}${url.search}`.replace(defaultLocalePrefix, "") ===
            href?.replace(defaultLocalePrefix, ""),
          { waitUntil: "domcontentloaded" }
        );
      }
      await expect(
        nav.getByRole("button", { name: "Меню", exact: true })
      ).toBeVisible();
      const chrome = page.locator('[data-slot="mobile-dealer-chrome"]:visible');
      await expect(chrome).toBeVisible();
      await expect
        .poll(() =>
          chrome
            .locator("[data-header-icon] img")
            .evaluateAll(
              (images) =>
                images.length > 0 &&
                images.every(
                  (image) =>
                    image instanceof HTMLImageElement &&
                    image.complete &&
                    image.naturalWidth > 0
                )
            )
        )
        .toBe(true);
      const controlSlot =
        (label && primaryControlSlots[label]) || "mobile-discovery-search";
      const control = chrome.locator(`[data-slot="${controlSlot}"]`);
      await expect(control).toBeVisible();
      await expect(control).toBeEnabled();
      await expect(
        chrome.locator('[data-slot="mobile-dealer-title"]')
      ).toHaveCSS("font-size", "18px");
      await waitForTitleFont(page);
      const logo = chrome
        .locator('[data-slot="mobile-dealer-brand-row"]')
        .getByRole("img");
      await expect(logo).toBeVisible();
      const current = await logo.boundingBox();
      expect(current).not.toBeNull();
      if (logoBox) {
        expect(current).toEqual(logoBox);
      } else {
        logoBox = current;
      }
      const content = page.locator(
        '[data-slot="mobile-dealer-content"]:visible'
      );
      const title = chrome.locator('[data-slot="mobile-dealer-title"]');
      const expectedTitle = label ? serviceTitles[label] : "Открий автомобил";
      await expect(title).toHaveText(expectedTitle);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const titleBox = await title.boundingBox();
      expect(titleBox?.y).toBe(68);
      expect(titleBox?.height).toBe(28);
      expect((await content.boundingBox())?.y).toBe(168);
      expect(
        (
          await chrome
            .locator('[data-slot="mobile-dealer-primary-control"]')
            .boundingBox()
        )?.y
      ).toBe(68);
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
      expect(positions).toEqual([0, 12, 68, 168]);
    }
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(
      page.locator('[data-slot="mobile-discovery-search"]:visible')
    ).toBeVisible();
    expect(
      (
        await page
          .locator('[data-slot="mobile-dealer-content"]:visible')
          .boundingBox()
      )?.y
    ).toBe(168);
    for (const [route, title] of [
      ["/services", "Нашите услуги"],
      ["/guides", "Съвети и статии"],
      ["/about", "За нас и контакти"],
      ["/contact", "За нас и контакти"],
    ]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const heading = page.locator('[data-slot="mobile-dealer-title"]:visible');
      await expect(heading).toHaveText(title);
      await expect(heading).toHaveCSS("font-size", "18px");
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await waitForTitleFont(page);
      expect((await heading.boundingBox())?.y).toBe(68);
      expect((await heading.boundingBox())?.height).toBe(28);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
    }
  });
}
