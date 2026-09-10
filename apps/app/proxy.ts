import { authMiddleware } from "@repo/auth/proxy";
import {
  CORRELATION_ID_HEADER,
  getCorrelationId,
} from "@repo/observability/request-context";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/proxy";
import { type NextProxy, NextResponse } from "next/server";
import { env } from "./env";
import { appContentSecurityPolicyDirectives } from "./security-policy";

const securityHeaders = env.FLAGS_SECRET
  ? securityMiddleware(noseconeOptionsWithToolbar)
  : securityMiddleware(noseconeOptions);

const isProduction = process.env.NODE_ENV === "production";

const isPublicPath = (pathname: string) =>
  pathname === "/sign-in" ||
  pathname.startsWith("/sign-in/") ||
  pathname === "/sign-up" ||
  pathname.startsWith("/sign-up/");

const isApiPath = (pathname: string) =>
  pathname === "/api" ||
  pathname.startsWith("/api/") ||
  pathname === "/trpc" ||
  pathname.startsWith("/trpc/");

const securedNextResponse = async (request: Request, correlationId: string) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const securityResponse = await securityHeaders();
  for (const [key, value] of securityResponse.headers) {
    if (key !== "x-middleware-next") {
      response.headers.set(key, value);
    }
  }
  response.headers.set(CORRELATION_ID_HEADER, correlationId);
  return response;
};

// Clerk middleware wraps other middleware in its callback
// For apps using Clerk, compose middleware inside authMiddleware callback
// For apps without Clerk, use createNEMO for composition (see apps/web)
export default authMiddleware(
  async (auth, request) => {
    const correlationId = getCorrelationId(request.headers);
    if (
      isPublicPath(request.nextUrl.pathname) ||
      isApiPath(request.nextUrl.pathname)
    ) {
      return securedNextResponse(request, correlationId);
    }

    const session = await auth();

    if (session.userId) {
      return securedNextResponse(request, correlationId);
    }

    const signInUrl = new URL(
      env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in",
      request.url
    );
    signInUrl.searchParams.set("redirect_url", request.url);

    const securityResponse = await securityHeaders();
    const redirectResponse = NextResponse.redirect(signInUrl);

    for (const [key, value] of securityResponse.headers) {
      redirectResponse.headers.set(key, value);
    }
    redirectResponse.headers.set(CORRELATION_ID_HEADER, correlationId);

    return redirectResponse;
  },
  {
    contentSecurityPolicy: {
      directives: appContentSecurityPolicyDirectives,
      strict: isProduction,
    },
  }
) as unknown as NextProxy;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
