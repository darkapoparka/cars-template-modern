import { expect, test } from "@playwright/test";

const showroomNames = { bg: /Автосалон/, en: /Showroom/ };
const viewingNames = { bg: /Уговорете оглед/, en: /Arrange a viewing/ };
const callNames = { bg: /Телефон/, en: /Phone/ };

test.use({ launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] } });

test.beforeEach(async ({ baseURL, context, page }) => {
  // biome-ignore lint/suspicious/noSkippedTests: Contact cards are a desktop surface.
  test.skip((page.viewportSize()?.width ?? 0) < 1024, "Desktop Contact cards");
  if (!baseURL) {
    throw new Error("Contact card regression requires a preview origin");
  }
  const response = await context.request.post("/api/preferences", {
    headers: { origin: new URL(baseURL).origin },
    data: {
      action: "dismiss",
      locale: "bg",
      country: "BG",
      returnTo: "/contact",
    },
  });
  expect(response.status()).toBe(200);
  await page.addInitScript(() => {
    document.addEventListener(
      "click",
      (event) => {
        const link = (event.target as Element).closest("a");
        if (
          link &&
          (link.protocol === "tel:" ||
            link.protocol === "mailto:" ||
            link.origin !== location.origin)
        ) {
          event.preventDefault();
          document.documentElement.dataset.contactAction = link.href;
        }
      },
      true
    );
  });
});

for (const locale of ["bg", "en"] as const) {
  test(`cards support full-surface actions, hover and keyboard access (${locale})`, async ({
    page,
  }) => {
    await page.goto(`/${locale}/contact`);
    await expect(
      page.locator('[data-slot="public-route-loading-content"]')
    ).toBeHidden();
    await page.evaluate(() => document.fonts.ready);
    const showroom = page.locator(
      '[data-slot="desktop-contact-showroom-card"]'
    );
    const phone = page.locator('[data-slot="desktop-contact-phone-card"]');
    const viewing = page.locator('[data-slot="desktop-contact-viewing-card"]');
    const call = phone.getByRole("link");
    const copy = phone.getByRole("button");
    const phoneHref = await call.getAttribute("href");
    expect(phoneHref?.startsWith("tel:")).toBe(true);
    expect(await viewing.getAttribute("href")).toBe(phoneHref);
    expect(await showroom.getAttribute("target")).toBe("_blank");
    expect(await showroom.getAttribute("rel")).toContain("noreferrer");
    await expect(showroom).toHaveAccessibleName(showroomNames[locale]);
    await expect(viewing).toHaveAccessibleName(viewingNames[locale]);

    await showroom.click({ position: { x: 8, y: 8 } });
    await expect(page.locator("html")).toHaveAttribute(
      "data-contact-action",
      (await showroom.getAttribute("href")) ?? ""
    );
    await viewing.click({ position: { x: 8, y: 8 } });
    await expect(page.locator("html")).toHaveAttribute(
      "data-contact-action",
      phoneHref ?? ""
    );
    await page.evaluate(() => {
      delete document.documentElement.dataset.contactAction;
    });
    await phone.click({ position: { x: 8, y: 8 } });
    await expect(page.locator("html")).toHaveAttribute(
      "data-contact-action",
      phoneHref ?? ""
    );

    await phone.scrollIntoViewIfNeeded();
    const before = await phone.boundingBox();
    await phone.hover();
    await expect(phone).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(phone).toHaveCSS("color", "rgb(5, 11, 32)");
    await expect(
      phone.getByText(locale === "bg" ? "Телефон" : "Phone", {
        exact: true,
      })
    ).toBeVisible();
    expect(await phone.boundingBox()).toEqual(before);

    await page.mouse.move(0, 0);
    await call.focus();
    await expect(call).toBeFocused();
    await expect(call).toHaveAccessibleName(callNames[locale]);
    await expect(phone).toHaveCSS("background-color", "rgb(255, 255, 255)");
    expect(
      Number.parseFloat(
        await call.evaluate(
          (element) => getComputedStyle(element, "::after").outlineWidth
        )
      )
    ).toBeGreaterThan(0);
    await page.keyboard.press("Tab");
    await expect(copy).toBeFocused();
    await expect(copy).toHaveCSS("outline-color", "rgb(64, 95, 242)");
    expect(
      Number.parseFloat(
        await copy.evaluate((element) => getComputedStyle(element).outlineWidth)
      )
    ).toBeGreaterThan(0);
    expect(await phone.boundingBox()).toEqual(before);
    await expect(page.getByRole("tooltip")).toHaveText(
      locale === "bg" ? "Копирайте номера" : "Copy phone number"
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toBeHidden();
    await expect(copy).toBeFocused();
    await page.mouse.move(0, 0);
    await call.focus();
    await copy.hover();
    await expect(page.getByRole("tooltip")).toHaveText(
      locale === "bg" ? "Копирайте номера" : "Copy phone number"
    );
    expect(await phone.boundingBox()).toEqual(before);
    await page.mouse.move(0, 0, { steps: 5 });
    await expect(page.getByRole("tooltip")).toBeHidden();
    expect(page.url()).toBe(new URL(`/${locale}/contact`, page.url()).href);
  });

  test(`copying uses the displayed number and never invokes calling (${locale})`, async ({
    browserName,
    context,
    page,
  }) => {
    if (browserName === "chromium") {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    } else {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: {
            writeText: (value: string) => {
              document.documentElement.dataset.copiedPhone = value;
              return Promise.resolve();
            },
          },
        });
      });
    }
    await page.goto(`/${locale}/contact`);
    const phone = page.locator('[data-slot="desktop-contact-phone-card"]');
    const copy = phone.getByRole("button");
    const number = (await phone.locator("p").textContent()) ?? "";
    expect(number.length).toBeGreaterThan(0);
    await copy.click();
    await expect(copy).toHaveAttribute("data-copy-state", "copied");
    await expect(copy).toHaveAccessibleName(
      locale === "bg" ? "Номерът е копиран" : "Phone number copied"
    );
    await expect(phone.getByRole("status")).toHaveText(
      locale === "bg" ? "Номерът е копиран" : "Phone number copied"
    );
    const copied = await page.evaluate(() =>
      navigator.clipboard.readText
        ? navigator.clipboard.readText()
        : document.documentElement.dataset.copiedPhone
    );
    expect(copied).toBe(number);
    expect(
      await page.locator("html").getAttribute("data-contact-action")
    ).toBeNull();
    await expect(copy).toHaveAttribute("data-copy-state", "idle");
  });

  for (const clipboard of ["denied", "missing"] as const) {
    test(`a ${clipboard} clipboard selects the number without claiming success (${locale})`, async ({
      page,
    }) => {
      await page.addInitScript((mode) => {
        Object.defineProperty(navigator, "clipboard", {
          value:
            mode === "missing"
              ? undefined
              : {
                  writeText: () =>
                    Promise.reject(new Error("Clipboard denied")),
                },
        });
      }, clipboard);
      await page.goto(`/${locale}/contact`);
      const phone = page.locator('[data-slot="desktop-contact-phone-card"]');
      const copy = phone.getByRole("button");
      const number = await phone.locator("p").textContent();
      await copy.click();
      await expect(copy).toHaveAttribute("data-copy-state", "selected");
      await expect(phone.getByRole("status")).toHaveText(
        locale === "bg"
          ? "Копирайте избрания номер"
          : "Copy the selected number"
      );
      expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
        number
      );
      expect(
        await page.locator("html").getAttribute("data-contact-action")
      ).toBeNull();
    });
  }
}
