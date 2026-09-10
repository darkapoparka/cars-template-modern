"use client";
import { Label } from "@repo/design-system/components/ui/label";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import {
  getMobileChoiceClassName,
  mobileFormPickerTriggerClassName,
} from "@repo/marketplace-ui/lib/mobile-form-control";
import { useRef, useState } from "react";
import { mobileSellVehicleCategoryOptions } from "./mobile-sell-vehicle-policy";

const categoryIcons = {
  car: "car",
  truck: "truck",
  motorbike: "bike",
  van: "van",
} as const;
export function MobileSellCategoryField({
  initialValue = "car",
  locale,
  label,
}: {
  initialValue?: string;
  locale: "bg" | "en";
  label: string;
}) {
  const options = mobileSellVehicleCategoryOptions[locale];
  const [value, setValue] = useState(
    options.find((option) => option.value === initialValue)?.value ?? "car"
  );
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const title =
    locale === "bg" ? "Изберете тип автомобил" : "Choose vehicle type";
  return (
    <div className="grid gap-1.5">
      <Label className="font-medium text-[13px]" htmlFor="mobile-sell-category">
        {label}
      </Label>
      <input name="category" type="hidden" value={value} />
      <button
        aria-haspopup="dialog"
        className={mobileFormPickerTriggerClassName}
        id="mobile-sell-category"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className="truncate">{selected.label}</span>
        <DealerUiIcon className="size-4 shrink-0" name="chevronRight" />
      </button>
      <MobileMarketplaceOverlay
        contentDataSlot="mobile-sell-category-picker"
        description={title}
        leftAction={
          <MobileMarketplaceOverlayBackAction
            ariaLabel={locale === "bg" ? "Назад към формата" : "Back to form"}
            onClick={() => setOpen(false)}
          />
        }
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          document
            .querySelector<HTMLElement>(
              '[data-slot="mobile-sell-category-picker"]'
            )
            ?.focus({ preventScroll: true });
        }}
        onOpenChange={setOpen}
        open={open}
        rightAction={
          <MobileMarketplaceOverlayCloseAction
            ariaLabel={
              locale === "bg" ? "Затвори типа автомобил" : "Close vehicle types"
            }
          />
        }
        title={title}
      >
        <div className="grid gap-2 px-3 pb-4">
          {options.map((option) => (
            <button
              aria-pressed={value === option.value}
              className={getMobileChoiceClassName(value === option.value)}
              key={option.value}
              onClick={() => {
                setValue(option.value);
                setOpen(false);
              }}
              type="button"
            >
              <DealerUiIcon
                className="size-6 shrink-0 text-zinc-600"
                name={categoryIcons[option.value]}
              />
              <span className="flex-1">{option.label}</span>
              {value === option.value ? (
                <DealerUiIcon
                  className="size-5 text-[var(--lead-site-accent)]"
                  name="check"
                />
              ) : null}
            </button>
          ))}
        </div>
      </MobileMarketplaceOverlay>
    </div>
  );
}
