import { expect, type Page, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  type PublicPageErrors,
} from "../fixtures/public-page-health";

const importRequestPattern = /\/imports(?:\?|#|$)/;
const faviconPattern = /lead-logo\.png/;
const listingSuggestionDestinationPattern = /\/listing\/bmw-x5-m50d-sofia-2020/;
const germanyPattern = /Германия/;
const googleMapsHrefPattern = /google\.com\/maps/;
const telephoneHrefPattern = /^tel:/;
const allOriginPattern = /origin=ALL/;
const openAccentClassPattern = /bg-\[var\(--lead-site-accent\)\]/;
const screenReaderOnlyClassPattern = /sr-only/;
const whiteTextClassPattern = /\btext-white\b/;
const dayNightAccent = "rgb(196, 1, 1)";

const expectHealthyLeadPage = async (page: Page, errors: PublicPageErrors) => {
  await expect(page.locator("body")).not.toHaveText("");
  await expect(
    page.locator(
      "[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay"
    )
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1
    )
  ).toBe(true);
  expect(
    await page.locator("img").evaluateAll((images) =>
      images
        .filter((image): image is HTMLImageElement => {
          if (!(image instanceof HTMLImageElement)) {
            return false;
          }

          const bounds = image.getBoundingClientRect();
          return (
            bounds.width > 0 &&
            bounds.height > 0 &&
            image.complete &&
            image.naturalWidth === 0
          );
        })
        .map((image) => image.currentSrc || image.getAttribute("src"))
    )
  ).toEqual([]);
  expect(errors.consoleErrors).toEqual([]);
  expect(errors.pageErrors).toEqual([]);
};

test.describe("Day & Night homepage import selector", () => {
  test("handoff states and metadata stay actionable", async ({ page }) => {
    const errors = collectPublicPageErrors(page);
    const emptyResponse = await page.goto("/bg?q=__no_day_night_match__");
    expect(emptyResponse?.status()).toBe(200);
    await expect(
      page.locator('[data-slot="marketplace-empty-state"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="marketplace-empty-state"]')
    ).toContainText("Няма намерени обяви");
    await expect(
      page.getByRole("link", { name: "Изчисти филтрите" })
    ).toBeVisible();
    expect(await page.locator("#main-content").count()).toBe(1);
    expect(await page.locator('a[href="#main-content"]').count()).toBe(1);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      "href",
      faviconPattern
    );
    await expectHealthyLeadPage(page, errors);

    const homepageResponse = await page.goto("/bg");
    expect(homepageResponse?.status()).toBe(200);
    await expect(
      page.locator('[data-slot="marketplace-results-count"]').first()
    ).toBeHidden();

    const filteredResponse = await page.goto("/bg?yearMin=2020");
    expect(filteredResponse?.status()).toBe(200);
    await expect(
      page.locator('[data-slot="marketplace-results-count"]').first()
    ).toContainText("автомобила");
    const clearFilters = page.getByRole("button", {
      name: "Изчисти филтрите",
    });
    await expect(clearFilters).toBeVisible();
    await clearFilters.click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("yearMin"))
      .toBeNull();
    await expect(clearFilters).toHaveCount(0);

    const notFoundResponse = await page.goto("/bg/does-not-exist");
    expect(notFoundResponse?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: "Страницата не е намерена" })
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1
      )
    ).toBe(true);
  });

  test("listing detail keeps the phone CTA actionable", async ({ page }) => {
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/listing/bmw-x5-m50d-sofia-2020");
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-slot="listing-detail"]')).toBeVisible();
    const detailContactLinks = page.locator(
      '[data-slot="listing-detail"] a[href^="tel:"]'
    );
    await expect(detailContactLinks).not.toHaveCount(0);
    await expect(detailContactLinks.last()).toHaveAttribute(
      "href",
      telephoneHrefPattern
    );
    await expect(
      page.locator('[data-slot="listing-dealership-card"] img')
    ).toHaveAttribute("alt", "Day & Night Auto Group");
    await expectHealthyLeadPage(page, errors);
  });

  test("about and contact route stays lead-specific", async ({ page }) => {
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/contact");
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText(
      "Премиум автомобили. Внос. Лизинг."
    );
    await expect(page.locator("body")).not.toContainText("AutoMarket");

    const heroImage = page.locator('img[src*="day-night-contact-hero-v1.png"]');
    await expect(heroImage).toBeVisible();
    expect(
      await heroImage.evaluate((image) =>
        image instanceof HTMLImageElement ? image.naturalWidth : 0
      )
    ).toBeGreaterThan(0);
    await expect(page.locator('a[href^="tel:"]')).not.toHaveCount(0);
    await expect(
      page.locator('a[target="_blank"][href*="google.com/maps"]')
    ).not.toHaveCount(0);
    await expect(
      page.locator(
        '[data-slot="public-marketplace-footer"] a[href="/bg/contact"]'
      )
    ).not.toHaveCount(0);
    await expectHealthyLeadPage(page, errors);
  });

  test("desktop search input opens the inventory suggestion panel", async ({
    page,
  }) => {
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      return;
    }
    await page.setViewportSize({ height: 1080, width: 1920 });
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg");
    expect(response?.status()).toBe(200);

    const searchInput = page.getByRole("combobox", {
      name: "Търсене на автомобили",
    });
    const suggestionPanel = page.locator(
      '[data-slot="desktop-search-assistant"]'
    );
    await searchInput.focus();
    await expect(suggestionPanel).toBeVisible();
    await expect(
      page.locator('[data-search-menu-action="true"]')
    ).toBeVisible();

    const listingSuggestions = page.locator(
      '[data-slot="desktop-search-listing-suggestion"]'
    );
    await expect(listingSuggestions).toHaveCount(4);
    await expect(listingSuggestions.nth(0)).toContainText("BMW X5 M50d");
    await expect(listingSuggestions.nth(0)).toContainText("89 379");
    await expect(listingSuggestions.nth(1)).toContainText(
      "Mercedes-Benz GLS 400d 4MATIC AMG"
    );
    await expect(listingSuggestions.nth(2)).toContainText("BMW M4 Competition");
    await expect(listingSuggestions.nth(3)).toContainText(
      "BMW 750e xDrive M Sport"
    );
    await expect(
      page.locator('[data-slot="desktop-search-location-suggestion"]')
    ).toContainText("София");
    await expect(listingSuggestions.nth(0)).toHaveAttribute(
      "aria-selected",
      "true"
    );

    const suggestionGeometry = await page.evaluate(() => {
      const panel = document.querySelector(
        '[data-slot="desktop-search-assistant"]'
      );
      const surface = document.querySelector(
        '[data-slot="desktop-search-surface"]'
      );
      const panelBounds = panel?.getBoundingClientRect();
      const surfaceBounds = surface?.getBoundingClientRect();
      return {
        panelLeft: panelBounds?.left ?? 0,
        panelWidth: panelBounds?.width ?? 0,
        surfaceLeft: surfaceBounds?.left ?? 0,
        surfaceWidth: surfaceBounds?.width ?? 0,
      };
    });
    expect(
      Math.abs(suggestionGeometry.panelLeft - suggestionGeometry.surfaceLeft)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(suggestionGeometry.panelWidth - suggestionGeometry.surfaceWidth)
    ).toBeLessThanOrEqual(1);
    await expect
      .poll(() =>
        listingSuggestions
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0
            )
          )
      )
      .toBe(true);

    await page.keyboard.press("ArrowDown");
    await expect(listingSuggestions.nth(1)).toHaveAttribute(
      "aria-selected",
      "true"
    );
    await page.keyboard.press("Escape");
    await expect(suggestionPanel).toHaveCount(0);

    await page.keyboard.press("ArrowDown");
    await expect(suggestionPanel).toBeVisible();
    await listingSuggestions.nth(0).click();
    await expect(page).toHaveURL(listingSuggestionDestinationPattern);
    await expectHealthyLeadPage(page, errors);
  });

  test("desktop service modes preserve header and listing geometry", async ({
    page,
  }) => {
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      return;
    }
    await page.setViewportSize({ height: 1080, width: 1920 });
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg");
    expect(response?.status()).toBe(200);

    const readGeometry = () =>
      page.evaluate(() => {
        const readBounds = (selector: string) => {
          const bounds = document
            .querySelector(selector)
            ?.getBoundingClientRect();
          return {
            height: bounds?.height ?? 0,
            top: bounds?.top ?? 0,
          };
        };

        return {
          band: readBounds(
            '[data-slot="desktop-quick-filter-band"], [data-slot="desktop-service-shortcut-band"]'
          ),
          grid: readBounds('[data-slot="marketplace-listing-grid"]'),
          header: readBounds('[data-slot="desktop-marketplace-header-band"]'),
          masthead: readBounds('[data-slot="marketplace-masthead"]'),
          modes: readBounds('nav[aria-label="Основни действия"]'),
        };
      });

    const inventoryGeometry = await readGeometry();
    for (const mode of ["sell", "imports"] as const) {
      await page.locator(`[data-marketplace-mode="${mode}"]`).click();
      await expect(
        page.locator('[data-slot="desktop-service-shortcut-band"]')
      ).toBeVisible();
      const serviceGeometry = await readGeometry();

      for (const region of [
        "band",
        "grid",
        "header",
        "masthead",
        "modes",
      ] as const) {
        expect(
          Math.abs(serviceGeometry[region].top - inventoryGeometry[region].top)
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(
            serviceGeometry[region].height - inventoryGeometry[region].height
          )
        ).toBeLessThanOrEqual(1);
      }
    }

    await expectHealthyLeadPage(page, errors);
  });

  test("handoff desktop breakpoints keep primary surfaces in bounds", async ({
    page,
  }) => {
    const errors = collectPublicPageErrors(page);

    for (const width of [1280, 1366]) {
      await page.setViewportSize({ height: 900, width });
      const response = await page.goto("/bg");
      expect(response?.status()).toBe(200);

      const metrics = await page.evaluate(() => {
        const selectors = [
          '[data-slot="desktop-marketplace-header-band"]',
          '[data-slot="desktop-search-surface"]',
          '[data-slot="desktop-quick-filter-band"]',
          '[data-slot="marketplace-listing-grid"]',
        ];
        return {
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
          surfaces: selectors.map((selector) => {
            const bounds = document
              .querySelector(selector)
              ?.getBoundingClientRect();
            return {
              bottom: bounds?.bottom ?? 0,
              left: bounds?.left ?? 0,
              right: bounds?.right ?? 0,
              top: bounds?.top ?? 0,
            };
          }),
        };
      });

      expect(metrics.overflow).toBeLessThanOrEqual(0);
      expect(metrics.surfaces.every((surface) => surface.left >= 0)).toBe(true);
      expect(
        metrics.surfaces.every((surface) => surface.right <= width + 1)
      ).toBe(true);
    }

    await expectHealthyLeadPage(page, errors);
  });

  test("desktop quick-filter dropdown exposes clear open and hover states", async ({
    page,
  }) => {
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      return;
    }
    await page.setViewportSize({ height: 1080, width: 1920 });
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg");
    expect(response?.status()).toBe(200);

    const yearTrigger = page
      .locator('[data-slot="desktop-quick-filter"]')
      .filter({ hasText: "Година" });
    await yearTrigger.click();
    await expect(yearTrigger).toHaveAttribute("aria-expanded", "true");

    const rangeDialog = page.locator(
      '[data-slot="desktop-quick-range-dialog"]'
    );
    await expect(rangeDialog).toBeVisible();
    await expect(
      rangeDialog.getByText(
        "Изберете начална и крайна година с плъзгане или точни стойности."
      )
    ).toHaveClass(screenReaderOnlyClassPattern);
    await expect(rangeDialog.getByText("Избран диапазон")).toHaveClass(
      screenReaderOnlyClassPattern
    );
    await expect(rangeDialog.getByText("Бърз избор")).toHaveClass(
      screenReaderOnlyClassPattern
    );
    await expect(
      rangeDialog.locator('[data-slot="numeric-range-summary"]')
    ).toBeVisible();

    for (const [accessibleName, insetLabel] of [
      ["Минимална година", "От година"],
      ["Максимална година", "До година"],
    ] as const) {
      const input = rangeDialog.getByRole("spinbutton", {
        name: accessibleName,
      });
      const label = rangeDialog.getByText(insetLabel, { exact: true });
      const [inputBox, labelBox] = await Promise.all([
        input.boundingBox(),
        label.boundingBox(),
      ]);
      expect(inputBox).not.toBeNull();
      expect(labelBox).not.toBeNull();
      expect(labelBox?.x).toBeGreaterThanOrEqual(inputBox?.x ?? 0);
      expect(labelBox?.y).toBeGreaterThanOrEqual(inputBox?.y ?? 0);
      expect((labelBox?.x ?? 0) + (labelBox?.width ?? 0)).toBeLessThanOrEqual(
        (inputBox?.x ?? 0) + (inputBox?.width ?? 0)
      );
      expect((labelBox?.y ?? 0) + (labelBox?.height ?? 0)).toBeLessThanOrEqual(
        (inputBox?.y ?? 0) + (inputBox?.height ?? 0)
      );
    }
    const yearPreset = page.getByRole("button", { name: "От 2020" });
    const neutralPresetBackground = await yearPreset.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    expect(neutralPresetBackground).not.toBe("rgba(0, 0, 0, 0)");
    await yearPreset.hover();
    await expect
      .poll(() =>
        yearPreset.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        )
      )
      .not.toBe(neutralPresetBackground);
    await yearPreset.click();
    await expect(yearPreset).toHaveAttribute("aria-pressed", "true");

    await page.keyboard.press("Escape");
    await yearTrigger.focus();
    await expect(yearTrigger).toBeFocused();
    expect(
      await yearTrigger.evaluate((element) => ({
        outlineStyle: getComputedStyle(element).outlineStyle,
        outlineWidth: getComputedStyle(element).outlineWidth,
      }))
    ).toEqual({ outlineStyle: "solid", outlineWidth: "2px" });
    await expectHealthyLeadPage(page, errors);
  });

  test("desktop full-filter header keeps balanced icon actions", async ({
    page,
  }) => {
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      return;
    }
    await page.setViewportSize({ height: 900, width: 1440 });
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg");
    expect(response?.status()).toBe(200);

    const trigger = page.getByRole("button", {
      exact: true,
      name: "Филтри",
    });
    await trigger.click();

    const dialog = page.locator('[data-slot="desktop-full-filter-dialog"]');
    const reset = dialog.locator('[data-slot="desktop-full-filter-reset"]');
    const close = dialog.locator('[data-slot="desktop-full-filter-close"]');
    await expect(dialog).toBeVisible();
    await expect(reset).toHaveAccessibleName("Нулирай");
    await expect(close).toHaveAccessibleName("Затвори");

    const headerGeometry = await dialog.evaluate((element) => {
      const dialogBounds = element.getBoundingClientRect();
      const titleBounds = element
        .querySelector('[data-slot="dialog-title"]')
        ?.getBoundingClientRect();
      const resetBounds = element
        .querySelector('[data-slot="desktop-full-filter-reset"]')
        ?.getBoundingClientRect();
      const closeBounds = element
        .querySelector('[data-slot="desktop-full-filter-close"]')
        ?.getBoundingClientRect();
      return {
        actionHeights: [resetBounds?.height ?? 0, closeBounds?.height ?? 0],
        actionWidths: [resetBounds?.width ?? 0, closeBounds?.width ?? 0],
        dialogCenter: dialogBounds.left + dialogBounds.width / 2,
        titleCenter: (titleBounds?.left ?? 0) + (titleBounds?.width ?? 0) / 2,
      };
    });
    for (const dimension of [
      ...headerGeometry.actionHeights,
      ...headerGeometry.actionWidths,
    ]) {
      expect(dimension).toBeGreaterThanOrEqual(39.5);
      expect(dimension).toBeLessThanOrEqual(40.5);
    }
    expect(
      Math.abs(
        headerGeometry.actionHeights[0] - headerGeometry.actionHeights[1]
      )
    ).toBeLessThanOrEqual(0.1);
    expect(
      Math.abs(headerGeometry.actionWidths[0] - headerGeometry.actionWidths[1])
    ).toBeLessThanOrEqual(0.1);
    expect(
      Math.abs(headerGeometry.dialogCenter - headerGeometry.titleCenter)
    ).toBeLessThanOrEqual(1);

    const resetBoundsBeforeHover = await reset.boundingBox();
    const resetBackgroundBeforeHover = await reset.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    await reset.hover();
    await expect
      .poll(() =>
        reset.evaluate((element) => getComputedStyle(element).backgroundColor)
      )
      .not.toBe(resetBackgroundBeforeHover);
    expect(await reset.boundingBox()).toEqual(resetBoundsBeforeHover);

    await dialog.getByRole("button", { name: "Тип купе" }).click();
    const back = dialog.locator('[data-slot="desktop-full-filter-back"]');
    await expect(back).toHaveAccessibleName("Назад");
    await expect(
      dialog.getByRole("heading", { name: "Тип купе" })
    ).toBeVisible();
    await back.click();
    await expect(reset).toBeVisible();

    await close.click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectHealthyLeadPage(page, errors);
  });

  test("selector interaction and responsive homepage stay healthy", async ({
    page,
  }) => {
    const errors = collectPublicPageErrors(page);
    const initialViewportWidth = page.viewportSize()?.width ?? 1440;

    if (initialViewportWidth >= 1024) {
      await page.setViewportSize({ height: 1080, width: 1920 });
    }

    const response = await page.goto("/bg");
    expect(response?.status()).toBe(200);
    expect(
      await page
        .locator("html")
        .evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue("--lead-site-accent")
            .trim()
        )
    ).toBe("#c40101");
    const viewportWidth = page.viewportSize()?.width ?? 1440;

    if (viewportWidth < 1024) {
      await expect(
        page.locator('[data-slot="desktop-import-surface"]')
      ).toHaveCount(0);
      const mobileCategoryTrigger = page.getByRole("button", {
        name: "Избери категория",
      });
      await mobileCategoryTrigger.click();
      const mobileVanOption = page
        .getByRole("dialog")
        .getByRole("link")
        .filter({ hasText: "Бусове" });
      await mobileVanOption.click();
      await expect
        .poll(() => new URL(page.url()).searchParams.get("category"))
        .toBe("van");
      expect(["/", "/bg"]).toContain(new URL(page.url()).pathname);
      await expect(mobileCategoryTrigger).toContainText("Бусове");
      await expect(
        page.getByRole("heading", {
          name: "Mercedes-Benz V 250d VIP Business",
        })
      ).toBeVisible();
      await expectHealthyLeadPage(page, errors);
      return;
    }

    const headerBand = page.locator(
      '[data-slot="desktop-marketplace-header-band"]'
    );
    const inventoryHeaderHeight = await headerBand.evaluate(
      (element) => element.getBoundingClientRect().height
    );
    const categoryTrigger = page.locator(
      '[data-slot="desktop-search-category"]'
    );
    await expect(categoryTrigger).toBeVisible();
    const searchRadii = await page.evaluate(() => {
      const surface = document.querySelector(
        '[data-slot="desktop-search-surface"]'
      );
      const category = document.querySelector(
        '[data-slot="desktop-search-category"]'
      );
      const action = document.querySelector(
        '[data-slot="desktop-search-action"] button'
      );

      return {
        action: action
          ? {
              height: action.getBoundingClientRect().height,
              radius: Number.parseFloat(getComputedStyle(action).borderRadius),
              width: action.getBoundingClientRect().width,
            }
          : undefined,
        category: category ? getComputedStyle(category).borderRadius : "",
        surface: surface ? getComputedStyle(surface).borderRadius : "",
      };
    });
    expect(searchRadii.category).toBe("14px");
    expect(searchRadii.surface).toBe("20px");
    expect(searchRadii.action?.height).toBe(48);
    expect(searchRadii.action?.width).toBe(48);
    expect(searchRadii.action?.radius).toBeGreaterThanOrEqual(24);
    await expect(
      page.locator('[data-slot="desktop-search-action"] button span')
    ).toHaveCount(0);
    const quickFilterBand = page.locator(
      '[data-slot="desktop-quick-filter-band"]'
    );
    const listingGrid = page.locator('[data-slot="marketplace-listing-grid"]');
    const modeActions = page.locator('[data-slot="marketplace-mode-action"]');
    await expect(modeActions).toHaveCount(3);
    await expect(modeActions.first()).toHaveAttribute("aria-pressed", "true");
    await expect(modeActions.first()).toContainText("Купи");
    await expect(modeActions.first()).not.toContainText("Наличности");
    const activeModeStyles = await modeActions.first().evaluate((element) => ({
      backgroundColor: getComputedStyle(element).backgroundColor,
      flexDirection: getComputedStyle(element).flexDirection,
      textDecorationLine: getComputedStyle(element).textDecorationLine,
    }));
    expect(activeModeStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(activeModeStyles.flexDirection).toBe("row");
    expect(activeModeStyles.textDecorationLine).toBe("none");
    await expect(
      page.locator('[data-slot="marketplace-discovery-toolbar"]')
    ).toHaveCount(0);
    await expect(
      quickFilterBand.locator('[data-slot="desktop-quick-filter"]')
    ).toHaveCount(7);
    await expect(
      quickFilterBand.locator('[data-slot="desktop-primary-control"]')
    ).toHaveCount(1);
    const primaryFilterAction = quickFilterBand.locator(
      '[data-slot="desktop-primary-control"]'
    );
    await expect(primaryFilterAction).toContainText("Филтри");
    await expect(primaryFilterAction).toHaveCSS(
      "background-color",
      "rgb(0, 0, 0)"
    );
    await expect(primaryFilterAction).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(
      quickFilterBand.locator('[data-slot="desktop-sort-trigger"]')
    ).toContainText("Препоръчани");
    expect(
      await quickFilterBand
        .locator('[data-slot="desktop-quick-filter"]')
        .first()
        .evaluate((element) => element.getBoundingClientRect().height)
    ).toBeGreaterThanOrEqual(44);
    const contactGroup = page.locator('[data-slot="lead-contact-group"]');
    expect(
      await contactGroup.evaluate(
        (element) => element.getBoundingClientRect().height
      )
    ).toBe(52);
    await expect(
      contactGroup.locator('[data-slot="lead-location-action"] svg')
    ).toBeVisible();
    await expect(
      contactGroup.locator('[data-slot="lead-phone-action"] svg')
    ).toBeVisible();
    await expect(
      contactGroup.locator('[data-slot="lead-location-action"]')
    ).toContainText("Шоурум");
    await expect(
      contactGroup.locator('[data-slot="lead-phone-action"]')
    ).toContainText("Обади се");
    const contactActionStyles = await contactGroup
      .locator(
        '[data-slot="lead-location-action"], [data-slot="lead-phone-action"]'
      )
      .evaluateAll((elements) =>
        elements.map((element) => ({
          backgroundColor: getComputedStyle(element).backgroundColor,
          borderTopColor: getComputedStyle(element).borderTopColor,
          height: element.getBoundingClientRect().height,
        }))
      );
    expect(contactActionStyles).toHaveLength(2);
    expect(
      contactActionStyles.every(
        (style) =>
          style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          style.borderTopColor !== "rgba(0, 0, 0, 0)" &&
          style.height === 52
      )
    ).toBe(true);
    const headerControlHeights = await page.evaluate(() => {
      const search = document.querySelector(
        '[data-slot="desktop-search-surface"]'
      );
      const mode = document.querySelector(
        '[data-slot="marketplace-mode-action"]'
      );
      const contact = document.querySelector('[data-slot="lead-phone-action"]');
      return {
        contact: contact?.getBoundingClientRect().height ?? 0,
        mode: mode?.getBoundingClientRect().height ?? 0,
        search: search?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(headerControlHeights.search).toBeGreaterThan(
      headerControlHeights.mode
    );
    expect(headerControlHeights.search).toBeGreaterThan(
      headerControlHeights.contact
    );
    await contactGroup.locator('[data-slot="lead-location-action"]').hover();
    await expect(
      page.locator('[data-slot="lead-location-tooltip"]')
    ).toContainText("София");
    await expect(
      page.locator('[data-slot="lead-location-tooltip-action"]')
    ).toHaveAttribute("href", googleMapsHrefPattern);
    await expect(
      page.locator('[data-slot="lead-location-tooltip-action"]')
    ).toHaveAttribute("target", "_blank");
    const phoneAction = contactGroup.locator('[data-slot="lead-phone-action"]');
    await phoneAction.hover();
    await expect(
      page.locator('[data-slot="lead-phone-tooltip"]')
    ).toContainText("0877 733 110");
    await expect(
      page.locator('[data-slot="lead-phone-tooltip-action"]')
    ).toHaveAttribute("href", telephoneHrefPattern);
    await expect(phoneAction).toHaveAttribute("href", telephoneHrefPattern);
    expect(
      await phoneAction.evaluate(
        (element) => element.getBoundingClientRect().height
      )
    ).toBeGreaterThanOrEqual(44);
    expect(
      await phoneAction.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).not.toBe("rgba(0, 0, 0, 0)");
    const homeAction = page.locator('[data-slot="marketplace-home-link"]');
    await homeAction.hover();
    expect(
      await homeAction.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).toBe("rgba(0, 0, 0, 0)");
    await expect(page.getByRole("tooltip", { name: "Начало" })).toHaveCount(0);
    const mastheadAlignment = await page.evaluate(() => {
      const contact = document.querySelector(
        '[data-slot="lead-contact-group"]'
      );
      const home = document.querySelector(
        '[data-slot="marketplace-home-link"]'
      );
      const mode = document.querySelector(
        '[data-slot="marketplace-mode-action"]'
      );

      return {
        contactCenter: contact
          ? contact.getBoundingClientRect().top +
            contact.getBoundingClientRect().height / 2
          : 0,
        homeCenter: home
          ? home.getBoundingClientRect().top +
            home.getBoundingClientRect().height / 2
          : 0,
        modeCenter: mode
          ? mode.getBoundingClientRect().top +
            mode.getBoundingClientRect().height / 2
          : 0,
      };
    });
    expect(
      Math.abs(mastheadAlignment.modeCenter - mastheadAlignment.contactCenter)
    ).toBeLessThanOrEqual(4);
    expect(
      Math.abs(mastheadAlignment.modeCenter - mastheadAlignment.homeCenter)
    ).toBeLessThanOrEqual(4);
    await expect(
      page.locator('[data-slot="lead-location-action"]')
    ).toHaveAttribute("target", "_blank");
    await expect(
      page.locator('[data-slot="lead-phone-action"]')
    ).toHaveAttribute("href", telephoneHrefPattern);
    await expect(
      listingGrid.locator('[data-slot="vehicle-seller-logo"]')
    ).toHaveCount(0);
    await expect(
      listingGrid.locator('[data-slot="vehicle-card-title-row"]')
    ).toHaveCount(12);
    await expect(
      listingGrid.locator('[data-slot="vehicle-card-meta-row"]')
    ).toHaveCount(0);
    await expect(
      listingGrid.locator('[data-slot="vehicle-card-media-badges"]')
    ).toHaveCount(4);
    await expect(
      listingGrid.locator('[data-slot="vehicle-location-meta"]')
    ).toHaveCount(0);
    await expect(quickFilterBand).not.toContainText("Тип купе");
    await expect(quickFilterBand).not.toContainText("Скорости");
    await expect(quickFilterBand).not.toContainText("Продавач");
    await expect(quickFilterBand).not.toContainText("Произход");
    await expect(quickFilterBand).not.toContainText("Доставка до");
    expect(
      await listingGrid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length
      )
    ).toBe(5);
    await categoryTrigger.focus();
    await expect(categoryTrigger).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(categoryTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(categoryTrigger).toHaveClass(openAccentClassPattern);
    await expect(categoryTrigger.locator("span.mt-1")).toHaveClass(
      whiteTextClassPattern
    );

    const categoryOptions = page.locator('[data-slot="lead-category-option"]');
    const categoryMenu = page.locator('[data-slot="lead-category-dialog"]');
    const categoryImages = categoryOptions.locator(
      '[data-slot="lead-category-image-surface"] img'
    );
    await expect(categoryMenu).toBeVisible();
    await expect(categoryOptions).toHaveCount(4);
    await expect(categoryImages).toHaveCount(4);
    const categoryMenuGeometry = await page.evaluate(() => {
      const menu = document.querySelector('[data-slot="lead-category-dialog"]');
      const options = [
        ...document.querySelectorAll('[data-slot="lead-category-option"]'),
      ];
      const menuBounds = menu?.getBoundingClientRect();

      return {
        menuBottom: menuBounds?.bottom ?? 0,
        menuLeft: menuBounds?.left ?? 0,
        menuRight: menuBounds?.right ?? 0,
        menuTop: menuBounds?.top ?? 0,
        menuWidth: menuBounds?.width ?? 0,
        optionTops: options.map((option) => option.getBoundingClientRect().top),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });
    expect(categoryMenuGeometry.menuWidth).toBeLessThanOrEqual(768);
    expect(categoryMenuGeometry.menuLeft).toBeGreaterThanOrEqual(16);
    expect(categoryMenuGeometry.menuRight).toBeLessThanOrEqual(
      categoryMenuGeometry.viewportWidth - 16
    );
    expect(categoryMenuGeometry.menuTop).toBeGreaterThanOrEqual(16);
    expect(new Set(categoryMenuGeometry.optionTops).size).toBe(1);
    expect(categoryMenuGeometry.menuBottom).toBeLessThanOrEqual(
      categoryMenuGeometry.viewportHeight
    );
    const activeCategoryOption = page.locator(
      '[data-slot="lead-category-option"][aria-current="page"]'
    );
    await expect(activeCategoryOption).toHaveClass(openAccentClassPattern);
    await expect(activeCategoryOption).toHaveClass(whiteTextClassPattern);
    expect(
      await activeCategoryOption.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).toBe(dayNightAccent);
    for (const option of [activeCategoryOption, categoryOptions.nth(1)]) {
      const [tileBackground, imageBackground] = await Promise.all([
        option.evaluate((element) => getComputedStyle(element).backgroundColor),
        option
          .locator('[data-slot="lead-category-image-surface"]')
          .evaluate((element) => getComputedStyle(element).backgroundColor),
      ]);
      expect(imageBackground).toBe(tileBackground);
    }
    expect(await categoryOptions.allTextContents()).toEqual([
      "Автомобили12 автомобила",
      "Камиони",
      "Мотори",
      "Бусове1 бус",
    ]);
    expect(
      await categoryOptions
        .locator('[data-slot="lead-category-count"]')
        .allTextContents()
    ).toEqual(["12 автомобила", "1 бус"]);
    await expect
      .poll(() =>
        categoryImages.evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0
          )
        )
      )
      .toBe(true);
    await categoryOptions.nth(3).focus();
    await expect(categoryOptions.nth(3)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(categoryTrigger).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("category"))
      .toBe("van");
    expect(["/", "/bg"]).toContain(new URL(page.url()).pathname);
    await expect(categoryTrigger).toContainText("Бусове");
    await expect(
      page.getByRole("heading", { name: "Mercedes-Benz V 250d VIP Business" })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="desktop-quick-filter-band"]')
    ).toBeVisible();
    const sparseVanGrid = await listingGrid.evaluate((element) => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(" ").length,
      width: element.getBoundingClientRect().width,
    }));
    expect(sparseVanGrid.columns).toBe(1);
    expect(sparseVanGrid.width).toBeLessThanOrEqual(512);
    expect(
      Math.abs(
        (await headerBand.evaluate(
          (element) => element.getBoundingClientRect().height
        )) - inventoryHeaderHeight
      )
    ).toBeLessThanOrEqual(1);

    await categoryTrigger.focus();
    await page.keyboard.press("Enter");
    const carOption = page
      .locator('[data-slot="lead-category-option"]')
      .filter({ hasText: "Автомобили" });
    await carOption.focus();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("category"))
      .toBeNull();
    expect(["/", "/bg"]).toContain(new URL(page.url()).pathname);
    await expect(categoryTrigger).toContainText("Автомобили");
    await expect(
      page.getByRole("heading", { name: "BMW X5 M50d" })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="desktop-quick-filter-band"]')
    ).toBeVisible();
    expect(
      Math.abs(
        (await headerBand.evaluate(
          (element) => element.getBoundingClientRect().height
        )) - inventoryHeaderHeight
      )
    ).toBeLessThanOrEqual(1);

    const directVanResponse = await page.goto("/bg/vans");
    expect(directVanResponse?.status()).toBe(200);
    await expect(categoryTrigger).toContainText("Бусове");
    await expect(
      page.getByRole("heading", { name: "Mercedes-Benz V 250d VIP Business" })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="desktop-quick-filter-band"]')
    ).toBeVisible();
    expect(
      await page
        .locator('[data-slot="desktop-search-surface"]')
        .evaluate((element) => element.getBoundingClientRect().height)
    ).toBeCloseTo(64, 0);
    expect(
      Math.abs(
        (await headerBand.evaluate(
          (element) => element.getBoundingClientRect().height
        )) - inventoryHeaderHeight
      )
    ).toBeLessThanOrEqual(1);

    await page
      .locator(
        '[data-slot="marketplace-mode-action"][data-marketplace-mode="imports"]'
      )
      .click();

    const masthead = page.locator('[data-slot="marketplace-masthead"]');
    await expect(masthead).toBeVisible();
    expect(
      await masthead.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).toBe("rgb(3, 3, 3)");
    await expect(
      page.locator('[data-slot="marketplace-home-link"] img')
    ).toBeVisible();
    for (const asset of ["lead-car-left-v4.webp", "lead-car-right-v5.webp"]) {
      const cutout = page.locator(`img[src*="${asset}"]`);
      await expect(cutout).toBeVisible();
      expect(
        await cutout.evaluate(
          (image) => (image as HTMLImageElement).naturalWidth
        )
      ).toBeGreaterThan(0);
    }
    await expect(
      page.locator('[data-slot="desktop-service-shortcuts"]')
    ).toContainText("Популярни държави:");

    const form = page.locator('[data-slot="desktop-import-surface"]');
    const origin = page.locator('[data-slot="import-origin-trigger"]');
    const destination = page.locator(
      '[data-slot="import-destination-trigger"]'
    );
    const importerAction = form.getByRole("button", {
      name: "Заяви внос",
    });

    await expect(form).toBeVisible();
    const importHeaderHeight = await headerBand.evaluate(
      (element) => element.getBoundingClientRect().height
    );
    expect(
      Math.abs(importHeaderHeight - inventoryHeaderHeight)
    ).toBeLessThanOrEqual(1);
    const controlGeometry = await form.evaluate((element) => {
      const originControl = element.querySelector(
        '[data-slot="import-origin-trigger"]'
      );
      const destinationControl = element.querySelector(
        '[data-slot="import-destination-trigger"]'
      );
      const formBounds = element.getBoundingClientRect();
      const originBounds = originControl?.getBoundingClientRect();
      const destinationBounds = destinationControl?.getBoundingClientRect();

      return {
        destinationHeight: destinationBounds?.height ?? 0,
        destinationRadius: destinationControl
          ? getComputedStyle(destinationControl).borderRadius
          : "",
        destinationTop: destinationBounds?.top ?? 0,
        formHeight: formBounds.height,
        originHeight: originBounds?.height ?? 0,
        originRadius: originControl
          ? getComputedStyle(originControl).borderRadius
          : "",
        originTop: originBounds?.top ?? 0,
      };
    });
    expect(controlGeometry.formHeight).toBeCloseTo(64, 0);
    expect(
      Math.abs(controlGeometry.destinationHeight - controlGeometry.originHeight)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(controlGeometry.destinationTop - controlGeometry.originTop)
    ).toBeLessThanOrEqual(1);
    expect(controlGeometry.destinationRadius).toBe(
      controlGeometry.originRadius
    );
    expect(Number.parseFloat(controlGeometry.originRadius)).toBeGreaterThan(0);
    for (const control of [origin, destination]) {
      const bounds = await control.boundingBox();
      if (!bounds) {
        throw new Error("Import control has no pointer target bounds.");
      }

      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2
      );
      await page.mouse.down();
      expect(
        await control.evaluate((element) => getComputedStyle(element).transform)
      ).toBe("none");
      await page.mouse.up();
      await page.keyboard.press("Escape");
    }
    expect(
      await importerAction.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      )
    ).toBe(dayNightAccent);
    await expect(origin).toHaveAttribute("aria-expanded", "false");
    await expect(origin).toHaveAttribute(
      "aria-label",
      "Произход: Всички държави"
    );
    await expect(destination).toContainText("Фиксирано");
    await expect(form.locator('input[name="deliverTo"]')).toHaveCount(0);
    await expect(form.locator('input[name="type"]')).toHaveCount(0);

    const hierarchy = await origin.evaluate((element) => {
      const label = element.querySelector("span.block");
      const value = element.querySelector("span.mt-1");

      return {
        label: label ? Number.parseFloat(getComputedStyle(label).fontSize) : 0,
        value: value ? Number.parseFloat(getComputedStyle(value).fontSize) : 0,
      };
    });
    expect(hierarchy.label).toBeGreaterThanOrEqual(12);
    expect(hierarchy.value).toBeGreaterThanOrEqual(16);
    expect(
      await origin.evaluate((element) => getComputedStyle(element).cursor)
    ).toBe("pointer");

    const restingOriginBackground = await origin.evaluate(
      (element) => getComputedStyle(element).backgroundColor
    );
    await origin.hover();
    await expect
      .poll(() =>
        origin.evaluate((element) => getComputedStyle(element).backgroundColor)
      )
      .not.toBe(restingOriginBackground);

    await origin.focus();
    await expect(origin).toBeFocused();
    await expect
      .poll(() =>
        origin.evaluate((element) => getComputedStyle(element).boxShadow)
      )
      .not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(origin).toHaveAttribute("aria-expanded", "true");

    const germany = page.getByRole("button", { name: germanyPattern });
    await germany.focus();
    await page.keyboard.press("Enter");
    await expect(origin).toHaveAttribute("aria-expanded", "false");
    await expect(origin).toHaveAttribute("aria-label", "Произход: Германия");
    await expect(form.locator('input[name="origin"]')).toHaveAttribute(
      "value",
      "DE"
    );

    await destination.focus();
    await expect(destination).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(destination).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByText("Дестинацията е България")).toBeVisible();
    await expect(
      page.getByText("Заявката е за автомобил с доставка до България.")
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(destination).toHaveAttribute("aria-expanded", "false");

    await importerAction.click();
    await expect(page).toHaveURL(importRequestPattern);
    const destinationUrl = new URL(page.url());
    expect(destinationUrl.searchParams.get("origin")).toBe("DE");
    await expect(
      page.getByRole("heading", { name: "Внос на автомобил по заявка" })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="import-request-form-card"]')
    ).toBeVisible();
    await expectHealthyLeadPage(page, errors);
  });

  test("mobile import keeps origin filtering separate from the request form", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/imports");
    expect(response?.status()).toBe(200);

    await expect(
      page.locator('[data-slot="import-request-form-card"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-slot="mobile-import-routes"] a')
    ).toHaveCount(6);
    await expect(page.getByRole("link", { name: "Всички" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(page.getByRole("link", { name: "Всички" })).toHaveAttribute(
      "href",
      allOriginPattern
    );

    await page.getByRole("link", { name: "Германия" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("origin"))
      .toBe("DE");
    await expect(
      page.locator('[data-slot="import-request-form-card"]')
    ).toHaveCount(0);

    const sourceUrl = "https://example.com/cars/bmw-x5";
    await page.locator("#import-source-url-mobile").fill(sourceUrl);
    await page.getByRole("button", { name: "Изпратете линка" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("sourceUrl"))
      .toBe(sourceUrl);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("origin"))
      .toBe("DE");
    await expect(
      page.locator('[data-slot="import-request-form-card"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="import-request-form"] input[name="sourceUrl"]')
    ).toHaveValue(sourceUrl);
    await expect(
      page.locator('[data-slot="import-request-form"] input[name="origin"]')
    ).toHaveValue("DE");
    await expectHealthyLeadPage(page, errors);
  });
});
