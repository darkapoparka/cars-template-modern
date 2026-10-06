import { expect, test } from "@playwright/test";
import { selectInventoryFilterLayout } from "../fixtures/inventory-preview";

const dieselResultsPattern = /\/en\/cars\?.*fuel=diesel/;
const fuelQueryPattern = /fuel=/;
const phonePattern = /^tel:/;
const sourceQueryPattern = /sourceUrl=/;
const vehicleQueryPattern = /[?&]vehicle=/;
const moreFiltersPattern = /More filters/;
const desktopHeroSelector =
  '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"]';

for (const width of [1024, 1440, 1920]) {
  for (const locale of ["en", "bg"] as const) {
    test(`desktop keeps the Home 10 frame and stock visible below its search (${locale}, ${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}`);
      const pageWidth = await page
        .locator("body")
        .evaluate((element) => element.getBoundingClientRect().width);
      const header = page.locator(
        '[data-slot="dealer-desktop-header"]:visible'
      );
      const headerBox = await header.boundingBox();
      expect(headerBox?.height).toBe(90);
      expect(headerBox?.x).toBe(0);
      expect(headerBox?.y).toBe(0);
      expect(headerBox?.width).toBe(pageWidth);
      expect(
        await page
          .locator("footer")
          .evaluate((element) => getComputedStyle(element).borderRadius)
      ).toBe("32px 32px 0px 0px");
      const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
      const heroBox = await hero.boundingBox();
      expect(heroBox?.x).toBeGreaterThanOrEqual(40);
      expect(heroBox?.y).toBe(90);
      expect(heroBox?.height).toBeGreaterThanOrEqual(400);
      expect(heroBox?.height).toBeLessThanOrEqual(440);
      expect(heroBox?.width).toBeLessThanOrEqual(1320);
      expect((heroBox?.x ?? 0) + (heroBox?.width ?? 0)).toBeLessThanOrEqual(
        pageWidth - 40
      );
      const navBox = await header.locator(".dealer-desktop-nav").boundingBox();
      expect(navBox?.x).toBe(heroBox?.x);
      expect(navBox?.width).toBe(heroBox?.width);
      expect((headerBox?.y ?? 0) + (headerBox?.height ?? 0)).toBe(heroBox?.y);
      expect(
        await header.evaluate(
          (element) => getComputedStyle(element).borderRadius
        )
      ).toBe("0px");
      expect(
        await hero.evaluate((element) => getComputedStyle(element).borderRadius)
      ).toBe("20px");
      const main = page.locator('[data-slot="marketplace-main"]');
      expect(
        await main.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        )
      ).toBe("rgb(255, 255, 255)");
      expect(
        await main.evaluate(
          (element) => getComputedStyle(element).backgroundImage
        )
      ).toBe("none");
      expect(
        await hero.evaluate(
          (element) => getComputedStyle(element).backgroundImage
        )
      ).toContain("desktop-boxcars/hero.jpg");
      const search = hero.locator("form");
      expect((await search.boundingBox())?.height).toBe(76);
      const stock = page.locator('[data-slot="home-stock-panel"]');
      const stockBox = await stock.boundingBox();
      expect(stockBox?.x).toBe(heroBox?.x);
      expect(stockBox?.width).toBe(heroBox?.width);
      expect(stockBox?.y).toBeGreaterThan(
        (heroBox?.y ?? 0) + (heroBox?.height ?? 0)
      );
      const stockGrid = page.locator('[data-slot="home-stock-grid"]');
      expect(
        await stockGrid.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length
        )
      ).toBe(width < 1200 ? 3 : 4);
      await expect(stockGrid.locator("article")).toHaveCount(8);
      const imageSizes = await stockGrid
        .locator("article img")
        .first()
        .evaluate((image) => {
          const img = image as HTMLImageElement;
          const entry = img.sizes.split(",").find((candidate) => {
            const size = candidate.trim();
            return (
              !size.startsWith("(") ||
              window.matchMedia(size.slice(0, size.indexOf(")") + 1)).matches
            );
          });
          const size = entry?.trim() ?? "0px";
          const length = size.startsWith("(")
            ? size.slice(size.indexOf(")") + 1).trim()
            : size;
          const probe = document.createElement("div");
          probe.style.cssText = `position:absolute;visibility:hidden;width:${length};`;
          document.body.appendChild(probe);
          const hintedWidth = probe.getBoundingClientRect().width;
          probe.remove();
          return {
            hintedWidth,
            renderedWidth: img.getBoundingClientRect().width,
          };
        });
      expect(
        Math.abs(imageSizes.hintedWidth - imageSizes.renderedWidth)
      ).toBeLessThanOrEqual(2);
      expect(
        (await stockGrid.locator("article").first().boundingBox())?.y
      ).toBeLessThan(800);
      if (width === 1440 && locale === "en") {
        expect((await search.boundingBox())?.width).toBe(1090);
        expect(
          await hero
            .locator("h1")
            .evaluate((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
          // The OS gutter slightly trims the width used by responsive vw type.
        ).toBeCloseTo(52, 0);
      }
      for (const path of [
        "/cars",
        "/sell",
        "/lease",
        "/imports",
        "/contact",
        "/about",
        "/guides",
        "/legal/terms",
      ]) {
        await page.goto(`/${locale}${path}`);
        await expect(
          page.locator('[data-slot="public-route-loading-content"]')
        ).toBeHidden();
        await expect(
          page.locator(desktopHeroSelector).locator("h1").first()
        ).toBeVisible();
        expect(await header.boundingBox()).toEqual(headerBox);
        if (path === "/cars") {
          const inventoryHero = page.locator(
            '[data-slot="dealer-desktop-context-hero"][data-variant="inventory"]'
          );
          const inventoryHeroBox = await inventoryHero.boundingBox();
          expect(inventoryHeroBox?.x).toBe(heroBox?.x);
          expect(inventoryHeroBox?.width).toBe(heroBox?.width);
          expect(inventoryHeroBox?.height).toBeLessThan(heroBox?.height ?? 0);
          expect(
            await inventoryHero.evaluate(
              (element) => getComputedStyle(element).backgroundImage
            )
          ).toContain("desktop-boxcars/hero.jpg");
          const panel = await page
            .locator('[data-slot="dealer-inventory-panel"]:visible')
            .boundingBox();
          expect(panel?.x).toBe(heroBox?.x);
          expect(panel?.width).toBe(heroBox?.width);
          expect(panel?.y).toBeGreaterThan(
            (inventoryHeroBox?.y ?? 0) + (inventoryHeroBox?.height ?? 0)
          );
          const layout = page.locator('[data-slot="dealer-inventory-filters"]');
          await expect(layout).toHaveAttribute("data-filter-layout", "quick");
          const grid = page.locator('[data-slot="marketplace-listing-grid"]');
          expect(
            await grid.evaluate(
              (element) =>
                getComputedStyle(element).gridTemplateColumns.split(" ").length
            )
          ).toBe(width < 1280 ? 3 : 4);
          await selectInventoryFilterLayout(page, "sidebar", locale);
          const sidebar = await page
            .locator('[data-slot="dealer-inventory-sidebar"]')
            .boundingBox();
          const gridBox = await grid.boundingBox();
          expect(sidebar?.width).toBe(width < 1280 ? 240 : 280);
          expect(gridBox?.x).toBeGreaterThan(
            (sidebar?.x ?? 0) + (sidebar?.width ?? 0)
          );
          expect(
            await grid.evaluate(
              (element) =>
                getComputedStyle(element).gridTemplateColumns.split(" ").length
            )
          ).toBe(width < 1280 ? 2 : 3);
          if (width === 1440) {
            expect(sidebar?.x).toBe((panel?.x ?? 0) + 24);
            expect(sidebar?.y).toBe((panel?.y ?? 0) + 24);
            expect(sidebar?.y).toBe(gridBox?.y);
          }
          await selectInventoryFilterLayout(page, "quick", locale);
        }
        if (path === "/about" || path === "/contact") {
          const banner = page.locator(
            '[data-slot="dealer-desktop-context-hero"][data-appearance="photo"] [data-slot="dealer-desktop-hero-banner"]'
          );
          const bannerBox = await banner.boundingBox();
          expect(bannerBox?.x).toBe(heroBox?.x);
          expect(bannerBox?.width).toBe(heroBox?.width);
          expect(bannerBox?.height).toBe(224);
          expect(
            await banner.evaluate(
              (element) => getComputedStyle(element).backgroundImage
            )
          ).toContain("desktop-boxcars/hero.jpg");
          const contentLabel =
            path === "/about"
              ? {
                  bg: "Илюстративна галерия на автосалон",
                  en: "Illustrative showroom gallery",
                }
              : { bg: "Карта на автосалона", en: "Showroom map" };
          const contentBox = await page
            .getByRole("region", { name: contentLabel[locale], exact: true })
            .boundingBox();
          expect(contentBox?.x).toBe(heroBox?.x);
          expect(contentBox?.width).toBe(heroBox?.width);
          expect(contentBox?.y).toBe(
            (bannerBox?.y ?? 0) + (bannerBox?.height ?? 0) + 40
          );
          if (path === "/about") {
            const gallery = page.getByRole("region", {
              name: contentLabel[locale],
              exact: true,
            });
            await expect(gallery.locator("figure")).toHaveCount(4);
            const photos = await gallery
              .locator("figure")
              .evaluateAll((figures) =>
                figures.map((figure) => {
                  const { x, y, width, height } =
                    figure.getBoundingClientRect();
                  return { x, y, width, height };
                })
              );
            for (const [index, photo] of photos.entries()) {
              expect(photo.y).toBe(photos[0]?.y);
              expect(photo.width).toBe(photos[0]?.width);
              expect(photo.height).toBe(photos[0]?.height);
              expect(photo.width / photo.height).toBeCloseTo(1.5, 3);
              if (index > 0) {
                const previous = photos[index - 1];
                expect(photo.x).toBeGreaterThan(
                  (previous?.x ?? 0) + (previous?.width ?? 0)
                );
              }
            }
            await expect(
              page.locator('[data-slot="about-benefits"]').getByRole("listitem")
            ).toHaveCount(4);
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true);
      }
    });
  }
}

test("desktop navigation keeps the header stable through loading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await expect(
    page.locator('[data-slot="public-route-loading-content"]')
  ).toBeHidden();
  const header = page.locator('[data-slot="dealer-desktop-header"]:visible');
  await expect(header).toBeVisible();
  await expect(
    page.locator(
      '[data-slot="dealer-desktop-toolbar"] [data-slot="desktop-search-query"] input'
    )
  ).toBeEnabled();
  const initial = await header.boundingBox();
  let documents = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documents += 1;
    }
  });
  for (const [mode, title] of [
    ["buy", "Cars for sale"],
    ["about", "About Modern"],
    ["contact", "Contact us"],
    ["home", "Find Your Perfect Car"],
  ]) {
    await header.locator(`[data-marketplace-mode="${mode}"]`).click();
    await expect(
      page.locator(desktopHeroSelector).locator("h1").first()
    ).toHaveText(title);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    expect(await header.boundingBox()).toEqual(initial);
  }
  for (const [path, title] of [
    ["sell", "Sell us your vehicle"],
    ["lease", "Vehicle financing"],
    ["imports", "Import a vehicle"],
  ]) {
    await page.locator(`footer a[href="/en/${path}"]`).click();
    await expect(
      page.locator(desktopHeroSelector).locator("h1").first()
    ).toHaveText(title);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    expect(await header.boundingBox()).toEqual(initial);
  }
  expect(documents).toBe(0);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cars.prompt.v1", "dismissed");
  });
});

test("home search and inventory sidebar apply drafts without losing filters", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en");
    const home = page.locator('[data-slot="dealer-desktop-toolbar"]:visible');
    for (const slot of ["category", "make", "model", "price"]) {
      await expect(
        home.locator(`[data-slot="desktop-hero-${slot}"]`)
      ).toBeVisible();
    }
    for (const slot of ["year", "mileage"]) {
      await expect(
        home.locator(`[data-slot="desktop-hero-${slot}"]`)
      ).toBeHidden();
    }
    await home.locator('[data-slot="desktop-hero-price"]').click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Up to 40,000 BGN", exact: true })
      .click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    expect(new URL(page.url()).pathname).toBe("/en");
    await home.locator('[data-slot="desktop-hero-submit"]').click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/en/cars");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("priceMax"))
      .toBe("40000");
    await selectInventoryFilterLayout(page, "sidebar");
    const sidebar = page.locator('[data-slot="dealer-inventory-sidebar"]');
    for (const slot of [
      "category",
      "make",
      "model",
      "price",
      "year",
      "mileage",
    ]) {
      await expect(
        sidebar.locator(`[data-slot="desktop-hero-${slot}"]`)
      ).toBeVisible();
    }
    await sidebar.getByRole("button", { name: moreFiltersPattern }).click();
    await sidebar.locator('[data-slot="desktop-hero-fuel"]').click();
    await dialog.getByRole("button", { name: "Diesel", exact: true }).click();
    await dialog.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page).not.toHaveURL(fuelQueryPattern);
    await sidebar.locator('[data-slot="desktop-hero-submit"]').click();
    await expect(page).toHaveURL(dieselResultsPattern);
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("40000");
    await sidebar.getByRole("button", { name: "Reset", exact: true }).click();
    await sidebar.locator('[data-slot="desktop-hero-submit"]').click();
    await expect(page).not.toHaveURL(fuelQueryPattern);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("priceMax"))
      .toBeNull();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
  }
});

test("desktop listing keeps the gallery, information and phone handoff usable", async ({
  page,
}) => {
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en/listing/bmw-x5-m50d-sofia-2020");
    const title = page.locator('[data-slot="listing-title-panel"]:visible');
    const gallery = page.locator('[data-slot="listing-gallery"]:visible');
    const transaction = page.locator(
      '[data-slot="listing-transaction-card"]:visible'
    );
    await expect(title.getByRole("heading", { level: 1 })).toHaveText(
      "2020 BMW X5 M50d"
    );
    const titleBox = await title.boundingBox();
    const galleryBox = await gallery.boundingBox();
    const transactionBox = await transaction.boundingBox();
    const purchaseBox = await page
      .locator('[data-slot="listing-purchase-column"]:visible')
      .boundingBox();
    if (!(titleBox && galleryBox && transactionBox)) {
      throw new Error("Desktop vehicle information must be visible");
    }
    expect(titleBox.y + titleBox.height).toBeLessThan(galleryBox.y);
    expect(transactionBox.y).toBe(titleBox.y);
    expect(transactionBox.y - (purchaseBox?.y ?? 0)).toBe(60);
    expect(titleBox.x + titleBox.width).toBeLessThan(transactionBox.x);
    expect(transactionBox.x).toBeGreaterThan(galleryBox.x + galleryBox.width);
    await expect(transaction.locator('a[href^="tel:"]')).toBeVisible();
    const openPhoto = gallery.getByRole("button", {
      name: "Open photo 1 of 1 full screen",
      exact: true,
    });
    await openPhoto.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(openPhoto).toBeFocused();
    const sections = page.locator(
      '[data-slot="listing-details-sections-desktop"]:visible'
    );
    for (const slot of [
      "information",
      "description",
      "specifications",
      "equipment",
    ]) {
      await expect(
        sections.locator(`[data-slot="listing-${slot}"]`)
      ).toBeVisible();
    }
    const relatedSave = page
      .locator(
        '[data-slot="listing-related"] [data-slot="desktop-save-car"]:visible'
      )
      .first();
    const previouslySaved = await relatedSave.getAttribute("aria-pressed");
    await relatedSave.click();
    await expect(relatedSave).toHaveAttribute(
      "aria-pressed",
      previouslySaved === "true" ? "false" : "true"
    );
  }
});

test("financing selection and preferences survive navigation and clearing", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/lease");
  const selector = page.locator(
    '[data-slot="lease-desktop-vehicle-trigger"]:visible'
  );
  await expect(selector).toHaveAttribute("data-selected", "false");
  await expect(
    page.locator('[data-slot="finance-actions"] button')
  ).toBeDisabled();
  await selector.click();
  const dialog = page.getByRole("dialog");
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("no-such-car-xyz");
  await expect(
    dialog.getByText("No vehicles found. Try another make or model.")
  ).toBeVisible();
  await search.fill("BMW X5");
  await dialog
    .locator('[data-slot="lease-vehicle-option"] button')
    .first()
    .click();
  await expect(dialog).toBeHidden();
  await expect(selector).toBeFocused();
  await expect(selector).toHaveAttribute("data-selected", "true");
  await expect(
    page.getByRole("link", { name: "View vehicle", exact: true })
  ).toHaveCount(0);
  await selector.click();
  await expect(search).toHaveValue("");
  await expect(dialog.locator('[data-vehicle-selected="true"]')).toHaveCount(1);
  const selectedTitle = await dialog
    .locator('[data-slot="lease-selected-vehicle-title"]')
    .nth(1)
    .getAttribute("title");
  await dialog
    .locator('[data-slot="lease-vehicle-option"] button')
    .nth(1)
    .click();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  const deposit = page.locator('[name="desktop-finance-deposit"][value="30"]');
  const term = page.locator('[name="desktop-finance-term"][value="36"]');
  const principal = page.locator('[data-slot="finance-principal"]');
  const initialPrincipal = await principal.textContent();
  await deposit.check();
  await expect(principal).not.toHaveText(initialPrincipal ?? "");
  const updatedPrincipal = await principal.textContent();
  await term.check();
  await expect(principal).toHaveText(updatedPrincipal ?? "");
  await page
    .locator(
      '[data-slot="dealer-desktop-header"] [data-marketplace-mode="home"]'
    )
    .click();
  await expect(page.locator("#desktop-home-title")).toBeVisible();
  await page.goBack();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  await expect(deposit).toBeChecked();
  await expect(term).toBeChecked();
  await page.reload();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  await expect(term).toBeChecked();
  const flexible = page.locator(
    '[name="desktop-finance-deposit"][value="flexible"]'
  );
  await flexible.check();
  await expect(principal).toHaveText("To be agreed");
  await page.reload();
  await expect(flexible).toBeChecked();
  await expect(page.locator('[data-slot="finance-actions"] a')).toHaveAttribute(
    "href",
    phonePattern
  );
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect(selector).toHaveAttribute("data-selected", "false");
  await expect(selector).toBeFocused();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(principal).toHaveText("—");
  await expect(
    page.locator('[data-slot="finance-actions"] button')
  ).toBeDisabled();
  await expect(page).not.toHaveURL(vehicleQueryPattern);
  await expect(flexible).toBeChecked();
  await expect(term).toBeChecked();
  await page.reload();
  await expect(
    page.locator('[data-slot="public-route-loading-content"]')
  ).toBeHidden();
  await expect(selector).toHaveAttribute("data-selected", "false");
});

test("desktop import has one focus treatment and carries the listing into the request", async ({
  page,
}) => {
  await page.goto("/en/imports");
  const input = page.locator('search input[name="sourceUrl"]:visible');
  await input.click();
  const focus = await input.evaluate((element) => {
    const field = element as HTMLInputElement;
    const fieldStyle = getComputedStyle(field);
    if (!field.form) {
      throw new Error("Import link input must belong to a form");
    }
    const formStyle = getComputedStyle(field.form);
    return {
      fieldOutline: fieldStyle.outlineStyle,
      formOutline: formStyle.outlineStyle,
      formColor: formStyle.outlineColor,
    };
  });
  expect(focus.fieldOutline).toBe("none");
  expect(focus.formOutline).toBe("solid");
  expect(focus.formColor).not.toBe("rgb(17, 117, 222)");
  const sourceUrl = "https://example.com/vehicles/test-car";
  await input.fill(sourceUrl);
  await page
    .locator("search:visible")
    .getByRole("button", { name: "Request a quote" })
    .click();
  await expect(page).toHaveURL(sourceQueryPattern);
  await expect(page.locator("#import-request")).toBeVisible();
  await expect(
    page.locator('#import-request input[name="sourceUrl"]')
  ).toHaveValue(sourceUrl);
});
