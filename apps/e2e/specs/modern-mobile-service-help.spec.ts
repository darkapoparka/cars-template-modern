import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient")
  );
});

for (const [route, title] of [
  ["/sell", "Как протича продажбата"],
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
    const trigger = page.locator('[data-slot="mobile-service-help"]');
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const panel = dialog.getByRole("region", { name: title, exact: true });
    await expect(panel).toHaveAttribute("tabindex", "0");
    // Establish the start of the tab sequence; touch need not focus Close.
    await dialog.locator('[data-slot="mobile-service-help-close"]').focus();
    await page.keyboard.press("Tab");
    await expect(panel).toBeFocused();
    await page.keyboard.press("End");
    await expect
      .poll(() => panel.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(panel.locator("li, dd").last()).toBeInViewport();
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

for (const viewport of [
  { width: 320, height: 700 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
]) {
  test(`all service help drawers share the same presentation at ${viewport.width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    let referenceStyles: unknown;
    for (const service of ["sell", "imports", "lease"]) {
      await page.goto(`/${service}`);
      const trigger = page.locator('[data-slot="mobile-service-help"]');
      await trigger.tap();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toHaveAttribute(
        "data-slot",
        "mobile-service-help-drawer"
      );
      await expect(
        dialog.locator('[data-slot="mobile-service-help-steps"] > li')
      ).toHaveCount(3);
      await expect(
        dialog.locator('[data-slot="drawer-description"]')
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: testInfo.outputPath(`${service}.png`),
        animations: "disabled",
      });
      const bounds = await dialog.boundingBox();
      expect(bounds).not.toBeNull();
      if (!bounds) {
        throw new Error("Missing help drawer bounds");
      }
      expect(bounds.x).toBeGreaterThanOrEqual(-1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds.y).toBeGreaterThanOrEqual(-1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
      expect(bounds.height).toBeLessThanOrEqual(viewport.height * 0.85 + 1);
      const styles = await dialog.evaluate((element) => {
        const selectors = {
          shell: null,
          header: '[data-slot="drawer-header"]',
          title: '[data-slot="drawer-title"]',
          description: '[data-slot="drawer-description"]',
          close: '[data-slot="mobile-service-help-close"]',
          body: '[data-slot="mobile-service-help-body"]',
          step: '[data-slot="mobile-service-help-steps"] > li',
          number: '[data-slot="mobile-service-help-steps"] > li > span',
        };
        const properties = [
          "background-color",
          "color",
          "border-radius",
          "padding",
          "gap",
          "font-size",
          "line-height",
          "font-weight",
          "text-align",
          "overflow-y",
          "max-height",
        ];
        return Object.fromEntries(
          Object.entries(selectors).map(([key, selector]) => {
            const target = selector ? element.querySelector(selector) : element;
            if (!target) {
              throw new Error(`Missing shared help element: ${key}`);
            }
            const style = getComputedStyle(target);
            return [
              key,
              Object.fromEntries(
                properties.map((property) => [
                  property,
                  style.getPropertyValue(property),
                ])
              ),
            ];
          })
        );
      });
      if (referenceStyles) {
        expect(styles).toEqual(referenceStyles);
      } else {
        referenceStyles = styles;
      }
      const close = dialog.locator('[data-slot="mobile-service-help-close"]');
      const closeBounds = await close.boundingBox();
      expect(closeBounds?.width).toBe(44);
      expect(closeBounds?.height).toBe(44);
      if (viewport.width === 390) {
        const result = await new AxeBuilder({ page })
          .include('[data-slot="mobile-service-help-drawer"]')
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          result.violations.filter(
            ({ impact }) => impact === "serious" || impact === "critical"
          )
        ).toEqual([]);
      }
      await close.tap();
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });
}
