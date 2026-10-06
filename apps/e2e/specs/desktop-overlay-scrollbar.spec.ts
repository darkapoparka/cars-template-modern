import { expect, test } from "@playwright/test";

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test.beforeEach(async ({ context, baseURL, page }) => {
  // biome-ignore lint/suspicious/noSkippedTests: This regression is scoped to desktop projects.
  test.skip(
    (page.viewportSize()?.width ?? 0) < 1024,
    "Desktop scrollbar gutter"
  );
  if (!baseURL) {
    throw new Error("Scrollbar regression requires a preview origin");
  }
  const response = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: { action: "dismiss", locale: "bg", country: "BG", returnTo: "/cars" },
  });
  expect(response.status()).toBe(200);
});

const frameSelectors = [
  '[data-slot="dealer-desktop-header"]',
  '[data-slot="dealer-desktop-inventory-hero"]',
  '[data-slot="dealer-inventory-panel"]',
];

for (const locale of ["bg", "en"] as const) {
  test(`desktop overlays preserve page geometry with visible scrollbars (${locale})`, async ({
    browserName,
    page,
  }) => {
    const isBg = locale === "bg";
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/cars`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      await page.evaluate(() => document.fonts.ready);
      if (browserName === "chromium") {
        expect(
          await page.evaluate(
            () => innerWidth - document.documentElement.clientWidth
          )
        ).toBeGreaterThan(0);
      }
      const hero = page.locator('[data-slot="dealer-inventory-search"]');
      const bar = page.locator('[data-slot="dealer-inventory-filters"]');
      const summary = page.locator('[data-slot="dealer-inventory-summary"]');
      const overlays = [
        {
          trigger: hero.getByRole("combobox", {
            name: isBg ? "Тип" : "Type",
            exact: true,
          }),
          content: '[data-slot="select-content"]',
        },
        {
          trigger: hero.getByRole("button", {
            name: isBg ? "Марка" : "Make",
            exact: true,
          }),
          content: '[data-slot="desktop-focused-filter-dialog"]',
        },
        {
          trigger: hero.getByRole("button", {
            name: isBg ? "Модел" : "Model",
            exact: true,
          }),
          content: '[data-slot="desktop-focused-filter-dialog"]',
        },
        {
          trigger: hero.getByRole("button", {
            name: isBg ? "Цена" : "Price",
            exact: true,
          }),
          content: '[data-slot="desktop-focused-filter-dialog"]',
        },
        {
          trigger: hero.locator('[data-slot="dealer-inventory-search-open"]'),
          content: '[data-slot="desktop-focused-filter-dialog"]',
        },
        {
          trigger: summary.locator('[data-slot="desktop-primary-control"]'),
          content: '[data-slot="desktop-full-filter-dialog"]',
        },
        {
          trigger: summary.getByRole("combobox"),
          content: '[data-slot="select-content"]',
        },
        {
          trigger: bar.locator('[data-slot="dealer-inventory-preview"]'),
          content: '[data-slot="dropdown-menu-content"]',
        },
      ];
      for (const { trigger, content } of overlays) {
        await trigger.focus();
        const initial = await page.evaluate((selectors) => {
          return selectors.map((selector) => {
            const rect = document
              .querySelector(selector)
              ?.getBoundingClientRect();
            if (!rect) {
              throw new Error(`Missing frame: ${selector}`);
            }
            return { x: rect.x, width: rect.width };
          });
        }, frameSelectors);
        // Sample the transition too: an eventual settled position can hide a jump.
        const samples = page.evaluate(async (selectors) => {
          const values: { x: number; width: number }[][] = [];
          const end = performance.now() + 500;
          while (performance.now() < end) {
            values.push(
              selectors.map((selector) => {
                const rect = document
                  .querySelector(selector)
                  ?.getBoundingClientRect();
                if (!rect) {
                  throw new Error(`Missing frame: ${selector}`);
                }
                return { x: rect.x, width: rect.width };
              })
            );
            await new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve())
            );
          }
          return values;
        }, frameSelectors);
        await page.keyboard.press("Enter");
        await expect(page.locator(content)).toBeVisible();
        for (const frame of await samples) {
          expect(frame).toEqual(initial);
        }
        await page.keyboard.press("Escape");
        await expect(page.locator(content)).toBeHidden();
        await expect(page.locator("body")).not.toHaveAttribute(
          "data-scroll-locked"
        );
        await expect(trigger).toBeFocused();
        const closed = await page.evaluate((selectors) => {
          return selectors.map((selector) => {
            const rect = document
              .querySelector(selector)
              ?.getBoundingClientRect();
            if (!rect) {
              throw new Error(`Missing frame: ${selector}`);
            }
            return { x: rect.x, width: rect.width };
          });
        }, frameSelectors);
        expect(closed).toEqual(initial);
      }
    }
  });
}
