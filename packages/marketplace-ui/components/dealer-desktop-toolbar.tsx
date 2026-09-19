"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Dialog } from "@repo/design-system/components/ui/dialog";
import type { MarketplaceSearchParams } from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import {
  ArrowRight,
  Bike,
  BusFront,
  CarFront,
  Search,
  Truck,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import styles from "./dealer-desktop-toolbar.module.css";
import {
  type DesktopCategoryInventoryCount,
  DesktopCategoryPickerContent,
  DesktopCategoryPickerTrigger,
} from "./desktop-discovery-search";
import { DesktopQuickFilters } from "./desktop-quick-filters";
import {
  DesktopSearchAssistant,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-assistant";

export const DealerDesktopToolbar = ({
  assistantSlot,
  searchListings,
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
  variant = "default",
}: {
  assistantSlot?: ReactNode;
  searchListings?: readonly InventorySearchListing[];
  categoryCounts?: DesktopCategoryInventoryCount[];
  filterCount: number;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onOpenMake: () => void;
  onOpenModel: () => void;
  query: string;
  setQuery: (query: string) => void;
  totalListings: number;
  variant?: "default" | "hero";
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const [categoryOpen, setCategoryOpen] = useState(false);
  const CategoryIcon = {
    car: CarFront,
    lease: CarFront,
    motorbike: Bike,
    truck: Truck,
    van: BusFront,
  }[filters.category];

  const isHero = variant === "hero";
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const submitSearch = (value: string) => {
    const q = value.trim();
    if (q) {
      rememberMarketplaceSearchQuery(q, "vehicles");
      onApply({ q });
    } else {
      // An empty hero search opens the complete inventory, rather than reloading the landing.
      onApply({ q: undefined, sort: "newest" });
    }
  };

  const searchLabel = isBg ? "Търси автомобили" : "Search cars";
  const browseLabel = isBg
    ? `Виж всички ${numberFormatter.format(totalListings)} автомобила`
    : `View all ${numberFormatter.format(totalListings)} cars`;

  return (
    <form
      aria-label={isBg ? "Търсене на автомобили" : "Vehicle search"}
      className={styles.toolbar}
      data-slot="dealer-desktop-toolbar"
      data-variant={variant}
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch(query);
      }}
    >
      <div className="dealer-desktop-search-band">
        <div className={styles.queryRow}>
          <Dialog onOpenChange={setCategoryOpen} open={categoryOpen}>
            <DesktopCategoryPickerTrigger
              appearance={isHero ? "hero" : "toolbar"}
              categoryIcon={
                <CategoryIcon
                  aria-hidden="true"
                  className="size-6 shrink-0"
                  strokeWidth={1.7}
                />
              }
              compact
              filters={filters}
              isBg={isBg}
              open={categoryOpen}
            />
            <DesktopCategoryPickerContent
              categoryCounts={categoryCounts}
              filters={filters}
              isBg={isBg}
              locale={locale}
              onClose={() => setCategoryOpen(false)}
            />
          </Dialog>
          <div className={isHero ? styles.heroQuery : styles.search}>
            {!isHero && (
              <Search
                aria-hidden="true"
                className={styles.searchIcon}
                size={19}
              />
            )}
            <DesktopSearchAssistant
              appearance={isHero ? "hero" : "toolbar"}
              ariaLabel={isBg ? "Търсене на автомобили" : "Search vehicles"}
              assistantSlot={assistantSlot}
              compact
              isBg={isBg}
              label={isBg ? "Търсене" : "Search"}
              listings={searchListings}
              locale={locale}
              onQueryChange={setQuery}
              onSearch={submitSearch}
              placeholder={
                isBg
                  ? "Марка, модел или ключова дума"
                  : "Make, model or keyword"
              }
              query={query}
              scope="vehicles"
            />
            {!isHero && (
              <span aria-hidden="true" className={styles.searchHint}>
                Enter ↵
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={styles.filters}>
        <DesktopQuickFilters
          compact
          filterCount={filterCount}
          filters={filters}
          isBg={isBg}
          layout={isHero ? "hero" : "toolbar"}
          numberFormatter={numberFormatter}
          onApply={onApply}
          onClearFilters={onClearFilters}
          onOpenFilters={onOpenFilters}
          onOpenMake={onOpenMake}
          onOpenModel={onOpenModel}
          showAdditionalFilters
        />
      </div>
      {isHero && (
        <Button
          className={styles.submit}
          data-slot="desktop-hero-submit"
          type="submit"
        >
          {query.trim() ? searchLabel : browseLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      )}
    </form>
  );
};
