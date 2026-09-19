import { expect, test } from "@playwright/test";
import { createBrandTheme } from "@repo/design-system/lib/brand-theme";
import {
  expectNoHorizontalOverflow,
  settleModernPage,
} from "../fixtures/modern-visual-health";

const searchResultUrl = /(?:q|make)=BMW/;
const showroomSceneSource = /lead-car-showroom-scene-v1/;

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    ["GET", "HEAD"].includes(route.request().method())
      ? route.continue()
      : route.abort()
  );
});

for (const width of [320, 360, 390, 430]) {
  test(`mobile inventory preservation at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('[data-slot="dealer-bottom-nav"]')).toBeVisible();
    await expect(page).toHaveScreenshot(`mobile-cars-${width}.png`);
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`desktop composition and controls at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
    await expect(
      page.locator('[data-slot="dealer-desktop-header"]')
    ).toBeVisible();
    await expect(hero).toBeVisible();
    await expect(
      page.locator(
        '[data-slot="dealer-desktop-discovery-content"] article:visible'
      )
    ).not.toHaveCount(0);
    await expect(
      page.locator(
        '[data-slot="dealer-desktop-discovery-content"] [data-slot="carousel-next"]'
      )
    ).toBeEnabled();
    await expect(page).toHaveScreenshot(`desktop-cars-${width}.png`);
    const box = hero.locator('[data-slot="dealer-desktop-toolbar"]');
    const heroBounds = await hero.boundingBox();
    const boxBounds = await box.boundingBox();
    expect(heroBounds).not.toBeNull();
    expect(boxBounds).not.toBeNull();
    if (!(heroBounds && boxBounds)) {
      throw new Error("Hero geometry unavailable");
    }
    expect(
      Math.abs(
        boxBounds.x +
          boxBounds.width / 2 -
          (heroBounds.x + heroBounds.width / 2)
      )
    ).toBeLessThan(2);
    expect(boxBounds.width).toBeGreaterThanOrEqual(700);
    expect(boxBounds.width).toBeLessThanOrEqual(832);
    expect(heroBounds.height).toBeLessThan(540);
    const scene = hero.locator('[data-slot="desktop-hero-scene"]');
    await expect(scene).toBeVisible();
    await expect(scene).toHaveAttribute("src", showroomSceneSource);
    await expect(hero.locator('[data-slot="desktop-hero-make"]')).toBeVisible();
    await expect(
      hero.locator('[data-slot="desktop-hero-model"]')
    ).toBeVisible();
    await expect(
      hero.locator('[data-slot="desktop-hero-price"]')
    ).toBeVisible();
    const inventory = page.locator(
      '[data-slot="dealer-desktop-discovery-content"]'
    );
    await expect(
      inventory.getByRole("heading", {
        name: "Налични автомобили",
        exact: true,
      })
    ).toHaveCount(1);
    await expect(inventory.locator('[data-slot="carousel"]')).toBeVisible();
    const search = hero.getByRole("combobox");
    await expect(search).toBeVisible();
    await search.fill("BMW");
    await search.press("Enter");
    await expect(page).toHaveURL(searchResultUrl);
    await expectNoHorizontalOverflow(page);
  });
}

for (const route of [
  "/sell",
  "/imports",
  "/lease",
  "/blog",
  "/contact",
  "/legal/privacy",
]) {
  test(`responsive route ${route}`, async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await settleModernPage(page);
      await expectNoHorizontalOverflow(page);
      await expect(page.locator("h1:visible")).toHaveCount(1);
    }
  });
}

for (const viewport of [
  { width: 768, height: 390 },
  { width: 1023, height: 800 },
]) {
  test(`mobile boundary and landscape at ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(
      page.locator('[data-slot="dealer-desktop-home-hero"]')
    ).toBeHidden();
    await expect(page.locator('[data-slot="dealer-bottom-nav"]')).toBeVisible();
  });
}

test("validated dealer themes reach portalled filters and restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const accent of ["#164e63", "#facc15"]) {
    await page.goto("/cars");
    await settleModernPage(page);
    await page.evaluate((theme) => {
      for (const [name, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(name, value);
      }
    }, createBrandTheme(accent));
    const trigger = page
      .locator('[data-slot="dealer-desktop-home-hero"]')
      .getByRole("button", { name: "Филтри", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--brand").trim()
        )
      )
      .toBe(accent);
    await expect
      .poll(() =>
        dialog.evaluate((element) =>
          getComputedStyle(element)
            .getPropertyValue("--brand-foreground")
            .trim()
        )
      )
      .toBe(createBrandTheme(accent)["--brand-foreground"]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("vehicle details and unavailable routes retain accessible responsive frames", async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/listing/bmw-x5-m50d-sofia-2020");
    expect(response?.status()).toBe(200);
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("h1:visible")).toHaveCount(1);
    const missing = await page.goto("/refactor-missing-route");
    expect(missing?.status()).toBe(404);
    await expect(page.locator("main")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

// Initial-load regression ceilings for the 12-vehicle demo; see refactor/evidence/IMPLEMENTATION.md.
for (const width of [390, 1440]) {
  test(`initial production payload budget at ${width}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/cars", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const metrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const document = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      return {
        scriptBytes: resources
          .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
          .reduce((total, entry) => total + entry.encodedBodySize, 0),
        transferBytes: resources.reduce(
          (total, entry) => total + entry.transferSize,
          document.transferSize
        ),
        desktopHeroRequests: resources.filter((entry) =>
          entry.name.includes("lead-car-")
        ).length,
      };
    });
    await testInfo.attach("initial-payload", {
      body: JSON.stringify(metrics, null, 2),
      contentType: "application/json",
    });
    expect(metrics.scriptBytes).toBeGreaterThan(0);
    expect(metrics.scriptBytes).toBeLessThan(750_000);
    expect(metrics.transferBytes).toBeLessThan(1_350_000);
    if (width < 1024) {
      expect(metrics.desktopHeroRequests).toBe(0);
    }
  });
}

test("centered buy box opens full inventory without a query", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/cars", { waitUntil: "domcontentloaded" });
  await settleModernPage(page);
  await page.locator('[data-slot="desktop-hero-submit"]').click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe("newest");
  await expect(
    page.locator('[data-slot="dealer-desktop-home-hero"]')
  ).toBeHidden();
  await expect(
    page.locator('[data-slot="marketplace-listing-grid"]')
  ).toBeVisible();
});

test("centered buy box supports button search and its compact price control", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/cars", { waitUntil: "domcontentloaded" });
  await settleModernPage(page);
  const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
  await hero.getByRole("button", { name: "Цена", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    hero.getByRole("button", { name: "Цена", exact: true })
  ).toBeFocused();
  await hero.getByRole("combobox").fill("BMW");
  const suggestions = page.getByRole("listbox");
  await expect(suggestions).toBeVisible();
  const suggestionSizes = await suggestions.evaluate((element) => ({
    width: element.clientWidth,
    content: element.scrollWidth,
  }));
  expect(suggestionSizes.content).toBeLessThanOrEqual(suggestionSizes.width);
  const listingOptions = suggestions.locator(
    '[data-slot="desktop-search-listing-suggestion"]'
  );
  await expect(listingOptions.first()).toBeVisible();
  const first = await listingOptions.nth(0).boundingBox();
  const second = await listingOptions.nth(1).boundingBox();
  expect(first?.x).toBe(second?.x);
  await page.locator('[data-slot="desktop-hero-submit"]').click();
  await expect(page).toHaveURL(searchResultUrl);
  await expectNoHorizontalOverflow(page);
});

test("showroom carousel browses the same stock without losing keyboard access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto("/cars", { waitUntil: "domcontentloaded" });
  await settleModernPage(page);
  const inventory = page.locator(
    '[data-slot="dealer-desktop-discovery-content"]'
  );
  const firstCard = inventory.locator('[data-slot="vehicle-card"]').first();
  const before = await firstCard.boundingBox();
  const next = inventory.getByRole("button", {
    name: "Следващи автомобили",
    exact: true,
  });
  const previous = inventory.getByRole("button", {
    name: "Предишни автомобили",
    exact: true,
  });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect(previous).toBeEnabled();
  await settleModernPage(page);
  await expect
    .poll(async () => (await firstCard.boundingBox())?.x ?? 0)
    .toBeLessThan((before?.x ?? 0) - 200);
  await previous.click();
  await expect(previous).toBeDisabled();
  await expect
    .poll(async () =>
      Math.abs(((await firstCard.boundingBox())?.x ?? 0) - (before?.x ?? 0))
    )
    .toBeLessThan(2);
  await expectNoHorizontalOverflow(page);
});
