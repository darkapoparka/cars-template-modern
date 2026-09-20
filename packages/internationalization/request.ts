import { type NextRequest, NextResponse } from "next/server";
import type { Locale } from "./config";
import {
  createLocalePolicy,
  type LocaleConfiguration,
  privateHeaders,
} from "./policy";

/** Native URLs carry locale. No client-supplied internal locale header is consumed. */
export function createLocaleRequestHandler(
  configuration: LocaleConfiguration<Locale>
) {
  const policy = createLocalePolicy(configuration);
  return (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.delete("x-modern-public-path");
    if (policy.isResource(pathname)) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (policy.unsupportedLocale(pathname)) {
      return new NextResponse("Language unavailable / Този език не е наличен", {
        status: 404,
        headers: privateHeaders(),
      });
    }
    const state = policy.resolveLocale({
      url: new URL(request.url),
      cookie: request.headers.get("cookie"),
      acceptLanguage: request.headers.get("accept-language"),
      trustedCountry:
        process.env.VERCEL === "1"
          ? request.headers.get("x-vercel-ip-country")
          : null,
    });
    let response: NextResponse;
    if (policy.routeParts(pathname).locale) {
      requestHeaders.set(
        "x-modern-public-path",
        pathname + request.nextUrl.search
      );
      response = NextResponse.next({ request: { headers: requestHeaders } });
    } else {
      const destination = request.nextUrl.clone();
      destination.pathname = policy.localeHref(pathname, state.locale);
      response = NextResponse.redirect(destination, 307);
    }
    for (const [key, value] of privateHeaders(state.locale)) {
      response.headers.set(key, value);
    }
    return response;
  };
}
