import {
  CORRELATION_ID_HEADER,
  getCorrelationId,
} from "@repo/observability/request-context";
import { noseconeOptions, securityMiddleware } from "@repo/security/proxy";
import { type NextProxy, NextResponse } from "next/server";

const securityHeaders = securityMiddleware(noseconeOptions);

const proxy: NextProxy = async (request) => {
  const correlationId = getCorrelationId(request.headers);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  const securityResponse = await securityHeaders();
  for (const [key, value] of securityResponse.headers) {
    if (key !== "x-middleware-next") {
      response.headers.set(key, value);
    }
  }
  response.headers.set(CORRELATION_ID_HEADER, correlationId);

  return response;
};

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
