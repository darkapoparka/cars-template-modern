import { expect, test } from "@playwright/test";

test("desktop category navigation preserves scroll and the browser document", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let documents = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documents += 1;
    }
  });
  await page.goto("/bg/cars");
  const submit = page.locator('[data-slot="desktop-hero-submit"]');
  await expect(submit).toBeEnabled();
  const dismiss = page.getByRole("button", { name: "Не сега", exact: true });
  if (await dismiss.isVisible()) {
    await dismiss.click();
  }
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.evaluate(() => window.scrollTo({ top: 80, behavior: "instant" }));
  for (const [name, path] of [
    ["Автомобили", "/bg/cars"],
    ["Камиони", "/bg/trucks"],
    ["Бусове", "/bg/vans"],
    ["Автомобили", "/bg/cars"],
  ]) {
    await page
      .getByRole("navigation", { name: "Категории превозни средства" })
      .getByRole("link", { name, exact: true })
      .click();
    await expect.poll(() => new URL(page.url()).pathname).toBe(path);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    await expect(submit).toBeEnabled();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(80);
  }
  expect(documents).toBe(1);
});
