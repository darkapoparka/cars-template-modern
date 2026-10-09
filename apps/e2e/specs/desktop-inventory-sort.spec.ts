import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, baseURL, page }) => {
  // biome-ignore lint/suspicious/noSkippedTests: These controls are desktop-only.
  test.skip((page.viewportSize()?.width ?? 0) < 1024, "Desktop inventory sort");
  if (!baseURL) {
    throw new Error("Inventory sort requires a preview origin");
  }
  const response = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: { action: "dismiss", locale: "bg", country: "BG", returnTo: "/cars" },
  });
  expect(response.status()).toBe(200);
});

for (const locale of ["bg", "en"] as const) {
  for (const width of [1024, 1440, 1920]) {
    test(`sort keeps applied chips and results in place (${locale}, ${width}px)`, async ({
      page,
    }) => {
      const isBg = locale === "bg";
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(
        `/${locale}/cars?priceMax=150000&yearMin=2010&fuel=diesel`
      );
      await page.evaluate(() => document.fonts.ready);
      const chips = page.locator(
        '[data-slot="dealer-inventory-applied-filters"]'
      );
      const grid = page.locator('[data-slot="marketplace-listing-grid"]');
      const bar = page.locator('[data-slot="dealer-inventory-filters"]');
      const sort = bar.getByRole("combobox", {
        name: isBg ? "Подреждане" : "Sort order",
        exact: true,
      });
      await expect(chips).toBeVisible();
      await expect(chips.getByRole("button")).toHaveCount(4);
      const chipLabels = await chips.getByRole("button").allTextContents();
      const before = {
        chips: await chips.boundingBox(),
        bar: await bar.boundingBox(),
        grid: await grid.boundingBox(),
      };
      await sort.click();
      await expect(page.getByRole("listbox")).toBeVisible();
      // Radix hides background controls from assistive technology while open.
      // They must stay visually present without collapsing the results row.
      await expect(chips).toBeVisible();
      await expect.poll(() => chips.boundingBox()).toEqual(before.chips);
      await expect.poll(() => bar.boundingBox()).toEqual(before.bar);
      await expect.poll(() => grid.boundingBox()).toEqual(before.grid);
      await page.keyboard.press("Escape");
      await expect(sort).toBeFocused();
      await expect(chips.getByRole("button")).toHaveText(chipLabels);

      await sort.click();
      await page
        .getByRole("option", {
          name: isBg ? "Цена нагоре" : "Price low",
          exact: true,
        })
        .click();
      await expect
        .poll(() => new URL(page.url()).searchParams.get("sort"))
        .toBe("price_asc");
      const selected = new URL(page.url()).searchParams;
      expect(selected.get("priceMax")).toBe("150000");
      expect(selected.get("yearMin")).toBe("2010");
      expect(selected.get("fuel")).toBe("diesel");
      await expect(chips.getByRole("button")).toHaveText(chipLabels);
      await page.reload();
      await expect(chips.getByRole("button")).toHaveText(chipLabels);
      await expect(sort).toContainText(isBg ? "Цена нагоре" : "Price low");
      await bar
        .getByRole("button", {
          name: isBg ? "Изчисти всички" : "Clear all",
          exact: true,
        })
        .click();
      await expect(chips).toBeHidden();
      await expect
        .poll(() => new URL(page.url()).searchParams.get("priceMax"))
        .toBeNull();
      const cleared = new URL(page.url()).searchParams;
      expect(cleared.get("priceMax")).toBeNull();
      expect(cleared.get("yearMin")).toBeNull();
      expect(cleared.get("fuel")).toBeNull();
      expect(cleared.get("sort")).toBe("price_asc");
    });
  }
}
