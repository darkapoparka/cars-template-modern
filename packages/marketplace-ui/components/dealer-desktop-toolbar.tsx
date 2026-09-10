"use client";

import { Dialog } from "@repo/design-system/components/ui/dialog";
import type { MarketplaceSearchParams } from "@repo/marketplace";
import { Bike, BusFront, CarFront, Search, Truck } from "lucide-react";
import { type ReactNode, useState } from "react";
import {
  type DesktopCategoryInventoryCount,
  DesktopCategoryPickerContent,
  DesktopCategoryPickerTrigger,
} from "./desktop-discovery-search";
import { DesktopQuickFilters } from "./desktop-quick-filters";
import { DesktopSearchAssistant } from "./desktop-search-assistant";

export const DealerDesktopToolbar = ({
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
  setQuery,
}: {
  assistantSlot?: ReactNode;
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

  return (
    <div className="dealer-desktop-toolbar hidden lg:block">
      <div className="dealer-desktop-search-band">
        <div className="dealer-desktop-query-row">
          <Dialog onOpenChange={setCategoryOpen} open={categoryOpen}>
            <DesktopCategoryPickerTrigger
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
          <div className="dealer-desktop-search">
            <Search
              aria-hidden="true"
              className="dealer-desktop-search-icon"
              size={19}
            />
            <DesktopSearchAssistant
              ariaLabel={isBg ? "Търсене на автомобили" : "Search vehicles"}
              assistantSlot={assistantSlot}
              compact
              isBg={isBg}
              label={isBg ? "Търсене" : "Search"}
              locale={locale}
              onQueryChange={setQuery}
              onSearch={(q) => onApply({ q })}
              placeholder={
                isBg
                  ? "Търсете по марка, модел или ключова дума…"
                  : "Search by make, model or keyword…"
              }
              query={query}
              scope="vehicles"
            />
            <span aria-hidden="true" className="dealer-desktop-search-hint">
              Enter ↵
            </span>
          </div>
        </div>
      </div>
      <div className="dealer-desktop-filters">
        <DesktopQuickFilters
          compact
          filterCount={filterCount}
          filters={filters}
          isBg={isBg}
          numberFormatter={new Intl.NumberFormat(isBg ? "bg-BG" : "en-US")}
          onApply={onApply}
          onClearFilters={onClearFilters}
          onOpenFilters={onOpenFilters}
          onOpenMake={onOpenMake}
          onOpenModel={onOpenModel}
          showAdditionalFilters
        />
      </div>
    </div>
  );
};
