import { Button } from "@repo/design-system/components/ui/button";
import {
  filterLabels,
  type ListingViewMode,
  type MarketplaceSearchParams,
  sortOptions,
} from "@repo/marketplace";
import { SlidersHorizontal } from "lucide-react";
import { marketplaceSortLabelsBg } from "../lib/marketplace-filter-config";
import {
  formatVehicleCount,
  getActiveFilterChips,
  getMarketplaceResultTitle,
} from "../lib/marketplace-results-toolbar-policy";
import styles from "./dealer-inventory.module.css";
import { MarketplaceViewModeToggle } from "./desktop-marketplace-controls";

/** The catalog owns results, sort and density. Home only introduces the stock. */
export function DealerInventorySummary({
  filters,
  locale,
  totalListings,
  viewMode,
  onApply,
  onOpenFilters,
  onViewModeChange,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  totalListings: number;
  viewMode: ListingViewMode;
  onOpenFilters: () => void;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onViewModeChange: (mode: ListingViewMode) => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div className={styles.summary} data-slot="dealer-inventory-summary">
      <div className={styles.heading}>
        <h2>{getMarketplaceResultTitle(filters, locale)}</h2>
        <output aria-live="polite" data-slot="dealer-inventory-count">
          {formatVehicleCount(totalListings, filters.category, locale)}
        </output>
      </div>
      <div className={styles.controls} data-slot="desktop-results-controls">
        <Button
          aria-haspopup="dialog"
          className={styles.filterButton}
          onClick={onOpenFilters}
          type="button"
          variant="outline"
        >
          <SlidersHorizontal aria-hidden="true" size={16} />
          {isBg ? "Филтри" : "Filters"}
          {getActiveFilterChips(filters, locale).length > 0
            ? ` (${getActiveFilterChips(filters, locale).length})`
            : ""}
        </Button>
        <label className={styles.sort}>
          <span>{isBg ? "Подреди по" : "Sort by"}</span>
          <select
            aria-label={isBg ? "Подреждане" : "Sort order"}
            onChange={(event) =>
              onApply({
                sort: event.target.value as MarketplaceSearchParams["sort"],
              })
            }
            value={filters.sort}
          >
            {sortOptions.map((sort) => (
              <option key={sort} value={sort}>
                {isBg ? marketplaceSortLabelsBg[sort] : filterLabels.sort[sort]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <MarketplaceViewModeToggle
        className={styles.viewToggle}
        locale={locale}
        onViewModeChange={onViewModeChange}
        viewMode={viewMode}
      />
    </div>
  );
}
