import {
  buildMarketplaceSearchHref,
  buildVehicleTaxonomyOptions,
  curatedVehicleTaxonomy,
  type MarketplaceSearchParams,
  marketplaceSearchSchema,
  type VehicleCategory,
} from "@repo/marketplace";
import { z } from "zod";

export const ASSISTED_SEARCH_PROMPT_VERSION =
  "natural-language-search.deterministic.v1.2026-07-26";
export const ASSISTED_SEARCH_TRIAL_LIMIT_PER_MONTH = 10;

const requestBasePathPattern = /^\/(?!\/)[a-zA-Z0-9/_-]*$/;

export const assistedSearchRequestSchema = z
  .object({
    basePath: z.string().trim().min(1).max(200).regex(requestBasePathPattern),
    category: z.enum(["car", "truck", "motorbike", "van", "lease"]),
    locale: z.string().trim().min(2).max(10),
    query: z.string().trim().min(2).max(500),
  })
  .strict();

const assistedFilterKeys = [
  "body",
  "currency",
  "fuel",
  "make",
  "mileageMax",
  "model",
  "priceMax",
  "priceMin",
  "seller",
  "sort",
  "transmission",
  "yearMax",
  "yearMin",
] as const satisfies readonly (keyof MarketplaceSearchParams)[];

const assistedFiltersSchema = marketplaceSearchSchema.transform((filters) =>
  Object.fromEntries(
    assistedFilterKeys.flatMap((key) =>
      filters[key] === undefined ? [] : [[key, filters[key]]]
    )
  )
);

export const assistedSearchChipSchema = z
  .object({
    id: z.string(),
    keys: z.array(z.enum(assistedFilterKeys)).min(1),
    label: z.string(),
  })
  .strict();

export const assistedSearchResponseSchema = z
  .object({
    ambiguities: z.array(z.string()),
    chips: z.array(assistedSearchChipSchema),
    execution: z.literal("canonical-url"),
    filters: z.record(z.string(), z.unknown()),
    href: z.string(),
    mode: z.literal("deterministic-fallback"),
    promptVersion: z.literal(ASSISTED_SEARCH_PROMPT_VERSION),
    usagePolicy: z
      .object({
        deterministicUsesCredits: z.literal(false),
        providerTrialLimitPerMonth: z.number().int(),
      })
      .strict(),
  })
  .strict();

export type AssistedSearchResponse = z.infer<
  typeof assistedSearchResponseSchema
>;
export type AssistedSearchChip = z.infer<typeof assistedSearchChipSchema>;

type SearchCandidate = Partial<MarketplaceSearchParams>;

const stripControlCharacters = (value: string) =>
  Array.from(value, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f || codePoint === 0x7f ? " " : character;
  }).join("");

const normalizeQuery = (query: string) =>
  stripControlCharacters(query.normalize("NFKC"))
    .replaceAll(/[<>]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();

const escapeRegex = (value: string) =>
  value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseNumber = (rawValue: string, thousandsSuffix?: string) => {
  const normalized = rawValue.replaceAll(/\s/g, "");
  if (thousandsSuffix) {
    const decimal = Number.parseFloat(normalized.replace(",", "."));
    return Number.isFinite(decimal) ? Math.round(decimal * 1000) : undefined;
  }
  const digits = normalized.replaceAll(/[.,]/g, "");
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const findNumber = (query: string, pattern: RegExp): number | undefined => {
  const match = pattern.exec(query);
  return match?.[1] ? parseNumber(match[1], match[2]) : undefined;
};

const findYear = (query: string, pattern: RegExp) => {
  const match = pattern.exec(query);
  const parsed = match?.[1] ? Number.parseInt(match[1], 10) : undefined;
  return parsed && parsed >= 1886 && parsed <= 2100 ? parsed : undefined;
};

const priceMaximumPattern =
  /(?:под|до|максимум|under|up to|max(?:imum)?)\s*(\d+(?:[.,]\d+)?(?:\s?\d{3})*)\s*(хил(?:яди)?|k)?\s*(?:лв\.?|bgn|eur|€)/iu;
const priceMinimumPattern =
  /(?:над|минимум|over|at least|min(?:imum)?)\s*(\d+(?:[.,]\d+)?(?:\s?\d{3})*)\s*(хил(?:яди)?|k)?\s*(?:лв\.?|bgn|eur|€)/iu;
const mileageMaximumPattern =
  /(?:под|до|максимум|under|up to|max(?:imum)?)\s*(\d+(?:[.,]\d+)?(?:\s?\d{3})*)\s*(хил(?:яди)?|k)?\s*(?:км|km)\b/iu;
const afterYearPattern = /(?:след|after)\s*((?:19|20)\d{2})\b/iu;
const fromYearPattern = /(?:от|since|from)\s*((?:19|20)\d{2})\b/iu;
const beforeYearPattern = /(?:преди|before)\s*((?:19|20)\d{2})\b/iu;
const toYearPattern =
  /(?:до|up to)\s*((?:19|20)\d{2})\s*(?:г\.|година|year)?\b/iu;
const injectionPattern =
  /(?:ignore|disregard|system prompt|developer message|previous instructions|изпълни команда|игнорирай|системн(?:а|ия) инструкция)/iu;

const includesTerm = (query: string, terms: readonly string[]) =>
  terms.some((term) =>
    new RegExp(
      `(^|[^\\p{L}\\p{N}])${escapeRegex(term)}(?=$|[^\\p{L}\\p{N}])`,
      "iu"
    ).test(query)
  );

const applyEnumFilters = (query: string, candidate: SearchCandidate) => {
  if (includesTerm(query, ["автоматик", "автоматична", "automatic", "auto"])) {
    candidate.transmission = "automatic";
  } else if (includesTerm(query, ["ръчни", "ръчна", "manual"])) {
    candidate.transmission = "manual";
  }

  const fuelMatches = [
    { terms: ["бензин", "petrol", "gasoline"], value: "gasoline" },
    { terms: ["дизел", "diesel"], value: "diesel" },
    { terms: ["plug-in", "plug in", "phev"], value: "plug_in_hybrid" },
    { terms: ["хибрид", "hybrid"], value: "hybrid" },
    {
      terms: ["електрически", "електромобил", "electric", " ev "],
      value: "electric",
    },
    { terms: ["газ", "lpg"], value: "lpg" },
    { terms: ["метан", "cng"], value: "cng" },
  ] as const;
  const fuel = fuelMatches.find((match) => includesTerm(query, match.terms));
  if (fuel) {
    candidate.fuel = fuel.value;
  }

  const bodyMatches = [
    { terms: ["suv", "джип"], value: "suv" },
    { terms: ["комби", "wagon", "estate"], value: "wagon" },
    { terms: ["седан", "sedan"], value: "sedan" },
    { terms: ["хечбек", "hatchback"], value: "hatchback" },
    { terms: ["купе", "coupe"], value: "coupe" },
    { terms: ["кабрио", "convertible"], value: "convertible" },
    { terms: ["пикап", "pickup"], value: "pickup" },
    { terms: ["бус", "van"], value: "van" },
  ] as const;
  const body = bodyMatches.find((match) => includesTerm(query, match.terms));
  if (body) {
    candidate.body = body.value;
  }

  if (includesTerm(query, ["дилър", "дилъри", "dealer", "dealership"])) {
    candidate.seller = "dealer";
  } else if (
    includesTerm(query, ["частно лице", "частен", "private seller", "private"])
  ) {
    candidate.seller = "private";
  }

  if (includesTerm(query, ["най-нови", "нови първо", "newest", "latest"])) {
    candidate.sort = "newest";
  } else if (includesTerm(query, ["най-евтини", "евтини първо", "cheapest"])) {
    candidate.sort = "price_asc";
  }
};

const applyTaxonomy = (
  query: string,
  category: VehicleCategory,
  candidate: SearchCandidate
) => {
  const taxonomy = buildVehicleTaxonomyOptions(
    curatedVehicleTaxonomy,
    category
  );
  const make = taxonomy.find((item) =>
    includesTerm(query, [item.name.toLocaleLowerCase()])
  );
  if (!make) {
    return;
  }
  candidate.make = make.name;
  const model = make.models.find((item) =>
    includesTerm(query, [item.name.toLocaleLowerCase()])
  );
  if (model) {
    candidate.model = model.name;
  }
};

type ChipLabelGetter = (
  filters: MarketplaceSearchParams,
  isBg: boolean
) => string;

const getPriceChipLabel: ChipLabelGetter = (filters, isBg) => {
  if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
    return `${filters.priceMin}–${filters.priceMax} ${filters.currency ?? "BGN"}`;
  }
  if (filters.priceMax !== undefined) {
    return `${isBg ? "До" : "Up to"} ${filters.priceMax} ${filters.currency ?? "BGN"}`;
  }
  return `${isBg ? "Над" : "From"} ${filters.priceMin} ${filters.currency ?? "BGN"}`;
};

const getYearChipLabel: ChipLabelGetter = (filters, isBg) => {
  if (filters.yearMin !== undefined && filters.yearMax !== undefined) {
    return `${filters.yearMin}–${filters.yearMax}`;
  }
  if (filters.yearMin !== undefined) {
    return `${isBg ? "От" : "From"} ${filters.yearMin}`;
  }
  return `${isBg ? "До" : "Up to"} ${filters.yearMax}`;
};

const chipLabelGetters: Record<string, ChipLabelGetter> = {
  "make-model": (filters) =>
    [filters.make, filters.model].filter(Boolean).join(" "),
  body: (filters, isBg) => `${isBg ? "Купе" : "Body"}: ${filters.body}`,
  fuel: (filters, isBg) => `${isBg ? "Гориво" : "Fuel"}: ${filters.fuel}`,
  mileage: (filters, isBg) =>
    `${isBg ? "До" : "Up to"} ${filters.mileageMax} km`,
  price: getPriceChipLabel,
  seller: (filters, isBg) =>
    `${isBg ? "Продавач" : "Seller"}: ${filters.seller}`,
  sort: (filters, isBg) => `${isBg ? "Сортиране" : "Sort"}: ${filters.sort}`,
  transmission: (filters, isBg) => {
    if (filters.transmission === "automatic") {
      return isBg ? "Автоматик" : "Automatic";
    }
    return `${isBg ? "Скорости" : "Transmission"}: ${filters.transmission}`;
  },
  year: getYearChipLabel,
};

const getChipLabel = (
  id: string,
  filters: MarketplaceSearchParams,
  isBg: boolean
) => chipLabelGetters[id]?.(filters, isBg) ?? id;

const buildChips = (
  filters: MarketplaceSearchParams,
  isBg: boolean
): AssistedSearchChip[] => {
  const definitions = [
    {
      active: Boolean(filters.make || filters.model),
      id: "make-model",
      keys: ["make", "model"] as const,
    },
    {
      active: filters.priceMin !== undefined || filters.priceMax !== undefined,
      id: "price",
      keys: ["priceMin", "priceMax", "currency"] as const,
    },
    {
      active: filters.yearMin !== undefined || filters.yearMax !== undefined,
      id: "year",
      keys: ["yearMin", "yearMax"] as const,
    },
    {
      active: filters.mileageMax !== undefined,
      id: "mileage",
      keys: ["mileageMax"] as const,
    },
    { active: Boolean(filters.fuel), id: "fuel", keys: ["fuel"] as const },
    {
      active: Boolean(filters.transmission),
      id: "transmission",
      keys: ["transmission"] as const,
    },
    { active: Boolean(filters.body), id: "body", keys: ["body"] as const },
    {
      active: Boolean(filters.seller),
      id: "seller",
      keys: ["seller"] as const,
    },
    {
      active: filters.sort !== "recommended",
      id: "sort",
      keys: ["sort"] as const,
    },
  ];

  return definitions.flatMap((definition) =>
    definition.active
      ? [
          {
            id: definition.id,
            keys: [...definition.keys],
            label: getChipLabel(definition.id, filters, isBg),
          },
        ]
      : []
  );
};

const getRangeAmbiguities = (candidate: SearchCandidate, isBg: boolean) => {
  const ambiguities: string[] = [];

  if (
    candidate.priceMin !== undefined &&
    candidate.priceMax !== undefined &&
    candidate.priceMin > candidate.priceMax
  ) {
    candidate.priceMin = undefined;
    candidate.priceMax = undefined;
    candidate.currency = undefined;
    ambiguities.push(
      isBg
        ? "Минималната цена е над максималната. Уточнете ценовия диапазон."
        : "The minimum price is above the maximum. Clarify the price range."
    );
  }

  if (
    candidate.yearMin !== undefined &&
    candidate.yearMax !== undefined &&
    candidate.yearMin > candidate.yearMax
  ) {
    candidate.yearMin = undefined;
    candidate.yearMax = undefined;
    ambiguities.push(
      isBg
        ? "Началната година е след крайната. Уточнете годините."
        : "The start year is after the end year. Clarify the year range."
    );
  }

  return ambiguities;
};

const getSemanticAmbiguities = (query: string, isBg: boolean) => {
  const ambiguities: string[] = [];

  if (includesTerm(query, ["семеен", "family", "family car"])) {
    ambiguities.push(
      isBg
        ? "„Семеен“ няма точен филтър. Изберете купе от показаните чипове или филтрите."
        : "“Family” is not an exact filter. Choose a body style from the chips or filters."
    );
  }
  if (injectionPattern.test(query)) {
    ambiguities.push(
      isBg
        ? "Инструкциите в заявката са игнорирани; обработени са само автомобилни филтри."
        : "Instructions in the query were ignored; only vehicle filters were parsed."
    );
  }

  return ambiguities;
};

export const parseAssistedSearch = (
  input: z.input<typeof assistedSearchRequestSchema>
): AssistedSearchResponse => {
  const request = assistedSearchRequestSchema.parse(input);
  const query = normalizeQuery(request.query);
  const isBg = request.locale.toLocaleLowerCase().startsWith("bg");
  const candidate: SearchCandidate = {
    category: request.category,
  };
  const ambiguities: string[] = [];

  candidate.priceMax = findNumber(query, priceMaximumPattern);
  candidate.priceMin = findNumber(query, priceMinimumPattern);
  candidate.mileageMax = findNumber(query, mileageMaximumPattern);
  if (candidate.priceMax !== undefined || candidate.priceMin !== undefined) {
    candidate.currency = includesTerm(query, ["eur", "€"]) ? "EUR" : "BGN";
  }

  const afterYear = findYear(query, afterYearPattern);
  candidate.yearMin = afterYear
    ? afterYear + 1
    : findYear(query, fromYearPattern);
  candidate.yearMax =
    findYear(query, beforeYearPattern) ?? findYear(query, toYearPattern);

  applyEnumFilters(query, candidate);
  applyTaxonomy(query, request.category, candidate);

  ambiguities.push(
    ...getRangeAmbiguities(candidate, isBg),
    ...getSemanticAmbiguities(query, isBg)
  );

  const filters = marketplaceSearchSchema.parse(candidate);
  const chips = buildChips(filters, isBg);
  if (chips.length === 0) {
    ambiguities.push(
      isBg
        ? "Не разпознах точен филтър. Добавете цена, година, гориво, купе или скоростна кутия."
        : "No exact filter was recognized. Add price, year, fuel, body style, or transmission."
    );
  }

  const safeFilters = assistedFiltersSchema.parse(filters);
  return assistedSearchResponseSchema.parse({
    ambiguities,
    chips,
    execution: "canonical-url",
    filters: safeFilters,
    href: buildMarketplaceSearchHref(filters, request.basePath),
    mode: "deterministic-fallback",
    promptVersion: ASSISTED_SEARCH_PROMPT_VERSION,
    usagePolicy: {
      deterministicUsesCredits: false,
      providerTrialLimitPerMonth: ASSISTED_SEARCH_TRIAL_LIMIT_PER_MONTH,
    },
  });
};
