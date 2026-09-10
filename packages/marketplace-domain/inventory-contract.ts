import { z } from "zod";
import { bodyTypes, fuelTypes, transmissionTypes } from "./taxonomy";

const inventoryVehicleCategories = [
  "car",
  "truck",
  "motorbike",
  "van",
] as const;

const inventoryOfferStatuses = [
  "available",
  "reserved",
  "sold",
  "withdrawn",
] as const;

const POSTGRES_BIGINT_MAX = 9_223_372_036_854_775_807n;
export const MAX_INVENTORY_BATCH_RECORDS = 100;
export const MAX_INVENTORY_DESTINATION_MARKETS = 32;
export const MAX_MEDIA_TERRITORY_COUNTRIES = 64;
export const MAX_SOURCE_CLOCK_SKEW_MS = 5 * 60_000;
const DECIMAL_HOSTNAME_PATTERN = /^\d+$/;
const HEX_HOSTNAME_PATTERN = /^0x[\da-f]+$/;
const ISO_COUNTRY_CODES = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW".split(
    " "
  )
);
const ISO_CURRENCY_CODES = new Set(Intl.supportedValuesOf("currency"));
const ISO_COUNTRY_DISPLAY_NAMES = new Intl.DisplayNames(["en"], {
  type: "region",
});

const sourceDateTimeSchema = z.iso.datetime({ offset: true });

const isRestrictedIpv4 = (hostname: string) => {
  const octets = hostname.split(".").map(Number);

  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  return (
    octets[0] === 0 ||
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && (octets[1] ?? 0) >= 16 && (octets[1] ?? 0) <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
};

const isRestrictedMediaHostname = (input: string) => {
  const hostname = input.toLowerCase().replace(/^\[|\]$/g, "");

  return (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "::" ||
    hostname === "::1" ||
    (hostname.includes(":") &&
      (hostname.startsWith("fc") ||
        hostname.startsWith("fd") ||
        hostname.startsWith("fe80:"))) ||
    DECIMAL_HOSTNAME_PATTERN.test(hostname) ||
    HEX_HOSTNAME_PATTERN.test(hostname) ||
    isRestrictedIpv4(hostname)
  );
};

const publicHttpsMediaUrlSchema = z
  .url()
  .max(2048)
  .superRefine((value, context) => {
    const url = new URL(value);

    if (url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        message: "Media URLs must use HTTPS",
      });
    }
    if (url.username || url.password) {
      context.addIssue({
        code: "custom",
        message: "Media URLs cannot contain credentials",
      });
    }
    if (isRestrictedMediaHostname(url.hostname)) {
      context.addIssue({
        code: "custom",
        message: "Media URLs cannot target a local or private host",
      });
    }
  });

const findPostgresNullCharacterPath = (
  value: unknown,
  path: Array<string | number> = []
): Array<string | number> | undefined => {
  if (typeof value === "string") {
    return value.includes("\0") ? path : undefined;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const result = findPostgresNullCharacterPath(entry, [...path, index]);
      if (result) {
        return result;
      }
    }
    return undefined;
  }

  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      const result = findPostgresNullCharacterPath(entry, [...path, key]);
      if (result) {
        return result;
      }
    }
  }

  return undefined;
};

const hasUniqueValues = (values: readonly string[]) =>
  new Set(values).size === values.length;

export const isoCountryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/)
  .refine((value) => ISO_COUNTRY_CODES.has(value), "Unknown ISO country code");

export const isoCurrencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/)
  .refine(
    (value) => ISO_CURRENCY_CODES.has(value),
    "Unknown ISO currency code"
  );

export const getIsoCountryName = (countryCode: string) =>
  ISO_COUNTRY_DISPLAY_NAMES.of(countryCode.toUpperCase()) ??
  countryCode.toUpperCase();

export const inventoryMoneySchema = z
  .object({
    amountMinor: z.string().regex(/^(0|[1-9]\d*)$/),
    currencyCode: isoCurrencyCodeSchema,
    exponent: z.number().int().min(0).max(4),
  })
  .strict()
  .superRefine((value, context) => {
    if (BigInt(value.amountMinor) > POSTGRES_BIGINT_MAX) {
      context.addIssue({
        code: "custom",
        message: "amountMinor exceeds the supported 64-bit range",
        path: ["amountMinor"],
      });
    }

    const expectedExponent = new Intl.NumberFormat("en", {
      currency: value.currencyCode,
      style: "currency",
    }).resolvedOptions().maximumFractionDigits;
    if (value.exponent !== expectedExponent) {
      context.addIssue({
        code: "custom",
        message: `${value.currencyCode} requires exponent ${expectedExponent}`,
        path: ["exponent"],
      });
    }
  });

export const inventoryLocationSchema = z
  .object({
    city: z.string().trim().min(1).max(120),
    country: z.string().trim().min(2).max(120),
    countryCode: isoCountryCodeSchema,
    region: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const inventoryMediaSchema = z
  .object({
    alt: z.string().trim().max(240).default(""),
    position: z.number().int().min(0),
    rights: z
      .object({
        expiresAt: sourceDateTimeSchema.optional(),
        scope: z.enum(["worldwide", "territories"]),
        status: z.enum(["authorized", "unknown", "expired"]),
        territoryCountryCodes: z
          .array(isoCountryCodeSchema)
          .max(MAX_MEDIA_TERRITORY_COUNTRIES)
          .refine(
            hasUniqueValues,
            "Media territory country codes must be unique"
          ),
      })
      .strict()
      .superRefine((rights, context) => {
        if (
          rights.scope === "territories" &&
          rights.territoryCountryCodes.length === 0
        ) {
          context.addIssue({
            code: "custom",
            message: "Territorial media rights require at least one country",
            path: ["territoryCountryCodes"],
          });
        }
        if (
          rights.scope === "worldwide" &&
          rights.territoryCountryCodes.length > 0
        ) {
          context.addIssue({
            code: "custom",
            message: "Worldwide media rights cannot include territories",
            path: ["territoryCountryCodes"],
          });
        }
      }),
    url: publicHttpsMediaUrlSchema,
  })
  .strict();

export const inventoryVehicleSchema = z
  .object({
    bodyType: z.enum(bodyTypes),
    category: z.enum(inventoryVehicleCategories),
    colorExterior: z.string().trim().max(80).optional(),
    derivative: z.string().trim().min(1).max(120).optional(),
    fuelType: z.enum(fuelTypes),
    make: z.string().trim().min(1).max(80),
    model: z.string().trim().min(1).max(80),
    transmission: z.enum(transmissionTypes),
    trim: z.string().trim().min(1).max(120).optional(),
    vin: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-HJ-NPR-Z0-9]{17}$/)
      .optional(),
    year: z.number().int().min(1886).max(2100),
  })
  .strict();

const upsertInventoryRecordSchema = z
  .object({
    externalId: z.string().trim().min(1).max(240),
    offer: z
      .object({
        destinationMarketCodes: z
          .array(
            z
              .string()
              .trim()
              .toLowerCase()
              .regex(/^[a-z0-9][a-z0-9-]*$/)
          )
          .min(1)
          .max(MAX_INVENTORY_DESTINATION_MARKETS)
          .refine(hasUniqueValues, "Destination market codes must be unique"),
        description: z.string().trim().min(1).max(20_000),
        externalOfferId: z.string().trim().min(1).max(240),
        media: z.array(inventoryMediaSchema).max(80).default([]),
        mileage: z
          .object({
            unit: z.literal("km"),
            value: z.number().int().min(0).max(10_000_000),
          })
          .strict(),
        nativePrice: inventoryMoneySchema,
        physicalLocation: inventoryLocationSchema,
        status: z.enum(inventoryOfferStatuses),
        stockNumber: z.string().trim().max(120).optional(),
        taxTreatment: z.enum([
          "gross",
          "net",
          "vat_qualifying",
          "margin",
          "unspecified",
        ]),
        title: z.string().trim().min(3).max(180),
      })
      .strict(),
    operation: z.literal("upsert"),
    sourceUpdatedAt: sourceDateTimeSchema,
    sourceVersion: z.string().trim().min(1).max(240).optional(),
    vehicle: inventoryVehicleSchema,
  })
  .strict();

const withdrawInventoryRecordSchema = z
  .object({
    externalId: z.string().trim().min(1).max(240),
    externalOfferId: z.string().trim().min(1).max(240).optional(),
    operation: z.literal("withdraw"),
    sourceUpdatedAt: sourceDateTimeSchema,
    sourceVersion: z.string().trim().min(1).max(240).optional(),
  })
  .strict();

export const inventoryRecordSchema = z
  .discriminatedUnion("operation", [
    upsertInventoryRecordSchema,
    withdrawInventoryRecordSchema,
  ])
  .superRefine((value, context) => {
    const path = findPostgresNullCharacterPath(value);
    if (path) {
      context.addIssue({
        code: "custom",
        message: "Inventory text cannot contain null characters",
        path,
      });
    }
  });

export const inventoryBatchMetadataSchema = z
  .object({
    complete: z.boolean(),
    generatedAt: sourceDateTimeSchema,
    id: z.string().trim().min(1).max(240),
    mode: z.enum(["full_snapshot", "incremental"]),
    sequence: z.string().trim().min(1).max(240).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const path = findPostgresNullCharacterPath(value);
    if (path) {
      context.addIssue({
        code: "custom",
        message: "Batch metadata cannot contain null characters",
        path,
      });
    }
  });

export const inventoryBatchSchema = z
  .object({
    batch: inventoryBatchMetadataSchema,
    records: z.array(inventoryRecordSchema).max(MAX_INVENTORY_BATCH_RECORDS),
    schemaVersion: z.literal("automarket.inventory.v1"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.batch.mode === "incremental" && value.batch.complete) {
      context.addIssue({
        code: "custom",
        message: "Incremental batches cannot assert full-snapshot completeness",
        path: ["batch", "complete"],
      });
    }
    if (
      value.records.length === 0 &&
      !(value.batch.mode === "full_snapshot" && value.batch.complete)
    ) {
      context.addIssue({
        code: "custom",
        message: "Only a complete full snapshot may contain zero records",
        path: ["records"],
      });
    }
    const generatedAt = new Date(value.batch.generatedAt).getTime();
    value.records.forEach((record, index) => {
      if (
        new Date(record.sourceUpdatedAt).getTime() >
        generatedAt + MAX_SOURCE_CLOCK_SKEW_MS
      ) {
        context.addIssue({
          code: "custom",
          message: "sourceUpdatedAt cannot be later than the batch timestamp",
          path: ["records", index, "sourceUpdatedAt"],
        });
      }
    });
  });

export type InventoryBatch = z.infer<typeof inventoryBatchSchema>;
export type InventoryRecord = z.infer<typeof inventoryRecordSchema>;
export type InventoryUpsertRecord = z.infer<typeof upsertInventoryRecordSchema>;
export type InventoryWithdrawRecord = z.infer<
  typeof withdrawInventoryRecordSchema
>;

export const parseInventoryBatch = (input: unknown): InventoryBatch =>
  inventoryBatchSchema.parse(input);

const rawInventoryBatchSchema = z
  .object({
    batch: inventoryBatchMetadataSchema,
    records: z.array(z.unknown()).max(MAX_INVENTORY_BATCH_RECORDS),
    schemaVersion: z.literal("automarket.inventory.v1"),
  })
  .strict();

export interface QuarantinedInventoryRecord {
  externalId?: string;
  issues: Array<{ message: string; path: string }>;
  raw: unknown;
  rowNumber: number;
}

export interface PreparedInventoryBatch {
  batch: InventoryBatch["batch"];
  preparedRecords: Array<{
    normalized: InventoryRecord;
    raw: unknown;
    rowNumber: number;
  }>;
  quarantinedRecords: QuarantinedInventoryRecord[];
  records: InventoryRecord[];
  schemaVersion: InventoryBatch["schemaVersion"];
}

export const prepareInventoryBatch = (
  input: unknown,
  options: { now?: Date } = {}
): PreparedInventoryBatch => {
  const envelope = rawInventoryBatchSchema.parse(input);

  if (envelope.batch.mode === "incremental" && envelope.batch.complete) {
    throw new Error(
      "Incremental batches cannot assert full-snapshot completeness"
    );
  }
  if (
    envelope.records.length === 0 &&
    !(envelope.batch.mode === "full_snapshot" && envelope.batch.complete)
  ) {
    throw new Error("Only a complete full snapshot may contain zero records");
  }
  const now = options.now ?? new Date();
  if (
    new Date(envelope.batch.generatedAt).getTime() >
    now.getTime() + MAX_SOURCE_CLOCK_SKEW_MS
  ) {
    throw new Error("Batch generatedAt exceeds the allowed clock skew");
  }

  const preparedRecords: PreparedInventoryBatch["preparedRecords"] = [];
  const quarantinedRecords: QuarantinedInventoryRecord[] = [];

  envelope.records.forEach((raw, index) => {
    const parsed = inventoryRecordSchema.safeParse(raw);

    if (parsed.success) {
      if (
        new Date(parsed.data.sourceUpdatedAt).getTime() >
        new Date(envelope.batch.generatedAt).getTime() +
          MAX_SOURCE_CLOCK_SKEW_MS
      ) {
        quarantinedRecords.push({
          externalId: parsed.data.externalId,
          issues: [
            {
              message:
                "sourceUpdatedAt cannot be later than the batch timestamp",
              path: "sourceUpdatedAt",
            },
          ],
          raw,
          rowNumber: index + 1,
        });
        return;
      }

      preparedRecords.push({
        normalized: parsed.data,
        raw,
        rowNumber: index + 1,
      });
      return;
    }

    const externalId =
      typeof raw === "object" && raw !== null && "externalId" in raw
        ? String(raw.externalId)
        : undefined;

    quarantinedRecords.push({
      externalId,
      issues: parsed.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.join("."),
      })),
      raw,
      rowNumber: index + 1,
    });
  });

  const externalIdCounts = new Map<string, number>();
  const externalOfferIdCounts = new Map<string, number>();
  for (const prepared of preparedRecords) {
    const record = prepared.normalized;
    externalIdCounts.set(
      record.externalId,
      (externalIdCounts.get(record.externalId) ?? 0) + 1
    );
    const externalOfferId =
      record.operation === "upsert"
        ? record.offer.externalOfferId
        : record.externalOfferId;
    if (externalOfferId) {
      externalOfferIdCounts.set(
        externalOfferId,
        (externalOfferIdCounts.get(externalOfferId) ?? 0) + 1
      );
    }
  }

  const uniquePreparedRecords = preparedRecords.filter((prepared) => {
    const record = prepared.normalized;
    const externalOfferId =
      record.operation === "upsert"
        ? record.offer.externalOfferId
        : record.externalOfferId;
    const issues: QuarantinedInventoryRecord["issues"] = [];
    if ((externalIdCounts.get(record.externalId) ?? 0) > 1) {
      issues.push({
        message: "externalId must be unique within a batch",
        path: "externalId",
      });
    }
    if (
      externalOfferId &&
      (externalOfferIdCounts.get(externalOfferId) ?? 0) > 1
    ) {
      issues.push({
        message: "externalOfferId must be unique within a batch",
        path:
          record.operation === "upsert"
            ? "offer.externalOfferId"
            : "externalOfferId",
      });
    }
    if (issues.length === 0) {
      return true;
    }

    quarantinedRecords.push({
      externalId: record.externalId,
      issues,
      raw: prepared.raw,
      rowNumber: prepared.rowNumber,
    });
    return false;
  });

  return {
    batch: envelope.batch,
    preparedRecords: uniquePreparedRecords,
    quarantinedRecords,
    records: uniquePreparedRecords.map((prepared) => prepared.normalized),
    schemaVersion: envelope.schemaVersion,
  };
};
