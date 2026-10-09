import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const request = route.request();
    const isPreference = new URL(request.url()).pathname === "/api/preferences";
    return ["GET", "HEAD", "OPTIONS"].includes(request.method()) ||
      (isPreference && request.method() === "POST")
      ? route.continue()
      : route.abort("blockedbyclient");
  });
});

for (const width of [320, 390]) {
  test(`first-visit welcome dismisses and stays dismissed at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/en/cars");
    const welcome = page.getByRole("dialog");
    await expect(welcome).toBeVisible();
    await expect(
      welcome.getByRole("radio", { name: "English", exact: true })
    ).toBeChecked();
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === "/api/preferences" &&
        result.request().method() === "POST"
    );
    await welcome.getByRole("button", { name: "Not now", exact: true }).click();
    expect((await response).status()).toBe(200);
    await expect(welcome).toBeHidden();
    await page.reload();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(
      page.locator('[data-slot="mobile-discovery-filters"]')
    ).toBeEnabled();
    expect(new URL(page.url()).pathname).toBe("/en/cars");
  });
}
