import { timingSafeEqual } from "node:crypto";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const constantTimeEqual = (left: string, right: string): boolean => {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  const size = Math.max(leftBytes.length, rightBytes.length, 1);
  const paddedLeft = Buffer.alloc(size);
  const paddedRight = Buffer.alloc(size);
  leftBytes.copy(paddedLeft);
  rightBytes.copy(paddedRight);
  return (
    timingSafeEqual(paddedLeft, paddedRight) &&
    leftBytes.length === rightBytes.length
  );
};

export const serviceJson = (
  body: unknown,
  status = 200,
  headers?: HeadersInit
): Response => {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
  return Response.json(body, { headers: responseHeaders, status });
};

export const authorizeServiceRequest = (
  request: Request,
  secret: string | undefined
): Response | null => {
  if (!secret || secret.length < 16) {
    return serviceJson({ error: "service_not_configured" }, 503);
  }
  const authorization = request.headers.get("authorization") ?? "";
  const presented = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  return constantTimeEqual(presented, secret)
    ? null
    : serviceJson({ error: "unauthorized" }, 401);
};

export const boundedLimit = (
  value: string | null,
  fallback = 50,
  maximum = 100
) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};
