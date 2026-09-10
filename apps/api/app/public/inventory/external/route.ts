import {
  externalInventoryDiscoveryResponseSchema,
  isoCountryCodeSchema,
} from "@repo/marketplace";
import {
  ExternalInventoryProviderError,
  externalInventoryProvider,
} from "@/lib/provider-adapters";

export const runtime = "nodejs";

const SOURCE_KEY = "auto-dev-listings-api";
const SOURCE_DISPLAY_NAME = "Auto.dev";
const SOURCE_ATTRIBUTION_URL = "https://auto.dev/";
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 20;

const getLimit = (value: string | null) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT);
};

const json = (body: unknown, status = 200, cacheControl = "no-store") =>
  Response.json(body, {
    headers: {
      "Cache-Control": cacheControl,
      "Content-Type": "application/json; charset=utf-8",
    },
    status,
  });

const unavailableResponse = (
  reason: "invalid_response" | "provider_error" | "rate_limited" | "timeout",
  status: number
) =>
  json(
    externalInventoryDiscoveryResponseSchema.parse({
      listings: [],
      originCountryCode: "US",
      reason,
      status: "unavailable",
    }),
    status
  );

export const GET = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const parsedOrigin = isoCountryCodeSchema.safeParse(
    (url.searchParams.get("origin") ?? "US").toUpperCase()
  );
  if (!parsedOrigin.success) {
    return json({ error: "invalid_origin" }, 400);
  }
  const originCountryCode = parsedOrigin.data;

  if (originCountryCode !== "US") {
    return json(
      externalInventoryDiscoveryResponseSchema.parse({
        listings: [],
        originCountryCode,
        reason: "unsupported_origin",
        status: "disabled",
      }),
      200,
      "public, max-age=60, s-maxage=300"
    );
  }

  try {
    const result = await externalInventoryProvider.fetchSnapshot({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: getLimit(url.searchParams.get("limit")),
      signal: request.signal,
      sourceKey: SOURCE_KEY,
    });
    if (result.status === "disabled") {
      return json(
        externalInventoryDiscoveryResponseSchema.parse({
          listings: [],
          originCountryCode,
          reason: "not_configured",
          status: "disabled",
        })
      );
    }

    const referencesById = new Map(
      result.references.map((reference) => [reference.externalId, reference])
    );
    const listings = result.records.flatMap((record) => {
      if (record.operation !== "upsert") {
        return [];
      }
      const reference = referencesById.get(record.externalId);
      if (!reference) {
        return [];
      }
      return [
        {
          externalId: record.externalId,
          offer: {
            dealerName: reference.dealerName,
            mileageKm: record.offer.mileage.value,
            nativePrice: record.offer.nativePrice,
            physicalLocation: record.offer.physicalLocation,
            status:
              record.offer.status === "reserved" ? "reserved" : "available",
          },
          source: {
            displayName: SOURCE_DISPLAY_NAME,
            listingUrl: reference.listingUrl,
            providerId: SOURCE_KEY,
          },
          sourceUpdatedAt: record.sourceUpdatedAt,
          title: record.offer.title,
          vehicle: {
            bodyType: record.vehicle.bodyType,
            fuelType: record.vehicle.fuelType,
            make: record.vehicle.make,
            model: record.vehicle.model,
            transmission: record.vehicle.transmission,
            trim: record.vehicle.trim,
            vin: record.vehicle.vin,
            year: record.vehicle.year,
          },
        },
      ];
    });

    return json(
      externalInventoryDiscoveryResponseSchema.parse({
        listings,
        nextCursor: result.nextCursor,
        originCountryCode,
        retrievedAt: result.retrievedAt,
        source: {
          attributionUrl: SOURCE_ATTRIBUTION_URL,
          displayName: SOURCE_DISPLAY_NAME,
          providerId: SOURCE_KEY,
        },
        status: "ok",
      }),
      200,
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600"
    );
  } catch (error) {
    if (error instanceof ExternalInventoryProviderError) {
      if (error.code === "rate_limited") {
        return unavailableResponse("rate_limited", 429);
      }
      if (error.code === "timeout") {
        return unavailableResponse("timeout", 504);
      }
      if (error.code === "invalid_response") {
        return unavailableResponse("invalid_response", 502);
      }
    }
    return unavailableResponse("provider_error", 502);
  }
};
