import path from "node:path";
import { chromium } from "@playwright/test";
import {
  blockBusinessWrites,
  check,
  finish,
  origin,
  output,
  ready,
  url,
} from "./localization-harness.mjs";

const browser = await chromium.launch({ headless: true });
try {
  for (const [pathname, width] of [
    ["/en/imports", 320],
    ["/en/imports", 390],
    ["/en", 1440],
    ["/en/lease", 320],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
    });
    await blockBusinessWrites(context, { preferences: false });
    await context.addCookies([
      { name: "cars_prompt", value: "v1", url: origin.origin },
    ]);
    const page = await context.newPage();
    await check(
      "image readiness diagnostic",
      async () => {
        await page.goto(url(pathname));
        await ready(page);
        await page.waitForTimeout(1500);
        const images = await page.evaluate(() =>
          [...document.images].map((image) => {
            const r = image.getBoundingClientRect();
            const vertical =
              r.width > 0 &&
              r.height > 0 &&
              r.top < innerHeight &&
              r.bottom > 0;
            const inViewport = vertical && r.left < innerWidth && r.right > 0;
            const ancestors = [];
            if (vertical && !(image.complete && image.naturalWidth)) {
              for (
                let p = image;
                p && ancestors.length < 6;
                p = p.parentElement
              ) {
                const s = getComputedStyle(p);
                ancestors.push({
                  tag: p.tagName,
                  slot: p.getAttribute("data-slot"),
                  display: s.display,
                  visibility: s.visibility,
                  opacity: s.opacity,
                  overflow: s.overflow,
                  rectangle: p.getBoundingClientRect().toJSON(),
                });
              }
            }
            return {
              src: image.currentSrc,
              alt: image.alt,
              complete: image.complete,
              naturalWidth: image.naturalWidth,
              vertical,
              inViewport,
              potentiallyVisible: image.checkVisibility({
                visibilityProperty: true,
              }),
              rect: r.toJSON(),
              ancestors,
            };
          })
        );
        await page.screenshot({
          path: path.join(
            output,
            `${pathname.split("/").join("-")}-${width}.png`
          ),
        });
        return images;
      },
      { pathname, width }
    );
    await context.close();
  }
} finally {
  await browser.close();
}
finish();
