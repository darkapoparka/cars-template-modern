import { expect, test } from "@playwright/test";

test("make and model search narrow choices without losing filter selection", async ({
  page,
}) => {
  await page.goto("/cars");
  await page
    .getByRole("button", { name: "Отвори филтрите", exact: true })
    .tap();
  await page.getByRole("button", { name: "Марка и модел, Всички марки" }).tap();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("searchbox").fill("bmw");
  await expect(
    dialog.getByRole("button", { name: "Audi", exact: true })
  ).toBeHidden();
  await dialog.getByRole("button", { name: "BMW", exact: true }).tap();
  await dialog.getByRole("searchbox").fill("x5");
  await expect(
    dialog.getByRole("button", { name: "X3", exact: true })
  ).toBeHidden();
  await dialog.getByRole("button", { name: "X5", exact: true }).tap();
  await dialog
    .getByRole("button", { name: "Покажи обявите", exact: true })
    .tap();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("model"))
    .toBe("X5");
});

test("linked import edits preserve preparation details and change required labels", async ({
  page,
}) => {
  await page.goto(
    "/imports?sourceUrl=https%3A%2F%2Fexample.com%2Fcar#import-request"
  );
  const form = page.locator('[data-slot="import-request-form"]');
  await expect(
    form.locator('[data-slot="import-vehicle-details"]')
  ).toBeHidden();
  await form
    .getByRole("button", { name: "Допълнителни данни (по избор)", exact: true })
    .tap();
  await form.locator('input[name="budget"]').fill("30000 EUR");
  await form.getByRole("button", { name: "Промени", exact: true }).tap();
  const source = form.locator('input[name="sourceUrl"]');
  await expect(source).toBeFocused();
  await source.fill("");
  await expect(form.locator('label[for="import-mobile-make"]')).toHaveText(
    "Марка *"
  );
  await expect(form.locator('input[name="budget"]')).toHaveValue("30000 EUR");
  await source.fill("https://example.com/replacement");
  await expect(form.locator('label[for="import-mobile-make"]')).not.toHaveText(
    "Марка *"
  );
  await expect(form.locator('input[name="budget"]')).toHaveValue("30000 EUR");
  const values = await form.evaluate((element: HTMLFormElement) =>
    new FormData(element).getAll("sourceUrl")
  );
  expect(values).toEqual(["https://example.com/replacement"]);
  const year = form.locator('input[name="year"]');
  await year.fill("1");
  await form
    .getByRole("button", { name: "Допълнителни данни (по избор)", exact: true })
    .tap();
  await expect(year).toBeHidden();
  expect(
    await form.evaluate((element: HTMLFormElement) => element.reportValidity())
  ).toBe(false);
  await expect(year).toBeVisible();
  await expect(year).toBeFocused();
});

test("Sell back keeps the draft and returns focus without clearing", async ({
  page,
}) => {
  await page.goto("/sell");
  const trigger = page.locator('[data-slot="mobile-sell-manual-entry"]');
  await trigger.tap();
  const dialog = page.getByRole("dialog");
  await dialog.locator('textarea[name="notes"]').fill("Keep on back");
  await dialog
    .getByRole("button", { name: "Назад към продажбата", exact: true })
    .tap();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.tap();
  await expect(dialog.locator('textarea[name="notes"]')).toHaveValue(
    "Keep on back"
  );
});

test("linked import edit and expansion wait for hydration", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto(
      new URL("/imports?sourceUrl=https%3A%2F%2Fexample.com%2Fcar", baseURL)
        .href
    );
    const form = page.locator('[data-slot="import-request-form"]');
    await expect(
      form.getByRole("button", { name: "Промени", exact: true })
    ).toBeDisabled();
    await expect(
      form.getByRole("button", {
        name: "Допълнителни данни (по избор)",
        exact: true,
      })
    ).toBeDisabled();
  } finally {
    await context.close();
  }
});

test.beforeEach(async ({ page }) => {
  // Exercise only local preview UI. Never send enquiries or call providers.
  await page.route("**/*", (route) =>
    ["GET", "HEAD", "OPTIONS"].includes(route.request().method())
      ? route.continue()
      : route.abort("blockedbyclient")
  );
});

for (const [category, make, model] of [
  ["truck", "Scania", "R500"],
  ["motorbike", "Ducati", "Monster"],
  ["van", "Iveco", "Daily"],
]) {
  test(`${category} custom make is serialized exactly once`, async ({
    page,
  }) => {
    const query = new URLSearchParams({
      category,
      make,
      model,
      year: "2022",
      mileage: "90000",
      notes: "Synthetic QA",
    });
    await page.goto(`/sell?${query}`);
    const form = page.locator('[data-slot="mobile-sell-details-form"]');
    await expect(form).toBeVisible();
    const values = await form.evaluate((element: HTMLFormElement) => {
      const data = new FormData(element);
      return {
        make: data.getAll("make"),
        model: data.getAll("model"),
        category: data.get("category"),
      };
    });
    expect(values).toEqual({ make: [make], model: [model], category });
    await form.getByRole("button", { name: "Преглед преди обаждане" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("make"))
      .toBe(make);
    await expect(
      page.locator('[data-slot="sell-selected-vehicle"]')
    ).toContainText(make);
    await page
      .getByRole("link", { name: "Редактирайте данните", exact: true })
      .click();
    await expect(form.locator('input[name="make"]')).toHaveValue(make);
    await expect(form.locator('input[name="model"]')).toHaveValue(model);
  });
}

test("clearing a Sell draft also clears its refresh source", async ({
  page,
}) => {
  await page.goto(
    "/sell?vin=WBA12345678901234&make=Scania&model=R500&category=truck&year=2022&mileage=90000&notes=QA&ref=qa"
  );
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Изчисти въведените данни", exact: true })
    .click();
  await expect(dialog.locator('input[name="vin"]')).toHaveValue(
    "WBA12345678901234"
  );
  await dialog
    .getByRole("button", { name: "Запази данните", exact: true })
    .click();
  await expect(
    dialog.getByRole("button", {
      name: "Изчисти въведените данни",
      exact: true,
    })
  ).toBeFocused();
  await dialog
    .getByRole("button", { name: "Изчисти въведените данни", exact: true })
    .click();
  await dialog
    .getByRole("button", { name: "Изчисти данните", exact: true })
    .click();
  await expect(dialog.locator('input[name="vin"]')).toHaveValue("");
  const query = new URL(page.url()).searchParams;
  for (const field of [
    "vin",
    "make",
    "model",
    "category",
    "year",
    "mileage",
    "notes",
  ]) {
    expect(query.has(field)).toBe(false);
  }
  expect(query.get("ref")).toBe("qa");
  await page.reload();
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("empty article search offers a complete reset and keeps search focus", async ({
  page,
}) => {
  await page.goto("/guides?topic=import&q=not-a-real-article");
  await expect(page.getByText("Няма материали с тези критерии")).toBeVisible();
  await page
    .getByRole("button", { name: "Покажи всички материали", exact: true })
    .click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page.getByRole("searchbox")).toBeFocused();
  await expect(page.getByRole("status")).toHaveText("6 материала");
  expect(new URL(page.url()).search).toBe("");
  await expect(page.getByText("Няма материали с тези критерии")).toBeHidden();
});

test("selected-vehicle desktop markup retains canonical form values", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(
    "/sell?category=car&make=BMW&model=X5&year=2020&mileage=80000"
  );
  const form = page.locator('[data-slot="sell-vehicle-start-form"]');
  await expect(form).toBeVisible();
  const values = await form.evaluate((element: HTMLFormElement) => {
    const data = new FormData(element);
    return { make: data.getAll("make"), model: data.getAll("model") };
  });
  expect(values).toEqual({ make: ["BMW"], model: ["X5"] });
});

test("import triggers cannot lose taps before client handlers are attached", async ({
  browser,
  baseURL,
}) => {
  const unhydrated = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    locale: "bg-BG",
  });
  try {
    const page = await unhydrated.newPage();
    await page.goto(new URL("/imports", baseURL).href);
    await expect(
      page.getByRole("button", { name: "Опишете автомобил", exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", {
        name: "Отворете полето за линк към обява",
        exact: true,
      })
    ).toBeDisabled();
  } finally {
    await unhydrated.close();
  }
});

test("unfinished Sell numbers survive dismissal and still require correction", async ({
  page,
}) => {
  await page.goto("/sell");
  const trigger = page.locator('[data-slot="mobile-sell-manual-entry"]');
  await trigger.tap();
  const form = page.locator('[data-slot="mobile-sell-details-form"]');
  await form.locator('input[name="year"]').fill("202");
  await form.locator('input[name="mileage"]').fill("10000001");
  await form.locator('input[name="vin"]').fill("WBA123");
  await form
    .locator('textarea[name="notes"]')
    .fill("Synthetic unfinished draft");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Затворете", exact: true })
    .tap();
  await expect(form).toBeHidden();
  await trigger.tap();
  await expect(form.locator('input[name="year"]')).toHaveValue("202");
  await expect(form.locator('input[name="mileage"]')).toHaveValue("10000001");
  await expect(form.locator('input[name="vin"]')).toHaveValue("WBA123");
  await expect(form.locator('textarea[name="notes"]')).toHaveValue(
    "Synthetic unfinished draft"
  );
  expect(
    await form.evaluate((element: HTMLFormElement) => element.checkValidity())
  ).toBe(false);
  await form.locator('input[name="year"]').fill("2022");
  await form.locator('input[name="mileage"]').fill("120000");
  await form.locator('input[name="vin"]').fill("WBA12345678901234");
  expect(
    await form.evaluate((element: HTMLFormElement) => element.checkValidity())
  ).toBe(true);
});

for (const slot of ["mobile-sell-manual-entry", "mobile-sell-vin-entry"]) {
  test(`touch dismissal restores focus to ${slot}`, async ({ page }) => {
    await page.goto("/sell");
    const trigger = page.locator(`[data-slot="${slot}"]`);
    await trigger.tap();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Затворете", exact: true }).tap();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

test("landscape Sell help returns focus through the details handoff", async ({
  page,
}) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/sell");
  const trigger = page.locator('[data-slot="mobile-service-help"]');
  await trigger.tap();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Затвори информацията", exact: true })
    .tap();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.tap();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Въведете данните", exact: true })
    .tap();
  await expect(
    page.locator('[data-slot="mobile-sell-details-form"]')
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const route of ["/sell", "/guides?topic=import&q=qa-no-article"]) {
  test(`${route} controls wait for hydration instead of losing the first tap`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
      locale: "bg-BG",
    });
    try {
      const page = await context.newPage();
      await page.goto(new URL(route, baseURL).href);
      if (route === "/sell") {
        for (const slot of [
          "mobile-sell-manual-entry",
          "mobile-sell-vin-entry",
          "mobile-service-help",
        ]) {
          await expect(page.locator(`[data-slot="${slot}"]`)).toBeDisabled();
        }
      } else {
        await expect(page.getByRole("searchbox")).toBeDisabled();
        for (const name of [
          "Филтрирай материалите",
          "Изчисти търсенето",
          "Покажи всички материали",
        ]) {
          await expect(
            page.getByRole("button", { name, exact: true })
          ).toBeDisabled();
        }
        const topics = page.locator("main button[aria-pressed]");
        expect(await topics.count()).toBeGreaterThan(0);
        for (const topic of await topics.all()) {
          await expect(topic).toBeDisabled();
        }
      }
    } finally {
      await context.close();
    }
  });
}

for (const viewport of [
  { width: 320, height: 700 },
  { width: 844, height: 390 },
]) {
  test(`clearing import link keeps typing focus at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/imports");
    const trigger = page.getByRole("button", {
      name: "Отворете полето за линк към обява",
      exact: true,
    });
    await trigger.tap();
    const dialog = page.locator('[data-slot="mobile-import-source-search"]');
    const input = dialog.getByRole("textbox", {
      name: "Линк към обявата",
      exact: true,
    });
    await input.fill("https://example.com/vehicle");
    await dialog
      .getByRole("button", { name: "Изчистете линка", exact: true })
      .tap();
    await expect(input).toHaveValue("");
    await expect(input).toBeFocused();
    await expect(
      dialog.getByRole("button", {
        name: "Продължете с този линк",
        exact: true,
      })
    ).toBeDisabled();
    await page.keyboard.type("https://example.com/replacement");
    await expect(input).toHaveValue("https://example.com/replacement");
    await dialog
      .getByRole("button", { name: "Затворете търсенето", exact: true })
      .tap();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.tap();
    await expect(input).toHaveValue("https://example.com/replacement");
    await input.fill("not-a-url");
    await dialog
      .getByRole("button", { name: "Продължете с този линк", exact: true })
      .tap();
    await expect(dialog).toBeVisible();
    expect(
      await input.evaluate(
        (element: HTMLInputElement) => element.validity.typeMismatch
      )
    ).toBe(true);
    expect(new URL(page.url()).pathname).toBe("/imports");
  });
}
