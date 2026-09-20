import { chromium } from "@playwright/test";
import {
  assert,
  blockBusinessWrites,
  check,
  finish,
  mount,
  openPreferences,
  origin,
  ready,
  url,
} from "./localization-harness.mjs";

const labels = {
  en: {
    save: "Save preferences",
    dismiss: "Not now",
    close: "Close country and language preferences",
    error: "Your preferences could not be saved. Please try again.",
  },
  bg: {
    save: "Запазете предпочитанията",
    dismiss: "Не сега",
    close: "Затворете избора на държава и език",
    error: "Предпочитанията не бяха запазени. Опитайте отново.",
  },
};
const locales = ["en", "bg"];
const widths = [320, 390, 1440];
const localePrefix = /^\/(?:en|bg)(?=\/|$)/;
const browser = await chromium.launch({ headless: true });
async function fixture(
  locale,
  width,
  {
    dismissed = false,
    javaScriptEnabled = true,
    storageBlocked = false,
    cookiesRejected = false,
  } = {}
) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    locale: locale === "en" ? "en-GB" : "bg-BG",
    javaScriptEnabled,
  });
  await blockBusinessWrites(context, { preferences: false });
  if (dismissed) {
    await context.addCookies([
      {
        name: "cars_prompt",
        value: "v1",
        url: origin.origin,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  }
  if (storageBlocked) {
    await context.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new DOMException("Blocked", "SecurityError");
      };
      Storage.prototype.setItem = () => {
        throw new DOMException("Blocked", "SecurityError");
      };
    });
  }
  const requests = [],
    waiting = [];
  const control = { mode: "normal" };
  // All preference POSTs are fulfilled in the test process. No live preference endpoint is called.
  await context.route(url("/api/preferences"), async (route) => {
    const request = route.request();
    let data;
    if (request.headers()["content-type"]?.includes("application/json")) {
      data = request.postDataJSON();
    } else {
      data = Object.fromEntries(new URLSearchParams(request.postData() ?? ""));
    }
    requests.push(data);
    const mode = control.mode;
    if (mode === "hold") {
      await new Promise((resolve) => waiting.push(resolve));
    }
    const current = new URL(data.returnTo, origin.origin);
    const rest =
      current.pathname.slice(mount.length).replace(localePrefix, "") || "";
    const destination =
      data.action === "save"
        ? `${mount}/${data.locale}${rest}${current.search}${current.hash}`
        : data.returnTo;
    try {
      if (mode === "normal" && !cookiesRejected) {
        const cookies = [
          {
            name: "cars_prompt",
            value: "v1",
            url: origin.origin,
            httpOnly: true,
            sameSite: "Lax",
          },
        ];
        if (data.action === "save") {
          cookies.push(
            {
              name: "cars_locale",
              value: data.locale,
              url: origin.origin,
              httpOnly: true,
              sameSite: "Lax",
            },
            {
              name: "cars_country",
              value: data.country,
              url: origin.origin,
              httpOnly: true,
              sameSite: "Lax",
            }
          );
        }
        await context.addCookies(cookies);
      }
      if (javaScriptEnabled) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            destination:
              mode === "hostile" ? "//foreign.invalid/" : destination,
          }),
        });
      } else {
        await route.fulfill({
          status: 303,
          headers: { location: destination },
          body: "",
        });
      }
    } catch {
      /* The delayed request may have been canceled by a newer intent or context teardown. */
    }
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return {
    context,
    page,
    requests,
    control,
    errors,
    release: () => {
      for (const resolve of waiting.splice(0)) {
        resolve();
      }
    },
    close: async () => {
      for (const resolve of waiting.splice(0)) {
        resolve();
      }
      await context.close();
    },
  };
}
try {
  for (const locale of locales) {
    for (const width of widths) {
      await check(
        "client preference save, reload, manual reopen and keyboard",
        async () => {
          const f = await fixture(locale, width);
          const other = locale === "en" ? "bg" : "en";
          try {
            await f.page.goto(url(`/${locale}/contact?topic=trade-in#details`));
            await ready(f.page);
            const dialog = f.page.locator("dialog[data-locale-dialog]");
            await dialog.waitFor({ state: "visible" });
            assert.deepEqual(
              await dialog
                .locator('select[name="locale"] option')
                .evaluateAll((nodes) => nodes.map((n) => n.value).sort()),
              ["bg", "en"]
            );
            await dialog.locator('select[name="country"]').selectOption("DE");
            assert.equal(
              await dialog.locator('select[name="locale"]').inputValue(),
              locale
            );
            const box = await dialog.boundingBox();
            assert.ok(
              box.width <= width &&
                box.x >= -1 &&
                box.y >= 0 &&
                box.y + box.height <= 845,
              JSON.stringify(box)
            );
            await dialog
              .getByRole("button", {
                name: labels[locale].dismiss,
                exact: true,
              })
              .focus();
            await f.page.keyboard.press("Tab");
            assert.ok(
              await f.page.evaluate(() =>
                document
                  .querySelector("dialog[data-locale-dialog]")
                  ?.contains(document.activeElement)
              )
            );
            await dialog.locator('select[name="locale"]').selectOption(other);
            await dialog
              .getByRole("button", { name: labels[locale].save, exact: true })
              .click();
            await f.page.waitForURL(
              url(`/${other}/contact?topic=trade-in#details`)
            );
            await ready(f.page);
            assert.equal(
              await f.page.locator("html").getAttribute("lang"),
              other
            );
            assert.equal(
              await f.page
                .locator("dialog[data-locale-dialog]")
                .getAttribute("data-preference-country"),
              "DE"
            );
            assert.ok(
              !(await f.page.locator("dialog[data-locale-dialog]").isVisible())
            );
            await f.page.reload();
            await ready(f.page);
            assert.ok(
              !(await f.page.locator("dialog[data-locale-dialog]").isVisible())
            );
            await openPreferences(f.page, width);
            await f.page
              .locator('dialog select[name="country"]')
              .selectOption("GB");
            await f.page.keyboard.press("Escape");
            await f.page
              .locator("dialog[data-locale-dialog]")
              .waitFor({ state: "hidden" });
            const cookie = (await f.context.cookies()).find(
              (c) => c.name === "cars_country"
            );
            assert.equal(cookie.value, "DE");
            assert.ok(
              await f.page.evaluate(
                () =>
                  document.activeElement instanceof HTMLElement &&
                  document.activeElement.getClientRects().length > 0
              )
            );
            assert.deepEqual(f.errors, []);
            return {
              requests: f.requests,
              persistence:
                "mock preference response; actual page rendering and navigation",
            };
          } finally {
            await f.close();
          }
        },
        { locale, width }
      );
      await check(
        "dismissal never accepts an unsaved locale or country",
        async () => {
          const f = await fixture(locale, width);
          try {
            await f.page.goto(url(`/${locale}/cars`));
            await ready(f.page);
            const dialog = f.page.locator("dialog[data-locale-dialog]");
            await dialog.waitFor({ state: "visible" });
            await dialog.locator('select[name="country"]').selectOption("DE");
            await dialog
              .getByRole("button", {
                name: labels[locale].dismiss,
                exact: true,
              })
              .click();
            await dialog.waitFor({ state: "hidden" });
            await f.page.waitForTimeout(150);
            const cookies = await f.context.cookies();
            assert.ok(
              !cookies.some(
                (c) => c.name === "cars_country" || c.name === "cars_locale"
              )
            );
            assert.equal(
              new URL(f.page.url()).pathname,
              `${mount}/${locale}/cars`
            );
            return { requests: f.requests, persistence: "mocked" };
          } finally {
            await f.close();
          }
        },
        { locale, width }
      );
      await check(
        "rapid close/reopen cancels stale save and clears busy state",
        async () => {
          const f = await fixture(locale, width, { dismissed: true });
          try {
            await f.page.goto(url(`/${locale}/cars`));
            await ready(f.page);
            await openPreferences(f.page, width);
            f.control.mode = "hold";
            await f.page
              .locator('dialog select[name="locale"]')
              .selectOption(locale === "en" ? "bg" : "en");
            await f.page.locator('dialog button[type="submit"]').click();
            await f.page.waitForFunction(
              () =>
                document.querySelector('dialog button[type="submit"]')?.disabled
            );
            await f.page
              .getByRole("button", { name: labels[locale].close, exact: true })
              .click();
            await f.page
              .locator("dialog[data-locale-dialog]")
              .waitFor({ state: "hidden" });
            await openPreferences(f.page, width);
            assert.ok(
              await f.page.locator('dialog button[type="submit"]').isEnabled()
            );
            f.release();
            await f.page.waitForTimeout(250);
            assert.equal(
              new URL(f.page.url()).pathname,
              `${mount}/${locale}/cars`
            );
            assert.ok(
              await f.page.locator('dialog button[type="submit"]').isEnabled()
            );
            f.control.mode = "hostile";
            await f.page.locator('dialog button[type="submit"]').click();
            await f.page
              .locator("dialog[data-locale-dialog]")
              .getByRole("alert")
              .waitFor();
            assert.equal(
              await f.page
                .locator("dialog[data-locale-dialog]")
                .getByRole("alert")
                .innerText(),
              labels[locale].error
            );
            assert.equal(new URL(f.page.url()).origin, origin.origin);
            assert.deepEqual(f.errors, []);
            return {
              requests: f.requests,
              network: "mocked delays and hostile destination",
            };
          } finally {
            await f.close();
          }
        },
        { locale, width }
      );
    }
  }
  for (const locale of locales) {
    await check(
      "no-JS native preference form preserves the return route",
      async () => {
        const f = await fixture(locale, 390, { javaScriptEnabled: false });
        const other = locale === "en" ? "bg" : "en";
        try {
          const returnTo = `${mount}/${locale}/contact?topic=trade-in`;
          await f.page.goto(
            url(
              `/${locale}/locale-settings?returnTo=${encodeURIComponent(returnTo)}`
            )
          );
          const form = f.page.locator("[data-locale-settings] form");
          assert.equal(
            await form.getAttribute("action"),
            `${mount}/api/preferences`
          );
          await form.locator('[name="locale"]').selectOption(other);
          await form.locator('[name="country"]').selectOption("DE");
          await form.locator('button[value="save"]').click();
          await f.page.waitForURL(url(`/${other}/contact?topic=trade-in`));
          assert.equal(
            await f.page.locator("html").getAttribute("lang"),
            other
          );
          return {
            requests: f.requests,
            endpoint: "mocked 303; actual native form/navigation without JS",
          };
        } finally {
          await f.close();
        }
      },
      { locale, width: 390 }
    );
    await check(
      "explicit URLs work with unavailable storage and rejected cookies",
      async () => {
        const f = await fixture(locale, 320, {
          storageBlocked: true,
          cookiesRejected: true,
        });
        try {
          await f.page.goto(url(`/${locale}/contact`));
          await ready(f.page);
          await f.page
            .locator("dialog[data-locale-dialog]")
            .waitFor({ state: "visible" });
          const other = locale === "en" ? "bg" : "en";
          await f.page
            .locator('dialog select[name="locale"]')
            .selectOption(other);
          await f.page.locator('dialog button[type="submit"]').click();
          await f.page.waitForURL(url(`/${other}/contact`));
          assert.equal(
            await f.page.locator("html").getAttribute("lang"),
            other
          );
          assert.ok(
            !(await f.context.cookies()).some((c) => c.name.startsWith("cars_"))
          );
          assert.deepEqual(f.errors, []);
          return {
            storage:
              "Storage API throws; preference cookies omitted by the test endpoint",
            requests: f.requests,
          };
        } finally {
          await f.close();
        }
      },
      { locale, width: 320 }
    );
  }
} finally {
  await browser.close();
}
finish();
