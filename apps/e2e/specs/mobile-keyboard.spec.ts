import { expect, type Locator, type Page, test } from "@playwright/test";

async function visibleViewport(page: Page, height: number, offsetTop = 0) {
  await page.evaluate(
    ({ height: nextHeight, offsetTop: nextTop }) => {
      const viewport = window.visualViewport;
      if (!viewport) {
        throw new Error("VisualViewport is required for this regression test");
      }
      Object.defineProperty(viewport, "height", {
        configurable: true,
        get: () => nextHeight,
      });
      Object.defineProperty(viewport, "offsetTop", {
        configurable: true,
        get: () => nextTop,
      });
      viewport.dispatchEvent(new Event("resize"));
      viewport.dispatchEvent(new Event("scroll"));
    },
    { height, offsetTop }
  );
}

async function expectAboveKeyboard(element: Locator, height: number, top = 0) {
  await expect
    .poll(async () => {
      const box = await element.boundingBox();
      return Boolean(
        box && box.y >= top - 1 && box.y + box.height <= top + height + 1
      );
    })
    .toBe(true);
}

test.beforeEach(async ({ page }, info) => {
  // biome-ignore lint/suspicious/noSkippedTests: Keyboard scenarios apply only to the mobile project.
  test.skip(
    info.project.name !== "mobile-chromium",
    "Mobile visual viewport regression"
  );
  await page.route("**/*", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue()
  );
});

test("financing follows keyboard height and pan without losing the focused field", async ({
  page,
}) => {
  await page.goto("/lease?vehicle=am-1001");
  await expect(page.locator("html")).toHaveAttribute(
    "data-mobile-viewport",
    "true"
  );
  await page.locator('[data-slot="lease-finance-action"]').click();
  const dialog = page.locator('[data-slot="mobile-financing-drawer"]');
  const note = dialog.locator("textarea");
  await note.fill("Keyboard draft retained");
  await visibleViewport(page, 390);
  await expectAboveKeyboard(dialog, 390);
  await expectAboveKeyboard(note, 390);
  await expect(note).toBeFocused();
  await visibleViewport(page, 340, 50);
  await expectAboveKeyboard(dialog, 340, 50);
  await expectAboveKeyboard(note, 340, 50);
  await expect(note).toHaveValue("Keyboard draft retained");
  const submit = dialog.locator('button[type="submit"]');
  await submit.scrollIntoViewIfNeeded();
  await expectAboveKeyboard(submit, 340, 50);
  await visibleViewport(page, 844);
  await expect(dialog).toHaveCSS("height", "844px");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.locator('[data-slot="lease-finance-action"]')
  ).toBeFocused();
});

test("numeric filters keep fields and close action reachable with either resize model", async ({
  page,
}) => {
  await page.goto("/cars");
  await expect(page.locator("html")).toHaveAttribute(
    "data-mobile-viewport",
    "true"
  );
  await page.getByRole("button", { exact: true, name: "Цена" }).click();
  const dialog = page.getByRole("dialog");
  const maximum = dialog.locator('input:not([type="range"])').last();
  await maximum.focus();
  await visibleViewport(page, 360);
  await expectAboveKeyboard(dialog, 360);
  await expectAboveKeyboard(maximum, 360);
  const apply = dialog.getByRole("button", { exact: true, name: "Приложи" });
  await apply.scrollIntoViewIfNeeded();
  await expectAboveKeyboard(apply, 360);
  await page.evaluate(() => {
    if (!window.visualViewport) {
      return;
    }
    Reflect.deleteProperty(window.visualViewport, "height");
    Reflect.deleteProperty(window.visualViewport, "offsetTop");
  });
  await page.setViewportSize({ width: 320, height: 390 });
  await expectAboveKeyboard(dialog, 390);
  await maximum.focus();
  await expectAboveKeyboard(maximum, 390);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
