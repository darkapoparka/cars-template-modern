"use client";

import {
  MobileMarketplaceOverlayCloseAction,
  MobileMarketplaceOverlayHeader,
  MobileMarketplaceOverlayShell,
} from "@repo/marketplace-ui/components/mobile-marketplace-overlay";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  type FinancingRequest,
  financingRequestCopy,
  parseFinancingRequestHref,
} from "./mobile-financing-policy";
import { type MobileFormDraft, readMobileFormDraft } from "./mobile-form-draft";

// Keep the enquiry form and its action out of every public route's initial bundle.
// The shell remains immediate and dismissible while the form is loading.
const FinancingRequestForm = lazy(() =>
  import("./mobile-financing-form").then((module) => ({
    default: module.FinancingRequestForm,
  }))
);

const isUnmodifiedPrimaryClick = (event: MouseEvent) =>
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

export const MobileFinancingInterceptor = ({
  locale,
  submissionAvailable,
}: {
  locale: "bg" | "en";
  submissionAvailable: boolean;
}) => {
  const copy = financingRequestCopy[locale];
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<FinancingRequest | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const [draft, setDraft] = useState<{
    vehicle: string;
    preferenceKey?: string;
    values: MobileFormDraft;
  }>({ vehicle: "", values: {} });
  const formRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element && isUnmodifiedPrimaryClick(event))
      ) {
        return;
      }
      if (!window.matchMedia("(max-width: 1023px)").matches) {
        return;
      }

      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      const nextRequest = parseFinancingRequestHref(
        anchor.href,
        window.location.href
      );
      if (!nextRequest) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      triggerRef.current = anchor;
      setRequest(nextRequest);
      setRequestKey((value) => value + 1);
      setOpen(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <MobileMarketplaceOverlayShell
      contentDataSlot="mobile-financing-drawer"
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        triggerRef.current?.focus({ preventScroll: true });
        triggerRef.current = null;
      }}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && request) {
          setDraft({
            vehicle: request.vehicle,
            preferenceKey: `${request.term}:${request.deposit ?? ""}`,
            values: formRef.current ? readMobileFormDraft(formRef.current) : {},
          });
        }
        setOpen(nextOpen);
      }}
      open={open}
    >
      <MobileMarketplaceOverlayHeader
        description={copy.description}
        rightAction={
          <MobileMarketplaceOverlayCloseAction ariaLabel={copy.close} />
        }
        title={copy.title}
      />

      {request ? (
        <Suspense
          fallback={
            <output className="block px-4 py-6 text-compact-control text-zinc-600">
              {locale === "bg" ? "Зареждане на формата…" : "Loading the form…"}
            </output>
          }
        >
          <FinancingRequestForm
            draft={
              draft.vehicle === request.vehicle
                ? {
                    ...draft.values,
                    ...(draft.preferenceKey ===
                    `${request.term}:${request.deposit ?? ""}`
                      ? {}
                      : {
                          term: request.term,
                          deposit: request.deposit ?? "flexible",
                        }),
                  }
                : {}
            }
            formRef={formRef}
            key={requestKey}
            locale={locale}
            request={request}
            submissionAvailable={submissionAvailable}
          />
        </Suspense>
      ) : null}
    </MobileMarketplaceOverlayShell>
  );
};
