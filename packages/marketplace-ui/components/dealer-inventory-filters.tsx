import type { MarketplaceSearchParams } from "@repo/marketplace";
import styles from "./dealer-inventory.module.css";
import { DesktopQuickFilters } from "./desktop-quick-filters";

/** Desktop catalog filters reuse the same URL state and accessible dialogs. */
export function DealerInventoryFilters({
  filters,
  locale,
  filterCount,
  onApply,
  onClearFilters,
  onOpenFilters,
  onOpenMake,
  onOpenModel,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  filterCount: number;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onOpenMake: () => void;
  onOpenModel: () => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <section
      aria-label={isBg ? "Филтри за автомобили" : "Vehicle filters"}
      className={styles.filterBar}
    >
      <DesktopQuickFilters
        appearance="inverse"
        compact
        filterCount={filterCount}
        filters={filters}
        isBg={isBg}
        layout="toolbar"
        numberFormatter={new Intl.NumberFormat(isBg ? "bg-BG" : "en-US")}
        onApply={onApply}
        onClearFilters={onClearFilters}
        onOpenFilters={onOpenFilters}
        onOpenMake={onOpenMake}
        onOpenModel={onOpenModel}
        showSort={false}
      />
    </section>
  );
}
