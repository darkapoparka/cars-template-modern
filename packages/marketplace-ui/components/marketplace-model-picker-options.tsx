import { Button } from "@repo/design-system/components/ui/button";
import { cn } from "@repo/design-system/lib/utils";
import type { VehicleTaxonomyModelOption } from "@repo/marketplace";
import { ChevronRight } from "lucide-react";
import { getMarketplaceModelInventoryKey } from "../lib/model-picker-options";

export const marketplaceOptionButtonClassName =
  "border border-border bg-secondary text-secondary-foreground shadow-none hover:bg-accent hover:text-accent-foreground focus-visible:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0";

export const marketplaceSelectedOptionButtonClassName =
  "border border-primary bg-primary text-primary-foreground shadow-none hover:bg-primary/90 hover:text-primary-foreground focus-visible:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0";

export const marketplaceFilledPickerOptionButtonClassName =
  "border-0 bg-control-hover text-foreground shadow-none hover:bg-border/80 focus-visible:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0";

export const marketplaceSelectedFilledPickerOptionButtonClassName =
  "border-0 bg-foreground text-background shadow-none hover:bg-foreground/90 hover:text-background focus-visible:border-zinc-700 focus-visible:ring-0 focus-visible:ring-offset-0";

const getModelInventoryCount = ({
  countByKey,
  make,
  model,
}: {
  countByKey?: ReadonlyMap<string, number>;
  make?: string;
  model: string;
}) => {
  if (!(countByKey && make)) {
    return undefined;
  }

  return countByKey.get(getMarketplaceModelInventoryKey(make, model)) ?? 0;
};

const ModelPickerOptionButton = ({
  inventoryCount,
  isSelected,
  item,
  onSelect,
}: {
  inventoryCount?: number;
  isSelected: boolean;
  item: VehicleTaxonomyModelOption;
  onSelect: (item: VehicleTaxonomyModelOption) => void;
}) => (
  <Button
    aria-pressed={isSelected}
    className={cn(
      "h-auto min-h-12 justify-between whitespace-normal rounded-lg px-3 py-2 text-left",
      isSelected
        ? marketplaceSelectedFilledPickerOptionButtonClassName
        : marketplaceFilledPickerOptionButtonClassName
    )}
    data-slot="model-option"
    onClick={() => onSelect(item)}
    variant={isSelected ? "default" : "secondary"}
  >
    <span className="min-w-0 flex-1 truncate">{item.name}</span>
    <span className="flex shrink-0 items-center gap-1.5">
      {inventoryCount !== undefined ? (
        <span
          className={cn(
            "font-medium text-xs tabular-nums",
            isSelected ? "text-background/70" : "text-muted-foreground"
          )}
        >
          ({inventoryCount})
        </span>
      ) : null}
      {item.derivatives.length > 0 ? (
        <ChevronRight aria-hidden="true" className="size-4 opacity-55" />
      ) : null}
    </span>
  </Button>
);

const ModelPickerOptionGrid = ({
  countByKey,
  isDesktop,
  items,
  make,
  model,
  onSelect,
}: {
  countByKey?: ReadonlyMap<string, number>;
  isDesktop: boolean;
  items: VehicleTaxonomyModelOption[];
  make?: string;
  model?: string;
  onSelect: (item: VehicleTaxonomyModelOption) => void;
}) => (
  <div className={cn("grid gap-2", isDesktop ? "grid-cols-2" : "grid-cols-1")}>
    {items.map((item) => (
      <ModelPickerOptionButton
        inventoryCount={getModelInventoryCount({
          countByKey,
          make,
          model: item.name,
        })}
        isSelected={model === item.name}
        item={item}
        key={item.slug}
        onSelect={onSelect}
      />
    ))}
  </div>
);

export const ModelPickerSections = ({
  additionalModelsLabel,
  countByKey,
  isDesktop,
  make,
  model,
  onSelect,
  popular,
  popularModelsLabel,
  remaining,
}: {
  additionalModelsLabel: string;
  countByKey?: ReadonlyMap<string, number>;
  isDesktop: boolean;
  make?: string;
  model?: string;
  onSelect: (item: VehicleTaxonomyModelOption) => void;
  popular: VehicleTaxonomyModelOption[];
  popularModelsLabel: string;
  remaining: VehicleTaxonomyModelOption[];
}) => (
  <div className="space-y-4" data-slot="model-options">
    {popular.length > 0 ? (
      <section aria-labelledby="popular-models-heading">
        <p
          className="mb-2 px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide"
          id="popular-models-heading"
        >
          {popularModelsLabel}
        </p>
        <ModelPickerOptionGrid
          countByKey={countByKey}
          isDesktop={isDesktop}
          items={popular}
          make={make}
          model={model}
          onSelect={onSelect}
        />
      </section>
    ) : null}

    {remaining.length > 0 ? (
      <section
        aria-labelledby={
          popular.length > 0 ? "additional-models-heading" : undefined
        }
      >
        {popular.length > 0 ? (
          <p
            className="mb-2 px-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide"
            id="additional-models-heading"
          >
            {additionalModelsLabel}
          </p>
        ) : null}
        <ModelPickerOptionGrid
          countByKey={countByKey}
          isDesktop={isDesktop}
          items={remaining}
          make={make}
          model={model}
          onSelect={onSelect}
        />
      </section>
    ) : null}
  </div>
);
