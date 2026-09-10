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
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { cn } from "@repo/design-system/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";
import { localizeMarketplace } from "../lib/marketplace-filter-config";
import {
  NumericRangeFilter,
  type NumericRangePreset,
  type NumericRangeValue,
} from "./numeric-range-filter";

interface DesktopQuickOption {
  label: string;
  value: string;
}

export const desktopQuickFilterRailItemClassName =
  "w-auto min-w-24 shrink-0 justify-between gap-2 px-4 has-[>svg]:px-4 min-[112rem]:px-[18px] min-[112rem]:has-[>svg]:px-[18px]";

const desktopQuickFilterOptionClassName =
  "min-h-12 justify-start rounded-xl border border-transparent bg-zinc-100 px-4 font-medium text-base text-zinc-900 tabular-nums shadow-none transition-colors duration-150 hover:border-zinc-300 hover:bg-zinc-200 active:bg-zinc-300 focus-visible:ring-2 focus-visible:ring-[var(--lead-site-accent-ring)] focus-visible:ring-offset-1";

export const getDesktopQuickFilterClassName = (
  active: boolean,
  elevated = false
) => {
  let surfaceClassName = "bg-control text-foreground hover:bg-control-hover";
  if (active) {
    surfaceClassName =
      "bg-[var(--lead-site-accent)] text-white hover:bg-[var(--lead-site-accent-hover)]";
  } else if (elevated) {
    surfaceClassName = "bg-card text-foreground hover:bg-card/80";
  }

  return cn(
    "h-11 rounded-full border-0 px-4 font-semibold text-base transition-colors duration-150 focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]",
    surfaceClassName
  );
};

const ActiveQuickFilterClearButton = ({
  isBg,
  label,
  onClear,
}: {
  isBg: boolean;
  label: string;
  onClear: () => void;
}) => {
  const removeLabel = localizeMarketplace(
    isBg,
    `Премахни ${label}`,
    `Remove ${label}`
  );

  return (
    <Button
      aria-label={removeLabel}
      className="h-11 w-10 shrink-0 rounded-r-full rounded-l-none border-0 border-white/30 border-l bg-[var(--lead-site-accent)] px-0 text-white shadow-none transition-colors duration-150 hover:bg-[var(--lead-site-accent-hover)] focus-visible:[outline-offset:2px] focus-visible:[outline:2px_solid_var(--ring)]"
      data-slot="desktop-quick-filter-clear"
      onClick={onClear}
      title={removeLabel}
      type="button"
      variant="default"
    >
      <X aria-hidden="true" className="size-3.5" />
    </Button>
  );
};

export const DesktopQuickFilterButton = ({
  active,
  ariaLabel,
  className,
  elevated,
  isBg,
  label,
  onClear,
  onOpen,
}: {
  active: boolean;
  ariaLabel: string;
  className?: string;
  elevated: boolean;
  isBg: boolean;
  label: string;
  onClear?: () => void;
  onOpen: () => void;
}) => {
  const trigger = (
    <Button
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        getDesktopQuickFilterClassName(active, elevated),
        className,
        active && onClear && "rounded-r-none pr-2"
      )}
      data-slot="desktop-quick-filter"
      onClick={onOpen}
      type="button"
      variant={active ? "default" : "secondary"}
    >
      <span className="min-w-0 truncate">{label}</span>
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 opacity-70"
        strokeWidth={2.25}
      />
    </Button>
  );

  if (!(active && onClear)) {
    return trigger;
  }

  return (
    <div className="flex shrink-0 items-stretch">
      {trigger}
      <ActiveQuickFilterClearButton
        isBg={isBg}
        label={label}
        onClear={onClear}
      />
    </div>
  );
};

export const DesktopQuickFilterDialog = ({
  active,
  anyLabel,
  className,
  dataSlot,
  elevated = false,
  isBg,
  label,
  title,
  onClear,
  onSelect,
  options,
  selected,
}: {
  active: boolean;
  anyLabel: string;
  className?: string;
  dataSlot?: string;
  elevated?: boolean;
  isBg: boolean;
  label: string;
  title: string;
  onClear?: () => void;
  onSelect: (value: string | undefined) => void;
  options: DesktopQuickOption[];
  selected?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [draftSelected, setDraftSelected] = useState(selected);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftSelected(selected);
    }
    setOpen(nextOpen);
  };

  const applySelection = () => {
    onSelect(draftSelected);
    setOpen(false);
  };

  const trigger = (
    <DialogTrigger asChild>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        aria-pressed={active}
        className={cn(
          getDesktopQuickFilterClassName(active, elevated),
          "justify-between gap-2",
          open &&
            "border-foreground/30 bg-control-hover text-foreground hover:bg-control-hover active:bg-border",
          active && onClear && "rounded-r-none pr-2",
          className
        )}
        data-slot={dataSlot}
        type="button"
        variant={active ? "default" : "secondary"}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 opacity-70 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2.25}
        />
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {active && onClear ? (
        <div className="flex shrink-0 items-stretch">
          {trigger}
          <ActiveQuickFilterClearButton
            isBg={isBg}
            label={label}
            onClear={onClear}
          />
        </div>
      ) : (
        trigger
      )}
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg gap-0 overflow-hidden rounded-2xl border-zinc-200 bg-white p-0 shadow-2xl"
        data-slot="desktop-quick-filter-dialog"
        showCloseButton={false}
      >
        <DialogHeader className="px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl text-zinc-950 leading-7">
                {title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-base text-zinc-600 leading-6">
                {localizeMarketplace(
                  isBg,
                  "Изберете една опция и приложете филтъра.",
                  "Choose one option, then apply the filter."
                )}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button
                aria-label={localizeMarketplace(isBg, "Затвори", "Close")}
                className="-mr-2 size-10 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto p-5">
          <Button
            aria-pressed={!draftSelected}
            className={cn(
              desktopQuickFilterOptionClassName,
              "col-span-2",
              !draftSelected &&
                "border-transparent bg-[var(--lead-site-accent)] font-semibold text-white hover:border-transparent hover:bg-[var(--lead-site-accent-hover)] hover:text-white"
            )}
            onClick={() => setDraftSelected(undefined)}
            type="button"
            variant="ghost"
          >
            {draftSelected ? null : (
              <Check aria-hidden="true" className="size-4" />
            )}
            {anyLabel}
          </Button>
          {options.map((option) => (
            <Button
              aria-pressed={draftSelected === option.value}
              className={cn(
                desktopQuickFilterOptionClassName,
                draftSelected === option.value &&
                  "border-transparent bg-[var(--lead-site-accent)] font-semibold text-white hover:border-transparent hover:bg-[var(--lead-site-accent-hover)] hover:text-white"
              )}
              key={option.value}
              onClick={() => setDraftSelected(option.value)}
              type="button"
              variant="ghost"
            >
              {draftSelected === option.value ? (
                <Check aria-hidden="true" className="size-4" />
              ) : null}
              {option.label}
            </Button>
          ))}
        </div>
        <DialogFooter className="bg-zinc-50 px-5 py-4 sm:justify-end">
          <Button
            className="h-11 rounded-xl bg-[var(--lead-site-accent)] px-6 font-semibold text-base text-white hover:bg-[var(--lead-site-accent-hover)]"
            onClick={applySelection}
            type="button"
          >
            {localizeMarketplace(isBg, "Приложи", "Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getNormalizedRange = (
  selectedMinimum: number | undefined,
  selectedMaximum: number | undefined,
  range: NumericRangeValue
): NumericRangeValue => {
  const minimum = selectedMinimum ?? range[0];
  const maximum = selectedMaximum ?? range[1];
  return [Math.min(minimum, maximum), Math.max(minimum, maximum)];
};

export const DesktopQuickRangeDialog = ({
  active,
  className,
  dataSlot,
  description,
  elevated = false,
  formatValue,
  isBg,
  label,
  maximumLabel,
  maximumOnly = false,
  maximumPrefix,
  minimumLabel,
  onClear,
  onApply,
  presets,
  quickSelectLabel,
  range,
  selectedMaximum,
  selectedMinimum,
  step,
  thumbLabels,
  title,
}: {
  active: boolean;
  className?: string;
  dataSlot?: string;
  description: string;
  elevated?: boolean;
  formatValue: (value: number) => string;
  isBg: boolean;
  label: string;
  maximumLabel: string;
  maximumOnly?: boolean;
  maximumPrefix: string;
  minimumLabel: string;
  onClear?: () => void;
  onApply: (value: { maximum?: number; minimum?: number }) => void;
  presets: readonly NumericRangePreset[];
  quickSelectLabel: string;
  range: NumericRangeValue;
  selectedMaximum?: number;
  selectedMinimum?: number;
  step: number;
  thumbLabels: readonly [string, string];
  title: string;
}) => {
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<NumericRangeValue>(() =>
    getNormalizedRange(selectedMinimum, selectedMaximum, range)
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraftRange(
        getNormalizedRange(selectedMinimum, selectedMaximum, range)
      );
    }
    setOpen(nextOpen);
  };

  const applyRange = () => {
    const minimum =
      maximumOnly || draftRange[0] === range[0] ? undefined : draftRange[0];
    const maximum = draftRange[1] === range[1] ? undefined : draftRange[1];
    onApply({ maximum, minimum });
    setOpen(false);
  };

  const trigger = (
    <DialogTrigger asChild>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        aria-pressed={active}
        className={cn(
          getDesktopQuickFilterClassName(active, elevated),
          "justify-between gap-2",
          open &&
            "border-foreground/30 bg-control-hover text-foreground hover:bg-control-hover active:bg-border",
          active && onClear && "rounded-r-none pr-2",
          className
        )}
        data-slot={dataSlot}
        type="button"
        variant={active ? "default" : "secondary"}
      >
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 opacity-70 transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2.25}
        />
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      {active && onClear ? (
        <div className="flex shrink-0 items-stretch">
          {trigger}
          <ActiveQuickFilterClearButton
            isBg={isBg}
            label={label}
            onClear={onClear}
          />
        </div>
      ) : (
        trigger
      )}
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl gap-0 overflow-hidden rounded-2xl border-zinc-200 bg-white p-0 shadow-2xl"
        data-slot="desktop-quick-range-dialog"
        showCloseButton={false}
      >
        <DialogHeader className="px-5 py-3 text-left">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-lg text-zinc-950 leading-7">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">{description}</DialogDescription>
            <DialogClose asChild>
              <Button
                aria-label={localizeMarketplace(isBg, "Затвори", "Close")}
                className="-mr-2 size-10 rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto border-zinc-100 border-t px-5 py-4">
          <NumericRangeFilter
            compact
            formatValue={formatValue}
            label={localizeMarketplace(
              isBg,
              "Избран диапазон",
              "Selected range"
            )}
            maximumLabel={maximumLabel}
            maximumOnly={maximumOnly}
            maximumPrefix={maximumPrefix}
            minimumLabel={minimumLabel}
            onValueChange={setDraftRange}
            presets={presets}
            quickSelectLabel={quickSelectLabel}
            range={range}
            step={step}
            thumbLabels={thumbLabels}
            value={draftRange}
          />
        </div>
        <DialogFooter className="flex-row justify-between bg-zinc-50 px-5 py-4 sm:justify-between">
          <Button
            className="h-11 rounded-xl px-4 font-semibold text-base"
            onClick={() => setDraftRange(range)}
            type="button"
            variant="ghost"
          >
            {localizeMarketplace(isBg, "Изчисти", "Clear")}
          </Button>
          <Button
            className="h-11 rounded-xl bg-[var(--lead-site-accent)] px-6 font-semibold text-base text-white hover:bg-[var(--lead-site-accent-hover)]"
            onClick={applyRange}
            type="button"
          >
            {localizeMarketplace(isBg, "Приложи", "Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
