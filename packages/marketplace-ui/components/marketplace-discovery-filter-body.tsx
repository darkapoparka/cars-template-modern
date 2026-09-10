"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import type {
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import { ChevronRight, Search } from "lucide-react";
import {
  getMarketplaceControlCopy,
  type MarketplaceFilterView,
} from "../lib/marketplace-control-copy";
import { getMarketplaceFilterSummary } from "../lib/marketplace-filter-summary";
import { MarketplaceCategoryOptions } from "./marketplace-category-options";
import { MarketplaceFilterSubview } from "./marketplace-filter-options";
import {
  marketplaceOptionButtonClassName,
  marketplaceSelectedOptionButtonClassName,
} from "./marketplace-model-picker-options";

export type DiscoveryFilterView =
  | MarketplaceFilterView
  | "category"
  | "make"
  | "model"
  | "more";

export const fullFilterOptionIds = [
  "body",
  "deliver-to",
  "origin",
  "price",
  "year",
  "mileage",
  "fuel",
  "transmission",
  "seller",
] as const satisfies readonly Exclude<MarketplaceFilterView, "main">[];

export const guidedMoreFilterOptionIds = [
  "body",
  "year",
  "origin",
  "deliver-to",
  "seller",
] as const satisfies readonly Exclude<MarketplaceFilterView, "main">[];

interface DiscoveryFilterViewProps {
  readonly draft: MarketplaceSearchParams;
  readonly isBg: boolean;
  readonly locale?: string;
  readonly setDraft: (draft: MarketplaceSearchParams) => void;
  readonly setView: (view: DiscoveryFilterView) => void;
  readonly taxonomy: VehicleTaxonomyMakeOption[];
}

const DiscoveryFilterMenuRow = ({
  label,
  onClick,
  value,
}: {
  readonly label: string;
  readonly onClick: () => void;
  readonly value?: string;
}) => (
  <button
    aria-label={value ? `${label}, ${value}` : label}
    className="grid min-h-12 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
    onClick={onClick}
    type="button"
  >
    <span className="font-medium text-[15px] text-zinc-950">{label}</span>
    {value ? (
      <span className="max-w-full justify-self-end truncate text-[14px] text-zinc-600">
        {value}
      </span>
    ) : (
      <span />
    )}
    <ChevronRight
      aria-hidden="true"
      className="size-4 shrink-0 text-zinc-600"
    />
  </button>
);

const DiscoveryFilterMainView = ({
  draft,
  isBg,
  isDesktop,
  locale,
  setDraft,
  setView,
}: DiscoveryFilterViewProps & { readonly isDesktop: boolean }) => {
  const copy = getMarketplaceControlCopy(locale);
  const makeModelSummary = [draft.make, draft.model, draft.derivative]
    .filter(Boolean)
    .join(" ");

  if (isDesktop) {
    return (
      <div className="space-y-1 p-3">
        {fullFilterOptionIds.map((id) => (
          <button
            className="flex min-h-12 w-full items-center justify-between rounded-lg px-3 text-base transition-colors hover:bg-secondary"
            key={id}
            onClick={() => setView(id)}
            type="button"
          >
            <span>{copy.filters[id]}</span>
            <span className="max-w-[55%] truncate text-muted-foreground">
              {getMarketplaceFilterSummary(id, draft, locale) ??
                copy.options.select}
            </span>
          </button>
        ))}
      </div>
    );
  }

  const allMakesLabel = isBg ? "Всички марки" : "All makes";
  const priceSummary =
    getMarketplaceFilterSummary("price", draft, locale) ??
    (isBg ? "Всеки бюджет" : "Any budget");
  const fuelSummary =
    getMarketplaceFilterSummary("fuel", draft, locale) ??
    (isBg ? "Всяко гориво" : "Any fuel");
  const mileageSummary =
    getMarketplaceFilterSummary("mileage", draft, locale) ??
    (isBg ? "Всеки пробег" : "Any mileage");
  const transmissionSummary =
    getMarketplaceFilterSummary("transmission", draft, locale) ??
    (isBg ? "Всички скорости" : "Any transmission");

  return (
    <div className="w-full min-w-0 space-y-3 overflow-hidden bg-zinc-50 px-4 py-3">
      <label className="flex h-12 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-zinc-950 focus-within:border-zinc-300 focus-within:outline-2 focus-within:outline-ring focus-within:outline-offset-2">
        <Search
          aria-hidden="true"
          className="size-[18px] shrink-0 text-zinc-600"
          strokeWidth={2}
        />
        <span className="sr-only">{copy.search.ariaLabel}</span>
        <input
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-zinc-600"
          onChange={(event) =>
            setDraft({ ...draft, q: event.target.value || undefined })
          }
          placeholder={
            isBg ? "Марка, модел или ключова дума" : "Make, model or keyword"
          }
          type="search"
          value={draft.q ?? ""}
        />
      </label>

      <DiscoveryFilterMenuRow
        label={isBg ? "Автомобил" : "Vehicle"}
        onClick={() => setView("category")}
        value={copy.categories[draft.category].label}
      />
      <DiscoveryFilterMenuRow
        label={isBg ? "Марка и модел" : "Make and model"}
        onClick={() => setView("make")}
        value={makeModelSummary || allMakesLabel}
      />
      <DiscoveryFilterMenuRow
        label={isBg ? "Бюджет" : "Budget"}
        onClick={() => setView("price")}
        value={priceSummary}
      />
      <DiscoveryFilterMenuRow
        label={copy.chips.fuel}
        onClick={() => setView("fuel")}
        value={fuelSummary}
      />
      <DiscoveryFilterMenuRow
        label={copy.chips.mileage}
        onClick={() => setView("mileage")}
        value={mileageSummary}
      />
      <DiscoveryFilterMenuRow
        label={copy.chips.transmission}
        onClick={() => setView("transmission")}
        value={transmissionSummary}
      />
      <DiscoveryFilterMenuRow
        label={isBg ? "Още филтри" : "More filters"}
        onClick={() => setView("more")}
      />
    </div>
  );
};

const DiscoveryCategoryView = ({
  draft,
  locale,
  setDraft,
  setView,
}: DiscoveryFilterViewProps) => {
  return (
    <MarketplaceCategoryOptions
      locale={locale}
      onSelect={(category) => {
        setDraft({ ...draft, body: undefined, category });
        setView("main");
      }}
      selectedCategory={draft.category}
    />
  );
};

const DiscoveryMakeView = ({
  draft,
  isBg,
  setDraft,
  setView,
  taxonomy,
}: DiscoveryFilterViewProps) => (
  <div className="grid grid-cols-2 gap-2 p-4">
    <Button
      className={cn(
        "h-12 rounded-xl",
        draft.make
          ? marketplaceOptionButtonClassName
          : marketplaceSelectedOptionButtonClassName
      )}
      onClick={() => {
        setDraft({
          ...draft,
          derivative: undefined,
          make: undefined,
          model: undefined,
          trim: undefined,
        });
        setView("main");
      }}
      variant={draft.make ? "secondary" : "default"}
    >
      {isBg ? "Всички марки" : "All makes"}
    </Button>
    {taxonomy.map((item) => (
      <Button
        aria-pressed={draft.make === item.name}
        className={cn(
          "h-12 rounded-xl",
          draft.make === item.name
            ? marketplaceSelectedOptionButtonClassName
            : marketplaceOptionButtonClassName
        )}
        key={item.slug}
        onClick={() => {
          setDraft({
            ...draft,
            derivative: undefined,
            make: item.name,
            model: undefined,
            trim: undefined,
          });
          setView("model");
        }}
        variant={draft.make === item.name ? "default" : "secondary"}
      >
        {item.name}
      </Button>
    ))}
  </div>
);

const DiscoveryModelView = ({
  draft,
  isBg,
  setDraft,
  setView,
  taxonomy,
}: DiscoveryFilterViewProps) => {
  const selectedModels =
    taxonomy.find((item) => item.name === draft.make)?.models ?? [];

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      <Button
        className={cn(
          "h-12 rounded-xl",
          draft.model
            ? marketplaceOptionButtonClassName
            : marketplaceSelectedOptionButtonClassName
        )}
        onClick={() => {
          setDraft({
            ...draft,
            derivative: undefined,
            model: undefined,
            trim: undefined,
          });
          setView("main");
        }}
        variant={draft.model ? "secondary" : "default"}
      >
        {isBg ? "Всички модели" : "All models"}
      </Button>
      {selectedModels.map((item) => (
        <Button
          aria-pressed={draft.model === item.name}
          className={cn(
            "h-12 rounded-xl",
            draft.model === item.name
              ? marketplaceSelectedOptionButtonClassName
              : marketplaceOptionButtonClassName
          )}
          key={item.slug}
          onClick={() => {
            setDraft({
              ...draft,
              derivative: undefined,
              model: item.name,
              trim: undefined,
            });
            setView("main");
          }}
          variant={draft.model === item.name ? "default" : "secondary"}
        >
          {item.name}
        </Button>
      ))}
    </div>
  );
};

const DiscoveryMoreFiltersView = ({
  draft,
  locale,
  setView,
}: DiscoveryFilterViewProps) => {
  const copy = getMarketplaceControlCopy(locale);
  return (
    <div className="space-y-1 p-3">
      {guidedMoreFilterOptionIds.map((id) => (
        <button
          className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-base transition-colors hover:bg-secondary"
          key={id}
          onClick={() => setView(id)}
          type="button"
        >
          <span>{copy.filters[id]}</span>
          <span className="max-w-[55%] truncate text-muted-foreground">
            {getMarketplaceFilterSummary(id, draft, locale) ??
              copy.options.select}
          </span>
        </button>
      ))}
    </div>
  );
};

export const DiscoveryFilterBody = ({
  draft,
  isBg,
  isDesktop,
  locale,
  setDraft,
  setView,
  taxonomy,
  view,
}: DiscoveryFilterViewProps & {
  readonly isDesktop: boolean;
  readonly view: DiscoveryFilterView;
}) => {
  const sharedProps = { draft, isBg, locale, setDraft, setView, taxonomy };
  if (view === "main") {
    return <DiscoveryFilterMainView {...sharedProps} isDesktop={isDesktop} />;
  }
  if (view === "category") {
    return <DiscoveryCategoryView {...sharedProps} />;
  }
  if (view === "make") {
    return <DiscoveryMakeView {...sharedProps} />;
  }
  if (view === "model") {
    return <DiscoveryModelView {...sharedProps} />;
  }
  if (view === "more") {
    return <DiscoveryMoreFiltersView {...sharedProps} />;
  }
  return (
    <MarketplaceFilterSubview
      draft={draft}
      locale={locale}
      setDraft={setDraft}
      view={view}
    />
  );
};

export const getDiscoveryOverlayTitle = (
  view: DiscoveryFilterView,
  draft: MarketplaceSearchParams,
  locale: string | undefined,
  isBg: boolean
) => {
  const copy = getMarketplaceControlCopy(locale);
  if (view === "main") {
    return isBg ? "Филтри" : "Filters";
  }
  if (view === "category") {
    return isBg ? "Автомобил" : "Vehicle";
  }
  if (view === "make") {
    return isBg ? "Марка" : "Make";
  }
  if (view === "model") {
    return draft.make ?? (isBg ? "Модел" : "Model");
  }
  if (view === "more") {
    return isBg ? "Още филтри" : "More filters";
  }
  return copy.filters[view];
};
