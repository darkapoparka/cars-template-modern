import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }, info) => {
  // biome-ignore lint/suspicious/noSkippedTests: These controls are specific to the mobile service header.
  test.skip(
    info.project.name !== "mobile-chromium",
    "Mobile service navigation"
  );
  await page.route("**/*", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue()
  );
});

test("leasing selector searches, selects and preserves selection when cancelled", async ({
  page,
}) => {
  await page.goto("/lease");
  const trigger = page.locator('[data-slot="lease-mobile-vehicle-trigger"]');
  await trigger.click();
  const dialog = page.locator('[data-slot="lease-car-selector"]');
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await expect(dialog.locator('[aria-pressed="true"]')).toHaveCount(0);
  await search.fill("BMW X5");
  await dialog
    .locator('[data-slot="lease-vehicle-option"] button')
    .first()
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator('[data-slot="lease-selected-vehicle-card"]')
  ).toContainText("BMW X5");
  await expect(
    page.locator('[data-slot="lease-finance-action"]')
  ).toBeFocused();
  await trigger.click();
  await expect(dialog.locator('[aria-pressed="true"]')).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(
    page.locator('[data-slot="lease-selected-vehicle-card"]')
  ).toContainText("BMW X5");
  await page.getByRole("button", { name: "Премахнете избора" }).click();
  await expect(page.locator('[data-slot="lease-quick-filters"]')).toBeVisible();
});

test("each service has a top-right help control with focus restoration", async ({
  page,
}) => {
  for (const path of ["/lease", "/imports", "/sell"]) {
    await page.goto(path);
    const help = page.locator('[data-slot="mobile-service-help"]');
    await expect(help).toHaveCount(1);
    const geometry = await help.boundingBox();
    expect(geometry?.width).toBe(44);
    expect(geometry?.y).toBe(12);
    await help.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(help).toBeFocused();
  }
});

test("selling help hands focus to the details form without a lingering modal", async ({
  page,
}) => {
  await page.goto("/sell");
  await page.locator('[data-slot="mobile-service-help"]').click();
  await page
    .getByRole("button", { name: "Въведете данните", exact: true })
    .click();
  await expect(
    page.locator('[data-slot="mobile-sell-details-form"]')
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
