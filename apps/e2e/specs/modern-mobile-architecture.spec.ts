import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Exercise the local UI without sending enquiries or invoking providers.
  await page.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient")
  );
});

test("financing remains dismissible while its deferred form loads", async ({
  page,
}) => {
  await page.goto("/lease");
  await page.locator('button[aria-label^="BMW X5 M50d,"]').click();
  const trigger = page.getByRole("link", { name: "Поискайте оферта" });
  await expect(trigger).toBeVisible();
  await page.waitForLoadState("networkidle");
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let deferredScripts = 0;
  await page.route("**/_next/static/**/*.js", async (route) => {
    deferredScripts += 1;
    await held;
    await route.continue();
  });
  try {
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("status")).toHaveText(
      "Зареждане на формата…"
    );
    expect(deferredScripts).toBeGreaterThan(0);
    await dialog.getByRole("button", { name: "Затворете", exact: true }).tap();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    release();
    await trigger.tap();
    await expect(dialog.locator('input[name="name"]')).toBeVisible();
    await dialog.locator('input[name="name"]').fill("Architecture QA");
    await page.keyboard.press("Escape");
    await trigger.tap();
    await expect(dialog.locator('input[name="name"]')).toHaveValue(
      "Architecture QA"
    );
  } finally {
    release();
  }
});
