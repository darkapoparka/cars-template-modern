import { describe, expect, it, vi } from "vitest";
import {
  getReadinessReport,
  type ReadinessConfiguration,
} from "../app/ready/readiness";

const configuredCapabilities: ReadinessConfiguration = {
  blobReadWriteToken: "vercel_blob_rw_readiness_token",
  clerkSecretKey: "sk_test_readiness_secret_value",
  clerkWebhookSecret: "whsec_readiness_webhook_value",
  cronSecret: "readiness-cron-secret-with-32-characters",
  upstashRedisRestToken: "readiness-redis-token-value",
  upstashRedisRestUrl: "https://readiness-redis.upstash.io",
};

describe("API readiness", () => {
  it("reports ready only when required configuration and schema pass", async () => {
    const databaseProbe = vi.fn().mockResolvedValue(undefined);
    const report = await getReadinessReport({
      capabilityIntent: {
        auth_recovery: "false",
        dealer_billing_and_promotions: "false",
        kyb_retention: "false",
        private_inventory_imports: "false",
      },
      configuration: configuredCapabilities,
      databaseProbe,
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("ready");
    expect(databaseProbe).toHaveBeenCalledOnce();
    expect(report.checks).toContainEqual({
      name: "database_schema",
      status: "pass",
    });
    expect(report.capabilities).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: "disabled" })])
    );
  });

  it("fails closed when the database is not configured", async () => {
    const databaseProbe = vi.fn().mockResolvedValue(undefined);
    const report = await getReadinessReport({
      configuration: configuredCapabilities,
      databaseProbe,
    });

    expect(report.status).toBe("not_ready");
    expect(databaseProbe).not.toHaveBeenCalled();
    expect(report.checks).toContainEqual({
      name: "database_configuration",
      status: "fail",
    });
  });

  it("fails closed on an incompatible schema without exposing the error", async () => {
    const report = await getReadinessReport({
      configuration: configuredCapabilities,
      databaseProbe: vi
        .fn()
        .mockRejectedValue(new Error("secret schema detail")),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toContainEqual({
      name: "database_schema",
      status: "fail",
    });
    expect(JSON.stringify(report)).not.toContain("secret schema detail");
  });

  it("fails closed when a required capability is missing without leaking values", async () => {
    const privateToken = "private-token-that-must-not-leak";
    const report = await getReadinessReport({
      configuration: {
        ...configuredCapabilities,
        blobReadWriteToken: undefined,
        clerkSecretKey: privateToken,
        upstashRedisRestToken: "short",
      },
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toContainEqual({
      name: "blob_cleanup_configuration",
      status: "fail",
    });
    expect(report.checks).toContainEqual({
      name: "webhook_idempotency_configuration",
      status: "fail",
    });
    expect(report.checks).toContainEqual({
      name: "clerk_auth_configuration",
      status: "fail",
    });
    expect(JSON.stringify(report)).not.toContain(privateToken);
  });

  it("rejects Preview Clerk credentials in Production readiness", async () => {
    const report = await getReadinessReport({
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
      vercelEnvironment: "production",
    });

    expect(report.checks).toContainEqual({
      name: "clerk_auth_configuration",
      status: "fail",
    });
    expect(report.status).toBe("not_ready");
  });

  it("rejects unsafe cron and non-origin Redis configuration", async () => {
    const report = await getReadinessReport({
      configuration: {
        ...configuredCapabilities,
        cronSecret: "unsafe cron secret with spaces and 32 characters",
        upstashRedisRestUrl: "https://readiness-redis.upstash.io/path",
      },
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toContainEqual({
      name: "cron_auth_configuration",
      status: "fail",
    });
    expect(report.checks).toContainEqual({
      name: "webhook_idempotency_configuration",
      status: "fail",
    });
  });

  it.each([
    "https://readiness-redis.example.test",
    "https://127.0.0.2",
    "https://readiness-redis.upstash.io.",
  ])("rejects a non-deployable Redis origin: %s", async (redisUrl) => {
    const report = await getReadinessReport({
      configuration: {
        ...configuredCapabilities,
        upstashRedisRestUrl: redisUrl,
      },
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.checks).toContainEqual({
      name: "webhook_idempotency_configuration",
      status: "fail",
    });
  });

  it("rejects production configuration that enables validation bypass", async () => {
    const report = await getReadinessReport({
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
      skipEnvValidation: "true",
    });

    expect(report.status).toBe("not_ready");
    expect(report.checks).toContainEqual({
      name: "production_data_policy",
      status: "fail",
    });
  });

  it("rejects a blank production validation bypass by presence", async () => {
    const report = await getReadinessReport({
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
      skipEnvValidation: "",
    });

    expect(report.checks).toContainEqual({
      name: "production_data_policy",
      status: "fail",
    });
  });

  it("blocks readiness when a launch-enabled adapter is unavailable", async () => {
    const report = await getReadinessReport({
      adapterConfiguration: {
        billingProjection: false,
        clerkRecovery: false,
        inventoryCredentials: false,
        inventoryScanner: false,
        privateStorage: false,
        stripeSecret: false,
        stripeWebhook: false,
      },
      capabilityIntent: {
        auth_recovery: "false",
        dealer_billing_and_promotions: "false",
        kyb_retention: "false",
        private_inventory_imports: "true",
      },
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("not_ready");
    expect(report.capabilities).toContainEqual({
      blockers: [
        "inventory_credential_provider",
        "inventory_scanner_adapter",
        "private_storage_provider",
      ],
      mode: "launch_enabled",
      name: "private_inventory_imports",
      status: "unavailable",
    });
  });

  it("reports launch-enabled capabilities ready only with all adapters", async () => {
    const report = await getReadinessReport({
      adapterConfiguration: {
        billingProjection: true,
        clerkRecovery: true,
        inventoryCredentials: true,
        inventoryScanner: true,
        privateStorage: true,
        stripeSecret: true,
        stripeWebhook: true,
      },
      capabilityIntent: {
        auth_recovery: "true",
        dealer_billing_and_promotions: "true",
        kyb_retention: "true",
        private_inventory_imports: "true",
      },
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("ready");
    expect(report.capabilities.every(({ status }) => status === "ready")).toBe(
      true
    );
  });

  it("distinguishes missing intent from an intentional disable", async () => {
    const report = await getReadinessReport({
      capabilityIntent: {
        auth_recovery: undefined,
        dealer_billing_and_promotions: "false",
        kyb_retention: "false",
        private_inventory_imports: "false",
      },
      configuration: configuredCapabilities,
      databaseProbe: vi.fn().mockResolvedValue(undefined),
      databaseUrl: "postgresql://configured",
      nodeEnv: "production",
    });

    expect(report.status).toBe("not_ready");
    expect(report.capabilities).toContainEqual({
      blockers: ["capability_intent"],
      mode: "misconfigured",
      name: "auth_recovery",
      status: "misconfigured",
    });
    expect(report.capabilities).toContainEqual({
      blockers: [],
      mode: "disabled",
      name: "private_inventory_imports",
      status: "disabled",
    });
  });
});
