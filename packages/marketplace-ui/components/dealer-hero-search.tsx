"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import {
  isPublicSitePathEnabled,
  publicSite,
} from "@repo/marketplace/site-config";
import {
  ArrowRight,
  CarFront,
  ChevronDown,
  HandCoins,
  Ship,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getDesktopPriceQuickFilterLabel } from "../lib/desktop-filter-policy";
import {
  getMarketplaceCurrencyLabel,
  marketplacePricePresets,
  marketplacePriceRange,
  marketplaceSearchCurrency,
} from "../lib/marketplace-filter-config";
import { getLocalizedPublicPath } from "../lib/public-path";
import type { DealerDesktopToolbarProps } from "./dealer-desktop-toolbar";
import styles from "./dealer-hero-search.module.css";
import { DesktopCategoryPickerContent } from "./desktop-discovery-search";
import { DesktopQuickRangeDialog } from "./desktop-filter-controls";
import {
  DesktopSearchAssistant,
  rememberMarketplaceSearchQuery,
} from "./desktop-search-assistant";

/** Desktop landing composition; shared pickers, search and URL actions retain ownership. */
export function DealerHeroSearch(props: DealerDesktopToolbarProps) {
  const {
    filters,
    locale,
    query,
    setQuery,
    onApply,
    onOpenMake,
    onOpenModel,
    onOpenFilters,
    categoryCounts,
    searchListings,
    assistantSlot,
  } = props;
  const isBg = locale?.startsWith("bg") ?? false;
  const text = (bg: string, en: string) => (isBg ? bg : en);
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const navigation = [
    { path: "/cars", label: text("Купи", "Buy"), icon: CarFront },
    { path: "/lease", label: text("Лизинг", "Lease"), icon: HandCoins },
    { path: "/sell", label: text("Продай", "Sell / Trade"), icon: Tag },
    { path: "/imports", label: text("Внос", "Import"), icon: Ship },
  ].filter((item) => isPublicSitePathEnabled(item.path, publicSite));
  const submit = (value: string) => {
    const normalized = value.trim();
    if (normalized) {
      rememberMarketplaceSearchQuery(normalized, "vehicles");
    }
    onApply(normalized ? { q: normalized } : { q: undefined, sort: "newest" });
  };
  const currencyLabel = getMarketplaceCurrencyLabel(isBg);
  return (
    <div
      className={styles.panel}
      data-slot="dealer-desktop-toolbar"
      data-variant="hero"
    >
      <nav
        aria-label={text("Услуги за автомобили", "Vehicle services")}
        className={styles.tabs}
      >
        {navigation.map(({ path, label, icon: Icon }) => (
          <Link
            aria-current={path === "/cars" ? "page" : undefined}
            href={getLocalizedPublicPath(locale, path)}
            key={path}
          >
            <Icon aria-hidden="true" size={18} />
            {label}
          </Link>
        ))}
      </nav>
      <form
        aria-label={text("Търсене на автомобили", "Vehicle search")}
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          submit(query);
        }}
      >
        <div className={styles.fields}>
          <Dialog onOpenChange={setCategoryOpen} open={categoryOpen}>
            <DialogTrigger asChild>
              <Button
                aria-label={text("Избери категория", "Choose category")}
                className={styles.field}
                data-slot="desktop-search-category"
                type="button"
                variant="outline"
              >
                <CarFront aria-hidden="true" size={17} />
                <span>{text("Автомобили", "All types")}</span>
                <ChevronDown aria-hidden="true" size={15} />
              </Button>
            </DialogTrigger>
            <DesktopCategoryPickerContent
              categoryCounts={categoryCounts}
              filters={filters}
              isBg={isBg}
              locale={locale}
              onClose={() => setCategoryOpen(false)}
            />
          </Dialog>
          <Button
            aria-haspopup="dialog"
            className={styles.field}
            data-slot="desktop-hero-make"
            onClick={onOpenMake}
            type="button"
            variant="outline"
          >
            <span>{filters.make || text("Марка", "Make")}</span>
            <ChevronDown aria-hidden="true" size={15} />
          </Button>
          <Button
            aria-haspopup="dialog"
            className={styles.field}
            data-slot="desktop-hero-model"
            onClick={onOpenModel}
            type="button"
            variant="outline"
          >
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
          </div>
          <Button
            aria-haspopup="dialog"
            aria-label={text("Филтри", "Filters")}
            className={styles.more}
            onClick={onOpenFilters}
            title={text("Всички филтри", "All filters")}
            type="button"
            variant="outline"
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
          </Button>
          <Button
            className={styles.submit}
            data-slot="desktop-hero-submit"
            type="submit"
          >
            {text("Търси автомобили", "Search vehicles")}
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </div>
      </form>
    </div>
  );
}
