"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  fallbackVehicleTaxonomy,
  formatFuelType,
  formatTransmission,
  getCategoryPath,
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  withCategory,
  withSearchParamUpdates,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useId, useState, useTransition } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import { useMarketplaceOverlayCoordinator } from "../hooks/use-marketplace-overlay-coordinator";
import {
  getDesktopPriceQuickFilterLabel,
  getDesktopQuickFilterLabels,
  getLocalizedDesktopCategoryLabel,
} from "../lib/desktop-filter-policy";
import {
  getMarketplaceCurrencyLabel,
  marketplaceBodyFilterOptions,
  marketplaceCategorySelectorOptions,
  marketplaceFuelOptions,
  marketplaceMileageRange,
  marketplacePricePresets,
  marketplacePriceRange,
  marketplaceSearchCurrency,
  marketplaceTransmissionOptions,
  marketplaceYearRange,
} from "../lib/marketplace-filter-config";
import { getActiveFilterChips } from "../lib/marketplace-results-toolbar-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-hero-search.module.css";
import { DealerHomeSearch } from "./dealer-home-search";
import { DesktopActionPanel } from "./desktop-action-panel";
import {
  DesktopQuickFilterDialog,
  DesktopQuickRangeDialog,
  desktopQuickFilterOptionClassName,
} from "./desktop-filter-controls";
import {
  DesktopSearchAssistant,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-assistant";
import { DesktopSearchFilterGrid } from "./desktop-search-filter-grid";
import { MarketplaceMakeModelPicker } from "./marketplace-model-picker";

const fieldClassName = `${desktopQuickFilterOptionClassName} ${styles.field}`;
const searchActionLabels = {
  hero: ["Търси", "Search"],
  inventory: ["Търси автомобили", "Search cars"],
} as const;
function getHeroCategoryLabel(
  category: MarketplaceSearchParams["category"],
  isBg: boolean
) {
  if (category === "car") {
    return isBg ? "Автомобили" : "All Cars";
  }
  return getLocalizedDesktopCategoryLabel(category, isBg);
}
function getHeroPriceLabel(
  filters: MarketplaceSearchParams,
  isBg: boolean,
  formatter: Intl.NumberFormat
) {
  if (filters.priceMin || filters.priceMax) {
    return getDesktopPriceQuickFilterLabel(filters, isBg, formatter);
  }
  return isBg ? "Всяка цена" : "Any Price";
}

export interface DealerHeroSearchProps {
  assistantSlot?: ReactNode;
  compact?: boolean;
  filters: MarketplaceSearchParams;
  locale?: string;
  searchListings?: readonly InventorySearchListing[];
  surface?: "hero" | "inventory";
  taxonomy?: VehicleTaxonomyMakeOption[];
  taxonomyByCategory?: Partial<
    Record<MarketplaceSearchParams["category"], VehicleTaxonomyMakeOption[]>
  >;
}

const getHeroTaxonomy = (
  category: MarketplaceSearchParams["category"],
  taxonomy: VehicleTaxonomyMakeOption[],
  taxonomyByCategory?: DealerHeroSearchProps["taxonomyByCategory"]
) => taxonomyByCategory?.[category] ?? taxonomy;

/** Both desktop search surfaces keep a draft until Search is submitted. */
export function DealerHeroSearch(props: DealerHeroSearchProps) {
  const {
    filters: initialFilters,
    locale,
    searchListings,
    assistantSlot,
    compact = false,
    surface = "inventory",
    taxonomy = fallbackVehicleTaxonomy,
    taxonomyByCategory,
  } = props;
  const router = useRouter();
  const isDesktop = useDesktopMarketplaceViewport();
  const [filters, setFilters] = useState(initialFilters);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const advancedFiltersId = useId();
  const query = filters.q ?? "";
  const setQuery = (value: string) =>
    setFilters((current) => ({ ...current, q: value }));
  const [pending, startTransition] = useTransition();
  const [makeModelStep, setMakeModelStep] = useState<"make" | "model" | null>(
    null
  );
  const openOverlay = useMarketplaceOverlayCoordinator(makeModelStep !== null);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const [searchLabelBg, searchLabelEn] = searchActionLabels[surface];
  const searchLabel = text(searchLabelBg, searchLabelEn);
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const activeFilterChips = getActiveFilterChips(filters, locale).filter(
    (chip) => chip.id !== "q"
  );
  const filterCount = activeFilterChips.length;
  const advancedFilterCount = activeFilterChips.filter(
    (chip) => !["make-model", "price", "year", "mileage"].includes(chip.id)
  ).length;
  const onApply = (updates: Partial<MarketplaceSearchParams>) => {
    setFilters((current) => withSearchParamUpdates(current, updates));
  };

  const submit = (value: string, sort = filters.sort) => {
    const normalized = value.trim();
    if (normalized) {
      rememberMarketplaceSearchQuery(normalized, "vehicles");
    }
    const next = withSearchParamUpdates(filters, {
      q: normalized || undefined,
      page: 1,
      sort,
    });
    startTransition(() =>
      router.push(
        buildMarketplaceSearchHref(
          next,
          getLocalizedPublicPath(locale, getCategoryPath(next.category))
        )
      )
    );
  };
  const resetDraft = () => {
    setFilters(
      withCategory(parseMarketplaceSearchParams({}), filters.category)
    );
    setQuery("");
  };
  if (surface === "hero") {
    return (
      <div
        aria-busy={pending}
        className={styles.desktopSearch}
        data-search-context="hero"
        data-surface="hero"
      >
        <DealerHomeSearch
          disabled={pending}
          filterCount={filterCount}
          filters={filters}
          key={String(isDesktop)}
          locale={locale}
          onApply={onApply}
          onSearch={() => submit(query)}
          taxonomy={taxonomy}
          taxonomyByCategory={taxonomyByCategory}
        />
      </div>
    );
  }
  const currencyLabel = getMarketplaceCurrencyLabel(isBg);
  const labels = getDesktopQuickFilterLabels(filters, isBg, numberFormatter);
  const { locationOptions, equipmentOptions } = getSearchOptions(
    searchListings,
    filters,
    isBg
  );
  return (
    <div
      className={styles.desktopSearch}
      data-compact={compact}
      data-search-context={surface}
      data-surface={surface}
    >
      <DesktopActionPanel
        className={styles.panel}
        data-slot="dealer-desktop-toolbar"
      >
        <form
          aria-busy={pending}
          aria-label={text("Търсене на автомобили", "Vehicle search")}
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            submit(query);
          }}
        >
          <h2 className={styles.searchHeading}>
            {text("Търсене на автомобили", "Search cars")}
          </h2>
          <div className={styles.searchRow}>
            <span className={styles.filterLabel}>
              {text("Ключова дума", "Keyword")}
            </span>
            <div className={styles.query}>
              <DesktopSearchAssistant
                appearance="hero"
                ariaLabel={text("Търсене на автомобили", "Search vehicles")}
                assistantSlot={assistantSlot}
                compact
                filterSlot={
                  <DesktopSearchFilterGrid
                    filters={filters}
                    locale={locale}
                    onApply={onApply}
                    taxonomy={taxonomy}
                  />
                }
                isBg={isBg}
                label={text("Търсене", "Search")}
                listings={searchListings}
                locale={locale}
                onQueryChange={setQuery}
                onSearch={submit}
                placeholder={text("Марка или модел…", "Make or model…")}
                query={query}
                scope="vehicles"
                searchActionLabel={text("Покажи обявите", "Show results")}
              />
            </div>
          </div>
          <div className={styles.fields}>
            <div className={styles.primaryFields}>
              <div className={styles.filterField} data-field="category">
                <span className={styles.filterLabel}>
                  {text("Категория", "Vehicle type")}
                </span>
                <DesktopQuickFilterDialog
                  active={filters.category !== "car"}
                  anyLabel={text("Всички автомобили", "All Cars")}
                  className={fieldClassName}
                  dataSlot="desktop-hero-category"
                  isBg={isBg}
                  label={getHeroCategoryLabel(filters.category, isBg)}
                  onSelect={(category) =>
                    setFilters((current) =>
                      withCategory(
                        current,
                        (category ||
                          "car") as MarketplaceSearchParams["category"]
                      )
                    )
                  }
                  options={marketplaceCategorySelectorOptions.map(
                    (category) => ({
                      value: category.id,
                      label: getLocalizedDesktopCategoryLabel(
                        category.id,
                        isBg
                      ),
                    })
                  )}
                  selected={filters.category}
                  title={text("Категория превозно средство", "Vehicle type")}
                />
              </div>
              <div className={styles.filterField} data-field="make">
                <span className={styles.filterLabel}>
                  {text("Марка", "Make")}
                </span>
                <Button
                  aria-expanded={makeModelStep === "make"}
                  aria-haspopup="dialog"
                  aria-pressed={Boolean(filters.make)}
                  className={fieldClassName}
                  data-slot="desktop-hero-make"
                  onClick={() => openOverlay(() => setMakeModelStep("make"))}
                  type="button"
                  variant="outline"
                >
                  <span>
                    {filters.make || text("Всички марки", "All Makes")}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <div className={styles.filterField} data-field="model">
                <span className={styles.filterLabel}>
                  {text("Модел", "Model")}
                </span>
                <Button
                  aria-expanded={makeModelStep === "model"}
                  aria-haspopup="dialog"
                  aria-pressed={Boolean(filters.model)}
                  className={fieldClassName}
                  data-slot="desktop-hero-model"
                  onClick={() => openOverlay(() => setMakeModelStep("model"))}
                  type="button"
                  variant="outline"
                >
                  <span>
                    {filters.model || text("Всички модели", "All Models")}
                  </span>
                  <ChevronDown aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <div className={styles.filterField} data-field="price">
                <span className={styles.filterLabel}>
                  {text("Цена", "Price")}
                </span>
                <DesktopQuickRangeDialog
                  active={Boolean(filters.priceMin || filters.priceMax)}
                  className={fieldClassName}
                  dataSlot="desktop-hero-price"
                  description={text(
                    "Изберете ценови диапазон.",
                    "Choose a price range."
                  )}
                  formatValue={(value) =>
                    `${numberFormatter.format(value)} ${currencyLabel}`
                  }
                  isBg={isBg}
                  label={getHeroPriceLabel(filters, isBg, numberFormatter)}
                  maximumLabel={text("Максимум", "Maximum")}
                  maximumPrefix={text("До", "Up to")}
                  minimumLabel={text("Минимум", "Minimum")}
                  onApply={({ minimum, maximum }) =>
                    onApply({
                      priceMin: minimum,
                      priceMax: maximum,
                      currency:
                        minimum !== undefined || maximum !== undefined
                          ? marketplaceSearchCurrency
                          : undefined,
                    })
                  }
                  presets={marketplacePricePresets.map((value) => ({
                    label:
                      text("До ", "Up to ") +
                      numberFormatter.format(value) +
                      " " +
                      currencyLabel,
                    value: [marketplacePriceRange[0], value],
                  }))}
                  quickSelectLabel={text("Бърз избор", "Quick select")}
                  range={marketplacePriceRange}
                  selectedMaximum={filters.priceMax}
                  selectedMinimum={filters.priceMin}
                  step={1000}
                  thumbLabels={[
                    text("Минимална цена", "Minimum price"),
                    text("Максимална цена", "Maximum price"),
                  ]}
                  title={text("Цена", "Price range")}
                />
              </div>
              <div className={styles.filterField} data-field="year">
                <span className={styles.filterLabel}>
                  {text("Година", "Year")}
                </span>
                <DesktopQuickRangeDialog
                  active={
                    filters.yearMin !== undefined ||
                    filters.yearMax !== undefined
                  }
                  className={fieldClassName}
                  dataSlot="desktop-hero-year"
                  description={text(
                    "Изберете диапазон на годината.",
                    "Choose a year range."
                  )}
                  formatValue={String}
                  isBg={isBg}
                  label={labels.year}
                  maximumLabel={text("До година", "To year")}
                  maximumPrefix={text("До", "Up to")}
                  minimumLabel={text("От година", "From year")}
                  onApply={({ minimum, maximum }) =>
                    onApply({ yearMin: minimum, yearMax: maximum })
                  }
                  presets={[]}
                  quickSelectLabel={text("Бърз избор", "Quick select")}
                  range={marketplaceYearRange}
                  selectedMaximum={filters.yearMax}
                  selectedMinimum={filters.yearMin}
                  step={1}
                  thumbLabels={[
                    text("От година", "From year"),
                    text("До година", "To year"),
                  ]}
                  title={text("Година", "Year")}
                />
              </div>
              <div className={styles.filterField} data-field="mileage">
                <span className={styles.filterLabel}>
                  {text("Пробег", "Mileage")}
                </span>
                <DesktopQuickRangeDialog
                  active={filters.mileageMax !== undefined}
                  className={fieldClassName}
                  dataSlot="desktop-hero-mileage"
                  description={text(
                    "Задайте максимален пробег.",
                    "Set a maximum mileage."
                  )}
                  formatValue={(value) =>
                    `${numberFormatter.format(value)} ${text("км", "km")}`
                  }
                  isBg={isBg}
                  label={labels.mileage}
                  maximumLabel={text("Максимален пробег", "Maximum mileage")}
                  maximumOnly
                  maximumPrefix={text("До", "Up to")}
                  minimumLabel={text("Минимум", "Minimum")}
                  onApply={({ maximum }) => onApply({ mileageMax: maximum })}
                  presets={[]}
                  quickSelectLabel={text("Бърз избор", "Quick select")}
                  range={marketplaceMileageRange}
                  selectedMaximum={filters.mileageMax}
                  step={5000}
                  thumbLabels={[
                    text("Минимален пробег", "Minimum mileage"),
                    text("Максимален пробег", "Maximum mileage"),
                  ]}
                  title={text("Пробег", "Mileage")}
                />
              </div>
              {compact ? (
                <Button
                  aria-controls={advancedFiltersId}
                  aria-expanded={advancedFiltersOpen}
                  className={`${fieldClassName} ${styles.expandFilters}`}
                  onClick={() => setAdvancedFiltersOpen((open) => !open)}
                  type="button"
                  variant="outline"
                >
                  <span>
                    {text("Още филтри", "More filters")}
                    {advancedFilterCount ? ` (${advancedFilterCount})` : ""}
                  </span>
                  <ChevronDown aria-hidden className="size-4" />
                </Button>
              ) : null}
            </div>
            <div
              className={styles.advancedFields}
              hidden={compact && !advancedFiltersOpen}
              id={advancedFiltersId}
            >
              <DesktopQuickFilterDialog
                active={Boolean(filters.transmission)}
                anyLabel={text("Всички скорости", "Any transmission")}
                className={fieldClassName}
                dataSlot="desktop-hero-transmission"
                isBg={isBg}
                label={
                  filters.transmission
                    ? labels.transmission
                    : text("Скоростна кутия", "Transmission")
                }
                onSelect={(transmission) =>
                  onApply({
                    transmission:
                      transmission as MarketplaceSearchParams["transmission"],
                  })
                }
                options={marketplaceTransmissionOptions.map((value) => ({
                  value,
                  label: formatTransmission(value, locale),
                }))}
                selected={filters.transmission}
                title={text("Скоростна кутия", "Transmission")}
              />
              <DesktopQuickFilterDialog
                active={Boolean(filters.body)}
                anyLabel={text("Всички типове", "Any body type")}
                className={fieldClassName}
                dataSlot="desktop-hero-body"
                isBg={isBg}
                label={
                  getDesktopQuickFilterLabels(filters, isBg, numberFormatter)
                    .body
                }
                onSelect={(body) =>
                  onApply({ body: body as MarketplaceSearchParams["body"] })
                }
                options={marketplaceBodyFilterOptions.map((option) => ({
                  value: option.value,
                  label: isBg ? option.labelBg : option.labelEn,
                }))}
                selected={filters.body}
                title={text("Тип купе", "Body type")}
              />

              <DesktopQuickFilterDialog
                active={Boolean(filters.fuel)}
                anyLabel={text("Всички горива", "Any fuel")}
                className={fieldClassName}
                dataSlot="desktop-hero-fuel"
                isBg={isBg}
                label={labels.fuel}
                onSelect={(fuel) =>
                  onApply({ fuel: fuel as MarketplaceSearchParams["fuel"] })
                }
                options={marketplaceFuelOptions.map((value) => ({
                  value,
                  label: formatFuelType(value, locale),
                }))}
                selected={filters.fuel}
                title={text("Гориво", "Fuel")}
              />
              <DesktopQuickFilterDialog
                active={Boolean(filters.seller)}
                anyLabel={text("Всички продавачи", "Any seller")}
                className={fieldClassName}
                dataSlot="desktop-hero-seller"
                isBg={isBg}
                label={
                  filters.seller
                    ? labels.seller
                    : text("Продавач", "Seller type")
                }
                onSelect={(seller) =>
                  onApply({
                    seller: seller as MarketplaceSearchParams["seller"],
                  })
                }
                options={[
                  { value: "dealer", label: text("Автокъща", "Dealer") },
                  {
                    value: "private",
                    label: text("Частно лице", "Private seller"),
                  },
                ]}
                selected={filters.seller}
                title={text("Продавач", "Seller type")}
              />
              <DesktopQuickFilterDialog
                active={filters.powerMin !== undefined}
                anyLabel={text("Всяка мощност", "Any power")}
                className={fieldClassName}
                dataSlot="desktop-hero-power"
                isBg={isBg}
                label={
                  filters.powerMin
                    ? `${filters.powerMin}+ ${text("к.с.", "hp")}`
                    : text("Мощност", "Power")
                }
                onSelect={(power) =>
                  onApply({ powerMin: power ? Number(power) : undefined })
                }
                options={[100, 150, 200, 250, 300, 400, 500].map((power) => ({
                  value: String(power),
                  label: `${power}+ ${text("к.с.", "hp")}`,
                }))}
                selected={filters.powerMin?.toString()}
                title={text("Минимална мощност", "Minimum power")}
              />
              <DesktopQuickFilterDialog
                active={Boolean(filters.extra)}
                anyLabel={
                  equipmentOptions.length
                    ? text("Без предпочитание", "Any equipment")
                    : text("Няма записано оборудване", "No equipment recorded")
                }
                className={fieldClassName}
                dataSlot="desktop-hero-extras"
                isBg={isBg}
                label={
                  equipmentOptions.find(
                    (option) => option.value === filters.extra
                  )?.label ??
                  filters.extra ??
                  text("Екстри", "Extras")
                }
                onSelect={(extra) => onApply({ extra })}
                options={equipmentOptions}
                selected={filters.extra}
                title={text("Оборудване", "Equipment")}
              />
              <DesktopQuickFilterDialog
                active={Boolean(filters.location)}
                anyLabel={text("Всички места", "Any location")}
                className={fieldClassName}
                dataSlot="desktop-hero-location"
                isBg={isBg}
                label={labels.location}
                onSelect={(location) => onApply({ location })}
                options={locationOptions}
                selected={filters.location}
                title={text("Местоположение", "Location")}
              />
            </div>
          </div>
          <Button
            aria-label={pending ? text("Търсене…", "Searching…") : searchLabel}
            className={styles.submit}
            data-slot="desktop-hero-submit"
            disabled={pending}
            type="submit"
          >
            <Search aria-hidden="true" size={22} />
            <span>{searchLabel}</span>
          </Button>
          <SearchDraftStatus
            filterCount={filterCount}
            isBg={isBg}
            onReset={resetDraft}
            query={query}
          />
        </form>
      </DesktopActionPanel>
      <MarketplaceMakeModelPicker
        applyLabel={text("Приложи", "Apply")}
        filters={filters}
        initialStep={makeModelStep ?? "make"}
        locale={locale}
        onApply={onApply}
        onOpenChange={(open) => {
          if (!open) {
            setMakeModelStep(null);
          }
        }}
        open={isDesktop && makeModelStep !== null}
        taxonomy={getHeroTaxonomy(
          filters.category,
          taxonomy,
          taxonomyByCategory
        )}
      />
    </div>
  );
}

function getSearchOptions(
  searchListings: readonly InventorySearchListing[] | undefined,
  filters: MarketplaceSearchParams,
  isBg: boolean
) {
  const locationOptions = [
    ...new Set([
      ...(searchListings ?? []).flatMap((listing) =>
        listing.location?.city ? [listing.location.city] : []
      ),
      ...(filters.location ? [filters.location] : []),
    ]),
  ]
    .sort()
    .map((city) => ({ value: city, label: city }));
  const equipmentOptions = Array.from(
    new Map(
      (searchListings ?? [])
        .flatMap((listing) => listing.features ?? [])
        .map((feature) => [
          feature.en,
          { value: feature.en, label: isBg ? feature.bg : feature.en },
        ])
    ).values()
  );
  return { locationOptions, equipmentOptions };
}

function SearchDraftStatus({
  filterCount,
  query,
  isBg,
  onReset,
}: {
  filterCount: number;
  query: string;
  isBg: boolean;
  onReset: () => void;
}) {
  if (!(filterCount || query)) {
    return null;
  }
  return (
    <div className={styles.footer}>
      <span aria-live="polite" className={styles.draftStatus}>
        {filterCount
          ? `${isBg ? "Избрани филтри" : "Filters selected"}: ${filterCount}`
          : `${isBg ? "Търсене" : "Search"}: ${query}`}
      </span>
      <Button
        className={styles.textAction}
        onClick={onReset}
        type="button"
        variant="ghost"
      >
        {isBg ? "Изчисти" : "Reset"}
      </Button>
    </div>
  );
}
