import { expect, test } from "@playwright/test";

const dieselResultsPattern = /\/en\/cars\?.*fuel=diesel/;
const fuelQueryPattern = /fuel=/;
const listingPattern = /\/listing\//;
const phonePattern = /^tel:/;
const desktopHeroSelector =
  '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"]';

test("all main routes keep the same desktop hero, panel and banner geometry", async ({
  page,
}) => {
  test.setTimeout(120_000);
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const locale of ["en", "bg"]) {
      let reference: unknown;
      for (const path of ["", "/cars", "/sell", "/lease", "/imports"]) {
        await page.goto(`/${locale}${path}`);
        await expect(
          page.locator('[data-slot="public-route-loading-content"]')
        ).toBeHidden();
        const hero = page.locator(desktopHeroSelector);
        await expect(hero.locator("[data-desktop-action-panel]")).toBeVisible();
        const geometry = await hero.evaluate((element) => {
          const rect = (target: Element | null) => {
            const box = target?.getBoundingClientRect();
            return box ? [box.x, box.y, box.width, box.height] : null;
          };
          return {
            hero: rect(element),
            heading: rect(element.querySelector("h1")?.parentElement ?? null),
            panel: rect(element.querySelector("[data-desktop-action-panel]")),
            banner: rect(
              element.querySelector('[data-slot="desktop-hero-scene"]')
            ),
          };
        });
        if (reference) {
          expect(geometry, `${locale}${path} at ${width}px`).toEqual(reference);
        } else {
          reference = geometry;
        }
      }
    }
  }
});

test("desktop navigation keeps hero geometry stable through loading", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en");
  await expect(
    page.locator('[data-slot="public-route-loading-content"]')
  ).toBeHidden();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate((selector) => {
    const samples = new Set<string>();
    let frame = 0;
    const sample = () => {
      const hero = Array.from(document.querySelectorAll(selector)).find(
        (element) => element.getBoundingClientRect().height > 0
      );
      const panel = hero?.querySelector("[data-desktop-action-panel]");
      if (hero && panel) {
        samples.add(
          JSON.stringify(
            [
              hero,
              panel,
              hero.querySelector('[data-slot="desktop-hero-scene"]'),
            ].map((element) => {
              const box = element?.getBoundingClientRect();
              return box
                ? [box.x, box.y + scrollY, box.width, box.height]
                : null;
            })
          )
        );
      }
      frame = requestAnimationFrame(sample);
    };
    sample();
    Object.assign(window, {
      heroStability: {
        stop: () => {
          cancelAnimationFrame(frame);
          return Array.from(samples);
        },
      },
    });
  }, desktopHeroSelector);
  for (const [mode, title] of [
    ["buy", "Vehicles in stock"],
    ["sell", "Sell us your vehicle"],
    ["lease", "Vehicle financing"],
    ["imports", "Import a vehicle"],
    ["home", "Find Your Next Drive"],
  ]) {
    await page
      .locator(
        `[data-slot="dealer-desktop-header"] [data-marketplace-mode="${mode}"]`
      )
      .click();
    await expect(
      page.locator(desktopHeroSelector).locator("h1").first()
    ).toHaveText(title);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
  }
  const samples = await page.evaluate(() =>
    (
      window as Window & { heroStability: { stop: () => string[] } }
    ).heroStability.stop()
  );
  expect(samples).toHaveLength(1);
});

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
    const controls = page.locator('[data-slot="desktop-results-controls"]');
    await expect(controls).toBeVisible();
    await expect(
      panel.locator('[data-slot="desktop-results-controls"]')
    ).toHaveCount(0);
    const controlBox = await controls.boundingBox();
    expect(controlBox?.y).toBeGreaterThan((home?.y ?? 0) + (home?.height ?? 0));
    const summaryBox = await page
      .locator('[data-slot="dealer-inventory-summary"]')
      .boundingBox();
    if (!(controlBox && summaryBox)) {
      throw new Error("Inventory filter and sort controls must be visible");
    }
    expect(
      Math.abs(
        controlBox.x +
          controlBox.width / 2 -
          summaryBox.x -
          summaryBox.width / 2
      )
    ).toBeLessThan(1);
    const inputBox = await panel.locator("label").first().boundingBox();
    const submitBox = await panel
      .locator('[data-slot="desktop-hero-submit"]')
      .boundingBox();
    if (!(inputBox && submitBox)) {
      throw new Error("Search input and submit action must be visible");
    }
    expect(submitBox.x + submitBox.width).toBeLessThan(
      inputBox.x + inputBox.width
    );
    expect(submitBox.height).toBeLessThan(inputBox.height);
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
