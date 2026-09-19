import { isExactRemoteHttpsDeploymentOrigin } from "@repo/next-config/environment-contract";
import { z } from "zod";
import { getCurrentPublicDataMode } from "../public-runtime";

const dealerBindingPattern = /^[A-Za-z0-9_-]{1,128}$/;

interface PublicContactEnvironment {
  databaseUrl?: string;
  dealerOrgId?: string;
  nodeEnv?: string;
  redisToken?: string;
  redisUrl?: string;
  requestedDataMode?: string;
  resendFrom?: string;
  resendToken?: string;
  skipEnvValidation?: string;
}

const runtimeSenderSchema = z.string().email();
const reservedSenderDomains = new Set([
  "example.com",
  "example.net",
  "example.org",
]);
const reservedSenderSuffixes = [
  ".example",
  ".invalid",
  ".localhost",
  ".test",
] as const;
const hasValue = (value: string | undefined, minimumLength = 1) =>
  Boolean(value && value === value.trim() && value.length >= minimumLength);

const isReservedSenderDomain = (domain: string) =>
  [...reservedSenderDomains].some(
    (reserved) => domain === reserved || domain.endsWith(`.${reserved}`)
  ) ||
  reservedSenderSuffixes.some(
    (suffix) => domain === suffix.slice(1) || domain.endsWith(suffix)
  );

const isRuntimeReadySender = (value?: string) => {
  if (!(value && value === value.trim())) {
    return false;
  }

  const parsed = runtimeSenderSchema.safeParse(value);
  if (!parsed.success) {
    return false;
  }

  const domain = parsed.data
    .slice(parsed.data.lastIndexOf("@") + 1)
    .toLowerCase();
  return !isReservedSenderDomain(domain);
};

export const isPublicContactSubmissionAvailable = (
  environment: PublicContactEnvironment = {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    dealerOrgId: process.env.AUTOMARKET_DEALER_ORG_ID,
    requestedDataMode: getCurrentPublicDataMode(),
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    resendFrom: process.env.RESEND_FROM,
    resendToken: process.env.RESEND_TOKEN,
  }
) => {
  const deliveryIsReady =
    isRuntimeReadySender(environment.resendFrom) &&
    hasValue(environment.resendToken, 12) &&
    environment.resendToken?.startsWith("re_");

  const inboxIsReady =
    environment.requestedDataMode === "database" &&
    Boolean(environment.databaseUrl) &&
    environment.skipEnvValidation !== "true" &&
    Boolean(
      environment.dealerOrgId &&
        dealerBindingPattern.test(environment.dealerOrgId)
    );

  if (!(deliveryIsReady || inboxIsReady)) {
    return false;
  }

  const isLocalRuntime =
    environment.nodeEnv === "development" || environment.nodeEnv === "test";

  return (
    isLocalRuntime ||
    (isExactRemoteHttpsDeploymentOrigin(environment.redisUrl) &&
      hasValue(environment.redisToken, 16))
  );
};
