import {
  formatFuelType,
  formatMileage,
  getListingPath,
  leadSite,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { isDealershipSite } from "@repo/marketplace/site-config";
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
  listing?: InventorySearchListing;
  popular?: boolean;
  value: string;
}

export interface SearchSuggestionItem {
  description: string;
  href?: string;
  id: string;
  kind: SearchSuggestionKind | "recent" | "search";
  label: string;
  listing?: InventorySearchListing;
  value: string;
}

export interface SearchSuggestionGroup {
  heading: string;
  items: SearchSuggestionItem[];
}

const leadingListingYearPattern = /^\d{4}\s+/;

const locationSuggestion: SearchSuggestionDefinition = {
  descriptionBg: `Автомобили в ${leadSite.city}`,
  descriptionEn: `Vehicles in ${leadSite.city}`,
  id: `${leadSite.slug}-vehicles`,
  keywords: `${leadSite.city} ${leadSite.country}`,
  kind: "location",
  label: leadSite.city,
  popular: true,
  value: leadSite.city,
};

const getVehicleSuggestions = (
  listings: readonly InventorySearchListing[]
): readonly SearchSuggestionDefinition[] => [
  ...listings.map<SearchSuggestionDefinition>((listing, index) => ({
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
    popular: index < 4,
    value: listing.title,
  })),
  locationSuggestion,
];

const organizationSuggestions: readonly SearchSuggestionDefinition[] = [
  {
    descriptionBg: leadSite.city,
    descriptionEn: leadSite.city,
    id: leadSite.slug,
    keywords: `${leadSite.name} ${leadSite.city} ${leadSite.country}`,
    kind: "dealer",
    label: leadSite.name,
    popular: true,
    value: leadSite.name,
  },
  locationSuggestion,
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
  let description = isBg ? suggestion.descriptionBg : suggestion.descriptionEn;
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
    return isBg ? "Дилъри и места" : "Dealers and places";
  }
  if (isDealershipSite) {
    return isBg ? "Автомобили в наличност" : "Available vehicles";
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

  if (isDealershipSite && scope === "vehicles") {
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
  listings = [],
  query,
  recentSearches,
  scope,
}: {
  isBg: boolean;
  locale?: string;
  query: string;
  recentSearches: readonly string[];
  scope: DesktopSearchScope;
  listings?: readonly InventorySearchListing[];
}) => {
  const definitions =
    scope === "organizations"
      ? organizationSuggestions
      : getVehicleSuggestions(listings);

  return query
    ? getQuerySuggestionGroups(definitions, isBg, query, locale)
    : getIdleSuggestionGroups(definitions, isBg, locale, recentSearches, scope);
};
