"use client";

import { cn } from "@repo/design-system/lib/utils";
import type {
  ListingViewMode,
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { isDealershipSite } from "@repo/marketplace/site-config";
import { type ReactNode, useState } from "react";
import {
  marketplaceContentFrameClassName,
  marketplaceDiscoveryFrameClassName,
} from "../lib/marketplace-layout";
import { DealerDesktopDiscoveryHero } from "./dealer-desktop-discovery-hero";
import { DealerDesktopHeader } from "./dealer-desktop-header";
import { DealerDesktopToolbar } from "./dealer-desktop-toolbar";
import type { DesktopCategoryInventoryCount } from "./desktop-discovery-search";
import {
  DesktopLeadServiceSurface,
  DesktopServiceShortcuts,
  getLeadMastheadMode,
  LeadSiteSearchCutouts,
} from "./desktop-lead-services";
import { DesktopQuickFilters } from "./desktop-quick-filters";
import {
  MarketplaceMasthead,
  type MarketplaceMode,
} from "./marketplace-masthead";

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
  onOpenFilters: () => void;
  onOpenMake: () => void;
  onOpenModel: () => void;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  query: string;
  searchListings?: readonly InventorySearchListing[];
  setQuery: (query: string) => void;
  showDealerDesktopLanding?: boolean;
  taxonomy?: VehicleTaxonomyMakeOption[];
  totalListings: number;
  variant?: "discovery" | "results";
  viewMode: ListingViewMode;
}

const leadSiteDiscoveryControlsBannerStyle = {
  backgroundColor: "#030303",
  backgroundImage:
    "radial-gradient(circle at 50% -75%, rgba(255, 255, 255, 0.12), transparent 58%)",
} as const;

const getDiscoveryBandClassName = (
  isResults: boolean,
  transparentForLeadSite = false
) => {
  if (isDealershipSite) {
    return transparentForLeadSite ? "bg-transparent" : "bg-black";
  }
  return isResults ? "bg-card" : "bg-control/70";
};

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
  onOpenMake,
  onOpenModel,
  query,
  setQuery,
  totalListings,
  taxonomy,
  variant = "discovery",
}: DesktopMarketplaceBarProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const isResults = variant === "results";
  const frameClassName = isResults
    ? marketplaceContentFrameClassName
    : marketplaceDiscoveryFrameClassName;
  const headerBandClassName = getDiscoveryBandClassName(isResults, true);
  const quickFilterBandClassName =
    isDealershipSite && !isResults
      ? "bg-background"
      : getDiscoveryBandClassName(isResults, true);
  const stickyHeaderClassName = getDiscoveryBandClassName(isResults);
  const interactiveLeadSwitcher = isDealershipSite && !isResults;
  const [leadServiceMode, setLeadServiceMode] =
    useState<MarketplaceMode>("buy");
  const mastheadMode = getLeadMastheadMode({
    category: filters.category,
    interactive: interactiveLeadSwitcher,
    serviceMode: leadServiceMode,
  });

  if (isDealershipSite) {
    const dealerToolbarProps = {
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
    };

    return (
      <DealerDesktopHeader
        activeMode={showDealerDesktopLanding ? "home" : "buy"}
        layout="showroom"
        locale={locale}
      >
        {showDealerDesktopLanding ? (
          <DealerDesktopDiscoveryHero {...dealerToolbarProps} />
        ) : (
          <DealerDesktopToolbar {...dealerToolbarProps} />
        )}
      </DealerDesktopHeader>
    );
  }

  return (
    <>
      <MarketplaceMasthead
        activeMode={mastheadMode}
        appBaseUrl={appBaseUrl}
        className={isResults ? "relative" : "bg-control/70"}
        contentFrameClassName={frameClassName}
        locale={locale}
        onModeChange={interactiveLeadSwitcher ? setLeadServiceMode : undefined}
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
          style={
            isDealershipSite ? leadSiteDiscoveryControlsBannerStyle : undefined
          }
        >
          {isDealershipSite && !isResults ? <LeadSiteSearchCutouts /> : null}
          <div
            className={cn(
              "relative z-10",
              frameClassName,
              isResults ? "py-2" : "py-5"
            )}
          >
            <DesktopLeadServiceSurface
              assistantSlot={assistantSlot}
              categoryCounts={categoryCounts}
              compact={isResults}
              filters={filters}
              interactive={interactiveLeadSwitcher}
              isBg={isBg}
              locale={locale}
              onApply={onApply}
              query={query}
              searchListings={searchListings}
              serviceMode={leadServiceMode}
              setQuery={setQuery}
            />
          </div>
        </div>
        {interactiveLeadSwitcher && leadServiceMode !== "buy" ? (
          <div
            className={quickFilterBandClassName}
            data-slot="desktop-service-shortcut-band"
          >
            <div className={frameClassName}>
              <DesktopServiceShortcuts
                isBg={isBg}
                locale={locale}
                mode={leadServiceMode}
              />
            </div>
          </div>
        ) : (
          <div
            className={quickFilterBandClassName}
            data-slot="desktop-quick-filter-band"
          >
            <div className={frameClassName}>
              <DesktopQuickFilters
                compact
                elevated={!(isResults || isDealershipSite)}
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
        )}
      </div>
    </>
  );
};
