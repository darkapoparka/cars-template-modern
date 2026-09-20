const safeRequestMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const shouldFailClosedOnProtectionError = (method: string): boolean =>
  !safeRequestMethods.has(method.toUpperCase());

/** The description-search endpoint only parses filters locally; it has no provider or business writes. */
export const isPublicDemoRequestAllowed = (
  method: string,
  pathname: string
): boolean =>
  method === "GET" ||
  method === "HEAD" ||
  (method === "POST" &&
    (pathname === "/api/preferences" || pathname === "/api/ai/search"));
