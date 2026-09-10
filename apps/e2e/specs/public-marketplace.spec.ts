import { expect, test } from "@playwright/test";
import {
  collectPublicPageErrors,
  expectHealthyPublicPage,
} from "../fixtures/public-page-health";

const listingPathPattern = /\/listing\//;
const importerPromoPattern = /Find the importer|Намерете вносител/;
const sellNewPathPattern = /\/sell\/new$/;
const listingHeaderCardClassPattern = /bg-card/;
const subtleButtonClassPattern = /bg-control/;
const buyLabelPattern = /^Купи$/;
const localizedCarsPathPattern = /\/bg\/cars$/;
const quickFilterContrastClassPattern = /bg-control-hover/;
const marketplaceMastheadCanvasClassPattern = /bg-control\/70/;
const selectedMarketplaceModeClassPattern = /bg-white\/10/;
const inactiveMarketplaceModeClassPattern = /bg-transparent/;
const discoverySearchHeightClassPattern = /h-16/;
const resultsSearchHeightClassPattern = /h-16/;
const supportImageFallbackPattern =
  /Електромобил в център за доставка и логистика.*Изображението не е налично/;

test.describe("public marketplace", () => {
  test("buyer can discover inventory and open a listing", async ({
    page,
  }, testInfo) => {
    const errors = collectPublicPageErrors(page);

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main").last()).toBeVisible();
    await expect(page.getByText(importerPromoPattern)).toHaveCount(0);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true);

    const firstListingCard = page.locator("main article").first();
    await expect(firstListingCard).toBeVisible();
    await expect(
      firstListingCard
        .locator('[data-slot="vehicle-card-spec-pills"]')
        .filter({ visible: true })
    ).toBeVisible();
    const cardHierarchy = await firstListingCard.evaluate((card) => {
      const isRendered = (element: Element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };
      const title = [
        ...card.querySelectorAll('[data-slot="vehicle-card-title"]'),
      ].find(isRendered);
      const price = [
        ...card.querySelectorAll('[data-slot="vehicle-card-price"]'),
      ].find(isRendered);

      if (!(title && price)) {
        return {
          priceSize: 0,
          priceWeight: 0,
          titleLeads: false,
          titleSize: 0,
          titleWeight: 0,
        };
      }

      const titleRect = title.getBoundingClientRect();
      const priceRect = price.getBoundingClientRect();

      return {
        priceSize: Number.parseFloat(getComputedStyle(price).fontSize),
        priceWeight: Number.parseInt(getComputedStyle(price).fontWeight, 10),
        titleLeads:
          titleRect.top < priceRect.top - 2 ||
          (Math.abs(titleRect.top - priceRect.top) <= 4 &&
            titleRect.left < priceRect.left),
        titleSize: Number.parseFloat(getComputedStyle(title).fontSize),
        titleWeight: Number.parseInt(getComputedStyle(title).fontWeight, 10),
      };
    });
    expect(cardHierarchy.priceWeight).toBeGreaterThan(
      cardHierarchy.titleWeight
    );
    expect(cardHierarchy.titleLeads).toBe(true);
    const listingColumnCount = await firstListingCard.evaluate((card) => {
      const grid = card.parentElement;
      return grid
        ? getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
            .length
        : 0;
    });
    const initialViewport = page.viewportSize();
    const viewportWidth = initialViewport?.width ?? 1440;
    const expectedListingColumnCount =
      [640, 1024, 1360].filter(
        (columnBreakpoint) => viewportWidth >= columnBreakpoint
      ).length + 1;
    expect(listingColumnCount).toBe(expectedListingColumnCount);
    if (!testInfo.project.name.includes("mobile")) {
      const maximumQuickFilterGap = await page
        .locator('[data-slot="desktop-quick-filter-layout"]')
        .evaluate((layout) => {
          const styles = getComputedStyle(layout);
          return Math.max(
            Number.parseFloat(styles.columnGap),
            Number.parseFloat(styles.rowGap)
          );
        });
      expect(maximumQuickFilterGap).toBeLessThanOrEqual(8.5);

      if (testInfo.project.name === "public-desktop-chromium") {
        const desktopLayoutMetrics = await page.evaluate(() => {
          const getRect = (element: Element | undefined | null) => {
            const rect = element?.getBoundingClientRect();

            return rect
              ? {
                  bottom: rect.bottom,
                  height: rect.height,
                  left: rect.left,
                  right: rect.right,
                  top: rect.top,
                  width: rect.width,
                }
              : undefined;
          };
          const visibleSearchForm = Array.from(
            document.querySelectorAll("form")
          ).find(
            (form) =>
              form.getAttribute("data-slot") === "desktop-search-surface" &&
              form.getBoundingClientRect().width > 0
          );
          const desktopHeaderBand = document.querySelector(
            '[data-slot="desktop-marketplace-header-band"]'
          );
          const marketplaceMasthead = document.querySelector("main > header");
          const inventoryCanvas = document.querySelector("main");
          const dealerDirectoryAction = document.querySelector(
            '[data-slot="marketplace-dealer-action"]'
          );
          const firstUtilityAction = document.querySelector(
            '[data-slot="marketplace-utility-action"]'
          );
          const quickFilterBand = document.querySelector(
            '[data-slot="desktop-quick-filter-band"]'
          );
          const firstInactiveQuickFilter = document.querySelector(
            '[data-slot="desktop-quick-filter"][aria-pressed="false"]'
          );
          const quickFilterLayout = document.querySelector(
            '[data-slot="desktop-quick-filter-layout"]'
          );
          const desktopSearchCategory = document.querySelector(
            '[data-slot="desktop-search-category"]'
          );
          const searchSegments = [
            desktopSearchCategory,
            document.querySelector('[data-slot="desktop-search-query"]'),
            document.querySelector('[data-slot="desktop-search-action"]'),
          ].filter((segment): segment is Element => segment !== null);
          const quickFilters = Array.from(
            document.querySelectorAll('[data-slot="desktop-quick-filter"]')
          ).filter((filter) => filter.getBoundingClientRect().width > 0);
          const primaryControls = document.querySelectorAll(
            '[data-slot="desktop-primary-control"]'
          );
          const listingGrid =
            document.querySelector("main article")?.parentElement;
          const logo = document.querySelector(
            '[data-slot="marketplace-home-link"]'
          );
          const quickFilterWidths = quickFilters.map(
            (filter) => filter.getBoundingClientRect().width
          );
          const primaryControlWidths = Array.from(primaryControls).map(
            (control) => control.getBoundingClientRect().width
          );
          const truncatedQuickFilters = quickFilters
            .map((filter) => filter.querySelector("span"))
            .filter(
              (label): label is HTMLSpanElement =>
                label instanceof HTMLSpanElement &&
                label.scrollWidth > label.clientWidth + 0.5
            )
            .map((label) => label.textContent?.trim());
          const truncatedPrimaryControls = Array.from(primaryControls)
            .map((control) => control.querySelector("span"))
            .filter(
              (label): label is HTMLSpanElement =>
                label instanceof HTMLSpanElement &&
                label.scrollWidth > label.clientWidth + 0.5
            )
            .map((label) => label.textContent?.trim());
          const visibleResultHeadingCount = Array.from(
            document.querySelectorAll("main h1")
          ).filter((heading) => {
            const rect = heading.getBoundingClientRect();
            return rect.width > 2 && rect.height > 2;
          }).length;

          return {
            frameRects: {
              headerBand: getRect(desktopHeaderBand),
              grid: getRect(listingGrid),
              logo: getRect(logo),
              quickFilters: getRect(quickFilterLayout),
              search: getRect(visibleSearchForm),
            },
            headerBandBackgroundColor: desktopHeaderBand
              ? getComputedStyle(desktopHeaderBand).backgroundColor
              : undefined,
            inventoryCanvasBackgroundColor: inventoryCanvas
              ? getComputedStyle(inventoryCanvas).backgroundColor
              : undefined,
            dealerDirectoryActionBackgroundColor: dealerDirectoryAction
              ? getComputedStyle(dealerDirectoryAction).backgroundColor
              : undefined,
            firstUtilityActionBackgroundColor: firstUtilityAction
              ? getComputedStyle(firstUtilityAction).backgroundColor
              : undefined,
            mastheadBackgroundColor: marketplaceMasthead
              ? getComputedStyle(marketplaceMasthead).backgroundColor
              : undefined,
            primaryControlWidths,
            quickFilterWidths,
            quickFilterBackgroundColor: firstInactiveQuickFilter
              ? getComputedStyle(firstInactiveQuickFilter).backgroundColor
              : undefined,
            quickFilterBandBackgroundColor: quickFilterBand
              ? getComputedStyle(quickFilterBand).backgroundColor
              : undefined,
            searchBackgroundColor: visibleSearchForm
              ? getComputedStyle(visibleSearchForm).backgroundColor
              : undefined,
            searchBoxShadow: visibleSearchForm
              ? getComputedStyle(visibleSearchForm).boxShadow
              : undefined,
            searchClassName: visibleSearchForm?.className,
            searchCategoryBackgroundColor: desktopSearchCategory
              ? getComputedStyle(desktopSearchCategory).backgroundColor
              : undefined,
            searchSegmentBorderLeftWidths: searchSegments.map(
              (segment) => getComputedStyle(segment).borderLeftWidth
            ),
            searchSegmentRadii: searchSegments.map((segment) =>
              Number.parseFloat(getComputedStyle(segment).borderRadius)
            ),
            truncatedQuickFilters,
            truncatedPrimaryControls,
            visibleResultHeadingCount,
          };
        });
        const frameLeftEdges = Object.values({
          grid: desktopLayoutMetrics.frameRects.grid,
          logo: desktopLayoutMetrics.frameRects.logo,
          quickFilters: desktopLayoutMetrics.frameRects.quickFilters,
        }).flatMap((rect) => (rect ? [rect.left] : []));
        const frameRightEdges = [
          desktopLayoutMetrics.frameRects.grid?.right,
          desktopLayoutMetrics.frameRects.quickFilters?.right,
        ].filter((edge): edge is number => edge !== undefined);
        const widthSpread = (widths: number[]) =>
          Math.max(...widths) - Math.min(...widths);

        expect(widthSpread(frameLeftEdges)).toBeLessThanOrEqual(0.75);
        expect(widthSpread(frameRightEdges)).toBeLessThanOrEqual(0.75);
        expect(desktopLayoutMetrics.quickFilterWidths).toHaveLength(4);
        expect(desktopLayoutMetrics.primaryControlWidths).toHaveLength(1);
        await expect(
          page
            .locator('[data-slot="desktop-quick-filter"][aria-pressed="false"]')
            .first()
        ).toHaveClass(quickFilterContrastClassPattern);
        expect(desktopLayoutMetrics.truncatedQuickFilters).toEqual([]);
        expect(desktopLayoutMetrics.truncatedPrimaryControls).toEqual([]);
        expect(desktopLayoutMetrics.visibleResultHeadingCount).toBe(1);
        expect(desktopLayoutMetrics.headerBandBackgroundColor).toBe(
          desktopLayoutMetrics.mastheadBackgroundColor
        );
        expect(desktopLayoutMetrics.searchBackgroundColor).not.toBe(
          desktopLayoutMetrics.mastheadBackgroundColor
        );
        expect(desktopLayoutMetrics.quickFilterBandBackgroundColor).toBe(
          desktopLayoutMetrics.mastheadBackgroundColor
        );
        expect(desktopLayoutMetrics.quickFilterBackgroundColor).toBe(
          desktopLayoutMetrics.searchBackgroundColor
        );
        expect(desktopLayoutMetrics.quickFilterBackgroundColor).not.toBe(
          desktopLayoutMetrics.mastheadBackgroundColor
        );
        expect(desktopLayoutMetrics.inventoryCanvasBackgroundColor).not.toBe(
          desktopLayoutMetrics.mastheadBackgroundColor
        );
        expect(desktopLayoutMetrics.dealerDirectoryActionBackgroundColor).toBe(
          desktopLayoutMetrics.firstUtilityActionBackgroundColor
        );
        expect(
          desktopLayoutMetrics.dealerDirectoryActionBackgroundColor
        ).not.toBe(desktopLayoutMetrics.mastheadBackgroundColor);
        expect(desktopLayoutMetrics.searchBoxShadow).not.toBe("none");
        expect(desktopLayoutMetrics.searchClassName).toContain(
          "focus-within:shadow"
        );
        expect(desktopLayoutMetrics.searchCategoryBackgroundColor).not.toBe(
          desktopLayoutMetrics.searchBackgroundColor
        );
        expect(desktopLayoutMetrics.searchSegmentBorderLeftWidths).toEqual([
          "0px",
          "0px",
          "0px",
        ]);
        for (const radius of desktopLayoutMetrics.searchSegmentRadii) {
          expect(radius).toBeGreaterThanOrEqual(12);
        }
        const desktopCategorySegment = page.locator(
          '[data-slot="desktop-search-category"]'
        );
        await desktopCategorySegment.hover();
        await expect
          .poll(() =>
            desktopCategorySegment.evaluate(
              (segment) => getComputedStyle(segment).backgroundColor
            )
          )
          .not.toBe(desktopLayoutMetrics.searchCategoryBackgroundColor);
        const desktopSearchQuery = page.locator(
          '[data-slot="desktop-search-query"] input'
        );
        await desktopSearchQuery.focus();
        await expect(desktopSearchQuery).toBeFocused();
        await expect
          .poll(() =>
            page
              .locator('[data-slot="desktop-search-surface"]')
              .evaluate((search) => getComputedStyle(search).boxShadow)
          )
          .not.toBe(desktopLayoutMetrics.searchBoxShadow);
        await expect
          .poll(() =>
            page
              .locator('[data-slot="desktop-search-query"]')
              .evaluate((query) => getComputedStyle(query).boxShadow)
          )
          .toBe("none");
        expect(
          Math.abs(
            (desktopLayoutMetrics.frameRects.search?.left ?? 0) +
              (desktopLayoutMetrics.frameRects.search?.width ?? 0) / 2 -
              viewportWidth / 2
          )
        ).toBeLessThanOrEqual(1);
        expect(
          desktopLayoutMetrics.frameRects.search?.width ??
            Number.POSITIVE_INFINITY
        ).toBeLessThan(desktopLayoutMetrics.frameRects.grid?.width ?? 0);
        expect(
          (desktopLayoutMetrics.frameRects.grid?.top ?? 0) -
            (desktopLayoutMetrics.frameRects.quickFilters?.bottom ?? 0)
        ).toBeGreaterThanOrEqual(64);
        expect(
          (desktopLayoutMetrics.frameRects.grid?.top ?? 0) -
            (desktopLayoutMetrics.frameRects.quickFilters?.bottom ?? 0)
        ).toBeLessThanOrEqual(120);
        for (const width of desktopLayoutMetrics.quickFilterWidths) {
          expect(width).toBeGreaterThanOrEqual(64);
          expect(width).toBeLessThanOrEqual(124);
        }
        for (const width of desktopLayoutMetrics.primaryControlWidths) {
          expect(width).toBeGreaterThanOrEqual(80);
          expect(width).toBeLessThanOrEqual(140);
        }
        expect(
          desktopLayoutMetrics.frameRects.quickFilters?.height
        ).toBeLessThanOrEqual(40);
      }

      const listingCardWidth = await firstListingCard.evaluate(
        (card) => card.getBoundingClientRect().width
      );
      expect(listingCardWidth).toBeGreaterThanOrEqual(320);
      expect(listingCardWidth).toBeLessThanOrEqual(350);

      await page.setViewportSize({ height: 1100, width: 1918 });
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(firstListingCard).toBeVisible();

      const wideColumnCount = await firstListingCard.evaluate((card) => {
        const grid = card.parentElement;
        return grid
          ? getComputedStyle(grid)
              .gridTemplateColumns.split(" ")
              .filter(Boolean).length
          : 0;
      });
      const wideCardWidth = await firstListingCard.evaluate(
        (card) => card.getBoundingClientRect().width
      );
      expect(wideColumnCount).toBe(5);
      expect(wideCardWidth).toBeGreaterThanOrEqual(345);
      expect(wideCardWidth).toBeLessThanOrEqual(360);

      if (initialViewport) {
        await page.setViewportSize(initialViewport);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(firstListingCard).toBeVisible();
      }
    }

    const firstListing = page.locator('a[href*="/listing/"]').first();
    await expect(firstListing).toBeVisible();
    await Promise.all([
      page.waitForURL(listingPathPattern, { timeout: 20_000 }),
      firstListing.click(),
    ]);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await expect(
      page.locator('[data-slot="public-marketplace-footer"]')
    ).toHaveCount(1);
    const specificationCards = page.locator(
      '[data-slot="listing-specification"]'
    );
    await expect(specificationCards).toHaveCount(6);
    await expect(specificationCards.first()).toBeVisible();
    const specificationReadability = await specificationCards
      .first()
      .evaluate((card) => {
        const label = card.querySelector("dt");
        const value = card.querySelector("dd");
        const icon = card.querySelector("svg");
        const cardStyle = getComputedStyle(card);
        const labelStyle = label ? getComputedStyle(label) : undefined;
        const valueStyle = value ? getComputedStyle(value) : undefined;
        const iconRect = icon?.getBoundingClientRect();

        return {
          cardBackgroundColor: cardStyle.backgroundColor,
          iconWidth: iconRect?.width ?? 0,
          labelColor: labelStyle?.color,
          labelFontSize: Number.parseFloat(labelStyle?.fontSize ?? "0"),
          labelFontWeight: Number.parseInt(labelStyle?.fontWeight ?? "0", 10),
          valueColor: valueStyle?.color,
          valueFontSize: Number.parseFloat(valueStyle?.fontSize ?? "0"),
          valueFontWeight: Number.parseInt(valueStyle?.fontWeight ?? "0", 10),
        };
      });
    expect(specificationReadability.cardBackgroundColor).not.toBe(
      "rgba(0, 0, 0, 0)"
    );
    expect(specificationReadability.iconWidth).toBeGreaterThanOrEqual(20);
    expect(specificationReadability.labelColor).not.toBe(
      specificationReadability.valueColor
    );
    expect(specificationReadability.labelFontSize).toBeGreaterThanOrEqual(
      viewportWidth >= 1024 ? 15 : 14
    );
    expect(specificationReadability.labelFontWeight).toBeGreaterThanOrEqual(
      500
    );
    expect(specificationReadability.labelFontSize).toBeLessThan(
      specificationReadability.valueFontSize
    );
    expect(specificationReadability.labelFontWeight).toBeLessThan(
      specificationReadability.valueFontWeight
    );
    expect(specificationReadability.valueFontSize).toBeGreaterThanOrEqual(
      viewportWidth >= 1024 ? 21 : 20
    );
    expect(specificationReadability.valueFontWeight).toBeGreaterThanOrEqual(
      600
    );
    const descriptionContainer = page.locator(
      '[data-slot="listing-description"]'
    );
    await expect(descriptionContainer).toBeVisible();
    const descriptionReadability = await descriptionContainer.evaluate(
      (description) => {
        const body = description.querySelector("p");

        return {
          backgroundColor: getComputedStyle(description).backgroundColor,
          bodyFontSize: Number.parseFloat(
            body ? getComputedStyle(body).fontSize : "0"
          ),
        };
      }
    );
    expect(descriptionReadability.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(descriptionReadability.bodyFontSize).toBeGreaterThanOrEqual(16);
    if (!testInfo.project.name.includes("mobile")) {
      const listingSummaryHeader = page.locator(
        '[data-slot="listing-summary-header"]'
      );
      await expect(listingSummaryHeader).toBeVisible();
      await expect(
        listingSummaryHeader.getByRole("link", {
          exact: true,
          name: "Back to search",
        })
      ).toBeVisible();
      await expect(listingSummaryHeader).toHaveClass(
        listingHeaderCardClassPattern
      );
      const [headerBox, purchaseColumnBox] = await Promise.all([
        listingSummaryHeader.boundingBox(),
        page.locator('[data-slot="listing-purchase-column"]').boundingBox(),
      ]);
      expect(headerBox).not.toBeNull();
      expect(purchaseColumnBox).not.toBeNull();
      expect(
        Math.abs((headerBox?.y ?? 0) - (purchaseColumnBox?.y ?? 0))
      ).toBeLessThanOrEqual(1);

      const transactionCard = page.locator(
        '[data-slot="listing-transaction-card"]'
      );
      const sellerCard = page.locator('[data-slot="listing-seller-card"]');
      await expect(transactionCard).toBeVisible();
      await expect(sellerCard).toBeVisible();
      const [transactionBox, sellerBox] = await Promise.all([
        transactionCard.boundingBox(),
        sellerCard.boundingBox(),
      ]);
      expect(transactionBox).not.toBeNull();
      expect(sellerBox).not.toBeNull();
      expect(
        (sellerBox?.y ?? 0) -
          ((transactionBox?.y ?? 0) + (transactionBox?.height ?? 0))
      ).toBeCloseTo(12, 0);
      expect(
        Math.abs((transactionBox?.width ?? 0) - (sellerBox?.width ?? 0))
      ).toBeLessThanOrEqual(1);

      const reportAction = page.locator('[data-slot="report-listing-action"]');
      await expect(reportAction).toBeVisible();
      const reportBackgroundAtRest = await reportAction.evaluate(
        (action) => getComputedStyle(action).backgroundColor
      );
      expect(reportBackgroundAtRest).not.toBe("rgba(0, 0, 0, 0)");
      await reportAction.hover();
      await expect
        .poll(() =>
          reportAction.evaluate(
            (action) => getComputedStyle(action).backgroundColor
          )
        )
        .not.toBe(reportBackgroundAtRest);
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true);
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test("desktop quick filters keep a distilled rail and separated priority controls", async ({
    page,
  }, testInfo) => {
    const errors = collectPublicPageErrors(page);

    for (const width of [1024, 1280, 1536]) {
      const expectedLayoutRows = 1;

      await page.setViewportSize({ height: 820, width });
      const response = await page.goto("/bg", { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await page
        .getByRole("button", { name: "Отказ" })
        .click({ timeout: 1000 })
        .catch(() => undefined);

      const quickFilters = page.locator('[data-slot="desktop-quick-filter"]');
      const primaryControls = page.locator(
        '[data-slot="desktop-primary-control"]'
      );
      const sortControl = page.locator('[data-slot="desktop-sort-trigger"]');
      await expect(quickFilters).toHaveCount(7);
      await expect(primaryControls).toHaveCount(1);
      await expect(sortControl).toHaveCount(1);
      await expect(quickFilters.first()).toBeVisible();
      await expect(primaryControls.first()).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Препоръчани", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Филтри", exact: true })
      ).toBeVisible();

      const geometry = await page.evaluate(() => {
        const layout = document.querySelector(
          '[data-slot="desktop-quick-filter-shell"]'
        );
        const quick = document.querySelectorAll(
          '[data-slot="desktop-quick-filter"]'
        );
        const primary = document.querySelectorAll(
          '[data-slot="desktop-primary-control"], [data-slot="desktop-sort-trigger"]'
        );
        const visibleControls = [
          ...Array.from(quick),
          ...Array.from(primary),
        ].filter((control) => getComputedStyle(control).display !== "none");
        const rect = (element: Element) => {
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top };
        };
        const visibleFilters = Array.from(quick)
          .filter((filter) => getComputedStyle(filter).display !== "none")
          .map(rect);
        const primaryBoxes = Array.from(primary).map(rect);
        const truncatedPrimaryLabels = Array.from(
          document.querySelectorAll(
            '[data-slot="desktop-primary-control"] span, [data-slot="desktop-sort-trigger"] span'
          )
        )
          .filter((label) => label.scrollWidth > label.clientWidth + 0.5)
          .map((label) => label.textContent?.trim());

        return {
          documentOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1,
          controlHeights: [
            ...new Set(
              visibleControls.map(
                (control) => control.getBoundingClientRect().height
              )
            ),
          ],
          layout: layout ? rect(layout) : undefined,
          layoutRows: new Set(
            visibleControls.map((control) =>
              Math.round(control.getBoundingClientRect().top)
            )
          ).size,
          primaryBoxes,
          quickFilterRows: new Set(
            visibleFilters.map((filter) => Math.round(filter.top))
          ).size,
          truncatedPrimaryLabels,
          visibleFilters,
        };
      });

      expect(geometry.documentOverflow).toBe(false);
      expect(geometry.controlHeights).toEqual([44]);
      expect(geometry.layoutRows).toBe(expectedLayoutRows);
      expect(geometry.truncatedPrimaryLabels).toEqual([]);
      expect(geometry.quickFilterRows).toBe(1);
      expect(geometry.visibleFilters).toHaveLength(width < 1200 ? 4 : 7);
      for (const filter of geometry.visibleFilters) {
        expect(filter.left).toBeGreaterThanOrEqual(
          geometry.layout?.left ?? Number.NEGATIVE_INFINITY
        );
        expect(filter.right).toBeLessThanOrEqual(
          (geometry.layout?.right ?? Number.POSITIVE_INFINITY) + 1
        );
      }
      for (const control of geometry.primaryBoxes) {
        expect(control.left).toBeGreaterThanOrEqual(
          geometry.layout?.left ?? Number.NEGATIVE_INFINITY
        );
        expect(control.right).toBeLessThanOrEqual(
          geometry.layout?.right ?? Number.POSITIVE_INFINITY
        );
      }
    }

    await testInfo.attach("buy-controls-responsive", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await expectHealthyPublicPage(page, errors);
  });

  test("lease landing shares the wide discovery presentation with Buy", async ({
    page,
  }) => {
    const initialViewport = page.viewportSize();
    const isDesktop = (initialViewport?.width ?? 0) >= 1024;
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/lease");

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Лизингови оферти" })
    ).toBeVisible();
    const firstLeaseCard = page.locator("main article").first();
    await expect(firstLeaseCard).toBeVisible();
    await expect(firstLeaseCard).toHaveAttribute(
      "data-presentation",
      "discovery"
    );

    if (isDesktop) {
      const discoverySearch = page.locator(
        '[data-slot="desktop-search-surface"]'
      );
      await expect(discoverySearch).toBeVisible();
      await expect(discoverySearch).toHaveClass(
        discoverySearchHeightClassPattern
      );
      await expect(
        page.locator(
          '[data-slot="marketplace-mode-action"][data-marketplace-mode="lease"]'
        )
      ).toHaveAttribute("aria-current", "page");

      await page.setViewportSize({ height: 944, width: 1918 });
      const wideGeometry = await page.evaluate(() => {
        const logo = document.querySelector(
          '[data-slot="marketplace-home-link"]'
        );
        const search = document.querySelector(
          '[data-slot="desktop-search-surface"]'
        );
        const card = document.querySelector("main article");
        const logoRect = logo?.getBoundingClientRect();
        const searchRect = search?.getBoundingClientRect();
        const cardRect = card?.getBoundingClientRect();

        return {
          cardLeft: cardRect?.left,
          cardWidth: cardRect?.width,
          logoLeft: logoRect?.left,
          searchCenter: searchRect
            ? searchRect.left + searchRect.width / 2
            : undefined,
          searchWidth: searchRect?.width,
        };
      });
      expect(wideGeometry.logoLeft).toBeCloseTo(48, 0);
      expect(wideGeometry.cardLeft).toBeCloseTo(wideGeometry.logoLeft ?? -1, 0);
      expect(wideGeometry.cardWidth).toBeGreaterThanOrEqual(345);
      expect(wideGeometry.cardWidth).toBeLessThanOrEqual(360);
      expect(wideGeometry.searchCenter).toBeCloseTo(959, 0);
      expect(wideGeometry.searchWidth).toBeCloseTo(1120, 0);

      if (initialViewport) {
        await page.setViewportSize(initialViewport);
      }
      const filteredResponse = await page.goto("/bg/lease?fuel=electric");
      expect(filteredResponse?.status()).toBe(200);
      await expect(
        page.locator('[data-slot="desktop-search-surface"]')
      ).toHaveClass(resultsSearchHeightClassPattern);
      await expect(page.locator("main article").first()).toHaveAttribute(
        "data-presentation",
        "default"
      );
    }

    await expectHealthyPublicPage(page, errors);
  });

  test("lease listings use a focused monthly transaction card", async ({
    page,
  }) => {
    const isDesktop = (page.viewportSize()?.width ?? 0) >= 1024;
    const errors = collectPublicPageErrors(page);
    const response = await page.goto(
      "/bg/listing/mercedes-benz-gle-53-amg-coupe-sofia-2022"
    );
    expect(response?.status()).toBe(200);

    const transactionCard = page.locator(
      '[data-slot="listing-transaction-card"]'
    );
    if (!isDesktop) {
      await expect(transactionCard).toBeHidden();
      expect(errors.consoleErrors).toEqual([]);
      expect(errors.pageErrors).toEqual([]);
      return;
    }

    await expect(transactionCard).toBeVisible();
    await expect(transactionCard).toContainText("Лизингова оферта");
    await expect(transactionCard).toContainText("990 €/мес.");
    const monthlyAmountMentions = (
      (await transactionCard.textContent())?.match(/990/g) ?? []
    ).length;
    expect(monthlyAmountMentions).toBe(1);
    await expect(
      page.locator('[data-slot="listing-seller-card"]')
    ).toContainText("Black Sea EV");
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test("public standalone utility actions use filled neutral controls", async ({
    page,
  }) => {
    const errors = collectPublicPageErrors(page);
    const legalResponse = await page.goto("/bg/legal/privacy");
    expect(legalResponse?.status()).toBe(200);

    const legalBackAction = page
      .locator("main")
      .getByRole("link", { name: "Към Day & Night" });
    await expect(legalBackAction).toBeVisible();
    await expect(legalBackAction).toHaveClass(subtleButtonClassPattern);

    const contactResponse = await page.goto(
      "/bg/listing/audi-q5-45-tfsi-quattro-stara-zagora-2021/contact"
    );
    expect(contactResponse?.status()).toBe(200);
    const contactBackAction = page
      .locator("main")
      .locator('a[href$="/listing/audi-q5-45-tfsi-quattro-stara-zagora-2021"]')
      .first();
    await expect(contactBackAction).toBeVisible();
    await expect(contactBackAction).toHaveClass(subtleButtonClassPattern);
    const unavailableContactStatus = page
      .getByRole("status")
      .filter({ hasText: "Контактът временно не е достъпен" });
    await expect(unavailableContactStatus).toBeVisible();
    expect(
      await unavailableContactStatus.evaluate(
        (element) => getComputedStyle(element).display
      )
    ).toBe("block");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    ).toBe(true);
    expect(errors.consoleErrors).toEqual([]);
    expect(errors.pageErrors).toEqual([]);
  });

  test("Buy opens the same discovery card presentation as home", async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("automarket:listing-view-mode");
    });

    const homeResponse = await page.goto("/bg");
    expect(homeResponse?.status()).toBe(200);
    const homeFirstListingCard = page.locator("main article").first();
    await expect(homeFirstListingCard).toBeVisible();
    await expect(homeFirstListingCard).toHaveAttribute(
      "data-presentation",
      "discovery"
    );
    const homeColumnCount = await homeFirstListingCard.evaluate((card) => {
      const grid = card.parentElement;
      return grid
        ? getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
            .length
        : 0;
    });

    const buyLink = page
      .locator("a:visible")
      .filter({ hasText: buyLabelPattern })
      .first();
    await expect(buyLink).toHaveAttribute("href", "/bg/cars");
    if (testInfo.project.name.includes("mobile")) {
      await buyLink.focus();
      await page.keyboard.press("Enter");
    } else {
      await buyLink.click();
    }
    await expect(page).toHaveURL(localizedCarsPathPattern);
    await page.reload({ waitUntil: "domcontentloaded" });

    const carsFirstListingCard = page.locator("main article").first();
    await expect(carsFirstListingCard).toBeVisible();
    await expect(carsFirstListingCard).toHaveAttribute(
      "data-presentation",
      "discovery"
    );
    const carsColumnCount = await carsFirstListingCard.evaluate((card) => {
      const grid = card.parentElement;
      return grid
        ? getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
            .length
        : 0;
    });
    expect(carsColumnCount).toBe(homeColumnCount);
    await expect(
      carsFirstListingCard.locator('a[href*="/listing/"]').first()
    ).toBeVisible();
    await expect(page.getByText(importerPromoPattern)).toHaveCount(0);
  });

  test("sell entry keeps one clear path into a real listing draft", async ({
    page,
  }) => {
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/sell");

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Продайте автомобила си",
      })
    ).toBeVisible();

    const desktopMasthead = page.locator('[data-slot="marketplace-masthead"]');
    if (await desktopMasthead.isVisible()) {
      const marketplaceModes = desktopMasthead.locator(
        '[data-slot="marketplace-mode-action"]'
      );
      const selectedMode = desktopMasthead.locator(
        '[data-slot="marketplace-mode-action"][aria-current="page"]'
      );
      const inactiveModes = desktopMasthead.locator(
        '[data-slot="marketplace-mode-action"]:not([aria-current="page"])'
      );

      await expect(desktopMasthead).toHaveClass(
        marketplaceMastheadCanvasClassPattern
      );
      await expect(marketplaceModes).toHaveCount(3);
      await expect(selectedMode).toHaveAttribute(
        "data-marketplace-mode",
        "sell"
      );
      await expect(selectedMode).toHaveClass(
        selectedMarketplaceModeClassPattern
      );
      await expect(inactiveModes).toHaveCount(2);
      await expect(inactiveModes.first()).toHaveClass(
        inactiveMarketplaceModeClassPattern
      );
      await expect(inactiveModes.last()).toHaveClass(
        inactiveMarketplaceModeClassPattern
      );
    }

    const primaryAction = page.getByRole("button", {
      name: "Започнете обявата",
    });
    await expect(primaryAction).toBeVisible();
    const startForm = page.locator('[data-slot="sell-vehicle-start-form"]');
    await expect(startForm).toHaveAttribute("action", sellNewPathPattern);
    await expect(startForm).toHaveAttribute("method", "get");
    await expect(startForm.getByLabel("Категория")).toHaveValue("car");
    await expect(startForm.getByLabel("Марка")).toHaveValue("");
    await startForm.getByLabel("Марка").selectOption("Volvo");
    await startForm.getByLabel("Модел").fill("XC60");
    await startForm.getByLabel("Година").fill("2024");
    await startForm.getByLabel("Пробег").fill("42000");
    const starterValues = await startForm.evaluate((form) =>
      Object.fromEntries(new FormData(form as HTMLFormElement).entries())
    );
    expect(starterValues).toMatchObject({
      category: "car",
      make: "Volvo",
      mileage: "42000",
      model: "XC60",
      year: "2024",
    });
    await expect(
      page.locator('[data-slot="desktop-quick-filter"]')
    ).toHaveCount(0);

    const bannerImage = page.locator(
      'img[src*="day-night-sell-centered-hero-v2.webp"]'
    );
    await expect(bannerImage).toBeVisible();
    await expect(page.locator('a[href$="/dealer/inventory"]')).toHaveCount(0);

    const firstFaq = page.getByRole("button", {
      name: "Трябва ли да завърша обявата наведнъж?",
    });
    await firstFaq.click();
    await expect(
      page.getByText("Не. Първо създавате чернова", { exact: false })
    ).toBeVisible();

    const heroComposition = await page.evaluate(() => {
      const hero = document.querySelector('[data-slot="sell-hero"]');
      const content = document.querySelector('[data-slot="sell-hero-content"]');
      const heroRect = hero?.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();

      return {
        centerDifference:
          heroRect && contentRect
            ? Math.abs(
                heroRect.left +
                  heroRect.width / 2 -
                  (contentRect.left + contentRect.width / 2)
              )
            : Number.POSITIVE_INFINITY,
        formCenterDifference:
          heroRect && content
            ? Math.abs(
                heroRect.left +
                  heroRect.width / 2 -
                  (content.getBoundingClientRect().left +
                    content.getBoundingClientRect().width / 2)
              )
            : Number.POSITIVE_INFINITY,
      };
    });
    expect(heroComposition.centerDifference).toBeLessThanOrEqual(1);
    expect(heroComposition.formCenterDifference).toBeLessThanOrEqual(1);

    const frameAlignment = await page.evaluate(() => {
      const frame = document.querySelector('[data-slot="sell-content-frame"]');
      const primarySurface = frame?.querySelector("section");
      const visibleElement = (selector: string) =>
        Array.from(document.querySelectorAll(selector)).find(
          (candidate) => candidate.getBoundingClientRect().width > 0
        );
      const logoLink = visibleElement('[data-slot="marketplace-home-link"]');
      const logoBrand = visibleElement('[data-slot="marketplace-home-brand"]');
      const headerFrameAnchor =
        window.innerWidth >= 1024 ? logoLink : logoBrand;

      return {
        logoLeft:
          headerFrameAnchor?.getBoundingClientRect().left ??
          logoLink?.getBoundingClientRect().left,
        primaryLeft: primarySurface?.getBoundingClientRect().left,
      };
    });
    expect(frameAlignment.primaryLeft).toBeCloseTo(
      frameAlignment.logoLeft ?? -1,
      0
    );

    const sellViewport = page.viewportSize();
    if ((sellViewport?.width ?? 0) >= 1024) {
      await page.setViewportSize({ height: 944, width: 1918 });
      const wideSellFrame = await page.evaluate(() => {
        const logo = document.querySelector(
          '[data-slot="marketplace-home-link"]'
        );
        const hero = document.querySelector('[data-slot="sell-hero"]');
        const logoRect = logo?.getBoundingClientRect();
        const heroRect = hero?.getBoundingClientRect();

        return {
          heroLeft: heroRect?.left,
          heroWidth: heroRect?.width,
          logoLeft: logoRect?.left,
        };
      });
      expect(wideSellFrame.logoLeft).toBeCloseTo(48, 0);
      expect(wideSellFrame.heroLeft).toBeCloseTo(
        wideSellFrame.logoLeft ?? -1,
        0
      );
      expect(wideSellFrame.heroWidth).toBeGreaterThanOrEqual(1800);

      if (sellViewport) {
        await page.setViewportSize(sellViewport);
      }
    }

    await primaryAction.focus();
    await expect(primaryAction).toBeFocused();
    await expectHealthyPublicPage(page, errors);
  });

  test("unknown public routes return an honest not-found state", async ({
    page,
  }, testInfo) => {
    const response = await page.goto("/bg/__day_night_missing_route__");
    expect(response?.status()).toBe(404);
    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("html")).toHaveAttribute("lang", "bg");
    const footer = page.locator('[data-slot="public-marketplace-footer"]');
    if (testInfo.project.name.includes("mobile")) {
      await expect(footer).toBeHidden();
    } else {
      await expect(footer).toBeVisible();
    }

    const skipLink = page.locator('a[href="#main-content"]').first();
    await expect(skipLink).toHaveText("Към основното съдържание");
    await skipLink.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("support-route skip navigation is not obscured by the mobile header", async ({
    page,
  }, testInfo) => {
    const errors = collectPublicPageErrors(page);
    const response = await page.goto("/bg/imports");
    expect(response?.status()).toBe(200);

    const decline = page.getByRole("button", { exact: true, name: "Отказ" });
    if (await decline.isVisible().catch(() => false)) {
      await expect(decline).toBeEnabled();
      await decline.click();
      await expect(decline).toBeHidden();
    }

    const skipLink = page.locator('a[href="#main-content"]').first();
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    const main = page.locator("#main-content");
    await expect(main).toBeFocused();

    if (testInfo.project.name.includes("mobile")) {
      const geometry = await page.evaluate(() => {
        const target = document
          .querySelector("#main-content")
          ?.getBoundingClientRect();
        const stickyHeader = Array.from(document.querySelectorAll("header"))
          .find((header) => {
            const rect = header.getBoundingClientRect();
            return (
              getComputedStyle(header).position === "sticky" && rect.height > 0
            );
          })
          ?.getBoundingClientRect();
        return {
          stickyHeaderBottom: stickyHeader?.bottom ?? 0,
          targetTop: target?.top ?? -1,
        };
      });
      expect(geometry.targetTop).toBeGreaterThanOrEqual(
        geometry.stickyHeaderBottom
      );
    }

    await expectHealthyPublicPage(page, errors);
  });

  test("guide details provide a localized return path", async ({ page }) => {
    const response = await page.goto("/bg/guides/buying-used-car-bulgaria");
    expect(response?.status()).toBe(200);
    await expect(
      page.locator("#main-content").getByRole("link", { name: "Всички съвети" })
    ).toHaveAttribute("href", "/bg/guides");
  });

  test("support-route media failure renders an accessible fallback", async ({
    page,
  }) => {
    await page.route(
      (url) =>
        url.pathname === "/_next/image" &&
        Boolean(
          url.searchParams
            .get("url")
            ?.includes("china-ev-importer-profile.webp")
        ),
      (route) => route.abort("failed")
    );
    const response = await page.goto("/bg/collections/chinese-ev-hybrids");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("img", {
        name: supportImageFallbackPattern,
      })
    ).toBeVisible();
    await expect(
      page.getByAltText("Електромобил в център за доставка и логистика")
    ).toHaveCount(0);
  });

  test("footer utility links meet the minimum target size", async ({
    page,
  }, testInfo) => {
    const response = await page.goto("/bg/guides");
    expect(response?.status()).toBe(200);
    const footer = page.locator('[data-slot="public-marketplace-footer"]');
    if (testInfo.project.name.includes("mobile")) {
      await expect(footer).toBeHidden();
      await expect(
        page.locator('[data-slot="dealer-bottom-nav"]')
      ).toBeVisible();
      return;
    }
    await footer.scrollIntoViewIfNeeded();
    const utilityLinks = footer.locator("div.border-t").last().locator("a");
    await expect(utilityLinks).toHaveCount(1);
    const targetHeights = await utilityLinks.evaluateAll((links) =>
      links.map((link) => link.getBoundingClientRect().height)
    );
    expect(Math.min(...targetHeights)).toBeGreaterThanOrEqual(24);
  });
});
