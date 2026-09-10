"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  type FuelType,
  filterLabels,
  type MarketplaceSearchParams,
  sortOptions,
  type Transmission,
} from "@repo/marketplace";
import { Heart, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { getAccountSavedSearchFlowHref } from "../lib/account-save-flow";
import {
  getDesktopPriceQuickFilterLabel,
  getDesktopQuickFilterLabels,
} from "../lib/desktop-filter-policy";
import {
  getMarketplaceCurrencyLabel,
  localizeMarketplace,
  marketplaceBodyFilterOptions,
  marketplaceFuelLabelsBg,
  marketplaceFuelOptions,
  marketplaceMileagePresets,
  marketplaceMileageRange,
  marketplacePricePresets,
  marketplacePriceRange,
  marketplaceSearchCurrency,
  marketplaceSortLabelsBg,
  marketplaceTransmissionLabelsBg,
  marketplaceTransmissionOptions,
  marketplaceYearPresets,
  marketplaceYearRange,
} from "../lib/marketplace-filter-config";
import {
  DesktopQuickFilterButton,
  DesktopQuickFilterDialog,
  DesktopQuickRangeDialog,
  desktopQuickFilterRailItemClassName,
  getDesktopQuickFilterClassName,
} from "./desktop-filter-controls";
import { DesktopFilterRailRanges } from "./desktop-filter-rail-ranges";
import { getActiveFilterChips } from "./desktop-marketplace-controls";

type ApplyFilters = (filters: Partial<MarketplaceSearchParams>) => void;

const representedDesktopFilterChipIds = new Set([
  "q",
  "make-model",
  "price",
  "year",
  "mileage",
  "fuel",
]);

export { getDesktopQuickFilterClassName } from "./desktop-filter-controls";

export const DesktopQuickFilters = ({
  compact,
  elevated = false,
  showAdditionalFilters = false,
  filterCount,
  filters,
  isBg,
  numberFormatter,
  onApply,
  onClearFilters,
  onOpenFilters,
  onOpenMake,
  onOpenModel,
}: {
  compact: boolean;
  elevated?: boolean;
  showAdditionalFilters?: boolean;
  filterCount: number;
  filters: MarketplaceSearchParams;
  isBg: boolean;
  numberFormatter: Intl.NumberFormat;
  onApply: ApplyFilters;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onOpenMake: () => void;
  onOpenModel: () => void;
}) => {
  const labels = getDesktopQuickFilterLabels(filters, isBg, numberFormatter);
  const priceLabel = getDesktopPriceQuickFilterLabel(
    filters,
    isBg,
    numberFormatter
  );
  const activeFilterChips = getActiveFilterChips(filters, isBg ? "bg" : "en");
  const supplementaryActiveFilterChips = activeFilterChips.filter(
    (chip) =>
      !(
        representedDesktopFilterChipIds.has(chip.id) ||
        (showAdditionalFilters &&
          (chip.id === "body" || chip.id === "transmission"))
      )
  );

  return (
    <div
      className={cn(compact ? "py-2.5" : "mx-auto mt-7 max-w-[100rem] py-0.5")}
    >
      <fieldset className="w-full min-w-0">
        <legend className="sr-only">
          {localizeMarketplace(isBg, "Филтри за автомобили", "Vehicle filters")}
        </legend>
        <div className="mx-auto flex w-full max-w-[100rem] flex-nowrap items-center justify-center gap-2">
          <div
            className="min-w-0 flex-[0_1_auto] overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-slot="desktop-quick-filter-scroll"
          >
            <div
              className="flex w-max flex-nowrap justify-start gap-2"
              data-slot="desktop-quick-filter-items"
            >
              <DesktopQuickFilterButton
                active={Boolean(filters.make)}
                ariaLabel={
                  filters.make || localizeMarketplace(isBg, "Марка", "Make")
                }
                className={desktopQuickFilterRailItemClassName}
                elevated={elevated}
                isBg={isBg}
                label={
                  filters.make || localizeMarketplace(isBg, "Марка", "Make")
                }
                onClear={
                  filters.make
                    ? () =>
                        onApply({
                          derivative: undefined,
                          make: undefined,
                          model: undefined,
                          trim: undefined,
                        })
                    : undefined
                }
                onOpen={onOpenMake}
              />
              <DesktopQuickFilterButton
                active={Boolean(filters.model)}
                ariaLabel={
                  filters.model || localizeMarketplace(isBg, "Модел", "Model")
                }
                className={desktopQuickFilterRailItemClassName}
                elevated={elevated}
                isBg={isBg}
                label={
                  filters.model || localizeMarketplace(isBg, "Модел", "Model")
                }
                onClear={
                  filters.model
                    ? () =>
                        onApply({
                          derivative: undefined,
                          model: undefined,
                          trim: undefined,
                        })
                    : undefined
                }
                onOpen={onOpenModel}
              />
              <DesktopQuickRangeDialog
                active={Boolean(filters.priceMin || filters.priceMax)}
                className={desktopQuickFilterRailItemClassName}
                dataSlot="desktop-quick-filter"
                description={localizeMarketplace(
                  isBg,
                  "Плъзнете диапазона или въведете точни стойности.",
                  "Drag the range or enter exact values."
                )}
                elevated={elevated}
                formatValue={(value) =>
                  `${numberFormatter.format(value)} ${getMarketplaceCurrencyLabel(
                    isBg
                  )}`
                }
                isBg={isBg}
                label={priceLabel}
                maximumLabel={localizeMarketplace(isBg, "Максимум", "Maximum")}
                maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
                minimumLabel={localizeMarketplace(isBg, "Минимум", "Minimum")}
                onApply={({ maximum, minimum }) =>
                  onApply({
                    currency:
                      minimum !== undefined || maximum !== undefined
                        ? marketplaceSearchCurrency
                        : undefined,
                    priceMax: maximum,
                    priceMin: minimum,
                  })
                }
                onClear={() =>
                  onApply({
                    currency: undefined,
                    priceMax: undefined,
                    priceMin: undefined,
                  })
                }
                presets={marketplacePricePresets.map((value) => ({
                  label: `${localizeMarketplace(
                    isBg,
                    "До",
                    "To"
                  )} ${numberFormatter.format(
                    value
                  )} ${getMarketplaceCurrencyLabel(isBg)}`,
                  value: [marketplacePriceRange[0], value],
                }))}
                quickSelectLabel={localizeMarketplace(
                  isBg,
                  "Бърз избор",
                  "Quick select"
                )}
                range={marketplacePriceRange}
                selectedMaximum={filters.priceMax}
                selectedMinimum={filters.priceMin}
                step={1000}
                thumbLabels={[
                  localizeMarketplace(isBg, "Минимална цена", "Minimum price"),
                  localizeMarketplace(isBg, "Максимална цена", "Maximum price"),
                ]}
                title={localizeMarketplace(isBg, "Цена", "Price")}
              />
              <DesktopQuickRangeDialog
                active={Boolean(filters.yearMin || filters.yearMax)}
                className={desktopQuickFilterRailItemClassName}
                dataSlot="desktop-quick-filter"
                description={localizeMarketplace(
                  isBg,
                  "Изберете начална и крайна година с плъзгане или точни стойности.",
                  "Choose a minimum and maximum year by dragging or entering exact values."
                )}
                elevated={elevated}
                formatValue={(value) => value.toString()}
                isBg={isBg}
                label={labels.year}
                maximumLabel={localizeMarketplace(isBg, "До година", "To year")}
                maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
                minimumLabel={localizeMarketplace(
                  isBg,
                  "От година",
                  "From year"
                )}
                onApply={({ maximum, minimum }) =>
                  onApply({ yearMax: maximum, yearMin: minimum })
                }
                onClear={() =>
                  onApply({ yearMax: undefined, yearMin: undefined })
                }
                presets={marketplaceYearPresets.map((value) => ({
                  label: `${localizeMarketplace(isBg, "От", "From")} ${value}`,
                  value: [value, marketplaceYearRange[1]],
                }))}
                quickSelectLabel={localizeMarketplace(
                  isBg,
                  "Бърз избор",
                  "Quick select"
                )}
                range={marketplaceYearRange}
                selectedMaximum={filters.yearMax}
                selectedMinimum={filters.yearMin}
                step={1}
                thumbLabels={[
                  localizeMarketplace(isBg, "Минимална година", "Minimum year"),
                  localizeMarketplace(
                    isBg,
                    "Максимална година",
                    "Maximum year"
                  ),
                ]}
                title={localizeMarketplace(isBg, "Година", "Year")}
              />
              <DesktopQuickRangeDialog
                active={Boolean(filters.mileageMax)}
                className={cn(
                  desktopQuickFilterRailItemClassName,
                  "hidden min-[75rem]:inline-flex"
                )}
                dataSlot="desktop-quick-filter"
                description={localizeMarketplace(
                  isBg,
                  "Плъзнете или въведете максималния приемлив пробег.",
                  "Drag or enter the maximum acceptable mileage."
                )}
                elevated={elevated}
                formatValue={(value) =>
                  `${numberFormatter.format(value)} ${isBg ? "км" : "km"}`
                }
                isBg={isBg}
                label={labels.mileage}
                maximumLabel={localizeMarketplace(
                  isBg,
                  "Максимален пробег",
                  "Maximum mileage"
                )}
                maximumOnly
                maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
                minimumLabel={localizeMarketplace(isBg, "Минимум", "Minimum")}
                onApply={({ maximum }) => onApply({ mileageMax: maximum })}
                onClear={() => onApply({ mileageMax: undefined })}
                presets={marketplaceMileagePresets.map((value) => ({
                  label: `${localizeMarketplace(
                    isBg,
                    "До",
                    "To"
                  )} ${numberFormatter.format(value)} ${isBg ? "км" : "km"}`,
                  value: [marketplaceMileageRange[0], value],
                }))}
                quickSelectLabel={localizeMarketplace(
                  isBg,
                  "Бърз избор",
                  "Quick select"
                )}
                range={marketplaceMileageRange}
                selectedMaximum={filters.mileageMax}
                step={5000}
                thumbLabels={[
                  localizeMarketplace(
                    isBg,
                    "Минимален пробег",
                    "Minimum mileage"
                  ),
                  localizeMarketplace(
                    isBg,
                    "Максимален пробег",
                    "Maximum mileage"
                  ),
                ]}
                title={localizeMarketplace(isBg, "Пробег", "Mileage")}
              />
              <DesktopQuickFilterDialog
                active={Boolean(filters.fuel)}
                anyLabel={localizeMarketplace(
                  isBg,
                  "Всички горива",
                  "Any fuel"
                )}
                className={cn(
                  desktopQuickFilterRailItemClassName,
                  "hidden min-[75rem]:inline-flex"
                )}
                dataSlot="desktop-quick-filter"
                elevated={elevated}
                isBg={isBg}
                label={labels.fuel}
                onClear={() => onApply({ fuel: undefined })}
                onSelect={(fuel) =>
                  onApply({ fuel: fuel as FuelType | undefined })
                }
                options={marketplaceFuelOptions.map((value) => ({
                  label: isBg
                    ? marketplaceFuelLabelsBg[value]
                    : filterLabels.fuel[value],
                  value,
                }))}
                selected={filters.fuel}
                title={localizeMarketplace(isBg, "Гориво", "Fuel")}
              />
              {showAdditionalFilters ? (
                <>
                  <DesktopQuickFilterDialog
                    active={Boolean(filters.transmission)}
                    anyLabel={localizeMarketplace(
                      isBg,
                      "Всички скорости",
                      "Any transmission"
                    )}
                    className={desktopQuickFilterRailItemClassName}
                    dataSlot="desktop-quick-filter"
                    elevated={elevated}
                    isBg={isBg}
                    label={labels.transmission}
                    onClear={() => onApply({ transmission: undefined })}
                    onSelect={(transmission) =>
                      onApply({
                        transmission: transmission as Transmission | undefined,
                      })
                    }
                    options={marketplaceTransmissionOptions.map((value) => ({
                      label: isBg
                        ? marketplaceTransmissionLabelsBg[value]
                        : filterLabels.transmission[value],
                      value,
                    }))}
                    selected={filters.transmission}
                    title={localizeMarketplace(
                      isBg,
                      "Скоростна кутия",
                      "Transmission"
                    )}
                  />
                  <DesktopQuickFilterDialog
                    active={Boolean(filters.body)}
                    anyLabel={localizeMarketplace(
                      isBg,
                      "Всички типове",
                      "Any body type"
                    )}
                    className={desktopQuickFilterRailItemClassName}
                    dataSlot="desktop-quick-filter"
                    elevated={elevated}
                    isBg={isBg}
                    label={labels.body}
                    onClear={() => onApply({ body: undefined })}
                    onSelect={(body) =>
                      onApply({
                        body: body as
                          | MarketplaceSearchParams["body"]
                          | undefined,
                      })
                    }
                    options={marketplaceBodyFilterOptions.map((option) => ({
                      label: isBg ? option.labelBg : option.labelEn,
                      value: option.value,
                    }))}
                    selected={filters.body}
                    title={localizeMarketplace(isBg, "Тип купе", "Body type")}
                  />
                </>
              ) : null}
              <DesktopQuickFilterDialog
                active={filters.sort !== "recommended"}
                anyLabel={localizeMarketplace(
                  isBg,
                  "Препоръчани",
                  "Recommended"
                )}
                className="w-auto min-w-28 shrink-0 gap-2 px-4 has-[>svg]:px-4 min-[112rem]:px-[18px] min-[112rem]:has-[>svg]:px-[18px]"
                dataSlot="desktop-sort-trigger"
                elevated={elevated}
                isBg={isBg}
                label={labels.sort}
                onClear={() => onApply({ sort: "recommended" })}
                onSelect={(sort) =>
                  onApply({
                    sort: (sort ??
                      "recommended") as MarketplaceSearchParams["sort"],
                  })
                }
                options={sortOptions
                  .filter((value) => value !== "recommended")
                  .map((value) => ({
                    label: isBg
                      ? marketplaceSortLabelsBg[value]
                      : filterLabels.sort[value],
                    value,
                  }))}
                selected={
                  filters.sort === "recommended" ? undefined : filters.sort
                }
                title={localizeMarketplace(isBg, "Подреждане", "Sort")}
              />
              {supplementaryActiveFilterChips.map((chip) => (
                <DesktopQuickFilterButton
                  active
                  ariaLabel={chip.label}
                  className={desktopQuickFilterRailItemClassName}
                  elevated={elevated}
                  isBg={isBg}
                  key={chip.id}
                  label={chip.label}
                  onClear={() => onApply(chip.updates)}
                  onOpen={onOpenFilters}
                />
              ))}
            </div>
          </div>
          <div
            className="relative flex shrink-0 items-center gap-2"
            data-slot="desktop-filter-actions"
          >
            <Button
              aria-haspopup="dialog"
              aria-label={`${localizeMarketplace(isBg, "Филтри", "Filters")}${
                filterCount > 0 ? ` (${filterCount})` : ""
              }`}
              className={cn(
                getDesktopQuickFilterClassName(false, elevated),
                "!border-black !bg-black !text-white hover:!bg-zinc-800 hover:!text-white active:!bg-zinc-700 relative w-auto shrink-0 gap-2 px-4 has-[>svg]:px-4"
              )}
              data-slot="desktop-primary-control"
              onClick={onOpenFilters}
              title={localizeMarketplace(isBg, "Филтри", "Filters")}
              type="button"
              variant="secondary"
            >
              <SlidersHorizontal aria-hidden="true" className="size-[18px]" />
              <span>{localizeMarketplace(isBg, "Филтри", "Filters")}</span>
              {filterCount > 0 ? (
                <span className="pointer-events-none absolute -top-1 -right-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-white px-1.5 font-semibold text-black text-micro ring-2 ring-black">
                  {filterCount}
                </span>
              ) : null}
            </Button>
            {activeFilterChips.length > 0 ? (
              <Button
                aria-label={localizeMarketplace(
                  isBg,
                  "Изчисти филтрите",
                  "Clear filters"
                )}
                className={cn(
                  getDesktopQuickFilterClassName(false, elevated),
                  "w-11 shrink-0 px-0 has-[>svg]:px-0"
                )}
                data-slot="desktop-clear-all-filters"
                onClick={onClearFilters}
                title={localizeMarketplace(
                  isBg,
                  "Изчисти филтрите",
                  "Clear filters"
                )}
                type="button"
                variant="secondary"
              >
                <X aria-hidden="true" className="size-4" strokeWidth={2.25} />
              </Button>
            ) : null}
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export const DesktopMarketplaceFilterRail = ({
  appBaseUrl,
  filterCount,
  filters,
  locale,
  onApply,
  onOpenFilters,
  onOpenMakeModel,
}: {
  appBaseUrl: string;
  filterCount: number;
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: ApplyFilters;
  onOpenFilters: () => void;
  onOpenMakeModel: () => void;
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const labels = getDesktopQuickFilterLabels(filters, isBg, numberFormatter);
  const saveSearchHref = getAccountSavedSearchFlowHref(appBaseUrl, filters);
  const priceLabel = getDesktopPriceQuickFilterLabel(
    filters,
    isBg,
    numberFormatter
  );

  return (
    <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-body">
          {localizeMarketplace(isBg, "Филтри", "Filters")}
        </h2>
        {filterCount > 0 ? (
          <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-foreground px-1.5 font-semibold text-background text-micro">
            {filterCount}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <DesktopQuickFilterButton
          active={Boolean(filters.make || filters.model || filters.trim)}
          ariaLabel={labels.makeModel}
          className="w-full justify-between gap-2"
          elevated={false}
          isBg={isBg}
          label={labels.makeModel}
          onOpen={onOpenMakeModel}
        />
        <DesktopQuickFilterDialog
          active={Boolean(filters.body)}
          anyLabel={localizeMarketplace(isBg, "Всички типове", "Any body type")}
          className="w-full"
          isBg={isBg}
          label={labels.body}
          onSelect={(body) =>
            onApply({
              body: body as MarketplaceSearchParams["body"] | undefined,
            })
          }
          options={marketplaceBodyFilterOptions.map((option) => ({
            label: isBg ? option.labelBg : option.labelEn,
            value: option.value,
          }))}
          selected={filters.body}
          title={localizeMarketplace(isBg, "Тип купе", "Body type")}
        />
        <DesktopQuickRangeDialog
          active={Boolean(filters.priceMin || filters.priceMax)}
          className="w-full"
          description={localizeMarketplace(
            isBg,
            "Плъзнете диапазона или въведете точни стойности.",
            "Drag the range or enter exact values."
          )}
          formatValue={(value) =>
            `${numberFormatter.format(value)} ${getMarketplaceCurrencyLabel(
              isBg
            )}`
          }
          isBg={isBg}
          label={priceLabel}
          maximumLabel={localizeMarketplace(isBg, "Максимум", "Maximum")}
          maximumPrefix={localizeMarketplace(isBg, "До", "Up to")}
          minimumLabel={localizeMarketplace(isBg, "Минимум", "Minimum")}
          onApply={({ maximum, minimum }) =>
            onApply({
              currency:
                minimum !== undefined || maximum !== undefined
                  ? marketplaceSearchCurrency
                  : undefined,
              priceMax: maximum,
              priceMin: minimum,
            })
          }
          presets={marketplacePricePresets.map((value) => ({
            label: `${localizeMarketplace(
              isBg,
              "До",
              "To"
            )} ${numberFormatter.format(
              value
            )} ${getMarketplaceCurrencyLabel(isBg)}`,
            value: [marketplacePriceRange[0], value],
          }))}
          quickSelectLabel={localizeMarketplace(
            isBg,
            "Бърз избор",
            "Quick select"
          )}
          range={marketplacePriceRange}
          selectedMaximum={filters.priceMax}
          selectedMinimum={filters.priceMin}
          step={1000}
          thumbLabels={[
            localizeMarketplace(isBg, "Минимална цена", "Minimum price"),
            localizeMarketplace(isBg, "Максимална цена", "Maximum price"),
          ]}
          title={localizeMarketplace(isBg, "Цена", "Price")}
        />
        <DesktopFilterRailRanges
          filters={filters}
          isBg={isBg}
          labels={{ mileage: labels.mileage, year: labels.year }}
          numberFormatter={numberFormatter}
          onApply={onApply}
        />
        <DesktopQuickFilterDialog
          active={Boolean(filters.fuel)}
          anyLabel={localizeMarketplace(isBg, "Всички горива", "Any fuel")}
          className="w-full"
          isBg={isBg}
          label={labels.fuel}
          onSelect={(fuel) => onApply({ fuel: fuel as FuelType | undefined })}
          options={marketplaceFuelOptions.map((value) => ({
            label: isBg
              ? marketplaceFuelLabelsBg[value]
              : filterLabels.fuel[value],
            value,
          }))}
          selected={filters.fuel}
          title={localizeMarketplace(isBg, "Гориво", "Fuel")}
        />
        <DesktopQuickFilterDialog
          active={Boolean(filters.transmission)}
          anyLabel={localizeMarketplace(
            isBg,
            "Всички скорости",
            "Any transmission"
          )}
          className="w-full"
          isBg={isBg}
          label={labels.transmission}
          onSelect={(transmission) =>
            onApply({
              transmission: transmission as Transmission | undefined,
            })
          }
          options={marketplaceTransmissionOptions.map((value) => ({
            label: isBg
              ? marketplaceTransmissionLabelsBg[value]
              : filterLabels.transmission[value],
            value,
          }))}
          selected={filters.transmission}
          title={localizeMarketplace(isBg, "Скоростна кутия", "Transmission")}
        />
        <Button
          aria-haspopup="dialog"
          className={cn(
            getDesktopQuickFilterClassName(false),
            "w-full justify-center gap-1.5"
          )}
          onClick={onOpenFilters}
          type="button"
          variant="secondary"
        >
          <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          {localizeMarketplace(isBg, "Всички филтри", "All filters")}
        </Button>
        {saveSearchHref ? (
          <Button
            asChild
            className="h-9 w-full rounded-lg text-meta"
            variant="outline"
          >
            <Link href={saveSearchHref}>
              <Heart aria-hidden="true" className="size-3.5" />
              {localizeMarketplace(isBg, "Запази търсенето", "Save search")}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
