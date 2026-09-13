import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const mapEmbedPattern = /google\.com\/maps/;
const contactHandoffPattern = /\/contact\?/;
const manualEntryPattern = /Без VIN/;
const sellRoutePattern = /\/sell$/;
const listingTopicPattern = /topic=listings/;
const importTopicPattern = /topic=import/;
const bmwX5FilterPattern = /make=BMW.*model=X5/;
const makeFilterPattern = /make=/;

const listing = "/listing/bmw-x5-m50d-sofia-2020";
const syntheticVin = "WBA12345678901234";
const sizes = [
  { width: 320, height: 700 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
];
const expectNoOverflow = async (page: Page) => {
  const geometry = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
};
const expectAccessible = async (page: Page) => {
  await expect(page.locator("main").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical"
    )
  ).toEqual([]);
};

test.beforeEach(async ({ page }) => {
  // These browser tests must never submit a customer enquiry or call a provider.
  await page.route("**/*", (route) => {
    const method = route.request().method();
    return ["GET", "HEAD", "OPTIONS"].includes(method)
      ? route.continue()
      : route.abort("blockedbyclient");
  });
});

for (const size of sizes) {
  test(`listing map and related rail stay within ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto(listing);
    await expect(
      page.getByRole("tab", { name: "Детайли", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expectNoOverflow(page);
    await page.getByRole("tab", { name: "Описание", exact: true }).click();
    await expect(
      page.getByRole("tabpanel", { name: "Описание", exact: true })
    ).toBeVisible();
    await expectNoOverflow(page);
    await page.getByRole("tab", { name: "Детайли", exact: true }).click();
    await expectNoOverflow(page);
    const map = page.locator('[data-slot="listing-location"]');
    await map.scrollIntoViewIfNeeded();
    await expect(map.locator("iframe")).toHaveAttribute("src", mapEmbedPattern);
    await expectNoOverflow(page);
    await expect(
      page.getByRole("link", { name: "Обадете се", exact: true })
    ).toBeVisible();
  });
}
test("VIN-only continuation, edit and reload preserve the VIN", async ({
  page,
}) => {
  await page.goto("/sell");
  await page
    .getByRole("button", { name: "Въведете VIN номер", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="vin"]').fill(syntheticVin);
  await dialog.getByRole("button", { name: "Преглед преди обаждане" }).click();
  await expect(page).toHaveURL(contactHandoffPattern);
  await expect(
    page.locator('[data-slot="sell-selected-vehicle"]')
  ).toContainText(syntheticVin);
  await page
    .getByRole("link", { name: "Редактирайте данните", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator('input[name="vin"]')
  ).toHaveValue(syntheticVin);
  await page.reload();
  await expect(
    page.getByRole("dialog").locator('input[name="vin"]')
  ).toHaveValue(syntheticVin);
});

test("manual draft preserves values, notes, cancel state and explicit reset", async ({
  page,
}) => {
  await page.goto(
    "/sell?category=car&make=BMW&model=X5&year=2020&mileage=80000&notes=Mobile%20audit"
  );
  let dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[name="year"]')).toHaveValue("2020");
  await expect(dialog.locator('input[name="mileage"]')).toHaveValue("80000");
  await expect(dialog.locator('textarea[name="notes"]')).toHaveValue(
    "Mobile audit"
  );
  await dialog.locator('textarea[name="notes"]').fill("Retained audit note");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: manualEntryPattern }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('textarea[name="notes"]')).toHaveValue(
    "Retained audit note"
  );
  await dialog.getByRole("button", { name: "Преглед преди обаждане" }).click();
  await expect(page).toHaveURL(contactHandoffPattern);
  await expect(
    page.locator('[data-slot="sell-contact-handoff"]')
  ).toContainText("Retained audit note");
  await page
    .getByRole("link", { name: "Редактирайте данните", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator('input[name="year"]')
  ).toHaveValue("2020");
  await page
    .getByRole("button", { name: "Изчисти въведените данни", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Изчисти данните", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator('input[name="year"]')
  ).toHaveValue("");
  await expect(
    page.getByRole("dialog").locator('textarea[name="notes"]')
  ).toHaveValue("");
});
test("partial VIN and empty manual details cannot continue", async ({
  page,
}) => {
  await page.goto("/sell");
  await page
    .getByRole("button", { name: "Въведете VIN номер", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="vin"]').fill("SHORT");
  await dialog.getByRole("button", { name: "Преглед преди обаждане" }).click();
  expect(
    await dialog
      .locator('input[name="vin"]')
      .evaluate((input: HTMLInputElement) => input.validity.patternMismatch)
  ).toBe(true);
  await expect(page).toHaveURL(sellRoutePattern);
  await dialog.locator('input[name="vin"]').fill("");
  await dialog.getByRole("button", { name: "Преглед преди обаждане" }).click();
  expect(
    await dialog
      .locator('input[name="year"]')
      .evaluate((input: HTMLInputElement) => input.validity.valueMissing)
  ).toBe(true);
});

test("landscape content filters reach the last option and restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/guides");
  const trigger = page.getByRole("button", {
    name: "Филтрирай материалите",
    exact: true,
  });
  await trigger.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Обяви", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(listingTopicPattern);
  await expect(
    page.getByRole("heading", { name: "Как да оцените дилърска обява" })
  ).toBeVisible();
  await trigger.click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Затвори", exact: true })
    .click();
  await expect(trigger).toBeFocused();
  await expectNoOverflow(page);
});

test("article back returns to the searched category", async ({ page }) => {
  await page.goto("/guides?topic=import&q=Внос");
  await expect(page.getByRole("searchbox")).toHaveValue("Внос");
  await page.locator('a[href*="/guides/import-costs-and-timing"]').click();
  await page.getByRole("link", { name: "Всички материали" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("Внос");
  await expect(page).toHaveURL(importTopicPattern);
  await page.getByRole("searchbox").fill("no matching article");
  await expect(page.getByText("Няма материали с тези критерии")).toBeVisible();
  await page.getByRole("button", { name: "Изчисти търсенето" }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
});
for (const route of [
  "/sell",
  "/guides",
  "/guides/premium-used-car-checklist",
  "/guides/import-costs-and-timing",
  "/guides/financing-offer-questions",
  "/guides/buying-used-car-bulgaria",
  "/guides/ev-hybrid-ownership-checklist",
  "/guides/dealer-listing-transparency",
]) {
  test(`${route} has no serious automated accessibility violations`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeAttached();
    await expectAccessible(page);
  });
}

test("error and legal routes keep mobile dealership navigation", async ({
  page,
}) => {
  for (const route of [
    "/unknown-modern-route",
    "/legal/privacy",
    "/legal/terms",
  ]) {
    await page.goto(route);
    await expect(
      page.locator('[data-slot="mobile-dealer-brand-row"]')
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Навигация на автокъщата" })
    ).toBeVisible();
    await expectNoOverflow(page);
  }
});

test("filter apply, refresh, cancel and reset use the same URL state", async ({
  page,
}) => {
  await page.goto("/cars");
  const trigger = page.getByRole("button", {
    name: "Отвори филтрите",
    exact: true,
  });
  await trigger.click();
  await page
    .getByRole("button", { name: "Марка и модел, Всички марки" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "BMW", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "X5", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Покажи обявите", exact: true })
    .click();
  await expect(page).toHaveURL(bmwX5FilterPattern);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Марка и модел: BMW X5", exact: true })
  ).toBeVisible();
  const before = page.url();
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(page.url()).toBe(before);
  await trigger.click();
  await page.getByRole("button", { name: "Нулирай", exact: true }).click();
  await page
    .getByRole("button", { name: "Покажи обявите", exact: true })
    .click();
  await expect(page).not.toHaveURL(makeFilterPattern);
});

test("leasing selection survives reopening with an honest phone handoff", async ({
  page,
}) => {
  await page.goto("/lease");
  await page.locator('button[aria-label^="Изберете BMW X5 M50d,"]').click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("vehicle"))
    .toBeTruthy();
  const selectionUrl = page.url();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Премахнете избора" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Поискайте оферта" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.locator('[data-slot="public-contact-unavailable"]')
  ).toBeVisible();
  await expect(dialog.locator('input[name="name"]')).toHaveCount(0);
  await expect(dialog.locator('a[href^="tel:"]')).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page.getByRole("link", { name: "Поискайте оферта" }).click();
  await expect(
    dialog.locator('[data-slot="public-contact-unavailable"]')
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(page.url()).toBe(selectionUrl);
  await page.getByRole("button", { name: "Премахнете избора" }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("vehicle"))
    .toBe(false);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Изберете автомобил", exact: true })
  ).toBeVisible();
});

test("import request preserves the draft and its nested country picker", async ({
  page,
}) => {
  await page.goto("/imports");
  await page
    .getByRole("button", { name: "Опишете автомобил", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog.locator('input[name="budget"]').fill("30000 EUR");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await page
    .getByRole("button", { name: "Опишете автомобил", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator('input[name="budget"]')).toHaveValue("30000 EUR");
  await dialog
    .getByRole("button", {
      name: "Държава на произход: Изберете държава",
      exact: true,
    })
    .click();
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Германия", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").locator('input[name="budget"]')
  ).toHaveValue("30000 EUR");
  await expect(
    page.getByRole("button", {
      name: "Държава на произход: Германия",
      exact: true,
    })
  ).toBeVisible();
});

test("menu and gallery dismiss with focus return, and listing back restores discovery", async ({
  page,
}) => {
  await page.goto("/cars");
  const menu = page.getByRole("button", { name: "Меню", exact: true });
  await menu.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(menu).toBeFocused();
  await page
    .getByRole("link", { name: "Виж 2020 BMW X5 M50d", exact: true })
    .click();
  const gallery = page.getByRole("button", {
    name: "Отвори снимка 1 от 1 на цял екран",
    exact: true,
  });
  await gallery.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(gallery).toBeFocused();
  await page
    .getByRole("link", { name: "Назад към търсенето", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Отвори филтрите", exact: true })
  ).toBeVisible();
});

for (const route of ["/cars", "/imports", "/lease", "/contact"]) {
  test(`${route} primary mobile composition passes automated accessibility`, async ({
    page,
  }) => {
    await page.goto(route);
    await expectAccessible(page);
  });
}

test("numeric quick filter applies typed input and resets empty results", async ({
  page,
}) => {
  await page.goto("/cars");
  await page.getByRole("button", { name: "Цена", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const maximum = dialog.locator('input[type="number"]').last();
  await maximum.fill("60000");
  await maximum.blur();
  await dialog.getByRole("button", { name: "Приложи", exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("priceMax"))
    .toBe("60000");
  await expect(
    page.getByRole("heading", { name: "Няма намерени обяви", exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Няма намерени обяви", exact: true })
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Изчисти филтрите", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("priceMax"))
    .toBe(false);
  await expect(
    page.getByRole("link", { name: "Виж 2020 BMW X5 M50d", exact: true })
  ).toBeVisible();
});
