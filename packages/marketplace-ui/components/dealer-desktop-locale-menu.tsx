"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageFlag } from "./language-flag";
import { MarketplaceLocaleSwitchLink } from "./marketplace-locale-switch-link";

export function DealerDesktopLocaleMenu({
  locale,
  tone = "dark",
}: {
  locale?: string;
  tone?: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const menuLabel = isBg ? "Меню" : "Menu";
  const localeLabel = isBg ? "Държава и език" : "Country and language";
  const triggerClassName =
    tone === "light"
      ? "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-control text-foreground shadow-none hover:bg-control-hover focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
      : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-transparent bg-transparent text-inherit hover:bg-panel/10 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-flex shrink-0" ref={root}>
      <button
        aria-controls="dealer-desktop-locale-menu"
        aria-expanded={open}
        aria-label={menuLabel}
        className={triggerClassName}
        onClick={() => setOpen((value) => !value)}
        ref={trigger}
        title={menuLabel}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" className="size-5" />
      </button>
      {open ? (
        <fieldset
          aria-label={localeLabel}
          className="absolute top-full right-0 z-50 m-0 mt-2 w-60 min-w-0 rounded-xl border border-border bg-panel p-1 text-foreground shadow-overlay"
          id="dealer-desktop-locale-menu"
        >
          <MarketplaceLocaleSwitchLink
            beforeOpen={() => {
              trigger.current?.focus({ preventScroll: true });
              setOpen(false);
            }}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium text-sm hover:bg-control focus-visible:outline-2 focus-visible:outline-ring"
            label={localeLabel}
            locale={locale}
          >
            <LanguageFlag locale={isBg ? "bg" : "en"} />
            {localeLabel}
          </MarketplaceLocaleSwitchLink>
        </fieldset>
      ) : null}
    </div>
  );
}
