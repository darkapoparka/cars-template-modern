import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextRequest, NextResponse } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";
import { defaultLocale, isLocale, locales, normalizeLocale } from "./config";

export const LOCALE_COOKIE_NAME = "Next-Locale";
export const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const INTERNAL_LOCALE_REWRITE_HEADER = "x-automarket-internal-locale-rewrite";

export const getLocaleCookieOptions = (environment = process.env.NODE_ENV) => ({
  httpOnly: true,
  maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  path: "/",
  sameSite: "lax" as const,
  secure: environment === "production",
});

const getPathLocale = (pathname: string) => {
  const pathLocale = pathname.split("/")[1];
  return pathLocale && isLocale(pathLocale) ? pathLocale : undefined;
};

const getNegotiatedLocale = (request: NextRequest) => {
  try {
    const headers = Object.fromEntries(request.headers.entries());
    const negotiator = new Negotiator({ headers });
    const acceptedLanguages = negotiator
      .languages()
      .filter((lang) => lang !== "*");

    if (acceptedLanguages.length === 0) {
      return defaultLocale;
    }

    return normalizeLocale(
      matchLocale(acceptedLanguages, locales, defaultLocale)
    );
  } catch {
    return defaultLocale;
  }
};

const I18nMiddleware = createI18nMiddleware({
  locales,
  defaultLocale,
  urlMappingStrategy: "rewriteDefault",
  resolveLocaleFromRequest: getNegotiatedLocale,
});

export const internationalizationMiddleware = (request: NextRequest) => {
  // A default-locale rewrite re-enters the Next proxy with its internal
  // `/en` pathname. Let that second pass reach the App Router instead of
  // canonicalizing it back to the already-visible unprefixed URL.
  if (request.headers.get(INTERNAL_LOCALE_REWRITE_HEADER) === "1") {
    return NextResponse.next();
  }

  const explicitLocale = getPathLocale(request.nextUrl.pathname);
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const resolvedLocale =
    explicitLocale ??
    (cookieLocale && isLocale(cookieLocale) ? cookieLocale : undefined) ??
    getNegotiatedLocale(request);
  const nextRequest = new NextRequest(request, {
    headers: new Headers(request.headers),
  });

  // next-international checks the locale cookie before the pathname. Supplying
  // the resolved supported locale here makes an explicit /bg or /en path
  // authoritative while retaining its rewriteDefault routing behavior.
  nextRequest.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale);

  const response = I18nMiddleware(nextRequest);
  const isDefaultLocaleRewrite =
    !explicitLocale &&
    resolvedLocale === defaultLocale &&
    response.headers.has("x-middleware-rewrite");

  if (isDefaultLocaleRewrite) {
    const rewriteHeaders = new Headers(request.headers);
    rewriteHeaders.set(INTERNAL_LOCALE_REWRITE_HEADER, "1");
    const requestOverride = NextResponse.next({
      request: { headers: rewriteHeaders },
    });

    for (const [key, value] of requestOverride.headers) {
      if (key.startsWith("x-middleware-")) {
        response.headers.set(key, value);
      }
    }
  }

  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    request.headers.get("purpose")?.toLowerCase() === "prefetch";

  if (cookieLocale !== resolvedLocale && !isPrefetch) {
    response.cookies.set(
      LOCALE_COOKIE_NAME,
      resolvedLocale,
      getLocaleCookieOptions()
    );
  }

  return response;
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
