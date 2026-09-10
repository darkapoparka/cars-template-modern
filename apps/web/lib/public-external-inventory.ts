import "server-only";

import { leadSite } from "@repo/marketplace";

import {
  type ExternalInventoryDiscoveryResponse,
  externalInventoryDiscoveryResponseSchema,
} from "@repo/marketplace/external-inventory";

const localApiBaseUrl = "http://localhost:3002";

const getPublicApiBaseUrl = (): string | null => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const candidate =
    configuredUrl ||
    (process.env.NODE_ENV === "development" ? localApiBaseUrl : null);

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    if (["http:", "https:"].includes(url.protocol)) {
      return url.origin;
    }
  } catch {
    // Deployment validation owns malformed public origins.
  }

  return null;
};

export const getPublicExternalInventory = async (
  originCountryCode: string
): Promise<ExternalInventoryDiscoveryResponse> => {
  const normalizedOrigin = originCountryCode.trim().toUpperCase();
  if (leadSite.staticDemoMode) {
    return {
      listings: [],
      originCountryCode: normalizedOrigin,
      reason: "not_configured",
      status: "disabled",
    };
  }
  const apiBaseUrl = getPublicApiBaseUrl();
  if (!apiBaseUrl) {
    return {
      listings: [],
      originCountryCode: normalizedOrigin,
      reason: "provider_error",
      status: "unavailable",
    };
  }

  const endpoint = new URL("/public/inventory/external", `${apiBaseUrl}/`);
  endpoint.searchParams.set("limit", "12");
  endpoint.searchParams.set("origin", normalizedOrigin);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    });
    const parsed = externalInventoryDiscoveryResponseSchema.safeParse(
      await response.json()
    );
    if (parsed.success) {
      return parsed.data;
    }
  } catch {
    // The page renders a truthful provider-unavailable state.
  }

  return {
    listings: [],
    originCountryCode: normalizedOrigin,
    reason: "provider_error",
    status: "unavailable",
  };
};
