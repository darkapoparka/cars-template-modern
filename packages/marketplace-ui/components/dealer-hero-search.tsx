"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  buildMarketplaceSearchHref,
  fallbackVehicleTaxonomy,
  getCategoryPath,
  type MarketplaceSearchParams,
  parseMarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  withCategory,
  withSearchParamUpdates,
} from "@repo/marketplace";
import type { InventorySearchListing } from "@repo/marketplace/inventory-search";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import {
  Banknote,
  CarFront,
  ChevronDown,
  Grid2X2,
  HandCoins,
  Search,
  Ship,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import { useMarketplaceOverlayCoordinator } from "../hooks/use-marketplace-overlay-coordinator";
import {
  getDesktopPriceQuickFilterLabel,
  getDesktopQuickFilterLabels,
} from "../lib/desktop-filter-policy";
import {
  getMarketplaceCurrencyLabel,
  marketplaceBodyFilterOptions,
  marketplacePricePresets,
  marketplacePriceRange,
  marketplaceSearchCurrency,
} from "../lib/marketplace-filter-config";
import { getActiveFilterChips } from "../lib/marketplace-results-toolbar-policy";
import { getLocalizedPublicPath } from "../lib/public-path";
import styles from "./dealer-hero-search.module.css";
import {
  DesktopQuickFilterDialog,
  DesktopQuickRangeDialog,
} from "./desktop-filter-controls";
import {
  DesktopSearchAssistant,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-assistant";
import { MarketplaceFullFilterOverlay } from "./marketplace-full-filter-overlay";
import { MarketplaceMakeModelPicker } from "./marketplace-model-picker";

export interface DealerHeroSearchProps {
  assistantSlot?: ReactNode;
  categoryTabs?: ReactNode;
  filters: MarketplaceSearchParams;
  locale?: string;
  searchListings?: readonly InventorySearchListing[];
  taxonomy?: VehicleTaxonomyMakeOption[];
}

/** Shared desktop buy box keeps one draft until Search is submitted. */
export function DealerHeroSearch(props: DealerHeroSearchProps) {
  const {
    filters: initialFilters,
    locale,
    searchListings,
    assistantSlot,
    categoryTabs,
    taxonomy = fallbackVehicleTaxonomy,
  } = props;
  const router = useRouter();
  const isDesktop = useDesktopMarketplaceViewport();
  const [filters, setFilters] = useState(initialFilters);
  const query = filters.q ?? "";
  const setQuery = (value: string) =>
    setFilters((current) => ({ ...current, q: value }));
  const [pending, startTransition] = useTransition();
  const [makeModelStep, setMakeModelStep] = useState<"make" | "model" | null>(
    null
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const openOverlay = useMarketplaceOverlayCoordinator(
    makeModelStep !== null || filterOpen
  );
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const filterCount = getActiveFilterChips(filters, locale).filter(
    (chip) => chip.id !== "q"
  ).length;
  const onApply = (updates: Partial<MarketplaceSearchParams>) => {
    setFilters((current) => withSearchParamUpdates(current, updates));
  };
  const navigation = [
    { path: "/", label: text("Купи", "Buy"), icon: CarFront },
    { path: "/lease", label: text("Лизинг", "Lease"), icon: HandCoins },
    { path: "/sell", label: text("Продай", "Sell / Trade"), icon: Tag },
    { path: "/imports", label: text("Внос", "Import"), icon: Ship },
  ].filter((item) => isPublicSitePathEnabled(item.path, publicSite));
  const submit = (value: string) => {
    const normalized = value.trim();
    if (normalized) {
      rememberMarketplaceSearchQuery(normalized, "vehicles");
    }
    const next = withSearchParamUpdates(filters, {
      q: normalized || undefined,
      page: 1,
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
  const currencyLabel = getMarketplaceCurrencyLabel(isBg);
  return (
    <div
      className={styles.panel}
      data-slot="dealer-desktop-toolbar"
      data-variant={categoryTabs ? "default" : "hero"}
    >
      <nav
        aria-label={
          categoryTabs
            ? text("Категории превозни средства", "Vehicle categories")
            : text("Услуги за автомобили", "Vehicle services")
        }
        className={styles.tabs}
      >
        {categoryTabs ??
          navigation.map(({ path, label, icon: Icon }) => (
            <Link
              aria-current={path === "/" ? "page" : undefined}
              href={getLocalizedPublicPath(locale, path)}
              key={path}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </Link>
          ))}
      </nav>
      <form
        aria-busy={pending}
        aria-label={text("Търсене на автомобили", "Vehicle search")}
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <div className={styles.fields}>
          <DesktopQuickFilterDialog
            active={Boolean(filters.body)}
            anyLabel={text("Всички типове", "Any body type")}
            className={styles.field}
            dataSlot="desktop-hero-body"
            isBg={isBg}
            label={
              getDesktopQuickFilterLabels(filters, isBg, numberFormatter).body
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
            triggerIcon={<CarFront aria-hidden="true" size={17} />}
          />

          <Button
            aria-haspopup="dialog"
            className={styles.field}
            data-slot="desktop-hero-make"
            onClick={() => openOverlay(() => setMakeModelStep("make"))}
            type="button"
            variant="outline"
          >
            <Grid2X2 aria-hidden="true" size={16} />
            <span>{filters.make || text("Марка", "Make")}</span>
            <ChevronDown aria-hidden="true" size={15} />
          </Button>
          <Button
            aria-haspopup="dialog"
            className={styles.field}
            data-slot="desktop-hero-model"
            onClick={() => openOverlay(() => setMakeModelStep("model"))}
            type="button"
            variant="outline"
          >
            <CarFront aria-hidden="true" size={16} />
            <span>{filters.model || text("Модел", "Model")}</span>
            <ChevronDown aria-hidden="true" size={15} />
          </Button>
          <DesktopQuickRangeDialog
            active={Boolean(filters.priceMin || filters.priceMax)}
            className={styles.field}
            dataSlot="desktop-hero-price"
            description={text(
              "Изберете ценови диапазон.",
              "Choose a price range."
            )}
            formatValue={(value) =>
              `${numberFormatter.format(value)} ${currencyLabel}`
            }
            isBg={isBg}
            label={getDesktopPriceQuickFilterLabel(
              filters,
              isBg,
              numberFormatter
            )}
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
            triggerIcon={<Banknote aria-hidden="true" size={17} />}
          />
        </div>
        <div className={styles.searchRow}>
          <div className={styles.query}>
            <DesktopSearchAssistant
              appearance="hero"
              ariaLabel={text("Търсене на автомобили", "Search vehicles")}
              assistantSlot={assistantSlot}
              compact
              isBg={isBg}
              label={text("Търсене", "Search")}
              listings={searchListings}
              locale={locale}
              onQueryChange={setQuery}
              onSearch={submit}
              placeholder={text(
                "Марка, модел или ключова дума…",
                "Search by make, model or keyword…"
              )}
              query={query}
              scope="vehicles"
            />
            <Button
              aria-label={text("Търси автомобили", "Search vehicles")}
              className={styles.submit}
              data-slot="desktop-hero-submit"
              disabled={!isDesktop || pending}
              type="submit"
            >
              <Search aria-hidden="true" size={19} />
            </Button>
          </div>
          <Button
            aria-haspopup="dialog"
            aria-label={text("Още филтри", "More filters")}
            className={styles.moreFilters}
            data-slot="desktop-hero-more-filters"
            onClick={() => openOverlay(() => setFilterOpen(true))}
            type="button"
            variant="ghost"
          >
            <SlidersHorizontal aria-hidden="true" size={19} />
          </Button>
        </div>
        {(filterCount > 0 || query) && (
          <div className={styles.footer}>
            <span aria-live="polite" className={styles.draftStatus}>
              {filterCount > 0
                ? text(
                    `Избрани филтри: ${filterCount}`,
                    `Filters selected: ${filterCount}`
                  )
                : null}
            </span>
            {(filterCount > 0 || query) && (
              <Button
                className={styles.textAction}
                onClick={resetDraft}
                type="button"
                variant="ghost"
              >
                {text("Изчисти", "Reset")}
              </Button>
            )}
          </div>
        )}
      </form>
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
        taxonomy={taxonomy}
      />
      <MarketplaceFullFilterOverlay
        applyLabel={text("Приложи филтрите", "Apply filters")}
        filters={filters}
        locale={locale}
        onApply={onApply}
        onOpenChange={setFilterOpen}
        open={isDesktop && filterOpen}
        taxonomy={taxonomy}
      />
    </div>
  );
}
