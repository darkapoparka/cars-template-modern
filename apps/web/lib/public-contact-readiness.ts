import { isExactRemoteHttpsDeploymentOrigin } from "@repo/next-config/environment-contract";
import { z } from "zod";

interface PublicContactEnvironment {
  nodeEnv?: string;
  redisToken?: string;
  redisUrl?: string;
  resendFrom?: string;
  resendToken?: string;
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

  if (!deliveryIsReady) {
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
