import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  filterLabels,
  type MarketplaceSearchParams,
  sortOptions,
} from "@repo/marketplace";
import { ArrowUpDown } from "lucide-react";
import { marketplaceSortLabelsBg } from "../lib/marketplace-filter-config";
import { formatVehicleCount } from "../lib/marketplace-results-toolbar-policy";
import styles from "./dealer-inventory.module.css";

/** Results controls reuse the inventory URL state and full-filter draft. */
export function DealerInventorySummary({
  filters,
  locale,
  totalListings,
  onApply,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  totalListings: number;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const selectedSort = filters.sort ?? "recommended";
  const defaultSortLabel = isBg ? "Сортирай" : "Sort";
  const selectedSortLabel = isBg
    ? marketplaceSortLabelsBg[selectedSort]
    : filterLabels.sort[selectedSort];
  const sortTriggerLabel =
    selectedSort === "recommended" ? defaultSortLabel : selectedSortLabel;
  return (
    <div className={styles.summary} data-slot="dealer-inventory-summary">
      <output
        aria-live="polite"
        className={styles.resultCount}
        data-slot="dealer-inventory-count"
      >
        {formatVehicleCount(totalListings, filters.category, locale)}
      </output>
      <div className={styles.controls} data-slot="desktop-results-controls">
        <Select
          onValueChange={(sort) =>
            onApply({ sort: sort as MarketplaceSearchParams["sort"] })
          }
          value={selectedSort}
        >
          <SelectTrigger
            aria-label={isBg ? "Подреждане" : "Sort order"}
            className={styles.sort}
            title={sortTriggerLabel}
          >
            <ArrowUpDown
              aria-hidden="true"
              className={styles.controlIcon}
              size={18}
            />
            <SelectValue className={styles.sortValue}>
              <span className={styles.sortText}>{sortTriggerLabel}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end" className={styles.sortMenu} sideOffset={6}>
            {sortOptions.map((sort) => (
              <SelectItem className={styles.sortOption} key={sort} value={sort}>
                {isBg ? marketplaceSortLabelsBg[sort] : filterLabels.sort[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
