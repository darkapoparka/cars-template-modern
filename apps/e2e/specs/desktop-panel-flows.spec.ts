import { expect, test } from "@playwright/test";

const dieselResultsPattern = /\/en\/cars\?.*fuel=diesel/;
const fuelQueryPattern = /fuel=/;
const listingPattern = /\/listing\//;
const phonePattern = /^tel:/;

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("cars.prompt.v1", "dismissed");
  });
});

test("home and inventory share a buy box and submit the same draft", async ({
  page,
}) => {
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/en");
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    const panel = page.locator('[data-slot="dealer-desktop-toolbar"]');
    const home = await panel.boundingBox();
    await page.goto("/en/cars");
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    expect(await panel.boundingBox()).toEqual(home);
  }

  await page.goto("/en");
  await page.locator('[data-slot="desktop-hero-fuel"]').click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Diesel", exact: true }).click();
  await dialog.getByRole("button", { name: "Apply", exact: true }).click();
  await page.locator('[data-slot="desktop-hero-submit"]').click();
  await expect(page).toHaveURL(dieselResultsPattern);
  await expect(page.locator('[data-slot="desktop-hero-fuel"]')).toHaveText(
    "Diesel"
  );
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await page.locator('[data-slot="desktop-hero-submit"]').click();
  await expect(page).not.toHaveURL(fuelQueryPattern);
});

test("financing selection and preferences survive details and Back", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/lease");
  const selector = page.locator("#finance-vehicle-desktop");
  const vehicleId = await selector
    .locator("option")
    .nth(1)
    .getAttribute("value");
  expect(vehicleId).toBeTruthy();
  await selector.selectOption(vehicleId ?? "");
  await expect(selector).toHaveValue(vehicleId ?? "");
  const title = await selector.locator("option:checked").textContent();
  await expect(
    page.locator('[data-slot="lease-desktop-controls"] strong')
  ).toHaveText(title ?? "");
  const summary = page.locator('[data-slot="finance-summary"]');
  const advertisedEstimate = await summary.textContent();
  await page.locator("#finance-deposit").selectOption("20");
  await page.locator("#finance-term").selectOption("36");
  await expect(summary).toHaveText(advertisedEstimate ?? "");
  await page.getByRole("link", { name: "View vehicle", exact: true }).click();
  await expect(page).toHaveURL(listingPattern);
  await page.goBack();
  await expect(selector).toHaveValue(vehicleId ?? "");
  await expect(page.locator("#finance-deposit")).toHaveValue("20");
  await expect(page.locator("#finance-term")).toHaveValue("36");
  await page.reload();
  await expect(selector).toHaveValue(vehicleId ?? "");
  await expect(page.locator("#finance-term")).toHaveValue("36");
  await expect(page.locator('[data-slot="finance-actions"] a')).toHaveAttribute(
    "href",
    phonePattern
  );
});
