"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/design-system/components/ui/command";
import { cn } from "@repo/design-system/lib/utils";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayHeader,
  MobileMarketplaceOverlayShell,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { getMobileChoiceClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import { useState } from "react";
import {
  canUseCustomVehicleTaxonomyValue,
  getVehicleTaxonomyOptions,
  type VehicleTaxonomyPickerKind,
  vehicleTaxonomyPickerCopy,
} from "./mobile-vehicle-taxonomy-policy";

export const MobileVehicleTaxonomyPicker = ({
  kind,
  locale,
  make,
  model,
  onBack,
  onClose,
  onCloseAutoFocus,
  onQueryChange,
  onSelect,
  query,
}: {
  kind: VehicleTaxonomyPickerKind | null;
  locale: "bg" | "en";
  make: string;
  model: string;
  onBack: () => void;
  onClose: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onQueryChange: (query: string) => void;
  onSelect: (value: string) => void;
  query: string;
}) => {
  const text = vehicleTaxonomyPickerCopy[locale];
  const backToMakesLabel =
    locale === "bg" ? "Назад към марките" : "Back to makes";
  const backToFormLabel =
    locale === "bg" ? "Назад към формата" : "Back to form";
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const options = getVehicleTaxonomyOptions(kind, make);
  const selectedValue = kind === "make" ? make : model;
  const trimmedQuery = query.trim();
  const canUseCustomValue = canUseCustomVehicleTaxonomyValue(query, options);
  const pickerTitle = kind === "make" ? text.makeTitle : make;
  const pickerDescription =
    kind === "make" ? text.makeDescription : text.modelDescription;
  const searchPlaceholder =
    kind === "make" ? text.makePlaceholder : text.modelPlaceholder;
  const groupHeading = kind === "make" ? text.makeGroup : text.modelGroup;

  return (
    <MobileMarketplaceOverlayShell
      contentDataSlot="mobile-vehicle-taxonomy-picker"
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        setKeyboardNavigation(false);
        document
          .querySelector<HTMLElement>(
            '[data-slot="mobile-vehicle-taxonomy-picker"]'
          )
          ?.focus({ preventScroll: true });
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
      open={kind !== null}
    >
      <MobileMarketplaceOverlayHeader
        description={pickerDescription}
        leftAction={
          <MobileMarketplaceOverlayBackAction
            ariaLabel={kind === "model" ? backToMakesLabel : backToFormLabel}
            onClick={onBack}
          />
        }
        rightAction={
          <MobileMarketplaceOverlayCloseAction ariaLabel={text.close} />
        }
        title={pickerTitle}
      />

      <Command
        className="min-h-0 flex-1 rounded-none bg-white [&_[data-slot=command-input-wrapper]]:mx-3 [&_[data-slot=command-input-wrapper]]:mb-2 [&_[data-slot=command-input-wrapper]]:h-[52px] [&_[data-slot=command-input-wrapper]]:rounded-full [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:bg-zinc-100 [&_[data-slot=command-input-wrapper]]:px-3.5 [&_[data-slot=command-input-wrapper]]:focus-within:ring-2 [&_[data-slot=command-input-wrapper]]:focus-within:ring-zinc-300 [&_[data-slot=command-input-wrapper]_svg]:size-[18px] [&_[data-slot=command-input-wrapper]_svg]:text-zinc-500"
        key={kind === "make" ? "make" : `model-${make}`}
        onKeyDownCapture={(event) => {
          if (
            ["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)
          ) {
            setKeyboardNavigation(true);
          }
        }}
        onPointerDownCapture={() => setKeyboardNavigation(false)}
        onPointerMoveCapture={() => setKeyboardNavigation(false)}
        shouldFilter
      >
        <CommandInput
          aria-label={searchPlaceholder}
          autoFocus={keyboardNavigation}
          className="h-[52px] py-0 text-[16px] text-zinc-950 placeholder:text-zinc-500"
          onValueChange={onQueryChange}
          placeholder={searchPlaceholder}
          value={query}
        />
        <CommandList className="no-scrollbar max-h-none flex-1 overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CommandEmpty className="px-4 py-10 text-[15px] text-zinc-500">
            {text.noMatch}
          </CommandEmpty>
          <CommandGroup
            className="p-0 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[12px] [&_[cmdk-group-heading]]:text-zinc-500 [&_[cmdk-group-items]]:grid [&_[cmdk-group-items]]:gap-2"
            heading={groupHeading}
          >
            {canUseCustomValue ? (
              <CommandItem
                className={cn(
                  getMobileChoiceClassName(false),
                  "data-[selected=true]:bg-zinc-100"
                )}
                onSelect={() => onSelect(trimmedQuery)}
                value={`custom-${trimmedQuery}`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {text.use} “{trimmedQuery}”
                </span>
                <DealerUiIcon
                  className="size-4 text-zinc-500"
                  name="chevronRight"
                />
              </CommandItem>
            ) : null}
            {options.map((option) => {
              const selected = selectedValue === option;

              return (
                <CommandItem
                  className={cn(
                    getMobileChoiceClassName(selected),
                    selected
                      ? "data-[selected=true]:bg-zinc-200"
                      : "data-[selected=true]:bg-zinc-100",
                    keyboardNavigation &&
                      "data-[selected=true]:outline-2 data-[selected=true]:outline-zinc-500 data-[selected=true]:outline-offset-[-2px]"
                  )}
                  data-value-selected={selected}
                  key={option}
                  onSelect={() => onSelect(option)}
                  value={option}
                >
                  <span className="min-w-0 flex-1 truncate">{option}</span>
                  {selected ? (
                    <DealerUiIcon
                      className="size-5 text-[var(--lead-site-accent)]"
                      name="check"
                    />
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </MobileMarketplaceOverlayShell>
  );
};
