"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import { ScrollArea } from "@repo/design-system/components/ui/scroll-area";
import { X } from "lucide-react";
import { type ComponentProps, useId, useMemo, useState } from "react";
import { getMarketplaceControlCopy } from "../lib/marketplace-control-copy";
import {
  getMarketplaceModelInventoryKey,
  getMarketplaceModelPickerGroups,
} from "../lib/model-picker-options";
import type { DesktopFullFilterDraftProps } from "./desktop-full-filter-content";
import styles from "./desktop-full-filter-dialog.module.css";
import {
  MakeModelPickerOptions,
  MakeModelSearchField,
} from "./marketplace-model-picker";

function VehiclePanelHeading({
  clearLabel,
  id,
  label,
  onClear,
  selected,
}: {
  clearLabel: string;
  id: string;
  label: string;
  onClear: () => void;
  selected?: string;
}) {
  return (
    <div className={styles.optionsHeading}>
      <h2 className="text-card-title-lg" id={id}>
        {label}
      </h2>
      {selected ? (
        <Button
          aria-label={`${clearLabel} ${label}`}
          onClick={onClear}
          variant="secondary"
        >
          <X aria-hidden size={14} />
          {clearLabel}
        </Button>
      ) : null}
    </div>
  );
}

function ModelBodyStyles({
  options,
  label,
}: {
  options: Omit<ComponentProps<typeof MakeModelPickerOptions>, "step">;
  label: string;
}) {
  if (!options.selectedModel?.derivatives.length) {
    return null;
  }
  return (
    <Accordion
      className={styles.derivatives}
      collapsible
      defaultValue={options.derivative ? "body" : undefined}
      key={options.selectedModel.slug}
      type="single"
    >
      <AccordionItem value="body">
        <AccordionTrigger>
          {label}
          {options.derivative ? ` · ${options.derivative}` : ""}
        </AccordionTrigger>
        <AccordionContent>
          <MakeModelPickerOptions {...options} step="derivative" />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/** Parallel choices for the full draft; hero dialogs retain their staged picker. */
export function DesktopMakeModelColumns({
  draft,
  locale,
  modelCounts,
  onChooseCategory,
  onChange,
  taxonomy,
}: DesktopFullFilterDraftProps & { onChooseCategory: () => void }) {
  const copy = getMarketplaceControlCopy(locale);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const id = useId();
  const [makeSearch, setMakeSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const { make, model, derivative } = draft;
  const selectedMake = taxonomy.find((item) => item.name === make);
  const selectedModel = selectedMake?.models.find(
    (item) => item.name === model
  );
  const makes = taxonomy.filter((item) =>
    item.name.toLowerCase().includes(makeSearch.trim().toLowerCase())
  );
  const models = (selectedMake?.models ?? []).filter((item) =>
    item.name.toLowerCase().includes(modelSearch.trim().toLowerCase())
  );
  const groups = getMarketplaceModelPickerGroups({
    make,
    models,
    prioritizePopular: modelSearch.trim().length === 0,
  });
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
  const clearModel = () => {
    onChange({
      ...draft,
      model: undefined,
      derivative: undefined,
      trim: undefined,
    });
    setModelSearch("");
  };
  const clearMake = () => {
    onChange({
      ...draft,
      make: undefined,
      model: undefined,
      derivative: undefined,
      trim: undefined,
    });
    setModelSearch("");
  };
  const options: Omit<ComponentProps<typeof MakeModelPickerOptions>, "step"> = {
    derivative,
    groups,
    isDesktop: true,
    locale,
    make,
    makes,
    model,
    modelCount: models.length,
    modelInventoryCountByKey: counts,
    onClearSearch: () => setModelSearch(""),
    onSelectDerivative: (value) =>
      onChange({ ...draft, derivative: value, trim: undefined }),
    onSelectMake: (value) => {
      if (value !== make) {
        onChange({
          ...draft,
          make: value,
          model: undefined,
          derivative: undefined,
          trim: undefined,
        });
        setModelSearch("");
      }
    },
    onSelectModel: (item) =>
      onChange({
        ...draft,
        model: item.name,
        derivative: undefined,
        trim: undefined,
      }),
    selectedModel,
  };

  if (taxonomy.length === 0) {
    return (
      <section className={styles.vehicleColumns} data-filter-section="vehicle">
        <div className={styles.vehicleEmpty}>
          <h2 className="text-card-title-lg">
            {isBg ? "Марка и модел" : "Make and model"}
          </h2>
          <p>
            {isBg
              ? "Няма налични марки и модели за този вид превозно средство."
              : "No makes or models are available for this vehicle type."}
          </p>
          <Button onClick={onChooseCategory} variant="secondary">
            {isBg ? "Изберете друг вид" : "Choose another type"}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.vehicleColumns} data-filter-section="vehicle">
      <section
        aria-labelledby={`${id}-make`}
        className={styles.vehiclePanel}
        data-slot="desktop-filter-make-panel"
      >
        <VehiclePanelHeading
          clearLabel={copy.actions.clear}
          id={`${id}-make`}
          label={isBg ? "Марка" : "Make"}
          onClear={clearMake}
          selected={make}
        />
        <div className={styles.vehicleSearch}>
          <MakeModelSearchField
            ariaLabel={copy.makeModel.searchMakes}
            isDesktop
            locale={locale}
            onSearch={setMakeSearch}
            search={makeSearch}
            step="make"
          />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className={styles.makeOptions}>
            <MakeModelPickerOptions
              {...options}
              onClearSearch={() => setMakeSearch("")}
              onSelectAny={clearMake}
              step="make"
            />
          </div>
        </ScrollArea>
      </section>
      <section
        aria-labelledby={`${id}-model`}
        className={styles.vehiclePanel}
        data-slot="desktop-filter-model-panel"
      >
        <VehiclePanelHeading
          clearLabel={copy.actions.clear}
          id={`${id}-model`}
          label={isBg ? "Модел" : "Model"}
          onClear={clearModel}
          selected={model}
        />
        {make ? (
          <>
            <div className={styles.vehicleSearch}>
              <MakeModelSearchField
                ariaLabel={copy.makeModel.searchModels}
                isDesktop
                locale={locale}
                onSearch={setModelSearch}
                search={modelSearch}
                step="model"
              />
            </div>
            <ScrollArea className="min-h-0 flex-1" key={make}>
              <div className={styles.modelOptions}>
                <MakeModelPickerOptions
                  {...options}
                  onSelectAny={clearModel}
                  step="model"
                />
                <ModelBodyStyles
                  label={isBg ? "Каросерия" : "Body style"}
                  options={options}
                />
              </div>
            </ScrollArea>
          </>
        ) : (
          <p
            className={styles.modelPrompt}
            data-slot="desktop-filter-model-prompt"
          >
            {isBg
              ? "Изберете марка, за да видите моделите."
              : "Choose a make to see its models."}
          </p>
        )}
      </section>
    </section>
  );
}
