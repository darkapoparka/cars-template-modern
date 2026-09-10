import { describe, expect, it } from "vitest";
import {
  createPublicNoseconeOptions,
  createPublicNoseconeOptionsWithToolbar,
  noseconeOptions,
  securityMiddleware,
} from "./proxy";

const getContentSecurityPolicy = async (
  options: Parameters<typeof securityMiddleware>[0]
) => {
  const response = await securityMiddleware(options)();
  return response.headers.get("content-security-policy");
};

const getDirective = (policy: string | null, name: string) =>
  policy
    ?.split(";")
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith(`${name} `)) ?? "";

describe("security proxy policies", () => {
  it("leaves CSP ownership with Clerk for the authenticated app", () => {
    expect(noseconeOptions.contentSecurityPolicy).toBe(false);
  });

  it("emits a narrow production CSP for the public marketplace", async () => {
    const policy = await getContentSecurityPolicy(
      createPublicNoseconeOptions()
    );

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self' https://vercel.com/api/blob/");
    expect(policy).toContain(
      "img-src 'self' data: https://*.public.blob.vercel-storage.com https://assets.basehub.com https://images.unsplash.com"
    );
    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain(
      "frame-src 'self' https://www.google.com https://maps.google.com https://www.googleusercontent.com"
    );
    expect(policy).not.toContain("'unsafe-eval'");
    expect(getDirective(policy, "connect-src").split(" ")).not.toContain(
      "https:"
    );
    expect(getDirective(policy, "img-src").split(" ")).not.toContain("https:");
  });

  it("adds only local websocket and eval allowances in development", async () => {
    const policy = await getContentSecurityPolicy(
      createPublicNoseconeOptions({ development: true })
    );

    expect(policy).toContain("ws://localhost:*");
    expect(policy).toContain("ws://127.0.0.1:*");
    expect(policy).toContain("'unsafe-eval'");
  });

  it("keeps optional analytics and observability blank-safe", async () => {
    const blankPolicy = await getContentSecurityPolicy(
      createPublicNoseconeOptions({
        posthogHost: "   ",
        sentryDsn: "not-a-url",
      })
    );
    const configuredPolicy = await getContentSecurityPolicy(
      createPublicNoseconeOptions({
        apiUrl: "https://api-preview.automarket.bg/path-is-ignored",
        googleAnalytics: true,
        posthogHost: "https://eu.posthog.example.com/ingest?ignored=true",
        sentryDsn:
          "https://public-key@errors.example.com/42?environment=preview",
        vercelAnalytics: true,
      })
    );
    const connectSources = getDirective(configuredPolicy, "connect-src");
    const scriptSources = getDirective(configuredPolicy, "script-src");

    expect(blankPolicy).not.toContain("posthog");
    expect(blankPolicy).not.toContain("errors.example.com");
    expect(connectSources).toContain("https://eu.posthog.example.com");
    expect(connectSources).toContain("https://api-preview.automarket.bg");
    expect(connectSources).toContain("https://errors.example.com");
    expect(scriptSources).toContain("https://eu.posthog.example.com");
    expect(scriptSources).not.toContain("https://errors.example.com");
    expect(configuredPolicy).toContain("https://*.google-analytics.com");
    expect(configuredPolicy).toContain("https://www.googletagmanager.com");
    expect(configuredPolicy).toContain("https://va.vercel-scripts.com");
    expect(configuredPolicy).toContain("https://vitals.vercel-insights.com");
    expect(configuredPolicy).not.toContain("public-key");
    expect(configuredPolicy).not.toContain("ignored=true");
  });

  it("retains the CSP when the Vercel Toolbar is enabled", async () => {
    const policy = await getContentSecurityPolicy(
      createPublicNoseconeOptionsWithToolbar()
    );

    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("https://vercel.live");
    expect(policy).toContain("wss://ws-us3.pusher.com");
  });
});
