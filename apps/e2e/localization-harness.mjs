import fs from "node:fs";
import path from "node:path";

export { default as assert } from "node:assert/strict";
export const origin = new URL(
  process.env.LOCALE_QA_ORIGIN ?? "http://127.0.0.1:6494"
);
export const mount = process.env.LOCALE_QA_MOUNT ?? "";
if (!["", "/variant-2"].includes(mount)) {
  throw new Error("Unsupported native Modern mount");
}
if (
  !["localhost", "127.0.0.1", "cars-template-modern.vercel.app"].includes(
    origin.hostname
  )
) {
  throw new Error(
    "QA is limited to loopback or the existing template production alias"
  );
}
export const output = path.resolve(
  "../../.codex-artifacts/localization-resume-20260920",
  process.env.LOCALE_QA_RUN ?? "browser"
);
fs.mkdirSync(output, { recursive: true });
export const results = [];
export const url = (pathname) => origin.origin + mount + pathname;
export const save = () =>
  fs.writeFileSync(
    path.join(output, "results.json"),
    JSON.stringify(
      {
        time: new Date().toISOString(),
        origin: origin.origin,
        mount,
        node: process.version,
        platform: process.platform,
        results,
      },
      null,
      2
    )
  );
export async function check(name, run, context = {}) {
  const entry = { name, ...context };
  try {
    entry.details = await run();
    entry.ok = true;
  } catch (error) {
    entry.ok = false;
    entry.error = error.stack ?? String(error);
  }
  results.push(entry);
  save();
  console.log(
    JSON.stringify({
      name,
      ...context,
      ok: entry.ok,
      error: entry.ok ? undefined : entry.error,
    })
  );
  return entry;
}
export function skip(name, reason, context = {}) {
  results.push({ name, ...context, skipped: true, reason });
  save();
}
export function finish() {
  const summary = {
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => r.ok === false).length,
    skipped: results.filter((r) => r.skipped).length,
    total: results.length,
  };
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(summary, null, 2)
  );
  console.log(JSON.stringify(summary));
  process.exitCode = summary.failed ? 1 : 0;
}
export async function ready(page) {
  await page
    .locator("[data-locale-ready=true]")
    .waitFor({ state: "attached", timeout: 20_000 });
  await page.evaluate(() => document.fonts.ready);
}
export async function visibleImages(page) {
  await page.waitForFunction(
    () =>
      [...document.images]
        .filter((image) => {
          const r = image.getBoundingClientRect();
          return (
            r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0
          );
        })
        .every((image) => image.complete && image.naturalWidth > 0),
    {},
    { timeout: 25_000 }
  );
}
export async function blockBusinessWrites(
  context,
  { preferences = true } = {}
) {
  const allowedPostPaths = [
    `${mount}/api/ai/search`,
    ...(preferences ? [`${mount}/api/preferences`] : []),
  ];
  const blocked = [];
  await context.route("**/*", (route) => {
    const request = route.request(),
      u = new URL(request.url());
    if (
      !(
        ["GET", "HEAD"].includes(request.method()) ||
        (u.origin === origin.origin &&
          request.method() === "POST" &&
          allowedPostPaths.includes(u.pathname))
      )
    ) {
      blocked.push({ method: request.method(), url: u.origin + u.pathname });
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  return blocked;
}
export async function openPreferences(page, width) {
  if (width < 1024) {
    await page
      .locator('[data-slot="dealer-bottom-nav"] button[aria-haspopup="dialog"]')
      .click();
    await page
      .locator('[data-slot="dealer-mobile-menu"] [data-locale-trigger]')
      .click();
  } else {
    await page
      .locator('[data-slot="dealer-desktop-header"] [data-locale-trigger]')
      .click();
  }
  await page.locator("dialog[data-locale-dialog][open]").waitFor();
}
