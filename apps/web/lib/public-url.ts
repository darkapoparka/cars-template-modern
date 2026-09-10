import "server-only";

const localWebUrl = "http://localhost:3001";

export const getPublicWebBaseUrl = (): string => {
  const configuredUrl = process.env.NEXT_PUBLIC_WEB_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    const hostname = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    return hostname.startsWith("http") ? hostname : `https://${hostname}`;
  }

  return localWebUrl;
};
