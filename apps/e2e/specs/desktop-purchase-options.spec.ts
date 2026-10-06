import { expect, test } from "@playwright/test";

const monthlyEstimatePattern = /1[,\s]?870/;

test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL ?? "http://127.0.0.1:6482").origin;
  const response = await context.request.post(`${origin}/api/preferences`, {
    data: {
      action: "dismiss",
      country: "BG",
      locale: "bg",
      returnTo: "/cars",
    },
    headers: { origin },
  });
  expect(response.status()).toBe(200);
});

for (const locale of ["bg", "en"]) {
  test(`desktop ${locale} purchase options preserve the car and support keyboard selection`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(
      `/${locale}/listing/mercedes-benz-gls-400d-4matic-amg-sofia-2021`
    );
    const card = page.locator('[data-slot="listing-transaction-card"]:visible');
    const buy = card.getByRole("tab", {
      exact: true,
      name: locale === "bg" ? "Покупка" : "Buy",
    });
    const finance = card.getByRole("tab", {
      exact: true,
      name: locale === "bg" ? "Финансиране" : "Finance",
    });
    await expect(buy).toHaveAttribute("aria-selected", "true");
    await expect(card.locator('a[href^="tel:"]')).toBeVisible();
    const purchasePrice = await card
      .locator('[data-slot="listing-transaction-price"]')
      .innerText();
    const before = await card.boundingBox();

    await finance.click();
    await expect(finance).toHaveAttribute("aria-selected", "true");
    await expect(card.getByRole("tabpanel")).toContainText(
      monthlyEstimatePattern
    );
    const action = card.getByRole("link", {
      name: locale === "bg" ? "Вижте възможностите" : "Explore financing",
    });
    await expect(action).toHaveAttribute(
      "href",
      `/${locale}/lease?vehicle=am-1010`
    );
    await expect(card.locator('a[href^="tel:"]')).toBeHidden();
    const after = await card.boundingBox();
    expect(after?.height).toBe(before?.height);

    await finance.press("ArrowLeft");
    await expect(buy).toBeFocused();
    await expect(buy).toHaveAttribute("aria-selected", "true");
    await expect(
      card.locator('[data-slot="listing-transaction-price"]')
    ).toHaveText(purchasePrice);
    await buy.press("End");
    await expect(finance).toBeFocused();
    await finance.press("Home");
    await expect(buy).toBeFocused();

    await finance.click();
    await action.click();
    await expect(page).toHaveURL(
      new RegExp(`/${locale}/lease\\?vehicle=am-1010$`)
    );
    await expect(
      page.locator('[data-slot="lease-desktop-selected-card"]:visible')
    ).toContainText("GLS");
  });
}
