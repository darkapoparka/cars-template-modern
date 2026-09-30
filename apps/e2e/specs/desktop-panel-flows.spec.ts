import { expect, test } from "@playwright/test";

const dieselResultsPattern = /\/en\/cars\?.*fuel=diesel/;
const fuelQueryPattern = /fuel=/;
const phonePattern = /^tel:/;
const sourceQueryPattern = /sourceUrl=/;
const vehicleQueryPattern = /[?&]vehicle=/;
const desktopHeroSelector =
  '[data-slot="dealer-desktop-home-hero"], [data-slot="dealer-desktop-context-hero"]';

test("main routes share a stable hero with a content-sized import panel", async ({
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
        const panel = await hero
          .locator("[data-desktop-action-panel]")
          .boundingBox();
        const standardPanelHeight = width >= 1280 ? 280 : 320;
        if (path === "/imports") {
          expect(panel?.height).toBeLessThan(standardPanelHeight);
        } else {
          expect(panel?.height).toBe(standardPanelHeight);
        }
        const geometry = await hero.evaluate((element) => {
          const rect = (target: Element | null) => {
            const box = target?.getBoundingClientRect();
            return box ? [box.x, box.y, box.width, box.height] : null;
          };
          return {
            hero: rect(element),
            heading: rect(element.querySelector("h1")?.parentElement ?? null),
            panel: rect(
              element.querySelector("[data-desktop-action-panel]")
            )?.slice(0, 3),
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
            ].map((element, index) => {
              const box = element?.getBoundingClientRect();
              return box
                ? [
                    box.x,
                    box.y + scrollY,
                    box.width,
                    ...(index === 1 ? [] : [box.height]),
                  ]
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
      window as unknown as Window & {
        heroStability: { stop: () => string[] };
      }
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

test("financing selection and preferences survive navigation and clearing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/en/lease");
  const selector = page.locator('[data-slot="lease-desktop-vehicle-trigger"]');
  await expect(selector).toHaveAttribute("data-selected", "false");
  await expect(
    page.locator('[data-slot="finance-actions"] button')
  ).toBeDisabled();
  await selector.click();
  const dialog = page.getByRole("dialog");
  const search = dialog.getByRole("searchbox");
  await expect(search).toBeFocused();
  await search.fill("no-such-car-xyz");
  await expect(
    dialog.getByText("No vehicles found. Try another make or model.")
  ).toBeVisible();
  await search.fill("BMW X5");
  await dialog
    .locator('[data-slot="lease-vehicle-option"] button')
    .first()
    .click();
  await expect(dialog).toBeHidden();
  await expect(selector).toBeFocused();
  await expect(selector).toHaveAttribute("data-selected", "true");
  await expect(
    page.getByRole("link", { name: "View vehicle", exact: true })
  ).toHaveCount(0);
  await selector.click();
  await expect(search).toHaveValue("");
  await expect(dialog.locator('[data-vehicle-selected="true"]')).toHaveCount(1);
  const selectedTitle = await dialog
    .locator('[data-slot="lease-selected-vehicle-title"]')
    .nth(1)
    .textContent();
  await dialog
    .locator('[data-slot="lease-vehicle-option"] button')
    .nth(1)
    .click();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  const deposit = page.locator('[name="desktop-finance-deposit"][value="30"]');
  const term = page.locator('[name="desktop-finance-term"][value="36"]');
  const principal = page.locator('[data-slot="finance-principal"]');
  const initialPrincipal = await principal.textContent();
  await deposit.check();
  await expect(principal).not.toHaveText(initialPrincipal ?? "");
  const updatedPrincipal = await principal.textContent();
  await term.check();
  await expect(principal).toHaveText(updatedPrincipal ?? "");
  await page
    .locator(
      '[data-slot="dealer-desktop-header"] [data-marketplace-mode="home"]'
    )
    .click();
  await expect(page.locator("#desktop-home-title")).toBeVisible();
  await page.goBack();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  await expect(deposit).toBeChecked();
  await expect(term).toBeChecked();
  await page.reload();
  await expect(
    page.locator('[data-slot="lease-desktop-selected-title"]')
  ).toHaveText(selectedTitle ?? "");
  await expect(term).toBeChecked();
  const flexible = page.locator(
    '[name="desktop-finance-deposit"][value="flexible"]'
  );
  await flexible.check();
  await expect(principal).toHaveText("To be agreed");
  await page.reload();
  await expect(flexible).toBeChecked();
  await expect(page.locator('[data-slot="finance-actions"] a')).toHaveAttribute(
    "href",
    phonePattern
  );
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect(selector).toHaveAttribute("data-selected", "false");
  await expect(selector).toBeFocused();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(principal).toHaveText("—");
  await expect(
    page.locator('[data-slot="finance-actions"] button')
  ).toBeDisabled();
  await expect(page).not.toHaveURL(vehicleQueryPattern);
  await expect(flexible).toBeChecked();
  await expect(term).toBeChecked();
  await page.reload();
  await expect(selector).toHaveAttribute("data-selected", "false");
});

test("desktop import has one focus treatment and carries the listing into the request", async ({
  page,
}) => {
  await page.goto("/en/imports");
  const input = page.locator('search input[name="sourceUrl"]:visible');
  await input.click();
  const focus = await input.evaluate((element) => {
    const field = element as HTMLInputElement;
    const fieldStyle = getComputedStyle(field);
    if (!field.form) {
      throw new Error("Import link input must belong to a form");
    }
    const formStyle = getComputedStyle(field.form);
    return {
      fieldOutline: fieldStyle.outlineStyle,
      formOutline: formStyle.outlineStyle,
      formColor: formStyle.outlineColor,
    };
  });
  expect(focus.fieldOutline).toBe("none");
  expect(focus.formOutline).toBe("solid");
  expect(focus.formColor).not.toBe("rgb(17, 117, 222)");
  const sourceUrl = "https://example.com/vehicles/test-car";
  await input.fill(sourceUrl);
  await page
    .locator("search:visible")
    .getByRole("button", { name: "Request a quote" })
    .click();
  await expect(page).toHaveURL(sourceQueryPattern);
  await expect(page.locator("#import-request")).toBeVisible();
  await expect(
    page.locator('#import-request input[name="sourceUrl"]')
  ).toHaveValue(sourceUrl);
});
