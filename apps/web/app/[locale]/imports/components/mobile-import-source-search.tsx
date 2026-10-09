"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayField,
  MobileMarketplaceOverlayHeader,
  MobileMarketplaceOverlayShell,
  mobileMarketplaceOverlayFieldRowClassName,
  mobileMarketplaceOverlayPrimaryActionClassName,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import {
  mobileSearchIconClassName,
  mobileSearchTriggerClassName,
  mobileSearchTriggerLabelClassName,
} from "@repo/marketplace-ui/lib/mobile-form-control";
import { Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MobileImportSourceSearchProps {
  actionHref: string;
  defaultOrigin?: string;
  defaultSourceUrl: string;
  label: string;
  locale: "bg" | "en";
  placeholder: string;
  submitLabel: string;
}

const overlayCopy = {
  bg: {
    clear: "Изчистете линка",
    close: "Затворете търсенето",
    description:
      "Поставете директен линк към конкретна автомобилна обява и продължете към заявката за внос.",
    hint: "Поставете директен линк към конкретната обява. Ще го пренесем в заявката ви за внос.",
    open: "Отворете полето за линк към обява",
    title: "Линк",
  },
  en: {
    clear: "Clear listing link",
    close: "Close import search",
    description:
      "Paste a direct link to a specific vehicle listing and continue to the import request.",
    hint: "Paste a direct link to the specific listing. We will carry it into your import request.",
    open: "Open vehicle listing link field",
    title: "Link",
  },
} as const;

export const MobileImportSourceSearch = ({
  actionHref,
  defaultOrigin,
  defaultSourceUrl,
  label,
  locale,
  placeholder,
  submitLabel,
}: MobileImportSourceSearchProps) => {
  const copy = overlayCopy[locale];
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(defaultSourceUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setReady(true);
    setSourceUrl(defaultSourceUrl);
  }, [defaultSourceUrl]);

  return (
    <>
      <search className="block">
        <button
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={copy.open}
          className={`${mobileSearchTriggerClassName} bg-white ring-black/5 focus-visible:outline-ring active:bg-zinc-100`}
          data-slot="mobile-import-search-trigger"
          disabled={!ready}
          onClick={() => setOpen(true)}
          ref={triggerRef}
          type="button"
        >
          <Link2
            aria-hidden="true"
            className={mobileSearchIconClassName}
            strokeWidth={1.75}
          />
          <span className={mobileSearchTriggerLabelClassName}>
            {sourceUrl || placeholder}
          </span>
        </button>
      </search>

      <MobileMarketplaceOverlayShell
        className="z-[80]"
        contentDataSlot="mobile-import-source-search"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onOpenChange={setOpen}
        open={open}
      >
        <MobileMarketplaceOverlayHeader
          description={copy.description}
          rightAction={
            <MobileMarketplaceOverlayCloseAction ariaLabel={copy.close} />
          }
          title={copy.title}
        />

        <form
          action={actionHref}
          className="flex min-h-0 flex-1 flex-col"
          method="get"
          onSubmit={() => setOpen(false)}
        >
          {defaultOrigin ? (
            <input name="origin" type="hidden" value={defaultOrigin} />
          ) : null}

          <div
            className={mobileMarketplaceOverlayFieldRowClassName}
            data-slot="mobile-import-source-search-header"
          >
            <MobileMarketplaceOverlayField
              aria-label={label}
              clearAction={{
                label: copy.clear,
                onClear: () => setSourceUrl(""),
              }}
              icon={
                <Link2
                  aria-hidden="true"
                  className="size-[18px] shrink-0 text-zinc-600"
                  strokeWidth={1.75}
                />
              }
              inputMode="url"
              inputRef={inputRef}
              maxLength={500}
              name="sourceUrl"
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder={placeholder}
              required
              spellCheck={false}
              type="url"
              value={sourceUrl}
            />
          </div>

          <div
            className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            data-slot="mobile-import-source-search-body"
          >
            <p className="rounded-xl bg-zinc-50 px-3.5 py-3 text-meta text-zinc-600">
              {copy.hint}
            </p>

            <Button
              className={`${mobileMarketplaceOverlayPrimaryActionClassName} mt-6 justify-between gap-2`}
              disabled={!sourceUrl.trim()}
              type="submit"
            >
              <span>{submitLabel}</span>
              <DealerUiIcon className="size-[18px]" name="arrowRight" />
            </Button>
          </div>
        </form>
      </MobileMarketplaceOverlayShell>
    </>
  );
};
