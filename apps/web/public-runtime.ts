import { leadSite } from "@repo/marketplace/lead-site";

export type PublicDataMode = "database" | "demo" | "unavailable";
export type PublicDataModePreference = PublicDataMode;

/** Inventory availability never selects the dealership's visual product. */
export const getPublicDataMode = ({
  databaseUrl,
  nodeEnv,
  requestedMode,
  skipEnvValidation,
  staticDemoMode = false,
}: {
  databaseUrl?: string;
  nodeEnv?: string;
  requestedMode?: string;
  skipEnvValidation?: string;
  /** Compatibility opt-in for provider-free Cars snapshots; data only. */
  staticDemoMode?: boolean;
}): PublicDataMode => {
  if (
    requestedMode &&
    !["database", "demo", "unavailable"].includes(requestedMode)
  ) {
    return "unavailable";
  }
  if (requestedMode === "unavailable") {
    return "unavailable";
  }
  const databaseAvailable =
    Boolean(databaseUrl) && skipEnvValidation !== "true";
  // An explicit live-data request must never fall back to fixtures, even in a demo snapshot.
  if (requestedMode === "database") {
    return databaseAvailable ? "database" : "unavailable";
  }
  if (staticDemoMode) {
    return "demo";
  }
  if (nodeEnv === "production") {
    return databaseAvailable ? "database" : "unavailable";
  }
  return "demo";
};

export const getCurrentPublicDataMode = (): PublicDataMode =>
  getPublicDataMode({
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    requestedMode: process.env.AUTOMARKET_PUBLIC_DATA_MODE,
    skipEnvValidation: process.env.SKIP_ENV_VALIDATION,
    staticDemoMode: leadSite.staticDemoMode,
  });

export const isStaticPublicPreview = (): boolean =>
  getCurrentPublicDataMode() === "demo";
