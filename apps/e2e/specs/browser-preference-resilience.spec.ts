import { expect, test } from "@playwright/test";
import { selectInventoryViewMode } from "../fixtures/inventory-preview";

test.use({ viewport: { width: 1440, height: 900 } });

for (const failure of ["denied", "quota"] as const) {
  test(`inventory remains interactive when browser storage is ${failure}`, async ({
    page,
    context,
    baseURL,
  }) => {
    if (!baseURL) {
      throw new Error("Browser preference checks require a local preview URL");
    }
    const preferences = await context.request.post("/api/preferences", {
      headers: { origin: new URL(baseURL).origin },
      data: {
        action: "dismiss",
        locale: "en",
        country: "BG",
        returnTo: "/cars",
      },
    });
    expect(preferences.status()).toBe(200);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await context.addInitScript((mode) => {
      if (mode === "denied") {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException("Storage denied", "SecurityError");
          },
        });
      } else {
        Object.defineProperty(Storage.prototype, "setItem", {
          value() {
            throw new DOMException("Storage full", "QuotaExceededError");
          },
        });
      }
    }, failure);
    await page.goto("/en/cars", { waitUntil: "networkidle" });
    await selectInventoryViewMode(page, "list");
    await selectInventoryViewMode(page, "grid");
    await expect(
      page.locator('[data-slot="marketplace-listing-grid"]')
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
