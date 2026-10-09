import { expect, test } from "@playwright/test";
import { selectInventoryViewMode } from "../fixtures/inventory-preview";

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) {
    throw new Error("Persistence checks require a local preview origin");
  }
  await context.route("**/api/**", (route) => {
    const request = route.request();
    return request.method() === "POST" &&
      !request.url().includes("/api/preferences")
      ? route.abort()
      : route.continue();
  });
  const preferences = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: { action: "dismiss", locale: "en", country: "BG", returnTo: "/cars" },
  });
  expect(preferences.status()).toBe(200);
});

for (const width of [320, 390, 1440]) {
  test(`inventory URL survives reload, listing navigation and browser Back at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/en/cars?make=BMW&priceMax=150000&sort=price_asc", {
      waitUntil: "networkidle",
    });
    const original = page.url();
    const grid = page.locator('[data-slot="marketplace-listing-grid"]');
    await expect(grid).toBeVisible();
    const href = await grid
      .locator('a[href*="/listing/"]:visible')
      .first()
      .getAttribute("href");
    expect(href).toBeTruthy();
    await page.reload({ waitUntil: "networkidle" });
    expect(page.url()).toBe(original);
    await grid.locator('a[href*="/listing/"]:visible').first().click();
    await expect
      .poll(() => new URL(page.url()).pathname)
      .toContain("/listing/");
    await page.goBack({ waitUntil: "networkidle" });
    expect(page.url()).toBe(original);
    await expect(grid).toBeVisible();
    expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
    expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
    expect(errors).toEqual([]);
  });
}

test("shortlist changes stay synchronized across tabs and reloads", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/cars", { waitUntil: "networkidle" });
  const other = await context.newPage();
  await other.setViewportSize({ width: 1440, height: 900 });
  await other.goto("/en/cars", { waitUntil: "networkidle" });
  const buttons = page.locator(
    '[data-slot="marketplace-listing-grid"] [data-slot="desktop-save-car"]'
  );
  const otherButtons = other.locator(
    '[data-slot="marketplace-listing-grid"] [data-slot="desktop-save-car"]'
  );
  await expect(buttons.first()).toHaveAttribute("aria-pressed", "false");
  await buttons.first().click();
  await expect(otherButtons.first()).toHaveAttribute("aria-pressed", "true");
  await otherButtons.nth(1).click();
  await expect(buttons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await buttons.first().click();
  await expect(otherButtons.first()).toHaveAttribute("aria-pressed", "false");
  await other.reload({ waitUntil: "networkidle" });
  await expect(otherButtons.first()).toHaveAttribute("aria-pressed", "false");
  await expect(otherButtons.nth(1)).toHaveAttribute("aria-pressed", "true");
  await other.close();
});

test("inventory view preference survives reload and rejects invalid stored values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/cars", { waitUntil: "networkidle" });
  await selectInventoryViewMode(page, "list");
  await page.reload({ waitUntil: "networkidle" });
  const grid = page.locator('[data-slot="marketplace-listing-grid"]');
  await expect(grid).toHaveAttribute("data-view", "list");
  await selectInventoryViewMode(page, "grid");
  await page.reload({ waitUntil: "networkidle" });
  await expect(grid).toHaveAttribute("data-view", "grid");
  await page.evaluate(() =>
    localStorage.setItem("automarket:listing-view-mode", "invalid")
  );
  await page.reload({ waitUntil: "networkidle" });
  await expect(grid).toHaveAttribute("data-view", "grid");
});
