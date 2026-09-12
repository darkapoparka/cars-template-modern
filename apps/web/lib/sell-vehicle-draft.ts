export const sellCategoryLabels = {
  bg: {
    car: "Автомобил",
    motorbike: "Мотоциклет",
    truck: "Камион",
    van: "Бус",
  },
  en: { car: "Car", motorbike: "Motorbike", truck: "Truck", van: "Van" },
} as const;

export type SellVehicleCategory = keyof typeof sellCategoryLabels.bg;
export interface SellVehicleDraft {
  readonly category: SellVehicleCategory;
  readonly make: string;
  readonly mileage: string;
  readonly model: string;
  readonly notes: string;
  readonly vin: string;
  readonly year: string;
}
export type SellVehicleQuery = Readonly<
  Record<string, string | string[] | undefined>
>;
export const vehicleYearMinimum = 1886;
export const vehicleYearMaximum = 2100;
export const vehicleMileageMaximum = 10_000_000;
const invalidVinCharacters = /[^A-HJ-NPR-Z0-9]/g;
export const normalizeVehicleVin = (value: string) =>
  value.toUpperCase().replace(invalidVinCharacters, "").slice(0, 17);
const completeVinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
const integerPattern = /^\d+$/;
export const isCompleteVehicleVin = (value: string) =>
  completeVinPattern.test(value);
const queryText = (query: SellVehicleQuery, key: string, limit = 80) => {
  const value = query[key];
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? ""))
    .trim()
    .slice(0, limit);
};
const boundedInteger = (value: string, minimum: number, maximum: number) => {
  if (!integerPattern.test(value)) {
    return "";
  }
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum
    ? String(number)
    : "";
};
// Keep unfinished numeric input when an in-progress drawer is dismissed.
// URL and handoff boundaries use parseSellVehicleDraft for validation.
export const readSellVehicleDraft = (
  query: SellVehicleQuery = {}
): SellVehicleDraft => {
  const category = queryText(query, "category");
  return {
    category: Object.hasOwn(sellCategoryLabels.bg, category)
      ? (category as SellVehicleCategory)
      : "car",
    vin: normalizeVehicleVin(queryText(query, "vin", 64)),
    make: queryText(query, "make"),
    model: queryText(query, "model"),
    year: queryText(query, "year"),
    mileage: queryText(query, "mileage"),
    notes: queryText(query, "notes", 500),
  };
};
export const parseSellVehicleDraft = (
  query: SellVehicleQuery = {}
): SellVehicleDraft => {
  const draft = readSellVehicleDraft(query);
  return {
    ...draft,
    year: boundedInteger(draft.year, vehicleYearMinimum, vehicleYearMaximum),
    mileage: boundedInteger(draft.mileage, 0, vehicleMileageMaximum),
  };
};

export const hasSellVehicleDetails = (draft: SellVehicleDraft) =>
  Boolean(
    draft.vin ||
      draft.make ||
      draft.model ||
      draft.year ||
      draft.mileage ||
      draft.notes
  );
export const serializeSellVehicleDraft = (draft: SellVehicleDraft): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(
    parseSellVehicleDraft({ ...draft })
  )) {
    if (value) {
      query.set(key, value);
    }
  }
  return query.toString();
};
