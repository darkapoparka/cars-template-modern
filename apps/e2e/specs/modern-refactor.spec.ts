import { expect, test } from "@playwright/test";
import { createBrandTheme } from "@repo/design-system/lib/brand-theme";
import {
  expectNoHorizontalOverflow,
  settleModernPage,
} from "../fixtures/modern-visual-health";

const searchResultUrl = /(?:q|make)=BMW/;
const showroomSceneSource = /lead-car-showroom-scene-v3/;

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
    await page.goto("/");
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
    await expect(page).toHaveScreenshot(`desktop-home-${width}.png`);
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
    expect(boxBounds.width).toBeLessThanOrEqual(880);
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
    const viewAll = await inventory
      .getByRole("link", { name: "Виж всички", exact: true })
      .boundingBox();
    const nextArrow = await inventory
      .getByRole("button", { name: "Следващи автомобили", exact: true })
      .boundingBox();
    expect(viewAll).not.toBeNull();
    expect(nextArrow).not.toBeNull();
    if (viewAll && nextArrow) {
      expect(
        Math.abs(
          viewAll.y + viewAll.height / 2 - nextArrow.y - nextArrow.height / 2
        )
      ).toBeLessThan(2);
    }
    const cardReadability = await inventory
      .locator("article")
      .evaluateAll((cards) =>
        cards.map((card) => {
          const title = card.querySelector(
            '[data-slot="vehicle-card-title"]:is(h3)'
          );
          const facts = [
            ...card.querySelectorAll('[data-slot="showroom-vehicle-facts"] li'),
          ];
          const bounds = card.getBoundingClientRect();
          return {
            titleSize: title
              ? Number.parseFloat(getComputedStyle(title).fontSize)
              : 0,
            completeFacts:
              facts.length === 3 &&
              facts.every((fact) => {
                const value = fact.querySelector("span");
                if (!value) {
                  return false;
                }
                const rect = value.getBoundingClientRect();
                return (
                  Number.parseFloat(getComputedStyle(value).fontSize) >= 12 &&
                  getComputedStyle(value).textOverflow !== "ellipsis" &&
                  rect.left >= bounds.left &&
                  rect.right <= bounds.right
                );
              }),
          };
        })
      );
    expect(
      cardReadability.every(
        (card) => card.titleSize >= 16 && card.completeFacts
      )
    ).toBe(true);
    const inputFont = await hero
      .getByRole("combobox")
      .evaluate((input) => Number.parseFloat(getComputedStyle(input).fontSize));
    expect(inputFont).toBeGreaterThanOrEqual(14);
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
    await page.goto("/");
    await settleModernPage(page);
    await page.evaluate((theme) => {
      for (const [name, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(name, value);
      }
    }, createBrandTheme(accent));
    const trigger = page
      .locator('[data-slot="dealer-desktop-home-hero"]')
      .getByRole("button", { name: "Още филтри", exact: true });
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
    const response = await page.goto(width < 1024 ? "/cars" : "/", {
      waitUntil: "networkidle",
    });
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settleModernPage(page);
  await page.locator('[data-slot="desktop-hero-submit"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/cars");
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
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
  await page.goto("/", { waitUntil: "domcontentloaded" });
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

for (const width of [1024, 1440]) {
  test(`contextual desktop headers and page titles at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/sell",
      "/lease",
      "/imports",
      "/contact",
      "/guides",
      "/guides/premium-used-car-checklist",
      "/legal/privacy",
      "/collections/chinese-ev-hybrids",
    ]) {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), route).toBe(200);
      await settleModernPage(page);
      await expect(
        page.locator('[data-slot="dealer-desktop-header"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="dealer-desktop-context-hero"]')
      ).toBeVisible();
      await expect(page.locator("h1:visible")).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
      const banner = await page
        .locator('[data-slot="dealer-desktop-context-hero"]')
        .boundingBox();
      expect(banner?.height).toBeLessThan(350);
    }
  });
}

test("desktop editorial search filters, clears and restores the visible input", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/guides", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("searchbox", {
    name: "Търси съвети и статии",
    exact: true,
  });
  await expect(search).toBeEnabled();
  const cards = page.locator('[data-slot="content-card"]');
  const total = await cards.count();
  expect(total).toBeGreaterThan(0);
  await search.fill("no-matching-article-qa");
  await expect(cards).toHaveCount(0);
  await page
    .getByRole("button", { name: "Покажи всички материали", exact: true })
    .click();
  await expect(cards).toHaveCount(total);
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
});

test("desktop service controls are not covered by the contextual hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  for (const [route, selector] of [
    ["/sell", "#sell-year"],
    ["/lease", '[data-slot="lease-finance-card"] select'],
    ["/imports", 'input[name="sourceUrl"]'],
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await settleModernPage(page);
    const field = page.locator(selector).filter({ visible: true }).first();
    await expect(field).toBeVisible();
    expect(
      await field.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const target = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        return target === element || element.contains(target);
      }),
      route
    ).toBe(true);
  }
});

test("desktop hero serves the full-resolution pre-optimized source", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await settleModernPage(page);
  const scene = page.locator('[data-slot="desktop-hero-scene"]');
  const image = await scene.evaluate((element) => {
    const img = element as HTMLImageElement;
    return {
      src: img.currentSrc,
      width: img.naturalWidth,
      complete: img.complete,
    };
  });
  const request = new URL(image.src);
  expect(request.pathname).toBe("/lead-car-showroom-scene-v3.webp");
  expect(image.width).toBe(2172);
  expect(image.complete).toBe(true);
});

test("selected desktop filters and clear actions share one control surface", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cars?make=BMW", { waitUntil: "domcontentloaded" });
  await settleModernPage(page);
  const toolbar = page.getByRole("region", {
    name: "Филтри за автомобили",
  });
  const selected = toolbar.getByRole("button", { name: "BMW", exact: true });
  const clear = toolbar.getByRole("button", {
    name: "Премахни BMW",
    exact: true,
  });
  const surface = async (element: import("@playwright/test").Locator) =>
    element.evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      background: getComputedStyle(node).backgroundColor,
    }));
  expect(await surface(clear)).toEqual(await surface(selected));
  await clear.click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("make"))
    .toBe(false);
  await expectNoHorizontalOverflow(page);
});

for (const width of [1024, 1280, 1440, 1920]) {
  test(`desktop catalog layout at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/cars");
    await settleModernPage(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("h1:visible")).toHaveCount(1);
    await expect(
      page.locator('[data-slot="dealer-desktop-home-hero"]')
    ).toHaveCount(0);
    await expect(
      page.locator('[data-slot="dealer-inventory-summary"]')
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: "Подреждане", exact: true })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="desktop-sort-trigger"]')
    ).toHaveCount(0);
    await expect(page).toHaveScreenshot(`desktop-cars-${width}.png`);
  });
}

test("home embeds its search action and keeps a compact filter button", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await settleModernPage(page);
  const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
  const primary = hero.locator('button[type="submit"]');
  const more = hero.getByRole("button", { name: "Още филтри", exact: true });
  await expect(primary).toHaveCount(1);
  const submitBox = await primary.boundingBox();
  const filterBox = await more.boundingBox();
  if (!(filterBox && submitBox)) {
    throw new Error("Home control bounds unavailable");
  }
  const inputBox = await hero.getByRole("combobox").boundingBox();
  expect(inputBox).not.toBeNull();
  expect(submitBox.width).toBeLessThanOrEqual(40);
  expect(filterBox.width).toBeLessThanOrEqual(48);
  expect(
    Math.abs(
      filterBox.y + filterBox.height / 2 - submitBox.y - submitBox.height / 2
    )
  ).toBeLessThan(2);
  expect(filterBox.x).toBeGreaterThan(submitBox.x);
  await more.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
});

test("home holds price and query drafts until Search", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await settleModernPage(page);
  const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
  await hero.getByRole("combobox").fill("BMW");
  await page.keyboard.press("Escape");
  await hero.locator('[data-slot="desktop-hero-price"]').click();
  const price = page.getByRole("dialog");
  await price.locator('input[type="number"]').last().fill("100000");
  await price.locator('input[type="number"]').last().blur();
  await price.getByRole("button", { name: "Приложи", exact: true }).click();
  await hero.locator('[data-slot="desktop-hero-body"]').click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "SUV", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Приложи", exact: true })
    .click();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(page.url()).search).toBe("");
  await expect(hero.getByRole("combobox")).toHaveValue("BMW");
  await hero.getByRole("button", { name: "Още филтри", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Приложи филтрите", exact: true })
    .click();
  await expect(hero.getByRole("combobox")).toHaveValue("BMW");
  expect(new URL(page.url()).pathname).toBe("/");
  await hero.locator('[data-slot="desktop-hero-submit"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/cars");
  expect(new URL(page.url()).searchParams.get("q")).toBe("BMW");
  expect(new URL(page.url()).searchParams.get("body")).toBe("suv");
  expect(new URL(page.url()).searchParams.get("priceMax")).toBe("100000");
  await expect(
    page.locator('[data-slot="dealer-desktop-home-hero"]')
  ).toHaveCount(0);
  await expect(
    page.locator('[data-slot="marketplace-listing-grid"] article').first()
  ).toBeVisible();
});

test("catalog sort, density and reset retain the browsing route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cars?make=BMW");
  await settleModernPage(page);
  const summary = page.locator('[data-slot="dealer-inventory-summary"]');
  const count = await summary.locator("output").innerText();
  await summary.getByRole("combobox").selectOption("price_asc");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe("price_asc");
  expect(new URL(page.url()).searchParams.get("make")).toBe("BMW");
  await page.reload();
  await expect(summary.getByRole("combobox")).toHaveValue("price_asc");
  await expect(summary.locator("output")).toHaveText(count);
  const toggles = summary.locator("fieldset button");
  await toggles.nth(0).click();
  await expect(
    page.locator('[data-slot="marketplace-listing-grid"]')
  ).toHaveAttribute("data-view", "list");
  await toggles.nth(1).click();
  await expect(
    page.locator('[data-slot="marketplace-listing-grid"]')
  ).toHaveAttribute("data-view", "grid");
  const first = page
    .locator('[data-slot="marketplace-listing-grid"] article')
    .first();
  const widthBefore = await first.evaluate(
    (element) => element.getBoundingClientRect().width
  );
  await page.getByRole("button", { name: "Премахни BMW", exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("make"))
    .toBe(false);
  expect(new URL(page.url()).pathname).toBe("/cars");
  expect(
    Math.abs(
      (await first.evaluate(
        (element) => element.getBoundingClientRect().width
      )) - widthBefore
    )
  ).toBeLessThan(2);
  await expectNoHorizontalOverflow(page);
});

test("catalog empty results can reset without returning to the hero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/cars?q=no-matching-car-qa");
  await expect(
    page.getByRole("heading", { name: "Няма намерени обяви", exact: true })
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Изчисти филтрите", exact: true })
    .click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("q"))
    .toBe(false);
  expect(new URL(page.url()).pathname).toBe("/cars");
  await expect(
    page.locator('[data-slot="dealer-inventory-summary"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-slot="dealer-desktop-home-hero"]')
  ).toHaveCount(0);
});

test("desktop make pages can clear their route-level make", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cars/bmw");
  await page.getByRole("button", { name: "Премахни BMW", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/cars");
  expect(new URL(page.url()).searchParams.has("make")).toBe(false);
  await expect(
    page.locator('[data-slot="dealer-inventory-summary"]')
  ).toBeVisible();
});

test("home search preserves configured default-language normalization", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en");
  await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
  await hero.getByRole("combobox").fill("BMW");
  await page.keyboard.press("Escape");
  await hero.locator('[data-slot="desktop-hero-submit"]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/cars");
  expect(new URL(page.url()).searchParams.get("q")).toBe("BMW");
  await expect(
    page.locator('[data-slot="dealer-inventory-summary"] h1')
  ).toHaveText("Автомобили за продажба");
});

test("home make selection applies to the draft, not the route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await settleModernPage(page);
  const hero = page.locator('[data-slot="dealer-desktop-home-hero"]');
  await hero.locator('[data-slot="desktop-hero-make"]').click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "BMW", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Приложи", exact: true })
    .click();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(new URL(page.url()).search).toBe("");
  await expect(hero.locator('[data-slot="desktop-hero-make"]')).toHaveText(
    "BMW"
  );
  await hero.getByRole("button", { name: "Изчисти", exact: true }).click();
  await expect(hero.locator('[data-slot="desktop-hero-make"]')).toHaveText(
    "Марка"
  );
  expect(new URL(page.url()).pathname).toBe("/");
});

test("catalog list mode retains showroom card hierarchy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/cars");
  await settleModernPage(page);
  await page
    .locator('[data-slot="dealer-inventory-summary"] fieldset button')
    .first()
    .click();
  const card = page
    .locator('[data-slot="marketplace-listing-grid"] article')
    .first();
  await expect(card).toHaveAttribute("data-presentation", "showroom");
  await expect(card).toHaveAttribute("data-view-mode", "list");
  await expect(
    card.locator('[data-slot="showroom-vehicle-heading"]')
  ).toBeVisible();
  await expect(
    card.locator('[data-slot="showroom-vehicle-facts"]')
  ).toBeVisible();
  const geometry = await card.evaluate((element) => {
    const media = element
      .querySelector('[data-slot="vehicle-card-media"]')
      ?.getBoundingClientRect();
    const content = element
      .querySelector('[data-slot="vehicle-card-content"]')
      ?.getBoundingClientRect();
    return {
      mediaRight: media?.right ?? 0,
      contentLeft: content?.left ?? 0,
      cardHeight: element.getBoundingClientRect().height,
      mediaHeight: media?.height ?? 0,
    };
  });
  expect(geometry.contentLeft).toBeGreaterThanOrEqual(geometry.mediaRight);
  expect(geometry.cardHeight - geometry.mediaHeight).toBeLessThan(3);
  await expectNoHorizontalOverflow(page);
});
