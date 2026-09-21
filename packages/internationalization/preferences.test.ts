const promptCookiePattern = /^cars_prompt=/;

import { describe, expect, it } from "vitest";
import { cookieValue, createLocalePolicy } from "./policy";
import { bg, en } from "./preferences-messages";

const policy = createLocalePolicy({
  schemaVersion: 1,
  dealerId: "test-dealer",
  dealerName: "Test",
  defaultLocale: "bg",
  enabledLocales: ["en", "bg"] as const,
  dealerCountry: "BG",
  inventoryCurrency: "EUR",
  formatLocales: { en: "en-GB", bg: "bg-BG" },
  preferenceMaxAge: 15_552_000,
  promptVersion: "v1",
  suggestedLanguages: { BG: "bg" },
});
const origin = "https://dealer.example";
const body = {
  action: "save",
  locale: "en",
  country: "GB",
  returnTo: "/variant-2/bg/contact?topic=trade-in#details",
};
const send = (
  data: unknown = body,
  headers: Record<string, string> = {},
  method = "POST"
) =>
  policy.preferenceResponse(
    new Request(`${origin}/api/preferences`, {
      method,
      headers: { origin, "content-type": "application/json", ...headers },
      ...(method === "GET" ? {} : { body: JSON.stringify(data) }),
    })
  );
describe("preferences", () => {
  it("saves only explicit preferences and a safe mounted destination", async () => {
    const r = await send();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({
      destination: "/variant-2/en/contact?topic=trade-in#details",
    });
    const cookies = r.headers.getSetCookie();
    expect(cookies).toHaveLength(3);
    for (const c of cookies) {
      expect(c).toContain("Path=/");
      expect(c).toContain("HttpOnly");
      expect(c).toContain("SameSite=Lax");
      expect(c).toContain("Secure");
      expect(c).not.toContain("Domain=");
    }
  });
  it("dismisses without accepting language or country", async () => {
    const r = await send({ ...body, action: "dismiss" });
    expect(r.headers.getSetCookie()).toHaveLength(1);
    expect(r.headers.getSetCookie()[0]).toMatch(promptCookiePattern);
    expect(await r.json()).toEqual({ destination: body.returnTo });
  });
  it("supports a no-JS native form redirect", async () => {
    const r = await policy.preferenceResponse(
      new Request(`${origin}/variant-2/api/preferences`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(body),
      })
    );
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe(
      "/variant-2/en/contact?topic=trade-in#details"
    );
  });
  it.each([
    "https://evil.example",
    "null",
    "",
  ])("rejects foreign/missing origin %s", async (origin) =>
    expect((await send(body, { origin })).status).toBe(403));
  it("rejects a cross-site fetch", async () =>
    expect((await send(body, { "sec-fetch-site": "cross-site" })).status).toBe(
      403
    ));
  it("rejects unsupported content type", async () =>
    expect((await send(body, { "content-type": "text/plain" })).status).toBe(
      415
    ));
  it("rejects GET without mutation", async () => {
    const r = await send(body, {}, "GET");
    expect(r.status).toBe(405);
    expect(r.headers.get("set-cookie")).toBeNull();
  });
  it.each([
    "//evil.example",
    "/api/preferences",
    "/variant-2/api/admin",
    "/ar/cars",
    "/%2f%2fevil.example",
    "/%255cevil",
    "https://evil.example",
  ])("rejects unsafe return %s", async (returnTo) =>
    expect((await send({ ...body, returnTo })).status).toBe(400));
  it.each([
    "/x/..//invalid.example/path",
    "/%2e%2e//invalid.example/",
    "/..//invalid.example/path?x=1",
  ])("rejects normalized external return %s for save/dismiss JSON/form", async (returnTo) => {
    expect(policy.safeReturnPath(returnTo, origin)).toBeNull();
    for (const action of ["save", "dismiss"] as const) {
      for (const contentType of [
        "application/json",
        "application/x-www-form-urlencoded",
      ] as const) {
        const data = { ...body, action, returnTo };
        const response = await policy.preferenceResponse(
          new Request(`${origin}/api/preferences`, {
            method: "POST",
            headers: { origin, "content-type": contentType },
            body:
              contentType === "application/json"
                ? JSON.stringify(data)
                : new URLSearchParams(data).toString(),
          })
        );
        expect(response.status).toBe(400);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.getSetCookie()).toEqual([]);
      }
    }
  });
  it.each([
    { locale: "ar" },
    { country: "ZZ" },
    { action: "send" },
    { unexpected: "value" },
  ])("rejects invalid preference %o", async (fields) =>
    expect((await send({ ...body, ...fields })).status).toBe(400));
  it("bounds actual streamed size", async () =>
    expect(
      (await send({ ...body, returnTo: `/${"a".repeat(5000)}` })).status
    ).toBe(413));
  it("rejects ambiguous duplicate cookies", () =>
    expect(
      cookieValue("cars_locale=en; cars_locale=bg", "cars_locale")
    ).toBeNull());
  it("has complete language keys and placeholders", () => {
    expect(Object.keys(bg).sort()).toEqual(Object.keys(en).sort());
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(bg[key].trim()).not.toBe("");
      expect(bg[key].match(/\{\w+\}/g)?.sort() ?? []).toEqual(
        en[key].match(/\{\w+\}/g)?.sort() ?? []
      );
    }
  });
});
