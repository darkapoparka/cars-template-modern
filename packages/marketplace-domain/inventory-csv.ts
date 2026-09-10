import { createHash } from "node:crypto";
import {
  type InventoryRecord,
  inventoryRecordSchema,
  MAX_SOURCE_CLOCK_SKEW_MS,
} from "./inventory-contract";

export const INVENTORY_CSV_TEMPLATE_ID = "automarket.inventory.csv.v1";
export const INVENTORY_CSV_MAX_BYTES = 10 * 1024 * 1024;
export const INVENTORY_CSV_MAX_ROWS = 10_000;
export const INVENTORY_CSV_MAX_COLUMNS = 200;
export const INVENTORY_CSV_MAX_CELL_BYTES = 64 * 1024;
export const INVENTORY_CSV_MAX_ROW_BYTES = 256 * 1024;

const BYTE_ORDER_MARK_PATTERN = /^\uFEFF/;
const DANGEROUS_SPREADSHEET_CELL_PATTERN = /^[\p{Cc}\p{Z}\s]*[=+\-@]/u;
const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;
const DECIMAL_PATTERN = /^(-?)(0|[1-9]\d*)(?:\.(\d+))?$/;
const INTEGER_PATTERN = /^-?(0|[1-9]\d*)$/;
const ISO_CODE_PATTERN = /^[A-Z]{2,3}$/;
const SHA_256_HEX_PATTERN = /^[a-f0-9]{64}$/;

export const INVENTORY_CSV_REQUIRED_COLUMNS = [
  "operation",
  "external_id",
  "source_updated_at",
  "category",
  "make",
  "model",
  "year",
  "body_type",
  "fuel_type",
  "transmission",
  "external_offer_id",
  "title",
  "description",
  "status",
  "mileage_km",
  "price_amount_minor",
  "price_currency_code",
  "price_exponent",
  "tax_treatment",
  "city",
  "country",
  "country_code",
  "destination_market_codes",
] as const;

export const INVENTORY_CSV_OPTIONAL_COLUMNS = [
  "source_version",
  "derivative",
  "trim",
  "vin",
  "color_exterior",
  "stock_number",
  "region",
  "media_url",
  "media_alt",
  "media_rights_scope",
  "media_rights_status",
  "media_rights_expires_at",
  "media_territory_country_codes",
] as const;

export const INVENTORY_CSV_COLUMNS = [
  ...INVENTORY_CSV_REQUIRED_COLUMNS,
  ...INVENTORY_CSV_OPTIONAL_COLUMNS,
] as const;

export type InventoryCsvCanonicalField = (typeof INVENTORY_CSV_COLUMNS)[number];
export type InventoryCsvDelimiter = "," | ";" | "\t";

export class InventoryCsvContractError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const normalizeInventoryCsvHeader = (value: string): string =>
  value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replaceAll(/[\s-]+/g, "_")
    .replaceAll(/_+/g, "_");

const exactAliases: Readonly<Record<string, InventoryCsvCanonicalField>> = {
  action: "operation",
  externalid: "external_id",
  id: "external_id",
  manufacturer: "make",
  price_currency: "price_currency_code",
  updated_at: "source_updated_at",
  vehicle_model: "model",
};

const piiHeaderPattern =
  /(?:customer|buyer|owner|contact|email|e_mail|phone|telephone|mobile|first_name|last_name|national_id)/i;

const decodeInput = (input: string | Uint8Array): string => {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  if (bytes.byteLength > INVENTORY_CSV_MAX_BYTES) {
    throw new InventoryCsvContractError(
      "file_too_large",
      "CSV file exceeds 10 MiB"
    );
  }
  if (bytes.includes(0)) {
    throw new InventoryCsvContractError(
      "binary_content",
      "CSV contains binary or NUL data"
    );
  }
  if (typeof input === "string") {
    return input.replace(BYTE_ORDER_MARK_PATTERN, "");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true })
      .decode(bytes)
      .replace(BYTE_ORDER_MARK_PATTERN, "");
  } catch {
    throw new InventoryCsvContractError(
      "invalid_encoding",
      "CSV must be valid UTF-8"
    );
  }
};

const firstLogicalRecord = (input: string): string => {
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"') {
      if (quoted && input[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && (character === "\r" || character === "\n")) {
      return input.slice(0, index);
    }
  }
  return input;
};

const delimiterCount = (record: string, delimiter: InventoryCsvDelimiter) => {
  let count = 0;
  let quoted = false;
  for (let index = 0; index < record.length; index += 1) {
    const character = record[index];
    if (character === '"') {
      if (quoted && record[index + 1] === '"') {
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === delimiter) {
      count += 1;
    }
  }
  return count;
};

export const detectInventoryCsvDelimiter = (
  input: string
): InventoryCsvDelimiter => {
  const record = firstLogicalRecord(input);
  const counts = ([",", ";", "\t"] as const).map((delimiter) => ({
    count: delimiterCount(record, delimiter),
    delimiter,
  }));
  const max = Math.max(...counts.map(({ count }) => count));
  const winners = counts.filter(({ count }) => count === max);
  if (max === 0 || winners.length !== 1) {
    throw new InventoryCsvContractError(
      "ambiguous_delimiter",
      "CSV delimiter requires explicit user selection"
    );
  }
  return winners[0]?.delimiter ?? ",";
};

interface InventoryCsvParserState {
  closedQuote: boolean;
  field: string;
  quoted: boolean;
  row: string[];
  rows: string[][];
}

const finishCsvField = (state: InventoryCsvParserState): void => {
  if (
    new TextEncoder().encode(state.field).byteLength >
    INVENTORY_CSV_MAX_CELL_BYTES
  ) {
    throw new InventoryCsvContractError(
      "cell_too_large",
      "CSV cell exceeds 64 KiB"
    );
  }
  state.row.push(state.field);
  state.field = "";
  state.closedQuote = false;
};

const finishCsvRow = (state: InventoryCsvParserState): void => {
  finishCsvField(state);
  if (state.row.length > INVENTORY_CSV_MAX_COLUMNS) {
    throw new InventoryCsvContractError(
      "too_many_columns",
      "CSV exceeds 200 columns"
    );
  }
  const rowBytes = state.row.reduce(
    (total, value) => total + new TextEncoder().encode(value).byteLength,
    0
  );
  if (rowBytes > INVENTORY_CSV_MAX_ROW_BYTES) {
    throw new InventoryCsvContractError(
      "row_too_large",
      "CSV row exceeds 256 KiB"
    );
  }
  if (!(state.row.length === 1 && state.row[0]?.trim() === "")) {
    state.rows.push(state.row);
  }
  state.row = [];
};

const consumeQuotedCharacter = (
  state: InventoryCsvParserState,
  input: string,
  index: number
): number => {
  const character = input[index] ?? "";
  if (character !== '"') {
    state.field += character;
    return index;
  }
  if (input[index + 1] === '"') {
    state.field += '"';
    return index + 1;
  }
  state.quoted = false;
  state.closedQuote = true;
  return index;
};

const consumeClosedQuoteCharacter = (
  state: InventoryCsvParserState,
  input: string,
  delimiter: InventoryCsvDelimiter,
  index: number
): number => {
  const character = input[index] ?? "";
  if (character === delimiter) {
    finishCsvField(state);
    return index;
  }
  if (character === "\r" || character === "\n") {
    finishCsvRow(state);
    return character === "\r" && input[index + 1] === "\n" ? index + 1 : index;
  }
  throw new InventoryCsvContractError(
    "malformed_quoting",
    "Unexpected character after a quoted CSV field"
  );
};

const consumeUnquotedCharacter = (
  state: InventoryCsvParserState,
  input: string,
  delimiter: InventoryCsvDelimiter,
  index: number
): number => {
  const character = input[index] ?? "";
  if (character === '"') {
    if (state.field.length > 0) {
      throw new InventoryCsvContractError(
        "malformed_quoting",
        "Quote must start at the beginning of a CSV field"
      );
    }
    state.quoted = true;
    return index;
  }
  if (character === delimiter) {
    finishCsvField(state);
    return index;
  }
  if (character === "\r" || character === "\n") {
    finishCsvRow(state);
    return character === "\r" && input[index + 1] === "\n" ? index + 1 : index;
  }
  state.field += character;
  return index;
};

const parseRows = (
  input: string,
  delimiter: InventoryCsvDelimiter
): string[][] => {
  const state: InventoryCsvParserState = {
    closedQuote: false,
    field: "",
    quoted: false,
    row: [],
    rows: [],
  };

  for (let index = 0; index < input.length; index += 1) {
    if (state.quoted) {
      index = consumeQuotedCharacter(state, input, index);
      continue;
    }
    if (state.closedQuote) {
      index = consumeClosedQuoteCharacter(state, input, delimiter, index);
      continue;
    }
    index = consumeUnquotedCharacter(state, input, delimiter, index);
  }
  if (state.quoted) {
    throw new InventoryCsvContractError(
      "malformed_quoting",
      "CSV contains an unclosed quoted field"
    );
  }
  if (state.field.length > 0 || state.row.length > 0 || state.closedQuote) {
    finishCsvRow(state);
  }
  if (state.rows.length - 1 > INVENTORY_CSV_MAX_ROWS) {
    throw new InventoryCsvContractError(
      "too_many_rows",
      "CSV exceeds 10,000 data rows"
    );
  }
  return state.rows;
};

export type InventoryCsvTransform =
  | { readonly type: "trim" }
  | {
      readonly aliases: Readonly<Record<string, string>>;
      readonly type: "enum_alias";
    }
  | { readonly type: "integer" }
  | { readonly exponent: number; readonly type: "decimal_to_minor" }
  | { readonly type: "iso_code" }
  | { readonly format: "iso"; readonly type: "date" }
  | { readonly delimiter: string; readonly type: "list_split" }
  | { readonly type: "constant"; readonly value: string }
  | { readonly sourceField: string; readonly type: "copy_from_field" };

export interface InventoryCsvFieldMapping {
  readonly canonicalField: InventoryCsvCanonicalField;
  readonly sourceHeader: string;
  readonly transform?: InventoryCsvTransform;
}

export interface InventoryCsvAnalysis {
  readonly autoMappings: readonly InventoryCsvFieldMapping[];
  readonly blockedPiiHeaders: readonly string[];
  readonly delimiter: InventoryCsvDelimiter;
  readonly headerFingerprint: string;
  readonly headers: readonly string[];
  readonly missingRequiredFields: readonly InventoryCsvCanonicalField[];
  readonly rows: readonly Readonly<Record<string, string>>[];
}

const automaticInventoryCsvTransform = (
  canonicalField: InventoryCsvCanonicalField
): InventoryCsvTransform | undefined =>
  canonicalField === "source_updated_at" ||
  canonicalField === "media_rights_expires_at"
    ? { format: "iso", type: "date" }
    : undefined;

export const analyzeInventoryCsv = (
  input: string | Uint8Array,
  selectedDelimiter?: InventoryCsvDelimiter
): InventoryCsvAnalysis => {
  const text = decodeInput(input);
  const delimiter = selectedDelimiter ?? detectInventoryCsvDelimiter(text);
  const parsed = parseRows(text, delimiter);
  const sourceHeaders = parsed[0];
  if (!sourceHeaders) {
    throw new InventoryCsvContractError("empty_file", "CSV is empty");
  }
  const headers = sourceHeaders.map(normalizeInventoryCsvHeader);
  const collisions = headers.filter(
    (header, index) => headers.indexOf(header) !== index
  );
  if (collisions.length > 0 || headers.some((header) => !header)) {
    throw new InventoryCsvContractError(
      "header_collision",
      "CSV headers collide after normalization"
    );
  }
  const blockedPiiHeaders = headers.filter((header) =>
    piiHeaderPattern.test(header)
  );
  const blockedPiiHeaderSet = new Set(blockedPiiHeaders);
  const canonicalSet = new Set<string>(INVENTORY_CSV_COLUMNS);
  const autoMappings = headers.flatMap((header) => {
    const canonicalField = canonicalSet.has(header)
      ? (header as InventoryCsvCanonicalField)
      : exactAliases[header];
    if (!canonicalField) {
      return [];
    }
    const transform = automaticInventoryCsvTransform(canonicalField);
    return [
      {
        canonicalField,
        sourceHeader: header,
        ...(transform ? { transform } : {}),
      },
    ];
  });
  const mapped = new Set(
    autoMappings.map(({ canonicalField }) => canonicalField)
  );
  const missingRequiredFields = INVENTORY_CSV_REQUIRED_COLUMNS.filter(
    (field) => !mapped.has(field)
  );
  const dataRows = parsed.slice(1).map((values) => {
    if (values.length !== headers.length) {
      throw new InventoryCsvContractError(
        "column_count_mismatch",
        "CSV row column count does not match the header"
      );
    }
    return Object.fromEntries(
      headers.flatMap((header, index) =>
        blockedPiiHeaderSet.has(header) ? [] : [[header, values[index] ?? ""]]
      )
    );
  });
  return {
    autoMappings,
    blockedPiiHeaders,
    delimiter,
    headerFingerprint: createHash("sha256")
      .update(headers.join("\u001f"))
      .digest("hex"),
    headers,
    missingRequiredFields,
    rows: dataRows,
  };
};

export const decimalStringToMinorUnits = (
  value: string,
  exponent: number
): string => {
  if (!Number.isInteger(exponent) || exponent < 0 || exponent > 6) {
    throw new InventoryCsvContractError(
      "invalid_exponent",
      "Currency exponent is outside the allowed range"
    );
  }
  const match = DECIMAL_PATTERN.exec(value.trim());
  if (!match) {
    throw new InventoryCsvContractError(
      "invalid_decimal",
      "Money must be an exact decimal string"
    );
  }
  const fraction = match[3] ?? "";
  if (fraction.length > exponent) {
    throw new InventoryCsvContractError(
      "ambiguous_decimal",
      "Money has more fractional digits than its currency exponent"
    );
  }
  const units = BigInt(match[2] ?? "0") * 10n ** BigInt(exponent);
  const fractionalUnits = BigInt(fraction.padEnd(exponent, "0") || "0");
  const signed = units + fractionalUnits;
  return `${match[1] === "-" ? -signed : signed}`;
};

const transformDateValue = (
  raw: string,
  sourceHeader: string,
  format: "iso"
): string => {
  const normalized = raw.trim();
  if (!normalized) {
    return "";
  }
  const dateOnly = DATE_ONLY_PATTERN.exec(normalized);
  const dateTime = DATE_TIME_PATTERN.exec(normalized);
  const parts = dateOnly ?? dateTime;
  const year = Number(parts?.[1]);
  const month = Number(parts?.[2]);
  const day = Number(parts?.[3]);
  const validCalendarDate =
    parts !== null &&
    new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) ===
      `${parts[1]}-${parts[2]}-${parts[3]}`;
  const validTime =
    dateTime === null ||
    (Number(dateTime[4]) <= 23 &&
      Number(dateTime[5]) <= 59 &&
      Number(dateTime[6]) <= 59);
  const date = new Date(dateOnly ? `${normalized}T00:00:00.000Z` : normalized);
  if (
    format !== "iso" ||
    !validCalendarDate ||
    !validTime ||
    Number.isNaN(date.getTime())
  ) {
    throw new InventoryCsvContractError(
      "invalid_date",
      `${sourceHeader} must be an explicit ISO date with a timezone`
    );
  }
  return date.toISOString();
};

const transformValue = (
  row: Readonly<Record<string, string>>,
  sourceHeader: string,
  transform?: InventoryCsvTransform
): string | readonly string[] => {
  const raw = row[sourceHeader] ?? "";
  if (!transform) {
    return raw;
  }
  switch (transform.type) {
    case "trim":
      return raw.trim();
    case "integer": {
      const normalized = raw.trim();
      if (!INTEGER_PATTERN.test(normalized)) {
        throw new InventoryCsvContractError(
          "invalid_integer",
          `${sourceHeader} must be an integer`
        );
      }
      return normalized;
    }
    case "decimal_to_minor":
      return decimalStringToMinorUnits(raw, transform.exponent);
    case "iso_code": {
      const normalized = raw.trim().toUpperCase();
      if (!ISO_CODE_PATTERN.test(normalized)) {
        throw new InventoryCsvContractError(
          "invalid_iso_code",
          `${sourceHeader} must be an explicit ISO code`
        );
      }
      return normalized;
    }
    case "enum_alias": {
      const normalized = raw.trim().toLowerCase();
      const mapped = transform.aliases[normalized];
      if (!mapped) {
        throw new InventoryCsvContractError(
          "unknown_enum_alias",
          `${sourceHeader} has no confirmed enum alias`
        );
      }
      return mapped;
    }
    case "date": {
      return transformDateValue(raw, sourceHeader, transform.format);
    }
    case "list_split":
      return raw
        .split(transform.delimiter)
        .map((entry) => entry.trim())
        .filter(Boolean);
    case "constant":
      return transform.value;
    case "copy_from_field":
      return row[normalizeInventoryCsvHeader(transform.sourceField)] ?? "";
    default:
      throw new InventoryCsvContractError(
        "unsupported_transform",
        "CSV mapping transform is not supported"
      );
  }
};

export const applyInventoryCsvMapping = (
  rows: readonly Readonly<Record<string, string>>[],
  mappings: readonly InventoryCsvFieldMapping[],
  fixedUploadTime: Date
): readonly Readonly<Record<string, string | readonly string[]>>[] => {
  assertUniqueInventoryCsvMappingTargets(mappings);
  return rows.map((row) => {
    const mapped = Object.fromEntries(
      mappings.map((mapping) => [
        mapping.canonicalField,
        transformValue(row, mapping.sourceHeader, mapping.transform),
      ])
    ) as Record<string, string | readonly string[]>;
    if (!String(mapped.external_id ?? "").trim()) {
      throw new InventoryCsvContractError(
        "external_id_required",
        "external_id may not derive from row position"
      );
    }
    if (!String(mapped.source_updated_at ?? "").trim()) {
      mapped.source_updated_at = fixedUploadTime.toISOString();
    }
    return mapped;
  });
};

const assertUniqueInventoryCsvMappingTargets = (
  mappings: readonly InventoryCsvFieldMapping[]
): void => {
  const targets = mappings.map(({ canonicalField }) => canonicalField);
  if (new Set(targets).size !== targets.length) {
    throw new InventoryCsvContractError(
      "duplicate_mapping_target",
      "Each canonical field may be mapped only once"
    );
  }
};

export const createInventoryCsvMappingVersion = (input: {
  readonly delimiter: InventoryCsvDelimiter;
  readonly headerFingerprint: string;
  readonly mappings: readonly InventoryCsvFieldMapping[];
  readonly templateId?: string;
}) => {
  assertUniqueInventoryCsvMappingTargets(input.mappings);
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(canonicalize);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, entry]) => [key, canonicalize(entry)])
      );
    }
    return value;
  };
  const seed = {
    delimiter: input.delimiter,
    headerFingerprint: input.headerFingerprint,
    mappings: [...input.mappings].sort((left, right) =>
      left.canonicalField.localeCompare(right.canonicalField)
    ),
    templateId: input.templateId ?? INVENTORY_CSV_TEMPLATE_ID,
  };
  const canonical = canonicalize(seed) as typeof seed;
  const mappingHash = createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
  return { ...canonical, mappingHash };
};

export const escapeInventoryIssueExportCell = (value: string): string =>
  DANGEROUS_SPREADSHEET_CELL_PATTERN.test(value) ? `'${value}` : value;

export const INVENTORY_CSV_TEMPLATE_HEADER = INVENTORY_CSV_COLUMNS.join(",");

export interface InventoryCsvMappingDefinition {
  readonly delimiter: InventoryCsvDelimiter;
  readonly headerFingerprint: string;
  readonly mappingHash: string;
  readonly mappings: readonly InventoryCsvFieldMapping[];
  readonly templateId: string;
}

export interface RegeneratedInventoryCsvSnapshot {
  readonly artifactHash: string;
  readonly blockedPiiHeaders: readonly string[];
  readonly fixedUploadTime: string;
  readonly headerFingerprint: string;
  readonly mappingHash: string;
  readonly quarantinedRows: readonly {
    readonly issues: readonly {
      readonly message: string;
      readonly path: string;
    }[];
    readonly sourceRowNumber: number;
  }[];
  readonly sourceGeneratedAt: string;
  readonly validRows: readonly {
    readonly normalizedDigest: string;
    readonly record: InventoryRecord;
    readonly sourceRowNumber: number;
  }[];
}

declare const trustedRegeneratedInventoryCsvSnapshotBrand: unique symbol;

export interface TrustedRegeneratedInventoryCsvSnapshot
  extends RegeneratedInventoryCsvSnapshot {
  readonly [trustedRegeneratedInventoryCsvSnapshotBrand]: true;
}

const trustedRegeneratedInventoryCsvSnapshots = new WeakSet<object>();

const deepFreezeInventoryCsvValue = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      deepFreezeInventoryCsvValue(entry);
    }
    Object.freeze(value);
  }
  return value;
};

export const consumeTrustedRegeneratedInventoryCsvSnapshot = (
  snapshot: TrustedRegeneratedInventoryCsvSnapshot
): RegeneratedInventoryCsvSnapshot => {
  if (!trustedRegeneratedInventoryCsvSnapshots.delete(snapshot)) {
    throw new InventoryCsvContractError(
      "untrusted_regenerated_snapshot",
      "Regenerated CSV snapshot is not trusted or was already consumed"
    );
  }
  return snapshot;
};

type MappedInventoryCsvRow = Readonly<
  Record<string, string | readonly string[]>
>;

const scalarValue = (
  row: MappedInventoryCsvRow,
  field: InventoryCsvCanonicalField
): string => {
  const value = row[field];
  return Array.isArray(value) ? value.join("|") : String(value ?? "");
};

const optionalScalarValue = (
  row: MappedInventoryCsvRow,
  field: InventoryCsvCanonicalField
) => {
  const value = scalarValue(row, field).trim();
  return value || undefined;
};

const integerValue = (
  row: MappedInventoryCsvRow,
  field: InventoryCsvCanonicalField
) => {
  const value = scalarValue(row, field).trim();
  if (!INTEGER_PATTERN.test(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
};

const listValue = (
  row: MappedInventoryCsvRow,
  field: InventoryCsvCanonicalField
): readonly string[] => {
  const value = row[field];
  return (Array.isArray(value) ? value : String(value ?? "").split("|"))
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const convertInventoryCsvMappedRowToRecord = (
  row: MappedInventoryCsvRow
): unknown => {
  const operation = scalarValue(row, "operation").trim();
  const externalId = scalarValue(row, "external_id").trim();
  const externalOfferId = optionalScalarValue(row, "external_offer_id");
  const sourceUpdatedAt = scalarValue(row, "source_updated_at").trim();
  const sourceVersion = optionalScalarValue(row, "source_version");
  if (operation === "withdraw") {
    return {
      externalId,
      ...(externalOfferId ? { externalOfferId } : {}),
      operation,
      sourceUpdatedAt,
      ...(sourceVersion ? { sourceVersion } : {}),
    };
  }

  const mediaUrl = optionalScalarValue(row, "media_url");
  const region = optionalScalarValue(row, "region");
  const stockNumber = optionalScalarValue(row, "stock_number");
  const derivative = optionalScalarValue(row, "derivative");
  const trim = optionalScalarValue(row, "trim");
  const vin = optionalScalarValue(row, "vin");
  const colorExterior = optionalScalarValue(row, "color_exterior");
  const mediaRightsExpiresAt = optionalScalarValue(
    row,
    "media_rights_expires_at"
  );
  const media = mediaUrl
    ? [
        {
          alt: scalarValue(row, "media_alt").trim(),
          position: 0,
          rights: {
            ...(mediaRightsExpiresAt
              ? { expiresAt: mediaRightsExpiresAt }
              : {}),
            scope: scalarValue(row, "media_rights_scope").trim(),
            status: scalarValue(row, "media_rights_status").trim(),
            territoryCountryCodes: listValue(
              row,
              "media_territory_country_codes"
            ),
          },
          url: mediaUrl,
        },
      ]
    : [];

  return {
    externalId,
    offer: {
      description: scalarValue(row, "description").trim(),
      destinationMarketCodes: listValue(row, "destination_market_codes"),
      externalOfferId: externalOfferId ?? "",
      media,
      mileage: { unit: "km", value: integerValue(row, "mileage_km") },
      nativePrice: {
        amountMinor: scalarValue(row, "price_amount_minor").trim(),
        currencyCode: scalarValue(row, "price_currency_code").trim(),
        exponent: integerValue(row, "price_exponent"),
      },
      physicalLocation: {
        city: scalarValue(row, "city").trim(),
        country: scalarValue(row, "country").trim(),
        countryCode: scalarValue(row, "country_code").trim(),
        ...(region ? { region } : {}),
      },
      status: scalarValue(row, "status").trim(),
      ...(stockNumber ? { stockNumber } : {}),
      taxTreatment: scalarValue(row, "tax_treatment").trim(),
      title: scalarValue(row, "title").trim(),
    },
    operation,
    sourceUpdatedAt,
    ...(sourceVersion ? { sourceVersion } : {}),
    vehicle: {
      bodyType: scalarValue(row, "body_type").trim(),
      category: scalarValue(row, "category").trim(),
      ...(colorExterior ? { colorExterior } : {}),
      ...(derivative ? { derivative } : {}),
      fuelType: scalarValue(row, "fuel_type").trim(),
      make: scalarValue(row, "make").trim(),
      model: scalarValue(row, "model").trim(),
      transmission: scalarValue(row, "transmission").trim(),
      ...(trim ? { trim } : {}),
      ...(vin ? { vin } : {}),
      year: integerValue(row, "year"),
    },
  };
};

export const parseInventoryCsvMappingDefinition = (
  input: unknown
): InventoryCsvMappingDefinition => {
  if (!input || typeof input !== "object") {
    throw new InventoryCsvContractError(
      "invalid_mapping_version",
      "CSV mapping version is invalid"
    );
  }
  const candidate = input as Record<string, unknown>;
  const delimiter = candidate.delimiter;
  const mappings = candidate.mappings;
  if (
    !(delimiter === "," || delimiter === ";" || delimiter === "\t") ||
    typeof candidate.headerFingerprint !== "string" ||
    !SHA_256_HEX_PATTERN.test(candidate.headerFingerprint) ||
    typeof candidate.mappingHash !== "string" ||
    !SHA_256_HEX_PATTERN.test(candidate.mappingHash) ||
    typeof candidate.templateId !== "string" ||
    !Array.isArray(mappings)
  ) {
    throw new InventoryCsvContractError(
      "invalid_mapping_version",
      "CSV mapping version is invalid"
    );
  }
  const canonicalFields = new Set<string>(INVENTORY_CSV_COLUMNS);
  const typedMappings = mappings.map((mapping) => {
    if (
      !mapping ||
      typeof mapping !== "object" ||
      typeof mapping.canonicalField !== "string" ||
      !canonicalFields.has(mapping.canonicalField) ||
      typeof mapping.sourceHeader !== "string"
    ) {
      throw new InventoryCsvContractError(
        "invalid_mapping_version",
        "CSV mapping version is invalid"
      );
    }
    return mapping as unknown as InventoryCsvFieldMapping;
  });
  const canonical = createInventoryCsvMappingVersion({
    delimiter,
    headerFingerprint: candidate.headerFingerprint,
    mappings: typedMappings,
    templateId: candidate.templateId,
  });
  if (canonical.mappingHash !== candidate.mappingHash) {
    throw new InventoryCsvContractError(
      "mapping_hash_mismatch",
      "CSV mapping version hash does not match its canonical definition"
    );
  }
  return canonical;
};

const stableInventoryCsvJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableInventoryCsvJson).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${stableInventoryCsvJson(record[key])}`
    )
    .join(",")}}`;
};

export const buildInventoryCsvNormalizedDigest = (
  records: readonly InventoryRecord[]
): string =>
  createHash("sha256").update(stableInventoryCsvJson(records)).digest("hex");

export const regenerateInventoryCsvSnapshot = (input: {
  readonly artifact: string | Uint8Array;
  readonly artifactHash: string;
  readonly fixedUploadTime: Date;
  readonly mapping: InventoryCsvMappingDefinition;
  readonly sourceGeneratedAt: Date;
}): TrustedRegeneratedInventoryCsvSnapshot => {
  const actualArtifactHash = createHash("sha256")
    .update(input.artifact)
    .digest("hex");
  if (
    !SHA_256_HEX_PATTERN.test(input.artifactHash) ||
    actualArtifactHash !== input.artifactHash ||
    Number.isNaN(input.fixedUploadTime.getTime()) ||
    Number.isNaN(input.sourceGeneratedAt.getTime())
  ) {
    throw new InventoryCsvContractError(
      "artifact_receipt_mismatch",
      "CSV artifact bytes or timestamps do not match verified evidence"
    );
  }
  const analysis = analyzeInventoryCsv(input.artifact, input.mapping.delimiter);
  if (
    analysis.headerFingerprint !== input.mapping.headerFingerprint ||
    analysis.missingRequiredFields.length > 0
  ) {
    throw new InventoryCsvContractError(
      "artifact_mapping_mismatch",
      "CSV artifact does not match the current mapping"
    );
  }

  const candidates: Array<{
    record: InventoryRecord;
    sourceRowNumber: number;
  }> = [];
  const quarantinedRows: Array<{
    issues: Array<{ message: string; path: string }>;
    sourceRowNumber: number;
  }> = [];
  analysis.rows.forEach((row, index) => {
    const sourceRowNumber = index + 2;
    try {
      const mapped = applyInventoryCsvMapping(
        [row],
        input.mapping.mappings,
        input.fixedUploadTime
      )[0];
      const parsed = inventoryRecordSchema.safeParse(
        convertInventoryCsvMappedRowToRecord(mapped ?? {})
      );
      if (!parsed.success) {
        quarantinedRows.push({
          issues: parsed.error.issues.map((issue) => ({
            message: issue.message,
            path: issue.path.join("."),
          })),
          sourceRowNumber,
        });
        return;
      }
      if (
        new Date(parsed.data.sourceUpdatedAt).getTime() >
        input.sourceGeneratedAt.getTime() + MAX_SOURCE_CLOCK_SKEW_MS
      ) {
        quarantinedRows.push({
          issues: [
            {
              message:
                "sourceUpdatedAt cannot be later than the batch timestamp",
              path: "sourceUpdatedAt",
            },
          ],
          sourceRowNumber,
        });
        return;
      }
      candidates.push({ record: parsed.data, sourceRowNumber });
    } catch (error) {
      quarantinedRows.push({
        issues: [
          {
            message:
              error instanceof InventoryCsvContractError
                ? error.message
                : "CSV row could not be normalized",
            path: "row",
          },
        ],
        sourceRowNumber,
      });
    }
  });

  const externalIds = new Map<string, number>();
  const externalOfferIds = new Map<string, number>();
  for (const { record } of candidates) {
    externalIds.set(
      record.externalId,
      (externalIds.get(record.externalId) ?? 0) + 1
    );
    const offerId =
      record.operation === "upsert"
        ? record.offer.externalOfferId
        : record.externalOfferId;
    if (offerId) {
      externalOfferIds.set(offerId, (externalOfferIds.get(offerId) ?? 0) + 1);
    }
  }
  const validRows = candidates.flatMap(({ record, sourceRowNumber }) => {
    const offerId =
      record.operation === "upsert"
        ? record.offer.externalOfferId
        : record.externalOfferId;
    const issues: Array<{ message: string; path: string }> = [];
    if ((externalIds.get(record.externalId) ?? 0) > 1) {
      issues.push({
        message: "externalId must be unique within a batch",
        path: "externalId",
      });
    }
    if (offerId && (externalOfferIds.get(offerId) ?? 0) > 1) {
      issues.push({
        message: "externalOfferId must be unique within a batch",
        path:
          record.operation === "upsert"
            ? "offer.externalOfferId"
            : "externalOfferId",
      });
    }
    if (issues.length > 0) {
      quarantinedRows.push({ issues, sourceRowNumber });
      return [];
    }
    return [
      {
        normalizedDigest: buildInventoryCsvNormalizedDigest([record]),
        record,
        sourceRowNumber,
      },
    ];
  });

  const snapshot = deepFreezeInventoryCsvValue({
    artifactHash: input.artifactHash,
    blockedPiiHeaders: analysis.blockedPiiHeaders,
    fixedUploadTime: input.fixedUploadTime.toISOString(),
    headerFingerprint: analysis.headerFingerprint,
    mappingHash: input.mapping.mappingHash,
    quarantinedRows: quarantinedRows.sort(
      (left, right) => left.sourceRowNumber - right.sourceRowNumber
    ),
    sourceGeneratedAt: input.sourceGeneratedAt.toISOString(),
    validRows,
  }) as unknown as TrustedRegeneratedInventoryCsvSnapshot;
  trustedRegeneratedInventoryCsvSnapshots.add(snapshot);
  return snapshot;
};
