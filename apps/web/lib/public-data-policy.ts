import { leadSite } from "@repo/marketplace";

export type PublicDataMode = "database" | "demo" | "unavailable";
export type PublicDataModePreference = "database" | "demo";

export const getPublicDataMode = ({
  databaseUrl,
  nodeEnv,
  requestedMode,
  skipEnvValidation,
  staticDemoMode = false,
}: {
  databaseUrl?: string;
  nodeEnv?: string;
  requestedMode?: PublicDataModePreference;
  skipEnvValidation?: string;
  staticDemoMode?: boolean;
}): PublicDataMode => {
  if (staticDemoMode) {
    return "demo";
  }

  const databaseAvailable =
    Boolean(databaseUrl) && skipEnvValidation !== "true";

  if (nodeEnv === "production") {
    return databaseAvailable ? "database" : "unavailable";
  }

  if (requestedMode === "database") {
    return databaseAvailable ? "database" : "unavailable";
  }

  return "demo";
};

export const getCurrentPublicDataMode = (): PublicDataMode =>
  getPublicDataMode({
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    requestedMode: process.env
      .AUTOMARKET_PUBLIC_DATA_MODE as PublicDataModePreference,
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
    staticDemoMode: leadSite.staticDemoMode,
  });
