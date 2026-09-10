"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@repo/design-system/components/ui/drawer";
import { Label } from "@repo/design-system/components/ui/label";
import { cn } from "@repo/design-system/lib/utils";
import {
  MobileMarketplaceOverlayBackAction,
  mobileMarketplaceOverlayIconActionClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { mobileFormPickerTriggerClassName } from "@repo/marketplace-ui/lib/mobile-form-control";
import { Check, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  useEffect(() => {
    if (!open) {
      return;
    }
    // This Vaul drawer can sit inside a Radix Dialog with its own Escape listener.
    const closeTopDrawer = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", closeTopDrawer, true);
    return () => document.removeEventListener("keydown", closeTopDrawer, true);
  }, [open]);
  const selectedOrigin = importRequestOrigins.find(
    (option) => option.code === origin
  );
  const selectedLabel = selectedOrigin ? selectedOrigin[locale] : placeholder;
  const drawerTitle = locale === "bg" ? "Изберете държава" : "Choose a country";
  const drawerDescription =
    locale === "bg"
      ? "Изберете откъде да внесем автомобила."
      : "Choose where the vehicle should be imported from.";
  const closeLabel = locale === "bg" ? "Затвори" : "Close";

  return (
    <div className="grid gap-1.5" data-slot="import-origin-field">
      <div className="grid gap-1.5 lg:hidden">
        <Label className="text-xs" htmlFor="import-origin-trigger">
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
        <Label className="text-xs" htmlFor="import-origin">
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

      <Drawer autoFocus modal onOpenChange={setOpen} open={open}>
        <DrawerContent
          className="mx-auto max-w-lg overflow-hidden border-0 bg-white"
          data-slot="import-origin-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus({ preventScroll: true });
          }}
        >
          <DrawerHeader className="gap-1 px-4 pt-3 pb-2 text-left">
            <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-2">
              <MobileMarketplaceOverlayBackAction
                ariaLabel={
                  locale === "bg" ? "Назад към формата" : "Back to form"
                }
                onClick={() => setOpen(false)}
              />
              <DrawerTitle className="text-center text-[17px] leading-6">
                {drawerTitle}
              </DrawerTitle>
              <Button
                aria-label={closeLabel}
                className={mobileMarketplaceOverlayIconActionClassName}
                onClick={() => setOpen(false)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" className="size-[18px]" />
              </Button>
            </div>
            <DrawerDescription className="text-center">
              {drawerDescription}
            </DrawerDescription>
          </DrawerHeader>

          <div className="grid min-h-0 gap-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {importRequestOrigins.map((option) => {
              const optionLabel = locale === "bg" ? option.bg : option.en;
              return (
                <button
                  aria-pressed={origin === option.code}
                  className={cn(
                    "flex min-h-12 w-full items-center rounded-xl px-4 text-left text-base outline-none transition-colors hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50 active:bg-muted",
                    origin === option.code && "bg-zinc-100"
                  )}
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
                      className="size-5 text-[var(--lead-site-accent)]"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
