// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

const setRequiredEnvironment = () => {
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_app_secret_value");
  vi.stubEnv("DATABASE_URL", "postgresql://user:pass@db.test/automarket");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.test");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_app_public_value");
  vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://web.test");
  vi.stubEnv("SKIP_ENV_VALIDATION", "");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("authenticated app environment schema", () => {
  it("accepts required core infrastructure without optional providers", async () => {
    setRequiredEnvironment();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("RESEND_TOKEN", "");

    const { env } = await import("../env");

    expect(env.CLERK_SECRET_KEY).toBe("sk_test_app_secret_value");
    expect(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY).toBe(
      "pk_test_app_public_value"
    );
    expect(env.BLOB_READ_WRITE_TOKEN).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
    expect(env.RESEND_TOKEN).toBeUndefined();
  }, 20_000);

  it.each([
    "CLERK_SECRET_KEY",
    "DATABASE_URL",
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  ])("rejects a blank required %s", async (key) => {
    setRequiredEnvironment();
    vi.stubEnv(key, "");

    await expect(import("../env")).rejects.toThrow();
  });

  it("rejects local E2E flags in Vercel deployments", async () => {
    setRequiredEnvironment();
    vi.stubEnv("AUTOMARKET_ENABLE_BILLING", "false");
    vi.stubEnv("NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E", "true");
    vi.stubEnv("VERCEL_ENV", "preview");

    await expect(import("../env")).rejects.toThrow(
      "NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E is test-only"
    );
  });

  it.each([
    ["NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL", "/dashboard"],
    ["NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL", "/welcome"],
    ["NEXT_PUBLIC_CLERK_SIGN_IN_URL", "/login"],
    ["NEXT_PUBLIC_CLERK_SIGN_UP_URL", "/register"],
  ])("rejects a non-canonical Clerk route in %s", async (key, value) => {
    setRequiredEnvironment();
    vi.stubEnv(key, value);

    await expect(import("../env")).rejects.toThrow();
  });

  it.each([
    ["production", "sk_test_app_secret_value", "pk_test_app_public_value"],
    ["preview", "sk_live_app_secret_value", "pk_live_app_public_value"],
  ])("rejects Clerk keys from the wrong %s instance mode", async (vercelEnvironment, secretKey, publishableKey) => {
    setRequiredEnvironment();
    vi.stubEnv("SKIP_ENV_VALIDATION", undefined);
    vi.stubEnv("AUTOMARKET_ENABLE_BILLING", "false");
    vi.stubEnv("CLERK_SECRET_KEY", secretKey);
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api-preview.automarket.bg");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app-preview.automarket.bg");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", publishableKey);
    vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://preview.automarket.bg");
    vi.stubEnv("VERCEL_ENV", vercelEnvironment);

    await expect(import("../env")).rejects.toThrow();
  });
});
