import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient")
  );
});

for (const [route, title] of [
  ["/imports", "Как работи вносът"],
  ["/lease", "Как работи лизингът"],
]) {
  test(`${route} help waits for hydration`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
      locale: "bg-BG",
    });
    try {
      const page = await context.newPage();
      await page.goto(new URL(route, baseURL).href);
      await expect(
        page.locator('[data-slot="mobile-service-help"]')
      ).toBeDisabled();
    } finally {
      await context.close();
    }
  });
  test(`${route} help supports touch dismissal and keyboard scrolling in landscape`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(route);
    const trigger = page.getByRole("button", { name: title, exact: true });
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const panel = dialog.getByRole("region", { name: title, exact: true });
    await expect(panel).toHaveAttribute("tabindex", "0");
    // Establish the start of the tab sequence; touch need not focus Close.
    await dialog.getByRole("button").focus();
    await page.keyboard.press("Tab");
    await expect(panel).toBeFocused();
    await page.keyboard.press("End");
    await expect
      .poll(() => panel.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(panel.locator("dd").last()).toBeInViewport();
    await dialog
      .getByRole("button", { name: "Затвори информацията", exact: true })
      .tap();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
