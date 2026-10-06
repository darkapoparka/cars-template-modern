import type { MarketplaceSearchParams } from "@repo/marketplace";
import { getMarketplaceControlCopy } from "./marketplace-control-copy";
import { getMarketplaceFilterSummary } from "./marketplace-filter-summary";

export const desktopFullFilterSections = [
  "vehicle",
  "price",
  "year",
  "mileage",
  "fuel",
  "transmission",
  "body",
  "search",
  "category",
  "location",
  "origin",
  "deliver-to",
  "seller",
] as const;
export type DesktopFullFilterSection =
  (typeof desktopFullFilterSections)[number];
export type DesktopFullFilterEntry =
  | DesktopFullFilterSection
  | "make"
  | "model";

export const desktopFullFilterGroups = [
  {
    id: "category",
    bg: "Какво",
    en: "Vehicle type",
    sections: ["category"],
  },
  {
    id: "vehicle",
    bg: "Марка и модел",
    en: "Make and model",
    sections: ["vehicle"],
  },
  {
    id: "budget",
    bg: "Цена и година",
    en: "Price and year",
    sections: ["price", "year", "mileage"],
  },
  {
    id: "details",
    bg: "Характеристики",
    en: "Specifications",
    sections: ["body", "fuel", "transmission"],
  },
  {
    id: "location",
    bg: "Още опции",
    en: "More options",
    sections: ["location", "origin", "deliver-to", "seller", "search"],
  },
] as const;
export type DesktopFullFilterGroup =
  (typeof desktopFullFilterGroups)[number]["id"];

export function getDesktopFullFilterGroup(section: DesktopFullFilterSection) {
  return (
    desktopFullFilterGroups.find((group) =>
      (group.sections as readonly DesktopFullFilterSection[]).includes(section)
    )?.id ?? "vehicle"
  );
}

export function getDesktopFullFilterLabel(
  section: DesktopFullFilterSection,
  locale?: string
) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  if (section === "vehicle") {
    return isBg ? "Марка и модел" : "Make and model";
  }
  if (section === "search") {
    return isBg ? "Ключова дума" : "Keyword";
  }
  if (section === "category") {
    return isBg ? "Какво търсите?" : "Vehicle type";
  }
  return getMarketplaceControlCopy(locale).filters[section];
}

export function getDesktopFullFilterSummary(
  section: DesktopFullFilterSection,
  draft: MarketplaceSearchParams,
  locale?: string
) {
  if (section === "vehicle") {
    return [draft.make, draft.model].filter(Boolean).join(" ");
  }
  if (section === "search") {
    return draft.q;
  }
  if (section === "category") {
    return getMarketplaceControlCopy(locale).categories[draft.category].label;
  }
  return getMarketplaceFilterSummary(section, draft, locale);
}

const clearUpdates: Partial<
  Record<DesktopFullFilterSection, Partial<MarketplaceSearchParams>>
> = {
  vehicle: {
    make: undefined,
    model: undefined,
    derivative: undefined,
    trim: undefined,
  },
  price: { priceMin: undefined, priceMax: undefined, currency: undefined },
  year: { yearMin: undefined, yearMax: undefined },
  mileage: { mileageMax: undefined },
  search: { q: undefined },
  "deliver-to": { deliverTo: undefined },
};
export const clearDesktopFullFilterSection = (
  section: DesktopFullFilterSection,
  draft: MarketplaceSearchParams
): MarketplaceSearchParams => ({
  ...draft,
  ...(clearUpdates[section] ?? { [section]: undefined }),
});

/** Facets describe the applied result set, excluding the vehicle selection. */
export function canUseDesktopFilterModelCounts(
  applied: MarketplaceSearchParams,
  draft: MarketplaceSearchParams
) {
  const keys = [
    "category",
    "q",
    "priceMin",
    "priceMax",
    "currency",
    "yearMin",
    "yearMax",
    "mileageMax",
    "fuel",
    "transmission",
    "body",
    "seller",
    "location",
    "radius",
    "origin",
    "deliverTo",
  ] as const;
  return keys.every((key) => applied[key] === draft[key]);
}
