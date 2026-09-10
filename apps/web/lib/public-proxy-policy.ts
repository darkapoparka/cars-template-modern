const safeRequestMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const shouldFailClosedOnProtectionError = (method: string): boolean =>
  !safeRequestMethods.has(method.toUpperCase());
