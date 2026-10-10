import { expect, test } from "@playwright/test";
import { selectInventoryFilterLayout } from "../fixtures/inventory-preview";
import { dismissModernWelcome } from "../fixtures/modern-session.setup";

const dieselResultsPattern = /\/en\/cars\?.*fuel=diesel/;
const fuelQueryPattern = /fuel=/;
const phonePattern = /^tel:/;
const sourceQueryPattern = /sourceUrl=/;
const vehicleQueryPattern = /[?&]vehicle=/;
const moreFiltersPattern = /More filters/;
const desktopHeroSelector =
  '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"]';

for (const width of [1024, 1280, 1440, 1920]) {
  for (const locale of ["en", "bg"] as const) {
    test(`desktop keeps the Home 10 frame and stock visible below its search (${locale}, ${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${locale}`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      const pageWidth = await page
        .locator("body")
        .evaluate((element) => element.getBoundingClientRect().width);
      const header = page.locator(
        '[data-slot="dealer-desktop-header"]:visible'
      );
      await expect(header).toBeVisible();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      await expect
        .poll(async () => (await header.boundingBox())?.height)
        .toBe(90);
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
      expect(heroBox?.height).toBe(352);
      expect(heroBox?.width).toBeLessThanOrEqual(1400);
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
      ).toContain("linear-gradient");
      await expect(hero).toHaveAttribute("data-appearance", "vehicles");
      await expect(
        hero.getByText(
          locale === "bg"
            ? "Разгледайте наличните автомобили и уговорете оглед."
            : "Browse available cars and arrange a viewing.",
          { exact: true }
        )
      ).toHaveCount(0);
      const vehicleScene = hero.locator(
        '[data-slot="dealer-desktop-hero-vehicles"]'
      );
      if (width < 1200) {
        await expect(vehicleScene).toBeHidden();
      } else {
        await expect(vehicleScene).toBeVisible();
        await expect
          .poll(() =>
            vehicleScene
              .locator("img")
              .evaluateAll((images) =>
                images.every(
                  (image) => (image as HTMLImageElement).naturalWidth === 1000
                )
              )
          )
          .toBe(true);
      }
      const search = hero.locator("form");
      const searchBox = await search.boundingBox();
      const headingBox = await hero.locator("h1").boundingBox();
      expect(searchBox?.height).toBe(64);
      expect(searchBox?.y).toBe(240);
      expect(headingBox?.y).toBe(168);
      expect(headingBox?.height).toBe(48);
      const searchButton = hero.getByRole("button", {
        name: locale === "bg" ? "Търси" : "Search",
        exact: true,
      });
      const searchButtonBox = await searchButton.boundingBox();
      expect(searchButtonBox?.width).toBe(48);
      expect(searchButtonBox?.height).toBe(48);
      await expect(searchButton.locator("span")).toBeHidden();
      const vehicleBoxes = await vehicleScene
        .locator("picture")
        .evaluateAll((pictures) =>
          pictures.map((picture) => {
            const { x, y, width, height } = picture.getBoundingClientRect();
            return { x, y, width, height };
          })
        );
      const types = hero.locator('[data-slot="desktop-home-types"]');
      await expect(types.getByRole("button")).toHaveCount(4);
      const typesBox = await types.boundingBox();
      expect(typesBox?.y).toBeGreaterThanOrEqual(
        ((await search.boundingBox())?.y ?? 0) + 64 + 20
      );
      expect((typesBox?.y ?? 0) + (typesBox?.height ?? 0)).toBeLessThanOrEqual(
        (heroBox?.y ?? 0) + 352 - 32
      );
      const stock = page.locator('[data-slot="home-stock-panel"]');
      const stockBox = await stock.boundingBox();
      expect(stockBox?.x).toBe(heroBox?.x);
      expect(stockBox?.width).toBe(heroBox?.width);
      expect(stockBox?.y).toBeGreaterThan(
        (heroBox?.y ?? 0) + (heroBox?.height ?? 0)
      );
      const stockGrid = page.locator('[data-slot="home-stock-grid"]');
      const stockColumns = width >= 1400 ? 5 : 4;
      const stockColumnCount = width < 1200 ? 2 : stockColumns;
      expect(
        await stockGrid.evaluate(
          (element) =>
            getComputedStyle(element).gridTemplateColumns.split(" ").length
        )
      ).toBe(stockColumnCount);
      await expect(stockGrid.locator("article:visible")).toHaveCount(
        width >= 1400 ? 5 : 4
      );
      const stockActionBox = await stock
        .getByRole("link", {
          name: locale === "bg" ? "Виж всички автомобили" : "View all cars",
        })
        .boundingBox();
      const stockGridBox = await stockGrid.boundingBox();
      expect(stockGridBox?.x).toBe((stockBox?.x ?? 0) + 24);
      expect(stockGridBox?.width).toBe((stockBox?.width ?? 0) - 48);
      expect(stockActionBox?.y).toBeGreaterThanOrEqual(
        (stockGridBox?.y ?? 0) + (stockGridBox?.height ?? 0) + 20
      );
      expect(
        Math.abs(
          (stockActionBox?.x ?? 0) +
            (stockActionBox?.width ?? 0) / 2 -
            (stockBox?.x ?? 0) -
            (stockBox?.width ?? 0) / 2
        )
      ).toBeLessThan(1);
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
        // Image hints use viewport units; the grid also reserves the OS gutter.
      ).toBeLessThanOrEqual(2 + (width - pageWidth) / stockColumnCount);
      expect(
        (await stockGrid.locator("article").first().boundingBox())?.y
      ).toBeLessThan(800);
      if (width === 1440 && locale === "en") {
        expect(searchBox?.width).toBe(900);
        expect(
          await hero
            .locator("h1")
            .evaluate((element) =>
              Number.parseFloat(getComputedStyle(element).fontSize)
            )
          // The OS gutter slightly trims the width used by responsive vw type.
        ).toBe(40);
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
        const sharedBanner = page.locator(
          path === "/cars"
            ? '[data-slot="dealer-desktop-context-hero"][data-variant="inventory"]'
            : '[data-slot="dealer-desktop-hero-banner"]'
        );
        const sharedBannerBox = await sharedBanner.boundingBox();
        expect(sharedBannerBox?.x).toBe(heroBox?.x);
        expect(sharedBannerBox?.width).toBe(heroBox?.width);
        expect(sharedBannerBox?.height).toBe(352);
        if (path === "/cars") {
          const inventoryHero = page.locator(
            '[data-slot="dealer-desktop-context-hero"][data-variant="inventory"]'
          );
          const inventoryHeroBox = await inventoryHero.boundingBox();
          expect(inventoryHeroBox?.x).toBe(heroBox?.x);
          expect(inventoryHeroBox?.width).toBe(heroBox?.width);
          expect(inventoryHeroBox?.height).toBe(heroBox?.height);
          const inventorySearchBox = await inventoryHero
            .getByRole("group", {
              name:
                locale === "bg"
                  ? "Търсене на превозни средства"
                  : "Vehicle search",
              exact: true,
            })
            .boundingBox();
          expect(inventorySearchBox).toEqual(searchBox);
          expect(await inventoryHero.locator("h1").boundingBox()).toEqual(
            headingBox
          );
          const inventorySearchButton = inventoryHero.getByRole("button", {
            name: locale === "bg" ? "Търси" : "Search",
            exact: true,
          });
          const inventorySearchButtonBox =
            await inventorySearchButton.boundingBox();
          expect(inventorySearchButtonBox?.width).toBe(searchButtonBox?.width);
          expect(inventorySearchButtonBox?.height).toBe(
            searchButtonBox?.height
          );
          expect(inventorySearchButtonBox?.y).toBe(searchButtonBox?.y);
          // WebKit distributes a fraction of a pixel across the field columns.
          expect(inventorySearchButtonBox?.x).toBeCloseTo(
            searchButtonBox?.x ?? 0,
            1
          );
          await expect(inventorySearchButton).toHaveText("");
          expect(
            await inventoryHero.locator("picture").evaluateAll((pictures) =>
              pictures.map((picture) => {
                const { x, y, width, height } = picture.getBoundingClientRect();
                return { x, y, width, height };
              })
            )
          ).toEqual(vehicleBoxes);
          expect(
            await inventoryHero.evaluate(
              (element) => getComputedStyle(element).backgroundImage
            )
          ).toContain("linear-gradient");
          await expect(inventoryHero).toHaveAttribute(
            "data-appearance",
            "vehicles"
          );
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
            const filterBar = await layout.boundingBox();
            expect(sidebar?.y).toBe(
              (filterBar?.y ?? 0) + (filterBar?.height ?? 0) + 24
            );
            expect(sidebar?.y).toBe(gridBox?.y);
          }
          await selectInventoryFilterLayout(page, "quick", locale);
        }
        if (path === "/about" || path === "/contact") {
          const banner = page.locator(
            '[data-slot="dealer-desktop-context-hero"][data-appearance="neutral"] [data-slot="dealer-desktop-hero-banner"]'
          );
          const bannerBox = await banner.boundingBox();
          expect(bannerBox?.x).toBe(heroBox?.x);
          expect(bannerBox?.width).toBe(heroBox?.width);
          expect(bannerBox?.height).toBe(352);
          expect(
            await banner.evaluate(
              (element) => getComputedStyle(element).backgroundImage
            )
          ).toContain("images/desktop/showroom-editorial-v1.webp");
          expect(
            await banner.evaluate(
              (element) => getComputedStyle(element).backgroundColor
            )
          ).toBe("rgb(237, 237, 237)");
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
              page.locator('[data-slot="about-benefits"]')
            ).toHaveCount(0);
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

test("desktop loading hero matches the finished Home search frame", async ({
  page,
}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en");
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    const home = page.locator('[data-slot="dealer-desktop-home-hero"]:visible');
    const heroBox = await home.boundingBox();
    const headingBox = await home.locator("h1").boundingBox();
    const searchBox = await home.locator("form").boundingBox();

    // Freeze the real streamed server fallback before React replaces it.
    const response = await page.request.get("/en");
    const shell = (await response.text()).replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/g,
      ""
    );
    expect(shell).toContain('data-slot="dealer-desktop-loading"');
    await page.route("**/en", (route) =>
      route.fulfill({ body: shell, contentType: "text/html", status: 200 })
    );
    try {
      await page.reload();
      const loading = page.locator(
        '[data-slot="dealer-desktop-home-hero"][data-loading="true"]:visible'
      );
      await expect(loading).toBeVisible();
      expect(await loading.boundingBox()).toEqual(heroBox);
      expect((await loading.locator("h1").boundingBox())?.y).toBe(
        headingBox?.y
      );
      expect(
        await loading.locator("[data-desktop-action-panel]").boundingBox()
      ).toEqual(searchBox);
    } finally {
      await page.unroute("**/en");
    }
  }
});

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

for (const locale of ["bg", "en"]) {
  test(`home vehicle pills keep the search draft and route to the selected type (${locale})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const [category, path] of [
      ["car", "cars"],
      ["motorbike", "motorbikes"],
      ["van", "vans"],
      ["truck", "trucks"],
    ]) {
      await page.goto(`/${locale}`);
      await expect(
        page.locator('[data-slot="public-route-loading-content"]')
      ).toBeHidden();
      const hero = page.locator(
        '[data-slot="dealer-desktop-home-hero"]:visible'
      );
      const make = hero.locator('[data-slot="desktop-hero-make"]');
      const applyLabel = locale === "bg" ? "Приложи" : "Apply";
      const dialog = page.getByRole("dialog");
      await make.focus();
      await page.keyboard.press("Enter");
      await dialog.getByRole("button", { name: "BMW", exact: true }).click();
      await dialog
        .getByRole("button", { name: applyLabel, exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expect(make).toBeFocused();
      await expect(make).toContainText("BMW");
      const price = hero.locator('[data-slot="desktop-hero-price"]');
      await price.focus();
      await page.keyboard.press("Enter");
      await dialog
        .getByRole("button", {
          name: locale === "bg" ? "До 40 000 лв." : "Up to 40,000 BGN",
          exact: true,
        })
        .click();
      await dialog
        .getByRole("button", { name: applyLabel, exact: true })
        .click();
      await expect(dialog).toBeHidden();
      await expect(price).toBeFocused();
      const pills = hero.locator('[data-slot="desktop-home-types"]');
      const selected = pills.locator(`[data-category="${category}"]`);
      await selected.focus();
      await expect(selected).toBeFocused();
      await page.keyboard.press("Space");
      await expect(selected).toHaveAttribute("aria-pressed", "true");
      await expect(pills.locator('[aria-pressed="true"]')).toHaveCount(1);
      await expect(make).not.toContainText("BMW");
      expect(new URL(page.url()).pathname).toBe(`/${locale}`);
      await make.focus();
      await page.keyboard.press("Enter");
      // This demo supplies passenger-car taxonomy and no stock in the other types.
      await expect(
        dialog.getByRole("button", { name: "Audi", exact: true })
      ).toHaveCount(category === "car" ? 1 : 0);
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await hero.locator('[data-slot="desktop-hero-submit"]').click();
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toBe(`/${locale}/${path}`);
      const query = new URL(page.url()).searchParams;
      expect(query.get("priceMax")).toBe("40000");
      expect(query.get("make")).toBeNull();
      expect(query.get("model")).toBeNull();
    }
  });
}

test("home search and inventory sidebar apply drafts without losing filters", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en");
    const home = page.locator('[data-slot="dealer-desktop-toolbar"]:visible');
    for (const slot of ["make", "model", "price"]) {
      await expect(
        home.locator(`[data-slot="desktop-hero-${slot}"]`)
      ).toBeVisible();
    }
    for (const slot of ["category", "year", "mileage"]) {
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
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await dismissModernWelcome(context.request, baseURL, "en");
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
  const dialog = page.locator('[data-slot="lease-desktop-vehicle-dialog"]');
  const search = dialog.getByRole("searchbox");
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement))
    )
    .toBe(true);
  await page.keyboard.press("Tab");
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

test("explicit flexible financing preferences survive the mobile to desktop transition", async ({
  page,
  context,
  baseURL,
}) => {
  await dismissModernWelcome(context.request, baseURL, "en");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/en/lease?vehicle=am-1001&deposit=30&term=36");
  const mobile = page.locator('[data-slot="lease-mobile-experience"]');
  await mobile
    .getByRole("button", { name: "Deposit: 30%", exact: true })
    .click();
  const preferences = page.locator('[data-slot="lease-preference-picker"]');
  await preferences
    .getByRole("button", { name: "To be discussed", exact: true })
    .click();
  await expect(preferences).toBeHidden();
  await mobile
    .getByRole("button", { name: "Term:36mo., 36 months", exact: true })
    .click();
  await preferences
    .getByRole("button", { name: "To be discussed", exact: true })
    .click();
  await expect(preferences).toBeHidden();
  await expect
    .poll(() => {
      const params = new URL(page.url()).searchParams;
      return { deposit: params.get("deposit"), term: params.get("term") };
    })
    .toEqual({ deposit: "flexible", term: "flexible" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(
    page.locator('[name="desktop-finance-deposit"][value="flexible"]')
  ).toBeChecked();
  await expect(
    page.locator('[name="desktop-finance-term"][value="flexible"]')
  ).toBeChecked();
  await expect(page.locator('[data-slot="finance-principal"]')).toHaveText(
    "To be agreed"
  );
  await page.reload();
  await expect(
    page.locator('[name="desktop-finance-deposit"][value="flexible"]')
  ).toBeChecked();
  await expect(
    page.locator('[name="desktop-finance-term"][value="flexible"]')
  ).toBeChecked();
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
