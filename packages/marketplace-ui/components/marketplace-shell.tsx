"use client";

import {
  buildMarketplaceSearchHref,
  fallbackVehicleTaxonomy,
  type ListingViewMode,
  leadSite,
  type MarketplaceSearchParams,
  mockListings,
  type QuickFilterKey,
  type VehicleCategory,
  type VehicleListing,
  type VehicleTaxonomyMakeOption,
  withSearchParamUpdates,
} from "@repo/marketplace";
import { usePathname, useRouter } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useMarketplaceOverlayCoordinator } from "../hooks/use-marketplace-overlay-coordinator";
import {
  useMarketplaceListingViewMode,
  useMobileCompactMarketplaceHeader,
} from "../hooks/use-marketplace-shell-state";
import {
  getMarketplaceControlCopy,
  isBulgarianMarketplaceLocale,
} from "../lib/marketplace-control-copy";
import {
  cleanMarketplaceBaseUrl,
  getMarketplaceCurrentPath,
  getMarketplaceMobileDiscoverySummary,
  getMarketplaceQuickFilterLabel,
} from "../lib/marketplace-filter-policy";
import type { MarketplaceModelInventoryCount } from "../lib/model-picker-options";
import { BottomMarketplaceNav } from "./dealer-bottom-nav";
import { DesktopMarketplaceBar } from "./desktop-discovery-bar";
import { getActiveFilterChips } from "./desktop-marketplace-controls";
import { MarketplaceCategoryPicker } from "./marketplace-category-picker";
import { MarketplaceFullFilterOverlay } from "./marketplace-full-filter-overlay";
import { MarketplaceMakeModelPicker } from "./marketplace-model-picker";
import { MarketplaceQuickFilterDrawer } from "./marketplace-quick-filter-drawer";
import { MarketplaceResults } from "./marketplace-results";
import {
  MobileCompactSearchHeader,
  MobileDealerDiscoveryHeader,
  MobileDealerQuickFilters,
} from "./mobile-dealer-discovery-header";
import { MobileInventorySearch } from "./mobile-inventory-search";

export { DealerBottomNav } from "./dealer-bottom-nav";

interface MarketplaceShellProps {
  appBaseUrl?: string;
  assistantSlot?: ReactNode;
  basePath?: string;
  defaultViewMode?: ListingViewMode;
  desktopSearchVariant?: "discovery" | "results";
  filters: MarketplaceSearchParams;
  inventoryFacets?: {
    categoryCounts?: {
      category: VehicleCategory;
      count: number;
    }[];
    modelCounts: MarketplaceModelInventoryCount[];
    status: "exact";
  };
  listings: VehicleListing[];
  locale?: string;
  taxonomy?: VehicleTaxonomyMakeOption[];
  totalListings: number;
}

const mobileMarketplaceHeaderClassName = "relative z-30 bg-white lg:hidden";

const getCanonicalAppliedSearchLabel = (
  query: string | undefined,
  taxonomy: readonly VehicleTaxonomyMakeOption[]
) => {
  const normalizedQuery = query?.trim();

  if (!normalizedQuery) {
    return;
  }

  const canonicalMatch = taxonomy
    .flatMap((make) => [
      make.name,
      ...make.models.flatMap((model) => [
        model.name,
        `${make.name} ${model.name}`,
      ]),
    ])
    .find(
      (label) =>
        label.localeCompare(normalizedQuery, undefined, {
          sensitivity: "base",
        }) === 0
    );

  return canonicalMatch ?? normalizedQuery;
};

export const MarketplaceShell = ({
  assistantSlot,
  appBaseUrl,
  basePath,
  desktopSearchVariant = "discovery",
  defaultViewMode = "list",
  filters: initialFilters,
  inventoryFacets,
  listings,
  locale,
  taxonomy = fallbackVehicleTaxonomy,
  totalListings,
}: MarketplaceShellProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState(initialFilters);
  const filtersRef = useRef(initialFilters);
  const [query, setQuery] = useState(initialFilters.q ?? "");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [makeModelOpen, setMakeModelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [makeModelInitialStep, setMakeModelInitialStep] = useState<
    "auto" | "make" | "model"
  >("auto");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] =
    useState<QuickFilterKey | null>(null);
  const [isNavigating, startTransition] = useTransition();
  const [viewMode, changeViewMode] =
    useMarketplaceListingViewMode(defaultViewMode);
  const [mobileCompactHeaderVisible, mobileHeaderSentinelRef] =
    useMobileCompactMarketplaceHeader();

  useEffect(() => {
    filtersRef.current = initialFilters;
    setFilters(initialFilters);
    setQuery(initialFilters.q ?? "");
  }, [initialFilters]);

  const currentPath = getMarketplaceCurrentPath({ basePath, locale, pathname });
  const commitFilters = (updates: Partial<MarketplaceSearchParams>) => {
    const next = withSearchParamUpdates(filtersRef.current, updates);
    const href = buildMarketplaceSearchHref(next, currentPath);

    filtersRef.current = next;
    setFilters(next);
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  const appUrl = leadSite.staticDemoMode
    ? ""
    : cleanMarketplaceBaseUrl(appBaseUrl);
  const activeFilterChips = getActiveFilterChips(filters, locale);
  const structuredFilterCount = activeFilterChips.filter(
    (chip) => chip.id !== "q"
  ).length;
  const mobileConditionFilterCount = activeFilterChips.filter(
    (chip) =>
      chip.id !== "category" && chip.id !== "make-model" && chip.id !== "q"
  ).length;
  const isBg = isBulgarianMarketplaceLocale(locale);
  const copy = getMarketplaceControlCopy(locale);
  const discoverySummary = getMarketplaceMobileDiscoverySummary(
    filters,
    locale,
    copy.categories[filters.category].label
  );
  const clearFilters = () => {
    const updates = activeFilterChips.reduce<Partial<MarketplaceSearchParams>>(
      (currentUpdates, chip) => Object.assign(currentUpdates, chip.updates),
      {}
    );
    commitFilters(updates);
  };

  const marketplaceOverlayOpen =
    categoryOpen ||
    makeModelOpen ||
    searchOpen ||
    filterOpen ||
    activeQuickFilter !== null;
  const coordinateMarketplaceOverlay = useMarketplaceOverlayCoordinator(
    marketplaceOverlayOpen
  );
  const openMarketplaceOverlay = (openOverlay: () => void) => {
    coordinateMarketplaceOverlay(() => {
      setCategoryOpen(false);
      setMakeModelOpen(false);
      setSearchOpen(false);
      setFilterOpen(false);
      setActiveQuickFilter(null);
      openOverlay();
    });
  };

  const appliedSearchLabel = getCanonicalAppliedSearchLabel(
    filters.q,
    taxonomy
  );
  const mobileConditionQuickFilterItems = (
    ["price", "year", "mileage", "fuel", "transmission"] as const
  )
    .map((id) => {
      const activeChip = activeFilterChips.find((chip) => chip.id === id);
      const label = getMarketplaceQuickFilterLabel(id, filters, locale);
      let clearLabel: string | undefined;

      if (activeChip) {
        clearLabel = isBg
          ? `Премахни филтъра ${label}`
          : `Remove ${label} filter`;
      }

      return {
        active: Boolean(activeChip),
        clearLabel,
        id,
        label,
        onClick: activeChip
          ? () => commitFilters({ ...activeChip.updates, page: 1 })
          : () => openMarketplaceOverlay(() => setActiveQuickFilter(id)),
      };
    })
    .sort(
      (firstItem, secondItem) =>
        Number(secondItem.active) - Number(firstItem.active)
    );
  const mobileQuickFilterItems = [
    ...(appliedSearchLabel
      ? [
          {
            active: true,
            clearLabel: isBg
              ? `Премахни филтъра ${appliedSearchLabel}`
              : `Remove ${appliedSearchLabel} filter`,
            id: "search-query",
            label: appliedSearchLabel,
            onClick: () => {
              setQuery("");
              commitFilters({ page: 1, q: undefined });
            },
          },
        ]
      : []),
    ...mobileConditionQuickFilterItems,
  ];

  return (
    <>
      <a
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-lg bg-foreground px-4 py-3 font-semibold text-background shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        href="#main-content"
      >
        {isBg ? "Към основното съдържание" : "Skip to main content"}
      </a>
      <main
        aria-busy={isNavigating}
        className="min-h-[100dvh] bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] text-foreground lg:pb-0"
        data-slot="marketplace-main"
        id="main-content"
        tabIndex={-1}
      >
        {isNavigating ? (
          <p aria-live="polite" className="sr-only">
            {isBg ? "Зареждат се обявите…" : "Loading listings…"}
          </p>
        ) : null}

        <div className={mobileMarketplaceHeaderClassName}>
          <MobileDealerDiscoveryHeader
            category={filters.category}
            categoryLabel={copy.categoryDrawer.triggerLabel}
            discoverySummary={discoverySummary}
            filterCount={mobileConditionFilterCount}
            isBg={isBg}
            locale={locale}
            makeModelLabel={getMarketplaceQuickFilterLabel(
              "make-model",
              filters,
              locale
            )}
            onOpenCategory={() =>
              openMarketplaceOverlay(() => setCategoryOpen(true))
            }
            onOpenFilters={() =>
              openMarketplaceOverlay(() => setFilterOpen(true))
            }
            onOpenSearch={() =>
              openMarketplaceOverlay(() => setSearchOpen(true))
            }
            totalListings={totalListings}
          />
          <MobileDealerQuickFilters items={mobileQuickFilterItems} />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-px w-px lg:hidden"
          ref={mobileHeaderSentinelRef}
        />
        <MobileCompactSearchHeader
          category={filters.category}
          categoryLabel={copy.categoryDrawer.triggerLabel}
          discoverySummary={discoverySummary}
          filterCount={mobileConditionFilterCount}
          isBg={isBg}
          makeModelLabel={getMarketplaceQuickFilterLabel(
            "make-model",
            filters,
            locale
          )}
          onOpenCategory={() =>
            openMarketplaceOverlay(() => setCategoryOpen(true))
          }
          onOpenFilters={() =>
            openMarketplaceOverlay(() => setFilterOpen(true))
          }
          onOpenSearch={() => openMarketplaceOverlay(() => setSearchOpen(true))}
          totalListings={totalListings}
          visible={mobileCompactHeaderVisible}
        />

        <DesktopMarketplaceBar
          appBaseUrl={appUrl}
          assistantSlot={assistantSlot}
          categoryCounts={inventoryFacets?.categoryCounts}
          filterCount={structuredFilterCount}
          filters={filters}
          locale={locale}
          onApply={commitFilters}
          onClearFilters={clearFilters}
          onOpenFilters={() =>
            openMarketplaceOverlay(() => setFilterOpen(true))
          }
          onOpenMake={() =>
            openMarketplaceOverlay(() => {
              setMakeModelInitialStep("make");
              setMakeModelOpen(true);
            })
          }
          onOpenModel={() =>
            openMarketplaceOverlay(() => {
              setMakeModelInitialStep("model");
              setMakeModelOpen(true);
            })
          }
          onViewModeChange={changeViewMode}
          query={query}
          setQuery={setQuery}
          variant={desktopSearchVariant}
          viewMode={viewMode}
        />

        <MarketplaceResults
          activeFilterCount={activeFilterChips.length}
          appBaseUrl={appUrl}
          currentPath={currentPath}
          desktopSearchVariant={desktopSearchVariant}
          filters={filters}
          isBg={isBg}
          listings={listings}
          locale={locale}
          onChooseCategory={() =>
            openMarketplaceOverlay(() => setCategoryOpen(true))
          }
          onOpenFilters={() =>
            openMarketplaceOverlay(() => setFilterOpen(true))
          }
          onViewModeChange={changeViewMode}
          totalListings={totalListings}
          viewMode={viewMode}
        />

        {marketplaceOverlayOpen ? null : (
          <BottomMarketplaceNav
            appBaseUrl={appUrl}
            filters={filters}
            locale={locale}
          />
        )}

        <MarketplaceCategoryPicker
          filters={filters}
          locale={locale}
          onOpenChange={setCategoryOpen}
          open={categoryOpen}
        />
        <MarketplaceMakeModelPicker
          filters={filters}
          initialStep={makeModelInitialStep}
          locale={locale}
          modelCounts={
            inventoryFacets?.status === "exact"
              ? inventoryFacets.modelCounts
              : undefined
          }
          onApply={commitFilters}
          onOpenChange={setMakeModelOpen}
          open={makeModelOpen}
          taxonomy={taxonomy}
        />
        <MobileInventorySearch
          isBg={isBg}
          listings={
            leadSite.staticDemoMode
              ? mockListings.filter(
                  (listing) => listing.category === filters.category
                )
              : listings
          }
          locale={locale}
          onOpenChange={setSearchOpen}
          onSearch={(nextQuery) => {
            setQuery(nextQuery);
            commitFilters({ page: 1, q: nextQuery });
          }}
          onSelectMake={(make) => {
            setQuery("");
            commitFilters({
              derivative: undefined,
              make,
              model: undefined,
              page: 1,
              q: undefined,
            });
          }}
          onSelectModel={(make, model) => {
            setQuery("");
            commitFilters({
              derivative: undefined,
              make,
              model,
              page: 1,
              q: undefined,
            });
          }}
          open={searchOpen}
          query={query}
        />
        <MarketplaceFullFilterOverlay
          filters={filters}
          locale={locale}
          onApply={commitFilters}
          onOpenChange={setFilterOpen}
          open={filterOpen}
          taxonomy={taxonomy}
        />
        <MarketplaceQuickFilterDrawer
          activeFilter={activeQuickFilter}
          filters={filters}
          locale={locale}
          onApply={commitFilters}
          onClose={() => setActiveQuickFilter(null)}
        />
      </main>
    </>
  );
};
