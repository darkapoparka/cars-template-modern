import path from "node:path";
import { chromium } from "@playwright/test";
import {
  assert,
  blockBusinessWrites,
  check,
  finish,
  mount,
  origin,
  output,
  ready,
  url,
  visibleImages,
} from "./localization-harness.mjs";

const cyrillic = /[А-Яа-яЍѝ]/;
const safeFilename = /[^a-zA-Z0-9]+/g;
const locales = (process.env.LOCALE_QA_LANGUAGES ?? "en,bg").split(",");
const widths = (process.env.LOCALE_QA_WIDTHS ?? "320,390,1440")
  .split(",")
  .map(Number);
const routes = [
  "",
  "/cars",
  "/cars/bmw",
  "/cars/bmw/x5",
  "/cars?q=zzzz-no-results",
  "/listing/bmw-x5-m50d-sofia-2020",
  "/listing/bmw-x5-m50d-sofia-2020/contact",
  "/contact?topic=trade-in",
  "/contact?intent=sell",
  "/imports",
  "/imports/china",
  "/sell",
  "/lease",
  "/guides",
  "/guides/buying-used-car-bulgaria",
  "/guides/dealer-listing-transparency",
  "/guides/financing-offer-questions",
  "/blog",
  "/blog/premium-used-car-checklist",
  "/legal/privacy",
  "/legal/terms",
  "/collections/chinese-ev-hybrids",
  "/vans",
  "/trucks",
  "/motorbikes",
  "/locale-settings",
  "/missing-locale-qa-page",
];
const browser = await chromium.launch({ headless: true });
try {
  for (const locale of locales) {
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: width < 1024 ? 844 : 1000 },
        locale: locale === "bg" ? "bg-BG" : "en-GB",
      });
      const blocked = await blockBusinessWrites(context);
      await context.addCookies([
        {
          name: "cars_prompt",
          value: "v1",
          url: origin.origin,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      const page = await context.newPage();
      let errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of routes) {
        errors = [];
        await check(
          "route",
          async () => {
            const response = await page.goto(url(`/${locale}${route}`), {
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            });
            await ready(page);
            let imageError = null;
            try {
              await visibleImages(page);
            } catch (error) {
              imageError = String(error);
            }
            const language = await page.locator("html").getAttribute("lang"),
              body = await page.locator("body").innerText(),
              title = await page.title();
            const mixed =
              locale === "en"
                ? [
                    ...new Set(
                      body
                        .split("\n")
                        .map((s) => s.trim())
                        .filter((s) => cyrillic.test(s) && s !== "Български")
                    ),
                  ]
                : [];
            const geometry = await page.evaluate(() => {
              const clipped = [];
              for (const e of document.querySelectorAll(
                '[role="tab"], [data-slot="dealer-bottom-nav"] a, [data-slot="dealer-bottom-nav"] button'
              )) {
                const r = e.getBoundingClientRect();
                if (!(r.width && r.height)) {
                  continue;
                }
                const range = document.createRange();
                range.selectNodeContents(e);
                for (const text of range.getClientRects()) {
                  if (
                    text.width > 0 &&
                    (text.left < r.left - 2 || text.right > r.right + 2)
                  ) {
                    clipped.push(e.textContent?.trim());
                  }
                }
              }
              return {
                viewport: innerWidth,
                scroll: document.documentElement.scrollWidth,
                clipped,
              };
            });
            const links = await page
              .locator('a[href^="/"]')
              .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")));
            const escaped = mount
              ? links.filter(
                  (href) =>
                    !(
                      href.startsWith(`${mount}/`) ||
                      href.startsWith("/variant-3/") ||
                      href.startsWith("//")
                    )
                )
              : [];
            const images = await page.locator("img").evaluateAll((nodes) =>
              nodes
                .filter((e) => {
                  const r = e.getBoundingClientRect();
                  return r.width > 0 && r.height > 0 && r.top < innerHeight;
                })
                .map((e) => ({
                  src: e.currentSrc,
                  alt: e.alt,
                  ok: e.complete && e.naturalWidth > 0,
                }))
            );
            const canonicalElement = page.locator('link[rel="canonical"]');
            const canonical = (await canonicalElement.count())
              ? await canonicalElement.getAttribute("href")
              : null;
            const detail = {
              status: response.status(),
              language,
              title,
              mixed,
              geometry,
              links,
              escaped,
              images,
              canonical,
              imageError,
              errors: [...errors],
              body,
              blocked: [...blocked],
            };
            await page.screenshot({
              path: path.join(
                output,
                `${locale}-${width}-${route.replace(safeFilename, "-") || "home"}.png`
              ),
              fullPage: false,
            });
            assert.equal(
              response.status(),
              route === "/missing-locale-qa-page" ? 404 : 200
            );
            assert.equal(language, locale);
            assert.equal(response.headers()["content-language"], locale);
            assert.ok(title);
            assert.ok(!imageError, JSON.stringify({ imageError, images }));
            assert.deepEqual(mixed, []);
            assert.ok(geometry.scroll <= width + 1, JSON.stringify(geometry));
            assert.deepEqual(geometry.clipped, []);
            assert.deepEqual(escaped, []);
            assert.deepEqual(errors, []);
            if (canonical) {
              assert.ok(
                new URL(canonical).pathname.startsWith(`${mount}/${locale}`),
                canonical
              );
            }
            assert.ok(
              !images.some((i) => locale === "en" && cyrillic.test(i.alt)),
              JSON.stringify(images)
            );
            return detail;
          },
          { locale, width, route }
        );
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}
finish();
