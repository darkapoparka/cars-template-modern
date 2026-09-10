"use client";

import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  type ListingViewMode,
  type MarketplaceSearchParams,
  type VehicleListing,
} from "@repo/marketplace";
import { useEffect } from "react";
import { getAccountListingSaveFlowHref } from "../lib/account-save-flow";
import { readInventoryReturn } from "../lib/inventory-return";
import {
  getMarketplaceListingGridClassName,
  getMarketplaceResultsSectionClassName,
  shouldHideDesktopResultSummary,
} from "../lib/marketplace-results-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { ResultToolbar } from "./desktop-marketplace-controls";
import { MarketplacePagination } from "./marketplace-pagination";
import { MarketplaceResultsEmptyState } from "./marketplace-results-empty-state";
import { VehicleCard } from "./vehicle-card";

export const MarketplaceResults = ({
  activeFilterCount,
  appBaseUrl,
  currentPath,
  desktopSearchVariant,
  filters,
  isBg,
  listings,
  locale,
  onChooseCategory,
  onOpenFilters,
  onViewModeChange,
  totalListings,
  viewMode,
}: {
  activeFilterCount: number;
  appBaseUrl: string;
  currentPath: string;
  desktopSearchVariant: "discovery" | "results";
  filters: MarketplaceSearchParams;
  isBg: boolean;
  listings: VehicleListing[];
  locale?: string;
  onChooseCategory: () => void;
  onOpenFilters: () => void;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  totalListings: number;
  viewMode: ListingViewMode;
}) => {
  const useWideInventoryGrid = viewMode === "grid" && listings.length >= 4;
  const singularLabel = isBg ? "автомобил" : "vehicle";
  const pluralLabel = isBg ? "автомобила" : "vehicles";
  useEffect(() => {
    const saved = readInventoryReturn();
    if (saved?.href !== location.pathname + location.search) {
      return;
    }
    const frame = requestAnimationFrame(() =>
      window.scrollTo(0, saved.scrollY)
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const useDiscoveryInventoryGrid =
    desktopSearchVariant === "discovery" && viewMode === "grid";
  const priorityListingCount =
    useDiscoveryInventoryGrid || useWideInventoryGrid ? 4 : 3;

  return (
    <section
      className={getMarketplaceResultsSectionClassName(desktopSearchVariant)}
    >
      <div className="min-w-0">
        <p
          aria-live="polite"
          className={cn(
            "mb-2 text-muted-foreground text-xs tabular-nums lg:hidden",
            activeFilterCount === 0 && "sr-only"
          )}
        >
          {totalListings} {totalListings === 1 ? singularLabel : pluralLabel}
        </p>
        <ResultToolbar
          filters={filters}
          hideDesktopSummary={shouldHideDesktopResultSummary(
            desktopSearchVariant
          )}
          locale={locale}
          onOpenFilters={onOpenFilters}
          onViewModeChange={onViewModeChange}
          totalListings={totalListings}
          viewMode={viewMode}
        />

        {listings.length > 0 ? (
          <>
            <div
              className={cn(
                "grid items-start gap-2 lg:gap-4",
                getMarketplaceListingGridClassName({
                  listingCount: listings.length,
                  useDiscoveryInventoryGrid,
                  useWideInventoryGrid,
                  viewMode,
                })
              )}
              data-slot="marketplace-listing-grid"
            >
              {listings.map((listing, index) => (
                <VehicleCard
                  density="compact"
                  desktopLayout={viewMode}
                  href={buildMarketplaceSearchHref(
                    { deliverTo: filters.deliverTo },
                    getLocalizedPublicPath(locale, getListingPath(listing))
                  )}
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  presentation={
                    useDiscoveryInventoryGrid ? "discovery" : "default"
                  }
                  priority={index < priorityListingCount}
                  saveHref={getAccountListingSaveFlowHref(appBaseUrl, listing)}
                  viewMode={viewMode}
                />
              ))}
            </div>
            <MarketplacePagination
              basePath={currentPath}
              filters={filters}
              locale={locale}
              totalListings={totalListings}
            />
          </>
        ) : (
          <MarketplaceResultsEmptyState
            currentPath={currentPath}
            filtered={activeFilterCount > 0}
            filters={filters}
            isBg={isBg}
            onChooseCategory={onChooseCategory}
          />
        )}
      </div>
    </section>
  );
};
