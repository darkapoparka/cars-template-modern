import { expect, test } from "@playwright/test";

const makeQuery = /make=BMW/;

for (const locale of ["bg", "en"] as const) {
  test(`title-led banners and results controls (${locale})`, async ({
    page,
  }) => {
    for (const width of [1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      const home = page.locator(
        '[data-slot="dealer-desktop-home-hero"]:visible'
      );
      const homeSearch = await home.locator("form").boundingBox();
      const homeTitle = await home.locator("h1").boundingBox();
      await expect(home.locator("nav, p")).toHaveCount(0);
      await page.goto(`/${locale}/cars`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      const inventory = page.locator(
        '[data-slot="dealer-desktop-context-hero"][data-variant="inventory"]:visible'
      );
      const inventoryTitle = await inventory.locator("h1").boundingBox();
      const inventorySearch = await inventory
        .locator("fieldset")
        .first()
        .boundingBox();
      expect(inventorySearch?.width).toBe(homeSearch?.width);
      expect(inventorySearch?.y).toBe(homeSearch?.y);
      expect(inventoryTitle?.y).toBe(homeTitle?.y);
      const types = inventory.locator('[data-slot="desktop-inventory-types"]');
      await expect(types.getByRole("button")).toHaveCount(4);
      expect(
        await types
          .locator('[aria-pressed="true"]')
          .evaluate((el) => getComputedStyle(el).backgroundColor)
      ).toBe("rgb(255, 255, 255)");
      await expect(
        inventory.locator('[data-slot="desktop-results-controls"]')
      ).toHaveCount(0);
      const results = page.locator('[data-slot="dealer-inventory-panel"]');
      const controls = results.locator(
        '[data-slot="desktop-results-controls"]'
      );
      await expect(controls).toBeVisible();
      await expect(controls.getByRole("combobox")).toContainText(
        locale === "bg" ? "Сортирай" : "Sort"
      );
      const grid = results.locator('[data-slot="marketplace-listing-grid"]');
      const initialGridTop = await grid.evaluate(
        (el) => el.getBoundingClientRect().top + window.scrollY
      );
      const initialControlBox = await controls.boundingBox();
      const filterButton = controls.getByRole("button");
      expect(
        await filterButton.evaluate((el) => getComputedStyle(el).color)
      ).toBe("rgb(255, 255, 255)");
      await filterButton.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(filterButton).toBeFocused();
      await page.goto(`/${locale}/cars?make=BMW&yearMin=2020&priceMax=180000`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      const toolbar = page.locator('[data-slot="dealer-inventory-filters"]');
      await expect(
        toolbar.locator('[data-slot="dealer-inventory-active-filter"]')
      ).toHaveCount(3);
      expect(
        await grid.evaluate(
          (el) => el.getBoundingClientRect().top + window.scrollY
        )
      ).toBe(initialGridTop);
      expect((await controls.boundingBox())?.width).toBe(
        initialControlBox?.width
      );
      await toolbar
        .getByRole("button", {
          name: `${locale === "bg" ? "Премахни" : "Remove"}: BMW`,
          exact: true,
        })
        .click();
      await expect(page).not.toHaveURL(makeQuery);
      await expect(
        toolbar.locator('[data-slot="dealer-inventory-active-filter"]')
      ).toHaveCount(2);
      await toolbar.locator('[data-slot="desktop-clear-all-filters"]').click();
      await expect(
        toolbar.locator('[data-slot="dealer-inventory-active-filter"]')
      ).toHaveCount(0);
      expect(
        await grid.evaluate(
          (el) => el.getBoundingClientRect().top + window.scrollY
        )
      ).toBe(initialGridTop);
      for (const route of ["about", "contact"]) {
        await page.goto(`/${locale}/${route}`);
        const banner = page.locator(
          '[data-slot="dealer-desktop-hero-banner"]:visible'
        );
        const title = await banner.locator("h1").boundingBox();
        const actions = banner.locator(
          '[data-slot="dealer-desktop-hero-actions"]'
        );
        const actionBox = await actions.boundingBox();
        const box = await banner.boundingBox();
        expect(box?.height).toBe(320);
        expect(
          Math.abs(
            ((title?.y ?? 0) + (actionBox?.y ?? 0) + (actionBox?.height ?? 0)) /
              2 -
              ((box?.y ?? 0) + 160)
          )
        ).toBeLessThan(1);
        await expect(banner.locator("nav, p")).toHaveCount(0);
        await expect(actions.getByRole("link")).toHaveCount(2);
      }
    }
  });

  test(`service search, pills and reset (${locale})`, async ({ page }) => {
    for (const width of [320, 390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/services`);
      const search = page
        .getByRole("searchbox", {
          name: locale === "bg" ? "Търсене на услуги" : "Search services",
        })
        .filter({ visible: true });
      const cards = page.locator('[data-slot="dealer-service-card"]');
      await expect(cards).toHaveCount(4);
      const controls = page.locator(
        '[data-slot="dealer-service-search"]:visible'
      );
      await controls
        .getByRole("button", {
          name: locale === "bg" ? "Внос" : "Import",
          exact: true,
        })
        .click();
      await expect(cards).toHaveCount(1);
      await expect(cards).toHaveAttribute("href", `/${locale}/imports`);
      await search.fill("no-such-service");
      await expect(cards).toHaveCount(0);
      await expect(
        page.getByRole("heading", {
          name:
            locale === "bg" ? "Няма съвпадащи услуги" : "No matching services",
        })
      ).toBeVisible();
      await controls
        .getByRole("button", {
          name:
            locale === "bg"
              ? "Изчисти търсенето и филтрите"
              : "Clear search and filters",
        })
        .click();
      await expect(cards).toHaveCount(4);
      await expect(search).toBeFocused();
      await search.fill(locale === "bg" ? "ЛИЗИНГ" : "LEASING");
      await expect(cards).toHaveCount(1);
      await expect(cards).toHaveAttribute("href", `/${locale}/lease`);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
  });
}
