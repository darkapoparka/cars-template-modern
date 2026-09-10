import { type InventoryRecord, inventoryRecordSchema } from "@repo/marketplace";
import { z } from "zod";

const AUTO_DEV_PROVIDER_ID = "auto-dev-listings-api";
const AUTO_DEV_API_ORIGIN = "https://api.auto.dev";
const AUTO_DEV_LISTINGS_PATH = "/listings";
const MILES_TO_KILOMETERS = 1.609_344;
const MAX_PROVIDER_LIMIT = 20;
const DEFAULT_TIMEOUT_MS = 8000;

export interface ExternalInventoryFetchRequest {
  readonly cursor?: string;
  readonly limit: number;
  readonly signal?: AbortSignal;
  readonly sourceKey: string;
}

export interface ExternalInventorySourceReference {
  readonly dealerName: string;
  readonly externalId: string;
  readonly listingUrl: string;
}

export interface ExternalInventorySnapshot {
  readonly nextCursor?: string;
  readonly provider: string;
  readonly records: readonly InventoryRecord[];
  readonly references: readonly ExternalInventorySourceReference[];
  readonly retrievedAt: string;
  readonly snapshotComplete: boolean;
  readonly sourceKey: string;
  readonly status: "ok";
}

export interface DisabledExternalInventoryResult {
  readonly provider: string;
  readonly reason: "not_configured";
  readonly records: readonly [];
  readonly references: readonly [];
  readonly sourceKey: string;
  readonly status: "disabled";
}

export type ExternalInventoryFetchResult =
  | DisabledExternalInventoryResult
  | ExternalInventorySnapshot;

export interface ExternalInventoryProvider {
  readonly configured: boolean;
  fetchSnapshot(
    input: ExternalInventoryFetchRequest
  ): Promise<ExternalInventoryFetchResult>;
  readonly name: string;
}

export type ExternalInventoryProviderErrorCode =
  | "authentication"
  | "invalid_response"
  | "rate_limited"
  | "timeout"
  | "upstream";

export class ExternalInventoryProviderError extends Error {
  readonly code: ExternalInventoryProviderErrorCode;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ExternalInventoryProviderErrorCode,
    options: { cause?: unknown; retryAfterSeconds?: number } = {}
  ) {
    super(`External inventory provider failed: ${code}`, {
      cause: options.cause,
    });
    this.code = code;
    this.name = "ExternalInventoryProviderError";
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

const autoDevListingSchema = z
  .object({
    createdAt: z.string().optional(),
    retailListing: z
      .object({
        city: z.string().trim().min(1),
        dealer: z.string().trim().min(1),
        dealerId: z.union([z.string(), z.number()]).optional(),
        miles: z.number().nonnegative().optional(),
        price: z.number().nonnegative(),
        state: z.string().trim().min(1),
        vdp: z.url(),
      })
      .passthrough(),
    vehicle: z
      .object({
        bodyStyle: z.string().optional(),
        fuel: z.string().optional(),
        make: z.string().trim().min(1),
        model: z.string().trim().min(1),
        transmission: z.string().optional(),
        trim: z.string().optional(),
        vin: z
          .string()
          .trim()
          .toUpperCase()
          .regex(/^[A-HJ-NPR-Z0-9]{17}$/),
        year: z.number().int().min(1886).max(2100),
      })
      .passthrough(),
  })
  .passthrough();

const autoDevResponseSchema = z
  .object({
    data: z.array(z.unknown()),
    links: z
      .object({ next: z.string().nullable().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const normalizeFuelType = (value?: string) => {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("plug") && normalized.includes("hybrid")) {
    return "plug_in_hybrid" as const;
  }
  if (normalized.includes("hybrid")) {
    return "hybrid" as const;
  }
  if (normalized.includes("electric")) {
    return "electric" as const;
  }
  if (normalized.includes("diesel")) {
    return "diesel" as const;
  }
  if (normalized.includes("natural gas") || normalized.includes("cng")) {
    return "cng" as const;
  }
  if (normalized.includes("propane") || normalized.includes("lpg")) {
    return "lpg" as const;
  }
  if (normalized.includes("gas") || normalized.includes("petrol")) {
    return "gasoline" as const;
  }
  return "other" as const;
};

const normalizeTransmission = (value?: string) => {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("manual") && !normalized.includes("automated")) {
    return "manual" as const;
  }
  if (
    normalized.includes("dual") ||
    normalized.includes("dct") ||
    normalized.includes("semi")
  ) {
    return "semi_automatic" as const;
  }
  return "automatic" as const;
};

const normalizeBodyType = (value?: string) => {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("suv") || normalized.includes("crossover")) {
    return "suv" as const;
  }
  if (normalized.includes("hatch")) {
    return "hatchback" as const;
  }
  if (normalized.includes("wagon")) {
    return "wagon" as const;
  }
  if (normalized.includes("convert")) {
    return "convertible" as const;
  }
  if (normalized.includes("coupe")) {
    return "coupe" as const;
  }
  if (normalized.includes("pickup")) {
    return "pickup" as const;
  }
  if (normalized.includes("sedan")) {
    return "sedan" as const;
  }
  if (normalized.includes("minivan") || normalized.includes("van")) {
    return "van" as const;
  }
  return "other" as const;
};

const getSourceUpdatedAt = (createdAt: string | undefined, now: Date) => {
  if (createdAt) {
    const parsed = new Date(createdAt);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  return now.toISOString();
};

const normalizeNextCursor = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value, AUTO_DEV_API_ORIGIN);
    if (
      url.origin === AUTO_DEV_API_ORIGIN &&
      url.pathname === AUTO_DEV_LISTINGS_PATH &&
      !url.username &&
      !url.password
    ) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const getRequestUrl = (input: ExternalInventoryFetchRequest) => {
  if (input.cursor) {
    const cursor = normalizeNextCursor(input.cursor);
    if (!cursor) {
      throw new ExternalInventoryProviderError("invalid_response");
    }
    return new URL(cursor, AUTO_DEV_API_ORIGIN);
  }

  const url = new URL(AUTO_DEV_LISTINGS_PATH, AUTO_DEV_API_ORIGIN);
  url.searchParams.set(
    "limit",
    String(Math.min(Math.max(Math.trunc(input.limit), 1), MAX_PROVIDER_LIMIT))
  );
  url.searchParams.set("sort", "updatedAt.desc");
  return url;
};

const mapAutoDevListing = (rawListing: unknown, now: Date) => {
  const parsed = autoDevListingSchema.safeParse(rawListing);
  if (!parsed.success) {
    return undefined;
  }

  const listing = parsed.data;
  const sourceUpdatedAt = getSourceUpdatedAt(listing.createdAt, now);
  const dealerIdentity = String(
    listing.retailListing.dealerId ?? listing.retailListing.dealer
  );
  const externalId = `${listing.vehicle.vin}:${dealerIdentity}`.slice(0, 240);
  const title = [
    listing.vehicle.year,
    listing.vehicle.make,
    listing.vehicle.model,
    listing.vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 180);
  const record = inventoryRecordSchema.safeParse({
    externalId,
    offer: {
      destinationMarketCodes: ["us"],
      description: `Vehicle listing supplied by ${listing.retailListing.dealer}. Confirm availability and import costs with the source.`,
      externalOfferId: externalId,
      media: [],
      mileage: {
        unit: "km",
        value: Math.round(
          (listing.retailListing.miles ?? 0) * MILES_TO_KILOMETERS
        ),
      },
      nativePrice: {
        amountMinor: String(Math.round(listing.retailListing.price * 100)),
        currencyCode: "USD",
        exponent: 2,
      },
      physicalLocation: {
        city: listing.retailListing.city,
        country: "United States",
        countryCode: "US",
        region: listing.retailListing.state,
      },
      status: "available",
      taxTreatment: "unspecified",
      title,
    },
    operation: "upsert",
    sourceUpdatedAt,
    sourceVersion: sourceUpdatedAt,
    vehicle: {
      bodyType: normalizeBodyType(listing.vehicle.bodyStyle),
      category: "car",
      fuelType: normalizeFuelType(listing.vehicle.fuel),
      make: listing.vehicle.make,
      model: listing.vehicle.model,
      transmission: normalizeTransmission(listing.vehicle.transmission),
      trim: listing.vehicle.trim,
      vin: listing.vehicle.vin,
      year: listing.vehicle.year,
    },
  });
  if (!record.success) {
    return undefined;
  }

  return {
    record: record.data,
    reference: {
      dealerName: listing.retailListing.dealer,
      externalId,
      listingUrl: listing.retailListing.vdp,
    },
  };
};

interface AutoDevProviderOptions {
  readonly apiKey?: string;
  readonly enabled?: boolean;
  readonly fetchImpl?: typeof fetch;
  readonly now?: () => Date;
  readonly timeoutMs?: number;
}

const getAutoDevEnvelope = async ({
  apiKey,
  fetchImpl,
  input,
  timeoutMs,
}: {
  apiKey: string;
  fetchImpl: typeof fetch;
  input: ExternalInventoryFetchRequest;
  timeoutMs: number;
}) => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = input.signal
    ? AbortSignal.any([input.signal, timeoutSignal])
    : timeoutSignal;
  let response: Response;
  try {
    response = await fetchImpl(getRequestUrl(input), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      method: "GET",
      redirect: "error",
      signal,
    });
  } catch (error) {
    if (signal.aborted) {
      throw new ExternalInventoryProviderError("timeout", { cause: error });
    }
    throw new ExternalInventoryProviderError("upstream", { cause: error });
  }

  if (response.status === 401 || response.status === 403) {
    throw new ExternalInventoryProviderError("authentication");
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new ExternalInventoryProviderError("rate_limited", {
      retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
    });
  }
  if (!response.ok) {
    throw new ExternalInventoryProviderError("upstream");
  }

  let rawResponse: unknown;
  try {
    rawResponse = await response.json();
  } catch (error) {
    throw new ExternalInventoryProviderError("invalid_response", {
      cause: error,
    });
  }
  const envelope = autoDevResponseSchema.safeParse(rawResponse);
  if (!envelope.success) {
    throw new ExternalInventoryProviderError("invalid_response", {
      cause: envelope.error,
    });
  }
  return envelope.data;
};

export const createAutoDevExternalInventoryProvider = (
  options: AutoDevProviderOptions = {}
): ExternalInventoryProvider => {
  const apiKey = options.apiKey?.trim();
  const configured = options.enabled === true && Boolean(apiKey);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    configured,
    name: AUTO_DEV_PROVIDER_ID,
    async fetchSnapshot(input) {
      if (!(configured && apiKey)) {
        return {
          provider: AUTO_DEV_PROVIDER_ID,
          reason: "not_configured",
          records: [],
          references: [],
          sourceKey: input.sourceKey,
          status: "disabled",
        };
      }

      const envelope = await getAutoDevEnvelope({
        apiKey,
        fetchImpl,
        input,
        timeoutMs,
      });
      const retrievedAt = now();
      const mapped = envelope.data
        .map((listing) => mapAutoDevListing(listing, retrievedAt))
        .filter((listing): listing is NonNullable<typeof listing> =>
          Boolean(listing)
        );
      if (envelope.data.length > 0 && mapped.length === 0) {
        throw new ExternalInventoryProviderError("invalid_response");
      }

      return {
        nextCursor: normalizeNextCursor(envelope.links?.next),
        provider: AUTO_DEV_PROVIDER_ID,
        records: mapped.map((listing) => listing.record),
        references: mapped.map((listing) => listing.reference),
        retrievedAt: retrievedAt.toISOString(),
        snapshotComplete: false,
        sourceKey: input.sourceKey,
        status: "ok",
      };
    },
  };
};

export const unconfiguredExternalInventoryProvider =
  createAutoDevExternalInventoryProvider();

export const autoDevExternalInventoryProvider =
  createAutoDevExternalInventoryProvider({
    apiKey: process.env.AUTO_DEV_API_KEY,
    enabled:
      process.env.AUTOMARKET_ENABLE_EXTERNAL_INVENTORY === "true" &&
      process.env.NODE_ENV !== "production",
  });
