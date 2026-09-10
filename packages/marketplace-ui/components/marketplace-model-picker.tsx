"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { cn } from "@repo/design-system/lib/utils";
import {
  formatBodyType,
  type MarketplaceSearchParams,
  type VehicleTaxonomyMakeOption,
  type VehicleTaxonomyModelOption,
} from "@repo/marketplace";
import { Check, ChevronLeft, Eraser, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayIconAction,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "./mobile-marketplace-overlay";
import {
  marketplaceFilledPickerOptionButtonClassName,
  marketplaceOptionButtonClassName,
  marketplaceSelectedFilledPickerOptionButtonClassName,
  marketplaceSelectedOptionButtonClassName,
  ModelPickerSections,
} from "./marketplace-model-picker-options";

const getInitialMakeModelStep = (
  filters: MarketplaceSearchParams
): "make" | "model" => (filters.make ? "model" : "make");

const getMakeModelDrawerTitle = (
  step: "derivative" | "make" | "model",
  make: string | undefined,
  model: string | undefined,
  locale?: string
) => {
  const copy = getMarketplaceControlCopy(locale);
  if (step === "make") {
    return copy.makeModel.selectMake;
  }
  if (step === "derivative") {
    return [make, model].filter(Boolean).join(" ") || copy.makeModel.selectDerivative;
  }
  return make;
};

export const MarketplaceMakeModelPicker = ({
  filters,
  initialStep,
  locale,
  modelCounts,
  onApply,
  onOpenChange,
  open,
  taxonomy,
}: {
  filters: MarketplaceSearchParams;
  initialStep: "auto" | "make" | "model";
  locale?: string;
  modelCounts?: MarketplaceModelInventoryCount[];
  onApply: (filters: Partial<MarketplaceSearchParams>) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  taxonomy: VehicleTaxonomyMakeOption[];
}) => {
  const isDesktop = useDesktopMarketplaceViewport();
  const [step, setStep] = useState<"derivative" | "make" | "model">("make");
  const [make, setMake] = useState<string | undefined>(filters.make);
  const [model, setModel] = useState<string | undefined>(filters.model);
  const [derivative, setDerivative] = useState<string | undefined>(filters.derivative);
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
    () => taxonomy.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())),
    [search, taxonomy]
  );
  const models = useMemo(() => {
    if (!make) {
      return [];
    }
    return (taxonomy.find((item) => item.name === make)?.models ?? []).filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
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
    onApply({ derivative, make, model, trim: undefined });
    onOpenChange(false);
  };
  const goBack = () => {
    setSearch("");
    setStep(step === "derivative" ? "model" : "make");
  };
  const clearSelection = () => {
    onApply({
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
    <div className="relative mt-3 block">
      <Search
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          isDesktop ? "left-3 size-4" : "left-3.5 size-[18px]"
        )}
      />
      <Input
        aria-label={copy.makeModel.searchAriaLabel}
        autoFocus={isDesktop}
        className={cn(
          "focus-visible:border-[var(--lead-site-accent)] focus-visible:ring-[var(--lead-site-accent)]/35",
          isDesktop
            ? "h-10 rounded-lg bg-secondary pl-9"
            : "h-12 rounded-xl border-0 bg-zinc-100 pl-10 text-[16px] shadow-none"
        )}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={step === "make" ? copy.makeModel.searchMakes : copy.makeModel.searchModels}
        value={search}
      />
    </div>
  );

  const pickerContent = (
    <>
      {step === "make" ? (
        <div className={cn("grid gap-2", isDesktop ? "grid-cols-3" : "grid-cols-2")}>
          {makes.map((item) => (
            <Button
              aria-pressed={make === item.name}
              className={cn(
                "justify-center rounded-lg",
                isDesktop ? "h-10" : "h-12",
                make === item.name
                  ? marketplaceSelectedOptionButtonClassName
                  : marketplaceOptionButtonClassName
              )}
              key={item.slug}
              onClick={() => {
                setMake(item.name);
                setModel(undefined);
                setDerivative(undefined);
                setSearch("");
                setStep("model");
              }}
              variant={make === item.name ? "default" : "secondary"}
            >
              {item.name}
            </Button>
          ))}
        </div>
      ) : null}

      {step === "model" ? (
        <ModelPickerSections
          additionalModelsLabel={copy.makeModel.additionalModels}
          countByKey={modelInventoryCountByKey}
          isDesktop={isDesktop}
          make={make}
          model={model}
          onSelect={selectModel}
          popular={modelGroups.popular}
          popularModelsLabel={copy.makeModel.popularModels}
          remaining={modelGroups.remaining}
        />
      ) : null}

      {step === "derivative" ? (
        <div className="space-y-3" data-slot="derivative-options">
          <div className="px-1">
            <p className="font-semibold text-body">{copy.makeModel.derivativeHeading}</p>
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
              onClick={() => setDerivative(undefined)}
              variant={derivative === undefined ? "default" : "secondary"}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-5">{copy.makeModel.anyDerivative}</span>
                <span
                  className={cn(
                    "block text-meta",
                    derivative === undefined ? "text-background/70" : "text-muted-foreground"
                  )}
                >
                  {copy.makeModel.anyDerivativeDescription}
                </span>
              </span>
              {derivative === undefined ? <Check aria-hidden="true" className="size-5" strokeWidth={2.4} /> : null}
            </Button>
            {(selectedModel?.derivatives ?? []).map((item) => {
              const isSelected = derivative === item.name;
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
                  key={item.slug}
                  onClick={() => setDerivative(item.name)}
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
                      >
                        {[item.bodyType ? formatBodyType(item.bodyType, locale) : undefined, yearRange]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? <Check aria-hidden="true" className="size-5" strokeWidth={2.4} /> : null}
                </Button>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );

  const pickerBody = isDesktop ? (
    <ScrollArea
      className={cn(
        "min-h-0 p-4",
        step === "derivative"
          ? "h-[min(26rem,calc(100dvh-12rem))] flex-none"
          : "h-80 flex-none"
      )}
    >
      {pickerContent}
    </ScrollArea>
  ) : (
    <div className="p-4">{pickerContent}</div>
  );
  const title = getMakeModelDrawerTitle(step, make, model, locale) ?? copy.makeModel.selectMake;

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex max-h-[calc(100dvh-4rem)] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-xl border-border/80 bg-card p-0 shadow-none sm:max-w-lg"
          data-slot="make-model-dialog"
          showCloseButton={false}
        >
          <DialogHeader className="px-4 py-3 text-left">
            <div className="grid grid-cols-[6rem_minmax(0,1fr)_6rem] items-center gap-2">
              <div>
                {step !== "make" ? (
                  <Button
                    className="h-10 rounded-lg bg-control px-3 shadow-none hover:bg-control-hover"
                    onClick={goBack}
                    size="sm"
                    variant="secondary"
                  >
                    <ChevronLeft className="size-4" />
                    {copy.actions.back}
                  </Button>
                ) : null}
              </div>
              <DialogTitle className="truncate text-center text-xl leading-7">
                {title}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  aria-label={copy.actions.close}
                  className="ml-auto size-10 rounded-lg bg-control p-0 shadow-none hover:bg-control-hover"
                  size="icon"
                  type="button"
                  variant="secondary"
                >
                  <X aria-hidden="true" className="size-[18px]" />
                </Button>
              </DialogClose>
            </div>
            <DialogDescription className="sr-only">{copy.makeModel.description}</DialogDescription>
            {searchField}
          </DialogHeader>
          {pickerBody}
          <DialogFooter className="mt-auto block bg-card p-4">
            <div className="flex w-full gap-2">
              <Button
                className="h-11 rounded-lg border-0 bg-control px-6 shadow-none hover:bg-control-hover"
                onClick={clearSelection}
                variant="secondary"
              >
                {copy.actions.clear}
              </Button>
              <Button className="h-11 flex-1 rounded-lg shadow-none" onClick={handleApply}>
                {copy.actions.showResults}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <MobileMarketplaceOverlay
      description={copy.makeModel.description}
      footer={
        <Button className={mobileMarketplaceOverlayPrimaryActionClassName} onClick={handleApply}>
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
      title={title}
    >
      {searchField ? <div className="px-4">{searchField}</div> : null}
      {pickerBody}
    </MobileMarketplaceOverlay>
  );
};
