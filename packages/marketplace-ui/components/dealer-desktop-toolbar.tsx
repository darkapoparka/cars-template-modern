"use client";

import {
  buildMarketplaceSearchHref,
  getCategoryPath,
  type MarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  withCategory,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { Bike, BusFront, CarFront, Truck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getLocalizedDesktopCategoryLabel } from "../lib/desktop-filter-policy";
import { marketplaceCategorySelectorOptions } from "../lib/marketplace-filter-config";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-desktop-toolbar.module.css";
import { DealerHeroSearch } from "./dealer-hero-search";
export interface DealerDesktopToolbarProps {
  assistantSlot?: ReactNode;
  filters: MarketplaceSearchParams;
  locale?: string;
  searchListings?: readonly InventorySearchListing[];
  taxonomy?: VehicleTaxonomyMakeOption[];
}

const categoryIcons = {
  car: CarFront,
  lease: CarFront,
  motorbike: Bike,
  truck: Truck,
  van: BusFront,
};

export const DealerDesktopToolbar = ({
  assistantSlot,
  searchListings,
  filters,
  locale,
  taxonomy,
}: DealerDesktopToolbarProps) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div className={styles.toolbar}>
      <div className={styles.content}>
        <DealerHeroSearch
          assistantSlot={assistantSlot}
          categoryTabs={marketplaceCategorySelectorOptions.map((category) => {
            const Icon = categoryIcons[category.id];
            return (
              <Link
                aria-current={
                  filters.category === category.id ? "page" : undefined
                }
                href={buildMarketplaceSearchHref(
                  withCategory(filters, category.id),
                  getLocalizedPublicPath(locale, getCategoryPath(category.id))
                )}
                key={category.id}
                onNavigate={(event) => {
                  if (filters.category === category.id) {
                    event.preventDefault();
                  }
                }}
                prefetch={true}
                scroll={false}
              >
                <Icon aria-hidden="true" size={18} />
                {getLocalizedDesktopCategoryLabel(category.id, isBg)}
              </Link>
            );
          })}
          filters={filters}
          key={JSON.stringify(filters)}
          locale={locale}
          searchListings={searchListings}
          taxonomy={taxonomy}
        />
      </div>
    </div>
  );
};
