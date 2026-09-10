import {
  getLocaleCookieOptions,
  internationalizationMiddleware,
  LOCALE_COOKIE_NAME,
} from "@repo/internationalization/proxy";
import { leadSite } from "@repo/marketplace/lead-site";
import { SecurityRequestDeniedError, secure } from "@repo/security";
import {
  createPublicNoseconeOptions,
  createPublicNoseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/proxy";
import { createNEMO } from "@rescale/nemo";
import { type NextProxy, type NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { shouldFailClosedOnProtectionError } from "@/lib/public-proxy-policy";
import { getCanonicalTaxonomyPathname } from "@/lib/public-route-normalization";

export const config = {
  // matcher tells Next.js which routes to run the middleware on. This runs the
  // middleware on public routes, excluding Next.js framework internals,
  // static assets, and PostHog ingest. Intercepting the dev HMR endpoint
  // breaks its WebSocket upgrade before the App Router can handle it.
  matcher: [
    "/((?!_next/|ingest|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};

const publicSecurityConfiguration = {
  apiUrl: env.NEXT_PUBLIC_API_URL,
  development: process.env.NODE_ENV !== "production",
  googleAnalytics: Boolean(env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
  posthogHost: env.NEXT_PUBLIC_POSTHOG_HOST,
  sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
  vercelAnalytics: Boolean(process.env.VERCEL),
};

const toolbarEnabled =
  Boolean(env.FLAGS_SECRET) &&
  process.env.NODE_ENV !== "production" &&
  process.env.AUTOMARKET_PUBLIC_E2E !== "true" &&
  process.env.NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E !== "true";

const securityHeaders = securityMiddleware(
  toolbarEnabled
    ? createPublicNoseconeOptionsWithToolbar(publicSecurityConfiguration)
    : createPublicNoseconeOptions(publicSecurityConfiguration)
);

// Custom middleware for Arcjet security checks
const arcjetMiddleware = async (request: NextRequest) => {
  if (!env.ARCJET_KEY) {
    return;
  }

  try {
    await secure(
      [
        // See https://docs.arcjet.com/bot-protection/identifying-bots
        "CATEGORY:SEARCH_ENGINE", // Allow search engines
        "CATEGORY:PREVIEW", // Allow preview links to show OG images
        "CATEGORY:MONITOR", // Allow uptime monitoring services
      ],
      request
    );
  } catch (error) {
    if (error instanceof SecurityRequestDeniedError) {
      return NextResponse.json({ error: "request_denied" }, { status: 403 });
    }

    if (shouldFailClosedOnProtectionError(request.method)) {
      console.warn(
        "Optional request protection is unavailable; write request blocked."
      );
      return NextResponse.json(
        { error: "request_protection_unavailable" },
        {
          headers: { "cache-control": "no-store" },
          status: 503,
        }
      );
    }

    console.warn(
      "Optional request protection is unavailable; read-only request allowed."
    );
  }
};

// Compose non-Clerk middleware with Nemo
const composedMiddleware = createNEMO(
  {},
  {
    before: [internationalizationMiddleware, arcjetMiddleware],
  }
);

const createBulgarianLeadSiteRedirect = (
  request: NextRequest,
  headersResponse: Response
) => {
  const isEnglishLeadSitePath =
    leadSite.staticDemoMode &&
    (request.nextUrl.pathname === "/en" ||
      request.nextUrl.pathname.startsWith("/en/"));

  if (
    !isEnglishLeadSitePath ||
    (request.method !== "GET" && request.method !== "HEAD")
  ) {
    return;
  }

  const bulgarianUrl = request.nextUrl.clone();
  bulgarianUrl.pathname = request.nextUrl.pathname.slice(3) || "/";
  const redirectResponse = NextResponse.redirect(bulgarianUrl, 308);
  redirectResponse.cookies.set(
    LOCALE_COOKIE_NAME,
    "bg",
    getLocaleCookieOptions()
  );

  for (const [key, value] of headersResponse.headers) {
    if (key !== "x-middleware-next") {
      redirectResponse.headers.set(key, value);
    }
  }

  return redirectResponse;
};

const publicProxy: NextProxy = async (request, event) => {
  const headersResponse = await securityHeaders();
  const bulgarianLeadSiteRedirect = createBulgarianLeadSiteRedirect(
    request,
    headersResponse
  );

  if (bulgarianLeadSiteRedirect) {
    return bulgarianLeadSiteRedirect;
  }

  const canonicalTaxonomyPathname = getCanonicalTaxonomyPathname(
    request.nextUrl.pathname
  );

  if (
    canonicalTaxonomyPathname &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = canonicalTaxonomyPathname;
    const redirectResponse = NextResponse.redirect(canonicalUrl, 308);

    for (const [key, value] of headersResponse.headers) {
      if (key !== "x-middleware-next") {
        redirectResponse.headers.set(key, value);
      }
    }

    return redirectResponse;
  }

  const middlewareResponse = await composedMiddleware(
    request as unknown as NextRequest,
    event
  );

  if (!middlewareResponse) {
    return headersResponse;
  }

  for (const [key, value] of headersResponse.headers) {
    if (key !== "x-middleware-next") {
      middlewareResponse.headers.set(key, value);
    }
  }

  return middlewareResponse;
};

export default publicProxy;
