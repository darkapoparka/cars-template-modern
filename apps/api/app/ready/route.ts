import { database } from "@repo/database";
import {
  attachCorrelationId,
  getCorrelationId,
} from "@repo/observability/request-context";
import { env } from "@/env";
import { apiAdapterCapabilities } from "@/lib/capabilities";
import {
  clerkRecoveryAdapter,
  inventoryArtifactScanner,
  inventoryCredentialProvider,
  privateObjectStorageProvider,
} from "@/lib/provider-adapters";
import { getReadinessReport } from "./readiness";

const probeDatabaseSchema = async (): Promise<void> => {
  await database.marketplaceListing.findFirst({ select: { id: true } });
};

export const GET = async (request: Request): Promise<Response> => {
  const correlationId = getCorrelationId(request.headers);
  const report = await getReadinessReport({
    adapterConfiguration: {
      billingProjection: apiAdapterCapabilities.billingProjection,
      clerkRecovery: clerkRecoveryAdapter.configured,
      inventoryCredentials: inventoryCredentialProvider.name !== "unconfigured",
      inventoryScanner: inventoryArtifactScanner.name !== "unconfigured",
      privateStorage: privateObjectStorageProvider.name !== "unconfigured",
      stripeSecret: Boolean(process.env.STRIPE_SECRET_KEY),
      stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    },
    capabilityIntent: {
      auth_recovery: env.AUTOMARKET_ENABLE_AUTH_RECOVERY,
      dealer_billing_and_promotions: env.AUTOMARKET_ENABLE_BILLING,
      kyb_retention: env.AUTOMARKET_ENABLE_KYB_RETENTION,
      private_inventory_imports: env.AUTOMARKET_ENABLE_PRIVATE_IMPORTS,
    },
    configuration: {
      blobReadWriteToken: process.env.BLOB_READ_WRITE_TOKEN,
      clerkSecretKey: process.env.CLERK_SECRET_KEY,
      clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
      cronSecret: process.env.CRON_SECRET,
      upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
      upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    },
    databaseProbe: probeDatabaseSchema,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
    vercelEnvironment: process.env.VERCEL_ENV,
  });
  const response = Response.json(report, {
    headers: { "cache-control": "no-store" },
    status: report.status === "ready" ? 200 : 503,
  });

  return attachCorrelationId(response, correlationId);
};
