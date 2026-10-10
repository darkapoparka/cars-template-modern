import { expect, test } from "@playwright/test";

const listingRoutePattern = /\/listing\//;

test.beforeEach(async ({ page }) => {
  // Exercise the local UI without sending enquiries or invoking providers.
  await page.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient")
  );
});

test("static financing remains dismissible while additional scripts are deferred", async ({
  page,
}) => {
  await page.goto("/lease");
  await page.locator('button[aria-label^="Изберете BMW X5 M50d,"]').click();
  const trigger = page.getByRole("link", { name: "Поискайте оферта" });
  await expect(trigger).toBeVisible();
  await page.waitForLoadState("networkidle");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_next/static/**/*.js", async (route) => {
    await held;
    await route.continue();
  });
  try {
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.locator('[data-slot="public-contact-unavailable"]')
    ).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveCount(0);
    await dialog.getByRole("button", { name: "Затворете", exact: true }).tap();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    release();
    await trigger.tap();
    await expect(
      dialog.locator('[data-slot="public-contact-unavailable"]')
    ).toBeVisible();
    await expect(dialog.locator('input[name="name"]')).toHaveCount(0);
    await page.keyboard.press("Escape");
    await trigger.tap();
    await expect(dialog.locator('a[href^="tel:"]')).toBeVisible();
  } finally {
    release();
  }
});

for (const width of [390, 1440]) {
  test(`search uses the supplied inventory beyond the filtered results at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/cars?make=BMW&model=X5");
    let inventoryUrl = page.url();
    if (width < 1024) {
      await page.locator('[data-slot="mobile-discovery-search"]').tap();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("searchbox").fill("M4");
      await dialog
        .getByRole("button")
        .filter({ hasText: "BMW M4 Competition" })
        .first()
        .tap();
    } else {
      // Desktop now uses the shared model dialog, not the retired header combobox.
      const hero = page.locator('[data-slot="dealer-desktop-inventory-hero"]');
      await hero.getByRole("button", { name: "Модел", exact: true }).click();
      const dialog = page.locator(
        '[data-slot="desktop-focused-filter-dialog"]'
      );
      await dialog
        .getByRole("searchbox", { name: "Търси модели", exact: true })
        .fill("M4");
      await dialog
        .locator('[data-slot="model-option"]')
        .filter({ hasText: "M4" })
        .first()
        .click();
      await dialog
        .getByRole("button", { name: "Покажи обявите", exact: true })
        .click();
      await expect
        .poll(() => new URL(page.url()).searchParams.get("model"))
        .toBe("M4");
      expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
      inventoryUrl = page.url();
      await page
        .locator(
          '[data-slot="marketplace-listing-grid"] a[href*="/listing/"]:visible'
        )
        .first()
        .click();
    }
    await expect(page).toHaveURL(listingRoutePattern);
    await expect(page.locator("h1").first()).toContainText(
      "BMW M4 Competition"
    );
    await page
      .getByRole("link", { name: "Назад към търсенето", exact: true })
      .click();
    await expect(page).toHaveURL(inventoryUrl);
  });
}
