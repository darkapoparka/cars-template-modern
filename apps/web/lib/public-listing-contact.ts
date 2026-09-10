import {
  getPublicDataMode,
  type PublicDataModePreference,
} from "./public-data-policy";

interface PublicListingContactEnvironment {
  databaseUrl?: string;
  nodeEnv?: string;
  publicDataMode?: PublicDataModePreference;
  redisToken?: string;
  redisUrl?: string;
  skipEnvValidation?: string;
}

interface PublicListingLeadDestination {
  readonly dealerOrgId?: string | null;
}

export const hasRoutablePublicListingLeadDestination = (
  listing: PublicListingLeadDestination
) => Boolean(listing.dealerOrgId?.trim());

export const isPublicListingLeadSubmissionAvailable = (
  environment: PublicListingContactEnvironment = {
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    publicDataMode: process.env
      .AUTOMARKET_PUBLIC_DATA_MODE as PublicDataModePreference,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
  }
) => {
  const dataMode = getPublicDataMode({
    databaseUrl: environment.databaseUrl,
    nodeEnv: environment.nodeEnv,
    requestedMode: environment.publicDataMode,
    skipEnvValidation: environment.skipEnvValidation,
  });

  if (dataMode !== "database") {
    return false;
  }

  return (
    environment.nodeEnv !== "production" ||
    Boolean(environment.redisUrl && environment.redisToken)
  );
};
