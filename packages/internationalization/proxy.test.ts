import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "./config";
import {
  getLocaleCookieOptions,
  internationalizationMiddleware,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "./proxy";

const origin = "https://automarket.example";
const request = (pathname: string, headers: Record<string, string> = {}) =>
  new NextRequest(`${origin}${pathname}`, { headers });
const otherLocale = (locale: string) =>
  locales.find((value) => value !== locale);

describe("internationalization middleware", () => {
  it.each(
    locales
  )("explicit /%s beats the cookie and negotiated language", (locale) => {
    const response = internationalizationMiddleware(
      request(`/${locale}/cars?sort=newest`, {
        "accept-language": otherLocale(locale) ?? "",
        cookie: `${LOCALE_COOKIE_NAME}=${otherLocale(locale)}`,
      })
    );
    expect(response.status).toBe(locale === defaultLocale ? 307 : 200);
    expect(response.headers.get("location")).toBe(
      locale === defaultLocale ? `${origin}/cars?sort=newest` : null
    );
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe(locale);
    if (locale !== defaultLocale) {
      expect(response.headers.get("x-next-locale")).toBe(locale);
    }
  });

  it.each(
    locales
  )("the saved %s preference beats Accept-Language", (locale) => {
    const response = internationalizationMiddleware(
      request("/cars", {
        "accept-language": otherLocale(locale) ?? "",
        cookie: `${LOCALE_COOKIE_NAME}=${locale}`,
      })
    );
    expect(response.status).toBe(locale === defaultLocale ? 200 : 307);
    expect(
      response.headers.get(
        locale === defaultLocale ? "x-middleware-rewrite" : "location"
      )
    ).toBe(`${origin}/${locale}/cars`);
  });
  it.each(
    locales
  )("negotiates %s without a supported saved preference", (locale) => {
    const response = internationalizationMiddleware(
      request("/cars", {
        "accept-language": locale,
        cookie: `${LOCALE_COOKIE_NAME}=unsupported`,
      })
    );
    expect(response.status).toBe(locale === defaultLocale ? 200 : 307);
    expect(
      response.headers.get(
        locale === defaultLocale ? "x-middleware-rewrite" : "location"
      )
    ).toBe(`${origin}/${locale}/cars`);
  });

  it("marks internal default-locale rewrites and allows their second pass", () => {
    const first = internationalizationMiddleware(
      request("/cars?sort=newest", { "accept-language": defaultLocale })
    );
    expect(first.status).toBe(200);
    expect(first.headers.get("x-middleware-rewrite")).toBe(
      `${origin}/${defaultLocale}/cars?sort=newest`
    );
    expect(
      first.headers.get(
        "x-middleware-request-x-automarket-internal-locale-rewrite"
      )
    ).toBe("1");
    const second = internationalizationMiddleware(
      request(`/${defaultLocale}/cars?sort=newest`, {
        "x-automarket-internal-locale-rewrite": "1",
      })
    );
    expect(second.status).toBe(200);
    expect(second.headers.get("location")).toBeNull();
    expect(second.headers.get("x-middleware-next")).toBe("1");
  });

  it("preserves unsupported locale-like segments for the localized 404", () => {
    const response = internationalizationMiddleware(
      request("/fr/cars", { "accept-language": defaultLocale })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      `${origin}/${defaultLocale}/fr/cars`
    );
  });
  it("does not change the saved locale during prefetch", () => {
    const response = internationalizationMiddleware(
      request(`/${otherLocale(defaultLocale)}/cars`, {
        "next-router-prefetch": "1",
        cookie: `${LOCALE_COOKIE_NAME}=${defaultLocale}`,
      })
    );
    expect(response.cookies.get(LOCALE_COOKIE_NAME)).toBeUndefined();
  });

  it("uses a durable host-only secure production cookie", () => {
    expect(getLocaleCookieOptions("production")).toEqual({
      httpOnly: true,
      maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });
});
