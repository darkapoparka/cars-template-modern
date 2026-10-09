"use client";

import { Label } from "@repo/design-system/components/ui/label";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayBackAction,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import {
  getMobileChoiceClassName,
  mobileFormPickerTriggerClassName,
} from "@repo/marketplace-ui/lib/mobile-form-control";
import { Check, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import {
  importRequestOrigins,
  importRequestSelectClassName,
} from "./import-request-policy";

export const ImportOriginField = ({
  defaultOrigin,
  label,
  locale,
  placeholder,
}: {
  defaultOrigin: string;
  label: string;
  locale: "bg" | "en";
  placeholder: string;
}) => {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOrigin = importRequestOrigins.find(
    (option) => option.code === origin
  );
  const selectedLabel = selectedOrigin ? selectedOrigin[locale] : placeholder;
  const drawerTitle = locale === "bg" ? "Държава" : "Country";
  const drawerDescription =
    locale === "bg"
      ? "Изберете откъде да внесем автомобила."
      : "Choose where the vehicle should be imported from.";
  const closeLabel = locale === "bg" ? "Затвори" : "Close";

  return (
    <div className="grid gap-1.5" data-slot="import-origin-field">
      <div className="grid gap-1.5 lg:hidden">
        <Label className="text-meta" htmlFor="import-origin-trigger">
          {label}
        </Label>
        <button
          aria-haspopup="dialog"
          aria-label={`${label}: ${selectedLabel}`}
          className={mobileFormPickerTriggerClassName}
          id="import-origin-trigger"
          onClick={() => setOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <span
            className={
              selectedOrigin
                ? "min-w-0 flex-1 truncate"
                : "min-w-0 flex-1 truncate text-muted-foreground"
            }
          >
            {selectedLabel}
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </button>
      </div>

      <div className="hidden gap-1.5 lg:grid">
        <Label className="text-meta" htmlFor="import-origin">
          {label}
        </Label>
        <select
          className={importRequestSelectClassName}
          id="import-origin"
          name="origin"
          onChange={(event) => setOrigin(event.target.value)}
          value={origin}
        >
          <option disabled value="">
            {placeholder}
          </option>
          {importRequestOrigins.map((option) => (
            <option key={option.code} value={option.code}>
              {locale === "bg" ? option.bg : option.en}
            </option>
          ))}
        </select>
      </div>

      <MobileMarketplaceOverlay
        contentDataSlot="import-origin-drawer"
        description={drawerDescription}
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
        onOpenChange={setOpen}
        open={open}
        presentation="sheet"
        rightAction={
          <MobileMarketplaceOverlayCloseAction ariaLabel={closeLabel} />
        }
        title={drawerTitle}
      >
        <div className="grid gap-2 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {importRequestOrigins.map((option) => {
            const optionLabel = locale === "bg" ? option.bg : option.en;
            return (
              <button
                aria-pressed={origin === option.code}
                className={getMobileChoiceClassName(origin === option.code)}
                key={option.code}
                onClick={() => {
                  setOrigin(option.code);
                  setOpen(false);
                }}
                type="button"
              >
                <span className="min-w-0 flex-1 truncate">{optionLabel}</span>
                {origin === option.code ? (
                  <Check
                    aria-hidden="true"
                    className="size-5 text-brand-text"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </MobileMarketplaceOverlay>
    </div>
  );
};
