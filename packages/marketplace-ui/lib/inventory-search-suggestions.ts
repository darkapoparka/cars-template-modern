import type { VehicleListing } from "@repo/marketplace";

export type MobileSearchItem =
  | {
      id: string;
      kind: "make";
      label: string;
      make: string;
    }
  | {
      id: string;
      kind: "listing";
      label: string;
      listing: VehicleListing;
    }
  | {
      id: string;
      kind: "model";
      label: string;
      make: string;
      model: string;
    }
  | {
      id: string;
      kind: "query";
      label: string;
      value: string;
    };

export interface MobileSearchGroup {
  heading: string;
  items: MobileSearchItem[];
  presentation: "chips" | "rows";
}

const leadingListingYearPattern = /^\d{4}\s+/;
const searchTokenPattern = /[\s,]+/;
const queryListingLimit = 8;
const makeLimit = 8;
const modelLimit = 8;

const normalizeSearchText = (value: string) => value.trim().toLocaleLowerCase();

const searchTokens = (query: string) =>
  normalizeSearchText(query).split(searchTokenPattern).filter(Boolean);

const matchesSearchTokens = (haystack: string, tokens: readonly string[]) =>
  tokens.every((token) => haystack.includes(token));

const listingSearchText = (listing: VehicleListing) =>
  [listing.title, listing.spec.make, listing.spec.model, listing.spec.trim]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

const uniqueMakes = (listings: readonly VehicleListing[]) => {
  const makes: string[] = [];

  for (const listing of listings) {
    if (!makes.includes(listing.spec.make)) {
      makes.push(listing.spec.make);
    }
  }

  return makes;
};

const uniqueModels = (listings: readonly VehicleListing[]) => {
  const models: { make: string; model: string }[] = [];

  for (const listing of listings) {
    const make = listing.spec.make;
    const model = listing.spec.model;
    if (!models.some((item) => item.make === make && item.model === model)) {
      models.push({ make, model });
    }
  }

  return models;
};

const listingLabel = (listing: VehicleListing) =>
  listing.title.replace(leadingListingYearPattern, "");

const matchingMakesForQuery = (
  makes: readonly string[],
  tokens: readonly string[]
) => {
  if (tokens.length === 0) {
    return [...makes];
  }

  return makes.filter((make) => {
    const normalizedMake = make.toLocaleLowerCase();
    return tokens.some((token) => normalizedMake.includes(token));
  });
};

const matchingListingsForQuery = (
  listings: readonly VehicleListing[],
  tokens: readonly string[]
) => {
  if (tokens.length === 0) {
    return [...listings];
  }

  return listings.filter((listing) =>
    matchesSearchTokens(listingSearchText(listing), tokens)
  );
};

const makeChipGroup = (
  isBg: boolean,
  makes: readonly string[]
): MobileSearchGroup | undefined => {
  if (makes.length === 0) {
    return undefined;
  }

  return {
    heading: isBg ? "Марки в наличност" : "Makes in stock",
    items: makes.slice(0, makeLimit).map((make) => ({
      id: `make-${make}`,
      kind: "make" as const,
      label: make,
      make,
    })),
    presentation: "chips",
  };
};

const modelChipGroup = (
  isBg: boolean,
  listings: readonly VehicleListing[]
): MobileSearchGroup | undefined => {
  const models = uniqueModels(listings).slice(0, modelLimit);
  if (models.length === 0) {
    return undefined;
  }

  return {
    heading: isBg ? "Модели" : "Models",
    items: models.map((item) => ({
      id: `model-${item.make}-${item.model}`,
      kind: "model" as const,
      label: `${item.make} ${item.model}`,
      make: item.make,
      model: item.model,
    })),
    presentation: "chips",
  };
};

const listingRowGroup = (
  isBg: boolean,
  listings: readonly VehicleListing[]
): MobileSearchGroup | undefined => {
  if (listings.length === 0) {
    return undefined;
  }

  return {
    heading: isBg ? "Обяви" : "Listings",
    items: listings.slice(0, queryListingLimit).map((listing) => ({
      id: listing.id,
      kind: "listing" as const,
      label: listingLabel(listing),
      listing,
    })),
    presentation: "rows",
  };
};

export const getMobileInventorySearchGroups = ({
  isBg,
  listings,
  query,
}: {
  isBg: boolean;
  listings: readonly VehicleListing[];
  locale?: string;
  query: string;
}): MobileSearchGroup[] => {
  const normalizedQuery = normalizeSearchText(query);
  const tokens = searchTokens(query);
  const matchingListings = matchingListingsForQuery(listings, tokens);
  const makeGroup = makeChipGroup(
    isBg,
    matchingMakesForQuery(uniqueMakes(listings), tokens)
  );

  if (!normalizedQuery) {
    return makeGroup ? [makeGroup] : [];
  }

  const modelGroup = modelChipGroup(isBg, matchingListings);
  const suggestionItems = [
    ...(makeGroup?.items ?? []),
    ...(modelGroup?.items ?? []),
  ];
  const suggestionGroup: MobileSearchGroup | undefined = suggestionItems.length
    ? {
        heading: isBg ? "Предложения" : "Suggestions",
        items: suggestionItems,
        presentation: "chips",
      }
    : undefined;
  const groups = [
    suggestionGroup,
    listingRowGroup(isBg, matchingListings),
  ].filter((group): group is MobileSearchGroup => Boolean(group));

  groups.push({
    heading: isBg ? "Търсене" : "Search",
    items: [
      {
        id: "search-query",
        kind: "query",
        label: isBg
          ? `Търси „${query.trim()}“`
          : `Search for “${query.trim()}”`,
        value: query.trim(),
      },
    ],
    presentation: "rows",
  });

  return groups;
};
