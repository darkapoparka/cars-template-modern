const localAppBaseUrl = "http://localhost:3000";

export const getPublicAppBaseUrl = (configuredUrl?: string): string => {
  const candidate =
    configuredUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    localAppBaseUrl;

  try {
    const url = new URL(candidate);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Environment validation reports malformed launch configuration. The
    // showroom falls back to its local companion-app origin.
  }

  return localAppBaseUrl;
};

export const getPublicAppUrl = (path: string, configuredUrl?: string): string =>
  new URL(path, `${getPublicAppBaseUrl(configuredUrl)}/`).toString();
