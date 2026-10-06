"use client";

import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import type {
  MarketplaceSearchParams,
  VehicleTaxonomyMakeOption,
} from "@repo/marketplace";
import { useMemo, useState } from "react";
import {
  getMarketplaceModelInventoryKey,
  getMarketplaceModelPickerGroups,
  type MarketplaceModelInventoryCount,
} from "../lib/model-picker-options";
import {
  DesktopMakeModelStages,
  type MakeModelStep,
} from "./desktop-make-model-stages";
import {
  MakeModelPickerOptions,
  MakeModelSearchField,
} from "./marketplace-model-picker";

/** Controlled vehicle choices inside the full desktop filter draft. */
export function DesktopMakeModelFields({
  draft,
  initialStep,
  locale,
  modelCounts,
  onChange,
  taxonomy,
}: {
  draft: MarketplaceSearchParams;
  initialStep: "auto" | "make" | "model";
  locale?: string;
  modelCounts?: MarketplaceModelInventoryCount[];
  onChange: (draft: MarketplaceSearchParams) => void;
  taxonomy: VehicleTaxonomyMakeOption[];
}) {
  const [step, setStep] = useState<MakeModelStep>(() => {
    if (initialStep === "auto") {
      return draft.make ? "model" : "make";
    }
    return initialStep;
  });
  const [search, setSearch] = useState("");
  const { make, model, derivative } = draft;
  const selectedModel = taxonomy
    .find((item) => item.name === make)
    ?.models.find((item) => item.name === model);
  const hasDerivatives = (selectedModel?.derivatives.length ?? 0) > 0;
  let activeStep = step;
  if (!make) {
    activeStep = "make";
  } else if (step === "derivative" && !hasDerivatives) {
    activeStep = "model";
  }
  const makes = useMemo(
    () =>
      taxonomy.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [search, taxonomy]
  );
  const models = useMemo(
    () =>
      (taxonomy.find((item) => item.name === make)?.models ?? []).filter(
        (item) => item.name.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [make, search, taxonomy]
  );
  const groups = useMemo(
    () =>
      getMarketplaceModelPickerGroups({
        make,
        models,
        prioritizePopular: search.trim().length === 0,
      }),
    [make, models, search]
  );
  const counts = useMemo(
    () =>
      modelCounts
        ? new Map(
            modelCounts.map((item) => [
              getMarketplaceModelInventoryKey(item.make, item.model),
              item.count,
            ])
          )
        : undefined,
    [modelCounts]
  );
  return (
    <DesktopMakeModelStages
      derivative={derivative}
      hasDerivatives={hasDerivatives}
      locale={locale}
      make={make}
      model={model}
      onStepChange={(value) => {
        setStep(value);
        setSearch("");
      }}
      pickerBody={
        <ScrollArea className="min-h-0 flex-1" key={`${activeStep}:${search}`}>
          <MakeModelPickerOptions
            derivative={derivative}
            groups={groups}
            isDesktop
            locale={locale}
            make={make}
            makes={makes}
            model={model}
            modelCount={models.length}
            modelInventoryCountByKey={counts}
            onClearSearch={() => setSearch("")}
            onSelectAny={() => {
              onChange({
                ...draft,
                make: activeStep === "make" ? undefined : make,
                model: undefined,
                derivative: undefined,
                trim: undefined,
              });
              setSearch("");
            }}
            onSelectDerivative={(value) =>
              onChange({ ...draft, derivative: value, trim: undefined })
            }
            onSelectMake={(value) => {
              onChange(
                value === make
                  ? draft
                  : {
                      ...draft,
                      make: value,
                      model: undefined,
                      derivative: undefined,
                      trim: undefined,
                    }
              );
              setSearch("");
              setStep("model");
            }}
            onSelectModel={(item) => {
              onChange({
                ...draft,
                model: item.name,
                derivative: undefined,
                trim: undefined,
              });
              setSearch("");
              if (item.derivatives.length) {
                setStep("derivative");
              }
            }}
            selectedModel={selectedModel}
            step={activeStep}
          />
        </ScrollArea>
      }
      searchField={
        activeStep !== "derivative" ? (
          <MakeModelSearchField
            isDesktop
            locale={locale}
            onSearch={setSearch}
            search={search}
            step={activeStep}
          />
        ) : null
      }
      step={activeStep}
    />
  );
}
