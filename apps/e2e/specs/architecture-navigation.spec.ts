import { expect, test } from "@playwright/test";

const inventorySearchLabel = /^Make or model$/;
const listingPath = /\/listing\//;

test.beforeEach(async ({ context, baseURL }) => {
  if (!baseURL) {
    throw new Error("A local provider-free preview origin is required");
  }
  await context.route("**/api/**", (route) =>
    route.request().method() === "POST" &&
    !route.request().url().includes("/api/preferences")
      ? route.abort()
      : route.continue()
  );
  const response = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: {
      action: "dismiss",
      locale: "en",
      country: "BG",
      returnTo: "/en/cars",
    },
  });
  expect(response.status()).toBe(200);
});

for (const width of [390, 1440]) {
  for (const route of ["/en/cars/bmw", "/en/cars/bmw/x5"]) {
    test(`listing Back retains route filters at ${width}px: ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      const href = `${route}?priceMax=150000&sort=price_asc`;
      await page.goto(href, { waitUntil: "networkidle" });
      const original = page.url();
      const grid = page.locator('[data-slot="marketplace-listing-grid"]');
      await expect(grid).toBeVisible();
      await grid.locator('a[href*="/listing/"]:visible').first().click();
      await expect(page).toHaveURL(listingPath);
      // This is the listing's own Back control, not the browser history button.
      const back = page.locator(`a[href="${href}"]:visible`).first();
      await expect(back).toBeVisible();
      await back.click();
      await expect(page).toHaveURL(original);
      await expect(grid).toBeVisible();
      expect(new URL(page.url()).searchParams.get("sort")).toBe("price_asc");
      expect(new URL(page.url()).searchParams.get("priceMax")).toBe("150000");
    });
  }
}

test("mobile search does not submit while confirming composed text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/en/cars", { waitUntil: "networkidle" });
  const original = page.url();
  await page.getByText(inventorySearchLabel).click();
  const overlay = page.locator('[data-slot="mobile-inventory-search"]');
  await expect(overlay).toBeVisible();
  const input = overlay.locator('input[name="q"]');
  await input.fill("BMW");
  await input.dispatchEvent("keydown", {
    key: "Enter",
    isComposing: true,
    bubbles: true,
    cancelable: true,
  });
  await expect(overlay).toBeVisible();
  expect(page.url()).toBe(original);
  await expect(input).toHaveValue("BMW");
  await input.press("Enter");
  await expect(overlay).toBeHidden();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("BMW");
});
