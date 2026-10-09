import { expect, test } from "@playwright/test";
import { dismissModernWelcome } from "../fixtures/modern-session.setup";

const modelStage = { bg: /^Модел/, en: /^Model/ };

test.beforeEach(async ({ context, baseURL, page }) => {
  // biome-ignore lint/suspicious/noSkippedTests: This control is hidden below the desktop breakpoint.
  test.skip(
    (page.viewportSize()?.width ?? 0) < 1024,
    "Desktop inventory search"
  );
  await dismissModernWelcome(context.request, baseURL);
});

for (const locale of ["bg", "en"] as const) {
  test(`inventory type menu switches categories, preserves budget and restores browser Back context (${locale})`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const isBg = locale === "bg";
    await page.goto(
      `/${locale}/cars?make=BMW&model=X5&priceMax=100000&yearMin=2010&sort=newest`
    );
    const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
    const type = hero.getByRole("button", {
      name: isBg ? "Тип превозно средство" : "Vehicle type",
      exact: true,
    });
    await expect(
      type.locator('[data-slot="desktop-vehicle-type-artwork"]')
    ).toBeVisible();
    await type.click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(4);
    await page.keyboard.press("Escape");
    await expect(
      page.locator('[data-slot="dropdown-menu-content"]')
    ).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => {
      document.documentElement.dataset.typeNavigation = "initial";
    });

    for (const [name, path] of [
      [isBg ? "Мотори" : "Motorbikes", "motorbikes"],
      [isBg ? "Бусове" : "Vans", "vans"],
      [isBg ? "Камиони" : "Trucks", "trucks"],
      [isBg ? "Автомобили" : "Cars", "cars"],
    ]) {
      await expect(
        type.locator('[data-slot="desktop-vehicle-type-artwork"]')
      ).toBeVisible();
      await type.click();
      await page.getByRole("menuitemradio", { name, exact: true }).click();
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/${locale}/${path}`);
      await expect(type).toContainText(name);
      await type.click();
      await expect(
        page.getByRole("menuitemradio", { name, exact: true })
      ).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("Escape");
      await expect(
        page.locator('[data-slot="dropdown-menu-content"]')
      ).toHaveCount(0);
      const params = new URL(page.url()).searchParams;
      expect(params.get("priceMax")).toBe("100000");
      expect(params.get("yearMin")).toBe("2010");
      expect(params.get("sort")).toBe("newest");
      expect(params.get("make")).toBeNull();
      expect(params.get("model")).toBeNull();
      await expect(page.locator("html")).toHaveAttribute(
        "data-type-navigation",
        "initial"
      );
    }
    for (const path of ["trucks", "vans", "motorbikes", "cars"]) {
      await page.goBack();
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/${locale}/${path}`);
      await expect(type).toBeEnabled();
    }
    expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
    expect(new URL(page.url()).searchParams.get("model")).toBe("X5");
    await expect(
      hero.getByRole("button", { name: isBg ? "Марка" : "Make", exact: true })
    ).toContainText("BMW");
  });

  test(`inventory controls sit above the cards and keep display choices in a floating menu (${locale})`, async ({
    page,
  }) => {
    const isBg = locale === "bg";
    for (const width of [1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}/cars`);
      const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
      const bar = page.locator('[data-slot="dealer-inventory-filters"]');
      const summary = page.locator('[data-slot="dealer-inventory-summary"]');
      const controls = summary.locator(
        '[data-slot="desktop-results-controls"]'
      );
      const filters = hero.locator('[data-slot="desktop-primary-control"]');
      await expect(filters).toHaveCount(1);
      await expect(filters).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(controls.getByRole("combobox")).toBeVisible();
      await expect(
        hero.locator('[data-slot="desktop-results-controls"]')
      ).toHaveCount(0);
      await expect(
        bar.locator('[data-slot="desktop-primary-control"]')
      ).toHaveCount(0);
      await expect(
        hero.locator('[data-slot="dealer-inventory-hero-filters"] button')
      ).toHaveCount(6);
      const frame = await hero.boundingBox();
      const box = await controls.boundingBox();
      const grid = await page
        .locator('[data-slot="marketplace-listing-grid"]')
        .boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(32);
      expect(box?.y).toBeGreaterThan((frame?.y ?? 0) + (frame?.height ?? 0));
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThan(grid?.y ?? 0);
      expect(box?.x).toBeGreaterThan(grid?.x ?? 0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (grid?.x ?? 0) + (grid?.width ?? 0)
      );
      const count = summary.locator('[data-slot="dealer-inventory-count"]');
      await expect(count).toBeVisible();
      expect((await count.boundingBox())?.width).toBeGreaterThan(1);
      expect((await count.boundingBox())?.x).toBeLessThan(box?.x ?? 0);
      const view = bar.locator('[data-slot="dealer-inventory-preview"]');
      const beforeScroll = await view.boundingBox();
      const documentY =
        (beforeScroll?.y ?? 0) + (await page.evaluate(() => scrollY));
      await page.evaluate(() => scrollTo(0, 300));
      await expect
        .poll(
          async () =>
            ((await view.boundingBox())?.y ?? 0) +
            (await page.evaluate(() => scrollY))
        )
        .toBe(documentY);
      await view.click();
      await expect(
        page.getByRole("menuitemradio", {
          name: isBg ? "Изглед в решетка" : "Grid view",
          exact: true,
        })
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("menuitemradio", {
          name: isBg ? "Бързи филтри" : "Quick filters",
          exact: true,
        })
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        page.getByRole("menuitemradio", {
          name: isBg ? "Страничен панел" : "Sidebar",
          exact: true,
        })
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        bar.locator('[data-slot="dealer-inventory-preview"]')
      ).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
    }
  });

  test(`focused Model and Price dialogs preserve unrelated filters when applying and clearing (${locale})`, async ({
    page,
  }) => {
    const isBg = locale === "bg";
    await page.goto(
      `/${locale}/cars?make=BMW&fuel=diesel&priceMax=150000&sort=price_asc`
    );
    const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
    const model = hero.getByRole("button", {
      name: isBg ? "Модел" : "Model",
      exact: true,
    });
    await model.click();
    const dialog = page.locator('[data-slot="desktop-focused-filter-dialog"]');
    await expect(dialog).toHaveAttribute("data-filter-entry", "model");
    await expect(
      dialog.getByRole("tab", { name: modelStage[locale] })
    ).toHaveAttribute("data-state", "active");
    await expect(
      dialog.locator('[data-slot="desktop-full-filter-navigation"]')
    ).toHaveCount(0);
    await dialog.getByRole("searchbox").fill("X5");
    await dialog.locator('[data-slot="model-option"]').click();
    const apply = dialog.getByRole("button", {
      name: isBg ? "Покажи обявите" : "Show results",
      exact: true,
    });
    await apply.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("model"))
      .toBe("X5");
    const price = hero.getByRole("button", {
      name: isBg ? "Цена" : "Price",
      exact: true,
    });
    await price.click();
    await expect(dialog).toHaveAttribute("data-filter-entry", "price");
    const maximum = dialog.getByRole("spinbutton", {
      name: isBg ? "Максимална цена" : "Maximum price",
      exact: true,
    });
    await expect(dialog.getByRole("spinbutton").first()).toBeFocused();
    await maximum.fill("100000");
    await page.keyboard.press("Escape");
    await expect(price).toBeFocused();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    await price.click();
    await expect(maximum).toHaveValue("150000");
    await dialog.locator('[data-slot="desktop-full-filter-reset"]').click();
    await apply.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("priceMax"))
      .toBeNull();
    const selected = new URL(page.url()).searchParams;
    // The URL serializer keeps the catalogue's default currency without a range.
    expect(selected.get("currency")).toBe("BGN");
    expect(selected.get("priceMin")).toBeNull();
    expect(selected.get("make")).toBe("BMW");
    expect(selected.get("model")).toBe("X5");
    expect(selected.get("fuel")).toBe("diesel");
    expect(selected.get("sort")).toBe("price_asc");
  });

  test(`inventory search box shares filters, cancels drafts and restores focus (${locale})`, async ({
    page,
  }) => {
    const isBg = locale === "bg";
    await page.goto(
      `/${locale}/cars?fuel=diesel&priceMax=150000&sort=price_asc`
    );
    const bar = page.locator('[data-slot="dealer-inventory-filters"]');
    const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
    const searchBox = hero.locator('[data-slot="dealer-inventory-search"]');
    await expect(searchBox).toBeVisible();
    await expect(
      bar.locator('[data-slot="dealer-inventory-search"]')
    ).toHaveCount(0);
    const heroBounds = await hero.boundingBox();
    const searchBounds = await searchBox.boundingBox();
    expect(
      heroBounds &&
        searchBounds &&
        searchBounds.y + searchBounds.height <= heroBounds.y + heroBounds.height
    ).toBeTruthy();
    await expect(
      searchBox.locator('[data-slot="dealer-inventory-search-field"]')
    ).toHaveCount(2);
    await expect(
      hero.getByRole("button", {
        name: isBg ? "Цена" : "Price",
        exact: true,
      })
    ).toContainText("150");
    const trigger = searchBox.locator(
      '[data-slot="dealer-inventory-search-open"]'
    );
    const originalUrl = page.url();
    await trigger.click();
    const dialog = page.locator('[data-slot="desktop-focused-filter-dialog"]');
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(
      dialog.locator(
        '[data-slot="desktop-full-filter-navigation"] [role="tab"]'
      )
    ).toHaveCount(0);
    await expect(dialog).toHaveAttribute("data-filter-entry", "search");
    const keyword = dialog.getByRole("searchbox");
    await expect(keyword).toBeFocused();
    await keyword.fill("X5");
    expect(page.url()).toBe(originalUrl);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(
      await trigger.evaluate((button) => {
        const style = getComputedStyle(button);
        return style.outlineStyle !== "none" || style.boxShadow !== "none";
      })
    ).toBe(true);
    await trigger.click();
    await expect(keyword).toHaveValue("");
    await keyword.fill("X5");
    await dialog
      .getByRole("button", {
        name: isBg ? "Покажи обявите" : "Show results",
        exact: true,
      })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBe("X5");
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    expect(new URL(page.url()).searchParams.get("fuel")).toBe("diesel");
    expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
    await bar
      .locator(
        '[data-slot="dealer-inventory-active-filter"][data-filter-id="q"]'
      )
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    expect(new URL(page.url()).searchParams.get("fuel")).toBe("diesel");
    const allFilters = page.locator(
      '[data-slot="dealer-desktop-inventory-hero"] [data-slot="desktop-primary-control"]'
    );
    await allFilters.click();
    const fullDialog = page.locator('[data-slot="desktop-full-filter-dialog"]');
    await expect(
      fullDialog.getByRole("tab", {
        name: isBg ? "Марка и модел" : "Make and model",
        exact: true,
      })
    ).toHaveAttribute("data-state", "active");
    await expect(
      fullDialog
        .locator('[data-slot="desktop-full-filter-navigation"]')
        .getByRole("tab")
    ).toHaveCount(5);
    await page.keyboard.press("Escape");
    await expect(allFilters).toBeFocused();
  });
}
