import path from "node:path";
import { expect, test } from "@playwright/test";

const bulgarianInventory = /\/bg\/cars$/;
const englishInventory = /\/en\/cars$/;

const copy = {
  bg: {
    title: "Държава и език",
    menu: "Меню",
    desktopMenu: "Още страници",
    close: "Затворете избора на държава и език",
    save: "Запазете предпочитанията",
    confirm: "Запази",
    cancel: "Отказ",
  },
  en: {
    title: "Country and language",
    menu: "Menu",
    desktopMenu: "More pages",
    close: "Close country and language preferences",
    save: "Save preferences",
    confirm: "Save",
    cancel: "Cancel",
  },
} as const;

for (const width of [320, 390, 1023, 1440]) {
  const preferenceRole = width >= 1024 ? "menuitem" : "link";
  for (const locale of ["bg", "en"] as const) {
    test(`${locale} selected-language flag at ${width}px`, async ({
      page,
      context,
      baseURL,
    }) => {
      if (!baseURL) {
        throw new Error("Language flag checks require a local preview URL");
      }
      await page.setViewportSize({ width, height: 900 });
      const preferences = await context.request.post("/api/preferences", {
        headers: { origin: new URL(baseURL).origin },
        data: {
          action: "save",
          locale,
          country: "DE",
          returnTo: `/${locale}/cars?sort=price-asc`,
        },
      });
      expect(preferences.status()).toBe(200);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(`/${locale}/cars?sort=price-asc`);
      await expect(
        page.locator('[data-locale-dialog][data-locale-ready="true"]')
      ).toBeAttached();
      await page
        .getByRole("button", {
          name: width >= 1024 ? copy[locale].desktopMenu : copy[locale].menu,
          exact: true,
        })
        .click();
      const trigger = page
        .getByRole(preferenceRole, {
          name: copy[locale].title,
          exact: true,
        })
        .filter({ visible: true });
      const screenshotDirectory = process.env.E2E_FLAGS_SCREENSHOTS_DIR;
      await expect(
        trigger.locator(`[data-language-flag="${locale}"]`)
      ).toBeVisible();
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toBeInViewport({ ratio: 1 });
      if (screenshotDirectory) {
        await page.screenshot({
          animations: "disabled",
          path: path.join(screenshotDirectory, `menu-${locale}-${width}.png`),
        });
      }
      await trigger.click();
      const dialog = page.locator("[data-locale-dialog]");
      const language = (value: "bg" | "en") =>
        dialog.getByRole("radio", {
          name: value === "bg" ? "Български" : "English",
          exact: true,
        });
      const country = dialog.locator('select[name="country"]');
      await expect(dialog).toBeVisible();
      await expect(language(locale)).toBeChecked();
      await expect(country).toHaveValue("DE");
      const controls = await dialog.evaluate((element) => {
        const field = element.querySelector<HTMLSelectElement>(
          'select[name="country"]'
        );
        const arrow = element.querySelector<HTMLElement>(
          "[data-locale-country-chevron]"
        );
        const close =
          element.querySelector<HTMLButtonElement>("button[aria-label]");
        const save = element.querySelector<HTMLButtonElement>(
          'button[type="submit"]'
        );
        const footer = element.querySelector<HTMLElement>(
          "[data-locale-actions]"
        );
        if (!(field && arrow && close && save && footer)) {
          throw new Error("Preference controls are missing");
        }
        const fieldBox = field.getBoundingClientRect();
        const arrowBox = arrow.getBoundingClientRect();
        return {
          arrowCenterError: Math.abs(
            fieldBox.y + fieldBox.height / 2 - arrowBox.y - arrowBox.height / 2
          ),
          arrowInset: fieldBox.right - arrowBox.right,
          fieldPaddingRight: Number.parseFloat(
            getComputedStyle(field).paddingRight
          ),
          fieldAppearance: getComputedStyle(field).appearance,
          closeBackground: getComputedStyle(close).backgroundColor,
          closeWidth: close.getBoundingClientRect().width,
          saveWidth: save.getBoundingClientRect().width,
          saveHeight: save.getBoundingClientRect().height,
          footerBorder: getComputedStyle(footer).borderTopWidth,
        };
      });
      expect(controls.arrowCenterError).toBeLessThanOrEqual(0.5);
      expect(controls.arrowInset).toBe(12);
      expect(controls.fieldPaddingRight).toBe(48);
      expect(controls.fieldAppearance).toBe("none");
      expect(controls.closeBackground).toBe("rgba(0, 0, 0, 0)");
      expect(controls.closeWidth).toBe(44);
      expect(controls.saveWidth).toBe(112);
      expect(controls.saveHeight).toBe(44);
      expect(controls.footerBorder).toBe("0px");
      await expect(dialog.getByRole("radio")).toHaveCount(2);
      await expect(dialog.locator('[data-language-flag="bg"]')).toBeVisible();
      await expect(dialog.locator('[data-language-flag="en"]')).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: copy[locale].confirm, exact: true })
      ).toBeInViewport({ ratio: 1 });
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.style.overflow)
        )
        .toBe("hidden");
      await expect(
        dialog.locator(`[data-language-flag="${locale}"]`)
      ).toBeVisible();
      if (screenshotDirectory) {
        await page.screenshot({
          animations: "disabled",
          path: path.join(
            screenshotDirectory,
            `overlay-${locale}-${width}.png`
          ),
        });
      }
      await country.selectOption("BG");
      await expect(country.locator("option:checked")).toHaveText(
        locale === "bg" ? "България" : "Bulgaria"
      );
      if (screenshotDirectory) {
        await page.screenshot({
          animations: "disabled",
          path: path.join(
            screenshotDirectory,
            `country-bg-${locale}-${width}.png`
          ),
        });
      }
      await country.selectOption("DE");
      const other = locale === "bg" ? "en" : "bg";
      await language(other).check();
      await expect(language(other)).toBeChecked();
      await expect(language(locale)).not.toBeChecked();
      await expect(country).toHaveValue("DE");
      await dialog
        .getByRole("button", { name: copy[locale].confirm, exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/${other}/cars\\?sort=price-asc$`)
      );
      await expect(
        page.locator('[data-locale-dialog][data-locale-ready="true"]')
      ).toBeAttached();
      await page
        .getByRole("button", {
          name: width >= 1024 ? copy[other].desktopMenu : copy[other].menu,
          exact: true,
        })
        .click();
      const savedTrigger = page
        .getByRole(preferenceRole, {
          name: copy[other].title,
          exact: true,
        })
        .filter({ visible: true });
      await expect(
        savedTrigger.locator(`[data-language-flag="${other}"]`)
      ).toBeVisible();
      await savedTrigger.click();
      await expect(country).toHaveValue("DE");
      await language(locale).check();
      await dialog
        .getByRole("button", { name: copy[other].cancel, exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.style.overflow)
        )
        .not.toBe("hidden");
      await expect(
        page.getByRole("button", {
          name: width >= 1024 ? copy[other].desktopMenu : copy[other].menu,
          exact: true,
        })
      ).toBeFocused();
      await page
        .getByRole("button", {
          name: width >= 1024 ? copy[other].desktopMenu : copy[other].menu,
          exact: true,
        })
        .click();
      await savedTrigger.click();
      await expect(language(other)).toBeChecked();
      await expect(
        dialog.locator(`[data-language-flag="${other}"]`)
      ).toBeVisible();
      await language(locale).check();
      await dialog.press("Escape");
      await expect(dialog).toBeHidden();
      expect(errors).toEqual([]);
    });
  }
}

for (const viewport of [
  { width: 320, height: 480 },
  { width: 844, height: 390 },
  { width: 1440, height: 600 },
]) {
  test(`language picker stays usable at ${viewport.width}x${viewport.height}`, async ({
    page,
    context,
    baseURL,
  }) => {
    if (!baseURL) {
      throw new Error("Language flag checks require a local preview URL");
    }
    await page.setViewportSize(viewport);
    await context.request.post("/api/preferences", {
      headers: { origin: new URL(baseURL).origin },
      data: {
        action: "save",
        locale: "en",
        country: "DE",
        returnTo: "/en/cars",
      },
    });
    await page.goto("/en/cars");
    await expect(page.locator('[data-locale-ready="true"]')).toBeAttached();
    await page
      .getByRole("button", {
        name: viewport.width >= 1024 ? copy.en.desktopMenu : copy.en.menu,
        exact: true,
      })
      .click();
    await page
      .getByRole(viewport.width >= 1024 ? "menuitem" : "link", {
        name: copy.en.title,
        exact: true,
      })
      .filter({ visible: true })
      .click();
    const dialog = page.locator("[data-locale-dialog]");
    const save = dialog.getByRole("button", {
      name: copy.en.confirm,
      exact: true,
    });
    const close = dialog.getByRole("button", {
      name: copy.en.close,
      exact: true,
    });
    await expect(save).toBeInViewport({ ratio: 1 });
    await expect(close).toBeInViewport({ ratio: 1 });
    await expect(dialog).toBeInViewport({ ratio: 1 });
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)
      )
      .toBe(true);
    await save.focus();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(save).toBeFocused();
    await dialog.locator('select[name="country"]').selectOption("GS");
    await dialog.getByRole("radio", { name: "Български", exact: true }).check();
    await expect(save).toBeInViewport({ ratio: 1 });
    const screenshotDirectory = process.env.E2E_FLAGS_SCREENSHOTS_DIR;
    if (screenshotDirectory) {
      await page.screenshot({
        animations: "disabled",
        path: path.join(
          screenshotDirectory,
          `overlay-short-${viewport.width}-${viewport.height}.png`
        ),
      });
    }
    await dialog
      .getByRole("button", { name: copy.en.cancel, exact: true })
      .click();
    await expect(dialog).toBeHidden();
  });
}

test("a failed preference save remains editable and cancellable", async ({
  page,
  context,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Language flag checks require a local preview URL");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: { action: "save", locale: "en", country: "DE", returnTo: "/en/cars" },
  });
  await page.goto("/en/cars");
  await expect(page.locator('[data-locale-ready="true"]')).toBeAttached();
  await page.getByRole("button", { name: copy.en.menu, exact: true }).click();
  await page.getByRole("link", { name: copy.en.title, exact: true }).click();
  const dialog = page.locator("[data-locale-dialog]");
  await dialog.getByRole("radio", { name: "Български", exact: true }).check();
  await page.route("**/api/preferences", (route) =>
    route.request().postDataJSON()?.action === "save"
      ? route.fulfill({
          status: 503,
          contentType: "application/json",
          body: "{}",
        })
      : route.continue()
  );
  const save = dialog.getByRole("button", {
    name: copy.en.confirm,
    exact: true,
  });
  await save.click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(save).toBeEnabled();
  await dialog.getByRole("radio", { name: "English", exact: true }).check();
  await expect(
    dialog.getByRole("radio", { name: "English", exact: true })
  ).toBeChecked();
  await dialog
    .getByRole("button", { name: copy.en.cancel, exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(englishInventory);
});

test("native language flags update without JavaScript", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) {
    throw new Error("Language flag checks require a local preview URL");
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/en/locale-settings`);
    const settings = page.locator("[data-locale-settings]");
    await expect(settings.locator('[data-language-flag="en"]')).toBeVisible();
    await settings.locator('select[name="locale"]').selectOption("bg");
    await expect(settings.locator('[data-language-flag="bg"]')).toBeVisible();
    await expect(settings.locator('[data-language-flag="en"]')).toBeHidden();
    await settings
      .getByRole("button", { name: copy.en.save, exact: true })
      .click();
    await expect(page).toHaveURL(bulgarianInventory);
  } finally {
    await context.close();
  }
});
