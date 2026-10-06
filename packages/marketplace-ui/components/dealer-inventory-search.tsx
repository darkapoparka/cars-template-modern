import { Button } from "@repo/design-system/components/ui/button";
import { type MarketplaceSearchParams, withCategory } from "@repo/marketplace";
import { ChevronDown, Search } from "lucide-react";
import type { MouseEvent } from "react";
import { getDesktopPriceQuickFilterLabel } from "../lib/desktop-filter-policy";
import searchStyles from "./dealer-hero-search.module.css";
import styles from "./dealer-inventory-search.module.css";
import { DealerVehicleTypePills } from "./dealer-vehicle-type-pills";
import type { DesktopFullFilterEntry } from "./desktop-full-filter-dialog";

function openFromButton(
  event: MouseEvent<HTMLButtonElement>,
  onOpen: () => void
) {
  // Safari does not focus pointer-clicked buttons; the dialog needs a return target.
  event.currentTarget.focus({ preventScroll: true });
  onOpen();
}

function SearchField({
  active,
  disabled,
  label,
  onOpen,
  value,
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  onOpen: () => void;
  value: string;
}) {
  return (
    <div className={searchStyles.filterField}>
      <Button
        aria-haspopup="dialog"
        aria-label={label}
        aria-pressed={active}
        className={searchStyles.field}
        data-slot="dealer-inventory-search-field"
        disabled={disabled}
        onClick={(event) => openFromButton(event, onOpen)}
        title={value}
        type="button"
        variant="ghost"
      >
        <span>{value}</span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}

/** Home's search styling with the inventory's existing filter controller. */
export function DealerInventorySearch({
  disabled = false,
  filters,
  locale,
  onApply,
  onOpenSection,
}: {
  disabled?: boolean;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply?: (updates: Partial<MarketplaceSearchParams>) => void;
  onOpenSection: (section: DesktopFullFilterEntry) => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const category = filters.category === "lease" ? "car" : filters.category;
  const hasPrice =
    filters.priceMin !== undefined || filters.priceMax !== undefined;
  const price = hasPrice
    ? getDesktopPriceQuickFilterLabel(
        filters,
        isBg,
        new Intl.NumberFormat(isBg ? "bg-BG" : "en-US")
      )
    : text("Всяка цена", "Any Price");

  return (
    <div
      className={styles.controls}
      data-slot="dealer-inventory-search-controls"
    >
      <div
        className={searchStyles.desktopSearch}
        data-search-context="inventory"
        data-slot="dealer-inventory-search"
        data-surface="hero"
      >
        <fieldset
          aria-label={text("Търсене на превозни средства", "Vehicle search")}
          className={searchStyles.form}
        >
          <SearchField
            active={Boolean(filters.make)}
            disabled={disabled}
            label={text("Марка", "Make")}
            onOpen={() => onOpenSection("make")}
            value={filters.make || text("Всички марки", "All Makes")}
          />
          <SearchField
            active={Boolean(filters.model)}
            disabled={disabled}
            label={text("Модел", "Model")}
            onOpen={() => onOpenSection("model")}
            value={filters.model || text("Всички модели", "All Models")}
          />
          <SearchField
            active={hasPrice}
            disabled={disabled}
            label={text("Цена", "Price")}
            onOpen={() => onOpenSection("price")}
            value={price}
          />
          <Button
            aria-haspopup="dialog"
            aria-label={text("Търси", "Search")}
            className={searchStyles.submit}
            data-slot="dealer-inventory-search-open"
            disabled={disabled}
            onClick={(event) =>
              openFromButton(event, () => onOpenSection("search"))
            }
            type="button"
          >
            <Search aria-hidden="true" size={20} />
          </Button>
        </fieldset>
        <DealerVehicleTypePills
          category={category}
          disabled={disabled || !onApply}
          isBg={isBg}
          onSelect={(nextCategory) =>
            onApply?.(withCategory(filters, nextCategory))
          }
          slot="desktop-inventory-types"
        />
      </div>
    </div>
  );
}
