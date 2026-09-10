import { describe, expect, it } from "vitest";
import {
  appContentSecurityPolicyDirectives,
  createAppContentSecurityPolicyDirectives,
} from "../security-policy";

describe("authenticated app content security policy", () => {
  it("leaves Clerk's request-specific FAPI origin to Clerk middleware", () => {
    expect(createAppContentSecurityPolicyDirectives()).toEqual({
      "connect-src": ["https://vercel.com/api/blob/"],
      "img-src": ["data:", "https://*.public.blob.vercel-storage.com"],
      "script-src": [],
    });
  });

  it("does not grant a blanket network or image source", () => {
    const sources = Object.values(appContentSecurityPolicyDirectives).flat();

    expect(sources).not.toContain("*");
    expect(sources).not.toContain("https:");
    expect(sources).not.toContain("blob:");
  });

  it("allows Clerk's keyless development FAPI without widening production policy", () => {
    expect(
      createAppContentSecurityPolicyDirectives({
        clerkKeylessDevelopment: true,
      })["connect-src"]
    ).toContain("https://*.clerk.accounts.dev");
    expect(
      createAppContentSecurityPolicyDirectives({
        clerkKeylessDevelopment: false,
      })["connect-src"]
    ).not.toContain("https://*.clerk.accounts.dev");
  });

  it("adds only explicitly configured telemetry origins", () => {
    const directives = createAppContentSecurityPolicyDirectives({
      apiUrl: "https://api-preview.automarket.bg/path-is-ignored",
      googleAnalytics: true,
      posthogHost: "https://eu.posthog.example/ingest?ignored=true",
      sentryDsn: "https://public@example-errors.test/42",
      vercelAnalytics: true,
    });

    expect(directives["connect-src"]).toContain("https://eu.posthog.example");
    expect(directives["connect-src"]).toContain(
      "https://api-preview.automarket.bg"
    );
    expect(directives["connect-src"]).toContain("https://example-errors.test");
    expect(directives["script-src"]).toContain("https://va.vercel-scripts.com");
    expect(JSON.stringify(directives)).not.toContain("public@");
    expect(JSON.stringify(directives)).not.toContain("ignored=true");
  });
});
