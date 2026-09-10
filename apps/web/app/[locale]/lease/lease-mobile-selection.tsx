"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  fallbackVehicleTaxonomy,
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
} from "@repo/marketplace";
import {
  getMarketplaceFilterSummary,
  getMobileQuickPillClassName,
  MarketplaceFullFilterOverlay,
  MarketplaceQuickFilterDrawer,
  mobileDealerContentClassName,
} from "@repo/marketplace-ui";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import { MobilePillRail } from "@repo/marketplace-ui/components/mobile-pill-rail";
import Link from "next/link";
import { useState } from "react";
import { MobileDealerServiceHero } from "../components/mobile-dealer-service-hero";
import { LeaseCarSelector } from "./lease-car-selector";
import {
  type FinancingVehicleOption,
  matchesLeaseVehicleFilters,
} from "./lease-finance-policy";
import { LeaseInformationDrawer } from "./lease-information-drawer";
import {
  LeaseMobilePreferences,
  type LeasePreferenceProps,
} from "./lease-mobile-preferences";
import { LeaseSelectedVehicle } from "./lease-selected-vehicle";

const searchWhitespace = /\s+/u;
const leaseFilterKeys = [
  "price",
  "year",
  "mileage",
  "fuel",
  "transmission",
] as const;

const filterLeaseVehicles = (
  vehicles: FinancingVehicleOption[],
  filters: MarketplaceSearchParams,
  query: string,
  locale: "bg" | "en"
) => {
  const terms = query.trim().toLocaleLowerCase(locale).split(searchWhitespace);
  return vehicles.filter(
    (vehicle) =>
      matchesLeaseVehicleFilters(vehicle, filters) &&
      terms.every((term) =>
        [vehicle.title, vehicle.priceLabel, vehicle.yearLabel]
          .join(" ")
          .toLocaleLowerCase(locale)
          .includes(term)
      )
  );
};

const LeaseQuickFilterRail = ({
  filters,
  locale,
  setFilterOpen,
  setActiveFilter,
  setFilters,
  preferences,
}: {
  preferences: LeasePreferenceProps;
  filters: MarketplaceSearchParams;
  locale: "bg" | "en";
  setFilterOpen: (open: boolean) => void;
  setActiveFilter: (key: (typeof leaseFilterKeys)[number]) => void;
  setFilters: (filters: MarketplaceSearchParams) => void;
}) => {
  const labels =
    locale === "bg"
      ? {
          price: "Цена",
          year: "Година",
          mileage: "Пробег",
          fuel: "Гориво",
          transmission: "Скорости",
        }
      : {
          price: "Price",
          year: "Year",
          mileage: "Mileage",
          fuel: "Fuel",
          transmission: "Transmission",
        };
  const hasFilters =
    [
      filters.make,
      filters.model,
      filters.body,
      filters.origin,
      filters.deliverTo,
      filters.seller,
      filters.category !== "car",
    ].some(Boolean) ||
    leaseFilterKeys.some((key) =>
      Boolean(getMarketplaceFilterSummary(key, filters, locale))
    );
  return (
    <fieldset
      aria-label={locale === "bg" ? "Филтри за автомобил" : "Vehicle filters"}
      className="min-w-0"
      data-slot="lease-quick-filters"
    >
      <MobilePillRail className="flex gap-2" data-slot="lease-quick-rail">
        <LeaseMobilePreferences locale={locale} {...preferences} />
        <button
          aria-haspopup="dialog"
          className={getMobileQuickPillClassName(hasFilters)}
          onClick={() => setFilterOpen(true)}
          type="button"
        >
          <DealerUiIcon className="size-4" name="filters" />
          {locale === "bg" ? "Филтри" : "Filters"}
        </button>
        {leaseFilterKeys.map((key) => {
          const summary = getMarketplaceFilterSummary(key, filters, locale);
          return (
            <button
              aria-haspopup="dialog"
              aria-label={summary ? `${labels[key]}: ${summary}` : labels[key]}
              className={getMobileQuickPillClassName(Boolean(summary))}
              key={key}
              onClick={() => setActiveFilter(key)}
              type="button"
            >
              {summary ?? labels[key]}
              <DealerUiIcon className="size-3.5" name="chevronDown" />
            </button>
          );
        })}
        {hasFilters ? (
          <button
            className="min-h-11 shrink-0 rounded-full px-3 font-medium text-[14px] text-zinc-600 focus-visible:outline-2 focus-visible:outline-ring"
            onClick={() => setFilters(parseMarketplaceSearchParams())}
            type="button"
          >
            {locale === "bg" ? "Нулирай" : "Reset"}
          </button>
        ) : null}
      </MobilePillRail>
    </fieldset>
  );
};

export const LeaseMobileSelection = ({
  financeRequestHref,
  preferences,
  locale,
  faqs,
  onClearVehicle,
  onSelectVehicle,
  selectedVehicle,
  vehicles,
}: {
  financeRequestHref: string;
  preferences: LeasePreferenceProps;
  locale: "bg" | "en";
  faqs: readonly { question: string; answer: string }[];
  onClearVehicle: () => void;
  onSelectVehicle: (id: string) => void;
  selectedVehicle?: FinancingVehicleOption;
  vehicles: FinancingVehicleOption[];
}) => {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MarketplaceSearchParams>(() =>
    parseMarketplaceSearchParams()
  );
  const [activeFilter, setActiveFilter] = useState<
    (typeof leaseFilterKeys)[number] | null
  >(null);
  const filtered = filterLeaseVehicles(vehicles, filters, query, locale);
  return (
    <div
      className="bg-background pb-4 lg:hidden"
      data-slot="lease-mobile-experience"
    >
      <MobileDealerServiceHero
        helpAction={<LeaseInformationDrawer faqs={faqs} locale={locale} />}
        imageClassName="object-center"
        imageSrc="/images/lease/day-night-mobile-studio-v2.webp"
        locale={locale}
        tone="leasing"
      >
        <div className="h-full">
          <LeaseCarSelector
            locale={locale}
            onSelect={onSelectVehicle}
            selectedVehicle={selectedVehicle}
            vehicles={vehicles}
          />
        </div>
      </MobileDealerServiceHero>
      <div
        className={`${mobileDealerContentClassName} pb-6`}
        data-slot="mobile-dealer-content"
      >
        <h1 className="sr-only" id="lease-mobile-title" tabIndex={-1}>
          {locale === "bg" ? "Лизинг на автомобил" : "Vehicle financing"}
        </h1>
        {
          <LeaseQuickFilterRail
            filters={filters}
            locale={locale}
            preferences={preferences}
            setActiveFilter={setActiveFilter}
            setFilterOpen={setFilterOpen}
            setFilters={setFilters}
          />
        }

        {selectedVehicle ? (
          <>
            <div className="mt-3">
              <LeaseSelectedVehicle
                locale={locale}
                onClear={onClearVehicle}
                vehicle={selectedVehicle}
              />
            </div>
            <Button
              asChild
              className="mt-3 h-12 w-full justify-between rounded-xl bg-[var(--lead-site-accent)] px-4 font-semibold text-[15px] text-white shadow-none hover:bg-[var(--lead-site-accent-hover)] active:bg-[var(--lead-site-accent-hover)]"
              data-slot="lease-finance-action"
            >
              <Link href={financeRequestHref}>
                <span>
                  {locale === "bg"
                    ? "Поискайте оферта"
                    : "Request financing offer"}
                </span>
                <DealerUiIcon className="size-[18px]" name="arrowRight" />
              </Link>
            </Button>
          </>
        ) : (
          <div className="mt-3 grid gap-2" data-slot="lease-vehicle-inventory">
            {filtered.length ? (
              filtered.map((vehicle) => (
                <LeaseSelectedVehicle
                  key={vehicle.id}
                  locale={locale}
                  onSelect={() => {
                    setQuery("");
                    onSelectVehicle(vehicle.id);
                    window.scrollTo({ top: 0, behavior: "instant" });
                    requestAnimationFrame(() =>
                      document
                        .querySelector<HTMLElement>(
                          '[data-slot="lease-finance-action"]'
                        )
                        ?.focus({ preventScroll: true })
                    );
                  }}
                  vehicle={vehicle}
                />
              ))
            ) : (
              <output className="rounded-xl bg-white px-4 py-8 text-center text-[15px] text-zinc-600">
                {locale === "bg"
                  ? "Няма автомобили с тези критерии. Променете филтрите или търсенето."
                  : "No cars match these criteria. Adjust your filters or search."}
              </output>
            )}
          </div>
        )}
      </div>
      <MarketplaceQuickFilterDrawer
        activeFilter={activeFilter}
        filters={filters}
        locale={locale}
        onApply={(updates) =>
          setFilters((current) => ({ ...current, ...updates }))
        }
        onClose={() => setActiveFilter(null)}
      />
      <MarketplaceFullFilterOverlay
        filters={{ ...filters, q: query || undefined }}
        locale={locale}
        onApply={(updates) => {
          setFilters((current) => ({ ...current, ...updates }));
          setQuery(updates.q ?? "");
        }}
        onOpenChange={setFilterOpen}
        open={filterOpen}
        taxonomy={fallbackVehicleTaxonomy}
      />
    </div>
  );
};
