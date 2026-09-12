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

test("financing remains dismissible while its deferred form loads", async ({
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
  let deferredScripts = 0;
  await page.route("**/_next/static/**/*.js", async (route) => {
    deferredScripts += 1;
    await held;
    await route.continue();
  });
  try {
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("status")).toHaveText(
      "Зареждане на формата…"
    );
    expect(deferredScripts).toBeGreaterThan(0);
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
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/cars?make=BMW&model=X5");
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
      await page
        .getByLabel("Търсене на автомобили", { exact: true })
        .fill("M4");
      await page.getByText("BMW M4 Competition", { exact: true }).click();
    }
    await expect(page).toHaveURL(listingRoutePattern);
    await expect(page.locator("h1").first()).toContainText(
      "BMW M4 Competition"
    );
  });
}
