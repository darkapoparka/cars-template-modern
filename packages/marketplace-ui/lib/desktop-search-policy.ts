import {
  formatFuelType,
  formatMileage,
  getListingPath,
  leadSite,
  mockListings,
  type VehicleListing,
} from "@repo/marketplace";
import { getLocalizedPublicPath } from "./public-path";

export type DesktopSearchScope = "organizations" | "vehicles";
export type SearchSuggestionKind = "dealer" | "location" | "vehicle";

interface SearchSuggestionDefinition {
  descriptionBg: string;
  descriptionEn: string;
  id: string;
  keywords: string;
  kind: SearchSuggestionKind;
  label: string;
  listing?: VehicleListing;
  popular?: boolean;
  value: string;
}

export interface SearchSuggestionItem {
  description: string;
  href?: string;
  id: string;
  kind: SearchSuggestionKind | "recent" | "search";
  label: string;
  listing?: VehicleListing;
  value: string;
}

export interface SearchSuggestionGroup {
  heading: string;
  items: SearchSuggestionItem[];
}

const defaultVehicleSuggestions: readonly SearchSuggestionDefinition[] = [
  {
    descriptionBg: "SUV · дизел · автоматик",
    descriptionEn: "SUV · diesel · automatic",
    id: "bmw-x5",
    keywords: "bmw x5 xdrive40d suv diesel дизел",
    kind: "vehicle",
    label: "BMW X5",
    popular: true,
    value: "BMW X5",
  },
  {
    descriptionBg: "SUV · бензин · quattro",
    descriptionEn: "SUV · petrol · quattro",
    id: "audi-q5",
    keywords: "audi q5 tfsi quattro suv бензин",
    kind: "vehicle",
    label: "Audi Q5",
    popular: true,
    value: "Audi Q5",
  },
  {
    descriptionBg: "SUV · хибрид · автоматик",
    descriptionEn: "SUV · hybrid · automatic",
    id: "toyota-rav4",
    keywords: "toyota rav4 hybrid awd suv хибрид",
    kind: "vehicle",
    label: "Toyota RAV4",
    popular: true,
    value: "Toyota RAV4",
  },
  {
    descriptionBg: "Комби · дизел · автоматик",
    descriptionEn: "Wagon · diesel · automatic",
    id: "volkswagen-golf",
    keywords: "volkswagen vw golf variant tdi комби дизел",
    kind: "vehicle",
    label: "Volkswagen Golf",
    value: "Volkswagen Golf",
  },
  {
    descriptionBg: "Електрически SUV автомобили",
    descriptionEn: "Electric SUV listings",
    id: "electric-suv",
    keywords: "electric ev suv електрически електромобил",
    kind: "vehicle",
    label: "Електрически SUV",
    popular: true,
    value: "Електрически SUV",
  },
  {
    descriptionBg: `Налични автомобили в ${leadSite.city}`,
    descriptionEn: `Vehicles available in ${leadSite.city}`,
    id: `${leadSite.slug}-vehicles`,
    keywords: `${leadSite.city} ${leadSite.country} vehicles автомобили`,
    kind: "location",
    label: leadSite.city,
    popular: true,
    value: leadSite.city,
  },
];

const leadPopularVehicleIds = [
  "am-1001",
  "am-1010",
  "am-1008",
  "am-1011",
] as const;
const leadingListingYearPattern = /^\d{4}\s+/;

const leadVehicleSuggestions: readonly SearchSuggestionDefinition[] = [
  ...mockListings
    .filter((listing) => listing.category === "car")
    .sort((left, right) => {
      const leftIndex = leadPopularVehicleIds.indexOf(
        left.id as (typeof leadPopularVehicleIds)[number]
      );
      const rightIndex = leadPopularVehicleIds.indexOf(
        right.id as (typeof leadPopularVehicleIds)[number]
      );
      return (
        (leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex) -
        (rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex)
      );
    })
    .map<SearchSuggestionDefinition>((listing) => ({
      descriptionBg: "",
      descriptionEn: "",
      id: listing.id,
      keywords: [
        listing.title,
        listing.spec.make,
        listing.spec.model,
        listing.spec.trim,
        listing.spec.fuelType,
      ]
        .filter(Boolean)
        .join(" "),
      kind: "vehicle",
      label: listing.title.replace(leadingListingYearPattern, ""),
      listing,
      popular: leadPopularVehicleIds.includes(
        listing.id as (typeof leadPopularVehicleIds)[number]
      ),
      value: listing.title,
    })),
  {
    descriptionBg: `Автомобили в наличност в ${leadSite.city}`,
    descriptionEn: `Vehicles available in ${leadSite.city}`,
    id: `${leadSite.slug}-vehicles`,
    keywords: `${leadSite.city} ${leadSite.country} vehicles автомобили`,
    kind: "location",
    label: leadSite.city,
    popular: true,
    value: leadSite.city,
  },
];

const vehicleSuggestions = leadSite.staticDemoMode
  ? leadVehicleSuggestions
  : defaultVehicleSuggestions;

const organizationSuggestions: readonly SearchSuggestionDefinition[] = [
  {
    descriptionBg: "Проверен дилър · София",
    descriptionEn: "Verified dealer · Sofia",
    id: "sofia-premium-cars",
    keywords: "sofia premium cars dealer дилър софия bmw audi",
    kind: "dealer",
    label: "Sofia Premium Cars",
    popular: true,
    value: "Sofia Premium Cars",
  },
  {
    descriptionBg: "Вносител от Китай · София",
    descriptionEn: "Importer from China · Sofia",
    id: "china-ev-import",
    keywords: "china ev import importer китай вносител софия byd geely",
    kind: "dealer",
    label: "China EV Import Demo",
    popular: true,
    value: "China EV Import Demo",
  },
  {
    descriptionBg: `Дилър · ${leadSite.city}`,
    descriptionEn: `Dealer · ${leadSite.city}`,
    id: leadSite.slug,
    keywords: `${leadSite.name} ${leadSite.city} ${leadSite.country} dealer дилър`,
    kind: "dealer",
    label: leadSite.name,
    popular: true,
    value: leadSite.name,
  },
  {
    descriptionBg: "Проверен EV дилър · Варна",
    descriptionEn: "Verified EV dealer · Varna",
    id: "black-sea-ev",
    keywords: "black sea ev dealer дилър варна electric",
    kind: "dealer",
    label: "Black Sea EV",
    value: "Black Sea EV",
  },
  {
    descriptionBg: "Дилъри и вносители в София",
    descriptionEn: "Dealers and importers in Sofia",
    id: "sofia-organizations",
    keywords: "sofia city софия дилъри вносители",
    kind: "location",
    label: "София",
    popular: true,
    value: "София",
  },
  {
    descriptionBg: "Дилъри и вносители във Варна",
    descriptionEn: "Dealers and importers in Varna",
    id: "varna-organizations",
    keywords: "varna city варна дилъри вносители",
    kind: "location",
    label: "Варна",
    popular: true,
    value: "Варна",
  },
];

const recentSearchStorageKey = (scope: DesktopSearchScope) =>
  `automarket:desktop-search:${scope}:recent`;

export const readRecentMarketplaceSearches = (scope: DesktopSearchScope) => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(recentSearchStorageKey(scope));
    if (!stored) {
      return [];
    }
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .slice(0, 3)
      : [];
  } catch {
    return [];
  }
};

export const rememberMarketplaceSearchQuery = (
  query: string,
  scope: DesktopSearchScope
) => {
  const normalizedQuery = query.trim();
  if (!(normalizedQuery && typeof window !== "undefined")) {
    return [];
  }

  const nextRecentSearches = [
    normalizedQuery,
    ...readRecentMarketplaceSearches(scope).filter(
      (recentQuery) =>
        recentQuery.toLocaleLowerCase() !== normalizedQuery.toLocaleLowerCase()
    ),
  ].slice(0, 3);

  try {
    window.localStorage.setItem(
      recentSearchStorageKey(scope),
      JSON.stringify(nextRecentSearches)
    );
  } catch {
    return nextRecentSearches;
  }

  return nextRecentSearches;
};

const toSuggestionItem = (
  suggestion: SearchSuggestionDefinition,
  isBg: boolean,
  locale?: string
): SearchSuggestionItem => {
  let description = isBg
    ? suggestion.descriptionBg
    : suggestion.descriptionEn;
  if (suggestion.listing) {
    description = `${suggestion.listing.spec.year} · ${formatMileage(
      suggestion.listing.spec.mileageValue,
      locale
    )} · ${formatFuelType(suggestion.listing.spec.fuelType, locale)}`;
  }

  return {
    description,
    href: suggestion.listing
      ? getLocalizedPublicPath(locale, getListingPath(suggestion.listing))
      : undefined,
    id: suggestion.id,
    kind: suggestion.kind,
    label: suggestion.label,
    listing: suggestion.listing,
    value: suggestion.value,
  };
};

const getQuerySuggestionGroups = (
  definitions: readonly SearchSuggestionDefinition[],
  isBg: boolean,
  query: string,
  locale?: string
): SearchSuggestionGroup[] => {
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = definitions
    .filter((suggestion) =>
      `${suggestion.label} ${suggestion.value} ${suggestion.keywords}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    )
    .slice(0, 6)
    .map((suggestion) => toSuggestionItem(suggestion, isBg, locale));
  const groups: SearchSuggestionGroup[] = [];

  if (matches.length) {
    groups.push({
      heading: isBg ? "Предложения" : "Suggestions",
      items: matches,
    });
  }

  groups.push({
    heading: isBg ? "Търсене" : "Search",
    items: [
      {
        description: isBg
          ? "Покажи всички съвпадения"
          : "Show all matching results",
        id: "search-query",
        kind: "search",
        label: isBg ? `Търси „${query}“` : `Search for “${query}”`,
        value: query,
      },
    ],
  });

  return groups;
};

const getPopularHeading = (isBg: boolean, scope: DesktopSearchScope) => {
  if (scope === "organizations") {
    return isBg ? "Популярни дилъри и места" : "Popular dealers and places";
  }
  if (leadSite.staticDemoMode) {
    return isBg ? "Популярни предложения" : "Popular listings";
  }
  return isBg ? "Популярни търсения" : "Popular searches";
};

const getIdleSuggestionGroups = (
  definitions: readonly SearchSuggestionDefinition[],
  isBg: boolean,
  locale: string | undefined,
  recentSearches: readonly string[],
  scope: DesktopSearchScope
): SearchSuggestionGroup[] => {
  const recentItems = recentSearches.map<SearchSuggestionItem>(
    (recentQuery, index) => ({
      description: isBg ? "Скорошно търсене" : "Recent search",
      id: `recent-${index}`,
      kind: "recent",
      label: recentQuery,
      value: recentQuery,
    })
  );

  if (leadSite.staticDemoMode && scope === "vehicles") {
    const groups: SearchSuggestionGroup[] = [];
    if (recentItems.length) {
      groups.push({
        heading: isBg ? "Скорошни" : "Recent",
        items: recentItems,
      });
    }
    groups.push({
      heading: getPopularHeading(isBg, scope),
      items: definitions
        .filter(
          (suggestion) => suggestion.popular && suggestion.kind === "vehicle"
        )
        .slice(0, 4)
        .map((suggestion) => toSuggestionItem(suggestion, isBg, locale)),
    });
    groups.push({
      heading: isBg ? "Търсене по местоположение" : "Search by location",
      items: definitions
        .filter(
          (suggestion) => suggestion.popular && suggestion.kind === "location"
        )
        .map((suggestion) => toSuggestionItem(suggestion, isBg, locale)),
    });
    return groups;
  }

  const popularItems = definitions
    .filter((suggestion) => suggestion.popular)
    .slice(0, recentItems.length ? 4 : 6)
    .map((suggestion) => toSuggestionItem(suggestion, isBg, locale));
  const groups: SearchSuggestionGroup[] = [];

  if (recentItems.length) {
    groups.push({
      heading: isBg ? "Скорошни" : "Recent",
      items: recentItems,
    });
  }
  groups.push({
    heading: getPopularHeading(isBg, scope),
    items: popularItems,
  });

  return groups;
};

export const getDesktopSearchSuggestionGroups = ({
  isBg,
  locale,
  query,
  recentSearches,
  scope,
}: {
  isBg: boolean;
  locale?: string;
  query: string;
  recentSearches: readonly string[];
  scope: DesktopSearchScope;
}) => {
  const definitions =
    scope === "organizations" ? organizationSuggestions : vehicleSuggestions;

  return query
    ? getQuerySuggestionGroups(definitions, isBg, query, locale)
    : getIdleSuggestionGroups(definitions, isBg, locale, recentSearches, scope);
};
