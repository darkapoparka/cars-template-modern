import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("WCAG 2.2 AA launch gate", () => {
  for (const path of ["/", "/cars", "/bg/sell"] as const) {
    test(`${path} has no serious or critical automated violations`, async ({
      page,
    }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        ({ impact }) => impact === "critical" || impact === "serious"
      );
      expect(blocking).toEqual([]);
    });
  }

  test("primary marketplace controls are reachable by keyboard", async ({
    page,
  }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
    await expect(focusedElement).toHaveJSProperty("tabIndex", 0);
  });
});
