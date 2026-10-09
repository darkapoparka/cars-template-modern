import { expect, test } from "@playwright/test";
import { selectInventoryFilterLayout } from "../fixtures/inventory-preview";
import { dismissModernWelcome } from "../fixtures/modern-session.setup";

test.beforeEach(async ({ context, baseURL }) => {
  await dismissModernWelcome(context.request, baseURL);
});

test("desktop category drafts preserve filters and browser Back context", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  let documents = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documents += 1;
    }
  });
  await page.goto(
    "/bg/cars?make=BMW&model=X5&priceMax=100000&yearMin=2010&sort=newest"
  );
  await selectInventoryFilterLayout(page, "sidebar", "bg");
  const sidebar = page.locator('[data-slot="dealer-inventory-sidebar"]');
  const submit = sidebar.locator('[data-slot="desktop-hero-submit"]');
  await expect(submit).toBeEnabled();
  await expect(page.getByRole("dialog")).toBeHidden();
  // Wait for the development server's initial reload and chunks before
  // checking continuity of the subsequent category transitions.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const initialDocuments = documents;
  await page.evaluate(() => {
    document.documentElement.dataset.navigationContinuity = "initial";
  });

  for (const [name, path] of [
    ["Камиони", "/bg/trucks"],
    ["Бусове", "/bg/vans"],
    ["Мотори", "/bg/motorbikes"],
  ]) {
    const before = page.url();
    await sidebar.locator('[data-slot="desktop-hero-category"]').click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name, exact: true }).click();
    await dialog.getByRole("button", { name: "Приложи", exact: true }).click();
    expect(page.url()).toBe(before);
    await submit.click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    await expect(submit).toBeEnabled();
    const params = new URL(page.url()).searchParams;
    expect(params.get("priceMax")).toBe("100000");
    expect(params.get("yearMin")).toBe("2010");
    expect(params.get("sort")).toBe("newest");
    expect(params.get("make")).toBeNull();
    expect(params.get("model")).toBeNull();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator("html")).toHaveAttribute(
      "data-navigation-continuity",
      "initial"
    );
  }
  for (const path of ["/bg/vans", "/bg/trucks", "/bg/cars"]) {
    await page.goBack();
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(submit).toBeEnabled();
  }
  expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
  await expect(
    sidebar.locator('[data-slot="desktop-hero-make"]')
  ).toContainText("BMW");
  expect(documents).toBe(initialDocuments);
});
