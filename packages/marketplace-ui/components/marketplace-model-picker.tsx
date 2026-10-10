"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { cn } from "@repo/design-system/lib/utils";
import {
  formatBodyType,
  type MarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  type VehicleTaxonomyModelOption,
} from "@repo/marketplace";
import { Check, Eraser, Search } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useDesktopMarketplaceViewport } from "../hooks/use-desktop-marketplace-viewport";
import {
  formatMarketplaceModelYearRange,
  getMarketplaceControlCopy,
  getMarketplaceDerivativeDisplayName,
} from "../lib/marketplace-control-copy";
import {
  getMarketplaceModelInventoryKey,
  getMarketplaceModelPickerGroups,
  type MarketplaceModelInventoryCount,
} from "../lib/model-picker-options";
import { DesktopMakeModelDialog } from "./desktop-make-model-dialog";
import styles from "./marketplace-model-picker.module.css";
import {
  ModelPickerSections,
  marketplaceFilledPickerOptionButtonClassName,
  marketplaceOptionButtonClassName,
  marketplaceSelectedFilledPickerOptionButtonClassName,
  marketplaceSelectedOptionButtonClassName,
} from "./marketplace-model-picker-options";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayField,
  MobileMarketplaceOverlayIconAction,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "./mobile-marketplace-overlay";

const getInitialMakeModelStep = (
  filters: MarketplaceSearchParams
): "make" | "model" => (filters.make ? "model" : "make");

const ModelDerivativeOption = ({
  item,
  isSelected,
  locale,
  model,
  onSelect,
}: {
  item: VehicleTaxonomyModelOption["derivatives"][number];
  isSelected: boolean;
  locale?: string;
  model?: string;
  onSelect: (value: string) => void;
}) => {
  const yearRange = formatMarketplaceModelYearRange(item, locale);
  return (
    <Button
      aria-pressed={isSelected}
      className={cn(
        "h-auto min-h-14 w-full justify-between whitespace-normal rounded-lg px-4 py-2.5 text-left",
        isSelected
          ? marketplaceSelectedFilledPickerOptionButtonClassName
          : marketplaceFilledPickerOptionButtonClassName
      )}
      onClick={() => onSelect(item.name)}
      variant={isSelected ? "default" : "secondary"}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-5">
          {getMarketplaceDerivativeDisplayName(model ?? "", item.name)}
        </span>
        {item.bodyType || yearRange ? (
          <span
            className={cn(
              "block text-meta",
              isSelected ? "text-background/70" : "text-muted-foreground"
            )}
            data-slot="picker-option-meta"
          >
            {[
              item.bodyType ? formatBodyType(item.bodyType, locale) : undefined,
              yearRange,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        ) : null}
      </span>
      {isSelected ? (
        <Check aria-hidden="true" className="size-5" strokeWidth={2.4} />
      ) : null}
    </Button>
  );
};

export const MakeModelSearchField = ({
  ariaLabel,
  step,
  isDesktop,
  search,
  onSearch,
  locale,
}: {
  ariaLabel?: string;
  step: "make" | "model";
  isDesktop: boolean;
  search: string;
  onSearch: (value: string) => void;
  locale?: string;
}) => {
  const copy = getMarketplaceControlCopy(locale);
  if (!isDesktop) {
    return (
      <MobileMarketplaceOverlayField
        aria-label={copy.makeModel.searchAriaLabel}
        className="mt-3"
        clearAction={{ label: copy.actions.clear, onClear: () => onSearch("") }}
        icon={
          <Search
            aria-hidden="true"
            className="size-[18px] shrink-0 text-zinc-600"
          />
        }
        onChange={(event) => onSearch(event.target.value)}
        placeholder={
          step === "make"
            ? copy.makeModel.searchMakes
            : copy.makeModel.searchModels
        }
        type="search"
        value={search}
      />
    );
  }
  return (
    <div className={styles.search}>
      <Search
        aria-hidden="true"
        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={ariaLabel ?? copy.makeModel.searchAriaLabel}
        className={styles.searchInput}
        onChange={(event) => onSearch(event.target.value)}
        placeholder={
          step === "make"
            ? copy.makeModel.searchMakes
            : copy.makeModel.searchModels
        }
        type="search"
        value={search}
      />
    </div>
  );
};

const ModelDerivativeOptions = ({
  selectedModel,
  model,
  derivative,
  locale,
  onSelect,
}: {
  selectedModel?: VehicleTaxonomyModelOption;
  model?: string;
  derivative?: string;
  locale?: string;
  onSelect: (value: string | undefined) => void;
}) => {
  const copy = getMarketplaceControlCopy(locale);
  return (
    <div className="space-y-3" data-slot="derivative-options">
      <div className="px-1">
        <p className="font-semibold text-body">
          {copy.makeModel.derivativeHeading}
        </p>
        <p className="mt-0.5 text-meta text-muted-foreground">
          {copy.makeModel.derivativeDescription}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Button
          aria-pressed={derivative === undefined}
          className={cn(
            "h-auto min-h-14 w-full justify-between whitespace-normal rounded-lg px-4 py-2.5 text-left",
            derivative === undefined
              ? marketplaceSelectedFilledPickerOptionButtonClassName
              : marketplaceFilledPickerOptionButtonClassName
          )}
          onClick={() => onSelect(undefined)}
          variant={derivative === undefined ? "default" : "secondary"}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-5">
              {copy.makeModel.anyDerivative}
            </span>
            <span
              className={cn(
                "block text-meta",
                derivative === undefined
                  ? "text-background/70"
                  : "text-muted-foreground"
              )}
              data-slot="picker-option-meta"
            >
              {copy.makeModel.anyDerivativeDescription}
            </span>
          </span>
          {derivative === undefined ? (
            <Check aria-hidden="true" className="size-5" strokeWidth={2.4} />
          ) : null}
        </Button>
        {(selectedModel?.derivatives ?? []).map((item) => (
          <ModelDerivativeOption
            isSelected={derivative === item.name}
            item={item}
            key={item.slug}
            locale={locale}
            model={model}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

interface MakeModelPickerOptionsProps {
  derivative?: string;
  groups: ReturnType<typeof getMarketplaceModelPickerGroups>;
  isDesktop: boolean;
  locale?: string;
  make?: string;
  makes: VehicleTaxonomyMakeOption[];
  model?: string;
  modelCount: number;
  modelInventoryCountByKey?: ReadonlyMap<string, number>;
  onClearSearch: () => void;
  onSelectAny?: () => void;
  onSelectDerivative: (value: string | undefined) => void;
  onSelectMake: (value: string) => void;
  onSelectModel: (item: VehicleTaxonomyModelOption) => void;
  selectedModel?: VehicleTaxonomyModelOption;
  step: "make" | "model" | "derivative";
}
function AnyMakeModelOption({
  className,
  label,
  onSelect,
  selected,
}: {
  className: string;
  label: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <Button
      aria-pressed={selected}
      className={cn(
        className,
        selected
          ? marketplaceSelectedOptionButtonClassName
          : marketplaceOptionButtonClassName,
        selected &&
          "border-brand bg-brand text-brand-foreground hover:bg-brand hover:text-brand-foreground"
      )}
      onClick={onSelect}
      variant={selected ? "default" : "secondary"}
    >
      {label}
    </Button>
  );
}
function MakePickerOptions({
  isDesktop,
  locale,
  make,
  makes,
  onSelectAny,
  onSelectMake,
}: Pick<
  MakeModelPickerOptionsProps,
  "isDesktop" | "locale" | "make" | "makes" | "onSelectAny" | "onSelectMake"
>) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div
      className={cn("grid gap-2", isDesktop ? "grid-cols-4" : "grid-cols-2")}
    >
      {onSelectAny ? (
        <AnyMakeModelOption
          className="h-12 rounded-lg"
          label={isBg ? "Всички марки" : "All makes"}
          onSelect={onSelectAny}
          selected={!make}
        />
      ) : null}
      {makes.map((item) => (
        <Button
          aria-pressed={make === item.name}
          className={cn(
            "h-12 justify-center rounded-lg",
            make === item.name
              ? marketplaceSelectedOptionButtonClassName
              : marketplaceOptionButtonClassName
          )}
          key={item.slug}
          onClick={() => onSelectMake(item.name)}
          variant={make === item.name ? "default" : "secondary"}
        >
          {item.name}
        </Button>
      ))}
    </div>
  );
}
function ModelPickerOptions({
  groups,
  isDesktop,
  locale,
  make,
  model,
  modelInventoryCountByKey,
  onSelectAny,
  onSelectModel,
}: Pick<
  MakeModelPickerOptionsProps,
  | "groups"
  | "isDesktop"
  | "locale"
  | "make"
  | "model"
  | "modelInventoryCountByKey"
  | "onSelectAny"
  | "onSelectModel"
>) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const copy = getMarketplaceControlCopy(locale);
  return (
    <>
      {onSelectAny ? (
        <AnyMakeModelOption
          className="mb-2 h-12 w-full rounded-lg"
          label={isBg ? "Всички модели" : "All models"}
          onSelect={onSelectAny}
          selected={!model}
        />
      ) : null}
      <ModelPickerSections
        additionalModelsLabel={copy.makeModel.additionalModels}
        countByKey={modelInventoryCountByKey}
        isDesktop={isDesktop}
        make={make}
        model={model}
        onSelect={onSelectModel}
        popular={groups.popular}
        popularModelsLabel={copy.makeModel.popularModels}
        remaining={groups.remaining}
      />
    </>
  );
}
function EmptyMakeModelSearch({
  locale,
  onClear,
}: {
  locale?: string;
  onClear: () => void;
}) {
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  return (
    <div className={styles.empty}>
      <Search aria-hidden="true" size={24} />
      <output>
        {isBg
          ? "Няма съвпадения. Опитайте с друго име."
          : "No matches. Try another name."}
      </output>
      <Button onClick={onClear} type="button" variant="secondary">
        {isBg ? "Изчисти търсенето" : "Clear search"}
      </Button>
    </div>
  );
}
export function MakeModelPickerOptions(props: MakeModelPickerOptionsProps) {
  const {
    derivative,
    isDesktop,
    locale,
    makes,
    model,
    modelCount,
    onClearSearch,
    onSelectDerivative,
    selectedModel,
    step,
  } = props;
  let options: ReactNode;
  if (step === "make") {
    options = <MakePickerOptions {...props} />;
  } else if (step === "model") {
    options = <ModelPickerOptions {...props} />;
  } else {
    options = (
      <ModelDerivativeOptions
        derivative={derivative}
        locale={locale}
        model={model}
        onSelect={onSelectDerivative}
        selectedModel={selectedModel}
      />
    );
  }
  const empty =
    isDesktop &&
    ((step === "make" && makes.length === 0) ||
      (step === "model" && modelCount === 0));
  return (
    <>
      {options}
      {empty ? (
        <EmptyMakeModelSearch locale={locale} onClear={onClearSearch} />
      ) : null}
    </>
  );
}

export const MarketplaceMakeModelPicker = ({
  applyLabel,
  filters,
  initialStep,
  locale,
  modelCounts,
  onApply,
  onDesktopApply,
  onOpenChange,
  open,
  taxonomy,
}: {
  filters: MarketplaceSearchParams;
  applyLabel?: string;
  initialStep: "auto" | "make" | "model";
  locale?: string;
  modelCounts?: MarketplaceModelInventoryCount[];
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onDesktopApply?: (filters: Partial<MarketplaceSearchParams>) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  taxonomy: VehicleTaxonomyMakeOption[];
}) => {
  const isDesktop = useDesktopMarketplaceViewport();
  const applyFilters = isDesktop ? (onDesktopApply ?? onApply) : onApply;
  const [step, setStep] = useState<"derivative" | "make" | "model">("make");
  const [make, setMake] = useState<string | undefined>(filters.make);
  const [model, setModel] = useState<string | undefined>(filters.model);
  const [derivative, setDerivative] = useState<string | undefined>(
    filters.derivative
  );
  const [search, setSearch] = useState("");
  const copy = getMarketplaceControlCopy(locale);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMake(filters.make);
    setModel(filters.model);
    setDerivative(filters.derivative);
    let nextStep = getInitialMakeModelStep(filters);
    if (initialStep === "make") {
      nextStep = "make";
    } else if (initialStep === "model" && filters.make) {
      nextStep = "model";
    } else if (filters.make && filters.model) {
      const modelDefinition = taxonomy
        .find((item) => item.name === filters.make)
        ?.models.find((item) => item.name === filters.model);
      if ((modelDefinition?.derivatives.length ?? 0) > 0) {
        setStep("derivative");
        setSearch("");
        return;
      }
    }
    setStep(nextStep);
    setSearch("");
  }, [filters, initialStep, open, taxonomy]);

  const makes = useMemo(
    () =>
      taxonomy.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, taxonomy]
  );
  const models = useMemo(() => {
    if (!make) {
      return [];
    }
    return (taxonomy.find((item) => item.name === make)?.models ?? []).filter(
      (item) => item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [make, search, taxonomy]);
  const modelGroups = useMemo(
    () =>
      getMarketplaceModelPickerGroups({
        make,
        models,
        prioritizePopular: search.trim().length === 0,
      }),
    [make, models, search]
  );
  const modelInventoryCountByKey = useMemo(() => {
    if (!modelCounts) {
      return undefined;
    }
    return new Map(
      modelCounts.map((item) => [
        getMarketplaceModelInventoryKey(item.make, item.model),
        item.count,
      ])
    );
  }, [modelCounts]);
  const selectedModel = useMemo(() => {
    if (!(make && model)) {
      return undefined;
    }
    return taxonomy
      .find((item) => item.name === make)
      ?.models.find((item) => item.name === model);
  }, [make, model, taxonomy]);

  const handleApply = () => {
    applyFilters({ derivative, make, model, trim: undefined });
    onOpenChange(false);
  };
  const goBack = () => {
    setSearch("");
    setStep(step === "derivative" ? "model" : "make");
  };
  const clearSelection = () => {
    applyFilters({
      derivative: undefined,
      make: undefined,
      model: undefined,
      trim: undefined,
    });
    onOpenChange(false);
  };
  const selectModel = (item: VehicleTaxonomyModelOption) => {
    setModel(item.name);
    setDerivative(undefined);
    if (item.derivatives.length > 0) {
      setStep("derivative");
    }
  };

  const searchField = step !== "derivative" && (
    <MakeModelSearchField
      isDesktop={isDesktop}
      locale={locale}
      onSearch={setSearch}
      search={search}
      step={step}
    />
  );

  const pickerContent = (
    <MakeModelPickerOptions
      derivative={derivative}
      groups={modelGroups}
      isDesktop={isDesktop}
      locale={locale}
      make={make}
      makes={makes}
      model={model}
      modelCount={models.length}
      modelInventoryCountByKey={modelInventoryCountByKey}
      onClearSearch={() => setSearch("")}
      onSelectDerivative={setDerivative}
      onSelectMake={(value) => {
        setMake(value);
        if (!isDesktop || value !== make) {
          setModel(undefined);
          setDerivative(undefined);
        }
        setSearch("");
        setStep("model");
      }}
      onSelectModel={selectModel}
      selectedModel={selectedModel}
      step={step}
    />
  );

  const pickerBody = <div className="p-4">{pickerContent}</div>;
  if (isDesktop) {
    return (
      <DesktopMakeModelDialog
        applyLabel={applyLabel}
        clearSelection={clearSelection}
        derivative={derivative}
        filters={filters}
        handleApply={handleApply}
        initialStep={initialStep}
        locale={locale}
        make={make}
        model={model}
        modelCounts={modelCounts}
        onChange={(draft) => {
          setMake(draft.make);
          setModel(draft.model);
          setDerivative(draft.derivative);
        }}
        onOpenChange={onOpenChange}
        open={open}
        taxonomy={taxonomy}
      />
    );
  }

  return (
    <MobileMarketplaceOverlay
      description={copy.makeModel.description}
      footer={
        <Button
          className={mobileMarketplaceOverlayPrimaryActionClassName}
          onClick={handleApply}
        >
          {copy.actions.showResults}
        </Button>
      }
      leftAction={
        step !== "make" ? (
          <MobileMarketplaceOverlayBackAction
            ariaLabel={copy.actions.back}
            onClick={goBack}
          />
        ) : (
          <MobileMarketplaceOverlayIconAction
            ariaLabel={copy.actions.clear}
            onClick={clearSelection}
          >
            <Eraser aria-hidden="true" className="size-[18px]" />
          </MobileMarketplaceOverlayIconAction>
        )
      }
      onOpenChange={onOpenChange}
      open={open}
      rightAction={
        <MobileMarketplaceOverlayCloseAction ariaLabel={copy.actions.close} />
      }
      title={copy.mobileTitles[step]}
    >
      {searchField ? <div className="px-4">{searchField}</div> : null}
      {pickerBody}
    </MobileMarketplaceOverlay>
  );
};
