import { expect, test } from "@playwright/test";
import { getInventoryLayoutCookieName } from "@repo/marketplace/inventory-presentation";
import { publicSite } from "@repo/marketplace/site-config";
import {
  selectInventoryFilterLayout,
  selectInventoryViewMode,
} from "../fixtures/inventory-preview";

const layoutCookie = getInventoryLayoutCookieName(publicSite.identity.slug);
const stageLabels = {
  bg: { make: /^Марка/, model: /^Модел/, body: /^Каросерия/ },
  en: { make: /^Make/, model: /^Model/, body: /^Body style/ },
};
const sportbackLabel = /Sportback/;

test.use({ actionTimeout: 10_000 });

test.beforeEach(async ({ page, context, baseURL }) => {
  // biome-ignore lint/suspicious/noSkippedTests: The desktop-only control is intentionally excluded from mobile viewport projects.
  test.skip(
    (page.viewportSize()?.width ?? 0) < 1024,
    "Inventory layout selection is a desktop control"
  );
  if (!baseURL) {
    throw new Error("Inventory layout checks require a public preview baseURL");
  }
  const response = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: {
      action: "dismiss",
      locale: "bg",
      country: "BG",
      returnTo: "/cars",
    },
  });
  expect(response.status()).toBe(200);
});

for (const locale of ["bg", "en"] as const) {
  const isBg = locale === "bg";
  const applyLabel = isBg ? "Покажи обявите" : "Show results";

  test(`desktop search keeps one control surface and cancels make/model drafts (${locale})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`/${locale}/cars?priceMax=150000`);
    const bar = page.locator('[data-slot="dealer-inventory-filters"]');
    const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
    const summary = bar.locator('[data-slot="dealer-inventory-summary"]');
    await expect(summary).toBeVisible();
    await expect(summary.getByRole("combobox")).toHaveCount(1);
    await expect(
      bar.locator('[data-slot="dealer-inventory-preview"]')
    ).toBeVisible();
    await expect(
      hero.locator('[data-slot="dealer-inventory-search"]')
    ).toBeVisible();
    const originalUrl = page.url();
    const trigger = hero.getByRole("button", {
      name: isBg ? "Марка" : "Make",
      exact: true,
    });
    await trigger.click();
    const dialog = page.locator('[data-slot="desktop-focused-filter-dialog"]');
    const modelTab = dialog.getByRole("tab", {
      name: stageLabels[locale].model,
    });
    await expect(modelTab).toBeDisabled();
    const search = dialog.getByRole("searchbox");
    await search.fill("no-such-car-make");
    await expect(dialog.getByRole("status")).toContainText(
      isBg ? "Няма съвпадения" : "No matches"
    );
    await dialog
      .getByRole("button", {
        name: isBg ? "Изчисти търсенето" : "Clear search",
        exact: true,
      })
      .click();
    await expect(search).toHaveValue("");
    await dialog.getByRole("button", { name: "BMW", exact: true }).click();
    await expect(modelTab).toHaveAttribute("data-state", "active");
    await search.fill("X5");
    await expect(dialog.locator('[data-slot="model-option"]')).toHaveCount(1);
    await dialog.locator('[data-slot="model-option"]').click();
    const makeTab = dialog.getByRole("tab", {
      name: stageLabels[locale].make,
    });
    await makeTab.click();
    await expect(makeTab).toContainText("BMW");
    await dialog.getByRole("button", { name: "BMW", exact: true }).click();
    await expect(modelTab).toContainText("X5");
    expect(page.url()).toBe(originalUrl);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(page.url()).toBe(originalUrl);
    await trigger.click();
    await expect(modelTab).toBeDisabled();
    await dialog.getByRole("button", { name: "BMW", exact: true }).click();
    await search.fill("X5");
    await dialog.locator('[data-slot="model-option"]').click();
    await dialog
      .getByRole("button", {
        name: isBg ? "Покажи обявите" : "Show results",
        exact: true,
      })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("model"))
      .toBe("X5");
    expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
  });

  test(`desktop make/model rail supports keyboard stages and resets dependent selections (${locale})`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/cars?priceMax=150000`);
    await page
      .locator('[data-slot="dealer-desktop-inventory-hero"]')
      .getByRole("button", { name: isBg ? "Марка" : "Make", exact: true })
      .click();
    const dialog = page.locator('[data-slot="desktop-focused-filter-dialog"]');
    await dialog.getByRole("button", { name: "Audi", exact: true }).click();
    const makeTab = dialog.getByRole("tab", {
      name: stageLabels[locale].make,
    });
    const modelTab = dialog.getByRole("tab", {
      name: stageLabels[locale].model,
    });
    await makeTab.click();
    await page.keyboard.press("ArrowRight");
    await expect(modelTab).toBeFocused();
    await expect(modelTab).toHaveAttribute("data-state", "active");
    const search = dialog.getByRole("searchbox");
    await search.fill("no-such-car-model");
    await expect(dialog.getByRole("status")).toContainText(
      isBg ? "Няма съвпадения" : "No matches"
    );
    await dialog
      .getByRole("button", {
        name: isBg ? "Изчисти търсенето" : "Clear search",
        exact: true,
      })
      .click();
    await search.fill("A3");
    await dialog.locator('[data-slot="model-option"]').click();
    const bodyTab = dialog.getByRole("tab", {
      name: stageLabels[locale].body,
    });
    await expect(bodyTab).toHaveAttribute("data-state", "active");
    await bodyTab.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(modelTab).toBeFocused();
    await expect(modelTab).toHaveAttribute("data-state", "active");
    await expect(search).toHaveValue("");
    await page.keyboard.press("ArrowRight");
    await expect(bodyTab).toBeFocused();
    await expect(bodyTab).toHaveAttribute("data-state", "active");
    await dialog.getByRole("button", { name: sportbackLabel }).click();
    await expect(bodyTab).toContainText("Sportback");
    await makeTab.click();
    await dialog.getByRole("button", { name: "BMW", exact: true }).click();
    await expect(bodyTab).toHaveCount(0);
    await expect(modelTab).toContainText(isBg ? "Всички" : "Any");
    await dialog
      .getByRole("button", {
        name: isBg ? "Покажи обявите" : "Show results",
        exact: true,
      })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBe("BMW");
    expect(new URL(page.url()).searchParams.get("model")).toBeNull();
    expect(new URL(page.url()).searchParams.get("derivative")).toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
  });

  test(`desktop unified filters keep one draft across vehicle and all options (${locale})`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/cars?sort=price_asc`);
    const original = page.url();
    const makeTrigger = page.locator(
      '[data-slot="dealer-inventory-summary"] [data-slot="desktop-primary-control"]'
    );
    const dialog = page.locator('[data-slot="desktop-full-filter-dialog"]');
    const navigation = dialog.locator(
      '[data-slot="desktop-full-filter-navigation"]'
    );
    const priceTab = navigation.getByRole("tab", {
      name: isBg ? "Цена и година" : "Price and year",
      exact: true,
    });
    const fuelTab = navigation.getByRole("tab", {
      name: isBg ? "Характеристики" : "Specifications",
      exact: true,
    });
    const transmissionTab = navigation.getByRole("tab", {
      name: isBg ? "Характеристики" : "Specifications",
      exact: true,
    });
    const vehicleTab = navigation.getByRole("tab", {
      name: isBg ? "Марка и модел" : "Make and model",
      exact: true,
    });
    const maximum = dialog.getByRole("spinbutton", {
      name: isBg ? "Максимална цена" : "Maximum price",
      exact: true,
    });
    const apply = dialog.getByRole("button", { name: applyLabel, exact: true });
    for (const commit of [false, true]) {
      await makeTrigger.click();
      await expect(navigation.getByRole("tab")).toHaveCount(5);
      await expect(
        dialog.getByRole("button", {
          name: isBg ? "Всички марки" : "All makes",
          exact: true,
        })
      ).toHaveAttribute("aria-pressed", "true");
      await dialog.getByRole("button", { name: "BMW", exact: true }).click();
      await dialog
        .locator('[data-slot="desktop-filter-model-panel"]')
        .getByRole("searchbox")
        .fill("X5");
      await dialog.locator('[data-slot="model-option"]').click();
      await priceTab.click();
      await maximum.fill("150000");
      if (commit) {
        await maximum.press("Tab");
      }
      await fuelTab.click();
      await priceTab.click();
      await expect(maximum).toHaveValue("150000");
      await fuelTab.click();
      await dialog
        .getByRole("button", { name: isBg ? "Дизел" : "Diesel", exact: true })
        .click();
      await transmissionTab.click();
      await dialog
        .getByRole("button", {
          name: isBg ? "Автоматик" : "Automatic",
          exact: true,
        })
        .click();
      await vehicleTab.click();
      await expect(
        dialog
          .locator(
            '[data-slot="desktop-filter-model-panel"] [data-slot="model-option"]'
          )
          .filter({ hasText: "X5" })
      ).toHaveAttribute("aria-pressed", "true");
      expect(page.url()).toBe(original);
      if (commit) {
        await apply.click();
      } else {
        await page.keyboard.press("Escape");
        await expect(makeTrigger).toBeFocused();
      }
    }
    await expect
      .poll(() => new URL(page.url()).searchParams.get("model"))
      .toBe("X5");
    const selected = new URL(page.url()).searchParams;
    expect(selected.get("make")).toBe("BMW");
    expect(selected.get("priceMax")).toBe("150000");
    expect(selected.get("fuel")).toBe("diesel");
    expect(selected.get("transmission")).toBe("automatic");
    expect(selected.get("sort")).toBe("price_asc");
    await makeTrigger.click();
    await fuelTab.click();
    await dialog
      .getByRole("button", {
        name: isBg ? "Изчисти Гориво" : "Clear Fuel type",
        exact: true,
      })
      .click();
    await apply.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("fuel"))
      .toBeNull();
    expect(new URL(page.url()).searchParams.get("model")).toBe("X5");
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    await makeTrigger.click();
    await dialog.locator('[data-slot="desktop-full-filter-reset"]').click();
    await expect(dialog).toBeVisible();
    await apply.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBeNull();
    expect(new URL(page.url()).searchParams.get("transmission")).toBeNull();
    expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
  });

  test(`desktop inventory layout preserves results, sorting and sidebar drafts (${locale})`, async ({
    page,
    context,
  }) => {
    await page.goto(
      `/${locale}/cars?fuel=diesel&priceMax=150000&sort=price_asc`
    );
    const bar = page.locator('[data-slot="dealer-inventory-filters"]');
    const summary = page.locator('[data-slot="dealer-inventory-summary"]');
    const grid = page.locator('[data-slot="marketplace-listing-grid"]');
    const sidebar = page.locator('[data-slot="dealer-inventory-sidebar"]');
    await expect(bar).toHaveAttribute("data-filter-layout", "quick");
    await expect(sidebar).toBeHidden();
    const initialUrl = page.url();
    const initialCount = await summary
      .locator('[data-slot="dealer-inventory-count"]')
      .textContent();
    const initialVehicles = await grid.locator("article").allTextContents();
    await selectInventoryViewMode(page, "list", locale);
    await expect(grid).toHaveAttribute("data-view", "list");
    await selectInventoryFilterLayout(page, "sidebar", locale);
    await expect(sidebar).toBeVisible();
    await expect(bar).toHaveAttribute("data-filter-layout", "sidebar");
    expect(page.url()).toBe(initialUrl);
    expect(await grid.locator("article").allTextContents()).toEqual(
      initialVehicles
    );
    await expect(
      summary.locator('[data-slot="dealer-inventory-count"]')
    ).toHaveText(initialCount ?? "");
    const keyword = sidebar.locator('[data-slot="desktop-search-query"] input');
    await keyword.fill("X5");
    await page.keyboard.press("Escape");
    await selectInventoryFilterLayout(page, "quick", locale);
    await expect(sidebar).toBeHidden();
    await expect(grid).toHaveAttribute("data-view", "list");
    await selectInventoryFilterLayout(page, "sidebar", locale);
    await expect(keyword).toHaveValue("X5");
    expect(page.url()).toBe(initialUrl);
    await expect
      .poll(
        async () =>
          (await context.cookies()).find(
            (cookie) => cookie.name === layoutCookie
          )?.value
      )
      .toBe("sidebar");
    const response = await page.reload();
    expect(await response?.text()).toContain('data-filter-layout="sidebar"');
    await expect(bar).toHaveAttribute("data-filter-layout", "sidebar");
    await expect(sidebar).toBeVisible();
    await expect(grid).toHaveAttribute("data-view", "list");
    expect(page.url()).toBe(initialUrl);
  });

  test(`desktop quick filters share URL state and accessible dialogs (${locale})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto(`/${locale}/cars`);
    const bar = page.locator('[data-slot="dealer-inventory-filters"]');
    const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
    const price = hero.getByRole("button", {
      name: isBg ? "Цена" : "Price",
      exact: true,
    });
    await price.click();
    const range = page.locator('[data-slot="desktop-focused-filter-dialog"]');
    await range
      .getByRole("spinbutton", {
        name: isBg ? "Максимална цена" : "Maximum price",
        exact: true,
      })
      .fill("150000");
    await range.getByRole("button", { name: applyLabel, exact: true }).click();
    await expect(range).toBeHidden();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("priceMax"))
      .toBe("150000");
    await hero
      .getByRole("button", { name: isBg ? "Марка" : "Make", exact: true })
      .click();
    const makeDialog = page.getByRole("dialog");
    await makeDialog.getByRole("button", { name: "BMW", exact: true }).click();
    await makeDialog
      .getByRole("button", {
        name: isBg ? "Покажи обявите" : "Show results",
        exact: true,
      })
      .click();
    await expect(makeDialog).toBeHidden();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBe("BMW");
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    await selectInventoryFilterLayout(page, "sidebar", locale);
    const sidebar = page.locator('[data-slot="dealer-inventory-sidebar"]');
    await expect(
      sidebar.locator('[data-slot="desktop-hero-make"]')
    ).toContainText("BMW");
    await selectInventoryFilterLayout(page, "quick", locale);
    const allFilters = hero.locator('[data-slot="desktop-primary-control"]');
    await allFilters.click();
    const fullDialog = page.locator('[data-slot="desktop-full-filter-dialog"]');
    await expect(fullDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(fullDialog).toBeHidden();
    await expect(allFilters).toBeFocused();
    await bar.locator('[data-slot="desktop-clear-all-filters"]').click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBeNull();
    expect(new URL(page.url()).searchParams.get("priceMax")).toBeNull();
    await page.goto(`/${locale}/cars?q=BMW&fuel=diesel&mileageMax=200000`);
    await expect(
      bar.locator('[data-slot="dealer-inventory-active-filter"]')
    ).toHaveCount(3);
    for (const pill of await bar
      .locator('[data-slot="dealer-inventory-active-filter"]')
      .all()) {
      await expect(pill).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  });
}

test("desktop inventory ignores invalid presentation preferences", async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Inventory layout checks require a public preview baseURL");
  }
  await context.addCookies([
    { name: layoutCookie, value: "invalid", url: baseURL },
  ]);
  const response = await page.goto("/en/cars");
  expect(await response?.text()).toContain('data-filter-layout="quick"');
  await expect(
    page.locator('[data-slot="dealer-inventory-filters"]')
  ).toHaveAttribute("data-filter-layout", "quick");
});

test("desktop inventory remains usable when preference storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "cookieStore", {
      configurable: true,
      value: {
        set: () => Promise.reject(new Error("Preference storage blocked")),
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en/cars");
  await selectInventoryFilterLayout(page, "sidebar");
  await expect(
    page.locator('[data-slot="dealer-inventory-sidebar"]')
  ).toBeVisible();
  await selectInventoryFilterLayout(page, "quick");
  await expect(
    page.locator('[data-slot="dealer-inventory-sidebar"]')
  ).toBeHidden();
  await page
    .locator('[data-slot="dealer-desktop-inventory-hero"]')
    .getByRole("button", { name: "Price", exact: true })
    .click();
  await expect(
    page.locator('[data-slot="desktop-focused-filter-dialog"]')
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(errors).toEqual([]);
});
