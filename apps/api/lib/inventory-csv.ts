import {
  INVENTORY_CSV_REQUIRED_COLUMNS,
  INVENTORY_CSV_COLUMNS as SHARED_INVENTORY_CSV_COLUMNS,
} from "@repo/marketplace/inventory-csv";

const REQUIRED_CSV_COLUMNS = INVENTORY_CSV_REQUIRED_COLUMNS;
export const INVENTORY_CSV_COLUMNS = SHARED_INVENTORY_CSV_COLUMNS;

export const INVENTORY_CSV_TEMPLATE_HEADER = INVENTORY_CSV_COLUMNS.join(",");

const CSV_COLUMN_SET = new Set<string>(INVENTORY_CSV_COLUMNS);
const INTEGER_PATTERN = /^-?(0|[1-9]\d*)$/;
const LEADING_BYTE_ORDER_MARK_PATTERN = /^\uFEFF/;

export const INVENTORY_CSV_BATCH_HEADERS = {
  complete: "x-automarket-batch-complete",
  generatedAt: "x-automarket-generated-at",
  id: "x-automarket-batch-id",
  mode: "x-automarket-batch-mode",
  sequence: "x-automarket-batch-sequence",
} as const;

export class InventoryCsvFormatError extends Error {}

export interface InventoryCsvBatchMetadata {
  complete: boolean;
  generatedAt: string;
  id: string;
  mode: "full_snapshot" | "incremental";
  sequence?: string;
}

export interface InventoryCsvImport {
  envelope: unknown;
  rawRecords: unknown[];
}

interface CsvParserState {
  closedQuote: boolean;
  field: string;
  inQuotes: boolean;
  row: string[];
  rows: string[][];
}

const finishCsvField = (state: CsvParserState) => {
  state.row.push(state.field);
  state.field = "";
  state.closedQuote = false;
};

const finishCsvRow = (state: CsvParserState) => {
  finishCsvField(state);
  if (!(state.row.length === 1 && state.row[0]?.trim() === "")) {
    state.rows.push(state.row);
  }
  state.row = [];
};

const skipLineFeedAfterCarriageReturn = (
  input: string,
  index: number,
  character: string
) => (character === "\r" && input[index + 1] === "\n" ? index + 1 : index);

const consumeQuotedCharacter = (
  state: CsvParserState,
  input: string,
  index: number
) => {
  const character = input[index];
  if (character !== '"') {
    state.field += character;
    return index;
  }
  if (input[index + 1] === '"') {
    state.field += '"';
    return index + 1;
  }

  state.inQuotes = false;
  state.closedQuote = true;
  return index;
};

const consumeAfterClosedQuote = (
  state: CsvParserState,
  input: string,
  index: number
) => {
  const character = input[index];
  if (character === ",") {
    finishCsvField(state);
    return index;
  }
  if (character === "\n" || character === "\r") {
    finishCsvRow(state);
    return skipLineFeedAfterCarriageReturn(input, index, character);
  }

  throw new InventoryCsvFormatError();
};

const consumeUnquotedCharacter = (
  state: CsvParserState,
  input: string,
  index: number
) => {
  const character = input[index];
  if (character === '"') {
    if (state.field.length > 0) {
      throw new InventoryCsvFormatError();
    }
    state.inQuotes = true;
    return index;
  }
  if (character === ",") {
    finishCsvField(state);
    return index;
  }
  if (character === "\n" || character === "\r") {
    finishCsvRow(state);
    return skipLineFeedAfterCarriageReturn(input, index, character);
  }

  state.field += character;
  return index;
};

const parseCsvRows = (input: string): string[][] => {
  const state: CsvParserState = {
    closedQuote: false,
    field: "",
    inQuotes: false,
    row: [],
    rows: [],
  };

  for (let index = 0; index < input.length; index += 1) {
    if (state.inQuotes) {
      index = consumeQuotedCharacter(state, input, index);
      continue;
    }
    if (state.closedQuote) {
      index = consumeAfterClosedQuote(state, input, index);
      continue;
    }
    index = consumeUnquotedCharacter(state, input, index);
  }

  if (state.inQuotes) {
    throw new InventoryCsvFormatError();
  }

  if (state.field.length > 0 || state.row.length > 0 || state.closedQuote) {
    finishCsvRow(state);
  }

  return state.rows;
};

const optionalValue = (value: string | undefined) => {
  const normalized = value?.trim() ?? "";
  return normalized ? normalized : undefined;
};

const integerOrOriginal = (value: string | undefined) => {
  const normalized = value?.trim() ?? "";
  if (!INTEGER_PATTERN.test(normalized)) {
    return normalized;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : normalized;
};

const listValue = (value: string | undefined) =>
  (value ?? "")
    .split("|")
    .map((entry) => entry.trim())
    .filter(Boolean);

const mapCsvMedia = (row: Record<string, string>) => {
  const mediaFields = [
    row.media_url,
    row.media_alt,
    row.media_rights_scope,
    row.media_rights_status,
    row.media_rights_expires_at,
    row.media_territory_country_codes,
  ];
  const hasMedia = mediaFields.some((value) => optionalValue(value));
  if (!hasMedia) {
    return [];
  }

  const mediaRightsExpiresAt = optionalValue(row.media_rights_expires_at);
  return [
    {
      alt: row.media_alt?.trim() ?? "",
      position: 0,
      rights: {
        ...(mediaRightsExpiresAt ? { expiresAt: mediaRightsExpiresAt } : {}),
        scope: row.media_rights_scope?.trim() ?? "",
        status: row.media_rights_status?.trim() ?? "",
        territoryCountryCodes: listValue(row.media_territory_country_codes),
      },
      url: row.media_url?.trim() ?? "",
    },
  ];
};

const mapCsvOffer = (
  row: Record<string, string>,
  externalOfferId: string | undefined
) => {
  const region = optionalValue(row.region);
  const stockNumber = optionalValue(row.stock_number);
  return {
    description: row.description?.trim() ?? "",
    destinationMarketCodes: listValue(row.destination_market_codes),
    externalOfferId: externalOfferId ?? "",
    media: mapCsvMedia(row),
    mileage: {
      unit: "km",
      value: integerOrOriginal(row.mileage_km),
    },
    nativePrice: {
      amountMinor: row.price_amount_minor?.trim() ?? "",
      currencyCode: row.price_currency_code?.trim() ?? "",
      exponent: integerOrOriginal(row.price_exponent),
    },
    physicalLocation: {
      city: row.city?.trim() ?? "",
      country: row.country?.trim() ?? "",
      countryCode: row.country_code?.trim() ?? "",
      ...(region ? { region } : {}),
    },
    status: row.status?.trim() ?? "",
    ...(stockNumber ? { stockNumber } : {}),
    taxTreatment: row.tax_treatment?.trim() ?? "",
    title: row.title?.trim() ?? "",
  };
};

const mapCsvVehicle = (row: Record<string, string>) => {
  const trim = optionalValue(row.trim);
  const vin = optionalValue(row.vin);
  const colorExterior = optionalValue(row.color_exterior);
  return {
    bodyType: row.body_type?.trim() ?? "",
    category: row.category?.trim() ?? "",
    ...(colorExterior ? { colorExterior } : {}),
    fuelType: row.fuel_type?.trim() ?? "",
    make: row.make?.trim() ?? "",
    model: row.model?.trim() ?? "",
    transmission: row.transmission?.trim() ?? "",
    ...(trim ? { trim } : {}),
    ...(vin ? { vin } : {}),
    year: integerOrOriginal(row.year),
  };
};

const mapCsvRow = (row: Record<string, string>): unknown => {
  const operation = row.operation?.trim() ?? "";
  const externalId = row.external_id?.trim() ?? "";
  const externalOfferId = optionalValue(row.external_offer_id);
  const sourceUpdatedAt = row.source_updated_at?.trim() ?? "";
  const sourceVersion = optionalValue(row.source_version);

  if (operation === "withdraw") {
    return {
      externalId,
      ...(externalOfferId ? { externalOfferId } : {}),
      operation,
      sourceUpdatedAt,
      ...(sourceVersion ? { sourceVersion } : {}),
    };
  }

  return {
    externalId,
    offer: mapCsvOffer(row, externalOfferId),
    operation,
    sourceUpdatedAt,
    ...(sourceVersion ? { sourceVersion } : {}),
    vehicle: mapCsvVehicle(row),
  };
};

export const getInventoryCsvBatchMetadata = (
  headers: Headers,
  idempotencyKey: string
): InventoryCsvBatchMetadata => {
  const generatedAt = headers
    .get(INVENTORY_CSV_BATCH_HEADERS.generatedAt)
    ?.trim();
  if (!generatedAt) {
    throw new InventoryCsvFormatError();
  }

  const modeHeader =
    headers.get(INVENTORY_CSV_BATCH_HEADERS.mode)?.trim() ?? "incremental";
  if (!(modeHeader === "incremental" || modeHeader === "full_snapshot")) {
    throw new InventoryCsvFormatError();
  }

  const completeHeader =
    headers.get(INVENTORY_CSV_BATCH_HEADERS.complete)?.trim() ?? "false";
  if (!(completeHeader === "true" || completeHeader === "false")) {
    throw new InventoryCsvFormatError();
  }

  const id =
    headers.get(INVENTORY_CSV_BATCH_HEADERS.id)?.trim() || idempotencyKey;
  const sequence = headers.get(INVENTORY_CSV_BATCH_HEADERS.sequence)?.trim();

  return {
    complete: completeHeader === "true",
    generatedAt,
    id,
    mode: modeHeader,
    ...(sequence ? { sequence } : {}),
  };
};

export const convertInventoryCsvToImport = (
  input: string,
  batch: InventoryCsvBatchMetadata
): InventoryCsvImport => {
  const rows = parseCsvRows(input.replace(LEADING_BYTE_ORDER_MARK_PATTERN, ""));
  const headerRow = rows[0];
  if (!headerRow) {
    throw new InventoryCsvFormatError();
  }

  const headers = headerRow.map((header) => header.trim().toLowerCase());
  if (
    headers.some((header) => !(header && CSV_COLUMN_SET.has(header))) ||
    new Set(headers).size !== headers.length ||
    REQUIRED_CSV_COLUMNS.some((column) => !headers.includes(column))
  ) {
    throw new InventoryCsvFormatError();
  }

  const dataRows = rows.slice(1);
  const records = dataRows.map((values) => {
    if (values.length !== headers.length) {
      throw new InventoryCsvFormatError();
    }

    return mapCsvRow(
      Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? ""])
      )
    );
  });

  return {
    envelope: {
      batch,
      records,
      schemaVersion: "automarket.inventory.v1",
    },
    rawRecords: dataRows.map((values, index) => ({
      format: "csv",
      headers,
      sourceRowNumber: index + 2,
      values,
    })),
  };
};

export const convertInventoryCsvToEnvelope = (
  input: string,
  batch: InventoryCsvBatchMetadata
): unknown => convertInventoryCsvToImport(input, batch).envelope;
