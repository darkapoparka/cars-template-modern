const safeRequestMethods = new Set(["GET", "HEAD", "OPTIONS"]);
const safePublicDemoPostPaths = new Set([
  "/api/preferences",
  "/variant-2/api/preferences",
  "/api/ai/search",
  "/variant-2/api/ai/search",
]);

export const shouldFailClosedOnProtectionError = (method: string): boolean =>
  !safeRequestMethods.has(method.toUpperCase());

/** The description-search endpoint only parses filters locally; it has no provider or business writes. */
export const isPublicDemoRequestAllowed = (
  method: string,
  pathname: string
): boolean =>
  method === "GET" ||
  method === "HEAD" ||
  (method === "POST" && safePublicDemoPostPaths.has(pathname));
