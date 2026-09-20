import {
  filterLabels,
  type ListingViewMode,
  type MarketplaceSearchParams,
  sortOptions,
} from "@repo/marketplace";
import { marketplaceSortLabelsBg } from "../lib/marketplace-filter-config";
import {
  formatVehicleCount,
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
  onViewModeChange,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  totalListings: number;
  viewMode: ListingViewMode;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onViewModeChange: (mode: ListingViewMode) => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div className={styles.summary} data-slot="dealer-inventory-summary">
      <div className={styles.heading}>
        <h1>{getMarketplaceResultTitle(filters, locale)}</h1>
        <output aria-live="polite" data-slot="dealer-inventory-count">
          {formatVehicleCount(totalListings, filters.category, locale)}
        </output>
      </div>
      <div className={styles.controls}>
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
        <MarketplaceViewModeToggle
          className={styles.viewToggle}
          locale={locale}
          onViewModeChange={onViewModeChange}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}
