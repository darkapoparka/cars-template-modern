"use client";

import { cn } from "@repo/design-system/lib/utils";
import type {
  ListingViewMode,
  MarketplaceSearchParams,
  VehicleCategory,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  marketplaceContentFrameClassName,
  marketplaceDiscoveryFrameClassName,
} from "../lib/marketplace-layout";
import { getLocalizedPublicPath } from "../lib/public-path";
import { DealerDesktopDiscoveryHero } from "./dealer-desktop-discovery-hero";
import { DealerDesktopHeader } from "./dealer-desktop-header";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";
import {
  type DesktopCategoryInventoryCount,
  DesktopDiscoverySearch,
} from "./desktop-discovery-search";
import type { DesktopFullFilterEntry } from "./desktop-full-filter-dialog";
import { DesktopQuickFilters } from "./desktop-quick-filters";
import { MarketplaceMasthead } from "./marketplace-masthead";

export { DesktopMarketplaceFilterRail } from "./desktop-quick-filters";

type ApplyFilters = (filters: Partial<MarketplaceSearchParams>) => void;

interface DesktopMarketplaceBarProps {
  appBaseUrl: string;
  assistantSlot?: ReactNode;
  categoryCounts?: DesktopCategoryInventoryCount[];
  filterCount: number;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: ApplyFilters;
  onClearFilters: () => void;
  onOpenFilterSection: (section: DesktopFullFilterEntry) => void;
  onOpenFilters: () => void;
  onOpenMake: () => void;
  onOpenModel: () => void;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  query: string;
  searchListings?: readonly InventorySearchListing[];
  setQuery: (query: string) => void;
  showDealerDesktopLanding?: boolean;
  taxonomy?: VehicleTaxonomyMakeOption[];
  taxonomyByCategory?: Partial<
    Record<VehicleCategory, VehicleTaxonomyMakeOption[]>
  >;
  totalListings: number;
  variant?: "discovery" | "results";
  viewMode: ListingViewMode;
}

const getDiscoveryBandClassName = (isResults: boolean) =>
  isResults ? "bg-card" : "bg-control/70";

export const DesktopMarketplaceBar = ({
  appBaseUrl,
  assistantSlot,
  searchListings,
  showDealerDesktopLanding = false,
  categoryCounts,
  filterCount,
  filters,
  locale,
  onApply,
  onClearFilters,
  onOpenFilters,
  onOpenFilterSection,
  onOpenMake,
  onOpenModel,
  onViewModeChange,
  viewMode,
  query,
  setQuery,
  totalListings,
  taxonomy,
  taxonomyByCategory,
  variant = "discovery",
}: DesktopMarketplaceBarProps) => {
  const pathname = usePathname();
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const isResults = variant === "results";
  const frameClassName = isResults
    ? marketplaceContentFrameClassName
    : marketplaceDiscoveryFrameClassName;
  const headerBandClassName = getDiscoveryBandClassName(isResults);
  const quickFilterBandClassName = getDiscoveryBandClassName(isResults);
  const stickyHeaderClassName = getDiscoveryBandClassName(isResults);

  if (isDealershipSite) {
    const dealerToolbarProps = {
      onViewModeChange,
      viewMode,
      assistantSlot,
      categoryCounts,
      filterCount,
      filters,
      locale,
      onApply,
      onClearFilters,
      onOpenFilters,
      onOpenMake,
      onOpenModel,
      query,
      searchListings,
      setQuery,
      totalListings,
      taxonomy,
      taxonomyByCategory,
    };

    return (
      <DealerDesktopHeader
        activeMode={
          pathname === getLocalizedPublicPath(locale, "/") ? "home" : "buy"
        }
        layout="showroom"
        locale={locale}
      >
        {showDealerDesktopLanding ? (
          <DealerDesktopDiscoveryHero {...dealerToolbarProps} />
        ) : (
          <DealerDesktopToolbar
            filterCount={filterCount}
            filters={filters}
            locale={locale}
            onApply={onApply}
            onOpenFilters={() => onOpenFilterSection("vehicle")}
            onOpenSection={onOpenFilterSection}
            totalListings={totalListings}
          />
        )}
      </DealerDesktopHeader>
    );
  }

  return (
    <>
      <MarketplaceMasthead
        activeMode={filters.category === "lease" ? "lease" : "buy"}
        appBaseUrl={appBaseUrl}
        className={isResults ? "relative" : "bg-control/70"}
        contentFrameClassName={frameClassName}
        locale={locale}
        variant="discovery"
      />
      <div
        className={cn(
          "sticky top-0 z-40 hidden lg:block",
          stickyHeaderClassName
        )}
      >
        <div
          className={cn("relative", headerBandClassName)}
          data-slot="desktop-marketplace-header-band"
        >
          <div
            className={cn(
              "relative z-10",
              frameClassName,
              isResults ? "py-2" : "py-5"
            )}
          >
            <DesktopDiscoverySearch
              assistantSlot={assistantSlot}
              categoryCounts={categoryCounts}
              compact={isResults}
              filters={filters}
              isBg={isBg}
              locale={locale}
              onApply={onApply}
              query={query}
              searchListings={searchListings}
              setQuery={setQuery}
            />
          </div>
        </div>
        <div
          className={quickFilterBandClassName}
          data-slot="desktop-quick-filter-band"
        >
          <div className={frameClassName}>
            <DesktopQuickFilters
              compact
              elevated={!isResults}
              filterCount={filterCount}
              filters={filters}
              isBg={isBg}
              numberFormatter={numberFormatter}
              onApply={onApply}
              onClearFilters={onClearFilters}
              onOpenFilters={onOpenFilters}
              onOpenMake={onOpenMake}
              onOpenModel={onOpenModel}
            />
          </div>
        </div>
      </div>
    </>
  );
};
