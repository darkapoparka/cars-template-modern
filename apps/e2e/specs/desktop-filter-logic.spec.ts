import { expect, type Page, test } from "@playwright/test";

const categoryNames = {
  bg: { bike: /^Мотоциклети/, truck: /^Камиони/, van: /^Бусове/ },
  en: { bike: /^Motorbikes/, truck: /^Trucks/, van: /^Vans/ },
};

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });
test.beforeEach(async ({ baseURL, context, page }) => {
  // biome-ignore lint/suspicious/noSkippedTests: Full filter columns are desktop only.
  test.skip((page.viewportSize()?.width ?? 0) < 1024, "Desktop filter logic");
  if (!baseURL) {
    throw new Error("Filter checks require a preview origin");
  }
  expect(
    (
      await context.request.post("/api/preferences", {
        headers: { origin: new URL(baseURL).origin },
        data: {
          action: "dismiss",
          locale: "bg",
          country: "BG",
          returnTo: "/cars",
        },
      })
    ).status()
  ).toBe(200);
});

async function openFilters(page: Page, locale: string, query: string) {
  await page.goto(`/${locale}/cars?${query}`);
  const trigger = page.locator(
    '[data-slot="dealer-inventory-summary"] [data-slot="desktop-primary-control"]'
  );
  await trigger.click();
  const dialog = page.locator('[data-slot="desktop-full-filter-dialog"]');
  await expect(dialog).toBeVisible();
  return { dialog, trigger };
}

for (const locale of ["bg", "en"] as const) {
  const isBg = locale === "bg";
  const applyLabel = isBg ? "Покажи обявите" : "Show results";

  test(`full filters keep independent make/model searches and cancel safely (${locale})`, async ({
    page,
  }) => {
    const { dialog, trigger } = await openFilters(
      page,
      locale,
      "fuel=diesel&priceMax=150000&sort=price_asc"
    );
    const initialUrl = page.url();
    const make = dialog.locator('[data-slot="desktop-filter-make-panel"]');
    const model = dialog.locator('[data-slot="desktop-filter-model-panel"]');
    await expect(dialog.getByRole("tab")).toHaveCount(5);
    await expect(
      dialog.locator('[data-slot="desktop-full-filter-navigation"]')
    ).not.toContainText(isBg ? "Автомобил" : "Vehicle filters");
    await expect(dialog.locator('[data-filter-section="search"]')).toHaveCount(
      0
    );
    await expect(
      model.locator('[data-slot="desktop-filter-model-prompt"]')
    ).toBeVisible();
    await make.getByRole("searchbox").fill("BMW");
    await make.getByRole("button", { name: "BMW", exact: true }).click();
    await expect(make.getByRole("searchbox")).toHaveValue("BMW");
    await model.getByRole("searchbox").fill("X5");
    await model.locator('[data-slot="model-option"]').click();
    await make.getByRole("searchbox").fill("no-such-make");
    await expect(make.getByRole("status")).toContainText(
      isBg ? "Няма съвпадения" : "No matches"
    );
    await make
      .getByRole("button", {
        name: isBg ? "Изчисти търсенето" : "Clear search",
        exact: true,
      })
      .click();
    await expect(model.getByRole("searchbox")).toHaveValue("X5");
    await expect(model.locator('[data-slot="model-option"]')).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await make.getByRole("searchbox").fill("Audi");
    await expect(model.getByRole("searchbox")).toHaveValue("X5");
    await make.getByRole("button", { name: "Audi", exact: true }).click();
    await expect(model.getByRole("searchbox")).toHaveValue("");
    await expect(
      model.getByRole("button", {
        name: isBg ? "Всички модели" : "All models",
        exact: true,
      })
    ).toHaveAttribute("aria-pressed", "true");
    expect(page.url()).toBe(initialUrl);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(
      model.locator('[data-slot="desktop-filter-model-prompt"]')
    ).toBeVisible();
    await expect(
      make.getByRole("button", {
        name: isBg ? "Всички марки" : "All makes",
        exact: true,
      })
    ).toHaveAttribute("aria-pressed", "true");
  });

  test(`vehicle type uses its own taxonomy, clears incompatible choices and resets as a draft (${locale})`, async ({
    page,
  }) => {
    const { dialog, trigger } = await openFilters(
      page,
      locale,
      "make=Audi&model=A3&derivative=Sportback&body=coupe&priceMax=150000&sort=price_asc"
    );
    const initialUrl = page.url();
    const typeTab = dialog.locator('[data-filter-group="category"]');
    const vehicleTab = dialog.locator('[data-filter-group="vehicle"]');
    await typeTab.click();
    for (const label of [
      categoryNames[locale].bike,
      categoryNames[locale].truck,
    ]) {
      await dialog.getByRole("button", { name: label }).click();
      await vehicleTab.click();
      await expect(
        dialog.getByText(
          isBg
            ? "Няма налични марки и модели за този вид превозно средство."
            : "No makes or models are available for this vehicle type.",
          { exact: true }
        )
      ).toBeVisible();
      await dialog
        .getByRole("button", {
          name: isBg ? "Изберете друг вид" : "Choose another type",
          exact: true,
        })
        .click();
      await expect(typeTab).toBeFocused();
      await expect(typeTab).toHaveAttribute("data-state", "active");
    }
    await dialog
      .getByRole("button", { name: categoryNames[locale].van })
      .click();
    await vehicleTab.click();
    const make = dialog.locator('[data-slot="desktop-filter-make-panel"]');
    const model = dialog.locator('[data-slot="desktop-filter-model-panel"]');
    await expect(
      model.locator('[data-slot="desktop-filter-model-prompt"]')
    ).toBeVisible();
    await expect(
      make.getByRole("button", { name: "Audi", exact: true })
    ).toHaveCount(0);
    await make
      .getByRole("button", { name: "Mercedes-Benz", exact: true })
      .click();
    await expect(model.locator('[data-slot="picker-option-meta"]')).toHaveCount(
      0
    );
    await model.getByRole("button", { name: "V-Class", exact: true }).click();
    expect(page.url()).toBe(initialUrl);
    await dialog.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${locale}/vans`);
    const selected = new URL(page.url()).searchParams;
    expect(selected.get("make")).toBe("Mercedes-Benz");
    expect(selected.get("model")).toBe("V-Class");
    expect(selected.get("derivative")).toBeNull();
    expect(selected.get("body")).toBeNull();
    expect(selected.get("priceMax")).toBe("150000");
    expect(selected.get("sort")).toBe("price_asc");
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    await trigger.click();
    await dialog.locator('[data-slot="desktop-full-filter-reset"]').click();
    await expect(
      dialog.locator('[data-slot="desktop-filter-model-prompt"]')
    ).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(`/${locale}/vans`);
    await dialog.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${locale}/cars`);
    expect(new URL(page.url()).searchParams.get("make")).toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBeNull();
    expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
    await page.goBack();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toBe(`/${locale}/vans`);
    expect(new URL(page.url()).searchParams.get("model")).toBe("V-Class");
  });

  test(`extra options share the draft and numeric edits survive keyboard group changes (${locale})`, async ({
    page,
  }) => {
    const { dialog } = await openFilters(
      page,
      locale,
      "make=BMW&model=X5&priceMax=150000&sort=price_asc"
    );
    const initialUrl = page.url();
    const model = dialog.locator('[data-slot="desktop-filter-model-panel"]');
    await expect(
      model.locator('[data-slot="picker-option-meta"]').first()
    ).toBeVisible();
    const more = dialog.locator('[data-filter-group="location"]');
    await more.click();
    await expect(
      dialog.locator('[data-filter-section="category"]')
    ).toHaveCount(0);
    await dialog
      .locator('[data-filter-section="search"]')
      .getByRole("searchbox")
      .fill("X5");
    await dialog
      .locator('[data-filter-section="origin"]')
      .getByRole("button", { name: isBg ? "Германия" : "Germany", exact: true })
      .click();
    await dialog
      .locator('[data-filter-section="deliver-to"]')
      .getByRole("button", {
        name: isBg ? "България" : "Bulgaria",
        exact: true,
      })
      .click();
    await dialog
      .locator('[data-filter-section="seller"]')
      .getByRole("button", { name: isBg ? "Дилър" : "Dealer", exact: true })
      .click();
    const price = dialog.locator('[data-filter-group="budget"]');
    await price.click();
    const maximum = dialog.getByRole("spinbutton", {
      name: isBg ? "Максимална цена" : "Maximum price",
      exact: true,
    });
    await maximum.fill("100000");
    await maximum.press("Tab");
    await price.focus();
    await price.press("ArrowRight");
    await expect(
      dialog.locator('[data-filter-group="details"]')
    ).toHaveAttribute("data-state", "active");
    await price.click();
    await expect(maximum).toHaveValue("100000");
    await dialog.locator('[data-filter-group="vehicle"]').click();
    await expect(model.locator('[data-slot="picker-option-meta"]')).toHaveCount(
      0
    );
    await more.click();
    await expect(
      dialog.locator('[data-filter-section="search"]').getByRole("searchbox")
    ).toHaveValue("X5");
    expect(page.url()).toBe(initialUrl);
    await dialog.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBe("X5");
    const selected = new URL(page.url()).searchParams;
    for (const [key, value] of Object.entries({
      make: "BMW",
      model: "X5",
      origin: "DE",
      deliverTo: "BG",
      seller: "dealer",
      priceMax: "100000",
      sort: "price_asc",
    })) {
      expect(selected.get(key)).toBe(value);
    }
  });

  test(`parallel model choices preserve and clear dependent body variants (${locale})`, async ({
    page,
  }) => {
    const { dialog, trigger } = await openFilters(
      page,
      locale,
      "make=Audi&model=A3&derivative=Sportback&priceMax=150000"
    );
    const model = dialog.locator('[data-slot="desktop-filter-model-panel"]');
    await expect(
      model.locator(
        '[data-slot="accordion-content"] button[aria-pressed="true"]'
      )
    ).toContainText("Sportback");
    await model.getByRole("searchbox").fill("A5");
    await model.locator('[data-slot="model-option"]').click();
    await expect(
      model.locator(
        '[data-slot="accordion-content"] button[aria-pressed="true"]'
      )
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("model"))
      .toBe("A5");
    expect(new URL(page.url()).searchParams.get("derivative")).toBeNull();
    await trigger.click();
    await dialog
      .getByRole("button", {
        name: isBg ? "Изчисти Модел" : "Clear Model",
        exact: true,
      })
      .click();
    await expect(
      model.getByRole("button", {
        name: isBg ? "Всички модели" : "All models",
        exact: true,
      })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(model.locator('[data-slot="accordion"]')).toHaveCount(0);
    await dialog
      .getByRole("button", {
        name: isBg ? "Изчисти Марка" : "Clear Make",
        exact: true,
      })
      .click();
    await expect(
      model.locator('[data-slot="desktop-filter-model-prompt"]')
    ).toBeVisible();
    await dialog.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBeNull();
    expect(new URL(page.url()).searchParams.get("model")).toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
  });
}
