"use client";

import { DealerUiIcon } from "@repo/marketplace-ui/components/dealer-ui-icon";
import {
  MobileMarketplaceOverlay,
  MobileMarketplaceOverlayCloseAction,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { getLocalizedPath } from "@repo/seo/metadata";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  type MobileFormDraft,
  readMobileFormDraft,
} from "../../components/mobile-form-draft";
import { ImportRequestForm } from "./import-request-form";
import { importRequestCopy } from "./import-request-policy";

const actionClassName =
  "mt-4 h-11 items-center justify-center gap-2 rounded-lg bg-[var(--lead-site-accent)] px-4 font-semibold text-[14px] text-white outline-none transition-colors hover:bg-[var(--lead-site-accent-hover)] focus-visible:ring-[3px] focus-visible:ring-[var(--lead-site-accent-ring)]";

export function BlankImportRequestLink({
  fullWidth = false,
  defaultOrigin,
  href,
  isBg,
}: {
  fullWidth?: boolean;
  defaultOrigin: string;
  href: string;
  isBg: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<MobileFormDraft>({});
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const locale = isBg ? "bg" : "en";
  const label = isBg ? "Опишете автомобил" : "Describe a vehicle";

  return (
    <>
      <button
        aria-haspopup="dialog"
        className={`${actionClassName} inline-flex lg:hidden ${fullWidth ? "!h-12 !justify-between !rounded-xl !text-[15px] w-full" : ""}`}
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        {label}
        <DealerUiIcon className="size-4" name="arrowRight" />
      </button>
      <Link className={`${actionClassName} hidden lg:inline-flex`} href={href}>
        {label}
        <DealerUiIcon className="size-4" name="arrowRight" />
      </Link>
      <MobileMarketplaceOverlay
        bodyClassName="no-scrollbar pb-[calc(1rem+env(safe-area-inset-bottom))] text-left"
        contentClassName="z-50"
        contentDataSlot="mobile-import-request"
        description={importRequestCopy[locale].formDescription}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDraft(
              formRef.current ? readMobileFormDraft(formRef.current) : {}
            );
          }
          setOpen(nextOpen);
        }}
        open={open}
        rightAction={
          <MobileMarketplaceOverlayCloseAction
            ariaLabel={isBg ? "Затвори заявката" : "Close request"}
          />
        }
        title={label}
      >
        <ImportRequestForm
          defaultOrigin={defaultOrigin === "ALL" ? "" : defaultOrigin}
          defaultSourceUrl=""
          draft={draft}
          embedded
          formRef={formRef}
          locale={locale}
          privacyHref={getLocalizedPath(locale, "/legal/privacy")}
        />
      </MobileMarketplaceOverlay>
    </>
  );
}
