"use client";

import { cn } from "@repo/design-system/lib/utils";
import {
  buildMarketplaceSearchHref,
  getListingPath,
  type ListingViewMode,
  type MarketplaceSearchParams,
  type VehicleListing,
  type VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { PublicInventoryFilterLayout } from "@repo/marketplace/inventory-presentation";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { useEffect } from "react";
import { getAccountListingSaveFlowHref } from "../lib/account-save-flow";
import { readInventoryReturn } from "../lib/inventory-return";
import {
  getMarketplaceListingGridClassName,
  getMarketplaceResultsSectionClassName,
  shouldHideDesktopResultSummary,
} from "../lib/marketplace-results-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerHeroSearch } from "./dealer-hero-search";
import dealerStyles from "./dealer-inventory.module.css";
import { DealerInventoryFilters } from "./dealer-inventory-filters";
import { ResultToolbar } from "./desktop-marketplace-controls";
import { MarketplacePagination } from "./marketplace-pagination";
import { MarketplaceResultsEmptyState } from "./marketplace-results-empty-state";
import { VehicleCard } from "./vehicle-card";

// Dealer grid: frame gutters, panel padding, sidebar, grid gaps and card borders.
const dealerImageSizes = {
  sidebar:
    "(max-width: 1279px) calc((100vw - 416px) / 2), (max-width: 1399px) calc((100vw - 478px) / 3), 308px",
  quick:
    "(max-width: 1279px) calc((100vw - 174px) / 3), (max-width: 1399px) calc((100vw - 196px) / 4), 301px",
  list: "272px",
} as const;

export const MarketplaceResults = ({
  activeFilterCount,
  appBaseUrl,
  currentPath,
  desktopSearchVariant,
  desktopFilterLayout,
  filters,
  hideDesktop = false,
  isBg,
  listings,
  locale,
  searchListings,
  taxonomy,
  onChooseCategory,
  onApply,
  onClearFilters,
  onDesktopFilterLayoutChange,
  onOpenFilters,
  onViewModeChange,
  totalListings,
  viewMode,
}: {
  activeFilterCount: number;
  appBaseUrl: string;
  currentPath: string;
  desktopSearchVariant: "discovery" | "results";
  desktopFilterLayout: PublicInventoryFilterLayout;
  filters: MarketplaceSearchParams;
  hideDesktop?: boolean;
  isBg: boolean;
  listings: VehicleListing[];
  locale?: string;
  searchListings?: readonly InventorySearchListing[];
  taxonomy?: VehicleTaxonomyMakeOption[];
  onChooseCategory: () => void;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onClearFilters: () => void;
  onDesktopFilterLayoutChange: (layout: PublicInventoryFilterLayout) => void;
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
  const regularPresentation = useDiscoveryInventoryGrid
    ? "discovery"
    : "default";
  const priorityListingCount =
    useDiscoveryInventoryGrid || useWideInventoryGrid ? 4 : 3;

  return (
    <section
      className={cn(
        getMarketplaceResultsSectionClassName(desktopSearchVariant),
        isDealershipSite && dealerStyles.results,
        hideDesktop && "lg:hidden"
      )}
      data-desktop-hidden={hideDesktop}
      data-filter-layout={isDealershipSite ? desktopFilterLayout : undefined}
      data-slot={isDealershipSite ? "dealer-inventory-panel" : undefined}
    >
      {isDealershipSite && !hideDesktop ? (
        <DealerInventoryFilters
          filters={filters}
          layout={desktopFilterLayout}
          locale={locale}
          onApply={onApply}
          onClearFilters={onClearFilters}
          onLayoutChange={onDesktopFilterLayoutChange}
          onViewModeChange={onViewModeChange}
          viewMode={viewMode}
        />
      ) : null}
      {isDealershipSite && !hideDesktop && (
        <aside
          className={dealerStyles.sidebar}
          data-slot="dealer-inventory-sidebar"
          hidden={desktopFilterLayout !== "sidebar"}
        >
          <DealerHeroSearch
            compact
            filters={filters}
            key={JSON.stringify(filters)}
            locale={locale}
            searchListings={searchListings}
            taxonomy={taxonomy}
          />
        </aside>
      )}
      <div className="min-w-0">
        <p
          aria-live="polite"
          className={cn(
            "mb-2 text-micro text-muted-foreground tabular-nums lg:hidden",
            activeFilterCount === 0 && "sr-only"
          )}
        >
          {totalListings} {totalListings === 1 ? singularLabel : pluralLabel}
        </p>
        <div className={isDealershipSite ? "lg:hidden" : undefined}>
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
        </div>
        {listings.length > 0 ? (
          <>
            <div
              className={cn(
                "grid items-start gap-2 lg:gap-4",
                isDealershipSite && dealerStyles.grid,
                getMarketplaceListingGridClassName({
                  listingCount: listings.length,
                  useDiscoveryInventoryGrid,
                  useWideInventoryGrid,
                  viewMode,
                })
              )}
              data-slot="marketplace-listing-grid"
              data-view={viewMode}
            >
              {listings.map((listing, index) => (
                <VehicleCard
                  density="compact"
                  desktopImageSizes={
                    isDealershipSite
                      ? dealerImageSizes[
                          viewMode === "list" ? "list" : desktopFilterLayout
                        ]
                      : undefined
                  }
                  desktopLayout={viewMode}
                  href={buildMarketplaceSearchHref(
                    { deliverTo: filters.deliverTo },
                    getLocalizedPublicPath(locale, getListingPath(listing))
                  )}
                  key={listing.id}
                  listing={listing}
                  locale={locale}
                  presentation={
                    isDealershipSite ? "showroom" : regularPresentation
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
