import {
  getClerkDeploymentKeyPrefixes,
  isExactRemoteHttpsDeploymentOrigin,
} from "@repo/next-config/environment-contract";

export interface ReadinessConfiguration {
  readonly blobReadWriteToken?: string;
  readonly clerkSecretKey?: string;
  readonly clerkWebhookSecret?: string;
  readonly cronSecret?: string;
  readonly upstashRedisRestToken?: string;
  readonly upstashRedisRestUrl?: string;
}

export interface ReadinessOptions {
  readonly adapterConfiguration?: ReadinessAdapterConfiguration;
  readonly capabilityIntent?: ReadinessCapabilityIntent;
  readonly configuration?: ReadinessConfiguration;
  readonly databaseProbe: () => Promise<void>;
  readonly databaseUrl?: string;
  readonly nodeEnv?: string;
  readonly skipEnvValidation?: string;
  readonly timeoutMs?: number;
  readonly vercelEnvironment?: string;
}

export type ReadinessCapabilityName =
  | "auth_recovery"
  | "dealer_billing_and_promotions"
  | "kyb_retention"
  | "private_inventory_imports";

export interface ReadinessAdapterConfiguration {
  readonly billingProjection: boolean;
  readonly clerkRecovery: boolean;
  readonly inventoryCredentials: boolean;
  readonly inventoryScanner: boolean;
  readonly privateStorage: boolean;
  readonly stripeSecret: boolean;
  readonly stripeWebhook: boolean;
}

export type ReadinessCapabilityIntent = Readonly<
  Record<ReadinessCapabilityName, "false" | "true" | undefined>
>;

export interface CapabilityReadiness {
  readonly blockers: readonly string[];
  readonly mode: "disabled" | "launch_enabled" | "misconfigured";
  readonly name: ReadinessCapabilityName;
  readonly status: "disabled" | "misconfigured" | "ready" | "unavailable";
}

type ReadinessCheckName =
  | "blob_cleanup_configuration"
  | "clerk_auth_configuration"
  | "clerk_webhook_configuration"
  | "cron_auth_configuration"
  | "database_configuration"
  | "database_schema"
  | "production_data_policy"
  | "webhook_idempotency_configuration";

interface ReadinessCheck {
  readonly name: ReadinessCheckName;
  readonly status: "fail" | "pass";
}

export interface ReadinessReport {
  readonly capabilities: readonly CapabilityReadiness[];
  readonly checks: readonly ReadinessCheck[];
  readonly service: "automarket-api";
  readonly status: "not_ready" | "ready";
}

const defaultAdapterConfiguration: ReadinessAdapterConfiguration = {
  billingProjection: false,
  clerkRecovery: false,
  inventoryCredentials: false,
  inventoryScanner: false,
  privateStorage: false,
  stripeSecret: false,
  stripeWebhook: false,
};

const defaultCapabilityIntent: ReadinessCapabilityIntent = {
  auth_recovery: undefined,
  dealer_billing_and_promotions: undefined,
  kyb_retention: undefined,
  private_inventory_imports: undefined,
};

const bearerSecretPattern = /^[A-Za-z0-9_-]{32,}$/u;

const evaluateCapability = (
  name: ReadinessCapabilityName,
  intent: "false" | "true" | undefined,
  requirements: Readonly<Record<string, boolean>>
): CapabilityReadiness => {
  if (intent === undefined) {
    return {
      blockers: ["capability_intent"],
      mode: "misconfigured",
      name,
      status: "misconfigured",
    };
  }

  if (intent === "false") {
    return { blockers: [], mode: "disabled", name, status: "disabled" };
  }

  const blockers = Object.entries(requirements)
    .filter(([, configured]) => !configured)
    .map(([requirement]) => requirement);
  return {
    blockers,
    mode: "launch_enabled",
    name,
    status: blockers.length === 0 ? "ready" : "unavailable",
  };
};

export const getCapabilityReadiness = (
  capabilityIntent: ReadinessCapabilityIntent,
  adapterConfiguration: ReadinessAdapterConfiguration
): readonly CapabilityReadiness[] => [
  evaluateCapability("auth_recovery", capabilityIntent.auth_recovery, {
    clerk_recovery_adapter: adapterConfiguration.clerkRecovery,
  }),
  evaluateCapability(
    "dealer_billing_and_promotions",
    capabilityIntent.dealer_billing_and_promotions,
    {
      billing_projection: adapterConfiguration.billingProjection,
      stripe_secret: adapterConfiguration.stripeSecret,
      stripe_webhook: adapterConfiguration.stripeWebhook,
    }
  ),
  evaluateCapability(
    "private_inventory_imports",
    capabilityIntent.private_inventory_imports,
    {
      inventory_credential_provider: adapterConfiguration.inventoryCredentials,
      inventory_scanner_adapter: adapterConfiguration.inventoryScanner,
      private_storage_provider: adapterConfiguration.privateStorage,
    }
  ),
  evaluateCapability("kyb_retention", capabilityIntent.kyb_retention, {
    private_storage_provider: adapterConfiguration.privateStorage,
  }),
];

const isConfigured = (value: string | undefined, minimumLength: number) =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length >= minimumLength;

const withTimeout = async (
  operation: Promise<void>,
  timeoutMs: number
): Promise<void> => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Readiness probe timed out")),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const getReadinessReport = async ({
  adapterConfiguration = defaultAdapterConfiguration,
  capabilityIntent = defaultCapabilityIntent,
  configuration = {},
  databaseProbe,
  databaseUrl,
  nodeEnv,
  skipEnvValidation,
  timeoutMs = 2000,
  vercelEnvironment,
}: ReadinessOptions): Promise<ReadinessReport> => {
  const checks: ReadinessCheck[] = [];
  const capabilities = getCapabilityReadiness(
    capabilityIntent,
    adapterConfiguration
  );
  const productionDataPolicyPasses = !(
    nodeEnv === "production" && skipEnvValidation !== undefined
  );
  const databaseConfigured = isConfigured(databaseUrl, 1);
  const clerkKeyPrefixes = getClerkDeploymentKeyPrefixes(vercelEnvironment);

  checks.push(
    {
      name: "production_data_policy",
      status: productionDataPolicyPasses ? "pass" : "fail",
    },
    {
      name: "clerk_auth_configuration",
      status:
        isConfigured(configuration.clerkSecretKey, 20) &&
        configuration.clerkSecretKey?.startsWith(clerkKeyPrefixes.secret)
          ? "pass"
          : "fail",
    },
    {
      name: "clerk_webhook_configuration",
      status:
        isConfigured(configuration.clerkWebhookSecret, 20) &&
        configuration.clerkWebhookSecret?.startsWith("whsec_")
          ? "pass"
          : "fail",
    },
    {
      name: "cron_auth_configuration",
      status: bearerSecretPattern.test(configuration.cronSecret ?? "")
        ? "pass"
        : "fail",
    },
    {
      name: "webhook_idempotency_configuration",
      status:
        isExactRemoteHttpsDeploymentOrigin(configuration.upstashRedisRestUrl) &&
        isConfigured(configuration.upstashRedisRestToken, 16)
          ? "pass"
          : "fail",
    },
    {
      name: "blob_cleanup_configuration",
      status: isConfigured(configuration.blobReadWriteToken, 20)
        ? "pass"
        : "fail",
    },
    {
      name: "database_configuration",
      status: databaseConfigured ? "pass" : "fail",
    }
  );

  if (databaseConfigured) {
    try {
      await withTimeout(databaseProbe(), timeoutMs);
      checks.push({ name: "database_schema", status: "pass" });
    } catch {
      checks.push({ name: "database_schema", status: "fail" });
    }
  } else {
    checks.push({ name: "database_schema", status: "fail" });
  }

  return {
    capabilities,
    checks,
    service: "automarket-api",
    status:
      checks.every((check) => check.status === "pass") &&
      capabilities.every(
        (capability) =>
          capability.status !== "misconfigured" &&
          capability.status !== "unavailable"
      )
        ? "ready"
        : "not_ready",
  };
};
