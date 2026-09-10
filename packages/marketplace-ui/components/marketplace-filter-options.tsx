"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import {
  formatBodyType,
  type FuelType,
  type MarketplaceSearchParams,
  type Transmission,
} from "@repo/marketplace";
import {
  getLocalizedMarketplaceCityName,
  getLocalizedMarketplaceCountryName,
  getMarketplaceControlCopy,
  isBulgarianMarketplaceLocale,
  type MarketplaceFilterView,
} from "../lib/marketplace-control-copy";
import {
  marketplaceBodyTypesByCategory,
  marketplaceCityOptions,
  marketplaceCurrency,
  marketplaceMileagePresets,
  marketplaceMileageRange,
  marketplacePricePresets,
  marketplacePriceRange,
  marketplaceYearPresets,
  marketplaceYearRange,
} from "../lib/marketplace-filter-config";
import { publicCountryOptions } from "../lib/listing-truth";
import { NumericRangeFilter } from "./numeric-range-filter";
import {
  marketplaceOptionButtonClassName,
  marketplaceSelectedOptionButtonClassName,
} from "./marketplace-model-picker-options";

export const MarketplaceOptionGrid = ({
  onSelect,
  options,
  selected,
}: {
  onSelect: (value: string) => void;
  options: [string, string][];
  selected?: string;
}) => (
  <div className="grid grid-cols-2 gap-2 p-4">
    {options.map(([value, label]) => (
      <Button
        aria-pressed={selected === value}
        className={cn(
          "h-auto min-h-12 rounded-xl",
          selected === value
            ? marketplaceSelectedOptionButtonClassName
            : marketplaceOptionButtonClassName
        )}
        key={value}
        onClick={() => onSelect(value)}
        variant={selected === value ? "default" : "secondary"}
      >
        {label}
      </Button>
    ))}
  </div>
);

export const MarketplaceCountryOptionGrid = ({
  locale,
  onSelect,
  selected,
}: {
  locale?: string;
  onSelect: (value: string | undefined) => void;
  selected?: string;
}) => {
  const copy = getMarketplaceControlCopy(locale);

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      <Button
        aria-pressed={!selected}
        className={cn(
          "col-span-2 h-auto min-h-12 rounded-xl",
          selected
            ? marketplaceOptionButtonClassName
            : marketplaceSelectedOptionButtonClassName
        )}
        onClick={() => onSelect(undefined)}
        variant={selected ? "secondary" : "default"}
      >
        {copy.countries.any}
      </Button>
      {publicCountryOptions.map((country) => (
        <Button
          aria-pressed={selected === country.code}
          className={cn(
            "h-auto min-h-12 rounded-xl",
            selected === country.code
              ? marketplaceSelectedOptionButtonClassName
              : marketplaceOptionButtonClassName
          )}
          key={country.code}
          onClick={() => onSelect(country.code)}
          variant={selected === country.code ? "default" : "secondary"}
        >
          {getLocalizedMarketplaceCountryName(country.code, locale)}
        </Button>
      ))}
    </div>
  );
};

interface NumericFilterSubviewProps {
  draft: MarketplaceSearchParams;
  locale?: string;
  setDraft: (draft: MarketplaceSearchParams) => void;
}

const PriceFilterSubview = ({ draft, locale, setDraft }: NumericFilterSubviewProps) => {
  const copy = getMarketplaceControlCopy(locale);
  const isBg = isBulgarianMarketplaceLocale(locale);
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const currencyLabel =
    isBg && marketplaceCurrency === "BGN" ? "лв." : marketplaceCurrency;
  const draftMinimum = draft.priceMin ?? marketplacePriceRange[0];
  const draftMaximum = draft.priceMax ?? marketplacePriceRange[1];
  const value = [
    Math.min(draftMinimum, draftMaximum),
    Math.max(draftMinimum, draftMaximum),
  ] as const;

  return (
    <NumericRangeFilter
      className="p-4"
      formatValue={(nextValue) => `${numberFormatter.format(nextValue)} ${currencyLabel}`}
      label={isBg ? "Избран диапазон" : "Selected range"}
      maximumLabel={copy.options.maximum}
      maximumPrefix={isBg ? "До" : "Up to"}
      minimumLabel={copy.options.minimum}
      onValueChange={([priceMin, priceMax]) =>
        setDraft({
          ...draft,
          priceMax: priceMax === marketplacePriceRange[1] ? undefined : priceMax,
          priceMin: priceMin === marketplacePriceRange[0] ? undefined : priceMin,
        })
      }
      presets={marketplacePricePresets.map((presetMaximum) => ({
        label: `${isBg ? "До" : "To"} ${numberFormatter.format(presetMaximum)} ${currencyLabel}`,
        value: [marketplacePriceRange[0], presetMaximum],
      }))}
      quickSelectLabel={isBg ? "Бърз избор" : "Quick select"}
      range={marketplacePriceRange}
      step={1000}
      thumbLabels={[copy.options.minimumPrice, copy.options.maximumPrice]}
      value={value}
    />
  );
};

const YearFilterSubview = ({ draft, locale, setDraft }: NumericFilterSubviewProps) => {
  const copy = getMarketplaceControlCopy(locale);
  const isBg = isBulgarianMarketplaceLocale(locale);
  const value = [
    draft.yearMin ?? marketplaceYearRange[0],
    draft.yearMax ?? marketplaceYearRange[1],
  ] as const;

  return (
    <NumericRangeFilter
      className="p-4"
      formatValue={(nextValue) => nextValue.toString()}
      label={isBg ? "Избран диапазон" : "Selected range"}
      maximumLabel={copy.options.maximum}
      maximumPrefix={isBg ? "До" : "Up to"}
      minimumLabel={copy.options.minimum}
      onValueChange={([yearMin, yearMax]) =>
        setDraft({
          ...draft,
          yearMax: yearMax === marketplaceYearRange[1] ? undefined : yearMax,
          yearMin: yearMin === marketplaceYearRange[0] ? undefined : yearMin,
        })
      }
      presets={marketplaceYearPresets.map((presetMinimum) => ({
        label: `${isBg ? "От" : "From"} ${presetMinimum}`,
        value: [presetMinimum, marketplaceYearRange[1]],
      }))}
      quickSelectLabel={isBg ? "Бърз избор" : "Quick select"}
      range={marketplaceYearRange}
      step={1}
      thumbLabels={[copy.options.minimumYear, copy.options.maximumYear]}
      value={value}
    />
  );
};

const MileageFilterSubview = ({ draft, locale, setDraft }: NumericFilterSubviewProps) => {
  const copy = getMarketplaceControlCopy(locale);
  const isBg = isBulgarianMarketplaceLocale(locale);
  const numberFormatter = new Intl.NumberFormat(isBg ? "bg-BG" : "en-US");
  const value = [
    marketplaceMileageRange[0],
    draft.mileageMax ?? marketplaceMileageRange[1],
  ] as const;

  return (
    <NumericRangeFilter
      className="p-4"
      formatValue={(nextValue) =>
        `${numberFormatter.format(nextValue)} ${isBg ? "км" : "km"}`
      }
      label={isBg ? "Избрана стойност" : "Selected value"}
      maximumLabel={copy.options.maximumMileage}
      maximumOnly
      maximumPrefix={isBg ? "До" : "Up to"}
      minimumLabel={copy.options.minimum}
      onValueChange={([, mileageMax]) =>
        setDraft({
          ...draft,
          mileageMax:
            mileageMax === marketplaceMileageRange[1] ? undefined : mileageMax,
        })
      }
      presets={marketplaceMileagePresets.map((presetMaximum) => ({
        label: `${isBg ? "До" : "To"} ${numberFormatter.format(presetMaximum)} ${isBg ? "км" : "km"}`,
        value: [marketplaceMileageRange[0], presetMaximum],
      }))}
      quickSelectLabel={isBg ? "Бърз избор" : "Quick select"}
      range={marketplaceMileageRange}
      step={5000}
      thumbLabels={[copy.options.minimum, copy.options.maximumMileage]}
      value={value}
    />
  );
};

const NumericFilterSubview = ({
  draft,
  locale,
  setDraft,
  view,
}: NumericFilterSubviewProps & { view: "mileage" | "price" | "year" }) => {
  if (view === "price") {
    return <PriceFilterSubview draft={draft} locale={locale} setDraft={setDraft} />;
  }
  if (view === "year") {
    return <YearFilterSubview draft={draft} locale={locale} setDraft={setDraft} />;
  }
  return <MileageFilterSubview draft={draft} locale={locale} setDraft={setDraft} />;
};

export const MarketplaceFilterSubview = ({
  draft,
  locale,
  setDraft,
  view,
}: {
  draft: MarketplaceSearchParams;
  locale?: string;
  setDraft: (draft: MarketplaceSearchParams) => void;
  view: MarketplaceFilterView;
}) => {
  const copy = getMarketplaceControlCopy(locale);

  if (view === "body") {
    return (
      <MarketplaceOptionGrid
        onSelect={(body) =>
          setDraft({ ...draft, body: body as MarketplaceSearchParams["body"] })
        }
        options={marketplaceBodyTypesByCategory[draft.category].map((body) => [
          body,
          formatBodyType(body, locale),
        ])}
        selected={draft.body}
      />
    );
  }
  if (view === "deliver-to") {
    return (
      <MarketplaceCountryOptionGrid
        locale={locale}
        onSelect={(deliverTo) => setDraft({ ...draft, deliverTo })}
        selected={draft.deliverTo}
      />
    );
  }
  if (view === "origin") {
    return (
      <MarketplaceCountryOptionGrid
        locale={locale}
        onSelect={(origin) => setDraft({ ...draft, origin })}
        selected={draft.origin}
      />
    );
  }
  if (view === "location") {
    return (
      <MarketplaceOptionGrid
        onSelect={(location) => setDraft({ ...draft, location })}
        options={marketplaceCityOptions.map((city) => [
          city,
          getLocalizedMarketplaceCityName(city, locale),
        ])}
        selected={draft.location}
      />
    );
  }
  if (view === "price" || view === "year" || view === "mileage") {
    return (
      <NumericFilterSubview
        draft={draft}
        locale={locale}
        setDraft={setDraft}
        view={view}
      />
    );
  }
  if (view === "fuel") {
    return (
      <MarketplaceOptionGrid
        onSelect={(fuel) => setDraft({ ...draft, fuel: fuel as FuelType })}
        options={[
          ["diesel", copy.options.diesel],
          ["gasoline", copy.options.gasoline],
          ["hybrid", copy.options.hybrid],
          ["plug_in_hybrid", copy.options.phev],
          ["electric", copy.options.electric],
          ["lpg", copy.options.lpg],
        ]}
        selected={draft.fuel}
      />
    );
  }
  if (view === "transmission") {
    return (
      <MarketplaceOptionGrid
        onSelect={(transmission) =>
          setDraft({ ...draft, transmission: transmission as Transmission })
        }
        options={[
          ["automatic", copy.options.automatic],
          ["manual", copy.options.manual],
          ["semi_automatic", copy.options.semiAutomatic],
        ]}
        selected={draft.transmission}
      />
    );
  }

  return (
    <MarketplaceOptionGrid
      onSelect={(seller) =>
        setDraft({ ...draft, seller: seller as "dealer" | "private" })
      }
      options={[
        ["dealer", copy.options.dealer],
        ["private", copy.options.privateSeller],
      ]}
      selected={draft.seller}
    />
  );
};
