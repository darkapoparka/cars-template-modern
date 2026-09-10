import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  getLocaleCookieOptions,
  internationalizationMiddleware,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME,
} from "./proxy";

const request = (pathname: string, headers: Record<string, string> = {}) =>
  new NextRequest(`https://automarket.example${pathname}`, { headers });

describe("internationalization middleware", () => {
  it("treats an explicit Bulgarian path as authoritative", () => {
    const response = internationalizationMiddleware(
      request("/bg/cars?sort=newest", {
        "accept-language": "en-GB,en;q=0.9",
        cookie: `${LOCALE_COOKIE_NAME}=en`,
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-next-locale")).toBe("bg");
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe("bg");
  });

  it("treats an explicit English path as authoritative and canonicalizes it", () => {
    const response = internationalizationMiddleware(
      request("/en/cars?sort=newest", {
        "accept-language": "bg-BG,bg;q=0.9",
        cookie: `${LOCALE_COOKIE_NAME}=bg`,
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://automarket.example/cars?sort=newest"
    );
    expect(response.cookies.get(LOCALE_COOKIE_NAME)?.value).toBe("en");
  });

  it("uses a supported preference for an unprefixed path", () => {
    const response = internationalizationMiddleware(
      request("/cars", {
        "accept-language": "en-GB,en;q=0.9",
        cookie: `${LOCALE_COOKIE_NAME}=bg`,
      })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://automarket.example/bg/cars"
    );
  });

  it("negotiates an unprefixed path when no supported preference exists", () => {
    const response = internationalizationMiddleware(
      request("/cars", { "accept-language": "bg-BG,bg;q=0.9" })
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://automarket.example/bg/cars"
    );
  });

  it("rewrites an unprefixed default-locale path internally", () => {
    const response = internationalizationMiddleware(
      request("/cars?sort=newest", {
        "accept-language": "en-GB,en;q=0.9",
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://automarket.example/en/cars?sort=newest"
    );
    expect(
      response.headers.get(
        "x-middleware-request-x-automarket-internal-locale-rewrite"
      )
    ).toBe("1");
  });

  it("allows an internal default-locale rewrite to reach the App Router", () => {
    const response = internationalizationMiddleware(
      request("/en/cars?sort=newest", {
        "x-automarket-internal-locale-rewrite": "1",
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps unsupported locale-like segments on the localized 404 path", () => {
    const response = internationalizationMiddleware(
      request("/fr/cars", { "accept-language": "en-GB,en;q=0.9" })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://automarket.example/en/fr/cars"
    );
  });

  it("uses a durable host-only secure production preference cookie", () => {
    expect(getLocaleCookieOptions("production")).toEqual({
      httpOnly: true,
      maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });
});
