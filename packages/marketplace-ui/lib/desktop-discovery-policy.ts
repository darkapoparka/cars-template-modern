import type { VehicleListing } from "@repo/marketplace";

export const getPopularMakes = (listings: readonly VehicleListing[]) => {
  const counts = new Map<string, number>();
  for (const listing of listings) {
    counts.set(listing.spec.make, (counts.get(listing.spec.make) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(
      ([firstMake, firstCount], [secondMake, secondCount]) =>
        secondCount - firstCount || firstMake.localeCompare(secondMake)
    )
    .slice(0, 4)
    .map(([make, count]) => ({ count, make }));
};

const takeUniqueListings = (
  source: readonly VehicleListing[],
  usedListingIds: Set<string>,
  limit: number
) => {
  const selected: VehicleListing[] = [];
  for (const listing of source) {
    if (usedListingIds.has(listing.id)) {
      continue;
    }
    selected.push(listing);
    usedListingIds.add(listing.id);
    if (selected.length === limit) {
      break;
    }
  }
  return selected;
};

const publicationTime = (listing: VehicleListing): number => {
  const timestamp = Date.parse(listing.publishedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

/** Select once on the server. Responsive layout must never remove inventory with CSS. */
export const getDesktopDiscoveryCollections = (
  listings: readonly VehicleListing[]
) => {
  const usedIds = new Set<string>();
  const featured = takeUniqueListings(
    [
      ...listings.filter((listing) => listing.promoted),
      ...listings.filter((listing) => !listing.promoted),
    ],
    usedIds,
    5
  );
  const newest = takeUniqueListings(
    [...listings].sort(
      (first, second) =>
        publicationTime(second) - publicationTime(first) ||
        first.id.localeCompare(second.id)
    ),
    usedIds,
    5
  );
  const available = takeUniqueListings(listings, usedIds, 5);
  return { featured, newest, available };
};
