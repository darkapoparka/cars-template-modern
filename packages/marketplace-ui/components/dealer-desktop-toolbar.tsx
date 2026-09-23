"use client";

import type {
  ListingViewMode,
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { LayoutGrid, List } from "lucide-react";
import type { ReactNode } from "react";
import { formatVehicleCount } from "../lib/marketplace-results-toolbar-policy";
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
  totalListings = 0,
  viewMode = "grid",
  onViewModeChange,
}: DealerDesktopToolbarProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const ViewIcon = viewMode === "list" ? List : LayoutGrid;
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
            resultCountSlot={
              <output aria-live="polite" data-slot="dealer-inventory-count">
                {formatVehicleCount(totalListings, filters.category, locale)}
              </output>
            }
            searchListings={searchListings}
            taxonomy={taxonomy}
            viewModeSlot={
              <label>
                <ViewIcon aria-hidden="true" data-view-icon size={16} />
                <select
                  aria-label={isBg ? "Изглед на обявите" : "Vehicle view"}
                  onChange={(event) =>
                    onViewModeChange?.(event.target.value as ListingViewMode)
                  }
                  title={isBg ? "Изглед на обявите" : "Vehicle view"}
                  value={viewMode}
                >
                  <option value="grid">{isBg ? "Решетка" : "Grid view"}</option>
                  <option value="list">{isBg ? "Списък" : "List view"}</option>
                </select>
              </label>
            }
          />
        </div>
      </DealerDesktopHero>
    </div>
  );
};
