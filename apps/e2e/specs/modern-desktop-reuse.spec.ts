import { expect, test } from "@playwright/test";
import { dismissModernWelcome } from "../fixtures/modern-session.setup";

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

for (const locale of ["bg", "en"] as const) {
  for (const width of [1024, 1440]) {
    test(`home stock preview opens cars and the complete inventory (${locale}, ${width}px)`, async ({
      baseURL,
      context,
      page,
    }) => {
      await dismissModernWelcome(context.request, baseURL, locale);
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}`);
      const stock = page.locator('[data-slot="home-stock-panel"]');
      await expect(stock).toBeVisible();
      await expect(stock.getByRole("tablist")).toHaveCount(0);
      const cards = stock.locator(
        '[data-slot="home-stock-grid"] article:visible'
      );
      const visibleCount = width >= 1400 ? 5 : 4;
      await expect(cards).toHaveCount(visibleCount);
      expect(await stock.getByRole("status").innerText()).toContain(
        String(visibleCount)
      );
      const carLink = cards.first().locator('a[href*="/listing/"]').first();
      const carHref = await carLink.getAttribute("href");
      await carLink.focus();
      await expect(carLink).toBeFocused();
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.pathname === carHref);
      await expect(page.locator("h1:visible").first()).toBeVisible();
      await page.goBack();
      await expect(stock).toBeVisible();
      const allCars = stock.getByRole("link", {
        name: locale === "bg" ? "Виж всички автомобили" : "View all cars",
        exact: true,
      });
      await expect(allCars).toHaveAttribute("href", `/${locale}/cars`);
      await allCars.focus();
      await expect(allCars).toBeFocused();
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.pathname === `/${locale}/cars`);
      await expect(
        page.locator('[data-slot="marketplace-listing-grid"] article').first()
      ).toBeVisible();
    });
  }
}
