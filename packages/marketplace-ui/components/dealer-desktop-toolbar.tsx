"use client";

import type { MarketplaceSearchParams } from "@repo/marketplace";
import { publicSite } from "@repo/marketplace/site-config";
import { getMarketplaceResultTitle } from "../lib/marketplace-results-toolbar-policy";
import { DealerDesktopHero } from "./dealer-desktop-hero";
import styles from "./dealer-desktop-toolbar.module.css";
import { DealerInventorySearch } from "./dealer-inventory-search";
import { DealerInventorySummary } from "./dealer-inventory-summary";
import type { DesktopFullFilterEntry } from "./desktop-full-filter-dialog";
export type DealerDesktopToolbarProps = {
  filters: MarketplaceSearchParams;
  locale?: string;
} & (
  | { loading: true; onOpenSection?: never }
  | {
      loading?: false;
      filterCount: number;
      totalListings: number;
      onApply: (updates: Partial<MarketplaceSearchParams>) => void;
      onOpenFilters: () => void;
      onOpenSection: (section: DesktopFullFilterEntry) => void;
    }
);

export const DealerDesktopToolbar = (props: DealerDesktopToolbarProps) => {
  const { filters, locale } = props;
  const openSection = (section: DesktopFullFilterEntry) => {
    if (!props.loading) {
      props.onOpenSection(section);
    }
  };
  return (
    <div className={styles.toolbar}>
      <div data-slot="dealer-desktop-inventory-hero">
        <DealerDesktopHero
          artwork={
            publicSite.artwork.desktopHeroScene ?? publicSite.artwork.heroScene
          }
          description={
            locale?.startsWith("bg")
              ? "Открийте автомобил. Запазете и сравнете избора си."
              : "Find your next car. Save your favourites and compare the details."
          }
          locale={locale}
          title={getMarketplaceResultTitle(filters, locale)}
          variant="inventory"
        >
          <div className={styles.content}>
            <DealerInventorySearch
              disabled={props.loading}
              filters={filters}
              locale={locale}
              onApply={props.loading ? undefined : props.onApply}
              onOpenSection={openSection}
            />
          </div>
        </DealerDesktopHero>
      </div>
      {!props.loading && (
        <DealerInventorySummary
          filterCount={props.filterCount}
          filters={filters}
          locale={locale}
          onApply={props.onApply}
          onOpenFilters={props.onOpenFilters}
          totalListings={props.totalListings}
        />
      )}
    </div>
  );
};
