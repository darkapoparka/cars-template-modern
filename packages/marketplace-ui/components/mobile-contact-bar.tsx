import { Button } from "@repo/design-system/components/ui/button";
import type { VehicleListing } from "@repo/marketplace";
import { Flag, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { getListingContactAction } from "../lib/listing-truth";
import { DealerMobileHeaderIcon } from "./dealer-mobile-header-icon";

interface MobileContactBarProps {
  readonly contactHref?: string;
  readonly listing: VehicleListing;
  readonly locale?: string;
  readonly reportHref?: string;
}

export const MobileContactBar = ({
  contactHref,
  listing,
  locale,
  reportHref,
}: MobileContactBarProps) => {
  const action = getListingContactAction(listing, Boolean(contactHref), locale);
  const isBg = locale?.toLowerCase().startsWith("bg") ?? false;
  const directPhone = contactHref?.startsWith("tel:") ?? false;
  let actionLabel = action.label;
  if (directPhone) {
    actionLabel = isBg ? "Обадете се" : "Call dealer";
  }
  const reportLabel = isBg ? "Докладвай обявата" : "Report listing";

  if (!(contactHref && !action.disabled)) {
    return (
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-4 lg:hidden">
        <output className="flex min-h-10 flex-1 items-center gap-2 rounded-lg bg-secondary px-3 text-muted-foreground text-sm">
          <MessageCircle aria-hidden="true" className="size-4 shrink-0" />
          {actionLabel}
        </output>
        {reportHref ? (
          <Button
            asChild
            className="size-10 shrink-0 rounded-lg"
            size="icon"
            variant="secondary"
          >
            <Link
              aria-label={reportLabel}
              href={reportHref}
              title={reportLabel}
            >
              <Flag aria-hidden="true" className="size-4" />
              <span className="sr-only">{reportLabel}</span>
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        directPhone
          ? "pointer-events-none fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 lg:hidden"
          : "pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-card px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
      }
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-center gap-2">
        <Button
          asChild
          className={
            directPhone
              ? "size-13 shrink-0 rounded-full bg-zinc-950 p-0 text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] hover:bg-black active:scale-95"
              : "h-12 flex-1 gap-2 rounded-xl bg-zinc-950 font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] transition-[background-color,transform,box-shadow] hover:bg-black active:scale-[0.99] active:bg-black"
          }
        >
          <Link aria-label={actionLabel} href={contactHref} title={actionLabel}>
            {directPhone ? (
              <DealerMobileHeaderIcon icon={Phone} kind="phone" />
            ) : (
              <MessageCircle aria-hidden="true" className="size-4" />
            )}
            <span className={directPhone ? "sr-only" : undefined}>
              {actionLabel}
            </span>
          </Link>
        </Button>
        {reportHref ? (
          <Button
            asChild
            className="size-12 shrink-0 rounded-xl bg-zinc-100 shadow-none"
            size="icon"
            variant="secondary"
          >
            <Link
              aria-label={reportLabel}
              href={reportHref}
              title={reportLabel}
            >
              <Flag aria-hidden="true" className="size-4" />
              <span className="sr-only">{reportLabel}</span>
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
};
