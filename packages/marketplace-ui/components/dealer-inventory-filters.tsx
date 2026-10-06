import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import type {
  ListingViewMode,
  MarketplaceSearchParams,
} from "@repo/marketplace";
import type { PublicInventoryFilterLayout } from "@repo/marketplace/inventory-presentation";
import { publicSite } from "@repo/marketplace/site-config";
import {
  LayoutGrid,
  LayoutTemplate,
  List,
  PanelLeft,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { getActiveFilterChips } from "../lib/marketplace-results-toolbar-policy";
import styles from "./dealer-inventory.module.css";

/** Applied filters and display preferences remain separate from banner search. */
export function DealerInventoryFilters({
  filters,
  locale,
  layout,
  onLayoutChange,
  onApply,
  onClearFilters,
  onViewModeChange,
  viewMode,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  layout: PublicInventoryFilterLayout;
  onLayoutChange: (layout: PublicInventoryFilterLayout) => void;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onClearFilters: () => void;
  onViewModeChange: (viewMode: ListingViewMode) => void;
  viewMode: ListingViewMode;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div
      className={styles.filterBar}
      data-filter-layout={layout}
      data-slot="dealer-inventory-filters"
    >
      <div className={styles.displayControls}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={
                isBg ? "Изглед на автомобилите" : "Vehicle view options"
              }
              className={styles.previewTrigger}
              data-slot="dealer-inventory-preview"
              type="button"
            >
              <LayoutTemplate aria-hidden="true" size={18} />
              <span>{isBg ? "Изглед" : "View"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={styles.previewMenu}
            side="top"
            sideOffset={8}
          >
            <DropdownMenuLabel>
              {isBg ? "Подредба на автомобилите" : "Vehicle layout"}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              aria-label={isBg ? "Подредба на автомобилите" : "Vehicle layout"}
              onValueChange={(value) => {
                if (value === "grid" || value === "list") {
                  onViewModeChange(value);
                }
              }}
              value={viewMode}
            >
              <DropdownMenuRadioItem value="grid">
                <LayoutGrid aria-hidden="true" size={16} />
                {isBg ? "Изглед в решетка" : "Grid view"}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="list">
                <List aria-hidden="true" size={16} />
                {isBg ? "Списъчен изглед" : "List view"}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {publicSite.identity.desktopPreview && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  {isBg ? "Изглед на филтрите" : "Filter layout"}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  aria-label={isBg ? "Изглед на филтрите" : "Filter layout"}
                  onValueChange={(value) => {
                    if (value === "quick" || value === "sidebar") {
                      onLayoutChange(value);
                    }
                  }}
                  value={layout}
                >
                  <DropdownMenuRadioItem value="quick">
                    <SlidersHorizontal aria-hidden="true" size={16} />
                    {isBg ? "Бързи филтри" : "Quick filters"}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sidebar">
                    <PanelLeft aria-hidden="true" size={16} />
                    {isBg ? "Страничен панел" : "Sidebar"}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <DealerInventoryAppliedFilters
        filters={filters}
        isBg={isBg}
        locale={locale}
        onApply={onApply}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}

function DealerInventoryAppliedFilters({
  filters,
  isBg,
  locale,
  onApply,
  onClearFilters,
}: {
  filters: MarketplaceSearchParams;
  isBg: boolean;
  locale?: string;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  onClearFilters: () => void;
}) {
  const chips = getActiveFilterChips(filters, locale);
  if (chips.length === 0) {
    return null;
  }
  return (
    <fieldset
      aria-label={isBg ? "Приложени филтри" : "Applied filters"}
      className={styles.activeFilters}
    >
      {chips.map((chip) => (
        <button
          aria-label={`${isBg ? "Премахни" : "Remove"}: ${chip.label}`}
          className={styles.activeFilter}
          data-filter-id={chip.id}
          data-slot="dealer-inventory-active-filter"
          key={chip.id}
          onClick={() => onApply(chip.updates)}
          type="button"
        >
          <span>{chip.label}</span>
          <X aria-hidden="true" size={14} />
        </button>
      ))}
      <button
        className={styles.clearFilters}
        data-slot="desktop-clear-all-filters"
        onClick={onClearFilters}
        type="button"
      >
        {isBg ? "Изчисти всички" : "Clear all"}
      </button>
    </fieldset>
  );
}
