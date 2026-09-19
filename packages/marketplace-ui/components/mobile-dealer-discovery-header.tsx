"use client";

import { cn } from "@repo/design-system/lib/utils";
import type { VehicleCategory } from "@repo/marketplace";
import {
  Bike,
  BusFront,
  CarFront,
  ChevronDown,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";
import type { MouseEvent } from "react";
import { mobileHeaderIconActionClassName } from "../lib/mobile-header-icon-action";
import { getMobileQuickPillClassName } from "../lib/mobile-quick-pill";
import { DealerMobileBrandBar } from "./dealer-mobile-brand-bar";
import { DealerMobileHeaderIcon } from "./dealer-mobile-header-icon";
import {
  MobileDealerChrome,
  mobileDealerContentClassName,
} from "./mobile-dealer-chrome";
import { MobilePillRail } from "./mobile-pill-rail";

// Safari does not focus pointer-activated buttons. Establish the actual
// trigger before the overlay coordinator captures focus for dismissal.
const openFromButton = (
  event: MouseEvent<HTMLButtonElement>,
  open: () => void
) => {
  event.currentTarget.focus({ preventScroll: true });
  open();
};

const categoryIcons = {
  car: CarFront,
  lease: CarFront,
  motorbike: Bike,
  truck: Truck,
  van: BusFront,
};
function CategoryIcon({ category }: { category: VehicleCategory }) {
  const Icon = categoryIcons[category];
  return <DealerMobileHeaderIcon icon={Icon} kind="category" />;
}

interface MobileDealerDiscoveryHeaderProps {
  readonly category: VehicleCategory;
  readonly categoryLabel: string;
  readonly discoverySummary: string;
  readonly filterCount: number;
  readonly isBg: boolean;
  readonly locale?: string;
  readonly makeModelLabel: string;
  readonly onOpenCategory: () => void;
  readonly onOpenFilters: () => void;
  readonly onOpenSearch: () => void;
  readonly totalListings: number;
}

interface MobileCompactSearchHeaderProps {
  readonly category: VehicleCategory;
  readonly categoryLabel: string;
  readonly discoverySummary: string;
  readonly filterCount: number;
  readonly isBg: boolean;
  readonly makeModelLabel: string;
  readonly onOpenCategory: () => void;
  readonly onOpenFilters: () => void;
  readonly onOpenSearch: () => void;
  readonly totalListings: number;
  readonly visible: boolean;
}

interface MobileQuickFilterItem {
  readonly active: boolean;
  readonly clearLabel?: string;
  readonly id: string;
  readonly label: string;
  readonly onClick: () => void;
}

interface MobileDealerQuickFiltersProps {
  readonly items: readonly MobileQuickFilterItem[];
}

const getMobileSearchText = (
  isBg: boolean,
  totalListings: number,
  category: VehicleCategory
) => {
  const nouns = {
    car: { bg: ["автомобил", "автомобила"], en: ["car", "cars"] },
    lease: { bg: ["автомобил", "автомобила"], en: ["car", "cars"] },
    motorbike: {
      bg: ["мотоциклет", "мотоциклета"],
      en: ["motorcycle", "motorcycles"],
    },
    truck: { bg: ["камион", "камиона"], en: ["truck", "trucks"] },
    van: { bg: ["бус", "буса"], en: ["van", "vans"] },
  };
  const noun = nouns[category][isBg ? "bg" : "en"][totalListings === 1 ? 0 : 1];
  if (isBg) {
    return `Търси ${totalListings} ${noun}`;
  }

  return `Search ${totalListings} ${noun}`;
};

const categoryLabels: Record<VehicleCategory, { bg: string; en: string }> = {
  car: { bg: "Коли", en: "Cars" },
  lease: { bg: "Коли", en: "Cars" },
  motorbike: { bg: "Мотори", en: "Bikes" },
  truck: { bg: "Камиони", en: "Trucks" },
  van: { bg: "Бусове", en: "Vans" },
};

const getMakeModelValue = (label: string, isBg: boolean) => {
  if (label === "Марка и модел") {
    return "Всички марки";
  }

  if (label === "Make and model") {
    return "All makes";
  }

  return label || (isBg ? "Всички марки" : "All makes");
};

const getConditionsValue = (filterCount: number, isBg: boolean) => {
  if (filterCount > 0) {
    if (isBg && filterCount === 1) {
      return "1 активен";
    }

    return isBg ? `${filterCount} активни` : `${filterCount} active`;
  }

  return isBg ? "Всички" : "All";
};

const MobileSearchButton = ({
  hasMakeModelSelection,
  isCompact = false,
  isBg,
  makeModelValue,
  onDark = false,
  onOpenSearch,
  searchLabel,
}: {
  readonly hasMakeModelSelection: boolean;
  readonly isCompact?: boolean;
  readonly isBg: boolean;
  readonly makeModelValue: string;
  readonly onDark?: boolean;
  readonly onOpenSearch: () => void;
  readonly searchLabel: string;
}) => (
  <button
    aria-haspopup="dialog"
    aria-label={
      hasMakeModelSelection
        ? `${isBg ? "Марка и модел" : "Make and model"}: ${makeModelValue}`
        : searchLabel
    }
    className={cn(
      "flex min-w-0 items-center gap-2.5 text-left ring-1 ring-inset transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
      onDark
        ? "bg-white ring-white/15 hover:bg-zinc-100 focus-visible:outline-[var(--lead-site-accent-bright)]"
        : "bg-zinc-100 ring-zinc-200/80 hover:bg-zinc-200 focus-visible:outline-ring",
      isCompact
        ? "h-11 flex-1 rounded-full px-3"
        : "h-12 w-full rounded-full px-4"
    )}
    data-slot="mobile-discovery-search"
    onClick={(event) => openFromButton(event, onOpenSearch)}
    type="button"
  >
    <Search
      aria-hidden="true"
      className="size-[18px] shrink-0 text-zinc-600"
      strokeWidth={2}
    />
    <span
      className={cn(
        "min-w-0 flex-1 truncate font-medium tabular-nums",
        isCompact ? "text-compact-control" : "text-body",
        hasMakeModelSelection ? "text-zinc-950" : "text-zinc-600"
      )}
    >
      {hasMakeModelSelection ? makeModelValue : searchLabel}
    </span>
    {isCompact ? null : (
      <ChevronRight
        aria-hidden="true"
        className="size-5 shrink-0 text-zinc-950"
      />
    )}
  </button>
);

const MobileCompactDiscoverySurface = ({
  category,
  categoryLabel,
  filterCount,
  isBg,
  makeModelLabel,
  onOpenCategory,
  onOpenFilters,
  onOpenSearch,
  searchLabel,
}: {
  readonly category: VehicleCategory;
  readonly categoryLabel: string;
  readonly filterCount: number;
  readonly isBg: boolean;
  readonly makeModelLabel: string;
  readonly onOpenCategory: () => void;
  readonly onOpenFilters: () => void;
  readonly onOpenSearch: () => void;
  readonly searchLabel: string;
}) => {
  const makeModelValue = getMakeModelValue(makeModelLabel, isBg);
  const hasMakeModelSelection =
    makeModelValue !== "Всички марки" && makeModelValue !== "All makes";

  return (
    <fieldset
      aria-label={searchLabel}
      className="flex h-11 w-full min-w-0 items-stretch gap-2"
      data-slot="mobile-discovery-surface"
    >
      <button
        aria-haspopup="dialog"
        aria-label={categoryLabel}
        className={mobileHeaderIconActionClassName}
        data-slot="mobile-discovery-category"
        onClick={(event) => openFromButton(event, onOpenCategory)}
        title={categoryLabels[category][isBg ? "bg" : "en"]}
        type="button"
      >
        <CategoryIcon category={category} />
      </button>

      <MobileSearchButton
        hasMakeModelSelection={hasMakeModelSelection}
        isBg={isBg}
        isCompact
        makeModelValue={makeModelValue}
        onDark
        onOpenSearch={onOpenSearch}
        searchLabel={searchLabel}
      />

      <button
        aria-haspopup="dialog"
        aria-label={`${isBg ? "Отвори филтрите" : "Open filters"}${
          filterCount > 0 ? ` (${filterCount})` : ""
        }`}
        className={mobileHeaderIconActionClassName}
        data-slot="mobile-discovery-filters"
        onClick={(event) => openFromButton(event, onOpenFilters)}
        title={getConditionsValue(filterCount, isBg)}
        type="button"
      >
        <DealerMobileHeaderIcon icon={SlidersHorizontal} kind="filters" />
        {filterCount > 0 ? (
          <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand px-1 font-semibold text-brand-foreground text-micro ring-2 ring-zinc-950">
            {filterCount}
          </span>
        ) : null}
      </button>
    </fieldset>
  );
};

export const MobileDealerQuickFilters = ({
  items,
}: MobileDealerQuickFiltersProps) => (
  <div
    className={cn(mobileDealerContentClassName, "overflow-hidden pb-3")}
    data-slot="mobile-dealer-content"
  >
    <MobilePillRail
      className="flex items-center gap-2"
      data-slot="mobile-discovery-quick-rail"
    >
      {items.map((item) => (
        <button
          aria-haspopup={item.clearLabel ? undefined : "dialog"}
          aria-label={item.clearLabel}
          aria-pressed={item.active}
          className={cn("snap-start", getMobileQuickPillClassName(item.active))}
          key={item.id}
          onClick={(event) => openFromButton(event, item.onClick)}
          type="button"
        >
          <span className="max-w-36 truncate">{item.label}</span>
          {item.clearLabel ? (
            <X
              aria-hidden="true"
              className="size-3.5 opacity-80"
              strokeWidth={2.5}
            />
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="size-3 opacity-60"
              strokeWidth={2.5}
            />
          )}
        </button>
      ))}
    </MobilePillRail>
  </div>
);

export const MobileCompactSearchHeader = ({
  category,
  categoryLabel,
  filterCount,
  isBg,
  makeModelLabel,
  onOpenCategory,
  onOpenFilters,
  onOpenSearch,
  totalListings,
  visible,
}: MobileCompactSearchHeaderProps) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="fade-in-0 slide-in-from-top-2 fixed inset-x-0 top-0 z-50 animate-in rounded-b-[18px] bg-zinc-950 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-white shadow-[0_3px_12px_rgba(0,0,0,0.16)] duration-150 motion-reduce:animate-none sm:px-4 lg:hidden">
      <div className="mx-auto w-full max-w-lg">
        <MobileCompactDiscoverySurface
          category={category}
          categoryLabel={categoryLabel}
          filterCount={filterCount}
          isBg={isBg}
          makeModelLabel={makeModelLabel}
          onOpenCategory={onOpenCategory}
          onOpenFilters={onOpenFilters}
          onOpenSearch={onOpenSearch}
          searchLabel={getMobileSearchText(isBg, totalListings, category)}
        />
      </div>
    </div>
  );
};

export const MobileDealerDiscoveryHeader = ({
  category,
  categoryLabel,
  filterCount,
  isBg,
  locale,
  makeModelLabel,
  onOpenCategory,
  onOpenFilters,
  onOpenSearch,
  totalListings,
}: MobileDealerDiscoveryHeaderProps) => {
  const makeModelValue = getMakeModelValue(makeModelLabel, isBg);
  const hasMakeModelSelection =
    makeModelValue !== "Всички марки" && makeModelValue !== "All makes";
  const searchLabel = getMobileSearchText(isBg, totalListings, category);

  return (
    <div className="bg-zinc-950 text-white">
      <MobileDealerChrome
        brandRow={
          <div className="grid h-11 grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3">
            <button
              aria-haspopup="dialog"
              aria-label={categoryLabel}
              className={mobileHeaderIconActionClassName}
              data-slot="mobile-discovery-category"
              onClick={(event) => openFromButton(event, onOpenCategory)}
              title={categoryLabels[category][isBg ? "bg" : "en"]}
              type="button"
            >
              <CategoryIcon category={category} />
            </button>

            <DealerMobileBrandBar isBg={isBg} locale={locale} tone="clean" />

            <button
              aria-haspopup="dialog"
              aria-label={`${isBg ? "Отвори филтрите" : "Open filters"}${
                filterCount > 0 ? ` (${filterCount})` : ""
              }`}
              className={mobileHeaderIconActionClassName}
              data-slot="mobile-discovery-filters"
              onClick={(event) => openFromButton(event, onOpenFilters)}
              title={getConditionsValue(filterCount, isBg)}
              type="button"
            >
              <DealerMobileHeaderIcon icon={SlidersHorizontal} kind="filters" />
              {filterCount > 0 ? (
                <span className="absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-brand px-1 font-semibold text-brand-foreground text-micro ring-2 ring-zinc-950">
                  {filterCount}
                </span>
              ) : null}
            </button>
          </div>
        }
      >
        <MobileSearchButton
          hasMakeModelSelection={hasMakeModelSelection}
          isBg={isBg}
          makeModelValue={makeModelValue}
          onDark
          onOpenSearch={onOpenSearch}
          searchLabel={searchLabel}
        />
      </MobileDealerChrome>
    </div>
  );
};
