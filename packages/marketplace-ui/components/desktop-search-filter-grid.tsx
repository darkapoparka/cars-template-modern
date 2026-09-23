import type {
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import {
  formatBodyType,
  formatFuelType,
  formatTransmission,
} from "@repo/marketplace";
import { ChevronDown } from "lucide-react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import {
  getMarketplaceCurrencyLabel,
  marketplaceBodyTypesByCategory,
  marketplaceFuelOptions,
  marketplaceMileageRange,
  marketplacePriceRange,
  marketplaceSearchCurrency,
  marketplaceTransmissionOptions,
  marketplaceYearRange,
} from "../lib/marketplace-filter-config";

interface SelectOption {
  label: string;
  value: string;
}

const fieldClassName =
  "grid min-w-0 content-start gap-1.5 font-medium text-muted-foreground text-xs leading-4";
const controlClassName =
  "h-11 w-full min-w-0 rounded-xl border border-border bg-control px-3.5 font-normal text-sm text-foreground leading-5 outline-none transition focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60";

const includeCurrentOption = (
  options: SelectOption[],
  currentValue: string | undefined
) => {
  if (
    !currentValue ||
    options.some((option) => option.value === currentValue)
  ) {
    return options;
  }

  return [{ label: currentValue, value: currentValue }, ...options];
};

const readOptionalNumber = (value: string, min: number, max: number) => {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue)
    ? Math.max(min, Math.min(max, parsedValue))
    : undefined;
};

const getYearMinimumUpdates = (
  yearMin: number | undefined,
  yearMax: number | undefined
) =>
  yearMin !== undefined && yearMax !== undefined && yearMin > yearMax
    ? { yearMax: undefined, yearMin }
    : { yearMin };

const getYearMaximumUpdates = (
  yearMax: number | undefined,
  yearMin: number | undefined
) =>
  yearMax !== undefined && yearMin !== undefined && yearMax < yearMin
    ? { yearMax, yearMin: undefined }
    : { yearMax };

const getModelPlaceholder = (
  hasMake: boolean,
  isBg: boolean,
  anyLabel: string
) => {
  if (hasMake) {
    return anyLabel;
  }

  return isBg ? "Първо изберете марка" : "Choose a make first";
};

const SelectField = ({
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  value: string;
}) => (
  <label className={fieldClassName}>
    <span>{label}</span>
    <span className="relative block min-w-0">
      <select
        className={`${controlClassName} appearance-none truncate pr-10`}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground ${disabled ? "opacity-60" : ""}`}
        strokeWidth={1.75}
      />
    </span>
  </label>
);

const NumberField = ({
  label,
  max,
  min,
  onChange,
  placeholder,
  step,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number | undefined) => void;
  placeholder: string;
  step: number;
  value: number | undefined;
}) => (
  <label className={fieldClassName}>
    <span>{label}</span>
    <input
      className={controlClassName}
      max={max}
      min={min}
      onChange={(event) =>
        onChange(readOptionalNumber(event.target.value, min, max))
      }
      placeholder={placeholder}
      step={step}
      type="number"
      value={value ?? ""}
    />
  </label>
);

const TextField = ({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) => (
  <label className={fieldClassName}>
    <span>{label}</span>
    <input
      className={controlClassName}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
      value={value}
    />
  </label>
);

export const DesktopSearchFilterGrid = ({
  filters,
  locale,
  onApply,
  taxonomy,
}: {
  filters: MarketplaceSearchParams;
  locale?: string;
  onApply: (updates: Partial<MarketplaceSearchParams>) => void;
  taxonomy: VehicleTaxonomyMakeOption[];
}) => {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const copy = getMarketplaceControlCopy(locale);
  const selectedMake = taxonomy.find((make) => make.name === filters.make);
  const modelOptions = selectedMake?.models ?? [];
  const anyLabel = isBg ? "Всички" : "Any";
  const priceCurrency = getMarketplaceCurrencyLabel(isBg);
  const yearOptions = Array.from(
    {
      length: marketplaceYearRange[1] - marketplaceYearRange[0] + 1,
    },
    (_, index) => {
      const year = marketplaceYearRange[1] - index;
      return { label: String(year), value: String(year) };
    }
  );
  const makeOptions = includeCurrentOption(
    taxonomy.map((make) => ({ label: make.name, value: make.name })),
    filters.make
  );
  const availableModelOptions = includeCurrentOption(
    modelOptions.map((model) => ({ label: model.name, value: model.name })),
    filters.model
  );

  return (
    <fieldset
      className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 xl:grid-cols-4"
      data-slot="desktop-search-filter-grid"
    >
      <legend className="sr-only">
        {isBg ? "Филтри за автомобила" : "Vehicle filters"}
      </legend>
      <SelectField
        label={isBg ? "Марка" : "Make"}
        onChange={(value) =>
          onApply({
            derivative: undefined,
            make: value || undefined,
            model: undefined,
            trim: undefined,
          })
        }
        options={makeOptions}
        placeholder={copy.makeModel.selectMake}
        value={filters.make ?? ""}
      />
      <SelectField
        disabled={!selectedMake}
        label={isBg ? "Модел" : "Model"}
        onChange={(value) =>
          onApply({
            derivative: undefined,
            model: value || undefined,
            trim: undefined,
          })
        }
        options={availableModelOptions}
        placeholder={getModelPlaceholder(Boolean(selectedMake), isBg, anyLabel)}
        value={filters.model ?? ""}
      />
      <SelectField
        label={copy.filters.body}
        onChange={(value) =>
          onApply({
            body: (value || undefined) as MarketplaceSearchParams["body"],
          })
        }
        options={marketplaceBodyTypesByCategory[filters.category].map(
          (body) => ({ label: formatBodyType(body, locale), value: body })
        )}
        placeholder={anyLabel}
        value={filters.body ?? ""}
      />
      <SelectField
        label={copy.filters.seller}
        onChange={(value) =>
          onApply({
            seller: (value || undefined) as MarketplaceSearchParams["seller"],
          })
        }
        options={[
          { label: copy.options.dealer, value: "dealer" },
          { label: copy.options.privateSeller, value: "private" },
        ]}
        placeholder={anyLabel}
        value={filters.seller ?? ""}
      />
      <NumberField
        label={`${copy.options.minimumPrice} (${priceCurrency})`}
        max={marketplacePriceRange[1]}
        min={marketplacePriceRange[0]}
        onChange={(priceMin) =>
          onApply({
            currency:
              priceMin !== undefined || filters.priceMax !== undefined
                ? marketplaceSearchCurrency
                : undefined,
            priceMin,
          })
        }
        placeholder={anyLabel}
        step={1000}
        value={filters.priceMin}
      />
      <NumberField
        label={`${copy.options.maximumPrice} (${priceCurrency})`}
        max={marketplacePriceRange[1]}
        min={marketplacePriceRange[0]}
        onChange={(priceMax) =>
          onApply({
            currency:
              priceMax !== undefined || filters.priceMin !== undefined
                ? marketplaceSearchCurrency
                : undefined,
            priceMax,
          })
        }
        placeholder={anyLabel}
        step={1000}
        value={filters.priceMax}
      />
      <SelectField
        label={copy.options.minimumYear}
        onChange={(value) =>
          onApply(
            getYearMinimumUpdates(
              value ? Number(value) : undefined,
              filters.yearMax
            )
          )
        }
        options={yearOptions}
        placeholder={anyLabel}
        value={filters.yearMin?.toString() ?? ""}
      />
      <SelectField
        label={copy.options.maximumYear}
        onChange={(value) =>
          onApply(
            getYearMaximumUpdates(
              value ? Number(value) : undefined,
              filters.yearMin
            )
          )
        }
        options={yearOptions}
        placeholder={anyLabel}
        value={filters.yearMax?.toString() ?? ""}
      />
      <NumberField
        label={copy.options.maximumMileage}
        max={marketplaceMileageRange[1]}
        min={marketplaceMileageRange[0]}
        onChange={(mileageMax) => onApply({ mileageMax })}
        placeholder={anyLabel}
        step={5000}
        value={filters.mileageMax}
      />
      <SelectField
        label={copy.filters.fuel}
        onChange={(value) =>
          onApply({
            fuel: (value || undefined) as MarketplaceSearchParams["fuel"],
          })
        }
        options={marketplaceFuelOptions.map((fuel) => ({
          label: formatFuelType(fuel, locale),
          value: fuel,
        }))}
        placeholder={anyLabel}
        value={filters.fuel ?? ""}
      />
      <SelectField
        label={copy.filters.transmission}
        onChange={(value) =>
          onApply({
            transmission: (value ||
              undefined) as MarketplaceSearchParams["transmission"],
          })
        }
        options={marketplaceTransmissionOptions.map((transmission) => ({
          label: formatTransmission(transmission, locale),
          value: transmission,
        }))}
        placeholder={anyLabel}
        value={filters.transmission ?? ""}
      />
      <TextField
        label={isBg ? "Версия / пакет" : "Version / trim"}
        onChange={(trim) => onApply({ trim: trim || undefined })}
        placeholder={isBg ? "Напр. Sport" : "e.g. Sport"}
        value={filters.trim ?? ""}
      />
    </fieldset>
  );
};
