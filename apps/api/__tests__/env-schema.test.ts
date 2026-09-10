// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const setRequiredCoreEnvironment = () => {
  vi.stubEnv("DATABASE_URL", "postgresql://user:pass@db.test/automarket");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
  vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://web.test");
  vi.stubEnv("SKIP_ENV_VALIDATION", "");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("API environment schema", () => {
  it("boots with core infrastructure and no optional providers", async () => {
    setRequiredCoreEnvironment();
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CRON_SECRET", "");
    vi.stubEnv("INVENTORY_SCANNER_CALLBACK_SECRET", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");

    const { env } = await import("../env");

    expect(env.CLERK_SECRET_KEY).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
    expect(env.INVENTORY_SCANNER_CALLBACK_SECRET).toBeUndefined();
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
  }, 20_000);

  it.each([
    "DATABASE_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_WEB_URL",
  ])("rejects a blank required %s", async (key) => {
    setRequiredCoreEnvironment();
    vi.stubEnv(key, "");

    await expect(import("../env")).rejects.toThrow();
  });

  it("rejects local E2E flags in Vercel deployments", async () => {
    setRequiredCoreEnvironment();
    vi.stubEnv("AUTOMARKET_ENABLE_AUTH_RECOVERY", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_BILLING", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_KYB_RETENTION", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_PRIVATE_IMPORTS", "false");
    vi.stubEnv("NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E", "true");
    vi.stubEnv("VERCEL_ENV", "preview");

    await expect(import("../env")).rejects.toThrow(
      "NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E is test-only"
    );
  });

  it.each([
    ["production", "sk_test_api_secret_value"],
    ["preview", "sk_live_api_secret_value"],
  ])("rejects a Clerk secret from the wrong %s instance mode", async (vercelEnvironment, secretKey) => {
    setRequiredCoreEnvironment();
    vi.stubEnv("SKIP_ENV_VALIDATION", undefined);
    vi.stubEnv("AUTOMARKET_ENABLE_AUTH_RECOVERY", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_BILLING", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_KYB_RETENTION", "false");
    vi.stubEnv("AUTOMARKET_ENABLE_PRIVATE_IMPORTS", "false");
    vi.stubEnv("CLERK_SECRET_KEY", secretKey);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api-preview.automarket.bg");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app-preview.automarket.bg");
    vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://preview.automarket.bg");
    vi.stubEnv("VERCEL_ENV", vercelEnvironment);

    await expect(import("../env")).rejects.toThrow();
  });
});
