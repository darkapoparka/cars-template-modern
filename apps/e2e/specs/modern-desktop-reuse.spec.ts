import { expect, test } from "@playwright/test";

test("master desktop wordmarks stay within the existing frame", async ({
  page,
}) => {
  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/en");
    const header = page.locator('[data-slot="dealer-desktop-header"]:visible');
    await expect(
      header.getByRole("link", { name: "Modern home" })
    ).toBeVisible();
    await expect(header).toContainText("Modern");
    await expect(header.locator('img[src*="lead-logo"]')).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth
      )
    ).toBe(false);
  }
});

test("legacy shortlist is sanitized and opens in the active locale", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const car = {
      id: "demo",
      title: "BMW X5",
      href: "/bg/listing/bmw-x5-m50d-sofia-2020",
      image: "",
      price: "89 379 лв.",
      money: { amount: 89_379, currency: "BGN" },
    };
    localStorage.setItem(
      "modern-desktop-saved-cars-v1",
      JSON.stringify([
        car,
        car,
        { ...car, id: "unsafe", href: "/\\external.test/x" },
        { ...car, id: "unknown-route", href: "/bg/contact" },
      ])
    );
    localStorage.setItem(
      "modern-desktop-saved-cars-v1:another-dealer:/",
      JSON.stringify([{ ...car, id: "other-dealer" }])
    );
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/en");
  const trigger = page.locator(
    'header [data-slot="desktop-saved-cars"]:visible'
  );
  await expect(trigger).toHaveText("Saved (1)");
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Saved cars", exact: true });
  await expect(dialog.locator("article")).toHaveCount(1);
  await expect(dialog.locator("article a")).toHaveAttribute(
    "href",
    "/en/listing/bmw-x5-m50d-sofia-2020"
  );
  await page.mouse.click(5, 5);
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});

test("PDP has accurate desktop image sizing and visible photo count", async ({
  page,
}) => {
  await page.goto("/en/listing/bmw-x5-m50d-sofia-2020");
  const gallery = page.locator('[data-slot="listing-gallery"]:visible');
  await expect(
    gallery.locator('[data-slot="listing-gallery-stage"] img').first()
  ).toHaveAttribute(
    "sizes",
    "(max-width: 1023px) 100vw, (max-width: 1399px) calc(100vw - 452px), 948px"
  );
  await expect(
    gallery.getByRole("button", {
      name: "Open photo 1 of 1 full screen",
      exact: true,
    })
  ).toContainText("1 / 1");
  await expect(
    page.locator('[data-slot="listing-transaction-price"]:visible')
  ).toContainText("89");
  await expect(
    page.locator('[data-slot="listing-dealership-card"]:visible')
  ).toContainText("Modern");
  await expect(
    page.locator('[data-slot="listing-dealership-card"]:visible iframe')
  ).toHaveAttribute("allowfullscreen", "");
});

test("narrow desktop related cards keep price actions and facts inside each card", async ({
  page,
}) => {
  for (const width of [1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["bg", "en"]) {
      await page.goto(`/${locale}/listing/bmw-x5-m50d-sofia-2020`);
      const cards = page.locator(
        '[data-slot="listing-related-rail"] article:visible'
      );
      await expect(cards).toHaveCount(3);
      const collisions = await cards.evaluateAll((articles) =>
        articles.flatMap((article) => {
          const bounds = article.getBoundingClientRect();
          const row = article.querySelector(
            '[data-slot="showroom-vehicle-price-row"]'
          );
          const price = row
            ?.querySelector('[data-slot="vehicle-card-price"]')
            ?.getBoundingClientRect();
          const action = row
            ?.querySelector('[data-slot="showroom-vehicle-open"]')
            ?.getBoundingClientRect();
          const overlaps =
            price &&
            action &&
            price.right > action.left &&
            price.left < action.right &&
            price.bottom > action.top &&
            price.top < action.bottom;
          const escapingFacts = [
            ...article.querySelectorAll(
              '[data-slot="showroom-vehicle-facts"] li'
            ),
          ].some((fact) => {
            const range = document.createRange();
            range.selectNodeContents(fact);
            return [...range.getClientRects()].some(
              (rect) => rect.left < bounds.left || rect.right > bounds.right
            );
          });
          return overlaps || escapingFacts ? [article.textContent] : [];
        })
      );
      expect(collisions).toEqual([]);
    }
  }
});

test("home stock tabs filter in place and support keyboard browsing", async ({
  page,
}) => {
  for (const locale of ["bg", "en"]) {
    await page.goto(`/${locale}`);
    const stock = page.locator('[data-slot="home-stock-panel"]');
    const tabs = stock.getByRole("tablist");
    const all = tabs.getByRole("tab", {
      name: locale === "bg" ? "Всички" : "All",
      exact: true,
    });
    const recommended = tabs.getByRole("tab", {
      name: locale === "bg" ? "Препоръчани" : "Recommended",
      exact: true,
    });
    const recent = tabs.getByRole("tab", {
      name: locale === "bg" ? "Последни" : "Recently added",
      exact: true,
    });
    const cards = stock.locator(
      '[data-slot="home-stock-grid"] article:visible'
    );
    await expect(tabs.getByRole("tab")).toHaveCount(3);
    await expect(all).toHaveAttribute("aria-selected", "true");
    await expect(cards).toHaveCount(8);
    const initialTitles = await cards
      .locator('[data-slot="vehicle-card-title"]:visible')
      .allTextContents();
    await recommended.click();
    await expect(recommended).toHaveAttribute("aria-selected", "true");
    await expect(cards).toHaveCount(3);
    await expect(
      cards.locator('[data-slot="vehicle-card-media-badges"]')
    ).toHaveCount(3);
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await recent.click();
    await expect(cards).toHaveCount(8);
    expect(
      await cards
        .locator('[data-slot="vehicle-card-title"]:visible')
        .allTextContents()
    ).not.toEqual(initialTitles);
    await expect(stock.getByRole("status")).toContainText("8");
    await all.focus();
    await page.keyboard.press("ArrowRight");
    await expect(recommended).toBeFocused();
    await expect(recommended).toHaveAttribute("aria-selected", "true");
    await expect(cards).toHaveCount(3);
    await page.keyboard.press("End");
    await expect(recent).toBeFocused();
    await page.keyboard.press("Home");
    await expect(all).toBeFocused();
    await expect(cards).toHaveCount(8);
    await expect(page).toHaveURL(new RegExp(`/${locale}$`));
    await expect(
      stock.getByRole("link", {
        name: locale === "bg" ? "Виж всички автомобили" : "View all cars",
        exact: true,
      })
    ).toHaveAttribute("href", `/${locale}/cars`);
  }
});

test("home stock rail follows selection and respects reduced motion", async ({
  page,
}) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/bg");
    await page.evaluate(() => document.fonts.ready);
    const tabs = page.locator('[data-slot="home-stock-tabs"]');
    await expect(tabs.getByRole("tab")).toHaveCount(3);
    const motionProbe = tabs.evaluate(async (rail) => {
      const indicator = rail.querySelector<HTMLElement>(
        '[data-slot="home-stock-indicator"]'
      );
      const buttons = rail.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      if (!indicator || buttons.length !== 3) {
        throw new Error("Stock rail is missing");
      }
      const start = indicator.getBoundingClientRect().left;
      const samples: number[] = [];
      for (let frame = 0; frame < 120; frame += 1) {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        );
        const left = indicator.getBoundingClientRect().left;
        samples.push(left);
        if (
          buttons[1].getAttribute("aria-selected") === "true" &&
          Math.abs(left - buttons[1].getBoundingClientRect().left) < 0.5
        ) {
          break;
        }
      }
      const selected = buttons[1].getBoundingClientRect();
      const active = indicator.getBoundingClientRect();
      return {
        movedBetweenTabs: samples.some(
          (left) => left > start + 1 && left < selected.left - 1
        ),
        alignment: Math.max(
          Math.abs(active.left - selected.left),
          Math.abs(active.top - selected.top),
          Math.abs(active.width - selected.width),
          Math.abs(active.height - selected.height)
        ),
      };
    });
    const [motion] = await Promise.all([
      motionProbe,
      tabs.getByRole("tab", { name: "Препоръчани", exact: true }).click(),
    ]);
    expect(motion.movedBetweenTabs).toBe(true);
    expect(motion.alignment).toBeLessThan(1);
    await expect(
      tabs.getByRole("tab", { name: "Препоръчани", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await tabs.getByRole("tab", { name: "Последни", exact: true }).click();
    const reduced = await tabs.evaluate((rail) => {
      const indicator = rail.querySelector<HTMLElement>(
        '[data-slot="home-stock-indicator"]'
      );
      const selected = rail.querySelector('[role="tab"][aria-selected="true"]');
      if (!(indicator && selected)) {
        throw new Error("Stock rail is missing");
      }
      return {
        duration: getComputedStyle(indicator).transitionDuration,
        alignment: Math.abs(
          indicator.getBoundingClientRect().left -
            selected.getBoundingClientRect().left
        ),
      };
    });
    expect(Number.parseFloat(reduced.duration)).toBeLessThan(0.001);
    expect(reduced.alignment).toBeLessThan(1);
    await expect(page).toHaveURL((url) => url.pathname === "/bg");
  }
});
