import {
  assertRuntimeEnvironmentContract,
  getRuntimeEnvironmentContractIssues,
} from "@repo/next-config/environment-contract";
import { describe, expect, it } from "vitest";

const localOrigins = {
  apiUrl: "http://localhost:3002",
  appUrl: "http://localhost:3000",
  webUrl: "http://localhost:3001",
};

const previewOrigins = {
  apiUrl: "https://api-preview.automarket.bg",
  appUrl: "https://app-preview.automarket.bg",
  webUrl: "https://preview.automarket.bg",
};

describe("runtime environment contract", () => {
  it("accepts distinct loopback origins for local development", () => {
    expect(() => assertRuntimeEnvironmentContract(localOrigins)).not.toThrow();
  });

  it("accepts distinct HTTPS origins and explicit disabled capabilities", () => {
    expect(() =>
      assertRuntimeEnvironmentContract({
        ...previewOrigins,
        capabilityFlags: {
          AUTOMARKET_ENABLE_PRIVATE_IMPORTS: "false",
        },
        unavailableCapabilityFlags: ["AUTOMARKET_ENABLE_PRIVATE_IMPORTS"],
        vercelEnvironment: "preview",
      })
    ).not.toThrow();
  });

  it.each([
    ["duplicate", { ...previewOrigins, apiUrl: previewOrigins.webUrl }],
    ["path", { ...previewOrigins, appUrl: `${previewOrigins.appUrl}/path` }],
    ["remote HTTP", { ...previewOrigins, webUrl: "http://preview.example" }],
    [
      "reserved host",
      { ...previewOrigins, webUrl: "https://preview.example.test" },
    ],
    ["127/8 host", { ...previewOrigins, webUrl: "https://127.0.0.2" }],
    ["private IPv4 host", { ...previewOrigins, webUrl: "https://10.0.0.1" }],
    [
      "IPv6 literal host",
      { ...previewOrigins, webUrl: "https://[2001:db8::1]" },
    ],
    [
      "trailing-dot host",
      { ...previewOrigins, webUrl: "https://preview.automarket.bg." },
    ],
    [
      "credentials",
      { ...previewOrigins, apiUrl: "https://user:pass@api.test" },
    ],
  ])("rejects %s origin configuration", (_label, origins) => {
    expect(
      getRuntimeEnvironmentContractIssues({
        ...origins,
        vercelEnvironment: "preview",
      })
    ).not.toHaveLength(0);
  });

  it("rejects missing intent, unavailable intent, bypass, and test flags in deployments", () => {
    const issues = getRuntimeEnvironmentContractIssues({
      ...previewOrigins,
      capabilityFlags: {
        AUTOMARKET_ENABLE_AUTH_RECOVERY: undefined,
        AUTOMARKET_ENABLE_PRIVATE_IMPORTS: "true",
      },
      forbiddenDeploymentFlags: { AUTOMARKET_PUBLIC_E2E: "true" },
      skipEnvValidation: "true",
      unavailableCapabilityFlags: ["AUTOMARKET_ENABLE_PRIVATE_IMPORTS"],
      vercelEnvironment: "production",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        "AUTOMARKET_ENABLE_AUTH_RECOVERY must be explicitly true or false",
        "AUTOMARKET_ENABLE_PRIVATE_IMPORTS cannot be enabled until its repository adapter is configured",
        "AUTOMARKET_PUBLIC_E2E is test-only and must not be set in Vercel deployments",
        "SKIP_ENV_VALIDATION must not exist in Vercel deployments",
      ])
    );
    expect(issues.join(" ")).not.toContain("https://preview.automarket.bg");
  });

  it("rejects blank bypass and test-only variables by presence", () => {
    const issues = getRuntimeEnvironmentContractIssues({
      ...previewOrigins,
      capabilityFlags: {
        AUTOMARKET_ENABLE_PRIVATE_IMPORTS: "false",
      },
      forbiddenDeploymentFlags: { AUTOMARKET_PUBLIC_E2E: "" },
      skipEnvValidation: "",
      vercelEnvironment: "preview",
    });

    expect(issues).toEqual(
      expect.arrayContaining([
        "AUTOMARKET_PUBLIC_E2E is test-only and must not be set in Vercel deployments",
        "SKIP_ENV_VALIDATION must not exist in Vercel deployments",
      ])
    );
  });

  it("rejects surrounding origin whitespace", () => {
    expect(
      getRuntimeEnvironmentContractIssues({
        ...previewOrigins,
        webUrl: ` ${previewOrigins.webUrl} `,
        vercelEnvironment: "preview",
      })
    ).toContain("NEXT_PUBLIC_WEB_URL must not contain surrounding whitespace");
  });

  it("rejects an unknown Vercel environment instead of treating it as local", () => {
    expect(
      getRuntimeEnvironmentContractIssues({
        ...localOrigins,
        vercelEnvironment: "staging",
      })
    ).toContain("VERCEL_ENV must be development, preview, or production");
  });
});
