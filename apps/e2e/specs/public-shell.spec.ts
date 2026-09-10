import { expect, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const categoryTriggerPattern = /категория/i;
const clearFilterPattern = /^Премахни филтъра/;
const truckCategoryPattern = /^Камиони/;
const mobileSearchTriggerPattern = /Търси \d+ автомобил/;

test("mobile import separates field clear from overlay close", async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/bg/imports", { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", {
    name: "Отворете полето за линк към обява",
  });
  await expect(trigger).toBeVisible();
  await page.waitForTimeout(500);
  await trigger.click();

  const overlay = page.locator('[data-slot="mobile-import-source-search"]');
  await expect(overlay).toBeVisible();
  const input = overlay.locator('input[name="sourceUrl"]');
  await input.fill("https://example.com/cars/bmw-x5");
  const clear = overlay.getByRole("button", { name: "Изчистете линка" });
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(input).toHaveValue("");
  await expect(overlay).toBeVisible();

  await overlay
    .getByRole("button", { name: "Затворете търсенето" })
    .click();
  await expect(overlay).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile shell stays contained at required viewport widths", async ({
  page,
}) => {
  const viewports = [
    { height: 844, width: 320 },
    { height: 844, width: 360 },
    { height: 844, width: 390 },
    { height: 844, width: 430 },
    { height: 390, width: 844 },
  ] as const;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto("/bg", { waitUntil: "domcontentloaded" });

    const widths = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(
      widths.document,
      `document overflow at ${viewport.width}px`
    ).toBeLessThanOrEqual(widths.viewport);
    expect(
      widths.body,
      `body overflow at ${viewport.width}px`
    ).toBeLessThanOrEqual(widths.viewport);

    const searchTrigger = page
      .getByRole("button", { name: mobileSearchTriggerPattern })
      .first();
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();
    const searchDialog = page.getByRole("dialog");
    await expect(searchDialog).toBeVisible();
    await expect(
      searchDialog.getByRole("button", { exact: true, name: "Затвори" })
    ).toBeVisible();
    await searchDialog
      .getByRole("button", { exact: true, name: "Затвори" })
      .click();
    await expect(searchDialog).toBeHidden();

    const filterTrigger = page.getByRole("button", {
      name: "Отвори филтрите",
    });
    await expect(filterTrigger).toBeVisible();
    await filterTrigger.click();
    const filterDialog = page.getByRole("dialog");
    await expect(filterDialog).toBeVisible();
    await expect(
      filterDialog.getByRole("button", { exact: true, name: "Затвори" })
    ).toBeVisible();
    await filterDialog
      .getByRole("button", { exact: true, name: "Затвори" })
      .click();
    await expect(filterDialog).toBeHidden();
  }

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/bg/sell", { waitUntil: "domcontentloaded" });
  await expect(page.locator('input[name="vin"]')).toHaveCSS(
    "font-size",
    "16px"
  );
});

test("public marketplace shell searches and opens structured filters", async ({
  page,
}, testInfo) => {
  const errors = collectPublicPageErrors(page);
  const response = await page.goto("/bg", { waitUntil: "domcontentloaded" });

  expect(response?.status()).toBe(200);
  const declineAnalytics = page.getByRole("button", {
    exact: true,
    name: "Отказ",
  });
  if (await declineAnalytics.isVisible()) {
    await expect(async () => {
      if (await declineAnalytics.isVisible()) {
        await declineAnalytics.click();
      }
      await expect(declineAnalytics).toBeHidden({ timeout: 2000 });
    }).toPass({ timeout: 15_000 });
  }

  const isMobile = testInfo.project.name.includes("mobile");
  const search = isMobile
    ? page.getByRole("searchbox", { name: "Търси автомобили" })
    : page.getByRole("combobox", { name: "Търсене на автомобили" });
  if (isMobile) {
    const searchDialog = page.getByRole("dialog");
    await expect(async () => {
      if (!(await searchDialog.isVisible())) {
        await page
          .getByRole("button", { name: mobileSearchTriggerPattern })
          .first()
          .click();
      }
      await expect(searchDialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15_000 });
    await expect(search).toBeVisible();
    await expect(search).not.toBeFocused();
    await expect(
      searchDialog.getByRole("button", { exact: true, name: "Затвори" })
    ).toBeVisible();
    await expect(
      searchDialog.getByRole("button", { exact: true, name: "BMW" })
    ).toBeVisible();
    await search.click();
  } else {
    await expect(search).toBeVisible();
    const searchAssistant = page.getByRole("listbox", {
      name: "Предложения за търсене",
    });
    await expect(async () => {
      if (!(await searchAssistant.isVisible())) {
        await search.focus();
      }
      await expect(searchAssistant).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15_000 });
    await expect(searchAssistant).toContainText("BMW X5");
    await search.fill("BMW");
    await expect(searchAssistant).toContainText("Търси „BMW“");
    await search.press("Escape");
    await expect(searchAssistant).toBeHidden();
  }
  const appliedQuery = isMobile ? "bmw" : "BMW";
  await search.fill(appliedQuery);
  if (isMobile) {
    await expect(
      page
        .getByRole("dialog")
        .getByRole("button", { exact: true, name: "BMW X5" })
    ).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: `Търси „${appliedQuery}“` })
      .click();
  } else {
    await search.press("Enter");
  }
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe(appliedQuery);
  await expect(page.locator('a[href*="/listing/"]').first()).toBeVisible();

  if (isMobile) {
    const appliedSearchPill = page.getByRole("button", {
      name: "Премахни филтъра BMW",
    });
    await expect(appliedSearchPill).toHaveAttribute("aria-pressed", "true");
    await appliedSearchPill.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("q"))
      .toBeNull();
    await expect(appliedSearchPill).toBeHidden();

    await page.goto("/?priceMax=100000", { waitUntil: "domcontentloaded" });
    const activeConditionPill = page.getByRole("button", {
      name: clearFilterPattern,
    });
    await expect(activeConditionPill).toHaveAttribute("aria-pressed", "true");
    await activeConditionPill.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("priceMax"))
      .toBeNull();
    await expect(activeConditionPill).toBeHidden();
  }

  const filterButton = isMobile
    ? page.getByRole("button", { name: "Отвори филтрите" })
    : page.getByRole("button", { exact: true, name: "Филтри" });
  if (!isMobile) {
    await expect(
      page.getByRole("button", { exact: true, name: "Всички филтри" })
    ).toHaveCount(0);
  }
  await filterButton.click();
  const filterDialog = page.getByRole("dialog");
  await expect(filterDialog).toBeVisible();
  await expect(
    filterDialog.getByRole("heading", { exact: true, name: "Филтри" })
  ).toBeVisible();
  if (isMobile) {
    await expect(
      filterDialog.getByRole("button", { name: "Гориво, Всяко гориво" })
    ).toBeVisible();
    await expect(
      filterDialog.getByRole("button", { name: "Пробег, Всеки пробег" })
    ).toBeVisible();
    await expect(
      filterDialog.getByRole("button", {
        name: "Скорости, Всички скорости",
      })
    ).toBeVisible();
    await expect(
      filterDialog.getByRole("button", { exact: true, name: "Затвори" })
    ).toBeVisible();
    await filterDialog
      .getByRole("button", { name: "Автомобил, Автомобили" })
      .click();
    await expect(
      filterDialog.getByRole("heading", { exact: true, name: "Автомобил" })
    ).toBeVisible();
    await expect(
      filterDialog.getByRole("button", { name: truckCategoryPattern })
    ).toBeVisible();
    await filterDialog
      .getByRole("button", { exact: true, name: "Назад" })
      .click();
    await expect(
      filterDialog.getByRole("heading", { exact: true, name: "Филтри" })
    ).toBeVisible();
    await filterDialog
      .getByRole("button", { exact: true, name: "Затвори" })
      .click();
  } else {
    await filterDialog
      .getByRole("button", { exact: true, name: "Затвори" })
      .click();
  }
  await expect(filterDialog).toBeHidden();

  if (isMobile) {
    await page.getByRole("button", { name: categoryTriggerPattern }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: truckCategoryPattern })
      .click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("category"))
      .toBe("truck");
  } else {
    const footer = page.locator('[data-slot="public-marketplace-footer"]');
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    await expect(
      footer.getByRole("link", { exact: true, name: "Продайте ни автомобил" })
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { exact: true, name: "За нас и контакти" })
    ).toBeVisible();
    await expect(
      footer.getByRole("heading", { exact: true, name: "Наличности" })
    ).toBeVisible();
  }

  await expectHealthyPublicPage(page, errors);
});
