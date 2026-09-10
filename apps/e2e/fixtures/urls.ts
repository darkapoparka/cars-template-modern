export const e2eUrls = {
  api: process.env.E2E_API_URL ?? "http://127.0.0.1:3002",
  app: process.env.E2E_APP_URL ?? "http://127.0.0.1:3100",
  web: process.env.E2E_WEB_URL ?? "http://127.0.0.1:3001",
} as const;

export const toUrl = (baseUrl: string, path: string): string =>
  new URL(path, baseUrl).toString();
