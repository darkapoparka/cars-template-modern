"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/design-system/components/ui/popover";
import { cn } from "@repo/design-system/lib/utils";
import {
  type MarketplaceSearchParams,
  vehicleMakes,
} from "@repo/marketplace";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Info,
  LockKeyhole,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { localizeMarketplace } from "../lib/marketplace-filter-config";
import { getLocalizedPublicPath } from "../lib/public-path";
import {
  DesktopDiscoverySearch,
  type DesktopCategoryInventoryCount,
} from "./desktop-discovery-search";
import { getDesktopQuickFilterClassName } from "./desktop-quick-filters";
import type { MarketplaceMode } from "./marketplace-masthead";

type ApplyFilters = (filters: Partial<MarketplaceSearchParams>) => void;

export const LeadSiteSearchCutouts = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-0 hidden select-none overflow-hidden min-[112rem]:block"
    data-slot="lead-site-search-cutouts"
  >
    <Image
      alt=""
      className="absolute inset-y-0 left-0 h-full w-[22rem] max-w-none object-cover"
      height={216}
      priority
      sizes="(min-width: 1792px) 352px, 0px"
      src="/lead-car-left-v4.webp"
      width={704}
    />
    <Image
      alt=""
      className="absolute inset-y-0 right-0 h-full w-[22rem] max-w-none object-cover"
      height={216}
      priority
      sizes="(min-width: 1792px) 352px, 0px"
      src="/lead-car-right-v5.webp"
      width={704}
    />
  </div>
);

export const leadImportOrigins = [
  { code: "CN", labelBg: "Китай", labelEn: "China" },
  { code: "DE", labelBg: "Германия", labelEn: "Germany" },
  { code: "US", labelBg: "САЩ", labelEn: "United States" },
  { code: "JP", labelBg: "Япония", labelEn: "Japan" },
  { code: "KR", labelBg: "Южна Корея", labelEn: "South Korea" },
] as const;

type LeadImportCountryCode = "BG" | (typeof leadImportOrigins)[number]["code"];

const leadImportFlagArtwork = {
  BG: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v6.67H0z" fill="#fff" />
      <path d="M0 6.67h32v6.66H0z" fill="#00966e" />
      <path d="M0 13.33h32V20H0z" fill="#d62612" />
    </svg>
  ),
  CN: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v20H0z" fill="#de2910" />
      <path d="m6.2 2.1.86 2.65h2.79L7.6 6.38l.86 2.65L6.2 7.4 3.95 9.03l.86-2.65-2.26-1.63h2.79z" fill="#ffde00" />
      <circle cx="11.1" cy="2.8" fill="#ffde00" r=".65" />
      <circle cx="12.8" cy="5" fill="#ffde00" r=".65" />
      <circle cx="12.3" cy="7.7" fill="#ffde00" r=".65" />
      <circle cx="10.3" cy="9.4" fill="#ffde00" r=".65" />
    </svg>
  ),
  DE: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v6.67H0z" />
      <path d="M0 6.67h32v6.66H0z" fill="#dd0000" />
      <path d="M0 13.33h32V20H0z" fill="#ffce00" />
    </svg>
  ),
  JP: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v20H0z" fill="#fff" />
      <circle cx="16" cy="10" fill="#bc002d" r="5.2" />
    </svg>
  ),
  KR: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v20H0z" fill="#fff" />
      <path d="M11.5 10a4.5 4.5 0 0 1 9 0z" fill="#cd2e3a" />
      <path d="M20.5 10a4.5 4.5 0 0 1-9 0z" fill="#0047a0" />
      <path d="m6.8 5.1 4-2.3m-3.4 3.4 4-2.3M21.2 16l4-2.3m-4.6 1.2 4-2.3M21.3 3l4 2.3m-4.7-1.1 4 2.3M6.8 14.8l4 2.3m-4.6-1.1 4 2.3" stroke="#111" strokeWidth=".75" />
    </svg>
  ),
  US: (
    <svg aria-hidden="true" viewBox="0 0 32 20">
      <path d="M0 0h32v20H0z" fill="#fff" />
      <path d="M0 0h32v1.54H0zm0 3.08h32v1.54H0zm0 3.07h32v1.54H0zm0 3.08h32v1.54H0zm0 3.08h32v1.54H0zm0 3.07h32v1.54H0zm0 3.08h32V20H0z" fill="#b22234" />
      <path d="M0 0h14v10.77H0z" fill="#3c3b6e" />
    </svg>
  ),
} satisfies Record<LeadImportCountryCode, ReactNode>;

export const LeadImportFlag = ({
  className,
  code,
}: {
  className?: string;
  code: LeadImportCountryCode;
}) => (
  <span
    aria-hidden="true"
    className={cn(
      "[&>svg]:!block [&>svg]:!h-full [&>svg]:!w-full inline-flex shrink-0 overflow-hidden rounded-[3px] border border-black/15 bg-white",
      className
    )}
    data-slot="lead-import-flag"
  >
    {leadImportFlagArtwork[code]}
  </span>
);

const leadSellCategories = [
  { asset: "/lead-sell-car-v1.png", id: "car", labelBg: "Автомобил", labelEn: "Car" },
  { asset: "/lead-sell-van-v1.png", id: "van", labelBg: "Бус", labelEn: "Van" },
  { asset: "/lead-sell-motorcycle-v1.png", id: "motorbike", labelBg: "Мотоциклет", labelEn: "Motorbike" },
  { asset: "/lead-sell-truck-v1.png", id: "truck", labelBg: "Камион", labelEn: "Truck" },
] as const;

const DesktopSellSurface = ({ isBg, locale }: { isBg: boolean; locale?: string }) => (
  <form
    action={getLocalizedPublicPath(locale, "/sell")}
    className="mx-auto grid h-16 w-full max-w-[70rem] grid-cols-[14rem_minmax(18rem,1fr)_auto] rounded-2xl bg-card shadow-none focus-within:ring-2 focus-within:ring-[var(--lead-site-accent-ring)]"
    data-slot="desktop-sell-surface"
    method="get"
  >
    <label className="m-1.5 grid min-w-0 content-center rounded-xl bg-control px-4 py-1.5">
      <span className="font-semibold text-micro">{localizeMarketplace(isBg, "Марка", "Make")}</span>
      <select
        className="h-6 min-w-0 appearance-none bg-transparent text-compact-control text-muted-foreground outline-none"
        defaultValue=""
        name="make"
        required
      >
        <option disabled value="">{localizeMarketplace(isBg, "Изберете марка", "Choose a make")}</option>
        {vehicleMakes.map((make) => <option key={make} value={make}>{make}</option>)}
      </select>
    </label>
    <label className="grid min-w-0 content-center border-border/70 border-l px-6 py-1.5">
      <span className="font-semibold text-micro">{localizeMarketplace(isBg, "Модел", "Model")}</span>
      <input
        className="h-6 min-w-0 bg-transparent text-compact-control outline-none placeholder:text-muted-foreground"
        maxLength={80}
        name="model"
        placeholder={localizeMarketplace(isBg, "Напр. X5, A6, RAV4", "e.g. X5, A6, RAV4")}
        required
      />
    </label>
    <div className="m-1.5 grid place-items-center">
      <Button className="h-12 rounded-xl bg-[var(--lead-site-accent)] px-6 text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]" type="submit">
        {localizeMarketplace(isBg, "Продължи", "Continue")}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  </form>
);

const DesktopImportSurface = ({ isBg, locale }: { isBg: boolean; locale?: string }) => {
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [originCode, setOriginCode] = useState("");
  const [originOpen, setOriginOpen] = useState(false);
  const selectedOrigin = leadImportOrigins.find((origin) => origin.code === originCode);
  const originValue = selectedOrigin
    ? isBg ? selectedOrigin.labelBg : selectedOrigin.labelEn
    : localizeMarketplace(isBg, "Всички държави", "All countries");

  const selectOrigin = (value: string) => {
    setOriginCode(value);
    setOriginOpen(false);
  };

  return (
    <form
      action={getLocalizedPublicPath(locale, "/imports")}
      className="mx-auto grid h-16 w-full max-w-[70rem] grid-cols-[minmax(20rem,1.2fr)_minmax(18rem,1fr)_auto] rounded-2xl bg-card shadow-none"
      data-slot="desktop-import-surface"
      method="get"
    >
      <input name="start" type="hidden" value="1" />
      {originCode ? <input name="origin" type="hidden" value={originCode} /> : null}
      <Popover onOpenChange={setOriginOpen} open={originOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={originOpen}
            aria-label={`${localizeMarketplace(isBg, "Произход", "Origin")}: ${originValue}`}
            className={cn(
              "group m-1.5 h-14 min-w-0 cursor-pointer justify-between rounded-xl bg-control px-4 py-2 text-left shadow-none hover:bg-border/75",
              originOpen && "bg-border/75 ring-2 ring-[var(--lead-site-accent-ring)] ring-inset"
            )}
            type="button"
            variant="ghost"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-xs">{localizeMarketplace(isBg, "Произход", "Origin")}</span>
              <span className="mt-1 flex min-w-0 items-center gap-2 font-semibold text-base">
                {selectedOrigin ? <LeadImportFlag className="h-4 w-6" code={selectedOrigin.code} /> : null}
                <span className="truncate">{originValue}</span>
              </span>
            </span>
            <ChevronDown aria-hidden="true" className={cn("size-[18px] shrink-0 transition-transform", originOpen && "rotate-180")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[22rem] p-2" sideOffset={8}>
          <p className="px-2 pt-1 pb-2 font-semibold text-muted-foreground text-xs">
            {localizeMarketplace(isBg, "Изберете държава на произход", "Choose an origin country")}
          </p>
          <div className="grid gap-1">
            <Button
              aria-pressed={!originCode}
              className="h-10 justify-between px-3"
              onClick={() => selectOrigin("")}
              type="button"
              variant={originCode ? "ghost" : "secondary"}
            >
              {localizeMarketplace(isBg, "Всички държави", "All countries")}
              {originCode ? null : <Check aria-hidden="true" className="size-4" />}
            </Button>
            {leadImportOrigins.map((origin) => {
              const selected = originCode === origin.code;
              return (
                <Button
                  aria-pressed={selected}
                  className="h-10 justify-between px-3"
                  key={origin.code}
                  onClick={() => selectOrigin(origin.code)}
                  type="button"
                  variant={selected ? "secondary" : "ghost"}
                >
                  <span className="flex items-center gap-2">
                    <LeadImportFlag className="h-4 w-6" code={origin.code} />
                    {isBg ? origin.labelBg : origin.labelEn}
                  </span>
                  {selected ? <Check aria-hidden="true" className="size-4" /> : null}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <Popover onOpenChange={setDestinationOpen} open={destinationOpen}>
        <PopoverTrigger asChild>
          <Button
            aria-expanded={destinationOpen}
            className={cn(
              "group m-1.5 h-14 min-w-0 cursor-pointer justify-between rounded-xl bg-control px-4 py-2 text-left shadow-none hover:bg-border/75",
              destinationOpen && "bg-border/75 ring-2 ring-[var(--lead-site-accent-ring)] ring-inset"
            )}
            type="button"
            variant="ghost"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-xs">{localizeMarketplace(isBg, "Доставка до", "Deliver to")}</span>
              <span className="mt-1 flex min-w-0 items-center gap-2 font-semibold text-base">
                <LeadImportFlag className="h-[18px] w-7" code="BG" />
                <span>{localizeMarketplace(isBg, "България", "Bulgaria")}</span>
                <span className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-control-hover px-2 py-0.5 font-semibold text-micro text-muted-foreground">
                  <LockKeyhole aria-hidden="true" className="size-3" />
                  {localizeMarketplace(isBg, "Фиксирано", "Fixed")}
                </span>
              </span>
            </span>
            <Info aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-4" sideOffset={8}>
          <p className="font-semibold text-sm">{localizeMarketplace(isBg, "Дестинацията е България", "The destination is Bulgaria")}</p>
          <p className="mt-1 text-muted-foreground text-sm leading-5">{localizeMarketplace(isBg, "Заявката е за автомобил с доставка до България.", "Your request is for a vehicle delivered to Bulgaria.")}</p>
        </PopoverContent>
      </Popover>
      <div className="m-1.5 grid place-items-center">
        <Button className="h-12 cursor-pointer rounded-xl bg-[var(--lead-site-accent)] px-5 font-semibold text-base text-white shadow-none hover:bg-[var(--lead-site-accent-hover)]" type="submit">
          <ArrowRight aria-hidden="true" className="size-4" />
          {localizeMarketplace(isBg, "Заяви внос", "Request import")}
        </Button>
      </div>
    </form>
  );
};

export const getLeadMastheadMode = ({
  category,
  interactive,
  serviceMode,
}: {
  category: MarketplaceSearchParams["category"];
  interactive: boolean;
  serviceMode: MarketplaceMode;
}): MarketplaceMode => {
  if (interactive) return serviceMode;
  return category === "lease" ? "lease" : "buy";
};

export const DesktopLeadServiceSurface = ({
  assistantSlot,
  categoryCounts,
  compact,
  filters,
  interactive,
  isBg,
  locale,
  onApply,
  query,
  serviceMode,
  setQuery,
}: {
  assistantSlot?: ReactNode;
  categoryCounts?: DesktopCategoryInventoryCount[];
  compact: boolean;
  filters: MarketplaceSearchParams;
  interactive: boolean;
  isBg: boolean;
  locale?: string;
  onApply: ApplyFilters;
  query: string;
  serviceMode: MarketplaceMode;
  setQuery: (query: string) => void;
}) => {
  if (interactive && serviceMode === "sell") {
    return <DesktopSellSurface isBg={isBg} locale={locale} />;
  }
  if (interactive && serviceMode === "imports") {
    return <DesktopImportSurface isBg={isBg} locale={locale} />;
  }
  return (
    <DesktopDiscoverySearch
      assistantSlot={assistantSlot}
      categoryCounts={categoryCounts}
      compact={compact}
      filters={filters}
      isBg={isBg}
      locale={locale}
      onApply={onApply}
      query={query}
      setQuery={setQuery}
    />
  );
};

const serviceShortcutClassName = cn(
  getDesktopQuickFilterClassName(false),
  "w-auto min-w-24 shrink-0 justify-between gap-2 px-4"
);

export const DesktopServiceShortcuts = ({
  isBg,
  locale,
  mode,
}: {
  isBg: boolean;
  locale?: string;
  mode: MarketplaceMode;
}) => {
  if (mode === "sell") {
    return (
      <nav
        aria-label={localizeMarketplace(isBg, "Бърз старт по вид автомобил", "Quick start by vehicle type")}
        className="flex min-h-16 items-center justify-center gap-2"
        data-slot="desktop-service-shortcuts"
      >
        <span className="mr-1 font-semibold text-muted-foreground text-sm">{localizeMarketplace(isBg, "Продавате:", "Selling:")}</span>
        {leadSellCategories.map((category) => (
          <Button asChild className={serviceShortcutClassName} key={category.id} variant="ghost">
            <Link href={getLocalizedPublicPath(locale, `/sell?category=${category.id}`)}>
              <Image alt="" aria-hidden="true" className="h-6 w-9 shrink-0 object-contain" height={48} sizes="36px" src={category.asset} width={72} />
              <span>{isBg ? category.labelBg : category.labelEn}</span>
            </Link>
          </Button>
        ))}
      </nav>
    );
  }
  if (mode === "imports") {
    return (
      <nav
        aria-label={localizeMarketplace(isBg, "Бързи маршрути за внос", "Quick import origins")}
        className="flex min-h-16 items-center justify-center gap-2"
        data-slot="desktop-service-shortcuts"
      >
        <span className="mr-1 font-semibold text-muted-foreground text-sm">{localizeMarketplace(isBg, "Популярни държави:", "Popular origins:")}</span>
        {leadImportOrigins.map((origin) => (
          <Button asChild className={serviceShortcutClassName} key={origin.code} variant="ghost">
            <Link href={getLocalizedPublicPath(locale, `/imports?origin=${origin.code}&start=1#import-request`)}>
              <LeadImportFlag className="h-[18px] w-7" code={origin.code} />
              <span>{isBg ? origin.labelBg : origin.labelEn}</span>
            </Link>
          </Button>
        ))}
        <Button asChild className={serviceShortcutClassName} variant="ghost">
          <Link href={getLocalizedPublicPath(locale, "/imports?start=1#import-request")}>
            {localizeMarketplace(isBg, "Всички", "All")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      </nav>
    );
  }
  return null;
};
