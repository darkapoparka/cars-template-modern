"use client";

import type {
  ListingViewMode,
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import type { ReactNode } from "react";
import { DealerDesktopHero } from "./dealer-desktop-hero";
import styles from "./dealer-desktop-toolbar.module.css";
import { DealerHeroSearch } from "./dealer-hero-search";
export interface DealerDesktopToolbarProps {
  assistantSlot?: ReactNode;
  filters: MarketplaceSearchParams;
  locale?: string;
  onViewModeChange?: (mode: ListingViewMode) => void;
  searchListings?: readonly InventorySearchListing[];
  taxonomy?: VehicleTaxonomyMakeOption[];
  totalListings?: number;
  viewMode?: ListingViewMode;
}

export const DealerDesktopToolbar = ({
  assistantSlot,
  searchListings,
  filters,
  locale,
  taxonomy,
}: DealerDesktopToolbarProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div className={styles.toolbar} data-slot="dealer-desktop-inventory-hero">
      <DealerDesktopHero
        title={isBg ? "Автомобили в наличност" : "Vehicles in stock"}
        variant="landing"
      >
        <div className={styles.content}>
          <DealerHeroSearch
            assistantSlot={assistantSlot}
            filters={filters}
            key={JSON.stringify(filters)}
            locale={locale}
            searchListings={searchListings}
            taxonomy={taxonomy}
          />
        </div>
      </DealerDesktopHero>
    </div>
  );
};
